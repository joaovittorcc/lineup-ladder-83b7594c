# 🎨 FLUXO VISUAL: MD1 vs MD3

## 🔀 DECISÃO DE MODO

```
┌─────────────────────────────────────────────────────────────┐
│                    RaceConfigModal Abre                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Verifica challengeType
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                           │
   "initiation"                                "ladder"
   (ou omitido)                              (padrão)
        │                                           │
        ↓                                           ↓
┌───────────────────┐                   ┌───────────────────┐
│   MD1 (Iniciação) │                   │   MD3 (Ladder)    │
│   isInitiation =  │                   │   isInitiation =  │
│       true        │                   │       false       │
└───────────────────┘                   └───────────────────┘
```

---

## 🎯 MD1 (INICIAÇÃO) - FLUXO COMPLETO

### **1. Configuração do Modal**

```typescript
<RaceConfigModal
  challengeType="initiation"  // ← EXPLÍCITO
  trackCount={1}
  submitLabel="Aceitar Iniciação"
  descriptionText="Escolha a pista de iniciação..."
/>
```

### **2. Detecção Interna**

```typescript
const isInitiation = challengeType === 'initiation'; // true
const requiredTracksCount = isInitiation ? 1 : 3;    // 1
```

### **3. Lógica de Bloqueio**

```typescript
const slot0Disabled = isInitiation ? false : isChallenged;
// slot0Disabled = false (SEMPRE EDITÁVEL)

const slot1Disabled = isChallenger; // Não usado (slot não existe)
const slot2Disabled = isChallenger; // Não usado (slot não existe)
```

### **4. Renderização de Slots**

```
┌─────────────────────────────────────────────────────────────┐
│                    DESAFIO DE INICIAÇÃO                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────┐  Pista de Iniciação                                 │
│  │ 1  │  ┌──────────────────────────────────────────────┐  │
│  └────┘  │ Selecionar pista...                    ▼    │  │
│          └──────────────────────────────────────────────┘  │
│                                                              │
│  [Slots 2 e 3 não aparecem]                                 │
│                                                              │
│  Progresso: ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 1/1       │
│                                                              │
│                          [✕ Cancelar] [⚔ Aceitar Iniciação] │
└─────────────────────────────────────────────────────────────┘
```

### **5. Validação**

```typescript
if (isInitiation) {
  return !!(pista1 && pista1.trim()); // Apenas pista 1
}
// Ignora lógica de papéis (isChallenger, isChallenged)
```

### **6. Submissão**

```typescript
if (isInitiation) {
  const pista1 = currentTracks[0] || selectedTracks[0] || '';
  await onConfirm([pista1]); // Array com 1 elemento
  return;
}
```

**Payload:** `["Pista Escolhida"]`

---

## 🏁 MD3 (LADDER) - FLUXO COMPLETO

### **1. Configuração do Modal**

```typescript
<RaceConfigModal
  // challengeType omitido → usa padrão 'ladder'
  trackCount={2}
  matchCount={3}
  submitLabel="Aceitar Desafio"
  descriptionText="Escolha as 2 pistas restantes..."
  initialTracks={acceptLadderInitialTrack}
/>
```

### **2. Detecção Interna**

```typescript
const isInitiation = challengeType === 'initiation'; // false
const requiredTracksCount = isInitiation ? 1 : 3;    // 3
```

### **3. Lógica de Bloqueio (DESAFIADO)**

```typescript
const isChallenger = false; // Usuário é desafiado
const isChallenged = true;

const slot0Disabled = isInitiation ? false : isChallenged;
// slot0Disabled = true (BLOQUEADO)

const slot1Disabled = isChallenger; // false (EDITÁVEL)
const slot2Disabled = isChallenger; // false (EDITÁVEL)
```

### **4. Renderização de Slots (DESAFIADO)**

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURAÇÃO MD3                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────┐  Pista 1 (Desafiante) (Bloqueada)                   │
│  │ 🔒 │  ┌──────────────────────────────────────────────┐  │
│  └────┘  │ Pista do Desafiante            🔒           │  │
│          └──────────────────────────────────────────────┘  │
│                                                              │
│  ┌────┐  Pista 2 (Desafiado)                                │
│  │ 2  │  ┌──────────────────────────────────────────────┐  │
│  └────┘  │ Selecionar pista...                    ▼    │  │
│          └──────────────────────────────────────────────┘  │
│                                                              │
│  ┌────┐  Pista 3 (Desafiado)                                │
│  │ 3  │  ┌──────────────────────────────────────────────┐  │
│  └────┘  │ Selecionar pista...                    ▼    │  │
│          └──────────────────────────────────────────────┘  │
│                                                              │
│  Progresso: ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 1/3      │
│                                                              │
│                          [✕ Cancelar] [⚔ Aceitar Desafio]   │
└─────────────────────────────────────────────────────────────┘
```

### **5. Lógica de Bloqueio (DESAFIANTE)**

```typescript
const isChallenger = true;  // Usuário é desafiante
const isChallenged = false;

