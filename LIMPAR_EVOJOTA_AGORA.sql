-- Script para limpar o progresso incorreto do Evojota
-- Execute este script AGORA no SQL Editor do Supabase

-- ============================================
-- PASSO 1: Ver o estado atual (antes de limpar)
-- ============================================

SELECT 
  jp.joker_name_key AS "Joker",
  p.name AS "Piloto Derrotado",
  jp.defeated_player_id AS "ID do Derrotado"
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
WHERE jp.joker_name_key = 'evojota'
ORDER BY p.name;

-- ============================================
-- PASSO 2: Limpar TODO o progresso do Evojota
-- ============================================

DELETE FROM joker_progress 
WHERE joker_name_key = 'evojota';

-- ============================================
-- PASSO 3: Verificar que foi limpo (deve retornar 0 linhas)
-- ============================================

SELECT COUNT(*) AS "Registros Restantes"
FROM joker_progress 
WHERE joker_name_key = 'evojota';

-- ============================================
-- PASSO 4: Resetar os pilotos que foram marcados como derrotados
-- ============================================

-- Resetar Mnz
UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  cooldown_until = NULL
WHERE name = 'Mnz';

-- Resetar Connor
UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  cooldown_until = NULL
WHERE name = 'Connor';

-- Resetar Zanin
UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  cooldown_until = NULL
WHERE name = 'Zanin';

-- Resetar Pedrin
UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  cooldown_until = NULL
WHERE name = 'Pedrin';

-- ============================================
-- PASSO 5: Verificar o estado final
-- ============================================

SELECT 
  name,
  status,
  initiation_complete,
  cooldown_until
FROM players 
WHERE list_id = 'initiation'
ORDER BY position;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- - joker_progress: 0 registros para evojota
-- - players: Todos com initiation_complete = false, status = available
-- - UI: Nenhum piloto deve aparecer como "✓ Vencido" para Evojota
