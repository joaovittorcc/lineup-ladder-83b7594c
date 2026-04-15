# 🚀 REFERÊNCIA RÁPIDA: MD1 vs MD3

**Guia rápido para entender as diferenças entre os dois modos**

---

## 📋 TABELA COMPARATIVA

| Característica | MD1 (Iniciação) | MD3 (Ladder) |
|----------------|-----------------|--------------|
| **Prop `challengeType`** | `"initiation"` | `"ladder"` ou omitido |
| **Número de pistas** | 1 | 3 |
| **Lógica de papéis** | ❌ Não | ✅ Sim |
| **Slot 0 (Pista 1)** | ✅ Sempre editável | 🔀 Bloqueado para desafiado |
| **Slot 1 (Pista 2)** | ❌ Não existe | 🔀 Bloqueado para desafiante |
| **Slot 2 (Pista 3)** | ❌ Não existe | 🔀 Bloqueado para desafiante |
| **Título modal** | "Desafio de Iniciação" | "Configuração MD3" |
| **Label Slot 0** | "Pista de Iniciação" | "Pista 1 (Desafiante)" |
| **Progresso** | "0/1" → "1/1" | "0/3" → "1/3" → "2/3" → "3/3" |
| **Validação** | 1 pista preenchida | 3 pistas (por papel) |
| **Payload desafiante** | `["pista1"]` | `["pista1", "", ""]` |
| **Payload desafiado** | `["pista1"]` | `["pista1", "pista2", "pista3"]` |
| **Expira?** | ❌ Não (`expires_at = NULL`) | ✅ Sim (24h) |

---

## 🎯 MD1 (INICIAÇÃO) - RESUMO

### **Quando usar:**
- Desafios de iniciação (Joker vs Piloto da Lista de Iniciação)

### **Configuração:**
```typescript
<RaceConfigModal
  challengeType="initiation"  // ← OBRIGATÓRIO
  trackCount={1}
  submitLabel="Aceitar Iniciação"
  onConfirm={(tracks) => {
    // tracks = ["pista1"]
  }}
/>
```

### **Comportamento:**
- ✅ Apenas 1 slot visível
- ✅ Slot 0 sempre editável (sem bloqueio)
- ✅ Sem lógica de papéis
- ✅ Validação: apenas `pista1`
- ✅ Payload: `["pista1"]` (1 elemento)

### **UI:**
```
┌─────────────────────────────────┐
│   DESAFIO DE INICIAÇÃO          │
├─────────────────────────────────┤
│  ┌────┐  Pista de Iniciação     │
│  │ 1  │  [Select editável]      │
│  └────┘                         │
│                                 │
│  Progresso: ████░░░░░░ 1/1      │
│                                 │
│  [Cancelar] [Aceitar Iniciação] │
└─────────────────────────────────┘
```

---

## 🏁 MD3 (LADDER) - RESUMO

### **Quando usar:**
- Desafios de ladder (Piloto vs Piloto na lista)

### **Configuração:**
```typescript
<RaceConfigModal
  // challengeType omitido → usa padrão 'ladder'
  trackCount={2}
  matchCount={3}
  submitLabel="Aceitar Desafio"
  initialTracks={acceptLadderInitialTrack}
  onConfirm={(tracks) => {
    // Desafiante: tracks = ["pista1", "", ""]
    // Desafiado: tracks = ["pista1", "pista2", "pista3"]
  }}
/>
```

### **Comportamento (Desafiante):**
- ✅ 3 slots visíveis
- ✅ Slot 0 editável
- 🔒 Slots 1-2 bloqueados
- ✅ Validação: apenas `pista1`
- ✅ Payload: `["pista1", "", ""]` (3 elementos, 2 vazios)

### **Comportamento (Desafiado):**
- ✅ 3 slots visíveis
- 🔒 Slot 0 bloqueado (mostra pista do desafiante)
- ✅ Slots 1-2 editáveis
- ✅ Validação: `pista2` e `pista3`
- ✅ Payload: `["pista1", "pista2", "pista3"]` (3 elementos preenchidos)
- ✅ **Pista 1 preservada**

### **UI (Desafiante):**
```
┌─────────────────────────────────┐
│   CONFIGURAÇÃO MD3              │
├─────────────────────────────────┤
│  ┌────┐  Pista 1 (Desafiante)   │
│  │ 1  │  [Select editável]      │
│  └────┘                         │
│  ┌────┐  Pista 2 (Desafiado)    │
│  │ 🔒 │  [Bloqueado]            │
│  └────┘                         │
│  ┌────┐  Pista 3 (Desafiado)    │
│  │ 🔒 │  [Bloqueado]            │
│  └────┘                         │
│  Progresso: ████░░░░░░ 1/3      │
│                                 │
│  [Cancelar] [Confirmar Desafio] │
└─────────────────────────────────┘
```

### **UI (Desafiado):**
```
┌─────────────────────────────────┐
│   CONFIGURAÇÃO MD3              │
├─────────────────────────────────┤
│  ┌────┐  Pista 1 (Desafiante)   │
│  │ 🔒 │  [Pista do desafiante]  │
│  └────┘                         │
│  ┌────┐  Pista 2 (Desafiado)    │
│  │ 2  │  [Select editável]      │
│  └────┘                         │
│  ┌────┐  Pista 3 (Desafiado)    │
│  │ 3  │  [Select editável]      │
│  └────┘                         │
│  Progresso: ████████░░ 2/3      │
│                                 │
│  [Cancelar] [Aceitar Desafio]   │
└─────────────────────────────────┘
```

