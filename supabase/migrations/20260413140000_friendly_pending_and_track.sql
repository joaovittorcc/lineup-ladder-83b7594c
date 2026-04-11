-- Pending amistosos (aceitar/recusar) + pista no histórico
CREATE TABLE public.friendly_pending_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_name TEXT NOT NULL,
  challenged_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'racing')),
  track_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX friendly_pending_active_pair_idx
  ON public.friendly_pending_challenges (lower(challenger_name), lower(challenged_name))
  WHERE status IN ('pending', 'racing');

ALTER TABLE public.friendly_matches
  ADD COLUMN IF NOT EXISTS track_name TEXT;

ALTER TABLE public.friendly_pending_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view friendly pending"
  ON public.friendly_pending_challenges FOR SELECT USING (true);

CREATE POLICY "Anon can insert friendly pending"
  ON public.friendly_pending_challenges FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update friendly pending"
  ON public.friendly_pending_challenges FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete friendly pending"
  ON public.friendly_pending_challenges FOR DELETE TO anon USING (true);

CREATE POLICY "Authenticated can insert friendly pending"
  ON public.friendly_pending_challenges FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update friendly pending"
  ON public.friendly_pending_challenges FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete friendly pending"
  ON public.friendly_pending_challenges FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.friendly_pending_challenges;

-- App usa anon key: permitir escrita em friendly_matches e elo_ratings (já existiam só para authenticated)
DROP POLICY IF EXISTS "Anon can insert friendly matches" ON public.friendly_matches;
CREATE POLICY "Anon can insert friendly matches"
  ON public.friendly_matches FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can insert elo ratings" ON public.elo_ratings;
CREATE POLICY "Anon can insert elo ratings"
  ON public.elo_ratings FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update elo ratings" ON public.elo_ratings;
CREATE POLICY "Anon can update elo ratings"
  ON public.elo_ratings FOR UPDATE TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendly_pending_challenges TO anon;
GRANT INSERT ON public.friendly_matches TO anon;
GRANT INSERT, UPDATE ON public.elo_ratings TO anon;
