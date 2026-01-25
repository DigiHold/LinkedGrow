// Shared types for carousel components

export interface BrandingData {
  logoUrl?: string;
  avatarUrl?: string;
  handle?: string;
  website?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Slide types for different carousel slide layouts (legacy)
export type SlideType = 'hook' | 'content' | 'stat' | 'quote' | 'list' | 'cta';
