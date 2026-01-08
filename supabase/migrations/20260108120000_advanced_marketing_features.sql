-- Advanced Marketing Features Migration
-- Adds A/B Testing and Intelligent Follow-ups functionality

-- A/B Testing Tables
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
    variants JSONB NOT NULL DEFAULT '[]',
    target_metric TEXT NOT NULL DEFAULT 'open_rate' CHECK (target_metric IN ('open_rate', 'click_rate', 'conversion_rate', 'response_rate')),
    sample_size INTEGER NOT NULL DEFAULT 1000,
    confidence_threshold INTEGER NOT NULL DEFAULT 95 CHECK (confidence_threshold >= 80 AND confidence_threshold <= 99),
    winner TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-up Rules Tables
CREATE TABLE IF NOT EXISTS follow_up_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_event JSONB NOT NULL,
    conditions JSONB DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 4),
    cooldown_hours INTEGER NOT NULL DEFAULT 24,
    max_executions INTEGER NOT NULL DEFAULT 5,
    execution_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-up Executions Log
CREATE TABLE IF NOT EXISTS follow_up_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES follow_up_rules(id) ON DELETE CASCADE,
    lead_id TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT true,
    response TEXT,
    next_follow_up TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_at ON ab_tests(created_at);
CREATE INDEX IF NOT EXISTS idx_follow_up_rules_active ON follow_up_rules(active);
CREATE INDEX IF NOT EXISTS idx_follow_up_rules_priority ON follow_up_rules(priority);
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_rule_id ON follow_up_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_lead_id ON follow_up_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_executed_at ON follow_up_executions(executed_at);

-- RLS Policies
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_executions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their A/B tests and follow-up rules
CREATE POLICY "Users can manage their A/B tests" ON ab_tests
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their follow-up rules" ON follow_up_rules
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their follow-up executions" ON follow_up_executions
    FOR ALL USING (auth.role() = 'authenticated');

-- Functions for A/B Testing
CREATE OR REPLACE FUNCTION calculate_ab_test_winner(test_id UUID)
RETURNS TEXT AS $$
DECLARE
    test_record RECORD;
    variant_record RECORD;
    best_variant TEXT := '';
    best_score NUMERIC := 0;
BEGIN
    -- Get test details
    SELECT * INTO test_record FROM ab_tests WHERE id = test_id;

    IF NOT FOUND THEN
        RETURN 'Test not found';
    END IF;

    -- Calculate scores for each variant based on target metric
    FOR variant_record IN
        SELECT
            (variant->>'id') as variant_id,
            ((variant->'metrics'->>'sent')::NUMERIC) as sent,
            ((variant->'metrics'->>'opens')::NUMERIC) as opens,
            ((variant->'metrics'->>'clicks')::NUMERIC) as clicks,
            ((variant->'metrics'->>'conversions')::NUMERIC) as conversions
        FROM jsonb_array_elements(test_record.variants) as variant
    LOOP
        IF variant_record.sent > 0 THEN
            DECLARE
                score NUMERIC;
            BEGIN
                -- Calculate score based on target metric
                CASE test_record.target_metric
                    WHEN 'open_rate' THEN score := variant_record.opens / variant_record.sent;
                    WHEN 'click_rate' THEN score := variant_record.clicks / variant_record.sent;
                    WHEN 'conversion_rate' THEN score := variant_record.conversions / variant_record.sent;
                    ELSE score := 0;
                END CASE;

                IF score > best_score THEN
                    best_score := score;
                    best_variant := variant_record.variant_id;
                END IF;
            END;
        END IF;
    END LOOP;

    -- Update winner in test
    UPDATE ab_tests SET winner = best_variant WHERE id = test_id;

    RETURN best_variant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if follow-up rule should trigger
