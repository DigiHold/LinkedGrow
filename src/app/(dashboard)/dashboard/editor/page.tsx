"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Send,
  Calendar,
  Save,
  MoreHorizontal,
  Wand2,
  PenLine,
  Copy,
  Check,
  X,
  Gauge,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PostEditor, isVideoMedia } from "@/components/dashboard/post-editor";
import { Textarea } from "@/components/ui/textarea";
import { canAccessFeature, PlanId } from "@/lib/plans";
import { localToUTC, getNowInTimezone, resolveTimezone } from "@/lib/timezone";

const LINKEDIN_MAX_CHARS = 3000;

interface AlgorithmScore {
  total: number;
  hookStrength: number;
  length: number;
  formatting: number;
  engagement: number;
}

// Calculate algorithm score based on content
function calculateAlgorithmScore(content: string): AlgorithmScore {
  // Return zero scores if content is empty
  if (!content.trim()) {
    return {
      total: 0,
      hookStrength: 0,
      length: 0,
      formatting: 0,
      engagement: 0,
    };
  }

  const lines = content.split("\n").filter((l) => l.trim());
  const firstLine = lines[0] || "";

  // Hook strength: first line should be compelling (10-100 chars ideal)
  let hookStrength = 40;
  if (firstLine.length >= 10 && firstLine.length <= 100) {
    hookStrength = 85;
  } else if (firstLine.length > 100 && firstLine.length <= 150) {
    hookStrength = 70;
  } else if (firstLine.length < 10 && firstLine.length > 0) {
    hookStrength = 50;
  }

  // Length score: 800-1500 chars is optimal for LinkedIn
  let lengthScore = 30;
  if (content.length >= 800 && content.length <= 1500) {
    lengthScore = 90;
  } else if (content.length >= 500 && content.length < 800) {
    lengthScore = 75;
  } else if (content.length > 1500 && content.length <= 2500) {
    lengthScore = 70;
  } else if (content.length >= 200 && content.length < 500) {
    lengthScore = 55;
  }

  // Formatting score: check for bullet points, line breaks, etc.
  const hasBullets = content.includes("•") || content.includes("-");
  const hasLineBreaks = (content.match(/\n\n/g) || []).length >= 2;
  const hasSpecialChars = content.includes("→") || content.includes("✓") || content.includes("✔");
  let formattingScore = 40;
  if (hasBullets && hasLineBreaks) {
    formattingScore = 85;
  } else if (hasBullets || hasLineBreaks) {
    formattingScore = 65;
  } else if (hasSpecialChars) {
    formattingScore = 55;
  }

  // Engagement score: questions and CTAs boost engagement
  const hasQuestion = content.includes("?");
  const hasCTA =
    content.toLowerCase().includes("follow") ||
    content.toLowerCase().includes("repost") ||
    content.toLowerCase().includes("share") ||
    content.toLowerCase().includes("comment") ||
    content.toLowerCase().includes("let me know") ||
    content.toLowerCase().includes("what do you think");
  const hasEmoji = /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}]/u.test(content);

  let engagementScore = 20;
  if (hasQuestion) engagementScore += 35;
  if (hasCTA) engagementScore += 35;
  if (hasEmoji) engagementScore += 10;
  engagementScore = Math.min(engagementScore, 100);

  const total = Math.round(
    (hookStrength + lengthScore + formattingScore + engagementScore) / 4
  );

  return {
    total,
    hookStrength,
    length: lengthScore,
    formatting: formattingScore,
    engagement: engagementScore,
  };
}

