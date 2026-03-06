"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layers,
  Check,
  User,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  carouselTemplates,
  templateCategories,
  type CarouselTemplate,
  type TemplateCategory,
} from "@/lib/carousel-templates";

// User saved template type
interface UserTemplate {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  canvasJson: string;
  category: string;
  createdAt: string;
}

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplateId: string;
  onSelectTemplate: (template: CarouselTemplate) => void;
  onLoadUserTemplate?: (canvasJson: string) => void;
}

export function TemplateGallery({
  open,
  onOpenChange,
  selectedTemplateId,
  onSelectTemplate,
  onLoadUserTemplate,
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preset' | 'saved'>('preset');
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isLoadingUserTemplates, setIsLoadingUserTemplates] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const filteredTemplates = selectedCategory === 'all'
    ? carouselTemplates
    : carouselTemplates.filter(t => t.category === selectedCategory);

  // Fetch user templates when dialog opens
  useEffect(() => {
    if (open && activeTab === 'saved') {
      fetchUserTemplates();
    }
  }, [open, activeTab]);

  const fetchUserTemplates = async () => {
    setIsLoadingUserTemplates(true);
    try {
      const response = await fetch('/api/user/templates');
      if (response.ok) {
        const data = await response.json();
        setUserTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch user templates:', error);
    } finally {
      setIsLoadingUserTemplates(false);
    }
  };

  const handleDeleteUserTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setDeletingTemplateId(id);
    try {
      const response = await fetch(`/api/user/templates/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setUserTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handleSelectTemplate = (template: CarouselTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  const handleLoadUserTemplate = (template: UserTemplate) => {
    if (onLoadUserTemplate) {
      onLoadUserTemplate(template.canvasJson);
      onOpenChange(false);
    }
  };

  // Get background style from template
  const getPreviewBackground = (template: CarouselTemplate) => {
    return template.background.value;
  };

  // Canvas dimensions for scaling
  const CW = 1080;
  const CH = 1350;

  // Convert canvas coords to percentage
  const px = (v: number) => `${(v / CW) * 100}%`;
  const py = (v: number) => `${(v / CH) * 100}%`;
  const pw = (v: number) => `${(v / CW) * 100}%`;
  const ph = (v: number) => `${(v / CH) * 100}%`;

  // Render each template element as a scaled miniature
  const renderElement = (el: CarouselTemplate['elements'][number], i: number) => {
    // Shape: circle
    if (el.type === 'shape' && el.shapeType === 'circle') {
      const w = el.width || 50;
      const h = el.height || w;
      return (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: px(el.left ?? 0),
            top: py(el.top ?? 0),
            width: pw(w),
            height: ph(h),
            backgroundColor: el.fill === 'transparent' ? 'transparent' : (el.fill || 'transparent'),
            opacity: el.opacity ?? 1,
            border: el.stroke ? `1px solid ${el.stroke}` : undefined,
          }}
        />
      );
    }

    // Shape: rectangle
    if (el.type === 'shape' && el.shapeType === 'rect') {
      const w = el.width || 50;
      const h = el.height || 50;
      const rx = el.rx ?? 0;
      // Scale border-radius proportionally (relative to smaller dimension)
      const scaledRx = rx > 0 ? Math.max(1, (rx / CW) * 100) : 0;
      return (
        <div
          key={i}
          className="absolute"
          style={{
            left: px(el.left ?? 0),
            top: py(el.top ?? 0),
            width: pw(w),
            height: ph(h),
            backgroundColor: el.fill === 'transparent' ? 'transparent' : (el.fill || 'transparent'),
            opacity: el.opacity ?? 1,
            borderRadius: scaledRx > 0 ? `${scaledRx}vw` : undefined,
            border: el.stroke ? `1px solid ${el.stroke}` : undefined,
          }}
        />
      );
    }

    // Text elements - render actual text scaled down
    if (el.type === 'text') {
      const text = el.text || '';
      const fontSize = el.fontSize || 24;
      const color = el.fill || '#000';
      const align = el.textAlign || 'left';
      const elementWidth = el.width || 400;
      const weight = typeof el.fontWeight === 'number' ? el.fontWeight :
        el.fontWeight === 'bold' ? 700 : el.fontWeight === 'normal' ? 400 :
        parseInt(String(el.fontWeight || '400'), 10) || 400;

      return (
        <div
          key={i}
          className="absolute overflow-hidden"
          style={{
            left: px(el.left ?? 0),
            top: py(el.top ?? 0),
            width: pw(elementWidth),
            opacity: el.opacity ?? 1,
          }}
        >
          <svg
            viewBox={`0 0 ${elementWidth} ${fontSize * 1.3 * text.split('\n').length}`}
            className="w-full"
            style={{ display: 'block' }}
          >
            {text.split('\n').map((line, li) => (
              <text
                key={li}
                x={align === 'center' ? elementWidth / 2 : align === 'right' ? elementWidth : 0}
                y={fontSize * 1.05 + li * fontSize * 1.25}
                fill={color}
                fontSize={fontSize}
                fontWeight={weight}
                fontFamily="Inter, system-ui, sans-serif"
                textAnchor={align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'}
              >
                {line}
              </text>
            ))}
          </svg>
        </div>
      );
    }

    return null;
  };

  // Render a mini preview showing actual template elements scaled down
  const renderTemplatePreview = (template: CarouselTemplate) => {
    const isSelected = template.id === selectedTemplateId;
    const isHovered = hoveredTemplate === template.id;

    return (
      <button
        key={template.id}
        onClick={() => handleSelectTemplate(template)}
        onMouseEnter={() => setHoveredTemplate(template.id)}
        onMouseLeave={() => setHoveredTemplate(null)}
        className={cn(
          "relative aspect-[4/5] rounded-lg overflow-hidden transition-all duration-200 group",
          "border-2",
          isSelected ? "border-cyan-500 ring-2 ring-cyan-500/20" : "border-transparent",
          isHovered ? "scale-105 shadow-lg" : "",
          "cursor-pointer hover:shadow-md"
        )}
        style={{ background: getPreviewBackground(template) }}
      >
        {/* Render actual template elements as scaled miniatures */}
        <div className="absolute inset-0">
          {template.elements.map(renderElement)}
        </div>

        {/* Template name tooltip on hover */}
        {isHovered && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 z-10">
            <p className="text-[8px] text-white font-medium truncate text-center">{template.name}</p>
          </div>
        )}

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center z-10">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </button>
    );
  };

  // Render user saved template preview
  const renderUserTemplatePreview = (template: UserTemplate) => {
    const isHovered = hoveredTemplate === `user-${template.id}`;
    const isDeleting = deletingTemplateId === template.id;

    return (
      <div
        key={template.id}
        className="relative"
        onMouseEnter={() => setHoveredTemplate(`user-${template.id}`)}
        onMouseLeave={() => setHoveredTemplate(null)}
      >
        <button
          onClick={() => handleLoadUserTemplate(template)}
          disabled={isDeleting}
          className={cn(
            "relative aspect-[4/5] rounded-lg overflow-hidden transition-all duration-200 w-full",
            "border-2 border-transparent",
            isHovered && !isDeleting ? "scale-105 shadow-lg" : "",
            isDeleting ? "opacity-50" : "cursor-pointer hover:shadow-md"
          )}
        >
          {template.thumbnail ? (
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Layers className="w-6 h-6 text-slate-400" />
            </div>
          )}

          {/* Template name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="text-[10px] text-white font-medium truncate">{template.name}</p>
          </div>

          {/* User badge */}
          <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
            <User className="w-2.5 h-2.5 text-white" />
          </div>
        </button>

        {/* Delete button - visible on hover */}
        {isHovered && !isDeleting && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteUserTemplate(template.id);
            }}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        )}

        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          </div>
        )}
      </div>
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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preset' | 'saved')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="preset">Preset Templates</TabsTrigger>
            <TabsTrigger value="saved">
              My Templates {userTemplates.length > 0 && `(${userTemplates.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="flex-1 flex flex-col overflow-hidden mt-0">
            {/* Category filters */}
            <div className="flex gap-2 flex-wrap py-2 border-b border-border">
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

            </div>
          </TabsContent>

          <TabsContent value="saved" className="flex-1 overflow-y-auto mt-0">
            {isLoadingUserTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
              </div>
            ) : userTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">No saved templates yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create a design you like and click "Save Template" to save it here for future use.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3 py-4">
                {userTemplates.map(renderUserTemplatePreview)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Selected template info */}
        {selectedTemplateId && activeTab === 'preset' && (
          <div className="pt-4 border-t border-border flex items-center justify-between">
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

  // Mini element preview for compact selector (shapes only - text too small)
  const renderMiniElements = (template: CarouselTemplate) => {
    const CW = 1080;
    const CH = 1350;
    return template.elements
      .filter(el => el.type === 'shape')
      .map((el, i) => {
        if (el.shapeType === 'circle') {
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${((el.left ?? 0) / CW) * 100}%`,
                top: `${((el.top ?? 0) / CH) * 100}%`,
                width: `${((el.width || 50) / CW) * 100}%`,
                height: `${((el.height || 50) / CH) * 100}%`,
                backgroundColor: el.fill === 'transparent' ? 'transparent' : (el.fill || 'transparent'),
                opacity: el.opacity ?? 1,
              }}
            />
          );
        }
        if (el.shapeType === 'rect') {
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${((el.left ?? 0) / CW) * 100}%`,
                top: `${((el.top ?? 0) / CH) * 100}%`,
                width: `${((el.width || 50) / CW) * 100}%`,
                height: `${((el.height || 50) / CH) * 100}%`,
                backgroundColor: el.fill === 'transparent' ? 'transparent' : (el.fill || 'transparent'),
                opacity: el.opacity ?? 1,
                borderRadius: el.rx ? '1px' : undefined,
              }}
            />
          );
        }
        return null;
      });
  };

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

          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={cn(
                "relative w-10 h-12 rounded-lg transition-all overflow-hidden",
                "border-2",
                isSelected ? "border-cyan-500 ring-2 ring-cyan-500/20 scale-105" : "border-transparent hover:border-slate-300"
              )}
              style={{ background: template.background.value }}
              title={template.name}
            >
              <div className="absolute inset-0">
                {renderMiniElements(template)}
              </div>
            </button>
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
