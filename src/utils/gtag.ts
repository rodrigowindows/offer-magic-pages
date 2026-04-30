/**
 * Lightweight wrapper around window.gtag (Google Analytics / GTAG).
 * Safe to call even when GA is not loaded — no-ops in that case.
 */
type GtagParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (command: 'event' | 'config' | 'set', action: string, params?: GtagParams) => void;
    dataLayer?: unknown[];
  }
}

export const trackGAEvent = (eventName: string, params: GtagParams = {}): void => {
  try {
    if (typeof window === 'undefined') return;

    // Primary path: gtag.js
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
      return;
    }

    // Fallback: push to dataLayer (works for GTM containers loaded without gtag wrapper)
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch (err) {
    // Never let analytics break the UI
    console.warn('[gtag] tracking failed:', err);
  }
};
