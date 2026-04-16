# ❌ Erro: Coluna `defenses_while_seventh_streak` não encontrada

## 🔴 Problema

Ao tentar remover um piloto da Lista 02 e adicionar outro no lugar, você recebeu este erro:

```
Could not find the 'defenses_while_seventh_streak' column of 'players' in the schema cache
```

**Causa**: A coluna `defenses_while_seventh_streak` está sendo usada no código TypeScript, mas não existe na tabela `players` do banco de dados Supabase.

---

## ✅ Solução

Execute este script no **Supabase → SQL Editor**:

```sql
-- Adicionar coluna defenses_while_seventh_streak se não existir
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS defenses_while_seventh_streak INT NOT NULL DEFAULT 0;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'players'
  AND column_name = 'defenses_while_seventh_streak';
```

---

## 📋 O que essa coluna faz?

A coluna `defenses_while_seventh_streak` rastreia quantas vezes consecutivas o **8º colocado da Lista 02** defendeu sua posição com sucesso.

### Regra:
- Se o 8º lugar defender **2 vezes seguidas** → Recebe **3 dias de proteção** contra desafios externos (Street Runners)
- Isso evita que o 8º lugar seja constantemente atacado

---

## 🔧 Após executar o script

1. ✅ A coluna será criada com valor padrão `0` para todos os pilotos
2. ✅ O erro desaparecerá
3. ✅ Você poderá adicionar/remover pilotos normalmente

---

## 📊 Verificar estrutura completa da tabela

Se quiser ver todas as colunas da tabela `players`, execute:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;
```

---

## 🎯 Colunas esperadas na tabela `players`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único do piloto |
| `name` | TEXT | Nome do piloto |
| `list_id` | TEXT | ID da lista (list-01, list-02, initiation, hidden) |
| `position` | INT | Posição na lista |
| `status` | TEXT | Status (available, racing, cooldown) |
| `defense_count` | INT | Número de defesas bem-sucedidas |
| `cooldown_until` | TIMESTAMPTZ | Data/hora do fim do cooldown |
| `challenge_cooldown_until` | TIMESTAMPTZ | Data/hora do fim do cooldown de desafio |
| `initiation_complete` | BOOLEAN | Se completou a lista de iniciação |
| `defenses_while_seventh_streak` | INT | ⚠️ **ESTA COLUNA ESTAVA FALTANDO** |
| `list02_external_block_until` | TIMESTAMPTZ | Proteção contra desafios externos |
| `list02_external_eligible_after` | TIMESTAMPTZ | Quando fica elegível para desafios externos |
| `created_at` | TIMESTAMPTZ | Data de criação do registro |

---

**Última atualização**: 16 de Abril de 2026  
**Arquivo SQL**: `ADICIONAR_COLUNA_DEFENSES_WHILE_SEVENTH_STREAK.sql`
