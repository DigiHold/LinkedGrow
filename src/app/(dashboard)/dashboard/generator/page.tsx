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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanId, PLANS, isWithinLimit, canAccessFeature } from "@/lib/plans";
import { Progress } from "@/components/ui/progress";
import { ImageGeneratorModal } from "@/components/dashboard/image-generator-modal";
import { PostEditor } from "@/components/dashboard/post-editor";
import { redirectToCheckout } from "@/lib/checkout";

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
  userEmail,
}: {
  postsUsed: number;
  postsLimit: number;
  userPlan: PlanId;
  userEmail: string;
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
            <Button
              size="sm"
              onClick={() => redirectToCheckout("starter", userEmail)}
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Limit Reached Overlay Component
function LimitReachedOverlay({ userEmail }: { userEmail: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center mb-6 shadow-xl">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Monthly Limit Reached</h2>
        <p className="text-muted-foreground mb-2">
          You&apos;ve used all <span className="font-semibold">3 free posts</span> for this month.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Upgrade to Starter or higher for <span className="font-semibold text-foreground">unlimited posts</span> with your own AI API key.
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

        <Button
          variant="linkedin"
          size="lg"
          className="shadow-lg w-full text-white"
          onClick={() => redirectToCheckout("starter", userEmail)}
        >
          <Crown className="w-5 h-5 mr-2" />
          Upgrade to Starter - $19/mo
        </Button>
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

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
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
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          const posts = postsData.posts || [];

          // Count posts created this month
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonthPosts = posts.filter((post: { createdAt: string }) => {
            const createdAt = new Date(post.createdAt);
            return createdAt >= startOfMonth;
          });
          setPostsUsedThisMonth(thisMonthPosts.length);
        }
      } catch (error) {
        console.error("Failed to load generator data:", error);
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
      console.error("Failed to restore generator state:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Clear draft after successful publish or save
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleGenerateIdeas = async () => {
    setIsGenerating(true);
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate ideas");
      }

      const data = await response.json();
      setGeneratedIdeas(data.ideas || []);
      setStep(3);
    } catch (error) {
      console.error("Failed to generate ideas:", error);
      showToast(error instanceof Error ? error.message : "Failed to generate ideas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePost = async () => {
    if (selectedIdea === null) return;

    setIsGenerating(true);
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate post");
      }

      const data = await response.json();
      setGeneratedPost(data.post || "");
      setEditedPost("");
      setStep(4);
    } catch (error) {
      console.error("Failed to generate post:", error);
      showToast(error instanceof Error ? error.message : "Failed to generate post");
    } finally {
      setIsGenerating(false);
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
      // Map action IDs to AI instructions
      const actionInstructions: Record<string, string> = {
        emojis: "Add relevant emojis throughout the post to make it more engaging. Use 3-5 emojis strategically placed.",
        shorter: "Make this post more concise. Reduce the length by about 30% while keeping the main message and impact.",
        hook: "Rewrite the first two lines to create a stronger, more attention-grabbing hook that makes people want to read more.",
        cta: "Add or improve the call-to-action at the end to encourage more engagement (likes, comments, shares).",
        professional: "Rewrite this post to sound more professional and polished while maintaining authenticity.",
        casual: "Rewrite this post to sound more casual and conversational while staying professional.",
      };

      const instruction = actionInstructions[actionId] || `Apply the following style: ${actionId}`;

      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
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
      console.error("AI quick action error:", error);
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
      console.error("AI instruction error:", error);
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
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentPost,
          status: "draft",
          postType: attachedImage ? "image" : "text",
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
      console.error("Save draft error:", error);
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
      // First save the post
      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentPost,
          status: "draft",
          postType: attachedImage ? "image" : "text",
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save post before publishing");
      }

      const { post } = await saveResponse.json();

      // Then publish to LinkedIn
      const publishResponse = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          content: currentPost,
          imageBase64: attachedImage?.base64,
          imageMimeType: attachedImage?.mimeType,
        }),
      });

      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        throw new Error(error.error || "Failed to publish to LinkedIn");
      }

      clearDraft();
      showToast("Post published to LinkedIn!", "success");
      setTimeout(() => router.push("/dashboard/posts"), 1500);
    } catch (error) {
      console.error("Publish error:", error);
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

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledAt <= new Date()) {
      showToast("Please select a future date and time");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentPost,
          status: "scheduled",
          scheduledAt: scheduledAt.toISOString(),
          postType: attachedImage ? "image" : "text",
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
      console.error("Schedule error:", error);
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
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setAttachedImage({
        base64,
        mimeType: file.type,
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading generator...</p>
        </div>
      </div>
    );
  }

  const userEmail = session?.user?.email || "";

  // No API key configured - show setup prompt
  if (!hasApiKey) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Post Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create viral LinkedIn posts with AI in seconds
          </p>
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
                  <Button className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Configure API Key
                  </Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-6">
                We support OpenAI, Anthropic, Google AI, and Groq. Your key is encrypted and stored securely.
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Limit Reached Overlay */}
      {isLimitReached && <LimitReachedOverlay userEmail={userEmail} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          Post Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Create viral LinkedIn posts with AI in seconds
        </p>
      </div>

      {/* Usage Limit Banner */}
      <UsageLimitBanner
        postsUsed={postsUsedThisMonth}
        postsLimit={postsLimit}
        userPlan={userPlan}
        userEmail={userEmail}
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
                  <p className="text-sm text-muted-foreground mt-1">
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
                disabled={isGenerating}
                className="flex-1 sm:flex-none"
              >
                {isGenerating ? (
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
                disabled={isGenerating}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                Regenerate
              </Button>
              <Button
                variant="linkedin"
                onClick={handleGeneratePost}
                disabled={selectedIdea === null || isGenerating}
                className="flex-1 sm:flex-none"
              >
                {isGenerating ? (
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
            {attachedImage && (
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
                      src={`data:${attachedImage.mimeType};base64,${attachedImage.base64}`}
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
                <Button variant="outline" className="w-full" onClick={() => setShowScheduler(!showScheduler)}>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving || !currentPost.trim()}
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
                    onClick={() => setShowImageModal(true)}
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
            <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Optimization Tips
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1.5">
                  <li>• Strong hook in first 2 lines ✓</li>
                  <li>• Good use of formatting ✓</li>
                  <li>• Ends with question (engagement) ✓</li>
                  <li>• Optimal length (800-1500 chars) ✓</li>
                </ul>
              </CardContent>
            </Card>
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
