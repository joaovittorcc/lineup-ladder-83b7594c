
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

-- Security definer function to check roles
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

-- RLS for user_roles
CREATE POLICY "Anyone can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Player lists table
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

-- Players table
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

-- Challenge status type
CREATE TYPE public.challenge_status AS ENUM ('pending', 'accepted', 'racing', 'completed', 'wo', 'cancelled');
CREATE TYPE public.challenge_type AS ENUM ('ladder', 'initiation');

-- Challenges table
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

CREATE POLICY "Authenticated users can create challenges"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- Joker progress table
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

-- Function to auto-expire cooldowns
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

-- Function to process W.O. for expired pending challenges
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
    -- Mark challenge as W.O.
    UPDATE public.challenges
    SET status = 'wo', completed_at = now(), winner_id = ch.challenger_id
    WHERE id = ch.id;

    -- Swap positions: challenger gets challenged's position
    DECLARE
      challenger_pos INT;
      challenged_pos INT;
    BEGIN
      SELECT position INTO challenger_pos FROM public.players WHERE id = ch.challenger_id;
      SELECT position INTO challenged_pos FROM public.players WHERE id = ch.challenged_id;

      UPDATE public.players SET position = challenged_pos WHERE id = ch.challenger_id;
      UPDATE public.players SET position = challenger_pos WHERE id = ch.challenged_id;
    END;

    -- Apply 3-day cooldown to the challenged player (who lost by W.O.)
    UPDATE public.players
    SET status = 'cooldown',
        cooldown_until = now() + INTERVAL '3 days',
        challenge_cooldown_until = now() + INTERVAL '3 days'
    WHERE id = ch.challenged_id;

    -- Reset challenger status
    UPDATE public.players
    SET status = 'available'
    WHERE id = ch.challenger_id;
  END LOOP;
END;
$$;

-- Updated_at trigger
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
