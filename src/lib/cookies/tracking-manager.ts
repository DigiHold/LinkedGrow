// Unified Tracking Manager for Dynamic Script Loading/Unloading
// Supports: Google Tag Manager, Meta Pixel, and future scripts

export interface TrackingConfig {
  gtmId?: string;
  ga4MeasurementId?: string; // G-XXXXXXX - for direct cookie creation on consent
  metaPixelId?: string;
}

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

// All tracking cookies to clear on reject
const TRACKING_COOKIES = [
  // Google Analytics / GTM
  '_ga', '_gid', '_gat', '_gat_gtag', '_gcl_au', '_gcl_aw', '_gac_',
  '__utma', '__utmb', '__utmc', '__utmz', '__utmv', '__utmt',
  // Meta/Facebook
  '_fbp', '_fbc', 'fr', 'datr', 'sb', 'wd',
  // Bing/Microsoft
  '_uetmsclkid', '_uetsid', '_uetvid', 'MUID',
  // TikTok
  '_ttp', '_tt_enable_cookie', 'tt_webid', 'tt_webid_v2',
  // Twitter/X
  'muc_ads', 'personalization_id', 'guest_id',
  // General advertising
  'NID', 'IDE', '1P_JAR', 'ANID', 'CONSENT',
];

// Track which scripts are currently loaded
const loadedScripts: Set<string> = new Set();

/**
 * Initialize dataLayer for GTM/GA
 */
function initDataLayer(): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
}

/**
 * Push to dataLayer
 */
function gtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  initDataLayer();
  window.dataLayer.push(args);
}

/**
 * GA4 Measurement ID - extracted from GTM or set directly
 * This is needed to create GA4 cookies immediately on consent
 */
let ga4MeasurementId: string | null = null;

/**
 * Set GA4 Measurement ID for direct cookie creation
 */
export function setGA4MeasurementId(measurementId: string): void {
  ga4MeasurementId = measurementId;
}

/**
 * Check if GA4 cookies already exist (meaning GTM already initialized GA4)
 */
function hasGA4Cookies(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('_ga=') || document.cookie.includes('_ga_');
}

/**
 * Inject GA4 gtag.js directly to create cookies immediately
 * This bypasses GTM's trigger system which doesn't fire on mid-session consent
 * Only injects if GA4 cookies don't already exist (to avoid conflict with GTM)
 */
function injectGA4Direct(measurementId: string): void {
  if (typeof window === 'undefined' || !measurementId) return;

  // Skip if GA4 cookies already exist (GTM already handled it on page load)
  if (hasGA4Cookies()) {
    return;
  }

  const scriptId = `ga4-${measurementId}`;
  if (document.getElementById(scriptId)) return;

  // Create gtag script
  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

  script.onload = () => {
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
      page_path: window.location.pathname,
      page_title: document.title,
      page_location: window.location.href,
    });
  };

  document.head.appendChild(script);
}

/**
 * Trigger events to activate GA4 after mid-session consent
 * Fires multiple event types to ensure GA4 picks up the consent and starts tracking
 */
function triggerPageView(): void {
  if (typeof window === 'undefined') return;
  initDataLayer();

  // 1. Push consent_granted event - GTM can use this as a trigger
  window.dataLayer.push({
    event: 'consent_granted',
  });

  // 2. Push page_view event for GA4
  window.dataLayer.push({
    event: 'page_view',
    page_path: window.location.pathname,
    page_title: document.title,
    page_location: window.location.href,
  });

  // 3. Push gtm.init and gtm.dom events that GTM normally fires on page load
  window.dataLayer.push({ event: 'gtm.dom' });
  window.dataLayer.push({ event: 'gtm.load' });

  // 4. If we have a GA4 measurement ID, inject gtag.js directly
  // This creates _ga and _gid cookies immediately
  if (ga4MeasurementId) {
    injectGA4Direct(ga4MeasurementId);
  }
}

/**
 * Update Google Consent Mode
 */
function updateGoogleConsent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return;
  initDataLayer();

  window.dataLayer.push(['consent', 'update', {
    'analytics_storage': preferences.analytics ? 'granted' : 'denied',
    'ad_storage': preferences.marketing ? 'granted' : 'denied',
    'ad_user_data': preferences.marketing ? 'granted' : 'denied',
    'ad_personalization': preferences.marketing ? 'granted' : 'denied',
    'functionality_storage': preferences.functional ? 'granted' : 'denied',
    'personalization_storage': preferences.functional ? 'granted' : 'denied',
  }]);
}

/**
 * Inject Google Tag Manager script
 */
export function injectGTM(gtmId: string): void {
  if (typeof window === 'undefined') return;

  if (!gtmId) {
return;
  }

  const scriptId = `gtm-${gtmId}`;
  if (loadedScripts.has(scriptId)) {
    // Already loaded, just trigger page view
    triggerPageView();
    return;
  }

  initDataLayer();
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });

  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;

  script.onload = () => {
    loadedScripts.add(scriptId);
    // Give GTM more time to fully initialize before triggering page view
    // This ensures GA4 tag is ready to receive events
    setTimeout(triggerPageView, 500);
  };

  script.onerror = () => {
    // GTM failed to load
  };

  document.head.appendChild(script);
}

/**
 * Inject Meta/Facebook Pixel script
 */
