"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Globe,
  AtSign,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandingData } from "./types";

interface BrandingSettingsProps {
  branding: BrandingData;
  onBrandingChange: (branding: BrandingData) => void;
  showElements: {
    logo: boolean;
    avatar: boolean;
    handle: boolean;
    website: boolean;
  };
  onShowElementsChange: (elements: { logo: boolean; avatar: boolean; handle: boolean; website: boolean }) => void;
  className?: string;
}

export function BrandingSettings({
  branding,
  onBrandingChange,
  showElements,
  onShowElementsChange,
  className,
}: BrandingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasBusinessPlan, setHasBusinessPlan] = useState(false);

  // Fetch user branding data on mount
  useEffect(() => {
    loadBrandingData();
  }, []);

  const loadBrandingData = async () => {
    setIsLoading(true);
    try {
      // Fetch branding settings
      const brandingResponse = await fetch("/api/user/settings");
      if (brandingResponse.ok) {
        const brandingData = await brandingResponse.json();
        setHasBusinessPlan(true);
        onBrandingChange({
          ...branding,
          logoUrl: brandingData.brandLogoUrl || undefined,
        });
      }

      // Fetch LinkedIn profile data
      const linkedinResponse = await fetch("/api/linkedin/settings");
      if (linkedinResponse.ok) {
        const linkedinData = await linkedinResponse.json();
        onBrandingChange({
          ...branding,
          avatarUrl: linkedinData.profileImage || undefined,
          handle: linkedinData.profileName ? `@${linkedinData.profileName.toLowerCase().replace(/\s+/g, '')}` : undefined,
        });
      }

      // Fetch user profile
      const profileResponse = await fetch("/api/user/profile");
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        onBrandingChange({
          ...branding,
          avatarUrl: branding.avatarUrl || profileData.image || undefined,
          handle: branding.handle || (profileData.linkedinProfileName ? `@${profileData.linkedinProfileName.toLowerCase().replace(/\s+/g, '')}` : undefined),
        });
      }
    } catch (error) {
} finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof showElements) => {
    onShowElementsChange({
      ...showElements,
      [key]: !showElements[key],
    });
  };

  const handleInputChange = (key: keyof BrandingData, value: string) => {
    onBrandingChange({
      ...branding,
      [key]: value || undefined,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Branding Elements</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadBrandingData}
          disabled={isLoading}
          className="h-7 text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span className="ml-1">Refresh</span>
        </Button>
      </div>

      {/* Logo */}
      <div className="flex items-center justify-between py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
            ) : (
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Logo</p>
            <p className="text-xs text-muted-foreground">
              {hasBusinessPlan ? "From branding settings" : "Business plan only"}
            </p>
          </div>
        </div>
        <Switch
          checked={showElements.logo}
          onCheckedChange={() => handleToggle('logo')}
          disabled={!branding.logoUrl}
        />
      </div>

      {/* Avatar */}
      <div className="flex items-center justify-between py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {branding.avatarUrl ? (
              <img src={branding.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Profile Picture</p>
            <p className="text-xs text-muted-foreground">From LinkedIn profile</p>
          </div>
        </div>
        <Switch
          checked={showElements.avatar}
          onCheckedChange={() => handleToggle('avatar')}
          disabled={!branding.avatarUrl}
        />
      </div>

      {/* Handle */}
      <div className="space-y-2 py-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
              <AtSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Handle</p>
              <p className="text-xs text-muted-foreground">Your username or name</p>
            </div>
          </div>
          <Switch
            checked={showElements.handle}
            onCheckedChange={() => handleToggle('handle')}
          />
        </div>
        {showElements.handle && (
          <Input
            value={branding.handle || ""}
            onChange={(e) => handleInputChange('handle', e.target.value)}
            placeholder="@yourhandle"
            className="h-8 text-sm"
          />
        )}
      </div>

      {/* Website */}
      <div className="space-y-2 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
              <Globe className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Website</p>
              <p className="text-xs text-muted-foreground">Your website or link</p>
            </div>
          </div>
          <Switch
            checked={showElements.website}
            onCheckedChange={() => handleToggle('website')}
          />
        </div>
        {showElements.website && (
          <Input
            value={branding.website || ""}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="yoursite.com"
            className="h-8 text-sm"
          />
        )}
      </div>
    </div>
  );
}
