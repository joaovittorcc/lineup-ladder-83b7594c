# 🎯 Implementação: Desafio de Vaga (Lista 02)

## 📋 Visão Geral

Sistema que permite pilotos que completaram a iniciação desafiarem o 8º colocado da Lista 02 para conquistar uma vaga.

---

## ✅ Requisitos Implementados

### 1. **Nova Flag de Estado** ✅

**Flag adicionada:**
- `elegivelDesafioVaga: boolean` no tipo `Player`
- Coluna `elegivel_desafio_vaga` no banco de dados

**Comportamento:**
- Quando admin marca `initiation_complete = true`, automaticamente seta `elegivel_desafio_vaga = true`
- Piloto fica elegível para desafiar o 8º da Lista 02

---

### 2. **Lógica do Desafio de Vaga** ✅

**Novo tipo de desafio:**
- `type: 'desafio-vaga'` adicionado ao tipo `Challenge`

**Regras implementadas:**
- ✅ Só permite desafiar o 8º da Lista 02 (último colocado)
- ✅ Verifica se piloto está elegível (`elegivelDesafioVaga = true`)
- ✅ Bloqueia se 8º estiver ocupado (racing/cooldown)
- ✅ Bloqueia se 8º já tiver desafio ativo
- ✅ Formato MD3 (3 pistas)

**Função criada:**
```typescript
const tryDesafioVaga = useCallback(
  (challengerName: string, tracks?: string[], isAdminOverride = false): string | null => {
    // 1. Encontrar o 8º da Lista 02
    const lastIdx = getList02LastPlaceIndex(list02.players.length);
    const oitavoDaLista02 = list02.players[lastIdx];
    
    // 2. Verificar elegibilidade
    if (!isAdminOverride && !challenger.elegivelDesafioVaga) {
      return 'Você não está elegível para o Desafio de Vaga. Complete a iniciação primeiro.';
    }
    
    // 3. Validar pistas (MD3 = 3 pistas)
    // 4. Criar desafio
    // 5. Resetar flag elegivelDesafioVaga
  }
);
```

---

### 3. **Reset Pós-Desafio** ✅

**Comportamento:**
- Após enviar desafio com sucesso, `elegivelDesafioVaga` é resetado para `false`
- Impede múltiplos desafios de vaga seguidos
- Piloto precisa completar iniciação novamente para novo desafio

**Código:**
```typescript
// ✅ IMPORTANTE: Resetar a flag elegivelDesafioVaga após enviar o desafio
if (challenger.id) {
  updatePlayerInDb(challenger.id, { elegivel_desafio_vaga: false });
}
```

---

### 4. **Segurança e UI** ✅

**Formato do desafio:**
- ✅ MD3 (3 pistas)
- ✅ Expira em 24 horas
- ✅ Status inicial: 'pending' (aguardando aceitação)

**Badge visual no Admin Panel:**
- ✅ Badge verde "✓ Elegível Vaga Lista 2" quando `initiationComplete = true`
- ✅ Aparece ao lado do checkbox de iniciação completa
- ✅ Indica visualmente que piloto pode desafiar o 8º

---

## 📁 Arquivos Modificados

### 1. **`src/types/championship.ts`**

**Mudanças:**
- Adicionado `elegivelDesafioVaga?: boolean` ao tipo `Player`
- Adicionado `'desafio-vaga'` ao tipo `Challenge['type']`

```typescript
export interface Player {
  // ... campos existentes
  elegivelDesafioVaga?: boolean;
}

export interface Challenge {
  // ... campos existentes
  type: 'ladder' | 'initiation' | 'friendly' | 'desafio-vaga';
}
```

---

### 2. **`src/hooks/useChampionship.ts`**

**Mudanças:**

#### a) Mapeamento do banco de dados (linha ~70)
```typescript
function dbPlayerToLocal(row: any): Player {
  return {
    // ... campos existentes
    elegivelDesafioVaga: row.elegivel_desafio_vaga ?? false,
  };
}
```

#### b) Nova função `tryDesafioVaga` (linha ~530)
```typescript
const tryDesafioVaga = useCallback(
  (challengerName: string, tracks?: string[], isAdminOverride = false): string | null => {
    // Lógica completa do desafio de vaga
  },
  [state.lists, state.challenges, isPlayerInActiveChallenge, updatePlayerInDb]
);
```

