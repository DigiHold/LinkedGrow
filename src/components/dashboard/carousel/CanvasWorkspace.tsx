"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Canvas, FabricObject, Textbox, Rect, Circle, Line, FabricImage, Gradient, loadSVGFromString, util } from "fabric";
import { cn } from "@/lib/utils";

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
  addText: (options?: Partial<TextOptions>) => void;
  addShape: (shapeType: 'rect' | 'circle' | 'line') => void;
  addShapeWithOptions: (options: ShapeOptions) => void;
  addImage: (url: string) => Promise<void>;
  addSvgIcon: (svgString: string) => Promise<void>;
  deleteSelected: () => void;
  duplicateSelected: () => void;
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

      const json = JSON.stringify(fabricRef.current.toJSON());

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
      });

      // Set default control styles
      FabricObject.prototype.set({
        cornerColor: '#0891b2',
        cornerStyle: 'circle',
        cornerSize: 12,
        transparentCorners: false,
        borderColor: '#0891b2',
        borderScaleFactor: 2,
      });

      // Enable center guidelines and real-time position updates
      canvas.on('object:moving', (e) => {
        const obj = e.target;
        if (!obj) return;

        const canvasCenter = CANVAS_WIDTH / 2;
        const canvasMiddle = CANVAS_HEIGHT / 2;
        const objCenter = obj.left! + (obj.width! * obj.scaleX!) / 2;
        const objMiddle = obj.top! + (obj.height! * obj.scaleY!) / 2;

        // Snap to center
        if (Math.abs(objCenter - canvasCenter) < 10) {
          obj.set({ left: canvasCenter - (obj.width! * obj.scaleX!) / 2 });
        }
        if (Math.abs(objMiddle - canvasMiddle) < 10) {
          obj.set({ top: canvasMiddle - (obj.height! * obj.scaleY!) / 2 });
        }

        // Notify about position change for real-time updates
        onElementMovingRef.current?.(obj);
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

      // Selection events
      canvas.on('selection:created', (e) => {
        onSelectionChangeRef.current?.(e.selected?.[0] || null);
      });

      canvas.on('selection:updated', (e) => {
        onSelectionChangeRef.current?.(e.selected?.[0] || null);
      });

      canvas.on('selection:cleared', () => {
        onSelectionChangeRef.current?.(null);
      });

      // Track changes
      canvas.on('object:modified', () => {
        saveHistory();
        onCanvasChangeRef.current?.();
      });

      canvas.on('object:added', () => {
        saveHistory();
        onCanvasChangeRef.current?.();
      });

      canvas.on('object:removed', () => {
        saveHistory();
        onCanvasChangeRef.current?.();
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

    // Handle zoom
    useEffect(() => {
      if (!fabricRef.current || !containerRef.current) return;

      const canvas = fabricRef.current;
      canvas.setZoom(zoom);
      canvas.setDimensions({
        width: CANVAS_WIDTH * zoom,
        height: CANVAS_HEIGHT * zoom,
      });
    }, [zoom]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addText: (options: Partial<TextOptions> = {}) => {
        if (!fabricRef.current) return;

        const text = new Textbox(options.text || 'Add your text here', {
          left: options.left ?? CANVAS_WIDTH / 2 - 200,
          top: options.top ?? CANVAS_HEIGHT / 2 - 30,
          width: options.width ?? 400,
          fontSize: options.fontSize ?? 48,
          fontFamily: options.fontFamily ?? 'Inter',
          fontWeight: options.fontWeight ?? 'normal',
          fill: options.fill ?? '#000000',
          textAlign: options.textAlign ?? 'center',
          opacity: options.opacity ?? 1,
          editable: true,
        });

        fabricRef.current.add(text);
        fabricRef.current.setActiveObject(text);
        fabricRef.current.renderAll();
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

      addShapeWithOptions: (options: ShapeOptions) => {
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
        fabricRef.current.renderAll();
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

        // Remove ALL existing background rects (non-selectable rects at position 0,0)
        const objects = fabricRef.current.getObjects();
        const bgRects = objects.filter(obj =>
          obj instanceof Rect && !obj.selectable && obj.left === 0 && obj.top === 0
        );
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

        // Temporarily reset zoom for export
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
        const json = fabricRef.current.toJSON();

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
              if (obj.type === 'image' && obj.src && typeof obj.src === 'string') {
                const src = obj.src as string;
                if (src.includes('r2.dev') || src.includes('r2.cloudflarestorage.com')) {
                  // Store original and use proxy URL
                  obj.originalSrc = src;
                  obj.src = `/api/media/proxy?url=${encodeURIComponent(src)}`;
                }
              }
              return obj;
            });
          }

          // Clear canvas first to prevent any lingering objects
          fabricRef.current.clear();
          await fabricRef.current.loadFromJSON(parsed);
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
        lastSavedStateRef.current = json; // Update last saved state to prevent re-save

        fabricRef.current.loadFromJSON(JSON.parse(json)).then(() => {
          fabricRef.current!.renderAll();
          // Small delay before allowing history saves again
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
        lastSavedStateRef.current = json; // Update last saved state to prevent re-save

        fabricRef.current.loadFromJSON(JSON.parse(json)).then(() => {
          fabricRef.current!.renderAll();
          // Small delay before allowing history saves again
          setTimeout(() => {
            isUndoRedoRef.current = false;
          }, 100);
          onCanvasChangeRef.current?.();
        });
      },

      getCanvas: () => fabricRef.current,

      clearCanvas: () => {
        if (!fabricRef.current) return;
        fabricRef.current.clear();
        fabricRef.current.backgroundColor = '#ffffff';
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
            fabricRef.current.loadFromJSON(JSON.parse(json)).then(() => {
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
            fabricRef.current.loadFromJSON(JSON.parse(json)).then(() => {
              fabricRef.current!.renderAll();
              setTimeout(() => {
                isUndoRedoRef.current = false;
              }, 100);
            });
          }
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
            const text = new Textbox(data.text || 'Add text here', {
              left: Math.max(0, Math.min(x - 100, CANVAS_WIDTH - 200)),
              top: Math.max(0, Math.min(y - 20, CANVAS_HEIGHT - 40)),
              width: 400,
              fontSize: data.fontSize ?? 48,
              fontFamily: data.fontFamily ?? 'Inter',
              fontWeight: data.fontWeight ?? 'normal',
              fill: data.fill ?? '#000000',
              textAlign: data.textAlign ?? 'center',
              editable: true,
            });
            fabricRef.current.add(text);
            fabricRef.current.setActiveObject(text);
            fabricRef.current.renderAll();
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
      >
        {/* Canvas container */}
        <div
          className={cn(
            "relative shadow-2xl transition-transform duration-200",
            isDragOver && "scale-[1.01]"
          )}
          style={{
            width: CANVAS_WIDTH * zoom,
            height: CANVAS_HEIGHT * zoom,
          }}
        >
          <canvas ref={canvasRef} />
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
      </div>
    );
  }
);

CanvasWorkspace.displayName = "CanvasWorkspace";
