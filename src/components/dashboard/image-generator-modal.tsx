"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Image,
  Sparkles,
  RefreshCw,
  Download,
  Check,
  X,
  Wand2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanId, canAccessFeature } from "@/lib/plans";
import Link from "next/link";

interface ImageGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postContent: string;
  postTopic?: string;
  userPlan?: PlanId;
  hasImageApiKey?: boolean;
  onImageGenerated?: (imageData: { base64: string; mimeType: string; filename: string }) => void;
}

// Generate a highly detailed image prompt based on post content
function generateDetailedPrompt(content: string, topic?: string): string {
  const keywords = content.toLowerCase();

  // Determine theme and generate appropriate detailed prompt
  if (keywords.includes("ai") || keywords.includes("chatgpt") || keywords.includes("claude") || keywords.includes("automation") || keywords.includes("machine learning")) {
    return `Professional editorial photograph of AI technology innovation moment in modern tech workspace, photorealistic documentary style, landscape 16:9 format. Primary subject: tech professional in their late twenties to early thirties, wearing modern casual business attire (quality fitted henley shirt in charcoal gray, dark jeans), sitting at premium motorized standing desk in seated position, engaged with multiple high-resolution monitors displaying AI analytics dashboards, neural network visualizations with colorful node connections, and code editor with Python machine learning syntax visible. Professional has focused concentrated expression, one hand on wireless mouse, other hand gesturing thoughtfully at screen showing gradient descent optimization chart. Desk setup: ultrawide 34-inch curved monitor as primary display showing ChatGPT-style interface with conversation visible, secondary 27-inch vertical monitor displaying VS Code with readable Python imports (numpy, tensorflow, pandas visible), mechanical keyboard with subtle RGB backlighting, premium wireless mouse on large desk mat, small succulent plant in geometric concrete pot, quality noise-canceling headphones resting on desk. Background environment: bright modern open-plan tech office with floor-to-ceiling windows showing city skyline in soft focus, exposed brick accent wall, other team members visible but blurred working at standing desks 15 feet behind, indoor plants on floating shelves, minimalist motivational poster. Camera specifications: 35mm lens at f/2.0 aperture, positioned at eye level 5 feet from subject, medium depth of field keeping professional and primary monitor in sharp focus while background has soft bokeh blur. Composition: landscape orientation, subject positioned in left third following rule of thirds, monitors creating leading lines toward subject, desk elements anchoring lower frame, negative space above for breathing room. Lighting setup: bright diffused natural daylight from large windows camera left creating soft Rembrandt lighting on face, supplemented by cool blue ambient glow from monitors providing accent lighting, no harsh shadows, professional studio quality illumination. Color palette: modern tech aesthetic with cool blue monitor glows, warm skin tones, charcoal and navy clothing tones, green accent from plants, white and gray workspace surfaces. Style: authentic Silicon Valley workplace documentary photography, behind-the-scenes innovation moment, Forbes or Wired magazine editorial quality. Textures: matte monitor bezels, brushed aluminum desk accessories, soft cotton fabric clothing with natural drape, polished concrete floor visible, leather office chair. Age specification: professional clearly in late twenties to early thirties (27-33 years old), contemporary tech worker appearance, confident competent demeanor. Atmosphere: cutting-edge technology innovation, focused productivity, the human element behind AI advancement, authentic workplace moment capturing the intersection of human creativity and machine intelligence. Resolution: 4K quality with ultra-sharp focus on facial expression showing engagement, monitor content clearly visible and readable, maintaining professional editorial sharpness throughout.${topic ? ` Context: ${topic}` : ""}`;
  }

  if (keywords.includes("productivity") || keywords.includes("habits") || keywords.includes("routine") || keywords.includes("planning") || keywords.includes("focus")) {
    return `Professional editorial photograph of peak productivity moment in premium home office, photorealistic lifestyle documentary style, landscape 16:9 format. Primary subject: focused professional in their late twenties, wearing comfortable quality loungewear (cream cashmere sweater, relaxed fit), seated at beautifully organized walnut standing desk in seated position, engaged with structured planning system. Desk organization: large physical planner open showing weekly spread with color-coded time blocks visible (blue for deep work, green for meetings, orange for creative time), neat handwritten tasks in quality pen, MacBook Pro positioned to the side showing Notion dashboard with project tracker, minimalist desk lamp with warm brass finish, small stack of quality hardcover books (Atomic Habits, Deep Work spines visible), ceramic mug with steaming coffee, single fresh flower in small glass vase. Professional has serene focused expression, quality pen in hand actively writing in planner, demonstrating analog-digital productivity harmony. Background environment: bright Scandinavian-inspired home office with large window showing morning golden hour light streaming in, white walls with single large abstract art piece in muted earth tones, fiddle leaf fig plant in woven basket, built-in white bookshelves partially visible with organized books and small decorative objects. Camera specifications: 50mm portrait lens at f/1.8 aperture, positioned at slight angle 4 feet from subject, shallow depth of field with sharp focus on professional and desk surface while background softens beautifully. Composition: landscape orientation, subject positioned in right third, desk surface occupying lower two-thirds of frame with organized elements creating visual interest, natural light creating depth through shadows and highlights. Lighting setup: warm golden morning sunlight streaming from window camera right at 45-degree angle creating beautiful rim lighting on subject's hair and shoulder, soft fill light from white walls bouncing ambient illumination, desk lamp providing warm accent on planner pages. Color palette: warm calming tones with cream, walnut wood, soft whites, touches of brass gold, green from plant life, natural skin tones with healthy glow. Style: aspirational lifestyle photography, wellness and productivity aesthetic, Kinfolk or Cereal magazine editorial quality. Textures: soft cashmere fabric with natural drape, smooth walnut wood grain, matte paper planner pages, ceramic coffee mug surface, woven plant basket texture. Age specification: professional clearly in late twenties (26-30 years old), fresh contemporary appearance, calm confident demeanor. Atmosphere: intentional living, mindful productivity, the beauty of organized thinking, peaceful focused energy, morning routine excellence. Resolution: 4K quality with razor-sharp focus on planner details showing readable handwritten text, maintaining editorial sharpness on subject's engaged expression.${topic ? ` Context: ${topic}` : ""}`;
  }

  if (keywords.includes("startup") || keywords.includes("entrepreneur") || keywords.includes("founder") || keywords.includes("business") || keywords.includes("venture")) {
    return `Professional editorial photograph of startup founder strategy session, photorealistic documentary style, landscape 16:9 format. Primary subject: dynamic entrepreneur in their early thirties, wearing smart casual attire (quality navy blazer over white t-shirt, dark jeans), standing confidently at large whiteboard in modern co-working space, dry-erase marker in hand, having just written business model canvas elements. Whiteboard content: clearly visible sections with readable handwritten text including 'Value Proposition' with bullet points, 'Customer Segments' with user persona sketches, 'Revenue Streams' with pricing tiers listed, growth chart arrow trending upward, sticky notes in yellow and pink adding supplementary ideas. Founder has animated engaged expression, gesturing toward the revenue section with conviction, body language showing passionate explanation to unseen team. Foreground elements: modern conference table corner visible with open MacBook Pro showing Pitch deck on screen, scattered quality pens, water bottle, smartphone face-down. Background environment: vibrant startup co-working space with exposed brick wall, industrial pendant lighting, large windows with city view in soft focus, other entrepreneurs working at hot desks 20 feet behind creating depth, indoor plants on shelving, startup posters and company logos on walls. Camera specifications: 35mm wide-angle lens at f/2.2 aperture, positioned at eye level 6 feet from subject, medium depth of field keeping founder and whiteboard content in sharp focus while background shows attractive bokeh. Composition: landscape orientation, founder positioned in right third using rule of thirds, whiteboard spanning left two-thirds of frame, leading lines from whiteboard content drawing eye toward founder, conference table anchoring foreground. Lighting setup: bright industrial pendant lights creating even workspace illumination, natural daylight from windows camera left providing fill, subtle warm accent from exposed Edison bulbs in background. Color palette: energetic startup aesthetic with navy blazer, white board surface, colorful sticky notes providing pops of yellow and pink, warm brick tones, green plant accents. Style: authentic startup documentary photography, Silicon Valley culture, TechCrunch or Inc. magazine editorial quality. Textures: smooth whiteboard surface with marker streaks, quality blazer fabric with subtle texture, industrial brick wall, polished concrete floor, brushed metal fixtures. Age specification: founder clearly in early thirties (30-35 years old), contemporary professional appearance, confident energetic demeanor. Atmosphere: entrepreneurial energy, strategic thinking, the excitement of building something new, collaborative innovation, hustle with purpose. Resolution: 4K quality with ultra-sharp focus on whiteboard content ensuring text is clearly readable, founder's expression captured with editorial precision.${topic ? ` Context: ${topic}` : ""}`;
  }

  if (keywords.includes("career") || keywords.includes("job") || keywords.includes("interview") || keywords.includes("promotion") || keywords.includes("success")) {
    return `Professional editorial photograph of career milestone achievement moment, photorealistic emotional documentary style, landscape 16:9 format. Primary subject: successful professional in their late twenties to early thirties, wearing polished business attire (tailored charcoal suit jacket, crisp white shirt, no tie for modern executive look), standing at floor-to-ceiling window of corner office, city skyline panorama visible through glass, having just received exciting career news. Professional holds smartphone in one hand showing congratulatory message notification visible on screen, other hand making subtle victorious gesture, expression showing genuine joy and accomplishment without being over the top. Office environment: premium executive space with clean modern desk behind subject showing MacBook Pro, quality leather desk accessories, framed credentials on wall, single elegant orchid plant. View through window: impressive daytime city skyline with recognizable skyscrapers in soft focus, blue sky with scattered clouds, suggesting major metropolitan business district. Foreground elements: edge of premium leather office chair visible, quality leather briefcase leaning against desk leg, creating depth and grounding the scene. Camera specifications: 50mm lens at f/2.0 aperture, positioned at eye level 5 feet from subject, shallow depth of field with sharp focus on professional while city skyline creates beautiful bokeh backdrop. Composition: landscape orientation, subject positioned in left third following rule of thirds, window and cityscape occupying right two-thirds creating sense of scale and achievement, floor creating leading line, ceiling height emphasizing status. Lighting setup: bright natural daylight streaming through windows creating rim lighting on subject's profile, soft fill from interior ambient lighting, city skyline backlit creating dramatic silhouette effect on buildings. Color palette: professional sophisticated tones with charcoal suit, white shirt, silver/gray city buildings, blue sky accents, warm natural skin tones showing healthy success glow. Style: aspirational career photography, executive portrait aesthetic, Harvard Business Review or LinkedIn editorial quality. Textures: fine wool suit fabric with visible weave, crisp cotton shirt, smooth glass window surface, leather accessories with quality grain, polished floor reflection. Age specification: professional clearly in late twenties to early thirties (28-34 years old), youthful but accomplished appearance, confident successful demeanor. Atmosphere: career achievement, the reward of hard work, professional milestone celebration, ambitious success realized, the view from the top. Resolution: 4K quality with sharp focus on professional's genuine expression of achievement, phone screen content visible, city skyline recognizable in beautiful blur.${topic ? ` Context: ${topic}` : ""}`;
  }

  if (keywords.includes("leadership") || keywords.includes("team") || keywords.includes("management") || keywords.includes("mentor") || keywords.includes("collaboration")) {
    return `Professional editorial photograph of authentic leadership moment in collaborative workspace, photorealistic documentary style, landscape 16:9 format. Primary subject: engaging team leader in their early thirties, wearing smart casual attire (quality merino wool crewneck sweater in forest green, well-fitted chinos), standing at head of modern conference table, leaning slightly forward with open welcoming body language, actively facilitating team discussion. Team composition: four diverse team members seated around oval conference table, mix of ages late twenties to early forties, varied ethnicities, engaged listening postures, some with laptops open, others with notepads, all faces showing interest and connection. Conference table setup: quality light wood surface, scattered papers and devices, water glasses, small potted succulents as centerpiece, visible project documents with charts and diagrams. Leader has warm approachable expression, hands gesturing inclusively, making eye contact with team member who is contributing idea. Background environment: bright modern meeting room with glass walls showing open-plan office beyond, whiteboard with colorful project timeline visible, large monitor displaying team collaboration software (Slack or Asana interface visible), indoor plants on windowsill, natural light flooding space. Camera specifications: 35mm wide-angle lens at f/2.5 aperture, positioned at eye level at end of table 8 feet from leader, medium depth of field keeping leader and nearest team members in focus while far team members have slight softness. Composition: landscape orientation, leader positioned in upper left third following rule of thirds, table creating strong leading line toward leader, team members framing the scene, glass walls creating visual depth layers. Lighting setup: bright diffused natural daylight from floor-to-ceiling windows creating even illumination, subtle warm accent from meeting room fixtures, soft reflections on glass walls adding dimension. Color palette: professional collaborative aesthetic with forest green leader sweater as focal color, neutral wood tones, white and gray office elements, pops of color from team members' varied attire. Style: authentic workplace documentary photography, corporate culture storytelling, Fast Company or McKinsey Quarterly editorial quality. Textures: soft wool sweater fabric, smooth wood table surface, glass walls with subtle reflections, varied fabric textures from team attire, matte paper documents. Age specification: leader clearly in early thirties (30-35 years old), approachable experienced appearance, team ranging from late twenties to early forties. Atmosphere: inclusive leadership, psychological safety, the power of collaboration, diverse perspectives contributing to shared goals, authentic team connection. Resolution: 4K quality with sharp focus on leader's engaged expression and open body language, team members' attentive faces visible, readable content on documents and screens.${topic ? ` Context: ${topic}` : ""}`;
  }

  if (keywords.includes("money") || keywords.includes("revenue") || keywords.includes("profit") || keywords.includes("investment") || keywords.includes("finance") || keywords.includes("wealth")) {
    return `Professional editorial photograph of financial success analysis moment, photorealistic documentary style, landscape 16:9 format. Primary subject: confident finance professional in their early thirties, wearing refined business casual attire (quality navy merino v-neck sweater over crisp white oxford shirt, premium watch visible on wrist), seated at premium desk analyzing impressive financial data on multiple monitors. Monitor setup: primary 27-inch display showing financial dashboard with green upward-trending portfolio performance chart, clear percentage gains visible (+127% YTD), secondary monitor displaying diversified investment allocation pie chart in professional color scheme, Bloomberg-style market data ticker visible. Professional has satisfied contemplative expression, chin resting thoughtfully on hand, reviewing successful investment strategy results. Desk environment: premium walnut executive desk surface, quality leather desk pad, sophisticated metal desk lamp, small stack of financial books (The Intelligent Investor, A Random Walk visible), premium fountain pen on leather holder, smartphone showing banking app with healthy account balance visible, quality coffee in ceramic mug. Background environment: sophisticated home office or private wealth management space, built-in dark wood bookshelves with organized financial reference books and tasteful decorative objects, abstract art piece in gold and navy tones, large window with city view in soft focus, quality leather armchair in corner. Camera specifications: 50mm lens at f/2.0 aperture, positioned at slight angle 5 feet from subject, shallow depth of field with sharp focus on professional and primary monitor while background softens elegantly. Composition: landscape orientation, subject positioned in left third following rule of thirds, monitors occupying center-right creating visual interest, desk surface anchoring lower frame with premium accessories visible. Lighting setup: warm desk lamp providing key light on subject's face, natural daylight from window camera right providing rim lighting, ambient glow from monitors adding cool blue accent, sophisticated evening study atmosphere. Color palette: wealthy professional aesthetic with navy sweater, warm walnut wood tones, green positive chart indicators, gold accent from lamp and art, clean white shirt providing brightness. Style: aspirational wealth management photography, private banking aesthetic, Bloomberg Markets or Barron's magazine editorial quality. Textures: fine merino wool sweater fabric, smooth leather desk accessories, warm wood grain, quality watch metal and leather band, crisp cotton shirt. Age specification: professional clearly in early thirties (30-35 years old), successful established appearance without being ostentatious, confident competent demeanor. Atmosphere: financial success achieved through smart strategy, the satisfaction of compound growth, wealth building mastery, sophisticated money management, intelligent investing payoff. Resolution: 4K quality with ultra-sharp focus on monitor content showing readable financial data and positive returns, professional's satisfied expression captured with editorial precision.${topic ? ` Context: ${topic}` : ""}`;
  }

  if (keywords.includes("linkedin") || keywords.includes("viral") || keywords.includes("engagement") || keywords.includes("followers") || keywords.includes("content") || keywords.includes("creator")) {
    return `Professional editorial photograph of content creator success moment in home studio, photorealistic documentary style, landscape 16:9 format. Primary subject: thriving content creator in their late twenties, wearing contemporary casual attire (quality fitted black t-shirt, comfortable joggers), seated at premium content creation desk, reviewing impressive engagement analytics on ultrawide monitor with genuine expression of satisfaction. Monitor display: clearly visible LinkedIn analytics dashboard showing viral post performance with impressive metrics (50K+ impressions, 2K+ reactions, 300+ comments visible), engagement chart trending sharply upward, notification panel showing connection requests and message notifications. Creator has pleased accomplished expression, leaning back slightly in premium ergonomic chair, one hand on wireless mouse hovering over analytics, body language showing moment of appreciating hard work paying off. Desk setup: ultrawide curved 34-inch monitor as primary display, quality mirrorless camera (Sony A7 visible) on small tripod for video content, professional USB microphone with boom arm, ring light positioned to side (turned off but visible), quality mechanical keyboard, smartphone on wireless charger showing LinkedIn notification badge. Background environment: aesthetically organized home studio space with acoustic panels on wall in stylish arrangement, floating shelf with creator awards and small plants, softbox light stand visible in corner, minimalist decor, large window with sheer curtains diffusing natural light. Camera specifications: 35mm lens at f/2.2 aperture, positioned at slight angle 5 feet from subject, medium depth of field keeping creator and monitor in focus while background studio elements show slight softness. Composition: landscape orientation, creator positioned in right third following rule of thirds, monitor displaying analytics occupying left side of frame, desk setup creating foreground interest, studio elements providing context. Lighting setup: soft natural daylight from window camera left providing primary illumination, ambient glow from monitor adding cool accent, warm afternoon light quality creating inviting atmosphere. Color palette: modern creator aesthetic with black t-shirt, colorful LinkedIn interface blues, warm wood desk tones, green plant accents, neutral gray acoustic panels. Style: authentic digital entrepreneur photography, creator economy aesthetic, Buffer or Later magazine editorial quality. Textures: soft cotton t-shirt fabric, matte monitor bezel, brushed aluminum camera body, fabric acoustic panels, quality leather chair surface. Age specification: creator clearly in late twenties (25-30 years old), contemporary digital native appearance, confident accomplished demeanor. Atmosphere: content creation success, the payoff of consistent effort, viral moment satisfaction, digital influence achieved, personal brand thriving. Resolution: 4K quality with ultra-sharp focus on monitor analytics clearly showing impressive engagement numbers, creator's genuine expression of success captured with editorial precision.${topic ? ` Context: ${topic}` : ""}`;
  }

  if (keywords.includes("remote") || keywords.includes("work from home") || keywords.includes("digital nomad") || keywords.includes("flexibility") || keywords.includes("balance")) {
    return `Professional editorial photograph of ideal remote work lifestyle moment, photorealistic lifestyle documentary style, landscape 16:9 format. Primary subject: balanced remote professional in their late twenties, wearing comfortable elevated casual attire (quality linen button-down in soft sage green, comfortable shorts), working contentedly at beautiful outdoor-adjacent home workspace with inspiring view. Workspace setup: premium standing desk positioned near floor-to-ceiling sliding glass doors opening to balcony or patio, MacBook Pro as primary device with external monitor, quality wireless keyboard and mouse, small indoor plant arrangement, ceramic coffee mug, professional headphones resting on desk. View through glass doors: inspiring outdoor scene with lush green garden or mountain/ocean vista in golden hour light, balcony with comfortable seating area visible, suggesting perfect work-life integration. Professional has relaxed focused expression, one hand on trackpad reviewing work, slight satisfied smile suggesting appreciation of lifestyle, good posture indicating engagement. Background environment: modern light-filled living space with Scandinavian-inspired design, natural wood elements, quality indoor plants creating indoor-outdoor flow, comfortable sofa visible in soft focus, art on walls, overall sense of curated comfortable living. Camera specifications: 35mm wide-angle lens at f/2.4 aperture, positioned at eye level 6 feet from subject, medium depth of field with sharp focus on professional and desk while outdoor view shows beautiful dreamy bokeh. Composition: landscape orientation, subject positioned in left third following rule of thirds, glass doors and outdoor view creating dramatic depth in center-right of frame, desk setup grounding lower portion, height and view emphasizing lifestyle benefits. Lighting setup: warm golden hour sunlight streaming through glass doors creating beautiful rim lighting on subject and workspace, soft fill from interior, outdoor scene backlit creating heavenly glow effect. Color palette: natural balanced aesthetic with sage green shirt, warm wood tones, lush green outdoor elements, golden hour warmth, clean white interior elements. Style: aspirational lifestyle photography, remote work aesthetic, Dwell or Kinfolk magazine editorial quality. Textures: soft linen fabric with natural drape, smooth glass surfaces, natural wood grain, outdoor foliage texture, ceramic mug surface. Age specification: professional clearly in late twenties (26-30 years old), healthy relaxed appearance, content balanced demeanor. Atmosphere: work-life harmony achieved, location independence freedom, the beauty of flexible living, productive serenity, lifestyle design success. Resolution: 4K quality with sharp focus on professional's content expression and beautiful workspace, outdoor view showing stunning natural beauty in soft focus.${topic ? ` Context: ${topic}` : ""}`;
  }

  // Default professional theme for general business/professional content
  return `Professional editorial photograph of business professional achievement moment in modern workspace, photorealistic documentary style, landscape 16:9 format. Primary subject: confident professional in their early thirties, wearing contemporary business casual attire (quality fitted blazer in charcoal over white crew neck, dark tailored trousers), standing at premium standing desk reviewing impressive project results on large monitor. Monitor display: professional dashboard showing completed project metrics, green checkmarks indicating milestones achieved, team collaboration interface visible, overall sense of successful execution. Professional has satisfied accomplished expression, body language showing confidence and capability, one hand resting on desk surface in relaxed power pose. Desk setup: ultrawide monitor as primary display, MacBook Pro to the side, quality leather desk accessories, small indoor plant, premium water bottle, organized workspace suggesting systematic thinking. Background environment: bright modern office space with clean lines, floor-to-ceiling windows showing city view in soft focus, minimalist artwork on walls, other professionals visible but blurred working in distance, indoor plants adding life, overall sense of premium professional environment. Camera specifications: 50mm lens at f/2.0 aperture, positioned at eye level 5 feet from subject, shallow depth of field with sharp focus on professional while background creates elegant bokeh. Composition: landscape orientation, subject positioned in right third following rule of thirds, monitor and desk creating foreground interest, window view adding depth, leading lines from desk edges drawing eye to subject. Lighting setup: bright natural daylight from windows providing primary illumination, soft fill from office ambient lighting, creating dimensional flattering light on subject's face, no harsh shadows. Color palette: sophisticated professional aesthetic with charcoal blazer, clean whites, warm skin tones, green plant accents, neutral office tones with blue sky visible through windows. Style: authentic professional photography, corporate excellence aesthetic, Harvard Business Review or LinkedIn editorial quality. Textures: quality wool blazer fabric, smooth monitor bezel, leather desk accessories, crisp cotton shirt visible at collar, polished desk surface. Age specification: professional clearly in early thirties (30-35 years old), capable accomplished appearance, confident successful demeanor. Atmosphere: professional achievement, systematic success, the satisfaction of excellent execution, capable leadership, business excellence realized. Resolution: 4K quality with ultra-sharp focus on professional's confident expression, monitor content visible and relevant, maintaining editorial sharpness throughout.${topic ? ` Context: ${topic}` : ""}`;
}