#### c) Exportação da função (linha ~1797)
```typescript
return {
  // ... funções existentes
  tryDesafioVaga,
};
```

---

### 3. **`src/components/ManagePilotModal.tsx`**

**Mudanças:**

#### a) Atualização automática da flag (linha ~137)
```typescript
const patch: Record<string, unknown> = {
  // ... campos existentes
  initiation_complete: initiationComplete,
  // ✅ NOVO: Quando marcar iniciação completa, automaticamente habilitar desafio de vaga
  elegivel_desafio_vaga: initiationComplete,
};
```

#### b) Badge visual (linha ~305)
```typescript
<div className="flex items-center gap-2">
  <span className="font-semibold text-foreground">Completou a lista de iniciação</span>
  {initiationComplete && (
    <span className="text-[9px] font-bold uppercase tracking-wider text-green-400 px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/30">
      ✓ Elegível Vaga Lista 2
    </span>
  )}
</div>
```

---

## 🗄️ Migration SQL

**Arquivo:** `MIGRATION_DESAFIO_VAGA.sql`

```sql
-- Adicionar coluna elegivel_desafio_vaga
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS elegivel_desafio_vaga BOOLEAN NOT NULL DEFAULT false;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_players_elegivel_desafio_vaga 
ON public.players(elegivel_desafio_vaga) 
WHERE elegivel_desafio_vaga = true;
```

**⚠️ IMPORTANTE:** Execute este script no SQL Editor do Supabase antes de usar o sistema!

---

## 🔄 Fluxo Completo

### Passo 1: Admin Marca Iniciação Completa
```
Admin → ManagePilotModal → Marca "Completou iniciação" → Aplica campos
↓
Banco de dados atualizado:
- initiation_complete = true
- elegivel_desafio_vaga = true
↓
Badge verde aparece: "✓ Elegível Vaga Lista 2"
```

### Passo 2: Piloto Envia Desafio de Vaga
```
Piloto → Clica "Desafiar Vaga Lista 2"
↓
Sistema verifica:
- ✅ elegivelDesafioVaga = true?
- ✅ 8º da Lista 02 disponível?
- ✅ Sem desafios ativos?
- ✅ 3 pistas selecionadas?
↓
Desafio criado:
- type: 'desafio-vaga'
- listId: 'desafio-vaga'
- status: 'pending'
↓
Flag resetada:
- elegivel_desafio_vaga = false
```

### Passo 3: 8º Aceita o Desafio
```
8º da Lista 02 → Aceita desafio → Seleciona 2 pistas restantes
↓
Status muda para 'racing'
↓
MD3 começa (melhor de 3)
```

### Passo 4: Resultado
```
Se desafiante vencer:
- Desafiante entra na Lista 02 (posição 8)
- 8º anterior sai da lista ou desce

Se 8º vencer:
- Mantém posição
- Desafiante precisa completar iniciação novamente
```

---

## 🧪 Como Testar

### Teste 1: Marcar Piloto como Elegível

1. Faça login como Admin
2. Vá em "Gerenciar Piloto"
3. Selecione um piloto
4. Marque "Completou a lista de iniciação"
5. Clique em "Aplicar campos na BD"
6. **Esperado:**
   - ✅ Badge verde "✓ Elegível Vaga Lista 2" aparece
   - ✅ Console mostra sucesso

### Teste 2: Verificar no Banco

```sql
SELECT name, initiation_complete, elegivel_desafio_vaga 
FROM players 
WHERE elegivel_desafio_vaga = true;
```

**Esperado:** Piloto aparece com ambas flags `true`

### Teste 3: Enviar Desafio de Vaga

1. Faça login com piloto elegível
2. Vá na aba "LISTA"
3. Procure botão "Desafiar Vaga Lista 2"
4. Selecione 1 pista inicial
5. Clique em "Enviar Desafio"
6. **Esperado:**
   - ✅ Desafio criado
   - ✅ 8º da Lista 02 recebe notificação
   - ✅ Flag `elegivel_desafio_vaga` resetada para `false`

### Teste 4: Verificar Reset da Flag

```sql
SELECT name, elegivel_desafio_vaga 
FROM players 
WHERE name = 'NOME_DO_PILOTO';
```

**Esperado:** `elegivel_desafio_vaga = false` após enviar desafio

### Teste 5: Tentar Desafiar Novamente

