-- Script para adicionar coluna faltante na tabela players
-- Execute no Supabase → SQL Editor

-- Adicionar coluna defenses_while_seventh_streak se não existir
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS defenses_while_seventh_streak INT NOT NULL DEFAULT 0;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'players'
  AND column_name = 'defenses_while_seventh_streak';

-- Verificar estrutura completa da tabela players
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;