// Main editor component wrapped in Suspense for useSearchParams
export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading editor...</p>
          </div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const hasCarouselAccess = canAccessFeature(userPlan, "carouselGenerator");
  const editPostId = searchParams.get("edit");
  const initialContent = searchParams.get("content");

  const [content, setContent] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiInstruction, setAIInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  // Start loading if we're editing an existing post (prevents race condition)
  const [isLoading, setIsLoading] = useState(!!editPostId);
  const [currentPostId, setCurrentPostId] = useState<string | null>(editPostId);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mimeType: string;
    preview?: string;
    storageUrl?: string;
    storageKey?: string;
  } | null>(null);
  const [originalHadMedia, setOriginalHadMedia] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const [algorithmScore, setAlgorithmScore] = useState<AlgorithmScore>({
    total: 0,
    hookStrength: 0,
    length: 0,
    formatting: 0,
    engagement: 0,
  });
  const aiPanelRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Load user timezone from settings
  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.timezone) {
            setUserTimezone(data.timezone);
          }
        }
      } catch (error) {
        console.error("Failed to fetch timezone:", error);
      }
    };
    fetchTimezone();
  }, []);

  // Load initial content from query param (from hooks page, etc.)
  useEffect(() => {
    if (initialContent && !editPostId) {
      setContent(initialContent);
    }
  }, [initialContent, editPostId]);

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
            // Load existing media if present
            if (data.post.media && data.post.media.length > 0) {
              const existingMedia = data.post.media[0];
              setAttachedImage({
                base64: "", // Empty since we're using existing URL
                mimeType: existingMedia.mimeType,
                preview: existingMedia.storageUrl,
              });
              setOriginalHadMedia(true);
            }
          } else {
            // Post not found or error - clear the ID so we create a new post
            setCurrentPostId(null);
          }
        } catch (error) {
          console.error("Failed to load post:", error);
          // Clear the ID on error so we create a new post
          setCurrentPostId(null);
        } finally {
          setIsLoading(false);
        }
      };
      loadPost();
    } else {
      // No edit ID - we're creating a new post, ensure loading is false
      setIsLoading(false);
    }
  }, [editPostId]);

  // Update algorithm score when content changes
  useEffect(() => {
    setAlgorithmScore(calculateAlgorithmScore(content));
  }, [content]);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 4000);
  };

  const handleAIEdit = async () => {
    if (!aiInstruction.trim() || !content.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch("/api/ai/edit-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      showError(error instanceof Error ? error.message : "Failed to edit post");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      // Build media info from R2 upload (storageUrl/storageKey set by post-editor)
      const hasNewMedia = attachedImage?.storageUrl && attachedImage?.storageKey;
      const mediaInfo = hasNewMedia ? {
        storageUrl: attachedImage.storageUrl,
        storageKey: attachedImage.storageKey,
        mimeType: attachedImage.mimeType,
      } : undefined;

      // Check if user removed media (had media before, now doesn't)
      const removeMedia = originalHadMedia && !attachedImage;

      if (currentPostId) {
        const response = await fetch(`/api/posts/${currentPostId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, status: "draft", mediaInfo, removeMedia }),
        });
        if (!response.ok) throw new Error("Failed to update post");
      } else {
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            status: "draft",
            postType: attachedImage ? "image" : "text",
            mediaInfo,
          }),
        });
        if (!response.ok) throw new Error("Failed to save draft");
        const data = await response.json();
        setCurrentPostId(data.post.id);
      }
      setSuccessMessage("Draft saved successfully!");
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        router.push("/dashboard/posts");
      }, 1500);
    } catch (error) {
      console.error("Save error:", error);
      showError(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      const isVideo = attachedImage?.mimeType?.startsWith("video/");
      let postId = currentPostId;

      // Create post record if not already saved
      if (!postId) {
        const hasMedia = attachedImage?.storageUrl && attachedImage?.storageKey;
        const mediaInfo = hasMedia ? {
          storageUrl: attachedImage.storageUrl,
          storageKey: attachedImage.storageKey,
          mimeType: attachedImage.mimeType,
        } : undefined;

        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            status: "draft",
            postType: isVideo ? "video" : (attachedImage ? "image" : "text"),
            mediaInfo,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => null);
          throw new Error(err?.error || "Failed to save post");
        }
        const data = await response.json();
        postId = data.post.id;
      }

      // Publish to LinkedIn (API looks up media from DB - images and videos from R2)
      const publishResponse = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          text: content,
        }),
      });

      if (!publishResponse.ok) {
        const error = await publishResponse.json().catch(() => null);
        throw new Error(error?.error || "Failed to publish");
      }

      setSuccessMessage("Post published to LinkedIn!");
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        router.push("/dashboard/posts");
      }, 1500);
    } catch (error) {
      console.error("Publish error:", error);
      showError(error instanceof Error ? error.message : "Failed to publish");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenScheduleModal = () => {
    // Get the effective timezone (resolves "auto" to browser timezone)
    const effectiveTimezone = resolveTimezone(userTimezone);
    const { date } = getNowInTimezone(effectiveTimezone);
    // Set to tomorrow at 9 AM in user's timezone
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split("T")[0]);
    setScheduleTime("09:00");
    setScheduleModal(true);
  };

  const handleSchedulePost = async () => {
    if (!content.trim() || !scheduleDate || !scheduleTime) return;
    setIsScheduling(true);

    try {
      // Convert the selected date/time to UTC using user's configured timezone
      // resolveTimezone handles "auto" by returning browser timezone
      const effectiveTimezone = resolveTimezone(userTimezone);
      const scheduledAt = localToUTC(scheduleDate, scheduleTime, effectiveTimezone);

      const hasNewMedia = attachedImage?.storageUrl && attachedImage?.storageKey;
      const mediaInfo = hasNewMedia ? {
        storageUrl: attachedImage.storageUrl,
        storageKey: attachedImage.storageKey,
        mimeType: attachedImage.mimeType,
      } : undefined;

      // Check if user removed media (had media before, now doesn't)
      const removeMedia = originalHadMedia && !attachedImage;

      if (currentPostId) {
        const response = await fetch(`/api/posts/${currentPostId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, status: "scheduled", scheduledAt, mediaInfo, removeMedia }),
        });
        if (!response.ok) throw new Error("Failed to schedule post");
      } else {
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            status: "scheduled",
            postType: attachedImage ? "image" : "text",
            scheduledAt,
            mediaInfo,
          }),
        });
        if (!response.ok) throw new Error("Failed to schedule post");
      }

      setScheduleModal(false);
      setSuccessMessage("Post scheduled successfully!");
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        router.push("/dashboard/posts");
      }, 1500);
    } catch (error) {
      console.error("Schedule error:", error);
      showError(error instanceof Error ? error.message : "Failed to schedule post");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClearContent = () => {
    setContent("");
    setAttachedImage(null);
    setShowMoreMenu(false);
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
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <PenLine className="w-5 h-5 text-white" />
              </div>
              Post Editor
            </h1>
            <p className="text-muted-foreground mt-1">
              Write and refine your LinkedIn post
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!content.trim()}
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <div className="relative" ref={moreMenuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-lg py-1 min-w-40">
                  <button
                    onClick={handleClearContent}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear content
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <PostEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your LinkedIn post...

Tips for viral posts:
- Start with a strong hook (first 2 lines are crucial)
- Use short paragraphs and line breaks
- Add bullet points for readability
- End with a question or CTA"
              minHeight="min-h-[400px] sm:min-h-[500px]"
              showImageButton
              showVideoButton
              showCarouselButton={hasCarouselAccess}
              attachedImage={attachedImage}
              onImageChange={setAttachedImage}
              onError={showError}
            />

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
                    Describe exactly what you want AI to change in your post above.
                    Be specific about the tone, style, or structure.
                  </p>
                  <Textarea
                    value={aiInstruction}
                    onChange={(e) => setAIInstruction(e.target.value)}
                    placeholder="Examples:
- Rewrite the first sentence to be more attention-grabbing
- Add 3 bullet points summarizing the key takeaways
- Make it sound more professional and less casual
- Shorten to 500 characters while keeping the main message"
                    className="min-h-25"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["Make Shorter", "Add Emojis", "Stronger Hook", "Add CTA", "More Casual"].map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setAIInstruction(suggestion)}
                          className="px-3 py-1 text-xs rounded-full bg-white dark:bg-gray-900 border border-border hover:border-linkedin/50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      )
                    )}
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
            {/* AI Assist Button */}
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start",
                showAIPanel && "bg-linkedin/10 text-linkedin border-linkedin/30"
              )}
              onClick={() => {
                const newState = !showAIPanel;
                setShowAIPanel(newState);
                if (newState) {
                  setTimeout(() => {
                    aiPanelRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }, 100);
                }
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assist
            </Button>

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
                        : algorithmScore.total === 0
                        ? "border-gray-300 text-gray-400"
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
                              : item.value === 0
                              ? "bg-gray-300"
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
                {/* Video notice - videos cannot be stored, must be published immediately */}
                {isVideoMedia(attachedImage) && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
                    Videos are too large to be stored by LinkedGrow. Posts with videos must be published immediately.
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving || !content.trim() || isVideoMedia(attachedImage)}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenScheduleModal}
                  disabled={isSaving || !content.trim() || isVideoMedia(attachedImage)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Post
                </Button>
                <Button
                  variant="linkedin"
                  className="w-full"
                  onClick={handlePublish}
                  disabled={isSaving || !content.trim()}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
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
                  <li>- First 2 lines = your hook (most important!)</li>
                  <li>- 800-1500 characters = sweet spot</li>
                  <li>- End with a question for comments</li>
                  <li>- Post between 8-10 AM or 5-6 PM</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Schedule Post Modal */}
        {scheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => !isScheduling && setScheduleModal(false)}
            />
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
              <div className="p-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-2">
                  Schedule Post
                </h2>
                <p className="text-muted-foreground text-center text-sm mb-6">
                  Choose when you want this post to be published.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setScheduleModal(false)}
                    disabled={isScheduling}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    onClick={handleSchedulePost}
                    disabled={isScheduling || !scheduleDate || !scheduleTime}
                  >
                    {isScheduling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <Check className="w-5 h-5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {showErrorToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <X className="w-5 h-5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
