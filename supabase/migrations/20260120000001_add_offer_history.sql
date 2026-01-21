-- Create offer history table to track changes to property offers
CREATE TABLE IF NOT EXISTS public.property_offer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  previous_amount DECIMAL(12,2),
  new_amount DECIMAL(12,2) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_offer_history_property_id ON public.property_offer_history(property_id);
CREATE INDEX IF NOT EXISTS idx_offer_history_changed_at ON public.property_offer_history(changed_at DESC);

-- Enable RLS
ALTER TABLE public.property_offer_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own offer history"
  ON public.property_offer_history
  FOR SELECT
  USING (changed_by = auth.uid());

CREATE POLICY "Users can insert their own offer history"
  ON public.property_offer_history
  FOR INSERT
  WITH CHECK (changed_by = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT ON public.property_offer_history TO authenticated;

-- Add comment
COMMENT ON TABLE public.property_offer_history IS 'Tracks historical changes to property cash offer amounts';
