-- ============================================================
-- 1. VER DUPLICATAS — quais IDs existem para cada nome duplicado
-- ============================================================
SELECT id, name, list_id, position, initiation_complete, created_at
FROM players
WHERE name IN ('Evojota', 'Mnz', 'Pedrin', 'Zanin')
ORDER BY name, created_at;

-- ============================================================
-- 2. REMOVER DUPLICATAS
-- Mantém o registro mais ANTIGO (primeiro criado) de cada nome
-- e apaga o mais novo.
-- ATENÇÃO: Execute o SELECT acima primeiro para conferir os IDs!
-- ============================================================

-- Apagar duplicatas mantendo o registro mais antigo de cada nome
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

-- ============================================================
-- 3. ADICIONAR MEMBROS FALTANTES na lista 'hidden'
-- ============================================================
INSERT INTO players (id, name, list_id, position, status, defense_count, initiation_complete, defenses_while_seventh_streak)
VALUES
  (gen_random_uuid(), 'Sant', 'hidden', 910, 'available', 0, false, 0),
  (gen_random_uuid(), 'Gui',  'hidden', 911, 'available', 0, false, 0),
  (gen_random_uuid(), '0000', 'hidden', 912, 'available', 0, false, 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. VERIFICAR resultado final — deve ter 1 linha por nome
-- ============================================================
SELECT name, list_id, position, initiation_complete
FROM players
ORDER BY name;