export function ImageGeneratorModal({
  open,
  onOpenChange,
  postContent,
  postTopic,
  userPlan = "free",
  hasImageApiKey = false,
  onImageGenerated,
}: ImageGeneratorModalProps) {
  const [step, setStep] = useState<"prompt" | "generating" | "result">("prompt");
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Check if user has access to image generation
  const hasAccess = canAccessFeature(userPlan, "imageGeneration");

  // Generate initial prompt when modal opens
  useEffect(() => {
    if (open && postContent) {
      const autoPrompt = generateDetailedPrompt(postContent, postTopic);
      setPrompt(autoPrompt);
      setStep("prompt");
      setGeneratedImage(null);
      setError(null);
    }
  }, [open, postContent, postTopic]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStep("generating");
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, postContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setGeneratedImage(data.imageUrl);
      setGeneratedFilename(data.filename || "image.webp");
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
      setStep("prompt");
    }
  };

  const handleUseImage = () => {
    if (generatedImage && onImageGenerated) {
      // Extract base64 and mime type from data URL
      const match = generatedImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        onImageGenerated({
          base64: match[2],
          mimeType: match[1],
          filename: generatedFilename,
        });
      }
    }
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    // Use the generated filename (WebP format, natural name)
    link.download = generatedFilename || `professional-moment-${Date.now().toString(36)}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = () => {
    setStep("prompt");
    setGeneratedImage(null);
  };

  // Style presets for quick additions
  const stylePresets = [
    "Professional photo",
    "Infographic style",
    "Minimalist illustration",
    "Bold typography overlay",
    "Cinematic lighting",
    "Flat design",
  ];

  // No API key connected
  if (!hasImageApiKey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-purple-600" />
              AI Image Generation
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-semibold mb-2">No Image API Connected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To generate AI images, please add your OpenAI (DALL-E), Google (Imagen), or other image generation API key in Settings.
            </p>
            <Link href="/dashboard/settings">
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Go to Settings
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No access to feature
  if (!hasAccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-purple-600" />
              AI Image Generation
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Pro Feature</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI image generation is available on the Pro plan and above. Upgrade to create stunning visuals for your LinkedIn posts.
            </p>
            <Link href="/#pricing">
              <Button variant="linkedin">
                Upgrade to Pro - $39/mo
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-600" />
            Generate AI Image
          </DialogTitle>
          <DialogDescription>
            Create a custom image for your LinkedIn post using AI
          </DialogDescription>
        </DialogHeader>

        {/* Prompt Step */}
        {step === "prompt" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Image Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="min-h-[200px] text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                We&apos;ve auto-generated a detailed prompt based on your post. Feel free to edit it!
              </p>
            </div>

            {/* Quick Style Presets */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quick Style Additions</label>
              <div className="flex flex-wrap gap-2">
                {stylePresets.map((style) => (
                  <button
                    key={style}
                    onClick={() => setPrompt((prev) => `${prev}\n\nSTYLE: ${style}`)}
                    className="text-xs px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Uses your AI API key • Images must be under 5MB for LinkedIn
            </p>
          </div>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 animate-pulse">
              <Image className="w-10 h-10 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
              <span className="font-medium">Generating your image...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This usually takes 10-30 seconds depending on your AI provider
            </p>
          </div>
        )}

        {/* Result Step */}
        {step === "result" && generatedImage && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border bg-accent/30">
              <img
                src={generatedImage}
                alt="Generated image"
                className="w-full h-auto max-h-[400px] object-contain"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRegenerate} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button onClick={handleUseImage} className="flex-1 bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Use This Image
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Image will be automatically attached to your LinkedIn post
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
