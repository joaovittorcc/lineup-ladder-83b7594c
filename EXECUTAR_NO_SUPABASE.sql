-- ============================================
-- 🔧 CORREÇÃO: Desafios Street Runner
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Remover constraint de foreign key
ALTER TABLE public.challenges 
DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;

-- 2. Tornar challenger_id NULLABLE
ALTER TABLE public.challenges 
ALTER COLUMN challenger_id DROP NOT NULL;

-- 3. Adicionar coluna synthetic_challenger_id
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS synthetic_challenger_id TEXT;

-- 4. Tornar expires_at NULLABLE
ALTER TABLE public.challenges 
ALTER COLUMN expires_at DROP NOT NULL;

-- 5. Limpar desafios de iniciação com expiração
UPDATE public.challenges 
SET expires_at = NULL 
WHERE type = 'initiation' AND expires_at IS NOT NULL;

-- ============================================
-- ✅ VERIFICAÇÃO
-- ============================================

SELECT 
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'challenges' 
  AND column_name IN ('challenger_id', 'expires_at', 'synthetic_challenger_id')
ORDER BY column_name;

-- Resultado esperado:
-- challenger_id         | YES | uuid
-- expires_at            | YES | timestamp with time zone
-- synthetic_challenger_id | YES | text
