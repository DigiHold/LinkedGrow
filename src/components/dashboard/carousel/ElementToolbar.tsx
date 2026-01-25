"use client";

import { useState } from "react";
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
import type { BrandingData } from "./slide-canvas";

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

    try {
      const url = await onImageUpload(file);
      await canvasRef.current?.addImage(url);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
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
    },
    {
      id: 'subheading',
      label: 'Subheading',
      icon: <Heading2 className="w-4 h-4" />,
      action: () => handleAddText({ text: 'Subheading text', fontSize: 48, fontWeight: '600' }),
    },
    {
      id: 'body',
      label: 'Body Text',
      icon: <AlignLeft className="w-4 h-4" />,
      action: () => handleAddText({ text: 'Add your body text here. This is a longer paragraph that you can edit.', fontSize: 32, fontWeight: 'normal' }),
    },
    {
      id: 'quote',
      label: 'Quote',
      icon: <Quote className="w-4 h-4" />,
      action: () => handleAddText({ text: '"Your inspiring quote goes here"', fontSize: 40, fontWeight: '500' }),
    },
  ];

  const shapeElements: ToolItem[] = [
    {
      id: 'rectangle',
      label: 'Rectangle',
      icon: <Square className="w-4 h-4" />,
      action: () => handleAddShape('rect'),
    },
    {
      id: 'circle',
      label: 'Circle',
      icon: <Circle className="w-4 h-4" />,
      action: () => handleAddShape('circle'),
    },
    {
      id: 'line',
      label: 'Line',
      icon: <Minus className="w-4 h-4" />,
      action: () => handleAddShape('line'),
    },
  ];

  const iconElements: ToolItem[] = [
    {
      id: 'arrow',
      label: 'Arrow',
      icon: <ArrowRight className="w-4 h-4" />,
      action: () => handleAddText({ text: '→', fontSize: 64, fontWeight: 'bold' }),
    },
    {
      id: 'checkmark',
      label: 'Checkmark',
      icon: <CheckCircle2 className="w-4 h-4" />,
      action: () => handleAddText({ text: '✓', fontSize: 64, fontWeight: 'bold' }),
    },
    {
      id: 'star',
      label: 'Star',
      icon: <Star className="w-4 h-4" />,
      action: () => handleAddText({ text: '★', fontSize: 64, fontWeight: 'normal' }),
    },
    {
      id: 'heart',
      label: 'Heart',
      icon: <Heart className="w-4 h-4" />,
      action: () => handleAddText({ text: '♥', fontSize: 64, fontWeight: 'normal' }),
    },
    {
      id: 'lightning',
      label: 'Lightning',
      icon: <Zap className="w-4 h-4" />,
      action: () => handleAddText({ text: '⚡', fontSize: 64, fontWeight: 'normal' }),
    },
    {
      id: 'target',
      label: 'Target',
      icon: <Target className="w-4 h-4" />,
      action: () => handleAddText({ text: '◎', fontSize: 64, fontWeight: 'normal' }),
    },
    {
      id: 'bulb',
      label: 'Idea',
      icon: <Lightbulb className="w-4 h-4" />,
      action: () => handleAddText({ text: '💡', fontSize: 64, fontWeight: 'normal' }),
    },
    {
      id: 'trending',
      label: 'Trending',
      icon: <TrendingUp className="w-4 h-4" />,
      action: () => handleAddText({ text: '📈', fontSize: 64, fontWeight: 'normal' }),
    },
    {
      id: 'trophy',
      label: 'Trophy',
      icon: <Award className="w-4 h-4" />,
      action: () => handleAddText({ text: '🏆', fontSize: 64, fontWeight: 'normal' }),
    },
  ];

  const brandingElements: ToolItem[] = [
    {
      id: 'logo',
      label: 'Logo',
      icon: <ImageIcon className="w-4 h-4" />,
      action: () => handleAddBrandingElement('logo'),
    },
    {
      id: 'avatar',
      label: 'Profile Picture',
      icon: <User className="w-4 h-4" />,
      action: () => handleAddBrandingElement('avatar'),
    },
    {
      id: 'handle',
      label: 'Handle',
      icon: <AtSign className="w-4 h-4" />,
      action: () => handleAddBrandingElement('handle'),
    },
    {
      id: 'website',
      label: 'Website',
      icon: <Globe className="w-4 h-4" />,
      action: () => handleAddBrandingElement('website'),
    },
  ];

  return (
    <div className={cn("w-64 bg-background border-r flex flex-col", className)}>
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Elements</h2>
        <p className="text-xs text-muted-foreground mt-1">Click to add to canvas</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Text Elements */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Text
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {textElements.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 flex flex-col gap-1 hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950"
                  onClick={item.action}
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Images */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Images
            </h3>
            <div className="space-y-2">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
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

              {onAIImageGenerate && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Describe your image..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-md bg-background"
                    onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-auto py-3 flex flex-col gap-1 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-950"
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span className="text-xs">
                      {isGenerating ? 'Generating...' : 'AI Generate'}
                    </span>
                  </Button>
                </div>
              )}
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
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 flex flex-col gap-1 hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950"
                  onClick={item.action}
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </Button>
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
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2.5 flex flex-col gap-0.5 hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950"
                  onClick={item.action}
                >
                  {item.icon}
                  <span className="text-[10px]">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Branding */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Branding
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {brandingElements.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 flex flex-col gap-1 hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950"
                  onClick={item.action}
                  disabled={
                    (item.id === 'logo' && !branding?.logoUrl) ||
                    (item.id === 'avatar' && !branding?.avatarUrl)
                  }
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
            {(!branding?.logoUrl || !branding?.avatarUrl) && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Configure branding in the right panel
              </p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
