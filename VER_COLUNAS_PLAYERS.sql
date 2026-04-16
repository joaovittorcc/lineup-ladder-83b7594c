-- Ver todas as colunas da tabela players
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;
