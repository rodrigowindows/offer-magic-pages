# A/B Testing System - Integration Guide

## 🎯 Overview

Complete A/B testing system to dynamically test multiple lead capture variants and determine which performs best. The system automatically assigns visitors to variants, tracks all interactions, and provides statistical analysis.

## 📊 What's Been Built

### Core Infrastructure

1. **`src/utils/abTesting.ts`** - Core A/B testing logic
   - Variant assignment with configurable weights
   - Event tracking (page_view, email_submitted, form_submitted, etc.)
   - Session management
   - LocalStorage persistence

2. **Database Tables & Views**
   - `ab_test_events` - Raw event tracking table
   - `ab_test_funnel` - Conversion funnel metrics view
   - `ab_test_metrics` - Detailed event metrics view
   - `ab_test_winner` - Winner determination with statistical significance

### Variants

1. **`src/components/variants/UltraSimpleVariant.tsx`**
   - Shows offer immediately (no email gate)
   - Transparent, trust-building approach
   - Direct CTAs: "Accept Offer" or "I Have Questions"

2. **`src/components/variants/EmailFirstVariant.tsx`**
   - Requires email before revealing offer
   - Progressive disclosure: Email → Reveal → Interest → Contact
   - Uses SimpleLeadCapture + OfferRevealCard + InterestCapture flow

### Components

1. **`src/components/ABTestWrapper.tsx`**
   - Main wrapper that selects and renders variant
   - Tracks page views and exits
   - Handles variant persistence

2. **`src/components/ABTestAnalytics.tsx`**
   - Analytics dashboard with funnel visualization
   - Winner determination with confidence levels
   - Real-time metrics and insights

## 🚀 How to Use

### Step 1: Run Database Migration

```bash
# Apply the A/B testing migration
supabase migration up
```

Or run this SQL in Supabase SQL Editor:

```sql
-- Run the contents of:
-- supabase/migrations/20260101000002_ab_testing.sql
```

### Step 2: Configure Variants

Edit `src/utils/abTesting.ts` to configure which variants are active and their traffic split:

```typescript
export const AB_TEST_CONFIG: ABTestConfig = {
  enabled: true,
  variants: [
    { variant: 'ultra-simple', weight: 50, active: true },   // 50% traffic
    { variant: 'email-first', weight: 50, active: true },    // 50% traffic
    // { variant: 'progressive', weight: 0, active: false }, // Not implemented yet
  ],
};
```

**Weight Distribution:**
- Total weights must add up to 100
- Set `active: false` to disable a variant without removing it
- Example: `weight: 70` = 70% of traffic, `weight: 30` = 30% of traffic

### Step 3: Integrate into Property Page

Replace your current property page component with the ABTestWrapper:

**Before:**
```tsx
// src/pages/PropertyPage.tsx
export const PropertyPage = ({ propertySlug }: Props) => {
  const { property } = useProperty(propertySlug);

  return (
    <div>
      <PropertyDetails property={property} />
      <OfferRevealCard {...property} />
      {/* ... */}
    </div>
  );
};
```

**After:**
```tsx
// src/pages/PropertyPage.tsx
import { ABTestWrapper } from "@/components/ABTestWrapper";

export const PropertyPage = ({ propertySlug }: Props) => {
  const { property } = useProperty(propertySlug);

  return (
    <ABTestWrapper property={property} />
  );
};
```

That's it! The wrapper handles everything:
- Assigns visitor to a variant
- Tracks page view
- Renders appropriate variant
- Tracks exit on unmount

### Step 4: View Analytics

Add the analytics dashboard to your admin panel:

```tsx
// src/pages/AdminDashboard.tsx
import { ABTestAnalytics } from "@/components/ABTestAnalytics";

export const AdminDashboard = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <ABTestAnalytics />
    </div>
  );
};
```

Or create a dedicated A/B testing page:

```tsx
// src/pages/ABTestingPage.tsx
import { ABTestAnalytics } from "@/components/ABTestAnalytics";

export const ABTestingPage = () => {
  return (
    <div className="container mx-auto py-8">
      <ABTestAnalytics />
    </div>
  );
};
```

## 📈 Understanding the Analytics

### Confidence Levels

The system automatically calculates statistical significance:

- **✓ Statistically Significant** (100+ visitors)
  - Results are reliable
  - Safe to declare a winner
  - Consider making the winning variant the default

- **📈 Trending** (50-99 visitors)
  - Pattern emerging but not conclusive
  - Continue testing
  - Don't make decisions yet

- **⏳ Insufficient Data** (<50 visitors)
  - Not enough data to determine anything
  - Keep test running
  - Need more traffic

### Key Metrics

**Funnel Metrics (shown for each variant):**
- **Page Views** - Total visitors
- **Email Submits** - How many submitted email
- **Offer Reveals** - How many viewed the offer
- **Clicked Accept** - How many clicked "Accept Offer"
- **Clicked Interested** - How many clicked "I'm Interested"
- **Form Submits** - How many completed contact form
- **Phone Collected** - How many provided phone number

**Conversion Rates:**
- **Email Conversion Rate** - (Email Submits / Page Views) × 100
- **Phone Conversion Rate** - (Phone Collected / Page Views) × 100
- **Final Conversion Rate** - (Form Submits / Page Views) × 100

## 🎨 Adding New Variants

### 1. Create Variant Component

```tsx
// src/components/variants/SocialProofVariant.tsx
import type { Property } from "@/types";
import { trackABEvent } from "@/utils/abTesting";

export const SocialProofVariant = ({ property }: { property: Property }) => {
  const handleAccept = () => {
    trackABEvent(property.id, 'social-proof', 'clicked_accept');
    // Handle acceptance...
  };

  return (
    <div>
      {/* Testimonials and social proof */}
      <h2>Join 500+ Happy Homeowners</h2>
      {/* Display offer with testimonials */}
      <button onClick={handleAccept}>Accept My Offer</button>
    </div>
  );
};
```

### 2. Update ABTestWrapper

```tsx
// src/components/ABTestWrapper.tsx
import { SocialProofVariant } from "./variants/SocialProofVariant";

export const ABTestWrapper = ({ property }: ABTestWrapperProps) => {
  // ...

  switch (variant) {
    case 'ultra-simple':
      return <UltraSimpleVariant property={property} />;
    case 'email-first':
      return <EmailFirstVariant property={property} />;
    case 'social-proof':
      return <SocialProofVariant property={property} />; // NEW
    default:
      return <UltraSimpleVariant property={property} />;
  }
};
```

### 3. Update Config

```typescript
// src/utils/abTesting.ts
export const AB_TEST_CONFIG: ABTestConfig = {
  enabled: true,
  variants: [
    { variant: 'ultra-simple', weight: 33, active: true },
    { variant: 'email-first', weight: 33, active: true },
    { variant: 'social-proof', weight: 34, active: true }, // NEW
  ],
};
```

### 4. Update Analytics Labels

```tsx
// src/components/ABTestAnalytics.tsx
const getVariantLabel = (variant: ABVariant): string => {
  const labels: Record<ABVariant, string> = {
    'ultra-simple': 'Ultra Simple (No Gate)',
    'email-first': 'Email First (Gated)',
    'progressive': 'Progressive Disclosure',
    'social-proof': 'Social Proof & Testimonials', // NEW
    'urgency': 'Urgency/Scarcity',
  };
  return labels[variant] || variant;
};
```

## 🔍 Event Tracking

The system tracks these events automatically:

```typescript
// Automatically tracked by ABTestWrapper
trackABEvent(propertyId, variant, 'variant_assigned');
trackABEvent(propertyId, variant, 'page_view');
trackABEvent(propertyId, variant, 'exit');

// Track these manually in your variant components:
trackABEvent(propertyId, variant, 'email_submitted', { email });
trackABEvent(propertyId, variant, 'offer_revealed');
trackABEvent(propertyId, variant, 'clicked_accept');
trackABEvent(propertyId, variant, 'clicked_interested');
trackABEvent(propertyId, variant, 'form_submitted', { lead_data });
trackABEvent(propertyId, variant, 'phone_collected', { phone });
```

