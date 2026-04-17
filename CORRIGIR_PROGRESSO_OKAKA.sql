-- ============================================================
-- Corrigir progresso do Joker Okaka
-- Ele venceu APENAS: Zanin, Evojota e Connor
-- ============================================================

-- 1. Apagar todo o progresso atual do Okaka
DELETE FROM joker_progress
WHERE joker_name_key = 'okaka';

-- 2. Inserir apenas as 3 vitórias corretas
-- Zanin (initiation): 1f94d9ea-3eef-46bc-8539-a1defce3ef75
-- Evojota (initiation): d8d081f0-86dc-48cd-97b3-8c773f676952
-- Connor (initiation): 08fdb44e-42e8-4beb-9fd3-e566424f1f40
INSERT INTO joker_progress (joker_name_key, joker_user_id, defeated_player_id)
VALUES
  ('okaka', NULL, '1f94d9ea-3eef-46bc-8539-a1defce3ef75'),  -- Zanin
  ('okaka', NULL, 'd8d081f0-86dc-48cd-97b3-8c773f676952'),  -- Evojota
  ('okaka', NULL, '08fdb44e-42e8-4beb-9fd3-e566424f1f40');  -- Connor

-- 3. Verificar resultado
SELECT jp.*, p.name as defeated_name
FROM joker_progress jp
LEFT JOIN players p ON p.id = jp.defeated_player_id
WHERE jp.joker_name_key = 'okaka'
ORDER BY jp.created_at;
