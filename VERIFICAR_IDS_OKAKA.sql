-- Ver IDs de Okaka, Zanin, Evojota e Connor
SELECT id, name, list_id
FROM players
WHERE name IN ('Okaka', 'Zanin', 'Evojota', 'Connor')
ORDER BY name;

-- Ver progresso atual do Okaka na joker_progress
SELECT jp.*, p.name as defeated_name
FROM joker_progress jp
LEFT JOIN players p ON p.id = jp.defeated_player_id
WHERE jp.joker_name_key = 'okaka';
