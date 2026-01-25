// Carousel Template System for LinkedGrow
// Templates now include complete slide designs with multiple elements

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
// MINIMAL TEMPLATES - Clean and Simple
// ============================================

const cleanWhite: CarouselTemplate = {
  id: 'clean-white',
  name: 'Clean White',
  description: 'Minimalist white with cyan accent line',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#ffffff' },
  elements: [
    // Top accent line
    { type: 'shape', shapeType: 'rect', left: 80, top: 120, width: 200, height: 6, fill: '#0891b2', rx: 3, ry: 3 },
    // Main headline
    { type: 'text', text: 'Your Headline Here', fontSize: 72, fontWeight: 'bold', fill: '#1a1a2e', left: 80, top: 180, width: 920, textAlign: 'left' },
    // Subheadline
    { type: 'text', text: 'Add your supporting message that explains the main point', fontSize: 36, fontWeight: 'normal', fill: '#64748b', left: 80, top: 320, width: 920, textAlign: 'left' },
    // Bottom decorative dots
    { type: 'shape', shapeType: 'circle', left: 80, top: 1200, width: 12, height: 12, fill: '#0891b2' },
    { type: 'shape', shapeType: 'circle', left: 110, top: 1200, width: 12, height: 12, fill: '#0891b2', opacity: 0.5 },
    { type: 'shape', shapeType: 'circle', left: 140, top: 1200, width: 12, height: 12, fill: '#0891b2', opacity: 0.3 },
    // Handle placeholder
    { type: 'text', text: '@yourhandle', fontSize: 28, fontWeight: 'normal', fill: '#94a3b8', left: 80, top: 1260, textAlign: 'left' },
  ],
};

const darkMode: CarouselTemplate = {
  id: 'dark-mode',
  name: 'Dark Mode',
  description: 'Sleek dark with glowing accent',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#0f172a' },
  elements: [
    // Glowing accent circle (top right)
    { type: 'shape', shapeType: 'circle', left: 800, top: -100, width: 400, height: 400, fill: '#0891b2', opacity: 0.15 },
    // Main headline
    { type: 'text', text: 'Bold Statement', fontSize: 80, fontWeight: 'bold', fill: '#ffffff', left: 80, top: 450, width: 920, textAlign: 'left' },
    // Accent underline
    { type: 'shape', shapeType: 'rect', left: 80, top: 560, width: 300, height: 8, fill: '#22d3ee', rx: 4, ry: 4 },
    // Supporting text
    { type: 'text', text: 'Your key message goes here with impact', fontSize: 32, fontWeight: 'normal', fill: '#94a3b8', left: 80, top: 620, width: 920, textAlign: 'left' },
    // Bottom branding area
    { type: 'shape', shapeType: 'rect', left: 0, top: 1200, width: 1080, height: 150, fill: '#1e293b' },
    { type: 'text', text: '@yourhandle', fontSize: 28, fontWeight: '500', fill: '#64748b', left: 80, top: 1250, textAlign: 'left' },
  ],
};

const softBeige: CarouselTemplate = {
  id: 'soft-beige',
  name: 'Soft Beige',
  description: 'Warm and elegant with serif typography',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#faf8f5' },
  elements: [
    // Decorative corner element
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 40, height: 300, fill: '#d4a574', opacity: 0.3 },
    // Main headline (serif style)
    { type: 'text', text: 'Elegant Ideas', fontSize: 76, fontWeight: 'bold', fontFamily: 'Georgia', fill: '#2c2c2c', left: 100, top: 400, width: 880, textAlign: 'center' },
    // Decorative line
    { type: 'shape', shapeType: 'rect', left: 390, top: 520, width: 300, height: 3, fill: '#d4a574' },
    // Supporting text
    { type: 'text', text: 'Thoughtful content that resonates', fontSize: 32, fontWeight: 'normal', fontFamily: 'Georgia', fill: '#5c5c5c', left: 100, top: 580, width: 880, textAlign: 'center' },
    // Bottom quote marks
    { type: 'text', text: '"', fontSize: 200, fontWeight: 'normal', fontFamily: 'Georgia', fill: '#d4a574', opacity: 0.2, left: 80, top: 1000 },
  ],
};

