# Como Resetar Progresso dos Jokers

**Data**: 2026-04-15  
**Objetivo**: Resetar o progresso de Jokers na lista de iniciação

---

## 🎯 Opções Disponíveis

### 1. Resetar TODOS os Jokers
**Arquivo**: `RESET_TODOS_JOKERS.sql`  
**Quando usar**: Quando você quer limpar todo o progresso de iniciação

### 2. Resetar UM Joker Específico
**Arquivo**: `RESET_JOKER_ESPECIFICO.sql`  
**Quando usar**: Quando você quer resetar apenas um Joker específico

---

## 📋 Opção 1: Resetar TODOS os Jokers

### O que será resetado:
- ✅ Todos os registros em `joker_progress` (deletados)
- ✅ Todos os pilotos da lista de iniciação voltam para `available`
- ✅ Flag `initiation_complete` = `false` para todos
- ✅ Flag `elegivel_desafio_vaga` = `false` para todos
- ✅ Todos os cooldowns zerados
- ✅ Todos os desafios de iniciação cancelados

### Como executar:

1. Abrir SQL Editor no Supabase
2. Copiar e colar o conteúdo de `RESET_TODOS_JOKERS.sql`
3. Clicar em "Run"
4. ✅ Verificar os resultados no final do script

### Resultado esperado:

```
✅ Registros em joker_progress: 0
✅ Pilotos na iniciação: Todos com status 'available'
✅ Desafios de iniciação ativos: 0
```

---

## 📋 Opção 2: Resetar UM Joker Específico

### O que será resetado:
- ✅ Registros em `joker_progress` deste Joker (deletados)
- ✅ Pilotos derrotados por este Joker voltam para `available`
- ✅ Desafios de iniciação deste Joker cancelados

### Como executar:

1. Abrir SQL Editor no Supabase
2. Copiar e colar o conteúdo de `RESET_JOKER_ESPECIFICO.sql`
3. **⚠️ IMPORTANTE**: Alterar `'NOME_DO_JOKER'` para o nome real
   ```sql
   v_joker_name TEXT := 'pino'; -- Exemplo: resetar o Pino
   ```
4. Alterar também na verificação final:
   ```sql
   WHERE joker_name_key = LOWER('pino') -- Mesmo nome aqui
   ```
5. Clicar em "Run"
6. ✅ Verificar os resultados

### Exemplos:

#### Resetar o Pino:
```sql
v_joker_name TEXT := 'pino';
```

#### Resetar o Rev:
```sql
v_joker_name TEXT := 'rev';
```

#### Resetar o Evojota:
```sql
v_joker_name TEXT := 'evojota';
```

---

## 🧪 Verificação Após Reset

### Verificar joker_progress:
```sql
SELECT 
  joker_name_key,
  COUNT(*) AS vitorias,
  STRING_AGG(p.name, ', ') AS derrotados
FROM joker_progress jp
LEFT JOIN players p ON jp.defeated_player_id = p.id
GROUP BY joker_name_key;
```

**Resultado esperado**:
- Se resetou TODOS: Nenhum registro
- Se resetou UM: Apenas os outros Jokers aparecem

### Verificar pilotos da iniciação:
```sql
SELECT 
  name,
  status,
  initiation_complete,
  elegivel_desafio_vaga
FROM players
WHERE list_id = 'initiation'
ORDER BY position;
```

**Resultado esperado**:
- `status`: `available`
- `initiation_complete`: `false`
- `elegivel_desafio_vaga`: `false`

### Verificar desafios ativos:
```sql
SELECT 
  type,
  status,
  challenger_name,
  challenged_name
FROM challenges
WHERE type = 'initiation' 
  AND status IN ('pending', 'racing', 'accepted');
```

**Resultado esperado**: Nenhum registro

---

## ⚠️ Avisos Importantes

