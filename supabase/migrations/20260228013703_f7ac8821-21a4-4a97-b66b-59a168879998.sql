
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ai_score integer CHECK (ai_score >= 0 AND ai_score <= 100);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ai_reasoning text;