// ============================================
// BOLD TEMPLATES - High Impact
// ============================================

const neonPop: CarouselTemplate = {
  id: 'neon-pop',
  name: 'Neon Pop',
  description: 'Electric neon on dark background',
  category: 'bold',
  isPremium: false,
  background: { type: 'solid', value: '#0a0a0f' },
  elements: [
    // Neon glow effect (multiple circles)
    { type: 'shape', shapeType: 'circle', left: -100, top: 200, width: 600, height: 600, fill: '#00ff88', opacity: 0.05 },
    { type: 'shape', shapeType: 'circle', left: 600, top: 800, width: 400, height: 400, fill: '#ff00ff', opacity: 0.05 },
    // Main neon text
    { type: 'text', text: 'STAND OUT', fontSize: 100, fontWeight: '900', fill: '#00ff88', left: 80, top: 450, width: 920, textAlign: 'left' },
    // Secondary text in magenta
    { type: 'text', text: 'FROM THE NOISE', fontSize: 60, fontWeight: '700', fill: '#ff00ff', left: 80, top: 580, width: 920, textAlign: 'left' },
    // Accent line
    { type: 'shape', shapeType: 'rect', left: 80, top: 700, width: 400, height: 4, fill: '#00ff88' },
    // CTA text
    { type: 'text', text: 'Swipe for more →', fontSize: 28, fontWeight: '500', fill: '#ffffff', left: 80, top: 1200 },
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
    { type: 'shape', shapeType: 'circle', left: 700, top: -200, width: 600, height: 600, fill: '#ffffff', opacity: 0.1 },
    // Golden accent bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 350, width: 20, height: 400, fill: '#fbbf24' },
    // Main headline
    { type: 'text', text: 'Make An', fontSize: 80, fontWeight: '700', fill: '#ffffff', left: 80, top: 400, width: 920, textAlign: 'left' },
    { type: 'text', text: 'IMPACT', fontSize: 120, fontWeight: '900', fill: '#fbbf24', left: 80, top: 490, width: 920, textAlign: 'left' },
    // Supporting text
    { type: 'text', text: 'Content that converts', fontSize: 36, fontWeight: '400', fill: '#e0e7ff', left: 80, top: 650, width: 920, textAlign: 'left' },
    // Bottom slide indicator
    { type: 'text', text: '01 / 07', fontSize: 24, fontWeight: '600', fill: '#ffffff', opacity: 0.7, left: 920, top: 1260 },
  ],
};

const retroOrange: CarouselTemplate = {
  id: 'retro-orange',
  name: 'Retro Orange',
  description: 'Warm 70s vibes with bold typography',
  category: 'bold',
  isPremium: true,
  background: { type: 'solid', value: '#ea580c' },
  elements: [
    // Retro circle pattern
    { type: 'shape', shapeType: 'circle', left: 750, top: 100, width: 300, height: 300, fill: '#fbbf24', opacity: 0.3 },
    { type: 'shape', shapeType: 'circle', left: 820, top: 170, width: 160, height: 160, fill: '#ffffff', opacity: 0.2 },
    // Main headline
    { type: 'text', text: 'GROOVY', fontSize: 120, fontWeight: '900', fill: '#ffffff', left: 80, top: 400, width: 920, textAlign: 'left' },
    { type: 'text', text: 'IDEAS', fontSize: 120, fontWeight: '900', fill: '#fef3c7', left: 80, top: 520, width: 920, textAlign: 'left' },
    // Wavy underline (simulated with rect)
    { type: 'shape', shapeType: 'rect', left: 80, top: 680, width: 500, height: 12, fill: '#1e1b4b', rx: 6, ry: 6 },
    // Tagline
    { type: 'text', text: 'Vintage style, modern results', fontSize: 32, fontWeight: '500', fill: '#fff7ed', left: 80, top: 740, width: 920, textAlign: 'left' },
  ],
};

