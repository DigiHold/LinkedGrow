"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { VideoModal } from "@/components/dashboard/video-modal";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarPlus,
  Lightbulb,
  Loader2,
  CalendarDays,
  X,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Image as ImageIcon,
  Calendar,
  Search,
  Send,
  ArrowLeft,
  Info,
  Save,
  Trash2,
  Sparkles,
  Wand2,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Drawer } from "vaul";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PostEditor, isVideoMedia } from "@/components/dashboard/post-editor";
import { FirstComment } from "@/components/dashboard/first-comment";
import { ImageGeneratorModal } from "@/components/dashboard/image-generator-modal";
import { canAccessFeature, PlanId } from "@/lib/plans";
import { PdfCarouselPreview } from "@/components/dashboard/pdf-carousel-preview";
import { AutoplayVideo } from "@/components/autoplay-video";
import { localToUTC, utcToLocal, formatInTimezone, resolveTimezone } from "@/lib/timezone";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface PostMedia {
  id: string;
  storageUrl: string;
  storageKey: string;
  mimeType: string;
}

interface Post {
  id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  postType: "text" | "image" | "carousel" | "video";
  scheduledAt: string | null;
  publishedAt: string | null;
  linkedinPostUrl: string | null;
  firstComment: string | null;
  createdAt: string;
  updatedAt: string;
  media?: PostMedia[];
}

interface Idea {
  id: string;
  title: string;
  content: string | null;
  source: string;
  createdAt: string;
}

type DrawerView = "post-detail" | "create-post" | "schedule-post" | "schedule-post-preview" | "edit-post" | "day-detail" | null;

