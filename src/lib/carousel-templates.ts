// Carousel Template System for LinkedGrow
// Each template has a UNIQUE layout pattern - not just color variations
// Canvas: 1080x1350 (4:5 LinkedIn ratio)

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
// MINIMAL TEMPLATES - Clean, spacious designs
// ============================================

// 1. CENTERED HERO - Single bold statement dead-center, maximum whitespace
const centeredHero: CarouselTemplate = {
  id: 'centered-hero',
  name: 'Centered Hero',
  description: 'Single powerful statement, maximum whitespace',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#0f172a' },
  elements: [
    // Slide number circle top-right
    { type: 'shape', shapeType: 'circle', left: 940, top: 60, width: 64, height: 64, fill: '#06b6d4' },
    { type: 'text', text: '01', fontSize: 22, fontWeight: '700', fill: '#ffffff', left: 940, top: 74, width: 64, textAlign: 'center' },
    // Centered statement
    { type: 'text', text: 'One powerful idea\nthat changes\neverything.', fontSize: 56, fontWeight: '700', fill: '#ffffff', left: 140, top: 450, width: 800, textAlign: 'center' },
    // Small accent line below
    { type: 'shape', shapeType: 'rect', left: 490, top: 730, width: 100, height: 3, fill: '#06b6d4', rx: 2, ry: 2 },
    // Handle bottom-right
    { type: 'text', text: '@yourhandle', fontSize: 20, fontWeight: '400', fill: '#475569', left: 100, top: 1240, width: 880, textAlign: 'right' },
  ],
};

// 2. CORNER BRACKET - Elegant frame with L-shaped corners
const cornerBracket: CarouselTemplate = {
  id: 'corner-bracket',
  name: 'Corner Frame',
  description: 'Elegant bracket frame around content',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#fafaf9' },
  elements: [
    // Top-left bracket
    { type: 'shape', shapeType: 'rect', left: 60, top: 60, width: 120, height: 4, fill: '#0891b2' },
    { type: 'shape', shapeType: 'rect', left: 60, top: 60, width: 4, height: 120, fill: '#0891b2' },
    // Bottom-right bracket
    { type: 'shape', shapeType: 'rect', left: 900, top: 1286, width: 120, height: 4, fill: '#0891b2' },
    { type: 'shape', shapeType: 'rect', left: 1016, top: 1170, width: 4, height: 120, fill: '#0891b2' },
    // Pill badge top center
    { type: 'shape', shapeType: 'rect', left: 430, top: 200, width: 220, height: 44, fill: '#0891b2', opacity: 0.1, rx: 22, ry: 22 },
    { type: 'text', text: 'INSIGHT', fontSize: 16, fontWeight: '700', fill: '#0891b2', left: 430, top: 212, width: 220, textAlign: 'center' },
    // Main content centered
    { type: 'text', text: 'Your headline\ngoes right here', fontSize: 52, fontWeight: '700', fill: '#1c1917', left: 140, top: 440, width: 800, textAlign: 'center' },
    // Subtitle
    { type: 'text', text: 'A supporting line that adds\ncontext to your main idea.', fontSize: 26, fontWeight: '400', fill: '#78716c', left: 140, top: 640, width: 800, textAlign: 'center' },
    // Author bottom center
    { type: 'text', text: 'Your Name', fontSize: 22, fontWeight: '600', fill: '#44403c', left: 140, top: 1200, width: 800, textAlign: 'center' },
  ],
};

// 3. ZEN MINIMAL - Extreme minimalism, one shape + sparse text
const zenMinimal: CarouselTemplate = {
  id: 'zen-minimal',
  name: 'Zen',
  description: 'Extreme minimalism with one accent shape',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#ffffff' },
  elements: [
    // Single accent circle top-right
    { type: 'shape', shapeType: 'circle', left: 720, top: 160, width: 200, height: 200, fill: '#0891b2' },
    // Single text bottom-left
    { type: 'text', text: 'Less noise.\nMore signal.', fontSize: 44, fontWeight: '500', fill: '#334155', left: 100, top: 800, width: 600, textAlign: 'left' },
    // Tiny handle
    { type: 'text', text: '@yourhandle', fontSize: 18, fontWeight: '400', fill: '#94a3b8', left: 100, top: 1240, width: 400, textAlign: 'left' },
  ],
};

// ============================================
// BOLD TEMPLATES - High impact, attention-grabbing
// ============================================

// 4. KNOCKOUT BAR - Bold color with white bar cutting across
const knockoutBar: CarouselTemplate = {
  id: 'knockout-bar',
  name: 'Knockout',
  description: 'White bar cuts through bold color',
  category: 'bold',
  isPremium: false,
  background: { type: 'solid', value: '#7c3aed' },
  elements: [
    // Decorative circles top
    { type: 'shape', shapeType: 'circle', left: 460, top: 120, width: 24, height: 24, fill: '#ffffff', opacity: 0.2 },
    { type: 'shape', shapeType: 'circle', left: 510, top: 140, width: 16, height: 16, fill: '#ffffff', opacity: 0.15 },
    { type: 'shape', shapeType: 'circle', left: 550, top: 110, width: 20, height: 20, fill: '#ffffff', opacity: 0.1 },
    // White knockout bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 480, width: 1080, height: 300, fill: '#ffffff' },
    // Text inside bar (uses background color)
    { type: 'text', text: 'BREAK', fontSize: 80, fontWeight: '900', fill: '#7c3aed', left: 100, top: 510, width: 880, textAlign: 'center' },
    { type: 'text', text: 'THE RULES', fontSize: 48, fontWeight: '400', fill: '#6d28d9', left: 100, top: 620, width: 880, textAlign: 'center' },
    // Subtitle below bar
    { type: 'text', text: 'Think different. Act bold.', fontSize: 28, fontWeight: '400', fill: '#ffffff', opacity: 0.8, left: 100, top: 860, width: 880, textAlign: 'center' },
    // Bottom line
    { type: 'shape', shapeType: 'rect', left: 490, top: 1200, width: 100, height: 3, fill: '#ffffff', opacity: 0.4 },
    { type: 'text', text: '@yourhandle', fontSize: 20, fontWeight: '400', fill: '#ffffff', opacity: 0.5, left: 100, top: 1240, width: 880, textAlign: 'center' },
  ],
};

