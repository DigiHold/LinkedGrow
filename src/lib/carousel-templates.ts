// Carousel Template System for LinkedGrow
// 23 professional templates organized by category
// 8 best templates are premium (Business plan only)

export type TemplateCategory = 'minimal' | 'bold' | 'gradient' | 'photo' | 'corporate' | 'creative';

export type SlideType = 'hook' | 'content' | 'stat' | 'quote' | 'list' | 'cta';

export type TextPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type BackgroundType = 'solid' | 'gradient' | 'pattern';

export type BrandingPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export interface SlideLayout {
  textPosition: TextPosition;
  titleAlign: 'left' | 'center' | 'right';
  contentAlign: 'left' | 'center' | 'right';
  hasAccentShape: boolean;
  accentShapeType?: 'underline' | 'box' | 'circle' | 'corner' | 'line';
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface TemplateColors {
  background: string;
  backgroundSecondary?: string;
  gradientDirection?: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl';
  text: string;
  textSecondary: string;
  accent: string;
  accentSecondary?: string;
}

export interface TemplateTypography {
  titleFont: string;
  titleWeight: number;
  titleSize: number;
  bodyFont: string;
  bodyWeight: number;
  bodySize: number;
  lineHeight: number;
}

export interface TemplateElements {
  showProgressBar: boolean;
  progressBarStyle: 'dots' | 'numbers' | 'bar' | 'fraction';
  progressBarPosition: 'top' | 'bottom';
  showBranding: boolean;
  brandingPosition: BrandingPosition;
  brandingElements: ('logo' | 'avatar' | 'handle' | 'website')[];
  hasDecorativeElements: boolean;
  decorativeStyle?: 'geometric' | 'organic' | 'lines' | 'dots' | 'none';
}

export interface TemplateDefaultElement {
  type: 'text' | 'shape';
  options?: {
    text?: string;
    fontSize?: number;
    fontWeight?: string | number;
    fill?: string;
    top?: number;
    left?: number;
  };
  shapeType?: 'rect' | 'circle' | 'line';
}

export interface CarouselTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  isPremium: boolean;
  colors: TemplateColors;
  typography: TemplateTypography;
  elements: TemplateElements;
  layouts: {
    hook: SlideLayout;
    content: SlideLayout;
    stat: SlideLayout;
    quote: SlideLayout;
    list: SlideLayout;
    cta: SlideLayout;
  };
  backgroundClass: string;
  textClass: string;
  accentClass: string;
  background: {
    type: 'solid' | 'gradient' | 'image';
    value: string;
  };
  defaultElements?: TemplateDefaultElement[];
}

const defaultLayouts: CarouselTemplate['layouts'] = {
  hook: {
    textPosition: 'center',
    titleAlign: 'center',
    contentAlign: 'center',
    hasAccentShape: true,
    accentShapeType: 'underline',
    padding: { top: 120, bottom: 120, left: 80, right: 80 },
  },
  content: {
    textPosition: 'center',
    titleAlign: 'left',
    contentAlign: 'left',
    hasAccentShape: false,
    padding: { top: 100, bottom: 100, left: 80, right: 80 },
  },
  stat: {
    textPosition: 'center',
    titleAlign: 'center',
    contentAlign: 'center',
    hasAccentShape: true,
    accentShapeType: 'circle',
    padding: { top: 120, bottom: 120, left: 80, right: 80 },
  },
  quote: {
    textPosition: 'center',
    titleAlign: 'center',
    contentAlign: 'center',
    hasAccentShape: true,
    accentShapeType: 'line',
    padding: { top: 140, bottom: 140, left: 100, right: 100 },
  },
  list: {
    textPosition: 'top',
    titleAlign: 'left',
    contentAlign: 'left',
    hasAccentShape: false,
    padding: { top: 100, bottom: 100, left: 80, right: 80 },
  },
  cta: {
    textPosition: 'center',
    titleAlign: 'center',
    contentAlign: 'center',
    hasAccentShape: true,
    accentShapeType: 'box',
    padding: { top: 120, bottom: 120, left: 80, right: 80 },
  },
};

