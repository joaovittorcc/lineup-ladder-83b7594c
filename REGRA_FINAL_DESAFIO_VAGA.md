# ✅ Regra Final: Desafio de Vaga

## 🎯 Regra Completa e Definitiva

**Quem pode desafiar o 8º da Lista 02:**

✅ Piloto que **completou a lista de iniciação** (`initiation_complete = true`)  
✅ E **NÃO está na Lista 01 ou Lista 02**

**Quem NÃO pode desafiar:**

❌ Piloto que não completou a iniciação  
❌ Piloto que está na **Lista 01**  
❌ Piloto que está na **Lista 02**

---

## 📊 Exemplos

### ✅ Pode Desafiar

#### Piloto na Lista de Iniciação
```
Connor está na Lista de Iniciação
Admin marca "Completou iniciação" ✅
Connor NÃO está na Lista 01 ou 02 ✅
→ Connor PODE desafiar o 8º da Lista 02 ✅
```

#### Piloto na Lista Oculta (hidden)
```
Leite está na lista "hidden" (sem lista)
Admin marca "Completou iniciação" ✅
Leite NÃO está na Lista 01 ou 02 ✅
→ Leite PODE desafiar o 8º da Lista 02 ✅
```

#### Joker que completou iniciação
```
P1N0 é Joker (Lista de Iniciação)
Admin marca "Completou iniciação" ✅
P1N0 NÃO está na Lista 01 ou 02 ✅
→ P1N0 PODE desafiar o 8º da Lista 02 ✅
```

---

### ❌ NÃO Pode Desafiar

#### Piloto na Lista 01
```
Flpn está na Lista 01 ❌
Mesmo com "Completou iniciação" marcado
→ Flpn NÃO PODE desafiar (já está em lista) ❌
```

#### Piloto na Lista 02
```
Blake está na Lista 02 (posição 5) ❌
Mesmo com "Completou iniciação" marcado
→ Blake NÃO PODE desafiar (já está em lista) ❌
```

#### Piloto sem completar iniciação
```
K1 está na lista "hidden"
Admin NÃO marcou "Completou iniciação" ❌
→ K1 NÃO PODE desafiar ❌
```

---

## 🔧 Implementação

### Frontend (IndexPage.tsx)
```typescript
// Verificar se está na Lista 01 ou Lista 02
const isInList01 = list01?.players.some(p => p.id === loggedPlayer?.id);
const isInList02 = list02?.players.some(p => p.id === loggedPlayer?.id);

// Só mostra se: completou iniciação E não está na Lista 01 ou 02
if (loggedPlayer?.initiationComplete && !isInList01 && !isInList02 && oitavo) {
  // Mostrar card de desafio de vaga
}
```

### Backend (useChampionship.ts)
```typescript
// Verificar se está na Lista 01 ou Lista 02
const list01 = state.lists.find(l => l.id === 'list-01');
const isInList01 = list01?.players.some(p => p.id === challenger.id);
const isInList02 = list02.players.some(p => p.id === challenger.id);

if (!isAdminOverride && (isInList01 || isInList02)) {
  return 'Você já está na Lista 01 ou Lista 02. Desafio de vaga é apenas para quem está fora dessas listas.';
}
```

---

## 📋 Listas e Elegibilidade

| Lista | Pode Desafiar? | Observação |
|-------|----------------|------------|
| **Iniciação** | ✅ Sim | Se completou iniciação |
| **Hidden** | ✅ Sim | Se completou iniciação |
| **Lista 01** | ❌ Não | Já está em lista |
| **Lista 02** | ❌ Não | Já está em lista |

---

## 🎯 Fluxo Completo

```
1. Piloto está em qualquer lugar (Iniciação, Hidden, etc.)
   ↓
2. Admin marca "Completou a lista de iniciação"
   ↓
3. Sistema verifica: está na Lista 01 ou 02?
   ├─ SIM → ❌ NÃO mostra card de desafio
   └─ NÃO → ✅ Mostra card de desafio
   ↓
4. Piloto clica em "Desafiar 8º da Lista 02"
   ↓
5. Sistema valida novamente no backend
   ↓
6. Se tudo OK → Cria desafio MD3
   ↓
7. Se ganhar → Piloto assume 8º lugar da Lista 02
```

---

## ✅ Validações Implementadas

### Frontend (3 lugares):
1. ✅ Card na aba "Início"
2. ✅ Card na aba "Lista"
3. ✅ Modal de desafio de vaga

### Backend:
1. ✅ Função `tryDesafioVaga()` em `useChampionship.ts`

---

**Última atualização**: 16 de Abril de 2026  
**Arquivos modificados**:
- `src/components/IndexPage.tsx` (3 verificações)
- `src/hooks/useChampionship.ts` (validação backend)
