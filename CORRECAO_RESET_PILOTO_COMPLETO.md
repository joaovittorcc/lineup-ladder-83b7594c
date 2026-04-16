# Correção: Reset Completo de Piloto

## Problema Identificado

Quando um admin resetava o perfil de um piloto usando a função "Resetar Piloto":
- ✅ ELO era resetado para base (1000)
- ✅ Overrides de cargo eram removidos
- ✅ Campos do piloto eram normalizados (status, cooldown, etc.)
- ✅ Progresso do Joker era limpo (se o piloto era um Joker)
- ❌ **MAS** registros onde o piloto foi **derrotado por outros Jokers** NÃO eram apagados

### Exemplo do Problema:

1. Evojota (Joker) derrota Mnz, Connor, Zanin e Pedrin na iniciação
2. Admin reseta o perfil de Mnz
3. Mnz volta para status "available", `initiation_complete: false`
4. **MAS** o registro em `joker_progress` ainda mostra que Evojota derrotou Mnz
5. Na UI, Mnz ainda aparece como "✓ Vencido" para Evojota

## Causa Raiz

A função `handleResetPilotProfile()` em `src/components/IndexPage.tsx` chamava:
- `adminClearJokerProgressByNameKey(name)` - Limpa registros onde o piloto é o **Joker**
- **MAS NÃO** limpava registros onde o piloto é o **derrotado** (`defeated_player_id`)

## Solução Implementada

### Modificação em `src/components/IndexPage.tsx`

Adicionada lógica para apagar registros onde o piloto aparece como derrotado:

```typescript
// ✅ NOVO: Limpar registros onde este piloto foi derrotado por outros Jokers
const player = lists.flatMap(l => l.players).find(p => p.name.toLowerCase() === lower);
if (player) {
  // Apagar registros onde este piloto aparece como derrotado
  const { error: deleteError } = await supabase
    .from('joker_progress')
    .delete()
    .eq('defeated_player_id', player.id);
  
  if (deleteError) {
    console.error('Erro ao limpar registros de derrota:', deleteError);
  }
  
  // Resetar todos os campos do piloto
  await adminUpdatePlayerById(player.id, {
    status: 'available',
    defense_count: 0,
    cooldown_until: null,
    challenge_cooldown_until: null,
    defenses_while_seventh_streak: 0,
    list02_external_block_until: null,
    list02_external_eligible_after: null,
    initiation_complete: false,
  });
}
```

## Como Funciona Agora

Quando um admin clica em "Resetar Piloto", o sistema:

1. **Remove overrides de cargo** (localStorage)
2. **Limpa meta local** (Street Runner unlock, Joker cooldown)
3. **Reseta ELO** para 1000 (base)
4. **Limpa progresso como Joker** (registros onde `joker_name_key = nome`)
5. **✅ NOVO: Limpa registros de derrota** (registros onde `defeated_player_id = player.id`)
6. **Reseta campos do piloto**:
   - `status: 'available'`
   - `defense_count: 0`
   - `cooldown_until: null`
   - `challenge_cooldown_until: null`
   - `initiation_complete: false`
   - `defenses_while_seventh_streak: 0`
   - `list02_external_block_until: null`
   - `list02_external_eligible_after: null`

## Resultado

Após resetar um piloto:
- ✅ Piloto volta ao estado inicial (como novo cadastro)
- ✅ Não aparece mais como "vencido" para nenhum Joker
- ✅ Pode ser desafiado normalmente na iniciação
- ✅ Todos os registros relacionados são apagados

## Limpeza Manual (Opcional)

Se você precisa limpar registros antigos manualmente, use o arquivo:
- `LIMPAR_PROGRESSO_JOKER_MANUAL.sql`

Execute no SQL Editor do Supabase para:
- Limpar progresso de um Joker específico
- Limpar registros onde um piloto foi derrotado
- Resetar completamente um piloto
- Ver o progresso atual antes de deletar

## Arquivos Modificados

- `src/components/IndexPage.tsx` - Adicionada lógica de limpeza de registros de derrota
  - Linha ~30: Adicionado import do `supabase`
  - Linha ~343: Adicionada lógica de delete em `joker_progress`

## Teste

Para verificar se a correção funcionou:

1. **Antes do reset**:
   ```sql
   SELECT * FROM joker_progress WHERE defeated_player_id IN (
     SELECT id FROM players WHERE name = 'Mnz'
   );
   ```
   Deve retornar registros.

2. **Resetar o piloto** via UI (Admin Panel → Gerenciar Piloto → Resetar Piloto)

3. **Depois do reset**:
   ```sql
   SELECT * FROM joker_progress WHERE defeated_player_id IN (
     SELECT id FROM players WHERE name = 'Mnz'
   );
   ```
   Deve retornar **0 registros**.

4. **Verificar na UI**: O piloto não deve mais aparecer como "✓ Vencido" para nenhum Joker.

---

**Data da Correção**: 2026-04-15
**Status**: ✅ Implementado