// 5. STACKED TYPE - Dramatic typography hierarchy, size contrast
const stackedType: CarouselTemplate = {
  id: 'stacked-type',
  name: 'Stacked Type',
  description: 'Dramatic typography size contrast',
  category: 'bold',
  isPremium: false,
  background: { type: 'solid', value: '#ffffff' },
  elements: [
    // Small uppercase label
    { type: 'text', text: 'THE SECRET TO', fontSize: 18, fontWeight: '700', fill: '#0891b2', left: 100, top: 280, width: 880, textAlign: 'left' },
    // Giant word
    { type: 'text', text: 'VIRAL', fontSize: 120, fontWeight: '900', fill: '#0f172a', left: 90, top: 330, width: 900, textAlign: 'left' },
    // Second giant word in accent
    { type: 'text', text: 'CONTENT', fontSize: 100, fontWeight: '900', fill: '#0891b2', left: 90, top: 470, width: 900, textAlign: 'left' },
    // Accent line
    { type: 'shape', shapeType: 'rect', left: 100, top: 620, width: 60, height: 4, fill: '#0891b2', rx: 2, ry: 2 },
    // Small clarifying subtitle
    { type: 'text', text: '7 frameworks top\ncreators use daily', fontSize: 26, fontWeight: '400', fill: '#64748b', left: 100, top: 660, width: 600, textAlign: 'left' },
    // Swipe pill at bottom
    { type: 'shape', shapeType: 'rect', left: 400, top: 1180, width: 280, height: 50, fill: '#0f172a', rx: 25, ry: 25 },
    { type: 'text', text: 'Swipe to learn', fontSize: 18, fontWeight: '600', fill: '#ffffff', left: 400, top: 1194, width: 280, textAlign: 'center' },
  ],
};

// 6. NEON GLOW - Electric colors on dark with glowing shapes
const neonGlow: CarouselTemplate = {
  id: 'neon-glow',
  name: 'Neon Glow',
  description: 'Electric neon on dark background',
  category: 'bold',
  isPremium: false,
  background: { type: 'solid', value: '#0a0a0f' },
  elements: [
    // Glow blobs
    { type: 'shape', shapeType: 'circle', left: -100, top: 300, width: 500, height: 500, fill: '#00ff88', opacity: 0.06 },
    { type: 'shape', shapeType: 'circle', left: 700, top: 800, width: 400, height: 400, fill: '#ff00ff', opacity: 0.06 },
    // Main neon text
    { type: 'text', text: 'STAND\nOUT', fontSize: 100, fontWeight: '900', fill: '#00ff88', left: 100, top: 350, width: 880, textAlign: 'left' },
    // Accent line
    { type: 'shape', shapeType: 'rect', left: 100, top: 620, width: 250, height: 4, fill: '#ff00ff' },
    // Secondary text
    { type: 'text', text: 'From the noise.\nGet noticed.', fontSize: 34, fontWeight: '500', fill: '#a0a0b0', left: 100, top: 670, width: 600, textAlign: 'left' },
    // Swipe CTA
    { type: 'text', text: 'SWIPE', fontSize: 18, fontWeight: '700', fill: '#00ff88', opacity: 0.5, left: 100, top: 1240, width: 880, textAlign: 'left' },
  ],
};

// ============================================
// GRADIENT TEMPLATES - Colorful gradient backgrounds
// ============================================

// 7. PILL BADGE - Gradient bg with pill tags and clean layout
const pillBadge: CarouselTemplate = {
  id: 'pill-badge',
  name: 'Pill Badge',
  description: 'Clean gradient with pill navigation tags',
  category: 'gradient',
  isPremium: false,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)' },
  elements: [
    // Pill tag row at top
    { type: 'shape', shapeType: 'rect', left: 100, top: 100, width: 140, height: 40, fill: '#ffffff', opacity: 0.3, rx: 20, ry: 20 },
    { type: 'text', text: 'Intro', fontSize: 16, fontWeight: '600', fill: '#ffffff', left: 100, top: 110, width: 140, textAlign: 'center' },
    { type: 'shape', shapeType: 'rect', left: 260, top: 100, width: 140, height: 40, fill: '#ffffff', rx: 20, ry: 20 },
    { type: 'text', text: 'Step 1', fontSize: 16, fontWeight: '600', fill: '#2563eb', left: 260, top: 110, width: 140, textAlign: 'center' },
    { type: 'shape', shapeType: 'rect', left: 420, top: 100, width: 140, height: 40, fill: '#ffffff', opacity: 0.3, rx: 20, ry: 20 },
    { type: 'text', text: 'Step 2', fontSize: 16, fontWeight: '600', fill: '#ffffff', left: 420, top: 110, width: 140, textAlign: 'center' },
    // Main headline
    { type: 'text', text: 'Fresh ideas\nthat flow', fontSize: 60, fontWeight: '800', fill: '#ffffff', left: 100, top: 380, width: 880, textAlign: 'left' },
    // Body text
    { type: 'text', text: 'A clear, concise explanation\nof what this carousel covers.', fontSize: 28, fontWeight: '400', fill: '#ffffff', opacity: 0.85, left: 100, top: 600, width: 700, textAlign: 'left' },
    // Bottom line
    { type: 'shape', shapeType: 'rect', left: 100, top: 1200, width: 60, height: 3, fill: '#ffffff', opacity: 0.5 },
    { type: 'text', text: '@yourhandle', fontSize: 18, fontWeight: '400', fill: '#ffffff', opacity: 0.6, left: 100, top: 1230, width: 400, textAlign: 'left' },
  ],
};