// ============================================
// GRADIENT TEMPLATES - Colorful Backgrounds
// ============================================

const oceanBreeze: CarouselTemplate = {
  id: 'ocean-breeze',
  name: 'Ocean Breeze',
  description: 'Fresh cyan to blue gradient',
  category: 'gradient',
  isPremium: false,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)' },
  elements: [
    // Wave-like shape
    { type: 'shape', shapeType: 'circle', left: -200, top: 900, width: 600, height: 600, fill: '#ffffff', opacity: 0.1 },
    // Main headline
    { type: 'text', text: 'Fresh Ideas', fontSize: 90, fontWeight: '700', fill: '#ffffff', left: 80, top: 380, width: 920, textAlign: 'left' },
    { type: 'text', text: 'Flow Here', fontSize: 90, fontWeight: '700', fill: '#e0f2fe', left: 80, top: 490, width: 920, textAlign: 'left' },
    // Divider
    { type: 'shape', shapeType: 'rect', left: 80, top: 630, width: 120, height: 6, fill: '#ffffff', rx: 3, ry: 3 },
    // Supporting text
    { type: 'text', text: 'Dive into content that makes waves', fontSize: 32, fontWeight: '400', fill: '#ffffff', opacity: 0.9, left: 80, top: 680, width: 920, textAlign: 'left' },
    // CTA arrow
    { type: 'text', text: '→', fontSize: 48, fontWeight: '400', fill: '#ffffff', left: 980, top: 1220 },
  ],
};

const sunsetGlow: CarouselTemplate = {
  id: 'sunset-glow',
  name: 'Sunset Glow',
  description: 'Warm orange to pink gradient',
  category: 'gradient',
  isPremium: true,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #f97316 0%, #db2777 100%)' },
  elements: [
    // Sun circle
    { type: 'shape', shapeType: 'circle', left: 700, top: -100, width: 500, height: 500, fill: '#fef3c7', opacity: 0.2 },
    // Main content
    { type: 'text', text: 'Golden', fontSize: 100, fontWeight: '300', fill: '#ffffff', left: 80, top: 380, width: 920, textAlign: 'left' },
    { type: 'text', text: 'HOUR', fontSize: 140, fontWeight: '900', fill: '#ffffff', left: 80, top: 470, width: 920, textAlign: 'left' },
    // Tagline
    { type: 'text', text: 'When everything glows', fontSize: 36, fontWeight: '400', fill: '#fff7ed', left: 80, top: 650, width: 920, textAlign: 'left' },
    // Bottom branding bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 1180, width: 1080, height: 170, fill: '#000000', opacity: 0.2 },
    { type: 'text', text: '@yourhandle', fontSize: 28, fontWeight: '500', fill: '#ffffff', left: 80, top: 1240, textAlign: 'left' },
  ],
};

