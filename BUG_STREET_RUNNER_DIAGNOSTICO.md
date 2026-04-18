# 🐛 BUG: Street Runner não consegue desafiar

## 📋 **SINTOMAS**

- **Usuário:** Pino (Street Runner)
- **Ação:** Tentou desafiar MNZ (último da Lista 02)
- **Resultado:**
  - ✅ Frontend mostra: "Desafio enviado com sucesso"
  - ❌ MNZ não recebe o desafio
  - ❌ Bot Discord não notifica
  - ❌ Console mostra erro:
    ```
    Failed to load resource: status 400 ()
    Failed to sync challenge insert: Object
    ```

---

## 🔍 **DIAGNÓSTICO**

### **Causa Raiz**
A migração `20260412200000_ladder_rules_challenges_players.sql` **não foi executada** no banco de dados de produção.

### **O que está acontecendo:**

1. **Frontend cria o desafio localmente** (por isso aparece "sucesso")
2. **Tenta salvar no Supabase** via `syncChallengeInsert()`
3. **Supabase rejeita com erro 400** porque:
   - Tenta inserir `synthetic_challenger_id` → **coluna não existe**
   - Tenta inserir `challenger_id: null` → **coluna ainda é NOT NULL**

### **Código afetado:**

**`src/lib/challengeSync.ts:33-48`**
```typescript
const { data, error } = await supabase.from('challenges').insert({
  list_id: challenge.listId,
  challenger_id,              // ❌ null (mas coluna é NOT NULL)
  synthetic_challenger_id,    // ❌ coluna não existe no banco
  challenged_id: challenge.challengedId,
  // ... resto dos campos
})
```

**`src/hooks/useChampionship.ts:452-530`**
```typescript
const tryStreetRunnerChallenge = useCallback(
  (streetRunnerName: string, tracks?: string[], isAdminOverride = false) => {
    // ... validações ...
    
    const challenge: Challenge = {
      id: '',
      listId: 'street-runner',  // 👈 Isso faz dbChallengerPayload() retornar challenger_id: null
      challengerId: syntheticId,
      // ...
    };
    
    syncChallengeInsert(challenge).then(result => {
      // ❌ Erro 400 aqui, mas é silenciosamente ignorado
    });
  }
);
```

---

## ✅ **SOLUÇÃO**

### **Passo 1: Executar a migração no Supabase**

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o arquivo: `CORRIGIR_DESAFIO_STREET_RUNNER.sql`

### **Passo 2: Verificar se funcionou**

Execute esta query no SQL Editor:

```sql
SELECT 
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'challenges' 
  AND column_name IN ('challenger_id', 'expires_at', 'synthetic_challenger_id')
ORDER BY column_name;
```

**Resultado esperado:**
```
challenger_id         | YES | uuid
expires_at            | YES | timestamp with time zone
synthetic_challenger_id | YES | text
```

### **Passo 3: Testar novamente**

1. Pino (Street Runner) tenta desafiar MNZ
2. ✅ Desafio deve ser salvo no banco
3. ✅ MNZ deve receber notificação
4. ✅ Bot Discord deve notificar

---

## 🔧 **MELHORIAS RECOMENDADAS**

### **1. Melhorar tratamento de erro**

**Problema atual:** O erro é silenciosamente ignorado

**`src/hooks/useChampionship.ts:520-530`**
```typescript
syncChallengeInsert(challenge).then(result => {
  if (result.id) {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => 
        c === challenge ? { ...c, id: result.id! } : c
      ),
    }));
  }
  // ❌ Não trata result.error!
});
```

**Solução:**
```typescript
syncChallengeInsert(challenge).then(result => {
  if (result.error) {
    // Remover o desafio do estado local
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.filter(c => c !== challenge),
    }));
    
    // Notificar o usuário
    toast({
      title: '❌ Erro ao enviar desafio',
      description: result.error,
      variant: 'destructive',
    });
    return;
  }
  
  if (result.id) {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => 
        c === challenge ? { ...c, id: result.id! } : c
      ),
    }));
  }
});
```

### **2. Adicionar callback de erro**

Seguir o mesmo padrão usado em `tryChallenge()`:

```typescript
const tryStreetRunnerChallenge = useCallback(
  (
    streetRunnerName: string, 
    tracks?: string[], 
    isAdminOverride = false,
    onDbError?: (error: string) => void  // 👈 Novo parâmetro
  ): string | null => {
    // ... código existente ...
    
    syncChallengeInsert(challenge).then(result => {
      if (result.error) {
        // Remover do estado
        setState(prev => ({
          ...prev,
          challenges: prev.challenges.filter(c => c !== challenge),
        }));
        
        // Chamar callback
        if (onDbError) {
          onDbError(result.error);
        }
        return;
      }
      
      // ... resto do código ...
    });
    
    return null;
  },
  [state.lists, state.challenges, isPlayerInActiveChallenge]
);
```

---

## 📊 **IMPACTO**

- **Afeta:** Todos os desafios de Street Runner → Lista 02
- **Afeta:** Todos os desafios de Joker → Lista de Iniciação
- **Severidade:** 🔴 **CRÍTICA** - Funcionalidade completamente quebrada
- **Workaround:** Nenhum (requer correção no banco)

---

## 📝 **HISTÓRICO**

- **Data:** 18/04/2026
- **Reportado por:** Usuário (Pino tentou desafiar MNZ)
- **Diagnosticado por:** Kiro AI
- **Status:** ⏳ Aguardando execução da migração
