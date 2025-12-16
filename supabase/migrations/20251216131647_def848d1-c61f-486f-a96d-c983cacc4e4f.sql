-- Add approval and tracking columns
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_by_name text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS rejection_notes text,
ADD COLUMN IF NOT EXISTS updated_by uuid,
ADD COLUMN IF NOT EXISTS updated_by_name text;

-- Add Airbnb eligibility columns
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS airbnb_eligible boolean,
ADD COLUMN IF NOT EXISTS airbnb_check_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS airbnb_regulations jsonb,
ADD COLUMN IF NOT EXISTS airbnb_notes text;

-- Add advanced filter columns
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS import_date date,
ADD COLUMN IF NOT EXISTS import_batch text,
ADD COLUMN IF NOT EXISTS last_contact_date date,
ADD COLUMN IF NOT EXISTS next_followup_date date,
ADD COLUMN IF NOT EXISTS county text,
ADD COLUMN IF NOT EXISTS property_type text,
ADD COLUMN IF NOT EXISTS bedrooms integer,
ADD COLUMN IF NOT EXISTS bathrooms numeric,
ADD COLUMN IF NOT EXISTS square_feet integer,
ADD COLUMN IF NOT EXISTS lot_size numeric,
ADD COLUMN IF NOT EXISTS year_built integer;