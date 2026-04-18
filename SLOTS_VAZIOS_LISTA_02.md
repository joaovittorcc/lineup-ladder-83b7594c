# 🎯 SLOTS VAZIOS NA LISTA 02

## ❓ PROBLEMA

Não estão aparecendo os 3 slots vazios na Lista 02.

---

## 🔍 DIAGNÓSTICO

### **Como funciona:**

Os slots vazios **só aparecem para ADMINS**. Isso é por design, pois são usados para alocar pilotos manualmente.

**Código em `PlayerList.tsx:369`:**
```typescript
const showEmptySlots = Boolean(isAdmin && onEmptySlotClick && capacity > 0);
```

### **Condições para mostrar slots:**

1. ✅ **Usuário logado é ADMIN** (`isAdmin === true`)
2. ✅ **Função de callback existe** (`onEmptySlotClick` definida)
3. ✅ **Lista tem capacidade** (Lista 02 = 10 pilotos)
4. ✅ **Há vagas disponíveis** (`emptyCount > 0`)

---

## ✅ SOLUÇÃO

### **Opção 1: Verificar se você está logado como ADMIN**

1. Verifique se você está logado com um usuário que tem `isAdmin: true`
2. Veja em `src/data/users.ts` quais usuários são admins

### **Opção 2: Verificar quantos pilotos tem na Lista 02**

Execute este SQL no Supabase:

```sql
-- Ver quantos pilotos estão na Lista 02
SELECT 
  COUNT(*) as total_pilotos,
  10 as capacidade_maxima,
  (10 - COUNT(*)) as slots_vazios_esperados
FROM public.players
WHERE list_id = 'list-02';

-- Ver todos os pilotos
SELECT 
  position,
  name,
  status
FROM public.players
WHERE list_id = 'list-02'
ORDER BY position;
```

### **Opção 3: Forçar exibição dos slots (temporário para debug)**

Se você quiser ver os slots mesmo sem ser admin (apenas para debug), pode modificar temporariamente:

**`src/components/PlayerList.tsx:369`**
```typescript
// ANTES (só admin vê)
const showEmptySlots = Boolean(isAdmin && onEmptySlotClick && capacity > 0);

// DEPOIS (todos veem - APENAS PARA DEBUG!)
const showEmptySlots = Boolean(capacity > 0 && capacity > players.length);
```

⚠️ **ATENÇÃO:** Isso é apenas para debug! Não deixe assim em produção, pois os slots são clicáveis apenas por admins.

---

## 🎯 RESULTADO ESPERADO

Se você estiver logado como **ADMIN** e houver **7 pilotos na Lista 02**, você deve ver:

```
┌─────────────────────────────────┐
│ LISTA 02                        │
│ 7 / 10 pilotos                  │
├─────────────────────────────────┤
│ 1º Piloto A                     │
│ 2º Piloto B                     │
│ 3º Piloto C                     │
│ 4º Piloto D                     │
│ 5º Piloto E                     │
│ 6º Piloto F                     │
│ 7º Piloto G                     │
├─────────────────────────────────┤
│ ➕ Vaga livre - clique para     │  ← Slot 8 (clicável)
│    alocar piloto                │
├─────────────────────────────────┤
│ ➕ Vaga - preenche a posição    │  ← Slot 9 (bloqueado)
│    anterior primeiro            │
├─────────────────────────────────┤
│ ➕ Vaga - preenche a posição    │  ← Slot 10 (bloqueado)
│    anterior primeiro            │
└─────────────────────────────────┘
```

**Regra:** Só o **próximo slot vazio** (8º) é clicável. Os outros (9º e 10º) ficam bloqueados até que o 8º seja preenchido.

---

## 🔧 VERIFICAÇÕES

### **1. Verificar se você é admin:**

Abra o console do navegador (F12) e digite:
```javascript
localStorage.getItem('mc-pilot-auth')
```

Deve retornar algo como:
```json
{"displayName":"SeuNome","isAdmin":true,"isJoker":false,"role":"..."}
```

Se `isAdmin` for `false`, você não verá os slots.

### **2. Verificar quantos pilotos tem na Lista 02:**

Execute o SQL em `DIAGNOSTICO_LISTA_02.sql` no Supabase SQL Editor.

### **3. Verificar se a capacidade está correta:**

Veja em `src/constants/listCapacities.ts`:
```typescript
export const LIST_CAPACITIES: Record<string, number> = {
  initiation: 5,
  'list-01': 5,
  'list-02': 10,  // ✅ Lista 02 tem capacidade para 10 pilotos
};
```

---

## 📊 RESUMO

| Condição | Status | Ação |
|----------|--------|------|
| Capacidade Lista 02 | ✅ 10 pilotos | OK |
| Código renderização | ✅ Correto | OK |
| Usuário é admin? | ❓ Verificar | Veja localStorage |
| Pilotos na lista? | ❓ Verificar | Execute SQL |

---

## 🚀 PRÓXIMOS PASSOS

1. **Verifique se você está logado como admin**
2. **Execute o SQL** em `DIAGNOSTICO_LISTA_02.sql`
3. **Me diga:**
   - Você está logado como admin? (sim/não)
   - Quantos pilotos aparecem na Lista 02?
   - O que o SQL retornou?

Com essas informações, posso te ajudar melhor! 🎯
