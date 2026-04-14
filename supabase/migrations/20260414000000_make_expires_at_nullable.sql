-- Make expires_at nullable for initiation challenges (they don't expire)
-- Ladder challenges (List 01, List 02, Cross-list, Street Runner) still have 24h expiry by default

ALTER TABLE public.challenges 
  ALTER COLUMN expires_at DROP NOT NULL;

-- Update existing initiation challenges to have no expiry
UPDATE public.challenges 
SET expires_at = NULL 
WHERE type = 'initiation';

COMMENT ON COLUMN public.challenges.expires_at IS 
  'Expiry time for ladder challenges (24h). NULL for initiation challenges (no expiry).';
