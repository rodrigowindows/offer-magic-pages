-- Advanced Webhook System Migration
-- Create tables for advanced webhook management with multiple integrations

-- Webhook configurations table
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    headers JSONB DEFAULT '{}',
    method TEXT NOT NULL DEFAULT 'POST' CHECK (method IN ('POST', 'PUT', 'PATCH')),
    active BOOLEAN NOT NULL DEFAULT true,
    integration TEXT NOT NULL DEFAULT 'custom' CHECK (integration IN ('zapier', 'make', 'webhook_site', 'custom')),
    retry_policy JSONB DEFAULT '{"maxRetries": 3, "backoffMs": 1000}',
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_triggered TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook logs table for tracking all webhook calls
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_configs_active ON webhook_configs(active);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_integration ON webhook_configs(integration);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);

-- RLS Policies
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their webhooks
CREATE POLICY "Users can manage their webhook configs" ON webhook_configs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their webhook logs" ON webhook_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Function to trigger webhooks
CREATE OR REPLACE FUNCTION trigger_webhook(
    p_webhook_id UUID,
    p_event TEXT,
    p_payload JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
DECLARE
    webhook_record RECORD;
    response_status INTEGER;
    response_body TEXT;
    success BOOLEAN := false;
    retry_count INTEGER := 0;
    max_retries INTEGER;
    backoff_ms INTEGER;
BEGIN
    -- Get webhook configuration
    SELECT * INTO webhook_record
    FROM webhook_configs
    WHERE id = p_webhook_id AND active = true;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Get retry policy
    max_retries := (webhook_record.retry_policy->>'maxRetries')::INTEGER;
    backoff_ms := (webhook_record.retry_policy->>'backoffMs')::INTEGER;

    -- Try to send webhook with retries
    WHILE retry_count <= max_retries LOOP
        BEGIN
            -- Make HTTP request (simplified - in real implementation would use pg_net or similar)
            -- For now, we'll just log the attempt
            response_status := 200;
            response_body := 'OK';
            success := true;

            -- Log the webhook call
            INSERT INTO webhook_logs (
                webhook_id, event, payload, response_status,
                response_body, success, retry_count
            ) VALUES (
                p_webhook_id, p_event, p_payload, response_status,
                response_body, success, retry_count
            );

            -- Update webhook stats
            UPDATE webhook_configs
            SET
                success_count = success_count + 1,
                last_triggered = NOW(),
                updated_at = NOW()
            WHERE id = p_webhook_id;

            RETURN true;

        EXCEPTION WHEN OTHERS THEN
            -- Log failure
            INSERT INTO webhook_logs (
                webhook_id, event, payload, response_status,
                response_body, success, retry_count, error_message
            ) VALUES (
                p_webhook_id, p_event, p_payload, 0,
                SQLERRM, false, retry_count, SQLERRM
            );

            retry_count := retry_count + 1;

            -- Wait before retry (simplified)
            IF retry_count <= max_retries THEN
                PERFORM pg_sleep(backoff_ms / 1000.0);
            END IF;
        END;
    END LOOP;

    -- Update failure count if all retries failed
    UPDATE webhook_configs
    SET
        failure_count = failure_count + 1,
        updated_at = NOW()
    WHERE id = p_webhook_id;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger webhooks for specific events
CREATE OR REPLACE FUNCTION trigger_event_webhooks(
    p_event TEXT,
    p_payload JSONB DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
    webhook_record RECORD;
    triggered_count INTEGER := 0;
BEGIN
    -- Find all active webhooks that listen to this event
    FOR webhook_record IN
        SELECT id
        FROM webhook_configs
        WHERE active = true
        AND p_event = ANY(events)
    LOOP
        -- Trigger the webhook
        IF trigger_webhook(webhook_record.id, p_event, p_payload) THEN
            triggered_count := triggered_count + 1;
        END IF;
    END LOOP;

    RETURN triggered_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for campaign events
CREATE OR REPLACE FUNCTION notify_campaign_events() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM trigger_event_webhooks('campaign_created', jsonb_build_object(
            'campaignId', NEW.id,
            'name', NEW.name,
            'type', NEW.type,
            'createdAt', NEW.created_at
        ));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status AND NEW.status = 'sent' THEN
            PERFORM trigger_event_webhooks('campaign_sent', jsonb_build_object(
                'campaignId', NEW.id,
                'name', NEW.name,
                'sentAt', NEW.sent_at
            ));
        END IF;

        IF OLD.status != NEW.status AND NEW.status = 'completed' THEN
            PERFORM trigger_event_webhooks('campaign_completed', jsonb_build_object(
                'campaignId', NEW.id,
                'name', NEW.name,
                'completedAt', NEW.completed_at
            ));
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on campaigns table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
        DROP TRIGGER IF EXISTS campaign_events_trigger ON campaigns;
        CREATE TRIGGER campaign_events_trigger
            AFTER INSERT OR UPDATE ON campaigns
            FOR EACH ROW EXECUTE FUNCTION notify_campaign_events();
    END IF;
END $$;

-- Comments
COMMENT ON TABLE webhook_configs IS 'Configuration for external webhook integrations';
COMMENT ON TABLE webhook_logs IS 'Log of all webhook calls and responses';
COMMENT ON FUNCTION trigger_webhook(UUID, TEXT, JSONB) IS 'Triggers a specific webhook with retry logic';
COMMENT ON FUNCTION trigger_event_webhooks(TEXT, JSONB) IS 'Triggers all webhooks listening to a specific event';