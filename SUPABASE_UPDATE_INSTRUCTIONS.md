# Instruções de Atualização do Supabase

## O que mudou?

Fizemos alterações para que desafios de iniciação funcionem corretamente:

1. **Desafios de iniciação não expiram** - Removemos o tempo limite de 24h
2. **ID do desafiante pode ser NULL** - Para jokers externos que não têm conta
3. **Suporte para synthetic_challenger_id** - Para identificar jokers externos

## SQL que você precisa executar

Copie e cole este SQL no **SQL Editor** do Supabase:

```sql
-- Make expires_at nullable for initiation challenges (they don't expire)
-- Ladder challenges (List 01, List 02, Cross-list, Street Runner) still have 24h expiry by default

ALTER TABLE public.challenges 
  ALTER COLUMN expires_at DROP NOT NULL;

-- Update existing initiation challenges to have no expiry
UPDATE public.challenges 
SET expires_at = NULL 
WHERE type = 'initiation';

COMMENT ON COLUMN public.challenges.expires_at IS 
  'Expiry time for ladder challenges (24h). NULL for initiation challenges (no expiry).';
```

## Como executar

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o SQL acima
5. Clique em **Run** (ou pressione Ctrl+Enter)

## Verificação

Após executar, você pode verificar se funcionou com:

```sql
-- Ver a estrutura da coluna expires_at
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'challenges' 
  AND column_name = 'expires_at';
```

Deve mostrar `is_nullable = YES`

## O que isso resolve?

- ✅ Desafios de iniciação não expiram mais
- ✅ Jokers podem desafiar membros da iniciação
- ✅ O desafiado vê a notificação para aceitar
- ✅ Não há mais erro 400 ao criar desafios de iniciação
