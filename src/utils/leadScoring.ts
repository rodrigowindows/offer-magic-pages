/**
 * Lead Scoring System
 * Calculates a 0-100 score based on engagement signals.
 */

export interface LeadSignals {
  pageViews: number;
  phoneClicks: number;
  emailClicks: number;
  formSubmitted: boolean;
  multipleVisits: boolean;
  isMobile: boolean;
  source: string;
  timeOnPageSeconds: number;
}

const WEIGHTS = {
  pageView: 5,          // per view, max 25
  phoneClick: 20,       // per click, max 40
  emailClick: 10,       // per click, max 20
  formSubmitted: 30,
  multipleVisits: 15,
  mobileDevice: 5,
  paidSource: 10,       // sms/email campaign source
  timeOnPage30s: 5,     // 30s+ on page
  timeOnPage60s: 10,    // 60s+ on page
} as const;

export function calculateLeadScore(signals: LeadSignals): number {
  let score = 0;

  // Page views (capped at 5)
  score += Math.min(signals.pageViews, 5) * WEIGHTS.pageView;

  // Phone clicks (capped at 2)
  score += Math.min(signals.phoneClicks, 2) * WEIGHTS.phoneClick;

  // Email clicks (capped at 2)
  score += Math.min(signals.emailClicks, 2) * WEIGHTS.emailClick;

  // Form submission
  if (signals.formSubmitted) score += WEIGHTS.formSubmitted;

  // Repeat visitor
  if (signals.multipleVisits) score += WEIGHTS.multipleVisits;

  // Mobile = higher urgency
  if (signals.isMobile) score += WEIGHTS.mobileDevice;

  // Paid source (came from campaign)
  if (['sms', 'email', 'call'].includes(signals.source)) {
    score += WEIGHTS.paidSource;
  }

  // Time on page
  if (signals.timeOnPageSeconds >= 60) {
    score += WEIGHTS.timeOnPage60s;
  } else if (signals.timeOnPageSeconds >= 30) {
    score += WEIGHTS.timeOnPage30s;
  }

  return Math.min(score, 100);
}

export function getLeadTier(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 60) return 'hot';
  if (score >= 30) return 'warm';
  return 'cold';
}

export function getLeadTierColor(tier: 'hot' | 'warm' | 'cold'): string {
  switch (tier) {
    case 'hot': return 'text-destructive';
    case 'warm': return 'text-warning';
    case 'cold': return 'text-muted-foreground';
  }
}

export function getLeadTierLabel(tier: 'hot' | 'warm' | 'cold'): string {
  switch (tier) {
    case 'hot': return '🔥 Hot Lead';
    case 'warm': return '🌤️ Warm Lead';
    case 'cold': return '❄️ Cold Lead';
  }
}
