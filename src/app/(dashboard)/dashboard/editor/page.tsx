"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image,
  Sparkles,
  Send,
  Calendar,
  Save,
  MoreHorizontal,
  Wand2,
  Copy,
  Check,
  X,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";
import { useSession } from "next-auth/react";

const LINKEDIN_MAX_CHARS = 3000;

interface AlgorithmScore {
  total: number;
  hookStrength: number;
  length: number;
  formatting: number;
  engagement: number;
}

export default function EditorPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const userEmail = session?.user?.email || "";

  const [content, setContent] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiInstruction, setAIInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [algorithmScore, setAlgorithmScore] = useState<AlgorithmScore>({
    total: 0,
    hookStrength: 0,
    length: 0,
    formatting: 0,
    engagement: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);

  // Update character count and algorithm score
  useEffect(() => {
    setCharCount(content.length);

    // Simple algorithm scoring (in real app, this would be more sophisticated)
    const lines = content.split("\n").filter((l) => l.trim());
    const firstLine = lines[0] || "";
    const hasHook = firstLine.length > 10 && firstLine.length < 100;
    const hasFormatting = content.includes("•") || content.includes("→") || content.includes("✓");
    const hasQuestion = content.includes("?");
    const hasCTA = content.toLowerCase().includes("follow") || content.toLowerCase().includes("repost");
    const optimalLength = content.length >= 800 && content.length <= 1500;

    const hookStrength = hasHook ? 85 : 40;
    const lengthScore = optimalLength ? 90 : content.length < 200 ? 30 : 70;
    const formattingScore = hasFormatting ? 80 : 50;
    const engagementScore = (hasQuestion ? 40 : 0) + (hasCTA ? 50 : 0);

    setAlgorithmScore({
      hookStrength,
      length: lengthScore,
      formatting: formattingScore,
      engagement: Math.min(engagementScore, 100),
      total: Math.round((hookStrength + lengthScore + formattingScore + Math.min(engagementScore, 100)) / 4),
    });
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = "";
    switch (format) {
      case "bold":
        newText = `𝗯𝗼𝗹𝗱`; // Would need actual unicode conversion
        break;
      case "italic":
        newText = `𝘪𝘵𝘢𝘭𝘪𝘤`;
        break;
      case "bullet":
        newText = selectedText ? `• ${selectedText}` : "• ";
        break;
      case "number":
        newText = selectedText ? `1. ${selectedText}` : "1. ";
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
  };

  const handleAIEdit = async () => {
    if (!aiInstruction.trim()) return;
    setIsProcessing(true);
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In real app, this would call the AI API
    setIsProcessing(false);
    setShowAIPanel(false);
    setAIInstruction("");
  };

  return (
    <FeatureGate feature="advancedEditor" userPlan={userPlan} userEmail={userEmail}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Post Editor</h1>
          <p className="text-muted-foreground mt-1">
            Write and refine your LinkedIn post
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              {/* Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1 pb-3 mb-3 border-b border-border">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => insertFormatting("bold")}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => insertFormatting("italic")}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => insertFormatting("bullet")}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => insertFormatting("number")}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button variant="ghost" size="icon-sm" title="Add Image">
                  <Image className="w-4 h-4" />
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newState = !showAIPanel;
                    setShowAIPanel(newState);
                    if (newState) {
                      // Scroll to AI panel after it renders
                      setTimeout(() => {
                        aiPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 100);
                    }
                  }}
                  className={cn(showAIPanel && "bg-linkedin/10 text-linkedin")}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">AI Assist</span>
                </Button>
              </div>

              {/* Main Textarea */}
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your LinkedIn post...

Tips for viral posts:
• Start with a strong hook (first 2 lines are crucial)
• Use short paragraphs and line breaks
• Add bullet points for readability
• End with a question or CTA"
                className="min-h-[400px] sm:min-h-[500px] border-0 focus-visible:ring-0 resize-none text-base"
              />

              {/* Character Counter */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span
                  className={cn(
                    "text-sm",
                    charCount > LINKEDIN_MAX_CHARS
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {charCount} / {LINKEDIN_MAX_CHARS}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    ~{Math.ceil(charCount / 200)} min read
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Panel */}
          {showAIPanel && (
            <Card ref={aiPanelRef} className="border-linkedin/20 bg-linkedin/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-linkedin" />
                    AI Edit
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowAIPanel(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Describe exactly what you want AI to change in your post above. Be specific about the tone, style, or structure.
                </p>
                <Textarea
                  value={aiInstruction}
                  onChange={(e) => setAIInstruction(e.target.value)}
                  placeholder="Examples:
• Rewrite the first sentence to be more attention-grabbing
• Add 3 bullet points summarizing the key takeaways
• Make it sound more professional and less casual
• Shorten to 500 characters while keeping the main message"
                  className="min-h-[100px]"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    "Make it shorter",
                    "Add emojis",
                    "Stronger hook",
                    "Add CTA",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setAIInstruction(suggestion)}
                      className="px-3 py-1 text-xs rounded-full bg-white dark:bg-gray-900 border border-border hover:border-linkedin/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <Button
                  variant="linkedin"
                  className="mt-4 w-full"
                  onClick={handleAIEdit}
                  disabled={!aiInstruction.trim() || isProcessing}
                >
                  {isProcessing ? "Processing..." : "Apply Changes"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Algorithm Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Algorithm Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <div
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4",
                    algorithmScore.total >= 80
                      ? "border-green-500 text-green-600"
                      : algorithmScore.total >= 60
                      ? "border-yellow-500 text-yellow-600"
                      : "border-red-500 text-red-600"
                  )}
                >
                  {algorithmScore.total}
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Hook Strength", value: algorithmScore.hookStrength },
                  { label: "Length", value: algorithmScore.length },
                  { label: "Formatting", value: algorithmScore.formatting },
                  { label: "Engagement", value: algorithmScore.engagement },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          item.value >= 80
                            ? "bg-green-500"
                            : item.value >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        )}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Post
              </Button>
              <Button variant="linkedin" className="w-full justify-start">
                <Send className="w-4 h-4 mr-2" />
                Publish Now
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Quick Tips
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1.5">
                <li>• First 2 lines = your hook (most important!)</li>
                <li>• 800-1500 characters = sweet spot</li>
                <li>• End with a question for comments</li>
                <li>• Post between 8-10 AM or 5-6 PM</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </FeatureGate>
  );
}
