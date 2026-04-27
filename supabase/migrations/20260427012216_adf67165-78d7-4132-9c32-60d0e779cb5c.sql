CREATE UNIQUE INDEX IF NOT EXISTS property_leads_property_email_interest_uniq
  ON public.property_leads (property_id, email, interest_level);