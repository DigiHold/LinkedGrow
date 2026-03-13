// Frame shape definitions for the carousel canvas editor
// Each frame is defined by SVG path data that serves as a clipping mask

export type FrameCategory =
  | 'basic'
  | 'blob'
  | 'film'
  | 'devices'
  | 'paper'
  | 'flowers'
  | 'retro'
  | 'letters'
  | 'numbers';

export interface FrameDefinition {
  id: string;
  name: string;
  category: FrameCategory;
  viewBox: { width: number; height: number };
  svgPath: string; // SVG path "d" attribute
}

export const frameCategories: { id: FrameCategory; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'blob', label: 'Blob' },
  { id: 'film', label: 'Film' },
  { id: 'devices', label: 'Devices' },
  { id: 'paper', label: 'Paper' },
  { id: 'flowers', label: 'Flowers' },
  { id: 'retro', label: 'Retro' },
  { id: 'letters', label: 'Letters' },
  { id: 'numbers', label: 'Numbers' },
];

// Helper to create a regular polygon path
function regularPolygon(sides: number, cx: number, cy: number, r: number, startAngle = -Math.PI / 2): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (2 * Math.PI * i) / sides;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join(' ') + ' Z';
}

// Star path generator
function starPath(points: number, cx: number, cy: number, outerR: number, innerR: number): string {
  const parts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + (Math.PI * i) / points;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return parts.join(' ') + ' Z';
}