export function injectMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined' || !pixelId) return;

  const scriptId = `meta-pixel-${pixelId}`;
  if (loadedScripts.has(scriptId)) {
    // Already loaded, trigger PageView
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
    return;
  }

  // Initialize fbq with proper typing
  const fbqFunc: FbqFunction = function(...args: unknown[]) {
    if (fbqFunc.callMethod) {
      fbqFunc.callMethod.apply(fbqFunc, args);
    } else {
      fbqFunc.queue.push(args);
    }
  };
  fbqFunc.push = fbqFunc;
  fbqFunc.loaded = false;
  fbqFunc.version = '2.0';
  fbqFunc.queue = [];

  window.fbq = window.fbq || fbqFunc;

  const fbq = window.fbq as FbqFunction;
  if (!fbq.loaded) {
    fbq.loaded = true;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';

  script.onload = () => {
    loadedScripts.add(scriptId);
    if (window.fbq) {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  };

  document.head.appendChild(script);
}

/**
 * Remove a script by ID pattern
 */
function removeScript(idPattern: string): void {
  if (typeof document === 'undefined') return;

  const scripts = document.querySelectorAll(`script[id^="${idPattern}"]`);
  scripts.forEach(script => {
    script.remove();
  });

  // Also remove by src pattern
  const srcPatterns: Record<string, string[]> = {
    'gtm': ['googletagmanager.com/gtm.js'],
    'meta-pixel': ['connect.facebook.net', 'fbevents.js'],
  };

  const patterns = srcPatterns[idPattern] || [];
  patterns.forEach(pattern => {
    document.querySelectorAll(`script[src*="${pattern}"]`).forEach(script => {
      script.remove();
    });
  });
}

/**
 * Clear a single cookie with various domain configurations
 */
function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;

  const hostname = window.location.hostname;
  const paths = ['/', ''];
  const domains = [
    '',
    hostname,
    `.${hostname}`,
    // Handle subdomains
    hostname.split('.').slice(-2).join('.'),
    `.${hostname.split('.').slice(-2).join('.')}`,
  ];

  const expiry = 'expires=Thu, 01 Jan 1970 00:00:00 UTC';

  // Try all combinations of path and domain
  paths.forEach(path => {
    domains.forEach(domain => {
      const pathStr = path ? `; path=${path}` : '';
      const domainStr = domain ? `; domain=${domain}` : '';
      document.cookie = `${name}=${pathStr}${domainStr}; ${expiry}`;
      document.cookie = `${name}=; ${expiry}${pathStr}${domainStr}`;
    });
  });
}

/**
 * Clear all tracking cookies
 */
export function clearAllTrackingCookies(): void {
  if (typeof document === 'undefined') return;

  // Clear known tracking cookies
  TRACKING_COOKIES.forEach(clearCookie);

  // Also clear any cookies that match common tracking patterns
  const currentCookies = document.cookie.split(';');
  currentCookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    // Check for common tracking cookie patterns
    if (
      name.startsWith('_ga') ||
      name.startsWith('_gid') ||
      name.startsWith('_gat') ||
      name.startsWith('_gcl') ||
      name.startsWith('_fb') ||
      name.startsWith('_tt') ||
      name.startsWith('__utm')
    ) {
      clearCookie(name);
    }
  });
}

/**
 * Remove all tracking scripts and clear globals
 */
export function removeAllTrackingScripts(): void {
  if (typeof window === 'undefined') return;

  // Remove scripts
  removeScript('gtm');
  removeScript('meta-pixel');

  // Clear globals
  if (window.google_tag_manager) {
    delete window.google_tag_manager;
  }

  // Reset fbq
  if (window.fbq) {
    window.fbq = undefined;
  }

  // Clear dataLayer (keep array but empty it)
  if (window.dataLayer) {
    window.dataLayer.length = 0;
  }

  // Clear loaded scripts tracking
  loadedScripts.clear();
}

/**
 * Activate all tracking based on consent
 */
export function activateTracking(config: TrackingConfig, preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return;

  // First update Google Consent Mode
  updateGoogleConsent(preferences);

  // Store GA4 measurement ID for direct injection
  if (config.ga4MeasurementId) {
    setGA4MeasurementId(config.ga4MeasurementId);
  }

  // Load GTM if analytics or marketing is enabled
  if ((preferences.analytics || preferences.marketing) && config.gtmId) {
    injectGTM(config.gtmId);
  }

  // Load Meta Pixel if marketing is enabled
  if (preferences.marketing && config.metaPixelId) {
    injectMetaPixel(config.metaPixelId);
  }

}

/**
 * Deactivate all tracking - remove scripts and clear cookies
 */
export function deactivateTracking(): void {
  if (typeof window === 'undefined') return;

  // Update consent to deny all
  updateGoogleConsent({ analytics: false, marketing: false, functional: false });

  // Remove all tracking scripts
  removeAllTrackingScripts();

  // Clear all tracking cookies
  clearAllTrackingCookies();
}

/**
 * Handle consent change - main entry point
 */
export function handleConsentChange(
  config: TrackingConfig,
  preferences: ConsentPreferences,
  accepted: boolean
): void {
  if (accepted && (preferences.analytics || preferences.marketing)) {
    activateTracking(config, preferences);
  } else {
    deactivateTracking();
  }
}

// TypeScript declarations for global tracking objects
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: FbqFunction;
    google_tag_manager?: unknown;
  }
}

interface FbqFunction {
  (...args: unknown[]): void;
  push: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
  queue: unknown[];
  callMethod?: (...args: unknown[]) => void;
}

export {};