const slot0Disabled = isInitiation ? false : isChallenged;
// slot0Disabled = false (EDITÁVEL)

const slot1Disabled = isChallenger; // true (BLOQUEADO)
const slot2Disabled = isChallenger; // true (BLOQUEADO)
```

### **6. Renderização de Slots (DESAFIANTE)**

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURAÇÃO MD3                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────┐  Pista 1 (Desafiante)                               │
│  │ 1  │  ┌──────────────────────────────────────────────┐  │
│  └────┘  │ Selecionar pista...                    ▼    │  │
│          └──────────────────────────────────────────────┘  │
│                                                              │
│  ┌────┐  Pista 2 (Desafiado) (Bloqueada)                    │
│  │ 🔒 │  ┌──────────────────────────────────────────────┐  │
│  └────┘  │ Aguardando desafiado...        🔒           │  │
│          └──────────────────────────────────────────────┘  │
│                                                              │
│  ┌────┐  Pista 3 (Desafiado) (Bloqueada)                    │
│  │ 🔒 │  ┌──────────────────────────────────────────────┐  │
│  └────┘  │ Aguardando desafiado...        🔒           │  │
│          └──────────────────────────────────────────────┘  │
│                                                              │
│  Progresso: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0/3    │
│                                                              │
│                          [✕ Cancelar] [⚔ Confirmar Desafio] │
└─────────────────────────────────────────────────────────────┘
```

### **7. Validação (DESAFIADO)**

```typescript
if (isChallenged) {
  return !!(pista2 && pista2.trim() && pista3 && pista3.trim());
  // Valida apenas pistas 2 e 3
}
```

### **8. Validação (DESAFIANTE)**

```typescript
if (isChallenger) {
  return !!(pista1 && pista1.trim());
  // Valida apenas pista 1
}
```

### **9. Submissão (DESAFIANTE)**

```typescript
if (isChallenger) {
  const pista1 = currentTracks[0] || selectedTracks[0] || '';
  await onConfirm([pista1, '', '']); // Array com 3 elementos (2 vazios)
  return;
}
```

**Payload:** `["Pista 1", "", ""]`

### **10. Submissão (DESAFIADO)**

```typescript
if (isChallenged) {
  const pista1 = currentTracks[0] || selectedTracks[0] || ''; // Preserva pista 1
  const pista2 = selectedTracks[1] || '';
  const pista3 = selectedTracks[2] || '';
  
  await onConfirm([pista1, pista2, pista3]); // Array completo
  return;
}
```

**Payload:** `["Pista 1 (preservada)", "Pista 2", "Pista 3"]`

---

## 🔄 COMPARAÇÃO LADO A LADO

```
┌─────────────────────────────────┬─────────────────────────────────┐
│       MD1 (INICIAÇÃO)           │       MD3 (LADDER)              │
├─────────────────────────────────┼─────────────────────────────────┤
│                                 │                                 │
│  challengeType="initiation"     │  challengeType omitido          │
│  isInitiation = true            │  isInitiation = false           │
│  requiredTracksCount = 1        │  requiredTracksCount = 3        │
│                                 │                                 │
│  ┌────┐ Pista de Iniciação      │  ┌────┐ Pista 1 (Desafiante)   │
│  │ 1  │ [Sempre editável]       │  │1/🔒│ [Bloqueio por papel]    │
│  └────┘                         │  └────┘                         │
│                                 │                                 │
│  [Slot 2 não existe]            │  ┌────┐ Pista 2 (Desafiado)    │
│                                 │  │2/🔒│ [Bloqueio por papel]    │
│                                 │  └────┘                         │
│                                 │                                 │
│  [Slot 3 não existe]            │  ┌────┐ Pista 3 (Desafiado)    │
│                                 │  │3/🔒│ [Bloqueio por papel]    │
│                                 │  └────┘                         │
│                                 │                                 │
│  Validação: 1 pista             │  Validação: 3 pistas (papel)    │
│  Sem lógica de papéis           │  Com lógica de papéis           │
│                                 │                                 │
│  Payload: ["pista1"]            │  Desafiante: ["p1", "", ""]     │
│                                 │  Desafiado: ["p1", "p2", "p3"]  │
│                                 │                                 │
└─────────────────────────────────┴─────────────────────────────────┘
```

---

## 🎯 FLUXO DE DECISÃO: BLOQUEIO DE SLOTS

