// Carousel slides built on the server.
//
// The editor stores each slide as a Fabric canvas JSON string and rebuilds it
// with loadFromJSON. Fabric's serialised form is plain declarative data, so a
// slide can be assembled here without running Fabric, which is what lets an
// assistant ask for a carousel over MCP and have the result open in the editor
// as ordinary, fully editable objects rather than a flat picture.
//
// The layout is deliberately its own thing rather than one of the presets in
// carousel-templates.ts. Those carry fixed copy at fixed positions ("01",
// "@yourhandle") and mapping generated text onto them means guessing which
// element in the array is the title, which breaks the moment a preset is
// edited. This builds the four slots it actually needs.

export const CAROUSEL_WIDTH = 1080;
export const CAROUSEL_HEIGHT = 1350;

const INK = "#f8fafc";
const MUTED = "#94a3b8";
const ACCENT = "#06b6d4";
const CANVAS_BG = "#0f172a";

interface FabricObject {
  type: string;
  version: string;
  left: number;
  top: number;
  width: number;
  height?: number;
  fill: string;
  originX: "left";
  originY: "top";
  strokeWidth: number;
  selectable: boolean;
  evented: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  editable?: boolean;
  splitByGrapheme?: boolean;
  rx?: number;
  ry?: number;
}

const VERSION = "7.2.0";

function rect(
  left: number,
  top: number,
  width: number,
  height: number,
  fill: string,
  radius = 0
): FabricObject {
  return {
    type: "Rect",
    version: VERSION,
    left,
    top,
    width,
    height,
    fill,
    rx: radius,
    ry: radius,
    originX: "left",
    originY: "top",
    strokeWidth: 0,
    selectable: true,
    evented: true,
  };
}

function textbox(
  text: string,
  left: number,
  top: number,
  width: number,
  fontSize: number,
  fontWeight: string,
  fill: string,
  textAlign: "left" | "center" | "right" = "left"
): FabricObject {
  return {
    type: "Textbox",
    version: VERSION,
    text,
    left,
    top,
    width,
    fontSize,
    fontFamily: "Inter",
    fontWeight,
    fill,
    textAlign,
    originX: "left",
    originY: "top",
    strokeWidth: 0,
    editable: true,
    selectable: true,
    evented: true,
    splitByGrapheme: false,
  };
}

export interface SlideCopy {
  title: string;
  body: string;
}

/**
 * One slide as the string the editor stores.
 *
 * Long titles are given a smaller size rather than being cut, because a slide
 * that silently loses its last three words is worse than one that reads a
 * little tighter, and the user can drag either one afterwards.
 */
export function buildSlideCanvasJSON(
  slide: SlideCopy,
  index: number,
  total: number,
  footer: string
): string {
  const title = slide.title.trim();
  const titleSize = title.length > 64 ? 52 : title.length > 36 ? 64 : 76;

  const objects: FabricObject[] = [
    // Accent bar above the title, the one piece of brand on the slide.
    rect(96, 300, 88, 8, ACCENT, 4),
    textbox(title, 96, 356, 888, titleSize, "700", INK),
    textbox(slide.body.trim(), 96, 356 + titleSize * 3.2, 888, 32, "400", MUTED),
    textbox(footer, 96, 1216, 600, 24, "500", MUTED),
    textbox(
      `${index + 1} / ${total}`,
      584,
      1216,
      400,
      24,
      "500",
      MUTED,
      "right"
    ),
  ];

  return JSON.stringify({ version: VERSION, objects, background: CANVAS_BG });
}

/** The whole deck in the shape saved_carousels.slides_json expects. */
export function buildCarouselSlides(
  slides: SlideCopy[],
  footer: string
): string {
  return JSON.stringify(
    slides.map((slide, i) => ({
      id: crypto.randomUUID(),
      canvasJSON: buildSlideCanvasJSON(slide, i, slides.length, footer),
      thumbnail: "",
    }))
  );
}
