-- Virtual list ids for challenges FK (list_id -> player_lists)
INSERT INTO public.player_lists (id, title, sort_order) VALUES
  ('street-runner', 'Desafio Street Runner → Lista 02', 90),
  ('cross-list', 'Desafio entre Listas (L02 → L01)', 91)
ON CONFLICT (id) DO NOTHING;

-- Allow challenges from pilots not yet in players (Joker / Street Runner)
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;
ALTER TABLE public.challenges ALTER COLUMN challenger_id DROP NOT NULL;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS synthetic_challenger_id TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Joker progress by display name (PIN app without auth.users link)
ALTER TABLE public.joker_progress DROP CONSTRAINT IF EXISTS joker_progress_joker_user_id_fkey;
ALTER TABLE public.joker_progress ALTER COLUMN joker_user_id DROP NOT NULL;
ALTER TABLE public.joker_progress ADD COLUMN IF NOT EXISTS joker_name_key TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'joker_progress_joker_user_id_defeated_player_id_key'
  ) THEN
    ALTER TABLE public.joker_progress DROP CONSTRAINT joker_progress_joker_user_id_defeated_player_id_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS joker_progress_name_key_defeated_uidx
  ON public.joker_progress (joker_name_key, defeated_player_id)
  WHERE joker_name_key IS NOT NULL;

-- Lista 02 temporary / seventh-place rules
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS defenses_while_seventh_streak INT NOT NULL DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS list02_external_block_until TIMESTAMPTZ;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS list02_external_eligible_after TIMESTAMPTZ;

-- Safe W.O. processing: only swap ladder positions when challenger exists in players
CREATE OR REPLACE FUNCTION public.process_expired_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ch RECORD;
  challenger_pos INT;
  challenged_pos INT;
BEGIN
  FOR ch IN
    SELECT * FROM public.challenges
    WHERE status = 'pending' AND expires_at <= now()
  LOOP
    UPDATE public.challenges
    SET status = 'wo', completed_at = now(), winner_id = ch.challenger_id
    WHERE id = ch.id;

    IF ch.challenger_id IS NULL THEN
      CONTINUE;
    END IF;

    IF ch.list_id IN ('list-01', 'list-02')
       AND EXISTS (SELECT 1 FROM public.players p WHERE p.id = ch.challenger_id)
       AND EXISTS (SELECT 1 FROM public.players p WHERE p.id = ch.challenged_id)
    THEN
      SELECT position INTO challenger_pos FROM public.players WHERE id = ch.challenger_id;
      SELECT position INTO challenged_pos FROM public.players WHERE id = ch.challenged_id;

      IF challenger_pos IS NOT NULL AND challenged_pos IS NOT NULL THEN
        UPDATE public.players SET position = challenged_pos WHERE id = ch.challenger_id;
        UPDATE public.players SET position = challenger_pos WHERE id = ch.challenged_id;
      END IF;

      UPDATE public.players
      SET status = 'cooldown',
          cooldown_until = now() + INTERVAL '3 days',
          challenge_cooldown_until = now() + INTERVAL '3 days'
      WHERE id = ch.challenged_id;

      UPDATE public.players
      SET status = 'available'
      WHERE id = ch.challenger_id;
    END IF;
  END LOOP;
END;
$$;
