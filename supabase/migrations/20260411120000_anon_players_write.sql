-- App uses the anon key with PIN-based admin in the UI; ladder flows already UPDATE/INSERT/DELETE players from the client.
DROP POLICY IF EXISTS "Anon can insert players" ON public.players;
DROP POLICY IF EXISTS "Anon can update players" ON public.players;
DROP POLICY IF EXISTS "Anon can delete players" ON public.players;

CREATE POLICY "Anon can insert players"
  ON public.players FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update players"
  ON public.players FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete players"
  ON public.players FOR DELETE TO anon USING (true);
