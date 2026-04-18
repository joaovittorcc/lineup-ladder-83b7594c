-- ============================================
-- DIAGNÓSTICO: Slots vazios na Lista 02
-- ============================================

-- 1. Verificar quantos pilotos estão na Lista 02
SELECT 
  COUNT(*) as total_pilotos,
  10 as capacidade_maxima,
  (10 - COUNT(*)) as slots_vazios
FROM public.players
WHERE list_id = 'list-02';

-- 2. Ver todos os pilotos da Lista 02
SELECT 
  p.position,
  p.name,
  p.status,
  p.defense_count,
  p.initiation_complete
FROM public.players p
WHERE p.list_id = 'list-02'
ORDER BY p.position;

-- 3. Verificar se a lista existe
SELECT * FROM public.player_lists WHERE id = 'list-02';
