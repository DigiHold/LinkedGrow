// Carousel Template System for LinkedGrow
// Templates with complete slide designs - all elements positioned within 1080x1350 canvas

export type TemplateCategory = 'minimal' | 'bold' | 'gradient' | 'corporate' | 'creative' | 'data';

export interface TemplateElement {
  type: 'text' | 'shape' | 'line';
  // For text
  text?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  fill?: string;
  textAlign?: 'left' | 'center' | 'right';
  // Position
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  // For shapes
  shapeType?: 'rect' | 'circle' | 'line';
  rx?: number;
  ry?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  // For lines
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface CarouselTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  isPremium: boolean;
  thumbnail?: string;
  background: {
    type: 'solid' | 'gradient';
    value: string;
  };
  elements: TemplateElement[];
}

// ============================================
// CANVAS CONSTANTS
// Width: 1080, Height: 1350
// Safe padding: 80-100px sides, 80px top, 120px bottom
// Usable content width with 100px padding: 880px
// ============================================

// ============================================
// MINIMAL TEMPLATES
// ============================================

const cleanWhite: CarouselTemplate = {
  id: 'clean-white',
  name: 'Clean White',
  description: 'Minimalist white with cyan accent',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#ffffff' },
  elements: [
    // Top accent bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 1080, height: 8, fill: '#0891b2' },
    // Category label
    { type: 'text', text: 'TOPIC', fontSize: 22, fontWeight: '700', fill: '#0891b2', left: 100, top: 140, width: 880, textAlign: 'left' },
    // Main headline
    { type: 'text', text: 'Your Headline\nGoes Here', fontSize: 72, fontWeight: '800', fill: '#0f172a', left: 100, top: 220, width: 880, textAlign: 'left' },
    // Divider line
    { type: 'shape', shapeType: 'rect', left: 100, top: 500, width: 880, height: 2, fill: '#e2e8f0' },
    // Supporting text
    { type: 'text', text: 'Add your supporting message\nthat explains the main point\nin a few short lines.', fontSize: 34, fontWeight: '400', fill: '#64748b', left: 100, top: 540, width: 880, textAlign: 'left' },
    // Bottom branding
    { type: 'text', text: '@yourhandle', fontSize: 24, fontWeight: '500', fill: '#94a3b8', left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

const darkMode: CarouselTemplate = {
  id: 'dark-mode',
  name: 'Dark Mode',
  description: 'Sleek dark with neon cyan accent',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#0f172a' },
  elements: [
    // Decorative blob top-right
    { type: 'shape', shapeType: 'circle', left: 780, top: -80, width: 350, height: 350, fill: '#06b6d4', opacity: 0.12 },
    // Category
    { type: 'text', text: 'TOPIC', fontSize: 22, fontWeight: '700', fill: '#22d3ee', left: 100, top: 140, width: 880, textAlign: 'left' },
    // Accent bar under category
    { type: 'shape', shapeType: 'rect', left: 100, top: 180, width: 60, height: 4, fill: '#22d3ee', rx: 2, ry: 2 },
    // Main headline
    { type: 'text', text: 'Bold Statement\nThat Hooks', fontSize: 76, fontWeight: '800', fill: '#f8fafc', left: 100, top: 230, width: 880, textAlign: 'left' },
    // Supporting text
    { type: 'text', text: 'Your key message goes here\nwith clarity and impact.', fontSize: 34, fontWeight: '400', fill: '#94a3b8', left: 100, top: 520, width: 880, textAlign: 'left' },
    // Bottom bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 1100, width: 1080, height: 1, fill: '#1e293b' },
    { type: 'text', text: '@yourhandle', fontSize: 24, fontWeight: '500', fill: '#475569', left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

const softBeige: CarouselTemplate = {
  id: 'soft-beige',
  name: 'Soft Beige',
  description: 'Warm and elegant with serif feel',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#faf8f5' },
  elements: [
    // Left accent bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 6, height: 1350, fill: '#d4a574' },
    // Opening quote mark
    { type: 'text', text: '"', fontSize: 180, fontWeight: '400', fill: '#d4a574', opacity: 0.3, left: 80, top: 80, width: 200 },
    // Main headline
    { type: 'text', text: 'Elegant Ideas\nWorth Sharing', fontSize: 68, fontWeight: '700', fill: '#2c2c2c', left: 100, top: 320, width: 880, textAlign: 'left' },
    // Decorative line
    { type: 'shape', shapeType: 'rect', left: 100, top: 540, width: 120, height: 3, fill: '#d4a574' },
    // Supporting text
    { type: 'text', text: 'Thoughtful content that\nresonates with your audience.', fontSize: 32, fontWeight: '400', fill: '#78716c', left: 100, top: 580, width: 880, textAlign: 'left' },
    // Author
    { type: 'text', text: 'Your Name', fontSize: 26, fontWeight: '600', fill: '#44403c', left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

// ============================================
// BOLD TEMPLATES
// ============================================

const neonPop: CarouselTemplate = {
  id: 'neon-pop',
  name: 'Neon Pop',
  description: 'Electric neon on dark background',
  category: 'bold',
  isPremium: false,
  background: { type: 'solid', value: '#0a0a0f' },
  elements: [
    // Neon glow blobs
    { type: 'shape', shapeType: 'circle', left: -80, top: 300, width: 500, height: 500, fill: '#00ff88', opacity: 0.06 },
    { type: 'shape', shapeType: 'circle', left: 680, top: 800, width: 400, height: 400, fill: '#ff00ff', opacity: 0.06 },
    // Main neon text
    { type: 'text', text: 'STAND\nOUT', fontSize: 120, fontWeight: '900', fill: '#00ff88', left: 100, top: 300, width: 880, textAlign: 'left' },
    // Accent line
    { type: 'shape', shapeType: 'rect', left: 100, top: 620, width: 300, height: 4, fill: '#ff00ff' },
    // Secondary text
    { type: 'text', text: 'From the noise.\nGet noticed.', fontSize: 40, fontWeight: '500', fill: '#a0a0b0', left: 100, top: 670, width: 880, textAlign: 'left' },
    // Swipe CTA
    { type: 'text', text: 'Swipe for more', fontSize: 24, fontWeight: '400', fill: '#505060', left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

const colorBlock: CarouselTemplate = {
  id: 'color-block',
  name: 'Color Block',
  description: 'Bold indigo with golden accent',
  category: 'bold',
  isPremium: false,
  background: { type: 'solid', value: '#4f46e5' },
  elements: [
    // Large decorative circle
    { type: 'shape', shapeType: 'circle', left: 700, top: -150, width: 500, height: 500, fill: '#ffffff', opacity: 0.08 },
    // Golden accent bar left
    { type: 'shape', shapeType: 'rect', left: 0, top: 300, width: 12, height: 500, fill: '#fbbf24' },
    // Main headline
    { type: 'text', text: 'Make An', fontSize: 72, fontWeight: '600', fill: '#e0e7ff', left: 100, top: 360, width: 880, textAlign: 'left' },
    { type: 'text', text: 'IMPACT', fontSize: 110, fontWeight: '900', fill: '#fbbf24', left: 100, top: 440, width: 880, textAlign: 'left' },
    // Supporting text
    { type: 'text', text: 'Content that converts and\ninspires your audience.', fontSize: 34, fontWeight: '400', fill: '#c7d2fe', left: 100, top: 610, width: 880, textAlign: 'left' },
    // Slide indicator
    { type: 'text', text: '01 / 07', fontSize: 22, fontWeight: '600', fill: '#ffffff', opacity: 0.6, left: 100, top: 1150, width: 880, textAlign: 'right' },
  ],
};

const retroOrange: CarouselTemplate = {
  id: 'retro-orange',
  name: 'Retro Orange',
  description: 'Warm bold typography',
  category: 'bold',
  isPremium: false,
  background: { type: 'solid', value: '#ea580c' },
  elements: [
    // Decorative circles
    { type: 'shape', shapeType: 'circle', left: 750, top: 100, width: 280, height: 280, fill: '#fbbf24', opacity: 0.25 },
    { type: 'shape', shapeType: 'circle', left: 810, top: 160, width: 160, height: 160, fill: '#ffffff', opacity: 0.15 },
    // Main headline
    { type: 'text', text: 'GROOVY\nIDEAS', fontSize: 110, fontWeight: '900', fill: '#ffffff', left: 100, top: 340, width: 880, textAlign: 'left' },
    // Underline accent
    { type: 'shape', shapeType: 'rect', left: 100, top: 640, width: 400, height: 10, fill: '#1e1b4b', rx: 5, ry: 5 },
    // Tagline
    { type: 'text', text: 'Vintage style,\nmodern results.', fontSize: 34, fontWeight: '500', fill: '#fff7ed', left: 100, top: 690, width: 880, textAlign: 'left' },
    // Footer
    { type: 'text', text: '@yourhandle', fontSize: 24, fontWeight: '500', fill: '#ffffff', opacity: 0.7, left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

// ============================================
// GRADIENT TEMPLATES
// ============================================

const oceanBreeze: CarouselTemplate = {
  id: 'ocean-breeze',
  name: 'Ocean Breeze',
  description: 'Fresh cyan to blue gradient',
  category: 'gradient',
  isPremium: false,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)' },
  elements: [
    // Floating blob
    { type: 'shape', shapeType: 'circle', left: -150, top: 900, width: 500, height: 500, fill: '#ffffff', opacity: 0.08 },
    // Pill badge
    { type: 'shape', shapeType: 'rect', left: 100, top: 250, width: 200, height: 48, fill: '#ffffff', opacity: 0.2, rx: 24, ry: 24 },
    { type: 'text', text: '7 Tips Inside', fontSize: 22, fontWeight: '700', fill: '#ffffff', left: 120, top: 260, width: 160, textAlign: 'center' },
    // Main headline
    { type: 'text', text: 'Fresh Ideas\nFlow Here', fontSize: 80, fontWeight: '800', fill: '#ffffff', left: 100, top: 370, width: 880, textAlign: 'left' },
    // Subtitle
    { type: 'text', text: 'Dive into content that\nmakes waves.', fontSize: 34, fontWeight: '400', fill: '#ffffff', opacity: 0.8, left: 100, top: 620, width: 880, textAlign: 'left' },
    // Swipe
    { type: 'text', text: 'Swipe to start', fontSize: 24, fontWeight: '400', fill: '#ffffff', opacity: 0.5, left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

const sunsetGlow: CarouselTemplate = {
  id: 'sunset-glow',
  name: 'Sunset Glow',
  description: 'Warm orange to pink gradient',
  category: 'gradient',
  isPremium: false,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #f97316 0%, #db2777 100%)' },
  elements: [
    // Sun circle
    { type: 'shape', shapeType: 'circle', left: 700, top: -80, width: 400, height: 400, fill: '#fef3c7', opacity: 0.15 },
    // Main content
    { type: 'text', text: 'Golden', fontSize: 90, fontWeight: '300', fill: '#ffffff', left: 100, top: 340, width: 880, textAlign: 'left' },
    { type: 'text', text: 'HOUR', fontSize: 130, fontWeight: '900', fill: '#ffffff', left: 100, top: 430, width: 880, textAlign: 'left' },
    // Tagline
    { type: 'text', text: 'When everything glows\nand ideas shine bright.', fontSize: 34, fontWeight: '400', fill: '#fff7ed', opacity: 0.85, left: 100, top: 620, width: 880, textAlign: 'left' },
    // Bottom bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 1100, width: 1080, height: 250, fill: '#000000', opacity: 0.15 },
    { type: 'text', text: '@yourhandle', fontSize: 24, fontWeight: '500', fill: '#ffffff', left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

const purpleHaze: CarouselTemplate = {
  id: 'purple-haze',
  name: 'Purple Haze',
  description: 'Deep purple to pink gradient',
  category: 'gradient',
  isPremium: false,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' },
  elements: [
    // Geometric decorations
    { type: 'shape', shapeType: 'rect', left: 800, top: 100, width: 180, height: 180, fill: '#ffffff', opacity: 0.08, rx: 20, ry: 20 },
    { type: 'shape', shapeType: 'rect', left: 850, top: 150, width: 180, height: 180, fill: '#ffffff', opacity: 0.06, rx: 20, ry: 20 },
    // Watermark number
    { type: 'text', text: '01', fontSize: 200, fontWeight: '900', fill: '#ffffff', opacity: 0.08, left: 700, top: 850, width: 300 },
    // Main content
    { type: 'text', text: 'CREATIVE\nVISION', fontSize: 84, fontWeight: '800', fill: '#ffffff', left: 100, top: 370, width: 880, textAlign: 'left' },
    // Tagline
    { type: 'text', text: 'Think outside the box.\nCreate what matters.', fontSize: 32, fontWeight: '400', fill: '#ffffff', opacity: 0.85, left: 100, top: 620, width: 880, textAlign: 'left' },
    // Footer
    { type: 'text', text: '@yourhandle', fontSize: 24, fontWeight: '500', fill: '#ffffff', opacity: 0.6, left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

const forestGreen: CarouselTemplate = {
  id: 'forest-green',
  name: 'Forest',
  description: 'Calming green gradient',
  category: 'gradient',
  isPremium: false,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)' },
  elements: [
    // Decorative circles
    { type: 'shape', shapeType: 'circle', left: 800, top: 150, width: 280, height: 280, fill: '#ffffff', opacity: 0.08 },
    { type: 'shape', shapeType: 'circle', left: 730, top: 250, width: 180, height: 180, fill: '#ffffff', opacity: 0.05 },
    // Main text
    { type: 'text', text: 'Sustainable', fontSize: 64, fontWeight: '500', fill: '#d1fae5', left: 100, top: 360, width: 880, textAlign: 'left' },
    { type: 'text', text: 'GROWTH', fontSize: 100, fontWeight: '900', fill: '#ffffff', left: 100, top: 430, width: 880, textAlign: 'left' },
    // Yellow accent
    { type: 'shape', shapeType: 'rect', left: 100, top: 580, width: 120, height: 5, fill: '#fbbf24', rx: 3, ry: 3 },
    // Supporting text
    { type: 'text', text: 'Building for the long term.\nStrategies that compound.', fontSize: 32, fontWeight: '400', fill: '#ffffff', opacity: 0.85, left: 100, top: 620, width: 880, textAlign: 'left' },
    // Footer
    { type: 'text', text: '@yourhandle', fontSize: 24, fontWeight: '500', fill: '#ffffff', opacity: 0.5, left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

// ============================================
// CORPORATE TEMPLATES
// ============================================

const linkedinBlue: CarouselTemplate = {
  id: 'linkedin-blue',
  name: 'LinkedIn Blue',
  description: 'Official LinkedIn brand feel',
  category: 'corporate',
  isPremium: false,
  background: { type: 'solid', value: '#0A66C2' },
  elements: [
    // White card
    { type: 'shape', shapeType: 'rect', left: 80, top: 250, width: 920, height: 700, fill: '#ffffff', rx: 20, ry: 20 },
    // Content inside card
    { type: 'text', text: 'Professional', fontSize: 52, fontWeight: '500', fill: '#0A66C2', left: 140, top: 320, width: 800, textAlign: 'left' },
    { type: 'text', text: 'INSIGHT', fontSize: 76, fontWeight: '800', fill: '#0f172a', left: 140, top: 380, width: 800, textAlign: 'left' },
    // Divider
    { type: 'shape', shapeType: 'rect', left: 140, top: 500, width: 800, height: 2, fill: '#e5e7eb' },
    // Body text
    { type: 'text', text: 'Expert knowledge shared\nwith clarity and purpose.', fontSize: 30, fontWeight: '400', fill: '#64748b', left: 140, top: 540, width: 800, textAlign: 'left' },
    // Engagement dots
    { type: 'shape', shapeType: 'circle', left: 140, top: 750, width: 36, height: 36, fill: '#0A66C2', opacity: 0.15 },
    { type: 'shape', shapeType: 'circle', left: 190, top: 750, width: 36, height: 36, fill: '#0A66C2', opacity: 0.15 },
    { type: 'shape', shapeType: 'circle', left: 240, top: 750, width: 36, height: 36, fill: '#0A66C2', opacity: 0.15 },
    // Bottom branding
    { type: 'text', text: '@yourhandle', fontSize: 24, fontWeight: '500', fill: '#ffffff', left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

const executiveNavy: CarouselTemplate = {
  id: 'executive-navy',
  name: 'Executive Navy',
  description: 'Premium navy with gold accents',
  category: 'corporate',
  isPremium: false,
  background: { type: 'solid', value: '#1e3a5f' },
  elements: [
    // Gold corner accent - top left
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 6, height: 180, fill: '#d4af37' },
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 180, height: 6, fill: '#d4af37' },
    // Main content
    { type: 'text', text: 'Executive', fontSize: 64, fontWeight: '400', fill: '#d4af37', left: 100, top: 360, width: 880, textAlign: 'left' },
    { type: 'text', text: 'SUMMARY', fontSize: 84, fontWeight: '800', fill: '#ffffff', left: 100, top: 430, width: 880, textAlign: 'left' },
    // Gold divider
    { type: 'shape', shapeType: 'rect', left: 100, top: 570, width: 160, height: 4, fill: '#d4af37' },
    // Supporting text
    { type: 'text', text: 'Leadership insights that\ndrive results and growth.', fontSize: 32, fontWeight: '400', fill: '#94a3b8', left: 100, top: 610, width: 880, textAlign: 'left' },
    // Bottom gold line
    { type: 'shape', shapeType: 'rect', left: 0, top: 1310, width: 1080, height: 6, fill: '#d4af37' },
    // Footer
    { type: 'text', text: '@yourhandle', fontSize: 24, fontWeight: '500', fill: '#64748b', left: 100, top: 1150, width: 880, textAlign: 'left' },
  ],
};

const techStartup: CarouselTemplate = {
  id: 'tech-startup',
  name: 'Tech Startup',
  description: 'Modern dark tech aesthetic',
  category: 'corporate',
  isPremium: false,
  background: { type: 'solid', value: '#0f172a' },
  elements: [
    // Tech grid lines
    { type: 'shape', shapeType: 'rect', left: 820, top: 80, width: 2, height: 350, fill: '#3b82f6', opacity: 0.25 },
    { type: 'shape', shapeType: 'rect', left: 870, top: 80, width: 2, height: 250, fill: '#3b82f6', opacity: 0.15 },
    { type: 'shape', shapeType: 'rect', left: 920, top: 80, width: 2, height: 450, fill: '#3b82f6', opacity: 0.3 },
    // Blue accent dot
    { type: 'shape', shapeType: 'circle', left: 100, top: 310, width: 14, height: 14, fill: '#3b82f6' },
    // Main content
    { type: 'text', text: 'Innovation', fontSize: 72, fontWeight: '600', fill: '#f8fafc', left: 100, top: 360, width: 880, textAlign: 'left' },
    { type: 'text', text: 'AHEAD', fontSize: 92, fontWeight: '900', fill: '#3b82f6', left: 100, top: 440, width: 880, textAlign: 'left' },
    // Tagline
    { type: 'text', text: 'Building the future,\none step at a time.', fontSize: 30, fontWeight: '400', fill: '#94a3b8', left: 100, top: 590, width: 880, textAlign: 'left' },
    // Progress bar
    { type: 'shape', shapeType: 'rect', left: 100, top: 1130, width: 880, height: 6, fill: '#1e293b', rx: 3, ry: 3 },
    { type: 'shape', shapeType: 'rect', left: 100, top: 1130, width: 280, height: 6, fill: '#3b82f6', rx: 3, ry: 3 },
    // Footer
    { type: 'text', text: '01 / 07', fontSize: 22, fontWeight: '500', fill: '#475569', left: 100, top: 1160, width: 880, textAlign: 'right' },
  ],
};

// ============================================
// CREATIVE TEMPLATES
// ============================================

const magazine: CarouselTemplate = {
  id: 'magazine',
  name: 'Magazine',
  description: 'Editorial layout with bold typography',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#fafafa' },
  elements: [
    // Red top bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 1080, height: 70, fill: '#dc2626' },
    { type: 'text', text: 'ISSUE 01', fontSize: 18, fontWeight: '700', fill: '#ffffff', left: 100, top: 22, width: 200, textAlign: 'left' },
    // Large headline
    { type: 'text', text: 'THE', fontSize: 52, fontWeight: '400', fill: '#525252', left: 100, top: 300, width: 880, textAlign: 'left' },
    { type: 'text', text: 'HEADLINE', fontSize: 100, fontWeight: '900', fill: '#0a0a0a', left: 100, top: 350, width: 880, textAlign: 'left' },
    // Red underline
    { type: 'shape', shapeType: 'rect', left: 100, top: 490, width: 350, height: 6, fill: '#dc2626' },
    // Subheadline
    { type: 'text', text: 'Editorial excellence\nin every word you write.', fontSize: 30, fontWeight: '400', fill: '#525252', left: 100, top: 530, width: 880, textAlign: 'left' },
    // Image placeholder
    { type: 'shape', shapeType: 'rect', left: 100, top: 700, width: 880, height: 300, fill: '#e5e5e5', rx: 12, ry: 12 },
    { type: 'text', text: 'IMAGE', fontSize: 24, fontWeight: '500', fill: '#a3a3a3', left: 100, top: 820, width: 880, textAlign: 'center' },
  ],
};

const splitDuo: CarouselTemplate = {
  id: 'split-duo',
  name: 'Split Duo',
  description: 'Two-tone editorial split layout',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#ffffff' },
  elements: [
    // Left panel dark
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 430, height: 1350, fill: '#1e293b' },
    // Left side: large number
    { type: 'text', text: '01', fontSize: 140, fontWeight: '900', fill: '#f59e0b', left: 80, top: 350, width: 280, textAlign: 'left' },
    // Left side: small label
    { type: 'text', text: '@yourhandle', fontSize: 20, fontWeight: '400', fill: '#94a3b8', left: 80, top: 1150, width: 280, textAlign: 'left' },
    // Right side: headline
    { type: 'text', text: 'The Key\nInsight\nHere', fontSize: 64, fontWeight: '800', fill: '#1e293b', left: 490, top: 340, width: 530, textAlign: 'left' },
    // Right side: body
    { type: 'text', text: 'Explain this concept\nclearly in a few short\nsentences.', fontSize: 28, fontWeight: '400', fill: '#64748b', left: 490, top: 600, width: 530, textAlign: 'left' },
    // Accent dot at divider
    { type: 'shape', shapeType: 'circle', left: 405, top: 650, width: 50, height: 50, fill: '#f59e0b' },
  ],
};

const handwritten: CarouselTemplate = {
  id: 'handwritten',
  name: 'Notebook',
  description: 'Personal notebook feel',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#fefce8' },
  elements: [
    // Notebook lines
    { type: 'shape', shapeType: 'rect', left: 0, top: 250, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 350, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 450, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 550, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 650, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 750, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    // Red margin line
    { type: 'shape', shapeType: 'rect', left: 120, top: 0, width: 2, height: 1350, fill: '#fca5a5', opacity: 0.5 },
    // Greeting
    { type: 'text', text: 'Dear Reader,', fontSize: 40, fontWeight: '400', fill: '#1c1917', left: 160, top: 280, width: 860, textAlign: 'left' },
    // Main text
    { type: 'text', text: 'This is your\npersonal note', fontSize: 56, fontWeight: '700', fill: '#1c1917', left: 160, top: 380, width: 860, textAlign: 'left' },
    // Red highlight word
    { type: 'text', text: 'that matters.', fontSize: 56, fontWeight: '700', fill: '#dc2626', left: 160, top: 520, width: 860, textAlign: 'left' },
    // Signature
    { type: 'text', text: '- Your Name', fontSize: 32, fontWeight: '400', fill: '#44403c', left: 160, top: 700, width: 860, textAlign: 'left' },
  ],
};

const monochrome: CarouselTemplate = {
  id: 'monochrome',
  name: 'Monochrome',
  description: 'Pure black and white typography',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#000000' },
  elements: [
    // Centered powerful text
    { type: 'text', text: 'One powerful\nsentence that\nmakes you\nstop.', fontSize: 72, fontWeight: '800', fill: '#ffffff', left: 100, top: 300, width: 880, textAlign: 'left' },
    // Thin divider
    { type: 'shape', shapeType: 'rect', left: 100, top: 800, width: 200, height: 2, fill: '#ffffff', opacity: 0.3 },
    // Author
    { type: 'text', text: '- Your Name', fontSize: 28, fontWeight: '400', fill: '#ffffff', opacity: 0.6, left: 100, top: 840, width: 880, textAlign: 'left' },
  ],
};

// ============================================
// DATA TEMPLATES
// ============================================

const dataViz: CarouselTemplate = {
  id: 'data-viz',
  name: 'Data Viz',
  description: 'Statistics and metrics focused',
  category: 'data',
  isPremium: false,
  background: { type: 'solid', value: '#0f172a' },
  elements: [
    // Glow blob
    { type: 'shape', shapeType: 'circle', left: 700, top: 200, width: 400, height: 400, fill: '#22c55e', opacity: 0.08 },
    // Label
    { type: 'text', text: 'Did you know?', fontSize: 28, fontWeight: '500', fill: '#22c55e', left: 100, top: 200, width: 880, textAlign: 'left' },
    // Large stat number
    { type: 'text', text: '87%', fontSize: 180, fontWeight: '900', fill: '#22c55e', left: 100, top: 260, width: 880, textAlign: 'left' },
    // Stat label
    { type: 'text', text: 'OF USERS', fontSize: 40, fontWeight: '700', fill: '#ffffff', left: 100, top: 480, width: 880, textAlign: 'left' },
    { type: 'text', text: 'saw results in just 30 days.', fontSize: 34, fontWeight: '400', fill: '#94a3b8', left: 100, top: 540, width: 880, textAlign: 'left' },
    // Progress bar
    { type: 'shape', shapeType: 'rect', left: 100, top: 700, width: 880, height: 50, fill: '#1e293b', rx: 8, ry: 8 },
    { type: 'shape', shapeType: 'rect', left: 100, top: 700, width: 766, height: 50, fill: '#22c55e', rx: 8, ry: 8 },
    // Legend
    { type: 'shape', shapeType: 'circle', left: 100, top: 800, width: 14, height: 14, fill: '#22c55e' },
    { type: 'text', text: 'Success rate', fontSize: 22, fontWeight: '400', fill: '#94a3b8', left: 130, top: 795, width: 300 },
    // Source
    { type: 'text', text: 'Source: Internal data', fontSize: 18, fontWeight: '400', fill: '#475569', left: 100, top: 1160, width: 880, textAlign: 'left' },
  ],
};

const counterCard: CarouselTemplate = {
  id: 'counter-card',
  name: 'Counter Card',
  description: 'Big number highlight on card',
  category: 'data',
  isPremium: false,
  background: { type: 'solid', value: '#f1f5f9' },
  elements: [
    // Accent top bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 1080, height: 10, fill: '#6366f1' },
    // White card
    { type: 'shape', shapeType: 'rect', left: 80, top: 160, width: 920, height: 880, fill: '#ffffff', rx: 24, ry: 24 },
    // Badge
    { type: 'shape', shapeType: 'rect', left: 140, top: 220, width: 180, height: 40, fill: '#6366f1', opacity: 0.1, rx: 20, ry: 20 },
    { type: 'text', text: 'KEY METRIC', fontSize: 18, fontWeight: '700', fill: '#6366f1', left: 155, top: 228, width: 150, textAlign: 'center' },
    // Large number
    { type: 'text', text: '10x', fontSize: 200, fontWeight: '900', fill: '#6366f1', left: 140, top: 300, width: 800, textAlign: 'center' },
    // Label
    { type: 'text', text: 'FASTER', fontSize: 56, fontWeight: '800', fill: '#0f172a', left: 140, top: 530, width: 800, textAlign: 'center' },
    // Description
    { type: 'text', text: 'than traditional methods', fontSize: 30, fontWeight: '400', fill: '#64748b', left: 140, top: 610, width: 800, textAlign: 'center' },
    // Comparison bars
    { type: 'text', text: 'Before', fontSize: 18, fontWeight: '500', fill: '#94a3b8', left: 160, top: 730, width: 100 },
    { type: 'shape', shapeType: 'rect', left: 280, top: 730, width: 660, height: 30, fill: '#e2e8f0', rx: 6, ry: 6 },
    { type: 'shape', shapeType: 'rect', left: 280, top: 730, width: 66, height: 30, fill: '#94a3b8', rx: 6, ry: 6 },
    { type: 'text', text: 'After', fontSize: 18, fontWeight: '500', fill: '#6366f1', left: 160, top: 790, width: 100 },
    { type: 'shape', shapeType: 'rect', left: 280, top: 790, width: 660, height: 30, fill: '#e2e8f0', rx: 6, ry: 6 },
    { type: 'shape', shapeType: 'rect', left: 280, top: 790, width: 660, height: 30, fill: '#6366f1', rx: 6, ry: 6 },
  ],
};

const statsHero: CarouselTemplate = {
  id: 'stats-hero',
  name: 'Stats Hero',
  description: 'Big numbers with context',
  category: 'data',
  isPremium: false,
  background: { type: 'solid', value: '#18181b' },
  elements: [
    // Gradient blob
    { type: 'shape', shapeType: 'circle', left: -100, top: 400, width: 500, height: 500, fill: '#8b5cf6', opacity: 0.08 },
    { type: 'shape', shapeType: 'circle', left: 700, top: 700, width: 400, height: 400, fill: '#3b82f6', opacity: 0.06 },
    // Label
    { type: 'text', text: 'BY THE NUMBERS', fontSize: 22, fontWeight: '700', fill: '#a78bfa', left: 100, top: 150, width: 880, textAlign: 'left' },
    // Frosted card
    { type: 'shape', shapeType: 'rect', left: 80, top: 230, width: 920, height: 350, fill: '#ffffff', opacity: 0.05, rx: 20, ry: 20 },
    // Main stat
    { type: 'text', text: '3.2x', fontSize: 120, fontWeight: '900', fill: '#a78bfa', left: 140, top: 260, width: 800, textAlign: 'left' },
    // Stat description
    { type: 'text', text: 'More engagement than\nsingle-image posts', fontSize: 36, fontWeight: '600', fill: '#e2e8f0', left: 140, top: 420, width: 800, textAlign: 'left' },
    // Body text
    { type: 'text', text: 'Carousels consistently outperform\nother content formats on LinkedIn.', fontSize: 30, fontWeight: '400', fill: '#71717a', left: 100, top: 650, width: 880, textAlign: 'left' },
    // Mini comparison bars
    { type: 'text', text: 'Carousels', fontSize: 20, fontWeight: '500', fill: '#a78bfa', left: 100, top: 820, width: 200 },
    { type: 'shape', shapeType: 'rect', left: 280, top: 820, width: 700, height: 24, fill: '#a78bfa', rx: 4, ry: 4 },
    { type: 'text', text: 'Images', fontSize: 20, fontWeight: '500', fill: '#71717a', left: 100, top: 860, width: 200 },
    { type: 'shape', shapeType: 'rect', left: 280, top: 860, width: 300, height: 24, fill: '#3f3f46', rx: 4, ry: 4 },
    { type: 'text', text: 'Text only', fontSize: 20, fontWeight: '500', fill: '#71717a', left: 100, top: 900, width: 200 },
    { type: 'shape', shapeType: 'rect', left: 280, top: 900, width: 120, height: 24, fill: '#3f3f46', rx: 4, ry: 4 },
    // Source
    { type: 'text', text: 'Source: LinkedIn data', fontSize: 18, fontWeight: '400', fill: '#52525b', left: 100, top: 1160, width: 880, textAlign: 'left' },
  ],
};

// ============================================
// EXPORT ALL TEMPLATES
// ============================================

export const carouselTemplates: CarouselTemplate[] = [
  // Minimal (3)
  cleanWhite,
  darkMode,
  softBeige,
  // Bold (3)
  neonPop,
  colorBlock,
  retroOrange,
  // Gradient (4)
  oceanBreeze,
  sunsetGlow,
  purpleHaze,
  forestGreen,
  // Corporate (3)
  linkedinBlue,
  executiveNavy,
  techStartup,
  // Creative (4)
  magazine,
  splitDuo,
  handwritten,
  monochrome,
  // Data (3)
  dataViz,
  counterCard,
  statsHero,
];

export const templateCategories: { id: TemplateCategory; name: string; description: string }[] = [
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple designs' },
  { id: 'bold', name: 'Bold', description: 'High-impact, attention-grabbing' },
  { id: 'gradient', name: 'Gradient', description: 'Colorful gradient backgrounds' },
  { id: 'corporate', name: 'Corporate', description: 'Professional business styles' },
  { id: 'creative', name: 'Creative', description: 'Unique and artistic' },
  { id: 'data', name: 'Data', description: 'Statistics and metrics' },
];

export function getTemplateById(id: string): CarouselTemplate | undefined {
  return carouselTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): CarouselTemplate[] {
  return carouselTemplates.filter(t => t.category === category);
}

export const defaultTemplate = cleanWhite;