**Custom Events:**

```typescript
// Track any custom event
trackABEvent(propertyId, variant, 'custom_event', {
  custom_field: 'value',
  timestamp: Date.now(),
});
```

## 🎯 Best Practices

### 1. Test One Thing at a Time

Bad example (too many changes):
- Variant A: Long form + testimonials + urgency timer
- Variant B: Short form + no testimonials + no timer

Good example (one clear hypothesis):
- Variant A: Email gate before offer
- Variant B: No email gate (show offer immediately)

### 2. Run Tests Long Enough

- **Minimum**: 50 visitors per variant (trending results)
- **Recommended**: 100+ visitors per variant (statistically significant)
- **Ideal**: 200+ visitors per variant (highly confident)

### 3. Don't Stop Tests Too Early

Even if one variant is "winning" early, let the test run until you reach statistical significance. Early patterns can be misleading.

### 4. Consider External Factors

- Day of week (weekday vs weekend traffic may behave differently)
- Traffic source (organic vs paid vs referral)
- Time of year (seasonality)

### 5. Document Your Learnings

When a test completes, document:
- Which variant won
- By what margin (lift %)
- What you learned
- What to test next

## 📊 Example Test Sequence

### Week 1: Email Gate vs No Gate
```typescript
variants: [
  { variant: 'ultra-simple', weight: 50, active: true },
  { variant: 'email-first', weight: 50, active: true },
]
```
**Result**: Email-first wins with +15% conversion

### Week 2: Progressive vs Social Proof
```typescript
variants: [
  { variant: 'email-first', weight: 50, active: true },  // Current winner
  { variant: 'social-proof', weight: 50, active: true }, // New challenger
]
```
**Result**: Social-proof wins with +8% conversion

### Week 3: Social Proof vs Urgency
```typescript
variants: [
  { variant: 'social-proof', weight: 50, active: true }, // Current winner
  { variant: 'urgency', weight: 50, active: true },      // New challenger
]
```

This iterative approach continuously improves conversion rates.

## 🚨 Common Issues

### Issue: No data appearing in analytics

**Check:**
1. Did you run the migration? Check Supabase for `ab_test_events` table
2. Is `AB_TEST_CONFIG.enabled` set to `true`?
3. Are you using `ABTestWrapper` in your property page?
4. Open browser console - are events being logged?

### Issue: All visitors getting same variant

**Check:**
1. Clear localStorage: `localStorage.clear()`
2. Check if only one variant has `active: true`
3. Verify weights add up to 100

### Issue: Analytics showing 0% conversion despite form submits

**Check:**
1. Are you calling `trackABEvent()` when forms are submitted?
2. Check event names match exactly (case-sensitive)
3. Verify property_id is correct

## 📝 Database Queries

### Manual Analysis

```sql
-- See all events for a specific property
SELECT * FROM ab_test_events
WHERE property_id = 'your-property-id'
ORDER BY timestamp DESC;

-- See current funnel metrics
SELECT * FROM ab_test_funnel;

-- See winner determination
SELECT * FROM ab_test_winner;

-- Get detailed metrics by variant
SELECT
  variant,
  event,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM ab_test_events
GROUP BY variant, event
ORDER BY variant, count DESC;
```

## 🎉 You're Ready!

The A/B testing system is now complete and ready to use. Start sending traffic to your property pages and watch the data roll in!

**Next Steps:**
1. Run the database migration
2. Configure variants in `AB_TEST_CONFIG`
3. Integrate `ABTestWrapper` into property pages
4. Add `ABTestAnalytics` to admin dashboard
5. Send traffic and monitor results
6. Make data-driven decisions to optimize conversions!
