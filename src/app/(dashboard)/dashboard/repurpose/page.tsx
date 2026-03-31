"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostEditor, isVideoMedia } from "@/components/dashboard/post-editor";
import { FirstComment } from "@/components/dashboard/first-comment";
import {
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
  Repeat,
  Youtube,
  FileText,
  Globe,
  Info,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId, canAccessFeature } from "@/lib/plans";
import { ImageGeneratorModal } from "@/components/dashboard/image-generator-modal";
import { localToUTC, resolveTimezone } from "@/lib/timezone";
import Link from "next/link";

// Reddit icon component
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

type SourceType = "reddit" | "youtube" | "webpage" | "blog" | null;

const BLOG_DOMAINS = ["medium.com", "substack.com", "dev.to", "hashnode.dev", "wordpress.com", "ghost.io", "beehiiv.com", "mirror.xyz"];
const BLOG_PATH_INDICATORS = ["/blog/", "/post/", "/article/", "/posts/", "/articles/", "/p/", "/note/"];

function detectSourceType(url: string): SourceType {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");
    if (hostname.includes("reddit.com") || hostname.includes("old.reddit.com")) return "reddit";
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "youtube";

    // Check for blog domains
    for (const domain of BLOG_DOMAINS) {
      if (hostname.includes(domain)) return "blog";
    }
    // Check for blog path indicators
    const lowerPath = parsed.pathname.toLowerCase();
    for (const indicator of BLOG_PATH_INDICATORS) {
      if (lowerPath.includes(indicator)) return "blog";
    }

    return "webpage";
  } catch {
    return null;
  }
}

const sourceLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  reddit: { label: "Reddit thread", icon: RedditIcon, color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" },
  youtube: { label: "YouTube video", icon: Youtube, color: "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  webpage: { label: "Web page", icon: Globe, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  blog: { label: "Blog article", icon: FileText, color: "text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
};

interface ContentData {
  source: "reddit" | "youtube" | "webpage" | "blog";
  title: string;
  content: string;
  wordCount?: number;
  metadata?: {
    subreddit?: string;
    score?: number;
    commentCount?: number;
    duration?: number;
    durationMinutes?: number;
    excerpt?: string;
    comments?: Array<{ body: string; score: number }>;
  };
}

// Arctic Shift API - free Reddit mirror with CORS (Access-Control-Allow-Origin: *)
// Browser fetches directly using user's residential IP. Zero server load, scales infinitely.
const ARCTIC_SHIFT = "https://arctic-shift.photon-reddit.com/api";

function extractRedditPostId(url: string): string | null {
  const match = url.match(/reddit\.com\/r\/\w+\/comments\/(\w+)/);
  return match ? match[1] : null;
}

async function fetchRedditViaArcticShift(url: string): Promise<ContentData> {
  const postId = extractRedditPostId(url);
  if (!postId) throw new Error("Invalid Reddit URL");

  const subredditMatch = url.match(/reddit\.com\/r\/(\w+)/);
  const subreddit = subredditMatch ? subredditMatch[1] : "";

  // Fetch post + comments in parallel from Arctic Shift (CORS enabled)
  const [postRes, commentsRes] = await Promise.all([
    fetch(`${ARCTIC_SHIFT}/posts/ids?ids=${postId}`),
    fetch(`${ARCTIC_SHIFT}/comments/search?link_id=${postId}&limit=60`),
  ]);

  if (!postRes.ok) throw new Error("Arctic Shift post fetch failed");

  const postJson = await postRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post: any = postJson.data?.[0];
  if (!post?.title) throw new Error("Post not found");

  // Parse comments
  let comments: Array<{ body: string; score: number }> = [];
  if (commentsRes.ok) {
    const commentsJson = await commentsRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments = (commentsJson.data || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => c.body && c.body !== "[deleted]" && c.body !== "[removed]")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 60)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({ body: c.body.substring(0, 500), score: c.score || 0 }));
  }

  return {
    source: "reddit",
    title: post.title || "",
    content: post.selftext || "",
    metadata: {
      subreddit: post.subreddit || subreddit,
      score: post.score || 0,
      commentCount: post.num_comments || 0,
      comments,
    },
  };
}

