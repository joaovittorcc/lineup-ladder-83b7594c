# Análise Completa do Código Atual

## 📋 Resumo Executivo

O sistema atual implementa um campeonato de corridas com:
- **2 listas principais** (Lista 01 e Lista 02)
- **Sistema de desafios** (ladder, cross-list, street-runner, desafio-vaga, initiation)
- **Cooldowns** (ataque 3 dias, defesa derrota 1 dia)
- **Proteção especial** para 8º da Lista 02 (Gatekeeper)

## 🎯 Pontos Críticos para Implementação da Imunidade

### 1. **Estrutura de Dados**

#### Player Interface (src/types/championship.ts)
```typescript
export interface Player {
  id: string;
  name: string;
  status: 'available' | 'racing' | 'cooldown' | 'pending';
  defenseCount: number;  // ✅ JÁ EXISTE - contador de defesas
  cooldownUntil: number | null;  // Cooldown de derrota (1 dia)
  challengeCooldownUntil: number | null;  // Cooldown de ataque (3 dias)
  initiationComplete: boolean;
  defensesWhileSeventhStreak: number;  // ⚠️ ESPECÍFICO para 8º da Lista 02
  list02ExternalBlockUntil: number | null;  // ⚠️ ESPECÍFICO para 8º da Lista 02
  list02ExternalEligibleAfter: number | null;
  elegivelDesafioVaga?: boolean;
  
  // ❌ FALTAM:
  // consecutiveDefenses: number;  // Novo contador universal
  // cooldownImmunityUntil: number | null;  // Timestamp de imunidade
}
```

**IMPORTANTE:** 
- `defenseCount` existe mas é resetado quando status muda para 'available'
- `defensesWhileSeventhStreak` é específico para o 8º da Lista 02 (Gatekeeper)
- Precisamos de `consecutiveDefenses` como contador universal separado

### 2. **Conversão Database → Local**

#### dbPlayerToLocal (linha 62)
```typescript
function dbPlayerToLocal(row: any): Player {
  return {
    id: row.id,
    name: row.name,
    status: row.status as Player['status'],
    defenseCount: row.defense_count ?? 0,
    cooldownUntil: row.cooldown_until ? new Date(row.cooldown_until).getTime() : null,
    challengeCooldownUntil: row.challenge_cooldown_until 
      ? new Date(row.challenge_cooldown_until).getTime() 
      : null,
    // ... outros campos
    
    // ❌ FALTAM:
    // consecutiveDefenses: row.consecutive_defenses ?? 0,
    // cooldownImmunityUntil: row.cooldown_immunity_until
    //   ? new Date(row.cooldown_immunity_until).getTime()
    //   : null,
  };
}
```

### 3. **Funções de Validação de Desafio**

#### tryChallenge (linha 330)
```typescript
const tryChallenge = useCallback((listId, challengerIdx, challengedIdx, ...) => {
  // Validações existentes:
  // ✅ Verifica se challenger está em cooldown de ataque
  // ✅ Verifica se challenged está em corrida
  // ✅ Verifica se já tem desafio ativo
  
  // ❌ FALTA:
  // Verificar se challenged tem imunidade ativa (cooldownImmunityUntil > now)
  
  if (challenger.challengeCooldownUntil && challenger.challengeCooldownUntil > Date.now()) {
    const remaining = Math.ceil((challenger.challengeCooldownUntil - Date.now()) / (1000 * 60 * 60 * 24));
    return `Bloqueado: Aguarde ${remaining} dia(s) para desafiar novamente`;
  }
  
  // ❌ ADICIONAR AQUI:
  // if (challenged.cooldownImmunityUntil && challenged.cooldownImmunityUntil > Date.now()) {
  //   const remaining = Math.ceil((challenged.cooldownImmunityUntil - Date.now()) / (1000 * 60 * 60 * 24));
  //   return `Imunidade de Defesa ativa: Este piloto defendeu sua posição 2 vezes seguidas. Tempo restante: ${remaining} dias.`;
  // }
});
```

**Mesma lógica precisa ser adicionada em:**
- `tryCrossListChallenge` (linha 420)
- `tryStreetRunnerChallenge` (linha 480)
- `tryDesafioVaga` (linha 580)

### 4. **Processamento de Resultado (addPoint)**

#### Lógica Atual de Cooldowns (linha 1200+)

**ATACANTE (Challenger):**
```typescript
// ✅ SEMPRE recebe 3 dias de cooldown de ataque
const attackerCooldownIso = new Date(Date.now() + COOLDOWN_ATAQUE).toISOString();
updatePlayerInDb(challenge.challengerId, {
  challenge_cooldown_until: attackerCooldownIso,
  // ...
});
```

**DEFENSOR QUE GANHA:**
```typescript
// ✅ Liberado (sem cooldown)
updatePlayerInDb(challenge.challengedId, {
  status: 'available',
  defense_count: defender.defenseCount + 1,  // ⚠️ Incrementa defenseCount
  cooldown_until: null,
  challenge_cooldown_until: null,
});
```