export const frameDefinitions: FrameDefinition[] = [
  // ============================================
  // BASIC SHAPES
  // ============================================
  {
    id: 'basic-circle',
    name: 'Circle',
    category: 'basic',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z',
  },
  {
    id: 'basic-square',
    name: 'Square',
    category: 'basic',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
  },
  {
    id: 'basic-rounded-square',
    name: 'Rounded',
    category: 'basic',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 15 0 L 85 0 Q 100 0 100 15 L 100 85 Q 100 100 85 100 L 15 100 Q 0 100 0 85 L 0 15 Q 0 0 15 0 Z',
  },
  {
    id: 'basic-triangle',
    name: 'Triangle',
    category: 'basic',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 50 5 L 95 90 L 5 90 Z',
  },
  {
    id: 'basic-hexagon',
    name: 'Hexagon',
    category: 'basic',
    viewBox: { width: 100, height: 100 },
    svgPath: regularPolygon(6, 50, 50, 48),
  },
  {
    id: 'basic-star',
    name: 'Star',
    category: 'basic',
    viewBox: { width: 100, height: 100 },
    svgPath: starPath(5, 50, 50, 48, 20),
  },
  {
    id: 'basic-heart',
    name: 'Heart',
    category: 'basic',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 50 88 C 25 70 2 50 2 30 C 2 12 16 2 30 2 C 38 2 45 6 50 14 C 55 6 62 2 70 2 C 84 2 98 12 98 30 C 98 50 75 70 50 88 Z',
  },
  {
    id: 'basic-diamond',
    name: 'Diamond',
    category: 'basic',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 50 2 L 98 50 L 50 98 L 2 50 Z',
  },
  {
    id: 'basic-oval',
    name: 'Oval',
    category: 'basic',
    viewBox: { width: 120, height: 80 },
    svgPath: 'M 60 0 A 60 40 0 1 1 60 80 A 60 40 0 1 1 60 0 Z',
  },
  {
    id: 'basic-arch',
    name: 'Arch',
    category: 'basic',
    viewBox: { width: 100, height: 120 },
    svgPath: 'M 0 120 L 0 50 A 50 50 0 0 1 100 50 L 100 120 Z',
  },

  // ============================================
  // BLOB SHAPES
  // ============================================
  {
    id: 'blob-1',
    name: 'Blob 1',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: 'M 45 5 C 75 -5 120 10 150 35 C 180 60 195 95 185 130 C 175 165 145 190 110 195 C 75 200 35 185 15 155 C -5 125 -5 85 10 55 C 25 25 15 15 45 5 Z',
  },
  {
    id: 'blob-2',
    name: 'Blob 2',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: 'M 100 10 C 140 5 175 25 190 60 C 205 95 195 140 170 170 C 145 200 105 205 70 190 C 35 175 10 145 5 110 C 0 75 15 40 40 20 C 65 0 60 15 100 10 Z',
  },
  {
    id: 'blob-3',
    name: 'Blob 3',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: 'M 80 8 C 120 -5 160 15 180 50 C 200 85 200 125 180 155 C 160 185 125 200 90 195 C 55 190 25 170 10 140 C -5 110 0 70 20 40 C 40 10 40 21 80 8 Z',
  },
  {
    id: 'blob-4',
    name: 'Blob 4',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: 'M 95 5 C 130 0 165 20 185 55 C 205 90 200 130 175 160 C 150 190 110 200 75 190 C 40 180 10 150 3 115 C -4 80 10 45 35 22 C 60 -1 60 10 95 5 Z',
  },
  {
    id: 'blob-5',
    name: 'Blob 5',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: 'M 60 10 C 100 -10 145 5 175 35 C 205 65 205 110 185 145 C 165 180 130 200 90 195 C 50 190 15 165 5 130 C -5 95 5 60 25 35 C 45 10 20 30 60 10 Z',
  },
  {
    id: 'blob-6',
    name: 'Blob 6',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: 'M 110 5 C 145 10 180 35 190 70 C 200 105 190 145 165 175 C 140 205 100 205 65 190 C 30 175 5 140 0 105 C -5 70 10 35 35 15 C 60 -5 75 0 110 5 Z',
  },

  // ============================================
  // FILM & PHOTO
  // ============================================
  {
    id: 'film-polaroid',
    name: 'Polaroid',
    category: 'film',
    viewBox: { width: 100, height: 120 },
    svgPath: 'M 5 0 L 95 0 Q 100 0 100 5 L 100 115 Q 100 120 95 120 L 5 120 Q 0 120 0 115 L 0 5 Q 0 0 5 0 Z',
  },
  {
    id: 'film-strip',
    name: 'Film Strip',
    category: 'film',
    viewBox: { width: 120, height: 100 },
    svgPath: 'M 0 0 L 120 0 L 120 100 L 0 100 Z M 5 8 L 12 8 L 12 18 L 5 18 Z M 5 24 L 12 24 L 12 34 L 5 34 Z M 5 40 L 12 40 L 12 50 L 5 50 Z M 5 56 L 12 56 L 12 66 L 5 66 Z M 5 72 L 12 72 L 12 82 L 5 82 Z M 108 8 L 115 8 L 115 18 L 108 18 Z M 108 24 L 115 24 L 115 34 L 108 34 Z M 108 40 L 115 40 L 115 50 L 108 50 Z M 108 56 L 115 56 L 115 66 L 108 66 Z M 108 72 L 115 72 L 115 82 L 108 82 Z',
  },
  {
    id: 'film-photo-border',
    name: 'Photo Mat',
    category: 'film',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
  },

  // ============================================
  // DEVICES
  // ============================================
  {
    id: 'device-phone',
    name: 'Phone',
    category: 'devices',
    viewBox: { width: 70, height: 140 },
    svgPath: 'M 10 0 L 60 0 Q 70 0 70 10 L 70 130 Q 70 140 60 140 L 10 140 Q 0 140 0 130 L 0 10 Q 0 0 10 0 Z',
  },
  {
    id: 'device-laptop',
    name: 'Laptop',
    category: 'devices',
    viewBox: { width: 160, height: 110 },
    svgPath: 'M 15 5 L 145 5 Q 150 5 150 10 L 150 85 L 160 85 L 160 100 Q 160 105 155 105 L 5 105 Q 0 105 0 100 L 0 85 L 10 85 L 10 10 Q 10 5 15 5 Z',
  },
  {
    id: 'device-tablet',
    name: 'Tablet',
    category: 'devices',
    viewBox: { width: 100, height: 130 },
    svgPath: 'M 8 0 L 92 0 Q 100 0 100 8 L 100 122 Q 100 130 92 130 L 8 130 Q 0 130 0 122 L 0 8 Q 0 0 8 0 Z',
  },

  // ============================================
  // PAPER
  // ============================================
  {
    id: 'paper-torn',
    name: 'Torn Edge',
    category: 'paper',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 0 5 C 8 3 12 8 20 5 C 28 2 32 7 40 4 C 48 1 52 6 60 3 C 68 0 72 5 80 3 C 88 1 92 4 100 2 L 100 95 C 92 97 88 92 80 95 C 72 98 68 93 60 96 C 52 99 48 94 40 97 C 32 100 28 95 20 98 C 12 101 8 96 0 98 Z',
  },
  {
    id: 'paper-sticky',
    name: 'Sticky Note',
    category: 'paper',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 0 0 L 100 0 L 100 75 L 75 100 L 0 100 Z',
  },
  {
    id: 'paper-notebook',
    name: 'Notebook',
    category: 'paper',
    viewBox: { width: 110, height: 100 },
    svgPath: 'M 10 0 L 110 0 L 110 100 L 10 100 Z M 0 10 L 15 10 L 15 16 L 0 16 Z M 0 25 L 15 25 L 15 31 L 0 31 Z M 0 40 L 15 40 L 15 46 L 0 46 Z M 0 55 L 15 55 L 15 61 L 0 61 Z M 0 70 L 15 70 L 15 76 L 0 76 Z M 0 85 L 15 85 L 15 91 L 0 91 Z',
  },

  // ============================================
  // FLOWERS
  // ============================================
  {
    id: 'flower-4petal',
    name: '4 Petals',
    category: 'flowers',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 50 5 C 60 20 75 25 50 50 C 75 25 80 40 95 50 C 80 60 75 75 50 50 C 75 75 60 80 50 95 C 40 80 25 75 50 50 C 25 75 20 60 5 50 C 20 40 25 25 50 50 C 25 25 40 20 50 5 Z',
  },
  {
    id: 'flower-6petal',
    name: '6 Petals',
    category: 'flowers',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 50 2 C 58 18 65 20 73 10 C 72 28 78 32 93 28 C 85 42 88 50 100 55 C 88 60 85 68 93 82 C 78 78 72 82 73 98 C 65 88 58 88 50 98 C 42 88 35 88 27 98 C 28 82 22 78 7 82 C 15 68 12 60 0 55 C 12 50 15 42 7 28 C 22 32 28 28 27 10 C 35 20 42 18 50 2 Z',
  },
  {
    id: 'flower-daisy',
    name: 'Daisy',
    category: 'flowers',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 50 0 C 55 15 58 18 68 8 C 65 25 68 28 82 22 C 75 38 78 42 92 40 C 82 52 85 58 100 60 C 85 65 82 72 92 82 C 78 78 72 78 68 92 C 65 78 58 78 50 92 C 42 78 38 78 32 92 C 28 78 22 78 8 82 C 18 72 15 65 0 60 C 15 58 18 52 8 40 C 22 42 25 38 18 22 C 32 28 35 25 32 8 C 42 18 45 15 50 0 Z',
  },
  {
    id: 'flower-tulip',
    name: 'Tulip',
    category: 'flowers',
    viewBox: { width: 100, height: 120 },
    svgPath: 'M 50 0 C 70 5 85 25 90 50 C 95 75 80 90 50 95 C 20 90 5 75 10 50 C 15 25 30 5 50 0 Z',
  },

  // ============================================
  // RETRO
  // ============================================
  {
    id: 'retro-tv',
    name: 'Retro TV',
    category: 'retro',
    viewBox: { width: 120, height: 100 },
    svgPath: 'M 15 10 L 105 10 Q 115 10 115 20 L 115 80 Q 115 90 105 90 L 15 90 Q 5 90 5 80 L 5 20 Q 5 10 15 10 Z',
  },
  {
    id: 'retro-stamp',
    name: 'Stamp',
    category: 'retro',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 10 0 L 20 5 L 30 0 L 40 5 L 50 0 L 60 5 L 70 0 L 80 5 L 90 0 L 100 5 L 100 10 L 95 20 L 100 30 L 95 40 L 100 50 L 95 60 L 100 70 L 95 80 L 100 90 L 100 95 L 90 100 L 80 95 L 70 100 L 60 95 L 50 100 L 40 95 L 30 100 L 20 95 L 10 100 L 0 95 L 0 90 L 5 80 L 0 70 L 5 60 L 0 50 L 5 40 L 0 30 L 5 20 L 0 10 L 0 5 Z',
  },
  {
    id: 'retro-badge',
    name: 'Badge',
    category: 'retro',
    viewBox: { width: 100, height: 100 },
    svgPath: starPath(8, 50, 50, 48, 35),
  },

  // ============================================
  // LETTERS A-Z
  // ============================================
  {
    id: 'letter-a', name: 'A', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 40 0 L 80 100 L 65 100 L 55 72 L 25 72 L 15 100 L 0 100 Z M 30 58 L 50 58 L 40 28 Z',
  },
  {
    id: 'letter-b', name: 'B', category: 'letters',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 0 0 L 45 0 Q 65 0 65 18 Q 65 32 50 38 Q 70 42 70 60 Q 70 80 50 90 Q 42 100 0 100 Z M 15 14 L 15 42 L 42 42 Q 50 42 50 28 Q 50 14 42 14 Z M 15 56 L 15 86 L 45 86 Q 55 86 55 71 Q 55 56 45 56 Z',
  },
  {
    id: 'letter-c', name: 'C', category: 'letters',
    viewBox: { width: 75, height: 100 },
    svgPath: 'M 55 0 Q 75 0 75 15 L 60 22 Q 58 14 50 14 Q 30 14 20 30 Q 12 42 12 50 Q 12 58 20 70 Q 30 86 50 86 Q 58 86 60 78 L 75 85 Q 75 100 55 100 Q 22 100 8 78 Q 0 65 0 50 Q 0 35 8 22 Q 22 0 55 0 Z',
  },
  {
    id: 'letter-d', name: 'D', category: 'letters',
    viewBox: { width: 75, height: 100 },
    svgPath: 'M 0 0 L 38 0 Q 60 0 70 22 Q 75 34 75 50 Q 75 66 70 78 Q 60 100 38 100 L 0 100 Z M 15 14 L 15 86 L 38 86 Q 50 86 55 72 Q 60 62 60 50 Q 60 38 55 28 Q 50 14 38 14 Z',
  },
  {
    id: 'letter-e', name: 'E', category: 'letters',
    viewBox: { width: 65, height: 100 },
    svgPath: 'M 0 0 L 65 0 L 65 14 L 15 14 L 15 42 L 55 42 L 55 56 L 15 56 L 15 86 L 65 86 L 65 100 L 0 100 Z',
  },
  {
    id: 'letter-f', name: 'F', category: 'letters',
    viewBox: { width: 60, height: 100 },
    svgPath: 'M 0 0 L 60 0 L 60 14 L 15 14 L 15 42 L 50 42 L 50 56 L 15 56 L 15 100 L 0 100 Z',
  },
  {
    id: 'letter-g', name: 'G', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 55 0 Q 80 0 80 15 L 65 22 Q 62 14 52 14 Q 32 14 22 30 Q 14 42 14 50 Q 14 58 22 70 Q 32 86 52 86 Q 60 86 62 78 L 62 58 L 45 58 L 45 44 L 78 44 L 78 85 Q 78 100 55 100 Q 22 100 8 78 Q 0 65 0 50 Q 0 35 8 22 Q 22 0 55 0 Z',
  },
  {
    id: 'letter-h', name: 'H', category: 'letters',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 0 0 L 15 0 L 15 42 L 55 42 L 55 0 L 70 0 L 70 100 L 55 100 L 55 56 L 15 56 L 15 100 L 0 100 Z',
  },
  {
    id: 'letter-i', name: 'I', category: 'letters',
    viewBox: { width: 40, height: 100 },
    svgPath: 'M 0 0 L 40 0 L 40 14 L 27 14 L 27 86 L 40 86 L 40 100 L 0 100 L 0 86 L 13 86 L 13 14 L 0 14 Z',
  },
  {
    id: 'letter-j', name: 'J', category: 'letters',
    viewBox: { width: 55, height: 100 },
    svgPath: 'M 20 0 L 55 0 L 55 14 L 42 14 L 42 72 Q 42 86 28 86 Q 14 86 8 78 L 0 82 L 8 96 Q 15 100 28 100 Q 55 100 55 72 L 55 0 Z',
  },
  {
    id: 'letter-k', name: 'K', category: 'letters',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 0 0 L 15 0 L 15 40 L 48 0 L 68 0 L 35 42 L 70 100 L 50 100 L 22 52 L 15 60 L 15 100 L 0 100 Z',
  },
  {
    id: 'letter-l', name: 'L', category: 'letters',
    viewBox: { width: 60, height: 100 },
    svgPath: 'M 0 0 L 15 0 L 15 86 L 60 86 L 60 100 L 0 100 Z',
  },
  {
    id: 'letter-m', name: 'M', category: 'letters',
    viewBox: { width: 85, height: 100 },
    svgPath: 'M 0 0 L 20 0 L 42 45 L 65 0 L 85 0 L 85 100 L 70 100 L 70 30 L 50 70 L 35 70 L 15 30 L 15 100 L 0 100 Z',
  },
  {
    id: 'letter-n', name: 'N', category: 'letters',
    viewBox: { width: 72, height: 100 },
    svgPath: 'M 0 0 L 18 0 L 57 72 L 57 0 L 72 0 L 72 100 L 54 100 L 15 28 L 15 100 L 0 100 Z',
  },
  {
    id: 'letter-o', name: 'O', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 40 0 Q 62 0 72 22 Q 80 38 80 50 Q 80 62 72 78 Q 62 100 40 100 Q 18 100 8 78 Q 0 62 0 50 Q 0 38 8 22 Q 18 0 40 0 Z M 40 14 Q 25 14 18 30 Q 14 40 14 50 Q 14 60 18 70 Q 25 86 40 86 Q 55 86 62 70 Q 66 60 66 50 Q 66 40 62 30 Q 55 14 40 14 Z',
  },
  {
    id: 'letter-p', name: 'P', category: 'letters',
    viewBox: { width: 68, height: 100 },
    svgPath: 'M 0 0 L 42 0 Q 68 0 68 28 Q 68 56 42 56 L 15 56 L 15 100 L 0 100 Z M 15 14 L 15 42 L 40 42 Q 52 42 52 28 Q 52 14 40 14 Z',
  },
  {
    id: 'letter-q', name: 'Q', category: 'letters',
    viewBox: { width: 82, height: 108 },
    svgPath: 'M 40 0 Q 62 0 72 22 Q 80 38 80 50 Q 80 62 72 78 Q 65 92 52 98 L 72 108 L 60 108 L 44 100 Q 42 100 40 100 Q 18 100 8 78 Q 0 62 0 50 Q 0 38 8 22 Q 18 0 40 0 Z M 40 14 Q 25 14 18 30 Q 14 40 14 50 Q 14 60 18 70 Q 25 86 40 86 Q 55 86 62 70 Q 66 60 66 50 Q 66 40 62 30 Q 55 14 40 14 Z',
  },
  {
    id: 'letter-r', name: 'R', category: 'letters',
    viewBox: { width: 72, height: 100 },
    svgPath: 'M 0 0 L 42 0 Q 65 0 65 25 Q 65 42 52 50 L 72 100 L 55 100 L 38 52 L 15 52 L 15 100 L 0 100 Z M 15 14 L 15 40 L 40 40 Q 50 40 50 27 Q 50 14 40 14 Z',
  },
  {
    id: 'letter-s', name: 'S', category: 'letters',
    viewBox: { width: 65, height: 100 },
    svgPath: 'M 48 0 Q 65 0 65 15 L 52 22 Q 50 14 42 14 Q 28 14 20 22 Q 15 28 15 35 Q 15 42 22 46 Q 28 50 42 55 Q 58 60 62 68 Q 65 75 65 80 Q 65 92 48 100 Q 40 100 32 100 Q 8 100 0 85 L 14 78 Q 16 86 28 86 Q 42 86 48 78 Q 52 72 50 65 Q 48 58 35 52 Q 18 44 10 38 Q 0 28 0 18 Q 0 0 22 0 Z',
  },
  {
    id: 'letter-t', name: 'T', category: 'letters',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 0 0 L 70 0 L 70 14 L 42 14 L 42 100 L 28 100 L 28 14 L 0 14 Z',
  },
  {
    id: 'letter-u', name: 'U', category: 'letters',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 0 0 L 15 0 L 15 68 Q 15 86 35 86 Q 55 86 55 68 L 55 0 L 70 0 L 70 70 Q 70 100 35 100 Q 0 100 0 70 Z',
  },
  {
    id: 'letter-v', name: 'V', category: 'letters',
    viewBox: { width: 75, height: 100 },
    svgPath: 'M 0 0 L 16 0 L 37 72 L 59 0 L 75 0 L 45 100 L 30 100 Z',
  },
  {
    id: 'letter-w', name: 'W', category: 'letters',
    viewBox: { width: 100, height: 100 },
    svgPath: 'M 0 0 L 14 0 L 25 68 L 42 0 L 58 0 L 75 68 L 86 0 L 100 0 L 80 100 L 65 100 L 50 38 L 35 100 L 20 100 Z',
  },
  {
    id: 'letter-x', name: 'X', category: 'letters',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 0 0 L 18 0 L 35 38 L 52 0 L 70 0 L 45 50 L 70 100 L 52 100 L 35 62 L 18 100 L 0 100 L 25 50 Z',
  },
  {
    id: 'letter-y', name: 'Y', category: 'letters',
    viewBox: { width: 72, height: 100 },
    svgPath: 'M 0 0 L 18 0 L 36 40 L 54 0 L 72 0 L 44 55 L 44 100 L 28 100 L 28 55 Z',
  },
  {
    id: 'letter-z', name: 'Z', category: 'letters',
    viewBox: { width: 65, height: 100 },
    svgPath: 'M 0 0 L 65 0 L 65 14 L 18 86 L 65 86 L 65 100 L 0 100 L 0 86 L 47 14 L 0 14 Z',
  },

  // ============================================
  // NUMBERS 0-9
  // ============================================
  {
    id: 'number-0', name: '0', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 35 0 Q 55 0 62 22 Q 70 40 70 50 Q 70 60 62 78 Q 55 100 35 100 Q 15 100 8 78 Q 0 60 0 50 Q 0 40 8 22 Q 15 0 35 0 Z M 35 14 Q 22 14 17 30 Q 14 40 14 50 Q 14 60 17 70 Q 22 86 35 86 Q 48 86 53 70 Q 56 60 56 50 Q 56 40 53 30 Q 48 14 35 14 Z',
  },
  {
    id: 'number-1', name: '1', category: 'numbers',
    viewBox: { width: 45, height: 100 },
    svgPath: 'M 0 18 L 18 0 L 30 0 L 30 86 L 45 86 L 45 100 L 0 100 L 0 86 L 15 86 L 15 22 L 0 32 Z',
  },
  {
    id: 'number-2', name: '2', category: 'numbers',
    viewBox: { width: 65, height: 100 },
    svgPath: 'M 10 15 Q 18 0 38 0 Q 58 0 65 18 Q 65 35 52 48 L 18 85 L 65 85 L 65 100 L 0 100 L 0 88 L 42 42 Q 50 32 50 25 Q 50 14 38 14 Q 26 14 22 25 L 8 20 Z',
  },
  {
    id: 'number-3', name: '3', category: 'numbers',
    viewBox: { width: 65, height: 100 },
    svgPath: 'M 5 15 Q 15 0 35 0 Q 55 0 62 12 Q 65 22 65 28 Q 65 40 52 48 Q 68 55 68 72 Q 68 88 52 96 Q 45 100 35 100 Q 15 100 5 85 L 18 78 Q 22 86 35 86 Q 48 86 52 75 Q 54 68 50 62 Q 45 55 35 55 L 25 55 L 25 42 L 35 42 Q 48 42 50 30 Q 50 20 42 16 Q 38 14 35 14 Q 25 14 18 22 Z',
  },
  {
    id: 'number-4', name: '4', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 42 0 L 58 0 L 58 58 L 70 58 L 70 72 L 58 72 L 58 100 L 42 100 L 42 72 L 0 72 L 0 60 Z M 42 26 L 18 58 L 42 58 Z',
  },
  {
    id: 'number-5', name: '5', category: 'numbers',
    viewBox: { width: 65, height: 100 },
    svgPath: 'M 8 0 L 60 0 L 60 14 L 18 14 L 15 42 Q 22 38 35 38 Q 55 38 62 55 Q 65 62 65 70 Q 65 85 52 95 Q 42 100 32 100 Q 12 100 2 85 L 15 78 Q 20 86 32 86 Q 45 86 50 75 Q 52 68 50 62 Q 45 52 35 52 Q 22 52 15 60 L 5 55 Z',
  },
  {
    id: 'number-6', name: '6', category: 'numbers',
    viewBox: { width: 65, height: 100 },
    svgPath: 'M 52 0 L 55 14 Q 45 14 38 22 Q 28 35 22 50 Q 28 42 40 42 Q 58 42 64 58 Q 65 65 65 70 Q 65 85 52 96 Q 42 100 35 100 Q 15 100 5 82 Q 0 72 0 60 Q 0 35 15 18 Q 28 0 52 0 Z M 35 55 Q 22 55 16 68 Q 14 72 14 78 Q 14 86 22 90 Q 28 92 35 90 Q 48 88 52 78 Q 54 72 52 65 Q 48 55 35 55 Z',
  },
  {
    id: 'number-7', name: '7', category: 'numbers',
    viewBox: { width: 65, height: 100 },
    svgPath: 'M 0 0 L 65 0 L 65 12 L 25 100 L 8 100 L 48 14 L 0 14 Z',
  },
  {
    id: 'number-8', name: '8', category: 'numbers',
    viewBox: { width: 68, height: 100 },
    svgPath: 'M 34 0 Q 55 0 62 12 Q 68 22 65 32 Q 62 42 50 48 Q 65 55 68 68 Q 70 80 58 92 Q 48 100 34 100 Q 20 100 10 92 Q -2 80 0 68 Q 3 55 18 48 Q 6 42 3 32 Q 0 22 6 12 Q 13 0 34 0 Z M 34 14 Q 22 14 17 22 Q 14 28 17 35 Q 20 42 34 44 Q 48 42 51 35 Q 54 28 51 22 Q 46 14 34 14 Z M 34 56 Q 18 58 14 70 Q 12 78 18 85 Q 24 90 34 90 Q 44 90 50 85 Q 56 78 54 70 Q 50 58 34 56 Z',
  },
  {
    id: 'number-9', name: '9', category: 'numbers',
    viewBox: { width: 65, height: 100 },
    svgPath: 'M 13 100 L 10 86 Q 20 86 27 78 Q 37 65 43 50 Q 37 58 25 58 Q 7 58 1 42 Q 0 35 0 30 Q 0 15 13 4 Q 23 0 30 0 Q 50 0 60 18 Q 65 28 65 40 Q 65 65 50 82 Q 37 100 13 100 Z M 30 8 Q 17 12 13 22 Q 11 28 13 35 Q 17 45 30 45 Q 43 45 49 32 Q 51 28 49 20 Q 45 10 30 8 Z',
  },
];

// Helper to get frames by category
export function getFramesByCategory(category: FrameCategory): FrameDefinition[] {
  return frameDefinitions.filter(f => f.category === category);
}

// Helper to get a frame by ID
export function getFrameById(id: string): FrameDefinition | undefined {
  return frameDefinitions.find(f => f.id === id);
}
