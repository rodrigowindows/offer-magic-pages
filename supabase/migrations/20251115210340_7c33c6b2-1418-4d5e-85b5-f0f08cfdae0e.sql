-- Add lead_status column to properties table
ALTER TABLE properties 
ADD COLUMN lead_status text NOT NULL DEFAULT 'new';

-- Add a check constraint for valid status values
ALTER TABLE properties 
ADD CONSTRAINT valid_lead_status 
CHECK (lead_status IN ('new', 'contacted', 'following_up', 'meeting_scheduled', 'offer_made', 'closed', 'not_interested'));

-- Add index for better query performance
CREATE INDEX idx_properties_lead_status ON properties(lead_status);