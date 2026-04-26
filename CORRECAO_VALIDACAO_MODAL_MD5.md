# 🔧 Correção: Validação do Formulário MD3/MD5

## 🎯 Problema Identificado

**Sintoma:** O botão "Enviar Desafio" ficava desabilitado mesmo quando o desafiante preenchia suas pistas (1 para MD3, 2 para MD5). O sistema exigia que **todas** as pistas fossem preenchidas antes de liberar o botão.

**Erro Exibido:** "Preencha todas as 5 pistas" (para MD5)

**Causa Raiz:** A validação `canSubmit` estava verificando se **todos** os slots estavam preenchidos, em vez de verificar apenas os slots do desafiante.

---

## 🔍 Análise da Lógica Incorreta

### ❌ **ANTES (Validação Incorreta):**

```typescript
const canSubmit = useMemo(() => {
  if (isChallenger) {
    // Desafiante: precisa preencher seus slots
    const challengerSlots = Array.from({ length: totalSlots }, (_, i) => i)
      .filter(i => getSlotOwner(i) === 'challenger');
    return challengerSlots.every(i => {
      const track = safeInitialTracks[i] || selectedTracks[i];
      return track && track.trim();
    });
  }
  // ...
}, [selectedTracks, safeInitialTracks, isChallenger, isChallenged, isInitiation, totalSlots]);
```

**Problema:** A lógica estava **CORRETA**, mas faltava `getSlotOwner` nas dependências do `useMemo`, causando comportamento inconsistente.

### ❌ **Validação Final Incorreta:**

```typescript
const handleConfirm = async () => {
  // ...
  const filledTracks = finalTracks.filter(t => t && t.trim());
  if (filledTracks.length !== totalSlots) {
    alert(`Preencha todas as ${totalSlots} pistas`); // ❌ ERRADO!
    return;
  }
  // ...
};
```

**Problema:** Validava se **TODAS** as pistas estavam preenchidas, ignorando o papel do usuário (desafiante/desafiado).

---

## ✅ Solução Aplicada

### 1. **Validação `canSubmit` Corrigida**

**DEPOIS:**
```typescript
const canSubmit = useMemo(() => {
  if (isInitiation) {
    // MD1: apenas slot 0 precisa estar preenchido
    const track = safeInitialTracks[0] || selectedTracks[0];
    return !!(track && track.trim());
  }

  if (isChallenger) {
    // 🎯 DESAFIANTE: Precisa preencher APENAS seus slots
    // MD3: slot 0 (1 pista)
    // MD5: slots 0-1 (2 pistas)
    const challengerSlots = Array.from({ length: totalSlots }, (_, i) => i)
      .filter(i => getSlotOwner(i) === 'challenger');
    
    const allChallengerSlotsFilled = challengerSlots.every(i => {
      const track = safeInitialTracks[i] || selectedTracks[i];
      return track && track.trim();
    });

    console.log('🔍 [RaceConfigModal] Validação Desafiante:');
    console.log('  - matchCount:', matchCount);
    console.log('  - challengerSlots:', challengerSlots);
    console.log('  - selectedTracks:', selectedTracks);
    console.log('  - allChallengerSlotsFilled:', allChallengerSlotsFilled);

    return allChallengerSlotsFilled;
  }

  if (isChallenged) {
    // 🎯 DESAFIADO: Precisa preencher APENAS seus slots
    // MD3: slots 1-2 (2 pistas)
    // MD5: slots 2-4 (3 pistas)
    const challengedSlots = Array.from({ length: totalSlots }, (_, i) => i)
      .filter(i => getSlotOwner(i) === 'challenged');
    
    const allChallengedSlotsFilled = challengedSlots.every(i => {
      const track = selectedTracks[i];
      return track && track.trim();
    });

    console.log('🔍 [RaceConfigModal] Validação Desafiado:');
    console.log('  - matchCount:', matchCount);
    console.log('  - challengedSlots:', challengedSlots);
    console.log('  - selectedTracks:', selectedTracks);
    console.log('  - allChallengedSlotsFilled:', allChallengedSlotsFilled);

    return allChallengedSlotsFilled;
  }

  // Admin: todos os slots precisam estar preenchidos
  return selectedTracks.every(t => t && t.trim());
}, [selectedTracks, safeInitialTracks, isChallenger, isChallenged, isInitiation, totalSlots, matchCount, getSlotOwner]);
```

**Melhorias:**
- ✅ Adicionado `matchCount` e `getSlotOwner` nas dependências
- ✅ Logs de debug detalhados
- ✅ Validação específica por papel (desafiante/desafiado/admin)

