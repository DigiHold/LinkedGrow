"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  Type,
  List,
  Quote,
  BarChart3,
  Megaphone,
  Sparkles,
  ImageIcon,
  Upload,
  Trash2,
  Palette,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlideData } from "./slide-canvas";
import type { SlideType } from "@/lib/carousel-templates";

interface SlideEditorProps {
  slide: SlideData;
  onSlideChange: (slide: SlideData) => void;
  onGenerateBackground: () => void;
  onDeleteSlide: () => void;
  isGeneratingBackground: boolean;
  canDelete: boolean;
  hasImageApiKey: boolean;
  className?: string;
}

const slideTypes: { type: SlideType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'hook', label: 'Hook', icon: Zap, description: 'Attention-grabbing first slide' },
  { type: 'content', label: 'Content', icon: Type, description: 'Standard content slide' },
  { type: 'list', label: 'List', icon: List, description: 'Bullet or numbered list' },
  { type: 'quote', label: 'Quote', icon: Quote, description: 'Quote with attribution' },
  { type: 'stat', label: 'Stat', icon: BarChart3, description: 'Big number with label' },
  { type: 'cta', label: 'CTA', icon: Megaphone, description: 'Call-to-action slide' },
];

export function SlideEditor({
  slide,
  onSlideChange,
  onGenerateBackground,
  onDeleteSlide,
  isGeneratingBackground,
  canDelete,
  hasImageApiKey,
  className,
}: SlideEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (type: SlideType) => {
    onSlideChange({ ...slide, type });
  };

  const handleFieldChange = (field: keyof SlideData, value: string | boolean | string[]) => {
    onSlideChange({ ...slide, [field]: value });
  };

  const handleBackgroundTypeChange = (backgroundType: SlideData['backgroundType']) => {
    onSlideChange({
      ...slide,
      backgroundType,
      backgroundImageUrl: backgroundType === 'template' ? undefined : slide.backgroundImageUrl,
      backgroundColor: backgroundType === 'custom-color' ? (slide.backgroundColor || '#1a1a2e') : undefined,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // Convert to data URL for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSlideChange({
        ...slide,
        backgroundType: 'custom-upload',
        backgroundImageUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = () => {
    onSlideChange({
      ...slide,
      backgroundType: 'template',
      backgroundImageUrl: undefined,
      backgroundColor: undefined,
    });
  };

  // Render content fields based on slide type
  const renderContentFields = () => {
    switch (slide.type) {
      case 'stat':
        return (
          <>
            <div>
              <Label className="text-xs">Big Number</Label>
              <Input
                value={slide.statNumber || slide.title}
                onChange={(e) => handleFieldChange('statNumber', e.target.value)}
                placeholder="95%"
                className="mt-1 text-lg font-bold"
              />
            </div>
            <div>
              <Label className="text-xs">Label</Label>
              <Input
                value={slide.statLabel || slide.content}
                onChange={(e) => handleFieldChange('statLabel', e.target.value)}
                placeholder="of professionals agree"
                className="mt-1"
              />
            </div>
          </>
        );

      case 'quote':
        return (
          <>
            <div>
              <Label className="text-xs">Quote</Label>
              <Textarea
                value={slide.quote || slide.content}
                onChange={(e) => handleFieldChange('quote', e.target.value)}
                placeholder="Your inspiring quote here..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs">Author (optional)</Label>
              <Input
                value={slide.quoteAuthor || ""}
                onChange={(e) => handleFieldChange('quoteAuthor', e.target.value)}
                placeholder="Author Name"
                className="mt-1"
              />
            </div>
          </>
        );

      case 'list':
        return (
          <>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={slide.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Key Takeaways"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">List Items (one per line)</Label>
              <Textarea
                value={slide.bulletPoints?.join('\n') || slide.content}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  handleFieldChange('bulletPoints', lines);
                  handleFieldChange('content', e.target.value);
                }}
                placeholder="First point&#10;Second point&#10;Third point"
                className="mt-1"
                rows={5}
              />
            </div>
          </>
        );

      case 'hook':
      case 'cta':
      case 'content':
      default:
        return (
          <>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={slide.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder={slide.type === 'hook' ? "Your Hook Headline" : slide.type === 'cta' ? "Ready to Start?" : "Slide Title"}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Content</Label>
              <Textarea
                value={slide.content}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                placeholder={slide.type === 'cta' ? "Follow for more insights" : "Your content here..."}
                className="mt-1"
                rows={3}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Slide Type Selector */}
      <div>
        <Label className="text-xs mb-2 block">Slide Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {slideTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                "border",
                slide.type === type
                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300"
                  : "border-border hover:border-cyan-300 hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Fields */}
      <div className="space-y-3">
        {renderContentFields()}
      </div>

      {/* Background Section */}
      <div className="pt-4 border-t border-border">
        <Label className="text-xs mb-2 block">Background</Label>
        <div className="space-y-3">
          {/* Background type selector */}
          <div className="flex gap-2">
            <Button
              variant={slide.backgroundType === 'template' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBackgroundTypeChange('template')}
              className={cn(
                "flex-1 h-8",
                slide.backgroundType === 'template' && "bg-cyan-600 hover:bg-cyan-700"
              )}
            >
              <Palette className="w-3 h-3 mr-1" />
              Template
            </Button>
            <Button
              variant={slide.backgroundType === 'custom-color' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBackgroundTypeChange('custom-color')}
              className={cn(
                "flex-1 h-8",
                slide.backgroundType === 'custom-color' && "bg-cyan-600 hover:bg-cyan-700"
              )}
            >
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 mr-1" />
              Color
            </Button>
            <Button
              variant={slide.backgroundType === 'custom-upload' || slide.backgroundType === 'ai-image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex-1 h-8",
                (slide.backgroundType === 'custom-upload' || slide.backgroundType === 'ai-image') && "bg-cyan-600 hover:bg-cyan-700"
              )}
            >
              <ImageIcon className="w-3 h-3 mr-1" />
              Image
            </Button>
          </div>

          {/* Custom color picker */}
          {slide.backgroundType === 'custom-color' && (
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={slide.backgroundColor || "#1a1a2e"}
                onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
                className="w-10 h-8 rounded cursor-pointer border-0"
              />
              <Input
                value={slide.backgroundColor || ""}
                onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
                placeholder="#1a1a2e"
                className="h-8 text-sm flex-1"
              />
            </div>
          )}

          {/* Image preview and actions */}
          {(slide.backgroundType === 'custom-upload' || slide.backgroundType === 'ai-image') && slide.backgroundImageUrl && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={slide.backgroundImageUrl}
                alt="Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Replace
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveBackground}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Upload and generate buttons */}
          {(slide.backgroundType === 'template' || !slide.backgroundImageUrl) && slide.backgroundType !== 'custom-color' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-9"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              {hasImageApiKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerateBackground}
                  disabled={isGeneratingBackground}
                  className="flex-1 h-9"
                >
                  {isGeneratingBackground ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  AI Generate
                </Button>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Advanced Options */}
      <div className="pt-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 p-3 bg-muted/30 rounded-lg">
            {/* Show branding toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Branding</Label>
              <Switch
                checked={slide.showBranding}
                onCheckedChange={(checked) => handleFieldChange('showBranding', checked)}
              />
            </div>

            {/* Show progress bar toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Progress</Label>
              <Switch
                checked={slide.showProgressBar}
                onCheckedChange={(checked) => handleFieldChange('showProgressBar', checked)}
              />
            </div>

            {/* Custom accent color */}
            <div>
              <Label className="text-xs mb-1 block">Custom Accent Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={slide.customAccentColor || "#0891b2"}
                  onChange={(e) => handleFieldChange('customAccentColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
                <Input
                  value={slide.customAccentColor || ""}
                  onChange={(e) => handleFieldChange('customAccentColor', e.target.value)}
                  placeholder="Template default"
                  className="h-8 text-xs flex-1"
                />
                {slide.customAccentColor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFieldChange('customAccentColor', '')}
                    className="h-8 px-2"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete slide */}
      {canDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteSlide}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Slide
        </Button>
      )}
    </div>
  );
}
