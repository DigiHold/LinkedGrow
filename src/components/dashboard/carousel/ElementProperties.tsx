"use client";

import { useState, useEffect, useCallback } from "react";
import { FabricObject, Textbox, FabricImage, Group } from "fabric";
import FontPicker from "react-fontpicker-ts";
import "react-fontpicker-ts/dist/index.css";
import { Button } from "@/components/ui/button";
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
  ChevronUp,
  ChevronDown,
  RotateCcw,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasWorkspaceRef } from "./CanvasWorkspace";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./CanvasWorkspace";

// Helper to check if an element is an SVG icon group
function isSvgIconGroup(element: FabricObject): boolean {
  // SVG icons are loaded as Groups from loadSVGFromString
  return element instanceof Group && element.type === 'group';
}

interface ElementPropertiesProps {
  selectedElement: FabricObject | null;
  canvasRef: React.RefObject<CanvasWorkspaceRef | null>;
  onBackgroundChange?: (type: 'solid' | 'gradient' | 'image', value: string) => void;
  updateTrigger?: number;
  className?: string;
}

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 128];

const PRESET_COLORS = [
  '#000000', '#ffffff', '#374151', '#6b7280', '#9ca3af',
  '#0891b2', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6',
];

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
    // Text-specific
    fontSize: 48,
    fontFamily: 'Inter',
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    textAlign: 'center',
  });

  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [iconColor, setIconColor] = useState('#000000');

  // Update local state when selection changes or element is being moved/scaled
  useEffect(() => {
    if (!selectedElement) return;

    const isTextbox = selectedElement instanceof Textbox;
    const textbox = isTextbox ? selectedElement as Textbox : null;

    setElementProps({
      fill: (selectedElement.fill as string) || '#000000',
      stroke: (selectedElement.stroke as string) || '',
      strokeWidth: selectedElement.strokeWidth || 0,
      opacity: selectedElement.opacity || 1,
      left: Math.round(selectedElement.left || 0),
      top: Math.round(selectedElement.top || 0),
      width: Math.round((selectedElement.width || 0) * (selectedElement.scaleX || 1)),
      height: Math.round((selectedElement.height || 0) * (selectedElement.scaleY || 1)),
      angle: Math.round(selectedElement.angle || 0),
      // Text-specific
      fontSize: textbox?.fontSize || 48,
      fontFamily: textbox?.fontFamily || 'Inter',
      fontWeight: String(textbox?.fontWeight || 'normal'),
      fontStyle: textbox?.fontStyle || 'normal',
      underline: textbox?.underline || false,
      textAlign: textbox?.textAlign || 'center',
    });
  }, [selectedElement, updateTrigger]);

  const updateElement = useCallback((updates: Partial<typeof elementProps>) => {
    if (!selectedElement) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    // Apply updates to the element
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'width') {
        const scale = (value as number) / (selectedElement.width || 1);
        selectedElement.set('scaleX', scale);
      } else if (key === 'height') {
        const scale = (value as number) / (selectedElement.height || 1);
        selectedElement.set('scaleY', scale);
      } else {
        selectedElement.set(key as keyof FabricObject, value);
      }
    });

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

  const handleSendBackward = () => {
    canvasRef.current?.sendBackward();
  };

  // Alignment functions - use getBoundingRect for accurate positioning
  const alignHorizontalCenter = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    // Get the bounding rect which accounts for scale, rotation, etc.
    const bound = selectedElement.getBoundingRect();
    const objWidth = bound.width;
    const currentLeft = selectedElement.left || 0;
    const boundLeft = bound.left;

    // Calculate offset between object's left and bound's left
    const offset = currentLeft - boundLeft;
    const newLeft = (CANVAS_WIDTH - objWidth) / 2 + offset;

    selectedElement.set('left', newLeft);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, left: Math.round(newLeft) }));
  }, [selectedElement, canvasRef]);

  const alignVerticalCenter = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const bound = selectedElement.getBoundingRect();
    const objHeight = bound.height;
    const currentTop = selectedElement.top || 0;
    const boundTop = bound.top;

    const offset = currentTop - boundTop;
    const newTop = (CANVAS_HEIGHT - objHeight) / 2 + offset;

    selectedElement.set('top', newTop);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, top: Math.round(newTop) }));
  }, [selectedElement, canvasRef]);

  const alignToLeft = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const bound = selectedElement.getBoundingRect();
    const currentLeft = selectedElement.left || 0;
    const boundLeft = bound.left;

    // Move so the left edge of the bounding box is at 0
    const offset = currentLeft - boundLeft;
    const newLeft = offset;

    selectedElement.set('left', newLeft);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, left: Math.round(newLeft) }));
  }, [selectedElement, canvasRef]);

  const alignToRight = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const bound = selectedElement.getBoundingRect();
    const objWidth = bound.width;
    const currentLeft = selectedElement.left || 0;
    const boundLeft = bound.left;

    // Move so the right edge of the bounding box is at CANVAS_WIDTH
    const offset = currentLeft - boundLeft;
    const newLeft = CANVAS_WIDTH - objWidth + offset;

    selectedElement.set('left', newLeft);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, left: Math.round(newLeft) }));
  }, [selectedElement, canvasRef]);

  const alignToTop = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const bound = selectedElement.getBoundingRect();
    const currentTop = selectedElement.top || 0;
    const boundTop = bound.top;

    // Move so the top edge of the bounding box is at 0
    const offset = currentTop - boundTop;
    const newTop = offset;

    selectedElement.set('top', newTop);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, top: Math.round(newTop) }));
  }, [selectedElement, canvasRef]);

  const alignToBottom = useCallback(() => {
    if (!selectedElement) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const bound = selectedElement.getBoundingRect();
    const objHeight = bound.height;
    const currentTop = selectedElement.top || 0;
    const boundTop = bound.top;

    // Move so the bottom edge of the bounding box is at CANVAS_HEIGHT
    const offset = currentTop - boundTop;
    const newTop = CANVAS_HEIGHT - objHeight + offset;

    selectedElement.set('top', newTop);
    selectedElement.setCoords();
    canvas.renderAll();
    setElementProps(prev => ({ ...prev, top: Math.round(newTop) }));
  }, [selectedElement, canvasRef]);

  const isTextElement = selectedElement instanceof Textbox;
  const isImageElement = selectedElement instanceof FabricImage;
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

  return (
    <div className={cn("w-72 bg-background border-l flex flex-col h-full overflow-hidden", className)}>
      <div className="p-4 border-b shrink-0">
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

              {/* Layer Order */}
              <div>
                <Label className="text-xs text-muted-foreground">Layer Order</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBringForward}
                    className="flex-1"
                  >
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Forward
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendBackward}
                    className="flex-1"
                  >
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Backward
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
                      <FontPicker
                        autoLoad
                        defaultValue={elementProps.fontFamily || 'Inter'}
                        value={(font) => {
                          if (font && font !== elementProps.fontFamily) {
                            updateElement({ fontFamily: font });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Font Size</Label>
                    <Select
                      value={String(elementProps.fontSize)}
                      onValueChange={(value) => updateElement({ fontSize: Number(value) })}
                    >
                      <SelectTrigger className="mt-2 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size}px
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Text Style</Label>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant={elementProps.fontWeight === 'bold' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateElement({
                          fontWeight: elementProps.fontWeight === 'bold' ? 'normal' : 'bold'
                        })}
                      >
                        <Bold className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={elementProps.fontStyle === 'italic' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateElement({
                          fontStyle: elementProps.fontStyle === 'italic' ? 'normal' : 'italic'
                        })}
                      >
                        <Italic className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={elementProps.underline ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateElement({ underline: !elementProps.underline })}
                      >
                        <Underline className="w-3 h-3" />
                      </Button>
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
                    </div>
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

              {/* Color (for text and shapes, not images) */}
              {!isImageElement && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isTextElement ? 'Text Color' : 'Fill Color'}
                  </Label>
                  <div className="mt-2">
                    <div className="flex gap-2 items-center mb-2">
                      <input
                        type="color"
                        value={elementProps.fill}
                        onChange={(e) => updateElement({ fill: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={elementProps.fill}
                        onChange={(e) => updateElement({ fill: e.target.value })}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          className={cn(
                            "w-5 h-5 rounded border border-border hover:scale-110 transition-transform",
                            elementProps.fill === color && "ring-2 ring-cyan-500 ring-offset-1"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => updateElement({ fill: color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stroke (for shapes only, not images or text) */}
              {!isTextElement && !isImageElement && (
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
                  </div>
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