// 8. SUNSET SPLIT - Warm gradient with horizontal split
const sunsetSplit: CarouselTemplate = {
  id: 'sunset-split',
  name: 'Sunset Split',
  description: 'Warm gradient with top-heavy layout',
  category: 'gradient',
  isPremium: false,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #f97316 0%, #db2777 100%)' },
  elements: [
    // Sun circle decoration
    { type: 'shape', shapeType: 'circle', left: 740, top: -80, width: 350, height: 350, fill: '#fef3c7', opacity: 0.15 },
    // Thin + light weight contrast
    { type: 'text', text: 'Golden', fontSize: 72, fontWeight: '300', fill: '#ffffff', left: 100, top: 350, width: 880, textAlign: 'left' },
    { type: 'text', text: 'HOUR', fontSize: 100, fontWeight: '900', fill: '#ffffff', left: 100, top: 420, width: 880, textAlign: 'left' },
    // Tagline
    { type: 'text', text: 'When everything glows\nand ideas shine bright.', fontSize: 28, fontWeight: '400', fill: '#fff7ed', opacity: 0.85, left: 100, top: 580, width: 600, textAlign: 'left' },
    // Bottom dark strip
    { type: 'shape', shapeType: 'rect', left: 0, top: 1120, width: 1080, height: 230, fill: '#000000', opacity: 0.15 },
    { type: 'text', text: '@yourhandle', fontSize: 20, fontWeight: '500', fill: '#ffffff', left: 100, top: 1180, width: 880, textAlign: 'left' },
  ],
};

// 9. PURPLE CARD - Gradient bg with floating white card
const purpleCard: CarouselTemplate = {
  id: 'purple-card',
  name: 'Purple Card',
  description: 'Floating card on purple gradient',
  category: 'gradient',
  isPremium: false,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' },
  elements: [
    // Card shadow
    { type: 'shape', shapeType: 'rect', left: 84, top: 204, width: 912, height: 900, fill: '#000000', opacity: 0.1, rx: 24, ry: 24 },
    // White card
    { type: 'shape', shapeType: 'rect', left: 80, top: 200, width: 920, height: 900, fill: '#ffffff', rx: 24, ry: 24 },
    // Card content - category
    { type: 'text', text: 'STRATEGY', fontSize: 16, fontWeight: '700', fill: '#7c3aed', left: 140, top: 280, width: 300, textAlign: 'left' },
    // Card headline
    { type: 'text', text: 'Creative Vision\nStarts Here', fontSize: 48, fontWeight: '800', fill: '#1e1b4b', left: 140, top: 340, width: 760, textAlign: 'left' },
    // Accent bar
    { type: 'shape', shapeType: 'rect', left: 140, top: 520, width: 80, height: 4, fill: '#7c3aed', rx: 2, ry: 2 },
    // Card body
    { type: 'text', text: 'Think outside the box.\nCreate content that matters\nand drives real results.', fontSize: 24, fontWeight: '400', fill: '#64748b', left: 140, top: 560, width: 760, textAlign: 'left' },
    // Card footer
    { type: 'shape', shapeType: 'rect', left: 140, top: 830, width: 760, height: 1, fill: '#e5e7eb' },
    { type: 'text', text: '@yourhandle', fontSize: 18, fontWeight: '500', fill: '#94a3b8', left: 140, top: 860, width: 760, textAlign: 'left' },
    // Watermark number behind card
    { type: 'text', text: '01', fontSize: 160, fontWeight: '900', fill: '#ffffff', opacity: 0.1, left: 740, top: 1100, width: 300, textAlign: 'right' },
  ],
};

// 10. FOREST OVERLAPPING - Dark green with overlapping translucent shapes
const forestOverlap: CarouselTemplate = {
  id: 'forest-overlap',
  name: 'Forest',
  description: 'Overlapping shapes on green gradient',
  category: 'gradient',
  isPremium: false,
  background: { type: 'gradient', value: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)' },
  elements: [
    // Overlapping shapes background
    { type: 'shape', shapeType: 'circle', left: -120, top: -120, width: 500, height: 500, fill: '#ffffff', opacity: 0.06 },
    { type: 'shape', shapeType: 'circle', left: 700, top: 850, width: 450, height: 450, fill: '#ffffff', opacity: 0.05 },
    { type: 'shape', shapeType: 'rect', left: 800, top: 200, width: 250, height: 250, fill: '#ffffff', opacity: 0.04, rx: 40, ry: 40 },
    // Small accent line
    { type: 'shape', shapeType: 'rect', left: 100, top: 360, width: 50, height: 4, fill: '#fbbf24' },
    // Content
    { type: 'text', text: 'Sustainable', fontSize: 52, fontWeight: '400', fill: '#d1fae5', left: 100, top: 400, width: 800, textAlign: 'left' },
    { type: 'text', text: 'GROWTH', fontSize: 80, fontWeight: '900', fill: '#ffffff', left: 100, top: 460, width: 800, textAlign: 'left' },
    // Body
    { type: 'text', text: 'Strategies that compound\nover time and build lasting\nresults for your brand.', fontSize: 26, fontWeight: '400', fill: '#ffffff', opacity: 0.8, left: 100, top: 600, width: 600, textAlign: 'left' },
    // Footer
    { type: 'text', text: '@yourhandle', fontSize: 20, fontWeight: '400', fill: '#ffffff', opacity: 0.4, left: 100, top: 1240, width: 400, textAlign: 'left' },
  ],
};

// ============================================
// CORPORATE TEMPLATES - Professional business styles
// ============================================

// 11. LINKEDIN CARD - LinkedIn blue with floating white card
const linkedinCard: CarouselTemplate = {
  id: 'linkedin-card',
  name: 'LinkedIn Card',
  description: 'LinkedIn brand feel with card layout',
  category: 'corporate',
  isPremium: false,
  background: { type: 'solid', value: '#0A66C2' },
  elements: [
    // White card
    { type: 'shape', shapeType: 'rect', left: 80, top: 200, width: 920, height: 750, fill: '#ffffff', rx: 20, ry: 20 },
    // Content inside card
    { type: 'text', text: 'Professional', fontSize: 44, fontWeight: '400', fill: '#0A66C2', left: 140, top: 280, width: 800, textAlign: 'left' },
    { type: 'text', text: 'INSIGHT', fontSize: 64, fontWeight: '800', fill: '#0f172a', left: 140, top: 330, width: 800, textAlign: 'left' },
    // Divider
    { type: 'shape', shapeType: 'rect', left: 140, top: 430, width: 760, height: 2, fill: '#e5e7eb' },
    // Body text
    { type: 'text', text: 'Expert knowledge shared\nwith clarity and purpose\nfor your professional growth.', fontSize: 26, fontWeight: '400', fill: '#64748b', left: 140, top: 470, width: 760, textAlign: 'left' },
    // Engagement dots
    { type: 'shape', shapeType: 'circle', left: 140, top: 720, width: 32, height: 32, fill: '#0A66C2', opacity: 0.15 },
    { type: 'shape', shapeType: 'circle', left: 186, top: 720, width: 32, height: 32, fill: '#0A66C2', opacity: 0.15 },
    { type: 'shape', shapeType: 'circle', left: 232, top: 720, width: 32, height: 32, fill: '#0A66C2', opacity: 0.15 },
    // Bottom branding
    { type: 'text', text: '@yourhandle', fontSize: 22, fontWeight: '500', fill: '#ffffff', left: 100, top: 1100, width: 880, textAlign: 'left' },
  ],
};

