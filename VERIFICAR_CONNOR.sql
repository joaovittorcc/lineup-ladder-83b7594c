-- Verificar status do Connor
SELECT 
  name,
  list_id,
  initiation_complete,
  elegivel_desafio_vaga,
  status
FROM players
WHERE LOWER(name) = 'connor';

-- Verificar 8º da Lista 02
SELECT 
  name,
  position,
  status
FROM players
WHERE list_id = 'list-02'
ORDER BY position DESC
LIMIT 1;
