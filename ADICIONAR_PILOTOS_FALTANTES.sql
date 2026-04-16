-- Script para adicionar pilotos faltantes ao banco de dados
-- Execute no Supabase → SQL Editor

-- Adicionar pilotos que estão em discordUsers.ts mas não no banco
INSERT INTO players (name, initiation_complete, status, defense_count)
VALUES
  -- Street Runners
  ('Repre', false, 'available', 0),
  ('Load', false, 'available', 0),
  ('0000', false, 'available', 0),
  ('Blake', false, 'available', 0),
  ('Nash', false, 'available', 0),
  ('Cyber', false, 'available', 0),
  ('Leite', false, 'available', 0),
  
  -- Night Drivers
  ('ph', false, 'available', 0),
  ('K1', false, 'available', 0),
  ('F.mid', false, 'available', 0),
  ('Porto', false, 'available', 0),
  
  -- Jokers
  ('P1N0', false, 'available', 0),
  ('Furiatti', false, 'available', 0),
  ('Syds', false, 'available', 0),
  ('Dasmilf', false, 'available', 0),
  ('Rev', false, 'available', 0),
  ('DGP1', false, 'available', 0),
  ('Okaka', false, 'available', 0),
  
  -- Outros
  ('Vitória', false, 'available', 0),
  ('Tigas', false, 'available', 0),
  ('Uchoa', false, 'available', 0)
ON CONFLICT (name) DO NOTHING;

-- Verificar pilotos adicionados
SELECT name, initiation_complete, status
FROM players
ORDER BY name;

-- Contar total
SELECT COUNT(*) as total_pilotos FROM players;