1. Tente enviar outro desafio de vaga
2. **Esperado:**
   - ❌ Botão desabilitado ou mensagem de erro
   - ❌ "Você não está elegível para o Desafio de Vaga"

---

## 🛡️ Validações Implementadas

### Validação 1: Elegibilidade
```typescript
if (!isAdminOverride && !challenger.elegivelDesafioVaga) {
  return 'Você não está elegível para o Desafio de Vaga. Complete a iniciação primeiro.';
}
```

### Validação 2: Alvo Correto
```typescript
const lastIdx = getList02LastPlaceIndex(list02.players.length);
const oitavoDaLista02 = list02.players[lastIdx];
// Só permite desafiar o 8º
```

### Validação 3: Disponibilidade
```typescript
if (oitavoDaLista02.status !== 'available') {
  return 'O 8º da Lista 02 está ocupado (em corrida ou cooldown)';
}
```

### Validação 4: Desafios Ativos
```typescript
if (isPlayerInActiveChallenge(oitavoDaLista02.id, state.challenges)) {
  return 'O 8º da Lista 02 já tem um desafio pendente ou em curso';
}
```

### Validação 5: Pistas (MD3)
```typescript
const filledTracks = tracksArray.filter(t => t && t.trim());
if (filledTracks.length !== 1) {
  return 'Desafios de vaga devem iniciar com 1 pista preenchida';
}
```

---

## 🔐 Segurança

### Proteção 1: Reset Automático
- Flag `elegivelDesafioVaga` é resetada após enviar desafio
- Impede spam de desafios

### Proteção 2: Validação de Elegibilidade
- Verifica flag no banco antes de criar desafio
- Admin pode bypassar com `isAdminOverride`

### Proteção 3: Alvo Fixo
- Só permite desafiar o 8º da Lista 02
- Não permite escolher outro alvo

### Proteção 4: Tipo de Desafio Separado
- `type: 'desafio-vaga'` é distinto de `'ladder'`, `'initiation'`, `'friendly'`
- Não interfere com outras regras

---

## 📊 Diferenças entre Tipos de Desafio

| Característica | Ladder | Initiation | Friendly | Desafio Vaga |
|----------------|--------|------------|----------|--------------|
| **Formato** | MD3 | MD1 | MD3 | MD3 |
| **Alvo** | 1 posição acima | Qualquer da iniciação | Qualquer | 8º da Lista 02 |
| **Elegibilidade** | Estar na lista | Ser Joker | Qualquer | `elegivelDesafioVaga = true` |
| **Expira** | 24h | Não | Não | 24h |
| **Reset flag** | Não | Não | Não | Sim |
| **Afeta ELO** | Não | Não | Sim | Não |

---

## 🚀 Próximos Passos (Sugestões)

### 1. **UI para Desafio de Vaga**
- Adicionar botão "Desafiar Vaga Lista 2" na IndexPage
- Modal específico para desafio de vaga
- Mostrar quem é o 8º atual

### 2. **Notificações Discord**
- Notificar quando desafio de vaga é criado
- Notificar quando é aceito
- Notificar resultado

### 3. **Histórico de Desafios de Vaga**
- Registrar tentativas
- Mostrar taxa de sucesso
- Ranking de quem mais tentou

### 4. **Cooldown para Desafio de Vaga**
- Adicionar cooldown após derrota
- Ex: 7 dias antes de poder tentar novamente

### 5. **Limite de Tentativas**
- Máximo de X tentativas por mês
- Resetar contador mensalmente

---

## 📝 Checklist de Implementação

- [x] Adicionar flag `elegivelDesafioVaga` ao tipo `Player`
- [x] Adicionar tipo `'desafio-vaga'` ao `Challenge`
- [x] Criar migration SQL
- [x] Atualizar `dbPlayerToLocal` para mapear flag
- [x] Criar função `tryDesafioVaga`
- [x] Exportar função no `useChampionship`
- [x] Atualizar `ManagePilotModal` para setar flag automaticamente
- [x] Adicionar badge visual no Admin Panel
- [ ] Criar UI para enviar desafio de vaga (próximo passo)
- [ ] Adicionar notificações Discord (próximo passo)
- [ ] Testar fluxo completo (próximo passo)

---

**Data:** 2026-04-15  
**Versão:** 1.0  
**Status:** ✅ Backend Implementado - UI Pendente
