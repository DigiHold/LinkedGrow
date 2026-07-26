"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Save,
  Send,
  Crown,
  Lock,
  Image,
  Calendar,
  Pencil,
  Smile,
  Zap,
  MessageSquare,
  ExternalLink,
  X,
  Loader2,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VideoModal } from "@/components/dashboard/video-modal";
import { PlanId, PLANS, isWithinLimit, canAccessFeature } from "@/lib/plans";
import { Progress } from "@/components/ui/progress";
import { ImageGeneratorModal } from "@/components/dashboard/image-generator-modal";
import { PostEditor, isVideoMedia } from "@/components/dashboard/post-editor";
import { FirstComment } from "@/components/dashboard/first-comment";
import { localToUTC, resolveTimezone } from "@/lib/timezone";

const postTypes = [
  { id: "actionable", label: "Actionable", description: "Tips and how-tos" },
  { id: "inspiring", label: "Inspiring", description: "Motivation and stories" },
  { id: "introspective", label: "Introspective", description: "Personal lessons" },
  { id: "promotional", label: "Promotional", description: "Showcase your work" },
];

const postCategories = [
  { id: "explanation", label: "Explanation" },
  { id: "best-practices", label: "Best Practices" },
  { id: "advice", label: "Striking Advice" },
  { id: "list", label: "List Format" },
  { id: "resources", label: "Resources" },
  { id: "auto", label: "Let AI Decide" },
];

