-- Verificar quantos pilotos estão na Lista 02
SELECT 
  p.id,
  p.name,
  p.position,
  p.status,
  pl.title as lista
FROM public.players p
JOIN public.player_lists pl ON p.list_id = pl.id
WHERE p.list_id = 'list-02'
ORDER BY p.position;

-- Contar total
SELECT COUNT(*) as total_pilotos_lista_02
FROM public.players
WHERE list_id = 'list-02';
