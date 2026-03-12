"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Canvas, FabricObject, Textbox, Rect, Circle, Line, FabricImage, Gradient, Shadow, loadSVGFromString, util, ActiveSelection, Group, Control } from "fabric";
import { Copy, Trash2, Layers, Ungroup as UngroupIcon } from "lucide-react";
import { loadGoogleFont } from "./GoogleFontPicker";

// Extend FabricObject for custom properties
declare module 'fabric' {
  interface FabricObject {
    isBackgroundRect?: boolean;
    _isSvgIcon?: boolean;
    radiusTL?: number;
    radiusTR?: number;
    radiusBR?: number;
    radiusBL?: number;
  }
}

// Alignment guide type
interface AlignmentGuide {
  position: number;
  orientation: 'horizontal' | 'vertical';
}
import { cn } from "@/lib/utils";

// CRITICAL: Fabric.js v7 changed default originX/originY from 'left'/'top' to 'center'/'center'.
// We must override ownDefaults BEFORE creating any Fabric objects. In v7, the constructor does:
//   Object.assign(this, FabricObject.ownDefaults);
//   this.setOptions(options);
// So modifying ownDefaults directly is the only way to change defaults globally.
// Using prototype.set() does NOT work because ownDefaults overwrite prototype values.
FabricObject.ownDefaults.originX = 'left';
FabricObject.ownDefaults.originY = 'top';
FabricObject.ownDefaults.cornerColor = '#0891b2';
FabricObject.ownDefaults.cornerStyle = 'circle';
FabricObject.ownDefaults.cornerSize = 8;
FabricObject.ownDefaults.transparentCorners = false;
FabricObject.ownDefaults.borderColor = '#06b6d4';
FabricObject.ownDefaults.borderScaleFactor = 1;

// Custom rotate icon renderer using lucide rotate-ccw SVG paths
const renderRotateIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, _styleOverride: unknown, fabricObject: FabricObject) => {
  const size = 24;
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(util.degreesToRadians(fabricObject.angle || 0));

  // White circle background
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#0891b2';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw lucide rotate-ccw icon (viewBox 0 0 24 24, scaled to fit)
  const iconScale = 14 / 24;
  ctx.scale(iconScale, iconScale);
  ctx.translate(-12, -12); // Center the 24x24 coordinate system
  ctx.strokeStyle = '#0891b2';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Path 1: circle arc + arrow stem
  const p1 = new Path2D('M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8');
  ctx.stroke(p1);
  // Path 2: arrowhead
  const p2 = new Path2D('M3 3v5h5');
  ctx.stroke(p2);

  ctx.restore();
};

// Fabric v7: each instance gets FRESH controls from createControls() factory.
// Modifying prototype.controls does nothing. Override the static createControls method instead.
const customizeMtrControl = (controls: Record<string, Control>) => {
  if (controls.mtr) {
    controls.mtr.y = 0.5;        // bottom edge (default is -0.5 = top)
    controls.mtr.offsetY = 25;   // 25px below the bottom edge
    controls.mtr.offsetX = 0;
    controls.mtr.render = renderRotateIcon;
    controls.mtr.sizeX = 24;
    controls.mtr.sizeY = 24;
    controls.mtr.cursorStyleHandler = () => 'grab';
  }
};

// Override for all FabricObject subclasses (Rect, Circle, Line, Group, FabricImage)
const origCreateControls = FabricObject.createControls;
FabricObject.createControls = function() {
  const result = origCreateControls.call(this);
  if (result.controls) customizeMtrControl(result.controls);
  return result;
};

// Textbox has its own createControls (adds resize handles) - override it too
const origTextboxCreateControls = Textbox.createControls;
Textbox.createControls = function() {
  const result = origTextboxCreateControls.call(this);
  if (result.controls) customizeMtrControl(result.controls);
  return result;
};

// Override Rect._render to support per-corner border radius (radiusTL/TR/BR/BL)
const kRect = 1 - 0.5522847498; // bezier constant for circular arc approximation
const origRectRender = Rect.prototype._render;
Rect.prototype._render = function(ctx: CanvasRenderingContext2D) {
  const tl = this.radiusTL;
  const tr = this.radiusTR;
  const br = this.radiusBR;
  const bl = this.radiusBL;

  // If any per-corner radius is set, use custom rendering
  if (tl != null || tr != null || br != null || bl != null) {
    const { width: w, height: h } = this;
    const x = -w / 2;
    const y = -h / 2;

    const rtl = Math.min(Math.max(tl ?? 0, 0), w / 2, h / 2);
    const rtr = Math.min(Math.max(tr ?? 0, 0), w / 2, h / 2);
    const rbr = Math.min(Math.max(br ?? 0, 0), w / 2, h / 2);
    const rbl = Math.min(Math.max(bl ?? 0, 0), w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + rtl, y);
    ctx.lineTo(x + w - rtr, y);
    if (rtr > 0) ctx.bezierCurveTo(x + w - kRect * rtr, y, x + w, y + kRect * rtr, x + w, y + rtr);
    ctx.lineTo(x + w, y + h - rbr);
    if (rbr > 0) ctx.bezierCurveTo(x + w, y + h - kRect * rbr, x + w - kRect * rbr, y + h, x + w - rbr, y + h);
    ctx.lineTo(x + rbl, y + h);
    if (rbl > 0) ctx.bezierCurveTo(x + kRect * rbl, y + h, x, y + h - kRect * rbl, x, y + h - rbl);
    ctx.lineTo(x, y + rtl);
    if (rtl > 0) ctx.bezierCurveTo(x, y + kRect * rtl, x + kRect * rtl, y, x + rtl, y);
    ctx.closePath();
    this._renderPaintInOrder(ctx);
  } else {
    origRectRender.call(this, ctx);
  }
};

// Helper to parse CSS gradient and convert to Fabric gradient
function parseGradientToFabric(gradientString: string): { colorStops: Record<string, string>; angle: number } | null {
  // Parse "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  const match = gradientString.match(/linear-gradient\((\d+)deg,\s*([^)]+)\)/);
  if (!match) return null;

  const angle = parseInt(match[1], 10);
  const colorsStr = match[2];

  // Parse color stops
  const colorStops: Record<string, string> = {};
  const colorRegex = /(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgb[a]?\([^)]+\))\s*(\d+)?%?/g;
  let colorMatch;
  let index = 0;
  while ((colorMatch = colorRegex.exec(colorsStr)) !== null) {
    const color = colorMatch[1];
    const position = colorMatch[2] ? parseInt(colorMatch[2], 10) / 100 : index;
    colorStops[position.toString()] = color;
    index++;
  }

  return { colorStops, angle };
}

