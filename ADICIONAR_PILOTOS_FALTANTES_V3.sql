-- Script para adicionar pilotos faltantes ao banco de dados (V3)
-- Execute no Supabase → SQL Editor
-- Adiciona todos os pilotos faltantes na Lista de Iniciação

-- Ver quantos pilotos já existem na Lista de Iniciação
SELECT COUNT(*) as total_iniciacao FROM players WHERE list_id = 'initiation';

-- Adicionar pilotos faltantes na Lista de Iniciação
-- Começando da posição 6 (assumindo que já existem 5)

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Repre', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'repre');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Load', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'load');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', '0000', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = '0000');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Blake', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'blake');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Nash', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'nash');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Cyber', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'cyber');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Leite', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'leite');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'ph', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'ph');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'K1', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'k1');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'F.mid', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'f.mid');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Porto', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'porto');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'P1N0', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'p1n0');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Furiatti', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'furiatti');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Syds', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'syds');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Dasmilf', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'dasmilf');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Rev', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'rev');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'DGP1', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'dgp1');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Okaka', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'okaka');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Vitória', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'vitória');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Tigas', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'tigas');

INSERT INTO players (list_id, name, position, status, defense_count, initiation_complete)
SELECT 'initiation', 'Uchoa', COALESCE(MAX(position), 0) + 1, 'available', 0, false FROM players WHERE list_id = 'initiation'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'uchoa');

-- Verificar resultado
SELECT list_id, name, position, initiation_complete
FROM players
WHERE list_id = 'initiation'
ORDER BY position;

-- Contar total
SELECT COUNT(*) as total_pilotos FROM players;
