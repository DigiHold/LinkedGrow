// Cookie Consent Management with Google Consent Mode V2
// Supports EU/EEA opt-in and rest-of-world opt-out

export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export interface ConsentPreferences {
  necessary: boolean; // Always true, required for site functionality
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
  isEEA: boolean;
}

export interface GeoLocation {
  isEEA: boolean;
  country: string;
  countryCode: string;
}

// EEA country codes (EU + EEA + Switzerland + UK for GDPR purposes)
const EEA_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', // EU countries
  'IS', 'LI', 'NO', // EEA non-EU
  'CH', // Switzerland (GDPR-equivalent)
  'GB', // UK (GDPR equivalent)
];

const CONSENT_STORAGE_KEY = 'linkedgrow_consent';
const CONSENT_VERSION = '2.0';

// Detect if user is in EEA region using MaxMind GeoLite2 database
export async function detectUserRegion(): Promise<GeoLocation> {
  try {
    // Use our internal API that uses MaxMind GeoLite2 database
    // 99.8% accuracy, no external API calls, completely free
    const response = await fetch('/api/geo', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Geo-detection failed');
    }

    const data = await response.json();

    return {
      isEEA: data.isEEA ?? true,
      country: data.countryName || 'Unknown',
      countryCode: data.countryCode || '',
    };
  } catch (error) {
    console.warn('Geo-detection failed, defaulting to EEA (strict mode):', error);
    // Default to EEA for privacy safety
    return {
      isEEA: true,
      country: 'Unknown',
      countryCode: '',
    };
  }
}

// Get stored consent preferences
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const preferences = JSON.parse(stored) as ConsentPreferences;

    // Check if consent version is current
    if (preferences.version !== CONSENT_VERSION) {
      // Clear outdated consent
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }

    return preferences;
  } catch {
    return null;
  }
}

// Save consent preferences
export function saveConsent(preferences: Omit<ConsentPreferences, 'timestamp' | 'version'>): void {
  if (typeof window === 'undefined') return;

  const fullPreferences: ConsentPreferences = {
    ...preferences,
    necessary: true, // Always true
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullPreferences));

  // Update Google Consent Mode
  updateGoogleConsent(fullPreferences);

  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('consentUpdated', { detail: fullPreferences }));
}

// Clear consent (for user to re-choose)
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONSENT_STORAGE_KEY);
}

// Initialize Google Consent Mode V2 with default denied state
export function initGoogleConsentMode(isEEA: boolean): void {
  if (typeof window === 'undefined') return;

  // Ensure gtag is available
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }

  // Set default consent state
  // For EEA: all denied by default (opt-in required)
  // For non-EEA: analytics/marketing granted by default (opt-out available)
  gtag('consent', 'default', {
    'analytics_storage': isEEA ? 'denied' : 'granted',
    'ad_storage': isEEA ? 'denied' : 'granted',
    'ad_user_data': isEEA ? 'denied' : 'granted',
    'ad_personalization': isEEA ? 'denied' : 'granted',
    'functionality_storage': isEEA ? 'denied' : 'granted',
    'personalization_storage': isEEA ? 'denied' : 'granted',
    'security_storage': 'granted', // Always granted for security
    'wait_for_update': 500, // Wait for user consent
  });

  // Set region-specific defaults
  if (isEEA) {
    gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'region': EEA_COUNTRIES,
    });
  }
}

// Update Google Consent Mode based on user preferences
export function updateGoogleConsent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }

  gtag('consent', 'update', {
    'analytics_storage': preferences.analytics ? 'granted' : 'denied',
    'ad_storage': preferences.marketing ? 'granted' : 'denied',
    'ad_user_data': preferences.marketing ? 'granted' : 'denied',
    'ad_personalization': preferences.marketing ? 'granted' : 'denied',
    'functionality_storage': preferences.functional ? 'granted' : 'denied',
    'personalization_storage': preferences.functional ? 'granted' : 'denied',
  });
}

// Accept all cookies
export function acceptAllCookies(isEEA: boolean): void {
  saveConsent({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: true,
    isEEA,
  });
}

// Reject all non-essential cookies
export function rejectAllCookies(isEEA: boolean): void {
  saveConsent({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    isEEA,
  });
}

// Cookie categories with descriptions
export const COOKIE_CATEGORIES = {
  necessary: {
    id: 'necessary',
    name: 'Essential',
    description: 'Required for the website to function. These cannot be disabled.',
    required: true,
    cookies: [
      { name: 'Session cookies', purpose: 'Keep you logged in securely' },
      { name: 'Security tokens', purpose: 'Protect against fraud and attacks' },
      { name: 'Consent preferences', purpose: 'Remember your cookie choices' },
    ],
  },
  functional: {
    id: 'functional',
    name: 'Functional',
    description: 'Remember your preferences like language and display settings.',
    required: false,
    cookies: [
      { name: 'Theme preference', purpose: 'Remember dark/light mode' },
      { name: 'Language settings', purpose: 'Display content in your language' },
      { name: 'UI preferences', purpose: 'Remember sidebar and layout choices' },
    ],
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Help us understand how visitors use our site to improve it.',
    required: false,
    cookies: [
      { name: 'Google Analytics', purpose: 'Measure site traffic and usage patterns' },
      { name: 'Performance monitoring', purpose: 'Identify and fix issues' },
    ],
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    description: 'Used to show you relevant ads on other platforms.',
    required: false,
    cookies: [
      { name: 'Google Ads', purpose: 'Show personalized ads on Google' },
      { name: 'Facebook Pixel', purpose: 'Show personalized ads on Facebook/Instagram' },
      { name: 'LinkedIn Insight', purpose: 'Show personalized ads on LinkedIn' },
      { name: 'TikTok Pixel', purpose: 'Show personalized ads on TikTok' },
    ],
  },
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