// 12. EXECUTIVE FRAME - Navy with gold corner accents and border
const executiveFrame: CarouselTemplate = {
  id: 'executive-frame',
  name: 'Executive',
  description: 'Navy with gold frame and accents',
  category: 'corporate',
  isPremium: false,
  background: { type: 'solid', value: '#1e3a5f' },
  elements: [
    // Gold border frame (stroke-only rect simulated with 4 thin rects)
    { type: 'shape', shapeType: 'rect', left: 40, top: 40, width: 1000, height: 3, fill: '#d4af37' },
    { type: 'shape', shapeType: 'rect', left: 40, top: 40, width: 3, height: 1270, fill: '#d4af37' },
    { type: 'shape', shapeType: 'rect', left: 40, top: 1307, width: 1000, height: 3, fill: '#d4af37' },
    { type: 'shape', shapeType: 'rect', left: 1037, top: 40, width: 3, height: 1270, fill: '#d4af37' },
    // Corner dots
    { type: 'shape', shapeType: 'circle', left: 32, top: 32, width: 16, height: 16, fill: '#d4af37' },
    { type: 'shape', shapeType: 'circle', left: 1032, top: 32, width: 16, height: 16, fill: '#d4af37' },
    { type: 'shape', shapeType: 'circle', left: 32, top: 1302, width: 16, height: 16, fill: '#d4af37' },
    { type: 'shape', shapeType: 'circle', left: 1032, top: 1302, width: 16, height: 16, fill: '#d4af37' },
    // Category label
    { type: 'text', text: 'LEADERSHIP', fontSize: 16, fontWeight: '700', fill: '#d4af37', opacity: 0.7, left: 140, top: 140, width: 800, textAlign: 'center' },
    // Main content centered
    { type: 'text', text: 'Executive\nSummary', fontSize: 60, fontWeight: '700', fill: '#ffffff', left: 140, top: 440, width: 800, textAlign: 'center' },
    // Gold divider
    { type: 'shape', shapeType: 'rect', left: 440, top: 640, width: 200, height: 3, fill: '#d4af37' },
    // Subtitle
    { type: 'text', text: 'Leadership insights that\ndrive results and growth.', fontSize: 26, fontWeight: '400', fill: '#94a3b8', left: 140, top: 680, width: 800, textAlign: 'center' },
    // Author
    { type: 'text', text: 'Your Name', fontSize: 22, fontWeight: '500', fill: '#d4af37', opacity: 0.6, left: 140, top: 1180, width: 800, textAlign: 'center' },
  ],
};

// 13. TECH PROGRESS - Dark tech with vertical grid lines and progress bar
const techProgress: CarouselTemplate = {
  id: 'tech-progress',
  name: 'Tech Startup',
  description: 'Dark tech with grid lines and progress',
  category: 'corporate',
  isPremium: false,
  background: { type: 'solid', value: '#0f172a' },
  elements: [
    // Tech grid lines (right side)
    { type: 'shape', shapeType: 'rect', left: 820, top: 80, width: 2, height: 350, fill: '#3b82f6', opacity: 0.2 },
    { type: 'shape', shapeType: 'rect', left: 870, top: 120, width: 2, height: 250, fill: '#3b82f6', opacity: 0.12 },
    { type: 'shape', shapeType: 'rect', left: 920, top: 60, width: 2, height: 400, fill: '#3b82f6', opacity: 0.25 },
    { type: 'shape', shapeType: 'rect', left: 970, top: 100, width: 2, height: 300, fill: '#3b82f6', opacity: 0.08 },
    // Blue dot accent
    { type: 'shape', shapeType: 'circle', left: 100, top: 340, width: 14, height: 14, fill: '#3b82f6' },
    // Main content
    { type: 'text', text: 'Innovation', fontSize: 58, fontWeight: '500', fill: '#f8fafc', left: 100, top: 390, width: 700, textAlign: 'left' },
    { type: 'text', text: 'AHEAD', fontSize: 76, fontWeight: '900', fill: '#3b82f6', left: 100, top: 460, width: 700, textAlign: 'left' },
    // Tagline
    { type: 'text', text: 'Building the future,\none step at a time.', fontSize: 26, fontWeight: '400', fill: '#94a3b8', left: 100, top: 590, width: 600, textAlign: 'left' },
    // Progress bar at bottom
    { type: 'shape', shapeType: 'rect', left: 100, top: 1160, width: 880, height: 6, fill: '#1e293b', rx: 3, ry: 3 },
    { type: 'shape', shapeType: 'rect', left: 100, top: 1160, width: 280, height: 6, fill: '#3b82f6', rx: 3, ry: 3 },
    // Footer
    { type: 'text', text: '01 / 07', fontSize: 18, fontWeight: '500', fill: '#475569', left: 100, top: 1200, width: 880, textAlign: 'right' },
  ],
};

