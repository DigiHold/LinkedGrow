// Cookie Consent Management with Google Consent Mode V2
// Supports EU/EEA opt-in and rest-of-world opt-out

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface ConsentPreferences {
  necessary: boolean; // Always true, includes language/theme preferences (strictly necessary)
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

// Detect if user is in EEA region using Vercel's geo headers
export async function detectUserRegion(): Promise<GeoLocation> {
  try {
    // Use our internal API that uses Vercel's built-in geo headers
    // 99%+ country accuracy, zero cold start, completely free
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
  } catch {
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

// Get or create a visitor ID for consent tracking
function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  const VISITOR_ID_KEY = 'linkedgrow_visitor_id';
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
}

// Track consent to server for analytics
async function trackConsentToServer(preferences: ConsentPreferences): Promise<void> {
  try {
    const visitorId = getVisitorId();
    if (!visitorId) return;

    // Determine status
    let status: 'accepted_all' | 'rejected_all' | 'customized' = 'customized';
    if (preferences.analytics && preferences.marketing) {
      status = 'accepted_all';
    } else if (!preferences.analytics && !preferences.marketing) {
      status = 'rejected_all';
    }

    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        status,
      }),
    });
  } catch {
    // Silent fail - don't break the user experience
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

  // Track consent to server for analytics (non-blocking)
  trackConsentToServer(fullPreferences);

  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('consentUpdated', { detail: fullPreferences }));
}

// Clear consent (for user to re-choose)
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONSENT_STORAGE_KEY);
}

// Initialize Google Consent Mode V2 with default denied state
// IMPORTANT: This function updates consent AFTER geo-detection
// The initial defaults are set in GoogleTagManager.tsx with all denied
export function initGoogleConsentMode(isEEA: boolean): void {
  if (typeof window === 'undefined') return;

  // Ensure gtag is available
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }

  // GDPR Compliance:
  // - EEA: Keep everything denied until explicit opt-in
  // - Non-EEA: Update to granted (opt-out model) - they can reject later
  if (!isEEA) {
    // Non-EEA: Update consent to granted (opt-out model)
    // User can still reject via cookie banner
    gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted',
      'functionality_storage': 'granted',
      'personalization_storage': 'granted',
    });
  }
  // For EEA: consent remains denied (as set in initial defaults)
  // Will only be updated when user explicitly accepts via cookie banner
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
    'functionality_storage': 'granted', // Always granted - language/theme are strictly necessary
    'personalization_storage': 'granted', // Always granted - language/theme are strictly necessary
  });
}

// Accept all cookies
export function acceptAllCookies(isEEA: boolean): void {
  saveConsent({
    necessary: true,
    analytics: true,
    marketing: true,
    isEEA,
  });
}

// Reject all non-essential cookies
export function rejectAllCookies(isEEA: boolean): void {
  saveConsent({
    necessary: true,
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
    description: 'Required for the website to function properly. These cannot be disabled.',
    required: true,
    cookies: [
      { name: 'Session cookies', purpose: 'Keep you logged in securely' },
      { name: 'Security tokens', purpose: 'Protect against fraud and attacks' },
      { name: 'Consent preferences', purpose: 'Remember your cookie choices' },
      { name: 'Language settings', purpose: 'Display content in your preferred language' },
      { name: 'Theme preference', purpose: 'Remember your dark/light mode choice' },
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