const purpleHaze: CarouselTemplate = {
  id: 'purple-haze',
  name: 'Purple Haze',
  description: 'Deep purple to pink gradient',
  category: 'gradient',
  isPremium: true,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' },
  elements: [
    // Geometric decoration
    { type: 'shape', shapeType: 'rect', left: 800, top: 100, width: 200, height: 200, fill: '#ffffff', opacity: 0.1, rx: 20, ry: 20 },
    { type: 'shape', shapeType: 'rect', left: 850, top: 150, width: 200, height: 200, fill: '#ffffff', opacity: 0.1, rx: 20, ry: 20 },
    // Number indicator
    { type: 'text', text: '01', fontSize: 200, fontWeight: '900', fill: '#ffffff', opacity: 0.1, left: 700, top: 800 },
    // Main content
    { type: 'text', text: 'CREATIVE', fontSize: 90, fontWeight: '800', fill: '#ffffff', left: 80, top: 420, width: 920, textAlign: 'left' },
    { type: 'text', text: 'VISION', fontSize: 90, fontWeight: '800', fill: '#fdf4ff', left: 80, top: 530, width: 920, textAlign: 'left' },
    // Tagline
    { type: 'text', text: 'Think outside the box', fontSize: 32, fontWeight: '400', fill: '#ffffff', opacity: 0.9, left: 80, top: 680, width: 920, textAlign: 'left' },
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
    // Leaf-like shapes
    { type: 'shape', shapeType: 'circle', left: 850, top: 150, width: 300, height: 300, fill: '#ffffff', opacity: 0.1 },
    { type: 'shape', shapeType: 'circle', left: 750, top: 250, width: 200, height: 200, fill: '#ffffff', opacity: 0.05 },
    // Main text
    { type: 'text', text: 'Sustainable', fontSize: 70, fontWeight: '600', fill: '#d1fae5', left: 80, top: 400, width: 920, textAlign: 'left' },
    { type: 'text', text: 'GROWTH', fontSize: 110, fontWeight: '800', fill: '#ffffff', left: 80, top: 480, width: 920, textAlign: 'left' },
    // Accent line
    { type: 'shape', shapeType: 'rect', left: 80, top: 630, width: 150, height: 6, fill: '#fbbf24', rx: 3, ry: 3 },
    // Supporting text
    { type: 'text', text: 'Building for the long term', fontSize: 30, fontWeight: '400', fill: '#ffffff', opacity: 0.9, left: 80, top: 680, width: 920, textAlign: 'left' },
  ],
};

// ============================================
// CORPORATE TEMPLATES - Professional
// ============================================

const linkedinBlue: CarouselTemplate = {
  id: 'linkedin-blue',
  name: 'LinkedIn Blue',
  description: 'Official LinkedIn brand colors',
  category: 'corporate',
  isPremium: false,
  background: { type: 'solid', value: '#0A66C2' },
  elements: [
    // LinkedIn-style card
    { type: 'shape', shapeType: 'rect', left: 60, top: 280, width: 960, height: 600, fill: '#ffffff', rx: 16, ry: 16 },
    // Content inside card
    { type: 'text', text: 'Professional', fontSize: 60, fontWeight: '600', fill: '#0A66C2', left: 120, top: 380, width: 840, textAlign: 'left' },
    { type: 'text', text: 'INSIGHT', fontSize: 80, fontWeight: '800', fill: '#1a1a2e', left: 120, top: 460, width: 840, textAlign: 'left' },
    // Divider line
    { type: 'shape', shapeType: 'rect', left: 120, top: 580, width: 840, height: 2, fill: '#e5e7eb' },
    // Supporting text
    { type: 'text', text: 'Expert knowledge shared with clarity', fontSize: 28, fontWeight: '400', fill: '#64748b', left: 120, top: 620, width: 840, textAlign: 'left' },
    // Engagement icons placeholder
    { type: 'shape', shapeType: 'circle', left: 120, top: 760, width: 40, height: 40, fill: '#0A66C2', opacity: 0.2 },
    { type: 'shape', shapeType: 'circle', left: 180, top: 760, width: 40, height: 40, fill: '#0A66C2', opacity: 0.2 },
    { type: 'shape', shapeType: 'circle', left: 240, top: 760, width: 40, height: 40, fill: '#0A66C2', opacity: 0.2 },
    // Bottom branding
    { type: 'text', text: '@yourhandle', fontSize: 26, fontWeight: '500', fill: '#ffffff', left: 80, top: 1260, textAlign: 'left' },
  ],
};

