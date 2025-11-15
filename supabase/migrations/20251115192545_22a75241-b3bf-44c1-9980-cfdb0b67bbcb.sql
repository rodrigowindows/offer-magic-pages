-- Create property_notes table for tracking communication
CREATE TABLE public.property_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  sms_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  letter_sent BOOLEAN NOT NULL DEFAULT false,
  card_sent BOOLEAN NOT NULL DEFAULT false,
  phone_call_made BOOLEAN NOT NULL DEFAULT false,
  meeting_scheduled BOOLEAN NOT NULL DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.property_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage notes
CREATE POLICY "Authenticated users can view all notes" 
ON public.property_notes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create notes" 
ON public.property_notes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update notes" 
ON public.property_notes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete notes" 
ON public.property_notes 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_property_notes_property_id ON public.property_notes(property_id);
CREATE INDEX idx_property_notes_created_at ON public.property_notes(created_at DESC);