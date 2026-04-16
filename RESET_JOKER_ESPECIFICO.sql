-- ============================================
-- RESET DE UM JOKER ESPECÍFICO
-- ============================================
-- Este script reseta o progresso de UM Joker específico
-- Substitua 'NOME_DO_JOKER' pelo nome real
-- ============================================

-- ⚠️ IMPORTANTE: Substitua 'NOME_DO_JOKER' pelo nome real do Joker
-- Exemplos: 'pino', 'rev', 'evojota', etc.

DO $$
DECLARE
  v_joker_name TEXT := 'NOME_DO_JOKER'; -- ⚠️ ALTERE AQUI
  v_joker_name_key TEXT;
  v_deleted_count INT;
  v_reset_count INT;
BEGIN
  -- Normaliza o nome para lowercase
  v_joker_name_key := LOWER(TRIM(v_joker_name));
  
  RAISE NOTICE '🔄 Resetando progresso do Joker: %', v_joker_name;
  
  -- 1. Deletar registros de joker_progress
  DELETE FROM joker_progress 
  WHERE joker_name_key = v_joker_name_key;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deletados % registros de joker_progress', v_deleted_count;
  
  -- 2. Resetar pilotos que foram derrotados por este Joker
  UPDATE players 
  SET 
    status = 'available',
    initiation_complete = false,
    elegivel_desafio_vaga = false,
    cooldown_until = NULL
  WHERE list_id = 'initiation'
    AND id IN (
      SELECT defeated_player_id 
      FROM joker_progress 
      WHERE joker_name_key = v_joker_name_key
    );
  
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  RAISE NOTICE '✅ Resetados % pilotos da iniciação', v_reset_count;
  
  -- 3. Cancelar desafios de iniciação deste Joker
  UPDATE challenges 
  SET status = 'cancelled'
  WHERE type = 'initiation' 
    AND status IN ('pending', 'racing', 'accepted')
    AND LOWER(challenger_name) = v_joker_name_key;
  
  RAISE NOTICE '✅ Reset completo do Joker: %', v_joker_name;
END $$;

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

-- Verificar progresso do Joker (deve estar vazio)
SELECT 'Progresso do Joker (deve ser 0):' AS info;
SELECT 
  joker_name_key,
  COUNT(*) AS vitorias
FROM joker_progress
WHERE joker_name_key = LOWER('NOME_DO_JOKER') -- ⚠️ ALTERE AQUI TAMBÉM
GROUP BY joker_name_key;

-- Verificar pilotos da iniciação
SELECT 'Pilotos na iniciação:' AS info;
SELECT 
  name,
  status,
  initiation_complete
FROM players
WHERE list_id = 'initiation'
ORDER BY position;

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

-- Para resetar o Pino:
-- v_joker_name TEXT := 'pino';

-- Para resetar o Rev:
-- v_joker_name TEXT := 'rev';

-- Para resetar o Evojota:
-- v_joker_name TEXT := 'evojota';