const executiveNavy: CarouselTemplate = {
  id: 'executive-navy',
  name: 'Executive Navy',
  description: 'Premium navy with gold accents',
  category: 'corporate',
  isPremium: true,
  background: { type: 'solid', value: '#1e3a5f' },
  elements: [
    // Gold corner accent
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 8, height: 200, fill: '#d4af37' },
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 200, height: 8, fill: '#d4af37' },
    // Main content
    { type: 'text', text: 'Executive', fontSize: 70, fontWeight: '400', fontFamily: 'Georgia', fill: '#d4af37', left: 80, top: 400, width: 920, textAlign: 'left' },
    { type: 'text', text: 'SUMMARY', fontSize: 90, fontWeight: '700', fill: '#ffffff', left: 80, top: 480, width: 920, textAlign: 'left' },
    // Gold line
    { type: 'shape', shapeType: 'rect', left: 80, top: 610, width: 200, height: 4, fill: '#d4af37' },
    // Supporting text
    { type: 'text', text: 'Leadership insights that drive results', fontSize: 30, fontWeight: '400', fill: '#94a3b8', left: 80, top: 660, width: 920, textAlign: 'left' },
    // Bottom gold line
    { type: 'shape', shapeType: 'rect', left: 0, top: 1300, width: 1080, height: 8, fill: '#d4af37' },
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
    // Tech grid pattern (simplified)
    { type: 'shape', shapeType: 'rect', left: 800, top: 100, width: 2, height: 400, fill: '#3b82f6', opacity: 0.3 },
    { type: 'shape', shapeType: 'rect', left: 850, top: 100, width: 2, height: 300, fill: '#3b82f6', opacity: 0.2 },
    { type: 'shape', shapeType: 'rect', left: 900, top: 100, width: 2, height: 500, fill: '#3b82f6', opacity: 0.4 },
    // Blue accent dot
    { type: 'shape', shapeType: 'circle', left: 80, top: 350, width: 16, height: 16, fill: '#3b82f6' },
    // Main content
    { type: 'text', text: 'Innovation', fontSize: 80, fontWeight: '600', fill: '#f8fafc', left: 80, top: 400, width: 920, textAlign: 'left' },
    { type: 'text', text: 'AHEAD', fontSize: 100, fontWeight: '800', fill: '#3b82f6', left: 80, top: 500, width: 920, textAlign: 'left' },
    // Tagline
    { type: 'text', text: 'Building the future, one line at a time', fontSize: 28, fontWeight: '400', fill: '#94a3b8', left: 80, top: 650, width: 920, textAlign: 'left' },
    // Progress bar
    { type: 'shape', shapeType: 'rect', left: 80, top: 1200, width: 920, height: 8, fill: '#1e293b', rx: 4, ry: 4 },
    { type: 'shape', shapeType: 'rect', left: 80, top: 1200, width: 300, height: 8, fill: '#3b82f6', rx: 4, ry: 4 },
  ],
};

// ============================================
// CREATIVE TEMPLATES - Unique & Artistic
// ============================================

const magazine: CarouselTemplate = {
  id: 'magazine',
  name: 'Magazine',
  description: 'Editorial layout with bold typography',
  category: 'creative',
  isPremium: true,
  background: { type: 'solid', value: '#fafafa' },
  elements: [
    // Red accent bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 1080, height: 80, fill: '#dc2626' },
    // Issue number
    { type: 'text', text: 'ISSUE 01', fontSize: 20, fontWeight: '700', fill: '#ffffff', left: 80, top: 25, textAlign: 'left' },
    // Large headline
    { type: 'text', text: 'THE', fontSize: 60, fontWeight: '400', fontFamily: 'Georgia', fill: '#525252', left: 80, top: 350, width: 920, textAlign: 'left' },
    { type: 'text', text: 'HEADLINE', fontSize: 120, fontWeight: '900', fontFamily: 'Georgia', fill: '#0a0a0a', left: 80, top: 400, width: 920, textAlign: 'left' },
    // Red underline
    { type: 'shape', shapeType: 'rect', left: 80, top: 560, width: 400, height: 8, fill: '#dc2626' },
    // Subheadline
    { type: 'text', text: 'Editorial excellence in every word', fontSize: 28, fontWeight: '400', fill: '#525252', left: 80, top: 620, width: 920, textAlign: 'left' },
    // Image placeholder
    { type: 'shape', shapeType: 'rect', left: 80, top: 750, width: 920, height: 350, fill: '#e5e5e5', rx: 8, ry: 8 },
    { type: 'text', text: 'IMAGE', fontSize: 24, fontWeight: '500', fill: '#a3a3a3', left: 460, top: 900, textAlign: 'center' },
  ],
};

