# 🔧 CORREÇÃO: Desafio Street Runner

## ✅ O QUE FOI FEITO

### 1. **Código Corrigido** ✅
- `src/hooks/useChampionship.ts`
  - ✅ `tryStreetRunnerChallenge()` - Agora trata erro do banco
  - ✅ `tryDesafioVaga()` - Agora trata erro do banco
  - ✅ `challengeInitiationPlayer()` - Já tinha tratamento

**Antes:**
```typescript
syncChallengeInsert(challenge).then(result => {
  if (result.id) {
    // atualiza estado
  }
  // ❌ Não tratava result.error
});
```

**Depois:**
```typescript
syncChallengeInsert(challenge).then(result => {
  if (result.error) {
    // Remove do estado local
    // Loga o erro no console
    return;
  }
  if (result.id) {
    // atualiza estado
  }
});
```

---

## 🎯 O QUE VOCÊ PRECISA FAZER

### **PASSO 1: Executar SQL no Supabase**

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**
4. Cole o conteúdo do arquivo: **`EXECUTAR_NO_SUPABASE.sql`**
5. Clique em **Run** (ou pressione Ctrl+Enter)

### **PASSO 2: Verificar se funcionou**

Após executar, você verá uma tabela com 3 linhas:

```
column_name              | is_nullable | data_type
-------------------------+-------------+---------------------------
challenger_id            | YES         | uuid
expires_at               | YES         | timestamp with time zone
synthetic_challenger_id  | YES         | text
```

✅ Se aparecer assim, está correto!

### **PASSO 3: Testar**

1. Pino (Street Runner) tenta desafiar MNZ
2. ✅ Desafio deve ser salvo
3. ✅ MNZ deve receber notificação
4. ✅ Bot Discord deve notificar

---

## 📋 SQL PARA COPIAR

```sql
-- 1. Remover constraint de foreign key
ALTER TABLE public.challenges 
DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;

-- 2. Tornar challenger_id NULLABLE
ALTER TABLE public.challenges 
ALTER COLUMN challenger_id DROP NOT NULL;

-- 3. Adicionar coluna synthetic_challenger_id
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS synthetic_challenger_id TEXT;

-- 4. Tornar expires_at NULLABLE
ALTER TABLE public.challenges 
ALTER COLUMN expires_at DROP NOT NULL;

-- 5. Limpar desafios de iniciação com expiração
UPDATE public.challenges 
SET expires_at = NULL 
WHERE type = 'initiation' AND expires_at IS NOT NULL;

-- VERIFICAÇÃO
SELECT 
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'challenges' 
  AND column_name IN ('challenger_id', 'expires_at', 'synthetic_challenger_id')
ORDER BY column_name;
```

---

## 🐛 O QUE ESTAVA ACONTECENDO

1. **Pino tenta desafiar MNZ**
2. Frontend cria desafio localmente → "Desafio enviado com sucesso" ✅
3. Tenta salvar no Supabase
4. **Supabase rejeita (erro 400)** porque:
   - Coluna `synthetic_challenger_id` não existe ❌
   - Coluna `challenger_id` é NOT NULL mas recebe null ❌
5. Erro era silenciosamente ignorado
6. MNZ não recebe desafio ❌
7. Discord não notifica ❌

---

## ✅ DEPOIS DA CORREÇÃO

1. **Pino tenta desafiar MNZ**
2. Frontend cria desafio localmente
3. Tenta salvar no Supabase
4. **Supabase aceita** ✅
5. Desafio é salvo com `synthetic_challenger_id` ✅
6. MNZ recebe notificação ✅
7. Discord notifica ✅

---

## 📞 SUPORTE

Se der algum erro ao executar o SQL, me avise e eu ajudo!
