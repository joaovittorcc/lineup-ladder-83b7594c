-- ============================================
-- VERIFICAÇÃO BÁSICA (SEM ERROS)
-- ============================================

-- 1. PROGRESSO DOS JOKERS
SELECT 
  jp.joker_name_key AS joker,
  COUNT(*) AS vitorias,
  STRING_AGG(p.name, ', ') AS derrotados
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
GROUP BY jp.joker_name_key
ORDER BY vitorias DESC;

-- 2. PILOTOS NA INICIAÇÃO
SELECT 
  name AS piloto,
  status,
  initiation_complete AS derrotado
FROM players
WHERE list_id = 'initiation'
ORDER BY position;

-- 3. DESAFIOS ATIVOS
SELECT 
  type AS tipo,
  status,
  challenger_name AS desafiante,
  challenged_name AS desafiado,
  created_at AS criado_em
FROM challenges
WHERE status IN ('pending', 'racing', 'accepted')
ORDER BY created_at DESC;

-- 4. ELEGÍVEIS PARA DESAFIO DE VAGA
SELECT 
  name AS piloto,
  list_id AS lista,
  initiation_complete AS completou_iniciacao,
  elegivel_desafio_vaga AS elegivel_vaga
FROM players
WHERE elegivel_desafio_vaga = true;

-- 5. RESUMO GERAL
SELECT 'Total de Pilotos' AS metrica, COUNT(*)::text AS valor FROM players
UNION ALL
SELECT 'Pilotos na Iniciação', COUNT(*)::text FROM players WHERE list_id = 'initiation'
UNION ALL
SELECT 'Pilotos Derrotados', COUNT(*)::text FROM players WHERE initiation_complete = true
UNION ALL
SELECT 'Elegíveis para Vaga', COUNT(*)::text FROM players WHERE elegivel_desafio_vaga = true
UNION ALL
SELECT 'Desafios Ativos', COUNT(*)::text FROM challenges WHERE status IN ('pending', 'racing', 'accepted')
UNION ALL
SELECT 'Vitórias Joker (BD)', COUNT(*)::text FROM joker_progress;

-- 6. PROBLEMAS DE INTEGRIDADE
SELECT 
  'Derrotados sem registro' AS problema,
  COUNT(*)::text AS total
FROM players p
WHERE p.list_id = 'initiation'
  AND p.initiation_complete = true
  AND NOT EXISTS (SELECT 1 FROM joker_progress jp WHERE jp.defeated_player_id = p.id);

SELECT 
  'Elegíveis sem completar' AS problema,
  COUNT(*)::text AS total
FROM players p
WHERE p.elegivel_desafio_vaga = true AND p.initiation_complete = false;

SELECT 
  'Registros órfãos' AS problema,
  COUNT(*)::text AS total
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
WHERE p.id IS NULL;
