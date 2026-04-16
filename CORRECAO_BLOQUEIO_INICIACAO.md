# Correção: Bloqueio Automático de Pilotos Derrotados na Iniciação

## Problema Identificado

Quando um Joker vencia um membro da Lista de Iniciação:
- ✅ O desafio era marcado como 'finished'
- ✅ O progresso do Joker era atualizado no banco (`joker_progress`)
- ✅ O piloto derrotado tinha seu status atualizado (`initiation_complete: true`, `status: 'cooldown'`)
- ❌ **MAS** o piloto derrotado ainda podia ser desafiado novamente

## Causa Raiz

A função `challengeInitiationPlayer()` em `src/hooks/useChampionship.ts` **não verificava** se o piloto alvo já tinha sido derrotado antes de permitir um novo desafio.

## Solução Implementada

### 1. Validação no Backend (`useChampionship.ts`)

Adicionada verificação na função `challengeInitiationPlayer()`:

```typescript
// ✅ NOVO: Bloquear desafio se o piloto já foi derrotado
if (target.initiationComplete) {
  return 'Este piloto já foi derrotado e não pode mais ser desafiado na iniciação';
}
```

**Localização**: `src/hooks/useChampionship.ts`, linha ~536

### 2. Validação no Frontend (`PlayerList.tsx`)

Atualizada a lógica de `isDefeatedByJoker` para verificar também o campo `initiationComplete`:

```typescript
isDefeatedByJoker={isJoker && (jokerDefeatedIds.includes(player.id) || player.initiationComplete)}
```

**Localização**: `src/components/PlayerList.tsx`, linha ~410

## Como Funciona Agora

### Quando um Joker vence um piloto da iniciação:

1. **Banco de Dados** (`addPoint` function):
   - Atualiza `joker_progress` (adiciona ID do derrotado)
   - Atualiza `players` table:
     - `status: 'cooldown'`
     - `initiation_complete: true`
     - `cooldown_until: timestamp`

2. **Estado Local** (React):
   - Atualiza `jokerProgress` (array de IDs derrotados)
   - Atualiza `lists` (marca piloto como cooldown)

3. **Validação de Desafio**:
   - Backend: Bloqueia se `target.initiationComplete === true`
   - Frontend: Esconde botão "Desafiar MD1" se piloto foi derrotado

4. **UI Visual**:
   - Mostra ícone ✓ verde ao lado do piloto derrotado
   - Mostra badge "✓ Vencido" no lugar do botão de desafio
   - Atualiza contador de progresso: "X/5 ✓"

## Verificação

### Para testar se a correção funcionou:

1. **Como Joker**: Desafie e vença um piloto da iniciação
2. **Verifique no banco** (SQL Editor):
   ```sql
   SELECT name, status, initiation_complete, cooldown_until 
   FROM players 
   WHERE list_id = 'initiation';
   ```
3. **Verifique na UI**: O piloto derrotado deve:
   - Ter ícone ✓ verde
   - Mostrar badge "✓ Vencido"
   - **NÃO** ter botão "Desafiar MD1"
4. **Tente desafiar novamente**: Deve retornar erro "Este piloto já foi derrotado..."

## Arquivos Modificados

- `src/hooks/useChampionship.ts` - Adicionada validação `initiationComplete`
- `src/components/PlayerList.tsx` - Atualizada lógica `isDefeatedByJoker`

## Notas Importantes

- ✅ A coluna `initiation_complete` já existe na tabela `players` (migration anterior)
- ✅ Não é necessário executar nenhuma migration SQL adicional
- ✅ A correção funciona tanto para novos desafios quanto para o estado atual
- ✅ Pilotos já derrotados (com `initiation_complete: true`) serão bloqueados imediatamente

## Próximos Passos

Se o problema persistir, verifique:

1. **Console do navegador**: Procure por erros ao tentar desafiar
2. **Banco de dados**: Confirme que `initiation_complete` está `true` para pilotos derrotados
3. **Estado React**: Use React DevTools para verificar se `player.initiationComplete` está correto
4. **Realtime sync**: Confirme que as atualizações do Supabase estão sendo recebidas

---

**Data da Correção**: 2026-04-15
**Status**: ✅ Implementado e testado
