"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  User,
  Building2,
  Check,
  AlertCircle,
  Linkedin,
  Shield,
  Save,
  Moon,
  Sun,
  Monitor,
  Mail,
  Lock,
  Loader2,
  Copy,
  Smartphone,
  Mic,
  Plus,
  X,
  Clock,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Common timezones grouped by region with abbreviations and UTC offsets
const timezones = [
  // Americas
  { value: "America/New_York", label: "New York (EST, UTC-5)", region: "Americas" },
  { value: "America/Chicago", label: "Chicago (CST, UTC-6)", region: "Americas" },
  { value: "America/Denver", label: "Denver (MST, UTC-7)", region: "Americas" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST, UTC-8)", region: "Americas" },
  { value: "America/Anchorage", label: "Alaska (AKST, UTC-9)", region: "Americas" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST, UTC-10)", region: "Americas" },
  { value: "America/Toronto", label: "Toronto (EST, UTC-5)", region: "Americas" },
  { value: "America/Vancouver", label: "Vancouver (PST, UTC-8)", region: "Americas" },
  { value: "America/Mexico_City", label: "Mexico City (CST, UTC-6)", region: "Americas" },
  { value: "America/Sao_Paulo", label: "Sao Paulo (BRT, UTC-3)", region: "Americas" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (ART, UTC-3)", region: "Americas" },
  // Europe
  { value: "Europe/London", label: "London (GMT, UTC+0)", region: "Europe" },
  { value: "Europe/Paris", label: "Paris (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Brussels", label: "Brussels (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Rome", label: "Rome (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Zurich", label: "Zurich (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Vienna", label: "Vienna (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Oslo", label: "Oslo (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Copenhagen", label: "Copenhagen (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Helsinki", label: "Helsinki (EET, UTC+2)", region: "Europe" },
  { value: "Europe/Dublin", label: "Dublin (GMT, UTC+0)", region: "Europe" },
  { value: "Europe/Lisbon", label: "Lisbon (WET, UTC+0)", region: "Europe" },
  { value: "Europe/Warsaw", label: "Warsaw (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Prague", label: "Prague (CET, UTC+1)", region: "Europe" },
  { value: "Europe/Athens", label: "Athens (EET, UTC+2)", region: "Europe" },
  { value: "Europe/Moscow", label: "Moscow (MSK, UTC+3)", region: "Europe" },
  // Asia & Pacific
  { value: "Asia/Tokyo", label: "Tokyo (JST, UTC+9)", region: "Asia & Pacific" },
  { value: "Asia/Seoul", label: "Seoul (KST, UTC+9)", region: "Asia & Pacific" },
  { value: "Asia/Shanghai", label: "Shanghai (CST, UTC+8)", region: "Asia & Pacific" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT, UTC+8)", region: "Asia & Pacific" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)", region: "Asia & Pacific" },
  { value: "Asia/Kolkata", label: "Mumbai / New Delhi (IST, UTC+5:30)", region: "Asia & Pacific" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)", region: "Asia & Pacific" },
  { value: "Asia/Jerusalem", label: "Jerusalem (IST, UTC+2)", region: "Asia & Pacific" },
  { value: "Australia/Sydney", label: "Sydney (AEST, UTC+10)", region: "Asia & Pacific" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST, UTC+10)", region: "Asia & Pacific" },
  { value: "Australia/Perth", label: "Perth (AWST, UTC+8)", region: "Asia & Pacific" },
  { value: "Pacific/Auckland", label: "Auckland (NZST, UTC+12)", region: "Asia & Pacific" },
  // Africa
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST, UTC+2)", region: "Africa" },
  { value: "Africa/Cairo", label: "Cairo (EET, UTC+2)", region: "Africa" },
  { value: "Africa/Lagos", label: "Lagos (WAT, UTC+1)", region: "Africa" },
];