---

## 🔧 CÓDIGO: LÓGICA DE BLOQUEIO

```typescript
// Detecção de modo
const isInitiation = challengeType === 'initiation';

// Lógica de bloqueio condicional
const slot0Disabled = isInitiation ? false : isChallenged;
//                    ↑ MD1: sempre editável
//                                    ↑ MD3: bloqueado para desafiado

const slot1Disabled = isChallenger; // MD3: bloqueado para desafiante
const slot2Disabled = isChallenger; // MD3: bloqueado para desafiante
```

---

## 🔧 CÓDIGO: VALIDAÇÃO

```typescript
const canSubmit = useMemo(() => {
  const pista1 = currentTracks[0] || selectedTracks[0] || '';
  const pista2 = selectedTracks[1] || '';
  const pista3 = selectedTracks[2] || '';

  // MD1: Apenas 1 pista
  if (isInitiation) {
    return !!(pista1 && pista1.trim());
  }

  // MD3: Por papel
  if (isChallenger) {
    return !!(pista1 && pista1.trim());
  }
  
  if (isChallenged) {
    return !!(pista2 && pista2.trim() && pista3 && pista3.trim());
  }
  
  // Admin: todas as 3
  return !!(pista1 && pista1.trim() && pista2 && pista2.trim() && pista3 && pista3.trim());
}, [selectedTracks, currentTracks, isChallenger, isChallenged, isInitiation]);
```

---

## 🔧 CÓDIGO: RENDERIZAÇÃO

```typescript
{/* Slot 0 - Sempre visível */}
<label>
  {isInitiation ? 'Pista de Iniciação' : 'Pista 1 (Desafiante)'}
</label>

{/* Slots 1 e 2 - Apenas MD3 */}
{!isInitiation && (
  <div>
    <label>Pista 2 (Desafiado)</label>
    <select disabled={slot1Disabled}>...</select>
  </div>
)}

{!isInitiation && (
  <div>
    <label>Pista 3 (Desafiado)</label>
    <select disabled={slot2Disabled}>...</select>
  </div>
)}
```

---

## 🔧 CÓDIGO: SUBMISSÃO

```typescript
const handleConfirm = async () => {
  // MD1: Envia apenas 1 pista
  if (isInitiation) {
    const pista1 = currentTracks[0] || selectedTracks[0] || '';
    await onConfirm([pista1]);
    return;
  }

  // MD3 Desafiante: Envia 1 pista + 2 vazias
  if (isChallenger) {
    const pista1 = currentTracks[0] || selectedTracks[0] || '';
    await onConfirm([pista1, '', '']);
    return;
  }
  
  // MD3 Desafiado: Envia 3 pistas (preserva pista 1)
  if (isChallenged) {
    const pista1 = currentTracks[0] || selectedTracks[0] || '';
    const pista2 = selectedTracks[1] || '';
    const pista3 = selectedTracks[2] || '';
    await onConfirm([pista1, pista2, pista3]);
    return;
  }
};
```

---

## 🧪 TESTE RÁPIDO

### **MD1:**
1. Login como Joker
2. Desafie piloto da iniciação
3. Login como piloto desafiado
4. Clique em "Escolher Pista"
5. **VERIFICAR:** Apenas 1 slot, editável, sem bloqueio

### **MD3:**
1. Login como Piloto A
2. Desafie piloto acima
3. **VERIFICAR:** 3 slots, slot 0 editável, slots 1-2 bloqueados
4. Login como Piloto B
5. Clique em "Aceitar Desafio"
6. **VERIFICAR:** 3 slots, slot 0 bloqueado, slots 1-2 editáveis

---

## ⚠️ IMPORTANTE

### **SQL Pendente:**
```sql
-- Executar no Supabase SQL Editor
ALTER TABLE challenges ALTER COLUMN challenger_id DROP NOT NULL;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS synthetic_challenger_id UUID;
ALTER TABLE challenges ALTER COLUMN expires_at DROP NOT NULL;
```

### **Sem este SQL:**
- ❌ Desafios de iniciação podem falhar
- ❌ Jokers externos podem não conseguir desafiar

---

## 📚 DOCUMENTAÇÃO COMPLETA

1. **`CORRECAO_BLOQUEIO_MD1_MD3.md`** - Documentação técnica
2. **`STATUS_ATUAL_MD1_MD3.md`** - Status atual completo
3. **`FLUXO_MD1_MD3_VISUAL.md`** - Diagramas visuais
4. **`CHECKLIST_TESTES_MD1_MD3.md`** - Checklist de testes
5. **`RESUMO_FINAL_IMPLEMENTACAO.md`** - Resumo executivo
6. **`REFERENCIA_RAPIDA_MD1_MD3.md`** - Este arquivo

---

## 🎯 REGRA DE OURO

```
challengeType="initiation" → MD1 (1 pista, sem papéis)
challengeType omitido      → MD3 (3 pistas, com papéis)
```

**Simples assim!** ✅

---

**Use esta referência para consultas rápidas!** 🚀
