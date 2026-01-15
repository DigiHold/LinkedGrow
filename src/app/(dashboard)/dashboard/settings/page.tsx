"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: session, update: updateSession } = useSession();
  const [mounted, setMounted] = useState(false);

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

  // LinkedIn connection
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [linkedInName, setLinkedInName] = useState("");
  const [linkedInMessage, setLinkedInMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if LinkedIn is connected via cookie
    const linkedInProfileName = document.cookie
      .split("; ")
      .find((row) => row.startsWith("linkedin_profile_name="))
      ?.split("=")[1];
    if (linkedInProfileName) {
      setLinkedInConnected(true);
      setLinkedInName(decodeURIComponent(linkedInProfileName));
    }

    // Listen for popup messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "linkedin-success") {
        setLinkedInConnected(true);
        setLinkedInName(event.data.name || "");
        setLinkedInMessage({ type: "success", text: "LinkedIn connected successfully!" });
        setIsConnectingLinkedIn(false);
      } else if (event.data?.type === "linkedin-error") {
        setLinkedInMessage({ type: "error", text: event.data.error || "Failed to connect LinkedIn" });
        setIsConnectingLinkedIn(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Load user data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setTwoFactorEnabled(session.user.twoFactorEnabled || false);
    }
  }, [session]);

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

  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveBusinessProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessDescription: `${businessProfile.name ? `Business: ${businessProfile.name}. ` : ""}${businessProfile.description}${businessProfile.products ? ` Products/Services: ${businessProfile.products}` : ""}${businessProfile.niche ? ` Industry: ${businessProfile.niche}` : ""}${businessProfile.context ? ` Additional context: ${businessProfile.context}` : ""}`,
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

  const handleDisconnectLinkedIn = () => {
    // Clear LinkedIn cookies
    document.cookie = "linkedin_connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "linkedin_profile_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setLinkedInConnected(false);
    setLinkedInName("");
    setLinkedInMessage({ type: "success", text: "LinkedIn disconnected successfully" });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
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

      {/* LinkedIn Connection */}
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
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-linkedin flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {linkedInName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-lg">{linkedInName}</p>
                  <p className="text-sm text-muted-foreground">LinkedIn Profile</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Ready to publish</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleDisconnectLinkedIn}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                Disconnect
              </Button>
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
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
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
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            {isSavingAccount ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
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
