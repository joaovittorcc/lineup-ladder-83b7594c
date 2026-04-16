-- ============================================
-- SCRIPT DE VERIFICAÇÃO SIMPLES (SEM ERROS)
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. VERIFICAR PROGRESSO DOS JOKERS
-- ============================================

SELECT '=== PROGRESSO DOS JOKERS ===' AS info;

SELECT 
  jp.joker_name_key,
  COUNT(*) AS total_vitorias,
  STRING_AGG(p.name, ', ') AS pilotos_derrotados
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
GROUP BY jp.joker_name_key
ORDER BY total_vitorias DESC;

-- ============================================
-- 2. VERIFICAR PILOTOS NA INICIAÇÃO
-- ============================================

SELECT '=== PILOTOS NA INICIAÇÃO ===' AS info;

SELECT 
  name,
  status,
  initiation_complete,
  CASE 
    WHEN initiation_complete THEN 'Derrotado'
    ELSE 'Disponível'
  END AS estado_visual,
  cooldown_until,
  challenge_cooldown_until
FROM players
WHERE list_id = 'initiation'
ORDER BY position;

-- ============================================
-- 3. VERIFICAR DESAFIOS ATIVOS
-- ============================================

SELECT '=== DESAFIOS ATIVOS ===' AS info;

SELECT 
  id,
  type,
  status,
  challenger_name,
  challenged_name,
  list_id,
  created_at,
  expires_at
FROM challenges
WHERE status IN ('pending', 'racing', 'accepted')
ORDER BY created_at DESC;

-- ============================================
-- 4. VERIFICAR PILOTOS ELEGÍVEIS PARA DESAFIO DE VAGA
-- ============================================

SELECT '=== ELEGÍVEIS PARA DESAFIO DE VAGA ===' AS info;

SELECT 
  name,
  list_id,
  initiation_complete,
  elegivel_desafio_vaga
FROM players
WHERE elegivel_desafio_vaga = true
ORDER BY list_id, position;

-- ============================================
-- 5. VERIFICAR 8º DA LISTA 02
-- ============================================

SELECT '=== 8º DA LISTA 02 (ALVO DO DESAFIO DE VAGA) ===' AS info;

SELECT 
  name,
  position,
  status,
  defense_count,
  defenses_while_seventh_streak,
  list02_external_block_until,
  list02_external_eligible_after
FROM players
WHERE list_id = 'list-02'
ORDER BY position DESC
LIMIT 1;

-- ============================================
-- 6. RESUMO GERAL
-- ============================================

SELECT '=== RESUMO GERAL ===' AS info;

SELECT 
  'Total de Pilotos' AS metrica,
  COUNT(*)::text AS valor
FROM players
UNION ALL
SELECT 
  'Pilotos na Iniciação',
  COUNT(*)::text
FROM players
WHERE list_id = 'initiation'
UNION ALL
SELECT 
  'Pilotos Derrotados (Iniciação)',
  COUNT(*)::text
FROM players
WHERE list_id = 'initiation' AND initiation_complete = true
UNION ALL
SELECT 
  'Pilotos Elegíveis para Vaga',
  COUNT(*)::text
FROM players
WHERE elegivel_desafio_vaga = true
UNION ALL
SELECT 
  'Desafios Ativos',
  COUNT(*)::text
FROM challenges
WHERE status IN ('pending', 'racing', 'accepted')
UNION ALL
SELECT 
  'Total de Vitórias Joker (BD)',
  COUNT(*)::text
FROM joker_progress;

-- ============================================
-- 7. VERIFICAR INTEGRIDADE DOS DADOS
-- ============================================

SELECT '=== VERIFICAÇÃO DE INTEGRIDADE ===' AS info;

-- Pilotos com initiation_complete mas sem registro em joker_progress
SELECT 
  'Pilotos derrotados sem registro' AS problema,
  COUNT(*)::text AS total,
  STRING_AGG(p.name, ', ') AS pilotos
FROM players p
WHERE p.list_id = 'initiation'
  AND p.initiation_complete = true
  AND NOT EXISTS (
    SELECT 1 FROM joker_progress jp 
    WHERE jp.defeated_player_id = p.id
  );

-- Pilotos com elegivel_desafio_vaga mas initiation_complete = false
SELECT 
  'Pilotos elegíveis sem completar iniciação' AS problema,
  COUNT(*)::text AS total,
  STRING_AGG(p.name, ', ') AS pilotos
FROM players p
WHERE p.elegivel_desafio_vaga = true
  AND p.initiation_complete = false;

-- ============================================
-- 8. VERIFICAR REGISTROS ÓRFÃOS
-- ============================================

SELECT '=== REGISTROS ÓRFÃOS ===' AS info;

SELECT 
  'joker_progress órfão' AS tipo,
  COUNT(*)::text AS total
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
WHERE p.id IS NULL;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

SELECT '=== VERIFICAÇÃO COMPLETA FINALIZADA ===' AS info;