### 1. Backup Recomendado
Antes de executar qualquer script de reset, considere fazer backup:
```sql
-- Backup de joker_progress
CREATE TABLE joker_progress_backup AS 
SELECT * FROM joker_progress;

-- Backup de players
CREATE TABLE players_backup AS 
SELECT * FROM players WHERE list_id = 'initiation';
```

### 2. Não Há Volta
Uma vez executado, o reset não pode ser desfeito (a menos que você tenha backup).

### 3. Impacto nos Usuários
- Jokers perderão todo o progresso
- Pilotos derrotados voltarão a estar disponíveis
- Desafios em andamento serão cancelados

### 4. Notificar Usuários
Considere notificar os Jokers antes de resetar o progresso.

---

## 🔄 Quando Resetar?

### Situações Comuns:

1. **Início de Nova Temporada**
   - Resetar TODOS os Jokers
   - Começar do zero

2. **Correção de Bug**
   - Resetar TODOS se o bug afetou todos
   - Resetar UM se o bug afetou apenas um Joker

3. **Teste do Sistema**
   - Resetar TODOS para testar novamente
   - Usar dados de teste

4. **Pedido de Usuário**
   - Resetar UM Joker específico se ele pedir

---

## 📊 Comparação: Reset Total vs Reset Individual

| Aspecto | Reset Total | Reset Individual |
|---------|-------------|------------------|
| Registros deletados | Todos | Apenas do Joker |
| Pilotos resetados | Todos | Apenas os derrotados por ele |
| Desafios cancelados | Todos | Apenas os dele |
| Tempo de execução | ~1 segundo | ~0.5 segundo |
| Impacto | Alto | Baixo |
| Quando usar | Nova temporada | Correção pontual |

---

## 🎯 Fluxo Recomendado

### Para Reset Total:

```
1. Avisar todos os Jokers
   ↓
2. Fazer backup (opcional)
   ↓
3. Executar RESET_TODOS_JOKERS.sql
   ↓
4. Verificar resultados
   ↓
5. Limpar cache do navegador (usuários)
   ↓
6. Testar com um Joker
   ↓
7. ✅ Confirmar que está funcionando
```

### Para Reset Individual:

```
1. Avisar o Joker específico
   ↓
2. Fazer backup (opcional)
   ↓
3. Editar RESET_JOKER_ESPECIFICO.sql
   ↓
4. Alterar 'NOME_DO_JOKER'
   ↓
5. Executar script
   ↓
6. Verificar resultados
   ↓
7. Avisar o Joker que foi resetado
   ↓
8. ✅ Confirmar que está funcionando
```

---

## 🆘 Troubleshooting

### Problema: Script não executa
**Solução**: Verificar se há desafios em andamento que impedem o delete

### Problema: Pilotos ainda aparecem como derrotados
**Solução**: 
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Recarregar página (F5)
3. Verificar se o script foi executado corretamente

### Problema: Joker ainda vê progresso
**Solução**:
1. Verificar se o `joker_name_key` está correto (lowercase)
2. Executar query de verificação
3. Limpar localStorage do navegador

---

## 📝 Logs e Auditoria

Após executar o reset, considere registrar no log:

```sql
-- Exemplo de log manual
INSERT INTO global_logs (type, description, category, created_at)
VALUES (
  'ADMIN',
  'Reset completo de todos os Jokers - Nova temporada',
  'admin',
  NOW()
);
```

---

## ✅ Checklist Pós-Reset

- [ ] Script executado com sucesso
- [ ] Verificação de `joker_progress` (deve estar vazio ou sem o Joker)
- [ ] Verificação de pilotos (todos disponíveis)
- [ ] Verificação de desafios (nenhum ativo)
- [ ] Cache do navegador limpo
- [ ] Teste com um Joker
- [ ] Usuários notificados
- [ ] Log registrado (opcional)

---

**Última Atualização**: 2026-04-15  
**Autor**: Kiro AI Assistant
