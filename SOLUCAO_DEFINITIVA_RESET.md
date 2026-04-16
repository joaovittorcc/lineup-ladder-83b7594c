## 🔍 Diagnóstico do Problema

Você executou os scripts de limpeza, mas os pilotos voltaram a aparecer como "vencidos". Isso pode acontecer por 3 motivos:

### 1. Há desafios ativos sendo finalizados
- Um desafio de iniciação estava em andamento
- Quando finalizado, ele cria um novo registro em `joker_progress`
- Solução: Cancelar desafios ativos antes de limpar

### 2. Cache do navegador
- O navegador está usando dados em cache
- Solução: Limpar cache e recarregar

### 3. Realtime do Supabase
- O Supabase está sincronizando dados antigos
- Solução: Desabilitar temporariamente o realtime

---

## ✅ SOLUÇÃO DEFINITIVA (Passo a Passo)

### PASSO 1: Verificar o Estado Atual

Execute no SQL Editor:
```sql
-- Copie e cole o conteúdo de:
DEBUG_VERIFICAR_ESTADO_ATUAL.sql
```

**O que procurar:**
- Quantos registros existem em `joker_progress`?
- Qual é o `joker_name_key`? (deve ser 'pino', 'rev', etc.)
- Quais pilotos estão marcados como derrotados?

### PASSO 2: Verificar Desafios Ativos

Execute no SQL Editor:
```sql
-- Copie e cole o conteúdo de:
VERIFICAR_DESAFIOS_ATIVOS.sql
```

**Se houver desafios ativos:**
- Cancele-os antes de limpar os dados
- Descomente a linha `UPDATE challenges SET status = 'cancelled'...`

### PASSO 3: Limpar TUDO de Uma Vez

Execute no SQL Editor:
```sql
-- 1. Cancelar desafios ativos
UPDATE challenges 
SET status = 'cancelled'
WHERE type = 'initiation' 
  AND status IN ('pending', 'racing', 'accepted');

-- 2. Deletar TODOS os registros de joker_progress
DELETE FROM joker_progress;

-- 3. Resetar TODOS os pilotos da iniciação
UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  cooldown_until = NULL,
  challenge_cooldown_until = NULL,
  defense_count = 0
WHERE list_id = 'initiation';

-- 4. Verificar
SELECT COUNT(*) AS "Registros (deve ser 0)" FROM joker_progress;
SELECT name, status, initiation_complete FROM players WHERE list_id = 'initiation';
```

### PASSO 4: Limpar Cache do Navegador

1. Pressione **Ctrl+Shift+Delete**
2. Selecione:
   - ✅ Cookies e dados de sites
   - ✅ Imagens e arquivos em cache
3. Clique em **Limpar dados**

### PASSO 5: Recarregar a Aplicação

1. Feche TODAS as abas da aplicação
2. Abra uma nova aba
3. Acesse a aplicação novamente
4. Faça login

### PASSO 6: Verificar o Resultado

- ❌ Progresso MD1: **0/5** ✓
- ❌ Nenhum piloto com ícone ✓ verde
- ❌ Nenhum piloto com badge "✓ VENCIDO"
- ✅ Todos os pilotos com botão "Desafiar MD1"

---

## 🚨 Se AINDA Não Funcionar

### Opção 1: Desabilitar Realtime Temporariamente

No arquivo `src/hooks/useChampionship.ts`, comente as linhas de realtime:

```typescript
// Comentar estas linhas temporariamente:
// useEffect(() => {
//   const channel = supabase
//     .channel('championship-realtime')
//     .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchAll())
//     .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => fetchAll())
//     .on('postgres_changes', { event: '*', schema: 'public', table: 'player_lists' }, () => fetchAll())
//     .on('postgres_changes', { event: '*', schema: 'public', table: 'joker_progress' }, () => fetchAll())
//     .subscribe();
//   return () => { supabase.removeChannel(channel); };
// }, [fetchAll]);
```

### Opção 2: Verificar Qual Usuário Está Logado

O problema pode ser que você está vendo o progresso de OUTRO Joker, não o seu.

**Exemplo:**
- Você está logado como "Rev"
- Mas está vendo os pilotos derrotados por "Pino"

**Solução:**
- Verifique qual usuário está logado (canto superior direito)
- Execute o script `LIMPAR_PROGRESSO_PINO.sql` para limpar o progresso do Pino

### Opção 3: Limpar Progresso de UM Joker Específico

Se você quer limpar apenas o progresso de um Joker específico (ex: Pino):

```sql
-- Limpar progresso do Pino
DELETE FROM joker_progress WHERE joker_name_key = 'pino';

-- Resetar os pilotos que ele derrotou
UPDATE players 
SET status = 'available', initiation_complete = false, cooldown_until = NULL
WHERE id IN (
  SELECT defeated_player_id FROM joker_progress WHERE joker_name_key = 'pino'
);
```

---

## 📁 Arquivos de Debug

- `DEBUG_VERIFICAR_ESTADO_ATUAL.sql` - Ver o que está no banco agora
- `VERIFICAR_DESAFIOS_ATIVOS.sql` - Ver desafios em andamento
- `LIMPAR_PROGRESSO_PINO.sql` - Limpar progresso do Pino especificamente

---

## 💡 Dica Final

Se você está **testando** o sistema e quer limpar os dados frequentemente:

1. Salve o script de limpeza completo (PASSO 3) em um arquivo
2. Execute-o sempre que quiser resetar tudo
3. Sempre limpe o cache do navegador após executar

---

**Última atualização:** 2026-04-15
