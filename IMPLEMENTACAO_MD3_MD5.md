# Implementação: Formato Dinâmico MD3/MD5

## 📋 Resumo

Implementado sistema de formato dinâmico de desafios para a **Lista 01**, onde o formato (MD3 ou MD5) é determinado automaticamente com base nas posições dos pilotos.

## 🎯 Regras de Negócio

### MD5 (Melhor de 5) - Desafios no Topo
1. **Rank 2 vs Rank 1** → MD5
2. **Rank 3 vs Rank 2** → MD5
3. **Rank 4 vs Rank 3** → MD5

### MD3 (Melhor de 3) - Padrão
1. **Rank 5 vs Rank 4** → MD3
2. **Qualquer outro desafio** → MD3
3. **Todas as outras listas** (Lista 02, Cross-List, etc.) → MD3

## 🔧 Mudanças Implementadas

### 1. **Interface Challenge** (src/types/championship.ts)
```typescript
export interface Challenge {
  // ... campos existentes
  /** Formato do desafio: MD3 (melhor de 3) ou MD5 (melhor de 5) */
  format?: 'MD3' | 'MD5';
}
```

### 2. **Função getMatchFormat** (src/hooks/useChampionship.ts)
```typescript
export function getMatchFormat(challengerRank: number, targetRank: number): 'MD3' | 'MD5' {
  // Validação: challenger deve estar abaixo (maior número) do target
  if (challengerRank <= targetRank) {
    console.warn(`⚠️ Rank inválido: challenger=${challengerRank}, target=${targetRank}. Forçando MD3.`);
    return 'MD3';
  }

  // Regras MD5: desafios no topo da lista
  const md5Rules: Array<[number, number]> = [
    [2, 1], // Rank 2 vs Rank 1
    [3, 2], // Rank 3 vs Rank 2
    [4, 3], // Rank 4 vs Rank 3
  ];

  for (const [cRank, tRank] of md5Rules) {
    if (challengerRank === cRank && targetRank === tRank) {
      return 'MD5';
    }
  }

  // Padrão: MD3 para todos os outros casos
  return 'MD3';
}
```

**Características:**
- ✅ Validação de ranks (challenger deve ser > target)
- ✅ Estrutura de dados clara (array de regras)
- ✅ Fácil manutenção (adicionar novas regras é simples)
- ✅ Fallback seguro (MD3 em caso de erro)

### 3. **Integração em tryChallenge** (src/hooks/useChampionship.ts)
```typescript
// 🎯 Calcular formato do desafio (MD3 ou MD5) apenas para Lista 01
const format = listId === 'list-01' 
  ? getMatchFormat(challengerIdx + 1, challengedIdx + 1) 
  : 'MD3'; // Outras listas sempre MD3

const challenge: Challenge = {
  // ... outros campos
  format, // ✅ Incluir formato calculado
};
```

**Nota:** `challengerIdx + 1` porque os índices são 0-based mas os ranks são 1-based.

### 4. **Conversão DB → Local** (src/hooks/useChampionship.ts)
```typescript
function dbChallengeToLocal(row: any): Challenge {
  return {
    // ... outros campos
    format: row.format as 'MD3' | 'MD5' | undefined,
  };
}
```

### 5. **Sincronização com Banco** (src/lib/challengeSync.ts)
```typescript
const { data, error } = await supabase.from('challenges').insert({
  // ... outros campos
  format: challenge.format ?? 'MD3', // ✅ Incluir formato (padrão MD3)
} as any).select('id').single();
```

### 6. **Migração SQL** (ADICIONAR_COLUNA_FORMAT.sql)
```sql
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'MD3' CHECK (format IN ('MD3', 'MD5'));
```

## 📊 Exemplos de Uso

### Lista 01 - Desafios MD5
```
Rank 2 (Piloto B) desafia Rank 1 (Piloto A)
→ getMatchFormat(2, 1) = 'MD5'
→ Desafio criado com format: 'MD5'
```

```
Rank 3 (Piloto C) desafia Rank 2 (Piloto B)
→ getMatchFormat(3, 2) = 'MD5'
→ Desafio criado com format: 'MD5'
```

```
Rank 4 (Piloto D) desafia Rank 3 (Piloto C)
→ getMatchFormat(4, 3) = 'MD5'
→ Desafio criado com format: 'MD5'
```

### Lista 01 - Desafios MD3
```
Rank 5 (Piloto E) desafia Rank 4 (Piloto D)
→ getMatchFormat(5, 4) = 'MD3'
→ Desafio criado com format: 'MD3'
```

