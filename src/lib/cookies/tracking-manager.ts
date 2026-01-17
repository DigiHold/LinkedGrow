// Unified Tracking Manager for Dynamic Script Loading/Unloading
// Supports: Google Tag Manager, Meta Pixel, Hotjar, and future scripts

export interface TrackingConfig {
  gtmId?: string;
  metaPixelId?: string;
  hotjarId?: string;
  hotjarVersion?: number;
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
  // Hotjar
  '_hjSessionUser', '_hjSession', '_hjid', '_hjFirstSeen', '_hjIncludedInSessionSample',
  '_hjAbsoluteSessionInProgress', '_hjTLDTest', '_hjIncludedInPageviewSample',
  // Bing/Microsoft
  '_uetmsclkid', '_uetsid', '_uetvid', 'MUID',
  // LinkedIn
  'li_fat_id', '_li_ss', 'li_sugr', 'bcookie', 'bscookie', 'lang', 'lidc',
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
 * Trigger a page view event to activate GA4
 * This is critical for mid-session consent - GA4 needs a page_view event to fire
 */
function triggerPageView(): void {
  if (typeof window === 'undefined') return;
  initDataLayer();

  // Push page_view event for GA4
  window.dataLayer.push({
    event: 'page_view',
    page_path: window.location.pathname,
    page_title: document.title,
    page_location: window.location.href,
  });

  // Also trigger gtag page_view for direct GA4 integration
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: window.location.pathname,
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  console.log('[GTM] Page view event triggered');
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
    console.warn('[GTM] No GTM ID provided, skipping injection');
    return;
  }

  const scriptId = `gtm-${gtmId}`;
  if (loadedScripts.has(scriptId)) {
    // Already loaded, just trigger page view
    console.log('[GTM] Already loaded, triggering page view');
    triggerPageView();
    return;
  }

  console.log('[GTM] Injecting GTM script:', gtmId);

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
    console.log('[GTM] Script loaded successfully');
    // Give GTM more time to fully initialize before triggering page view
    // This ensures GA4 tag is ready to receive events
    setTimeout(triggerPageView, 500);
  };

  script.onerror = () => {
    console.error('[GTM] Failed to load GTM script');
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
 * Inject Hotjar script
 */
export function injectHotjar(hjId: string, hjVersion: number = 6): void {
  if (typeof window === 'undefined' || !hjId) return;

  const scriptId = `hotjar-${hjId}`;
  if (loadedScripts.has(scriptId)) return;

  // Initialize Hotjar with proper typing
  const hjFunc: HotjarFunction = function(...args: unknown[]) {
    hjFunc.q = hjFunc.q || [];
    hjFunc.q.push(args);
  };
  hjFunc.q = [];

  window.hj = window.hj || hjFunc;
  window._hjSettings = { hjid: parseInt(hjId), hjsv: hjVersion };

  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.src = `https://static.hotjar.com/c/hotjar-${hjId}.js?sv=${hjVersion}`;

  script.onload = () => {
    loadedScripts.add(scriptId);
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
    'hotjar': ['static.hotjar.com'],
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
      name.startsWith('_hj') ||
      name.startsWith('_tt') ||
      name.startsWith('_li') ||
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
  removeScript('hotjar');

  // Clear globals
  if (window.google_tag_manager) {
    delete window.google_tag_manager;
  }

  // Reset fbq
  if (window.fbq) {
    window.fbq = undefined;
  }

  // Reset Hotjar
  if (window.hj) {
    window.hj = undefined;
  }
  if (window._hjSettings) {
    delete window._hjSettings;
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

  console.log('[Tracking] Activating tracking with config:', config);
  console.log('[Tracking] Preferences:', preferences);

  // First update Google Consent Mode
  updateGoogleConsent(preferences);

  // Load GTM if analytics or marketing is enabled
  if ((preferences.analytics || preferences.marketing) && config.gtmId) {
    console.log('[Tracking] Loading GTM...');
    injectGTM(config.gtmId);
  } else {
    console.log('[Tracking] Skipping GTM - analytics:', preferences.analytics, 'marketing:', preferences.marketing, 'gtmId:', config.gtmId);
  }

  // Load Meta Pixel if marketing is enabled
  if (preferences.marketing && config.metaPixelId) {
    injectMetaPixel(config.metaPixelId);
  }

  // Load Hotjar if analytics is enabled
  if (preferences.analytics && config.hotjarId) {
    injectHotjar(config.hotjarId, config.hotjarVersion);
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
  console.log('[Consent] handleConsentChange called - accepted:', accepted, 'preferences:', preferences);

  if (accepted && (preferences.analytics || preferences.marketing)) {
    console.log('[Consent] Activating tracking...');
    activateTracking(config, preferences);
  } else {
    console.log('[Consent] Deactivating tracking...');
    deactivateTracking();
  }
}

// TypeScript declarations for global tracking objects
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: FbqFunction;
    hj?: HotjarFunction;
    _hjSettings?: { hjid: number; hjsv: number };
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

interface HotjarFunction {
  (...args: unknown[]): void;
  q?: unknown[];
}

export {};
