-- =============================================================================
-- Cola isto no Supabase → SQL Editor → New query → Run (uma vez por projeto).
-- Inclui: colunas do centro de comando + políticas anon + cargos admitidos no torneio.
--
-- Segurança: com VITE_SUPABASE_ANON_KEY o Postgres não distingue “admin” de visitante.
-- “Só admins criam torneios” = botão só na app (CHAMPIONSHIP_ADMINS + PIN). Na BD, INSERT
-- anon continua permitido — quem tiver a URL+anon key tecnicamente pode chamar a API.
-- Para bloqueio real na BD seria Auth Supabase, Edge Function com service_role, ou segredo.
-- =============================================================================

ALTER TABLE public.championship_registrations
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'confirmed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'championship_registrations_status_check'
  ) THEN
    ALTER TABLE public.championship_registrations
      ADD CONSTRAINT championship_registrations_status_check
      CHECK (registration_status IN ('pending', 'confirmed'));
  END IF;
END $$;

ALTER TABLE public.championship_seasons
  ADD COLUMN IF NOT EXISTS points_config JSONB NOT NULL DEFAULT '{"1":20,"2":17,"3":15,"4":13,"5":11,"6":9,"7":7,"8":5,"9":3,"10":1}'::jsonb;

ALTER TABLE public.championship_seasons
  ADD COLUMN IF NOT EXISTS pistas JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.championship_seasons
  ADD COLUMN IF NOT EXISTS allowed_participant_roles JSONB NOT NULL DEFAULT '["admin","midnight-driver","night-driver","street-runner","joker"]'::jsonb;

-- Anon (cliente com anon key)
DROP POLICY IF EXISTS "Anon can view championship seasons" ON public.championship_seasons;
DROP POLICY IF EXISTS "Anon can insert championship seasons" ON public.championship_seasons;
DROP POLICY IF EXISTS "Anon can update championship seasons" ON public.championship_seasons;
DROP POLICY IF EXISTS "Anon can delete championship seasons" ON public.championship_seasons;

CREATE POLICY "Anon can view championship seasons"
  ON public.championship_seasons FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert championship seasons"
  ON public.championship_seasons FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update championship seasons"
  ON public.championship_seasons FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete championship seasons"
  ON public.championship_seasons FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Anon can view championship registrations" ON public.championship_registrations;
DROP POLICY IF EXISTS "Anon can insert championship registrations" ON public.championship_registrations;
DROP POLICY IF EXISTS "Anon can update championship registrations" ON public.championship_registrations;
DROP POLICY IF EXISTS "Anon can delete championship registrations" ON public.championship_registrations;

CREATE POLICY "Anon can view championship registrations"
  ON public.championship_registrations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert championship registrations"
  ON public.championship_registrations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update championship registrations"
  ON public.championship_registrations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete championship registrations"
  ON public.championship_registrations FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Anon can view championship race results" ON public.championship_race_results;
DROP POLICY IF EXISTS "Anon can insert championship race results" ON public.championship_race_results;
DROP POLICY IF EXISTS "Anon can update championship race results" ON public.championship_race_results;
DROP POLICY IF EXISTS "Anon can delete championship race results" ON public.championship_race_results;

CREATE POLICY "Anon can view championship race results"
  ON public.championship_race_results FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert championship race results"
  ON public.championship_race_results FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update championship race results"
  ON public.championship_race_results FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete championship race results"
  ON public.championship_race_results FOR DELETE TO anon USING (true);

-- Garantir que a role anon pode usar a API (além do RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_seasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_race_results TO anon;
