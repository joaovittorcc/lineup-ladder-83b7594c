-- ============================================
-- SCRIPT DE LIMPEZA COMPLETA - EXECUTE AGORA
-- ============================================
-- Este script vai limpar TODOS os registros de progresso de Joker
-- e resetar TODOS os pilotos da iniciação

-- ============================================
-- PASSO 1: Ver o estado atual (ANTES)
-- ============================================

SELECT 
  'ANTES DA LIMPEZA' AS "Status",
  COUNT(*) AS "Total de Registros"
FROM joker_progress;

SELECT 
  jp.joker_name_key AS "Joker",
  p.name AS "Piloto Derrotado"
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
ORDER BY jp.joker_name_key, p.name;

-- ============================================
-- PASSO 2: DELETAR TODOS OS REGISTROS DE JOKER_PROGRESS
-- ============================================

DELETE FROM joker_progress;

-- ============================================
-- PASSO 3: RESETAR TODOS OS PILOTOS DA INICIAÇÃO
-- ============================================

UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  cooldown_until = NULL,
  challenge_cooldown_until = NULL,
  defense_count = 0
WHERE list_id = 'initiation';

-- ============================================
-- PASSO 4: Verificar o resultado (DEPOIS)
-- ============================================

SELECT 
  'DEPOIS DA LIMPEZA' AS "Status",
  COUNT(*) AS "Total de Registros (deve ser 0)"
FROM joker_progress;

SELECT 
  name AS "Piloto",
  status AS "Status",
  initiation_complete AS "Iniciação Completa",
  cooldown_until AS "Cooldown"
FROM players 
WHERE list_id = 'initiation'
ORDER BY position;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- joker_progress: 0 registros
-- players (iniciação): Todos com:
--   - status = 'available'
--   - initiation_complete = false
--   - cooldown_until = NULL
-- ============================================