const dataViz: CarouselTemplate = {
  id: 'data-viz',
  name: 'Data Viz',
  description: 'Statistics and metrics focused',
  category: 'data',
  isPremium: false,
  background: { type: 'solid', value: '#18181b' },
  elements: [
    // Background decorative element
    { type: 'shape', shapeType: 'circle', left: 700, top: 200, width: 500, height: 500, fill: '#22c55e', opacity: 0.1 },
    // Large stat number
    { type: 'text', text: '87%', fontSize: 200, fontWeight: '800', fill: '#22c55e', left: 80, top: 320, width: 920, textAlign: 'left' },
    // Stat label
    { type: 'text', text: 'OF USERS', fontSize: 40, fontWeight: '600', fill: '#ffffff', left: 80, top: 550, width: 920, textAlign: 'left' },
    { type: 'text', text: 'saw results in 30 days', fontSize: 36, fontWeight: '400', fill: '#a1a1aa', left: 80, top: 610, width: 920, textAlign: 'left' },
    // Progress bar visualization
    { type: 'shape', shapeType: 'rect', left: 80, top: 750, width: 920, height: 60, fill: '#27272a', rx: 8, ry: 8 },
    { type: 'shape', shapeType: 'rect', left: 80, top: 750, width: 800, height: 60, fill: '#22c55e', rx: 8, ry: 8 },
    // Legend
    { type: 'shape', shapeType: 'circle', left: 80, top: 880, width: 16, height: 16, fill: '#22c55e' },
    { type: 'text', text: 'Success rate', fontSize: 22, fontWeight: '400', fill: '#a1a1aa', left: 110, top: 875 },
    // Source
    { type: 'text', text: 'Source: Internal data, 2024', fontSize: 18, fontWeight: '400', fill: '#52525b', left: 80, top: 1260 },
  ],
};

const handwritten: CarouselTemplate = {
  id: 'handwritten',
  name: 'Handwritten',
  description: 'Personal notebook feel',
  category: 'creative',
  isPremium: true,
  background: { type: 'solid', value: '#fefce8' },
  elements: [
    // Notebook lines
    { type: 'shape', shapeType: 'rect', left: 0, top: 200, width: 1080, height: 2, fill: '#fde68a', opacity: 0.5 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 300, width: 1080, height: 2, fill: '#fde68a', opacity: 0.5 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 400, width: 1080, height: 2, fill: '#fde68a', opacity: 0.5 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 500, width: 1080, height: 2, fill: '#fde68a', opacity: 0.5 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 600, width: 1080, height: 2, fill: '#fde68a', opacity: 0.5 },
    // Red margin line
    { type: 'shape', shapeType: 'rect', left: 100, top: 0, width: 2, height: 1350, fill: '#fca5a5', opacity: 0.5 },
    // Handwritten-style text
    { type: 'text', text: 'Dear Reader,', fontSize: 48, fontWeight: '400', fontFamily: 'Georgia', fill: '#1c1917', left: 140, top: 300 },
    { type: 'text', text: 'This is your', fontSize: 60, fontWeight: '700', fontFamily: 'Georgia', fill: '#1c1917', left: 140, top: 420 },
    { type: 'text', text: 'personal note', fontSize: 60, fontWeight: '700', fontFamily: 'Georgia', fill: '#dc2626', left: 140, top: 500 },
    // Signature
    { type: 'text', text: '- Your Name', fontSize: 36, fontWeight: '400', fontFamily: 'Georgia', fill: '#44403c', left: 140, top: 700 },
    // Paper clip decoration (circle)
    { type: 'shape', shapeType: 'circle', left: 900, top: 50, width: 80, height: 80, fill: '#a3a3a3', opacity: 0.3 },
  ],
};

