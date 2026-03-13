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

// Smooth organic blob generator using Catmull-Rom to Bezier conversion
function blobPath(cx: number, cy: number, numPoints: number, radii: number[], startAngle = 0): string {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = startAngle + (2 * Math.PI * i) / numPoints - Math.PI / 2;
    const r = radii[i % radii.length];
    pts.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  const tension = 0.35;
  const segments: string[] = [`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`];

  for (let i = 0; i < numPoints; i++) {
    const p0 = pts[(i - 1 + numPoints) % numPoints];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % numPoints];
    const p3 = pts[(i + 2) % numPoints];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    segments.push(`C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`);
  }

  return segments.join(' ') + ' Z';
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
  // BLOB SHAPES - smooth organic shapes using Catmull-Rom splines
  // ============================================
  {
    id: 'blob-1',
    name: 'Blob 1',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: blobPath(100, 100, 8, [92, 85, 88, 82, 90, 78, 94, 84]),
  },
  {
    id: 'blob-2',
    name: 'Blob 2',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: blobPath(100, 100, 6, [90, 72, 92, 78, 86, 82]),
  },
  {
    id: 'blob-3',
    name: 'Blob 3',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: blobPath(100, 100, 7, [85, 92, 76, 90, 82, 96, 78]),
  },
  {
    id: 'blob-4',
    name: 'Blob 4',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: blobPath(100, 100, 8, [86, 78, 94, 72, 90, 80, 92, 74]),
  },
  {
    id: 'blob-5',
    name: 'Blob 5',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: blobPath(100, 100, 5, [92, 78, 88, 74, 94]),
  },
  {
    id: 'blob-6',
    name: 'Blob 6',
    category: 'blob',
    viewBox: { width: 200, height: 200 },
    svgPath: blobPath(100, 100, 6, [90, 86, 92, 84, 88, 90], 0.3),
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
  // DEVICES - distinctive device silhouettes
  // ============================================
  {
    id: 'device-phone',
    name: 'Phone',
    category: 'devices',
    viewBox: { width: 75, height: 150 },
    // Modern smartphone with pill-shaped dynamic island notch and rounded corners
    svgPath: 'M 15 0 L 27 0 L 27 4 C 27 8 30 10 34 10 L 41 10 C 45 10 48 8 48 4 L 48 0 L 60 0 C 75 0 75 15 75 15 L 75 135 C 75 150 60 150 60 150 L 15 150 C 0 150 0 135 0 135 L 0 15 C 0 0 15 0 15 0 Z',
  },
  {
    id: 'device-laptop',
    name: 'Laptop',
    category: 'devices',
    viewBox: { width: 170, height: 115 },
    // Laptop with screen area and wider keyboard base connected by hinge
    svgPath: 'M 20 0 L 150 0 Q 158 0 158 8 L 158 78 L 165 82 Q 170 84 170 88 L 170 105 Q 170 110 165 110 L 5 110 Q 0 110 0 105 L 0 88 Q 0 84 5 82 L 12 78 L 12 8 Q 12 0 20 0 Z',
  },
  {
    id: 'device-tablet',
    name: 'Tablet',
    category: 'devices',
    viewBox: { width: 100, height: 140 },
    // Modern tablet with slim bezels and large rounded corners
    svgPath: 'M 14 0 L 86 0 Q 100 0 100 14 L 100 126 Q 100 140 86 140 L 14 140 Q 0 140 0 126 L 0 14 Q 0 0 14 0 Z',
  },
  {
    id: 'device-monitor',
    name: 'Monitor',
    category: 'devices',
    viewBox: { width: 150, height: 125 },
    // Desktop monitor with screen and stand
    svgPath: 'M 10 0 L 140 0 Q 150 0 150 10 L 150 86 Q 150 92 140 92 L 82 92 L 82 104 L 98 104 L 98 116 Q 98 120 94 120 L 56 120 Q 52 120 52 116 L 52 104 L 68 104 L 68 92 L 10 92 Q 0 92 0 86 L 0 10 Q 0 0 10 0 Z',
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
  // LETTERS A-Z - Bold sans-serif, 80x100 viewBox, ~20px strokes
  // ============================================
  {
    id: 'letter-a', name: 'A', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 40 0 L 80 100 L 58 100 L 50 76 L 30 76 L 22 100 L 0 100 Z M 34 60 L 46 60 L 40 30 Z',
  },
  {
    id: 'letter-b', name: 'B', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 50 0 Q 76 0 76 24 Q 76 40 56 46 Q 80 52 80 74 Q 80 100 50 100 L 0 100 Z M 22 16 L 22 38 L 46 38 Q 54 38 54 27 Q 54 16 46 16 Z M 22 58 L 22 84 L 48 84 Q 58 84 58 71 Q 58 58 48 58 Z',
  },
  {
    id: 'letter-c', name: 'C', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 58 0 Q 80 0 80 18 L 62 28 Q 58 16 48 14 Q 30 14 22 30 Q 16 42 16 50 Q 16 58 22 70 Q 30 86 48 86 Q 58 84 62 72 L 80 82 Q 80 100 58 100 Q 22 100 8 78 Q 0 64 0 50 Q 0 36 8 22 Q 22 0 58 0 Z',
  },
  {
    id: 'letter-d', name: 'D', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 44 0 Q 68 0 76 22 Q 80 34 80 50 Q 80 66 76 78 Q 68 100 44 100 L 0 100 Z M 22 16 L 22 84 L 42 84 Q 54 84 60 72 Q 64 62 64 50 Q 64 38 60 28 Q 54 16 42 16 Z',
  },
  {
    id: 'letter-e', name: 'E', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 80 0 L 80 18 L 22 18 L 22 42 L 66 42 L 66 58 L 22 58 L 22 82 L 80 82 L 80 100 L 0 100 Z',
  },
  {
    id: 'letter-f', name: 'F', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 78 0 L 78 18 L 22 18 L 22 44 L 64 44 L 64 60 L 22 60 L 22 100 L 0 100 Z',
  },
  {
    id: 'letter-g', name: 'G', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 58 0 Q 80 0 80 18 L 62 28 Q 58 16 48 14 Q 30 14 22 30 Q 16 42 16 50 Q 16 58 22 70 Q 30 86 48 86 Q 56 84 58 76 L 58 56 L 42 56 L 42 42 L 78 42 L 78 82 Q 78 100 58 100 Q 22 100 8 78 Q 0 64 0 50 Q 0 36 8 22 Q 22 0 58 0 Z',
  },
  {
    id: 'letter-h', name: 'H', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 22 0 L 22 42 L 58 42 L 58 0 L 80 0 L 80 100 L 58 100 L 58 58 L 22 58 L 22 100 L 0 100 Z',
  },
  {
    id: 'letter-i', name: 'I', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 80 0 L 80 18 L 51 18 L 51 82 L 80 82 L 80 100 L 0 100 L 0 82 L 29 82 L 29 18 L 0 18 Z',
  },
  {
    id: 'letter-j', name: 'J', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 80 0 L 80 18 L 56 18 L 56 64 Q 56 86 36 86 Q 16 86 6 72 L 20 58 Q 26 72 36 72 Q 40 72 40 64 L 40 18 L 0 18 Z',
  },
  {
    id: 'letter-k', name: 'K', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 22 0 L 22 38 L 54 0 L 80 0 L 44 44 L 80 100 L 54 100 L 26 54 L 22 60 L 22 100 L 0 100 Z',
  },
  {
    id: 'letter-l', name: 'L', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 22 0 L 22 82 L 80 82 L 80 100 L 0 100 Z',
  },
  {
    id: 'letter-m', name: 'M', category: 'letters',
    viewBox: { width: 88, height: 100 },
    svgPath: 'M 0 0 L 22 0 L 44 42 L 66 0 L 88 0 L 88 100 L 68 100 L 68 30 L 50 66 L 38 66 L 20 30 L 20 100 L 0 100 Z',
  },
  {
    id: 'letter-n', name: 'N', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 22 0 L 58 68 L 58 0 L 80 0 L 80 100 L 58 100 L 22 32 L 22 100 L 0 100 Z',
  },
  {
    id: 'letter-o', name: 'O', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 40 0 Q 64 0 74 22 Q 80 36 80 50 Q 80 64 74 78 Q 64 100 40 100 Q 16 100 6 78 Q 0 64 0 50 Q 0 36 6 22 Q 16 0 40 0 Z M 40 16 Q 24 16 18 30 Q 14 42 14 50 Q 14 58 18 70 Q 24 84 40 84 Q 56 84 62 70 Q 66 58 66 50 Q 66 42 62 30 Q 56 16 40 16 Z',
  },
  {
    id: 'letter-p', name: 'P', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 48 0 Q 78 0 78 28 Q 78 56 48 56 L 22 56 L 22 100 L 0 100 Z M 22 16 L 22 40 L 44 40 Q 56 40 56 28 Q 56 16 44 16 Z',
  },
  {
    id: 'letter-q', name: 'Q', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 40 0 Q 64 0 74 20 Q 80 32 80 46 Q 80 60 74 72 Q 68 84 56 90 L 74 100 L 58 100 L 46 92 Q 44 94 40 94 Q 16 94 6 72 Q 0 60 0 46 Q 0 32 6 20 Q 16 0 40 0 Z M 40 14 Q 24 14 18 28 Q 14 38 14 46 Q 14 54 18 64 Q 24 78 40 78 Q 56 78 62 64 Q 66 54 66 46 Q 66 38 62 28 Q 56 14 40 14 Z',
  },
  {
    id: 'letter-r', name: 'R', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 48 0 Q 76 0 76 26 Q 76 44 58 52 L 80 100 L 56 100 L 38 54 L 22 54 L 22 100 L 0 100 Z M 22 16 L 22 40 L 44 40 Q 56 40 56 28 Q 56 16 44 16 Z',
  },
  {
    id: 'letter-s', name: 'S', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 54 0 Q 80 0 80 18 L 62 28 Q 58 16 46 14 Q 32 14 24 22 Q 18 28 18 36 Q 18 44 26 48 Q 34 52 48 58 Q 66 64 74 74 Q 80 82 76 92 Q 70 100 52 100 Q 26 100 8 86 L 22 74 Q 28 86 44 86 Q 58 86 62 78 Q 64 72 60 66 Q 54 58 40 52 Q 22 44 14 36 Q 4 24 8 14 Q 14 0 54 0 Z',
  },
  {
    id: 'letter-t', name: 'T', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 80 0 L 80 18 L 51 18 L 51 100 L 29 100 L 29 18 L 0 18 Z',
  },
  {
    id: 'letter-u', name: 'U', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 22 0 L 22 68 Q 22 84 40 84 Q 58 84 58 68 L 58 0 L 80 0 L 80 70 Q 80 100 40 100 Q 0 100 0 70 Z',
  },
  {
    id: 'letter-v', name: 'V', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 20 0 L 40 72 L 60 0 L 80 0 L 48 100 L 32 100 Z',
  },
  {
    id: 'letter-w', name: 'W', category: 'letters',
    viewBox: { width: 96, height: 100 },
    svgPath: 'M 0 0 L 16 0 L 26 62 L 40 0 L 56 0 L 70 62 L 80 0 L 96 0 L 76 100 L 60 100 L 48 42 L 36 100 L 20 100 Z',
  },
  {
    id: 'letter-x', name: 'X', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 22 0 L 40 38 L 58 0 L 80 0 L 52 50 L 80 100 L 58 100 L 40 62 L 22 100 L 0 100 L 28 50 Z',
  },
  {
    id: 'letter-y', name: 'Y', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 22 0 L 40 40 L 58 0 L 80 0 L 51 56 L 51 100 L 29 100 L 29 56 Z',
  },
  {
    id: 'letter-z', name: 'Z', category: 'letters',
    viewBox: { width: 80, height: 100 },
    svgPath: 'M 0 0 L 80 0 L 80 18 L 24 82 L 80 82 L 80 100 L 0 100 L 0 82 L 56 18 L 0 18 Z',
  },

  // ============================================
  // NUMBERS 0-9 - Bold sans-serif, 70x100 viewBox, ~18px strokes
  // ============================================
  {
    id: 'number-0', name: '0', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 35 0 Q 56 0 64 22 Q 70 36 70 50 Q 70 64 64 78 Q 56 100 35 100 Q 14 100 6 78 Q 0 64 0 50 Q 0 36 6 22 Q 14 0 35 0 Z M 35 16 Q 22 16 17 30 Q 14 40 14 50 Q 14 60 17 70 Q 22 84 35 84 Q 48 84 53 70 Q 56 60 56 50 Q 56 40 53 30 Q 48 16 35 16 Z',
  },
  {
    id: 'number-1', name: '1', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 6 22 L 24 0 L 44 0 L 44 82 L 64 82 L 64 100 L 6 100 L 6 82 L 24 82 L 24 28 L 6 38 Z',
  },
  {
    id: 'number-2', name: '2', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 10 18 Q 18 0 38 0 Q 58 0 66 18 Q 70 30 64 44 L 24 82 L 70 82 L 70 100 L 0 100 L 0 86 L 46 42 Q 52 34 52 26 Q 52 16 40 14 Q 28 14 22 26 Z',
  },
  {
    id: 'number-3', name: '3', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 6 18 Q 16 0 36 0 Q 56 0 64 14 Q 70 24 68 34 Q 66 44 52 50 Q 70 56 70 74 Q 70 90 54 98 Q 46 100 36 100 Q 14 100 4 86 L 18 74 Q 24 86 36 86 Q 50 86 54 76 Q 56 70 52 64 Q 48 56 36 56 L 26 56 L 26 42 L 36 42 Q 50 42 52 32 Q 54 24 48 18 Q 42 14 36 14 Q 26 14 20 24 Z',
  },
  {
    id: 'number-4', name: '4', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 44 0 L 62 0 L 62 58 L 70 58 L 70 74 L 62 74 L 62 100 L 44 100 L 44 74 L 0 74 L 0 60 Z M 44 28 L 18 58 L 44 58 Z',
  },
  {
    id: 'number-5', name: '5', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 8 0 L 66 0 L 66 16 L 22 16 L 18 42 Q 26 36 38 36 Q 58 36 66 54 Q 70 64 70 72 Q 70 88 56 96 Q 46 100 36 100 Q 14 100 4 86 L 18 74 Q 24 86 36 86 Q 50 86 54 76 Q 56 70 54 64 Q 48 52 38 52 Q 26 52 18 62 L 4 56 Z',
  },
  {
    id: 'number-6', name: '6', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 54 0 L 58 16 Q 46 16 38 24 Q 28 36 22 50 Q 28 42 40 42 Q 58 42 66 58 Q 70 66 70 72 Q 70 88 56 96 Q 46 100 36 100 Q 14 100 4 82 Q 0 72 0 60 Q 0 34 16 18 Q 30 0 54 0 Z M 36 56 Q 22 56 16 68 Q 14 74 14 78 Q 14 86 22 90 Q 28 92 36 90 Q 50 88 54 78 Q 56 72 54 66 Q 50 56 36 56 Z',
  },
  {
    id: 'number-7', name: '7', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 0 0 L 70 0 L 70 14 L 28 100 L 8 100 L 50 18 L 0 18 Z',
  },
  {
    id: 'number-8', name: '8', category: 'numbers',
    viewBox: { width: 72, height: 100 },
    svgPath: 'M 36 0 Q 56 0 64 12 Q 70 22 68 34 Q 66 44 52 50 Q 68 56 72 70 Q 74 82 60 92 Q 50 100 36 100 Q 22 100 12 92 Q 0 82 2 70 Q 6 56 20 50 Q 6 44 4 34 Q 2 22 8 12 Q 16 0 36 0 Z M 36 14 Q 24 14 18 22 Q 14 28 18 36 Q 22 44 36 46 Q 50 44 54 36 Q 58 28 54 22 Q 48 14 36 14 Z M 36 58 Q 20 60 16 72 Q 14 80 20 86 Q 26 92 36 92 Q 46 92 52 86 Q 58 80 56 72 Q 52 60 36 58 Z',
  },
  {
    id: 'number-9', name: '9', category: 'numbers',
    viewBox: { width: 70, height: 100 },
    svgPath: 'M 16 100 L 12 84 Q 24 84 32 76 Q 42 64 48 50 Q 42 58 30 58 Q 12 58 4 42 Q 0 34 0 28 Q 0 12 14 4 Q 24 0 34 0 Q 54 0 64 18 Q 70 28 70 40 Q 70 66 54 82 Q 40 100 16 100 Z M 34 10 Q 20 12 16 22 Q 14 28 16 36 Q 20 46 34 46 Q 48 46 52 34 Q 54 28 52 22 Q 48 12 34 10 Z',
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
