-- Create manual_comps_links table for saving comps links from Trulia/Zillow/Redfin
CREATE TABLE IF NOT EXISTS public.manual_comps_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_address TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('trulia', 'zillow', 'redfin', 'realtor', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_property_address ON public.manual_comps_links(property_address);
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_property_id ON public.manual_comps_links(property_id);
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_user_id ON public.manual_comps_links(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_created_at ON public.manual_comps_links(created_at DESC);

-- Enable RLS
ALTER TABLE public.manual_comps_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own manual comps links"
  ON public.manual_comps_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own manual comps links"
  ON public.manual_comps_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manual comps links"
  ON public.manual_comps_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manual comps links"
  ON public.manual_comps_links FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_manual_comps_links_updated_at BEFORE UPDATE
  ON public.manual_comps_links FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