// ============================================
// MINIMAL CATEGORY (5 templates - 0 premium)
// ============================================

const cleanWhite: CarouselTemplate = {
  id: 'clean-white',
  name: 'Clean White',
  description: 'Minimalist white background with dark text',
  category: 'minimal',
  isPremium: false,
  colors: {
    background: '#ffffff',
    text: '#1a1a2e',
    textSecondary: '#4a4a68',
    accent: '#0891b2',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 72,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 42,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-left',
    brandingElements: ['avatar', 'handle'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-white',
  textClass: 'text-slate-900',
  accentClass: 'text-cyan-600',
  background: { type: 'solid', value: '#ffffff' },
  defaultElements: [
    { type: 'text', options: { text: 'Your Headline', fontSize: 72, fontWeight: 'bold', fill: '#1a1a2e', top: 450, left: 340 } },
    { type: 'text', options: { text: 'Supporting text goes here', fontSize: 32, fontWeight: 'normal', fill: '#4a4a68', top: 580, left: 340 } },
  ],
};

const darkMode: CarouselTemplate = {
  id: 'dark-mode',
  name: 'Dark Mode',
  description: 'Sleek dark background with white text',
  category: 'minimal',
  isPremium: false,
  colors: {
    background: '#1a1a2e',
    text: '#ffffff',
    textSecondary: '#a0a0b8',
    accent: '#22d3ee',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 72,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 42,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-left',
    brandingElements: ['avatar', 'handle'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-slate-900',
  textClass: 'text-white',
  accentClass: 'text-cyan-400',
  background: { type: 'solid', value: '#1a1a2e' },
  defaultElements: [
    { type: 'text', options: { text: 'Your Headline Here', fontSize: 72, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Add your supporting text', fontSize: 36, fontWeight: 'normal', fill: '#a0a0b8', top: 550 } },
  ],
};

const softGray: CarouselTemplate = {
  id: 'soft-gray',
  name: 'Soft Gray',
  description: 'Gentle light gray background with charcoal text',
  category: 'minimal',
  isPremium: false,
  colors: {
    background: '#f5f5f7',
    text: '#2d2d2d',
    textSecondary: '#6b6b6b',
    accent: '#3b82f6',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 600,
    titleSize: 68,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 40,
    lineHeight: 1.5,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'fraction',
    progressBarPosition: 'top',
    showBranding: true,
    brandingPosition: 'bottom-right',
    brandingElements: ['logo', 'website'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-gray-100',
  textClass: 'text-gray-800',
  accentClass: 'text-blue-500',
  background: { type: 'solid', value: '#f5f5f7' },
  defaultElements: [
    { type: 'text', options: { text: 'Your Headline Here', fontSize: 68, fontWeight: '600', fill: '#2d2d2d', top: 400 } },
    { type: 'text', options: { text: 'Add your supporting text', fontSize: 36, fontWeight: 'normal', fill: '#6b6b6b', top: 550 } },
  ],
};

const paper: CarouselTemplate = {
  id: 'paper',
  name: 'Paper',
  description: 'Off-white textured feel with elegant serif typography',
  category: 'minimal',
  isPremium: false,
  colors: {
    background: '#faf8f5',
    text: '#2c2c2c',
    textSecondary: '#5c5c5c',
    accent: '#8b5a2b',
  },
  typography: {
    titleFont: 'Georgia',
    titleWeight: 700,
    titleSize: 64,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 38,
    lineHeight: 1.6,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'numbers',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-center',
    brandingElements: ['handle'],
    hasDecorativeElements: true,
    decorativeStyle: 'lines',
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-amber-50',
  textClass: 'text-stone-800',
  accentClass: 'text-amber-700',
  background: { type: 'solid', value: '#faf8f5' },
  defaultElements: [
    { type: 'text', options: { text: 'Your Headline Here', fontSize: 64, fontWeight: 'bold', fill: '#2c2c2c', top: 400 } },
    { type: 'text', options: { text: 'Add your supporting text', fontSize: 36, fontWeight: 'normal', fill: '#5c5c5c', top: 550 } },
  ],
};

const neoBrutalist: CarouselTemplate = {
  id: 'neo-brutalist',
  name: 'Neo Brutalist',
  description: 'Bold black borders, raw aesthetic, high impact',
  category: 'minimal',
  isPremium: false,
  colors: {
    background: '#ffffff',
    text: '#000000',
    textSecondary: '#333333',
    accent: '#ff3366',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 900,
    titleSize: 80,
    bodyFont: 'Inter',
    bodyWeight: 500,
    bodySize: 44,
    lineHeight: 1.3,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'bar',
    progressBarPosition: 'top',
    showBranding: true,
    brandingPosition: 'bottom-left',
    brandingElements: ['handle'],
    hasDecorativeElements: true,
    decorativeStyle: 'geometric',
  },
  layouts: {
    ...defaultLayouts,
    hook: { ...defaultLayouts.hook, hasAccentShape: true, accentShapeType: 'box' },
  },
  backgroundClass: 'bg-white',
  textClass: 'text-black',
  accentClass: 'text-rose-500',
  background: { type: 'solid', value: '#ffffff' },
  defaultElements: [
    { type: 'text', options: { text: 'BOLD HEADLINE', fontSize: 80, fontWeight: '900', fill: '#000000', top: 400 } },
    { type: 'text', options: { text: 'Make an impact', fontSize: 40, fontWeight: '500', fill: '#333333', top: 560 } },
    { type: 'shape', shapeType: 'rect' },
  ],
};

// ============================================
// BOLD CATEGORY (4 templates - 1 premium)
// ============================================

const neonPop: CarouselTemplate = {
  id: 'neon-pop',
  name: 'Neon Pop',
  description: 'Dark background with vibrant neon accent colors',
  category: 'bold',
  isPremium: false,
  colors: {
    background: '#0f0f1a',
    text: '#ffffff',
    textSecondary: '#b8b8d0',
    accent: '#00ff88',
    accentSecondary: '#ff00ff',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 800,
    titleSize: 76,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 42,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'bar',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'top-right',
    brandingElements: ['avatar', 'handle'],
    hasDecorativeElements: true,
    decorativeStyle: 'geometric',
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-slate-950',
  textClass: 'text-white',
  accentClass: 'text-emerald-400',
  background: { type: 'solid', value: '#0f0f1a' },
  defaultElements: [
    { type: 'shape', shapeType: 'circle' },
    { type: 'text', options: { text: 'NEON GLOW', fontSize: 76, fontWeight: '800', fill: '#00ff88', top: 500, left: 340 } },
    { type: 'text', options: { text: 'Electric vibes', fontSize: 36, fontWeight: 'normal', fill: '#ff00ff', top: 640, left: 340 } },
  ],
};

const colorBlock: CarouselTemplate = {
  id: 'color-block',
  name: 'Color Block',
  description: 'Bold solid color backgrounds that demand attention',
  category: 'bold',
  isPremium: false,
  colors: {
    background: '#6366f1',
    text: '#ffffff',
    textSecondary: '#e0e0ff',
    accent: '#fbbf24',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 72,
    bodyFont: 'Inter',
    bodyWeight: 500,
    bodySize: 44,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-left',
    brandingElements: ['logo'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-indigo-500',
  textClass: 'text-white',
  accentClass: 'text-amber-400',
  background: { type: 'solid', value: '#6366f1' },
  defaultElements: [
    { type: 'text', options: { text: 'Bold Statement', fontSize: 72, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Stand out from the crowd', fontSize: 40, fontWeight: '500', fill: '#e0e0ff', top: 550 } },
  ],
};

const highContrast: CarouselTemplate = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'Pure black and white with single color accent',
  category: 'bold',
  isPremium: false,
  colors: {
    background: '#000000',
    text: '#ffffff',
    textSecondary: '#cccccc',
    accent: '#ff4444',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 800,
    titleSize: 80,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 42,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'fraction',
    progressBarPosition: 'top',
    showBranding: true,
    brandingPosition: 'bottom-right',
    brandingElements: ['handle', 'website'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-black',
  textClass: 'text-white',
  accentClass: 'text-red-500',
  background: { type: 'solid', value: '#000000' },
  defaultElements: [
    { type: 'text', options: { text: 'MAXIMUM IMPACT', fontSize: 80, fontWeight: '800', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Black and white clarity', fontSize: 40, fontWeight: 'normal', fill: '#cccccc', top: 560 } },
  ],
};

const retroBold: CarouselTemplate = {
  id: 'retro-bold',
  name: 'Retro Bold',
  description: '70s inspired with warm colors - Premium',
  category: 'bold',
  isPremium: true,
  colors: {
    background: '#f97316',
    text: '#ffffff',
    textSecondary: '#fff7ed',
    accent: '#1e1b4b',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 68,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 40,
    lineHeight: 1.5,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-center',
    brandingElements: ['avatar', 'handle'],
    hasDecorativeElements: true,
    decorativeStyle: 'organic',
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-orange-500',
  textClass: 'text-white',
  accentClass: 'text-indigo-950',
  background: { type: 'solid', value: '#f97316' },
  defaultElements: [
    { type: 'text', options: { text: 'Groovy Headline', fontSize: 68, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Vintage vibes for modern times', fontSize: 38, fontWeight: 'normal', fill: '#fff7ed', top: 550 } },
    { type: 'shape', shapeType: 'circle' },
  ],
};

// ============================================
// GRADIENT CATEGORY (4 templates - 2 premium)
// ============================================

const oceanBreeze: CarouselTemplate = {
  id: 'ocean-breeze',
  name: 'Ocean Breeze',
  description: 'Fresh cyan to blue diagonal gradient',
  category: 'gradient',
  isPremium: false,
  colors: {
    background: '#06b6d4',
    backgroundSecondary: '#2563eb',
    gradientDirection: 'to-br',
    text: '#ffffff',
    textSecondary: '#e0f2fe',
    accent: '#fbbf24',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 72,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 42,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-left',
    brandingElements: ['avatar', 'handle'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-gradient-to-br from-cyan-500 to-blue-600',
  textClass: 'text-white',
  accentClass: 'text-amber-300',
  background: { type: 'gradient', value: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)' },
  defaultElements: [
    { type: 'text', options: { text: 'Fresh Ideas Flow', fontSize: 72, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Like waves on a shore', fontSize: 40, fontWeight: 'normal', fill: '#e0f2fe', top: 550 } },
  ],
};

const sunsetGlow: CarouselTemplate = {
  id: 'sunset-glow',
  name: 'Sunset Glow',
  description: 'Warm orange to pink gradient - Premium',
  category: 'gradient',
  isPremium: true,
  colors: {
    background: '#f97316',
    backgroundSecondary: '#db2777',
    gradientDirection: 'to-br',
    text: '#ffffff',
    textSecondary: '#fff7ed',
    accent: '#fef3c7',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 72,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 42,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-right',
    brandingElements: ['logo', 'website'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-gradient-to-br from-orange-500 to-pink-600',
  textClass: 'text-white',
  accentClass: 'text-amber-100',
  background: { type: 'gradient', value: 'linear-gradient(135deg, #f97316 0%, #db2777 100%)' },
  defaultElements: [
    { type: 'text', options: { text: 'Golden Hour', fontSize: 72, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'When everything glows', fontSize: 40, fontWeight: 'normal', fill: '#fff7ed', top: 550 } },
  ],
};

const purpleHaze: CarouselTemplate = {
  id: 'purple-haze',
  name: 'Purple Haze',
  description: 'Deep purple to pink gradient - Premium',
  category: 'gradient',
  isPremium: true,
  colors: {
    background: '#7c3aed',
    backgroundSecondary: '#ec4899',
    gradientDirection: 'to-br',
    text: '#ffffff',
    textSecondary: '#f3e8ff',
    accent: '#fbbf24',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 72,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 42,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-left',
    brandingElements: ['avatar', 'handle'],
    hasDecorativeElements: true,
    decorativeStyle: 'dots',
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-gradient-to-br from-purple-600 to-pink-500',
  textClass: 'text-white',
  accentClass: 'text-amber-300',
  background: { type: 'gradient', value: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' },
  defaultElements: [
    { type: 'text', options: { text: 'Creative Vision', fontSize: 72, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Think outside the box', fontSize: 40, fontWeight: 'normal', fill: '#f3e8ff', top: 550 } },
  ],
};

const forest: CarouselTemplate = {
  id: 'forest',
  name: 'Forest',
  description: 'Calming dark green to teal gradient',
  category: 'gradient',
  isPremium: false,
  colors: {
    background: '#064e3b',
    backgroundSecondary: '#0d9488',
    gradientDirection: 'to-br',
    text: '#ffffff',
    textSecondary: '#d1fae5',
    accent: '#fbbf24',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 600,
    titleSize: 68,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 40,
    lineHeight: 1.5,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'numbers',
    progressBarPosition: 'top',
    showBranding: true,
    brandingPosition: 'bottom-center',
    brandingElements: ['handle'],
    hasDecorativeElements: true,
    decorativeStyle: 'organic',
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-gradient-to-br from-emerald-900 to-teal-600',
  textClass: 'text-white',
  accentClass: 'text-amber-300',
  background: { type: 'gradient', value: 'linear-gradient(135deg, #064e3b 0%, #0d9488 100%)' },
  defaultElements: [
    { type: 'text', options: { text: 'Natural Growth', fontSize: 68, fontWeight: '600', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Sustainable success', fontSize: 38, fontWeight: 'normal', fill: '#d1fae5', top: 550 } },
  ],
};

// ============================================
// PHOTO CATEGORY (3 templates - 2 premium)
// ============================================

const photoCard: CarouselTemplate = {
  id: 'photo-card',
  name: 'Photo Card',
  description: 'Full bleed image with text overlay - Premium',
  category: 'photo',
  isPremium: true,
  colors: {
    background: 'transparent',
    text: '#ffffff',
    textSecondary: '#e5e5e5',
    accent: '#22d3ee',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 64,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 38,
    lineHeight: 1.5,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'top-left',
    brandingElements: ['logo'],
    hasDecorativeElements: false,
  },
  layouts: {
    ...defaultLayouts,
    content: { ...defaultLayouts.content, textPosition: 'bottom', padding: { top: 60, bottom: 140, left: 60, right: 60 } },
  },
  backgroundClass: 'bg-black/40',
  textClass: 'text-white',
  accentClass: 'text-cyan-400',
  background: { type: 'solid', value: '#1f2937' },
  defaultElements: [
    { type: 'text', options: { text: 'Your Photo Title', fontSize: 64, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Upload an image as background', fontSize: 36, fontWeight: 'normal', fill: '#e5e5e5', top: 540 } },
  ],
};

const blurredBackground: CarouselTemplate = {
  id: 'blurred-background',
  name: 'Blurred Background',
  description: 'Softly blurred image background - Premium',
  category: 'photo',
  isPremium: true,
  colors: {
    background: 'transparent',
    text: '#ffffff',
    textSecondary: '#d1d5db',
    accent: '#fbbf24',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 72,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 42,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'fraction',
    progressBarPosition: 'top',
    showBranding: true,
    brandingPosition: 'bottom-right',
    brandingElements: ['avatar', 'website'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'backdrop-blur-xl bg-black/30',
  textClass: 'text-white',
  accentClass: 'text-amber-400',
  background: { type: 'solid', value: '#374151' },
  defaultElements: [
    { type: 'text', options: { text: 'Dreamy Visuals', fontSize: 72, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Soft focus, sharp message', fontSize: 40, fontWeight: 'normal', fill: '#d1d5db', top: 550 } },
  ],
};

const splitScreen: CarouselTemplate = {
  id: 'split-screen',
  name: 'Split Screen',
  description: 'Half image, half solid color with text',
  category: 'photo',
  isPremium: false,
  colors: {
    background: '#1e293b',
    text: '#ffffff',
    textSecondary: '#cbd5e1',
    accent: '#38bdf8',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 64,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 38,
    lineHeight: 1.5,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-left',
    brandingElements: ['handle'],
    hasDecorativeElements: false,
  },
  layouts: {
    ...defaultLayouts,
    content: { ...defaultLayouts.content, textPosition: 'right', padding: { top: 80, bottom: 80, left: 40, right: 60 } },
  },
  backgroundClass: 'bg-slate-800',
  textClass: 'text-white',
  accentClass: 'text-sky-400',
  background: { type: 'solid', value: '#1e293b' },
  defaultElements: [
    { type: 'text', options: { text: 'Two Halves', fontSize: 64, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'One powerful message', fontSize: 36, fontWeight: 'normal', fill: '#cbd5e1', top: 540 } },
  ],
};

// ============================================
// CORPORATE CATEGORY (4 templates - 1 premium)
// ============================================

const linkedinBlue: CarouselTemplate = {
  id: 'linkedin-blue',
  name: 'LinkedIn Blue',
  description: 'Official LinkedIn brand colors for platform fit',
  category: 'corporate',
  isPremium: false,
  colors: {
    background: '#0A66C2',
    text: '#ffffff',
    textSecondary: '#cce4f7',
    accent: '#ffffff',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 700,
    titleSize: 72,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 42,
    lineHeight: 1.4,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'dots',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'bottom-left',
    brandingElements: ['avatar', 'handle'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-[#0A66C2]',
  textClass: 'text-white',
  accentClass: 'text-white',
  background: { type: 'solid', value: '#0A66C2' },
  defaultElements: [
    { type: 'text', options: { text: 'Professional Insight', fontSize: 72, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Native to LinkedIn', fontSize: 40, fontWeight: 'normal', fill: '#cce4f7', top: 550 } },
  ],
};

const executiveNavy: CarouselTemplate = {
  id: 'executive-navy',
  name: 'Executive Navy',
  description: 'Professional navy blue with gold - Premium',
  category: 'corporate',
  isPremium: true,
  colors: {
    background: '#1e3a5f',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    accent: '#d4af37',
  },
  typography: {
    titleFont: 'Georgia',
    titleWeight: 700,
    titleSize: 64,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 38,
    lineHeight: 1.5,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'numbers',
    progressBarPosition: 'top',
    showBranding: true,
    brandingPosition: 'bottom-center',
    brandingElements: ['logo', 'website'],
    hasDecorativeElements: true,
    decorativeStyle: 'lines',
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-slate-800',
  textClass: 'text-white',
  accentClass: 'text-amber-500',
  background: { type: 'solid', value: '#1e3a5f' },
  defaultElements: [
    { type: 'text', options: { text: 'Executive Summary', fontSize: 64, fontWeight: 'bold', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Leadership insights that matter', fontSize: 36, fontWeight: 'normal', fill: '#94a3b8', top: 540 } },
    { type: 'shape', shapeType: 'line' },
  ],
};

const techStartup: CarouselTemplate = {
  id: 'tech-startup',
  name: 'Tech Startup',
  description: 'Modern blue-gray palette for tech companies',
  category: 'corporate',
  isPremium: false,
  colors: {
    background: '#0f172a',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    accent: '#3b82f6',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 600,
    titleSize: 68,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 40,
    lineHeight: 1.5,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'bar',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'top-right',
    brandingElements: ['logo'],
    hasDecorativeElements: true,
    decorativeStyle: 'geometric',
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-slate-900',
  textClass: 'text-slate-50',
  accentClass: 'text-blue-500',
  background: { type: 'solid', value: '#0f172a' },
  defaultElements: [
    { type: 'text', options: { text: 'Innovation Ahead', fontSize: 68, fontWeight: '600', fill: '#f8fafc', top: 400 } },
    { type: 'text', options: { text: 'Building the future', fontSize: 38, fontWeight: 'normal', fill: '#94a3b8', top: 550 } },
  ],
};

const consulting: CarouselTemplate = {
  id: 'consulting',
  name: 'Consulting',
  description: 'Gray scale professional with accent color pop',
  category: 'corporate',
  isPremium: false,
  colors: {
    background: '#374151',
    text: '#ffffff',
    textSecondary: '#d1d5db',
    accent: '#10b981',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 600,
    titleSize: 68,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 40,
    lineHeight: 1.5,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'fraction',
    progressBarPosition: 'top',
    showBranding: true,
    brandingPosition: 'bottom-right',
    brandingElements: ['logo', 'website'],
    hasDecorativeElements: false,
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-gray-700',
  textClass: 'text-white',
  accentClass: 'text-emerald-400',
  background: { type: 'solid', value: '#374151' },
  defaultElements: [
    { type: 'text', options: { text: 'Strategic Thinking', fontSize: 68, fontWeight: '600', fill: '#ffffff', top: 400 } },
    { type: 'text', options: { text: 'Results-driven approach', fontSize: 38, fontWeight: 'normal', fill: '#d1d5db', top: 550 } },
  ],
};

// ============================================
// CREATIVE CATEGORY (3 templates - 2 premium)
// ============================================

const handwritten: CarouselTemplate = {
  id: 'handwritten',
  name: 'Handwritten',
  description: 'Notebook paper feel with handwriting - Premium',
  category: 'creative',
  isPremium: true,
  colors: {
    background: '#fefce8',
    text: '#1c1917',
    textSecondary: '#44403c',
    accent: '#dc2626',
  },
  typography: {
    titleFont: 'Georgia',
    titleWeight: 700,
    titleSize: 80,
    bodyFont: 'Georgia',
    bodyWeight: 400,
    bodySize: 48,
    lineHeight: 1.3,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'numbers',
    progressBarPosition: 'top',
    showBranding: true,
    brandingPosition: 'bottom-right',
    brandingElements: ['handle'],
    hasDecorativeElements: true,
    decorativeStyle: 'lines',
  },
  layouts: defaultLayouts,
  backgroundClass: 'bg-yellow-50',
  textClass: 'text-stone-900',
  accentClass: 'text-red-600',
  background: { type: 'solid', value: '#fefce8' },
  defaultElements: [
    { type: 'text', options: { text: 'Personal Note', fontSize: 80, fontWeight: 'bold', fill: '#1c1917', top: 400 } },
    { type: 'text', options: { text: 'Like writing by hand', fontSize: 44, fontWeight: 'normal', fill: '#44403c', top: 560 } },
  ],
};

const magazine: CarouselTemplate = {
  id: 'magazine',
  name: 'Magazine',
  description: 'Editorial layout with bold typography - Premium',
  category: 'creative',
  isPremium: true,
  colors: {
    background: '#fafafa',
    text: '#0a0a0a',
    textSecondary: '#525252',
    accent: '#ea580c',
  },
  typography: {
    titleFont: 'Georgia',
    titleWeight: 900,
    titleSize: 88,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 36,
    lineHeight: 1.6,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'bar',
    progressBarPosition: 'bottom',
    showBranding: true,
    brandingPosition: 'top-left',
    brandingElements: ['logo'],
    hasDecorativeElements: true,
    decorativeStyle: 'lines',
  },
  layouts: {
    ...defaultLayouts,
    hook: { ...defaultLayouts.hook, titleAlign: 'left', textPosition: 'bottom-left' },
  },
  backgroundClass: 'bg-neutral-50',
  textClass: 'text-neutral-950',
  accentClass: 'text-orange-600',
  background: { type: 'solid', value: '#fafafa' },
  defaultElements: [
    { type: 'text', options: { text: 'THE HEADLINE', fontSize: 88, fontWeight: '900', fill: '#0a0a0a', top: 350 } },
    { type: 'text', options: { text: 'Editorial excellence', fontSize: 36, fontWeight: 'normal', fill: '#525252', top: 520 } },
  ],
};

const dataViz: CarouselTemplate = {
  id: 'data-viz',
  name: 'Data Viz',
  description: 'Optimized for statistics and data presentation',
  category: 'creative',
  isPremium: false,
  colors: {
    background: '#18181b',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    accent: '#22c55e',
    accentSecondary: '#3b82f6',
  },
  typography: {
    titleFont: 'Inter',
    titleWeight: 600,
    titleSize: 56,
    bodyFont: 'Inter',
    bodyWeight: 400,
    bodySize: 36,
    lineHeight: 1.5,
  },
  elements: {
    showProgressBar: true,
    progressBarStyle: 'bar',
    progressBarPosition: 'top',
    showBranding: true,
    brandingPosition: 'bottom-right',
    brandingElements: ['logo', 'website'],
    hasDecorativeElements: true,
    decorativeStyle: 'geometric',
  },
  layouts: {
    ...defaultLayouts,
    stat: { ...defaultLayouts.stat, titleAlign: 'center', hasAccentShape: true, accentShapeType: 'circle' },
  },
  backgroundClass: 'bg-zinc-900',
  textClass: 'text-zinc-50',
  accentClass: 'text-green-500',
  background: { type: 'solid', value: '#18181b' },
  defaultElements: [
    { type: 'shape', shapeType: 'rect' },
    { type: 'text', options: { text: '87%', fontSize: 180, fontWeight: 'bold', fill: '#22c55e', top: 380, left: 340 } },
    { type: 'text', options: { text: 'of users saw results', fontSize: 36, fontWeight: 'normal', fill: '#a1a1aa', top: 650, left: 340 } },
  ],
};

// ============================================
// EXPORT ALL TEMPLATES
// ============================================

export const carouselTemplates: CarouselTemplate[] = [
  // Minimal (5 free)
  cleanWhite,
  darkMode,
  softGray,
  paper,
  neoBrutalist,
  // Bold (3 free, 1 premium)
  neonPop,
  colorBlock,
  highContrast,
  retroBold,
  // Gradient (2 free, 2 premium)
  oceanBreeze,
  sunsetGlow,
  purpleHaze,
  forest,
  // Photo (1 free, 2 premium)
  photoCard,
  blurredBackground,
  splitScreen,
  // Corporate (3 free, 1 premium)
  linkedinBlue,
  executiveNavy,
  techStartup,
  consulting,
  // Creative (1 free, 2 premium)
  handwritten,
  magazine,
  dataViz,
];

export const templateCategories: { id: TemplateCategory; name: string; description: string }[] = [
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple designs' },
  { id: 'bold', name: 'Bold', description: 'High-impact, attention-grabbing' },
  { id: 'gradient', name: 'Gradient', description: 'Colorful gradient backgrounds' },
  { id: 'photo', name: 'Photo', description: 'Image-based layouts' },
  { id: 'corporate', name: 'Corporate', description: 'Professional business styles' },
  { id: 'creative', name: 'Creative', description: 'Unique and artistic' },
];

export function getTemplateById(id: string): CarouselTemplate | undefined {
  return carouselTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): CarouselTemplate[] {
  return carouselTemplates.filter(t => t.category === category);
}

export function getFreeTemplates(): CarouselTemplate[] {
  return carouselTemplates.filter(t => !t.isPremium);
}

export function getPremiumTemplates(): CarouselTemplate[] {
  return carouselTemplates.filter(t => t.isPremium);
}

export const defaultTemplate = cleanWhite;
