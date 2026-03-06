"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Lucide icons - comprehensive set
import {
  // Popular
  ArrowRight, Check, Star, Heart, Zap, Target, Lightbulb, TrendingUp, Trophy,
  Rocket, Flame, Crown, ThumbsUp, Sparkles, Award, Medal, Gem, Flag,
  // Business
  Handshake, Briefcase, Building2, PieChart, Users, UserCircle, DollarSign,
  Coins, Wallet, BarChart, BarChart2, BarChart3, LineChart, TrendingDown,
  Banknote, CircleDollarSign, BadgeDollarSign, Receipt, Calculator,
  // Communication
  MessageCircle, MessageSquare, Mail, Bell, Phone, Video, Mic, Share2,
  Send, AtSign, Hash, Quote, MessagesSquare, PhoneCall, PhoneForwarded,
  BellRing, BellOff, MailOpen, Inbox, Forward, Reply, ReplyAll,
  // Tech
  Laptop, Smartphone, Globe, Wifi, Cloud, Database, Code, Terminal,
  Monitor, Tv, Headphones, Speaker, Printer, HardDrive, Cpu, Server,
  CloudUpload, CloudDownload, WifiOff, Bluetooth, Radio, Podcast,
  Binary, Braces, FileCode, Bug, GitBranch, GitCommit, GitMerge,
  // Creative
  Paintbrush, Palette, Camera, Image, Film, Music, Pen, Wand2,
  Brush, PenTool, Pencil, Highlighter, Eraser, Scissors, Crop,
  Images, ImagePlus, FileImage, Video as VideoIcon, Clapperboard, Music2, Music3, Music4,
  // Time
  Clock, Calendar, Hourglass, Timer, History, CalendarCheck,
  CalendarDays, CalendarRange, CalendarPlus, CalendarMinus, CalendarX,
  AlarmClock, Watch, TimerReset, StopCircle, PlayCircle, PauseCircle,
  // Navigation
  Compass, MapPin, Map, Route, Signpost, Home, ExternalLink, Link,
  Navigation, Navigation2, Locate, LocateFixed, LocateOff, Move,
  ArrowUp, ArrowDown, ArrowLeft, ArrowUpRight, ArrowDownRight, ArrowUpLeft,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon,
  ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight,
  // Security
  Shield, Lock, Key, Fingerprint, Eye, EyeOff, ShieldCheck, ShieldAlert,
  ShieldOff, LockOpen, KeyRound, Scan, ScanFace, ScanLine,
  // Growth
  Sprout, ArrowUpRight as ArrowUpRightIcon, Layers, Maximize, Minimize,
  Plus, Minus, PlusCircle, MinusCircle, Percent, TrendingUp as TrendUp,
  Scale, ScaleIcon, Activity, Gauge, Signal, SignalHigh, SignalLow,
  // Learning
  Brain, GraduationCap, Book, BookOpen, School, Library, Bookmark,
  BookMarked, BookCopy, BookText, Notebook, FileText, ScrollText,
  Glasses, Microscope, FlaskConical, TestTube, Atom,
  // Symbols
  Info, HelpCircle, AlertCircle, AlertTriangle, XCircle, CheckCircle,
  X, Menu, MoreHorizontal, MoreVertical, Grip, GripVertical, GripHorizontal,
  Circle, Square, Triangle, Hexagon, Octagon, Pentagon, Diamond, Star as StarIcon,
  // Actions
  Download, Upload, Copy, Trash2, Edit, Save, RefreshCw, RotateCw, RotateCcw,
  Search as SearchIcon, Filter, SortAsc, SortDesc, Bookmark as BookmarkIcon,
  Settings, Play, Pause, SkipForward, SkipBack, FastForward, Rewind,
  Volume, Volume1, Volume2, VolumeX, Maximize2, Minimize2, Expand, Shrink,
  // Weather
  Sun, Moon, CloudRain, Wind, Thermometer, Droplet, Snowflake, CloudSun,
  CloudMoon, CloudLightning, CloudSnow, CloudFog, Umbrella, Rainbow,
  // E-commerce
  ShoppingCart, CreditCard, Package, Truck, Store, Gift, Coffee, ShoppingBag,
  Wallet as WalletIcon, Tag, Tags, Ticket, TicketCheck, Percent as PercentIcon,
  // Files
  FileText as FileTextIcon, Folder, FolderOpen, File, Files, Archive, FolderPlus,
  FolderMinus, FolderClosed, FileUp, FileDown, FileX, FilePlus, FileMinus,
  // Social
  Linkedin, Twitter, Facebook, Instagram, Youtube, Github, Twitch, Slack,
  // People
  User, Users as UsersIcon, UserPlus, UserMinus, UserCheck, UserX,
  Contact, Smile, Frown, Meh, Angry, Heart as HeartIcon, HeartOff,
  // Misc
  Zap as ZapIcon, Power, PowerOff, Battery, BatteryCharging, BatteryFull,
  Plug, PlugZap, Wifi as WifiIcon, Bluetooth as BluetoothIcon,
  type LucideIcon,
} from "lucide-react";