export function CalendarContent() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const hasCarouselAccess = true;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<{ day: number; month: number; year: number } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<DrawerView>(null);

  // Create post state
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostFirstComment, setNewPostFirstComment] = useState("");
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; preview?: string; storageUrl?: string; storageKey?: string } | null>(null);
  // Track the draft post ID after the first /api/posts call so a failed publish
  // followed by a retry doesn't create a duplicate draft.
  const [pendingDraftPostId, setPendingDraftPostId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiInstruction, setAIInstruction] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Schedule post state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedPostToSchedule, setSelectedPostToSchedule] = useState<Post | null>(null);

  // Scheduling state
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
  const [scheduleHour, setScheduleHour] = useState("12");
  const [scheduleMinute, setScheduleMinute] = useState("00");
  const [scheduleAmPm, setScheduleAmPm] = useState<"AM" | "PM">("PM");
  const [postMenuOpen, setPostMenuOpen] = useState(false);

  // Insert idea modal state
  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState("");
  const [savingIdea, setSavingIdea] = useState(false);
  const [selectedIdeaForModal, setSelectedIdeaForModal] = useState<Idea | null>(null);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit post state
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostFirstComment, setEditPostFirstComment] = useState("");
  const [editScheduleTime, setEditScheduleTime] = useState("");
  const [editScheduleDate, setEditScheduleDate] = useState("");
  const [editAttachedImage, setEditAttachedImage] = useState<{ base64: string; mimeType: string; preview?: string; storageUrl?: string; storageKey?: string } | null>(null);

  // Error toast state
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Drag and drop state
  const [draggedPost, setDraggedPost] = useState<Post | null>(null);
  const [draggedIdea, setDraggedIdea] = useState<Idea | null>(null);
  const [dragOverDay, setDragOverDay] = useState<{ day: number; month: number; year: number } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // LinkedIn profile data for preview
  const [linkedInProfile, setLinkedInProfile] = useState<{
    name: string;
    headline: string;
    image: string | null;
  } | null>(null);

  // User timezone for scheduling
  const [userTimezone, setUserTimezone] = useState<string | null>(null);

  // AI Image generation state
  const [hasImageApiKey, setHasImageApiKey] = useState(false);
  const [hasTextApiKey, setHasTextApiKey] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showEditImageModal, setShowEditImageModal] = useState(false);
  const hasImageAccess = true;

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 4000);
  };

  const postEditorRef = useRef<{ focus: () => void; getContent: () => string; setContent: (content: string) => void } | null>(null);
  const dayDropdownRef = useRef<HTMLDivElement>(null);
  const postMenuRef = useRef<HTMLDivElement>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const clickedDayRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  // Convert getDay() (0=Sun) to Monday-first (0=Mon)
  const startingDay = (firstDayOfMonth.getDay() + 6) % 7;

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/posts?status=draft,scheduled,published&limit=100");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data.posts || []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/posts?limit=100");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setAllPosts(data.posts || []);
    } catch {
      // Silent fail
    }
  }, []);

  const fetchIdeas = useCallback(async () => {
    try {
      const response = await fetch("/api/ideas?limit=50");
      if (!response.ok) throw new Error("Failed to fetch ideas");
      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchAllPosts();
    fetchIdeas();
  }, [fetchPosts, fetchAllPosts, fetchIdeas]);

  // Fetch LinkedIn profile for preview
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setLinkedInProfile({
            name: data.linkedinProfileName || data.name || "Your Name",
            headline: data.linkedinHeadline || "",
            image: data.image && data.image.trim() !== "" ? data.image : null,
          });
        }
      } catch {
        // Silently fail - will use default values
      }
    };
    fetchProfile();
  }, []);

  // Fetch user timezone for scheduling
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
      } catch {
        // Silently fail - will use browser timezone as fallback
      }
    };
    fetchTimezone();
  }, []);

  // Set schedule date when selecting a day
  useEffect(() => {
    if (selectedDay) {
      const newDate = new Date(selectedDay.year, selectedDay.month, selectedDay.day);
      const now = new Date();
      newDate.setHours(now.getHours(), now.getMinutes());
      setScheduleDate(newDate);
      const hours = now.getHours();
      setScheduleHour(String(hours % 12 || 12));
      setScheduleAmPm(hours >= 12 ? "PM" : "AM");
      setScheduleMinute(String(Math.ceil(now.getMinutes() / 5) * 5 % 60).padStart(2, "0"));
    }
  }, [selectedDay]);

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setSelectedDay(null);
      }
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setPostMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getPostsForDate = (day: number, m: number, y: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const tz = resolveTimezone(userTimezone);
    return posts.filter((post) => {
      // Published posts use publishedAt (actual publish date)
      // Scheduled posts use scheduledAt (planned date)
      // Drafts use scheduledAt if set, otherwise createdAt
      let postDate: string | Date | null | undefined;
      if (post.status === "published") {
        postDate = post.publishedAt || post.scheduledAt;
      } else if (post.status === "scheduled") {
        postDate = post.scheduledAt;
      } else {
        postDate = post.scheduledAt || post.createdAt;
      }
      if (!postDate) return false;
      const { date: postDateStr } = utcToLocal(postDate, tz);
      return postDateStr === dateStr;
    });
  };

  const getIdeasForDate = (day: number, m: number, y: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const tz = resolveTimezone(userTimezone);
    return ideas.filter((idea) => {
      if (!idea.createdAt) return false;
      const { date: ideaDateStr } = utcToLocal(idea.createdAt, tz);
      return ideaDateStr === dateStr;
    });
  };

  const handleIdeaClick = (idea: Idea, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIdeaForModal(idea);
    setNewIdeaText(idea.content || idea.title);
    setIdeaModalOpen(true);
  };

  const isToday = (day: number, m: number, y: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  const isPast = (day: number, m: number, y: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(y, m, day);
    return checkDate < today;
  };

  // Generate calendar days
  const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthIndex = month === 0 ? 11 : month - 1;

  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, month: prevMonthIndex, year: prevMonthYear, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month, year, isCurrentMonth: true });
  }
  const remainingCells = 42 - days.length;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonthIndex = month === 11 ? 0 : month + 1;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, month: nextMonthIndex, year: nextMonthYear, isCurrentMonth: false });
  }

  // Get the most relevant date for a post based on its status
  // Published -> publishedAt, Scheduled -> scheduledAt, Draft -> scheduledAt or createdAt
  const getPostDisplayDate = (post: Post): string => {
    if (post.status === "published" && post.publishedAt) {
      return post.publishedAt;
    }
    return post.scheduledAt || post.createdAt;
  };

  const formatTime = (dateStr: string) => {
    const tz = resolveTimezone(userTimezone);
    return formatInTimezone(dateStr, tz, { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatFullDate = (dateStr: string) => {
    const tz = resolveTimezone(userTimezone);
    return formatInTimezone(dateStr, tz, { day: "numeric", month: "long", year: "numeric" });
  };

  const formatShortDate = (dateStr: string) => {
    const tz = resolveTimezone(userTimezone);
    return formatInTimezone(dateStr, tz, { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getPostPreview = (content: string, maxLength = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  const handleDayClick = (item: typeof days[0], e: React.MouseEvent) => {
    if (item.isCurrentMonth && !isPast(item.day, item.month, item.year)) {
      const target = e.currentTarget as HTMLDivElement;
      const rect = target.getBoundingClientRect();

      // Position dropdown to the right of the clicked day cell
      // If there's not enough space on the right, position it to the left
      const dropdownWidth = 180;
      let left = rect.right + 8;
      if (left + dropdownWidth > window.innerWidth - 16) {
        left = rect.left - dropdownWidth - 8;
      }

      // Position vertically centered with the cell, but keep within viewport
      let top = rect.top;
      const dropdownHeight = 140;
      if (top + dropdownHeight > window.innerHeight - 16) {
        top = window.innerHeight - dropdownHeight - 16;
      }

      setDropdownPosition({ top, left });
      setSelectedDay({ day: item.day, month: item.month, year: item.year });
      setDropdownOpen(true);
    }
  };

  const handlePostClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    // Blur the clicked element to prevent focus issues when drawer opens
    (e.currentTarget as HTMLElement).blur();
    setSelectedPost(post);
    setDrawerView("post-detail");
    setDrawerOpen(true);
  };

  const openDrawer = (view: DrawerView) => {
    // Blur any focused element to prevent aria-hidden focus issues
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setDrawerView(view);
    setDrawerOpen(true);
    setDropdownOpen(false);
    if (view === "create-post") {
      setNewPostContent("");
      setAttachedImage(null);
      setNewPostFirstComment("");
      setPendingDraftPostId(null);
      setTimeout(() => postEditorRef.current?.focus(), 100);
    }
    if (view === "schedule-post") {
      setSelectedPostToSchedule(null);
    }
  };

  const openIdeaModal = () => {
    setDropdownOpen(false);
    setSelectedIdeaForModal(null);
    setIdeaModalOpen(true);
    setNewIdeaText("");
  };

  const getStatusLabel = (status: Post["status"]) => {
    switch (status) {
      case "scheduled": return "Scheduled";
      case "published": return "Published";
      case "failed": return "Failed";
      default: return "Draft";
    }
  };

  const getStatusColor = (status: Post["status"]) => {
    switch (status) {
      case "scheduled": return "bg-blue-500";
      case "published": return "bg-green-500";
      case "failed": return "bg-red-500";
      default: return "bg-yellow-500";
    }
  };

  // Drag and drop handlers for moving posts/ideas between dates
  const handlePostDragStart = (post: Post, e: React.DragEvent) => {
    if (post.status === "published") {
      e.preventDefault();
      return;
    }
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', post.id);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
    }
  };

  const handlePostDragEnd = (e: React.DragEvent) => {
    setDraggedPost(null);
    setDragOverDay(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleIdeaDragStart = (idea: Idea, e: React.DragEvent) => {
    setDraggedIdea(idea);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idea.id);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
    }
  };

  const handleIdeaDragEnd = (e: React.DragEvent) => {
    setDraggedIdea(null);
    setDragOverDay(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDayDragOver = (item: typeof days[0], e: React.DragEvent) => {
    if (!draggedPost && !draggedIdea) return;

    if (!item.isCurrentMonth || isPast(item.day, item.month, item.year)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay({ day: item.day, month: item.month, year: item.year });
  };

  const handleDayDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverDay(null);
    }
  };

  const handleDayDrop = async (item: typeof days[0], e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDay(null);

    if (isRescheduling) return;
    if (!item.isCurrentMonth || isPast(item.day, item.month, item.year)) return;

    const newDateStr = `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
    const tz = resolveTimezone(userTimezone);

    // Handle post drop
    if (draggedPost) {
      const post = draggedPost;
      setDraggedPost(null);

      const originalDate = post.scheduledAt || post.createdAt;
      if (!originalDate) return;

      // Skip if same day (compare in user's timezone)
      const { date: existingDateStr } = utcToLocal(originalDate, tz);
      if (existingDateStr === newDateStr) return;

      // Preserve time in user's timezone
      const dateObj = new Date(originalDate);
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(dateObj);
      const hour = parts.find(p => p.type === 'hour')?.value || '12';
      const minute = parts.find(p => p.type === 'minute')?.value || '00';
      const newScheduledAt = localToUTC(newDateStr, `${hour}:${minute}`, tz);

      if (new Date(newScheduledAt) <= new Date()) {
        showError("Cannot move to a past time");
        return;
      }

      // Optimistic update - status stays the same, only date changes
      const updatedPost = { ...post, scheduledAt: newScheduledAt };
      setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
      setAllPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));

      setIsRescheduling(true);
      try {
        const response = await fetch(`/api/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledAt: newScheduledAt }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to move post');
        }
      } catch (error) {
        setPosts(prev => prev.map(p => p.id === post.id ? post : p));
        setAllPosts(prev => prev.map(p => p.id === post.id ? post : p));
        showError(error instanceof Error ? error.message : 'Failed to move post');
      } finally {
        setIsRescheduling(false);
      }
      return;
    }

    // Handle idea drop
    if (draggedIdea) {
      const idea = draggedIdea;
      setDraggedIdea(null);

      // Skip if same day (compare in user's timezone)
      const { date: existingDateStr } = utcToLocal(idea.createdAt, tz);
      if (existingDateStr === newDateStr) return;

      // Preserve time from original createdAt
      const dateObj = new Date(idea.createdAt);
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(dateObj);
      const hour = parts.find(p => p.type === 'hour')?.value || '12';
      const minute = parts.find(p => p.type === 'minute')?.value || '00';
      const newCreatedAt = localToUTC(newDateStr, `${hour}:${minute}`, tz);

      // Optimistic update
      const updatedIdea = { ...idea, createdAt: newCreatedAt };
      setIdeas(prev => prev.map(i => i.id === idea.id ? updatedIdea : i));

      setIsRescheduling(true);
      try {
        const response = await fetch(`/api/ideas/${idea.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ createdAt: newCreatedAt }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to move idea');
        }
      } catch (error) {
        setIdeas(prev => prev.map(i => i.id === idea.id ? idea : i));
        showError(error instanceof Error ? error.message : 'Failed to move idea');
      } finally {
        setIsRescheduling(false);
      }
    }
  };

  const get24Hour = () => {
    let hour = parseInt(scheduleHour);
    if (scheduleAmPm === "PM" && hour !== 12) hour += 12;
    if (scheduleAmPm === "AM" && hour === 12) hour = 0;
    return hour;
  };

  // Get scheduled time as UTC ISO string, respecting user's configured timezone
  // resolveTimezone handles "auto" by returning browser timezone
  const getScheduledAtUTC = () => {
    const dateStr = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(get24Hour()).padStart(2, '0')}:${scheduleMinute}`;
    const tz = resolveTimezone(userTimezone);
    return localToUTC(dateStr, timeStr, tz);
  };

  const handleCreatePost = async (publish: boolean = false) => {
    if (!newPostContent.trim()) return;

    setIsSaving(true);
    try {
      // Get scheduled time in UTC, respecting user's configured timezone
      const scheduledAtISO = getScheduledAtUTC();
      const scheduledAt = new Date(scheduledAtISO);

      // For scheduled posts, ensure the time is in the future
      if (!publish) {
        const now = new Date();
        if (scheduledAt <= now) {
          showError("Scheduled time must be in the future");
          setIsSaving(false);
          return;
        }
      }

      const isVideo = attachedImage?.mimeType?.startsWith("video/");
      const isPdf = attachedImage?.mimeType === "application/pdf";

      // Videos are NOT stored in the DB - they're too big and would bloat
      // storage. Instead the R2 URL is passed directly to the publish endpoint
      // and the file is deleted from R2 right after LinkedIn ingests it.
      // For images and PDFs we still create a media row so they're persistent.
      const hasMedia = !!(attachedImage?.storageUrl && attachedImage?.storageKey && !isVideo);
      const mediaInfo = hasMedia ? {
        storageUrl: attachedImage.storageUrl,
        storageKey: attachedImage.storageKey,
        mimeType: attachedImage.mimeType,
      } : undefined;

      const postType = isVideo ? "video" : isPdf ? "carousel" : (attachedImage ? "image" : "text");

      // Reuse the draft from a prior failed attempt so retrying publish doesn't
      // create a duplicate draft row.
      let postIdToPublish = pendingDraftPostId;

      if (!postIdToPublish) {
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newPostContent,
            status: publish ? "draft" : "scheduled",
            scheduledAt: publish ? undefined : scheduledAtISO,
            postType,
            mediaInfo,
            firstComment: newPostFirstComment || null,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => null);
          throw new Error(err?.error || "Failed to create post");
        }

        const { post } = await response.json();
        postIdToPublish = post.id;
        // Persist immediately so a publish failure below leaves us with the
        // same draft to retry against, not a fresh one.
        setPendingDraftPostId(postIdToPublish);
      }

      // If publishing immediately, call the LinkedIn API
      if (publish) {
        const publishResponse = await fetch("/api/linkedin/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: postIdToPublish,
            text: newPostContent,
            // For videos, pass the R2 URL directly so the route doesn't have
            // to look it up from the media table (we don't store one).
            videoUrl: isVideo ? attachedImage?.storageUrl : undefined,
            videoMimeType: isVideo ? attachedImage?.mimeType : undefined,
            videoStorageKey: isVideo ? attachedImage?.storageKey : undefined,
          }),
        });

        if (!publishResponse.ok) {
          const error = await publishResponse.json().catch(() => null);
          throw new Error(error?.error || "Failed to publish to LinkedIn");
        }
      }

      await fetchPosts();
      setDrawerOpen(false);
      setNewPostContent("");
      setAttachedImage(null);
      setPendingDraftPostId(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to publish post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedPostToSchedule) return;

    setIsSaving(true);
    try {
      // Get scheduled time in UTC, respecting user's configured timezone
      const scheduledAtISO = getScheduledAtUTC();
      const scheduledAt = new Date(scheduledAtISO);

      // Ensure the scheduled time is at least 1 minute in the future
      const now = new Date();
      if (scheduledAt <= now) {
        showError("Scheduled time must be in the future");
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/posts/${selectedPostToSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "scheduled",
          scheduledAt: scheduledAtISO,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to schedule post");
      }

      await fetchPosts();
      await fetchAllPosts();
      setDrawerOpen(false);
      setSelectedPostToSchedule(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to schedule post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIdea = async () => {
    if (!newIdeaText.trim()) return;

    setSavingIdea(true);
    try {
      // If editing existing idea, update it; otherwise create new
      if (selectedIdeaForModal) {
        const response = await fetch(`/api/ideas/${selectedIdeaForModal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newIdeaText.substring(0, 100),
            content: newIdeaText,
          }),
        });

        if (!response.ok) throw new Error("Failed to update idea");
      } else {
        // Use selectedDay to set the idea's date to the clicked calendar date
        // Set time to noon to avoid timezone offset shifting the date back a day
        const ideaDate = selectedDay
          ? new Date(selectedDay.year, selectedDay.month, selectedDay.day, 12, 0, 0)
          : new Date();

        const response = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newIdeaText.substring(0, 100),
            content: newIdeaText,
            source: "manual",
            createdAt: ideaDate.toISOString(),
          }),
        });

        if (!response.ok) throw new Error("Failed to save idea");
      }

      await fetchIdeas();
      setIdeaModalOpen(false);
      setSelectedIdeaForModal(null);
      setNewIdeaText("");
    } catch {
      // Silent fail
    } finally {
      setSavingIdea(false);
    }
  };

  const handleCreateFromIdea = () => {
    if (!newIdeaText.trim()) return;
    setIdeaModalOpen(false);
    setSelectedIdeaForModal(null);
    setNewPostContent(newIdeaText);
    setAttachedImage(null);
    setNewPostFirstComment("");
    setPendingDraftPostId(null);
    setDrawerView("create-post");
    setDrawerOpen(true);
    setTimeout(() => postEditorRef.current?.focus(), 100);
  };

  const handleAIEdit = async () => {
    if (!aiInstruction.trim() || !newPostContent.trim()) return;
    setIsProcessingAI(true);
    try {
      const response = await fetch("/api/ai/edit-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          instruction: aiInstruction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit post");
      }

      const data = await response.json();
      if (data.content) {
        setNewPostContent(data.content);
      }
      setShowAIPanel(false);
      setAIInstruction("");
    } catch (error) {
showError(error instanceof Error ? error.message : "Failed to edit post");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${selectedPost.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete post");
      await fetchPosts();
      await fetchAllPosts();
      setDrawerOpen(false);
      setSelectedPost(null);
      setShowDeleteConfirm(false);
    } catch {
      // Silent fail
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditPost = (post: Post) => {
    setSelectedPost(post);
    setEditPostContent(post.content);
    setEditPostFirstComment(post.firstComment || "");
    // Load existing media if present
    if (post.media && post.media.length > 0) {
      const existingMedia = post.media[0];
      setEditAttachedImage({
        base64: "",
        mimeType: existingMedia.mimeType,
        preview: existingMedia.storageUrl,
        storageUrl: existingMedia.storageUrl,
        storageKey: existingMedia.storageKey,
      });
    } else {
      setEditAttachedImage(null);
    }
    // Parse the scheduled date and time in user's timezone
    if (post.scheduledAt) {
      const tz = resolveTimezone(userTimezone);
      const { date, time } = utcToLocal(post.scheduledAt, tz);
      setEditScheduleDate(date);
      setEditScheduleTime(time);
    } else {
      const now = new Date();
      setEditScheduleDate(now.toISOString().split('T')[0]);
      setEditScheduleTime("12:00");
    }
    setDrawerView("edit-post");
    setPostMenuOpen(false);
  };

  const handleSaveEditedPost = async () => {
    if (!selectedPost || !editPostContent.trim()) return;
    setIsSaving(true);
    try {
      // Convert the selected date/time to UTC using user's configured timezone
      // resolveTimezone handles "auto" by returning browser timezone
      const tz = resolveTimezone(userTimezone);
      const scheduledAtISO = localToUTC(editScheduleDate, editScheduleTime, tz);
      const scheduledAt = new Date(scheduledAtISO);

      // Ensure the scheduled time is in the future for scheduled posts
      if (selectedPost.status === "scheduled") {
        const now = new Date();
        if (scheduledAt <= now) {
          showError("Scheduled time must be in the future");
          setIsSaving(false);
          return;
        }
      }

      // Determine media changes
      const originalHasMedia = selectedPost.media && selectedPost.media.length > 0;
      const currentHasMedia = editAttachedImage !== null;
      const hasNewR2Media = currentHasMedia && editAttachedImage?.storageUrl && editAttachedImage?.storageKey;
      const hasNewBase64 = currentHasMedia && editAttachedImage?.base64 && editAttachedImage.base64.length > 0;

      // Build request body
      const requestBody: Record<string, unknown> = {
        content: editPostContent,
        scheduledAt: scheduledAtISO,
        firstComment: editPostFirstComment || null,
      };

      // If user removed media (had media before, now doesn't)
      if (originalHasMedia && !currentHasMedia) {
        requestBody.removeMedia = true;
      }

      // If user added new media via PostEditor (already on R2)
      if (hasNewR2Media && !originalHasMedia) {
        requestBody.mediaInfo = {
          storageUrl: editAttachedImage!.storageUrl,
          storageKey: editAttachedImage!.storageKey,
          mimeType: editAttachedImage!.mimeType,
        };
      }

      // If user added new media via base64 upload
      if (!hasNewR2Media && hasNewBase64) {
        requestBody.mediaData = {
          base64: editAttachedImage!.base64,
          mimeType: editAttachedImage!.mimeType,
        };
      }

      const response = await fetch(`/api/posts/${selectedPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update post");
      }

      await fetchPosts();
      await fetchAllPosts();
      setDrawerOpen(false);
      setSelectedPost(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIdea = async () => {
    if (!selectedIdeaForModal) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ideas/${selectedIdeaForModal.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete idea");
      await fetchIdeas();
      setIdeaModalOpen(false);
      setSelectedIdeaForModal(null);
      setNewIdeaText("");
    } catch {
      // Silent fail
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || post.status === filterType;
    return matchesSearch && matchesType;
  });

  const getFormattedScheduleTime = () => {
    return `${scheduleHour}:${scheduleMinute} ${scheduleAmPm}`;
  };

  const getFormattedScheduleDate = () => {
    if (!selectedDay) return "Select a date";
    return `${selectedDay.day} ${MONTHS[selectedDay.month]} ${selectedDay.year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900 sm:text-[32px] dark:text-white">
              Calendar
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
              Everything you have scheduled, and the gaps you have not filled
              yet.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <VideoModal videoId="6Vr6eYA-gI4" />
            <Link
              href="/docs/scheduling/content-calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Docs
            </Link>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-2xl border border-border shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold">{MONTHS[month]} {year}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-slate-50/70 dark:bg-white/5">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-3">{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days.map((item, index) => {
              const postsForDay = getPostsForDate(item.day, item.month, item.year);
              const ideasForDay = getIdeasForDate(item.day, item.month, item.year);
              const hasPost = postsForDay.length > 0;
              const hasIdea = ideasForDay.length > 0;
              const dayIsToday = isToday(item.day, item.month, item.year);
              const dayIsPast = isPast(item.day, item.month, item.year);
              const isClickable = item.isCurrentMonth && !dayIsPast;
              const isSelected = selectedDay?.day === item.day && selectedDay?.month === item.month && selectedDay?.year === item.year;

              const isDragOver = dragOverDay?.day === item.day && dragOverDay?.month === item.month && dragOverDay?.year === item.year;

              return (
                <div
                  key={index}
                  onClick={(e) => handleDayClick(item, e)}
                  onDragOver={(e) => handleDayDragOver(item, e)}
                  onDragLeave={handleDayDragLeave}
                  onDrop={(e) => handleDayDrop(item, e)}
                  className={cn(
                    "min-h-32 sm:p-2 p-1 border-b border-r border-border/50 transition-all text-left flex flex-col relative bg-card",
                    !item.isCurrentMonth && "bg-slate-50/80 dark:bg-white/2",
                    isClickable && "hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer",
                    dayIsPast && item.isCurrentMonth && "bg-slate-50/60 dark:bg-white/2 calendar-past-stripes",
                    isSelected && "bg-primary/5 dark:bg-primary/10 ring-2 ring-inset ring-primary",
                    index % 7 === 6 && "border-r-0",
                    // Drag and drop visual feedback
                    (draggedPost || draggedIdea) && item.isCurrentMonth && !dayIsPast && !isDragOver && "ring-1 ring-inset ring-primary/20",
                    isDragOver && "bg-primary/10 dark:bg-primary/20 ring-2 ring-inset ring-primary"
                  )}
                >
                  {/* Day Number */}
                  <div className="w-full sm:w-fit flex justify-center sm:justify-start">
                    <span className={cn(
                      "text-xs flex h-6 w-6 items-center justify-center rounded-sm",
                      dayIsToday && "bg-primary text-white",
                      !dayIsToday && item.isCurrentMonth && !dayIsPast && "text-foreground",
                      !dayIsToday && item.isCurrentMonth && dayIsPast && "text-muted-foreground",
                      !item.isCurrentMonth && "text-muted-foreground/50"
                    )}>
                      {item.day}
                    </span>
                  </div>

                  {/* Posts and Ideas for this day */}
                  {(hasPost || hasIdea) && (
                    <div className="mt-2 space-y-1">
                      {/* Posts */}
                      {postsForDay.slice(0, 2).map((post) => (
                        <button
                          key={post.id}
                          onClick={(e) => handlePostClick(post, e)}
                          draggable={post.status !== "published"}
                          onDragStart={(e) => handlePostDragStart(post, e)}
                          onDragEnd={handlePostDragEnd}
                          className={cn(
                            "w-full p-1 rounded-sm overflow-hidden border transition-opacity hover:opacity-80 text-left",
                            post.status === "draft" && "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20",
                            post.status === "scheduled" && "border-blue-300 bg-blue-50 dark:bg-blue-900/20",
                            post.status === "published" && "border-green-300 bg-green-50 dark:bg-green-900/20",
                            post.status === "failed" && "border-red-300 bg-red-50 dark:bg-red-900/20",
                            post.status !== "published" && "cursor-grab active:cursor-grabbing"
                          )}
                        >
                          <div className="flex items-center gap-1.5 px-1.5 py-1">
                            {post.postType === "image" && post.media?.[0]?.storageUrl ? (
                              <img
                                src={post.media[0].storageUrl}
                                alt=""
                                width={60}
                                height={60}
                                loading="lazy"
                                className="w-6 h-6 rounded-sm object-cover shrink-0"
                              />
                            ) : (
                              <div className={cn(
                                "w-6 h-6 rounded-sm flex items-center justify-center shrink-0",
                                post.status === "draft" && "bg-yellow-100 dark:bg-yellow-800/40",
                                post.status === "scheduled" && "bg-blue-100 dark:bg-blue-800/40",
                                post.status === "published" && "bg-green-100 dark:bg-green-800/40"
                              )}>
                                <CalendarDays className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              </div>
                            )}
                            <p className="line-clamp-1 text-[10px] font-medium text-slate-700 dark:text-slate-300 leading-tight">
                              {getPostPreview(post.content, 30)}
                            </p>
                          </div>
                          <div className="px-1.5 py-1 flex items-center gap-1.5 text-[9px] text-slate-500">
                            <Calendar className="w-2.5 h-2.5" />
                            <span className="font-medium">{formatTime(getPostDisplayDate(post))}</span>
                          </div>
                        </button>
                      ))}
                      {/* Ideas */}
                      {ideasForDay.slice(0, hasPost ? 1 : 2).map((idea) => (
                        <button
                          key={idea.id}
                          onClick={(e) => handleIdeaClick(idea, e)}
                          draggable
                          onDragStart={(e) => handleIdeaDragStart(idea, e)}
                          onDragEnd={handleIdeaDragEnd}
                          className="w-full p-1 rounded-sm overflow-hidden border border-slate-300 bg-slate-100 dark:bg-white/5 transition-opacity hover:opacity-80 text-left cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-1.5 px-1.5 py-1">
                            <div className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0 bg-slate-200 dark:bg-white/10">
                              <Lightbulb className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            </div>
                            <p className="line-clamp-1 text-[10px] font-medium text-slate-700 dark:text-slate-300 leading-tight">
                              {getPostPreview(idea.title, 30)}
                            </p>
                          </div>
                          <div className="px-1.5 py-1 flex items-center gap-1.5 text-[9px] text-slate-500">
                            <Lightbulb className="w-2.5 h-2.5" />
                            <span className="font-medium">Idea</span>
                          </div>
                        </button>
                      ))}
                      {(postsForDay.length + ideasForDay.length) > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDay({ day: item.day, month: item.month, year: item.year });
                            setDrawerView("day-detail");
                            setDrawerOpen(true);
                          }}
                          className="text-[10px] text-primary hover:text-primary/80 px-1.5 block font-medium hover:underline"
                        >
                          +{(postsForDay.length + ideasForDay.length) - 2} more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* An empty grid says nothing. This says what the page is for and
              where to start, and disappears the moment anything is scheduled. */}
          {!loading && posts.length === 0 && (
            <div className="border-t border-border px-6 py-8 text-center">
              <p className="text-[15px] font-medium text-slate-900 dark:text-white">
                Nothing scheduled this month
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Click any day to write a post for it, or schedule something you
                have already drafted.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link href="/dashboard/generator">
                  <Button size="sm">Write a post</Button>
                </Link>
                <Link href="/dashboard/posts">
                  <Button size="sm" variant="outline">
                    Schedule a draft
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>

      {/* Day Actions Dropdown */}
      {dropdownOpen && selectedDay && dropdownPosition && (
        <div
          ref={dayDropdownRef}
          className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-2 min-w-44"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <button
            onClick={() => openDrawer("create-post")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create a post
          </button>
          <button
            onClick={() => openDrawer("schedule-post")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" /> Schedule a post
          </button>
          <button
            onClick={openIdeaModal}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Lightbulb className="w-4 h-4" /> Insert an idea
          </button>
        </div>
      )}

      {/* Insert Idea Modal - rendered via portal to be above drawer */}
      {ideaModalOpen && createPortal(
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 pointer-events-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setIdeaModalOpen(false); setSelectedIdeaForModal(null); }} />
          <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg p-6 z-201">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedIdeaForModal ? "Your idea" : "Insert an idea"}</h2>
              <button onClick={() => { setIdeaModalOpen(false); setSelectedIdeaForModal(null); }} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <textarea
                value={newIdeaText}
                onChange={(e) => setNewIdeaText(e.target.value)}
                placeholder="Write your idea here..."
                className="w-full h-40 p-4 border rounded-lg resize-none outline-none text-base leading-relaxed bg-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary"
                autoFocus
              />
              {!selectedIdeaForModal && (
                <p className="text-sm text-muted-foreground mt-2">
                  This idea will be saved for {getFormattedScheduleDate()}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleCreateFromIdea} disabled={!newIdeaText.trim()} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Create a post from this idea
              </Button>
              <Button variant="outline" onClick={handleSaveIdea} disabled={!newIdeaText.trim() || savingIdea} className="w-full">
                <Lightbulb className="w-4 h-4 mr-2" /> {savingIdea ? "Saving..." : selectedIdeaForModal ? "Update idea" : "Save as idea only"}
              </Button>
              {selectedIdeaForModal && (
                <Button variant="outline" onClick={handleDeleteIdea} disabled={isDeleting} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4 mr-2" /> {isDeleting ? "Deleting..." : "Delete this idea"}
                </Button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Post Confirmation Modal - rendered via portal to be above drawer */}
      {showDeleteConfirm && selectedPost && createPortal(
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 pointer-events-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-card rounded-xl shadow-xl w-full max-w-md p-6 z-201">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Delete post</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeletePost} disabled={isDeleting} className="flex-1">
                <Trash2 className="w-4 h-4 mr-2" /> {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Multi-purpose Drawer */}
      <Drawer.Root direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-150" onClick={() => setDrawerOpen(false)} />
          <Drawer.Content
            className="fixed right-0 top-0 bottom-0 z-150 flex flex-col bg-background w-full max-w-250 border-l border-border shadow-xl outline-none"
            aria-describedby={undefined}
          >
            <DialogPrimitive.Title className="sr-only">
              {drawerView === "post-detail" ? "Post Details" :
               drawerView === "create-post" ? "Create Post" :
               drawerView === "schedule-post" ? "Schedule Post" :
               drawerView === "edit-post" ? "Edit Post" :
               drawerView === "day-detail" ? "Day Overview" : "Calendar Drawer"}
            </DialogPrimitive.Title>

            {/* POST DETAIL VIEW */}
            {drawerView === "post-detail" && selectedPost && (
              <>
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b border-border bg-card sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:hidden">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">
                        {selectedPost.status === "published" ? "Your post published" : selectedPost.status === "draft" ? "Draft post" : "Scheduled post"}
                      </h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex md:flex-row flex-col w-full flex-1 min-h-0">
                  <div className="relative flex flex-col flex-1 min-h-fit w-full bg-[#f4f2ee] dark:bg-slate-800">
                    <div className="pt-10 px-6 lg:px-10 flex flex-col items-start h-full min-h-0 flex-1 overflow-y-auto w-full">
                      <div className="w-full transition-opacity duration-200">
                        <div className="w-full max-w-lg m-auto bg-card rounded-xl border border-border mb-10">
                          <div className="px-4 pt-4 pb-0">
                            <div className="flex w-full justify-between items-start">
                              <div className="flex max-w-[90%] items-start">
                                {linkedInProfile && linkedInProfile.image ? (
                                  <img
                                    src={linkedInProfile.image}
                                    alt={linkedInProfile.name || "Profile"}
                                    className="w-10 h-10 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                                    <span className="text-white font-semibold text-sm">
                                      {(linkedInProfile?.name || session?.user?.name || "U").charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex flex-col ml-2.5">
                                  <h3 className="font-semibold">{linkedInProfile?.name || session?.user?.name || "Your LinkedIn Profile"}</h3>
                                  <div className="text-sm text-muted-foreground line-clamp-1">{linkedInProfile?.headline || ""}</div>
                                </div>
                              </div>
                              <div className="relative" ref={postMenuRef}>
                                <button
                                  onClick={() => setPostMenuOpen(!postMenuOpen)}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm"
                                >
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                                {postMenuOpen && (
                                  <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-32">
                                    <button
                                      onClick={() => openEditPost(selectedPost)}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                      Edit post
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPostMenuOpen(false);
                                        setShowDeleteConfirm(true);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                      Delete post
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="p-4 pt-4">
                            <div className="mb-4 relative">
                              <div className="whitespace-pre-line text-sm leading-5">{selectedPost.content}</div>
                            </div>
                            {/* Display attached media */}
                            {selectedPost.media && selectedPost.media.length > 0 && (
                              <div className="mt-3">
                                {selectedPost.media[0].mimeType === "application/pdf" ? (
                                  <PdfCarouselPreview
                                    url={selectedPost.media[0].storageUrl}
                                  />
                                ) : selectedPost.media[0].mimeType.startsWith("video/") ? (
                                  <AutoplayVideo
                                    src={selectedPost.media[0].storageUrl}
                                    className="w-full rounded-lg border border-border"
                                    controls
                                  />
                                ) : (
                                  <img
                                    src={selectedPost.media[0].storageUrl}
                                    alt="Post attachment"
                                    className="w-full rounded-lg border border-border"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Display first comment if exists */}
                        {selectedPost.firstComment && (
                          <div className="w-full max-w-lg m-auto mb-10">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              <span className="text-sm font-medium">First comment</span>
                            </div>
                            <div className="bg-card rounded-xl border border-border p-4">
                              <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedPost.firstComment}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="md:border-l md:border-border flex flex-col gap-5 transition-all w-full md:w-65 lg:w-90 p-8 pt-10 pb-10 sm:p-10 md:p-6 lg:p-10 overflow-hidden h-full bg-card">
                    <div className="relative bg-card border border-border rounded-lg p-4 shadow-sm">
                      <div className="absolute -top-2 left-4 px-3 py-1 bg-card border border-border rounded-full shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", getStatusColor(selectedPost.status))} />
                          <span className="text-xs font-medium text-muted-foreground">{getStatusLabel(selectedPost.status)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-2">
                        <p className="text-sm text-muted-foreground">
                          {selectedPost.status === "published" ? "Post published" : selectedPost.status === "draft" ? "Created on" : "Scheduled for"}
                        </p>
                        <p className="text-base font-bold">
                          {formatFullDate(getPostDisplayDate(selectedPost))} - {formatTime(getPostDisplayDate(selectedPost))}
                        </p>
                      </div>
                    </div>
                    {selectedPost.linkedinPostUrl && (
                      <a href={selectedPost.linkedinPostUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-10 text-sm bg-card border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        View on LinkedIn <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {/* Schedule button for draft posts */}
                    {selectedPost.status === "draft" && (
                      <Button
                        variant="linkedin"
                        className="w-full"
                        onClick={() => {
                          setSelectedPostToSchedule(selectedPost);
                          setDrawerView("schedule-post");
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" /> Schedule this draft
                      </Button>
                    )}
                    <div className="flex flex-col mt-3 gap-3 justify-center items-center">
                      <Link href={`/dashboard/editor?duplicate=${selectedPost.id}`} className="w-full">
                        <Button variant="default" className="w-full">
                          <RefreshCw className="w-4 h-4 mr-2" /> Reuse this post
                        </Button>
                      </Link>
                      <div className="flex text-sm text-muted-foreground gap-1.5 items-center">
                        <Info className="w-4 h-4" />
                        <span>The current post will be duplicated</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* CREATE POST VIEW */}
            {drawerView === "create-post" && (
              <>
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b border-border bg-card sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:hidden">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">Plan a new post</h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex md:flex-row flex-col w-full flex-1 min-h-0">
                  {/* LEFT SIDE - Editor */}
                  <div className="relative flex flex-col flex-1 min-h-0 overflow-y-auto p-6 bg-card">
                    <div className="space-y-4">
                      <PostEditor
                        ref={postEditorRef}
                        value={newPostContent}
                        onChange={setNewPostContent}
                        placeholder="Start writing your LinkedIn post...

Tips for viral posts:
• Start with a strong hook (first 2 lines are crucial)
• Use short paragraphs and line breaks
• Add bullet points for readability
• End with a question or CTA"
                        minHeight="min-h-80 sm:min-h-100"
                        showImageButton={true}
                        showVideoButton={true}
                        showCarouselButton={hasCarouselAccess}
                        attachedImage={attachedImage}
                        onImageChange={setAttachedImage}
                        onError={showError}
                      />
                      <FirstComment
                        value={newPostFirstComment}
                        onChange={setNewPostFirstComment}
                        postContent={newPostContent}
                        onError={showError}
                        hasAccess={true}
                      />
                      <div className="flex justify-end gap-2">
                        {hasImageApiKey && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!newPostContent.trim()) {
                                showError("Add some text to your post first before generating an image.");
                                return;
                              }
                              setShowImageModal(true);
                            }}
                          >
                            <Sparkles className="w-4 h-4 mr-1 text-slate-500 dark:text-slate-400" />
                            <span className="hidden sm:inline">AI Image</span>
                            {!hasImageAccess && (
                              <span className="ml-1 text-xs text-amber-600">Pro</span>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newState = !showAIPanel;
                            setShowAIPanel(newState);
                            if (newState) {
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
                    </div>

                    {/* AI Panel */}
                    {showAIPanel && (
                      <Card ref={aiPanelRef} className="mt-4 border-linkedin/20 bg-linkedin/5">
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
                            className="min-h-24"
                          />
                          <div className="flex flex-wrap gap-2 mt-3">
                            {[
                              "Make Shorter",
                              "Add Emojis",
                              "Stronger Hook",
                              "Add CTA",
                              "More Casual",
                            ].map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => setAIInstruction(suggestion)}
                                className="px-3 py-1 text-xs rounded-full bg-card border border-border hover:border-linkedin/50 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                          <Button
                            variant="linkedin"
                            className="mt-4 w-full"
                            onClick={handleAIEdit}
                            disabled={!aiInstruction.trim() || isProcessingAI}
                          >
                            {isProcessingAI ? "Processing..." : "Apply Changes"}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* RIGHT SIDE - Settings */}
                  <div className="md:border-l md:border-border flex flex-col gap-5 w-full md:w-80 lg:w-96 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
                    {/* To be planned status box */}
                    <div className="relative bg-card border border-border rounded-lg p-4 shadow-sm">
                      <div className="absolute -top-2 left-4 px-3 py-1 bg-card border border-border rounded-full shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-xs font-medium text-muted-foreground">To be planned</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-2">
                        <p className="text-sm text-muted-foreground">Schedule this post on</p>
                        <p className="text-base font-bold">
                          {getFormattedScheduleDate()} - {getFormattedScheduleTime()}
                        </p>
                      </div>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Schedule
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Date</label>
                          <div className="relative">
                            <input
                              ref={dateInputRef}
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              value={selectedDay ? `${selectedDay.year}-${String(selectedDay.month + 1).padStart(2, '0')}-${String(selectedDay.day).padStart(2, '0')}` : ''}
                              onChange={(e) => {
                                const date = new Date(e.target.value);
                                setSelectedDay({ day: date.getDate(), month: date.getMonth(), year: date.getFullYear() });
                              }}
                              className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm cursor-pointer"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Time</label>
                          <input
                            type="time"
                            value={`${String(get24Hour()).padStart(2, '0')}:${scheduleMinute}`}
                            onChange={(e) => {
                              const [hours, mins] = e.target.value.split(':');
                              const hour = parseInt(hours);
                              setScheduleHour(String(hour % 12 || 12));
                              setScheduleAmPm(hour >= 12 ? "PM" : "AM");
                              setScheduleMinute(mins);
                            }}
                            className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      {/* Videos must be published immediately - they're not stored for scheduled delivery */}
                      {isVideoMedia(attachedImage) && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
                          Video posts must be published immediately - they cannot be scheduled or saved as a draft.
                        </div>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => handleCreatePost(false)} disabled={!newPostContent.trim() || isSaving || isVideoMedia(attachedImage)}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save as Draft"}
                      </Button>
                      <Button className="w-full" onClick={() => handleCreatePost(false)} disabled={!newPostContent.trim() || isSaving || isVideoMedia(attachedImage)}>
                        <Calendar className="w-4 h-4 mr-2" />
                        {isSaving ? "Scheduling..." : "Schedule Post"}
                      </Button>
                      <Button variant="linkedin" className="w-full" onClick={() => handleCreatePost(true)} disabled={!newPostContent.trim() || isSaving}>
                        <Send className="w-4 h-4 mr-2" />
                        {isSaving ? "Publishing..." : "Publish now"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SCHEDULE POST VIEW - Post List */}
            {drawerView === "schedule-post" && !selectedPostToSchedule && (
              <>
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b border-border bg-card sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:hidden">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">Schedule a post</h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col w-full h-full min-h-0">
                  <div className="flex w-full justify-between items-center gap-4 flex-wrap p-4 border-b border-border">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search for a post"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-md text-sm bg-card"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="draft">Drafts</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="overflow-y-auto flex-1 p-4">
                    <div className="space-y-3">
                      {filteredPosts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No posts found</p>
                        </div>
                      ) : (
                        filteredPosts.map((post) => (
                          <div
                            key={post.id}
                            className="flex items-center gap-4 p-4 rounded-lg border transition-colors bg-card border-slate-200 hover:border-primary"
                          >
                            <div
                              className="flex-1 flex flex-col gap-1.5 overflow-hidden cursor-pointer"
                              onClick={() => setSelectedPostToSchedule(post)}
                            >
                              <h3 className="font-bold truncate">{getPostPreview(post.content, 80)}</h3>
                              <p className="text-sm text-slate-500 flex items-center gap-2">
                                <span>
                                  {post.status === "published" ? "Published" : post.status === "draft" ? "Draft" : "Scheduled"} on {formatShortDate(post.createdAt)}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditPost(post);
                                }}
                                title="Edit post"
                              >
                                <Wand2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPost(post);
                                  setShowDeleteConfirm(true);
                                }}
                                title="Delete post"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SCHEDULE POST VIEW - Post Preview */}
            {drawerView === "schedule-post" && selectedPostToSchedule && (
              <>
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b border-border bg-card sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedPostToSchedule(null)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:hidden">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">Schedule this post</h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex md:flex-row flex-col w-full flex-1 min-h-0">
                  <div className="relative flex flex-col flex-1 min-h-fit w-full bg-[#f4f2ee] dark:bg-slate-800">
                    <div className="pt-10 px-6 lg:px-10 flex flex-col items-start h-full min-h-0 flex-1 overflow-y-auto w-full">
                      <button
                        onClick={() => setSelectedPostToSchedule(null)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to selection
                      </button>
                      <div className="w-full max-w-lg bg-card rounded-xl border border-border mb-10">
                        <div className="px-4 pt-4 pb-0">
                          <div className="flex w-full justify-between items-start">
                            <div className="flex max-w-[90%] items-start">
                              {linkedInProfile && linkedInProfile.image ? (
                                <img
                                  src={linkedInProfile.image}
                                  alt={linkedInProfile.name || "Profile"}
                                  className="w-10 h-10 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                                  <span className="text-white font-semibold text-sm">
                                    {(linkedInProfile?.name || session?.user?.name || "U").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col ml-2.5">
                                <h3 className="font-semibold">{linkedInProfile?.name || session?.user?.name || "Your LinkedIn Profile"}</h3>
                                <div className="text-sm text-muted-foreground line-clamp-1">{linkedInProfile?.headline || ""}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 pt-4">
                          <div className="mb-4 relative">
                            <div className="whitespace-pre-line text-sm leading-5">{selectedPostToSchedule.content}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:border-l md:border-border flex flex-col gap-5 w-full md:w-80 lg:w-96 p-6 overflow-y-auto bg-card">
                    <div className="relative bg-card border border-border rounded-lg p-4 shadow-sm">
                      <div className="absolute -top-2 left-4 px-3 py-1 bg-card border border-border rounded-full shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-xs font-medium text-muted-foreground">To be scheduled</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-2">
                        <p className="text-sm text-muted-foreground">Schedule for</p>
                        <p className="text-base font-bold">
                          {getFormattedScheduleDate()} - {getFormattedScheduleTime()}
                        </p>
                      </div>
                    </div>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Schedule
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Date</label>
                          <input
                            type="date"
                            value={selectedDay ? `${selectedDay.year}-${String(selectedDay.month + 1).padStart(2, '0')}-${String(selectedDay.day).padStart(2, '0')}` : ''}
                            onChange={(e) => {
                              const date = new Date(e.target.value);
                              setSelectedDay({ day: date.getDate(), month: date.getMonth(), year: date.getFullYear() });
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Time</label>
                          <input
                            type="time"
                            value={`${String(get24Hour()).padStart(2, '0')}:${scheduleMinute}`}
                            onChange={(e) => {
                              const [hours, mins] = e.target.value.split(':');
                              const hour = parseInt(hours);
                              setScheduleHour(String(hour % 12 || 12));
                              setScheduleAmPm(hour >= 12 ? "PM" : "AM");
                              setScheduleMinute(mins);
                            }}
                            className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <div className="space-y-3">
                      <Button onClick={handleSchedulePost} disabled={isSaving} className="w-full">
                        <Calendar className="w-4 h-4 mr-2" />
                        {isSaving ? "Scheduling..." : "Schedule the post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* DAY DETAIL VIEW */}
            {drawerView === "day-detail" && selectedDay && (
              <>
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b border-border bg-card sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:hidden">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">
                        {selectedDay.day} {MONTHS[selectedDay.month]} {selectedDay.year}
                      </h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col w-full h-full min-h-0 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800/50">
                  {/* Actions */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        openDrawer("create-post");
                      }}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" /> New Post
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDrawerOpen(false);
                        setTimeout(() => openIdeaModal(), 100);
                      }}
                      className="flex-1"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" /> New Idea
                    </Button>
                  </div>

                  {/* Posts Section */}
                  {(() => {
                    const dayPosts = getPostsForDate(selectedDay.day, selectedDay.month, selectedDay.year);
                    const dayIdeas = getIdeasForDate(selectedDay.day, selectedDay.month, selectedDay.year);
                    return (
                      <>
                        {dayPosts.length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                              <CalendarDays className="w-4 h-4" />
                              Posts ({dayPosts.length})
                            </h3>
                            <div className="space-y-3">
                              {dayPosts.map((post) => (
                                <div
                                  key={post.id}
                                  className={cn(
                                    "p-4 rounded-lg border bg-card transition-all hover:shadow-md cursor-pointer",
                                    post.status === "draft" && "border-l-4 border-l-yellow-500",
                                    post.status === "scheduled" && "border-l-4 border-l-blue-500",
                                    post.status === "published" && "border-l-4 border-l-green-500",
                                    post.status === "failed" && "border-l-4 border-l-red-500"
                                  )}
                                  onClick={() => {
                                    setSelectedPost(post);
                                    setDrawerView("post-detail");
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-full text-xs font-medium",
                                          post.status === "draft" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                          post.status === "scheduled" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                          post.status === "published" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                          post.status === "failed" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        )}>
                                          {getStatusLabel(post.status)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatTime(getPostDisplayDate(post))}
                                        </span>
                                      </div>
                                      <p className="text-sm line-clamp-2 text-slate-700 dark:text-slate-300">
                                        {post.content}
                                      </p>
                                    </div>
                                    {post.media && post.media.length > 0 && (
                                      <div className="shrink-0">
                                        {post.media[0].mimeType === "application/pdf" ? (
                                          <div className="w-16 h-16 rounded-md bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                            <CalendarDays className="w-6 h-6 text-muted-foreground" />
                                          </div>
                                        ) : post.media[0].mimeType.startsWith("video/") ? (
                                          <div className="w-16 h-16 rounded-md bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                          </div>
                                        ) : (
                                          <img
                                            src={post.media[0].storageUrl}
                                            alt=""
                                            className="w-16 h-16 rounded-md object-cover"
                                          />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditPost(post);
                                      }}
                                      className="text-xs h-8"
                                    >
                                      <Wand2 className="w-3 h-3 mr-1" /> Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPost(post);
                                        setShowDeleteConfirm(true);
                                      }}
                                      className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ideas Section */}
                        {dayIdeas.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" />
                              Ideas ({dayIdeas.length})
                            </h3>
                            <div className="space-y-3">
                              {dayIdeas.map((idea) => (
                                <div
                                  key={idea.id}
                                  className="p-4 rounded-lg border border-slate-200 bg-card dark:border-slate-700 transition-all hover:shadow-md cursor-pointer"
                                  onClick={() => {
                                    setSelectedIdeaForModal(idea);
                                    setNewIdeaText(idea.content || idea.title);
                                    setDrawerOpen(false);
                                    setTimeout(() => setIdeaModalOpen(true), 100);
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                      <Lightbulb className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm mb-1 line-clamp-1">{idea.title}</p>
                                      {idea.content && idea.content !== idea.title && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">{idea.content}</p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        <span className="capitalize">{idea.source}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty State */}
                        {dayPosts.length === 0 && dayIdeas.length === 0 && (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                              <CalendarDays className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground mb-4">No posts or ideas for this day</p>
                            <Button
                              variant="outline"
                              onClick={() => openDrawer("create-post")}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Create your first post
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            )}

            {/* EDIT POST VIEW */}
            {drawerView === "edit-post" && selectedPost && (
              <>
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b border-border bg-card sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawerView("post-detail")} className="text-slate-500 hover:text-slate-700 cursor-pointer">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">Edit post</h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex md:flex-row flex-col w-full flex-1 min-h-0">
                  {/* LEFT SIDE - Editor */}
                  <div className="relative flex flex-col flex-1 min-h-0 w-full overflow-y-auto p-6 bg-[#f4f2ee] dark:bg-slate-800">
                    <div className="w-full max-w-lg mx-auto">
                      <PostEditor
                        value={editPostContent}
                        onChange={setEditPostContent}
                        placeholder="Write your LinkedIn post..."
                        minHeight="min-h-80"
                        showImageButton={true}
                        showCarouselButton={hasCarouselAccess}
                        attachedImage={editAttachedImage}
                        onImageChange={setEditAttachedImage}
                        onError={showError}
                      />
                      <div className="mt-4">
                        <FirstComment
                          value={editPostFirstComment}
                          onChange={setEditPostFirstComment}
                          postContent={editPostContent}
                          onError={showError}
                          hasAccess={true}
                        />
                      </div>
                      {hasImageApiKey && (
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!editPostContent.trim()) {
                                showError("Add some text to your post first before generating an image.");
                                return;
                              }
                              setShowEditImageModal(true);
                            }}
                          >
                            <Sparkles className="w-4 h-4 mr-1 text-slate-500 dark:text-slate-400" />
                            <span className="hidden sm:inline">AI Image</span>
                            {!hasImageAccess && (
                              <span className="ml-1 text-xs text-amber-600">Pro</span>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE - Settings */}
                  <div className="md:border-l md:border-border flex flex-col gap-5 w-full md:w-80 lg:w-96 p-6 overflow-y-auto bg-card">
                    <div className="relative bg-card border border-border rounded-lg p-4 shadow-sm">
                      <div className="absolute -top-2 left-4 px-3 py-1 bg-card border border-border rounded-full shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", getStatusColor(selectedPost.status))} />
                          <span className="text-xs font-medium text-muted-foreground">{getStatusLabel(selectedPost.status)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-2">
                        <p className="text-sm text-muted-foreground">Scheduled for</p>
                        <p className="text-base font-bold">
                          {editScheduleDate && editScheduleTime ?
                            `${new Date(editScheduleDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} - ${new Date(`2000-01-01T${editScheduleTime}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                            : "Select date and time"}
                        </p>
                      </div>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Schedule
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Date</label>
                          <input
                            type="date"
                            value={editScheduleDate}
                            onChange={(e) => setEditScheduleDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Time</label>
                          <input
                            type="time"
                            value={editScheduleTime}
                            onChange={(e) => setEditScheduleTime(e.target.value)}
                            className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm cursor-pointer"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      <Button className="w-full" onClick={handleSaveEditedPost} disabled={!editPostContent.trim() || isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save changes"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete post
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Image Generator Modal - Create Post */}
      <ImageGeneratorModal
        open={showImageModal}
        onOpenChange={setShowImageModal}
        postContent={newPostContent}
        userPlan={userPlan}
        hasImageApiKey={hasImageApiKey}
        hasTextApiKey={hasTextApiKey}
        onImageGenerated={(imageData) => {
          setAttachedImage(imageData);
        }}
      />

      {/* Image Generator Modal - Edit Post */}
      <ImageGeneratorModal
        open={showEditImageModal}
        onOpenChange={setShowEditImageModal}
        postContent={editPostContent}
        userPlan={userPlan}
        hasImageApiKey={hasImageApiKey}
        hasTextApiKey={hasTextApiKey}
        onImageGenerated={(imageData) => {
          setEditAttachedImage(imageData);
        }}
      />

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <X className="w-5 h-5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}
