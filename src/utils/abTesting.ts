/**
 * A/B Testing System
 * Dynamically assigns and tracks different variants
 */

import { supabase } from "@/integrations/supabase/client";

export type ABVariant =
  | 'ultra-simple'    // Shows offer immediately, no gate
  | 'email-first'     // Email gate, then reveal
  | 'progressive'     // Email → Offer → Interest capture
  | 'social-proof'    // Testimonials before offer
  | 'urgency';        // Timer/scarcity elements

export interface ABTestConfig {
  enabled: boolean;
  variants: {
    variant: ABVariant;
    weight: number; // Percentage allocation (0-100)
    active: boolean;
  }[];
}

// Default configuration - Easy to change!
export const AB_TEST_CONFIG: ABTestConfig = {
  enabled: true,
  variants: [
    { variant: 'ultra-simple', weight: 50, active: true },
    { variant: 'email-first', weight: 50, active: true },
    // Add more variants here:
    // { variant: 'progressive', weight: 33, active: false },
    // { variant: 'social-proof', weight: 33, active: false },
    // { variant: 'urgency', weight: 34, active: false },
  ],
};

/**
 * Get or assign A/B test variant for a property
 */
export function getABVariant(propertyId: string): ABVariant {
  // If A/B testing disabled, return default
  if (!AB_TEST_CONFIG.enabled) {
    return 'ultra-simple';
  }

  // Check if user already has assigned variant (stored in localStorage)
  const storageKey = `ab-variant-${propertyId}`;
  const stored = localStorage.getItem(storageKey);

  if (stored && isValidVariant(stored)) {
    return stored as ABVariant;
  }

  // Assign new variant based on weights
  const variant = assignVariant();
  localStorage.setItem(storageKey, variant);

  // Track assignment
  trackABEvent(propertyId, variant, 'variant_assigned');

  return variant;
}

/**
 * Assign variant based on configured weights
 */
function assignVariant(): ABVariant {
  const activeVariants = AB_TEST_CONFIG.variants.filter(v => v.active);

  if (activeVariants.length === 0) {
    return 'ultra-simple';
  }

  // Normalize weights
  const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0);
  const random = Math.random() * totalWeight;

  let cumulative = 0;
  for (const config of activeVariants) {
    cumulative += config.weight;
    if (random <= cumulative) {
      return config.variant;
    }
  }

  return activeVariants[0].variant;
}

/**
 * Check if variant is valid
 */
function isValidVariant(variant: string): boolean {
  return ['ultra-simple', 'email-first', 'progressive', 'social-proof', 'urgency'].includes(variant);
}

/**
 * Track A/B test event
 */
export async function trackABEvent(
  propertyId: string,
  variant: ABVariant,
  event: ABEventType,
  metadata?: Record<string, any>
) {
  const eventData = {
    property_id: propertyId,
    variant: variant,
    event: event,
    metadata: metadata || {},
    session_id: getSessionId(),
  };

  try {
    // Send to database
    const { error } = await supabase
      .from('ab_test_events')
      .insert(eventData);

    if (error) {
      console.error('Error tracking AB event:', error);
      // Fallback to local storage
      saveEventLocally(eventData);
    } else {
      console.log('AB Test Event tracked:', eventData);
    }
  } catch (error) {
    console.error('Error tracking AB event:', error);
    // Fallback to local storage
    saveEventLocally(eventData);
  }
}

/**
 * Event types for tracking
 */
export type ABEventType =
  | 'variant_assigned'    // User assigned to variant
  | 'page_view'          // Viewed property page
  | 'email_submitted'    // Submitted email (email-first variant)
  | 'offer_revealed'     // Saw the cash offer amount
  | 'clicked_accept'     // Clicked "Accept Offer"
  | 'clicked_questions'  // Clicked "I Have Questions"
  | 'clicked_interested' // Clicked "I'm Interested"
  | 'form_started'       // Started filling contact form
  | 'form_submitted'     // Completed contact form
  | 'phone_collected'    // Provided phone number
  | 'exit';              // Left the page

export interface ABTestEvent {
  property_id: string;
  variant: ABVariant;
  event: ABEventType;
  metadata?: Record<string, any>;
  session_id: string;
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('ab-session-id');

  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ab-session-id', sessionId);
  }

  return sessionId;
}

/**
 * Save event locally (fallback/cache)
 */
function saveEventLocally(event: ABTestEvent) {
  try {
    const stored = localStorage.getItem('ab-events') || '[]';
    const events = JSON.parse(stored);
    events.push(event);

    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    localStorage.setItem('ab-events', JSON.stringify(events));
  } catch (error) {
    console.error('Error saving event locally:', error);
  }
}

/**
 * Get local events (for debugging)
 */
export function getLocalEvents(): ABTestEvent[] {
  try {
    const stored = localStorage.getItem('ab-events') || '[]';
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Clear variant assignment (for testing)
 */
export function clearVariantAssignment(propertyId: string) {
  localStorage.removeItem(`ab-variant-${propertyId}`);
}

/**
 * Get variant statistics (client-side only)
 */
export function getVariantStats(propertyId: string) {
  const events = getLocalEvents().filter(e => e.property_id === propertyId);

  const stats = {
    variant: getABVariant(propertyId),
    totalEvents: events.length,
    eventBreakdown: {} as Record<ABEventType, number>,
  };

  events.forEach(event => {
    stats.eventBreakdown[event.event] = (stats.eventBreakdown[event.event] || 0) + 1;
  });

  return stats;
}
