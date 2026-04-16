-- Script para criar lista oculta e mover pilotos
-- Execute no Supabase → SQL Editor

-- 1. Criar lista oculta (se não existir)
INSERT INTO player_lists (id, title, sort_order)
VALUES ('hidden', 'Pilotos Sem Lista', 999)
ON CONFLICT (id) DO UPDATE SET title = 'Pilotos Sem Lista';

-- 2. Mover pilotos que foram adicionados recentemente para a lista oculta
UPDATE players
SET list_id = 'hidden'
WHERE name IN (
  'Repre', 'Load', 'Blake', 'Nash', 'Cyber', 'Leite',
  'ph', 'K1', 'F.mid', 'Porto',
  'P1N0', 'Furiatti', 'Syds', 'Dasmilf', 'Rev', 'DGP1', 'Okaka',
  'Tigas', 'Uchoa'
);

-- 3. Verificar pilotos na lista oculta
SELECT name, list_id, position, initiation_complete
FROM players
WHERE list_id = 'hidden'
ORDER BY name;

-- 4. Verificar pilotos na lista de iniciação (deve ter apenas 5)
SELECT name, list_id, position
FROM players
WHERE list_id = 'initiation'
ORDER BY position;
