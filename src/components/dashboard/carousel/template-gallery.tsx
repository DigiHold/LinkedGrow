"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Check,
  Lock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  carouselTemplates,
  templateCategories,
  type CarouselTemplate,
  type TemplateCategory,
} from "@/lib/carousel-templates";

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplateId: string;
  onSelectTemplate: (template: CarouselTemplate) => void;
  userPlan?: 'free' | 'starter' | 'pro' | 'business';
}

export function TemplateGallery({
  open,
  onOpenChange,
  selectedTemplateId,
  onSelectTemplate,
  userPlan = 'pro',
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const canUsePremium = userPlan === 'business';

  const filteredTemplates = selectedCategory === 'all'
    ? carouselTemplates
    : carouselTemplates.filter(t => t.category === selectedCategory);

  const handleSelectTemplate = (template: CarouselTemplate) => {
    if (template.isPremium && !canUsePremium) return;
    onSelectTemplate(template);
    onOpenChange(false);
  };

  // Render a mini preview of the template
  const renderTemplatePreview = (template: CarouselTemplate) => {
    const isSelected = template.id === selectedTemplateId;
    const isHovered = hoveredTemplate === template.id;
    const isLocked = template.isPremium && !canUsePremium;

    // Get background style
    const getPreviewBackground = () => {
      if (template.colors.backgroundSecondary) {
        const direction = template.colors.gradientDirection === 'to-br' ? '135deg' :
                          template.colors.gradientDirection === 'to-r' ? '90deg' : '180deg';
        return `linear-gradient(${direction}, ${template.colors.background}, ${template.colors.backgroundSecondary})`;
      }
      return template.colors.background;
    };

    return (
      <button
        key={template.id}
        onClick={() => handleSelectTemplate(template)}
        onMouseEnter={() => setHoveredTemplate(template.id)}
        onMouseLeave={() => setHoveredTemplate(null)}
        disabled={isLocked}
        className={cn(
          "relative aspect-[4/5] rounded-lg overflow-hidden transition-all duration-200 group",
          "border-2",
          isSelected ? "border-cyan-500 ring-2 ring-cyan-500/20" : "border-transparent",
          isHovered && !isLocked ? "scale-105 shadow-lg" : "",
          isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-md"
        )}
        style={{ background: getPreviewBackground() }}
      >
        {/* Template preview content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
          {/* Decorative elements preview */}
          {template.elements.hasDecorativeElements && template.elements.decorativeStyle === 'geometric' && (
            <div
              className="absolute top-0 right-0 w-6 h-6 opacity-20"
              style={{
                backgroundColor: template.colors.accent,
                clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
              }}
            />
          )}

          {/* Title preview */}
          <div
            className="text-xs font-bold text-center leading-tight mb-1"
            style={{ color: template.colors.text }}
          >
            Title
          </div>

          {/* Accent line */}
          {template.layouts.hook.hasAccentShape && template.layouts.hook.accentShapeType === 'underline' && (
            <div
              className="w-4 h-0.5 rounded-full mb-1"
              style={{ backgroundColor: template.colors.accent }}
            />
          )}

          {/* Content preview */}
          <div
            className="text-[8px] text-center opacity-70"
            style={{ color: template.colors.textSecondary }}
          >
            Content here
          </div>

          {/* Progress dots preview */}
          {template.elements.showProgressBar && template.elements.progressBarStyle === 'dots' && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: template.colors.text,
                    opacity: i === 0 ? 1 : 0.4
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Premium lock */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Premium badge */}
        {template.isPremium && !isLocked && (
          <div className="absolute top-1.5 left-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
        )}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600" />
            Choose a Template
          </DialogTitle>
        </DialogHeader>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap py-2 border-b">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "h-8",
              selectedCategory === 'all' && "bg-cyan-600 hover:bg-cyan-700"
            )}
          >
            All ({carouselTemplates.length})
          </Button>
          {templateCategories.map((category) => {
            const count = carouselTemplates.filter(t => t.category === category.id).length;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "h-8",
                  selectedCategory === category.id && "bg-cyan-600 hover:bg-cyan-700"
                )}
              >
                {category.name} ({count})
              </Button>
            );
          })}
        </div>

        {/* Templates grid */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
            {filteredTemplates.map(renderTemplatePreview)}
          </div>

          {/* Premium notice */}
          {!canUsePremium && filteredTemplates.some(t => t.isPremium) && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Premium Templates</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upgrade to Business plan to unlock all premium templates with advanced designs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected template info */}
        {selectedTemplateId && (
          <div className="pt-4 border-t flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">
                {carouselTemplates.find(t => t.id === selectedTemplateId)?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {carouselTemplates.find(t => t.id === selectedTemplateId)?.description}
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Use Template
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Compact template selector for inline use
interface TemplateSelectProps {
  selectedTemplateId: string;
  onSelectTemplate: (template: CarouselTemplate) => void;
  onOpenGallery: () => void;
  className?: string;
}

export function TemplateSelect({
  selectedTemplateId,
  onSelectTemplate,
  onOpenGallery,
  className,
}: TemplateSelectProps) {
  const selectedTemplate = carouselTemplates.find(t => t.id === selectedTemplateId);

  // Show first 5 templates as quick options
  const quickTemplates = carouselTemplates.slice(0, 5);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Template</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenGallery}
          className="h-7 text-xs"
        >
          Browse All
        </Button>
      </div>

      <div className="flex gap-2">
        {quickTemplates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          const getPreviewBackground = () => {
            if (template.colors.backgroundSecondary) {
              const direction = template.colors.gradientDirection === 'to-br' ? '135deg' :
                                template.colors.gradientDirection === 'to-r' ? '90deg' : '180deg';
              return `linear-gradient(${direction}, ${template.colors.background}, ${template.colors.backgroundSecondary})`;
            }
            return template.colors.background;
          };

          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={cn(
                "w-10 h-12 rounded-lg transition-all",
                "border-2",
                isSelected ? "border-cyan-500 ring-2 ring-cyan-500/20 scale-105" : "border-transparent hover:border-slate-300"
              )}
              style={{ background: getPreviewBackground() }}
              title={template.name}
            />
          );
        })}
        <button
          onClick={onOpenGallery}
          className="w-10 h-12 rounded-lg border-2 border-dashed border-slate-300 hover:border-cyan-500 flex items-center justify-center transition-colors"
        >
          <span className="text-xs text-muted-foreground">+{carouselTemplates.length - 5}</span>
        </button>
      </div>

      {selectedTemplate && (
        <p className="text-xs text-muted-foreground">
          {selectedTemplate.name} - {selectedTemplate.description}
        </p>
      )}
    </div>
  );
}
