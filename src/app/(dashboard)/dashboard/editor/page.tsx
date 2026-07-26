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
  Copy,
  Check,
  X,
  Gauge,
  Loader2,
  Trash2,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VideoModal } from "@/components/dashboard/video-modal";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PostEditor, isVideoMedia } from "@/components/dashboard/post-editor";
import { FirstComment } from "@/components/dashboard/first-comment";
import { ImageGeneratorModal } from "@/components/dashboard/image-generator-modal";
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
        <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
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
  const duplicatePostId = searchParams.get("duplicate");
  const initialContent = searchParams.get("content");

  const [content, setContent] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiInstruction, setAIInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  // Start loading if we're editing or duplicating an existing post (prevents race condition)
  const [isLoading, setIsLoading] = useState(!!editPostId || !!duplicatePostId);
  const [currentPostId, setCurrentPostId] = useState<string | null>(editPostId);
  const [currentPostStatus, setCurrentPostStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingAction, setSavingAction] = useState<"changes" | "draft" | "publish" | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [firstComment, setFirstComment] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mimeType: string;
    preview?: string;
    storageUrl?: string;
    storageKey?: string;
  } | null>(null);
  const [originalHadMedia, setOriginalHadMedia] = useState(false);
  const [originalMediaKey, setOriginalMediaKey] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const [hasImageApiKey, setHasImageApiKey] = useState(false);
  const [hasTextApiKey, setHasTextApiKey] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const hasImageAccess = canAccessFeature(userPlan, "imageGeneration");
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
          setHasImageApiKey(data.hasImageApiKey || false);
          setHasTextApiKey(data.hasApiKey || false);
        }
      } catch (error) {
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
            setFirstComment(data.post.firstComment || "");
            setCurrentPostId(data.post.id);
            setCurrentPostStatus(data.post.status || "draft");
            // Load existing media if present
            if (data.post.media && data.post.media.length > 0) {
              const existingMedia = data.post.media[0];
              setAttachedImage({
                base64: "",
                mimeType: existingMedia.mimeType,
                preview: existingMedia.storageUrl,
                storageUrl: existingMedia.storageUrl,
                storageKey: existingMedia.storageKey,
              });
              setOriginalHadMedia(true);
              setOriginalMediaKey(existingMedia.storageKey);
            }
          } else {
            // Post not found or error - clear the ID so we create a new post
            setCurrentPostId(null);
          }
        } catch (error) {
// Clear the ID on error so we create a new post
          setCurrentPostId(null);
        } finally {
          setIsLoading(false);
        }
      };
      loadPost();
    } else if (!duplicatePostId) {
      // No edit/duplicate ID - we're creating a new post, ensure loading is false
      setIsLoading(false);
    }
  }, [editPostId, duplicatePostId]);

  // Load post for duplication: copy content/firstComment/media but never bind
  // to the original post id, so saving creates a fresh draft instead of
  // overwriting the post we're cloning from. The media file is copied to a
  // brand-new R2 key so deleting the source post never breaks the duplicate.
  useEffect(() => {
    if (duplicatePostId && !editPostId) {
      const loadDuplicate = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/posts/${duplicatePostId}`);
          if (response.ok) {
            const data = await response.json();
            setContent(data.post.content || "");
            setFirstComment(data.post.firstComment || "");
            if (data.post.media && data.post.media.length > 0) {
              // Copy the source R2 object to a fresh key so the duplicate
              // owns its own file. Fall back to referencing the original
              // only if the copy fails - better a shared file than no image.
              try {
                const copyRes = await fetch(`/api/posts/${duplicatePostId}/duplicate-media`, {
                  method: "POST",
                });
                if (copyRes.ok) {
                  const copyData = await copyRes.json();
                  if (copyData.media) {
                    setAttachedImage({
                      base64: "",
                      mimeType: copyData.media.mimeType,
                      preview: copyData.media.storageUrl,
                      storageUrl: copyData.media.storageUrl,
                      storageKey: copyData.media.storageKey,
                    });
                  }
                } else {
                  const existingMedia = data.post.media[0];
                  setAttachedImage({
                    base64: "",
                    mimeType: existingMedia.mimeType,
                    preview: existingMedia.storageUrl,
                    storageUrl: existingMedia.storageUrl,
                    storageKey: existingMedia.storageKey,
                  });
                }
              } catch {
                const existingMedia = data.post.media[0];
                setAttachedImage({
                  base64: "",
                  mimeType: existingMedia.mimeType,
                  preview: existingMedia.storageUrl,
                  storageUrl: existingMedia.storageUrl,
                  storageKey: existingMedia.storageKey,
                });
              }
            }
          }
        } catch {
          // Fall through to empty editor
        } finally {
          setIsLoading(false);
        }
      };
      loadDuplicate();
    }
  }, [duplicatePostId, editPostId]);

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
showError(error instanceof Error ? error.message : "Failed to edit post");
    } finally {
      setIsProcessing(false);
    }
  };

  // Save changes without changing post status (keeps scheduled date, etc.)
  const handleSaveChanges = async () => {
    if (!content.trim() || !currentPostId) return;
    setIsSaving(true);
    setSavingAction("changes");
    try {
      const hasNewMedia = attachedImage?.storageUrl && attachedImage?.storageKey && attachedImage.storageKey !== originalMediaKey;
      const mediaInfo = hasNewMedia ? {
        storageUrl: attachedImage.storageUrl,
        storageKey: attachedImage.storageKey,
        mimeType: attachedImage.mimeType,
      } : undefined;

      const removeMedia = originalHadMedia && !attachedImage;

      const response = await fetch(`/api/posts/${currentPostId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mediaInfo, removeMedia, firstComment: firstComment || null }),
      });
      if (!response.ok) throw new Error("Failed to save changes");
      setSuccessMessage("Changes saved!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
    } catch (error) {
showError(error instanceof Error ? error.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
      setSavingAction(null);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    setSavingAction("draft");
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
          body: JSON.stringify({ content, status: "draft", mediaInfo, removeMedia, firstComment: firstComment || null }),
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
            firstComment: firstComment || null,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => null);
          throw new Error(err?.error || "Failed to save draft");
        }
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
showError(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSaving(false);
      setSavingAction(null);
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    setSavingAction("publish");
    try {
      const isVideo = attachedImage?.mimeType?.startsWith("video/");
      const isPdf = attachedImage?.mimeType === "application/pdf";
      let postId = currentPostId;

      // Create post record if not already saved.
      // Videos are NOT stored in the DB media table (too big) - we mark the
      // post with postType=video for the badge and pass the R2 URL directly
      // to the publish endpoint below.
      if (!postId) {
        const hasMedia = attachedImage?.storageUrl && attachedImage?.storageKey && !isVideo;
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
            postType: isVideo ? "video" : isPdf ? "carousel" : (attachedImage ? "image" : "text"),
            mediaInfo,
            firstComment: firstComment || null,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => null);
          throw new Error(err?.error || "Failed to save post");
        }
        const data = await response.json();
        postId = data.post.id;
        // Persist the new draft id to state so a publish failure followed by
        // a retry reuses the same draft instead of creating a duplicate.
        setCurrentPostId(postId);
      }

      // Publish to LinkedIn. Images/PDFs are looked up from the media table
      // by postId; videos are passed inline because they aren't stored.
      const publishResponse = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          text: content,
          videoUrl: isVideo ? attachedImage?.storageUrl : undefined,
          videoMimeType: isVideo ? attachedImage?.mimeType : undefined,
          videoStorageKey: isVideo ? attachedImage?.storageKey : undefined,
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
showError(error instanceof Error ? error.message : "Failed to publish");
    } finally {
      setIsSaving(false);
      setSavingAction(null);
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
          body: JSON.stringify({ content, status: "scheduled", scheduledAt, mediaInfo, removeMedia, firstComment: firstComment || null }),
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
            firstComment: firstComment || null,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => null);
          throw new Error(err?.error || "Failed to schedule post");
        }
      }

      setScheduleModal(false);
      setSuccessMessage("Post scheduled successfully!");
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        router.push("/dashboard/posts");
      }, 1500);
    } catch (error) {
showError(error instanceof Error ? error.message : "Failed to schedule post");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClearContent = () => {
    setContent("");
    setFirstComment("");
    setAttachedImage(null);
    setShowMoreMenu(false);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="advancedEditor">
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              Editor
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Write a post, check how it reads, and schedule it.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VideoModal videoId="9pWn4OdcCNQ" />
            <Link href="/docs/content-creation/post-editor" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white">
              <HelpCircle className="w-3.5 h-3.5" />
              Docs
            </Link>
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
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg py-1 min-w-40">
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
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <PostEditor
              value={content}
              onChange={setContent}
              // The placeholder used to repeat the whole tips panel that sits
              // in the right column, which meant the empty editor opened on
              // two copies of the same advice.
              placeholder="Start writing..."
              minHeight="min-h-[400px] sm:min-h-[500px]"
              showImageButton
              showVideoButton
              showCarouselButton={hasCarouselAccess}
              attachedImage={attachedImage}
              onImageChange={setAttachedImage}
              onError={showError}
            />

            {/* First Comment */}
            <FirstComment
              value={firstComment}
              onChange={setFirstComment}
              postContent={content}
              onError={showError}
              hasAccess={canAccessFeature(userPlan, "firstComment")}
            />

            {/* AI Panel */}
            {showAIPanel && (
              <Card ref={aiPanelRef} className="border-linkedin/20 bg-linkedin/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-linkedin" />
                      Edit with AI
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
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
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

            {/* AI Image Generation */}
            {hasImageApiKey && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  if (!content.trim()) {
                    showError("Add some text to your post first before generating an image.");
                    return;
                  }
                  setShowImageModal(true);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                Generate AI Image
                {!hasImageAccess && (
                  <span className="ml-auto text-xs text-amber-600">Pro</span>
                )}
              </Button>
            )}

            {/* Algorithm Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Algorithm score
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* A ring reading 0 over four 0% bars looks like a failed post
                    rather than an empty one, so the panel rests until there is
                    something to score. */}
                {!content.trim() ? (
                  <p className="py-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Start writing and this scores your hook, length, formatting
                    and how likely the post is to get replies.
                  </p>
                ) : (
                  <>
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
                        <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
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
                  </>
                )}
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
                {/* Save Changes - only when editing an existing post */}
                {currentPostId && (
                  <Button
                    className="w-full"
                    onClick={handleSaveChanges}
                    disabled={isSaving || !content.trim()}
                  >
                    {savingAction === "changes" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {savingAction === "changes" ? "Saving..." : "Save Changes"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving || !content.trim() || isVideoMedia(attachedImage)}
                >
                  {savingAction === "draft" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {savingAction === "draft" ? "Saving..." : "Save as draft"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenScheduleModal}
                  disabled={isSaving || !content.trim() || isVideoMedia(attachedImage)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule post
                </Button>
                <Button
                  variant="linkedin"
                  className="w-full"
                  onClick={handlePublish}
                  disabled={isSaving || !content.trim()}
                >
                  {savingAction === "publish" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {savingAction === "publish" ? "Publishing..." : "Publish now"}
                </Button>
              </CardContent>
            </Card>

            {/* Reference, not an alert: yellow made a permanent tips list read
                as a warning that never went away. */}
            <Card>
              <CardContent className="p-4">
                <h4 className="mb-2.5 text-[13px] font-medium text-slate-900 dark:text-white">
                  What tends to work
                </h4>
                <ul className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <li>Your first 2 lines are the hook, everything else is read only if they land</li>
                  <li>800 to 1,500 characters</li>
                  <li>A question at the end gets you comments</li>
                  <li>Post between 8-10 AM or 5-6 PM</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Generator Modal */}
        <ImageGeneratorModal
          open={showImageModal}
          onOpenChange={setShowImageModal}
          postContent={content}
          userPlan={userPlan}
          hasImageApiKey={hasImageApiKey}
          hasTextApiKey={hasTextApiKey}
          onImageGenerated={(imageData) => {
            setAttachedImage(imageData);
          }}
        />

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
                  <Calendar className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-2">
                  Schedule post
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
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
                    className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
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
