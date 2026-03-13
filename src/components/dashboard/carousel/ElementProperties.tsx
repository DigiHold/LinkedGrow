"use client";

import { useState, useEffect, useCallback } from "react";
import { Canvas, FabricObject, Textbox, FabricImage, Group, Gradient, ActiveSelection, Shadow, filters as FabricFilters } from "fabric";
import { Button } from "@/components/ui/button";
import { GoogleFontPicker, loadGoogleFont, getFontWeights, ensureFontsLoaded } from "./GoogleFontPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Trash2,
  Copy,
  RotateCcw,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  Layers,
  Ungroup,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasWorkspaceRef } from "./CanvasWorkspace";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./CanvasWorkspace";

// Get alignment bounds: parent group if element is inside a group, otherwise canvas
function getAlignmentBounds(element: FabricObject): { left: number; top: number; width: number; height: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parent = (element as any).parent;
  if (parent && parent instanceof Group && !(parent as any)._isSvgIcon) {
    return parent.getBoundingRect();
  }
  return { left: 0, top: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
}

// Helper to check if an element is an SVG icon group (not a user-created group)
function isSvgIconGroup(element: FabricObject): boolean {
  if (!(element instanceof Group)) return false;
  // SVG icons loaded via loadSVGFromString contain only paths/simple shapes
  // User-created groups contain canvas-level objects like Textbox, FabricImage, etc.
  // Check if the group has _isSvgIcon flag (set in CanvasWorkspace) or only contains paths
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((element as any)._isSvgIcon) return true;
  const objects = element.getObjects();
  return objects.length > 0 && objects.every(o => o.type === 'path');
}

interface ElementPropertiesProps {
  selectedElement: FabricObject | null;
  canvasRef: React.RefObject<CanvasWorkspaceRef | null>;
  onBackgroundChange?: (type: 'solid' | 'gradient' | 'image', value: string) => void;
  updateTrigger?: number;
  className?: string;
  brandColors?: string[];
  onBrandColorsChange?: (colors: string[]) => void;
}


const PRESET_COLORS = [
  '#000000', '#ffffff', '#374151', '#6b7280', '#9ca3af',
  '#0891b2', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6',
];

// Interpolate between two hex colors for per-character gradient
function interpolateColor(hex1: string, hex2: string, factor: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * factor), g = Math.round(g1 + (g2 - g1) * factor), b = Math.round(b1 + (b2 - b1) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const GRADIENT_PRESETS = [
  { label: 'Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { label: 'Fire', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { label: 'Night', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { label: 'Sky', value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
];

export function ElementProperties({
  selectedElement,
  canvasRef,
  onBackgroundChange,
  updateTrigger,
  className,
  brandColors,
  onBrandColorsChange,
}: ElementPropertiesProps) {
  const [elementProps, setElementProps] = useState({
    fill: '#000000',
    stroke: '',
    strokeWidth: 0,
    opacity: 1,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    angle: 0,
    rx: 0,
    radiusTL: undefined as number | undefined,
    radiusTR: undefined as number | undefined,
    radiusBR: undefined as number | undefined,
    radiusBL: undefined as number | undefined,
    // Text-specific
    fontSize: 48,
    fontFamily: 'Inter',
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    textAlign: 'center',
  });

  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fillType, setFillType] = useState<'solid' | 'gradient'>('solid');
  const [gradientColor1, setGradientColor1] = useState('#0891b2');
  const [gradientColor2, setGradientColor2] = useState('#6366f1');
  const [gradientAngle, setGradientAngle] = useState(90);
  const [iconColor, setIconColor] = useState('#000000');
  const [fontsCacheReady, setFontsCacheReady] = useState(false);
  const [perCornerMode, setPerCornerMode] = useState(false);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowColor, setShadowColor] = useState('rgba(0,0,0,0.25)');
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(4);

  // Image filter state
  const [filterBlur, setFilterBlur] = useState(0);
  const [filterBrightness, setFilterBrightness] = useState(0);
  const [filterContrast, setFilterContrast] = useState(0);
  const [filterSaturation, setFilterSaturation] = useState(0);
  const [filterHueRotation, setFilterHueRotation] = useState(0);
  const [filterGrayscale, setFilterGrayscale] = useState(false);
  const [filterInvert, setFilterInvert] = useState(false);

  // Brand color helpers
  const addBrandColor = useCallback((color: string) => {
    const hex = color.toLowerCase();
    if (!brandColors?.includes(hex)) {
      onBrandColorsChange?.([...(brandColors || []), hex]);
    }
  }, [brandColors, onBrandColorsChange]);

  const removeBrandColor = useCallback((color: string) => {
    onBrandColorsChange?.((brandColors || []).filter(c => c !== color));
  }, [brandColors, onBrandColorsChange]);

  // Ensure fonts cache is loaded so getFontWeights returns accurate data
  useEffect(() => {
    ensureFontsLoaded().then(() => setFontsCacheReady(true));
  }, []);

  // Update local state when selection changes or element is being moved/scaled
  useEffect(() => {
    if (!selectedElement) return;

    const isTextbox = selectedElement instanceof Textbox;
    const textbox = isTextbox ? selectedElement as Textbox : null;

    // Detect gradient fill
    const fillValue = selectedElement.fill;
    if (fillValue && typeof fillValue === 'object' && 'colorStops' in fillValue) {
      setFillType('gradient');
      const gradientObj = fillValue as InstanceType<typeof Gradient>;
      const stops = gradientObj.colorStops || [];
      if (stops.length >= 1) {
        setGradientColor1(stops[0].color);
        if (stops.length >= 2) {
          setGradientColor2(stops[stops.length - 1].color);
        }
      }
      const coords = gradientObj.coords as { x1: number; y1: number; x2: number; y2: number };
      if (coords) {
        const w = selectedElement.width || 1;
        const h = selectedElement.height || 1;
        const dx = (coords.x2 - coords.x1) / w;
        const dy = (coords.y2 - coords.y1) / h;
        const angleDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
        setGradientAngle(Math.round(angleDeg));
      }
    } else {
      setFillType('solid');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = selectedElement as any;
    const hasPerCorner = el.radiusTL != null || el.radiusTR != null || el.radiusBR != null || el.radiusBL != null;
    setPerCornerMode(hasPerCorner);

    // For text elements, read styles from the first character's complete style
    // declaration (merges object-level defaults with per-character overrides)
    // so the panel shows the actual rendered values, not stale defaults.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const charStyle = textbox && textbox.text && textbox.text.length > 0 ? (textbox as any).getCompleteStyleDeclaration(0, 0) : null;

    setElementProps({
      fill: textbox
        ? (typeof (charStyle?.fill) === 'string' ? charStyle.fill : (typeof fillValue === 'string' ? fillValue : '#000000'))
        : (typeof fillValue === 'string' ? fillValue : '#000000'),
      stroke: (selectedElement.stroke as string) || '',
      strokeWidth: selectedElement.strokeWidth || 0,
      opacity: selectedElement.opacity || 1,
      left: Math.round(selectedElement.left || 0),
      top: Math.round(selectedElement.top || 0),
      width: Math.round((selectedElement.width || 0) * (selectedElement.scaleX || 1)),
      height: Math.round((selectedElement.height || 0) * (selectedElement.scaleY || 1)),
      angle: Math.round(selectedElement.angle || 0),
      rx: Math.round(el.rx || 0),
      radiusTL: el.radiusTL != null ? Math.round(el.radiusTL) : undefined,
      radiusTR: el.radiusTR != null ? Math.round(el.radiusTR) : undefined,
      radiusBR: el.radiusBR != null ? Math.round(el.radiusBR) : undefined,
      radiusBL: el.radiusBL != null ? Math.round(el.radiusBL) : undefined,
      fontSize: charStyle?.fontSize ?? textbox?.fontSize ?? 48,
      fontFamily: charStyle?.fontFamily ?? textbox?.fontFamily ?? 'Inter',
      fontWeight: String(charStyle?.fontWeight ?? textbox?.fontWeight ?? 'normal'),
      fontStyle: (charStyle?.fontStyle ?? textbox?.fontStyle ?? 'normal') as string,
      underline: !!(charStyle?.underline ?? textbox?.underline),
      textAlign: textbox?.textAlign || 'center',
    });

    // Read shadow
    const shadow = selectedElement.shadow;
    if (shadow && shadow instanceof Shadow) {
      setShadowEnabled(true);
      setShadowColor(shadow.color || 'rgba(0,0,0,0.25)');
      setShadowBlur(shadow.blur || 10);
      setShadowOffsetX(shadow.offsetX || 0);
      setShadowOffsetY(shadow.offsetY || 4);
    } else {
      setShadowEnabled(false);
    }

    // Read image filters
    if (selectedElement instanceof FabricImage) {
      const imgFilters = selectedElement.filters || [];
      setFilterBlur((imgFilters.find(f => f instanceof FabricFilters.Blur) as InstanceType<typeof FabricFilters.Blur>)?.blur || 0);
      setFilterBrightness((imgFilters.find(f => f instanceof FabricFilters.Brightness) as InstanceType<typeof FabricFilters.Brightness>)?.brightness || 0);
      setFilterContrast((imgFilters.find(f => f instanceof FabricFilters.Contrast) as InstanceType<typeof FabricFilters.Contrast>)?.contrast || 0);
      setFilterSaturation((imgFilters.find(f => f instanceof FabricFilters.Saturation) as InstanceType<typeof FabricFilters.Saturation>)?.saturation || 0);
      setFilterHueRotation((imgFilters.find(f => f instanceof FabricFilters.HueRotation) as InstanceType<typeof FabricFilters.HueRotation>)?.rotation || 0);
      setFilterGrayscale(imgFilters.some(f => f instanceof FabricFilters.Grayscale));
      setFilterInvert(imgFilters.some(f => f instanceof FabricFilters.Invert));
    } else {
      setFilterBlur(0);
      setFilterBrightness(0);
      setFilterContrast(0);
      setFilterSaturation(0);
      setFilterHueRotation(0);
      setFilterGrayscale(false);
      setFilterInvert(false);
    }
  }, [selectedElement, updateTrigger]);

  // Check if textbox is in editing mode with a selection
  const hasTextSelection = useCallback(() => {
    if (!(selectedElement instanceof Textbox)) return false;
    const tb = selectedElement as Textbox;
    return tb.isEditing && tb.selectionStart !== tb.selectionEnd;
  }, [selectedElement]);

  // Check if textbox is in editing mode (cursor or selection)
  const isTextEditing = useCallback(() => {
    if (!(selectedElement instanceof Textbox)) return false;
    return (selectedElement as Textbox).isEditing;
  }, [selectedElement]);

  // Get the style at the current cursor position or first char of selection.
  // Uses getCompleteStyleDeclaration which merges per-char overrides with object defaults.
  const getSelectionStyle = useCallback((prop: string): unknown => {
    if (!(selectedElement instanceof Textbox)) return undefined;
    const tb = selectedElement as Textbox;
    if (!tb.isEditing) return undefined;
    if (!tb.text || tb.text.length === 0) return undefined;

    let pos: number;
    if (tb.selectionStart !== tb.selectionEnd) {
      // Selection: read style of first character in selection
      pos = tb.selectionStart;
    } else {
      // Cursor only: read character to the LEFT of cursor (like Word/Canva -
      // reflects the style of what you just typed)
      pos = Math.max(0, tb.selectionStart - 1);
    }
    pos = Math.min(pos, tb.text.length - 1);
    const loc = tb.get2DCursorLocation(pos);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const style = (tb as any).getCompleteStyleDeclaration(loc.lineIndex, loc.charIndex);
    return style?.[prop];
  }, [selectedElement]);

  // Apply style to selected text or whole textbox (synchronous - no await needed)
  const applyTextStyle = useCallback((styles: Record<string, unknown>) => {
    if (!(selectedElement instanceof Textbox)) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const tb = selectedElement as Textbox;

    if (tb.isEditing && tb.selectionStart !== tb.selectionEnd) {
      // Apply to selection only (per-character styles)
      tb.setSelectionStyles(styles);
    } else {
      // Apply to entire textbox: set object-level AND clear per-character
      // overrides so the new value takes effect visually (per-char styles
      // would otherwise win over object-level defaults).
      Object.entries(styles).forEach(([key, value]) => {
        tb.set(key as keyof Textbox, value);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tb.removeStyle(key as any);
      });
    }
    tb.dirty = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tb as any)._forceClearCache = true;
    tb.initDimensions();
    tb.setCoords();
    canvas.requestRenderAll();

    // Load font variant in background for weight/family changes, then re-render
    if ('fontWeight' in styles || 'fontFamily' in styles) {
      const family = (styles.fontFamily as string) || tb.fontFamily || 'Inter';
      const weight = (styles.fontWeight as string) || String(tb.fontWeight || 'normal');
      loadGoogleFont(family).then(() =>
        document.fonts.load(`${weight} 16px "${family}"`)
      ).then(() => {
        tb.dirty = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tb as any)._forceClearCache = true;
        tb.initDimensions();
        tb.setCoords();
        canvas.requestRenderAll();
      }).catch(() => {});
    }
  }, [selectedElement, canvasRef]);

  // Apply image filters - rebuilds the entire filter array from current state
  const applyImageFilters = useCallback((overrides: {
    blur?: number; brightness?: number; contrast?: number;
    saturation?: number; hueRotation?: number; grayscale?: boolean; invert?: boolean;
  } = {}) => {
    if (!(selectedElement instanceof FabricImage)) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const b = overrides.blur ?? filterBlur;
    const br = overrides.brightness ?? filterBrightness;
    const co = overrides.contrast ?? filterContrast;
    const sa = overrides.saturation ?? filterSaturation;
    const hr = overrides.hueRotation ?? filterHueRotation;
    const gs = overrides.grayscale ?? filterGrayscale;
    const inv = overrides.invert ?? filterInvert;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newFilters: any[] = [];
    if (b > 0) newFilters.push(new FabricFilters.Blur({ blur: b }));
    if (br !== 0) newFilters.push(new FabricFilters.Brightness({ brightness: br }));
    if (co !== 0) newFilters.push(new FabricFilters.Contrast({ contrast: co }));
    if (sa !== 0) newFilters.push(new FabricFilters.Saturation({ saturation: sa }));
    if (hr !== 0) newFilters.push(new FabricFilters.HueRotation({ rotation: hr }));
    if (gs) newFilters.push(new FabricFilters.Grayscale());
    if (inv) newFilters.push(new FabricFilters.Invert());

    selectedElement.filters = newFilters;
    selectedElement.applyFilters();
    canvas.renderAll();
  }, [selectedElement, canvasRef, filterBlur, filterBrightness, filterContrast, filterSaturation, filterHueRotation, filterGrayscale, filterInvert]);

  const updateElement = useCallback((updates: Partial<typeof elementProps>) => {
    if (!selectedElement) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const isRect = selectedElement.type === 'rect';

    // Apply updates to the element
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'width') {
        if (isRect) {
          // For Rect: set native width directly so rx/ry stay in same coordinate space
          selectedElement.set('width', value as number);
          selectedElement.set('scaleX', 1);
        } else {
          const scale = (value as number) / (selectedElement.width || 1);
          selectedElement.set('scaleX', scale);
        }
      } else if (key === 'height') {
        if (isRect) {
          selectedElement.set('height', value as number);
          selectedElement.set('scaleY', 1);
        } else {
          const scale = (value as number) / (selectedElement.height || 1);
          selectedElement.set('scaleY', scale);
        }
      } else {
        selectedElement.set(key as keyof FabricObject, value);
      }
    });

    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, ...updates }));
  }, [selectedElement, canvasRef]);

  const handleDelete = () => {
    canvasRef.current?.deleteSelected();
  };

  const handleDuplicate = () => {
    canvasRef.current?.duplicateSelected();
  };

  const handleBringForward = () => {
    canvasRef.current?.bringForward();
  };

  const handleBringToFront = () => {
    canvasRef.current?.bringToFront();
  };

  const handleSendBackward = () => {
    canvasRef.current?.sendBackward();
  };

  const handleSendToBack = () => {
    canvasRef.current?.sendToBack();
  };

  // Helper: after programmatic alignment, fire events so group layout
  // recalculates and floating buttons update position
  const fireAlignmentDone = useCallback((element: FabricObject, canvas: Canvas) => {
    // Trigger group layout manager to recalculate bounds (if element is in a group)
    element.fire('modified');
    // Trigger canvas handler to update floating buttons + save history
    canvas.fire('object:modified', { target: element });
  }, []);

  // Alignment functions - use getBoundingRect for accurate positioning
  // Aligns relative to parent group if element is inside a group, otherwise to canvas
  const alignHorizontalCenter = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const container = getAlignmentBounds(selectedElement);
    const bound = selectedElement.getBoundingRect();
    const offset = (selectedElement.left || 0) - bound.left;
    const newLeft = container.left + (container.width - bound.width) / 2 + offset;

    selectedElement.set('left', newLeft);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, left: Math.round(newLeft) }));
    fireAlignmentDone(selectedElement, canvas);
  }, [selectedElement, canvasRef, fireAlignmentDone]);

  const alignVerticalCenter = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const container = getAlignmentBounds(selectedElement);
    const bound = selectedElement.getBoundingRect();
    const offset = (selectedElement.top || 0) - bound.top;
    const newTop = container.top + (container.height - bound.height) / 2 + offset;

    selectedElement.set('top', newTop);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, top: Math.round(newTop) }));
    fireAlignmentDone(selectedElement, canvas);
  }, [selectedElement, canvasRef, fireAlignmentDone]);

  const alignToLeft = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const container = getAlignmentBounds(selectedElement);
    const bound = selectedElement.getBoundingRect();
    const offset = (selectedElement.left || 0) - bound.left;
    const newLeft = container.left + offset;

    selectedElement.set('left', newLeft);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, left: Math.round(newLeft) }));
    fireAlignmentDone(selectedElement, canvas);
  }, [selectedElement, canvasRef, fireAlignmentDone]);

  const alignToRight = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const container = getAlignmentBounds(selectedElement);
    const bound = selectedElement.getBoundingRect();
    const offset = (selectedElement.left || 0) - bound.left;
    const newLeft = container.left + container.width - bound.width + offset;

    selectedElement.set('left', newLeft);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, left: Math.round(newLeft) }));
    fireAlignmentDone(selectedElement, canvas);
  }, [selectedElement, canvasRef, fireAlignmentDone]);

  const alignToTop = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const container = getAlignmentBounds(selectedElement);
    const bound = selectedElement.getBoundingRect();
    const offset = (selectedElement.top || 0) - bound.top;
    const newTop = container.top + offset;

    selectedElement.set('top', newTop);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, top: Math.round(newTop) }));
    fireAlignmentDone(selectedElement, canvas);
  }, [selectedElement, canvasRef, fireAlignmentDone]);

  const alignToBottom = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const container = getAlignmentBounds(selectedElement);
    const bound = selectedElement.getBoundingRect();
    const offset = (selectedElement.top || 0) - bound.top;
    const newTop = container.top + container.height - bound.height + offset;

    selectedElement.set('top', newTop);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, top: Math.round(newTop) }));
    fireAlignmentDone(selectedElement, canvas);
  }, [selectedElement, canvasRef, fireAlignmentDone]);

  const isFrameElement = selectedElement?._isFrame === true;
  const isFilledFrame = isFrameElement && selectedElement?._frameHasImage === true;
  const isEmptyFrame = isFrameElement && !selectedElement?._frameHasImage;
  const isTextElement = selectedElement instanceof Textbox;
  const isImageElement = selectedElement instanceof FabricImage && !isFrameElement;
  const isIconElement = selectedElement ? isSvgIconGroup(selectedElement) : false;

  // Update icon color by changing fill of all paths in the SVG group
  const updateIconColor = useCallback((color: string) => {
    if (!selectedElement || !isIconElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const group = selectedElement as Group;

    // Update fill color of all objects in the group (paths, shapes, etc.)
    group.getObjects().forEach((obj) => {
      // Only update fill if the object has a fill (not just stroke)
      if (obj.fill && obj.fill !== 'none') {
        obj.set('fill', color);
      }
      // Also update stroke if present
      if (obj.stroke && obj.stroke !== 'none') {
        obj.set('stroke', color);
      }
    });

    canvas.renderAll();
    setIconColor(color);
  }, [selectedElement, isIconElement, canvasRef]);

  const isShapeElement = selectedElement ? !isTextElement && !isImageElement && !isIconElement && !isFrameElement : false;

  // Apply gradient fill - per-character when text is selected, otherwise whole element
  const applyGradientFill = useCallback((color1: string, color2: string, angle: number) => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    // Per-character gradient for selected text
    if (selectedElement instanceof Textbox) {
      const tb = selectedElement as Textbox;
      if (tb.isEditing && tb.selectionStart !== tb.selectionEnd) {
        const start = tb.selectionStart;
        const end = tb.selectionEnd;
        const len = end - start;
        for (let i = 0; i < len; i++) {
          const factor = len > 1 ? i / (len - 1) : 0;
          const color = interpolateColor(color1, color2, factor);
          tb.setSelectionStyles({ fill: color }, start + i, start + i + 1);
        }
        tb.dirty = true;
        canvas.requestRenderAll();
        setGradientColor1(color1);
        setGradientColor2(color2);
        setGradientAngle(angle);
        return;
      }
    }

    const w = selectedElement.width || 100;
    const h = selectedElement.height || 100;

    const angleRad = (angle - 90) * Math.PI / 180;
    const gradient = new Gradient({
      type: 'linear',
      coords: {
        x1: (0.5 - Math.cos(angleRad) * 0.5) * w,
        y1: (0.5 - Math.sin(angleRad) * 0.5) * h,
        x2: (0.5 + Math.cos(angleRad) * 0.5) * w,
        y2: (0.5 + Math.sin(angleRad) * 0.5) * h,
      },
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 },
      ],
    });

    // For text elements without selection, clear per-character fill styles so gradient shows through
    if (selectedElement instanceof Textbox) {
      (selectedElement as Textbox).removeStyle('fill');
    }

    selectedElement.set('fill', gradient);
    canvas.renderAll();
    setGradientColor1(color1);
    setGradientColor2(color2);
    setGradientAngle(angle);
  }, [selectedElement, canvasRef]);

  return (
    <div className={cn("w-72 bg-background border-l border-border flex flex-col h-full overflow-hidden", className)}>
      <div className="p-4 border-b border-border shrink-0">
        <h2 className="font-semibold text-sm">
          {selectedElement ? 'Element Properties' : 'Canvas Settings'}
        </h2>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="p-4 space-y-6">
          {selectedElement ? (
            <>
              {/* Element Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicate}
                  className="flex-1"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>

              {/* Group/Ungroup */}
              {selectedElement instanceof ActiveSelection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => canvasRef.current?.groupSelected()}
                  className="w-full"
                >
                  <Layers className="w-3 h-3 mr-1" />
                  Group elements
                </Button>
              )}
              {selectedElement instanceof Group && !isSvgIconGroup(selectedElement) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => canvasRef.current?.ungroupSelected()}
                  className="w-full"
                >
                  <Ungroup className="w-3 h-3 mr-1" />
                  Ungroup elements
                </Button>
              )}

              {/* Layer Order */}
              <div>
                <Label className="text-xs text-muted-foreground">Layer Order</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBringForward}
                    className="h-8 text-xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m18 9-6-6-6 6"/><path d="M12 3v14"/><path d="M5 21h14"/></svg>
                    Forward
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBringToFront}
                    className="h-8 text-xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 3h14"/><path d="m18 13-6-6-6 6"/><path d="M12 7v14"/></svg>
                    To Front
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendBackward}
                    className="h-8 text-xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M19 3H5"/><path d="M12 21V7"/><path d="m6 15 6 6 6-6"/></svg>
                    Backward
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendToBack}
                    className="h-8 text-xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/></svg>
                    To Back
                  </Button>
                </div>
              </div>

              {/* Alignment */}
              <div>
                <Label className="text-xs text-muted-foreground">Align on Canvas</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 p-0"
                    onClick={alignToLeft}
                    title="Align Left"
                  >
                    <AlignStartVertical className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 p-0"
                    onClick={alignHorizontalCenter}
                    title="Center Horizontally"
                  >
                    <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 p-0"
                    onClick={alignToRight}
                    title="Align Right"
                  >
                    <AlignEndVertical className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 p-0"
                    onClick={alignToTop}
                    title="Align Top"
                  >
                    <AlignStartHorizontal className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 p-0"
                    onClick={alignVerticalCenter}
                    title="Center Vertically"
                  >
                    <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 p-0"
                    onClick={alignToBottom}
                    title="Align Bottom"
                  >
                    <AlignEndHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Text Properties */}
              {isTextElement && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground">Font Family</Label>
                    <div className="mt-2">
                      <GoogleFontPicker
                        value={elementProps.fontFamily || 'Inter'}
                        onChange={(font) => {
                          if (selectedElement instanceof Textbox) {
                            applyTextStyle({ fontFamily: font });
                            setElementProps(prev => ({
                              ...prev,
                              fontFamily: font,
                              width: Math.round((selectedElement.width || 0) * (selectedElement.scaleX || 1)),
                              height: Math.round((selectedElement.height || 0) * (selectedElement.scaleY || 1)),
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Font Size</Label>
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        className="h-8 w-8 shrink-0 rounded-md border border-input bg-background flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => {
                          const newSize = Math.max(1, (elementProps.fontSize || 48) - 1);
                          applyTextStyle({ fontSize: newSize });
                          setElementProps(prev => ({ ...prev, fontSize: newSize }));
                        }}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={elementProps.fontSize || 48}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(500, Number(e.target.value) || 1));
                          applyTextStyle({ fontSize: val });
                          setElementProps(prev => ({ ...prev, fontSize: val }));
                        }}
                        className="h-8 w-full text-center text-sm border border-input rounded-md bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        className="h-8 w-8 shrink-0 rounded-md border border-input bg-background flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => {
                          const newSize = Math.min(500, (elementProps.fontSize || 48) + 1);
                          applyTextStyle({ fontSize: newSize });
                          setElementProps(prev => ({ ...prev, fontSize: newSize }));
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Font Weight</Label>
                    <Select
                      key={`${elementProps.fontFamily}-${fontsCacheReady}`}
                      value={String(elementProps.fontWeight === 'normal' ? 400 : elementProps.fontWeight === 'bold' ? 700 : elementProps.fontWeight)}
                      onValueChange={(val) => {
                        if (!(selectedElement instanceof Textbox)) return;
                        applyTextStyle({ fontWeight: val });
                        setElementProps(prev => ({
                          ...prev,
                          fontWeight: val,
                          width: Math.round((selectedElement.width || 0) * (selectedElement.scaleX || 1)),
                          height: Math.round((selectedElement.height || 0) * (selectedElement.scaleY || 1)),
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-2 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getFontWeights(elementProps.fontFamily).map((w) => (
                          <SelectItem key={w.value} value={String(w.value)}>
                            {w.label} ({w.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Text Style</Label>
                    <div className="flex gap-1 mt-2">
                      {(() => {
                        // When editing (cursor or selection), read per-character style at cursor position.
                        // This ensures buttons reflect the actual style of the text under the cursor,
                        // not the object-level default. Works like Word/Canva.
                        const editing = isTextEditing();
                        const selWeight = editing ? getSelectionStyle('fontWeight') : undefined;
                        const selStyle = editing ? getSelectionStyle('fontStyle') : undefined;
                        const selUnderline = editing ? getSelectionStyle('underline') : undefined;
                        // Normalize bold check: fontWeight can be 'bold', 'normal', 700, '700', 400, '400'
                        const isBoldWeight = (w: unknown) => String(w) === '700' || String(w) === 'bold';
                        const currentBold = selWeight !== undefined
                          ? isBoldWeight(selWeight)
                          : isBoldWeight(elementProps.fontWeight);
                        const currentItalic = selStyle !== undefined
                          ? selStyle === 'italic'
                          : elementProps.fontStyle === 'italic';
                        const currentUnderline = selUnderline !== undefined
                          ? !!selUnderline
                          : elementProps.underline;
                        return (
                          <>
                            <Button
                              variant={currentBold ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const newWeight = currentBold ? 'normal' : 'bold';
                                applyTextStyle({ fontWeight: newWeight });
                                // Always update state to trigger re-render (picks up per-char changes)
                                setElementProps(prev => ({ ...prev, fontWeight: hasTextSelection() ? prev.fontWeight : newWeight }));
                              }}
                            >
                              <Bold className="w-3 h-3" />
                            </Button>
                            <Button
                              variant={currentItalic ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const newStyle = currentItalic ? 'normal' : 'italic';
                                applyTextStyle({ fontStyle: newStyle });
                                setElementProps(prev => ({ ...prev, fontStyle: hasTextSelection() ? prev.fontStyle : newStyle }));
                              }}
                            >
                              <Italic className="w-3 h-3" />
                            </Button>
                            <Button
                              variant={currentUnderline ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const newUnderline = !currentUnderline;
                                applyTextStyle({ underline: newUnderline });
                                setElementProps(prev => ({ ...prev, underline: hasTextSelection() ? prev.underline : newUnderline }));
                              }}
                            >
                              <Underline className="w-3 h-3" />
                            </Button>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Text Alignment</Label>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant={elementProps.textAlign === 'left' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateElement({ textAlign: 'left' })}
                      >
                        <AlignLeft className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={elementProps.textAlign === 'center' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateElement({ textAlign: 'center' })}
                      >
                        <AlignCenter className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={elementProps.textAlign === 'right' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateElement({ textAlign: 'right' })}
                      >
                        <AlignRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              {/* Icon Color (for icon images only) */}
              {isIconElement && (
                <div>
                  <Label className="text-xs text-muted-foreground">Icon Color</Label>
                  <div className="mt-2">
                    <div className="flex gap-2 items-center mb-2">
                      <input
                        type="color"
                        value={iconColor}
                        onChange={(e) => updateIconColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={iconColor}
                        onChange={(e) => updateIconColor(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 shrink-0"
                        onClick={() => addBrandColor(iconColor)}
                        title="Save color"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {brandColors && brandColors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {brandColors.map((color) => (
                          <button
                            key={`brand-${color}`}
                            className={cn(
                              "w-5 h-5 rounded border-2 border-dashed border-cyan-400/60 hover:scale-110 transition-transform relative group/swatch",
                              iconColor === color && "ring-2 ring-cyan-500 ring-offset-1"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => updateIconColor(color)}
                          >
                            <span
                              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-white text-[8px] leading-3 text-center opacity-0 group-hover/swatch:opacity-100 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); removeBrandColor(color); }}
                            >
                              x
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          className={cn(
                            "w-5 h-5 rounded border border-border hover:scale-110 transition-transform",
                            iconColor === color && "ring-2 ring-cyan-500 ring-offset-1"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => updateIconColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Frame Controls */}
              {isFrameElement && (
                <div>
                  <Label className="text-xs text-muted-foreground">Frame</Label>
                  {isEmptyFrame && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Drop an image on this frame to fill it
                    </p>
                  )}
                  {isFilledFrame && (
                    <div className="mt-2 space-y-2">
                      <p className="text-[10px] text-muted-foreground">
                        Double-click to reposition image inside frame
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => {
                          if (selectedElement) {
                            canvasRef.current?.clearFrameImage(selectedElement);
                          }
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Fill (for text and shapes, not images, icons, or frames) */}
              {!isImageElement && !isIconElement && !isFrameElement && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isTextElement ? 'Text Color' : 'Fill'}
                  </Label>

                  {/* Solid / Gradient toggle */}
                  <div className="flex gap-1 mt-2 mb-3">
                    <Button
                      variant={fillType === 'solid' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => {
                        setFillType('solid');
                        const solidColor = gradientColor1 || elementProps.fill;
                        updateElement({ fill: solidColor });
                      }}
                    >
                      Solid
                    </Button>
                    <Button
                      variant={fillType === 'gradient' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => {
                        setFillType('gradient');
                        applyGradientFill(gradientColor1, gradientColor2, gradientAngle);
                      }}
                    >
                      Gradient
                    </Button>
                  </div>

                  {fillType === 'solid' ? (
                    <div>
                      <div className="flex gap-2 items-center mb-2">
                        <input
                          type="color"
                          value={elementProps.fill}
                          onChange={(e) => {
                            if (hasTextSelection()) {
                              applyTextStyle({ fill: e.target.value });
                              setElementProps(prev => ({ ...prev, fill: e.target.value }));
                            } else {
                              updateElement({ fill: e.target.value });
                            }
                          }}
                          className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={elementProps.fill}
                          onChange={(e) => {
                            if (hasTextSelection()) {
                              applyTextStyle({ fill: e.target.value });
                              setElementProps(prev => ({ ...prev, fill: e.target.value }));
                            } else {
                              updateElement({ fill: e.target.value });
                            }
                          }}
                          className="h-8 text-xs flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 shrink-0"
                          onClick={() => addBrandColor(elementProps.fill)}
                          title="Save color"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      {brandColors && brandColors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {brandColors.map((color) => (
                            <button
                              key={`brand-${color}`}
                              className={cn(
                                "w-5 h-5 rounded border-2 border-dashed border-cyan-400/60 hover:scale-110 transition-transform relative group/swatch",
                                elementProps.fill === color && "ring-2 ring-cyan-500 ring-offset-1"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                if (hasTextSelection()) {
                                  applyTextStyle({ fill: color });
                                  setElementProps(prev => ({ ...prev, fill: color }));
                                } else {
                                  updateElement({ fill: color });
                                }
                              }}
                            >
                              <span
                                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-white text-[8px] leading-3 text-center opacity-0 group-hover/swatch:opacity-100 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); removeBrandColor(color); }}
                              >
                                x
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            className={cn(
                              "w-5 h-5 rounded border border-border hover:scale-110 transition-transform",
                              elementProps.fill === color && "ring-2 ring-cyan-500 ring-offset-1"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              if (hasTextSelection()) {
                                applyTextStyle({ fill: color });
                                setElementProps(prev => ({ ...prev, fill: color }));
                              } else {
                                updateElement({ fill: color });
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Start Color */}
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Start Color</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={gradientColor1}
                            onChange={(e) => applyGradientFill(e.target.value, gradientColor2, gradientAngle)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={gradientColor1}
                            onChange={(e) => applyGradientFill(e.target.value, gradientColor2, gradientAngle)}
                            className="h-8 text-xs flex-1"
                          />
                        </div>
                      </div>
                      {/* End Color */}
                      <div>
                        <Label className="text-[10px] text-muted-foreground">End Color</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={gradientColor2}
                            onChange={(e) => applyGradientFill(gradientColor1, e.target.value, gradientAngle)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={gradientColor2}
                            onChange={(e) => applyGradientFill(gradientColor1, e.target.value, gradientAngle)}
                            className="h-8 text-xs flex-1"
                          />
                        </div>
                      </div>
                      {/* Angle */}
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Angle</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Slider
                            value={[gradientAngle]}
                            onValueChange={([val]) => applyGradientFill(gradientColor1, gradientColor2, val)}
                            max={360}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-8">
                            {gradientAngle}°
                          </span>
                        </div>
                      </div>
                      {/* Gradient preview */}
                      <div
                        className="h-6 rounded border border-border"
                        style={{
                          background: `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`,
                        }}
                      />
                      {/* Preset gradients */}
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Presets</Label>
                        <div className="grid grid-cols-3 gap-1 mt-1">
                          {GRADIENT_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              className="h-6 rounded border border-border hover:scale-105 transition-transform"
                              style={{ background: preset.value }}
                              onClick={() => {
                                const match = preset.value.match(/linear-gradient\((\d+)deg,\s*(#[a-fA-F0-9]{6})\s*\d*%?,\s*(#[a-fA-F0-9]{6})\s*\d*%?\)/);
                                if (match) {
                                  applyGradientFill(match[2], match[3], parseInt(match[1], 10));
                                }
                              }}
                              title={preset.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stroke (for shapes only, not images, text, or frames) */}
              {!isTextElement && !isImageElement && !isFrameElement && (
                <div>
                  <Label className="text-xs text-muted-foreground">Stroke</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={elementProps.stroke || '#000000'}
                        onChange={(e) => updateElement({ stroke: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                      <Input
                        type="number"
                        value={elementProps.strokeWidth}
                        onChange={(e) => updateElement({ strokeWidth: Number(e.target.value) })}
                        className="h-8 text-xs w-16"
                        min={0}
                        max={20}
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Border Radius (for rectangles only) */}
              {isShapeElement && selectedElement?.type === 'rect' && (() => {
                const normalizeRect = () => {
                  if (!selectedElement) return;
                  if (selectedElement.scaleX !== 1 || selectedElement.scaleY !== 1) {
                    const w = (selectedElement.width || 200) * (selectedElement.scaleX || 1);
                    const h = (selectedElement.height || 200) * (selectedElement.scaleY || 1);
                    selectedElement.set('width', w);
                    selectedElement.set('height', h);
                    selectedElement.set('scaleX', 1);
                    selectedElement.set('scaleY', 1);
                    setElementProps(prev => ({ ...prev, width: Math.round(w), height: Math.round(h) }));
                  }
                };
                const borderRadiusMax = 200;

                const applyUniformRadius = (val: number) => {
                  if (!selectedElement) return;
                  const canvas = canvasRef.current?.getCanvas();
                  if (!canvas) return;
                  normalizeRect();
                  const clamped = Math.max(0, Math.min(val, borderRadiusMax));
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const el = selectedElement as any;
                  // Clear per-corner when using uniform
                  delete el.radiusTL;
                  delete el.radiusTR;
                  delete el.radiusBR;
                  delete el.radiusBL;
                  // Use set() to mark object as dirty so Fabric invalidates cache
                  selectedElement.set({ rx: clamped, ry: clamped } as Record<string, unknown>);
                  selectedElement.setCoords();
                  canvas.renderAll();
                  setElementProps(prev => ({ ...prev, rx: clamped, radiusTL: undefined, radiusTR: undefined, radiusBR: undefined, radiusBL: undefined }));
                };

                const applyCornerRadius = (corner: 'radiusTL' | 'radiusTR' | 'radiusBR' | 'radiusBL', val: number) => {
                  if (!selectedElement) return;
                  const canvas = canvasRef.current?.getCanvas();
                  if (!canvas) return;
                  normalizeRect();
                  const clamped = Math.max(0, Math.min(val, borderRadiusMax));
                  // Use set() for all props - custom corner props are registered in Rect.cacheProperties
                  selectedElement.set({ [corner]: clamped, rx: 0, ry: 0 } as Record<string, unknown>);
                  selectedElement.setCoords();
                  canvas.renderAll();
                  setElementProps(prev => ({ ...prev, rx: 0, [corner]: clamped }));
                };

                const switchToPerCorner = () => {
                  if (!selectedElement) return;
                  const canvas = canvasRef.current?.getCanvas();
                  if (!canvas) return;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const currentR = (selectedElement as any).rx || 0;
                  selectedElement.set({ radiusTL: currentR, radiusTR: currentR, radiusBR: currentR, radiusBL: currentR, rx: 0, ry: 0 } as Record<string, unknown>);
                  canvas.renderAll();
                  setPerCornerMode(true);
                  setElementProps(prev => ({ ...prev, rx: 0, radiusTL: currentR, radiusTR: currentR, radiusBR: currentR, radiusBL: currentR }));
                };

                const switchToUniform = () => {
                  if (!selectedElement) return;
                  const canvas = canvasRef.current?.getCanvas();
                  if (!canvas) return;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const el = selectedElement as any;
                  const avg = Math.round(((el.radiusTL || 0) + (el.radiusTR || 0) + (el.radiusBR || 0) + (el.radiusBL || 0)) / 4);
                  // Clear per-corner props and set uniform via set() for proper cache invalidation
                  delete el.radiusTL;
                  delete el.radiusTR;
                  delete el.radiusBR;
                  delete el.radiusBL;
                  selectedElement.set({ rx: avg, ry: avg } as Record<string, unknown>);
                  canvas.renderAll();
                  setPerCornerMode(false);
                  setElementProps(prev => ({ ...prev, rx: avg, radiusTL: undefined, radiusTR: undefined, radiusBR: undefined, radiusBL: undefined }));
                };

                return (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Border Radius</Label>
                      <button
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded transition-colors",
                          perCornerMode
                            ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
                            : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                        onClick={perCornerMode ? switchToUniform : switchToPerCorner}
                        title={perCornerMode ? "Switch to uniform radius" : "Switch to per-corner radius"}
                      >
                        {perCornerMode ? "Uniform" : "Per corner"}
                      </button>
                    </div>

                    {!perCornerMode ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[elementProps.rx]}
                          onValueChange={([val]) => applyUniformRadius(val)}
                          max={borderRadiusMax}
                          step={1}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          value={elementProps.rx}
                          onChange={(e) => applyUniformRadius(Number(e.target.value))}
                          className="h-8 text-xs w-16 shrink-0 rounded-md border border-input bg-background px-2 text-center focus:outline-none focus:ring-2 focus:ring-ring"
                          min={0}
                          max={borderRadiusMax}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {([
                          ['radiusTL', 'TL'] as const,
                          ['radiusTR', 'TR'] as const,
                          ['radiusBL', 'BL'] as const,
                          ['radiusBR', 'BR'] as const,
                        ]).map(([key, label]) => (
                          <div key={key} className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground w-5">{label}</span>
                            <input
                              type="number"
                              value={elementProps[key] ?? 0}
                              onChange={(e) => applyCornerRadius(key, Number(e.target.value))}
                              className="h-7 text-xs w-full rounded-md border border-input bg-background px-2 text-center focus:outline-none focus:ring-2 focus:ring-ring"
                              min={0}
                              max={borderRadiusMax}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Shadow */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Shadow</Label>
                  <button
                    className={cn(
                      "w-8 h-4 rounded-full transition-colors relative",
                      shadowEnabled ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                    onClick={() => {
                      const newEnabled = !shadowEnabled;
                      setShadowEnabled(newEnabled);
                      if (!selectedElement) return;
                      const canvas = canvasRef.current?.getCanvas();
                      if (!canvas) return;
                      if (newEnabled) {
                        selectedElement.shadow = new Shadow({
                          color: shadowColor,
                          blur: shadowBlur,
                          offsetX: shadowOffsetX,
                          offsetY: shadowOffsetY,
                        });
                      } else {
                        selectedElement.shadow = null;
                      }
                      canvas.renderAll();
                    }}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                      shadowEnabled ? "translate-x-4" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
                {shadowEnabled && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={shadowColor.startsWith('rgba') ? '#000000' : shadowColor}
                        onChange={(e) => {
                          const color = e.target.value;
                          setShadowColor(color);
                          if (!selectedElement) return;
                          const canvas = canvasRef.current?.getCanvas();
                          if (!canvas) return;
                          selectedElement.shadow = new Shadow({ color, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY });
                          canvas.renderAll();
                        }}
                        className="w-6 h-6 rounded cursor-pointer border-0"
                      />
                      <span className="text-[10px] text-muted-foreground">Color</span>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Blur</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[shadowBlur]}
                          onValueChange={([val]) => {
                            setShadowBlur(val);
                            if (!selectedElement) return;
                            const canvas = canvasRef.current?.getCanvas();
                            if (!canvas) return;
                            selectedElement.shadow = new Shadow({ color: shadowColor, blur: val, offsetX: shadowOffsetX, offsetY: shadowOffsetY });
                            canvas.renderAll();
                          }}
                          max={50}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-6 text-right">{shadowBlur}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Offset X</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[shadowOffsetX]}
                          onValueChange={([val]) => {
                            setShadowOffsetX(val);
                            if (!selectedElement) return;
                            const canvas = canvasRef.current?.getCanvas();
                            if (!canvas) return;
                            selectedElement.shadow = new Shadow({ color: shadowColor, blur: shadowBlur, offsetX: val, offsetY: shadowOffsetY });
                            canvas.renderAll();
                          }}
                          min={-50}
                          max={50}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-6 text-right">{shadowOffsetX}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Offset Y</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[shadowOffsetY]}
                          onValueChange={([val]) => {
                            setShadowOffsetY(val);
                            if (!selectedElement) return;
                            const canvas = canvasRef.current?.getCanvas();
                            if (!canvas) return;
                            selectedElement.shadow = new Shadow({ color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: val });
                            canvas.renderAll();
                          }}
                          min={-50}
                          max={50}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-6 text-right">{shadowOffsetY}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Opacity */}
              <div>
                <Label className="text-xs text-muted-foreground">Opacity</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Slider
                    value={[elementProps.opacity * 100]}
                    onValueChange={([value]) => updateElement({ opacity: value / 100 })}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {Math.round(elementProps.opacity * 100)}%
                  </span>
                </div>
              </div>

              {/* Image Filters */}
              {isImageElement && (
                <div>
                  <Label className="text-xs text-muted-foreground">Filters</Label>
                  <div className="mt-2 space-y-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Blur</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[Math.round(filterBlur * 100)]}
                          onValueChange={([val]) => {
                            const v = val / 100;
                            setFilterBlur(v);
                            applyImageFilters({ blur: v });
                          }}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(filterBlur * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Brightness</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[Math.round(filterBrightness * 100)]}
                          onValueChange={([val]) => {
                            const v = val / 100;
                            setFilterBrightness(v);
                            applyImageFilters({ brightness: v });
                          }}
                          min={-100}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(filterBrightness * 100)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Contrast</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[Math.round(filterContrast * 100)]}
                          onValueChange={([val]) => {
                            const v = val / 100;
                            setFilterContrast(v);
                            applyImageFilters({ contrast: v });
                          }}
                          min={-100}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(filterContrast * 100)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Saturation</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[Math.round(filterSaturation * 100)]}
                          onValueChange={([val]) => {
                            const v = val / 100;
                            setFilterSaturation(v);
                            applyImageFilters({ saturation: v });
                          }}
                          min={-100}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(filterSaturation * 100)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Hue Rotation</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[Math.round(filterHueRotation * 100)]}
                          onValueChange={([val]) => {
                            const v = val / 100;
                            setFilterHueRotation(v);
                            applyImageFilters({ hueRotation: v });
                          }}
                          min={-100}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(filterHueRotation * 100)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <button
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            filterGrayscale ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-700"
                          )}
                          onClick={() => {
                            const v = !filterGrayscale;
                            setFilterGrayscale(v);
                            applyImageFilters({ grayscale: v });
                          }}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                            filterGrayscale ? "translate-x-4" : "translate-x-0.5"
                          )} />
                        </button>
                        <span className="text-[10px] text-muted-foreground">Grayscale</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <button
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            filterInvert ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-700"
                          )}
                          onClick={() => {
                            const v = !filterInvert;
                            setFilterInvert(v);
                            applyImageFilters({ invert: v });
                          }}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                            filterInvert ? "translate-x-4" : "translate-x-0.5"
                          )} />
                        </button>
                        <span className="text-[10px] text-muted-foreground">Invert</span>
                      </label>
                    </div>
                    {(filterBlur > 0 || filterBrightness !== 0 || filterContrast !== 0 || filterSaturation !== 0 || filterHueRotation !== 0 || filterGrayscale || filterInvert) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => {
                          setFilterBlur(0);
                          setFilterBrightness(0);
                          setFilterContrast(0);
                          setFilterSaturation(0);
                          setFilterHueRotation(0);
                          setFilterGrayscale(false);
                          setFilterInvert(false);
                          applyImageFilters({ blur: 0, brightness: 0, contrast: 0, saturation: 0, hueRotation: 0, grayscale: false, invert: false });
                        }}
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Position & Size */}
              <div>
                <Label className="text-xs text-muted-foreground">Position</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">X</Label>
                    <Input
                      type="number"
                      value={elementProps.left}
                      onChange={(e) => updateElement({ left: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Y</Label>
                    <Input
                      type="number"
                      value={elementProps.top}
                      onChange={(e) => updateElement({ top: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Width</Label>
                    <Input
                      type="number"
                      value={elementProps.width}
                      onChange={(e) => updateElement({ width: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Height</Label>
                    <Input
                      type="number"
                      value={elementProps.height}
                      onChange={(e) => updateElement({ height: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Rotation</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    value={elementProps.angle}
                    onChange={(e) => updateElement({ angle: Number(e.target.value) })}
                    className="h-8 text-xs flex-1"
                    min={-360}
                    max={360}
                  />
                  <span className="text-xs text-muted-foreground">°</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateElement({ angle: 0 })}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Canvas Background Settings */}
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <div className="mt-2">
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => {
                        setBackgroundColor(e.target.value);
                        onBackgroundChange?.('solid', e.target.value);
                      }}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={(e) => {
                        setBackgroundColor(e.target.value);
                        onBackgroundChange?.('solid', e.target.value);
                      }}
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 shrink-0"
                      onClick={() => addBrandColor(backgroundColor)}
                      title="Save color"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {brandColors && brandColors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {brandColors.map((color) => (
                        <button
                          key={`brand-${color}`}
                          className={cn(
                            "w-5 h-5 rounded border-2 border-dashed border-cyan-400/60 hover:scale-110 transition-transform relative group/swatch",
                            backgroundColor === color && "ring-2 ring-cyan-500 ring-offset-1"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setBackgroundColor(color);
                            onBackgroundChange?.('solid', color);
                          }}
                        >
                          <span
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-white text-[8px] leading-3 text-center opacity-0 group-hover/swatch:opacity-100 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); removeBrandColor(color); }}
                          >
                            x
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          "w-5 h-5 rounded border border-border hover:scale-110 transition-transform",
                          backgroundColor === color && "ring-2 ring-cyan-500 ring-offset-1"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setBackgroundColor(color);
                          onBackgroundChange?.('solid', color);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground">Gradient Presets</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {GRADIENT_PRESETS.map((gradient) => (
                    <button
                      key={gradient.label}
                      className="h-10 rounded border border-border hover:scale-105 transition-transform"
                      style={{ background: gradient.value }}
                      onClick={() => onBackgroundChange?.('gradient', gradient.value)}
                      title={gradient.label}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  Click an element on the canvas to edit its properties
                </p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
