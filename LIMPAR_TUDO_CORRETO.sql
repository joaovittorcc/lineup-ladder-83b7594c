-- ============================================
-- SCRIPT DE LIMPEZA COMPLETA - VERSÃO CORRETA
-- ============================================
-- Este script usa a estrutura REAL da tabela joker_progress

-- ============================================
-- PASSO 1: Ver o estado atual (ANTES)
-- ============================================

SELECT 
  'ANTES DA LIMPEZA' AS "Status",
  COUNT(*) AS "Total de Registros"
FROM joker_progress;

-- Ver quem derrotou quem
SELECT 
  u.email AS "Joker (email)",
  p.name AS "Piloto Derrotado",
  jp.defeated_at AS "Data"
FROM joker_progress jp
LEFT JOIN auth.users u ON jp.joker_user_id = u.id
LEFT JOIN players p ON jp.defeated_player_id = p.id
ORDER BY jp.defeated_at DESC;

-- ============================================
-- PASSO 2: DELETAR TODOS OS REGISTROS
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
  initiation_complete AS "Iniciação Completa (deve ser false)",
  cooldown_until AS "Cooldown (deve ser NULL)"
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