const splitDuo: CarouselTemplate = {
  id: 'split-duo',
  name: 'Split Duo',
  description: 'Two-tone split design',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#ffffff' },
  elements: [
    // Left half dark
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 540, height: 1350, fill: '#1e293b' },
    // Left side content
    { type: 'text', text: 'ONE', fontSize: 80, fontWeight: '800', fill: '#ffffff', left: 80, top: 450, width: 400, textAlign: 'left' },
    { type: 'text', text: 'SIDE', fontSize: 80, fontWeight: '800', fill: '#64748b', left: 80, top: 540, width: 400, textAlign: 'left' },
    // Right side content
    { type: 'text', text: 'OTHER', fontSize: 80, fontWeight: '800', fill: '#1e293b', left: 600, top: 450, width: 400, textAlign: 'left' },
    { type: 'text', text: 'SIDE', fontSize: 80, fontWeight: '800', fill: '#94a3b8', left: 600, top: 540, width: 400, textAlign: 'left' },
    // Center accent circle
    { type: 'shape', shapeType: 'circle', left: 490, top: 625, width: 100, height: 100, fill: '#0891b2' },
    // Bottom tagline
    { type: 'text', text: 'Two perspectives, one story', fontSize: 28, fontWeight: '400', fill: '#64748b', left: 600, top: 1200, width: 400, textAlign: 'left' },
    { type: 'text', text: '@yourhandle', fontSize: 24, fontWeight: '400', fill: '#ffffff', left: 80, top: 1200, textAlign: 'left' },
  ],
};

// ============================================
// DATA TEMPLATES - Statistics & Metrics
// ============================================

const counterCard: CarouselTemplate = {
  id: 'counter-card',
  name: 'Counter Card',
  description: 'Big number with context',
  category: 'data',
  isPremium: false,
  background: { type: 'solid', value: '#f8fafc' },
  elements: [
    // Accent top bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 1080, height: 12, fill: '#6366f1' },
    // Card container
    { type: 'shape', shapeType: 'rect', left: 80, top: 200, width: 920, height: 900, fill: '#ffffff', rx: 24, ry: 24 },
    // Shadow effect (darker rect behind)
    // Large number
    { type: 'text', text: '10x', fontSize: 240, fontWeight: '900', fill: '#6366f1', left: 120, top: 280, width: 840, textAlign: 'center' },
    // Label
    { type: 'text', text: 'FASTER', fontSize: 60, fontWeight: '700', fill: '#1e293b', left: 120, top: 550, width: 840, textAlign: 'center' },
    // Description
    { type: 'text', text: 'than traditional methods', fontSize: 32, fontWeight: '400', fill: '#64748b', left: 120, top: 640, width: 840, textAlign: 'center' },
    // Comparison bars
    { type: 'shape', shapeType: 'rect', left: 160, top: 780, width: 760, height: 40, fill: '#e2e8f0', rx: 8, ry: 8 },
    { type: 'shape', shapeType: 'rect', left: 160, top: 780, width: 76, height: 40, fill: '#94a3b8', rx: 8, ry: 8 },
    { type: 'text', text: 'Before', fontSize: 20, fontWeight: '500', fill: '#64748b', left: 160, top: 835 },
    { type: 'shape', shapeType: 'rect', left: 160, top: 890, width: 760, height: 40, fill: '#e2e8f0', rx: 8, ry: 8 },
    { type: 'shape', shapeType: 'rect', left: 160, top: 890, width: 760, height: 40, fill: '#6366f1', rx: 8, ry: 8 },
    { type: 'text', text: 'After', fontSize: 20, fontWeight: '500', fill: '#6366f1', left: 160, top: 945 },
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
  // Bold (3 - 1 premium)
  neonPop,
  colorBlock,
  retroOrange,
  // Gradient (4 - 2 premium)
  oceanBreeze,
  sunsetGlow,
  purpleHaze,
  forestGreen,
  // Corporate (3 - 1 premium)
  linkedinBlue,
  executiveNavy,
  techStartup,
  // Creative (4 - 2 premium)
  magazine,
  dataViz,
  handwritten,
  splitDuo,
  // Data (1)
  counterCard,
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

export function getFreeTemplates(): CarouselTemplate[] {
  return carouselTemplates.filter(t => !t.isPremium);
}

export function getPremiumTemplates(): CarouselTemplate[] {
  return carouselTemplates.filter(t => t.isPremium);
}

export const defaultTemplate = cleanWhite;
