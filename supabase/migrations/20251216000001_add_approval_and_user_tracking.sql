-- Add user tracking and approval system to properties table

-- Add user tracking columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_name text,
ADD COLUMN IF NOT EXISTS updated_by_name text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add approval/rejection system columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by_name text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS rejection_notes text;

-- Create index for approval status filtering
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON properties(approval_status);

-- Create index for user tracking
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
CREATE INDEX IF NOT EXISTS idx_properties_updated_by ON properties(updated_by);

-- Add comments
COMMENT ON COLUMN properties.created_by IS 'User ID who created this property';
COMMENT ON COLUMN properties.updated_by IS 'User ID who last updated this property';
COMMENT ON COLUMN properties.created_by_name IS 'Name of user who created this property';
COMMENT ON COLUMN properties.updated_by_name IS 'Name of user who last updated this property';
COMMENT ON COLUMN properties.approval_status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN properties.approved_by IS 'User ID who approved/rejected this property';
COMMENT ON COLUMN properties.approved_by_name IS 'Name of user who approved/rejected';
COMMENT ON COLUMN properties.approved_at IS 'Timestamp when approved/rejected';
COMMENT ON COLUMN properties.rejection_reason IS 'Predefined reason for rejection (e.g., too-good-condition, llc-owned, commercial)';
COMMENT ON COLUMN properties.rejection_notes IS 'Additional notes for rejection';

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
