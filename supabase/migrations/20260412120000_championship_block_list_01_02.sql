-- Quando true, pilotos na Lista 01/02 não podem auto-inscrever-se nesta época (comportamento antigo).
-- Por defeito false: L01/L02 podem participar.
ALTER TABLE public.championship_seasons
  ADD COLUMN IF NOT EXISTS block_list_01_02 BOOLEAN NOT NULL DEFAULT false;
