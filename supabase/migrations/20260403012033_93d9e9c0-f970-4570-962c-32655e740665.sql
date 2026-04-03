
-- Championship seasons
CREATE TABLE public.championship_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.championship_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons" ON public.championship_seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage seasons" ON public.championship_seasons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Championship registrations
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

-- Championship race results
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

-- Enable realtime for live leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.championship_race_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.championship_registrations;
