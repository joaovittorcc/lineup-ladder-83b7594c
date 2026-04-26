# 🧪 Teste de Validação: getMatchFormat()

## 📋 Objetivo

Validar que a função `getMatchFormat()` retorna o formato correto para todos os cenários.

## 🎯 Casos de Teste

### ✅ Teste 1: Rank 2 vs Rank 1 (MD5)
```typescript
getMatchFormat(2, 1) // Deve retornar 'MD5'
```
**Resultado Esperado:** `MD5`  
**Log Esperado:** `🏆 [getMatchFormat] Top 3 detectado: Rank 2 vs Rank 1 → MD5`

---

### ✅ Teste 2: Rank 3 vs Rank 2 (MD5)
```typescript
getMatchFormat(3, 2) // Deve retornar 'MD5'
```
**Resultado Esperado:** `MD5`  
**Log Esperado:** `🏆 [getMatchFormat] Top 3 detectado: Rank 3 vs Rank 2 → MD5`

---

### ✅ Teste 3: Rank 4 vs Rank 3 (MD5)
```typescript
getMatchFormat(4, 3) // Deve retornar 'MD5'
```
**Resultado Esperado:** `MD5`  
**Log Esperado:** `🏆 [getMatchFormat] Top 3 detectado: Rank 4 vs Rank 3 → MD5`

---

### ✅ Teste 4: Rank 5 vs Rank 4 (MD3)
```typescript
getMatchFormat(5, 4) // Deve retornar 'MD3'
```
**Resultado Esperado:** `MD3`  
**Log Esperado:** `📋 [getMatchFormat] Regra geral: Rank 5 vs Rank 4 → MD3`

---

### ✅ Teste 5: Rank 6 vs Rank 5 (MD3)
```typescript
getMatchFormat(6, 5) // Deve retornar 'MD3'
```
**Resultado Esperado:** `MD3`  
**Log Esperado:** `📋 [getMatchFormat] Regra geral: Rank 6 vs Rank 5 → MD3`

---

### ✅ Teste 6: Rank 3 vs Rank 1 (Inválido - MD3)
```typescript
getMatchFormat(3, 1) // Deve retornar 'MD3' (não é desafio direto)
```
**Resultado Esperado:** `MD3`  
**Log Esperado:** `📋 [getMatchFormat] Regra geral: Rank 3 vs Rank 1 → MD3`

---

### ✅ Teste 7: Rank 1 vs Rank 2 (Inválido - MD3)
```typescript
getMatchFormat(1, 2) // Deve retornar 'MD3' (challenger <= target)
```
**Resultado Esperado:** `MD3`  
**Log Esperado:** `⚠️ [getMatchFormat] Rank inválido: challenger=1, target=2. Forçando MD3.`

---

## 🔍 Como Testar no Console do Navegador

1. Abrir a aplicação
2. Abrir DevTools (F12)
3. Ir para a aba Console
4. Executar os testes:

```javascript
// Importar a função (se exportada)
// Ou criar desafios e observar os logs

// Teste 1: Rank 2 vs Rank 1
// Login como Rank 2, desafiar Rank 1
// Verificar console: deve mostrar "Top 3 detectado" e "MD5"

// Teste 2: Rank 3 vs Rank 2
// Login como Rank 3, desafiar Rank 2
// Verificar console: deve mostrar "Top 3 detectado" e "MD5"

// Teste 3: Rank 4 vs Rank 3
// Login como Rank 4, desafiar Rank 3
// Verificar console: deve mostrar "Top 3 detectado" e "MD5"

// Teste 4: Rank 5 vs Rank 4
// Login como Rank 5, desafiar Rank 4
// Verificar console: deve mostrar "Regra geral" e "MD3"
```

---

## 📊 Tabela de Resultados

| Teste | Challenger | Target | Esperado | Status |
|-------|------------|--------|----------|--------|
| 1 | Rank 2 | Rank 1 | MD5 | ⏳ Pendente |
| 2 | Rank 3 | Rank 2 | MD5 | ⏳ Pendente |
| 3 | Rank 4 | Rank 3 | MD5 | ⏳ Pendente |
| 4 | Rank 5 | Rank 4 | MD3 | ⏳ Pendente |
| 5 | Rank 6 | Rank 5 | MD3 | ⏳ Pendente |
| 6 | Rank 3 | Rank 1 | MD3 | ⏳ Pendente |
| 7 | Rank 1 | Rank 2 | MD3 | ⏳ Pendente |

---

## ✅ Checklist de Validação

Após executar os testes, marque:

- [ ] Teste 1: MD5 retornado corretamente
- [ ] Teste 2: MD5 retornado corretamente
- [ ] Teste 3: MD5 retornado corretamente
- [ ] Teste 4: MD3 retornado corretamente
- [ ] Teste 5: MD3 retornado corretamente
- [ ] Teste 6: MD3 retornado corretamente (não é Top 3)
- [ ] Teste 7: MD3 retornado corretamente (rank inválido)
- [ ] Logs aparecem no console
- [ ] Modal abre com número correto de slots (3 ou 5)
- [ ] Formato é salvo corretamente no banco

---

**Data:** 2026-04-26  
**Status:** ⏳ Aguardando Execução
