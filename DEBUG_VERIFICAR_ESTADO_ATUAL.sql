-- ============================================
-- SCRIPT DE DEBUG - Ver o estado atual
-- ============================================

-- 1. Ver TODOS os registros de joker_progress
SELECT 
  id,
  joker_name_key AS "Joker (nome)",
  joker_user_id AS "Joker (user_id)",
  defeated_player_id AS "ID do Derrotado",
  defeated_at AS "Data"
FROM joker_progress
ORDER BY defeated_at DESC;

-- 2. Ver os registros com os nomes dos pilotos derrotados
SELECT 
  jp.joker_name_key AS "Joker",
  p.name AS "Piloto Derrotado",
  jp.defeated_at AS "Quando"
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
ORDER BY jp.defeated_at DESC;

-- 3. Ver o estado dos pilotos da iniciação
SELECT 
  name AS "Piloto",
  status AS "Status",
  initiation_complete AS "Iniciação Completa?",
  CASE 
    WHEN cooldown_until IS NULL THEN 'Sem cooldown'
    WHEN cooldown_until > NOW() THEN 'Em cooldown'
    ELSE 'Cooldown expirado'
  END AS "Cooldown"
FROM players 
WHERE list_id = 'initiation'
ORDER BY position;

-- 4. Contar quantos pilotos cada Joker derrotou
SELECT 
  joker_name_key AS "Joker",
  COUNT(*) AS "Pilotos Derrotados"
FROM joker_progress
GROUP BY joker_name_key
ORDER BY COUNT(*) DESC;

-- ============================================
-- O QUE PROCURAR:
-- ============================================
-- 1. Verifique se joker_name_key está preenchido (não NULL)
-- 2. Verifique se o nome está em minúsculas (ex: 'pino', não 'Pino')
-- 3. Verifique se os pilotos derrotados têm initiation_complete = true
-- ============================================
