-- ============================================
-- Verificar desafios ativos e histórico recente
-- ============================================

-- 1. Ver desafios ATIVOS (pending, racing, accepted)
SELECT 
  id,
  list_id AS "Lista",
  challenger_name AS "Desafiante",
  challenged_name AS "Desafiado",
  status AS "Status",
  type AS "Tipo",
  created_at AS "Criado em",
  score AS "Placar"
FROM challenges
WHERE status IN ('pending', 'racing', 'accepted')
ORDER BY created_at DESC;

-- 2. Ver desafios de INICIAÇÃO recentes (últimas 24h)
SELECT 
  id,
  challenger_name AS "Joker",
  challenged_name AS "Piloto",
  status AS "Status",
  score AS "Placar",
  created_at AS "Quando"
FROM challenges
WHERE type = 'initiation'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 3. Ver desafios COMPLETADOS de iniciação (últimos 10)
SELECT 
  id,
  challenger_name AS "Joker",
  challenged_name AS "Piloto",
  status AS "Status",
  score AS "Placar [Joker, Piloto]",
  created_at AS "Quando"
FROM challenges
WHERE type = 'initiation'
  AND status IN ('completed', 'wo')
ORDER BY created_at DESC
LIMIT 10;

-- 4. CANCELAR desafios ativos de iniciação (se necessário)
-- Descomente as linhas abaixo para cancelar todos os desafios ativos:

-- UPDATE challenges 
-- SET status = 'cancelled'
-- WHERE type = 'initiation' 
--   AND status IN ('pending', 'racing', 'accepted');

-- 5. Verificar se há desafios "fantasma" (completed mas sem registro em joker_progress)
SELECT 
  c.id,
  c.challenger_name AS "Joker",
  c.challenged_name AS "Piloto",
  c.score AS "Placar",
  CASE 
    WHEN jp.id IS NULL THEN '❌ SEM REGISTRO'
    ELSE '✅ OK'
  END AS "Status no joker_progress"
FROM challenges c
LEFT JOIN joker_progress jp ON jp.defeated_player_id = c.challenged_id
WHERE c.type = 'initiation'
  AND c.status = 'completed'
  AND c.score[1] > c.score[2]  -- Joker venceu
ORDER BY c.created_at DESC
LIMIT 10;
