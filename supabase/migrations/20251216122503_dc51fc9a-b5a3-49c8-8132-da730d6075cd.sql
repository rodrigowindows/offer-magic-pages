-- Add tags column to properties table for property categorization
ALTER TABLE public.properties 
ADD COLUMN tags text[] DEFAULT '{}';