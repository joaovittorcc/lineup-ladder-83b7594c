-- ============================================================
-- Reset TOTAL do Okaka + resetar initiation_complete dos pilotos da lista
-- ============================================================

-- 1. Apagar TODO joker_progress (qualquer chave relacionada ao Okaka)
DELETE FROM joker_progress
WHERE joker_name_key = 'okaka'
   OR joker_name_key LIKE '%okaka%'
   OR joker_user_id = 'cb6036b7-2131-4e2c-831e-1d8501277429';

-- 2. Resetar initiation_complete dos pilotos da lista de iniciação
-- (os que aparecem como "DERROTADO" precisam voltar a false)
UPDATE players SET
  initiation_complete = false,
  status = 'available',
  cooldown_until = NULL
WHERE list_id = 'initiation';

-- 3. Reset completo do Okaka
UPDATE players SET
  list_id                        = 'hidden',
  position                       = 999,
  status                         = 'available',
  defense_count                  = 0,
  cooldown_until                 = NULL,
  challenge_cooldown_until       = NULL,
  initiation_complete            = false,
  defenses_while_seventh_streak  = 0,
  list02_external_block_until    = NULL,
  list02_external_eligible_after = NULL
WHERE id = 'cb6036b7-2131-4e2c-831e-1d8501277429';

-- 4. Verificar joker_progress vazio
SELECT COUNT(*) as registros FROM joker_progress WHERE joker_name_key = 'okaka';

-- 5. Verificar pilotos da iniciação resetados
SELECT id, name, initiation_complete, status, cooldown_until
FROM players
WHERE list_id = 'initiation'
ORDER BY position;
