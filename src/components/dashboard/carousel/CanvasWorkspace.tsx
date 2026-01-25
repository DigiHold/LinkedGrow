"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Canvas, FabricObject, Textbox, Rect, Circle, Line, FabricImage, Gradient } from "fabric";
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

export interface CanvasWorkspaceRef {
  addText: (options?: Partial<TextOptions>) => void;
  addShape: (shapeType: 'rect' | 'circle' | 'line') => void;
  addImage: (url: string) => Promise<void>;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  setBackground: (type: 'solid' | 'gradient' | 'image', value: string) => void;
  exportToDataURL: () => string;
  exportToJSON: () => string;
  loadFromJSON: (json: string) => void;
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
}

interface CanvasWorkspaceProps {
  onSelectionChange?: (element: FabricObject | null) => void;
  onCanvasChange?: () => void;
  zoom?: number;
  className?: string;
}

export const CanvasWorkspace = forwardRef<CanvasWorkspaceRef, CanvasWorkspaceProps>(
  ({ onSelectionChange, onCanvasChange, zoom = 0.4, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

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

      // Enable center guidelines
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
      });

      // Selection events
      canvas.on('selection:created', (e) => {
        onSelectionChange?.(e.selected?.[0] || null);
      });

      canvas.on('selection:updated', (e) => {
        onSelectionChange?.(e.selected?.[0] || null);
      });

      canvas.on('selection:cleared', () => {
        onSelectionChange?.(null);
      });

      // Track changes
      canvas.on('object:modified', () => {
        saveHistory();
        onCanvasChange?.();
      });

      canvas.on('object:added', () => {
        saveHistory();
        onCanvasChange?.();
      });

      canvas.on('object:removed', () => {
        saveHistory();
        onCanvasChange?.();
      });

      fabricRef.current = canvas;
      setIsReady(true);

      // Initial history state
      saveHistory();

      return () => {
        canvas.dispose();
        fabricRef.current = null;
      };
    }, [onSelectionChange, onCanvasChange, saveHistory]);

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
          width: 400,
          fontSize: options.fontSize ?? 48,
          fontFamily: options.fontFamily ?? 'Inter',
          fontWeight: options.fontWeight ?? 'normal',
          fill: options.fill ?? '#000000',
          textAlign: options.textAlign ?? 'center',
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

      addImage: async (url: string) => {
        if (!fabricRef.current) return;

        try {
          const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });

          // Scale image to fit nicely
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
            // Convert angle to coordinates
            const angleRad = (parsed.angle - 90) * Math.PI / 180;
            const coords = {
              x1: 0.5 - Math.cos(angleRad) * 0.5,
              y1: 0.5 - Math.sin(angleRad) * 0.5,
              x2: 0.5 + Math.cos(angleRad) * 0.5,
              y2: 0.5 + Math.sin(angleRad) * 0.5,
            };

            // Create gradient rectangle as background
            const gradientRect = new Rect({
              left: 0,
              top: 0,
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              selectable: false,
              evented: false,
              excludeFromExport: false,
            });

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

            // Remove any existing gradient background (first non-selectable rect)
            const objects = fabricRef.current.getObjects();
            const existingBgRect = objects.find(obj =>
              obj instanceof Rect && !obj.selectable && obj.width === CANVAS_WIDTH && obj.height === CANVAS_HEIGHT
            );
            if (existingBgRect) {
              fabricRef.current.remove(existingBgRect);
            }

            // Add gradient rect at the bottom
            fabricRef.current.insertAt(0, gradientRect);
            fabricRef.current.backgroundColor = '#ffffff'; // Fallback
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
              selectable: false,
              evented: false,
            });
            fabricRef.current!.backgroundImage = img;
            fabricRef.current!.renderAll();
          });
        }
        fabricRef.current.renderAll();
        saveHistory();
        onCanvasChange?.();
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
        return JSON.stringify(fabricRef.current.toJSON());
      },

      loadFromJSON: (json: string) => {
        if (!fabricRef.current) return;

        fabricRef.current.loadFromJSON(JSON.parse(json)).then(() => {
          fabricRef.current!.renderAll();
          onCanvasChange?.();
        });
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
          onCanvasChange?.();
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
          onCanvasChange?.();
        });
      },

      getCanvas: () => fabricRef.current,

      clearCanvas: () => {
        if (!fabricRef.current) return;
        fabricRef.current.clear();
        fabricRef.current.backgroundColor = '#ffffff';
        fabricRef.current.renderAll();
        saveHistory();
        onCanvasChange?.();
      },
    }), [saveHistory, onCanvasChange]);

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

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800",
          "flex items-center justify-center",
          className
        )}
      >
        {/* Canvas container with checkerboard pattern for transparency */}
        <div
          className="relative shadow-2xl"
          style={{
            width: CANVAS_WIDTH * zoom,
            height: CANVAS_HEIGHT * zoom,
          }}
        >
          <canvas ref={canvasRef} />
        </div>

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
