-- Script para limpar manualmente o progresso de Jokers
-- Execute no SQL Editor do Supabase

-- ============================================
-- OPÇÃO 1: Limpar progresso de um Joker específico
-- ============================================
-- Substitua 'evojota' pelo nome do Joker que você quer resetar

DELETE FROM joker_progress 
WHERE joker_name_key = 'evojota';

-- ============================================
-- OPÇÃO 2: Limpar registros onde um piloto específico foi derrotado
-- ============================================
-- Substitua 'mnz' pelo nome do piloto que você quer resetar
-- Primeiro, encontre o ID do piloto:

SELECT id, name FROM players WHERE name ILIKE '%mnz%';

-- Depois, use o ID para deletar os registros:
-- DELETE FROM joker_progress WHERE defeated_player_id = 'COLE_O_ID_AQUI';

-- Exemplo:
-- DELETE FROM joker_progress WHERE defeated_player_id = '123e4567-e89b-12d3-a456-426614174000';

-- ============================================
-- OPÇÃO 3: Limpar TODO o progresso de TODOS os Jokers (CUIDADO!)
-- ============================================
-- Descomente a linha abaixo apenas se quiser resetar TUDO:

-- DELETE FROM joker_progress;

-- ============================================
-- OPÇÃO 4: Ver o progresso atual antes de deletar
-- ============================================

SELECT 
  jp.joker_name_key AS "Joker",
  p.name AS "Piloto Derrotado",
  jp.defeated_player_id AS "ID do Derrotado"
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
ORDER BY jp.joker_name_key, p.name;

-- ============================================
-- OPÇÃO 5: Resetar um piloto completamente (como novo cadastro)
-- ============================================
-- Substitua 'mnz' pelo nome do piloto

-- 1. Limpar progresso onde ele foi derrotado
DELETE FROM joker_progress 
WHERE defeated_player_id IN (
  SELECT id FROM players WHERE name ILIKE '%mnz%'
);

-- 2. Limpar progresso se ele for um Joker
DELETE FROM joker_progress 
WHERE joker_name_key = 'mnz';

-- 3. Resetar campos do piloto na tabela players
UPDATE players 
SET 
  status = 'available',
  defense_count = 0,
  cooldown_until = NULL,
  challenge_cooldown_until = NULL,
  initiation_complete = false,
  defenses_while_seventh_streak = 0,
  list02_external_block_until = NULL,
  list02_external_eligible_after = NULL
WHERE name ILIKE '%mnz%';

-- ============================================
-- VERIFICAÇÃO: Ver o estado atual do piloto
-- ============================================

SELECT 
  name,
  status,
  initiation_complete,
  defense_count,
  cooldown_until,
  challenge_cooldown_until
FROM players 
WHERE name ILIKE '%mnz%';
