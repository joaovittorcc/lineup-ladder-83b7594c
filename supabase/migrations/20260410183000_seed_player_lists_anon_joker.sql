-- Default lists expected by the app (ids must match IndexPage / hooks)
INSERT INTO public.player_lists (id, title, sort_order) VALUES
  ('initiation', 'Lista de Iniciação – Joker', 0),
  ('list-01', 'Lista 01', 1),
  ('list-02', 'Lista 02', 2)
ON CONFLICT (id) DO NOTHING;

-- Anonymous clients (browser + anon key, no Supabase Auth) need read access like other ladder tables
DROP POLICY IF EXISTS "Anon can view joker progress" ON public.joker_progress;
CREATE POLICY "Anon can view joker progress"
  ON public.joker_progress FOR SELECT TO anon USING (true);