CREATE OR REPLACE FUNCTION should_trigger_follow_up(
    rule_id UUID,
    lead_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    rule_record RECORD;
    condition_record RECORD;
    should_trigger BOOLEAN := true;
BEGIN
    -- Get rule details
    SELECT * INTO rule_record FROM follow_up_rules WHERE id = rule_id AND active = true;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Check execution limits
    IF rule_record.execution_count >= rule_record.max_executions THEN
        RETURN false;
    END IF;

    -- Check conditions
    FOR condition_record IN
        SELECT * FROM jsonb_array_elements(rule_record.conditions) as condition
    LOOP
        DECLARE
            field_value TEXT;
            condition_met BOOLEAN := false;
        BEGIN
            -- Get field value from lead data
            field_value := lead_data->>(condition_record->>'field');

            -- Check condition based on operator
            CASE (condition_record->>'operator')
                WHEN 'equals' THEN
                    condition_met := field_value = (condition_record->>'value');
                WHEN 'greater_than' THEN
                    condition_met := field_value::NUMERIC > (condition_record->>'value')::NUMERIC;
                WHEN 'less_than' THEN
                    condition_met := field_value::NUMERIC < (condition_record->>'value')::NUMERIC;
                WHEN 'contains' THEN
                    condition_met := field_value ILIKE '%' || (condition_record->>'value') || '%';
                WHEN 'not_equals' THEN
                    condition_met := field_value != (condition_record->>'value');
                ELSE
                    condition_met := true;
            END CASE;

            IF NOT condition_met THEN
                should_trigger := false;
                EXIT;
            END IF;
        END;
    END LOOP;

    RETURN should_trigger;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute follow-up actions
CREATE OR REPLACE FUNCTION execute_follow_up_actions(
    rule_id UUID,
    lead_id TEXT,
    lead_data JSONB DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
    rule_record RECORD;
    action_record RECORD;
    actions_executed INTEGER := 0;
BEGIN
    -- Get rule details
    SELECT * INTO rule_record FROM follow_up_rules WHERE id = rule_id AND active = true;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Execute each action
    FOR action_record IN
        SELECT * FROM jsonb_array_elements(rule_record.actions) as action
    LOOP
        -- Here you would implement the actual action execution
        -- For now, we'll just log it
        INSERT INTO follow_up_executions (
            rule_id,
            lead_id,
            trigger_event,
            success,
            response
        ) VALUES (
            rule_id,
            lead_id,
            rule_record.trigger_event->>'event',
            true,
            'Action executed: ' || (action_record->>'type')
        );

        actions_executed := actions_executed + 1;
    END LOOP;

    -- Update execution count
    UPDATE follow_up_rules
    SET execution_count = execution_count + 1,
        updated_at = NOW()
    WHERE id = rule_id;

    RETURN actions_executed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for automatic follow-up processing
CREATE OR REPLACE FUNCTION process_automatic_follow_ups()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called by various triggers (email opens, clicks, etc.)
    -- For now, it's a placeholder for future implementation

    -- Example: When an email is opened, check for follow-up rules
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'email_opens' THEN
        -- Check follow-up rules that trigger on email_opened
        PERFORM execute_follow_up_actions(rule_id, NEW.lead_id, jsonb_build_object('event', 'email_opened'))
        FROM follow_up_rules
        WHERE active = true
        AND trigger_event->>'event' = 'email_opened'
        AND should_trigger_follow_up(id, jsonb_build_object('lead_id', NEW.lead_id));
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE ab_tests IS 'A/B testing campaigns with variants and metrics';
COMMENT ON TABLE follow_up_rules IS 'Intelligent follow-up automation rules';
COMMENT ON TABLE follow_up_executions IS 'Log of follow-up rule executions';
COMMENT ON FUNCTION calculate_ab_test_winner(UUID) IS 'Calculates the winning variant for an A/B test';
COMMENT ON FUNCTION should_trigger_follow_up(UUID, JSONB) IS 'Checks if a follow-up rule should trigger for given lead data';
COMMENT ON FUNCTION execute_follow_up_actions(UUID, TEXT, JSONB) IS 'Executes all actions for a follow-up rule';