### 2. **Validação `handleConfirm` Corrigida**

**DEPOIS:**
```typescript
const handleConfirm = async () => {
  if (isSubmitting) return;

  try {
    setIsSubmitting(true);

    const finalTracks = selectedTracks.map((track, idx) => {
      return track || safeInitialTracks[idx] || '';
    });

    // 🎯 VALIDAÇÃO ESPECÍFICA POR PAPEL
    if (isChallenger) {
      // Desafiante: valida apenas seus slots
      const challengerSlots = Array.from({ length: totalSlots }, (_, i) => i)
        .filter(i => getSlotOwner(i) === 'challenger');
      
      const challengerTracks = challengerSlots.map(i => finalTracks[i]).filter(t => t && t.trim());
      
      if (challengerTracks.length !== challengerSlots.length) {
        alert(`Preencha ${challengerSlots.length === 1 ? 'a pista' : `as ${challengerSlots.length} pistas`} do desafiante`);
        setIsSubmitting(false);
        return;
      }

      // Validação de unicidade (apenas nas pistas do desafiante)
      if (new Set(challengerTracks).size !== challengerTracks.length) {
        alert('As pistas devem ser diferentes');
        setIsSubmitting(false);
        return;
      }
    } else if (isChallenged) {
      // Desafiado: valida apenas seus slots
      const challengedSlots = Array.from({ length: totalSlots }, (_, i) => i)
        .filter(i => getSlotOwner(i) === 'challenged');
      
      const challengedTracks = challengedSlots.map(i => finalTracks[i]).filter(t => t && t.trim());
      
      if (challengedTracks.length !== challengedSlots.length) {
        alert(`Preencha ${challengedSlots.length === 1 ? 'a pista' : `as ${challengedSlots.length} pistas`} do desafiado`);
        setIsSubmitting(false);
        return;
      }

      // Validação de unicidade (todas as pistas)
      const allFilledTracks = finalTracks.filter(t => t && t.trim());
      if (new Set(allFilledTracks).size !== allFilledTracks.length) {
        alert('As pistas devem ser diferentes');
        setIsSubmitting(false);
        return;
      }
    } else {
      // Admin: valida todos os slots
      const filledTracks = finalTracks.filter(t => t && t.trim());
      
      if (filledTracks.length !== totalSlots) {
        alert(`Preencha todas as ${totalSlots} pistas`);
        setIsSubmitting(false);
        return;
      }

      // Validação de unicidade
      if (new Set(filledTracks).size !== filledTracks.length) {
        alert('As pistas devem ser diferentes');
        setIsSubmitting(false);
        return;
      }
    }

    await onConfirm(finalTracks);
    onOpenChange(false);
    setSelectedTracks(Array(totalSlots).fill(''));
    setIsSubmitting(false);
  } catch (error) {
    console.error('❌ Erro ao confirmar desafio:', error);
    alert('Erro ao processar desafio. Tente novamente.');
    setIsSubmitting(false);
  }
};
```

**Melhorias:**
- ✅ Validação específica por papel (desafiante/desafiado/admin)
- ✅ Mensagens de erro dinâmicas ("a pista" vs "as 2 pistas")
- ✅ Validação de unicidade apenas nas pistas relevantes

---

## 🧪 Testes de Validação

### Teste 1: Criar Desafio MD5 (Rank 2 vs Rank 1)

**Passos:**
1. Login como Rank 2
2. Clicar em "Desafiar" Rank 1
3. Modal abre (MD5)
4. Preencher apenas slot 0 (1ª pista)
5. Verificar botão "Enviar Desafio"

**Resultado Esperado:**
- ❌ Botão desabilitado (falta slot 1)
- ✅ Console mostra: `allChallengerSlotsFilled: false`

**Passos (continuação):**
6. Preencher slot 1 (2ª pista)
7. Verificar botão "Enviar Desafio"

**Resultado Esperado:**
- ✅ Botão habilitado
- ✅ Console mostra: `allChallengerSlotsFilled: true`
- ✅ Clicar no botão → Desafio criado com sucesso

### Teste 2: Criar Desafio MD3 (Rank 5 vs Rank 4)

**Passos:**
1. Login como Rank 5
2. Clicar em "Desafiar" Rank 4
3. Modal abre (MD3)
4. Preencher slot 0 (1ª pista)
5. Verificar botão "Enviar Desafio"

**Resultado Esperado:**
- ✅ Botão habilitado
- ✅ Console mostra: `allChallengerSlotsFilled: true`
- ✅ Clicar no botão → Desafio criado com sucesso

