-- Script para verificar quais pilotos estão cadastrados no banco
-- Execute no Supabase → SQL Editor

-- Ver TODOS os pilotos cadastrados
SELECT 
  id,
  name,
  initiation_complete,
  created_at
FROM players
ORDER BY name;

-- Contar total de pilotos
SELECT COUNT(*) as total_pilotos FROM players;

-- Ver pilotos que completaram iniciação
SELECT 
  name,
  initiation_complete
FROM players
WHERE initiation_complete = true
ORDER BY name;
