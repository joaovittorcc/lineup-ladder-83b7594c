-- ============================================================================
-- MIGRATION: Add Defensive Immunity System Columns
-- ============================================================================
-- Description: Adds consecutive_defenses and cooldown_immunity_until columns
--              to track defense wins and immunity periods
-- Date: 2026-04-20
-- Feature: defensive-immunity-system
-- ============================================================================

BEGIN;

-- Add consecutive_defenses column to track defense wins
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS consecutive_defenses INTEGER DEFAULT 0;

-- Add cooldown_immunity_until column to track immunity expiration
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS cooldown_immunity_until TIMESTAMPTZ;

-- Add index for immunity queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_players_immunity 
ON public.players(cooldown_immunity_until) 
WHERE cooldown_immunity_until IS NOT NULL;

-- Add index for defense counter queries
CREATE INDEX IF NOT EXISTS idx_players_consecutive_defenses 
ON public.players(consecutive_defenses) 
WHERE consecutive_defenses > 0;

-- Add comments for documentation
COMMENT ON COLUMN public.players.consecutive_defenses IS 
'Number of consecutive successful defenses. Reset to 0 on loss or position change.';

COMMENT ON COLUMN public.players.cooldown_immunity_until IS 
'Timestamp until which the pilot cannot be challenged. NULL means no immunity.';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN ('consecutive_defenses', 'cooldown_immunity_until');

-- Check indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'players' 
AND indexname IN ('idx_players_immunity', 'idx_players_consecutive_defenses');

-- Verify data integrity
SELECT COUNT(*) as total_players,
       COUNT(consecutive_defenses) as has_counter,
       COUNT(cooldown_immunity_until) as has_immunity
FROM public.players;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- Uncomment and run if you need to rollback this migration:
--
-- BEGIN;
-- DROP INDEX IF EXISTS idx_players_immunity;
-- DROP INDEX IF EXISTS idx_players_consecutive_defenses;
-- ALTER TABLE public.players DROP COLUMN IF EXISTS consecutive_defenses;
-- ALTER TABLE public.players DROP COLUMN IF EXISTS cooldown_immunity_until;
-- COMMIT;