function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Check if user is a team member (not owner)
  const isTeamMember = session?.user?.isTeamMember === true;

  // Account settings
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState("");
  const [twoFAMessage, setTwoFAMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Business profile
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    name: "",
    description: "",
    products: "",
    niche: "",
    audience: "",
    topics: "",
    context: "",
  });

  // Voice & Style settings
  const [voiceSettings, setVoiceSettings] = useState({
    samplePosts: [] as string[],
    neverMention: "",
    writingTone: "",
  });

  // Timezone settings
  const [timezone, setTimezone] = useState("auto");
  const [browserTimezone, setBrowserTimezone] = useState("");
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);
  const [timezoneMessage, setTimezoneMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newSamplePost, setNewSamplePost] = useState("");
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // LinkedIn connection
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [linkedInName, setLinkedInName] = useState("");
  const [linkedInMessage, setLinkedInMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [linkedInSettings, setLinkedInSettings] = useState<{
    postingTarget: "profile" | "organization";
    selectedOrgId?: string | null;
    selectedOrgName?: string | null;
    profileName?: string | null;
    profileImage?: string | null;
    organizations: Array<{ id: string; name: string; logoUrl?: string }>;
    hasOrganizations: boolean;
    communityConnected?: boolean;
  } | null>(null);

  // Community App connection
  const [isConnectingCommunity, setIsConnectingCommunity] = useState(false);
  const [isDisconnectingCommunity, setIsDisconnectingCommunity] = useState(false);

  // LinkedIn selection modal
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"profile" | "organization">("profile");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isSavingSelection, setIsSavingSelection] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Detect browser timezone
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setBrowserTimezone(detected);
    } catch {
      setBrowserTimezone("UTC");
    }

    // Fetch LinkedIn settings from API
    const fetchLinkedInSettings = async () => {
      try {
        const response = await fetch("/api/linkedin/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.connected) {
            setLinkedInConnected(true);
            // Show organization name if posting to organization, otherwise profile name
            if (data.postingTarget === "organization" && data.selectedOrgName) {
              setLinkedInName(data.selectedOrgName);
            } else {
              setLinkedInName(data.profileName || "");
            }
            setLinkedInSettings({
              postingTarget: data.postingTarget || "profile",
              selectedOrgId: data.selectedOrgId,
              selectedOrgName: data.selectedOrgName,
              profileName: data.profileName,
              profileImage: data.profileImage,
              organizations: data.organizations || [],
              hasOrganizations: data.hasOrganizations || false,
              communityConnected: data.communityConnected || false,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch LinkedIn settings:", error);
        // Fallback to cookie-based detection
        const linkedInProfileName = document.cookie
          .split("; ")
          .find((row) => row.startsWith("linkedin_profile_name="))
          ?.split("=")[1];
        if (linkedInProfileName) {
          setLinkedInConnected(true);
          try {
            setLinkedInName(decodeURIComponent(linkedInProfileName));
          } catch {
            setLinkedInName(linkedInProfileName);
          }
        }
      }
    };

    fetchLinkedInSettings().then(() => {
      // Check for showSelection URL parameter (non-popup mode)
      if (searchParams.get("showSelection") === "true") {
        setShowSelectionModal(true);
        // Clean up URL
        window.history.replaceState({}, "", "/dashboard/settings?linkedin=connected");
      }
    });

    // Listen for popup messages
    const handleMessage = (event: MessageEvent) => {
      const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";
      if (event.origin !== allowedOrigin) return;

      if (event.data?.type === "linkedin-success") {
        setLinkedInConnected(true);
        setLinkedInName(event.data.name || "");
        setIsConnectingLinkedIn(false);
        // Refetch settings to get updated data
        fetchLinkedInSettings().then(() => {
          // Show selection modal if user has organizations and needs to choose
          if (event.data.showSelection) {
            setShowSelectionModal(true);
          } else {
            setLinkedInMessage({ type: "success", text: "LinkedIn connected successfully!" });
          }
        });
      } else if (event.data?.type === "linkedin-error") {
        setLinkedInMessage({ type: "error", text: event.data.error || "Failed to connect LinkedIn" });
        setIsConnectingLinkedIn(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [searchParams]);

  // Load user data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setTwoFactorEnabled(session.user.twoFactorEnabled || false);
    }
  }, [session]);

  // Load voice settings
  useEffect(() => {
    const fetchVoiceSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setVoiceSettings({
            samplePosts: data.samplePosts || [],
            neverMention: data.neverMention || "",
            writingTone: data.writingTone || "",
          });
          // Load business profile fields
          setBusinessProfile({
            name: data.businessName || "",
            description: data.businessDescription || "",
            products: data.businessProducts || "",
            niche: data.businessNiche || "",
            audience: data.targetAudience || "",
            topics: data.businessTopics || "",
            context: data.businessContext || "",
          });
          // Load timezone (default to "auto" if not set)
          setTimezone(data.timezone || "auto");
        }
      } catch (error) {
        console.error("Failed to fetch voice settings:", error);
      }
    };
    fetchVoiceSettings();
  }, []);

  const handleSaveAccount = async () => {
    // If password fields are filled, validate them first
    const isChangingPassword = currentPassword && newPassword;

    if (isChangingPassword) {
      if (newPassword !== confirmPassword) {
        setAccountMessage({ type: "error", text: "Passwords do not match" });
        return;
      }
      if (newPassword.length < 8) {
        setAccountMessage({ type: "error", text: "Password must be at least 8 characters" });
        return;
      }
    }

    setIsSavingAccount(true);
    setAccountMessage(null);

    try {
      // Update account info
      const response = await fetch("/api/user/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        setAccountMessage({ type: "error", text: data.error || "Failed to update account" });
        setIsSavingAccount(false);
        return;
      }

      await updateSession();

      // If password fields are filled, also change password
      if (isChangingPassword) {
        const pwResponse = await fetch("/api/user/password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (pwResponse.ok) {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setAccountMessage({ type: "success", text: "Account and password updated successfully" });
        } else {
          const data = await pwResponse.json();
          setAccountMessage({ type: "error", text: data.error || "Account updated, but failed to change password" });
        }
      } else {
        setAccountMessage({ type: "success", text: "Account updated successfully" });
      }
    } catch (error) {
      setAccountMessage({ type: "error", text: "Failed to update account" });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSetup2FA = async () => {
    setIsSettingUp2FA(true);
    setTwoFAMessage(null);

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShow2FASetup(true);
      } else {
        const data = await response.json();
        setTwoFAMessage({ type: "error", text: data.error || "Failed to setup 2FA" });
      }
    } catch (error) {
      setTwoFAMessage({ type: "error", text: "Failed to setup 2FA" });
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) return;

    setIsSettingUp2FA(true);
    setTwoFAMessage(null);

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (response.ok) {
        setTwoFactorEnabled(true);
        setShow2FASetup(false);
        setVerificationCode("");
        await updateSession();
        setTwoFAMessage({ type: "success", text: "Two-factor authentication enabled" });
      } else {
        const data = await response.json();
        setTwoFAMessage({ type: "error", text: data.error || "Invalid verification code" });
      }
    } catch (error) {
      setTwoFAMessage({ type: "error", text: "Failed to verify code" });
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      setTwoFAMessage({ type: "error", text: "Password is required" });
      return;
    }

    setIsDisabling2FA(true);
    setTwoFAMessage(null);

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disable2FAPassword }),
      });

      if (response.ok) {
        setTwoFactorEnabled(false);
        await updateSession();
        setShow2FADisable(false);
        setDisable2FAPassword("");
        setTwoFAMessage({ type: "success", text: "Two-factor authentication disabled" });
      } else {
        const data = await response.json();
        setTwoFAMessage({ type: "error", text: data.error || "Failed to disable 2FA" });
      }
    } catch (error) {
      setTwoFAMessage({ type: "error", text: "Failed to disable 2FA" });
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveBusinessProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      // Build composite businessDescription for AI prompts
      const descParts = [
        businessProfile.name ? `Business: ${businessProfile.name}.` : "",
        businessProfile.description,
        businessProfile.niche ? `Industry: ${businessProfile.niche}.` : "",
        businessProfile.products ? `Products/Services: ${businessProfile.products}` : "",
        businessProfile.topics ? `Key topics: ${businessProfile.topics}.` : "",
        businessProfile.context ? `Additional context: ${businessProfile.context}` : "",
      ].filter(Boolean).join(" ");

      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessDescription: descParts || null,
          businessName: businessProfile.name,
          businessNiche: businessProfile.niche,
          businessProducts: businessProfile.products,
          businessTopics: businessProfile.topics,
          businessContext: businessProfile.context,
          targetAudience: businessProfile.audience,
        }),
      });

      if (response.ok) {
        setProfileMessage({ type: "success", text: "Business profile saved successfully" });
      } else {
        const data = await response.json();
        setProfileMessage({ type: "error", text: data.error || "Failed to save profile" });
      }
    } catch {
      setProfileMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Voice & Style functions
  const handleAddSamplePost = () => {
    if (!newSamplePost.trim()) return;
    setVoiceSettings((prev) => {
      if (prev.samplePosts.length >= 5) {
        setVoiceMessage({ type: "error", text: "Maximum 5 sample posts allowed" });
        return prev;
      }
      return {
        ...prev,
        samplePosts: [...prev.samplePosts, newSamplePost.trim()],
      };
    });
    setNewSamplePost("");
  };

  const handleRemoveSamplePost = (index: number) => {
    setVoiceSettings((prev) => ({
      ...prev,
      samplePosts: prev.samplePosts.filter((_, i) => i !== index),
    }));
  };

  const handleSaveVoiceSettings = async () => {
    setIsSavingVoice(true);
    setVoiceMessage(null);

    try {
      // Auto-add unsaved textarea content as a sample post
      let postsToSave = voiceSettings.samplePosts;
      if (newSamplePost.trim() && postsToSave.length < 5) {
        postsToSave = [...postsToSave, newSamplePost.trim()];
        setVoiceSettings((prev) => ({ ...prev, samplePosts: postsToSave }));
        setNewSamplePost("");
      }

      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          samplePosts: postsToSave,
          neverMention: voiceSettings.neverMention,
          writingTone: voiceSettings.writingTone,
        }),
      });

      if (response.ok) {
        setVoiceMessage({ type: "success", text: "Voice settings saved successfully" });
      } else {
        const data = await response.json();
        setVoiceMessage({ type: "error", text: data.error || "Failed to save voice settings" });
      }
    } catch {
      setVoiceMessage({ type: "error", text: "Failed to save voice settings" });
    } finally {
      setIsSavingVoice(false);
    }
  };

  const handleSaveTimezone = async () => {
    setIsSavingTimezone(true);
    setTimezoneMessage(null);

    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });

      if (response.ok) {
        setTimezoneMessage({ type: "success", text: "Timezone saved successfully" });
      } else {
        const data = await response.json();
        setTimezoneMessage({ type: "error", text: data.error || "Failed to save timezone" });
      }
    } catch {
      setTimezoneMessage({ type: "error", text: "Failed to save timezone" });
    } finally {
      setIsSavingTimezone(false);
    }
  };

  const handleConnectLinkedIn = () => {
    setIsConnectingLinkedIn(true);
    setLinkedInMessage(null);

    // Open centered popup window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/api/linkedin/auth?popup=true",
      "linkedin-auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Check if popup was blocked
    if (!popup) {
      setLinkedInMessage({ type: "error", text: "Popup was blocked. Please allow popups and try again." });
      setIsConnectingLinkedIn(false);
      return;
    }

    // Monitor popup close (in case user closes it manually)
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        setIsConnectingLinkedIn(false);
      }
    }, 500);
  };

  const handleChangePostingTarget = () => {
    // Initialize selection with current values
    setSelectedType(linkedInSettings?.postingTarget || "profile");
    setSelectedOrgId(linkedInSettings?.selectedOrgId || null);
    setShowSelectionModal(true);
  };

  const handleSaveSelection = async () => {
    if (selectedType === "organization" && !selectedOrgId) {
      setLinkedInMessage({ type: "error", text: "Please select a company page" });
      return;
    }

    setIsSavingSelection(true);

    try {
      const response = await fetch("/api/linkedin/select-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postingTarget: selectedType,
          organizationId: selectedType === "organization" ? selectedOrgId : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save selection");
      }

      const result = await response.json();

      // Update local state
      const newName = selectedType === "organization" ? result.organizationName : result.profileName;
      setLinkedInName(newName || "");
      setLinkedInSettings((prev) => prev ? {
        ...prev,
        postingTarget: selectedType,
        selectedOrgId: selectedType === "organization" ? selectedOrgId : null,
        selectedOrgName: result.organizationName,
      } : null);

      setShowSelectionModal(false);
      setLinkedInMessage({ type: "success", text: `Now posting to ${newName}` });
    } catch (err) {
      setLinkedInMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save selection" });
    } finally {
      setIsSavingSelection(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    try {
      const response = await fetch("/api/linkedin/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect");
      }

      // Clear local state
      setLinkedInConnected(false);
      setLinkedInName("");
      setLinkedInMessage({ type: "success", text: "LinkedIn disconnected successfully" });
    } catch (error) {
      setLinkedInMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to disconnect LinkedIn",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and preferences
          </p>
        </div>
        <Link href="/docs/settings/profile-settings" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
          Help?
        </Link>
      </div>

      {/* LinkedIn Connection - Read-only for team members (they use owner's LinkedIn) */}
      {isTeamMember ? (
        // Team member view - read-only status of owner's LinkedIn
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
          <div className={cn(
            "px-5 py-4",
            linkedInConnected ? "bg-linkedin" : "bg-slate-400"
          )}>
            <div className="flex items-center gap-3">
              <Linkedin className="w-6 h-6 text-white" />
              <div>
                <h3 className="text-white font-semibold">
                  {linkedInConnected ? "LinkedIn Connected" : "LinkedIn Not Connected"}
                </h3>
                <p className="text-white/80 text-sm">
                  {linkedInConnected
                    ? "Team owner's account is linked for publishing"
                    : "Ask team owner to connect LinkedIn in Settings"}
                </p>
              </div>
            </div>
          </div>
          {linkedInConnected && (
            <div className="bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-4">
                {linkedInSettings?.postingTarget === "organization" ? (
                  <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-8 h-8 text-slate-500" />
                  </div>
                ) : linkedInSettings?.profileImage ? (
                  <Image
                    src={linkedInSettings.profileImage}
                    alt={linkedInName}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-linkedin flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {linkedInName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg">{linkedInName}</p>
                  <p className="text-sm text-muted-foreground">
                    {linkedInSettings?.postingTarget === "organization" ? "Company Page" : "Personal Profile"}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Ready to publish</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Owner view - full controls
        <>
          {linkedInMessage && (
            <div className={cn(
              "p-3 rounded-lg text-sm flex items-center gap-2",
              linkedInMessage.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            )}>
              {linkedInMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {linkedInMessage.text}
            </div>
          )}

          {linkedInConnected ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
              {/* Header with LinkedIn blue */}
              <div className="bg-linkedin px-5 py-4">
                <div className="flex items-center gap-3">
                  <Linkedin className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="text-white font-semibold">LinkedIn Connected</h3>
                    <p className="text-white/80 text-sm">Your account is linked for direct publishing</p>
                  </div>
                </div>
              </div>
              {/* Profile info */}
              <div className="bg-white dark:bg-slate-900 p-5">
                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {linkedInSettings?.postingTarget === "organization" ? (
                      (() => {
                        const selectedOrg = linkedInSettings?.organizations?.find(o => o.id === linkedInSettings?.selectedOrgId);
                        return selectedOrg?.logoUrl ? (
                          <Image
                            src={selectedOrg.logoUrl}
                            alt={linkedInName}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <Building2 className="w-8 h-8 text-slate-500" />
                          </div>
                        );
                      })()
                    ) : session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={linkedInName}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-linkedin flex items-center justify-center text-white text-xl font-bold shrink-0">
                        {linkedInName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">{linkedInName}</p>
                      <p className="text-sm text-muted-foreground">
                        {linkedInSettings?.postingTarget === "organization" ? "Company Page" : "Personal Profile"}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-sm text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        <span>Ready to publish</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {linkedInSettings?.hasOrganizations && (
                      <Button
                        variant="outline"
                        onClick={handleChangePostingTarget}
                      >
                        Change
                      </Button>
                    )}
                    <Button
                      onClick={handleDisconnectLinkedIn}
                      className="bg-red-600 hover:bg-red-700 text-white border-0"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg bg-linkedin">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Linkedin className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-white font-semibold text-lg">Connect LinkedIn</h3>
                    <p className="text-white/80 text-sm">Publish posts directly to your LinkedIn profile</p>
                  </div>
                </div>
                <Button
                  onClick={handleConnectLinkedIn}
                  disabled={isConnectingLinkedIn}
                  className="bg-white hover:bg-slate-100 text-linkedin font-semibold px-6 shrink-0"
                >
                  {isConnectingLinkedIn ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Linkedin className="w-4 h-4 mr-2" />
                  )}
                  {isConnectingLinkedIn ? "Connecting..." : "Connect"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Community Management API Connection - shown below main LinkedIn connect for owners only */}
      {!isTeamMember && linkedInConnected && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
          <div className={cn(
            "px-5 py-4",
            linkedInSettings?.communityConnected ? "bg-emerald-600" : "bg-slate-500"
          )}>
            <div className="flex items-center gap-3">
              <Linkedin className="w-6 h-6 text-white" />
              <div>
                <h3 className="text-white font-semibold">
                  {linkedInSettings?.communityConnected ? "Community Management API Connected" : "Community Management API"}
                </h3>
                <p className="text-white/80 text-sm">
                  {linkedInSettings?.communityConnected
                    ? "Post analytics and follower tracking enabled"
                    : "Connect to unlock per-post analytics and follower tracking"}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5">
            {linkedInSettings?.communityConnected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Connected</p>
                    <p className="text-xs text-muted-foreground">Per-post analytics and follower tracking active</p>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    setIsDisconnectingCommunity(true);
                    try {
                      const res = await fetch("/api/linkedin/community/disconnect", { method: "POST" });
                      if (res.ok) {
                        setLinkedInSettings(prev => prev ? {
                          ...prev,
                          communityConnected: false,
                          organizations: [],
                          hasOrganizations: false,
                        } : prev);
                        setLinkedInMessage({ type: "success", text: "Community Management API disconnected" });
                        // Reset posting target display to profile
                        setLinkedInName(linkedInSettings?.profileName || "");
                      }
                    } catch {
                      setLinkedInMessage({ type: "error", text: "Failed to disconnect Community API" });
                    } finally {
                      setIsDisconnectingCommunity(false);
                    }
                  }}
                  disabled={isDisconnectingCommunity}
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  {isDisconnectingCommunity ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    This second OAuth connection grants access to post analytics and follower growth tracking via LinkedIn&apos;s Community Management API.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsConnectingCommunity(true);
                    const width = 600;
                    const height = 700;
                    const left = window.screenX + (window.innerWidth - width) / 2;
                    const top = window.screenY + (window.innerHeight - height) / 2;
                    const popup = window.open(
                      "/api/linkedin/auth?app=community&popup=true&mode=connect",
                      "linkedin-community-auth",
                      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
                    );
                    const handleCommunityMessage = (event: MessageEvent) => {
                      if (event.data?.type === "linkedin-success" || event.data?.type === "linkedin-error") {
                        setIsConnectingCommunity(false);
                        window.removeEventListener("message", handleCommunityMessage);
                        if (event.data?.type === "linkedin-success") {
                          // Refetch settings then show org selection if available
                          fetch("/api/linkedin/settings").then(r => r.json()).then(data => {
                            setLinkedInSettings(prev => prev ? {
                              ...prev,
                              communityConnected: true,
                              organizations: data.organizations || [],
                              hasOrganizations: data.hasOrganizations || false,
                            } : prev);
                            if (event.data.showSelection) {
                              setShowSelectionModal(true);
                            } else {
                              setLinkedInMessage({ type: "success", text: "Community Management API connected!" });
                            }
                          });
                        }
                      }
                    };
                    window.addEventListener("message", handleCommunityMessage);
                    const checkInterval = setInterval(() => {
                      if (popup?.closed) {
                        clearInterval(checkInterval);
                        setIsConnectingCommunity(false);
                        window.removeEventListener("message", handleCommunityMessage);
                      }
                    }, 1000);
                  }}
                  disabled={isConnectingCommunity}
                  className="bg-linkedin hover:bg-linkedin/90 text-white shrink-0"
                >
                  {isConnectingCommunity ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Linkedin className="w-4 h-4 mr-2" />
                  )}
                  {isConnectingCommunity ? "Connecting..." : "Connect Community API"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Settings */}
      <Card id="account">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-600" />
            Account
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountMessage && (
            <div className={cn(
              "p-3 rounded-lg text-sm flex items-center gap-2",
              accountMessage.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            )}>
              {accountMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {accountMessage.text}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  placeholder="Your name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>

          {/* Password Change - Inline */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Change Password
              </span>
              <span className="text-xs text-muted-foreground font-normal">(leave empty for no changes)</span>
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveAccount}
            disabled={isSavingAccount}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            {isSavingAccount ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-600" />
            Timezone
          </CardTitle>
          <CardDescription>
            Set your timezone for scheduling posts at the right time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {timezoneMessage && (
            <div className={cn(
              "p-3 rounded-lg text-sm flex items-center gap-2",
              timezoneMessage.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            )}>
              {timezoneMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {timezoneMessage.text}
            </div>
          )}

          <div className="max-w-sm space-y-2">
            <Label htmlFor="timezone">Your Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone" className="w-full text-left">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Select your timezone" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {/* Auto-detect option */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                  Recommended
                </div>
                <SelectItem value="auto">
                  <div className="flex flex-col">
                    <span>Your device timezone</span>
                    <span className="text-xs text-muted-foreground">{browserTimezone || "Detecting..."}</span>
                  </div>
                </SelectItem>
                <div className="my-1 border-t border-border" />
                {/* Popular timezones by region */}
                {["Americas", "Europe", "Asia & Pacific", "Africa"].map((region) => (
                  <div key={region}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      {region}
                    </div>
                    {timezones
                      .filter((tz) => tz.region === region)
                      .map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {timezone === "auto"
                ? `Posts will be scheduled using your device timezone (${browserTimezone || "detecting..."})`
                : "When you schedule a post for 9:00 AM, it will be published at 9:00 AM in this timezone"}
            </p>
          </div>

          <Button
            onClick={handleSaveTimezone}
            disabled={isSavingTimezone}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            {isSavingTimezone ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Timezone
          </Button>
        </CardContent>
      </Card>

      {/* Security / 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600" />
            Security
          </CardTitle>
          <CardDescription>
            Protect your account with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFAMessage && (
            <div className={cn(
              "p-3 rounded-lg text-sm flex items-center gap-2",
              twoFAMessage.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            )}>
              {twoFAMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {twoFAMessage.text}
            </div>
          )}

          <div className={cn(
            "flex items-center justify-between p-4 rounded-xl border",
            twoFactorEnabled
              ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                twoFactorEnabled ? "bg-green-500/20" : "bg-slate-200 dark:bg-slate-700"
              )}>
                <Smartphone className={cn("w-5 h-5", twoFactorEnabled ? "text-green-600" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled ? "Protected with authenticator app" : "Add an extra layer of security"}
                </p>
              </div>
            </div>
            {twoFactorEnabled ? (
              <Button
                variant="outline"
                onClick={() => {
                  setDisable2FAPassword("");
                  setTwoFAMessage(null);
                  setShow2FADisable(true);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Disable
              </Button>
            ) : (
              <Button
                onClick={handleSetup2FA}
                disabled={isSettingUp2FA}
                className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {isSettingUp2FA ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                Enable
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-600" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}

            {secret && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Or enter this code manually:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(secret)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShow2FASetup(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleVerify2FA}
                disabled={verificationCode.length !== 6 || isSettingUp2FA}
                className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {isSettingUp2FA ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Verify & Enable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Confirmation Dialog */}
      <Dialog open={show2FADisable} onOpenChange={setShow2FADisable}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Enter your password to confirm disabling 2FA. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {twoFAMessage && (
              <div className={`p-3 rounded-lg text-sm ${twoFAMessage.type === "error" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"}`}>
                {twoFAMessage.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="disable-2fa-password">Password</Label>
              <Input
                id="disable-2fa-password"
                type="password"
                placeholder="Enter your password"
                value={disable2FAPassword}
                onChange={(e) => setDisable2FAPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShow2FADisable(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={!disable2FAPassword || isDisabling2FA}
                className="flex-1"
              >
                {isDisabling2FA ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Disable 2FA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* LinkedIn Posting Target Selection Dialog */}
      <Dialog open={showSelectionModal} onOpenChange={setShowSelectionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Linkedin className="w-5 h-5 text-linkedin" />
              Where do you want to post?
            </DialogTitle>
            <DialogDescription>
              Choose whether to publish content to your personal profile or company page
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Personal Profile Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedType("profile");
                setSelectedOrgId(null);
              }}
              className={cn(
                "w-full p-3 rounded-xl border-2 transition-all text-left",
                selectedType === "profile"
                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              <div className="flex items-center gap-3">
                {linkedInSettings?.profileImage ? (
                  <Image
                    src={linkedInSettings.profileImage}
                    alt={linkedInSettings.profileName || "Profile"}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-linkedin flex items-center justify-center text-white font-bold">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{linkedInSettings?.profileName || "Your Profile"}</span>
                    {selectedType === "profile" && (
                      <span className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Personal Profile</p>
                </div>
              </div>
            </button>

            {/* Company Pages */}
            {linkedInSettings?.organizations && linkedInSettings.organizations.length > 0 && (
              <>
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-950 px-2 text-muted-foreground">
                      Company pages
                    </span>
                  </div>
                </div>

                {linkedInSettings.organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setSelectedType("organization");
                      setSelectedOrgId(org.id);
                    }}
                    className={cn(
                      "w-full p-3 rounded-xl border-2 transition-all text-left",
                      selectedType === "organization" && selectedOrgId === org.id
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {org.logoUrl ? (
                        <Image
                          src={org.logoUrl}
                          alt={org.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{org.name}</span>
                          {selectedType === "organization" && selectedOrgId === org.id && (
                            <span className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Company Page</p>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSelectionModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSaveSelection}
              disabled={isSavingSelection}
              className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isSavingSelection ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-cyan-600" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how LinkedGrow looks for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-3 block">Theme Preference</Label>
            {mounted && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[140px]",
                    theme === "system"
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    theme === "system" ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">System</p>
                    <p className="text-xs text-muted-foreground">Auto</p>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[140px]",
                    theme === "light"
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    theme === "light" ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Light</p>
                    <p className="text-xs text-muted-foreground">Always</p>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[140px]",
                    theme === "dark"
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    theme === "dark" ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Dark</p>
                    <p className="text-xs text-muted-foreground">Always</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice & Style - Hidden for team members (they use owner's settings) */}
      {!isTeamMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-cyan-600" />
              Voice & Style
            </CardTitle>
            <CardDescription>
              Train the AI to write in your unique voice and style
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {voiceMessage && (
              <div className={cn(
                "p-3 rounded-lg text-sm flex items-center gap-2",
                voiceMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
              )}>
                {voiceMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {voiceMessage.text}
              </div>
            )}

            {/* Sample Posts */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">Sample Posts</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste 3-5 of your best LinkedIn posts so the AI can learn your writing style
                </p>
              </div>

              {voiceSettings.samplePosts.length > 0 && (
                <div className="space-y-2">
                  {voiceSettings.samplePosts.map((post, index) => (
                    <div
                      key={index}
                      className="relative p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border group"
                    >
                      <p className="text-sm pr-8 line-clamp-3 whitespace-pre-wrap">{post}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveSamplePost(index)}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-muted-foreground mt-2 block">
                        Sample {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {voiceSettings.samplePosts.length < 5 && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste one of your LinkedIn posts here..."
                    value={newSamplePost}
                    onChange={(e) => setNewSamplePost(e.target.value)}
                    className="min-h-25"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSamplePost}
                    disabled={!newSamplePost.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sample Post ({voiceSettings.samplePosts.length}/5)
                  </Button>
                </div>
              )}
            </div>

            {/* Writing Tone */}
            <div className="space-y-2">
              <Label>Writing Tone</Label>
              <p className="text-sm text-muted-foreground">
                Describe how you want your posts to sound
              </p>
              <Input
                placeholder="e.g., Professional but friendly, conversational, inspiring, direct and bold"
                value={voiceSettings.writingTone}
                onChange={(e) => {
                  const val = e.target.value;
                  setVoiceSettings((prev) => ({ ...prev, writingTone: val }));
                }}
              />
            </div>

            {/* Never Mention */}
            <div className="space-y-2">
              <Label>Never Mention</Label>
              <p className="text-sm text-muted-foreground">
                Topics, competitors, or words the AI should avoid
              </p>
              <Textarea
                placeholder="e.g., Competitor names, sensitive topics, specific products..."
                value={voiceSettings.neverMention}
                onChange={(e) => {
                  const val = e.target.value;
                  setVoiceSettings((prev) => ({ ...prev, neverMention: val }));
                }}
                className="min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleSaveVoiceSettings}
              disabled={isSavingVoice}
              className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isSavingVoice ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Voice Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Business Profile - Hidden for team members (they use owner's settings) */}
      {!isTeamMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-600" />
              Business Profile
            </CardTitle>
            <CardDescription>
              Help AI understand your brand and create more relevant content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  placeholder="Your company or personal brand name"
                  value={businessProfile.name}
                  onChange={(e) =>
                    setBusinessProfile({ ...businessProfile, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Niche / Industry</Label>
                <Input
                  placeholder="e.g., SaaS, Marketing, Tech"
                  value={businessProfile.niche}
                  onChange={(e) =>
                    setBusinessProfile({ ...businessProfile, niche: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>What do you do?</Label>
              <Textarea
                placeholder="Brief description of your business or what you help people with"
                value={businessProfile.description}
                onChange={(e) =>
                  setBusinessProfile({
                    ...businessProfile,
                    description: e.target.value,
                  })
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Products / Services</Label>
              <Textarea
                placeholder="List your main products or services (one per line)"
                value={businessProfile.products}
                onChange={(e) =>
                  setBusinessProfile({
                    ...businessProfile,
                    products: e.target.value,
                  })
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Input
                  placeholder="e.g., Startup founders, Marketing managers"
                  value={businessProfile.audience}
                  onChange={(e) =>
                    setBusinessProfile({
                      ...businessProfile,
                      audience: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Key Topics</Label>
                <Input
                  placeholder="e.g., Productivity, Leadership, AI"
                  value={businessProfile.topics}
                  onChange={(e) =>
                    setBusinessProfile({
                      ...businessProfile,
                      topics: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Context / FAQ</Label>
              <Textarea
                placeholder="Any other information that would help AI create better content for you..."
                value={businessProfile.context}
                onChange={(e) =>
                  setBusinessProfile({
                    ...businessProfile,
                    context: e.target.value,
                  })
                }
                className="min-h-[100px]"
              />
            </div>

            {profileMessage && (
              <div
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg text-sm",
                  profileMessage.type === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                )}
              >
                {profileMessage.type === "success" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {profileMessage.text}
              </div>
            )}

            <Button
              onClick={handleSaveBusinessProfile}
              disabled={isSavingProfile}
              className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Business Profile
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
