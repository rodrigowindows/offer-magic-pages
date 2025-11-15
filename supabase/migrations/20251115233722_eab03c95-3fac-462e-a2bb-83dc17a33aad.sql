-- Create ab_tests table to track A/B test assignments and conversions
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  session_id TEXT NOT NULL,
  viewed_hero BOOLEAN DEFAULT false,
  viewed_offer BOOLEAN DEFAULT false,
  viewed_benefits BOOLEAN DEFAULT false,
  viewed_process BOOLEAN DEFAULT false,
  viewed_form BOOLEAN DEFAULT false,
  submitted_form BOOLEAN DEFAULT false,
  time_on_page INTEGER DEFAULT 0,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert (anyone can track)
CREATE POLICY "Anyone can insert ab_tests" 
ON public.ab_tests 
FOR INSERT 
WITH CHECK (true);

-- Create policy for select (anyone can read for analytics)
CREATE POLICY "Anyone can view ab_tests" 
ON public.ab_tests 
FOR SELECT 
USING (true);

-- Create index for better query performance
CREATE INDEX idx_ab_tests_property_id ON public.ab_tests(property_id);
CREATE INDEX idx_ab_tests_variant ON public.ab_tests(variant);
CREATE INDEX idx_ab_tests_created_at ON public.ab_tests(created_at);