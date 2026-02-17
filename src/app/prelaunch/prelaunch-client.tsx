"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Loader2,
  Check,
  Clock,
  Users,
  Rocket,
  Play,
  Pause,
  ChevronDown,
  Zap,
  Target,
  Brain,
  Sparkles,
  TrendingUp,
  BarChart3,
  X,
  Star,
  Calendar,
  FileText,
  Globe,
  Key,
  Shield,
  RefreshCw,
  Gift,
  CircleDollarSign,
  Award,
  Crown,
  BadgeCheck,
  Heart,
  ThumbsUp,
  Eye,
  MessageCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PrelaunchHeader } from "@/components/prelaunch/prelaunch-header";
import { PrelaunchFooter } from "@/components/prelaunch/prelaunch-footer";
import { YouTubePlayer } from "@/components/youtube-player";

const ActivityToast = dynamic(
  () => import("@/components/prelaunch/activity-toast").then((m) => m.ActivityToast),
  { ssr: false }
);
const ExitIntentPopup = dynamic(
  () => import("@/components/prelaunch/exit-intent-popup").then((m) => m.ExitIntentPopup),
  { ssr: false }
);

// Translations type
export interface PrelaunchTranslations {
  hero: {
    badge: string;
    spotsLeft: string;
    headline1: string;
    headline2: string;
    description: string;
    descriptionSub: string;
    valueProp1: string;
    valueProp2: string;
    valueProp3: string;
    emailPlaceholder: string;
    cta: string;
    noCreditCard: string;
    lockedIn: string;
    cancelAnytime: string;
    trustedBy: string;
  };
  painPoints: {
    title: string;
    description: string;
    pain1: { stat: string; title: string; description: string };
    pain2: { stat: string; title: string; description: string };
    pain3: { stat: string; title: string; description: string };
    betterWay: string;
  };
  features: {
    title: string;
    description: string;
    byok: { title: string; description: string; highlight: string };
    voice: { title: string; description: string; stat: string; statLabel: string };
    viral: { title: string; description: string; stat: string; statLabel: string };
    schedule: { title: string; description: string; stat: string; statLabel: string };
    reddit: { title: string; description: string; stat: string; statLabel: string };
    carousel: { title: string; description: string };
  };
  howItWorks: {
    title: string;
    description: string;
    step1: { title: string; description: string };
    step2: { title: string; description: string };
    step3: { title: string; description: string };
  };
  pricing: {
    title: string;
    description: string;
    discount: string;
    founder: string;
    perMonth: string;
    free: { name: string; description: string; features: string[] };
    starter: { name: string; description: string; features: string[] };
    pro: { name: string; description: string; features: string[] };
    business: { name: string; description: string; features: string[] };
    cta: string;
  };
  faq: {
    title: string;
    q1: { question: string; answer: string };
    q2: { question: string; answer: string };
    q3: { question: string; answer: string };
    q4: { question: string; answer: string };
    q5: { question: string; answer: string };
    q6: { question: string; answer: string };
    q7: { question: string; answer: string };
    q8: { question: string; answer: string };
    q9: { question: string; answer: string };
    q10: { question: string; answer: string };
    q11: { question: string; answer: string };
    q12: { question: string; answer: string };
  };
  cta: {
    title: string;
    description: string;
    subDescription: string;
    button: string;
    security: string;
    yourData: string;
    madeIn: string;
  };
  success: {
    title: string;
    description: string;
  };
  footer: {
    copyright: string;
    privacy: string;
    cookies: string;
  };
}

// ============================================
// HERO SECTION
// ============================================