// 14. HORIZONTAL BANDS - Three colored bands layout
const horizontalBands: CarouselTemplate = {
  id: 'horizontal-bands',
  name: 'Triple Band',
  description: 'Three horizontal color bands',
  category: 'corporate',
  isPremium: false,
  background: { type: 'solid', value: '#ffffff' },
  elements: [
    // Top band - dark
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 1080, height: 340, fill: '#1e293b' },
    { type: 'text', text: 'STRATEGY GUIDE', fontSize: 16, fontWeight: '700', fill: '#94a3b8', left: 100, top: 80, width: 880, textAlign: 'center' },
    { type: 'text', text: 'How to Win', fontSize: 48, fontWeight: '800', fill: '#ffffff', left: 100, top: 160, width: 880, textAlign: 'center' },
    // Middle band - white (background shows through)
    { type: 'text', text: 'Your detailed explanation\ngoes in this middle section.\nKeep it clear and actionable.', fontSize: 26, fontWeight: '400', fill: '#334155', left: 100, top: 480, width: 880, textAlign: 'center' },
    // Accent line between sections
    { type: 'shape', shapeType: 'rect', left: 440, top: 700, width: 200, height: 2, fill: '#e2e8f0' },
    // Bottom band - accent
    { type: 'shape', shapeType: 'rect', left: 0, top: 1010, width: 1080, height: 340, fill: '#0891b2' },
    { type: 'text', text: 'Swipe for the full breakdown', fontSize: 24, fontWeight: '500', fill: '#ffffff', left: 100, top: 1140, width: 880, textAlign: 'center' },
    // Arrow hint
    { type: 'shape', shapeType: 'rect', left: 920, top: 1155, width: 30, height: 3, fill: '#ffffff', opacity: 0.7 },
  ],
};

// ============================================
// CREATIVE TEMPLATES - Unique and artistic
// ============================================

// 15. SPLIT DUO - Vertical split, dark left + white right
const splitDuo: CarouselTemplate = {
  id: 'split-duo',
  name: 'Split Duo',
  description: 'Two-tone vertical split layout',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#ffffff' },
  elements: [
    // Left panel dark
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 400, height: 1350, fill: '#1e293b' },
    // Large number on left
    { type: 'text', text: '01', fontSize: 120, fontWeight: '900', fill: '#f59e0b', left: 60, top: 380, width: 280, textAlign: 'left' },
    // Left label
    { type: 'text', text: '@yourhandle', fontSize: 18, fontWeight: '400', fill: '#94a3b8', left: 60, top: 1200, width: 280, textAlign: 'left' },
    // Right side headline
    { type: 'text', text: 'The Key\nInsight\nHere', fontSize: 52, fontWeight: '800', fill: '#1e293b', left: 460, top: 370, width: 560, textAlign: 'left' },
    // Right side body
    { type: 'text', text: 'Explain this concept\nclearly in a few short\nsentences for impact.', fontSize: 24, fontWeight: '400', fill: '#64748b', left: 460, top: 600, width: 540, textAlign: 'left' },
    // Accent dot at divider
    { type: 'shape', shapeType: 'circle', left: 375, top: 650, width: 50, height: 50, fill: '#f59e0b' },
  ],
};

