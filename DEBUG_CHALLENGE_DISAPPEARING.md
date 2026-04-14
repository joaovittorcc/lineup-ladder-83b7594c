# 🔍 Debug: Desafio Sumindo

## O que mudou agora?

Mudei a estratégia: **o desafio NÃO é mais adicionado ao estado local imediatamente**. 

Agora funciona assim:
1. ✅ Cria o desafio no banco de dados
2. ✅ Aguarda confirmação do banco
3. ✅ Força um `fetchAll()` após 500ms
4. ✅ O realtime também vai detectar e atualizar

## Passos para testar:

### 1️⃣ PRIMEIRO: Execute o SQL no Supabase

**CRÍTICO**: Você PRECISA executar este SQL antes de testar:

```sql
ALTER TABLE public.challenges 
  ALTER COLUMN expires_at DROP NOT NULL;
```

### 2️⃣ Verifique se funcionou:

```sql
SELECT 
  column_name, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'challenges' 
  AND column_name = 'expires_at';
```

Deve retornar: `is_nullable = YES`

### 3️⃣ Teste o fluxo:

1. **Abra o console** (F12)
2. **Entre como Joker**
3. **Desafie alguém da iniciação**
4. **Observe os logs**:

```
🎯 Creating initiation challenge: {...}
💾 syncChallengeInsert result: {id: 'uuid'}
✅ Challenge inserted with ID: uuid
🔄 fetchAll() called - fetching from database...
📥 Fetched from DB - challenges: [...]
🔄 Mapping DB challenge: {id: 'uuid', type: 'initiation', status: 'pending', expires_at: null}
```

### 4️⃣ Entre como o desafiado:

1. **Faça login com a conta desafiada**
2. **Veja o console**:

```
📊 All challenges: [{id: 'uuid', type: 'initiation', ...}]
🎯 Pending initiation challenges: [{...}]
🔔 Initiation challenge notification: {...}
```

## ❌ Se o desafio ainda sumir:

### Cenário A: Erro no insert
```
❌ Failed to insert challenge: error message
```
**Solução**: O erro vai indicar o problema (provavelmente `expires_at` ainda é NOT NULL)

### Cenário B: Desafio não aparece no fetch
```
📥 Fetched from DB - challenges: []
```
**Solução**: O desafio não foi salvo. Verifique:
- Se executou o SQL do `expires_at`
- Se há erros de RLS (Row Level Security)

### Cenário C: Desafio aparece mas com status errado
```
🔄 Mapping DB challenge: {status: 'cancelled'}
```
**Solução**: Algo está mudando o status do desafio

### Cenário D: Desafio não aparece em "Pending initiation challenges"
```
📊 All challenges: [{type: 'ladder'}]  // ❌ deveria ser 'initiation'
```
**Solução**: O `type` está errado no banco

## 🔧 Query útil para debug:

Execute no SQL Editor para ver todos os desafios de iniciação:

```sql
SELECT 
  id,
  challenger_name,
  challenged_name,
  status,
  type,
  expires_at,
  created_at
FROM public.challenges
WHERE type = 'initiation'
ORDER BY created_at DESC
LIMIT 10;
```

## ⚠️ IMPORTANTE:

Se você NÃO executou o SQL do `expires_at`, o insert vai **FALHAR** porque a coluna é `NOT NULL` e você não está enviando valor.

**Execute o SQL AGORA antes de testar!**
