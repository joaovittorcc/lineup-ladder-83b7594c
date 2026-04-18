-- ============================================
-- CORREÇÃO: Desafios de Street Runner não funcionam
-- ============================================
-- PROBLEMA: Pino (Street Runner) tenta desafiar MNZ mas:
-- - Aparece "Desafio enviado com sucesso" no frontend
-- - MNZ não recebe o desafio
-- - Bot Discord não notifica
-- - Console mostra: "Failed to sync challenge insert" (erro 400)
--
-- CAUSA: Tabela 'challenges' não tem coluna 'synthetic_challenger_id'
--        e 'challenger_id' ainda é NOT NULL
-- ============================================

-- 1️⃣ Remover constraint de foreign key (se existir)
ALTER TABLE public.challenges 
DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;

-- 2️⃣ Tornar challenger_id NULLABLE (para permitir desafiantes externos)
ALTER TABLE public.challenges 
ALTER COLUMN challenger_id DROP NOT NULL;

-- 3️⃣ Adicionar coluna synthetic_challenger_id (para Jokers e Street Runners)
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS synthetic_challenger_id TEXT;

-- 4️⃣ Tornar expires_at NULLABLE (desafios de iniciação não expiram)
ALTER TABLE public.challenges 
ALTER COLUMN expires_at DROP NOT NULL;

-- 5️⃣ Limpar desafios de iniciação que têm expiração indevida
UPDATE public.challenges 
SET expires_at = NULL 
WHERE type = 'initiation' AND expires_at IS NOT NULL;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute esta query para confirmar que funcionou:

SELECT 
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'challenges' 
  AND column_name IN ('challenger_id', 'expires_at', 'synthetic_challenger_id')
ORDER BY column_name;

-- ✅ Resultado esperado:
-- challenger_id         | YES | uuid
-- expires_at            | YES | timestamp with time zone
-- synthetic_challenger_id | YES | text

-- ============================================
-- INSTRUÇÕES
-- ============================================
-- 1. Abra o Supabase Dashboard
-- 2. Vá em "SQL Editor"
-- 3. Cole este script completo
-- 4. Clique em "Run"
-- 5. Verifique se a query de verificação retorna os valores esperados
-- 6. Teste novamente: Pino desafia MNZ
-- ============================================
