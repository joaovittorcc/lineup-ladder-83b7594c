-- ============================================================
-- CORRIGIR DUPLICATAS E ADICIONAR MEMBROS FALTANTES V2
-- Resolve o erro de foreign key da tabela challenges
-- Execute no Supabase → SQL Editor
-- ============================================================

-- 1. Apagar desafios que referenciam os IDs duplicados (mais novos)
DELETE FROM challenges
WHERE challenged_id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) AS rn
    FROM players
    WHERE name IN ('Evojota', 'Mnz', 'Pedrin', 'Zanin')
  ) ranked
  WHERE rn > 1
)
OR challenger_id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) AS rn
    FROM players
    WHERE name IN ('Evojota', 'Mnz', 'Pedrin', 'Zanin')
  ) ranked
  WHERE rn > 1
);

-- 2. Apagar joker_progress que referencia os IDs duplicados
DELETE FROM joker_progress
WHERE defeated_player_id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) AS rn
    FROM players
    WHERE name IN ('Evojota', 'Mnz', 'Pedrin', 'Zanin')
  ) ranked
  WHERE rn > 1
);

-- 3. Agora sim, remover os registros duplicados
DELETE FROM players
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) AS rn
    FROM players
    WHERE name IN ('Evojota', 'Mnz', 'Pedrin', 'Zanin')
  ) ranked
  WHERE rn > 1
);

-- 4. Adicionar membros faltantes na lista hidden
INSERT INTO players (id, name, list_id, position, status, defense_count, initiation_complete, defenses_while_seventh_streak)
VALUES
  (gen_random_uuid(), 'Sant', 'hidden', 910, 'available', 0, false, 0),
  (gen_random_uuid(), 'Gui',  'hidden', 911, 'available', 0, false, 0),
  (gen_random_uuid(), '0000', 'hidden', 912, 'available', 0, false, 0)
ON CONFLICT DO NOTHING;

-- 5. Verificar resultado final
SELECT name, list_id, position, initiation_complete
FROM players
ORDER BY name;
