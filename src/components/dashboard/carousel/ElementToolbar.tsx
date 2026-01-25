"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  Upload,
  Sparkles,
  User,
  Globe,
  AtSign,
  Heading1,
  Heading2,
  AlignLeft,
  Quote,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasWorkspaceRef } from "./CanvasWorkspace";
import type { BrandingData } from "./types";
import { IconPicker, QuickIcons, getIconById } from "./IconPicker";

interface ElementToolbarProps {
  canvasRef: React.RefObject<CanvasWorkspaceRef | null>;
  branding?: BrandingData;
  onImageUpload?: (file: File) => Promise<string>;
  onAIImageGenerate?: (prompt: string) => Promise<string>;
  className?: string;
}

interface ToolItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  dragData?: { type: string; data: Record<string, unknown> };
}

export function ElementToolbar({
  canvasRef,
  branding,
  onImageUpload,
  onAIImageGenerate,
  className,
}: ElementToolbarProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  // Create custom drag image element on mount
  useEffect(() => {
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: white;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(dragImage);
    dragImageRef.current = dragImage;

    return () => {
      if (dragImageRef.current) {
        document.body.removeChild(dragImageRef.current);
      }
    };
  }, []);

  const handleAddText = (options: {
    text?: string;
    fontSize?: number;
    fontWeight?: string | number;
    fill?: string;
  }) => {
    canvasRef.current?.addText({
      ...options,
      fill: options.fill || '#000000',
    });
  };

  const handleAddShape = (type: 'rect' | 'circle' | 'line') => {
    canvasRef.current?.addShape(type);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be less than 10MB');
      return;
    }

    try {
      const url = await onImageUpload(file);
      await canvasRef.current?.addImage(url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    }
    e.target.value = '';
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || !onAIImageGenerate) return;

    setIsGenerating(true);
    try {
      const url = await onAIImageGenerate(aiPrompt);
      await canvasRef.current?.addImage(url);
      setAiPrompt("");
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddBrandingElement = async (type: 'logo' | 'avatar' | 'handle' | 'website') => {
    if (!branding) return;

    switch (type) {
      case 'logo':
        if (branding.logoUrl) {
          try {
            await canvasRef.current?.addImage(branding.logoUrl);
          } catch (error) {
            console.error('Failed to add logo:', error);
            alert('Failed to add logo. The image might not be accessible.');
          }
        }
        break;
      case 'avatar':
        if (branding.avatarUrl) {
          try {
            await canvasRef.current?.addImage(branding.avatarUrl);
          } catch (error) {
            console.error('Failed to add avatar:', error);
            alert('Failed to add avatar. LinkedIn profile images may have access restrictions. Try uploading a custom avatar instead.');
          }
        } else {
          alert('No avatar URL available. Please upload a custom avatar.');
        }
        break;
      case 'handle':
        canvasRef.current?.addText({
          text: branding.handle || '@yourhandle',
          fontSize: 32,
          fontWeight: 'normal',
          fill: '#000000',
        });
        break;
      case 'website':
        canvasRef.current?.addText({
          text: branding.website || 'yoursite.com',
          fontSize: 28,
          fontWeight: 'normal',
          fill: '#000000',
        });
        break;
    }
  };

  // Determine if background is dark (for icon color selection)
  const getIconColor = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return '#000000';

    // Get background color
    const bgColor = canvas.backgroundColor as string || '#ffffff';

    // If it's a gradient rect, try to get the first color
    const objects = canvas.getObjects();
    const bgRect = objects.find(obj =>
      !obj.selectable && obj.left === 0 && obj.top === 0
    );

    let colorToCheck = bgColor;
    if (bgRect && bgRect.fill) {
      // For gradients, check if fill has colorStops
      const fill = bgRect.fill;
      if (typeof fill === 'object' && 'colorStops' in fill) {
        // Get average color from gradient
        const stops = fill.colorStops as Array<{ color: string }>;
        if (stops && stops.length > 0) {
          colorToCheck = stops[0].color;
        }
      } else if (typeof fill === 'string') {
        colorToCheck = fill;
      }
    }

    // Parse color to determine brightness
    let r = 255, g = 255, b = 255;
    if (colorToCheck.startsWith('#')) {
      const hex = colorToCheck.slice(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
    } else if (colorToCheck.startsWith('rgb')) {
      const match = colorToCheck.match(/\d+/g);
      if (match && match.length >= 3) {
        r = parseInt(match[0]);
        g = parseInt(match[1]);
        b = parseInt(match[2]);
      }
    }

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return white for dark backgrounds, black for light backgrounds
    return luminance < 0.5 ? '#ffffff' : '#000000';
  }, [canvasRef]);

  // Handle adding icon to canvas as actual SVG
  const handleAddIcon = useCallback(async (
    IconComponent: React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
    iconName: string
  ) => {
    if (!canvasRef.current) return;

    // Get appropriate icon color based on background
    const iconColor = getIconColor();

    // Render the icon to SVG string
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Use ReactDOM to render the icon
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);

    // Create a promise to wait for render
    await new Promise<void>((resolve) => {
      root.render(
        <IconComponent
          className="w-24 h-24"
          style={{ width: 96, height: 96, color: iconColor }}
        />
      );
      // Give React time to render
      setTimeout(resolve, 50);
    });

    // Get the SVG element
    const svgElement = container.querySelector('svg');
    if (svgElement) {
      // Ensure SVG has proper attributes for rendering
      svgElement.setAttribute('width', '96');
      svgElement.setAttribute('height', '96');
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Convert SVG to data URL
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      try {
        await canvasRef.current.addImage(url);
      } catch (error) {
        console.error('Failed to add icon:', error);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    // Cleanup
    root.unmount();
    document.body.removeChild(container);
  }, [canvasRef, getIconColor]);

  // Listen for icon drop events from canvas
  useEffect(() => {
    const handleIconDrop = async (event: Event) => {
      const customEvent = event as CustomEvent<{ iconId: string; iconName: string; x: number; y: number }>;
      const { iconId, iconName } = customEvent.detail;

      // Get the icon component by ID
      const iconItem = getIconById(iconId);
      if (iconItem) {
        await handleAddIcon(iconItem.icon, iconName);
      }
    };

    window.addEventListener('iconDrop', handleIconDrop);
    return () => window.removeEventListener('iconDrop', handleIconDrop);
  }, [handleAddIcon]);

  const textElements: ToolItem[] = [
    {
      id: 'heading',
      label: 'Heading',
      icon: <Heading1 className="w-4 h-4" />,
      action: () => handleAddText({ text: 'Your Heading', fontSize: 72, fontWeight: 'bold' }),
      dragData: { type: 'text', data: { text: 'Your Heading', fontSize: 72, fontWeight: 'bold', fill: '#000000' } },
    },
    {
      id: 'subheading',
      label: 'Subheading',
      icon: <Heading2 className="w-4 h-4" />,
      action: () => handleAddText({ text: 'Subheading text', fontSize: 48, fontWeight: '600' }),
      dragData: { type: 'text', data: { text: 'Subheading text', fontSize: 48, fontWeight: '600', fill: '#000000' } },
    },
    {
      id: 'body',
      label: 'Body Text',
      icon: <AlignLeft className="w-4 h-4" />,
      action: () => handleAddText({ text: 'Add your body text here.', fontSize: 32, fontWeight: 'normal' }),
      dragData: { type: 'text', data: { text: 'Add your body text here.', fontSize: 32, fontWeight: 'normal', fill: '#000000' } },
    },
    {
      id: 'quote',
      label: 'Quote',
      icon: <Quote className="w-4 h-4" />,
      action: () => handleAddText({ text: '"Your inspiring quote"', fontSize: 40, fontWeight: '500' }),
      dragData: { type: 'text', data: { text: '"Your inspiring quote"', fontSize: 40, fontWeight: '500', fill: '#000000' } },
    },
  ];

  const shapeElements: ToolItem[] = [
    {
      id: 'rectangle',
      label: 'Rectangle',
      icon: <Square className="w-4 h-4" />,
      action: () => handleAddShape('rect'),
      dragData: { type: 'shape', data: { shapeType: 'rect' } },
    },
    {
      id: 'circle',
      label: 'Circle',
      icon: <Circle className="w-4 h-4" />,
      action: () => handleAddShape('circle'),
      dragData: { type: 'shape', data: { shapeType: 'circle' } },
    },
    {
      id: 'line',
      label: 'Line',
      icon: <Minus className="w-4 h-4" />,
      action: () => handleAddShape('line'),
      dragData: { type: 'shape', data: { shapeType: 'line' } },
    },
  ];

  // Handle drag start with custom drag image
  const handleDragStart = useCallback((e: React.DragEvent, item: ToolItem) => {
    if (item.dragData) {
      e.dataTransfer.setData('application/json', JSON.stringify(item.dragData));
      e.dataTransfer.effectAllowed = 'copy';

      if (dragImageRef.current) {
        dragImageRef.current.textContent = item.label;
        e.dataTransfer.setDragImage(dragImageRef.current, 40, 20);
      }

      setIsDragging(true);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Branding elements drag data
  const handleDragData = branding?.handle
    ? { type: 'text', data: { text: branding.handle, fontSize: 32, fontWeight: 'normal', fill: '#000000' } }
    : { type: 'text', data: { text: '@yourhandle', fontSize: 32, fontWeight: 'normal', fill: '#000000' } };

  const websiteDragData = branding?.website
    ? { type: 'text', data: { text: branding.website, fontSize: 28, fontWeight: 'normal', fill: '#000000' } }
    : { type: 'text', data: { text: 'yoursite.com', fontSize: 28, fontWeight: 'normal', fill: '#000000' } };

  const logoDragData = branding?.logoUrl
    ? { type: 'image', data: { url: branding.logoUrl } }
    : undefined;

  const avatarDragData = branding?.avatarUrl
    ? { type: 'image', data: { url: branding.avatarUrl } }
    : undefined;

  return (
    <div className={cn("w-64 bg-background border-r flex flex-col h-full overflow-hidden", className)}>
      <div className="p-4 border-b shrink-0">
        <h2 className="font-semibold text-sm">Elements</h2>
        <p className="text-xs text-muted-foreground mt-1">Click or drag to add</p>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="p-4 space-y-6">
          {/* Text Elements */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Text
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {textElements.map((item) => (
                <button
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onClick={item.action}
                  className={cn(
                    "h-auto py-3 flex flex-col items-center gap-1 rounded-md border border-input bg-background text-sm",
                    "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                    "cursor-grab active:cursor-grabbing transition-all duration-150"
                  )}
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Images */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Images
            </h3>
            <div className="space-y-3">
              {/* Upload Image */}
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-auto py-3 flex flex-col gap-1 hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs">Upload Image</span>
                  </span>
                </Button>
              </label>

              {/* AI Image Generation */}
              <div className="pt-2 border-t border-dashed">
                <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Image Generator
                </p>
                <div className="space-y-2">
                  <textarea
                    placeholder="Describe the image you want to generate..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-md bg-background resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && onAIImageGenerate) {
                        e.preventDefault();
                        handleAIGenerate();
                      }
                    }}
                    disabled={!onAIImageGenerate}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-auto py-2.5 flex items-center justify-center gap-2 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-950"
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim() || !onAIImageGenerate}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span className="text-xs">
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </span>
                  </Button>
                  {!onAIImageGenerate && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      Configure Image AI API key in settings
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Shapes */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Shapes
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {shapeElements.map((item) => (
                <button
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onClick={item.action}
                  className={cn(
                    "h-auto py-3 flex flex-col items-center gap-1 rounded-md border border-input bg-background text-sm",
                    "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                    "cursor-grab active:cursor-grabbing transition-all duration-150"
                  )}
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Icons */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Icons
            </h3>

            {/* Quick Icons + Browse All */}
            <QuickIcons
              onSelectIcon={handleAddIcon}
              onOpenFullPicker={() => setShowIconPicker(true)}
              onDragIcon={(iconId, iconName, e) => {
                if (dragImageRef.current) {
                  dragImageRef.current.textContent = iconName;
                  e.dataTransfer.setDragImage(dragImageRef.current, 40, 20);
                }
              }}
            />

            {/* Full Icon Picker Dialog - controlled externally */}
            <IconPicker
              onSelectIcon={(icon, name) => {
                handleAddIcon(icon, name);
                setShowIconPicker(false);
              }}
              open={showIconPicker}
              onOpenChange={setShowIconPicker}
            />
          </div>

          <Separator />

          {/* Branding */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Branding
            </h3>
            <div className="space-y-2">
              {/* Logo */}
              <div className="flex gap-2">
                {branding?.logoUrl ? (
                  <button
                    draggable={!!logoDragData}
                    onDragStart={(e) => {
                      if (logoDragData) {
                        e.dataTransfer.setData('application/json', JSON.stringify(logoDragData));
                        e.dataTransfer.effectAllowed = 'copy';
                        if (dragImageRef.current) {
                          dragImageRef.current.textContent = 'Logo';
                          e.dataTransfer.setDragImage(dragImageRef.current, 40, 20);
                        }
                        setIsDragging(true);
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAddBrandingElement('logo')}
                    className={cn(
                      "flex-1 h-auto py-3 flex flex-col items-center gap-1 rounded-md border border-input bg-background text-sm",
                      "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                      "cursor-grab active:cursor-grabbing transition-all duration-150"
                    )}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs">Add Logo</span>
                  </button>
                ) : (
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !onImageUpload) return;
                        try {
                          const url = await onImageUpload(file);
                          await canvasRef.current?.addImage(url);
                        } catch (error) {
                          console.error('Failed to upload logo:', error);
                        }
                        e.target.value = '';
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-auto py-3 flex flex-col gap-1 hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4" />
                        <span className="text-xs">Upload Logo</span>
                      </span>
                    </Button>
                  </label>
                )}
              </div>

              {/* Avatar - always show upload option since LinkedIn images often fail */}
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !onImageUpload) return;
                      try {
                        const url = await onImageUpload(file);
                        await canvasRef.current?.addImage(url);
                      } catch (error) {
                        console.error('Failed to upload avatar:', error);
                      }
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-auto py-3 flex flex-col gap-1 hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950"
                    asChild
                  >
                    <span>
                      <User className="w-4 h-4" />
                      <span className="text-xs">Upload Avatar</span>
                    </span>
                  </Button>
                </label>
              </div>

              {/* Handle and Website */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(handleDragData));
                    e.dataTransfer.effectAllowed = 'copy';
                    if (dragImageRef.current) {
                      dragImageRef.current.textContent = 'Handle';
                      e.dataTransfer.setDragImage(dragImageRef.current, 40, 20);
                    }
                    setIsDragging(true);
                  }}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAddBrandingElement('handle')}
                  className={cn(
                    "h-auto py-3 flex flex-col items-center gap-1 rounded-md border border-input bg-background text-sm",
                    "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                    "cursor-grab active:cursor-grabbing transition-all duration-150"
                  )}
                >
                  <AtSign className="w-4 h-4" />
                  <span className="text-xs">Handle</span>
                </button>
                <button
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(websiteDragData));
                    e.dataTransfer.effectAllowed = 'copy';
                    if (dragImageRef.current) {
                      dragImageRef.current.textContent = 'Website';
                      e.dataTransfer.setDragImage(dragImageRef.current, 40, 20);
                    }
                    setIsDragging(true);
                  }}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAddBrandingElement('website')}
                  className={cn(
                    "h-auto py-3 flex flex-col items-center gap-1 rounded-md border border-input bg-background text-sm",
                    "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                    "cursor-grab active:cursor-grabbing transition-all duration-150"
                  )}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-xs">Website</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
