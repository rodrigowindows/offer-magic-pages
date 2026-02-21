-- Campaign Analytics Queries
-- Execute these queries in Supabase SQL Editor to get insights about your campaigns

-- 1. Overall Campaign Performance (Last 30 days)
SELECT
  DATE_TRUNC('day', visited_at) as date,
  COUNT(*) as total_visits,
  COUNT(DISTINCT property_id) as unique_properties,
  ROUND(
    COUNT(DISTINCT property_id)::decimal / COUNT(*)::decimal * 100, 1
  ) as conversion_rate
FROM property_visits
WHERE visited_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', visited_at)
ORDER BY date DESC;

-- 2. Traffic Sources Breakdown
SELECT
  visit_source,
  COUNT(*) as visits,
  COUNT(DISTINCT property_id) as unique_properties,
  ROUND(
    COUNT(DISTINCT property_id)::decimal / COUNT(*)::decimal * 100, 1
  ) as conversion_rate
FROM property_visits
WHERE visited_at > NOW() - INTERVAL '30 days'
GROUP BY visit_source
ORDER BY visits DESC;

-- 3. Campaign Performance Comparison
SELECT
  campaign_name,
  visit_source,
  COUNT(*) as visits,
  COUNT(DISTINCT property_id) as unique_properties,
  ROUND(
    COUNT(DISTINCT property_id)::decimal / COUNT(*)::decimal * 100, 1
  ) as conversion_rate
FROM property_visits
WHERE visited_at > NOW() - INTERVAL '30 days'
  AND campaign_name IS NOT NULL
GROUP BY campaign_name, visit_source
ORDER BY visits DESC;

-- 4. Top Performing Properties
SELECT
  pv.property_id,
  COUNT(*) as total_visits,
  STRING_AGG(DISTINCT pv.visit_source, ', ') as sources,
  STRING_AGG(DISTINCT pv.campaign_name, ', ') as campaigns,
  MAX(pv.visited_at) as last_visit
FROM property_visits pv
WHERE pv.visited_at > NOW() - INTERVAL '30 days'
GROUP BY pv.property_id
ORDER BY total_visits DESC
LIMIT 20;

-- 5. Hourly Traffic Pattern
SELECT
  EXTRACT(hour from visited_at) as hour,
  COUNT(*) as visits,
  visit_source
FROM property_visits
WHERE visited_at > NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(hour from visited_at), visit_source
ORDER BY hour, visits DESC;

-- 6. UTM Campaign Analysis
SELECT
  utm_campaign,
  utm_source,
  utm_medium,
  COUNT(*) as visits,
  COUNT(DISTINCT property_id) as unique_properties
FROM property_visits
WHERE utm_campaign IS NOT NULL
  AND visited_at > NOW() - INTERVAL '30 days'
GROUP BY utm_campaign, utm_source, utm_medium
ORDER BY visits DESC;

-- 7. Referrer Analysis
SELECT
  CASE
    WHEN referrer LIKE '%google%' THEN 'Google'
    WHEN referrer LIKE '%facebook%' THEN 'Facebook'
    WHEN referrer LIKE '%twitter%' THEN 'Twitter'
    WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
    WHEN referrer = 'direct' OR referrer IS NULL THEN 'Direct'
    ELSE 'Other'
  END as referrer_category,
  COUNT(*) as visits
FROM property_visits
WHERE visited_at > NOW() - INTERVAL '30 days'
GROUP BY
  CASE
    WHEN referrer LIKE '%google%' THEN 'Google'
    WHEN referrer LIKE '%facebook%' THEN 'Facebook'
    WHEN referrer LIKE '%twitter%' THEN 'Twitter'
    WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
    WHEN referrer = 'direct' OR referrer IS NULL THEN 'Direct'
    ELSE 'Other'
  END
ORDER BY visits DESC;

-- 8. Campaign Funnel Analysis (if you have lead capture)
-- This assumes you have a leads table with source tracking
/*
SELECT
  pv.visit_source,
  pv.campaign_name,
  COUNT(DISTINCT pv.property_id) as property_views,
  COUNT(DISTINCT l.id) as leads_generated,
  ROUND(
    COUNT(DISTINCT l.id)::decimal / COUNT(DISTINCT pv.property_id)::decimal * 100, 1
  ) as conversion_rate
FROM property_visits pv
LEFT JOIN leads l ON l.property_id = pv.property_id
  AND l.created_at > pv.visited_at
  AND l.created_at < pv.visited_at + INTERVAL '30 days'
WHERE pv.visited_at > NOW() - INTERVAL '30 days'
GROUP BY pv.visit_source, pv.campaign_name
ORDER BY property_views DESC;
*/

-- 9. Create a view for easy dashboard queries
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT
  DATE_TRUNC('day', visited_at) as date,
  visit_source,
  campaign_name,
  COUNT(*) as visits,
  COUNT(DISTINCT property_id) as unique_properties,
  ROUND(
    COUNT(DISTINCT property_id)::decimal / COUNT(*)::decimal * 100, 1
  ) as conversion_rate
FROM property_visits
WHERE visited_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', visited_at), visit_source, campaign_name;

-- Query the view
SELECT * FROM campaign_analytics
ORDER BY date DESC, visits DESC
LIMIT 50;</content>
<parameter name="filePath">g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns\campaign_analytics_queries.sql