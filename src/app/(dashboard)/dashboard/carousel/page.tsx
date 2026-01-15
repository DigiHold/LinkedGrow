"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Palette,
  Type,
  Image as ImageIcon,
  Layout,
  RefreshCw,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const templates = [
  { id: "minimal", name: "Minimal", colors: "bg-white text-gray-900" },
  { id: "dark", name: "Dark Mode", colors: "bg-gray-900 text-white" },
  { id: "gradient-blue", name: "Blue Gradient", colors: "bg-linear-to-br from-blue-600 to-cyan-500 text-white" },
  { id: "gradient-purple", name: "Purple Gradient", colors: "bg-linear-to-br from-purple-600 to-pink-500 text-white" },
  { id: "linkedin", name: "LinkedIn Blue", colors: "bg-linkedin text-white" },
];

export default function CarouselPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const userEmail = session?.user?.email || "";

  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState("5");
  const [template, setTemplate] = useState("minimal");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<{ title: string; content: string }[]>([
    { title: "Slide 1 Title", content: "Your content here..." },
    { title: "Slide 2 Title", content: "More content..." },
    { title: "Slide 3 Title", content: "Keep them engaged..." },
    { title: "Slide 4 Title", content: "Almost there..." },
    { title: "Call to Action", content: "Follow for more!" },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    // TODO: Implement AI carousel generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const currentTemplate = templates.find(t => t.id === template) || templates[0];

  return (
    <FeatureGate feature="carouselGenerator" userPlan={userPlan} userEmail={userEmail}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-violet-500 to-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            Carousel Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create engaging multi-slide carousels for LinkedIn
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Generator */}
          <div className="space-y-6">
            {/* Topic Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  Generate with AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Topic or Title</Label>
                  <Textarea
                    placeholder="e.g., 10 productivity tips for remote workers..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Slides</Label>
                    <Select value={slideCount} onValueChange={setSlideCount}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Slides</SelectItem>
                        <SelectItem value="5">5 Slides</SelectItem>
                        <SelectItem value="7">7 Slides</SelectItem>
                        <SelectItem value="10">10 Slides</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Template</Label>
                    <Select value={template} onValueChange={setTemplate}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!topic.trim() || isGenerating}
                  className="w-full bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Carousel
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Slide Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-violet-600" />
                    Edit Slides
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {currentSlide + 1} of {slides.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Slide Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={cn(
                        "w-10 h-10 rounded-lg text-sm font-medium transition-colors shrink-0",
                        currentSlide === index
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSlides([...slides, { title: `Slide ${slides.length + 1}`, content: "" }]);
                      setCurrentSlide(slides.length);
                    }}
                    className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 transition-colors shrink-0 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Current Slide Editor */}
                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={slides[currentSlide]?.title || ""}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[currentSlide] = { ...newSlides[currentSlide], title: e.target.value };
                        setSlides(newSlides);
                      }}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={slides[currentSlide]?.content || ""}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[currentSlide] = { ...newSlides[currentSlide], content: e.target.value };
                        setSlides(newSlides);
                      }}
                      className="mt-1.5"
                      rows={4}
                    />
                  </div>
                  {slides.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSlides = slides.filter((_, i) => i !== currentSlide);
                        setSlides(newSlides);
                        setCurrentSlide(Math.max(0, currentSlide - 1));
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Slide
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-violet-600" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Carousel Preview */}
                <div className="relative">
                  <div
                    className={cn(
                      "aspect-square rounded-xl p-8 flex flex-col items-center justify-center text-center",
                      currentTemplate.colors
                    )}
                  >
                    <h2 className="text-2xl font-bold mb-4">
                      {slides[currentSlide]?.title || "Title"}
                    </h2>
                    <p className="text-lg opacity-90">
                      {slides[currentSlide]?.content || "Content"}
                    </p>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {slides.map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            currentSlide === index
                              ? "bg-white"
                              : "bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                    disabled={currentSlide === slides.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Text
                  </Button>
                  <Button className="flex-1 bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Design Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4 text-violet-600" />
                  Design Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={cn(
                        "aspect-square rounded-lg transition-all",
                        t.colors,
                        template === t.id
                          ? "ring-2 ring-violet-600 ring-offset-2"
                          : "opacity-60 hover:opacity-100"
                      )}
                      title={t.name}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Layout className="w-5 h-5 text-violet-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Carousel Best Practices</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>- Keep text concise and readable</li>
                      <li>- Use a strong hook on slide 1</li>
                      <li>- End with a clear call to action</li>
                      <li>- 5-7 slides perform best</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}
