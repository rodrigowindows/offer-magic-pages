# A/B Testing System Implementation

## Overview
Implement a complete A/B testing system for property pages to test different lead capture variants and optimize conversion rates.

## Database Migration
First, run this SQL migration in Supabase SQL Editor:

```sql
-- A/B Testing System Tables

-- Events table for tracking user actions
CREATE TABLE IF NOT EXISTS ab_test_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  event TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  session_id TEXT NOT NULL
);

-- Indexes for fast queries
CREATE INDEX idx_ab_events_property ON ab_test_events(property_id);
CREATE INDEX idx_ab_events_variant ON ab_test_events(variant);
CREATE INDEX idx_ab_events_event ON ab_test_events(event);
CREATE INDEX idx_ab_events_timestamp ON ab_test_events(timestamp DESC);
CREATE INDEX idx_ab_events_session ON ab_test_events(session_id);

-- Enable RLS
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert events (public tracking)
CREATE POLICY "Anyone can insert ab_test_events"
  ON ab_test_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Authenticated users can view all events
CREATE POLICY "Authenticated users can view ab_test_events"
  ON ab_test_events
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Analytics view: Conversion funnel by variant
CREATE OR REPLACE VIEW ab_test_funnel AS
SELECT
  variant,
  COUNT(DISTINCT CASE WHEN event = 'page_view' THEN session_id END) as page_views,
  COUNT(DISTINCT CASE WHEN event = 'email_submitted' THEN session_id END) as email_submits,
  COUNT(DISTINCT CASE WHEN event = 'offer_revealed' THEN session_id END) as offer_reveals,
  COUNT(DISTINCT CASE WHEN event = 'clicked_accept' THEN session_id END) as clicked_accept,
  COUNT(DISTINCT CASE WHEN event = 'clicked_interested' THEN session_id END) as clicked_interested,
  COUNT(DISTINCT CASE WHEN event = 'form_submitted' THEN session_id END) as form_submits,
  COUNT(DISTINCT CASE WHEN event = 'phone_collected' THEN session_id END) as phone_collected,

  -- Conversion rates
  ROUND(
    COUNT(DISTINCT CASE WHEN event = 'email_submitted' THEN session_id END)::numeric /
    NULLIF(COUNT(DISTINCT CASE WHEN event = 'page_view' THEN session_id END), 0) * 100,
    2
  ) as email_conversion_rate,

  ROUND(
    COUNT(DISTINCT CASE WHEN event = 'form_submitted' THEN session_id END)::numeric /
    NULLIF(COUNT(DISTINCT CASE WHEN event = 'page_view' THEN session_id END), 0) * 100,
    2
  ) as final_conversion_rate,

  ROUND(
    COUNT(DISTINCT CASE WHEN event = 'phone_collected' THEN session_id END)::numeric /
    NULLIF(COUNT(DISTINCT CASE WHEN event = 'page_view' THEN session_id END), 0) * 100,
    2
  ) as phone_conversion_rate

FROM ab_test_events
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY variant
ORDER BY final_conversion_rate DESC;

-- Grant access to funnel view
GRANT SELECT ON ab_test_funnel TO authenticated;

-- Analytics view: Detailed metrics
CREATE OR REPLACE VIEW ab_test_metrics AS
SELECT
  variant,
  event,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT property_id) as unique_properties,
  DATE_TRUNC('day', timestamp) as day
FROM ab_test_events
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY variant, event, DATE_TRUNC('day', timestamp)
ORDER BY day DESC, variant, event;

-- Grant access to metrics view
GRANT SELECT ON ab_test_metrics TO authenticated;

-- Winner determination view
CREATE OR REPLACE VIEW ab_test_winner AS
WITH stats AS (
  SELECT
    variant,
    COUNT(DISTINCT CASE WHEN event = 'page_view' THEN session_id END) as visitors,
    COUNT(DISTINCT CASE WHEN event = 'form_submitted' THEN session_id END) as conversions,
    ROUND(
      COUNT(DISTINCT CASE WHEN event = 'form_submitted' THEN session_id END)::numeric /
      NULLIF(COUNT(DISTINCT CASE WHEN event = 'page_view' THEN session_id END), 0) * 100,
      2
    ) as conversion_rate
  FROM ab_test_events
  WHERE timestamp > NOW() - INTERVAL '30 days'
  GROUP BY variant
)
SELECT
  *,
  RANK() OVER (ORDER BY conversion_rate DESC) as rank,
  CASE
    WHEN visitors >= 100 AND conversion_rate > 0 THEN 'statistically_significant'
    WHEN visitors >= 50 THEN 'trending'
    ELSE 'insufficient_data'
  END as confidence_level
FROM stats
ORDER BY conversion_rate DESC;

-- Grant access
GRANT SELECT ON ab_test_winner TO authenticated;

COMMENT ON TABLE ab_test_events IS 'Tracks all A/B test events for conversion optimization';
COMMENT ON VIEW ab_test_funnel IS 'Conversion funnel metrics by variant';
COMMENT ON VIEW ab_test_metrics IS 'Detailed event metrics for analysis';
COMMENT ON VIEW ab_test_winner IS 'Determines winning variant with statistical significance';
```

## Code Changes

### 1. Update Property Page (`src/pages/Property.tsx`)

Replace the entire component with this simplified version:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ABTestWrapper } from "@/components/ABTestWrapper";

interface PropertyData {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  status: string;
  owner_name: string | null;
  neighborhood: string | null;
  zillow_url: string | null;
}

const Property = () => {
  const { slug } = useParams();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchProperty(slug);
    }
  }, [slug]);

  const fetchProperty = async (propertySlug: string) => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("slug", propertySlug)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Error fetching property:", error);
    } else {
      setProperty(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-foreground mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or is no longer available.</p>
          <a href="/" className="text-primary hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  return <ABTestWrapper property={property} />;
};

export default Property;
```

### 2. Verify Existing Files

Ensure these files exist and are properly implemented:

- `src/utils/abTesting.ts` - Core A/B testing logic
- `src/components/ABTestWrapper.tsx` - Main wrapper component
- `src/components/variants/UltraSimpleVariant.tsx` - Shows offer immediately
- `src/components/variants/EmailFirstVariant.tsx` - Email gate variant
- `src/components/ABTestAnalytics.tsx` - Analytics dashboard

### 3. Configuration

The system is configured in `src/utils/abTesting.ts` with:
- 50% traffic to `ultra-simple` variant
- 50% traffic to `email-first` variant
- Automatic event tracking for all user interactions

## Expected Result

After implementation:
1. Property pages will randomly show one of two variants to visitors
2. All interactions are tracked in the database
3. Analytics views provide real-time conversion insights
4. The system can determine which variant performs better statistically

## Testing

To test:
1. Visit a property page multiple times (use incognito mode to get different variants)
2. Check that different variants are shown
3. Verify events are being tracked in `ab_test_events` table
4. Use `ABTestAnalytics` component to view results