// Font Awesome icons - verified working subset
import {
  FaRocket, FaLightbulb, FaBullseye, FaChartLine, FaTrophy, FaHandshake,
  FaBriefcase, FaBuilding, FaChartPie, FaUsers, FaUserTie, FaDollarSign,
  FaCoins, FaCheckCircle, FaThumbsUp, FaCrown, FaGem, FaAward,
  FaMedal, FaFire, FaFlag, FaComment, FaComments, FaEnvelope, FaBell,
  FaPhone, FaVideo, FaMicrophone, FaShareAlt, FaLaptop, FaMobileAlt,
  FaGlobe, FaWifi, FaCloud, FaDatabase, FaCode, FaPaintBrush,
  FaPalette, FaCamera, FaImage, FaFilm, FaMusic, FaPen, FaMagic, FaClock,
  FaCalendar, FaHourglass, FaStopwatch, FaHistory, FaCalendarCheck, FaCompass,
  FaMapMarkerAlt, FaMap, FaRoute, FaShieldAlt, FaLock, FaKey, FaFingerprint,
  FaEye, FaSeedling, FaArrowUp, FaChartBar, FaLayerGroup, FaExpand,
  FaBrain, FaGraduationCap, FaBook, FaBookOpen, FaSchool, FaQuoteLeft,
  FaHashtag, FaAt, FaPlus, FaMinus, FaQuestion, FaExclamation, FaInfo,
  FaHome, FaCog, FaSearch, FaUser, FaBars, FaTimes, FaChevronDown, FaChevronUp,
  FaExternalLinkAlt, FaDownload, FaUpload, FaCopy, FaTrash, FaEdit, FaSave,
  FaSync, FaPaperPlane, FaLink, FaBookmark, FaFilter, FaTh, FaList,
  FaEllipsisH, FaEllipsisV, FaPlay, FaPause, FaSquare, FaCircle,
  FaSun, FaMoon, FaCloudRain, FaWind, FaThermometerHalf, FaTint,
  FaCoffee, FaGift, FaShoppingCart, FaCreditCard, FaBox, FaTruck, FaStore,
  FaFileAlt, FaFolder, FaFolderOpen, FaFile, FaArchive,
  FaDesktop, FaTv, FaHeadphones, FaVolumeUp, FaPrint, FaHdd,
  FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaYoutube, FaGithub,
  FaHeart, FaStar, FaBolt, FaArrowRight, FaCheck,
} from "react-icons/fa";

// Icon item type
interface IconItem {
  id: string;
  name: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  set: 'lucide' | 'fa';
}

interface IconCategory {
  id: string;
  name: string;
  icons: IconItem[];
}

