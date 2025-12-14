-- Create campaign sequences table for defining multi-channel workflows
CREATE TABLE public.campaign_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence steps table for each step in a sequence
CREATE TABLE public.sequence_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.campaign_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'sms', 'call'
  delay_days INTEGER NOT NULL DEFAULT 0, -- days after previous step
  message_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property sequences table to track properties in sequences
CREATE TABLE public.property_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.campaign_sequences(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'responded'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_step_at TIMESTAMP WITH TIME ZONE,
  next_step_due TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follow-up reminders table
CREATE TABLE public.follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'no_response', 'sequence_step', 'manual'
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_sequences
CREATE POLICY "Authenticated users can manage sequences" ON public.campaign_sequences
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for sequence_steps
CREATE POLICY "Authenticated users can manage sequence steps" ON public.sequence_steps
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for property_sequences
CREATE POLICY "Authenticated users can manage property sequences" ON public.property_sequences
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for follow_up_reminders
CREATE POLICY "Authenticated users can manage reminders" ON public.follow_up_reminders
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Add channel field to campaign_logs if it helps with analytics
ALTER TABLE public.campaign_logs ADD COLUMN IF NOT EXISTS channel TEXT;

-- Insert default escalation sequence
INSERT INTO public.campaign_sequences (name, description) VALUES 
('Standard Escalation', 'Email → SMS (2 days) → Call (5 days)');

-- Get the sequence ID and insert steps
INSERT INTO public.sequence_steps (sequence_id, step_order, channel, delay_days, message_template)
SELECT id, 1, 'email', 0, 'Initial offer email'
FROM public.campaign_sequences WHERE name = 'Standard Escalation';

INSERT INTO public.sequence_steps (sequence_id, step_order, channel, delay_days, message_template)
SELECT id, 2, 'sms', 2, 'Follow-up SMS reminder'
FROM public.campaign_sequences WHERE name = 'Standard Escalation';

INSERT INTO public.sequence_steps (sequence_id, step_order, channel, delay_days, message_template)
SELECT id, 3, 'call', 5, 'Personal phone call'
FROM public.campaign_sequences WHERE name = 'Standard Escalation';