```
Rank 6 (Piloto F) desafia Rank 5 (Piloto E)
→ getMatchFormat(6, 5) = 'MD3'
→ Desafio criado com format: 'MD3'
```

### Outras Listas - Sempre MD3
```
Lista 02: Qualquer desafio
→ format = 'MD3' (sem chamar getMatchFormat)
```

```
Cross-List: 1º L02 vs Último L01
→ format = 'MD3' (sem chamar getMatchFormat)
```

## 🔍 Validações de Segurança

### 1. **Validação de Rank Inválido**
```typescript
if (challengerRank <= targetRank) {
  console.warn(`⚠️ Rank inválido: challenger=${challengerRank}, target=${targetRank}. Forçando MD3.`);
  return 'MD3';
}
```

**Cenários cobertos:**
- Challenger com rank menor (erro de lógica)
- Ranks iguais (impossível mas tratado)
- Ranks negativos ou zero

### 2. **Constraint no Banco de Dados**
```sql
CHECK (format IN ('MD3', 'MD5'))
```

**Garante:**
- Apenas valores válidos são aceitos
- Proteção contra dados corrompidos
- Validação em nível de banco

### 3. **Valor Padrão**
```sql
DEFAULT 'MD3'
```

**Garante:**
- Desafios antigos têm formato válido
- Fallback seguro em caso de erro
- Compatibilidade retroativa

## 🎨 Próximos Passos (UI)

### 1. **Exibir Formato no Modal de Desafio**
```typescript
// Exemplo de como exibir no modal
<div className="format-badge">
  {challenge.format === 'MD5' ? (
    <Badge variant="destructive">MD5 - Melhor de 5</Badge>
  ) : (
    <Badge variant="secondary">MD3 - Melhor de 3</Badge>
  )}
</div>
```

### 2. **Exibir Formato na Lista de Desafios**
```typescript
// Exemplo de como exibir na lista
<div className="challenge-card">
  <span className="format-label">{challenge.format}</span>
  <span className="challenger">{challenge.challengerName}</span>
  <span>vs</span>
  <span className="challenged">{challenge.challengedName}</span>
</div>
```

### 3. **Validação de Pontuação**
```typescript
// Ajustar lógica de vitória baseada no formato
const maxPoints = challenge.format === 'MD5' ? 3 : 2;
if (challenge.score[0] >= maxPoints || challenge.score[1] >= maxPoints) {
  // Desafio completo
}
```

## 📝 Checklist de Implementação

- [x] Adicionar campo `format` na interface `Challenge`
- [x] Criar função `getMatchFormat` com regras de negócio
- [x] Integrar cálculo de formato em `tryChallenge`
- [x] Atualizar `dbChallengeToLocal` para ler formato do banco
- [x] Atualizar `syncChallengeInsert` para salvar formato no banco
- [x] Criar migração SQL para adicionar coluna `format`
- [ ] **Executar SQL no Supabase** (ADICIONAR_COLUNA_FORMAT.sql)
- [ ] Atualizar UI para exibir formato do desafio
- [ ] Ajustar lógica de pontuação para MD5 (3 pontos para vencer)
- [ ] Testar todos os cenários de desafio

## 🚀 Como Executar

### 1. Executar SQL no Supabase
```bash
# Abrir Supabase Dashboard → SQL Editor
# Copiar e colar conteúdo de ADICIONAR_COLUNA_FORMAT.sql
# Executar
```

### 2. Verificar Coluna Criada
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'challenges' 
AND column_name = 'format';
```

### 3. Testar Desafios
```
1. Criar desafio Rank 2 vs Rank 1 na Lista 01
   → Verificar que format = 'MD5'

2. Criar desafio Rank 5 vs Rank 4 na Lista 01
   → Verificar que format = 'MD3'

3. Criar desafio na Lista 02
   → Verificar que format = 'MD3'
```

## ⚠️ Notas Importantes

1. **Apenas Lista 01 usa MD5**
   - Lista 02, Cross-List, Street Runner, Desafio de Vaga: sempre MD3

2. **Ranks são 1-indexed**
   - Rank 1 = Primeiro lugar
   - Rank 2 = Segundo lugar
   - etc.

3. **Índices são 0-indexed**
   - challengerIdx = 0 → Rank 1
   - challengerIdx = 1 → Rank 2
   - Por isso: `getMatchFormat(challengerIdx + 1, challengedIdx + 1)`

4. **Formato é calculado na criação**
   - Não muda durante o desafio
   - Salvo no banco para referência futura

5. **Compatibilidade retroativa**
   - Desafios antigos terão `format = 'MD3'` (padrão)
   - Não afeta desafios em andamento