// Build icon categories with mixed icon sets
const iconCategories: IconCategory[] = [
  {
    id: "popular",
    name: "Popular",
    icons: [
      { id: "l-arrow-right", name: "Arrow", keywords: ["arrow", "right", "next", "forward"], icon: ArrowRight, set: 'lucide' },
      { id: "l-check", name: "Check", keywords: ["check", "done", "complete", "yes"], icon: Check, set: 'lucide' },
      { id: "l-star", name: "Star", keywords: ["star", "favorite", "rating"], icon: Star, set: 'lucide' },
      { id: "l-heart", name: "Heart", keywords: ["heart", "love", "like"], icon: Heart, set: 'lucide' },
      { id: "l-zap", name: "Lightning", keywords: ["zap", "lightning", "power", "energy"], icon: Zap, set: 'lucide' },
      { id: "l-target", name: "Target", keywords: ["target", "goal", "aim", "focus"], icon: Target, set: 'lucide' },
      { id: "l-lightbulb", name: "Idea", keywords: ["idea", "lightbulb", "innovation"], icon: Lightbulb, set: 'lucide' },
      { id: "l-trending-up", name: "Growth", keywords: ["trending", "growth", "analytics"], icon: TrendingUp, set: 'lucide' },
      { id: "l-trophy", name: "Trophy", keywords: ["trophy", "winner", "award"], icon: Trophy, set: 'lucide' },
      { id: "l-rocket", name: "Rocket", keywords: ["rocket", "launch", "startup"], icon: Rocket, set: 'lucide' },
      { id: "l-flame", name: "Fire", keywords: ["fire", "hot", "trending", "flame"], icon: Flame, set: 'lucide' },
      { id: "l-crown", name: "Crown", keywords: ["crown", "king", "premium", "vip"], icon: Crown, set: 'lucide' },
      { id: "l-sparkles", name: "Sparkles", keywords: ["sparkles", "magic", "ai"], icon: Sparkles, set: 'lucide' },
      { id: "l-thumbs-up", name: "Thumbs Up", keywords: ["like", "approve", "good"], icon: ThumbsUp, set: 'lucide' },
      { id: "fa-rocket", name: "Rocket", keywords: ["rocket", "launch"], icon: FaRocket, set: 'fa' },
      { id: "fa-bolt", name: "Bolt", keywords: ["lightning", "fast", "power"], icon: FaBolt, set: 'fa' },
    ],
  },
  {
    id: "business",
    name: "Business",
    icons: [
      { id: "l-handshake", name: "Handshake", keywords: ["handshake", "deal", "partnership"], icon: Handshake, set: 'lucide' },
      { id: "l-briefcase", name: "Briefcase", keywords: ["briefcase", "business", "work"], icon: Briefcase, set: 'lucide' },
      { id: "l-building", name: "Building", keywords: ["building", "office", "company"], icon: Building2, set: 'lucide' },
      { id: "l-pie-chart", name: "Pie Chart", keywords: ["chart", "pie", "statistics"], icon: PieChart, set: 'lucide' },
      { id: "l-users", name: "Team", keywords: ["users", "team", "group", "people"], icon: Users, set: 'lucide' },
      { id: "l-user-circle", name: "Professional", keywords: ["user", "professional", "executive"], icon: UserCircle, set: 'lucide' },
      { id: "l-dollar", name: "Dollar", keywords: ["dollar", "money", "finance"], icon: DollarSign, set: 'lucide' },
      { id: "l-coins", name: "Coins", keywords: ["coins", "money", "savings"], icon: Coins, set: 'lucide' },
      { id: "l-wallet", name: "Wallet", keywords: ["wallet", "money", "payment"], icon: Wallet, set: 'lucide' },
      { id: "l-bar-chart", name: "Bar Chart", keywords: ["chart", "analytics", "stats"], icon: BarChart3, set: 'lucide' },
      { id: "l-line-chart", name: "Line Chart", keywords: ["chart", "growth", "trend"], icon: LineChart, set: 'lucide' },
      { id: "l-banknote", name: "Banknote", keywords: ["money", "cash", "bill"], icon: Banknote, set: 'lucide' },
      { id: "fa-chart-line", name: "Chart Line", keywords: ["chart", "growth", "analytics"], icon: FaChartLine, set: 'fa' },
      { id: "fa-user-tie", name: "Executive", keywords: ["user", "tie", "business", "ceo"], icon: FaUserTie, set: 'fa' },
      { id: "fa-building", name: "Building", keywords: ["office", "company"], icon: FaBuilding, set: 'fa' },
      { id: "fa-chart-pie", name: "Pie Chart", keywords: ["chart", "data", "analytics"], icon: FaChartPie, set: 'fa' },
    ],
  },
  {
    id: "success",
    name: "Success",
    icons: [
      { id: "l-check-circle", name: "Done", keywords: ["done", "complete", "success"], icon: CheckCircle, set: 'lucide' },
      { id: "l-thumbs-up2", name: "Like", keywords: ["like", "thumbs", "approve"], icon: ThumbsUp, set: 'lucide' },
      { id: "l-crown2", name: "Crown", keywords: ["crown", "king", "premium"], icon: Crown, set: 'lucide' },
      { id: "l-gem", name: "Gem", keywords: ["gem", "diamond", "premium"], icon: Gem, set: 'lucide' },
      { id: "l-award", name: "Award", keywords: ["award", "badge", "achievement"], icon: Award, set: 'lucide' },
      { id: "l-medal", name: "Medal", keywords: ["medal", "winner", "achievement"], icon: Medal, set: 'lucide' },
      { id: "l-rocket2", name: "Rocket", keywords: ["rocket", "launch", "startup"], icon: Rocket, set: 'lucide' },
      { id: "l-flame2", name: "Fire", keywords: ["fire", "hot", "trending"], icon: Flame, set: 'lucide' },
      { id: "l-flag", name: "Flag", keywords: ["flag", "milestone", "goal"], icon: Flag, set: 'lucide' },
      { id: "fa-trophy", name: "Trophy", keywords: ["trophy", "winner", "champion"], icon: FaTrophy, set: 'fa' },
      { id: "fa-crown", name: "Crown", keywords: ["crown", "royal", "vip"], icon: FaCrown, set: 'fa' },
      { id: "fa-gem", name: "Gem", keywords: ["gem", "diamond", "precious"], icon: FaGem, set: 'fa' },
      { id: "fa-award", name: "Award", keywords: ["award", "ribbon", "prize"], icon: FaAward, set: 'fa' },
      { id: "fa-medal", name: "Medal", keywords: ["medal", "achievement"], icon: FaMedal, set: 'fa' },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    icons: [
      { id: "l-message-circle", name: "Chat", keywords: ["chat", "message", "comment"], icon: MessageCircle, set: 'lucide' },
      { id: "l-message-square", name: "Message", keywords: ["message", "comment", "chat"], icon: MessageSquare, set: 'lucide' },
      { id: "l-mail", name: "Email", keywords: ["email", "mail", "envelope"], icon: Mail, set: 'lucide' },
      { id: "l-bell", name: "Bell", keywords: ["bell", "notification", "alert"], icon: Bell, set: 'lucide' },
      { id: "l-phone", name: "Phone", keywords: ["phone", "call", "contact"], icon: Phone, set: 'lucide' },
      { id: "l-video", name: "Video", keywords: ["video", "call", "meeting"], icon: Video, set: 'lucide' },
      { id: "l-mic", name: "Microphone", keywords: ["microphone", "voice", "audio"], icon: Mic, set: 'lucide' },
      { id: "l-share", name: "Share", keywords: ["share", "social", "network"], icon: Share2, set: 'lucide' },
      { id: "l-send", name: "Send", keywords: ["send", "message", "paper plane"], icon: Send, set: 'lucide' },
      { id: "l-at", name: "At", keywords: ["at", "mention", "email"], icon: AtSign, set: 'lucide' },
      { id: "l-hash", name: "Hashtag", keywords: ["hashtag", "tag", "social"], icon: Hash, set: 'lucide' },
      { id: "fa-comments", name: "Comments", keywords: ["comments", "discussion"], icon: FaComments, set: 'fa' },
      { id: "fa-envelope", name: "Envelope", keywords: ["email", "mail", "letter"], icon: FaEnvelope, set: 'fa' },
      { id: "fa-paper-plane", name: "Paper Plane", keywords: ["send", "message"], icon: FaPaperPlane, set: 'fa' },
    ],
  },
  {
    id: "tech",
    name: "Technology",
    icons: [
      { id: "l-laptop", name: "Laptop", keywords: ["laptop", "computer", "device"], icon: Laptop, set: 'lucide' },
      { id: "l-smartphone", name: "Mobile", keywords: ["mobile", "phone", "smartphone"], icon: Smartphone, set: 'lucide' },
      { id: "l-globe", name: "Globe", keywords: ["globe", "world", "internet"], icon: Globe, set: 'lucide' },
      { id: "l-wifi", name: "WiFi", keywords: ["wifi", "wireless", "internet"], icon: Wifi, set: 'lucide' },
      { id: "l-cloud", name: "Cloud", keywords: ["cloud", "storage", "online"], icon: Cloud, set: 'lucide' },
      { id: "l-database", name: "Database", keywords: ["database", "data", "storage"], icon: Database, set: 'lucide' },
      { id: "l-code", name: "Code", keywords: ["code", "programming", "developer"], icon: Code, set: 'lucide' },
      { id: "l-terminal", name: "Terminal", keywords: ["terminal", "command", "cli"], icon: Terminal, set: 'lucide' },
      { id: "l-monitor", name: "Monitor", keywords: ["monitor", "screen", "display"], icon: Monitor, set: 'lucide' },
      { id: "l-cpu", name: "CPU", keywords: ["cpu", "processor", "chip"], icon: Cpu, set: 'lucide' },
      { id: "l-server", name: "Server", keywords: ["server", "hosting", "backend"], icon: Server, set: 'lucide' },
      { id: "fa-database", name: "Database", keywords: ["database", "server", "data"], icon: FaDatabase, set: 'fa' },
      { id: "fa-code", name: "Code", keywords: ["code", "programming"], icon: FaCode, set: 'fa' },
      { id: "fa-laptop", name: "Laptop", keywords: ["laptop", "computer"], icon: FaLaptop, set: 'fa' },
    ],
  },
  {
    id: "creative",
    name: "Creative",
    icons: [
      { id: "l-paintbrush", name: "Paintbrush", keywords: ["paintbrush", "art", "design"], icon: Paintbrush, set: 'lucide' },
      { id: "l-palette", name: "Palette", keywords: ["palette", "colors", "design"], icon: Palette, set: 'lucide' },
      { id: "l-camera", name: "Camera", keywords: ["camera", "photo", "picture"], icon: Camera, set: 'lucide' },
      { id: "l-image", name: "Image", keywords: ["image", "photo", "picture"], icon: Image, set: 'lucide' },
      { id: "l-film", name: "Film", keywords: ["film", "video", "movie"], icon: Film, set: 'lucide' },
      { id: "l-music", name: "Music", keywords: ["music", "audio", "song"], icon: Music, set: 'lucide' },
      { id: "l-pen", name: "Pen", keywords: ["pen", "write", "edit"], icon: Pen, set: 'lucide' },
      { id: "l-wand", name: "Magic", keywords: ["magic", "wand", "sparkles"], icon: Wand2, set: 'lucide' },
      { id: "l-brush", name: "Brush", keywords: ["brush", "paint", "art"], icon: Brush, set: 'lucide' },
      { id: "l-pencil", name: "Pencil", keywords: ["pencil", "write", "draw"], icon: Pencil, set: 'lucide' },
      { id: "l-scissors", name: "Scissors", keywords: ["scissors", "cut", "edit"], icon: Scissors, set: 'lucide' },
      { id: "fa-magic", name: "Magic Wand", keywords: ["magic", "wand", "sparkle"], icon: FaMagic, set: 'fa' },
      { id: "fa-paint-brush", name: "Paint Brush", keywords: ["paint", "brush", "art"], icon: FaPaintBrush, set: 'fa' },
      { id: "fa-camera", name: "Camera", keywords: ["camera", "photo"], icon: FaCamera, set: 'fa' },
    ],
  },
  {
    id: "time",
    name: "Time & Schedule",
    icons: [
      { id: "l-clock", name: "Clock", keywords: ["clock", "time", "hour"], icon: Clock, set: 'lucide' },
      { id: "l-calendar", name: "Calendar", keywords: ["calendar", "date", "schedule"], icon: Calendar, set: 'lucide' },
      { id: "l-hourglass", name: "Hourglass", keywords: ["hourglass", "time", "waiting"], icon: Hourglass, set: 'lucide' },
      { id: "l-timer", name: "Timer", keywords: ["timer", "stopwatch", "speed"], icon: Timer, set: 'lucide' },
      { id: "l-history", name: "History", keywords: ["history", "past", "time"], icon: History, set: 'lucide' },
      { id: "l-calendar-check", name: "Calendar Check", keywords: ["calendar", "check", "confirmed"], icon: CalendarCheck, set: 'lucide' },
      { id: "l-alarm", name: "Alarm", keywords: ["alarm", "clock", "wake"], icon: AlarmClock, set: 'lucide' },
      { id: "l-watch", name: "Watch", keywords: ["watch", "time", "wrist"], icon: Watch, set: 'lucide' },
      { id: "fa-stopwatch", name: "Stopwatch", keywords: ["stopwatch", "timer", "fast"], icon: FaStopwatch, set: 'fa' },
      { id: "fa-clock", name: "Clock", keywords: ["clock", "time"], icon: FaClock, set: 'fa' },
      { id: "fa-calendar", name: "Calendar", keywords: ["calendar", "date"], icon: FaCalendar, set: 'fa' },
      { id: "fa-history", name: "History", keywords: ["history", "rewind"], icon: FaHistory, set: 'fa' },
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    icons: [
      { id: "l-compass", name: "Compass", keywords: ["compass", "direction", "navigation"], icon: Compass, set: 'lucide' },
      { id: "l-map-pin", name: "Location", keywords: ["location", "pin", "map"], icon: MapPin, set: 'lucide' },
      { id: "l-map", name: "Map", keywords: ["map", "location", "navigate"], icon: Map, set: 'lucide' },
      { id: "l-route", name: "Route", keywords: ["route", "path", "journey"], icon: Route, set: 'lucide' },
      { id: "l-signpost", name: "Signpost", keywords: ["signpost", "direction", "guide"], icon: Signpost, set: 'lucide' },
      { id: "l-home", name: "Home", keywords: ["home", "house", "main"], icon: Home, set: 'lucide' },
      { id: "l-external-link", name: "External Link", keywords: ["external", "link", "open"], icon: ExternalLink, set: 'lucide' },
      { id: "l-link", name: "Link", keywords: ["link", "chain", "url"], icon: Link, set: 'lucide' },
      { id: "l-navigation", name: "Navigation", keywords: ["navigation", "direction", "arrow"], icon: Navigation, set: 'lucide' },
      { id: "fa-map", name: "Map Alt", keywords: ["map", "location", "world"], icon: FaMap, set: 'fa' },
      { id: "fa-compass", name: "Compass", keywords: ["compass", "direction"], icon: FaCompass, set: 'fa' },
      { id: "fa-home", name: "Home", keywords: ["home", "house"], icon: FaHome, set: 'fa' },
    ],
  },
  {
    id: "security",
    name: "Security",
    icons: [
      { id: "l-shield", name: "Shield", keywords: ["shield", "security", "protection"], icon: Shield, set: 'lucide' },
      { id: "l-shield-check", name: "Shield Check", keywords: ["shield", "verified", "secure"], icon: ShieldCheck, set: 'lucide' },
      { id: "l-lock", name: "Lock", keywords: ["lock", "secure", "password"], icon: Lock, set: 'lucide' },
      { id: "l-lock-open", name: "Unlock", keywords: ["unlock", "open", "access"], icon: LockOpen, set: 'lucide' },
      { id: "l-key", name: "Key", keywords: ["key", "access", "unlock"], icon: Key, set: 'lucide' },
      { id: "l-fingerprint", name: "Fingerprint", keywords: ["fingerprint", "biometric"], icon: Fingerprint, set: 'lucide' },
      { id: "l-eye", name: "Eye", keywords: ["eye", "view", "watch"], icon: Eye, set: 'lucide' },
      { id: "l-eye-off", name: "Eye Off", keywords: ["eye", "hidden", "private"], icon: EyeOff, set: 'lucide' },
      { id: "fa-shield", name: "Shield Alt", keywords: ["shield", "security", "defense"], icon: FaShieldAlt, set: 'fa' },
      { id: "fa-lock", name: "Lock", keywords: ["lock", "secure"], icon: FaLock, set: 'fa' },
      { id: "fa-key", name: "Key", keywords: ["key", "access"], icon: FaKey, set: 'fa' },
      { id: "fa-eye", name: "Eye", keywords: ["eye", "view"], icon: FaEye, set: 'fa' },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    icons: [
      { id: "l-sprout", name: "Seedling", keywords: ["seedling", "growth", "plant"], icon: Sprout, set: 'lucide' },
      { id: "l-arrow-up-right", name: "Trend Up", keywords: ["trend", "up", "growth"], icon: ArrowUpRightIcon, set: 'lucide' },
      { id: "l-bar-chart2", name: "Bar Chart", keywords: ["chart", "bar", "statistics"], icon: BarChart3, set: 'lucide' },
      { id: "l-layers", name: "Layers", keywords: ["layers", "stack", "levels"], icon: Layers, set: 'lucide' },
      { id: "l-maximize", name: "Expand", keywords: ["expand", "grow", "enlarge"], icon: Maximize, set: 'lucide' },
      { id: "l-trending-up2", name: "Trending", keywords: ["trending", "growth", "increase"], icon: TrendingUp, set: 'lucide' },
      { id: "l-activity", name: "Activity", keywords: ["activity", "pulse", "health"], icon: Activity, set: 'lucide' },
      { id: "l-gauge", name: "Gauge", keywords: ["gauge", "meter", "speed"], icon: Gauge, set: 'lucide' },
      { id: "fa-seedling", name: "Seedling", keywords: ["seedling", "plant", "organic"], icon: FaSeedling, set: 'fa' },
      { id: "fa-chart-bar", name: "Chart Bar", keywords: ["chart", "bar", "data"], icon: FaChartBar, set: 'fa' },
      { id: "fa-expand", name: "Expand", keywords: ["expand", "grow", "fullscreen"], icon: FaExpand, set: 'fa' },
      { id: "fa-layer-group", name: "Layers", keywords: ["layers", "stack"], icon: FaLayerGroup, set: 'fa' },
    ],
  },
  {
    id: "learning",
    name: "Learning",
    icons: [
      { id: "l-brain", name: "Brain", keywords: ["brain", "think", "mind"], icon: Brain, set: 'lucide' },
      { id: "l-graduation", name: "Graduation", keywords: ["graduation", "education", "degree"], icon: GraduationCap, set: 'lucide' },
      { id: "l-book", name: "Book", keywords: ["book", "read", "learn"], icon: Book, set: 'lucide' },
      { id: "l-book-open", name: "Book Open", keywords: ["book", "reading", "study"], icon: BookOpen, set: 'lucide' },
      { id: "l-school", name: "School", keywords: ["school", "education", "building"], icon: School, set: 'lucide' },
      { id: "l-library", name: "Library", keywords: ["library", "books", "knowledge"], icon: Library, set: 'lucide' },
      { id: "l-glasses", name: "Glasses", keywords: ["glasses", "read", "vision"], icon: Glasses, set: 'lucide' },
      { id: "l-microscope", name: "Microscope", keywords: ["microscope", "science", "research"], icon: Microscope, set: 'lucide' },
      { id: "fa-brain", name: "Brain Alt", keywords: ["brain", "intelligence", "smart"], icon: FaBrain, set: 'fa' },
      { id: "fa-graduation", name: "Graduation Cap", keywords: ["graduation", "cap", "degree"], icon: FaGraduationCap, set: 'fa' },
      { id: "fa-book", name: "Book", keywords: ["book", "read"], icon: FaBook, set: 'fa' },
      { id: "fa-school", name: "School", keywords: ["school", "education"], icon: FaSchool, set: 'fa' },
    ],
  },
  {
    id: "social",
    name: "Social Media",
    icons: [
      { id: "l-linkedin", name: "LinkedIn", keywords: ["linkedin", "social", "professional"], icon: Linkedin, set: 'lucide' },
      { id: "l-twitter", name: "Twitter", keywords: ["twitter", "social", "x"], icon: Twitter, set: 'lucide' },
      { id: "l-facebook", name: "Facebook", keywords: ["facebook", "social", "meta"], icon: Facebook, set: 'lucide' },
      { id: "l-instagram", name: "Instagram", keywords: ["instagram", "social", "photo"], icon: Instagram, set: 'lucide' },
      { id: "l-youtube", name: "YouTube", keywords: ["youtube", "video", "social"], icon: Youtube, set: 'lucide' },
      { id: "l-github", name: "GitHub", keywords: ["github", "code", "developer"], icon: Github, set: 'lucide' },
      { id: "l-twitch", name: "Twitch", keywords: ["twitch", "streaming", "gaming"], icon: Twitch, set: 'lucide' },
      { id: "fa-linkedin", name: "LinkedIn", keywords: ["linkedin", "professional"], icon: FaLinkedin, set: 'fa' },
      { id: "fa-twitter", name: "Twitter", keywords: ["twitter", "x", "social"], icon: FaTwitter, set: 'fa' },
      { id: "fa-facebook", name: "Facebook", keywords: ["facebook", "meta"], icon: FaFacebook, set: 'fa' },
      { id: "fa-instagram", name: "Instagram", keywords: ["instagram", "photos"], icon: FaInstagram, set: 'fa' },
      { id: "fa-youtube", name: "YouTube", keywords: ["youtube", "video"], icon: FaYoutube, set: 'fa' },
    ],
  },
  {
    id: "actions",
    name: "Actions",
    icons: [
      { id: "l-download", name: "Download", keywords: ["download", "save", "get"], icon: Download, set: 'lucide' },
      { id: "l-upload", name: "Upload", keywords: ["upload", "send", "share"], icon: Upload, set: 'lucide' },
      { id: "l-copy", name: "Copy", keywords: ["copy", "duplicate", "clone"], icon: Copy, set: 'lucide' },
      { id: "l-trash", name: "Delete", keywords: ["trash", "delete", "remove"], icon: Trash2, set: 'lucide' },
      { id: "l-edit", name: "Edit", keywords: ["edit", "pencil", "modify"], icon: Edit, set: 'lucide' },
      { id: "l-save", name: "Save", keywords: ["save", "disk", "store"], icon: Save, set: 'lucide' },
      { id: "l-refresh", name: "Refresh", keywords: ["refresh", "reload", "sync"], icon: RefreshCw, set: 'lucide' },
      { id: "l-search", name: "Search", keywords: ["search", "find", "look"], icon: SearchIcon, set: 'lucide' },
      { id: "l-filter", name: "Filter", keywords: ["filter", "sort", "funnel"], icon: Filter, set: 'lucide' },
      { id: "l-bookmark", name: "Bookmark", keywords: ["bookmark", "save", "favorite"], icon: BookmarkIcon, set: 'lucide' },
      { id: "l-settings", name: "Settings", keywords: ["settings", "gear", "config"], icon: Settings, set: 'lucide' },
      { id: "l-play", name: "Play", keywords: ["play", "start", "video"], icon: Play, set: 'lucide' },
      { id: "fa-download", name: "Download", keywords: ["download", "save"], icon: FaDownload, set: 'fa' },
      { id: "fa-sync", name: "Sync", keywords: ["sync", "refresh", "reload"], icon: FaSync, set: 'fa' },
    ],
  },
  {
    id: "symbols",
    name: "Symbols",
    icons: [
      { id: "l-quote", name: "Quote", keywords: ["quote", "speech", "citation"], icon: Quote, set: 'lucide' },
      { id: "l-hash2", name: "Hashtag", keywords: ["hashtag", "tag", "social"], icon: Hash, set: 'lucide' },
      { id: "l-at2", name: "At", keywords: ["at", "email", "mention"], icon: AtSign, set: 'lucide' },
      { id: "l-plus", name: "Plus", keywords: ["plus", "add", "new"], icon: Plus, set: 'lucide' },
      { id: "l-minus", name: "Minus", keywords: ["minus", "remove", "subtract"], icon: Minus, set: 'lucide' },
      { id: "l-help", name: "Question", keywords: ["question", "help", "faq"], icon: HelpCircle, set: 'lucide' },
      { id: "l-alert", name: "Alert", keywords: ["alert", "warning", "exclamation"], icon: AlertCircle, set: 'lucide' },
      { id: "l-info", name: "Info", keywords: ["info", "information", "about"], icon: Info, set: 'lucide' },
      { id: "l-x", name: "Close", keywords: ["close", "x", "cancel"], icon: X, set: 'lucide' },
      { id: "l-menu", name: "Menu", keywords: ["menu", "hamburger", "bars"], icon: Menu, set: 'lucide' },
      { id: "l-more-h", name: "More", keywords: ["more", "dots", "options"], icon: MoreHorizontal, set: 'lucide' },
      { id: "l-chevron-down", name: "Chevron Down", keywords: ["chevron", "down", "arrow"], icon: ChevronDown, set: 'lucide' },
      { id: "fa-quote-left", name: "Quote", keywords: ["quote", "citation"], icon: FaQuoteLeft, set: 'fa' },
      { id: "fa-hashtag", name: "Hashtag", keywords: ["hashtag", "tag"], icon: FaHashtag, set: 'fa' },
    ],
  },
  {
    id: "shapes",
    name: "Shapes",
    icons: [
      { id: "l-square", name: "Square", keywords: ["square", "box", "rectangle"], icon: Square, set: 'lucide' },
      { id: "l-circle", name: "Circle", keywords: ["circle", "round", "dot"], icon: Circle, set: 'lucide' },
      { id: "l-triangle", name: "Triangle", keywords: ["triangle", "shape", "point"], icon: Triangle, set: 'lucide' },
      { id: "l-hexagon", name: "Hexagon", keywords: ["hexagon", "shape", "6 sides"], icon: Hexagon, set: 'lucide' },
      { id: "l-octagon", name: "Octagon", keywords: ["octagon", "shape", "8 sides"], icon: Octagon, set: 'lucide' },
      { id: "l-pentagon", name: "Pentagon", keywords: ["pentagon", "shape", "5 sides"], icon: Pentagon, set: 'lucide' },
      { id: "l-diamond", name: "Diamond", keywords: ["diamond", "shape", "rhombus"], icon: Diamond, set: 'lucide' },
      { id: "l-star2", name: "Star", keywords: ["star", "shape", "favorite"], icon: StarIcon, set: 'lucide' },
      { id: "fa-square", name: "Square", keywords: ["square", "box"], icon: FaSquare, set: 'fa' },
      { id: "fa-circle", name: "Circle", keywords: ["circle", "round"], icon: FaCircle, set: 'fa' },
    ],
  },
  {
    id: "weather",
    name: "Weather",
    icons: [
      { id: "l-sun", name: "Sun", keywords: ["sun", "bright", "day"], icon: Sun, set: 'lucide' },
      { id: "l-moon", name: "Moon", keywords: ["moon", "night", "dark"], icon: Moon, set: 'lucide' },
      { id: "l-cloud-rain", name: "Rain", keywords: ["rain", "cloud", "weather"], icon: CloudRain, set: 'lucide' },
      { id: "l-wind", name: "Wind", keywords: ["wind", "air", "blow"], icon: Wind, set: 'lucide' },
      { id: "l-thermometer", name: "Temperature", keywords: ["thermometer", "temperature", "hot"], icon: Thermometer, set: 'lucide' },
      { id: "l-droplet", name: "Water", keywords: ["droplet", "water", "drop"], icon: Droplet, set: 'lucide' },
      { id: "l-snowflake", name: "Snow", keywords: ["snowflake", "winter", "cold"], icon: Snowflake, set: 'lucide' },
      { id: "l-cloud-sun", name: "Cloudy", keywords: ["cloud", "sun", "partly"], icon: CloudSun, set: 'lucide' },
      { id: "fa-sun", name: "Sun", keywords: ["sun", "sunny", "bright"], icon: FaSun, set: 'fa' },
      { id: "fa-moon", name: "Moon", keywords: ["moon", "night", "crescent"], icon: FaMoon, set: 'fa' },
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    icons: [
      { id: "l-shopping-cart", name: "Cart", keywords: ["cart", "shopping", "buy"], icon: ShoppingCart, set: 'lucide' },
      { id: "l-credit-card", name: "Credit Card", keywords: ["credit", "card", "payment"], icon: CreditCard, set: 'lucide' },
      { id: "l-package", name: "Package", keywords: ["package", "box", "delivery"], icon: Package, set: 'lucide' },
      { id: "l-truck", name: "Truck", keywords: ["truck", "delivery", "shipping"], icon: Truck, set: 'lucide' },
      { id: "l-store", name: "Store", keywords: ["store", "shop", "retail"], icon: Store, set: 'lucide' },
      { id: "l-gift", name: "Gift", keywords: ["gift", "present", "box"], icon: Gift, set: 'lucide' },
      { id: "l-coffee", name: "Coffee", keywords: ["coffee", "cup", "drink"], icon: Coffee, set: 'lucide' },
      { id: "l-tag", name: "Tag", keywords: ["tag", "price", "label"], icon: Tag, set: 'lucide' },
      { id: "fa-shopping-cart", name: "Shopping Cart", keywords: ["shopping", "cart", "basket"], icon: FaShoppingCart, set: 'fa' },
      { id: "fa-store", name: "Store", keywords: ["store", "shop", "building"], icon: FaStore, set: 'fa' },
      { id: "fa-gift", name: "Gift", keywords: ["gift", "present"], icon: FaGift, set: 'fa' },
      { id: "fa-truck", name: "Truck", keywords: ["truck", "delivery"], icon: FaTruck, set: 'fa' },
    ],
  },
  {
    id: "files",
    name: "Files & Folders",
    icons: [
      { id: "l-file-text", name: "Document", keywords: ["document", "file", "text"], icon: FileTextIcon, set: 'lucide' },
      { id: "l-folder", name: "Folder", keywords: ["folder", "directory", "files"], icon: Folder, set: 'lucide' },
      { id: "l-folder-open", name: "Folder Open", keywords: ["folder", "open", "directory"], icon: FolderOpen, set: 'lucide' },
      { id: "l-file", name: "File", keywords: ["file", "document", "page"], icon: File, set: 'lucide' },
      { id: "l-files", name: "Files", keywords: ["files", "documents", "multiple"], icon: Files, set: 'lucide' },
      { id: "l-archive", name: "Archive", keywords: ["archive", "zip", "compress"], icon: Archive, set: 'lucide' },
      { id: "l-folder-plus", name: "Folder Plus", keywords: ["folder", "new", "create"], icon: FolderPlus, set: 'lucide' },
      { id: "l-file-plus", name: "File Plus", keywords: ["file", "new", "create"], icon: FilePlus, set: 'lucide' },
      { id: "fa-file-alt", name: "File Alt", keywords: ["file", "document", "text"], icon: FaFileAlt, set: 'fa' },
      { id: "fa-folder", name: "Folder", keywords: ["folder", "directory"], icon: FaFolder, set: 'fa' },
      { id: "fa-archive", name: "Archive", keywords: ["archive", "box"], icon: FaArchive, set: 'fa' },
    ],
  },
];

// Get all icons flattened
const allIcons = iconCategories.flatMap(cat => cat.icons);

// Popular icons for quick access (first 9 from popular category)
const popularIcons = iconCategories.find(cat => cat.id === "popular")?.icons.slice(0, 9) || [];

interface IconPickerProps {
  onSelectIcon: (IconComponent: React.ComponentType<{ className?: string; style?: React.CSSProperties }>, iconName: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Batch size for lazy loading "All" tab
const ICONS_PER_BATCH = 48;

export function IconPicker({ onSelectIcon, open: controlledOpen, onOpenChange }: IconPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Lazy loading state for "All" tab
  const [loadedCount, setLoadedCount] = useState(ICONS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset loaded count when opening or switching tabs
  useEffect(() => {
    if (open) {
      setLoadedCount(ICONS_PER_BATCH);
    }
  }, [open, activeCategory]);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search.trim()) {
      if (activeCategory === 'all') {
        return allIcons.slice(0, loadedCount);
      }
      return iconCategories.find(cat => cat.id === activeCategory)?.icons || [];
    }

    const searchLower = search.toLowerCase();
    return allIcons.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.keywords.some(kw => kw.includes(searchLower))
    );
  }, [search, activeCategory, loadedCount]);

  // Check if there are more icons to load
  const hasMoreIcons = activeCategory === 'all' && !search.trim() && loadedCount < allIcons.length;

  // Load more icons
  const loadMoreIcons = useCallback(() => {
    if (isLoadingMore || !hasMoreIcons) return;
    setIsLoadingMore(true);
    // Simulate async loading for smooth UX
    setTimeout(() => {
      setLoadedCount(prev => Math.min(prev + ICONS_PER_BATCH, allIcons.length));
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, hasMoreIcons]);

  // Handle scroll for lazy loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (activeCategory !== 'all' || search.trim()) return;
    const target = e.target as HTMLDivElement;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (scrollBottom < 200) {
      loadMoreIcons();
    }
  }, [activeCategory, search, loadMoreIcons]);

  const handleSelectIcon = useCallback((item: IconItem) => {
    onSelectIcon(item.icon, item.name);
    setOpen(false);
    setSearch("");
  }, [onSelectIcon, setOpen]);

  // Don't render anything if not open (controlled mode, no trigger button)
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-cyan-600" />
            Choose an Icon
            <span className="text-xs font-normal text-muted-foreground ml-2">
              {allIcons.length}+ icons available
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search icons... (e.g., rocket, chart, user)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Categories and Icons */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {!search.trim() ? (
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="h-full flex flex-col">
              {/* Category tabs with horizontal scroll */}
              <div className="flex-shrink-0 overflow-x-auto pb-2 scrollbar-thin">
                <TabsList className="inline-flex h-auto py-1.5 px-1 gap-1 min-w-max">
                  <TabsTrigger
                    value="all"
                    className="text-xs px-3 py-1.5 whitespace-nowrap"
                  >
                    All
                  </TabsTrigger>
                  {iconCategories.map(cat => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="text-xs px-3 py-1.5 whitespace-nowrap"
                    >
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* All icons tab with lazy loading */}
              <TabsContent value="all" className="flex-1 mt-2 overflow-hidden">
                <ScrollArea className="h-[320px]" onScrollCapture={handleScroll}>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-1">
                    {filteredIcons.map(item => {
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectIcon(item)}
                          className={cn(
                            "p-3 rounded-lg border border-input bg-background flex flex-col items-center gap-1.5",
                            "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                            "transition-all duration-150 cursor-pointer group"
                          )}
                          title={item.name}
                        >
                          <IconComponent className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {hasMoreIcons && (
                    <div className="flex justify-center py-4">
                      {isLoadingMore ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadMoreIcons}
                          className="text-xs"
                        >
                          Load more ({allIcons.length - loadedCount} remaining)
                        </Button>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {iconCategories.map(cat => (
                <TabsContent key={cat.id} value={cat.id} className="flex-1 mt-2 overflow-hidden">
                  <ScrollArea className="h-[320px]">
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-1">
                      {cat.icons.map(item => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectIcon(item)}
                            className={cn(
                              "p-3 rounded-lg border border-input bg-background flex flex-col items-center gap-1.5",
                              "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                              "transition-all duration-150 cursor-pointer group"
                            )}
                            title={item.name}
                          >
                            <IconComponent className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                              {item.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <ScrollArea className="h-[380px] mt-2">
              {filteredIcons.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground mb-3 px-1">
                    Found {filteredIcons.length} icons matching "{search}"
                  </p>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-1">
                    {filteredIcons.map(item => {
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectIcon(item)}
                          className={cn(
                            "p-3 rounded-lg border border-input bg-background flex flex-col items-center gap-1.5",
                            "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                            "transition-all duration-150 cursor-pointer group"
                          )}
                          title={item.name}
                        >
                          <IconComponent className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No icons found for "{search}"</p>
                  <p className="text-xs text-muted-foreground mt-2">Try searching for: rocket, chart, user, star, heart...</p>
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <div className="pt-2 border-t border-border text-xs text-muted-foreground text-center">
          Click on an icon to add it to the canvas
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick icons component for the toolbar
interface QuickIconsProps {
  onSelectIcon: (IconComponent: React.ComponentType<{ className?: string; style?: React.CSSProperties }>, iconName: string) => void;
  onOpenFullPicker: () => void;
  onDragIcon?: (iconId: string, iconName: string, e: React.DragEvent) => void;
}

export function QuickIcons({ onSelectIcon, onOpenFullPicker, onDragIcon }: QuickIconsProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {popularIcons.map(item => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              draggable
              onDragStart={(e) => {
                // Set drag data for icon
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'icon',
                  data: { iconId: item.id, iconName: item.name }
                }));
                e.dataTransfer.effectAllowed = 'copy';
                onDragIcon?.(item.id, item.name, e);
              }}
              onClick={() => onSelectIcon(item.icon, item.name)}
              className={cn(
                "h-auto py-2.5 flex flex-col items-center gap-0.5 rounded-md border border-input bg-background text-sm",
                "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950",
                "cursor-grab active:cursor-grabbing transition-all duration-150 group"
              )}
              title={item.name}
            >
              <IconComponent className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-[10px]">{item.name}</span>
            </button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={onOpenFullPicker}
      >
        <ChevronRight className="w-3 h-3 mr-1" />
        Browse All Icons
      </Button>
    </div>
  );
}

// Export a function to get icon by ID
export function getIconById(iconId: string): IconItem | undefined {
  return allIcons.find(icon => icon.id === iconId);
}

export { iconCategories, allIcons, popularIcons };
export type { IconItem, IconCategory };