// Hero Section with Floating Elements
function HeroSection({ email, setEmail, honeypot, setHoneypot, handleSubmit, isLoading, isSuccess, error, isMounted, translations }: HeroProps) {
  return (
    <section className="relative z-10 pt-8 md:pt-16 pb-16 md:pb-24 px-4 overflow-hidden">
      {/* Floating Elements with Official AI Brand Logos - hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 hidden md:block">
        {/* LinkedIn Icon */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[8%] w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-linear-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center shadow-lg opacity-5 md:opacity-20"
        >
          <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </motion.div>

        {/* ChatGPT / OpenAI Icon */}
        <motion.div
          animate={{
            y: [0, 18, 0],
            x: [0, -8, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-28 right-[10%] w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#10A37F] flex items-center justify-center shadow-lg opacity-5 md:opacity-20"
        >
          <svg className="w-7 h-7 md:w-8 md:h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
          </svg>
        </motion.div>

        {/* Claude / Anthropic Icon - Official Logo */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, -3, 0]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] left-[5%] w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#e96f4c] flex items-center justify-center shadow-lg opacity-5 md:opacity-20"
        >
          <svg className="w-7 h-7 md:w-8 md:h-8" viewBox="0 0 1200 1200" fill="white">
            <path d="M 233.959793 800.214905 L 468.644287 668.536987 L 472.590637 657.100647 L 468.644287 650.738403 L 457.208069 650.738403 L 417.986633 648.322144 L 283.892639 644.69812 L 167.597321 639.865845 L 54.926208 633.825623 L 26.577238 627.785339 L 3.3e-05 592.751709 L 2.73832 575.27533 L 26.577238 559.248352 L 60.724873 562.228149 L 136.187973 567.382629 L 249.422867 575.194763 L 331.570496 580.026978 L 453.261841 592.671082 L 472.590637 592.671082 L 475.328857 584.859009 L 468.724915 580.026978 L 463.570557 575.194763 L 346.389313 495.785217 L 219.543671 411.865906 L 153.100723 363.543762 L 117.181267 339.060425 L 99.060455 316.107361 L 91.248367 266.01355 L 123.865784 230.093994 L 167.677887 233.073853 L 178.872513 236.053772 L 223.248367 270.201477 L 318.040283 343.570496 L 441.825592 434.738342 L 459.946411 449.798706 L 467.194672 444.64447 L 468.080597 441.020203 L 459.946411 427.409485 L 392.617493 305.718323 L 320.778564 181.932983 L 288.80542 130.630859 L 280.348999 99.865845 C 277.369171 87.221436 275.194641 76.590698 275.194641 63.624268 L 312.322174 13.20813 L 332.8591 6.604126 L 382.389313 13.20813 L 403.248352 31.328979 L 434.013519 101.71814 L 483.865753 212.537048 L 561.181274 363.221497 L 583.812134 407.919434 L 595.892639 449.315491 L 600.40271 461.959839 L 608.214783 461.959839 L 608.214783 454.711609 L 614.577271 369.825623 L 626.335632 265.61084 L 637.771851 131.516846 L 641.718201 93.745117 L 660.402832 48.483276 L 697.530334 24.000122 L 726.52356 37.852417 L 750.362549 72 L 747.060486 94.067139 L 732.886047 186.201416 L 705.100708 330.52356 L 686.979919 427.167847 L 697.530334 427.167847 L 709.61084 415.087341 L 758.496704 350.174561 L 840.644348 247.490051 L 876.885925 206.738342 L 919.167847 161.71814 L 946.308838 140.29541 L 997.61084 140.29541 L 1035.38269 196.429626 L 1018.469849 254.416199 L 965.637634 321.422852 L 921.825562 378.201538 L 859.006714 462.765259 L 819.785278 530.41626 L 823.409424 535.812073 L 832.75177 534.92627 L 974.657776 504.724915 L 1051.328979 490.872559 L 1142.818848 475.167786 L 1184.214844 494.496582 L 1188.724854 514.147644 L 1172.456421 554.335693 L 1074.604126 578.496765 L 959.838989 601.449829 L 788.939636 641.879272 L 786.845764 643.409485 L 789.261841 646.389343 L 866.255127 653.637634 L 899.194702 655.409424 L 979.812134 655.409424 L 1129.932861 666.604187 L 1169.154419 692.537109 L 1192.671265 724.268677 L 1188.724854 748.429688 L 1128.322144 779.194641 L 1046.818848 759.865845 L 856.590759 714.604126 L 791.355774 698.335754 L 782.335693 698.335754 L 782.335693 703.731567 L 836.69812 756.885986 L 936.322205 846.845581 L 1061.073975 962.81897 L 1067.436279 991.490112 L 1051.409424 1014.120911 L 1034.496704 1011.704712 L 924.885986 929.234924 L 882.604126 892.107544 L 786.845764 811.48999 L 780.483276 811.48999 L 780.483276 819.946289 L 802.550415 852.241699 L 919.087341 1027.409424 L 925.127625 1081.127686 L 916.671204 1098.604126 L 886.469849 1109.154419 L 853.288696 1103.114136 L 785.073914 1007.355835 L 714.684631 899.516785 L 657.906067 802.872498 L 650.979858 806.81897 L 617.476624 1167.704834 L 601.771851 1186.147705 L 565.530212 1200 L 535.328857 1177.046997 L 519.302124 1139.919556 L 535.328857 1066.550537 L 554.657776 970.792053 L 570.362488 894.68457 L 584.536926 800.134277 L 592.993347 768.724976 L 592.429626 766.630859 L 585.503479 767.516968 L 514.22821 865.369263 L 405.825531 1011.865906 L 320.053711 1103.677979 L 299.516815 1111.812256 L 263.919525 1093.369263 L 267.221497 1060.429688 L 287.114136 1031.114136 L 405.825531 880.107361 L 477.422913 786.52356 L 523.651062 732.483276 L 523.328918 724.671265 L 520.590698 724.671265 L 205.288605 929.395935 L 149.154434 936.644409 L 124.993355 914.01355 L 127.973183 876.885986 L 139.409409 864.80542 L 234.201385 799.570435 L 233.879227 799.8927 Z"/>
          </svg>
        </motion.div>

        {/* Google Gemini Icon - Official Logo */}
        <motion.div
          animate={{
            y: [0, 22, 0],
            x: [0, 12, 0]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-36 left-[12%] w-11 h-11 md:w-13 md:h-13 rounded-full bg-linear-to-br from-[#4285F4] via-[#9B72CB] to-[#D96570] flex items-center justify-center shadow-lg opacity-5 md:opacity-20"
        >
          <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 65 65" fill="white">
            <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z"/>
          </svg>
        </motion.div>

        {/* Grok / xAI Icon - Official Logo */}
        <motion.div
          animate={{
            y: [0, -18, 0],
            rotate: [0, 8, 0]
          }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/3 right-[6%] w-11 h-11 md:w-13 md:h-13 rounded-xl bg-black flex items-center justify-center shadow-lg border border-slate-600 opacity-10"
        >
          <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 512 492" fill="white">
            <path fillRule="evenodd" clipRule="evenodd" d="M197.76 315.52l170.197-125.803c8.342-6.186 20.267-3.776 24.256 5.803 20.907 50.539 11.563 111.253-30.08 152.939-41.621 41.685-99.562 50.816-152.512 29.994l-57.834 26.816c82.965 56.768 183.701 42.731 246.656-20.33 49.941-50.006 65.408-118.166 50.944-179.627l.128.149c-20.971-90.282 5.162-126.378 58.666-200.17 1.28-1.75 2.56-3.499 3.819-5.291l-70.421 70.507v-.214l-243.883 245.27m-35.072 30.528c-59.563-56.96-49.28-145.088 1.515-195.926 37.568-37.61 99.136-52.97 152.874-30.4l57.707-26.666a166.554 166.554 0 00-39.019-21.334 191.467 191.467 0 00-208.042 41.942c-54.038 54.101-71.04 137.301-41.856 208.298 21.802 53.056-13.931 90.582-49.92 128.47C23.104 463.915 10.304 477.333 0 491.541l162.56-145.386"/>
          </svg>
        </motion.div>

        {/* Perplexity Icon - Official Logo */}
        <motion.div
          animate={{
            y: [0, 16, 0],
            x: [0, -10, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          className="absolute bottom-28 right-[15%] w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#20808D] flex items-center justify-center shadow-lg opacity-5 md:opacity-20"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="white">
            <path d="M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44l-5.946-5.397zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234V8.965zm8.136 7.58h1.844V8.349H13.46l6.105 5.54v2.655zm-8.982-8.28H2.59v8.195h1.8v-2.576l6.192-5.62zM5.475 2.476v4.71h5.115l-5.115-4.71zm13.219 0l-5.115 4.71h5.115v-4.71z" fillRule="nonzero"/>
          </svg>
        </motion.div>

        {/* Mistral AI Icon - Official Logo */}
        <motion.div
          animate={{
            y: [0, -12, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute top-[55%] right-[3%] w-10 h-10 md:w-12 md:h-12 rounded-lg bg-black flex items-center justify-center shadow-lg opacity-5 md:opacity-20"
        >
          <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 129 91" fill="#F7931A">
            <rect x="18.292" y="0" width="18.293" height="18.123"/>
            <rect x="91.473" y="0" width="18.293" height="18.123"/>
            <rect x="18.292" y="18.121" width="36.586" height="18.123"/>
            <rect x="73.181" y="18.121" width="36.586" height="18.123"/>
            <rect x="18.292" y="36.243" width="91.476" height="18.122"/>
            <rect x="18.292" y="54.37" width="18.293" height="18.123"/>
            <rect x="54.883" y="54.37" width="18.293" height="18.123"/>
            <rect x="91.473" y="54.37" width="18.293" height="18.123"/>
            <rect x="0" y="72.504" width="54.89" height="18.123"/>
            <rect x="73.181" y="72.504" width="54.89" height="18.123"/>
          </svg>
        </motion.div>

        {/* Meta Llama Icon */}
        <motion.div
          animate={{
            y: [0, 14, 0],
            rotate: [0, -6, 0]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3.5 }}
          className="absolute bottom-[45%] left-[3%] w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#0668E1] flex items-center justify-center shadow-lg opacity-5 md:opacity-20"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 10.9c-.61-1.82-1.92-4.41-3.37-5.27C7.38 4.87 6.14 5.19 5.35 6c-1.84 1.86-1.77 5.37.33 8.58 1.02 1.56 2.32 2.86 3.67 3.63.78.44 1.58.75 2.3.81.72-.06 1.52-.37 2.3-.81 1.35-.77 2.65-2.07 3.67-3.63 2.1-3.21 2.17-6.72.33-8.58-.79-.81-2.03-1.13-3.28-.37-1.45.86-2.76 3.45-3.37 5.27z"/>
          </svg>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto text-center">
        {/* Announcement Badge - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 mb-8"
        >
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{translations.hero.badge}</span>
          </span>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <span className="text-sm text-slate-600 dark:text-slate-400">{translations.hero.spotsLeft}</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex flex-col items-center tracking-tight text-slate-900 dark:text-white mb-6 text-3xl sm:text-4xl md:text-5xl leading-none"
        >
          <span className="leading-[1.3]">{translations.hero.headline1}</span>
          <span className="text-shimmer leading-[1.3]">{translations.hero.headline2}</span>
        </motion.h1>

        {/* IMPROVED Description - Clear, benefit-focused, converting */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          <span className="font-semibold text-slate-900 dark:text-white">{translations.hero.description}</span>
          <br className="hidden sm:block" />
          {translations.hero.descriptionSub}
        </motion.p>

        {/* Value Props Row - NEW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          {[
            { icon: Zap, text: translations.hero.valueProp1 },
            { icon: TrendingUp, text: translations.hero.valueProp2 },
            { icon: CircleDollarSign, text: translations.hero.valueProp3 },
          ].map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <item.icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm font-medium">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA - Enhanced with glow effect */}
        <motion.div
          id="waitlist"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="relative">
              {/* Honeypot field - hidden from humans, bots will fill it */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute -left-[9999px] opacity-0 h-0 w-0"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <motion.div
                className="absolute -inset-1 bg-linear-to-r from-cyan-500 via-blue-500 to-violet-500 rounded-2xl opacity-20 blur-lg"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700">
                <input
                  type="email"
                  placeholder={translations.hero.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-16 min-h-[54px] px-6 rounded-xl border-0 bg-slate-50 dark:bg-slate-900 text-lg flex-[2] min-w-0 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-16 px-8 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{translations.hero.cta} <ArrowRight className="w-5 h-5 ml-2" /></>}
                </Button>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </form>
          ) : (
            <SuccessMessage translations={translations} />
          )}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-500" />
              {translations.hero.noCreditCard}
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-500" />
              {translations.hero.lockedIn}
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-500" />
              {translations.hero.cancelAnytime}
            </span>
          </div>
        </motion.div>

        {/* Social Proof Avatars - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-4 mt-12"
        >
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5, 6].map((num, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
                className="w-11 h-11 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden shadow-lg"
                style={{ zIndex: 6 - i }}
              >
                <Image
                  src={`https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person${num}.avif`}
                  alt=""
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {translations.hero.trustedBy}
            </p>
          </div>
        </motion.div>

        {/* Video Section - Right under social proof */}
        <HeroVideoSection />
      </div>
    </section>
  );
}

// Shared Success Message Component
function SuccessMessage({ translations }: { translations: PrelaunchTranslations }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center"
    >
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-4">
        <Check className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{translations.success.title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{translations.success.description}</p>
    </motion.div>
  );
}

interface HeroProps {
  email: string;
  setEmail: (email: string) => void;
  honeypot: string;
  setHoneypot: (honeypot: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isSuccess: boolean;
  error: string;
  isMounted: boolean;
  translations: PrelaunchTranslations;
}

// ============================================
// INTERACTIVE DEMO PREVIEW
// ============================================

function DemoPreview() {
  const [activeTab, setActiveTab] = useState<"write" | "analyze" | "schedule">("write");
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === "write") return "analyze";
        if (prev === "analyze") return "schedule";
        return "write";
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const demos = {
    write: {
      title: "AI Writing Assistant",
      subtitle: "Generate viral posts in seconds",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Your topic</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Building a SaaS in public</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-linear-to-b from-cyan-500 to-blue-600 rounded-full" />
            <div className="pl-4 space-y-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                I quit my $200K job to build a SaaS.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Everyone thought I was crazy.<br />
                6 months later, here&apos;s what happened:
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                → $0 to $10K MRR<br />
                → 2,000+ users<br />
                → 0 regrets
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">Score: 94/100</span>
              <span className="text-xs px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full font-medium">Viral potential</span>
            </div>
            <button className="text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          </div>
        </div>
      ),
    },
    analyze: {
      title: "Viral Post Analyzer",
      subtitle: "Learn from what works",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Hook Score", value: "94", max: "100" },
              { label: "Readability", value: "A+", max: "" },
              { label: "Engagement", value: "High", max: "" },
              { label: "Best Time", value: "9 AM", max: "Tue" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
                  {stat.max && <span className="text-xs text-slate-400">/{stat.max}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">AI Suggestions</p>
            {[
              { check: true, text: "Strong opening hook" },
              { check: true, text: "Clear value proposition" },
              { check: false, text: "Add a question at the end" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {item.check ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500" />
                )}
                <span className={item.check ? "text-slate-600 dark:text-slate-400" : "text-amber-600 dark:text-amber-400"}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    schedule: {
      title: "Smart Scheduler",
      subtitle: "Post at optimal times",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500 dark:text-slate-400">Your optimal week</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-medium">AI-optimized</span>
          </div>
          <div className="relative h-28 bg-slate-100 dark:bg-slate-700/30 rounded-lg p-3">
            <div className="absolute bottom-6 left-3 right-3 flex items-end justify-between gap-2">
              {[
                { day: "Mon", h: 60, posts: 1 },
                { day: "Tue", h: 90, posts: 2 },
                { day: "Wed", h: 45, posts: 0 },
                { day: "Thu", h: 100, posts: 2 },
                { day: "Fri", h: 70, posts: 1 },
                { day: "Sat", h: 30, posts: 0 },
                { day: "Sun", h: 20, posts: 0 },
              ].map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative w-full">
                    <div
                      className={`w-full rounded-t transition-all ${
                        d.h === 100
                          ? "bg-linear-to-t from-cyan-500 to-blue-500"
                          : d.h > 60
                          ? "bg-cyan-400/60 dark:bg-cyan-600/60"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                      style={{ height: `${d.h}%`, minHeight: "8px" }}
                    />
                    {d.posts > 0 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {d.posts}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm text-cyan-700 dark:text-cyan-300">Next post: Tuesday 9:00 AM</span>
            </div>
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">+47% reach</span>
          </div>
        </div>
      ),
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="relative"
    >
      <div className="absolute -inset-4 bg-linear-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-2xl" />

      <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 text-center">
              app.linkedgrow.ai
            </div>
          </div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        <div className="p-4 bg-slate-900">
          <div className="flex gap-1 mb-4 bg-slate-800 rounded-lg p-1">
            {(["write", "analyze", "schedule"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setIsPlaying(false);
                }}
                className={`flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "write" && <Sparkles className="w-3.5 h-3.5" />}
                {tab === "analyze" && <BarChart3 className="w-3.5 h-3.5" />}
                {tab === "schedule" && <Calendar className="w-3.5 h-3.5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-5"
            >
              <div className="mb-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {demos[activeTab].title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{demos[activeTab].subtitle}</p>
              </div>
              {demos[activeTab].content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// PAIN POINTS SECTION - Redesigned
// ============================================

function PainPointsSection({ translations }: { translations: PrelaunchTranslations }) {
  const painPoints = [
    {
      icon: Clock,
      stat: translations.painPoints.pain1.stat,
      title: translations.painPoints.pain1.title,
      description: translations.painPoints.pain1.description,
      color: "from-red-500 to-rose-500",
    },
    {
      icon: Eye,
      stat: translations.painPoints.pain2.stat,
      title: translations.painPoints.pain2.title,
      description: translations.painPoints.pain2.description,
      color: "from-orange-500 to-amber-500",
    },
    {
      icon: CircleDollarSign,
      stat: translations.painPoints.pain3.stat,
      title: translations.painPoints.pain3.title,
      description: translations.painPoints.pain3.description,
      color: "from-red-600 to-orange-500",
    },
  ];

  return (
    <section className="relative z-10 pt-8 md:pt-12 pb-20 md:pb-28 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-red-500 to-orange-500 mb-6"
          >
            <X className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            {translations.painPoints.title}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {translations.painPoints.description}
          </p>
        </motion.div>

        {/* Pain Point Cards - Horizontal Layout */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {painPoints.map((pain, i) => (
            <motion.div
              key={pain.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15 }}
              className="group relative"
            >
              {/* Animated background */}
              <div className={`absolute inset-0 bg-linear-to-br ${pain.color} opacity-0 group-hover:opacity-10 rounded-3xl blur-xl transition-all duration-500`} />

              {/* Card */}
              <div className="relative h-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden group-hover:border-red-300 dark:group-hover:border-red-800 transition-all">
                {/* Large stat in background */}
                <div className={`absolute -top-4 -right-4 text-8xl font-black bg-linear-to-br ${pain.color} bg-clip-text text-transparent opacity-10`}>
                  {pain.stat.replace("+", "").replace("/year", "").replace(" hours", "h")}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${pain.color} flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                  <pain.icon className="w-7 h-7 text-white" />
                </div>

                {/* Stat Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-linear-to-r ${pain.color} bg-opacity-10 mb-4`}>
                  <span className={`text-sm font-bold bg-linear-to-r ${pain.color} bg-clip-text text-transparent`}>
                    {pain.stat}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {pain.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pain.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Transition to Solution - Now a button that scrolls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <button
            onClick={() => {
              document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-linear-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 hover:from-emerald-500/20 hover:to-cyan-500/20 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              There&apos;s a better way
            </span>
            <ChevronDown className="w-5 h-5 text-emerald-500 animate-bounce" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES BENTO GRID
// ============================================

function BentoFeatures({ translations }: { translations: PrelaunchTranslations }) {
  const features = [
    {
      icon: Key,
      title: translations.features.byok.title,
      description: translations.features.byok.description,
      highlight: translations.features.byok.highlight,
      color: "amber",
      iconBg: "from-amber-500 to-orange-500",
    },
    {
      icon: Brain,
      title: translations.features.voice.title,
      description: translations.features.voice.description,
      stat: translations.features.voice.stat,
      statLabel: translations.features.voice.statLabel,
      color: "cyan",
      iconBg: "from-cyan-500 to-blue-500",
    },
    {
      icon: TrendingUp,
      title: translations.features.viral.title,
      description: translations.features.viral.description,
      stat: translations.features.viral.stat,
      statLabel: translations.features.viral.statLabel,
      color: "emerald",
      iconBg: "from-emerald-500 to-green-500",
    },
    {
      icon: FileText,
      title: translations.features.carousel.title,
      description: translations.features.carousel.description,
      color: "violet",
      iconBg: "from-violet-500 to-purple-500",
    },
    {
      icon: Globe,
      title: translations.features.reddit.title,
      description: translations.features.reddit.description,
      stat: translations.features.reddit.stat,
      statLabel: translations.features.reddit.statLabel,
      color: "blue",
      iconBg: "from-blue-500 to-indigo-500",
    },
    {
      icon: Calendar,
      title: translations.features.schedule.title,
      description: translations.features.schedule.description,
      stat: translations.features.schedule.stat,
      statLabel: translations.features.schedule.statLabel,
      color: "teal",
      iconBg: "from-cyan-500 to-teal-500",
    },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-linear-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30, rotateX: -10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative"
          >
            <div className={`absolute -inset-0.5 bg-linear-to-r ${feature.iconBg} rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500`} />

            <div className="relative h-full bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${feature.iconBg} opacity-5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />

              <div className="relative mb-5">
                <div className={`absolute inset-0 w-14 h-14 rounded-xl bg-linear-to-br ${feature.iconBg} opacity-20 blur-lg group-hover:blur-xl transition-all`} />
                <div className={`relative w-14 h-14 rounded-xl bg-linear-to-br ${feature.iconBg} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                {feature.description}
              </p>

              {feature.stat && (
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black bg-linear-to-r ${feature.iconBg} bg-clip-text text-transparent`}>
                    {feature.stat}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{feature.statLabel}</span>
                </div>
              )}
              {feature.highlight && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-linear-to-r ${feature.iconBg} text-white text-sm font-semibold shadow-lg`}>
                  <Zap className="w-4 h-4" />
                  {feature.highlight}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// HOW IT WORKS
// ============================================

function HowItWorks({ translations }: { translations: PrelaunchTranslations }) {
  const steps = [
    {
      number: "01",
      title: translations.howItWorks.step1.title,
      description: translations.howItWorks.step1.description,
      icon: Key,
      color: "from-amber-500 to-orange-500",
      time: "30 sec",
    },
    {
      number: "02",
      title: translations.howItWorks.step2.title,
      description: translations.howItWorks.step2.description,
      icon: Target,
      color: "from-cyan-500 to-blue-500",
      time: "2 min",
    },
    {
      number: "03",
      title: translations.howItWorks.step3.title,
      description: translations.howItWorks.step3.description,
      icon: Sparkles,
      color: "from-violet-500 to-purple-500",
      time: "5 min",
    },
    {
      number: "04",
      title: translations.howItWorks.step3.title,
      description: translations.howItWorks.step3.description,
      icon: TrendingUp,
      color: "from-emerald-500 to-green-500",
      time: "2 min",
    },
  ];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Desktop: Horizontal timeline */}
      <div className="hidden lg:block">
        <div className="absolute top-[60px] left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800">
          <motion.div
            className="h-full bg-linear-to-r from-amber-500 via-cyan-500 via-violet-500 to-emerald-500"
            initial={{ width: "0%" }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>

        <div className="grid grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="relative pt-20"
            >
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 + 0.3, type: "spring", stiffness: 200 }}
              >
                <div className={`relative w-[120px] h-[120px] rounded-full bg-linear-to-br ${step.color} p-1 shadow-xl`}>
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                    <div className={`w-20 h-20 rounded-full bg-linear-to-br ${step.color} flex items-center justify-center`}>
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>
                <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full bg-linear-to-br ${step.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  {step.number}
                </div>
              </motion.div>

              <div className="text-center pt-16">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium mb-3">
                  <Clock className="w-3 h-3" />
                  {step.time}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical timeline */}
      <div className="lg:hidden relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-linear-to-b from-amber-500 via-cyan-500 via-violet-500 to-emerald-500" />

        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative pl-20"
            >
              <div className={`absolute left-0 top-0 w-16 h-16 rounded-full bg-linear-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                <step.icon className="w-8 h-8 text-white" />
              </div>

              <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-2xl font-black bg-linear-to-r ${step.color} bg-clip-text text-transparent`}>
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs">
                    <Clock className="w-3 h-3" />
                    {step.time}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex justify-center"
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30">
          <Rocket className="w-5 h-5" />
          <span className="font-bold">Total setup time: ~10 minutes</span>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// COMPARISON SECTION - Redesigned
// ============================================

function ComparisonSection() {
  const comparisons = [
    { feature: "AI Content Generation", linkedgrow: "Unlimited", others: "50-100/mo", icon: Sparkles },
    { feature: "AI Models Available", linkedgrow: "GPT-4, Claude, Gemini...", others: "1-2 locked", icon: Brain },
    { feature: "Viral Post Analysis", linkedgrow: true, others: false, icon: TrendingUp },
    { feature: "Carousel Generator", linkedgrow: true, others: "Extra $29/mo", icon: FileText },
    { feature: "Smart Scheduling", linkedgrow: true, others: true, icon: Calendar },
    { feature: "Your Data Privacy", linkedgrow: "100% yours", others: "Used for training", icon: Shield },
    { feature: "Monthly Cost", linkedgrow: "$19-79 + ~$4 API", others: "$49-199/mo", icon: CircleDollarSign },
  ];

  return (
    <section className="relative z-10 py-20 md:py-28 px-4 bg-linear-to-b from-transparent via-slate-100/50 dark:via-slate-900/50 to-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 mb-6"
          >
            <Award className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Why founders choose us
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            The honest comparison they don&apos;t want you to see
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 via-transparent to-red-500/10 rounded-3xl blur-3xl" />

          <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Desktop: Table layout */}
            <div className="hidden md:block">
              {/* Header Row */}
              <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Feature</div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg">
                    <Crown className="w-4 h-4" />
                    LinkedGrow
                  </div>
                </div>
                <div className="text-center text-sm font-semibold text-slate-400">Others ($50+/mo)</div>
              </div>

              {/* Comparison Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparisons.map((row, i) => (
                  <motion.div
                    key={row.feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-3 gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/30 transition-colors">
                        <row.icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.feature}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      {typeof row.linkedgrow === "boolean" ? (
                        row.linkedgrow ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )
                      ) : (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">{row.linkedgrow}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      {typeof row.others === "boolean" ? (
                        row.others ? (
                          <Check className="w-5 h-5 text-slate-400" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <X className="w-5 h-5 text-red-500" />
                          </div>
                        )
                      ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400">{row.others}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile: Card layout */}
            <div className="md:hidden">
              {/* Header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg">
                    <Crown className="w-3 h-3" />
                    LinkedGrow
                  </div>
                  <span className="text-slate-400 text-sm">vs</span>
                  <span className="text-xs font-medium text-slate-500">Others ($50+/mo)</span>
                </div>
              </div>

              {/* Cards */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparisons.map((row, i) => (
                  <motion.div
                    key={row.feature}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4"
                  >
                    {/* Feature name */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <row.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{row.feature}</span>
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* LinkedGrow */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                        {typeof row.linkedgrow === "boolean" ? (
                          row.linkedgrow ? (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{row.linkedgrow}</span>
                        )}
                      </div>

                      {/* Others */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        {typeof row.others === "boolean" ? (
                          row.others ? (
                            <Check className="w-4 h-4 text-slate-400" />
                          ) : (
                            <X className="w-4 h-4 text-red-400" />
                          )
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">{row.others}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="p-6 bg-linear-to-r from-cyan-500/5 to-blue-500/5 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden">
                        <Image
                          src={`https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person${num}.avif`}
                          alt=""
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-white">179 founders</span> made the switch
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                  <BadgeCheck className="w-5 h-5" />
                  Save up to $2,000/year
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// TESTIMONIALS CAROUSEL
// ============================================

function TestimonialsCarousel() {
  const testimonials = [
    { quote: "The voice training nailed my style from just 5 sample posts. Clients think I write every post myself. The BYOK model means I pay $3/month for unlimited generations.", author: "Laura W.", role: "Freelance Writer", metric: "+1,200%" },
    { quote: "Spending $4/month on API calls instead of $99 on other tools. Game changer.", author: "Marcus C.", role: "Startup Founder", metric: "96% savings" },
    { quote: "The carousel generator alone is worth it. Professional slides in minutes.", author: "Elena R.", role: "Content Creator", metric: "+340%" },
    { quote: "Finally an AI that writes in MY voice. My audience can't tell the difference.", author: "James L.", role: "Tech CEO", metric: "+520%" },
    { quote: "Went from posting weekly to daily. Engagement through the roof.", author: "Priya S.", role: "SaaS Founder", metric: "+890%" },
    { quote: "The Reddit importer is a goldmine. I find trending topics, turn them into LinkedIn posts in seconds, and never run out of content ideas.", author: "Daniel F.", role: "Growth Marketer", metric: "+180%" },
    { quote: "Saved 15 hours per week on content creation. ROI is incredible.", author: "Lisa T.", role: "Agency Owner", metric: "15h saved" },
    { quote: "Best investment for my LinkedIn growth. Paid for itself in the first week.", author: "Tom R.", role: "B2B Sales", metric: "5x ROI" },
  ];

  return (
    <div className="relative overflow-hidden py-4">
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-r from-slate-50 dark:from-slate-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-l from-slate-50 dark:from-slate-950 to-transparent z-10" />

      {[0, 1, 2].map((rowIndex) => (
        <motion.div
          key={rowIndex}
          animate={{ x: rowIndex % 2 === 0 ? [0, -2000] : [-2000, 0] }}
          transition={{ duration: 50 + rowIndex * 10, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 mb-4"
        >
          {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
            <div
              key={i}
              className="shrink-0 w-[280px] sm:w-[320px] md:w-[380px] bg-white dark:bg-slate-800/80 rounded-2xl p-4 md:p-5 border border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-3">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-linear-to-br ${
                    rowIndex === 0 ? "from-cyan-500 to-blue-600" :
                    rowIndex === 1 ? "from-violet-500 to-purple-600" :
                    "from-emerald-500 to-teal-600"
                  } flex items-center justify-center text-white text-sm font-bold`}>
                    {t.author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.author}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${
                  rowIndex === 0 ? "text-cyan-600 dark:text-cyan-400" :
                  rowIndex === 1 ? "text-violet-600 dark:text-violet-400" :
                  "text-emerald-600 dark:text-emerald-400"
                }`}>{t.metric}</p>
              </div>
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// PRICING PREVIEW
// ============================================

function PricingPreview({ translations }: { translations: PrelaunchTranslations }) {
  const [showAllPlans, setShowAllPlans] = useState(false);

  // Original prices - then show 30% discount (3 paid plans only)
  const plans = [
    {
      name: translations.pricing.starter.name,
      actualPrice: 19,
      discountedPrice: 13, // 19 * 0.7 = 13.3 rounded to 13
      period: translations.pricing.perMonth,
      description: translations.pricing.starter.description,
      features: translations.pricing.starter.features,
      highlight: false,
    },
    {
      name: translations.pricing.pro.name,
      actualPrice: 39,
      discountedPrice: 27, // 39 * 0.7 = 27.3 rounded to 27
      period: translations.pricing.perMonth,
      description: translations.pricing.pro.description,
      features: translations.pricing.pro.features,
      highlight: true,
      badge: "Most Popular",
    },
    {
      name: translations.pricing.business.name,
      actualPrice: 79,
      discountedPrice: 55, // 79 * 0.7 = 55.3 rounded to 55
      period: translations.pricing.perMonth,
      description: translations.pricing.business.description,
      features: translations.pricing.business.features,
      highlight: false,
    },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-linear-to-r from-cyan-500/10 via-violet-500/10 to-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
          <Key className="w-4 h-4" />
          <span>All plans + ~$2-4/month in AI API costs (you pay the AI provider directly)</span>
        </div>
      </motion.div>

      {/* Progressive Disclosure - Show teaser first */}
      {!showAllPlans ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <button
            onClick={() => setShowAllPlans(true)}
            className="w-full group"
          >
            <div className="relative bg-linear-to-br from-violet-50 to-white dark:from-violet-950/50 dark:to-slate-900 rounded-2xl p-8 border-2 border-violet-300 dark:border-violet-700 shadow-xl shadow-violet-500/20 hover:shadow-2xl hover:shadow-violet-500/30 transition-all">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="px-4 py-1 rounded-full bg-linear-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg">
                  Early Access Pricing
                </div>
              </div>

              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400 mb-4">Plans starting at</p>

                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-2xl text-slate-400 line-through">$19</span>
                  <span className="text-6xl font-black text-slate-900 dark:text-white">$13</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xl">/mo</span>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-6">
                  <Sparkles className="w-4 h-4" />
                  Save 30% with early access
                </div>

                <div className="flex items-center justify-center gap-2 text-cyan-600 dark:text-cyan-400 font-medium group-hover:gap-3 transition-all">
                  <span>View all plans</span>
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                </div>
              </div>
            </div>
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative ${plan.highlight ? "lg:-mt-4 lg:mb-4" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1 rounded-full bg-linear-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className={`relative h-full rounded-2xl p-6 border-2 transition-all ${
                  plan.highlight
                    ? "bg-linear-to-b from-violet-50 to-white dark:from-violet-950/50 dark:to-slate-900 border-violet-300 dark:border-violet-700 shadow-xl shadow-violet-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{plan.description}</p>

                  <div className="mb-6">
                    {plan.actualPrice > 0 ? (
                      <>
                        {/* Original price with strikethrough */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg text-slate-400 line-through">${plan.actualPrice}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
                            -30%
                          </span>
                        </div>
                        {/* Discounted price */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-slate-900 dark:text-white">${plan.discountedPrice}</span>
                          <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">$0</span>
                        <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? "text-violet-500" : "text-emerald-500"}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">Early access pricing shown.</span>
          {" "}Join the waitlist to lock in 30% off for your first year.
        </p>
      </motion.div>
    </div>
  );
}

// ============================================
// FAQ SECTION
// ============================================

// ============================================
// HERO VIDEO SECTION - Embedded in Hero 2
// ============================================

function HeroVideoSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="mt-16 max-w-4xl mx-auto"
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-linear-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-2xl" />

        {/* Video container */}
        <div className="relative">
          <YouTubePlayer
            videoId="u31qwQUeGuM"
            thumbnailUrl="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail.avif"
            duration="0:10"
            ctaText="Join the Waitlist"
            ctaHref="#waitlist"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// FAQ SECTION
// ============================================

function FAQSection({ translations }: { translations: PrelaunchTranslations }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: translations.faq.q1.question,
      a: translations.faq.q1.answer,
    },
    {
      q: translations.faq.q2.question,
      a: translations.faq.q2.answer,
    },
    {
      q: translations.faq.q3.question,
      a: translations.faq.q3.answer,
    },
    {
      q: translations.faq.q4.question,
      a: translations.faq.q4.answer,
    },
    {
      q: translations.faq.q5.question,
      a: translations.faq.q5.answer,
    },
    {
      q: translations.faq.q6.question,
      a: translations.faq.q6.answer,
    },
    {
      q: translations.faq.q7.question,
      a: translations.faq.q7.answer,
    },
    {
      q: translations.faq.q8.question,
      a: translations.faq.q8.answer,
    },
    {
      q: translations.faq.q9.question,
      a: translations.faq.q9.answer,
    },
    {
      q: translations.faq.q10.question,
      a: translations.faq.q10.answer,
    },
    {
      q: translations.faq.q11.question,
      a: translations.faq.q11.answer,
    },
    {
      q: translations.faq.q12.question,
      a: translations.faq.q12.answer,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left bg-white dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-slate-900 dark:text-white text-left">{faq.q}</h3>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${openIndex === i ? "rotate-180" : ""}`} />
              </div>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// FINAL CTA SECTION - 4 VARIANTS
// ============================================

interface CTAProps {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  email: string;
  setEmail: (email: string) => void;
  honeypot: string;
  setHoneypot: (honeypot: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isSuccess: boolean;
  error: string;
  translations: PrelaunchTranslations;
}

// Shared form component for all CTA variants
function CTAForm({ email, setEmail, honeypot, setHoneypot, handleSubmit, isLoading, isSuccess, error, variant = "dark" }: CTAProps & { variant?: "dark" | "light" }) {
  const isDark = variant === "dark";

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${isDark ? "bg-emerald-500/20 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"} border rounded-2xl p-8 text-center`}
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>You&apos;re on the list!</h3>
        <p className={isDark ? "text-slate-300" : "text-slate-600"}>Your 30% discount is locked in. Check your inbox!</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot field - hidden from humans, bots will fill it */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] opacity-0 h-0 w-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <div className="relative">
        {isDark && <div className="absolute -inset-1 bg-linear-to-r from-cyan-500 to-violet-500 rounded-2xl blur opacity-30" />}
        <div className={`relative flex flex-col sm:flex-row gap-3 p-2 rounded-2xl ${isDark ? "bg-white/10 backdrop-blur-sm border border-white/20" : "bg-white shadow-xl border border-slate-200"}`}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`flex-[2] min-w-0 h-14 md:h-16 min-h-[54px] px-6 rounded-xl border-0 text-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none ${isDark ? "bg-white/10 text-white placeholder:text-slate-400" : "bg-slate-50 text-slate-900 placeholder:text-slate-500"}`}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 md:h-16 px-8 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg shadow-lg shadow-cyan-500/30 whitespace-nowrap shrink-0"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Get Early Access <ArrowRight className="w-5 h-5 ml-2" /></>}
          </Button>
        </div>
      </div>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <p className={`text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Join 179 founders - No spam - Unsubscribe anytime
      </p>
    </form>
  );
}

// CTA Section: Full-width gradient banner
function CTASection(props: CTAProps) {
  return (
    <section className="relative z-10 py-20 md:py-28 px-4 overflow-hidden">
      {/* Full width gradient background */}
      <div className="absolute inset-0 bg-linear-to-r from-cyan-600 via-blue-600 to-violet-600" />

      {/* Animated shapes */}
      <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute top-10 left-[10%] w-32 h-32 rounded-full bg-white/10" />
      <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-10 right-[15%] w-40 h-40 rounded-full bg-white/10" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Rocket className="w-4 h-4" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            {props.translations.cta.title}
          </h2>

          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {props.translations.cta.description}
            <br />{props.translations.cta.subDescription}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="max-w-3xl mx-auto">
          {!props.isSuccess ? (
            <form onSubmit={props.handleSubmit} className="flex flex-col sm:flex-row gap-3 relative">
              {/* Honeypot field - hidden from humans, bots will fill it */}
              <input
                type="text"
                name="website"
                value={props.honeypot}
                onChange={(e) => props.setHoneypot(e.target.value)}
                className="absolute -left-[9999px] opacity-0 h-0 w-0"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                type="email"
                placeholder={props.translations.hero.emailPlaceholder}
                value={props.email}
                onChange={(e) => props.setEmail(e.target.value)}
                required
                className="flex-[2] min-w-0 h-16 min-h-[54px] px-6 rounded-xl bg-white border-0 text-slate-900 placeholder:text-slate-500 text-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <Button type="submit" disabled={props.isLoading} className="h-16 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shrink-0">
                {props.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{props.translations.cta.button} <ArrowRight className="w-5 h-5 ml-2" /></>}
              </Button>
            </form>
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{props.translations.success.title}</h3>
              <p className="text-white/80">{props.translations.success.description}</p>
            </div>
          )}
          {props.error && <p className="text-red-200 text-sm mt-2">{props.error}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex flex-wrap justify-center gap-6 mt-10 text-white/70 text-sm">
          {[{ icon: Shield, text: props.translations.cta.security }, { icon: Key, text: props.translations.cta.yourData }, { icon: Heart, text: props.translations.cta.madeIn }].map((b) => (
            <span key={b.text} className="flex items-center gap-2"><b.icon className="w-4 h-4" />{b.text}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}


// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function PreLaunchPage({ translations }: { translations: PrelaunchTranslations }) {
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Bot trap - should stay empty
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formLoadTime] = useState(() => Date.now()); // For bot protection
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Only start fading after scrolling 80% past the hero section
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0.98]);

  const LAUNCH_DATE = new Date("2026-03-02T00:00:00Z");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setIsMounted(true);
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE.getTime() - now;
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, _hp: honeypot, _ts: formLoadTime.toString() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to subscribe");
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExitIntentSubmit = async (exitEmail: string, exitFormLoadTime: number, exitHoneypot: string) => {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: exitEmail, _hp: exitHoneypot, _ts: exitFormLoadTime.toString() }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to subscribe");
  };

  const heroProps: HeroProps = {
    email,
    setEmail,
    honeypot,
    setHoneypot,
    handleSubmit,
    isLoading,
    isSuccess,
    error,
    isMounted,
    translations,
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-100/30 dark:from-cyan-900/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-linear-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-linear-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Urgency Banner */}
      <div className="relative z-20 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-3 px-4 border-b border-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-cyan-400">EARLY ACCESS</span>
          </div>
          <span className="text-slate-300 text-sm sm:text-base">
            Join the waitlist → <span className="font-bold text-white">30% OFF</span> for your first year
          </span>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-slate-400">|</span>
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-mono">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
          </div>
        </div>
      </div>

      <PrelaunchHeader showCountdown timeLeft={timeLeft} />

      {/* Hero Section */}
      <motion.div ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale }}>
        <HeroSection {...heroProps} />
      </motion.div>

      {/* Pain Points Section */}
      <PainPointsSection translations={translations} />

      {/* Features Bento Grid */}
      <section id="features-section" className="relative z-10 py-20 md:py-28 px-4 bg-linear-to-b from-transparent via-cyan-50/50 dark:via-cyan-950/20 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 mb-6"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              {translations.features.title}
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {translations.features.description}
            </p>
          </motion.div>

          <BentoFeatures translations={translations} />
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              {translations.howItWorks.title}
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
              {translations.howItWorks.description}
            </p>
          </motion.div>

          <HowItWorks translations={translations} />
        </div>
      </section>

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Testimonials Carousel */}
      <section className="relative z-10 py-20 md:py-28 px-0">
        <div className="max-w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 px-4"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Real results from real founders
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
              Beta testers are already seeing incredible growth
            </p>
          </motion.div>

          <TestimonialsCarousel />
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="relative z-10 py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500 to-purple-500 mb-6"
            >
              <Gift className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              {translations.pricing.title}
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {translations.pricing.description}
            </p>
          </motion.div>

          <PricingPreview translations={translations} />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 md:py-28 px-4 bg-linear-to-b from-transparent via-slate-100/50 dark:via-slate-900/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              {translations.faq.title}
            </h2>
          </motion.div>

          <FAQSection translations={translations} />
        </div>
      </section>

      {/* Final CTA Section */}
      <CTASection
        timeLeft={timeLeft}
        email={email}
        setEmail={setEmail}
        honeypot={honeypot}
        setHoneypot={setHoneypot}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        isSuccess={isSuccess}
        error={error}
        translations={translations}
      />

      {/* Footer */}
      <PrelaunchFooter />

      {/* Activity Toast Notifications */}
      <ActivityToast />

      {/* Exit Intent Popup */}
      <ExitIntentPopup onSubmit={handleExitIntentSubmit} />
    </main>
  );
}
