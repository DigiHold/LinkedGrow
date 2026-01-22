"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquareText,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Check,
  Copy,
  Wand2,
  Image,
  Send,
  Calendar,
  Save,
  Pencil,
  X,
  Key,
  Settings,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId, canAccessFeature } from "@/lib/plans";
import { ImageGeneratorModal } from "@/components/dashboard/image-generator-modal";
import Link from "next/link";

// Reddit icon component (same as sidebar)
function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -40 512 512" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
      <path d="m327.832031 316.355469c-17.761719 13.488281-43.945312 21.226562-71.832031 21.226562s-54.070312-7.734375-71.832031-21.226562c-6.597657-5.007813-16.003907-3.722657-21.015625 2.875-5.011719 6.597656-3.722656 16.007812 2.875 21.019531 22.871094 17.367188 55.664062 27.332031 89.972656 27.332031s67.101562-9.964843 89.972656-27.332031c6.597656-5.011719 7.886719-14.421875 2.875-21.019531-5.007812-6.59375-14.417968-7.878907-21.015625-2.875zm0 0"></path>
      <path d="m512 207.804688c0-34.851563-28.351562-63.199219-63.195312-63.199219-13.597657 0-26.691407 4.375-37.449219 12.300781-36.09375-24.6875-83.078125-40.0625-132.953125-43.632812l34.433594-80.335938 73.152343 20.128906c2.925781 23.199219 22.765625 41.207032 46.746094 41.207032 25.988281 0 47.132813-21.144532 47.132813-47.136719 0-25.992188-21.144532-47.136719-47.132813-47.136719-17.417969 0-32.644531 9.5-40.804687 23.585938l-83.75-23.046876c-7.222657-1.980468-14.8125 1.664063-17.769532 8.554688l-44.371094 103.539062c-54.472656 1.726563-106.316406 17.542969-145.402343 44.277344-10.761719-7.925781-23.847657-12.308594-37.433594-12.308594-34.851563.003907-63.203125 28.351563-63.203125 63.203126 0 23.386718 12.644531 44.269531 32.484375 55.226562-.234375 3.011719-.351563 6.027344-.351563 9.035156 0 43.695313 24.019532 84.386719 67.636719 114.582032 41.933594 29.03125 97.417969 45.023437 156.230469 45.023437 58.808594 0 114.292969-15.988281 156.226562-45.023437 43.617188-30.195313 67.640626-70.886719 67.640626-114.582032 0-2.992187-.117188-5.992187-.351563-8.992187 19.839844-10.960938 32.484375-31.855469 32.484375-55.269531zm-79.269531-177.804688c9.449219 0 17.136719 7.6875 17.136719 17.136719s-7.6875 17.136719-17.136719 17.136719c-9.445313 0-17.132813-7.6875-17.132813-17.136719.003906-9.449219 7.6875-17.136719 17.132813-17.136719zm26.003906 209.492188c-7.226563 2.265624-11.632813 9.554687-10.277344 17 .9375 5.144531 1.410157 10.386718 1.410157 15.574218 0 33.558594-19.433594 65.492188-54.714844 89.917969-36.964844 25.589844-86.382813 39.6875-139.152344 39.6875s-102.1875-14.097656-139.152344-39.6875c-35.28125-24.425781-54.714844-56.359375-54.714844-89.917969 0-5.210937.476563-10.460937 1.414063-15.601562 1.359375-7.449219-3.046875-14.746094-10.273437-17.011719-13.917969-4.359375-23.273438-17.078125-23.273438-31.648437 0-18.308594 14.894531-33.199219 33.210938-33.199219 9.597656 0 18.730468 4.179687 25.058593 11.46875 5.234375 6.03125 14.273438 6.90625 20.566407 1.988281 37.050781-28.960938 90.65625-45.578125 147.09375-45.589844h.0625.085937c56.425781.015625 110.027344 16.625 147.078125 45.582032 6.289062 4.917968 15.332031 4.042968 20.566406-1.988282 6.320313-7.285156 15.460938-11.460937 25.078125-11.460937 18.304688 0 33.199219 14.890625 33.199219 33.199219 0 14.597656-9.351562 27.332031-23.265625 31.6875zm0 0"></path>
      <path d="m222.800781 239.9375c0-25.988281-21.144531-47.132812-47.136719-47.132812-25.988281 0-47.132812 21.144531-47.132812 47.132812s21.144531 47.132812 47.132812 47.132812c25.992188 0 47.136719-21.144531 47.136719-47.132812zm-64.269531 0c0-9.449219 7.6875-17.132812 17.132812-17.132812 9.449219 0 17.136719 7.683593 17.136719 17.132812 0 9.445312-7.6875 17.132812-17.136719 17.132812-9.445312 0-17.132812-7.6875-17.132812-17.132812zm0 0"></path>
      <path d="m336.335938 192.804688c-25.992188 0-47.136719 21.144531-47.136719 47.132812s21.144531 47.132812 47.136719 47.132812c25.988281 0 47.132812-21.144531 47.132812-47.132812 0-25.992188-21.144531-47.132812-47.132812-47.132812zm0 64.265624c-9.449219 0-17.136719-7.6875-17.136719-17.132812 0-9.449219 7.6875-17.132812 17.136719-17.132812 9.445312 0 17.132812 7.683593 17.132812 17.132812 0 9.445312-7.6875 17.132812-17.132812 17.132812zm0 0"></path>
    </svg>
  );
}

