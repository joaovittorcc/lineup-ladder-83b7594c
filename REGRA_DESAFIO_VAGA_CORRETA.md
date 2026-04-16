# ✅ Regra Correta: Desafio de Vaga

## 🎯 Quem Pode Desafiar o 8º da Lista 02

### ✅ Pilotos Elegíveis
**Apenas pilotos que o admin marcar como "Completou a lista de iniciação"**

Exemplos:
- ✅ Connor (Night Driver) - Se admin marcar
- ✅ Vitin (Night Driver) - Se admin marcar
- ✅ Repre (Street Runner) - Se admin marcar
- ✅ Qualquer piloto - Se admin marcar

### ❌ Jokers NÃO Podem Desafiar
**Jokers têm um sistema diferente:**
- ❌ Jokers **NÃO** podem desafiar o 8º da Lista 02
- ✅ Jokers só podem desafiar membros da **Lista de Iniciação**
- ✅ Jokers precisam vencer **5 membros** da iniciação para subir de cargo
- ❌ Jokers **NUNCA** devem ter `initiation_complete = true`

---

## 🔧 Como Funciona

### Para Pilotos Normais (Não-Jokers)
```
1. Piloto está em qualquer lista (ou fora delas)
2. Admin marca "Completou a lista de iniciação"
3. Piloto vê card verde de "Desafio de Vaga"
4. Piloto pode desafiar o 8º da Lista 02
```

### Para Jokers
```
1. Joker desafia membros da Lista de Iniciação (MD1)
2. Joker vence 5 membros
3. Admin promove Joker para outro cargo
4. Joker NUNCA pode desafiar o 8º da Lista 02
```

---

## 🗂️ Lista de Jokers (Não Devem Ter initiation_complete)

1. **p1n0** (P1N0)
2. **furiatti** (Furiatti)
3. **syds** (Syds)
4. **dasmilf** (Dasmilf)
5. **rev** (Rev)
6. **dgp1** (DGP1)
7. **okaka** (Okaka)

---

## 🔧 Correção Necessária

### Script SQL para Limpar Jokers
Execute `LIMPAR_INITIATION_JOKERS.sql` no Supabase SQL Editor para:
1. Ver estado atual dos Jokers
2. Limpar `initiation_complete = false` de todos os Jokers
3. Limpar `elegivel_desafio_vaga = false` de todos os Jokers
4. Verificar resultado

---

## ⚠️ Importante

**Admin deve ter cuidado ao marcar "Completou a lista de iniciação":**
- ✅ Marcar para pilotos que realmente completaram
- ❌ **NUNCA** marcar para Jokers
- ❌ Jokers têm sistema próprio (Lista de Iniciação MD1)

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────┐
│              PODE DESAFIAR 8º DA LISTA 02               │
├─────────────────────────────────────────────────────────┤
│  ✅ Pilotos com initiation_complete = true              │
│  ✅ Qualquer cargo (exceto Joker)                       │
│  ✅ Qualquer lista (01, 02, ou fora)                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            NÃO PODE DESAFIAR 8º DA LISTA 02             │
├─────────────────────────────────────────────────────────┤
│  ❌ Jokers (sistema próprio)                            │
│  ❌ Pilotos sem initiation_complete                     │
└─────────────────────────────────────────────────────────┘
```

---

**Última atualização**: 16 de Abril de 2026  
**Script SQL**: `LIMPAR_INITIATION_JOKERS.sql`
