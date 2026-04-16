# Bloqueio Automático de Piloto Derrotado na Iniciação

## ✅ Implementação Completa

Sistema que marca automaticamente um piloto da lista de iniciação como "bloqueado/vencido" quando é derrotado por um Joker.

---

## 🎯 Objetivo

Quando um **Joker vence** um membro da **Lista de Iniciação**, o piloto derrotado deve ser automaticamente:
1. Marcado como `initiationComplete: true`
2. Colocado em `status: 'cooldown'`
3. Receber um `cooldownUntil` (tempo de bloqueio)

---

## 🔧 Como Funciona

### 1. **Identificação do Perdedor**
```typescript
const winnerId = side === 'challenger' ? challenge.challengerId : challenge.challengedId;
const loserId = side === 'challenger' ? challenge.challengedId : challenge.challengerId;
const jokerWon = winnerId === challenge.challengerId;
```

### 2. **Verificação de Condições**
- ✅ Desafio é do tipo `'initiation'`
- ✅ Vencedor é o `challenger` (Joker)
- ✅ Perdedor é o `challenged` (Membro da Iniciação)

### 3. **Atualização no Banco de Dados**
```typescript
if (jokerWon) {
  // ... lógica de progresso do Joker ...

  // NOVO: Marcar o piloto derrotado
  supabase.from('players').update({
    status: 'cooldown',
    initiationComplete: true,
    cooldownUntil: Date.now() + CHALLENGE_COOLDOWN_MS,
  }).eq('id', loserId);
}
```

### 4. **Sincronização no Front-End**
```typescript
// Atualizar o estado local imediatamente
const updatedLists = prev.lists.map(list => {
  if (list.id === 'initiation') {
    return {
      ...list,
      players: list.players.map(p =>
        p.id === loserId
          ? {
              ...p,
              status: 'cooldown',
              initiationComplete: true,
              cooldownUntil: Date.now() + CHALLENGE_COOLDOWN_MS,
            }
          : p
      ),
    };
  }
  return list;
});

return { ...prev, challenges: newChallenges, jokerProgress: newJokerProgress, lists: updatedLists };
```

---

## 📊 Fluxo Completo

```
1. Joker desafia Membro da Iniciação
   └─> Desafio criado (type: 'initiation', status: 'pending')

2. Admin aprova o desafio
   └─> Status muda para 'racing'

3. Joker vence (addPoint com side: 'challenger')
   ├─> ✅ Progresso do Joker atualizado (X/5)
   ├─> ✅ Piloto derrotado marcado no banco:
   │   - status: 'cooldown'
   │   - initiationComplete: true
   │   - cooldownUntil: timestamp
   └─> ✅ Estado local atualizado instantaneamente

4. Interface reflete mudança imediatamente
   └─> Piloto aparece como "bloqueado" no painel admin
```

---

## 🔄 Campos Atualizados

### Tabela: `players`

| Campo | Antes | Depois |
|-------|-------|--------|
| `status` | `'available'` | `'cooldown'` |
| `initiationComplete` | `false` | `true` |
| `cooldownUntil` | `null` | `timestamp + cooldown` |

---

## 📝 Código Modificado

### Arquivo: `src/hooks/useChampionship.ts`

#### Função: `addPoint`

**Antes**:
```typescript
if (jokerWon) {
  // Apenas atualiza progresso do Joker
  const jokerNick = challenge.challengerName.toLowerCase();
  // ...
}
```

**Depois**:
```typescript
if (jokerWon) {
  // Atualiza progresso do Joker
  const jokerNick = challenge.challengerName.toLowerCase();
  // ...

  // NOVO: Marca piloto derrotado
  supabase.from('players').update({
    status: 'cooldown',
    initiationComplete: true,
    cooldownUntil: Date.now() + CHALLENGE_COOLDOWN_MS,
  }).eq('id', loserId);
}

// NOVO: Atualiza estado local
const updatedLists = prev.lists.map(list => {
  if (list.id === 'initiation') {
    return {
      ...list,
      players: list.players.map(p =>
        p.id === loserId ? { ...p, status: 'cooldown', initiationComplete: true, cooldownUntil: ... } : p
      ),
    };
  }
  return list;
});

return { ...prev, challenges: newChallenges, jokerProgress: newJokerProgress, lists: updatedLists };
```

---

## ✅ Benefícios

1. **Automático**: Não precisa marcar manualmente
2. **Instantâneo**: Interface atualiza imediatamente
3. **Sincronizado**: Banco de dados e front-end sempre consistentes
4. **Rastreável**: Campo `initiationComplete` indica quem foi derrotado
5. **Cooldown**: Piloto fica bloqueado por um período após derrota

---

## 🧪 Como Testar

1. **Criar desafio de iniciação**:
   - Joker desafia membro da iniciação
   - Admin aprova

2. **Joker vence**:
   - No painel admin, dar ponto para o Joker
   - Desafio finaliza automaticamente (MD1)

3. **Verificar resultado**:
   - ✅ Piloto derrotado aparece como "cooldown"
   - ✅ Campo `initiationComplete` = true
   - ✅ Não pode ser desafiado novamente até cooldown expirar
   - ✅ Progresso do Joker atualizado (X/5)

---

## 🔍 Observações

### Quando NÃO Bloqueia
- ❌ Se o **membro da iniciação vence** o Joker
  - Apenas o Joker recebe cooldown
  - Membro continua disponível

### Quando Bloqueia
- ✅ Se o **Joker vence** o membro da iniciação
  - Membro recebe cooldown
  - Membro marcado como `initiationComplete: true`
  - Progresso do Joker incrementado

---

## 📋 Checklist de Implementação

- ✅ Identificação do perdedor
- ✅ Verificação de tipo de desafio (`initiation`)
- ✅ Verificação de vencedor (Joker)
- ✅ Atualização no banco de dados (`players` table)
- ✅ Sincronização no estado local (React)
- ✅ Atualização instantânea da interface
- ✅ Sem erros de compilação

---

**Última atualização**: Sistema de bloqueio automático implementado e testado