const steps = [
  { num: 1, label: "Paste URL" },
  { num: 2, label: "Select Hook" },
  { num: 3, label: "Choose Post" },
  { num: 4, label: "Edit & Publish" },
];

interface SettingsResponse {
  hasApiKey: boolean;
  aiProvider: string | null;
}

interface RedditPostData {
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  num_comments: number;
}

// Fetch Reddit post data via backend API to avoid CORS issues
async function fetchRedditPost(url: string): Promise<RedditPostData> {
  const response = await fetch("/api/reddit/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch Reddit post. Please try again.");
  }

  const data = await response.json();

  return {
    title: data.title || "",
    selftext: data.selftext || "",
    subreddit: data.subreddit || "",
    score: data.score || 0,
    num_comments: data.num_comments || 0,
  };
}

function RedditImportContent() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState<number | null>(null);
  const [posts, setPosts] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redditPost, setRedditPost] = useState<RedditPostData | null>(null);

  // API key state
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [hasImageApiKey, setHasImageApiKey] = useState(false);

  // Step 4: Editing and Image Generation State
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string } | null>(null);

  // Save/Publish/Schedule State
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Router and refs
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check if user has access to image generation
  const hasImageAccess = canAccessFeature(userPlan, "imageGeneration");

  // Get current post content
  const getCurrentPost = () => {
    if (selectedPost === null) return "";
    return isEditing ? editedPost : posts[selectedPost];
  };

  // Persist state to localStorage
  const STORAGE_KEY = "linkedgrow_reddit_draft";

  // Save state to localStorage when it changes
  useEffect(() => {
    // Only save if we have meaningful data (step > 1 or have content)
    if (step > 1 || hooks.length > 0 || posts.length > 0) {
      const stateToSave = {
        step,
        url,
        hooks,
        selectedHook,
        posts,
        selectedPost,
        redditPost,
        editedPost,
        attachedImage,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [step, url, hooks, selectedHook, posts, selectedPost, redditPost, editedPost, attachedImage]);

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
          if (state.url) setUrl(state.url);
          if (state.hooks?.length > 0) setHooks(state.hooks);
          if (state.selectedHook !== null && state.selectedHook !== undefined) setSelectedHook(state.selectedHook);
          if (state.posts?.length > 0) setPosts(state.posts);
          if (state.selectedPost !== null && state.selectedPost !== undefined) setSelectedPost(state.selectedPost);
          if (state.redditPost) setRedditPost(state.redditPost);
          if (state.editedPost) setEditedPost(state.editedPost);
          if (state.attachedImage) setAttachedImage(state.attachedImage);
        } else {
          // Clear stale data
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to restore reddit import state:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Clear draft after successful publish or save
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Check if user has API key configured
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data: SettingsResponse = await response.json();
          setHasApiKey(data.hasApiKey);
          // For now, we use the same API key for images
          // TODO: Add separate image API key check when implemented
          setHasImageApiKey(data.hasApiKey);
        } else {
          setHasApiKey(false);
        }
      } catch {
        setHasApiKey(false);
      } finally {
        setIsCheckingApiKey(false);
      }
    };

    checkApiKey();
  }, []);

  const handleFetchReddit = async () => {
    if (!url.includes("reddit.com") || !hasApiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch Reddit data via server-side API
      const postData = await fetchRedditPost(url);
      setRedditPost(postData);

      // Step 2: Send to our API to generate hooks with AI
      const response = await fetch("/api/reddit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postData.title,
          content: postData.selftext,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze Reddit post");
      }

      const data = await response.json();
      setHooks(data.hooks || []);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Reddit post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePosts = async () => {
    if (selectedHook === null || !hasApiKey || !redditPost) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reddit/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hook: hooks[selectedHook],
          title: redditPost.title,
          content: redditPost.selftext,
          count: 3,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate posts");
      }

      const data = await response.json();
      setPosts(data.posts || []);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (selectedPost !== null) {
      const textToCopy = isEditing ? editedPost : posts[selectedPost];
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Save as draft
  const handleSaveAsDraft = async () => {
    const currentPost = getCurrentPost();
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
            source: "reddit",
            redditUrl: url,
            redditTitle: redditPost?.title,
            hook: selectedHook !== null ? hooks[selectedHook] : null,
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
    const currentPost = getCurrentPost();
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
          metadata: {
            source: "reddit",
            redditUrl: url,
            redditTitle: redditPost?.title,
          },
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
    const currentPost = getCurrentPost();
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
            source: "reddit",
            redditUrl: url,
            redditTitle: redditPost?.title,
            hook: selectedHook !== null ? hooks[selectedHook] : null,
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

  // Loading state while checking API key
  if (isCheckingApiKey) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No API key configured - show setup prompt
  if (!hasApiKey) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <RedditIcon className="w-5 h-5 text-white" />
            </div>
            Reddit Import
          </h1>
          <p className="text-muted-foreground mt-1">
            Transform viral Reddit posts into LinkedIn content
          </p>
        </div>

        {/* API Key Required Card */}
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center">
                <Key className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI API Key Required</h3>
              <p className="text-muted-foreground mb-6">
                To analyze Reddit posts and generate LinkedIn content, you need to configure your AI API key in settings.
                LinkedGrow uses your own API key (BYOK) for unlimited generations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard/settings/ai-api">
                  <Button className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure API Key
                  </Button>
                </Link>
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
              {steps.map((s, i) => (
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
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <RedditIcon className="w-5 h-5 text-white" />
            </div>
          Reddit Import
        </h1>
        <p className="text-muted-foreground mt-1">
          Transform viral Reddit posts into LinkedIn content
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                step >= s.num
                  ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white"
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

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Paste URL */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Paste a Reddit URL</CardTitle>
            <CardDescription>
              Find a viral post on Reddit and paste the URL here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="https://reddit.com/r/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleFetchReddit}
                disabled={!url.includes("reddit.com") || isLoading}
                className="px-6 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Hooks
                  </>
                )}
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Reddit content is fetched directly in your browser for privacy - no data passes through our servers.
            </p>

            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium text-orange-800 dark:text-orange-200">
                Tips for finding viral Reddit posts:
              </h4>
              <ul className="mt-2 text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <li>- Check r/technology, r/startups, r/entrepreneur</li>
                <li>- Sort by &quot;Top&quot; posts of the week/month</li>
                <li>- Look for posts with high engagement</li>
                <li>- Personal stories often convert well</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Hook */}
      {step === 2 && hooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-500" />
              Choose Your Hook
            </CardTitle>
            <CardDescription>
              Select the hook that will grab attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hooks.map((hook, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedHook(index)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    selectedHook === index
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10"
                      : "border-border hover:border-cyan-300"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                        selectedHook === index
                          ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className="font-medium">{hook}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleGeneratePosts}
                disabled={selectedHook === null || isLoading}
                className="flex-1 sm:flex-none bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate 3 Posts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Choose Post */}
      {step === 3 && posts.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Post</CardTitle>
              <CardDescription>
                Select the version that resonates with your audience
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {posts.map((post, index) => (
              <Card
                key={index}
                className={cn(
                  "cursor-pointer transition-all hover:-translate-y-1",
                  selectedPost === index
                    ? "border-cyan-500 shadow-lg"
                    : "hover:border-cyan-300"
                )}
                onClick={() => setSelectedPost(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                      Version {index + 1}
                    </span>
                    {selectedPost === index && (
                      <Check className="w-5 h-5 text-cyan-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-[12] whitespace-pre-wrap">
                    {post}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              disabled={selectedPost === null}
              onClick={() => setStep(4)}
              className="flex-1 sm:flex-none bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              Continue to Edit
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Edit & Publish with Image Generation */}
      {step === 4 && selectedPost !== null && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Post Content - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {isEditing ? "Edit Your Post" : "Final Post"}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedPost("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            // Save the edited version
                            const newPosts = [...posts];
                            newPosts[selectedPost] = editedPost;
                            setPosts(newPosts);
                            setIsEditing(false);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditedPost(posts[selectedPost]);
                          setIsEditing(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedPost}
                    onChange={(e) => setEditedPost(e.target.value)}
                    className="min-h-[400px] text-base leading-relaxed"
                    placeholder="Edit your post..."
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-border min-h-[300px]">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {posts[selectedPost]}
                    </div>
                  </div>
                )}

                {/* Attached Image Preview */}
                {attachedImage && (
                  <div className="mt-4 relative">
                    <div className="rounded-xl overflow-hidden border border-border bg-accent/30">
                      <img
                        src={`data:${attachedImage.mimeType};base64,${attachedImage.base64}`}
                        alt="Attached image"
                        className="w-full h-auto max-h-[200px] object-contain"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setAttachedImage(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>
                    {(isEditing ? editedPost : posts[selectedPost]).length} / 3000 characters
                  </span>
                  {attachedImage && (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      Image attached
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Edit Options */}
            <Card className="border-cyan-200 bg-cyan-50/50 dark:border-cyan-800 dark:bg-cyan-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-cyan-500" />
                  AI Quick Edit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Make Shorter", "Add Emojis", "Stronger Hook", "Add CTA", "More Casual"].map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="bg-white dark:bg-gray-900 hover:bg-cyan-100 hover:border-cyan-300"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            {/* Publish Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  size="lg"
                  onClick={handlePublish}
                  disabled={isPublishing || !getCurrentPost().trim()}
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isPublishing ? "Publishing..." : "Publish to LinkedIn"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowScheduler(!showScheduler)}
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
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving || !getCurrentPost().trim()}
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

            {/* Add Media */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Add Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* AI Image Generation - only show if has API key */}
                {hasImageApiKey && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowImageModal(true)}
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                    Generate AI Image
                    {!hasImageAccess && (
                      <span className="ml-auto text-xs text-amber-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Pro
                      </span>
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
                  className="w-full justify-start"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full" onClick={() => setStep(3)}>
                  Back to Post Selection
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                  Start Over
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Pro Tips
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1.5">
                  <li>- Posts with images get 2x more engagement</li>
                  <li>- Best time to post: 8-10 AM or 5-6 PM</li>
                  <li>- Add a question at the end for comments</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Image Generator Modal */}
          <ImageGeneratorModal
            open={showImageModal}
            onOpenChange={setShowImageModal}
            postContent={posts[selectedPost]}
            postTopic={hooks[selectedHook ?? 0]}
            userPlan={userPlan}
            hasImageApiKey={hasImageApiKey}
            onImageGenerated={(imageData) => {
              setAttachedImage(imageData);
            }}
          />
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

export default function RedditImportPage() {
  return (
    <FeatureGate feature="redditIdeas">
      <RedditImportContent />
    </FeatureGate>
  );
}
