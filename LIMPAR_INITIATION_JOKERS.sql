-- Script para limpar a flag initiation_complete de TODOS os Jokers
-- Execute no Supabase → SQL Editor

-- Ver estado atual dos Jokers
SELECT 
  name,
  initiation_complete,
  elegivel_desafio_vaga
FROM players
WHERE name IN ('p1n0', 'furiatti', 'syds', 'dasmilf', 'rev', 'dgp1', 'okaka')
ORDER BY name;

-- Limpar flag initiation_complete de TODOS os Jokers
UPDATE players
SET 
  initiation_complete = false,
  elegivel_desafio_vaga = false
WHERE name IN ('p1n0', 'furiatti', 'syds', 'dasmilf', 'rev', 'dgp1', 'okaka');

-- Verificar resultado
SELECT 
  name,
  initiation_complete,
  elegivel_desafio_vaga
FROM players
WHERE name IN ('p1n0', 'furiatti', 'syds', 'dasmilf', 'rev', 'dgp1', 'okaka')
ORDER BY name;