// Helper to proxy R2 URLs in canvas JSON for CORS
function proxyR2UrlsInJson(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.objects && Array.isArray(parsed.objects)) {
      parsed.objects = parsed.objects.map((obj: Record<string, unknown>) => {
        if (obj.type === 'image') {
          const originalSrc = obj.originalSrc as string | undefined;
          const src = obj.src as string | undefined;
          const urlToCheck = originalSrc || src;

          if (urlToCheck && (urlToCheck.includes('r2.dev') || urlToCheck.includes('r2.cloudflarestorage.com'))) {
            obj.originalSrc = urlToCheck;
            obj.src = `/api/media/proxy?url=${encodeURIComponent(urlToCheck)}`;
          }
        }
        return obj;
      });
    }
    return JSON.stringify(parsed);
  } catch {
    return jsonString;
  }
}

// Canvas dimensions for LinkedIn carousel (4:5 aspect ratio)
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1350;

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  fabricObject: FabricObject;
}

export interface SlideData {
  id: string;
  elements: CanvasElement[];
  background: {
    type: 'solid' | 'gradient' | 'image';
    value: string;
  };
  thumbnail?: string;
}

export interface ShapeOptions {
  shapeType: 'rect' | 'circle' | 'line';
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rx?: number;
  ry?: number;
  // For lines
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface CanvasWorkspaceRef {
  addText: (options?: Partial<TextOptions>, batch?: boolean) => void;
  addShape: (shapeType: 'rect' | 'circle' | 'line') => void;
  addShapeWithOptions: (options: ShapeOptions, batch?: boolean) => void;
  addImage: (url: string) => Promise<void>;
  addSvgIcon: (svgString: string) => Promise<void>;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  setBackground: (type: 'solid' | 'gradient' | 'image', value: string) => void;
  exportToDataURL: () => string;
  exportToJSON: () => string;
  loadFromJSON: (json: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  getCanvas: () => Canvas | null;
  clearCanvas: () => void;
  finishBatch: () => void;
}

interface TextOptions {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fill?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify' | 'justify-left' | 'justify-center' | 'justify-right';
  left?: number;
  top?: number;
  width?: number;
  opacity?: number;
}

interface CanvasWorkspaceProps {
  onSelectionChange?: (element: FabricObject | null) => void;
  onCanvasChange?: () => void;
  onElementMoving?: (element: FabricObject) => void;
  onElementDrop?: (type: string, data: Record<string, unknown>, x: number, y: number) => void;
  zoom?: number;
  className?: string;
}

export const CanvasWorkspace = forwardRef<CanvasWorkspaceRef, CanvasWorkspaceProps>(
  ({ onSelectionChange, onCanvasChange, onElementMoving, onElementDrop, zoom = 0.4, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const guideLinesRef = useRef<AlignmentGuide[]>([]);
    const hoveredObjectRef = useRef<FabricObject | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [floatingBtnPos, setFloatingBtnPos] = useState<{ x: number; y: number } | null>(null);

    // Helper to update floating buttons position
    const updateFloatingPos = useCallback(() => {
      if (!fabricRef.current) {
        setFloatingBtnPos(null);
        return;
      }
      const active = fabricRef.current.getActiveObject();
      if (!active) {
        setFloatingBtnPos(null);
        return;
      }
      const bound = active.getBoundingRect();
      const z = fabricRef.current.getZoom();
      setFloatingBtnPos({
        x: (bound.left + bound.width / 2) * z,
        y: bound.top * z - 8,
      });
    }, []);

    // Store callbacks in refs to avoid re-initializing canvas when they change
    const onSelectionChangeRef = useRef(onSelectionChange);
    const onCanvasChangeRef = useRef(onCanvasChange);
    const onElementMovingRef = useRef(onElementMoving);

    // Keep refs up to date
    useEffect(() => {
      onSelectionChangeRef.current = onSelectionChange;
      onCanvasChangeRef.current = onCanvasChange;
      onElementMovingRef.current = onElementMoving;
    }, [onSelectionChange, onCanvasChange, onElementMoving]);

    // Undo/Redo history
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);
    const isUndoRedoRef = useRef(false);
    const lastSavedStateRef = useRef<string>('');

    // Save state to history with debounce to prevent duplicate states
    const saveHistory = useCallback(() => {
      if (!fabricRef.current || isUndoRedoRef.current) return;

      // Include custom properties in history serialization
      const json = JSON.stringify(fabricRef.current.toObject(['isBackgroundRect', 'originalSrc', 'radiusTL', 'radiusTR', 'radiusBR', 'radiusBL']));

      // Don't save if it's the same as the last saved state
      if (json === lastSavedStateRef.current) return;
      lastSavedStateRef.current = json;

      // Remove any redo states
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);

      // Add new state
      historyRef.current.push(json);
      historyIndexRef.current = historyRef.current.length - 1;

      // Limit history size
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
        historyIndexRef.current--;
      }
    }, []);

    // Initialize Fabric.js canvas
    useEffect(() => {
      if (!canvasRef.current || fabricRef.current) return;

      const canvas = new Canvas(canvasRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
        controlsAboveOverlay: true,
        // CMD+click (Mac) and Shift+click (Windows/Mac) for multi-select
        selectionKey: ['shiftKey', 'metaKey'],
      });

      // Preload Inter font for canvas text elements
      loadGoogleFont('Inter').catch(() => {});

      // Smart alignment guides + snapping
      canvas.on('object:moving', (e) => {
        const obj = e.target;
        if (!obj) return;

        const SNAP_THRESHOLD = 5;
        const guides: AlignmentGuide[] = [];

        const objBound = obj.getBoundingRect();
        const objLeft = objBound.left;
        const objTop = objBound.top;
        const objRight = objBound.left + objBound.width;
        const objBottom = objBound.top + objBound.height;
        const objCenterX = objBound.left + objBound.width / 2;
        const objCenterY = objBound.top + objBound.height / 2;

        // Snap targets: canvas edges + center + all other objects' edges/centers
        const snapTargetsX: number[] = [0, CANVAS_WIDTH / 2, CANVAS_WIDTH];
        const snapTargetsY: number[] = [0, CANVAS_HEIGHT / 2, CANVAS_HEIGHT];

        canvas.getObjects().filter(o =>
          o !== obj && o.selectable !== false
        ).forEach(other => {
          const b = other.getBoundingRect();
          snapTargetsX.push(b.left, b.left + b.width / 2, b.left + b.width);
          snapTargetsY.push(b.top, b.top + b.height / 2, b.top + b.height);
        });

        // Snap X axis
        const edgesX = [
          { value: objLeft, type: 'left' as const },
          { value: objCenterX, type: 'center' as const },
          { value: objRight, type: 'right' as const },
        ];
        let snappedX = false;
        for (const edge of edgesX) {
          if (snappedX) break;
          for (const target of snapTargetsX) {
            if (Math.abs(edge.value - target) < SNAP_THRESHOLD) {
              const offset = obj.left! - objBound.left;
              if (edge.type === 'left') obj.set('left', target + offset);
              else if (edge.type === 'center') obj.set('left', target - objBound.width / 2 + offset);
              else obj.set('left', target - objBound.width + offset);
              guides.push({ position: target, orientation: 'vertical' });
              snappedX = true;
              break;
            }
          }
        }

        // Snap Y axis
        const edgesY = [
          { value: objTop, type: 'top' as const },
          { value: objCenterY, type: 'center' as const },
          { value: objBottom, type: 'bottom' as const },
        ];
        let snappedY = false;
        for (const edge of edgesY) {
          if (snappedY) break;
          for (const target of snapTargetsY) {
            if (Math.abs(edge.value - target) < SNAP_THRESHOLD) {
              const offset = obj.top! - objBound.top;
              if (edge.type === 'top') obj.set('top', target + offset);
              else if (edge.type === 'center') obj.set('top', target - objBound.height / 2 + offset);
              else obj.set('top', target - objBound.height + offset);
              guides.push({ position: target, orientation: 'horizontal' });
              snappedY = true;
              break;
            }
          }
        }

        guideLinesRef.current = guides;
        canvas.requestRenderAll();
        onElementMovingRef.current?.(obj);
        updateFloatingPos();
      });

      // Draw alignment guides + hover border overlay
      canvas.on('after:render', () => {
        const ctx = canvas.getContext();
        const z = canvas.getZoom();

        // Draw hover border on non-selected hovered element
        const hovered = hoveredObjectRef.current;
        if (hovered && hovered !== canvas.getActiveObject()) {
          const bound = hovered.getBoundingRect();
          ctx.save();
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(bound.left * z, bound.top * z, bound.width * z, bound.height * z);
          ctx.restore();
        }

        // Draw alignment guide lines
        if (guideLinesRef.current.length === 0) return;
        ctx.save();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        guideLinesRef.current.forEach(guide => {
          ctx.beginPath();
          if (guide.orientation === 'vertical') {
            ctx.moveTo(guide.position * z, 0);
            ctx.lineTo(guide.position * z, CANVAS_HEIGHT * z);
          } else {
            ctx.moveTo(0, guide.position * z);
            ctx.lineTo(CANVAS_WIDTH * z, guide.position * z);
          }
          ctx.stroke();
        });
        ctx.restore();
      });

      // Clear guides on mouse up
      canvas.on('mouse:up', () => {
        if (guideLinesRef.current.length > 0) {
          guideLinesRef.current = [];
          canvas.requestRenderAll();
        }
      });

      // Also track scaling for real-time size updates
      canvas.on('object:scaling', (e) => {
        const obj = e.target;
        if (obj) {
          onElementMovingRef.current?.(obj);
        }
      });

      // Track rotation for real-time angle updates
      canvas.on('object:rotating', (e) => {
        const obj = e.target;
        if (obj) {
          onElementMovingRef.current?.(obj);
        }
      });

      // Hover border on elements (tracked in ref, drawn in after:render)
      canvas.on('mouse:over', (e) => {
        const target = e.target;
        if (!target || !target.selectable || target.isBackgroundRect) return;
        const active = canvas.getActiveObject();
        if (active === target) return;
        if (active instanceof ActiveSelection && active.getObjects().includes(target)) return;
        hoveredObjectRef.current = target;
        canvas.requestRenderAll();
      });

      canvas.on('mouse:out', (e) => {
        if (hoveredObjectRef.current === e.target) {
          hoveredObjectRef.current = null;
          canvas.requestRenderAll();
        }
      });

      // Double-click to enter group interactive mode (edit children inside group)
      canvas.on('mouse:dblclick', (e) => {
        const target = e.target;
        if (target instanceof Group && !target._isSvgIcon) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any).interactive = true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any).subTargetCheck = true;
          canvas.requestRenderAll();
        }
      });

      // Selection events - pass ActiveSelection for multi-select + track floating buttons
      canvas.on('selection:created', () => {
        onSelectionChangeRef.current?.(canvas.getActiveObject() || null);
        updateFloatingPos();
      });

      canvas.on('selection:updated', () => {
        onSelectionChangeRef.current?.(canvas.getActiveObject() || null);
        updateFloatingPos();
      });

      canvas.on('selection:cleared', () => {
        onSelectionChangeRef.current?.(null);
        setFloatingBtnPos(null);
        // Exit interactive mode on all groups
        canvas.getObjects().forEach(obj => {
          if (obj instanceof Group) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const g = obj as any;
            if (g.interactive) {
              g.interactive = false;
              g.subTargetCheck = false;
            }
          }
        });
      });

      // Track changes
      canvas.on('object:modified', () => {
        guideLinesRef.current = [];
        saveHistory();
        onCanvasChangeRef.current?.();
        updateFloatingPos();
      });

      canvas.on('object:added', () => {
        saveHistory();
        onCanvasChangeRef.current?.();
      });

      canvas.on('object:removed', () => {
        saveHistory();
        onCanvasChangeRef.current?.();
      });

      // Right-click context menu via Fabric's own event
      // (React onContextMenu on container doesn't work because Fabric's stopContextMenu
      // calls stopPropagation on the canvas element, blocking event bubbling)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.on('contextmenu', (opt: any) => {
        const target = opt.target as FabricObject | undefined;
        const e = opt.e as MouseEvent;
        if (target && target.selectable && !target.isBackgroundRect) {
          const active = canvas.getActiveObject();
          if (active !== target) {
            if (active instanceof ActiveSelection && active.getObjects().includes(target)) {
              // Already part of multi-selection, keep it
            } else {
              canvas.setActiveObject(target);
              canvas.requestRenderAll();
            }
          }
          setContextMenu({ x: e.clientX, y: e.clientY });
        } else {
          setContextMenu(null);
        }
      });

      fabricRef.current = canvas;
      setIsReady(true);

      // Initial history state
      saveHistory();

      return () => {
        canvas.dispose();
        fabricRef.current = null;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveHistory]);

    // Handle zoom using Fabric's native zoom + dimension scaling
    useEffect(() => {
      if (!fabricRef.current) return;
      fabricRef.current.setZoom(zoom);
      fabricRef.current.setDimensions({
        width: CANVAS_WIDTH * zoom,
        height: CANVAS_HEIGHT * zoom,
      });
    }, [zoom]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addText: (options: Partial<TextOptions> = {}, batch = false) => {
        if (!fabricRef.current) return;

        const fontFamily = options.fontFamily ?? 'Inter';
        const fontSize = options.fontSize ?? 48;
        // Scale textbox width with font size to prevent overflow
        const defaultWidth = options.width ?? Math.min(Math.max(fontSize * 12, 400), CANVAS_WIDTH - 80);
        const text = new Textbox(options.text || 'Add your text here', {
          left: options.left ?? Math.round(CANVAS_WIDTH / 2 - defaultWidth / 2),
          top: options.top ?? CANVAS_HEIGHT / 2 - 30,
          width: defaultWidth,
          fontSize,
          fontFamily,
          fontWeight: options.fontWeight ?? 'normal',
          fill: options.fill ?? '#000000',
          textAlign: options.textAlign ?? 'center',
          opacity: options.opacity ?? 1,
          editable: true,
        });

        fabricRef.current.add(text);

        // Ensure font is loaded, then re-render with correct font
        loadGoogleFont(fontFamily).then(() => {
          if (fabricRef.current) {
            text.set('dirty', true);
            text.initDimensions();
            fabricRef.current.requestRenderAll();
          }
        }).catch(() => {});

        if (!batch) {
          fabricRef.current.setActiveObject(text);
          fabricRef.current.renderAll();
        }
      },

      addShape: (shapeType: 'rect' | 'circle' | 'line') => {
        if (!fabricRef.current) return;

        let shape: FabricObject;

        switch (shapeType) {
          case 'rect':
            shape = new Rect({
              left: CANVAS_WIDTH / 2 - 100,
              top: CANVAS_HEIGHT / 2 - 75,
              width: 200,
              height: 150,
              fill: '#0891b2',
              rx: 8,
              ry: 8,
            });
            break;
          case 'circle':
            shape = new Circle({
              left: CANVAS_WIDTH / 2 - 75,
              top: CANVAS_HEIGHT / 2 - 75,
              radius: 75,
              fill: '#0891b2',
            });
            break;
          case 'line':
            shape = new Line([0, 0, 300, 0], {
              left: CANVAS_WIDTH / 2 - 150,
              top: CANVAS_HEIGHT / 2,
              stroke: '#0891b2',
              strokeWidth: 4,
            });
            break;
          default:
            return;
        }

        fabricRef.current.add(shape);
        fabricRef.current.setActiveObject(shape);
        fabricRef.current.renderAll();
      },

      addShapeWithOptions: (options: ShapeOptions, batch = false) => {
        if (!fabricRef.current) return;

        let shape: FabricObject;

        switch (options.shapeType) {
          case 'rect':
            shape = new Rect({
              left: options.left ?? CANVAS_WIDTH / 2 - 100,
              top: options.top ?? CANVAS_HEIGHT / 2 - 75,
              width: options.width ?? 200,
              height: options.height ?? 150,
              fill: options.fill ?? '#0891b2',
              stroke: options.stroke,
              strokeWidth: options.strokeWidth,
              opacity: options.opacity ?? 1,
              rx: options.rx ?? 0,
              ry: options.ry ?? 0,
            });
            break;
          case 'circle':
            shape = new Circle({
              left: options.left ?? CANVAS_WIDTH / 2 - 75,
              top: options.top ?? CANVAS_HEIGHT / 2 - 75,
              radius: (options.width ?? 150) / 2,
              fill: options.fill ?? '#0891b2',
              stroke: options.stroke,
              strokeWidth: options.strokeWidth,
              opacity: options.opacity ?? 1,
            });
            break;
          case 'line':
            shape = new Line([
              options.x1 ?? 0,
              options.y1 ?? 0,
              options.x2 ?? 300,
              options.y2 ?? 0
            ], {
              left: options.left ?? CANVAS_WIDTH / 2 - 150,
              top: options.top ?? CANVAS_HEIGHT / 2,
              stroke: options.stroke ?? options.fill ?? '#0891b2',
              strokeWidth: options.strokeWidth ?? 4,
              opacity: options.opacity ?? 1,
            });
            break;
          default:
            return;
        }

        fabricRef.current.add(shape);
        if (!batch) {
          fabricRef.current.renderAll();
        }
      },

      addImage: async (url: string) => {
        if (!fabricRef.current) return;

        try {
          // Check if URL is from R2 and needs proxying to avoid CORS issues
          let imageUrl = url;
          if (url.includes('r2.dev') || url.includes('r2.cloudflarestorage.com')) {
            imageUrl = `/api/media/proxy?url=${encodeURIComponent(url)}`;
          }

          const img = await FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });

          // Store the original URL in custom data for serialization
          // This ensures we save the R2 URL, not the proxy URL
          (img as FabricObject & { originalSrc?: string }).originalSrc = url;

          // Scale images to fit the canvas nicely
          const maxWidth = CANVAS_WIDTH * 0.8;
          const maxHeight = CANVAS_HEIGHT * 0.5;
          const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!, 1);

          img.set({
            left: CANVAS_WIDTH / 2 - (img.width! * scale) / 2,
            top: CANVAS_HEIGHT / 2 - (img.height! * scale) / 2,
            scaleX: scale,
            scaleY: scale,
          });

          fabricRef.current.add(img);
          fabricRef.current.setActiveObject(img);
          fabricRef.current.renderAll();
        } catch (error) {
          console.error('Failed to load image:', error);
          throw error; // Re-throw so caller can show error message
        }
      },

      addSvgIcon: async (svgString: string) => {
        if (!fabricRef.current) return;

        try {
          const { objects } = await loadSVGFromString(svgString);
          const svgGroup = util.groupSVGElements(objects as FabricObject[]);

          // Set initial size for icons (120px)
          const targetSize = 120;
          const currentSize = Math.max(svgGroup.width || 24, svgGroup.height || 24);
          const scale = targetSize / currentSize;

          svgGroup.set({
            left: CANVAS_WIDTH / 2 - (currentSize * scale) / 2,
            top: CANVAS_HEIGHT / 2 - (currentSize * scale) / 2,
            scaleX: scale,
            scaleY: scale,
          });
          // Mark as SVG icon so it's not confused with user-created groups
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (svgGroup as any)._isSvgIcon = true;

          fabricRef.current.add(svgGroup);
          fabricRef.current.setActiveObject(svgGroup);
          fabricRef.current.renderAll();
        } catch (error) {
          console.error('Failed to load SVG icon:', error);
        }
      },

      deleteSelected: () => {
        if (!fabricRef.current) return;
        const activeObjects = fabricRef.current.getActiveObjects();
        activeObjects.forEach((obj) => {
          fabricRef.current!.remove(obj);
        });
        fabricRef.current.discardActiveObject();
        fabricRef.current.renderAll();
      },

      duplicateSelected: () => {
        if (!fabricRef.current) return;
        const activeObject = fabricRef.current.getActiveObject();
        if (!activeObject) return;

        activeObject.clone().then((cloned: FabricObject) => {
          cloned.set({
            left: (activeObject.left || 0) + 20,
            top: (activeObject.top || 0) + 20,
          });
          fabricRef.current!.add(cloned);
          fabricRef.current!.setActiveObject(cloned);
          fabricRef.current!.renderAll();
        });
      },

      groupSelected: () => {
        if (!fabricRef.current) return;
        const activeObject = fabricRef.current.getActiveObject();
        if (!activeObject || !(activeObject instanceof ActiveSelection)) return;
        const objects = activeObject.getObjects();
        if (objects.length < 2) return;

        // Remove from canvas
        fabricRef.current.discardActiveObject();
        objects.forEach(obj => fabricRef.current!.remove(obj));

        // Create group
        const group = new Group(objects);
        fabricRef.current.add(group);
        fabricRef.current.setActiveObject(group);
        fabricRef.current.renderAll();
        saveHistory();
        onCanvasChangeRef.current?.();
      },

      ungroupSelected: () => {
        if (!fabricRef.current) return;
        const activeObject = fabricRef.current.getActiveObject();
        if (!activeObject || !(activeObject instanceof Group)) return;

        const canvas = fabricRef.current;
        const objects = [...activeObject.getObjects()];

        canvas.discardActiveObject();
        // removeAll() properly converts child coordinates to absolute canvas coords
        // via Fabric's _exitGroup -> applyTransformToObject -> setPositionByOrigin
        activeObject.removeAll();
        canvas.remove(activeObject);

        // Add children back (they already have correct absolute positions)
        objects.forEach(obj => {
          obj.setCoords();
          canvas.add(obj);
        });

        if (objects.length > 0) {
          const selection = new ActiveSelection(objects, { canvas });
          canvas.setActiveObject(selection);
        }
        canvas.renderAll();
        saveHistory();
        onCanvasChangeRef.current?.();
      },

      bringForward: () => {
        if (!fabricRef.current) return;
        const activeObject = fabricRef.current.getActiveObject();
        if (activeObject) {
          fabricRef.current.bringObjectForward(activeObject);
          fabricRef.current.renderAll();
        }
      },

      sendBackward: () => {
        if (!fabricRef.current) return;
        const activeObject = fabricRef.current.getActiveObject();
        if (activeObject) {
          fabricRef.current.sendObjectBackwards(activeObject);
          fabricRef.current.renderAll();
        }
      },

      setBackground: (type: 'solid' | 'gradient' | 'image', value: string) => {
        if (!fabricRef.current) return;

        // Remove ALL existing background rects (gradient backgrounds)
        // Use multiple detection methods to catch all background rects
        const objects = fabricRef.current.getObjects();
        const bgRects = objects.filter(obj => {
          if (!(obj instanceof Rect)) return false;

          // Method 1: Check custom property (most reliable - survives JSON serialization)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((obj as any).isBackgroundRect === true) return true;

          // Method 2: Check if it has a gradient fill and is non-selectable (definite background rect)
          const hasGradientFill = obj.fill && typeof obj.fill === 'object' && 'colorStops' in obj.fill;
          if (hasGradientFill && !obj.selectable) return true;

          // Method 3: Check by position and size (approximately full canvas, non-selectable)
          const isNonSelectable = !obj.selectable;
          const isNearOrigin = Math.abs(obj.left || 0) < 5 && Math.abs(obj.top || 0) < 5;
          const isNearFullSize = Math.abs((obj.width || 0) - CANVAS_WIDTH) < 5 && Math.abs((obj.height || 0) - CANVAS_HEIGHT) < 5;

          return isNonSelectable && isNearOrigin && isNearFullSize;
        });
        bgRects.forEach(rect => fabricRef.current!.remove(rect));

        // Clear any existing background image when setting color/gradient
        if (type !== 'image') {
          fabricRef.current.backgroundImage = undefined;
        }

        if (type === 'solid') {
          fabricRef.current.backgroundColor = value;
        } else if (type === 'gradient') {
          // Parse CSS gradient and create a Fabric.js gradient
          const parsed = parseGradientToFabric(value);
          if (parsed) {
            // Convert angle to coordinates for gradient direction
            const angleRad = (parsed.angle - 90) * Math.PI / 180;
            const coords = {
              x1: 0.5 - Math.cos(angleRad) * 0.5,
              y1: 0.5 - Math.sin(angleRad) * 0.5,
              x2: 0.5 + Math.cos(angleRad) * 0.5,
              y2: 0.5 + Math.sin(angleRad) * 0.5,
            };

            // Create gradient rectangle as background - must cover entire canvas
            // Use explicit origin settings to ensure exact positioning
            const gradientRect = new Rect({
              left: 0,
              top: 0,
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              selectable: false,
              evented: false,
              excludeFromExport: false,
              strokeWidth: 0,
              originX: 'left',
              originY: 'top',
            });
            // Add custom property to identify this as a background rect (survives JSON serialization)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (gradientRect as any).isBackgroundRect = true;

            // Create gradient with coordinates relative to the rect
            const gradient = new Gradient({
              type: 'linear',
              coords: {
                x1: coords.x1 * CANVAS_WIDTH,
                y1: coords.y1 * CANVAS_HEIGHT,
                x2: coords.x2 * CANVAS_WIDTH,
                y2: coords.y2 * CANVAS_HEIGHT,
              },
              colorStops: Object.entries(parsed.colorStops).map(([offset, color]) => ({
                offset: parseFloat(offset),
                color,
              })),
            });

            gradientRect.set('fill', gradient);

            // Clear canvas background color and add gradient rect at position 0
            fabricRef.current.backgroundColor = '';
            fabricRef.current.insertAt(0, gradientRect);
          } else {
            // If parsing fails, just use first color from gradient string as solid
            const colorMatch = value.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/);
            if (colorMatch) {
              fabricRef.current.backgroundColor = colorMatch[0];
            }
          }
        } else if (type === 'image') {
          FabricImage.fromURL(value, { crossOrigin: 'anonymous' }).then((img) => {
            const scale = Math.max(
              CANVAS_WIDTH / img.width!,
              CANVAS_HEIGHT / img.height!
            );
            img.set({
              scaleX: scale,
              scaleY: scale,
              left: 0,
              top: 0,
              originX: 'left',
              originY: 'top',
              selectable: false,
              evented: false,
            });
            fabricRef.current!.backgroundImage = img;
            fabricRef.current!.renderAll();
          });
        }
        fabricRef.current.renderAll();
        saveHistory();
        onCanvasChangeRef.current?.();
      },

      exportToDataURL: () => {
        if (!fabricRef.current) return '';

        // Temporarily reset zoom for full-resolution export
        const currentZoom = fabricRef.current.getZoom();
        fabricRef.current.setZoom(1);
        fabricRef.current.setDimensions({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

        const dataURL = fabricRef.current.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1,
        });

        // Restore zoom
        fabricRef.current.setZoom(currentZoom);
        fabricRef.current.setDimensions({
          width: CANVAS_WIDTH * currentZoom,
          height: CANVAS_HEIGHT * currentZoom,
        });

        return dataURL;
      },

      exportToJSON: () => {
        if (!fabricRef.current) return '{}';
        // Include custom properties like isBackgroundRect and originalSrc in serialization
        const json = fabricRef.current.toObject(['isBackgroundRect', 'originalSrc', 'radiusTL', 'radiusTR', 'radiusBR', 'radiusBL']);

        // Post-process to restore original R2 URLs instead of proxy URLs
        if (json.objects && Array.isArray(json.objects)) {
          json.objects = json.objects.map((obj: Record<string, unknown>) => {
            if (obj.type === 'image' && obj.src && typeof obj.src === 'string') {
              const src = obj.src as string;
              // If it's a proxy URL, try to restore original
              if (src.includes('/api/media/proxy?url=')) {
                try {
                  const urlParam = new URL(src, 'https://linkedgrow.ai').searchParams.get('url');
                  if (urlParam) {
                    obj.src = urlParam;
                  }
                } catch {
                  // Keep proxy URL if parsing fails
                }
              }
              // If we stored originalSrc, use that
              if (obj.originalSrc && typeof obj.originalSrc === 'string') {
                obj.src = obj.originalSrc;
                delete obj.originalSrc;
              }
            }
            return obj;
          });
        }

        return JSON.stringify(json);
      },

      loadFromJSON: async (json: string) => {
        if (!fabricRef.current || !json) return;

        try {
          const parsed = JSON.parse(json);

          // Pre-process objects to proxy R2 image URLs for CORS
          if (parsed.objects && Array.isArray(parsed.objects)) {
            parsed.objects = parsed.objects.map((obj: Record<string, unknown>) => {
              if (obj.type === 'image') {
                // Check originalSrc first (stored during export), then src
                const originalSrc = obj.originalSrc as string | undefined;
                const src = obj.src as string | undefined;
                const urlToCheck = originalSrc || src;

                if (urlToCheck && (urlToCheck.includes('r2.dev') || urlToCheck.includes('r2.cloudflarestorage.com'))) {
                  // Store original R2 URL and use proxy URL for loading
                  obj.originalSrc = urlToCheck;
                  obj.src = `/api/media/proxy?url=${encodeURIComponent(urlToCheck)}`;
                }
              }
              return obj;
            });
          }

          // Save current zoom level
          const currentZoom = fabricRef.current.getZoom();

          // Clear and load new state
          fabricRef.current.clear();
          await fabricRef.current.loadFromJSON(parsed);

          // Re-apply zoom (clear/loadFromJSON may reset dimensions)
          fabricRef.current.setZoom(currentZoom);
          fabricRef.current.setDimensions({
            width: CANVAS_WIDTH * currentZoom,
            height: CANVAS_HEIGHT * currentZoom,
          });

          fabricRef.current.renderAll();
          onCanvasChangeRef.current?.();
        } catch (error) {
          console.error('Failed to load canvas from JSON:', error);
        }
      },

      undo: () => {
        if (!fabricRef.current || historyIndexRef.current <= 0) return;

        isUndoRedoRef.current = true;
        historyIndexRef.current--;
        const json = historyRef.current[historyIndexRef.current];
        lastSavedStateRef.current = json;

        const currentZoom = fabricRef.current.getZoom();
        const proxiedJson = proxyR2UrlsInJson(json);
        fabricRef.current.loadFromJSON(JSON.parse(proxiedJson)).then(() => {
          fabricRef.current!.setZoom(currentZoom);
          fabricRef.current!.setDimensions({
            width: CANVAS_WIDTH * currentZoom,
            height: CANVAS_HEIGHT * currentZoom,
          });
          fabricRef.current!.renderAll();
          setTimeout(() => {
            isUndoRedoRef.current = false;
          }, 100);
          onCanvasChangeRef.current?.();
        });
      },

      redo: () => {
        if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;

        isUndoRedoRef.current = true;
        historyIndexRef.current++;
        const json = historyRef.current[historyIndexRef.current];
        lastSavedStateRef.current = json;

        const currentZoom = fabricRef.current.getZoom();
        const proxiedJson = proxyR2UrlsInJson(json);
        fabricRef.current.loadFromJSON(JSON.parse(proxiedJson)).then(() => {
          fabricRef.current!.setZoom(currentZoom);
          fabricRef.current!.setDimensions({
            width: CANVAS_WIDTH * currentZoom,
            height: CANVAS_HEIGHT * currentZoom,
          });
          fabricRef.current!.renderAll();
          setTimeout(() => {
            isUndoRedoRef.current = false;
          }, 100);
          onCanvasChangeRef.current?.();
        });
      },

      getCanvas: () => fabricRef.current,

      clearCanvas: () => {
        if (!fabricRef.current) return;
        const currentZoom = fabricRef.current.getZoom();
        fabricRef.current.clear();
        fabricRef.current.backgroundColor = '#ffffff';
        // Re-apply zoom after clear
        fabricRef.current.setZoom(currentZoom);
        fabricRef.current.setDimensions({
          width: CANVAS_WIDTH * currentZoom,
          height: CANVAS_HEIGHT * currentZoom,
        });
        fabricRef.current.renderAll();
        saveHistory();
        onCanvasChangeRef.current?.();
      },

      finishBatch: () => {
        if (!fabricRef.current) return;
        fabricRef.current.discardActiveObject();
        fabricRef.current.renderAll();
        saveHistory();
        onCanvasChangeRef.current?.();
      },
    }), [saveHistory]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!fabricRef.current) return;

        // Don't trigger shortcuts when typing in input fields
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        // Delete/Backspace - delete selected
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const activeObject = fabricRef.current.getActiveObject();
          if (activeObject && !(activeObject instanceof Textbox && (activeObject as Textbox).isEditing)) {
            e.preventDefault();
            const activeObjects = fabricRef.current.getActiveObjects();
            activeObjects.forEach((obj) => fabricRef.current!.remove(obj));
            fabricRef.current.discardActiveObject();
            fabricRef.current.renderAll();
          }
        }

        // Ctrl/Cmd + Z - Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          if (historyIndexRef.current > 0) {
            isUndoRedoRef.current = true;
            historyIndexRef.current--;
            const json = historyRef.current[historyIndexRef.current];
            lastSavedStateRef.current = json;
            const currentZoom = fabricRef.current.getZoom();
            const proxiedJson = proxyR2UrlsInJson(json);
            fabricRef.current.loadFromJSON(JSON.parse(proxiedJson)).then(() => {
              fabricRef.current!.setZoom(currentZoom);
              fabricRef.current!.setDimensions({
                width: CANVAS_WIDTH * currentZoom,
                height: CANVAS_HEIGHT * currentZoom,
              });
              fabricRef.current!.renderAll();
              setTimeout(() => {
                isUndoRedoRef.current = false;
              }, 100);
            });
          }
        }

        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          if (historyIndexRef.current < historyRef.current.length - 1) {
            isUndoRedoRef.current = true;
            historyIndexRef.current++;
            const json = historyRef.current[historyIndexRef.current];
            lastSavedStateRef.current = json;
            const currentZoom = fabricRef.current.getZoom();
            const proxiedJson = proxyR2UrlsInJson(json);
            fabricRef.current.loadFromJSON(JSON.parse(proxiedJson)).then(() => {
              fabricRef.current!.setZoom(currentZoom);
              fabricRef.current!.setDimensions({
                width: CANVAS_WIDTH * currentZoom,
                height: CANVAS_HEIGHT * currentZoom,
              });
              fabricRef.current!.renderAll();
              setTimeout(() => {
                isUndoRedoRef.current = false;
              }, 100);
            });
          }
        }

        // Ctrl/Cmd + G - Group selected
        if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
          e.preventDefault();
          const active = fabricRef.current.getActiveObject();
          if (active && active instanceof ActiveSelection) {
            const objects = active.getObjects();
            if (objects.length >= 2) {
              fabricRef.current.discardActiveObject();
              objects.forEach(obj => fabricRef.current!.remove(obj));
              const group = new Group(objects);
              fabricRef.current.add(group);
              fabricRef.current.setActiveObject(group);
              fabricRef.current.renderAll();
              saveHistory();
            }
          }
        }

        // Ctrl/Cmd + Shift + G - Ungroup selected
        if ((e.ctrlKey || e.metaKey) && e.key === 'G' && e.shiftKey) {
          e.preventDefault();
          const active = fabricRef.current.getActiveObject();
          if (active && active instanceof Group && !active._isSvgIcon) {
            const canvas = fabricRef.current;
            const objects = [...active.getObjects()];
            canvas.discardActiveObject();
            active.removeAll();
            canvas.remove(active);
            objects.forEach(obj => {
              obj.setCoords();
              canvas.add(obj);
            });
            if (objects.length > 0) {
              const selection = new ActiveSelection(objects, { canvas });
              canvas.setActiveObject(selection);
            }
            canvas.renderAll();
            saveHistory();
          }
        }

        // Escape - exit group interactive mode
        if (e.key === 'Escape') {
          fabricRef.current.getObjects().forEach(obj => {
            if (obj instanceof Group) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const g = obj as any;
              if (g.interactive) {
                g.interactive = false;
                g.subTargetCheck = false;
              }
            }
          });
          fabricRef.current.discardActiveObject();
          fabricRef.current.requestRenderAll();
          setContextMenu(null);
        }

        // Ctrl/Cmd + D - Duplicate
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
          e.preventDefault();
          const activeObject = fabricRef.current.getActiveObject();
          if (activeObject) {
            activeObject.clone().then((cloned: FabricObject) => {
              cloned.set({
                left: (activeObject.left || 0) + 20,
                top: (activeObject.top || 0) + 20,
              });
              fabricRef.current!.add(cloned);
              fabricRef.current!.setActiveObject(cloned);
              fabricRef.current!.renderAll();
            });
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle drop events with visual feedback
    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      // Only set to false if we're leaving the container entirely
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (!containerRef.current?.contains(relatedTarget)) {
        setIsDragOver(false);
      }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData || !containerRef.current) return;

      try {
        const { type, data } = JSON.parse(jsonData);

        // Get drop position relative to canvas
        const canvasElement = containerRef.current.querySelector('canvas');
        if (!canvasElement) return;

        const canvasRect = canvasElement.getBoundingClientRect();

        // Calculate position on canvas accounting for zoom
        const x = (e.clientX - canvasRect.left) / zoom;
        const y = (e.clientY - canvasRect.top) / zoom;

        // Call the drop handler or handle internally
        if (onElementDrop) {
          onElementDrop(type, data, x, y);
        } else if (fabricRef.current) {
          // Handle internally if no external handler
          if (type === 'text') {
            const dropFontSize = data.fontSize ?? 48;
            const dropWidth = Math.min(Math.max(dropFontSize * 12, 400), CANVAS_WIDTH - 80);
            const text = new Textbox(data.text || 'Add text here', {
              left: Math.max(0, Math.min(x - dropWidth / 2, CANVAS_WIDTH - dropWidth)),
              top: Math.max(0, Math.min(y - 20, CANVAS_HEIGHT - 40)),
              width: dropWidth,
              fontSize: dropFontSize,
              fontFamily: data.fontFamily ?? 'Inter',
              fontWeight: data.fontWeight ?? 'normal',
              fill: data.fill ?? '#000000',
              textAlign: data.textAlign ?? 'center',
              editable: true,
            });
            fabricRef.current.add(text);
            fabricRef.current.setActiveObject(text);
            fabricRef.current.renderAll();
            // Ensure font is loaded for dropped text
            loadGoogleFont(data.fontFamily ?? 'Inter').then(() => {
              if (fabricRef.current) {
                text.set('dirty', true);
                text.initDimensions();
                fabricRef.current.requestRenderAll();
              }
            }).catch(() => {});
          } else if (type === 'shape') {
            let shape: FabricObject;
            const dropX = Math.max(0, Math.min(x - 50, CANVAS_WIDTH - 100));
            const dropY = Math.max(0, Math.min(y - 50, CANVAS_HEIGHT - 100));

            switch (data.shapeType) {
              case 'rect':
                shape = new Rect({
                  left: dropX,
                  top: dropY,
                  width: 200,
                  height: 150,
                  fill: '#0891b2',
                  rx: 8,
                  ry: 8,
                });
                break;
              case 'circle':
                shape = new Circle({
                  left: dropX,
                  top: dropY,
                  radius: 75,
                  fill: '#0891b2',
                });
                break;
              case 'line':
                shape = new Line([0, 0, 300, 0], {
                  left: dropX,
                  top: dropY,
                  stroke: '#0891b2',
                  strokeWidth: 4,
                });
                break;
              default:
                return;
            }
            fabricRef.current.add(shape);
            fabricRef.current.setActiveObject(shape);
            fabricRef.current.renderAll();
          } else if (type === 'image' && data.url) {
            // Handle image drops (for branding elements like logo/avatar)
            try {
              const img = await FabricImage.fromURL(data.url, { crossOrigin: 'anonymous' });

              // Scale image to fit nicely
              const maxWidth = CANVAS_WIDTH * 0.4;
              const maxHeight = CANVAS_HEIGHT * 0.3;
              const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!, 1);

              const dropX = Math.max(0, Math.min(x - (img.width! * scale) / 2, CANVAS_WIDTH - img.width! * scale));
              const dropY = Math.max(0, Math.min(y - (img.height! * scale) / 2, CANVAS_HEIGHT - img.height! * scale));

              img.set({
                left: dropX,
                top: dropY,
                scaleX: scale,
                scaleY: scale,
              });

              fabricRef.current.add(img);
              fabricRef.current.setActiveObject(img);
              fabricRef.current.renderAll();
            } catch (error) {
              console.error('Failed to load dropped image:', error);
            }
          } else if (type === 'icon' && data.iconId) {
            // Handle icon drops - dispatch custom event for ElementToolbar to handle
            const event = new CustomEvent('iconDrop', {
              detail: { iconId: data.iconId, iconName: data.iconName, x, y }
            });
            window.dispatchEvent(event);
          }
        }
      } catch (error) {
        console.error('Failed to handle drop:', error);
      }
    }, [zoom, onElementDrop]);

    // Prevent browser context menu on the container (Fabric handles context menu via its own event)
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
    }, []);

    // Helper to check if active object is a user group (not SVG icon)
    const isUserGroup = useCallback(() => {
      const active = fabricRef.current?.getActiveObject();
      return active instanceof Group && !active._isSvgIcon;
    }, []);

    const isMultiSelect = useCallback(() => {
      return fabricRef.current?.getActiveObject() instanceof ActiveSelection;
    }, []);

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800",
          "flex items-center justify-center",
          "transition-all duration-200",
          isDragOver && "ring-2 ring-cyan-500 ring-offset-2 bg-cyan-50/50 dark:bg-cyan-950/50",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
      >
        {/* Canvas container - Fabric handles zoom natively */}
        <div
          className={cn(
            "relative shadow-2xl",
            isDragOver && "scale-[1.01]"
          )}
        >
          <canvas ref={canvasRef} />

          {/* Floating action buttons above selected element */}
          {floatingBtnPos && (
            <div
              className="absolute flex gap-0.5 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-border p-0.5"
              style={{
                left: floatingBtnPos.x,
                top: floatingBtnPos.y,
                transform: 'translate(-50%, -100%)',
                zIndex: 10,
              }}
            >
              <button
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => {
                  fabricRef.current?.getActiveObject()?.clone().then((cloned: FabricObject) => {
                    const active = fabricRef.current!.getActiveObject();
                    cloned.set({ left: (active?.left || 0) + 20, top: (active?.top || 0) + 20 });
                    fabricRef.current!.add(cloned);
                    fabricRef.current!.setActiveObject(cloned);
                    fabricRef.current!.renderAll();
                  });
                }}
                title="Duplicate"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              </button>
              <button
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                onClick={() => {
                  if (!fabricRef.current) return;
                  const activeObjects = fabricRef.current.getActiveObjects();
                  activeObjects.forEach(obj => fabricRef.current!.remove(obj));
                  fabricRef.current.discardActiveObject();
                  fabricRef.current.renderAll();
                  setFloatingBtnPos(null);
                }}
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* Drop zone indicator */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-6 py-3 bg-cyan-500/90 text-white rounded-lg shadow-lg animate-pulse">
              <p className="text-sm font-medium">Drop element here</p>
            </div>
          </div>
        )}

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-muted-foreground">Loading editor...</div>
          </div>
        )}

        {/* Right-click context menu */}
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-9998" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
            <div
              className="fixed z-9999 min-w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-border py-1 text-sm"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                onClick={() => {
                  fabricRef.current?.getActiveObject()?.clone().then((cloned: FabricObject) => {
                    const active = fabricRef.current!.getActiveObject();
                    cloned.set({ left: (active?.left || 0) + 20, top: (active?.top || 0) + 20 });
                    fabricRef.current!.add(cloned);
                    fabricRef.current!.setActiveObject(cloned);
                    fabricRef.current!.renderAll();
                  });
                  setContextMenu(null);
                }}
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button
                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-red-500"
                onClick={() => {
                  if (!fabricRef.current) return;
                  const activeObjects = fabricRef.current.getActiveObjects();
                  activeObjects.forEach(obj => fabricRef.current!.remove(obj));
                  fabricRef.current.discardActiveObject();
                  fabricRef.current.renderAll();
                  setContextMenu(null);
                  setFloatingBtnPos(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <div className="h-px bg-border my-1" />
              {isMultiSelect() && (
                <button
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  onClick={() => {
                    const canvas = fabricRef.current!;
                    const active = canvas.getActiveObject();
                    if (active instanceof ActiveSelection) {
                      const objects = active.getObjects();
                      if (objects.length >= 2) {
                        canvas.discardActiveObject();
                        objects.forEach(obj => canvas.remove(obj));
                        const group = new Group(objects);
                        canvas.add(group);
                        canvas.setActiveObject(group);
                        canvas.renderAll();
                        saveHistory();
                      }
                    }
                    setContextMenu(null);
                  }}
                >
                  <Layers className="w-3.5 h-3.5" /> Group
                </button>
              )}
              {isUserGroup() && (
                <button
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  onClick={() => {
                    const canvas = fabricRef.current!;
                    const active = canvas.getActiveObject();
                    if (active instanceof Group) {
                      const objects = [...active.getObjects()];
                      canvas.discardActiveObject();
                      active.removeAll();
                      canvas.remove(active);
                      objects.forEach(obj => {
                        obj.setCoords();
                        canvas.add(obj);
                      });
                      if (objects.length > 0) {
                        const selection = new ActiveSelection(objects, { canvas });
                        canvas.setActiveObject(selection);
                      }
                      canvas.renderAll();
                      saveHistory();
                    }
                    setContextMenu(null);
                  }}
                >
                  <UngroupIcon className="w-3.5 h-3.5" /> Ungroup
                </button>
              )}
              <div className="h-px bg-border my-1" />
              <button
                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => {
                  const active = fabricRef.current?.getActiveObject();
                  if (active) fabricRef.current!.bringObjectForward(active);
                  fabricRef.current?.renderAll();
                  setContextMenu(null);
                }}
              >
                Bring Forward
              </button>
              <button
                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => {
                  const active = fabricRef.current?.getActiveObject();
                  if (active) fabricRef.current!.sendObjectBackwards(active);
                  fabricRef.current?.renderAll();
                  setContextMenu(null);
                }}
              >
                Send Backward
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
);

CanvasWorkspace.displayName = "CanvasWorkspace";
