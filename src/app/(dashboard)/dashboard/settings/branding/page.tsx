"use client";

import { useState, useEffect } from "react";
import {
  Palette,
  Upload,
  Check,
  Loader2,
  Image as ImageIcon,
  Type,
  Trash2,
  Sparkles,
  FileImage,
  FileText,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { cn } from "@/lib/utils";

const FONT_OPTIONS = [
  { value: "inter", label: "Inter", preview: "Modern & Clean" },
  { value: "roboto", label: "Roboto", preview: "Professional" },
  { value: "poppins", label: "Poppins", preview: "Friendly & Round" },
  { value: "montserrat", label: "Montserrat", preview: "Bold & Strong" },
  { value: "playfair", label: "Playfair Display", preview: "Elegant & Classic" },
  { value: "merriweather", label: "Merriweather", preview: "Readable & Warm" },
];

export default function BrandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Branding settings
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0891b2"); // Cyan-600 default
  const [secondaryColor, setSecondaryColor] = useState("#2563eb"); // Blue-600 default
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
    <FeatureGate feature="customBranding">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            Custom Branding
          </h1>
          <p className="text-muted-foreground mt-2">
            Make your content uniquely yours with custom branding
          </p>
        </div>

        {/* What is Custom Branding */}
        <Card className="bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-cyan-900 dark:text-cyan-100 mb-2">
                  What is Custom Branding?
                </h3>
                <p className="text-cyan-800 dark:text-cyan-200 mb-4">
                  Custom branding lets you personalize all your exported content with your company's visual identity.
                  Your logo, colors, and fonts will be automatically applied to make your content instantly recognizable
                  and professionally branded.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <Presentation className="w-5 h-5 text-cyan-600" />
                    <div>
                      <p className="font-medium text-sm">Carousels</p>
                      <p className="text-xs text-muted-foreground">Branded slide exports</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <FileImage className="w-5 h-5 text-cyan-600" />
                    <div>
                      <p className="font-medium text-sm">Images</p>
                      <p className="text-xs text-muted-foreground">Quote cards & visuals</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <FileText className="w-5 h-5 text-cyan-600" />
                    <div>
                      <p className="font-medium text-sm">Documents</p>
                      <p className="text-xs text-muted-foreground">PDF reports & exports</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Settings Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Logo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-cyan-600" />
                    Brand Logo
                  </CardTitle>
                  <CardDescription>
                    Upload your company logo to appear on all exports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    {logoUrl ? (
                      <div className="relative">
                        <div className="w-24 h-24 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 flex items-center justify-center">
                          <img
                            src={logoUrl}
                            alt="Brand logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <button
                          onClick={handleRemoveLogo}
                          disabled={isSaving}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <label className="cursor-pointer inline-block">
                        <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/25">
                          <Upload className="w-4 h-4" />
                          {logoUrl ? "Change Logo" : "Upload Logo"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={isSaving}
                        />
                      </label>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Recommended: Square image (512x512px)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supported formats: PNG, JPG, SVG - Max 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-cyan-600" />
                    Brand Colors
                  </CardTitle>
                  <CardDescription>
                    Choose colors that represent your brand identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-14 h-14 rounded-xl cursor-pointer border-2 border-slate-200 dark:border-slate-700 overflow-hidden"
                            style={{ backgroundColor: primaryColor }}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            placeholder="#0891b2"
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Headers, titles, main accents
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-14 h-14 rounded-xl cursor-pointer border-2 border-slate-200 dark:border-slate-700 overflow-hidden"
                            style={{ backgroundColor: secondaryColor }}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            placeholder="#2563eb"
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Buttons, badges, highlights
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Preview Bar */}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <div
                      className="flex-1 h-8 rounded-lg"
                      style={{
                        background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground ml-2">Gradient preview</span>
                  </div>
                </CardContent>
              </Card>

              {/* Font */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5 text-cyan-600" />
                    Font Family
                  </CardTitle>
                  <CardDescription>
                    Select a font that matches your brand's personality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {FONT_OPTIONS.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => setFontFamily(font.value)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          fontFamily === font.value
                            ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-2 ring-cyan-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700"
                        )}
                      >
                        <span className="block text-lg font-medium mb-1">
                          {font.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {font.preview}
                        </span>
                        {fontFamily === font.value && (
                          <div className="mt-2">
                            <Check className="w-4 h-4 text-cyan-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button & Message */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
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
              </div>

              {message && (
                <div className={cn(
                  "p-3 rounded-lg text-sm flex items-center gap-2",
                  message.type === "success"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                )}>
                  {message.type === "success" ? <Check className="w-4 h-4" /> : null}
                  {message.text}
                </div>
              )}
            </div>

            {/* Preview Column */}
            <div className="lg:col-span-2">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    See how your branding will look on exports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Carousel Slide Preview */}
                  <div
                    className="rounded-xl overflow-hidden shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {/* Slide Header */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        {logoUrl ? (
                          <div className="w-10 h-10 rounded-lg bg-white p-1.5 flex items-center justify-center">
                            <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white/60" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-semibold text-sm">Your Brand</p>
                          <p className="text-white/70 text-xs">@yourbrand</p>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="bg-white rounded-lg p-5 shadow-lg">
                        <h3
                          className="text-xl font-bold mb-3"
                          style={{ color: primaryColor }}
                        >
                          5 Tips for Better Content
                        </h3>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: secondaryColor }}
                            />
                            <p className="text-sm text-slate-600">Know your audience</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: secondaryColor }}
                            />
                            <p className="text-sm text-slate-600">Tell compelling stories</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: secondaryColor }}
                            />
                            <p className="text-sm text-slate-600">Be consistent</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="px-3 py-1 rounded-full text-white text-xs font-medium"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Marketing
                          </span>
                          <span
                            className="px-3 py-1 rounded-full text-white text-xs font-medium"
                            style={{ backgroundColor: secondaryColor }}
                          >
                            Tips
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Slide Footer */}
                    <div className="px-5 py-3 bg-black/10">
                      <div className="flex items-center justify-between">
                        <p className="text-white/80 text-xs">Slide 1 of 5</p>
                        <p className="text-white text-xs font-medium">Swipe</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    This is a preview of how your carousel exports will look
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