```
Modal renderiza Slot 0
        ↓
Verifica isInitiation
        ↓
    ┌───┴───┐
    │       │
  true    false
    │       │
    ↓       ↓
slot0Disabled = false    slot0Disabled = isChallenged
    │                            │
    ↓                            ↓
Sempre editável          Bloqueado se desafiado
                         Editável se desafiante
```

```
Modal renderiza Slots 1 e 2
        ↓
Verifica isInitiation
        ↓
    ┌───┴───┐
    │       │
  true    false
    │       │
    ↓       ↓
Não renderiza    Renderiza com bloqueio
    │                    │
    ↓                    ↓
{!isInitiation && ...}   slot1Disabled = isChallenger
                         slot2Disabled = isChallenger
                                │
                                ↓
                         Bloqueado se desafiante
                         Editável se desafiado
```

---

## 🎯 FLUXO DE DECISÃO: VALIDAÇÃO

```
canSubmit verifica
        ↓
Verifica isInitiation
        ↓
    ┌───┴───┐
    │       │
  true    false
    │       │
    ↓       ↓
Valida:     Valida por papel:
pista1 != ''    ↓
            ┌───┴───┐
            │       │
        isChallenger  isChallenged
            │           │
            ↓           ↓
        pista1 != ''    pista2 != '' && pista3 != ''
```

---

## 🎯 FLUXO DE DECISÃO: SUBMISSÃO

```
handleConfirm executado
        ↓
Verifica isInitiation
        ↓
    ┌───┴───┐
    │       │
  true    false
    │       │
    ↓       ↓
onConfirm([pista1])    Verifica papel
    │                      ↓
    ↓                  ┌───┴───┐
Payload: 1 elemento    │       │
                   isChallenger  isChallenged
                       │           │
                       ↓           ↓
              onConfirm([p1,'',''])  onConfirm([p1,p2,p3])
                       │                    │
                       ↓                    ↓
              Payload: 3 elementos   Payload: 3 elementos
              (2 vazios)             (todos preenchidos)
```

---

## 📊 TABELA DE ESTADOS

### **MD1 (Iniciação):**

| Estado | Slot 0 | Slot 1 | Slot 2 | Validação | Payload |
|--------|--------|--------|--------|-----------|---------|
| **Inicial** | ✏️ Editável | ❌ Não existe | ❌ Não existe | ❌ Inválido | - |
| **1 pista selecionada** | ✅ Preenchido | ❌ Não existe | ❌ Não existe | ✅ Válido | `["p1"]` |

### **MD3 (Ladder) - Desafiante:**

| Estado | Slot 0 | Slot 1 | Slot 2 | Validação | Payload |
|--------|--------|--------|--------|-----------|---------|
| **Inicial** | ✏️ Editável | 🔒 Bloqueado | 🔒 Bloqueado | ❌ Inválido | - |
| **1 pista selecionada** | ✅ Preenchido | 🔒 Bloqueado | 🔒 Bloqueado | ✅ Válido | `["p1","",""]` |

### **MD3 (Ladder) - Desafiado:**

| Estado | Slot 0 | Slot 1 | Slot 2 | Validação | Payload |
|--------|--------|--------|--------|-----------|---------|
| **Inicial** | 🔒 Bloqueado (p1) | ✏️ Editável | ✏️ Editável | ❌ Inválido | - |
| **1 pista selecionada** | 🔒 Bloqueado (p1) | ✅ Preenchido | ✏️ Editável | ❌ Inválido | - |
| **2 pistas selecionadas** | 🔒 Bloqueado (p1) | ✅ Preenchido | ✅ Preenchido | ✅ Válido | `["p1","p2","p3"]` |

---

## 🎨 LEGENDA

- ✏️ **Editável:** Select habilitado, usuário pode escolher
- 🔒 **Bloqueado:** Select desabilitado ou div com cadeado
- ✅ **Preenchido:** Pista selecionada
- ❌ **Não existe:** Slot não renderizado
- ✅ **Válido:** Botão de submissão habilitado
- ❌ **Inválido:** Botão de submissão desabilitado

---

## 🚀 RESUMO VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA MD1/MD3                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  challengeType="initiation"  →  MD1 (1 pista, sem papéis)   │
│  challengeType omitido       →  MD3 (3 pistas, com papéis)  │
│                                                              │
│  MD1: Slot 0 sempre editável, slots 1-2 não existem         │
│  MD3: Bloqueio por papel (desafiante/desafiado)             │
│                                                              │
│  Validação condicional ao tipo                              │
│  Renderização condicional ao tipo                           │
│  Submissão condicional ao tipo                              │
│                                                              │
│  ✅ Sem "vazamento" de lógica entre tipos                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Use este diagrama para entender o fluxo completo!** 🎉
