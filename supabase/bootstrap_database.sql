-- =============================================================================
-- Setup completo da base de dados (Midnight Club / lineup-ladder)
-- =============================================================================
-- O teu erro "Could not find the table public.player_lists" = este SQL ainda
-- não foi executado no projeto Supabase.
--
-- Como aplicar:
--   1. Supabase Dashboard → o teu projeto → SQL Editor → New query
--   2. Cola este ficheiro inteiro → Run
--
-- Alternativa com CLI (na pasta do repo): supabase link && supabase db push
-- =============================================================================
-- Nota: ignora a migração local que só ativa pg_cron/pg_net — não é necessária
-- para a app em browser.
-- =============================================================================


-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'pilot', 'joker');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Anyone can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Player lists
CREATE TABLE public.player_lists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.player_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lists"
  ON public.player_lists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage lists"
  ON public.player_lists FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Players
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id TEXT NOT NULL REFERENCES public.player_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'racing', 'cooldown', 'pending')),
  defense_count INT NOT NULL DEFAULT 0,
  cooldown_until TIMESTAMPTZ,
  challenge_cooldown_until TIMESTAMPTZ,
  initiation_complete BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view players"
  ON public.players FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage players"
  ON public.players FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Players can update own status for accepting challenges"
  ON public.players FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Challenges
CREATE TYPE public.challenge_status AS ENUM ('pending', 'accepted', 'racing', 'completed', 'wo', 'cancelled');
CREATE TYPE public.challenge_type AS ENUM ('ladder', 'initiation');

CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id TEXT NOT NULL REFERENCES public.player_lists(id),
  challenger_id UUID NOT NULL REFERENCES public.players(id),
  challenged_id UUID NOT NULL REFERENCES public.players(id),
  challenger_name TEXT NOT NULL,
  challenged_name TEXT NOT NULL,
  challenger_pos INT NOT NULL,
  challenged_pos INT NOT NULL,
  status challenge_status NOT NULL DEFAULT 'pending',
  type challenge_type NOT NULL DEFAULT 'ladder',
  score_challenger INT NOT NULL DEFAULT 0,
  score_challenged INT NOT NULL DEFAULT 0,
  tracks TEXT[3],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  winner_id UUID REFERENCES public.players(id)
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges"
  ON public.challenges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all challenges"
  ON public.challenges FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Challenged player can accept/update challenge"
  ON public.challenges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = challenged_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Pilots and jokers can create challenges"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'pilot')
    OR public.has_role(auth.uid(), 'joker')
  );

-- Joker progress
CREATE TABLE public.joker_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  defeated_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  defeated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (joker_user_id, defeated_player_id)
);
ALTER TABLE public.joker_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view joker progress"
  ON public.joker_progress FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage joker progress"
  ON public.joker_progress FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.check_expired_cooldowns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.players
  SET status = 'available', cooldown_until = NULL, defense_count = 0
  WHERE status = 'cooldown' AND cooldown_until IS NOT NULL AND cooldown_until <= now();

  UPDATE public.players
  SET challenge_cooldown_until = NULL
  WHERE challenge_cooldown_until IS NOT NULL AND challenge_cooldown_until <= now();
END;
$$;

CREATE OR REPLACE FUNCTION public.process_expired_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ch RECORD;
BEGIN
  FOR ch IN
    SELECT * FROM public.challenges
    WHERE status = 'pending' AND expires_at <= now()
  LOOP
    UPDATE public.challenges
    SET status = 'wo', completed_at = now(), winner_id = ch.challenger_id
    WHERE id = ch.id;

    DECLARE
      challenger_pos INT;
      challenged_pos INT;
    BEGIN
      SELECT position INTO challenger_pos FROM public.players WHERE id = ch.challenger_id;
      SELECT position INTO challenged_pos FROM public.players WHERE id = ch.challenged_id;

      UPDATE public.players SET position = challenged_pos WHERE id = ch.challenger_id;
      UPDATE public.players SET position = challenger_pos WHERE id = ch.challenged_id;
    END;

    UPDATE public.players
    SET status = 'cooldown',
        cooldown_until = now() + INTERVAL '3 days',
        challenge_cooldown_until = now() + INTERVAL '3 days'
    WHERE id = ch.challenged_id;

    UPDATE public.players
    SET status = 'available'
    WHERE id = ch.challenger_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Championship
CREATE TABLE public.championship_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.championship_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons" ON public.championship_seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage seasons" ON public.championship_seasons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.championship_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.championship_seasons(id) ON DELETE CASCADE,
  pilot_name TEXT NOT NULL,
  car TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(season_id, pilot_name)
);

ALTER TABLE public.championship_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view registrations" ON public.championship_registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can register" ON public.championship_registrations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage registrations" ON public.championship_registrations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.championship_race_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.championship_seasons(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.championship_registrations(id) ON DELETE CASCADE,
  race_number INT NOT NULL CHECK (race_number BETWEEN 1 AND 5),
  finish_position INT NOT NULL CHECK (finish_position >= 1),
  points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(season_id, registration_id, race_number)
);

ALTER TABLE public.championship_race_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view results" ON public.championship_race_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage results" ON public.championship_race_results FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.championship_race_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.championship_registrations;

-- Global logs + race tracks
CREATE TABLE public.global_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  player_one TEXT,
  player_two TEXT,
  winner TEXT,
  category TEXT NOT NULL DEFAULT 'general'
);

ALTER TABLE public.global_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read global logs" ON public.global_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert global logs" ON public.global_logs FOR INSERT WITH CHECK (true);

ALTER TABLE public.championship_seasons ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'inscricoes';

CREATE TABLE public.championship_race_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.championship_seasons(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  track_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(season_id, race_number)
);

ALTER TABLE public.championship_race_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read race tracks" ON public.championship_race_tracks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert race tracks" ON public.championship_race_tracks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update race tracks" ON public.championship_race_tracks FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.global_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.championship_race_tracks;

ALTER TABLE public.championship_seasons ADD COLUMN IF NOT EXISTS race_count integer NOT NULL DEFAULT 3;

-- Friendly + ELO
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

ALTER PUBLICATION supabase_realtime ADD TABLE public.friendly_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.elo_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;

CREATE POLICY "Anon can view players" ON public.players FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert players" ON public.players FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update players" ON public.players FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete players" ON public.players FOR DELETE TO anon USING (true);
CREATE POLICY "Anon can view player lists" ON public.player_lists FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view challenges" ON public.challenges FOR SELECT TO anon USING (true);

-- Seed lists + anon joker reads
INSERT INTO public.player_lists (id, title, sort_order) VALUES
  ('initiation', 'Lista de Iniciação – Joker', 0),
  ('list-01', 'Lista 01', 1),
  ('list-02', 'Lista 02', 2)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anon can view joker progress" ON public.joker_progress;
CREATE POLICY "Anon can view joker progress"
  ON public.joker_progress FOR SELECT TO anon USING (true);
