-- ============================================================================
-- MIGRATION: Add format column to challenges table
-- Execute no SQL Editor do Supabase
-- ============================================================================

ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'MD3'
CHECK (format IN ('MD3', 'MD5'));

-- Verificação: deve retornar a linha com column_name = 'format'
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'challenges'
AND column_name = 'format';
