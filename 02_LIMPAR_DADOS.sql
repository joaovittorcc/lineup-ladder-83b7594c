-- ============================================
-- PASSO 2: LIMPAR TODOS OS DADOS
-- ============================================
-- Execute este script DEPOIS de executar 01_ADICIONAR_COLUNA_JOKER_NAME_KEY.sql

-- ============================================
-- Ver o estado atual (ANTES)
-- ============================================

SELECT 
  'ANTES DA LIMPEZA' AS "Status",
  COUNT(*) AS "Total de Registros"
FROM joker_progress;

-- Ver quem derrotou quem (usando joker_name_key)
SELECT 
  jp.joker_name_key AS "Joker (nome)",
  u.email AS "Joker (email)",
  p.name AS "Piloto Derrotado",
  jp.defeated_at AS "Data"
FROM joker_progress jp
LEFT JOIN auth.users u ON jp.joker_user_id = u.id
LEFT JOIN players p ON jp.defeated_player_id = p.id
ORDER BY jp.defeated_at DESC;

-- ============================================
-- DELETAR TODOS OS REGISTROS
-- ============================================

DELETE FROM joker_progress;

-- ============================================
-- RESETAR TODOS OS PILOTOS DA INICIAÇÃO
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
-- Verificar o resultado (DEPOIS)
-- ============================================

SELECT 
  'DEPOIS DA LIMPEZA' AS "Status",
  COUNT(*) AS "Total de Registros (deve ser 0)"
FROM joker_progress;

SELECT 
  name AS "Piloto",
  status AS "Status (deve ser available)",
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
