-- ============================================================================
-- ADICIONAR COOLDOWN DEFENSIVO PARA MUNIZ (7º Lista 02)
-- Bloqueia recebimento de desafios por 7 dias, mas permite desafiar
-- ============================================================================

-- 1. Encontrar o ID do Muniz na posição 7 da Lista 02
DO $$
DECLARE
  muniz_id UUID;
  cooldown_date TIMESTAMP;
BEGIN
  -- Buscar o piloto na posição 7 da lista 02
  SELECT id INTO muniz_id
  FROM public.players
  WHERE list_id = 'list-02'
  AND position = 7
  LIMIT 1;

  IF muniz_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum piloto encontrado na posição 7 da Lista 02';
    RETURN;
  END IF;

  -- Calcular data de cooldown (7 dias a partir de agora)
  cooldown_date := NOW() + INTERVAL '7 days';

  -- Atualizar o piloto com cooldown defensivo
  -- list02_external_block_until: bloqueia recebimento de desafios externos
  -- status: mantém 'available' para permitir desafiar
  UPDATE public.players
  SET 
    list02_external_block_until = cooldown_date,
    status = 'available'
  WHERE id = muniz_id;

  RAISE NOTICE '✅ Cooldown defensivo de 7 dias adicionado para o piloto na posição 7';
  RAISE NOTICE '   - ID: %', muniz_id;
  RAISE NOTICE '   - Bloqueado até: %', cooldown_date;
  RAISE NOTICE '   - Status: available (pode desafiar)';
END $$;

-- 2. Verificar o resultado
SELECT 
  name,
  list_id,
  position,
  status,
  list02_external_block_until,
  CASE 
    WHEN list02_external_block_until > NOW() THEN 'BLOQUEADO PARA RECEBER DESAFIOS'
    ELSE 'DISPONÍVEL'
  END as situacao_defensiva
FROM public.players
WHERE list_id = 'list-02'
AND position = 7;