**DEFENSOR QUE PERDE:**
```typescript
// ✅ Recebe 1 dia de cooldown de derrota
updatePlayerInDb(challenge.challengedId, {
  status: 'cooldown',
  defense_count: 0,  // ⚠️ Reseta defenseCount
  cooldown_until: new Date(Date.now() + COOLDOWN_DEFESA_DERROTA).toISOString(),
});
```

**ATACANTE QUE GANHA E SOBE:**
```typescript
// ✅ Sobe de posição, recebe cooldown de ataque
updatePlayerInDb(challenge.challengerId, {
  position: challengedIdx,
  status: 'available',
  defense_count: 0,  // ⚠️ Reseta defenseCount
  challenge_cooldown_until: attackerCooldownIso,
});
```

### 5. **Lógica Especial do Gatekeeper (8º da Lista 02)**

#### defensesWhileSeventhStreak (linha 1450+)
```typescript
// ⚠️ LÓGICA EXISTENTE ESPECÍFICA PARA GATEKEEPER
const lastIdx = getList02LastPlaceIndex(list02.players.length);
const challengedIdx = list02.players.findIndex(p => p.id === challenge.challengedId);
const isLastPlaceDefense = challengedIdx === lastIdx;
const streak = defender.defensesWhileSeventhStreak ?? 0;
let newStreak = isLastPlaceDefense ? streak + 1 : 0;
let blockIso: string | null = null;

if (isLastPlaceDefense && streak + 1 >= 2) {
  // ✅ Após 2 defesas seguidas: 3 dias de bloqueio para Street Runner
  blockIso = new Date(Date.now() + LIST02_EXTERNAL_BLOCK_MS).toISOString();
  newStreak = 0;
}

updatePlayerInDb(challenge.challengedId, {
  defenses_while_seventh_streak: newStreak,
  ...(blockIso ? { list02_external_block_until: blockIso } : {}),
});
```

**IMPORTANTE:**
- Esta lógica é **ESPECÍFICA** para bloquear desafios de Street Runner
- A nova imunidade deve ser **UNIVERSAL** (bloqueia todos os tipos de desafio)
- Gatekeeper deve ter **DUAS** proteções:
  1. `list02ExternalBlockUntil` (existente) - bloqueia apenas Street Runner
  2. `cooldownImmunityUntil` (novo) - bloqueia TODOS os desafios

### 6. **Tipos de Desafio e Suas Particularidades**

#### Ladder (lista-01, lista-02)
- Desafio entre pilotos da mesma lista
- Atacante sempre 1 posição abaixo
- ✅ Deve respeitar imunidade

#### Cross-List
- 1º da Lista 02 desafia último da Lista 01
- Se ganhar: sobe para Lista 01
- ✅ Deve respeitar imunidade

#### Street Runner
- Piloto externo desafia 8º da Lista 02
- Já tem proteção especial (`list02ExternalBlockUntil`)
- ✅ Deve TAMBÉM respeitar imunidade universal

#### Desafio de Vaga
- Piloto que completou iniciação desafia 8º da Lista 02
- Similar ao Street Runner
- ✅ Deve respeitar imunidade

#### Initiation
- Joker desafia piloto da lista de iniciação
- ❌ NÃO deve usar sistema de imunidade (é separado)

## 🔧 Mudanças Necessárias

### 1. **Banco de Dados** ✅ PRONTO
```sql
ALTER TABLE public.players 
ADD COLUMN consecutive_defenses INTEGER DEFAULT 0,
ADD COLUMN cooldown_immunity_until TIMESTAMPTZ;
```

### 2. **TypeScript Interface**
```typescript
export interface Player {
  // ... campos existentes
  consecutiveDefenses: number;
  cooldownImmunityUntil: number | null;
}
```

### 3. **Conversão DB → Local**
```typescript
function dbPlayerToLocal(row: any): Player {
  return {
    // ... campos existentes
    consecutiveDefenses: row.consecutive_defenses ?? 0,
    cooldownImmunityUntil: row.cooldown_immunity_until
      ? new Date(row.cooldown_immunity_until).getTime()
      : null,
  };
}
```

### 4. **Constantes de Imunidade**
```typescript
const IMMUNITY_GATEKEEPER_MS = 3 * 24 * 60 * 60 * 1000; // 3 dias
const IMMUNITY_REGULAR_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
```

