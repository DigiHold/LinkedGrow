"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { redirectToCheckout } from "@/lib/checkout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Key,
  User,
  Building2,
  Eye,
  EyeOff,
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
  Trash2,
  Loader2,
  X,
  Copy,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessFeature, PlanId } from "@/lib/plans";
import { ImageIcon, Sparkles, Crown } from "lucide-react";

// SVG icons for AI providers
const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
  </svg>
);

const AnthropicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.257 0h3.603l6.57 16.96h-3.603L6.57 3.52zM0 20.48h3.603L6.57 3.52H3.603L0 20.48z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GroqIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

const aiProviders = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4, GPT-4o, GPT-3.5",
    placeholder: "sk-...",
    icon: OpenAIIcon,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5, Claude 3",
    placeholder: "sk-ant-...",
    icon: AnthropicIcon,
  },
  {
    id: "google",
    name: "Google AI",
    description: "Gemini Pro, Gemini Flash",
    placeholder: "AIza...",
    icon: GoogleIcon,
  },
  {
    id: "groq",
    name: "Groq",
    description: "Llama 3, Mixtral (Fast)",
    placeholder: "gsk_...",
    icon: GroqIcon,
  },
];

// Image generation providers
const DallEIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z"/>
  </svg>
);

const GeminiImageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const imageProviders = [
  {
    id: "gemini-image",
    name: "Gemini 3 Pro Image",
    description: "Google's best image model - $0.13/image",
    placeholder: "AIza...",
    icon: GeminiImageIcon,
    note: "Recommended - Highest quality, uses your Google AI key",
  },
  {
    id: "openai-dalle",
    name: "DALL-E 3",
    description: "OpenAI's image generation",
    placeholder: "sk-...",
    icon: DallEIcon,
    note: "Uses same key as OpenAI text",
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: session, update: updateSession } = useSession();
  const [mounted, setMounted] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isDeletingApiKey, setIsDeletingApiKey] = useState(false);

  // Account settings
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [accountMessage, setAccountMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [twoFAMessage, setTwoFAMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Image API settings
  const [showImageApiKey, setShowImageApiKey] = useState(false);
  const [imageApiKey, setImageApiKey] = useState("");
  const [selectedImageProvider, setSelectedImageProvider] = useState("gemini-image");
  const [hasImageApiKey, setHasImageApiKey] = useState(false);
  const [isSavingImageApiKey, setIsSavingImageApiKey] = useState(false);
  const [isDeletingImageApiKey, setIsDeletingImageApiKey] = useState(false);

  // Get user's plan from session
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const hasImageAccess = canAccessFeature(userPlan, "imageGeneration");

  // Business profile
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    name: "",
    description: "",
    products: "",
    niche: "",
    audience: "",
    topics: "",
    doNotMention: "",
    context: "",
  });

  useEffect(() => {
    setMounted(true);
    // Scroll to hash section if present
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  // Load user data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setTwoFactorEnabled(session.user.twoFactorEnabled || false);
    }
  }, [session]);

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setHasApiKey(data.hasApiKey);
          if (data.aiProvider) {
            setSelectedProvider(data.aiProvider);
          }
          // Load image API settings
          setHasImageApiKey(data.hasImageApiKey || false);
          if (data.imageProvider) {
            setSelectedImageProvider(data.imageProvider);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsSavingApiKey(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: selectedProvider,
          aiApiKey: apiKey,
        }),
      });

      if (response.ok) {
        setHasApiKey(true);
        setApiKey("");
        setShowApiKey(false);
      }
    } catch (error) {
      console.error("Failed to save API key:", error);
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleDeleteApiKey = async () => {
    setIsDeletingApiKey(true);
    try {
      const response = await fetch("/api/user/settings?field=aiApiKey", {
        method: "DELETE",
      });

      if (response.ok) {
        setHasApiKey(false);
        setApiKey("");
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    } finally {
      setIsDeletingApiKey(false);
    }
  };

  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    setAccountMessage(null);

    try {
      const response = await fetch("/api/user/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        await updateSession();
        setAccountMessage({ type: "success", text: "Account updated successfully" });
      } else {
        const data = await response.json();
        setAccountMessage({ type: "error", text: data.error || "Failed to update account" });
      }
    } catch (error) {
      setAccountMessage({ type: "error", text: "Failed to update account" });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setAccountMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setAccountMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setIsChangingPassword(true);
    setAccountMessage(null);

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setAccountMessage({ type: "success", text: "Password changed successfully" });
      } else {
        const data = await response.json();
        setAccountMessage({ type: "error", text: data.error || "Failed to change password" });
      }
    } catch (error) {
      setAccountMessage({ type: "error", text: "Failed to change password" });
    } finally {
      setIsChangingPassword(false);
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
    setIsDisabling2FA(true);
    setTwoFAMessage(null);

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
      });

      if (response.ok) {
        setTwoFactorEnabled(false);
        await updateSession();
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

  const handleSaveBusinessProfile = async () => {
    setIsSavingProfile(true);
    // TODO: Implement business profile API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSavingProfile(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, API keys, and preferences
        </p>
      </div>

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
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

          <Button
            onClick={handleSaveAccount}
            disabled={isSavingAccount}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            {isSavingAccount ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>

          {/* Password Change */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
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
              <Button
                variant="outline"
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword}
              >
                {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                Change Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI API Keys */}
      <Card id="ai-api-keys">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-600" />
            AI API Keys
          </CardTitle>
          <CardDescription>
            Connect your own AI provider. Your keys are encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Selector */}
          <div className="flex flex-wrap gap-2">
            {aiProviders.map((provider) => {
              const Icon = provider.icon;
              return (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                    selectedProvider === provider.id
                      ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  <Icon />
                  {provider.name}
                </button>
              );
            })}
          </div>

          {/* Active Provider Config */}
          {aiProviders
            .filter((p) => p.id === selectedProvider)
            .map((provider) => {
              const Icon = provider.icon;
              return (
                <div key={provider.id} className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <Icon />
                        </div>
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {provider.description}
                          </p>
                        </div>
                      </div>
                      {hasApiKey && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>

                    {hasApiKey ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          value="••••••••••••••••••••••••"
                          disabled
                          className="flex-1 bg-white dark:bg-slate-800"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleDeleteApiKey}
                          disabled={isDeletingApiKey}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {isDeletingApiKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            type={showApiKey ? "text" : "password"}
                            placeholder={provider.placeholder}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="pr-10 bg-white dark:bg-slate-800"
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <Button
                          onClick={handleSaveApiKey}
                          disabled={isSavingApiKey || !apiKey.trim()}
                          className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                        >
                          {isSavingApiKey ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save API Key
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800">
            <AlertCircle className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
            <p className="text-sm text-cyan-700 dark:text-cyan-300">
              Your API keys are encrypted with AES-256 and never shared. You only pay for what you use directly to the provider.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Image API Keys - Plan Gated */}
      <Card className={cn(!hasImageAccess && "relative overflow-hidden")}>
        {!hasImageAccess && (
          <div className="absolute inset-0 bg-slate-50/95 dark:bg-slate-900/95 z-10 flex items-center justify-center">
            <div className="text-center p-6 max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-linear-to-r from-purple-500/20 to-pink-600/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Pro Feature</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI Image Generation is available on the Pro plan and above
              </p>
              <Button
                className="bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                onClick={() => redirectToCheckout("pro", session?.user?.email || "")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            AI Image Generation
            {!hasImageAccess && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-normal">
                Pro
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Connect an image generation API for creating visuals with your posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Selector */}
          <div className="flex flex-wrap gap-2">
            {imageProviders.map((provider) => {
              const Icon = provider.icon;
              return (
                <button
                  key={provider.id}
                  onClick={() => setSelectedImageProvider(provider.id)}
                  disabled={!hasImageAccess}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                    selectedImageProvider === provider.id
                      ? "bg-linear-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700",
                    !hasImageAccess && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon />
                  {provider.name}
                </button>
              );
            })}
          </div>

          {/* Active Provider Config */}
          {imageProviders
            .filter((p) => p.id === selectedImageProvider)
            .map((provider) => {
              const Icon = provider.icon;
              return (
                <div key={provider.id} className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                          <Icon />
                        </div>
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {provider.description}
                          </p>
                        </div>
                      </div>
                      {hasImageApiKey && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>

                    {provider.note && (
                      <p className="text-xs text-muted-foreground mb-3 p-2 rounded bg-purple-50 dark:bg-purple-900/10">
                        {provider.note}
                      </p>
                    )}

                    {hasImageApiKey ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          value="••••••••••••••••••••••••"
                          disabled
                          className="flex-1 bg-white dark:bg-slate-800"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            setIsDeletingImageApiKey(true);
                            try {
                              const response = await fetch("/api/user/settings?field=imageApiKey", {
                                method: "DELETE",
                              });
                              if (response.ok) {
                                setHasImageApiKey(false);
                                setImageApiKey("");
                              }
                            } catch (error) {
                              console.error("Failed to delete image API key:", error);
                            } finally {
                              setIsDeletingImageApiKey(false);
                            }
                          }}
                          disabled={isDeletingImageApiKey || !hasImageAccess}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {isDeletingImageApiKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            type={showImageApiKey ? "text" : "password"}
                            placeholder={provider.placeholder}
                            value={imageApiKey}
                            onChange={(e) => setImageApiKey(e.target.value)}
                            disabled={!hasImageAccess}
                            className="pr-10 bg-white dark:bg-slate-800"
                          />
                          <button
                            onClick={() => setShowImageApiKey(!showImageApiKey)}
                            disabled={!hasImageAccess}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                          >
                            {showImageApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <Button
                          onClick={async () => {
                            if (!imageApiKey.trim()) return;
                            setIsSavingImageApiKey(true);
                            try {
                              const response = await fetch("/api/user/settings", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  imageProvider: selectedImageProvider,
                                  imageApiKey: imageApiKey,
                                }),
                              });
                              if (response.ok) {
                                setHasImageApiKey(true);
                                setImageApiKey("");
                                setShowImageApiKey(false);
                              }
                            } catch (error) {
                              console.error("Failed to save image API key:", error);
                            } finally {
                              setIsSavingImageApiKey(false);
                            }
                          }}
                          disabled={isSavingImageApiKey || !imageApiKey.trim() || !hasImageAccess}
                          className="w-full bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        >
                          {isSavingImageApiKey ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Image API Key
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
            <ImageIcon className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>BYOK:</strong> Use your own API key - you pay directly to the provider (Google, OpenAI). LinkedGrow never sees your costs.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            LinkedIn Connection
          </CardTitle>
          <CardDescription>
            Connect your LinkedIn account for direct publishing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#0A66C2]/10 flex items-center justify-center mb-4">
              <Linkedin className="w-8 h-8 text-[#0A66C2]" />
            </div>
            <h4 className="font-medium mb-2">Connect LinkedIn</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Publish posts directly from LinkedGrow to your LinkedIn profile
            </p>
            <Button className="bg-[#0A66C2] hover:bg-[#004182]">
              <Linkedin className="w-4 h-4 mr-2" />
              Coming Soon
            </Button>
          </div>
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
                onClick={handleDisable2FA}
                disabled={isDisabling2FA}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isDisabling2FA ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Disable
              </Button>
            ) : (
              <Button
                onClick={handleSetup2FA}
                disabled={isSettingUp2FA}
                className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
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
                className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {isSettingUp2FA ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Verify & Enable
              </Button>
            </div>
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

      {/* Business Profile */}
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
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              Things AI Should NEVER Mention
            </Label>
            <Textarea
              placeholder="Competitors, sensitive topics, incorrect claims about your business..."
              value={businessProfile.doNotMention}
              onChange={(e) =>
                setBusinessProfile({
                  ...businessProfile,
                  doNotMention: e.target.value,
                })
              }
              className="min-h-[80px]"
            />
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

          <Button
            onClick={handleSaveBusinessProfile}
            disabled={isSavingProfile}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            {isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Business Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
