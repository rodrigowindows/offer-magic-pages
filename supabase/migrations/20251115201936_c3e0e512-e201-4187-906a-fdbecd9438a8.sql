-- Add communication tracking fields to properties table
ALTER TABLE public.properties
ADD COLUMN sms_sent boolean NOT NULL DEFAULT false,
ADD COLUMN email_sent boolean NOT NULL DEFAULT false,
ADD COLUMN letter_sent boolean NOT NULL DEFAULT false,
ADD COLUMN card_sent boolean NOT NULL DEFAULT false,
ADD COLUMN phone_call_made boolean NOT NULL DEFAULT false,
ADD COLUMN meeting_scheduled boolean NOT NULL DEFAULT false;

-- Remove communication tracking fields from property_notes table
ALTER TABLE public.property_notes
DROP COLUMN sms_sent,
DROP COLUMN email_sent,
DROP COLUMN letter_sent,
DROP COLUMN card_sent,
DROP COLUMN phone_call_made,
DROP COLUMN meeting_scheduled;