### 5. **Função de Validação de Imunidade**
```typescript
function validateImmunity(challenged: Player, challengeType: string): string | null {
  const now = Date.now();
  if (challenged.cooldownImmunityUntil && challenged.cooldownImmunityUntil > now) {
    const remainingMs = challenged.cooldownImmunityUntil - now;
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    
    // Verificar se é Gatekeeper (precisa de contexto da lista)
    const isGatekeeper = challengeType === 'desafio-vaga' || challengeType === 'street-runner';
    
    if (isGatekeeper) {
      return `Imunidade Gatekeeper ativa: Este piloto defendeu sua posição 2 vezes seguidas. Tempo restante: ${remainingDays} dias.`;
    } else {
      return `Imunidade de Defesa ativa: Este piloto defendeu sua posição 2 vezes seguidas. Tempo restante: ${remainingDays} dias.`;
    }
  }
  return null;
}
```

### 6. **Lógica de Processamento de Resultado**

#### Defensor Ganha
```typescript
// Incrementar consecutiveDefenses
const newConsecutiveDefenses = defender.consecutiveDefenses + 1;

// Verificar se atingiu 2 defesas consecutivas
if (newConsecutiveDefenses === 2) {
  // Determinar se é Gatekeeper
  const isGatekeeper = isPlayerGatekeeper(defender, list);
  const isDesafioVaga = challenge.listId === 'desafio-vaga';
  
  let immunityUntil: string | null = null;
  
  if (isGatekeeper && isDesafioVaga) {
    // Gatekeeper: 3 dias
    immunityUntil = new Date(Date.now() + IMMUNITY_GATEKEEPER_MS).toISOString();
  } else if (!isGatekeeper) {
    // Regular: 7 dias
    immunityUntil = new Date(Date.now() + IMMUNITY_REGULAR_MS).toISOString();
  }
  
  updatePlayerInDb(challenge.challengedId, {
    consecutive_defenses: newConsecutiveDefenses,
    cooldown_immunity_until: immunityUntil,
    // ... outros campos
  });
} else {
  updatePlayerInDb(challenge.challengedId, {
    consecutive_defenses: newConsecutiveDefenses,
    // ... outros campos
  });
}
```

#### Defensor Perde
```typescript
updatePlayerInDb(challenge.challengedId, {
  consecutive_defenses: 0,  // ✅ Resetar contador
  cooldown_immunity_until: null,  // ✅ Limpar imunidade
  // ... outros campos
});
```

#### Atacante Ganha e Sobe
```typescript
updatePlayerInDb(challenge.challengerId, {
  consecutive_defenses: 0,  // ✅ Resetar contador (mudou de contexto)
  // cooldown_immunity_until: PRESERVAR (não modificar)
  // ... outros campos
});
```

#### Atacante Perde
```typescript
updatePlayerInDb(challenge.challengerId, {
  // consecutive_defenses: PRESERVAR (não modificar)
  // cooldown_immunity_until: PRESERVAR (não modificar)
  // ... outros campos
});
```

## ⚠️ Pontos de Atenção

### 1. **Diferença entre defenseCount e consecutiveDefenses**
- `defenseCount`: Contador total de defesas (resetado em várias situações)
- `consecutiveDefenses`: Contador específico para imunidade (resetado apenas em perda/mudança de posição)

### 2. **Diferença entre list02ExternalBlockUntil e cooldownImmunityUntil**
- `list02ExternalBlockUntil`: Bloqueia APENAS Street Runner (específico do Gatekeeper)
- `cooldownImmunityUntil`: Bloqueia TODOS os desafios (universal)

### 3. **Gatekeeper tem DUAS proteções**
- Após 2 defesas contra Street Runner: `list02ExternalBlockUntil` (3 dias)
- Após 2 defesas contra Desafio de Vaga: `cooldownImmunityUntil` (3 dias)

### 4. **Imunidade é preservada durante ataques**
- Quando piloto com imunidade ataca: `cooldownImmunityUntil` NÃO é modificado
- Apenas `challengeCooldownUntil` é aplicado (cooldown de ataque)

### 5. **Reset de consecutiveDefenses**
- Perde defesa: reset para 0
- Ganha ataque e sobe: reset para 0
- Perde ataque: PRESERVAR valor atual

## 📊 Fluxo de Implementação Recomendado

1. ✅ **Executar SQL no Supabase** (ADICIONAR_COLUNAS_IMUNIDADE.sql)
2. ⏳ **Atualizar interface Player** (src/types/championship.ts)
3. ⏳ **Atualizar dbPlayerToLocal** (src/hooks/useChampionship.ts)
4. ⏳ **Adicionar constantes de imunidade** (src/hooks/useChampionship.ts)
5. ⏳ **Criar função validateImmunity** (src/hooks/useChampionship.ts)
6. ⏳ **Adicionar validação em tryChallenge** (4 funções)
7. ⏳ **Atualizar lógica de addPoint** (processamento de resultado)
8. ⏳ **Atualizar challengeSync** (incluir novos campos)
9. ⏳ **Adicionar componentes UI** (badges, tooltips)
10. ⏳ **Testar todos os cenários**

## 🎯 Próximos Passos

Execute o SQL no Supabase e confirme que as colunas foram criadas. Depois disso, posso começar a implementar as mudanças no código TypeScript.
