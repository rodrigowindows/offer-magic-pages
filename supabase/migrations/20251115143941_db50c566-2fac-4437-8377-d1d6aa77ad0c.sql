-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Miami',
  state TEXT NOT NULL DEFAULT 'FL',
  zip_code TEXT NOT NULL,
  property_image_url TEXT,
  estimated_value DECIMAL(12, 2) NOT NULL,
  cash_offer_amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (so anyone can view property pages)
CREATE POLICY "Anyone can view active properties"
ON public.properties
FOR SELECT
USING (status = 'active');

-- Create policy for authenticated admin users to manage properties
-- For now, all authenticated users can manage (we'll add role-based auth later)
CREATE POLICY "Authenticated users can insert properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete properties"
ON public.properties
FOR DELETE
TO authenticated
USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER properties_updated_at_trigger
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_properties_updated_at();

-- Create index for faster slug lookups
CREATE INDEX idx_properties_slug ON public.properties(slug);
CREATE INDEX idx_properties_status ON public.properties(status);