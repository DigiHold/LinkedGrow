"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";

const LINKEDIN_MAX_CHARS = 3000;

interface AlgorithmScore {
  total: number;
  hookStrength: number;
  length: number;
  formatting: number;
  engagement: number;
}

// Main editor component wrapped in Suspense for useSearchParams
export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editPostId = searchParams.get("edit");

  const [content, setContent] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiInstruction, setAIInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [algorithmScore, setAlgorithmScore] = useState<AlgorithmScore>({
    total: 0,
    hookStrength: 0,
    length: 0,
    formatting: 0,
    engagement: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);

  // Load post if edit parameter is present
  useEffect(() => {
    if (editPostId) {
      const loadPost = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/posts/${editPostId}`);
          if (response.ok) {
            const data = await response.json();
            setContent(data.post.content || "");
            setCurrentPostId(data.post.id);
          }
        } catch (error) {
          console.error("Failed to load post:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadPost();
    }
  }, [editPostId]);

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

  // Unicode character mappings for bold text
  const BOLD_MAP: Record<string, string> = {
    a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷",
    k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁",
    u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇",
    A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝",
    K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧",
    U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭",
    "0": "𝟬", "1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", "8": "𝟴", "9": "𝟵",
  };

  const ITALIC_MAP: Record<string, string> = {
    a: "𝘢", b: "𝘣", c: "𝘤", d: "𝘥", e: "𝘦", f: "𝘧", g: "𝘨", h: "𝘩", i: "𝘪", j: "𝘫",
    k: "𝘬", l: "𝘭", m: "𝘮", n: "𝘯", o: "𝘰", p: "𝘱", q: "𝘲", r: "𝘳", s: "𝘴", t: "𝘵",
    u: "𝘶", v: "𝘷", w: "𝘸", x: "𝘹", y: "𝘺", z: "𝘻",
    A: "𝘈", B: "𝘉", C: "𝘊", D: "𝘋", E: "𝘌", F: "𝘍", G: "𝘎", H: "𝘏", I: "𝘐", J: "𝘑",
    K: "𝘒", L: "𝘓", M: "𝘔", N: "𝘕", O: "𝘖", P: "𝘗", Q: "𝘘", R: "𝘙", S: "𝘚", T: "𝘛",
    U: "𝘜", V: "𝘝", W: "𝘞", X: "𝘟", Y: "𝘠", Z: "𝘡",
  };

  // Reverse maps for detecting and removing formatting
  const BOLD_REVERSE = Object.fromEntries(Object.entries(BOLD_MAP).map(([k, v]) => [v, k]));
  const ITALIC_REVERSE = Object.fromEntries(Object.entries(ITALIC_MAP).map(([k, v]) => [v, k]));

  const toBold = (text: string) => text.split("").map((c) => BOLD_MAP[c] || c).join("");
  const toItalic = (text: string) => text.split("").map((c) => ITALIC_MAP[c] || c).join("");
  const fromBold = (text: string) => text.split("").map((c) => BOLD_REVERSE[c] || c).join("");
  const fromItalic = (text: string) => text.split("").map((c) => ITALIC_REVERSE[c] || c).join("");
  const isBold = (text: string) => text.split("").some((c) => BOLD_REVERSE[c]);
  const isItalic = (text: string) => text.split("").some((c) => ITALIC_REVERSE[c]);
  const isBulletList = (text: string) => text.split("\n").every((l) => !l.trim() || l.trim().startsWith("• "));
  const isNumberedList = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    return lines.every((l, i) => l.trim().startsWith(`${i + 1}. `));
  };
  const fromBulletList = (text: string) => text.split("\n").map((l) => l.replace(/^• /, "")).join("\n");
  const fromNumberedList = (text: string) => text.split("\n").map((l) => l.replace(/^\d+\. /, "")).join("\n");

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeSelection = content.substring(0, start);
    const afterSelection = content.substring(end);

    let newText = "";
    let cursorOffset = 0;

    switch (format) {
      case "bold":
        if (selectedText) {
          // Toggle: if already bold, remove it; otherwise apply bold
          if (isBold(selectedText)) {
            newText = fromBold(fromItalic(selectedText));
          } else {
            newText = toBold(fromItalic(selectedText));
          }
        } else {
          newText = toBold("bold text");
          cursorOffset = newText.length;
        }
        break;
      case "italic":
        if (selectedText) {
          // Toggle: if already italic, remove it; otherwise apply italic
          if (isItalic(selectedText)) {
            newText = fromItalic(fromBold(selectedText));
          } else {
            newText = toItalic(fromBold(selectedText));
          }
        } else {
          newText = toItalic("italic text");
          cursorOffset = newText.length;
        }
        break;
      case "bullet":
        if (selectedText) {
          // Toggle: if already bullet list, remove it
          if (isBulletList(selectedText)) {
            newText = fromBulletList(selectedText);
          } else {
            const plainText = isNumberedList(selectedText) ? fromNumberedList(selectedText) : selectedText;
            const lines = plainText.split("\n");
            newText = lines.map((line) => (line.trim() ? `• ${line.trim()}` : "")).join("\n");
          }
        } else {
          newText = "• ";
          cursorOffset = 2;
        }
        break;
      case "number":
        if (selectedText) {
          // Toggle: if already numbered list, remove it
          if (isNumberedList(selectedText)) {
            newText = fromNumberedList(selectedText);
          } else {
            const plainText = isBulletList(selectedText) ? fromBulletList(selectedText) : selectedText;
            const lines = plainText.split("\n");
            newText = lines.map((line, i) => (line.trim() ? `${i + 1}. ${line.trim()}` : "")).join("\n");
          }
        } else {
          newText = "1. ";
          cursorOffset = 3;
        }
        break;
      default:
        return;
    }

    const newContent = beforeSelection + newText + afterSelection;
    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + (selectedText ? newText.length : cursorOffset);
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleAIEdit = async () => {
    if (!aiInstruction.trim() || !content.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          content: content,
          instruction: aiInstruction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit post");
      }

      const data = await response.json();
      if (data.content) {
        setContent(data.content);
      }
      setShowAIPanel(false);
      setAIInstruction("");
    } catch (error) {
      console.error("AI edit error:", error);
      alert(error instanceof Error ? error.message : "Failed to edit post");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      if (currentPostId) {
        // Update existing post
        const response = await fetch(`/api/posts/${currentPostId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, status: "draft" }),
        });
        if (!response.ok) throw new Error("Failed to update post");
      } else {
        // Create new post
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, status: "draft", postType: "text" }),
        });
        if (!response.ok) throw new Error("Failed to save draft");
        const data = await response.json();
        setCurrentPostId(data.post.id);
      }
      alert("Draft saved successfully!");
      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Save error:", error);
      alert(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      // First save the post
      let postId = currentPostId;
      if (!postId) {
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, status: "draft", postType: "text" }),
        });
        if (!response.ok) throw new Error("Failed to save post");
        const data = await response.json();
        postId = data.post.id;
      }

      // Then publish
      const publishResponse = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });

      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        throw new Error(error.error || "Failed to publish");
      }

      alert("Post published to LinkedIn!");
      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Publish error:", error);
      alert(error instanceof Error ? error.message : "Failed to publish");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="advancedEditor">
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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSaveAsDraft}
                disabled={isSaving || !content.trim()}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isSaving ? "Saving..." : "Save as Draft"}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Post
              </Button>
              <Button
                variant="linkedin"
                className="w-full justify-start"
                onClick={handlePublish}
                disabled={isSaving || !content.trim()}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {isSaving ? "Publishing..." : "Publish Now"}
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
