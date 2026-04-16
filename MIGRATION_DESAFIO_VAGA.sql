-- ============================================
-- MIGRATION: Adicionar suporte para Desafio de Vaga
-- ============================================

-- 1. Adicionar coluna elegivel_desafio_vaga na tabela players
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS elegivel_desafio_vaga BOOLEAN NOT NULL DEFAULT false;

-- 2. Criar índice para busca rápida de pilotos elegíveis
CREATE INDEX IF NOT EXISTS idx_players_elegivel_desafio_vaga 
ON public.players(elegivel_desafio_vaga) 
WHERE elegivel_desafio_vaga = true;

-- 3. Comentário explicativo
COMMENT ON COLUMN public.players.elegivel_desafio_vaga IS 
'Indica se o piloto completou a iniciação e está elegível para desafiar o 8º da Lista 02 (Desafio de Vaga)';

-- 4. Verificar a estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
  AND column_name = 'elegivel_desafio_vaga';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- column_name              | data_type | is_nullable | column_default
-- elegivel_desafio_vaga    | boolean   | NO          | false
-- ============================================