// Usage Limit Banner Component
function UsageLimitBanner({
  postsUsed,
  postsLimit,
  userPlan,
}: {
  postsUsed: number;
  postsLimit: number;
  userPlan: PlanId;
}) {
  const isUnlimited = postsLimit === -1;
  const percentUsed = isUnlimited ? 0 : (postsUsed / postsLimit) * 100;
  const remaining = isUnlimited ? "Unlimited" : postsLimit - postsUsed;
  const isLimitReached = !isUnlimited && postsUsed >= postsLimit;
  const isNearLimit = !isUnlimited && postsUsed >= postsLimit - 1;

  if (isUnlimited) return null;

  return (
    <Card className={cn(
      "border-2 transition-all",
      isLimitReached
        ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
        : isNearLimit
          ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
          : "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
    )}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isLimitReached ? (
                <Lock className="w-5 h-5 text-red-500" />
              ) : (
                <Sparkles className="w-5 h-5 text-blue-500" />
              )}
              <span className="font-semibold text-sm">
                {isLimitReached
                  ? "Monthly Limit Reached"
                  : `${remaining} post${remaining === 1 ? "" : "s"} remaining this month`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress
                value={Math.min(percentUsed, 100)}
                className={cn(
                  "h-2 flex-1",
                  isLimitReached ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-amber-500" : "[&>div]:bg-blue-500"
                )}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {postsUsed}/{postsLimit} used
              </span>
            </div>
            {isLimitReached && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Upgrade to continue creating unlimited posts with your own AI key
              </p>
            )}
          </div>
          {(isLimitReached || isNearLimit) && (
            <a href="/dashboard/upgrade">
              <Button
                size="sm"
                className={cn(
                  "text-white",
                  isLimitReached
                    ? "bg-linear-to-r from-linkedin to-purple-600 hover:from-linkedin/90 hover:to-purple-600/90"
                    : "bg-amber-600 hover:bg-amber-700"
                )}
              >
                <Crown className="w-4 h-4 mr-2" />
                {isLimitReached ? "Upgrade Now" : "Upgrade"}
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Limit Reached Overlay Component
function LimitReachedOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center mb-6 shadow-xl">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Trial Expired</h2>
        <p className="text-muted-foreground mb-2">
          Your <span className="font-semibold">7-day Pro trial</span> has ended.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Pick Starter or higher to keep generating posts with <span className="font-semibold text-foreground">your own AI API key</span>.
        </p>

        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2 text-sm">
            <Check className="w-4 h-4" />
            What you&apos;ll unlock with Starter:
          </h3>
          <ul className="text-sm text-green-700 dark:text-green-400 space-y-1.5">
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" /> Unlimited post generation
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" /> Advanced editor with AI assist
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" /> Content calendar & scheduling
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" /> Reddit ideas finder
            </li>
          </ul>
        </div>

        <a href="/dashboard/upgrade" className="block w-full">
          <Button
            variant="linkedin"
            size="lg"
            className="shadow-lg w-full text-white"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Unlock
          </Button>
        </a>
        <p className="text-xs text-muted-foreground mt-4">
          Use your own AI API key • Only pay for what you use
        </p>
      </div>
    </div>
  );
}

// Calculate algorithm score for a post
function calculateScore(content: string): number {
  if (!content.trim()) return 0;

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

  return Math.round(
    (hookStrength + lengthScore + formattingScore + engagementScore) / 4
  );
}

// AI Quick Edit Actions
const aiQuickActions = [
  { id: "shorter", label: "Make Shorter", icon: Zap },
  { id: "emojis", label: "Add Emojis", icon: Smile },
  { id: "hook", label: "Stronger Hook", icon: Sparkles },
  { id: "cta", label: "Better CTA", icon: MessageSquare },
  { id: "formal", label: "More Formal", icon: Pencil },
  { id: "casual", label: "More Casual", icon: Smile },
];

export default function GeneratorPage() {
  const { data: session } = useSession();

  // Get user's plan from session
  const userPlan: PlanId = (session?.user?.plan as PlanId) || "free";
  const postsLimit = PLANS[userPlan].limits.postsPerMonth;

  // State for real usage data
  const [postsUsedThisMonth, setPostsUsedThisMonth] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasImageApiKey, setHasImageApiKey] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const canGenerate = isWithinLimit(userPlan, "postsPerMonth", postsUsedThisMonth);
  const isLimitReached = !canGenerate;
  const hasImageAccess = canAccessFeature(userPlan, "imageGeneration");
  const hasCarouselAccess = canAccessFeature(userPlan, "carouselGenerator");

  // Overlay only fires when the user actively tries to start a new cycle after
  // hitting the monthly limit. Reaching the counter (even at 3/3) does not show
  // the overlay on its own - users need to be able to see posts they just made.
  const [showLimitOverlay, setShowLimitOverlay] = useState(false);

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<number | null>(null);
  const [generatedPost, setGeneratedPost] = useState("");
  const [copied, setCopied] = useState(false);

  // AI Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiInstruction, setAIInstruction] = useState("");
  const [isApplyingAI, setIsApplyingAI] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; preview?: string; storageUrl?: string; storageKey?: string } | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const [firstComment, setFirstComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [linkPreviewUrl, setLinkPreviewUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings and usage data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch settings and posts count in parallel
        const [settingsRes, postsRes] = await Promise.all([
          fetch("/api/user/settings"),
          fetch("/api/posts?limit=100"), // Get posts to count this month's usage
        ]);

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setHasApiKey(settings.hasApiKey || false);
          setHasImageApiKey(settings.hasImageApiKey || false);
          if (settings.timezone) {
            setUserTimezone(settings.timezone);
          }
          // Usage is tracked per-generation (not per-post in DB).
          setPostsUsedThisMonth(settings.generationsUsed || 0);
        }

        // postsRes is still fetched for other post-related state (if needed).
        if (postsRes.ok) {
          await postsRes.json();
        }
      } catch (error) {
} finally {
        setIsLoadingSettings(false);
      }
    };

    loadData();
  }, []);

  // Persist state to localStorage
  const STORAGE_KEY = "linkedgrow_generator_draft";

  // Save state to localStorage when it changes
  useEffect(() => {
    // Only save if we have meaningful data (step > 1 or have content)
    if (step > 1 || generatedPost || topic || generatedIdeas.length > 0) {
      const stateToSave = {
        step,
        selectedType,
        selectedCategory,
        topic,
        generatedIdeas,
        selectedIdea,
        generatedPost,
        editedPost,
        attachedImage,
        linkPreviewUrl,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [step, selectedType, selectedCategory, topic, generatedIdeas, selectedIdea, generatedPost, editedPost, attachedImage, linkPreviewUrl]);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        const savedAt = new Date(state.savedAt);
        const hoursSinceSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceSave < 24) {
          if (state.step) setStep(state.step);
          if (state.selectedType) setSelectedType(state.selectedType);
          if (state.selectedCategory) setSelectedCategory(state.selectedCategory);
          if (state.topic) setTopic(state.topic);
          if (state.generatedIdeas?.length > 0) setGeneratedIdeas(state.generatedIdeas);
          if (state.selectedIdea !== null) setSelectedIdea(state.selectedIdea);
          if (state.generatedPost) setGeneratedPost(state.generatedPost);
          if (state.editedPost) setEditedPost(state.editedPost);
          if (state.attachedImage) setAttachedImage(state.attachedImage);
          if (state.linkPreviewUrl) setLinkPreviewUrl(state.linkPreviewUrl);
        } else {
          // Clear stale data
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Clear draft after successful publish or save
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ideas",
          topic: topic || undefined,
          postType: selectedType || "actionable",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403 && data.limitReached) {
          setPostsUsedThisMonth(postsLimit === -1 ? 0 : postsLimit);
          setShowLimitOverlay(true);
          return;
        }
        throw new Error(data.error || "Failed to generate ideas");
      }

      if (typeof data.remaining === "number" && data.remaining !== -1 && postsLimit !== -1) {
        setPostsUsedThisMonth(postsLimit - data.remaining);
      }
      setGeneratedIdeas(data.ideas || []);
      setStep(3);
    } catch (error) {
showToast(error instanceof Error ? error.message : "Failed to generate ideas");
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleGeneratePost = async () => {
    if (selectedIdea === null) return;

    setIsGeneratingPost(true);
    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          idea: generatedIdeas[selectedIdea],
          postType: selectedType || "actionable",
          postCategory: selectedCategory || "auto",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403 && data.limitReached) {
          setPostsUsedThisMonth(postsLimit === -1 ? 0 : postsLimit);
          setShowLimitOverlay(true);
          return;
        }
        throw new Error(data.error || "Failed to generate post");
      }

      setGeneratedPost(data.post || "");
      setEditedPost("");
      setStep(4);
    } catch (error) {
showToast(error instanceof Error ? error.message : "Failed to generate post");
    } finally {
      setIsGeneratingPost(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditing ? editedPost : generatedPost;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start editing the post
  const handleStartEditing = () => {
    setEditedPost(generatedPost);
    setIsEditing(true);
  };

  // Save edits
  const handleSaveEdits = () => {
    setGeneratedPost(editedPost);
    setIsEditing(false);
  };

  // Cancel edits
  const handleCancelEdits = () => {
    setEditedPost("");
    setIsEditing(false);
  };

  // Apply AI quick action
  const handleQuickAIAction = async (actionId: string) => {
    const currentContent = isEditing ? editedPost : generatedPost;
    if (!currentContent.trim()) return;

    setIsApplyingAI(true);
    try {
      // Map action IDs to the labels expected by /api/ai/edit-post
      const actionLabels: Record<string, string> = {
        shorter: "Make Shorter",
        emojis: "Add Emojis",
        hook: "Stronger Hook",
        cta: "Better CTA",
        formal: "More Formal",
        casual: "More Casual",
      };

      const instruction = actionLabels[actionId] || actionId;

      const response = await fetch("/api/ai/edit-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentContent,
          instruction: instruction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply AI action");
      }

      const data = await response.json();
      if (data.content) {
        if (isEditing) {
          setEditedPost(data.content);
        } else {
          setGeneratedPost(data.content);
        }
      }
    } catch (error) {
showToast(error instanceof Error ? error.message : "Failed to apply AI action");
    } finally {
      setIsApplyingAI(false);
    }
  };

  // Apply custom AI instruction
  const handleApplyAIInstruction = async () => {
    if (!aiInstruction.trim()) return;
    const currentContent = isEditing ? editedPost : generatedPost;
    if (!currentContent.trim()) return;

    setIsApplyingAI(true);
    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          content: currentContent,
          instruction: aiInstruction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply AI instruction");
      }

      const data = await response.json();
      if (data.content) {
        if (isEditing) {
          setEditedPost(data.content);
        } else {
          setGeneratedPost(data.content);
        }
      }
      setShowAIPanel(false);
      setAIInstruction("");
    } catch (error) {
showToast(error instanceof Error ? error.message : "Failed to apply AI instruction");
    } finally {
      setIsApplyingAI(false);
    }
  };

  // Get current post content
  const currentPost = isEditing ? editedPost : generatedPost;

  // Save as draft
  const handleSaveAsDraft = async () => {
    if (!currentPost.trim()) {
      showToast("No post content to save");
      return;
    }

    setIsSaving(true);
    try {
      // If image was uploaded via PostEditor, it's already on R2 (storageUrl/storageKey set, base64 empty)
      // If image was uploaded via sidebar button, it only has base64
      const hasR2Media = attachedImage?.storageUrl && attachedImage?.storageKey;
      const mediaInfo = hasR2Media ? {
        storageUrl: attachedImage.storageUrl,
        storageKey: attachedImage.storageKey,
        mimeType: attachedImage.mimeType,
      } : undefined;
      const mediaData = (!hasR2Media && attachedImage?.base64) ? {
        base64: attachedImage.base64,
        mimeType: attachedImage.mimeType,
      } : undefined;

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentPost,
          status: "draft",
          postType: attachedImage ? "image" : "text",
          mediaInfo,
          mediaData,
          firstComment: firstComment || null,
          metadata: {
            postType: selectedType,
            postCategory: selectedCategory,
            topic: topic,
            idea: selectedIdea !== null ? generatedIdeas[selectedIdea] : null,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save draft");
      }

      clearDraft();
      showToast("Draft saved successfully!", "success");
      setTimeout(() => router.push("/dashboard/posts"), 1500);
    } catch (error) {
showToast(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  // Publish to LinkedIn
  const handlePublish = async () => {
    if (!currentPost.trim()) {
      showToast("No post content to publish");
      return;
    }

    setIsPublishing(true);
    try {
      const isVideo = attachedImage?.mimeType?.startsWith("video/");

      // Videos are NOT stored in the DB media table - they live in R2 only
      // as a transient pipe and get deleted right after LinkedIn ingests them.
      // We mark the post with postType=video for the badge and pass the R2 URL
      // inline to /api/linkedin/post below.
      const hasR2Media = attachedImage?.storageUrl && attachedImage?.storageKey && !isVideo;
      const mediaInfo = hasR2Media ? {
        storageUrl: attachedImage.storageUrl,
        storageKey: attachedImage.storageKey,
        mimeType: attachedImage.mimeType,
      } : undefined;
      const mediaData = (!hasR2Media && !isVideo && attachedImage?.base64) ? {
        base64: attachedImage.base64,
        mimeType: attachedImage.mimeType,
      } : undefined;

      // Create post record
      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentPost,
          status: "draft",
          postType: isVideo ? "video" : (attachedImage ? "image" : "text"),
          mediaInfo,
          mediaData,
          firstComment: firstComment || null,
        }),
      });

      if (!saveResponse.ok) {
        const err = await saveResponse.json().catch(() => null);
        throw new Error(err?.error || "Failed to save post before publishing");
      }

      const { post } = await saveResponse.json();

      // Publish to LinkedIn. Images/PDFs are looked up from the media table
      // by postId; videos are passed inline because they aren't stored.
      const publishResponse = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          text: currentPost,
          videoUrl: isVideo ? attachedImage?.storageUrl : undefined,
          videoMimeType: isVideo ? attachedImage?.mimeType : undefined,
          videoStorageKey: isVideo ? attachedImage?.storageKey : undefined,
        }),
      });

      if (!publishResponse.ok) {
        const error = await publishResponse.json().catch(() => null);
        throw new Error(error?.error || "Failed to publish to LinkedIn");
      }

      clearDraft();
      showToast("Post published to LinkedIn!", "success");
      setTimeout(() => router.push("/dashboard/posts"), 1500);
    } catch (error) {
showToast(error instanceof Error ? error.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  // Schedule post
  const handleSchedulePost = async () => {
    if (!currentPost.trim()) {
      showToast("No post content to schedule");
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      showToast("Please select both date and time");
      return;
    }

    // Convert the selected date/time to UTC using user's configured timezone
    // resolveTimezone handles "auto" by returning browser timezone
    const effectiveTimezone = resolveTimezone(userTimezone);
    const scheduledAtISO = localToUTC(scheduleDate, scheduleTime, effectiveTimezone);

    const scheduledAt = new Date(scheduledAtISO);
    if (scheduledAt <= new Date()) {
      showToast("Please select a future date and time");
      return;
    }

    setIsSaving(true);
    try {
      const hasR2Media = attachedImage?.storageUrl && attachedImage?.storageKey;
      const mediaInfo = hasR2Media ? {
        storageUrl: attachedImage.storageUrl,
        storageKey: attachedImage.storageKey,
        mimeType: attachedImage.mimeType,
      } : undefined;
      const mediaData = (!hasR2Media && attachedImage?.base64) ? {
        base64: attachedImage.base64,
        mimeType: attachedImage.mimeType,
      } : undefined;

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentPost,
          status: "scheduled",
          scheduledAt: scheduledAtISO,
          postType: attachedImage ? "image" : "text",
          mediaInfo,
          mediaData,
          firstComment: firstComment || null,
          metadata: {
            postType: selectedType,
            postCategory: selectedCategory,
            topic: topic,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to schedule post");
      }

      clearDraft();
      showToast(`Post scheduled for ${scheduledAt.toLocaleString()}`, "success");
      setTimeout(() => router.push("/dashboard/calendar"), 1500);
    } catch (error) {
showToast(error instanceof Error ? error.message : "Failed to schedule post");
    } finally {
      setIsSaving(false);
      setShowScheduler(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      showToast("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    // Validate file size (max 5MB - LinkedIn limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB (LinkedIn limit)");
      return;
    }

    // Convert to base64
    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setAttachedImage({
        base64,
        mimeType: file.type,
        preview: previewUrl,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Show loading state while fetching settings
  if (isLoadingSettings) {
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

  const userEmail = session?.user?.email || "";

  // No API key configured - show setup prompt
  if (!hasApiKey) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              Post Generator
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Create viral LinkedIn posts with AI in seconds
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VideoModal videoId="LaFbdueDLBg" />
            <Link href="/docs/content-creation/post-generator" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              Help?
            </Link>
          </div>
        </div>

        {/* API Key Required Card */}
        <Card className="border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/10">
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <Wand2 className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI API Key Required</h3>
              <p className="text-muted-foreground mb-6">
                To generate LinkedIn posts with AI, you need to configure your AI API key.
                LinkedGrow uses your own API key (BYOK) for unlimited generations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/dashboard/settings/ai-api">
                  <Button className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Configure API Key
                  </Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-6">
                We support OpenAI, Anthropic, Google AI, Grok (xAI), Perplexity, and Kimi. Your key is encrypted and stored securely.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview of the workflow */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { num: 1, label: "Type" },
                { num: 2, label: "Topic" },
                { num: 3, label: "Ideas" },
                { num: 4, label: "Post" },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-muted-foreground">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-gray-200 dark:bg-gray-700">
                      {s.num}
                    </span>
                    <span>{s.label}</span>
                  </div>
                  {i < 3 && (
                    <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
      {/* Limit Reached Overlay */}
      {showLimitOverlay && <LimitReachedOverlay />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
            Post Generator
          </h1>
          <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
            Create viral LinkedIn posts with AI in seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <VideoModal videoId="LaFbdueDLBg" />
          <Link href="/docs/content-creation/post-generator" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
            Help?
          </Link>
        </div>
      </div>

      {/* Usage Limit Banner */}
      <UsageLimitBanner
        postsUsed={postsUsedThisMonth}
        postsLimit={postsLimit}
        userPlan={userPlan}
      />

      {/* Progress Steps */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { num: 1, label: "Type" },
          { num: 2, label: "Topic" },
          { num: 3, label: "Ideas" },
          { num: 4, label: "Post" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                step >= s.num
                  ? "bg-linkedin text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  step >= s.num
                    ? "bg-white/20"
                    : "bg-gray-200 dark:bg-gray-700"
                )}
              >
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < 3 && (
              <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Post Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>What type of post do you want to create?</CardTitle>
            <CardDescription>
              Choose the style that fits your message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {postTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    selectedType === type.id
                      ? "border-linkedin bg-linkedin/5"
                      : "border-border hover:border-linkedin/50"
                  )}
                >
                  <p className="font-semibold">{type.label}</p>
                  <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium mb-3">Post Category (Optional)</p>
              <div className="flex flex-wrap gap-2">
                {postCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-colors",
                      selectedCategory === cat.id
                        ? "bg-linkedin text-white"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="linkedin"
              className="mt-6 w-full sm:w-auto"
              disabled={!selectedType}
              onClick={() => setStep(2)}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Enter Topic */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>What do you want to write about?</CardTitle>
            <CardDescription>
              Enter a topic, idea, or leave blank for AI suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., Lessons learned from launching my first product, Productivity tips for remote workers, Why I quit my 9-5 job..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-30"
            />

            <div className="flex flex-wrap gap-2 mt-4">
              <p className="w-full text-sm text-muted-foreground mb-1">
                Quick suggestions:
              </p>
              {[
                "Career growth tips",
                "Startup lessons",
                "AI tools review",
                "Leadership insights",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setTopic(suggestion)}
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="linkedin"
                onClick={handleGenerateIdeas}
                disabled={isGeneratingIdeas}
                className="flex-1 sm:flex-none"
              >
                {isGeneratingIdeas ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate 5 Ideas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Idea */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Pick Your Favorite Idea
            </CardTitle>
            <CardDescription>
              Select one to generate a full post, or regenerate for new ideas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedIdeas.map((idea, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIdea(index)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    selectedIdea === index
                      ? "border-linkedin bg-linkedin/5"
                      : "border-border hover:border-linkedin/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                        selectedIdea === index
                          ? "bg-linkedin text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className="font-medium">{idea}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateIdeas}
                disabled={isGeneratingIdeas || isGeneratingPost}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isGeneratingIdeas && "animate-spin")} />
                Regenerate
              </Button>
              <Button
                variant="linkedin"
                onClick={handleGeneratePost}
                disabled={selectedIdea === null || isGeneratingIdeas || isGeneratingPost}
                className="flex-1 sm:flex-none"
              >
                {isGeneratingPost ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Post...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Post
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Generated Post with Full AI Editing */}
      {step === 4 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Post Preview/Editor - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-linkedin" />
                    {isEditing ? "Edit Your Post" : "Generated Post"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={handleCancelEdits}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={handleSaveEdits} className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleStartEditing}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <PostEditor
                    value={editedPost}
                    onChange={setEditedPost}
                    placeholder="Edit your post..."
                    minHeight="min-h-100"
                    showToolbar={true}
                    showImageButton={true}
                    showVideoButton={true}
                    showCarouselButton={hasCarouselAccess}
                    attachedImage={attachedImage}
                    onImageChange={setAttachedImage}
                    onError={showToast}
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-border min-h-75">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {generatedPost}
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>{currentPost.length} / 3000 characters</span>
                    <span className={cn(
                      "font-medium",
                      calculateScore(currentPost) >= 80 ? "text-green-600" :
                      calculateScore(currentPost) >= 60 ? "text-yellow-600" :
                      calculateScore(currentPost) === 0 ? "text-gray-400" : "text-red-600"
                    )}>
                      Algorithm Score: {calculateScore(currentPost)}/100
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* First Comment */}
            {currentPost.trim() && (
              <FirstComment
                value={firstComment}
                onChange={setFirstComment}
                postContent={currentPost}
                onError={showToast}
                hasAccess={canAccessFeature(userPlan, "firstComment")}
              />
            )}

            {/* AI Quick Actions */}
            <Card className="border-linkedin/20 bg-linkedin/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-linkedin" />
                  AI Quick Actions
                </CardTitle>
                <CardDescription>
                  Click to instantly modify your post with AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {aiQuickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAIAction(action.id)}
                        disabled={isApplyingAI}
                        className="bg-white dark:bg-gray-900 hover:bg-linkedin/10 hover:border-linkedin/50"
                      >
                        <Icon className="w-3.5 h-3.5 mr-1.5" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>

                {/* Custom AI Instruction */}
                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className="text-sm text-linkedin hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {showAIPanel ? "Hide" : "Custom AI instruction..."}
                  </button>

                  {showAIPanel && (
                    <div className="mt-3 space-y-3">
                      <Textarea
                        value={aiInstruction}
                        onChange={(e) => setAIInstruction(e.target.value)}
                        placeholder="Tell AI exactly what to change... e.g., 'Add a personal story at the beginning', 'Make it more controversial', 'Add specific numbers and stats'"
                        className="min-h-20"
                      />
                      <Button
                        onClick={handleApplyAIInstruction}
                        disabled={!aiInstruction.trim() || isApplyingAI}
                        className="w-full"
                      >
                        {isApplyingAI ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Apply AI Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attached Image Preview */}
            {attachedImage?.preview && (
              <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Image className="w-4 h-4 text-green-600" />
                      Attached Image
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachedImage(null)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl overflow-hidden border border-border">
                    <img
                      src={attachedImage.preview}
                      alt="Attached image"
                      className="w-full h-auto max-h-50 object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image Generator Modal */}
            <ImageGeneratorModal
              open={showImageModal}
              onOpenChange={setShowImageModal}
              postContent={currentPost}
              postTopic={topic}
              userPlan={userPlan}
              hasImageApiKey={hasImageApiKey}
              hasTextApiKey={hasApiKey}
              userEmail={userEmail}
              onImageGenerated={(imageData) => {
                setAttachedImage(imageData);
              }}
            />
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            {/* Primary Actions */}
            <Card>
              <CardHeader className="pb-2 bg-muted/30 rounded-t-xl">
                <CardTitle className="text-base">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Video notice - videos cannot be stored, must be published immediately */}
                {isVideoMedia(attachedImage) && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
                    Videos are too large to be stored by LinkedGrow. Posts with videos must be published immediately.
                  </div>
                )}
                <Button
                  variant="linkedin"
                  className="w-full"
                  size="lg"
                  onClick={handlePublish}
                  disabled={isPublishing || !currentPost.trim()}
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isPublishing ? "Publishing..." : "Publish to LinkedIn"}
                </Button>
                {canAccessFeature(userPlan, "scheduling") && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowScheduler(!showScheduler)}
                      disabled={isVideoMedia(attachedImage)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule for Later
                    </Button>
                    {showScheduler && (
                      <div className="p-3 rounded-lg bg-accent/50 space-y-2">
                        <Input
                          type="date"
                          className="w-full"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                        <Input
                          type="time"
                          className="w-full"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={handleSchedulePost}
                          disabled={isSaving || !scheduleDate || !scheduleTime}
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Calendar className="w-4 h-4 mr-2" />
                          )}
                          {isSaving ? "Scheduling..." : "Schedule Post"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving || !currentPost.trim() || isVideoMedia(attachedImage)}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? "Saving..." : "Save as Draft"}
                </Button>
              </CardContent>
            </Card>

            {/* Media & Enhancements */}
            <Card>
              <CardHeader className="pb-2 bg-muted/30 rounded-t-xl">
                <CardTitle className="text-base">Add Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* AI Image Generation - only show if has API key */}
                {hasImageApiKey && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (!currentPost.trim()) {
                        setToast({ message: "Add some text to your post first before generating an image.", type: "error" });
                        return;
                      }
                      setShowImageModal(true);
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                    Generate AI Image
                    {!hasImageAccess && (
                      <span className="ml-auto text-xs text-amber-600">Pro</span>
                    )}
                  </Button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowLinkInput(!showLinkInput)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Add Link Preview
                </Button>
                {showLinkInput && (
                  <div className="p-3 rounded-lg bg-accent/50 space-y-2">
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={linkPreviewUrl}
                      onChange={(e) => setLinkPreviewUrl(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a URL to include in your post. LinkedIn will automatically generate a preview.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Regenerate Options */}
            <Card>
              <CardHeader className="pb-2 bg-muted/30 rounded-t-xl">
                <CardTitle className="text-base">Regenerate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" onClick={() => setStep(3)}>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Pick Different Idea
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGeneratePost}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Post
                </Button>
                <Button variant="outline" className="w-full">
                  <Wand2 className="w-4 h-4 mr-2" />
                  3 More Variations
                </Button>
              </CardContent>
            </Card>

            {/* Algorithm Tips */}
            {(() => {
              const post = currentPost;
              const lines = post.split("\n").filter((l) => l.trim());
              const firstLine = lines[0] || "";

              // Check hook strength (first line 10-100 chars)
              const hasStrongHook = firstLine.length >= 10 && firstLine.length <= 100;

              // Check formatting (bullets, line breaks, special chars)
              const hasBullets = post.includes("•") || post.includes("-") || post.includes("→");
              const hasLineBreaks = (post.match(/\n\n/g) || []).length >= 2;
              const hasFormatting = hasBullets || hasLineBreaks;

              // Check for question at end
              const lastLines = post.trim().split("\n").slice(-3).join(" ");
              const endsWithQuestion = lastLines.includes("?");

              // Check optimal length
              const optimalLength = post.length >= 800 && post.length <= 1500;

              const checks = [
                { label: "Strong hook in first 2 lines", passed: hasStrongHook },
                { label: "Good use of formatting", passed: hasFormatting },
                { label: "Ends with question (engagement)", passed: endsWithQuestion },
                { label: `Optimal length (800-1500 chars)`, passed: optimalLength },
              ];

              const passedCount = checks.filter(c => c.passed).length;
              const allPassed = passedCount === checks.length;

              return (
                <Card className={cn(
                  allPassed
                    ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                    : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                )}>
                  <CardContent className="p-4">
                    <h4 className={cn(
                      "font-medium mb-2 flex items-center gap-2",
                      allPassed ? "text-green-800 dark:text-green-200" : "text-amber-800 dark:text-amber-200"
                    )}>
                      <Zap className="w-4 h-4" />
                      Optimization Tips ({passedCount}/4)
                    </h4>
                    <ul className="text-sm space-y-1.5">
                      {checks.map((check, i) => (
                        <li key={i} className={check.passed ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}>
                          • {check.label} {check.passed ? "✓" : "✗"}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={cn(
            "px-6 py-3 rounded-lg shadow-lg flex items-center gap-3",
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          )}>
            {toast.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
