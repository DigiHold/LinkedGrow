"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Palette,
  Upload,
  Check,
  Loader2,
  Image as ImageIcon,
  Type,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";

const FONT_OPTIONS = [
  { value: "inter", label: "Inter", style: "font-sans" },
  { value: "roboto", label: "Roboto", style: "font-sans" },
  { value: "poppins", label: "Poppins", style: "font-sans" },
  { value: "montserrat", label: "Montserrat", style: "font-sans" },
  { value: "playfair", label: "Playfair Display", style: "font-serif" },
  { value: "merriweather", label: "Merriweather", style: "font-serif" },
];

export default function BrandingPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan || "free") as PlanId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Branding settings
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0a66c2"); // LinkedIn blue default
  const [secondaryColor, setSecondaryColor] = useState("#057642"); // LinkedIn green default
  const [fontFamily, setFontFamily] = useState("inter");

  // Fetch current settings
  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      const response = await fetch("/api/user/branding");
      if (response.ok) {
        const data = await response.json();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
        if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
        if (data.fontFamily) setFontFamily(data.fontFamily);
      }
    } catch (error) {
      console.error("Failed to fetch branding settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please upload an image file" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Logo must be less than 2MB" });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const response = await fetch("/api/user/branding/logo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.url);
        setMessage({ type: "success", text: "Logo uploaded successfully" });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload logo" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLogo = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/branding/logo", {
        method: "DELETE",
      });

      if (response.ok) {
        setLogoUrl(null);
        setMessage({ type: "success", text: "Logo removed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to remove logo" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          fontFamily,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Branding settings saved" });
      } else {
        throw new Error("Save failed");
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FeatureGate
      feature="customBranding"
      userPlan={userPlan}
      userEmail={session?.user?.email || ""}
    >
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-pink-500 to-orange-500 flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            Custom Branding
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Customize your brand appearance for exported carousels and documents
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Settings */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Brand Logo
                </h2>

                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative">
                      <img
                        src={logoUrl}
                        alt="Brand logo"
                        className="w-20 h-20 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}

                  <div>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                        <Upload className="w-4 h-4" />
                        {logoUrl ? "Change Logo" : "Upload Logo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      PNG, JPG or SVG, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Brand Colors
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#0a66c2"
                        className="w-32 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#057642"
                        className="w-32 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Font */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Font Family
                </h2>

                <div className="grid grid-cols-2 gap-2">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setFontFamily(font.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        fontFamily === font.value
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className={`text-sm font-medium ${font.style}`}>
                        {font.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-linear-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Branding
                  </>
                )}
              </Button>

              {message && (
                <p className={`text-sm text-center ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {message.text}
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Preview
              </h2>

              {/* Carousel Preview */}
              <div
                className="rounded-lg overflow-hidden shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="p-6">
                  {/* Header with logo */}
                  <div className="flex items-center gap-3 mb-4">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                    ) : (
                      <div className="w-10 h-10 bg-white/20 rounded-lg" />
                    )}
                    <div>
                      <p className="text-white font-bold">Your Brand</p>
                      <p className="text-white/70 text-xs">linkedin.com/in/you</p>
                    </div>
                  </div>

                  {/* Content preview */}
                  <div className="bg-white rounded-lg p-4">
                    <h3
                      className="text-xl font-bold mb-2"
                      style={{ color: primaryColor, fontFamily }}
                    >
                      Sample Carousel Slide
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      This is how your branded content will look when exported.
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-white text-xs font-medium"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        Tag 1
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-white text-xs font-medium"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Tag 2
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="px-6 py-3 text-center"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <p className="text-white text-sm font-medium">
                    Swipe for more insights
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                Your branding will be applied to carousel exports and documents
              </p>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