async function fetchRedditPost(url: string): Promise<ContentData> {
  // Primary: Arctic Shift via browser (CORS, user's IP, always works)
  try {
    return await fetchRedditViaArcticShift(url);
  } catch {
    // Fall through to server fallback
  }

  // Fallback: Server route (tries Reddit .json direct, then Arctic Shift from server)
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
    source: "reddit",
    title: data.title || "",
    content: data.selftext || "",
    metadata: {
      subreddit: data.subreddit,
      score: data.score,
      commentCount: data.num_comments,
      comments: data.trimmedJson?.comments || [],
    },
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, "").replace(/\n/g, " ").trim();
}

// CF Worker for YouTube captions - browser calls directly (CORS enabled, Cloudflare edge IPs)
const YT_WORKER = "https://youtube-captions.digihold-account.workers.dev";

function extractYoutubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

async function fetchYoutubeContent(url: string): Promise<ContentData & { warning?: string }> {
  // Step 1: Get caption track URL
  // Primary: CF Worker directly from browser (Cloudflare edge IPs, not Vercel)
  // Fallback: Server route (Vercel, may be blocked by YouTube)
  let trackUrl = "";
  let title = "";

  const videoId = extractYoutubeVideoId(url);

  // Try CF Worker directly from browser (same principle as Arctic Shift for Reddit)
  if (videoId) {
    try {
      const workerResp = await fetch(YT_WORKER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      if (workerResp.ok) {
        const data = await workerResp.json();
        if (data.trackUrl) {
          trackUrl = data.trackUrl;
          title = data.title || "";
        }
      }
    } catch {
      // Worker unavailable, fall through to server
    }
  }

  // Fallback: Server route (tries CF Worker with secret + InnerTube + watch page from Vercel)
  if (!trackUrl) {
    const trackResponse = await fetch("/api/content/youtube-tracks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (trackResponse.ok) {
      const data = await trackResponse.json();
      trackUrl = data.trackUrl;
      title = data.title || "";
    } else {
      let errorMsg = "Failed to extract YouTube content";
      try {
        const data = await trackResponse.json();
        errorMsg = data.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
  }

  // Step 2: Fetch the actual transcript XML from the user's browser (CORS allowed on timedtext)
  // This uses the user's residential IP, so YouTube never blocks it
  const xmlResponse = await fetch(trackUrl);
  if (!xmlResponse.ok) {
    throw new Error("Failed to download transcript from YouTube");
  }

  const xml = await xmlResponse.text();

  // Parse XML transcript segments
  const segments: { start: number; dur: number; text: string }[] = [];
  const regex = /<text\s+start="([^"]*)"(?:\s+dur="([^"]*)")?[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const text = decodeHtmlEntities(match[3]);
    if (text) segments.push({ start: parseFloat(match[1]), dur: parseFloat(match[2] || "0"), text });
  }

  if (segments.length === 0) {
    throw new Error("Could not parse transcript from this video. Try a different video.");
  }

  // Combine into full transcript
  const transcript = segments.map((s) => s.text).join(" ");
  const lastSegment = segments[segments.length - 1];
  const videoDurationSeconds = lastSegment.start + lastSegment.dur;
  const durationMinutes = Math.round(videoDurationSeconds / 60);

  // Trim to 4,000 words (~30 min of content)
  const words = transcript.split(/\s+/);
  const trimmedTranscript = words.slice(0, 4000).join(" ");

  let warning: string | undefined;
  if (videoDurationSeconds > 3600) {
    warning = "This video is over 60 minutes. The AI will focus on the first ~30 minutes of content.";
  }

  return {
    source: "youtube",
    title,
    content: trimmedTranscript,
    wordCount: words.length,
    metadata: {
      duration: Math.round(videoDurationSeconds),
      durationMinutes,
    },
    warning,
  };
}

async function fetchWebpageContent(url: string): Promise<ContentData & { warning?: string }> {
  const response = await fetch("/api/content/webpage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    let errorMsg = "Failed to extract page content";
    try {
      const data = await response.json();
      errorMsg = data.error || errorMsg;
    } catch {
      // Server returned non-JSON error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

const steps = [
  { num: 1, label: "Paste URL" },
  { num: 2, label: "Select Hook" },
  { num: 3, label: "Choose Post" },
  { num: 4, label: "Edit & Publish" },
];

interface SettingsResponse {
  hasApiKey: boolean;
  hasImageApiKey: boolean;
  aiProvider: string | null;
  timezone: string | null;
}

function ContentRepurposingContent() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [detectedSource, setDetectedSource] = useState<SourceType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState<number | null>(null);
  const [posts, setPosts] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [contentData, setContentData] = useState<ContentData | null>(null);

  // API key state
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [hasImageApiKey, setHasImageApiKey] = useState(false);

  // Step 4: Editing and Image Generation State
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; preview?: string; storageUrl?: string; storageKey?: string } | null>(null);

  // Save/Publish/Schedule State
  const [firstComment, setFirstComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [userTimezone, setUserTimezone] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // AI Edit state
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [customAiInstruction, setCustomAiInstruction] = useState("");

  // Router and refs
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check if user has access to image generation
  const hasImageAccess = canAccessFeature(userPlan, "imageGeneration");
  const hasCarouselAccess = canAccessFeature(userPlan, "carouselGenerator");

  // Get current post content
  const getCurrentPost = () => {
    if (selectedPost === null) return "";
    return isEditing ? editedPost : posts[selectedPost];
  };

  // Auto-detect source from URL
  useEffect(() => {
    if (url.trim()) {
      setDetectedSource(detectSourceType(url.trim()));
    } else {
      setDetectedSource(null);
    }
  }, [url]);

  // Persist state to localStorage
  const STORAGE_KEY = "linkedgrow_repurpose_draft";

  // Save state to localStorage when it changes
  useEffect(() => {
    if (step > 1 || hooks.length > 0 || posts.length > 0) {
      const stateToSave = {
        step,
        url,
        hooks,
        selectedHook,
        posts,
        selectedPost,
        contentData,
        editedPost,
        attachedImage,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [step, url, hooks, selectedHook, posts, selectedPost, contentData, editedPost, attachedImage]);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const state = JSON.parse(saved);
        const savedAt = new Date(state.savedAt);
        const hoursSinceSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceSave < 24) {
          if (state.url) setUrl(state.url);
          if (state.hooks?.length > 0) setHooks(state.hooks);
          if (state.selectedHook !== null && state.selectedHook !== undefined) setSelectedHook(state.selectedHook);
          if (state.posts?.length > 0) setPosts(state.posts);
          if (state.selectedPost !== null && state.selectedPost !== undefined) setSelectedPost(state.selectedPost);
          if (state.contentData) setContentData(state.contentData);
          if (state.editedPost) setEditedPost(state.editedPost);
          if (state.attachedImage) setAttachedImage(state.attachedImage);

          if (state.step) {
            if (state.step >= 3 && (!state.posts || state.posts.length === 0)) {
              setStep(state.hooks?.length > 0 ? 2 : 1);
            } else if (state.step >= 2 && (!state.hooks || state.hooks.length === 0)) {
              setStep(1);
            } else {
              setStep(state.step);
            }
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Clear draft after successful publish or save
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Check if user has API key configured and fetch timezone
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setHasApiKey(data.hasApiKey);
          setHasImageApiKey(data.hasImageApiKey);
          if (data.timezone) {
            setUserTimezone(data.timezone);
          }
        } else {
          setHasApiKey(false);
          setHasImageApiKey(false);
        }
      } catch {
        setHasApiKey(false);
      } finally {
        setIsCheckingApiKey(false);
      }
    };

    checkApiKey();
  }, []);

  const handleExtractContent = async () => {
    if (!url.trim() || !detectedSource || !hasApiKey) return;
    setIsLoading(true);
    setError(null);
    setWarning(null);

    try {
      let extracted: ContentData & { warning?: string };

      if (detectedSource === "reddit") {
        extracted = await fetchRedditPost(url);
      } else if (detectedSource === "youtube") {
        extracted = await fetchYoutubeContent(url);
      } else {
        // Both "blog" and "webpage" use the same extraction endpoint
        extracted = await fetchWebpageContent(url);
      }

      if (extracted.warning) {
        setWarning(extracted.warning);
      }

      setContentData(extracted);

      // Send to analyze endpoint to generate hooks
      const analyzeResponse = await fetch("/api/content/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extracted),
      });

      if (!analyzeResponse.ok) {
        const text = await analyzeResponse.text();
        let errorMsg = "Failed to analyze content";
        try { errorMsg = JSON.parse(text).error || errorMsg; } catch { /* HTML error page */ }
        throw new Error(errorMsg);
      }

      const data = await analyzeResponse.json();
      const generatedHooks = data.hooks || [];

      if (generatedHooks.length === 0) {
        throw new Error("No hooks were generated. Please try again.");
      }

      setHooks(generatedHooks);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePosts = async () => {
    if (selectedHook === null || !hasApiKey || !contentData) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hook: hooks[selectedHook],
          content: contentData,
          count: 3,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = "Failed to generate posts";
        try { errorMsg = JSON.parse(text).error || errorMsg; } catch { /* HTML error page */ }
        throw new Error(errorMsg);
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
            source: contentData?.source || "unknown",
            sourceUrl: url,
            sourceTitle: contentData?.title,
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
      const isVideo = attachedImage?.mimeType?.startsWith("video/");
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
          metadata: {
            source: contentData?.source || "unknown",
            sourceUrl: url,
            sourceTitle: contentData?.title,
          },
        }),
      });

      if (!saveResponse.ok) {
        const err = await saveResponse.json().catch(() => null);
        throw new Error(err?.error || "Failed to save post before publishing");
      }

      const { post } = await saveResponse.json();

      const publishResponse = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          text: currentPost,
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

    const effectiveTimezone = resolveTimezone(userTimezone);
    const scheduledAtISO = localToUTC(scheduleDate, scheduleTime, effectiveTimezone);
    const scheduledAt = new Date(scheduledAtISO);
    if (scheduledAt <= new Date()) {
      showToast("Please select a future date and time");
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
          status: "scheduled",
          scheduledAt: scheduledAtISO,
          postType: attachedImage ? "image" : "text",
          mediaInfo,
          mediaData,
          firstComment: firstComment || null,
          metadata: {
            source: contentData?.source || "unknown",
            sourceUrl: url,
            sourceTitle: contentData?.title,
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

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      showToast("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB (LinkedIn limit)");
      return;
    }

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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle AI edit
  const handleAiEdit = async (instruction: string) => {
    if (!instruction.trim() || selectedPost === null) return;

    setIsAiEditing(true);
    try {
      const currentContent = posts[selectedPost];

      const response = await fetch("/api/ai/edit-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentContent,
          instruction: instruction,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to edit post");
      }

      const data = await response.json();
      if (data.content) {
        const newPosts = [...posts];
        newPosts[selectedPost] = data.content;
        setPosts(newPosts);
        setCustomAiInstruction("");
        showToast("Post updated with AI!", "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to edit post");
    } finally {
      setIsAiEditing(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <Repeat className="w-5 h-5 text-white" />
              </div>
              Content Repurposing
            </h1>
            <p className="text-muted-foreground mt-1">
              Turn any URL into a LinkedIn post
            </p>
          </div>
          <Link href="/docs/content-creation/content-repurposing" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
            Help?
          </Link>
        </div>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center">
                <Key className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI API Key Required</h3>
              <p className="text-muted-foreground mb-6">
                To analyze content and generate LinkedIn posts, you need to configure your AI API key in settings.
                LinkedGrow uses your own API key (BYOK) for unlimited generations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard/settings/ai-api">
                  <Button className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure API Key
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-6">
                We support OpenAI, Anthropic, Google AI, Grok (xAI), Perplexity, and Kimi. Your key is encrypted and stored securely.
              </p>
            </div>
          </CardContent>
        </Card>

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-white" />
            </div>
            Content Repurposing
          </h1>
          <p className="text-muted-foreground mt-1">
            Turn any URL into a LinkedIn post
          </p>
        </div>
        <Link href="/docs/content-creation/content-repurposing" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
          Help?
        </Link>
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

      {/* Warning Message */}
      {warning && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-sm flex items-start gap-2">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}

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
            <CardTitle>Paste any URL to turn it into a LinkedIn post</CardTitle>
            <CardDescription>
              We auto-detect the source and extract content from Reddit, YouTube, blogs, and web pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Paste a Reddit, YouTube, blog, or web page URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && detectedSource && !isLoading) {
                      handleExtractContent();
                    }
                  }}
                  className="w-full"
                />
                {/* Detected source badge */}
                {detectedSource && url.trim() && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const info = sourceLabels[detectedSource];
                      const Icon = info.icon;
                      return (
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", info.color)}>
                          <Icon className="w-3.5 h-3.5" />
                          Detected: {info.label}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <Button
                onClick={handleExtractContent}
                disabled={!detectedSource || isLoading}
                className="px-6 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shrink-0"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Extract Content
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(sourceLabels).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <div key={key} className={cn("flex items-center gap-2 p-3 rounded-xl border text-sm", info.color.split(" ").slice(1).join(" "))}>
                    <Icon className={cn("w-5 h-5 shrink-0", info.color.split(" ")[0])} />
                    <span className="text-muted-foreground">{info.label}</span>
                  </div>
                );
              })}
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
              {contentData && (
                <span className="ml-2">
                  {(() => {
                    const info = sourceLabels[contentData.source];
                    const Icon = info.icon;
                    return (
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ml-1", info.color)}>
                        <Icon className="w-3 h-3" />
                        {contentData.title ? contentData.title.substring(0, 60) + (contentData.title.length > 60 ? "..." : "") : info.label}
                      </span>
                    );
                  })()}
                </span>
              )}
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
                    <p className="font-medium whitespace-pre-line">{hook}</p>
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
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-100 overflow-y-auto">
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
                  <PostEditor
                    value={editedPost}
                    onChange={setEditedPost}
                    placeholder="Edit your post..."
                    minHeight="min-h-[400px]"
                    showImageButton={true}
                    showVideoButton={true}
                    showCarouselButton={hasCarouselAccess}
                    attachedImage={attachedImage}
                    onImageChange={setAttachedImage}
                    onError={showToast}
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-border min-h-[300px]">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {posts[selectedPost]}
                    </div>
                  </div>
                )}

                {/* Attached Image Preview (only when not editing - PostEditor has its own preview) */}
                {!isEditing && attachedImage?.preview && (
                  <div className="mt-4 relative">
                    <div className="rounded-xl overflow-hidden border border-border bg-accent/30">
                      <img
                        src={attachedImage.preview}
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

                {!isEditing && (
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>
                      {posts[selectedPost].length} / 3000 characters
                    </span>
                    {attachedImage && (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <Image className="w-4 h-4" />
                        Image attached
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* First Comment */}
            {getCurrentPost().trim() && (
              <FirstComment
                value={firstComment}
                onChange={setFirstComment}
                postContent={getCurrentPost()}
                onError={showToast}
                hasAccess={canAccessFeature(userPlan, "firstComment")}
              />
            )}

            {/* AI Edit Options */}
            <Card className="border-cyan-200 bg-cyan-50/50 dark:border-cyan-800 dark:bg-cyan-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-cyan-500" />
                  AI Quick Edit
                  {isAiEditing && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {["Make Shorter", "Add Emojis", "Stronger Hook", "Add CTA", "More Casual"].map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="bg-white dark:bg-gray-900 hover:bg-cyan-100 hover:border-cyan-300"
                      onClick={() => handleAiEdit(action)}
                      disabled={isAiEditing}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Custom instruction (e.g., 'Make it more professional')"
                    value={customAiInstruction}
                    onChange={(e) => setCustomAiInstruction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customAiInstruction.trim()) {
                        handleAiEdit(customAiInstruction);
                      }
                    }}
                    disabled={isAiEditing}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAiEdit(customAiInstruction)}
                    disabled={isAiEditing || !customAiInstruction.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    {isAiEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            {/* Publish Actions */}
            <Card>
              <CardHeader className="pb-2 bg-muted/30 rounded-t-xl">
                <CardTitle className="text-base">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isVideoMedia(attachedImage) && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
                    Videos are too large to be stored by LinkedGrow. Posts with videos must be published immediately.
                  </div>
                )}
                <Button
                  className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving || !getCurrentPost().trim() || isVideoMedia(attachedImage)}
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
              <CardHeader className="pb-2 bg-muted/30 rounded-t-xl">
                <CardTitle className="text-base">Add Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasImageApiKey && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const currentPost = getCurrentPost();
                      if (!currentPost || !currentPost.trim()) {
                        setToast({ message: "Add some text to your post first before generating an image.", type: "error" });
                        return;
                      }
                      setShowImageModal(true);
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                    Generate AI Image
                    {!hasImageAccess && (
                      <span className="ml-2 text-xs text-amber-600 flex items-center gap-1">
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
                  className="w-full"
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
            hasTextApiKey={hasApiKey ?? false}
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

export default function ContentRepurposingPage() {
  return (
    <FeatureGate feature="contentRepurposing">
      <ContentRepurposingContent />
    </FeatureGate>
  );
}
