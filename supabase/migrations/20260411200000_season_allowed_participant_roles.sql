-- Cargos que podem inscrever-se no torneio (JSON array; valores = PilotRole na app).
-- Default = todos. Torneio exclusivo: admin escolhe só os cargos permitidos na UI.
ALTER TABLE public.championship_seasons
  ADD COLUMN IF NOT EXISTS allowed_participant_roles JSONB NOT NULL DEFAULT '["admin","midnight-driver","night-driver","street-runner","joker"]'::jsonb;