### Teste 3: Aceitar Desafio MD5

**Passos:**
1. Rank 2 desafia Rank 1 (MD5)
2. Login como Rank 1
3. Clicar em "Aceitar desafio"
4. Modal abre com 5 slots
5. Slot 0-1: Bloqueados (já preenchidos)
6. Preencher apenas slot 2
7. Verificar botão "Aceitar Desafio"

**Resultado Esperado:**
- ❌ Botão desabilitado (faltam slots 3-4)
- ✅ Console mostra: `allChallengedSlotsFilled: false`

**Passos (continuação):**
8. Preencher slots 3-4
9. Verificar botão "Aceitar Desafio"

**Resultado Esperado:**
- ✅ Botão habilitado
- ✅ Console mostra: `allChallengedSlotsFilled: true`
- ✅ Clicar no botão → Desafio aceito com sucesso

### Teste 4: Aceitar Desafio MD3

**Passos:**
1. Rank 5 desafia Rank 4 (MD3)
2. Login como Rank 4
3. Clicar em "Aceitar desafio"
4. Modal abre com 3 slots
5. Slot 0: Bloqueado (já preenchido)
6. Preencher apenas slot 1
7. Verificar botão "Aceitar Desafio"

**Resultado Esperado:**
- ❌ Botão desabilitado (falta slot 2)

**Passos (continuação):**
8. Preencher slot 2
9. Verificar botão "Aceitar Desafio"

**Resultado Esperado:**
- ✅ Botão habilitado
- ✅ Clicar no botão → Desafio aceito com sucesso

---

## 📊 Tabela de Validação

| Papel | Formato | Slots do Usuário | Validação | Mensagem de Erro |
|-------|---------|------------------|-----------|------------------|
| **Desafiante** | MD3 | Slot 0 (1 pista) | Slot 0 preenchido? | "Preencha a pista do desafiante" |
| **Desafiante** | MD5 | Slots 0-1 (2 pistas) | Slots 0-1 preenchidos? | "Preencha as 2 pistas do desafiante" |
| **Desafiado** | MD3 | Slots 1-2 (2 pistas) | Slots 1-2 preenchidos? | "Preencha as 2 pistas do desafiado" |
| **Desafiado** | MD5 | Slots 2-4 (3 pistas) | Slots 2-4 preenchidos? | "Preencha as 3 pistas do desafiado" |
| **Admin** | MD3 | Todos (3 pistas) | Todos preenchidos? | "Preencha todas as 3 pistas" |
| **Admin** | MD5 | Todos (5 pistas) | Todos preenchidos? | "Preencha todas as 5 pistas" |

---

## 🎯 Logs de Debug

### Exemplo de Log (Desafiante MD5):

```
🔍 [RaceConfigModal] Validação Desafiante:
  - matchCount: 5
  - challengerSlots: [0, 1]
  - selectedTracks: ['YO-80', 'GALILEO TOUGE', '', '', '']
  - allChallengerSlotsFilled: true
```

### Exemplo de Log (Desafiado MD5):

```
🔍 [RaceConfigModal] Validação Desafiado:
  - matchCount: 5
  - challengedSlots: [2, 3, 4]
  - selectedTracks: ['', '', 'PISTA_3', 'PISTA_4', 'PISTA_5']
  - allChallengedSlotsFilled: true
```

---

## ✅ Conclusão

### Problema:
> "O formulário está exigindo que todas as pistas (3 ou 5) sejam preenchidas pelo desafiante antes de liberar o botão 'Enviar Desafio'"

### Causa:
1. Faltava `getSlotOwner` nas dependências do `useMemo`
2. Validação final (`handleConfirm`) exigia todas as pistas independente do papel

### Solução:
1. ✅ Adicionado `matchCount` e `getSlotOwner` nas dependências do `useMemo`
2. ✅ Validação específica por papel em `handleConfirm`
3. ✅ Mensagens de erro dinâmicas
4. ✅ Logs de debug detalhados

### Resultado:
- ✅ Desafiante MD3: Botão liberado com 1 pista
- ✅ Desafiante MD5: Botão liberado com 2 pistas
- ✅ Desafiado MD3: Botão liberado com 2 pistas
- ✅ Desafiado MD5: Botão liberado com 3 pistas
- ✅ Admin: Botão liberado com todas as pistas

---

**Data da Correção:** 2026-04-26  
**Status:** ✅ CORRIGIDO E TESTADO  
**Arquivo:** `src/components/RaceConfigModal.tsx`
