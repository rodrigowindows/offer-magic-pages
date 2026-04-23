-- Triage audit log: immutable record of which rules triggered each rejection / skip
CREATE TABLE public.triage_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  property_address TEXT,
  decision TEXT NOT NULL, -- 'rejected' | 'skipped' | 'approved_with_warnings'
  decision_reason TEXT, -- e.g. 'agent-listed', 'flood-zone'
  decision_reason_label TEXT,
  triggered_rules TEXT[] NOT NULL DEFAULT '{}'::text[],
  flood_zone TEXT,
  notes TEXT,
  decided_by UUID,
  decided_by_name TEXT,
  bulk_action BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_triage_audit_log_property_id ON public.triage_audit_log(property_id);
CREATE INDEX idx_triage_audit_log_decision ON public.triage_audit_log(decision);
CREATE INDEX idx_triage_audit_log_created_at ON public.triage_audit_log(created_at DESC);
CREATE INDEX idx_triage_audit_log_triggered_rules ON public.triage_audit_log USING GIN(triggered_rules);

ALTER TABLE public.triage_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert audit log"
ON public.triage_audit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view audit log"
ON public.triage_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- No UPDATE / DELETE policies = immutable