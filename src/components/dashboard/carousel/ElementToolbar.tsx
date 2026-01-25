"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Type,
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
  ArrowRight,
  CheckCircle2,
  Star,
  Heart,
  Zap,
  Target,
  Lightbulb,
  TrendingUp,
  Award,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasWorkspaceRef } from "./CanvasWorkspace";
import type { BrandingData } from "./types";

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

interface ToolSection {
  title: string;
  items: ToolItem[];
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
  }) => {
    canvasRef.current?.addText(options);
  };

  const handleAddShape = (type: 'rect' | 'circle' | 'line') => {
    canvasRef.current?.addShape(type);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    // Validate file type - support common web image formats
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
    // Reset input so same file can be uploaded again
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

  const handleAddBrandingElement = (type: 'logo' | 'avatar' | 'handle' | 'website') => {
    if (!branding) return;

    switch (type) {
      case 'logo':
        if (branding.logoUrl) {
          canvasRef.current?.addImage(branding.logoUrl);
        }
        break;
      case 'avatar':
        if (branding.avatarUrl) {
          canvasRef.current?.addImage(branding.avatarUrl);
        }
        break;
      case 'handle':
        canvasRef.current?.addText({
          text: branding.handle || '@yourhandle',
          fontSize: 32,
          fontWeight: 'normal',
        });
        break;
      case 'website':
        canvasRef.current?.addText({
          text: branding.website || 'yoursite.com',
          fontSize: 28,
          fontWeight: 'normal',
        });
        break;
    }
  };

  const textElements: ToolItem[] = [
    {
      id: 'heading',
      label: 'Heading',
      icon: <Heading1 className="w-4 h-4" />,
      action: () => handleAddText({ text: 'Your Heading', fontSize: 72, fontWeight: 'bold' }),
      dragData: { type: 'text', data: { text: 'Your Heading', fontSize: 72, fontWeight: 'bold' } },
    },
    {
      id: 'subheading',
      label: 'Subheading',
      icon: <Heading2 className="w-4 h-4" />,
      action: () => handleAddText({ text: 'Subheading text', fontSize: 48, fontWeight: '600' }),
      dragData: { type: 'text', data: { text: 'Subheading text', fontSize: 48, fontWeight: '600' } },
    },
    {
      id: 'body',
      label: 'Body Text',
      icon: <AlignLeft className="w-4 h-4" />,
      action: () => handleAddText({ text: 'Add your body text here. This is a longer paragraph that you can edit.', fontSize: 32, fontWeight: 'normal' }),
      dragData: { type: 'text', data: { text: 'Add your body text here.', fontSize: 32, fontWeight: 'normal' } },
    },
    {
      id: 'quote',
      label: 'Quote',
      icon: <Quote className="w-4 h-4" />,
      action: () => handleAddText({ text: '"Your inspiring quote goes here"', fontSize: 40, fontWeight: '500' }),
      dragData: { type: 'text', data: { text: '"Your inspiring quote goes here"', fontSize: 40, fontWeight: '500' } },
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

      // Set custom drag image with element label
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

  const iconElements: ToolItem[] = [
    {
      id: 'arrow',
      label: 'Arrow',
      icon: <ArrowRight className="w-4 h-4" />,
      action: () => handleAddText({ text: '→', fontSize: 64, fontWeight: 'bold' }),
      dragData: { type: 'text', data: { text: '→', fontSize: 64, fontWeight: 'bold' } },
    },
    {
      id: 'checkmark',
      label: 'Checkmark',
      icon: <CheckCircle2 className="w-4 h-4" />,
      action: () => handleAddText({ text: '✓', fontSize: 64, fontWeight: 'bold' }),
      dragData: { type: 'text', data: { text: '✓', fontSize: 64, fontWeight: 'bold' } },
    },
    {
      id: 'star',
      label: 'Star',
      icon: <Star className="w-4 h-4" />,
      action: () => handleAddText({ text: '★', fontSize: 64, fontWeight: 'normal' }),
      dragData: { type: 'text', data: { text: '★', fontSize: 64, fontWeight: 'normal' } },
    },
    {
      id: 'heart',
      label: 'Heart',
      icon: <Heart className="w-4 h-4" />,
      action: () => handleAddText({ text: '♥', fontSize: 64, fontWeight: 'normal' }),
      dragData: { type: 'text', data: { text: '♥', fontSize: 64, fontWeight: 'normal' } },
    },
    {
      id: 'lightning',
      label: 'Lightning',
      icon: <Zap className="w-4 h-4" />,
      action: () => handleAddText({ text: '⚡', fontSize: 64, fontWeight: 'normal' }),
      dragData: { type: 'text', data: { text: '⚡', fontSize: 64, fontWeight: 'normal' } },
    },
    {
      id: 'target',
      label: 'Target',
      icon: <Target className="w-4 h-4" />,
      action: () => handleAddText({ text: '◎', fontSize: 64, fontWeight: 'normal' }),
      dragData: { type: 'text', data: { text: '◎', fontSize: 64, fontWeight: 'normal' } },
    },
    {
      id: 'bulb',
      label: 'Idea',
      icon: <Lightbulb className="w-4 h-4" />,
      action: () => handleAddText({ text: '💡', fontSize: 64, fontWeight: 'normal' }),
      dragData: { type: 'text', data: { text: '💡', fontSize: 64, fontWeight: 'normal' } },
    },
    {
      id: 'trending',
      label: 'Trending',
      icon: <TrendingUp className="w-4 h-4" />,
      action: () => handleAddText({ text: '📈', fontSize: 64, fontWeight: 'normal' }),
      dragData: { type: 'text', data: { text: '📈', fontSize: 64, fontWeight: 'normal' } },
    },
    {
      id: 'trophy',
      label: 'Trophy',
      icon: <Award className="w-4 h-4" />,
      action: () => handleAddText({ text: '🏆', fontSize: 64, fontWeight: 'normal' }),
      dragData: { type: 'text', data: { text: '🏆', fontSize: 64, fontWeight: 'normal' } },
    },
  ];

  // Branding elements - handle and website are text, logo and avatar are images (need upload first)
  const handleDragData = branding?.handle
    ? { type: 'text', data: { text: branding.handle, fontSize: 32, fontWeight: 'normal' } }
    : { type: 'text', data: { text: '@yourhandle', fontSize: 32, fontWeight: 'normal' } };

  const websiteDragData = branding?.website
    ? { type: 'text', data: { text: branding.website, fontSize: 28, fontWeight: 'normal' } }
    : { type: 'text', data: { text: 'yoursite.com', fontSize: 28, fontWeight: 'normal' } };

  // Logo and avatar need image URL - they can be dragged if URL exists
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
        <p className="text-xs text-muted-foreground mt-1">Click to add to canvas</p>
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

              {/* AI Image Generation - separated visually */}
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
            <div className="grid grid-cols-3 gap-2">
              {iconElements.map((item) => (
                <button
                  key={item.id}
                  draggable={!!item.dragData}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onClick={item.action}
                  className={cn(
                    "h-auto py-2.5 flex flex-col items-center gap-0.5 rounded-md border border-input bg-background text-sm",
                    "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                    item.dragData && "cursor-grab active:cursor-grabbing",
                    "transition-all duration-150"
                  )}
                >
                  {item.icon}
                  <span className="text-[10px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Branding */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Branding
            </h3>
            <div className="space-y-2">
              {/* Logo - with upload option or draggable if exists */}
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

              {/* Avatar - with upload option or draggable if exists */}
              <div className="flex gap-2">
                {branding?.avatarUrl ? (
                  <button
                    draggable={!!avatarDragData}
                    onDragStart={(e) => {
                      if (avatarDragData) {
                        e.dataTransfer.setData('application/json', JSON.stringify(avatarDragData));
                        e.dataTransfer.effectAllowed = 'copy';
                        if (dragImageRef.current) {
                          dragImageRef.current.textContent = 'Avatar';
                          e.dataTransfer.setDragImage(dragImageRef.current, 40, 20);
                        }
                        setIsDragging(true);
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAddBrandingElement('avatar')}
                    className={cn(
                      "flex-1 h-auto py-3 flex flex-col items-center gap-1 rounded-md border border-input bg-background text-sm",
                      "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                      "cursor-grab active:cursor-grabbing transition-all duration-150"
                    )}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-xs">Add Avatar</span>
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
                        <Upload className="w-4 h-4" />
                        <span className="text-xs">Upload Avatar</span>
                      </span>
                    </Button>
                  </label>
                )}
              </div>

              {/* Handle and Website - always draggable */}
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
