-- ============================================================
-- Adicionar membros que estão em users.ts mas faltam no banco
-- Execute no Supabase → SQL Editor
-- ============================================================

-- 1. Ver quem já existe no banco (para conferir antes de inserir)
SELECT name, list_id, position, initiation_complete
FROM players
ORDER BY list_id, position;

-- ============================================================
-- 2. Inserir membros faltantes na lista 'hidden'
--    (use ON CONFLICT DO NOTHING para evitar duplicatas)
-- ============================================================

INSERT INTO players (id, name, list_id, position, status, defense_count, initiation_complete, defenses_while_seventh_streak)
VALUES
  -- Admins / membros que normalmente estão nas listas mas podem ter sido removidos
  (gen_random_uuid(), 'Sant',       'hidden', 900, 'available', 0, false, 0),
  (gen_random_uuid(), 'Connor',     'hidden', 901, 'available', 0, false, 0),
  (gen_random_uuid(), 'Tigas',      'hidden', 902, 'available', 0, false, 0),
  (gen_random_uuid(), 'Uchoa',      'hidden', 903, 'available', 0, false, 0),
  (gen_random_uuid(), 'Vitin',      'hidden', 904, 'available', 0, false, 0),
  (gen_random_uuid(), 'Mnz',        'hidden', 905, 'available', 0, false, 0),
  (gen_random_uuid(), 'Veiga',      'hidden', 906, 'available', 0, false, 0),
  (gen_random_uuid(), 'Gus',        'hidden', 907, 'available', 0, false, 0),
  (gen_random_uuid(), 'Watzel',     'hidden', 908, 'available', 0, false, 0),
  (gen_random_uuid(), 'Gui',        'hidden', 909, 'available', 0, false, 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Verificar resultado — todos devem aparecer no banco
-- ============================================================
SELECT name, list_id, position, initiation_complete
FROM players
WHERE name IN (
  'Sant', 'Connor', 'Tigas', 'Uchoa', 'Vitin',
  'Mnz', 'Veiga', 'Gus', 'Watzel', 'Gui'
)
ORDER BY name;
