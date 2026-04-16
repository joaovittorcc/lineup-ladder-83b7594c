-- Query para verificar o estado dos pilotos da Lista de Iniciação
-- Execute no SQL Editor do Supabase para ver quais pilotos foram derrotados

SELECT 
  name AS "Nome do Piloto",
  status AS "Status",
  initiation_complete AS "Iniciação Completa?",
  CASE 
    WHEN cooldown_until IS NULL THEN 'Sem cooldown'
    WHEN cooldown_until > NOW() THEN 'Em cooldown (' || EXTRACT(DAY FROM (cooldown_until - NOW())) || ' dias)'
    ELSE 'Cooldown expirado'
  END AS "Cooldown",
  position AS "Posição"
FROM players
WHERE list_id = 'initiation'
ORDER BY position;

-- Query para verificar o progresso dos Jokers
-- Mostra quantos pilotos cada Joker derrotou

SELECT 
  joker_name_key AS "Joker",
  COUNT(*) AS "Pilotos Derrotados",
  STRING_AGG(p.name, ', ') AS "Nomes dos Derrotados"
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
GROUP BY joker_name_key
ORDER BY COUNT(*) DESC;

-- Query para verificar se há inconsistências
-- Pilotos marcados como derrotados mas sem registro no joker_progress

SELECT 
  p.name AS "Piloto",
  p.initiation_complete AS "Marcado como Derrotado?",
  CASE 
    WHEN jp.defeated_player_id IS NULL THEN '❌ SEM REGISTRO'
    ELSE '✅ OK'
  END AS "Status no joker_progress"
FROM players p
LEFT JOIN joker_progress jp ON p.id = jp.defeated_player_id
WHERE p.list_id = 'initiation' AND p.initiation_complete = true;
