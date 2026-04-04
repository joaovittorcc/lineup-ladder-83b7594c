-- Create global_logs table
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

-- Create championship_race_tracks table
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

-- Add phase column to championship_seasons
ALTER TABLE public.championship_seasons ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'inscricoes';

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.championship_race_tracks;