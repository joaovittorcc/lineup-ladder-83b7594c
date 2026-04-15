-- ============================================
-- SOLUÇÃO DEFINITIVA PARA O BUG DE DESAFIOS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Tornar challenger_id NULLABLE (para jokers externos)
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;
ALTER TABLE public.challenges ALTER COLUMN challenger_id DROP NOT NULL;

-- 2. Adicionar coluna synthetic_challenger_id (se não existir)
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS synthetic_challenger_id TEXT;

-- 3. Tornar expires_at NULLABLE (desafios de iniciação não expiram)
ALTER TABLE public.challenges ALTER COLUMN expires_at DROP NOT NULL;

-- 4. Limpar desafios de iniciação existentes que têm expiração
UPDATE public.challenges 
SET expires_at = NULL 
WHERE type = 'initiation';

-- 5. Verificar se funcionou
SELECT 
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'challenges' 
  AND column_name IN ('challenger_id', 'expires_at', 'synthetic_challenger_id')
ORDER BY column_name;

-- Resultado esperado:
-- challenger_id       | YES | uuid
-- expires_at          | YES | timestamp with time zone
-- synthetic_challenger_id | YES | text

-- ============================================
-- 6. ADICIONAR USUÁRIO dgp1
-- ============================================

-- Inserir usuário na tabela auth.users (se necessário)
-- Nota: Normalmente usuários são criados via Supabase Auth UI ou API
-- Este é um exemplo de inserção direta (use com cuidado em produção)

-- Inserir perfil do usuário dgp1
INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'dgp1',
  'dgp1',
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE 
SET updated_at = NOW();

-- Nota: A senha '1303' deve ser configurada através do Supabase Auth Dashboard
-- ou usando a API de autenticação do Supabase, não diretamente no SQL por questões de segurança
