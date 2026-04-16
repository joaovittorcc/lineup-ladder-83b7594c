# ⚠️ INSTRUÇÕES URGENTES - LEIA PRIMEIRO

## Problema Atual

Os pilotos ainda aparecem como "✓ VENCIDO" porque:
1. A coluna `joker_name_key` não existe na tabela `joker_progress`
2. Os dados antigos ainda estão no banco de dados

## ✅ SOLUÇÃO EM 3 PASSOS

### PASSO 1: Adicionar a Coluna joker_name_key (OBRIGATÓRIO)

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `01_ADICIONAR_COLUNA_JOKER_NAME_KEY.sql`
4. **Copie TODO o conteúdo** do arquivo
5. **Cole no SQL Editor**
6. Clique em **RUN** (ou pressione Ctrl+Enter)

**O que esse script faz:**
- ✅ Adiciona a coluna `joker_name_key` na tabela `joker_progress`
- ✅ Torna `joker_user_id` opcional (pode ser NULL)
- ✅ Remove constraints antigas
- ✅ Cria índice único para `joker_name_key + defeated_player_id`

### PASSO 2: Limpar os Dados Antigos (OBRIGATÓRIO)

1. No **SQL Editor** do Supabase
2. Abra o arquivo `02_LIMPAR_DADOS.sql`
3. **Copie TODO o conteúdo** do arquivo
4. **Cole no SQL Editor**
5. Clique em **RUN** (ou pressione Ctrl+Enter)

**O que esse script faz:**
- ✅ Apaga TODOS os registros da tabela `joker_progress`
- ✅ Reseta TODOS os pilotos da iniciação para estado inicial
- ✅ Remove todos os cooldowns e flags de "iniciação completa"

### PASSO 3: Recarregar a Página

Após executar os 2 scripts SQL:
1. Volte para a aplicação
2. Pressione **F5** ou **Ctrl+R** para recarregar
3. Faça login novamente como Rev
4. Verifique que NENHUM piloto aparece como "✓ VENCIDO"

## 🎯 Resultado Esperado

Após executar os scripts:
- ❌ Progresso MD1: **0/5** ✓ (zero pilotos derrotados)
- ❌ Nenhum piloto com ícone ✓ verde
- ❌ Nenhum piloto com badge "✓ VENCIDO"
- ✅ Todos os pilotos disponíveis para desafio

## 🔧 Correções Implementadas (Para o Futuro)

As seguintes correções já foram implementadas no código:

### 1. Reset Completo de Piloto
- Agora o botão "Resetar Piloto" limpa TUDO:
  - Progresso como Joker
  - Registros de derrota
  - Campos do piloto
  - ELO, overrides, meta local

### 2. Bloqueio de Pilotos Derrotados
- Pilotos com `initiation_complete: true` não podem mais ser desafiados
- UI esconde o botão "Desafiar MD1" para pilotos derrotados
- Backend retorna erro se tentar desafiar piloto derrotado

### 3. Warning do React Corrigido
- Corrigido o warning `<p> cannot appear as a descendant of <p>`
- Usado `asChild` no `AlertDialogDescription`

## ❓ Se Ainda Não Funcionar

Se após executar os scripts SQL os pilotos ainda aparecerem como vencidos:

1. **Verifique se a coluna foi criada**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'joker_progress' AND column_name = 'joker_name_key';
   ```
   Deve retornar 1 linha.

2. **Verifique se os dados foram limpos**:
   ```sql
   SELECT COUNT(*) FROM joker_progress;
   ```
   Deve retornar **0**.

3. **Verifique os pilotos**:
   ```sql
   SELECT name, initiation_complete, status 
   FROM players 
   WHERE list_id = 'initiation';
   ```
   Todos devem ter `initiation_complete = false` e `status = available`.

4. **Limpe o cache do navegador**:
   - Pressione **Ctrl+Shift+Delete**
   - Selecione "Cache" e "Cookies"
   - Clique em "Limpar dados"
   - Recarregue a página

5. **Verifique o console**:
   - Pressione **F12**
   - Vá na aba "Console"
   - Procure por erros em vermelho
   - Me envie os erros se houver

## 📁 Arquivos Criados

### Execute nesta ordem:
1. ✅ `01_ADICIONAR_COLUNA_JOKER_NAME_KEY.sql` - **EXECUTE PRIMEIRO**
2. ✅ `02_LIMPAR_DADOS.sql` - **EXECUTE SEGUNDO**

### Documentação:
- ✅ `CORRECAO_RESET_PILOTO_COMPLETO.md` - Documentação técnica
- ✅ `INSTRUCOES_URGENTES.md` - Este arquivo

### Arquivos antigos (ignore):
- ~~`LIMPAR_TUDO_AGORA.sql`~~ - Use os novos scripts acima
- ~~`LIMPAR_EVOJOTA_AGORA.sql`~~ - Use os novos scripts acima
- ~~`LIMPAR_PROGRESSO_JOKER_MANUAL.sql`~~ - Use os novos scripts acima

---

**IMPORTANTE**: Execute os scripts SQL NA ORDEM (01 primeiro, depois 02) antes de fazer qualquer outra coisa!
