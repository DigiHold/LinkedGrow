"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarPlus,
  Lightbulb,
  Loader2,
  CalendarDays,
  X,
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  TrendingUp,
  Image as ImageIcon,
  Calendar,
  Search,
  Send,
  ArrowLeft,
  Info,
  Save,
  Trash2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Sparkles,
  Wand2,
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface Post {
  id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  postType: "text" | "image" | "carousel" | "video";
  scheduledAt: string | null;
  publishedAt: string | null;
  linkedinPostUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Idea {
  id: string;
  title: string;
  content: string | null;
  source: string;
  createdAt: string;
}

type DrawerView = "post-detail" | "create-post" | "schedule-post" | "schedule-post-preview" | null;

export function CalendarContent() {
  const { data: session } = useSession();
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dayDropdownRef = useRef<HTMLDivElement>(null);
  const postMenuRef = useRef<HTMLDivElement>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/posts?status=scheduled,published&limit=100");
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
    return posts.filter((post) => {
      const postDate = post.scheduledAt || post.publishedAt;
      if (!postDate) return false;
      const postDateStr = new Date(postDate).toISOString().split("T")[0];
      return postDateStr === dateStr;
    });
  };

  const getIdeasForDate = (day: number, m: number, y: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return ideas.filter((idea) => {
      if (!idea.createdAt) return false;
      const ideaDateStr = new Date(idea.createdAt).toISOString().split("T")[0];
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

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getPostPreview = (content: string, maxLength = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  const handleDayClick = (item: typeof days[0], e: React.MouseEvent) => {
    if (item.isCurrentMonth && !isPast(item.day, item.month, item.year)) {
      setSelectedDay({ day: item.day, month: item.month, year: item.year });
      setDropdownOpen(true);
    }
  };

  const handlePostClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPost(post);
    setDrawerView("post-detail");
    setDrawerOpen(true);
  };

  const openDrawer = (view: DrawerView) => {
    setDrawerView(view);
    setDrawerOpen(true);
    setDropdownOpen(false);
    if (view === "create-post") {
      setNewPostContent("");
      setTimeout(() => textareaRef.current?.focus(), 100);
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

  const get24Hour = () => {
    let hour = parseInt(scheduleHour);
    if (scheduleAmPm === "PM" && hour !== 12) hour += 12;
    if (scheduleAmPm === "AM" && hour === 12) hour = 0;
    return hour;
  };

  const handleCreatePost = async (publish: boolean = false) => {
    if (!newPostContent.trim()) return;

    setIsSaving(true);
    try {
      const scheduledAt = new Date(scheduleDate);
      scheduledAt.setHours(get24Hour(), parseInt(scheduleMinute));

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          status: publish ? "published" : "scheduled",
          scheduledAt: publish ? undefined : scheduledAt.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      await fetchPosts();
      setDrawerOpen(false);
      setNewPostContent("");
    } catch {
      // Silent fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedPostToSchedule) return;

    setIsSaving(true);
    try {
      const scheduledAt = new Date(scheduleDate);
      scheduledAt.setHours(get24Hour(), parseInt(scheduleMinute));

      const response = await fetch(`/api/posts/${selectedPostToSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "scheduled",
          scheduledAt: scheduledAt.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to schedule post");

      await fetchPosts();
      await fetchAllPosts();
      setDrawerOpen(false);
      setSelectedPostToSchedule(null);
    } catch {
      // Silent fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIdea = async () => {
    if (!newIdeaText.trim()) return;

    setSavingIdea(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newIdeaText.substring(0, 100),
          content: newIdeaText,
          source: "manual",
        }),
      });

      if (!response.ok) throw new Error("Failed to save idea");

      await fetchIdeas();
      setIdeaModalOpen(false);
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
    setDrawerView("create-post");
    setDrawerOpen(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newPostContent.substring(start, end);

    let newText = "";
    switch (format) {
      case "bold":
        newText = selectedText || "bold text";
        break;
      case "italic":
        newText = selectedText || "italic text";
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

    const updatedContent = newPostContent.substring(0, start) + newText + newPostContent.substring(end);
    setNewPostContent(updatedContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  const handleAIEdit = async () => {
    if (!aiInstruction.trim()) return;
    setIsProcessingAI(true);
    // TODO: Implement actual AI editing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsProcessingAI(false);
    setShowAIPanel(false);
    setAIInstruction("");
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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
              Content Calendar
            </h1>
            <p className="text-muted-foreground mt-1">Plan and visualize your content schedule</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-sm">
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
          <div className="grid grid-cols-7 border-b border-border bg-gray-50/50 dark:bg-gray-800/50">
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

              return (
                <div
                  key={index}
                  onClick={(e) => handleDayClick(item, e)}
                  className={cn(
                    "min-h-32 sm:p-2 p-1 border-b border-r border-border/50 transition-all text-left flex flex-col relative bg-white dark:bg-gray-900",
                    !item.isCurrentMonth && "bg-gray-50/80 dark:bg-gray-800/30",
                    isClickable && "hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer",
                    dayIsPast && item.isCurrentMonth && "bg-gray-50/50 dark:bg-gray-800/20",
                    isSelected && "bg-primary/5 dark:bg-primary/10 ring-2 ring-inset ring-primary",
                    index % 7 === 6 && "border-r-0"
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
                          className={cn(
                            "w-full p-1 rounded-sm overflow-hidden border transition-opacity hover:opacity-80 text-left",
                            post.status === "scheduled" && "border-blue-300 bg-blue-50 dark:bg-blue-900/20",
                            post.status === "published" && "border-green-300 bg-green-50 dark:bg-green-900/20",
                            post.status === "failed" && "border-red-300 bg-red-50 dark:bg-red-900/20"
                          )}
                        >
                          <div className="flex items-center gap-1.5 px-1.5 py-1">
                            <div className={cn(
                              "w-6 h-6 rounded-sm flex items-center justify-center shrink-0",
                              post.status === "scheduled" && "bg-blue-100 dark:bg-blue-800/40",
                              post.status === "published" && "bg-green-100 dark:bg-green-800/40"
                            )}>
                              {post.postType === "image" ? (
                                <ImageIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <CalendarDays className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              )}
                            </div>
                            <p className="line-clamp-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">
                              {getPostPreview(post.content, 30)}
                            </p>
                          </div>
                          <div className="px-1.5 py-1 flex items-center gap-1.5 text-[9px] text-gray-500">
                            <Calendar className="w-2.5 h-2.5" />
                            <span className="font-medium">{formatTime(post.scheduledAt || post.publishedAt || post.createdAt)}</span>
                          </div>
                        </button>
                      ))}
                      {/* Ideas */}
                      {ideasForDay.slice(0, hasPost ? 1 : 2).map((idea) => (
                        <button
                          key={idea.id}
                          onClick={(e) => handleIdeaClick(idea, e)}
                          className="w-full p-1 rounded-sm overflow-hidden border border-gray-300 bg-gray-100 dark:bg-gray-800 transition-opacity hover:opacity-80 text-left"
                        >
                          <div className="flex items-center gap-1.5 px-1.5 py-1">
                            <div className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0 bg-gray-200 dark:bg-gray-700">
                              <Lightbulb className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            </div>
                            <p className="line-clamp-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">
                              {getPostPreview(idea.title, 30)}
                            </p>
                          </div>
                          <div className="px-1.5 py-1 flex items-center gap-1.5 text-[9px] text-gray-500">
                            <Lightbulb className="w-2.5 h-2.5" />
                            <span className="font-medium">Idea</span>
                          </div>
                        </button>
                      ))}
                      {(postsForDay.length + ideasForDay.length) > 2 && (
                        <span className="text-[10px] text-muted-foreground px-1.5 block">+{(postsForDay.length + ideasForDay.length) - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Actions Dropdown */}
      {dropdownOpen && selectedDay && (
        <div
          ref={dayDropdownRef}
          className="fixed z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-lg p-2 min-w-44"
          style={{
            top: (() => {
              const dayIndex = days.findIndex(d => d.day === selectedDay.day && d.month === selectedDay.month && d.year === selectedDay.year);
              const row = Math.floor(dayIndex / 7);
              const calendarTop = 280;
              return calendarTop + (row * 128) + 20;
            })(),
            left: (() => {
              const dayIndex = days.findIndex(d => d.day === selectedDay.day && d.month === selectedDay.month && d.year === selectedDay.year);
              const col = dayIndex % 7;
              const cellWidth = window.innerWidth > 640 ? (Math.min(1152, window.innerWidth - 48) / 7) : (window.innerWidth / 7);
              const calendarLeft = (window.innerWidth - Math.min(1152, window.innerWidth - 48)) / 2;
              return calendarLeft + (col * cellWidth) + cellWidth + 4;
            })(),
          }}
        >
          <button
            onClick={() => openDrawer("create-post")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create a post
          </button>
          <button
            onClick={() => openDrawer("schedule-post")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" /> Schedule a post
          </button>
          <button
            onClick={openIdeaModal}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Lightbulb className="w-4 h-4" /> Insert an idea
          </button>
        </div>
      )}

      {/* Insert Idea Modal */}
      {ideaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setIdeaModalOpen(false); setSelectedIdeaForModal(null); }} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedIdeaForModal ? "Your idea" : "Insert an idea"}</h2>
              <button onClick={() => { setIdeaModalOpen(false); setSelectedIdeaForModal(null); }} className="text-gray-500 hover:text-gray-700">
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
                <Lightbulb className="w-4 h-4 mr-2" /> {savingIdea ? "Saving..." : "Save as idea only"}
              </Button>
              {selectedIdeaForModal && (
                <Button variant="outline" onClick={handleDeleteIdea} disabled={isDeleting} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4 mr-2" /> {isDeleting ? "Deleting..." : "Delete this idea"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {showDeleteConfirm && selectedPost && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Delete post</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-500 hover:text-gray-700">
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
        </div>
      )}

      {/* Multi-purpose Drawer */}
      <Drawer.Root direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-background w-full max-w-3xl border-l shadow-xl outline-none">

            {/* POST DETAIL VIEW */}
            {drawerView === "post-detail" && selectedPost && (
              <>
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer sm:hidden">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">
                        {selectedPost.status === "published" ? "Your post published" : "Scheduled post"}
                      </h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex md:flex-row flex-col w-full h-full min-h-0">
                  <div className="relative flex flex-col min-h-fit md:w-fit w-full bg-[#f4f2ee] dark:bg-gray-800">
                    <div className="pt-10 px-6 lg:px-10 flex flex-col items-start h-full min-h-0 flex-1 overflow-y-auto w-full">
                      <div className="w-full transition-opacity duration-200">
                        <div className="md:w-102.5 m-auto bg-white dark:bg-gray-900 rounded-xl border mb-10">
                          <div className="px-4 pt-4 pb-0">
                            <div className="flex w-full justify-between items-start">
                              <div className="flex max-w-[90%] items-start">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                  <span className="text-primary font-semibold text-sm">
                                    {session?.user?.name?.charAt(0) || "U"}
                                  </span>
                                </div>
                                <div className="flex flex-col ml-2.5">
                                  <h3 className="font-semibold">{session?.user?.name || "Your LinkedIn Profile"}</h3>
                                  <div className="text-sm text-muted-foreground line-clamp-1">Your headline here</div>
                                </div>
                              </div>
                              <div className="relative" ref={postMenuRef}>
                                <button
                                  onClick={() => setPostMenuOpen(!postMenuOpen)}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm"
                                >
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                                {postMenuOpen && (
                                  <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-lg py-1 min-w-32">
                                    <Link
                                      href={`/dashboard/editor?id=${selectedPost.id}`}
                                      className="block px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                      Edit post
                                    </Link>
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:border-l flex flex-col gap-5 transition-all w-full md:w-65 lg:w-90 p-8 pt-10 pb-10 sm:p-10 md:p-6 lg:p-10 overflow-hidden h-full bg-white dark:bg-gray-900">
                    <div className="relative bg-white dark:bg-gray-900 border rounded-lg p-4 shadow-sm">
                      <div className="absolute -top-2 left-4 px-3 py-1 bg-white dark:bg-gray-900 border rounded-full shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", getStatusColor(selectedPost.status))} />
                          <span className="text-xs font-medium text-muted-foreground">{getStatusLabel(selectedPost.status)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-2">
                        <p className="text-sm text-muted-foreground">
                          {selectedPost.status === "published" ? "Post published" : "Scheduled for"}
                        </p>
                        <p className="text-base font-bold">
                          {formatFullDate(selectedPost.scheduledAt || selectedPost.publishedAt || selectedPost.createdAt)} - {formatTime(selectedPost.scheduledAt || selectedPost.publishedAt || selectedPost.createdAt)}
                        </p>
                      </div>
                    </div>
                    {selectedPost.status === "published" && (
                      <div className="bg-white dark:bg-gray-900 border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between gap-2 mb-3 pb-2.5 border-b">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-semibold">Performances</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1.5 rounded-md transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-md">
                                <Eye className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-sm text-muted-foreground">Impressions</span>
                            </div>
                            <span className="text-sm font-semibold">-</span>
                          </div>
                          <div className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1.5 rounded-md transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-md">
                                <Heart className="w-4 h-4 text-red-500" />
                              </div>
                              <span className="text-sm text-muted-foreground">Likes</span>
                            </div>
                            <span className="text-sm font-semibold">-</span>
                          </div>
                          <div className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1.5 rounded-md transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                                <MessageCircle className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-sm text-muted-foreground">Comments</span>
                            </div>
                            <span className="text-sm font-semibold">-</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedPost.linkedinPostUrl && (
                      <a href={selectedPost.linkedinPostUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-10 text-sm bg-white dark:bg-gray-900 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        View on LinkedIn <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <div className="flex flex-col mt-3 gap-3 justify-center items-center">
                      <Link href={`/dashboard/generator?duplicate=${selectedPost.id}`} className="w-full">
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
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer sm:hidden">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">Plan a new post</h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex md:flex-row flex-col w-full h-full min-h-0">
                  {/* LEFT SIDE - Editor */}
                  <div className="relative flex flex-col flex-1 min-h-0 overflow-y-auto p-6 bg-white dark:bg-gray-900">
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
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                          <div className="flex-1" />
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

                        {/* Main Textarea */}
                        <Textarea
                          ref={textareaRef}
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder="Start writing your LinkedIn post...

Tips for viral posts:
• Start with a strong hook (first 2 lines are crucial)
• Use short paragraphs and line breaks
• Add bullet points for readability
• End with a question or CTA"
                          className="min-h-80 sm:min-h-100 border-0 focus-visible:ring-0 resize-none text-base"
                        />

                        {/* Character Counter */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <span className={cn(
                            "text-sm",
                            newPostContent.length > 3000 ? "text-destructive font-medium" : "text-muted-foreground"
                          )}>
                            {newPostContent.length} / 3000
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ~{Math.ceil(newPostContent.length / 200)} min read
                          </span>
                        </div>
                      </CardContent>
                    </Card>

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
                            disabled={!aiInstruction.trim() || isProcessingAI}
                          >
                            {isProcessingAI ? "Processing..." : "Apply Changes"}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* RIGHT SIDE - Settings */}
                  <div className="md:border-l flex flex-col gap-5 w-full md:w-80 lg:w-96 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                    {/* To be planned status box */}
                    <div className="relative bg-white dark:bg-gray-900 border rounded-lg p-4 shadow-sm">
                      <div className="absolute -top-2 left-4 px-3 py-1 bg-white dark:bg-gray-900 border rounded-full shadow-sm">
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
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'date';
                              input.min = new Date().toISOString().split('T')[0];
                              input.value = selectedDay ? `${selectedDay.year}-${String(selectedDay.month + 1).padStart(2, '0')}-${String(selectedDay.day).padStart(2, '0')}` : '';
                              input.onchange = (e) => {
                                const date = new Date((e.target as HTMLInputElement).value);
                                setSelectedDay({ day: date.getDate(), month: date.getMonth(), year: date.getFullYear() });
                              };
                              input.showPicker();
                            }}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm text-left flex items-center justify-between hover:bg-accent transition-colors"
                          >
                            <span>{getFormattedScheduleDate()}</span>
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Time</label>
                          <div className="flex gap-2 items-center">
                            <Select value={scheduleHour} onValueChange={setScheduleHour}>
                              <SelectTrigger className="w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>:</span>
                            <Select value={scheduleMinute} onValueChange={setScheduleMinute}>
                              <SelectTrigger className="w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={scheduleAmPm} onValueChange={(v) => setScheduleAmPm(v as "AM" | "PM")}>
                              <SelectTrigger className="w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AM">AM</SelectItem>
                                <SelectItem value="PM">PM</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={() => handleCreatePost(false)} disabled={!newPostContent.trim() || isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save as Draft"}
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => handleCreatePost(false)} disabled={!newPostContent.trim() || isSaving}>
                        <Calendar className="w-4 h-4 mr-2" />
                        {isSaving ? "Scheduling..." : "Schedule Post"}
                      </Button>
                      <Button className="w-full" onClick={() => handleCreatePost(true)} disabled={!newPostContent.trim() || isSaving}>
                        <Send className="w-4 h-4 mr-2" />
                        Publish Now
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SCHEDULE POST VIEW - Post List */}
            {drawerView === "schedule-post" && !selectedPostToSchedule && (
              <>
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer sm:hidden">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">Schedule a post</h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col w-full h-full min-h-0">
                  <div className="flex w-full justify-between items-center gap-4 flex-wrap p-4 border-b">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search for a post"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-white dark:bg-gray-900"
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
                            onClick={() => setSelectedPostToSchedule(post)}
                            className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors bg-white dark:bg-gray-900 border-gray-200 hover:border-primary"
                          >
                            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                              <h3 className="font-bold truncate">{getPostPreview(post.content, 80)}</h3>
                              <p className="text-sm text-gray-500 flex items-center gap-2">
                                <span>
                                  {post.status === "published" ? "Published" : post.status === "draft" ? "Draft" : "Scheduled"} on {formatShortDate(post.createdAt)}
                                </span>
                              </p>
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
                <div className="py-4 md:pl-10 pl-4 md:pr-8 pr-4 border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedPostToSchedule(null)} className="text-gray-500 hover:text-gray-700 cursor-pointer sm:hidden">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <h2 className="sm:text-2xl text-xl font-semibold">Schedule this post</h2>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer sm:block hidden">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex md:flex-row flex-col w-full h-full min-h-0">
                  <div className="relative flex flex-col min-h-fit md:w-fit w-full bg-[#f4f2ee] dark:bg-gray-800">
                    <div className="pt-10 px-6 lg:px-10 flex flex-col items-start h-full min-h-0 flex-1 overflow-y-auto w-full">
                      <button
                        onClick={() => setSelectedPostToSchedule(null)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to selection
                      </button>
                      <div className="md:w-102.5 w-full bg-white dark:bg-gray-900 rounded-xl border mb-10">
                        <div className="px-4 pt-4 pb-0">
                          <div className="flex w-full justify-between items-start">
                            <div className="flex max-w-[90%] items-start">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-primary font-semibold text-sm">
                                  {session?.user?.name?.charAt(0) || "U"}
                                </span>
                              </div>
                              <div className="flex flex-col ml-2.5">
                                <h3 className="font-semibold">{session?.user?.name || "Your LinkedIn Profile"}</h3>
                                <div className="text-sm text-muted-foreground line-clamp-1">Your headline here</div>
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
                  <div className="md:border-l flex flex-col gap-5 w-full md:w-65 lg:w-90 p-8 pt-10 pb-10 sm:p-10 md:p-6 lg:p-10 overflow-y-auto bg-white dark:bg-gray-900">
                    <div className="relative bg-white dark:bg-gray-900 border rounded-lg p-4 shadow-sm">
                      <div className="absolute -top-2 left-4 px-3 py-1 bg-white dark:bg-gray-900 border rounded-full shadow-sm">
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
                    <div className="flex flex-col gap-4">
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
                          className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Time</label>
                        <div className="flex gap-2 items-center">
                          <Select value={scheduleHour} onValueChange={setScheduleHour}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-lg">:</span>
                          <Select value={scheduleMinute} onValueChange={setScheduleMinute}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={scheduleAmPm} onValueChange={(v) => setScheduleAmPm(v as "AM" | "PM")}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleSchedulePost} disabled={isSaving} className="w-full">
                        <Calendar className="w-4 h-4 mr-2" />
                        {isSaving ? "Scheduling..." : "Schedule the post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
