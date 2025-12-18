-- FIX REJECT BUTTON - Run this in Supabase SQL Editor
-- This adds the missing columns needed for the reject button to work

-- Add approval/rejection columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_by_name text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS rejection_notes text;

-- Add user tracking columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS updated_by uuid,
ADD COLUMN IF NOT EXISTS created_by_name text,
ADD COLUMN IF NOT EXISTS updated_by_name text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON properties(approval_status);
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
CREATE INDEX IF NOT EXISTS idx_properties_updated_by ON properties(updated_by);

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'properties'
AND column_name IN ('approval_status', 'rejection_reason', 'rejection_notes', 'approved_by', 'approved_by_name', 'approved_at')
ORDER BY column_name;

-- You should see 6 rows returned if successful
