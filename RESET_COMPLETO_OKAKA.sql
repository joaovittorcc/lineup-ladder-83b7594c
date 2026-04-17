-- ============================================================
-- Reset completo do Okaka — como novo cadastro, mantém o ID
-- ID: cb6036b7-2131-4e2c-831e-1d8501277429
-- ============================================================

-- 1. Apagar TODO o progresso de joker do Okaka
DELETE FROM joker_progress
WHERE joker_name_key = 'okaka'
   OR joker_user_id = 'cb6036b7-2131-4e2c-831e-1d8501277429';

-- 2. Apagar registros onde Okaka aparece como derrotado
DELETE FROM joker_progress
WHERE defeated_player_id = 'cb6036b7-2131-4e2c-831e-1d8501277429';

-- 3. Cancelar desafios ativos do Okaka
DELETE FROM challenges
WHERE challenger_id = 'cb6036b7-2131-4e2c-831e-1d8501277429'
   OR challenged_id = 'cb6036b7-2131-4e2c-831e-1d8501277429';

-- 4. Resetar o registro do player — como novo cadastro
UPDATE players SET
  list_id                      = 'hidden',
  position                     = 999,
  status                       = 'available',
  defense_count                = 0,
  cooldown_until               = NULL,
  challenge_cooldown_until     = NULL,
  initiation_complete          = false,
  defenses_while_seventh_streak = 0,
  list02_external_block_until  = NULL,
  list02_external_eligible_after = NULL
WHERE id = 'cb6036b7-2131-4e2c-831e-1d8501277429';

-- 5. Verificar resultado
SELECT id, name, list_id, status, initiation_complete, defense_count,
       cooldown_until, challenge_cooldown_until
FROM players
WHERE id = 'cb6036b7-2131-4e2c-831e-1d8501277429';

-- 6. Confirmar que joker_progress está vazio para Okaka
SELECT COUNT(*) as registros_joker
FROM joker_progress
WHERE joker_name_key = 'okaka';
