"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { CarouselTemplate, SlideType } from "@/lib/carousel-templates";

export interface SlideData {
  id: string;
  type: SlideType;
  title: string;
  content: string;
  bulletPoints?: string[];
  quote?: string;
  quoteAuthor?: string;
  statNumber?: string;
  statLabel?: string;
  backgroundType: 'template' | 'ai-image' | 'custom-upload' | 'custom-color';
  backgroundColor?: string;
  backgroundImageUrl?: string;
  customAccentColor?: string;
  showBranding: boolean;
  showProgressBar: boolean;
}

export interface BrandingData {
  logoUrl?: string;
  avatarUrl?: string;
  handle?: string;
  website?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface SlideCanvasProps {
  slide: SlideData;
  template: CarouselTemplate;
  slideIndex: number;
  totalSlides: number;
  branding?: BrandingData;
  isPreview?: boolean;
  className?: string;
}

// Canvas dimensions for LinkedIn carousel (4:5 aspect ratio)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

export const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(
  ({ slide, template, slideIndex, totalSlides, branding, isPreview = true, className }, ref) => {
    const layout = template.layouts[slide.type] || template.layouts.content;
    const accentColor = slide.customAccentColor || template.colors.accent;

    // Get text alignment classes
    const getTitleAlign = () => {
      switch (layout.titleAlign) {
        case 'left': return 'text-left';
        case 'right': return 'text-right';
        default: return 'text-center';
      }
    };

    const getContentAlign = () => {
      switch (layout.contentAlign) {
        case 'left': return 'text-left';
        case 'right': return 'text-right';
        default: return 'text-center';
      }
    };

    // Get flex positioning classes
    const getPositionClasses = () => {
      switch (layout.textPosition) {
        case 'top': return 'justify-start items-center';
        case 'bottom': return 'justify-end items-center';
        case 'left': return 'justify-center items-start';
        case 'right': return 'justify-center items-end';
        case 'top-left': return 'justify-start items-start';
        case 'top-right': return 'justify-start items-end';
        case 'bottom-left': return 'justify-end items-start';
        case 'bottom-right': return 'justify-end items-end';
        default: return 'justify-center items-center';
      }
    };

    // Get branding position classes
    const getBrandingPositionClasses = () => {
      switch (template.elements.brandingPosition) {
        case 'top-left': return 'top-6 left-6';
        case 'top-right': return 'top-6 right-6';
        case 'top-center': return 'top-6 left-1/2 -translate-x-1/2';
        case 'bottom-left': return 'bottom-6 left-6';
        case 'bottom-right': return 'bottom-6 right-6';
        case 'bottom-center': return 'bottom-6 left-1/2 -translate-x-1/2';
        default: return 'bottom-6 left-6';
      }
    };

    // Render progress indicator
    const renderProgressBar = () => {
      if (!slide.showProgressBar && !template.elements.showProgressBar) return null;

      const progressPosition = template.elements.progressBarPosition === 'top'
        ? 'top-4 left-1/2 -translate-x-1/2'
        : 'bottom-4 left-1/2 -translate-x-1/2';

      switch (template.elements.progressBarStyle) {
        case 'dots':
          return (
            <div className={cn("absolute flex gap-2", progressPosition)}>
              {Array.from({ length: totalSlides }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    i === slideIndex ? "bg-white" : "bg-white/40"
                  )}
                />
              ))}
            </div>
          );
        case 'numbers':
          return (
            <div className={cn("absolute text-sm font-medium", progressPosition, template.textClass)}>
              {slideIndex + 1}
            </div>
          );
        case 'fraction':
          return (
            <div className={cn("absolute text-sm font-medium", progressPosition, template.textClass)}>
              {slideIndex + 1}/{totalSlides}
            </div>
          );
        case 'bar':
          return (
            <div className={cn("absolute w-32 h-1 bg-white/30 rounded-full overflow-hidden", progressPosition)}>
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${((slideIndex + 1) / totalSlides) * 100}%` }}
              />
            </div>
          );
        default:
          return null;
      }
    };

    // Render branding overlay
    const renderBranding = () => {
      if (!slide.showBranding && !template.elements.showBranding) return null;
      if (!branding) return null;

      const elements = template.elements.brandingElements;
      const positionClasses = getBrandingPositionClasses();

      return (
        <div className={cn("absolute flex items-center gap-3", positionClasses)}>
          {elements.includes('logo') && branding.logoUrl && (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
          )}
          {elements.includes('avatar') && branding.avatarUrl && (
            <img
              src={branding.avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
            />
          )}
          {elements.includes('handle') && branding.handle && (
            <span className={cn("text-sm font-medium", template.textClass)} style={{ opacity: 0.9 }}>
              {branding.handle}
            </span>
          )}
          {elements.includes('website') && branding.website && (
            <span className={cn("text-sm", template.textClass)} style={{ opacity: 0.8 }}>
              {branding.website}
            </span>
          )}
        </div>
      );
    };

    // Render decorative elements
    const renderDecorations = () => {
      if (!template.elements.hasDecorativeElements) return null;

      switch (template.elements.decorativeStyle) {
        case 'geometric':
          return (
            <>
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-20"
                style={{ backgroundColor: accentColor, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
              />
              <div
                className="absolute bottom-0 left-0 w-24 h-24 opacity-10"
                style={{ backgroundColor: accentColor, clipPath: 'polygon(0 100%, 100% 100%, 0 0)' }}
              />
            </>
          );
        case 'dots':
          return (
            <div className="absolute top-8 right-8 grid grid-cols-3 gap-2 opacity-20">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
              ))}
            </div>
          );
        case 'lines':
          return (
            <>
              <div
                className="absolute top-0 left-0 w-full h-1 opacity-30"
                style={{ backgroundColor: accentColor }}
              />
              <div
                className="absolute bottom-0 left-0 w-full h-1 opacity-30"
                style={{ backgroundColor: accentColor }}
              />
            </>
          );
        case 'organic':
          return (
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
              style={{ backgroundColor: accentColor }}
            />
          );
        default:
          return null;
      }
    };

    // Render accent shape for title
    const renderAccentShape = () => {
      if (!layout.hasAccentShape) return null;

      switch (layout.accentShapeType) {
        case 'underline':
          return (
            <div
              className="w-16 h-1 rounded-full mt-4 mx-auto"
              style={{ backgroundColor: accentColor }}
            />
          );
        case 'box':
          return null; // Box is rendered around the title
        case 'line':
          return (
            <div
              className="w-1 h-12 rounded-full mx-auto mb-4"
              style={{ backgroundColor: accentColor }}
            />
          );
        default:
          return null;
      }
    };

    // Render content based on slide type
    const renderContent = () => {
      const titleStyle = {
        fontFamily: template.typography.titleFont,
        fontWeight: template.typography.titleWeight,
        fontSize: isPreview ? template.typography.titleSize * 0.35 : template.typography.titleSize,
        lineHeight: template.typography.lineHeight,
      };

      const bodyStyle = {
        fontFamily: template.typography.bodyFont,
        fontWeight: template.typography.bodyWeight,
        fontSize: isPreview ? template.typography.bodySize * 0.35 : template.typography.bodySize,
        lineHeight: template.typography.lineHeight,
      };

      switch (slide.type) {
        case 'stat':
          return (
            <div className="flex flex-col items-center">
              {layout.hasAccentShape && layout.accentShapeType === 'circle' && (
                <div
                  className="w-40 h-40 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${accentColor}20`, border: `3px solid ${accentColor}` }}
                >
                  <span
                    className={cn(template.textClass)}
                    style={{ ...titleStyle, fontSize: isPreview ? 48 : 120 }}
                  >
                    {slide.statNumber || slide.title}
                  </span>
                </div>
              )}
              {!layout.hasAccentShape && (
                <span
                  className={cn(template.textClass)}
                  style={{ ...titleStyle, fontSize: isPreview ? 56 : 140 }}
                >
                  {slide.statNumber || slide.title}
                </span>
              )}
              <span
                className={cn(getContentAlign())}
                style={{ ...bodyStyle, color: template.colors.textSecondary }}
              >
                {slide.statLabel || slide.content}
              </span>
            </div>
          );

        case 'quote':
          return (
            <div className="flex flex-col items-center max-w-[85%]">
              <span
                className={template.accentClass}
                style={{ fontSize: isPreview ? 32 : 80, lineHeight: 1 }}
              >
                &ldquo;
              </span>
              {renderAccentShape()}
              <p
                className={cn(template.textClass, "italic", getContentAlign())}
                style={{ ...bodyStyle, fontSize: isPreview ? bodyStyle.fontSize * 1.2 : bodyStyle.fontSize * 1.2 }}
              >
                {slide.quote || slide.content}
              </p>
              {slide.quoteAuthor && (
                <span
                  className="mt-4"
                  style={{ ...bodyStyle, color: template.colors.textSecondary, fontSize: isPreview ? 12 : 32 }}
                >
                  - {slide.quoteAuthor}
                </span>
              )}
            </div>
          );

        case 'list':
          return (
            <div className="w-full">
              <h2
                className={cn(template.textClass, getTitleAlign(), "mb-6")}
                style={titleStyle}
              >
                {slide.title}
              </h2>
              {renderAccentShape()}
              <ul className="space-y-3">
                {(slide.bulletPoints || slide.content.split('\n').filter(Boolean)).map((item, i) => (
                  <li
                    key={i}
                    className={cn("flex items-start gap-3", getContentAlign())}
                    style={{ color: template.colors.textSecondary }}
                  >
                    <span
                      className="shrink-0 w-2 h-2 rounded-full mt-2"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span style={bodyStyle}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );

        case 'cta':
          return (
            <div className="flex flex-col items-center text-center max-w-[85%]">
              <h2
                className={cn(template.textClass, "mb-4")}
                style={titleStyle}
              >
                {slide.title}
              </h2>
              {layout.hasAccentShape && layout.accentShapeType === 'box' && (
                <div
                  className="px-6 py-3 rounded-lg mt-4"
                  style={{ backgroundColor: accentColor }}
                >
                  <span
                    style={{ ...bodyStyle, color: template.colors.background }}
                  >
                    {slide.content}
                  </span>
                </div>
              )}
              {(!layout.hasAccentShape || layout.accentShapeType !== 'box') && (
                <p
                  style={{ ...bodyStyle, color: template.colors.textSecondary }}
                >
                  {slide.content}
                </p>
              )}
              {renderAccentShape()}
            </div>
          );

        case 'hook':
        case 'content':
        default:
          return (
            <div className={cn("flex flex-col max-w-[85%]", getPositionClasses())}>
              <h2
                className={cn(template.textClass, getTitleAlign())}
                style={titleStyle}
              >
                {slide.title}
              </h2>
              {renderAccentShape()}
              {slide.content && (
                <p
                  className={cn(getContentAlign(), "mt-4")}
                  style={{ ...bodyStyle, color: template.colors.textSecondary }}
                >
                  {slide.content}
                </p>
              )}
            </div>
          );
      }
    };

    // Determine background style
    const getBackgroundStyle = () => {
      if (slide.backgroundType === 'custom-color' && slide.backgroundColor) {
        return { backgroundColor: slide.backgroundColor };
      }
      if ((slide.backgroundType === 'ai-image' || slide.backgroundType === 'custom-upload') && slide.backgroundImageUrl) {
        return {
          backgroundImage: `url(${slide.backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      }
      if (template.colors.backgroundSecondary) {
        // Gradient background
        return {
          background: `linear-gradient(${template.colors.gradientDirection === 'to-br' ? '135deg' : template.colors.gradientDirection === 'to-r' ? '90deg' : '180deg'}, ${template.colors.background}, ${template.colors.backgroundSecondary})`,
        };
      }
      return { backgroundColor: template.colors.background };
    };

    // Scale for preview vs export
    const scale = isPreview ? 0.35 : 1;
    const padding = {
      top: layout.padding.top * scale,
      bottom: layout.padding.bottom * scale,
      left: layout.padding.left * scale,
      right: layout.padding.right * scale,
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden flex",
          getPositionClasses(),
          className
        )}
        style={{
          width: isPreview ? CANVAS_WIDTH * scale : CANVAS_WIDTH,
          height: isPreview ? CANVAS_HEIGHT * scale : CANVAS_HEIGHT,
          paddingTop: padding.top,
          paddingBottom: padding.bottom,
          paddingLeft: padding.left,
          paddingRight: padding.right,
          ...getBackgroundStyle(),
        }}
      >
        {/* Overlay for photo templates */}
        {(slide.backgroundType === 'ai-image' || slide.backgroundType === 'custom-upload') && slide.backgroundImageUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: template.id === 'blurred-background' ? 'blur(8px)' : undefined,
            }}
          />
        )}

        {/* Decorative elements */}
        {renderDecorations()}

        {/* Main content */}
        <div className={cn("relative z-10 flex", getPositionClasses(), "w-full h-full")}>
          {renderContent()}
        </div>

        {/* Branding */}
        {renderBranding()}

        {/* Progress indicator */}
        {renderProgressBar()}
      </div>
    );
  }
);

SlideCanvas.displayName = "SlideCanvas";

// Helper to create default slide data
export function createDefaultSlide(type: SlideType, index: number): SlideData {
  const defaultContent: Record<SlideType, { title: string; content: string }> = {
    hook: { title: 'Your Attention-Grabbing Headline', content: 'A powerful opening statement' },
    content: { title: `Point ${index}`, content: 'Explain your key insight here' },
    stat: { title: '95%', content: 'of professionals agree' },
    quote: { title: '', content: 'Your inspiring quote goes here' },
    list: { title: 'Key Takeaways', content: 'First point\nSecond point\nThird point' },
    cta: { title: 'Ready to Start?', content: 'Follow for more insights' },
  };

  const defaults = defaultContent[type];

  return {
    id: `slide-${Date.now()}-${index}`,
    type,
    title: defaults.title,
    content: defaults.content,
    backgroundType: 'template',
    showBranding: true,
    showProgressBar: true,
  };
}

// Helper to create initial carousel slides
export function createInitialSlides(count: number): SlideData[] {
  const slides: SlideData[] = [];

  // First slide is always a hook
  slides.push(createDefaultSlide('hook', 0));

  // Middle slides are content
  for (let i = 1; i < count - 1; i++) {
    slides.push(createDefaultSlide('content', i));
  }

  // Last slide is always CTA
  if (count > 1) {
    slides.push(createDefaultSlide('cta', count - 1));
  }

  return slides;
}
