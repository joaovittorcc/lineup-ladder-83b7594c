-- ============================================================
-- Script completo: adicionar TODAS as colunas faltantes
-- Execute no Supabase → SQL Editor
-- ============================================================

-- 1. Coluna: defenses_while_seventh_streak
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS defenses_while_seventh_streak INT NOT NULL DEFAULT 0;

-- 2. Coluna: list02_external_block_until
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS list02_external_block_until TIMESTAMPTZ;

-- 3. Coluna: list02_external_eligible_after
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS list02_external_eligible_after TIMESTAMPTZ;

-- 4. Coluna: elegivel_desafio_vaga (flag para desafio de vaga)
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS elegivel_desafio_vaga BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- Verificar se todas as colunas foram adicionadas
-- ============================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;
