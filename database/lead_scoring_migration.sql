-- Migration: Add lead scoring and behavior tracking tables
-- Sistema de pontuação de leads baseado em comportamento

-- Tabela para armazenar pontuações de leads
CREATE TABLE IF NOT EXISTS lead_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    engagement_level VARCHAR(20) DEFAULT 'cold' CHECK (engagement_level IN ('cold', 'warm', 'hot', 'very_hot')),
    last_activity TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    sms_responses INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    time_on_page INTEGER DEFAULT 0, -- em segundos
    preferred_contact_method VARCHAR(20) DEFAULT 'sms' CHECK (preferred_contact_method IN ('sms', 'email', 'call')),
    best_contact_time VARCHAR(20), -- formato HH:MM
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id)
);

-- Tabela para tracking de atividades do lead
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'click', 'email_open', 'sms_response', 'page_view', etc.
    channel VARCHAR(20) DEFAULT 'unknown', -- 'sms', 'email', 'call', 'web'
    metadata JSONB DEFAULT '{}', -- dados adicionais da atividade
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para sequências de follow-up automatizadas
CREATE TABLE IF NOT EXISTS follow_up_sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(50) NOT NULL, -- 'initial_contact', 'link_click', 'email_open', etc.
    is_active BOOLEAN DEFAULT true,
    steps JSONB NOT NULL, -- array de steps com delay, template, channel
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_scores_property_id ON lead_scores(property_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_engagement_level ON lead_scores(engagement_level);
CREATE INDEX IF NOT EXISTS idx_lead_activities_property_id ON lead_activities(property_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at);

-- Function to update lead score based on activities
CREATE OR REPLACE FUNCTION update_lead_score(p_property_id UUID)
RETURNS void AS $$
DECLARE
    total_clicks INTEGER := 0;
    total_opens INTEGER := 0;
    total_responses INTEGER := 0;
    total_views INTEGER := 0;
    days_since_last_activity INTEGER := 0;
    new_score INTEGER := 0;
    new_engagement VARCHAR(20) := 'cold';
BEGIN
    -- Get activity counts
    SELECT
        COALESCE(SUM(CASE WHEN activity_type = 'click' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN activity_type = 'email_open' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN activity_type IN ('sms_response', 'call_response') THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN activity_type = 'page_view' THEN 1 ELSE 0 END), 0),
        COALESCE(EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 86400, 999) -- days since last activity
    INTO total_clicks, total_opens, total_responses, total_views, days_since_last_activity
    FROM lead_activities
    WHERE property_id = p_property_id AND created_at > NOW() - INTERVAL '30 days';

    -- Calculate score (0-100)
    new_score := LEAST(100,
        (total_clicks * 20) +
        (total_opens * 10) +
        (total_responses * 30) +
        (total_views * 5) +
        CASE WHEN days_since_last_activity < 1 THEN 20
             WHEN days_since_last_activity < 3 THEN 15
             WHEN days_since_last_activity < 7 THEN 10
             ELSE 0 END
    );

    -- Determine engagement level
    IF new_score >= 80 THEN new_engagement := 'very_hot';
    ELSIF new_score >= 60 THEN new_engagement := 'hot';
    ELSIF new_score >= 40 THEN new_engagement := 'warm';
    ELSE new_engagement := 'cold';
    END IF;

    -- Update or insert lead score
    INSERT INTO lead_scores (property_id, score, engagement_level, last_activity, click_count, email_opens, sms_responses, page_views, updated_at)
    VALUES (p_property_id, new_score, new_engagement, NOW(), total_clicks, total_opens, total_responses, total_views, NOW())
    ON CONFLICT (property_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        engagement_level = EXCLUDED.engagement_level,
        last_activity = EXCLUDED.last_activity,
        click_count = EXCLUDED.click_count,
        email_opens = EXCLUDED.email_opens,
        sms_responses = EXCLUDED.sms_responses,
        page_views = EXCLUDED.page_views,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;