// 16. NOTEBOOK - Lined paper, handwritten feel
const notebook: CarouselTemplate = {
  id: 'notebook',
  name: 'Notebook',
  description: 'Personal notebook feel with ruled lines',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#fefce8' },
  elements: [
    // Notebook ruled lines
    { type: 'shape', shapeType: 'rect', left: 0, top: 300, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 400, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 500, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 600, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 700, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    { type: 'shape', shapeType: 'rect', left: 0, top: 800, width: 1080, height: 2, fill: '#fde68a', opacity: 0.6 },
    // Red margin line
    { type: 'shape', shapeType: 'rect', left: 130, top: 0, width: 2, height: 1350, fill: '#fca5a5', opacity: 0.5 },
    // Greeting
    { type: 'text', text: 'Dear Reader,', fontSize: 34, fontWeight: '400', fill: '#1c1917', left: 170, top: 330, width: 850, textAlign: 'left' },
    // Main text
    { type: 'text', text: 'This is your\npersonal note', fontSize: 46, fontWeight: '700', fill: '#1c1917', left: 170, top: 420, width: 850, textAlign: 'left' },
    // Red accent text
    { type: 'text', text: 'that matters.', fontSize: 46, fontWeight: '700', fill: '#dc2626', left: 170, top: 550, width: 850, textAlign: 'left' },
    // Signature
    { type: 'text', text: '- Your Name', fontSize: 28, fontWeight: '400', fill: '#44403c', left: 170, top: 720, width: 850, textAlign: 'left' },
  ],
};

// 17. MAGAZINE - Editorial red bar with image placeholder
const magazine: CarouselTemplate = {
  id: 'magazine',
  name: 'Magazine',
  description: 'Editorial layout with bold red header',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#fafafa' },
  elements: [
    // Red top bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 1080, height: 70, fill: '#dc2626' },
    { type: 'text', text: 'ISSUE 01', fontSize: 16, fontWeight: '700', fill: '#ffffff', left: 100, top: 24, width: 200, textAlign: 'left' },
    // THE headline
    { type: 'text', text: 'THE', fontSize: 44, fontWeight: '400', fill: '#525252', left: 100, top: 320, width: 880, textAlign: 'left' },
    { type: 'text', text: 'HEADLINE', fontSize: 80, fontWeight: '900', fill: '#0a0a0a', left: 100, top: 370, width: 880, textAlign: 'left' },
    // Red underline
    { type: 'shape', shapeType: 'rect', left: 100, top: 490, width: 300, height: 5, fill: '#dc2626' },
    // Body
    { type: 'text', text: 'Editorial excellence\nin every word you write.', fontSize: 26, fontWeight: '400', fill: '#525252', left: 100, top: 530, width: 700, textAlign: 'left' },
    // Image placeholder area
    { type: 'shape', shapeType: 'rect', left: 100, top: 720, width: 880, height: 280, fill: '#e5e5e5', rx: 12, ry: 12 },
    { type: 'text', text: 'IMAGE', fontSize: 22, fontWeight: '500', fill: '#a3a3a3', left: 100, top: 830, width: 880, textAlign: 'center' },
    // Bottom line
    { type: 'shape', shapeType: 'rect', left: 100, top: 1100, width: 880, height: 1, fill: '#d4d4d4' },
    { type: 'text', text: 'linkedgrow.ai', fontSize: 18, fontWeight: '400', fill: '#a3a3a3', left: 100, top: 1130, width: 880, textAlign: 'right' },
  ],
};

// 18. BIG NUMBER STEP - Oversized transparent number with content
const bigNumberStep: CarouselTemplate = {
  id: 'big-number-step',
  name: 'Big Number',
  description: 'Giant step number with overlay content',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#f8fafc' },
  elements: [
    // Giant watermark number (right side)
    { type: 'text', text: '3', fontSize: 500, fontWeight: '900', fill: '#0891b2', opacity: 0.06, left: 400, top: 200, width: 600, textAlign: 'right' },
    // Pill badge
    { type: 'shape', shapeType: 'rect', left: 100, top: 260, width: 130, height: 36, fill: '#0891b2', rx: 18, ry: 18 },
    { type: 'text', text: 'STEP 3', fontSize: 14, fontWeight: '700', fill: '#ffffff', left: 100, top: 269, width: 130, textAlign: 'center' },
    // Title
    { type: 'text', text: 'Build Your\nAudience First', fontSize: 48, fontWeight: '800', fill: '#0f172a', left: 100, top: 360, width: 600, textAlign: 'left' },
    // Body
    { type: 'text', text: 'Focus on creating value before\nasking for anything in return.\nTrust compounds over time.', fontSize: 24, fontWeight: '400', fill: '#64748b', left: 100, top: 540, width: 600, textAlign: 'left' },
    // Small accent square
    { type: 'shape', shapeType: 'rect', left: 100, top: 720, width: 16, height: 16, fill: '#0891b2' },
    // Progress dots at bottom
    { type: 'shape', shapeType: 'circle', left: 460, top: 1200, width: 12, height: 12, fill: '#cbd5e1' },
    { type: 'shape', shapeType: 'circle', left: 496, top: 1200, width: 12, height: 12, fill: '#cbd5e1' },
    { type: 'shape', shapeType: 'circle', left: 532, top: 1200, width: 12, height: 12, fill: '#0891b2' },
    { type: 'shape', shapeType: 'circle', left: 568, top: 1200, width: 12, height: 12, fill: '#cbd5e1' },
    { type: 'shape', shapeType: 'circle', left: 604, top: 1200, width: 12, height: 12, fill: '#cbd5e1' },
  ],
};

// ============================================
// DATA TEMPLATES - Statistics and metrics
// ============================================

// 19. STAT HERO - Giant stat with concentric circle rings
const statHero: CarouselTemplate = {
  id: 'stat-hero',
  name: 'Stat Hero',
  description: 'Giant statistic with radar rings',
  category: 'data',
  isPremium: false,
  background: { type: 'solid', value: '#0f172a' },
  elements: [
    // Concentric ring outlines (simulated with low-opacity circles)
    { type: 'shape', shapeType: 'circle', left: 190, top: 175, width: 700, height: 700, fill: '#ffffff', opacity: 0.02 },
    { type: 'shape', shapeType: 'circle', left: 290, top: 275, width: 500, height: 500, fill: '#ffffff', opacity: 0.03 },
    { type: 'shape', shapeType: 'circle', left: 390, top: 375, width: 300, height: 300, fill: '#ffffff', opacity: 0.04 },
    // Context label
    { type: 'text', text: 'ENGAGEMENT RATE', fontSize: 16, fontWeight: '700', fill: '#22c55e', left: 100, top: 300, width: 880, textAlign: 'center' },
    // Giant stat
    { type: 'text', text: '73%', fontSize: 140, fontWeight: '900', fill: '#22c55e', left: 100, top: 380, width: 880, textAlign: 'center' },
    // Description
    { type: 'text', text: 'Higher than industry average', fontSize: 28, fontWeight: '500', fill: '#ffffff', left: 100, top: 570, width: 880, textAlign: 'center' },
    // Thin line
    { type: 'shape', shapeType: 'rect', left: 440, top: 650, width: 200, height: 2, fill: '#ffffff', opacity: 0.15 },
    // Context body
    { type: 'text', text: 'Carousels outperform every\nother content format.', fontSize: 24, fontWeight: '400', fill: '#94a3b8', left: 100, top: 690, width: 880, textAlign: 'center' },
    // Bottom bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 1310, width: 1080, height: 4, fill: '#22c55e' },
    // Source
    { type: 'text', text: 'Source: LinkedIn data', fontSize: 16, fontWeight: '400', fill: '#475569', left: 100, top: 1240, width: 880, textAlign: 'left' },
  ],
};

// 20. COUNTER CARD - Card with big number, before/after comparison bars
const counterCard: CarouselTemplate = {
  id: 'counter-card',
  name: 'Counter Card',
  description: 'Big number card with comparison bars',
  category: 'data',
  isPremium: false,
  background: { type: 'solid', value: '#f1f5f9' },
  elements: [
    // Accent top bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 1080, height: 8, fill: '#6366f1' },
    // White card
    { type: 'shape', shapeType: 'rect', left: 80, top: 120, width: 920, height: 900, fill: '#ffffff', rx: 24, ry: 24 },
    // Badge inside card
    { type: 'shape', shapeType: 'rect', left: 140, top: 180, width: 160, height: 36, fill: '#6366f1', opacity: 0.1, rx: 18, ry: 18 },
    { type: 'text', text: 'KEY METRIC', fontSize: 14, fontWeight: '700', fill: '#6366f1', left: 140, top: 189, width: 160, textAlign: 'center' },
    // Large number
    { type: 'text', text: '10x', fontSize: 140, fontWeight: '900', fill: '#6366f1', left: 140, top: 260, width: 800, textAlign: 'center' },
    // Label
    { type: 'text', text: 'FASTER', fontSize: 44, fontWeight: '800', fill: '#0f172a', left: 140, top: 440, width: 800, textAlign: 'center' },
    // Description
    { type: 'text', text: 'than traditional methods', fontSize: 24, fontWeight: '400', fill: '#64748b', left: 140, top: 510, width: 800, textAlign: 'center' },
    // Before bar
    { type: 'text', text: 'Before', fontSize: 16, fontWeight: '500', fill: '#94a3b8', left: 160, top: 640, width: 100, textAlign: 'left' },
    { type: 'shape', shapeType: 'rect', left: 280, top: 637, width: 660, height: 26, fill: '#e2e8f0', rx: 6, ry: 6 },
    { type: 'shape', shapeType: 'rect', left: 280, top: 637, width: 66, height: 26, fill: '#94a3b8', rx: 6, ry: 6 },
    // After bar
    { type: 'text', text: 'After', fontSize: 16, fontWeight: '500', fill: '#6366f1', left: 160, top: 690, width: 100, textAlign: 'left' },
    { type: 'shape', shapeType: 'rect', left: 280, top: 687, width: 660, height: 26, fill: '#e2e8f0', rx: 6, ry: 6 },
    { type: 'shape', shapeType: 'rect', left: 280, top: 687, width: 660, height: 26, fill: '#6366f1', rx: 6, ry: 6 },
  ],
};

// 21. DATA VIZ - Big stat number with progress bar
const dataViz: CarouselTemplate = {
  id: 'data-viz',
  name: 'Data Viz',
  description: 'Statistics with progress visualization',
  category: 'data',
  isPremium: false,
  background: { type: 'solid', value: '#18181b' },
  elements: [
    // Glow
    { type: 'shape', shapeType: 'circle', left: -80, top: 400, width: 450, height: 450, fill: '#8b5cf6', opacity: 0.06 },
    { type: 'shape', shapeType: 'circle', left: 700, top: 700, width: 350, height: 350, fill: '#3b82f6', opacity: 0.05 },
    // Label
    { type: 'text', text: 'BY THE NUMBERS', fontSize: 16, fontWeight: '700', fill: '#a78bfa', left: 100, top: 200, width: 880, textAlign: 'left' },
    // Frosted card
    { type: 'shape', shapeType: 'rect', left: 80, top: 260, width: 920, height: 300, fill: '#ffffff', opacity: 0.05, rx: 20, ry: 20 },
    // Main stat
    { type: 'text', text: '3.2x', fontSize: 100, fontWeight: '900', fill: '#a78bfa', left: 140, top: 290, width: 800, textAlign: 'left' },
    // Stat description
    { type: 'text', text: 'More engagement\nthan single-image posts', fontSize: 30, fontWeight: '600', fill: '#e2e8f0', left: 140, top: 420, width: 760, textAlign: 'left' },
    // Comparison bars
    { type: 'text', text: 'Carousels', fontSize: 18, fontWeight: '500', fill: '#a78bfa', left: 100, top: 700, width: 160, textAlign: 'left' },
    { type: 'shape', shapeType: 'rect', left: 280, top: 698, width: 700, height: 22, fill: '#a78bfa', rx: 4, ry: 4 },
    { type: 'text', text: 'Images', fontSize: 18, fontWeight: '500', fill: '#71717a', left: 100, top: 740, width: 160, textAlign: 'left' },
    { type: 'shape', shapeType: 'rect', left: 280, top: 738, width: 300, height: 22, fill: '#3f3f46', rx: 4, ry: 4 },
    { type: 'text', text: 'Text only', fontSize: 18, fontWeight: '500', fill: '#71717a', left: 100, top: 780, width: 160, textAlign: 'left' },
    { type: 'shape', shapeType: 'rect', left: 280, top: 778, width: 120, height: 22, fill: '#3f3f46', rx: 4, ry: 4 },
    // Source
    { type: 'text', text: 'Source: LinkedIn data', fontSize: 14, fontWeight: '400', fill: '#52525b', left: 100, top: 1240, width: 880, textAlign: 'left' },
  ],
};

// ============================================
// BONUS TEMPLATES - Extra variety
// ============================================

// 22. MONOCHROME - Pure black and white, raw typography
const monochrome: CarouselTemplate = {
  id: 'monochrome',
  name: 'Monochrome',
  description: 'Pure black and white typography',
  category: 'bold',
  isPremium: false,
  background: { type: 'solid', value: '#000000' },
  elements: [
    // Raw centered text - nothing else
    { type: 'text', text: 'One sentence\nthat makes\nyou stop\nand think.', fontSize: 56, fontWeight: '800', fill: '#ffffff', left: 100, top: 350, width: 880, textAlign: 'left' },
    // Thin divider
    { type: 'shape', shapeType: 'rect', left: 100, top: 750, width: 160, height: 2, fill: '#ffffff', opacity: 0.3 },
    // Author
    { type: 'text', text: '- Your Name', fontSize: 24, fontWeight: '400', fill: '#ffffff', opacity: 0.5, left: 100, top: 790, width: 400, textAlign: 'left' },
  ],
};

// 23. QUOTE - Large quote mark with centered quote text
const quoteLayout: CarouselTemplate = {
  id: 'quote',
  name: 'Quote',
  description: 'Elegant quote with attribution',
  category: 'minimal',
  isPremium: false,
  background: { type: 'solid', value: '#fffbeb' },
  elements: [
    // Giant decorative quote mark
    { type: 'text', text: '\u201C', fontSize: 200, fontWeight: '400', fill: '#f59e0b', opacity: 0.2, left: 60, top: 100, width: 300, textAlign: 'left' },
    // Left accent bar
    { type: 'shape', shapeType: 'rect', left: 60, top: 400, width: 4, height: 200, fill: '#f59e0b' },
    // Quote text
    { type: 'text', text: 'The best way to\npredict the future\nis to create it.', fontSize: 42, fontWeight: '500', fill: '#1e293b', left: 140, top: 400, width: 800, textAlign: 'left' },
    // Accent line
    { type: 'shape', shapeType: 'rect', left: 140, top: 680, width: 80, height: 3, fill: '#f59e0b' },
    // Attribution
    { type: 'text', text: 'Peter Drucker', fontSize: 24, fontWeight: '700', fill: '#1e293b', left: 140, top: 720, width: 600, textAlign: 'left' },
    { type: 'text', text: 'Management Consultant', fontSize: 20, fontWeight: '400', fill: '#78716c', left: 140, top: 760, width: 600, textAlign: 'left' },
  ],
};

// 24. CHECKLIST - Title bar with checklist items
const checklist: CarouselTemplate = {
  id: 'checklist',
  name: 'Checklist',
  description: 'Action items with checkbox indicators',
  category: 'data',
  isPremium: false,
  background: { type: 'solid', value: '#ffffff' },
  elements: [
    // Header bar
    { type: 'shape', shapeType: 'rect', left: 0, top: 0, width: 1080, height: 180, fill: '#0f172a' },
    { type: 'text', text: 'Your Checklist', fontSize: 40, fontWeight: '800', fill: '#ffffff', left: 100, top: 60, width: 880, textAlign: 'center' },
    // Checkbox items (filled = done, empty = todo)
    // Item 1 - checked
    { type: 'shape', shapeType: 'rect', left: 100, top: 260, width: 36, height: 36, fill: '#10b981', rx: 8, ry: 8 },
    { type: 'text', text: 'Define your target audience', fontSize: 24, fontWeight: '500', fill: '#1e293b', left: 160, top: 266, width: 820, textAlign: 'left' },
    // Item 2 - checked
    { type: 'shape', shapeType: 'rect', left: 100, top: 340, width: 36, height: 36, fill: '#10b981', rx: 8, ry: 8 },
    { type: 'text', text: 'Create a content calendar', fontSize: 24, fontWeight: '500', fill: '#1e293b', left: 160, top: 346, width: 820, textAlign: 'left' },
    // Item 3 - unchecked
    { type: 'shape', shapeType: 'rect', left: 100, top: 420, width: 36, height: 36, fill: 'transparent', rx: 8, ry: 8, stroke: '#cbd5e1', strokeWidth: 2 },
    { type: 'text', text: 'Write your first 5 posts', fontSize: 24, fontWeight: '500', fill: '#1e293b', left: 160, top: 426, width: 820, textAlign: 'left' },
    // Item 4 - unchecked
    { type: 'shape', shapeType: 'rect', left: 100, top: 500, width: 36, height: 36, fill: 'transparent', rx: 8, ry: 8, stroke: '#cbd5e1', strokeWidth: 2 },
    { type: 'text', text: 'Engage with 10 accounts daily', fontSize: 24, fontWeight: '500', fill: '#1e293b', left: 160, top: 506, width: 820, textAlign: 'left' },
    // Item 5 - unchecked
    { type: 'shape', shapeType: 'rect', left: 100, top: 580, width: 36, height: 36, fill: 'transparent', rx: 8, ry: 8, stroke: '#cbd5e1', strokeWidth: 2 },
    { type: 'text', text: 'Analyze your top posts weekly', fontSize: 24, fontWeight: '500', fill: '#1e293b', left: 160, top: 586, width: 820, textAlign: 'left' },
    // Bottom pill
    { type: 'shape', shapeType: 'rect', left: 380, top: 740, width: 320, height: 44, fill: '#f1f5f9', rx: 22, ry: 22 },
    { type: 'text', text: '2 of 5 completed', fontSize: 16, fontWeight: '600', fill: '#64748b', left: 380, top: 752, width: 320, textAlign: 'center' },
  ],
};

// 25. NUMBERED BADGE - Circle badge top-left with flowing content
const numberedBadge: CarouselTemplate = {
  id: 'numbered-badge',
  name: 'Numbered Badge',
  description: 'Step number badge with content',
  category: 'creative',
  isPremium: false,
  background: { type: 'solid', value: '#eff6ff' },
  elements: [
    // Large number circle
    { type: 'shape', shapeType: 'circle', left: 80, top: 80, width: 110, height: 110, fill: '#2563eb' },
    { type: 'text', text: '1', fontSize: 44, fontWeight: '800', fill: '#ffffff', left: 80, top: 108, width: 110, textAlign: 'center' },
    // Title to the right of circle
    { type: 'text', text: 'Start With Why', fontSize: 40, fontWeight: '700', fill: '#1e293b', left: 220, top: 110, width: 780, textAlign: 'left' },
    // Horizontal divider
    { type: 'shape', shapeType: 'rect', left: 80, top: 240, width: 920, height: 1, fill: '#bfdbfe' },
    // Body content
    { type: 'text', text: 'Before you create any content,\nask yourself: why does this\nmatter to my audience?\n\nThe answer shapes everything\nthat follows.', fontSize: 26, fontWeight: '400', fill: '#334155', left: 80, top: 300, width: 920, textAlign: 'left' },
    // Accent vertical bar
    { type: 'shape', shapeType: 'rect', left: 80, top: 300, width: 5, height: 220, fill: '#2563eb', opacity: 0.3 },
    // Footer dotted progress
    { type: 'shape', shapeType: 'circle', left: 440, top: 1200, width: 10, height: 10, fill: '#2563eb' },
    { type: 'shape', shapeType: 'circle', left: 470, top: 1200, width: 10, height: 10, fill: '#bfdbfe' },
    { type: 'shape', shapeType: 'circle', left: 500, top: 1200, width: 10, height: 10, fill: '#bfdbfe' },
    { type: 'shape', shapeType: 'circle', left: 530, top: 1200, width: 10, height: 10, fill: '#bfdbfe' },
    { type: 'shape', shapeType: 'circle', left: 560, top: 1200, width: 10, height: 10, fill: '#bfdbfe' },
    { type: 'shape', shapeType: 'circle', left: 590, top: 1200, width: 10, height: 10, fill: '#bfdbfe' },
    { type: 'shape', shapeType: 'circle', left: 620, top: 1200, width: 10, height: 10, fill: '#bfdbfe' },
  ],
};

// ============================================
// EXPORT ALL TEMPLATES
// ============================================

export const carouselTemplates: CarouselTemplate[] = [
  // Minimal (4)
  centeredHero,
  cornerBracket,
  zenMinimal,
  quoteLayout,
  // Bold (4)
  knockoutBar,
  stackedType,
  neonGlow,
  monochrome,
  // Gradient (4)
  pillBadge,
  sunsetSplit,
  purpleCard,
  forestOverlap,
  // Corporate (4)
  linkedinCard,
  executiveFrame,
  techProgress,
  horizontalBands,
  // Creative (4)
  splitDuo,
  notebook,
  magazine,
  bigNumberStep,
  // Data (4)
  statHero,
  counterCard,
  dataViz,
  checklist,
  // Bonus
  numberedBadge,
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

export const defaultTemplate = centeredHero;
