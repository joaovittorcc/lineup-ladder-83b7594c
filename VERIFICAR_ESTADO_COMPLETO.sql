-- ============================================
-- SCRIPT DE VERIFICAÇÃO COMPLETA DO ESTADO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para verificar o estado atual do sistema
-- ============================================

-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ============================================

SELECT 'VERIFICANDO COLUNAS DA TABELA players' AS status;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'players'
  AND column_name IN (
    'joker_name_key',
    'elegivel_desafio_vaga',
    'initiation_complete',
    'list02_external_block_until',
    'list02_external_eligible_after'
  )
ORDER BY column_name;

-- ============================================
-- 2. VERIFICAR PROGRESSO DOS JOKERS
-- ============================================

SELECT 'VERIFICANDO PROGRESSO DOS JOKERS' AS status;

SELECT 
  jp.joker_name_key,
  COUNT(*) AS total_vitorias,
  STRING_AGG(p.name, ', ') AS pilotos_derrotados
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
GROUP BY jp.joker_name_key
ORDER BY total_vitorias DESC;

-- ============================================
-- 3. VERIFICAR PILOTOS NA INICIAÇÃO
-- ============================================

SELECT 'VERIFICANDO PILOTOS NA INICIAÇÃO' AS status;

SELECT 
  name,
  status,
  initiation_complete,
  CASE 
    WHEN initiation_complete THEN '✓ Derrotado'
    ELSE '○ Disponível'
  END AS estado_visual,
  cooldown_until,
  challenge_cooldown_until
FROM players
WHERE list_id = 'initiation'
ORDER BY position;

-- ============================================
-- 4. VERIFICAR DESAFIOS ATIVOS
-- ============================================

SELECT 'VERIFICANDO DESAFIOS ATIVOS' AS status;

SELECT 
  id,
  type,
  status,
  challenger_name,
  challenged_name,
  list_id,
  created_at,
  expires_at,
  CASE 
    WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'EXPIRADO'
    WHEN status = 'pending' THEN 'Pendente'
    WHEN status = 'racing' THEN 'Em Corrida'
    ELSE status
  END AS estado
FROM challenges
WHERE status IN ('pending', 'racing', 'accepted')
ORDER BY created_at DESC;

-- ============================================
-- 5. VERIFICAR PILOTOS ELEGÍVEIS PARA DESAFIO DE VAGA
-- ============================================

SELECT 'VERIFICANDO ELEGIBILIDADE PARA DESAFIO DE VAGA' AS status;

SELECT 
  name,
  list_id,
  initiation_complete,
  elegivel_desafio_vaga,
  CASE 
    WHEN elegivel_desafio_vaga THEN '✓ Elegível para Desafio de Vaga'
    WHEN initiation_complete AND NOT elegivel_desafio_vaga THEN '⚠️ Completou iniciação mas não elegível'
    ELSE '○ Não elegível'
  END AS status_vaga
FROM players
WHERE initiation_complete = true
ORDER BY list_id, position;

-- ============================================
-- 6. VERIFICAR 8º DA LISTA 02 (ALVO DO DESAFIO DE VAGA)
-- ============================================

SELECT 'VERIFICANDO 8º DA LISTA 02' AS status;

SELECT 
  name,
  position,
  status,
  defense_count,
  defenses_while_seventh_streak,
  list02_external_block_until,
  list02_external_eligible_after,
  CASE 
    WHEN status != 'available' THEN '⚠️ Ocupado'
    WHEN list02_external_block_until IS NOT NULL AND list02_external_block_until > NOW() THEN '🛡️ Bloqueado para externos'
    WHEN list02_external_eligible_after IS NOT NULL AND list02_external_eligible_after > NOW() THEN '⏳ Cooldown de integração'
    ELSE '✓ Disponível para desafio'
  END AS disponibilidade
FROM players
WHERE list_id = 'list-02'
ORDER BY position DESC
LIMIT 1;

-- ============================================
-- 7. VERIFICAR REGISTROS ÓRFÃOS (LIMPEZA NECESSÁRIA)
-- ============================================

SELECT 'VERIFICANDO REGISTROS ÓRFÃOS' AS status;

-- Registros em joker_progress sem piloto correspondente
SELECT 
  'joker_progress órfão' AS tipo,
  COUNT(*) AS total
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
WHERE p.id IS NULL;

-- ============================================
-- 8. RESUMO GERAL
-- ============================================

SELECT 'RESUMO GERAL DO SISTEMA' AS status;

SELECT 
  'Total de Pilotos' AS metrica,
  COUNT(*) AS valor
FROM players
UNION ALL
SELECT 
  'Pilotos na Iniciação',
  COUNT(*)
FROM players
WHERE list_id = 'initiation'
UNION ALL
SELECT 
  'Pilotos Derrotados (Iniciação)',
  COUNT(*)
FROM players
WHERE list_id = 'initiation' AND initiation_complete = true
UNION ALL
SELECT 
  'Pilotos Elegíveis para Vaga',
  COUNT(*)
FROM players
WHERE elegivel_desafio_vaga = true
UNION ALL
SELECT 
  'Desafios Ativos',
  COUNT(*)
FROM challenges
WHERE status IN ('pending', 'racing', 'accepted')
UNION ALL
SELECT 
  'Total de Vitórias Joker (BD)',
  COUNT(*)
FROM joker_progress;

-- ============================================
-- 9. VERIFICAR INTEGRIDADE DOS DADOS
-- ============================================

SELECT 'VERIFICANDO INTEGRIDADE DOS DADOS' AS status;

-- Pilotos com initiation_complete mas sem registro em joker_progress
SELECT 
  'Pilotos derrotados sem registro' AS problema,
  COUNT(*) AS total,
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
  COUNT(*) AS total,
  STRING_AGG(p.name, ', ') AS pilotos
FROM players p
WHERE p.elegivel_desafio_vaga = true
  AND p.initiation_complete = false;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

SELECT '✅ VERIFICAÇÃO COMPLETA FINALIZADA' AS status;
