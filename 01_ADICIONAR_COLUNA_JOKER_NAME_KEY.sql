-- ============================================
-- PASSO 1: ADICIONAR COLUNA joker_name_key
-- ============================================
-- Execute este script PRIMEIRO antes de limpar os dados

-- Verificar se a coluna já existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'joker_progress' 
  AND table_schema = 'public';

-- Adicionar a coluna joker_name_key se não existir
ALTER TABLE public.joker_progress 
ADD COLUMN IF NOT EXISTS joker_name_key TEXT;

-- Tornar joker_user_id opcional (pode ser NULL)
ALTER TABLE public.joker_progress 
ALTER COLUMN joker_user_id DROP NOT NULL;

-- Remover a constraint antiga de UNIQUE se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'joker_progress_joker_user_id_defeated_player_id_key'
  ) THEN
    ALTER TABLE public.joker_progress 
    DROP CONSTRAINT joker_progress_joker_user_id_defeated_player_id_key;
  END IF;
END $$;

-- Criar índice único para joker_name_key + defeated_player_id
CREATE UNIQUE INDEX IF NOT EXISTS joker_progress_name_key_defeated_uidx
  ON public.joker_progress (joker_name_key, defeated_player_id)
  WHERE joker_name_key IS NOT NULL;

-- Verificar o resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'joker_progress' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Deve mostrar as colunas:
-- - id (uuid)
-- - joker_user_id (uuid, nullable)
-- - defeated_player_id (uuid)
-- - defeated_at (timestamp)
-- - joker_name_key (text, nullable) ← NOVA COLUNA
-- ============================================
