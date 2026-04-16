-- Script para adicionar pilotos faltantes ao banco de dados (V2)
-- Execute no Supabase → SQL Editor

-- IMPORTANTE: Este script só adiciona pilotos que NÃO existem ainda
-- Não vai duplicar pilotos existentes

-- Adicionar pilotos faltantes (um por vez para evitar erros)
DO $$
BEGIN
  -- Street Runners
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'repre') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Repre', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'load') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Load', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = '0000') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('0000', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'blake') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Blake', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'nash') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Nash', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'cyber') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Cyber', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'leite') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Leite', false, 'available', 0);
  END IF;
  
  -- Night Drivers
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'ph') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('ph', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'k1') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('K1', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'f.mid') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('F.mid', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'porto') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Porto', false, 'available', 0);
  END IF;
  
  -- Jokers
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'p1n0') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('P1N0', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'furiatti') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Furiatti', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'syds') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Syds', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'dasmilf') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Dasmilf', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'rev') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Rev', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'dgp1') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('DGP1', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'okaka') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Okaka', false, 'available', 0);
  END IF;
  
  -- Outros
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'vitória') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Vitória', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'tigas') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Tigas', false, 'available', 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(name) = 'uchoa') THEN
    INSERT INTO players (name, initiation_complete, status, defense_count) VALUES ('Uchoa', false, 'available', 0);
  END IF;
END $$;

-- Verificar pilotos adicionados
SELECT name, initiation_complete, status
FROM players
ORDER BY name;

-- Contar total
SELECT COUNT(*) as total_pilotos FROM players;
