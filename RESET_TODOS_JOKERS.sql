-- ============================================
-- RESET COMPLETO DE TODOS OS JOKERS
-- ============================================
-- Este script reseta o progresso de TODOS os Jokers
-- na lista de iniciação
-- ============================================

-- 1. DELETAR TODOS OS REGISTROS DE JOKER_PROGRESS
-- ============================================
DELETE FROM joker_progress;

-- 2. RESETAR TODOS OS PILOTOS DA LISTA DE INICIAÇÃO
-- ============================================
UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  elegivel_desafio_vaga = false,
  cooldown_until = NULL,
  challenge_cooldown_until = NULL,
  defense_count = 0
WHERE list_id = 'initiation';

-- 3. CANCELAR TODOS OS DESAFIOS DE INICIAÇÃO ATIVOS
-- ============================================
UPDATE challenges 
SET status = 'cancelled'
WHERE type = 'initiation' 
  AND status IN ('pending', 'racing', 'accepted');

-- 4. VERIFICAR RESULTADO
-- ============================================

-- Verificar joker_progress (deve estar vazio)
SELECT 'Registros em joker_progress (deve ser 0):' AS info, COUNT(*) AS total
FROM joker_progress;

-- Verificar pilotos da iniciação (todos devem estar disponíveis)
SELECT 'Pilotos na iniciação:' AS info;
SELECT 
  name,
  status,
  initiation_complete,
  elegivel_desafio_vaga
FROM players
WHERE list_id = 'initiation'
ORDER BY position;

-- Verificar desafios de iniciação (não deve haver ativos)
SELECT 'Desafios de iniciação ativos (deve ser 0):' AS info, COUNT(*) AS total
FROM challenges
WHERE type = 'initiation' 
  AND status IN ('pending', 'racing', 'accepted');

-- ============================================
-- RESUMO
-- ============================================
SELECT '✅ RESET COMPLETO FINALIZADO' AS status;
SELECT 'Todos os Jokers foram resetados' AS mensagem;
SELECT 'Todos os pilotos da iniciação estão disponíveis' AS mensagem;
SELECT 'Todos os desafios de iniciação foram cancelados' AS mensagem;
