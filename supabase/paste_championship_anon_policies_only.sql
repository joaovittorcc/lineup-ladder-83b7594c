-- =============================================================================
-- Usa isto se JÁ correste os ALTER TABLE (colunas) mas ainda tens erro RLS ao criar campeonato.
-- Cola no SQL Editor → Run (uma vez).
-- =============================================================================

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_seasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_race_results TO anon;
