-- ============================================
-- Limpar progresso do Pino especificamente
-- ============================================

-- 1. Ver o que vai ser deletado
SELECT 
  jp.joker_name_key AS "Joker",
  p.name AS "Piloto que será liberado",
  jp.defeated_at AS "Data da vitória"
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
WHERE jp.joker_name_key IN ('pino', 'Pino', 'PINO');

-- 2. Deletar os registros do Pino
DELETE FROM joker_progress 
WHERE joker_name_key IN ('pino', 'Pino', 'PINO');

-- 3. Resetar o piloto que foi derrotado (Jota)
UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  cooldown_until = NULL
WHERE name ILIKE '%jota%' AND list_id = 'initiation';

-- 4. Verificar o resultado
SELECT 
  'Após limpeza' AS "Status",
  COUNT(*) AS "Registros do Pino (deve ser 0)"
FROM joker_progress 
WHERE joker_name_key IN ('pino', 'Pino', 'PINO');

SELECT 
  name AS "Piloto",
  status AS "Status",
  initiation_complete AS "Iniciação Completa"
FROM players 
WHERE name ILIKE '%jota%' AND list_id = 'initiation';
