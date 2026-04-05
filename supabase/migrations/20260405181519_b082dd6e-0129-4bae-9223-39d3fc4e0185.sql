
-- friendly_matches table
CREATE TABLE public.friendly_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_name TEXT NOT NULL,
  challenged_name TEXT NOT NULL,
  winner_name TEXT NOT NULL,
  loser_name TEXT NOT NULL,
  challenger_elo_before INTEGER NOT NULL DEFAULT 1000,
  challenged_elo_before INTEGER NOT NULL DEFAULT 1000,
  challenger_elo_after INTEGER NOT NULL DEFAULT 1000,
  challenged_elo_after INTEGER NOT NULL DEFAULT 1000,
  elo_change INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.friendly_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view friendly matches" ON public.friendly_matches
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create friendly matches" ON public.friendly_matches
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage friendly matches" ON public.friendly_matches
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- elo_ratings table
CREATE TABLE public.elo_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL UNIQUE,
  rating INTEGER NOT NULL DEFAULT 1000,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.elo_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view elo ratings" ON public.elo_ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert elo ratings" ON public.elo_ratings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update elo ratings" ON public.elo_ratings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can manage elo ratings" ON public.elo_ratings
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable Realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendly_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.elo_ratings;

-- Enable Realtime on existing tables (players, challenges already exist)
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;

-- Add anon read policies to existing tables so non-logged visitors can see rankings
CREATE POLICY "Anon can view players" ON public.players FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view player lists" ON public.player_lists FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view challenges" ON public.challenges FOR SELECT TO anon USING (true);
