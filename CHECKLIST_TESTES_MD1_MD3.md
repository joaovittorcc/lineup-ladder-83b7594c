# ✅ CHECKLIST DE TESTES: MD1 vs MD3

**Data:** 14 de Abril de 2026  
**Objetivo:** Verificar que o sistema MD1/MD3 dinâmico está funcionando corretamente

---

## 🎯 TESTE 1: MD1 (INICIAÇÃO) - DESAFIADO

### **Cenário:**
Um Joker desafia um piloto da Lista de Iniciação. O piloto desafiado precisa escolher 1 pista.

### **Passos:**

1. **Login como Joker**
   - [ ] Fazer login com credenciais de Joker
   - [ ] Verificar que o badge "JOKER" aparece

2. **Desafiar Piloto da Iniciação**
   - [ ] Ir para aba "LISTA"
   - [ ] Localizar "Lista de Iniciação"
   - [ ] Clicar em "Desafiar" em um dos pilotos
   - [ ] Verificar toast: "📩 Desafio Enviado! Aguardando aprovação do Admin."

3. **Logout e Login como Piloto Desafiado**
   - [ ] Fazer logout
   - [ ] Fazer login com credenciais do piloto desafiado
   - [ ] Verificar que aparece notificação de desafio

4. **Abrir Modal de Aceite**
   - [ ] Clicar em "Escolher Pista"
   - [ ] Modal abre

### **Verificações do Modal:**

#### **Título e Descrição:**
- [ ] Título: "Desafio de Iniciação" (não "Configuração MD3")
- [ ] Descrição: "Desafio de Iniciação (1 pista)"
- [ ] Instruções: "Escolha 1 pista para o desafio de iniciação."

#### **Slot 0 (Pista 1):**
- [ ] Label: "Pista de Iniciação" (não "Pista 1 (Desafiante)")
- [ ] Ícone: Número "1" (não cadeado 🔒)
- [ ] Estado: **Editável** (select habilitado)
- [ ] Cor: Cinza (não laranja)
- [ ] Sem texto "(Bloqueada)"

#### **Slots 1 e 2:**
- [ ] **Slot 1 (Pista 2): NÃO APARECE**
- [ ] **Slot 2 (Pista 3): NÃO APARECE**

#### **Progresso:**
- [ ] Inicial: "0/1" (não "0/3")
- [ ] Barra: 0% preenchida

#### **Botão de Submissão:**
- [ ] Label: "⚔ Aceitar Iniciação" (não "Confirmar Desafio")
- [ ] Estado: Desabilitado (cinza)

5. **Selecionar Pista**
   - [ ] Clicar no select do Slot 0
   - [ ] Lista de pistas aparece
   - [ ] Selecionar uma pista

### **Verificações Após Seleção:**

#### **Slot 0:**
- [ ] Pista selecionada aparece no select
- [ ] Cor muda para laranja
- [ ] Ícone muda para "✓"

#### **Progresso:**
- [ ] Atualiza para "1/1"
- [ ] Barra: 100% preenchida (verde)

#### **Botão de Submissão:**
- [ ] Estado: **Habilitado** (verde)

6. **Aceitar Desafio**
   - [ ] Clicar em "⚔ Aceitar Iniciação"
   - [ ] Modal fecha
   - [ ] Toast: "Desafio de iniciação aceite"

### **Verificações no Banco de Dados:**
- [ ] Desafio tem `type = 'initiation'`
- [ ] Desafio tem `status = 'racing'`
- [ ] Desafio tem `tracks = ["Pista Escolhida"]` (1 elemento)
- [ ] Desafio tem `expires_at = NULL` (não expira)

---

## 🎯 TESTE 2: MD3 (LADDER) - DESAFIANTE

### **Cenário:**
Um piloto desafia o piloto acima na lista. O desafiante escolhe 1 pista.

### **Passos:**

1. **Login como Piloto A (Desafiante)**
   - [ ] Fazer login com credenciais de piloto na lista
   - [ ] Verificar que o badge "NIGHT DRIVER" ou "MIDNIGHT DRIVER" aparece

2. **Desafiar Piloto Acima**
   - [ ] Ir para aba "LISTA"
   - [ ] Localizar sua posição na lista
   - [ ] Clicar em "Desafiar" no piloto acima
   - [ ] Modal abre

### **Verificações do Modal:**

#### **Título e Descrição:**
- [ ] Título: "Configuração MD3" (não "Desafio de Iniciação")
- [ ] Descrição: "Formato: Melhor de 3"
- [ ] Instruções: Texto sobre MD3

#### **Slot 0 (Pista 1):**
- [ ] Label: "Pista 1 (Desafiante)" (não "Pista de Iniciação")
- [ ] Ícone: Número "1" (não cadeado)
- [ ] Estado: **Editável** (select habilitado)
- [ ] Cor: Cinza
- [ ] Sem texto "(Bloqueada)"

#### **Slot 1 (Pista 2):**
- [ ] Label: "Pista 2 (Desafiado)"
- [ ] Ícone: **Cadeado 🔒**
- [ ] Estado: **Bloqueado** (select desabilitado)
- [ ] Cor: Roxo/Rosa
- [ ] Texto: "(Bloqueada)"

#### **Slot 2 (Pista 3):**
- [ ] Label: "Pista 3 (Desafiado)"
- [ ] Ícone: **Cadeado 🔒**
- [ ] Estado: **Bloqueado** (select desabilitado)
- [ ] Cor: Roxo/Rosa
- [ ] Texto: "(Bloqueada)"

#### **Progresso:**
- [ ] Inicial: "0/3" (não "0/1")
- [ ] Barra: 0% preenchida

#### **Botão de Submissão:**
- [ ] Label: "⚔ Confirmar Desafio"
- [ ] Estado: Desabilitado (cinza)

3. **Selecionar Pista 1**
   - [ ] Clicar no select do Slot 0
   - [ ] Lista de pistas aparece
   - [ ] Selecionar uma pista

### **Verificações Após Seleção:**

#### **Slot 0:**
- [ ] Pista selecionada aparece no select
- [ ] Cor muda para laranja
- [ ] Ícone muda para "✓"

#### **Slots 1 e 2:**
- [ ] **Permanecem bloqueados** (cadeado, desabilitados)

#### **Progresso:**
- [ ] Atualiza para "1/3"
- [ ] Barra: ~33% preenchida

#### **Botão de Submissão:**
- [ ] Estado: **Habilitado** (verde)

4. **Enviar Desafio**
   - [ ] Clicar em "⚔ Confirmar Desafio"
   - [ ] Modal fecha
   - [ ] Toast: "⚔ Desafio enviado"

### **Verificações no Banco de Dados:**
- [ ] Desafio tem `type = 'ladder'`
- [ ] Desafio tem `status = 'pending'`
- [ ] Desafio tem `tracks = ["Pista 1", "", ""]` (3 elementos, 2 vazios)
- [ ] Desafio tem `expires_at` (24h no futuro)

---

## 🎯 TESTE 3: MD3 (LADDER) - DESAFIADO

### **Cenário:**
Um piloto recebe um desafio. O desafiado escolhe as 2 pistas restantes.

### **Passos:**

1. **Continuar do Teste 2**
   - [ ] Desafio foi enviado no Teste 2
   - [ ] Fazer logout do Piloto A

2. **Login como Piloto B (Desafiado)**
   - [ ] Fazer login com credenciais do piloto desafiado
   - [ ] Verificar que aparece notificação de desafio

3. **Abrir Modal de Aceite**
   - [ ] Clicar em "Aceitar Desafio"
   - [ ] Modal abre

### **Verificações do Modal:**

#### **Título e Descrição:**
- [ ] Título: "Configuração MD3"
- [ ] Descrição: "Formato: Melhor de 3"
- [ ] Instruções: "Escolha as 2 pistas restantes para completar a MD3."

#### **Slot 0 (Pista 1):**
- [ ] Label: "Pista 1 (Desafiante)"
- [ ] Ícone: **Cadeado 🔒**
- [ ] Estado: **Bloqueado** (div com pista, não select)
- [ ] Cor: Laranja
- [ ] Texto: "(Bloqueada)"
- [ ] **Mostra a pista escolhida pelo desafiante**

#### **Slot 1 (Pista 2):**
- [ ] Label: "Pista 2 (Desafiado)"
- [ ] Ícone: Número "2" (não cadeado)
- [ ] Estado: **Editável** (select habilitado)
- [ ] Cor: Cinza
- [ ] Sem texto "(Bloqueada)"

#### **Slot 2 (Pista 3):**
- [ ] Label: "Pista 3 (Desafiado)"
- [ ] Ícone: Número "3" (não cadeado)
- [ ] Estado: **Editável** (select habilitado)
- [ ] Cor: Cinza
- [ ] Sem texto "(Bloqueada)"

#### **Progresso:**
- [ ] Inicial: "1/3" (pista 1 já preenchida)
- [ ] Barra: ~33% preenchida

#### **Botão de Submissão:**
- [ ] Label: "⚔ Aceitar Desafio"
- [ ] Estado: Desabilitado (cinza)

4. **Selecionar Pista 2**
   - [ ] Clicar no select do Slot 1
   - [ ] Lista de pistas aparece (sem a pista 1)
   - [ ] Selecionar uma pista

### **Verificações Após Seleção da Pista 2:**

#### **Slot 1:**
- [ ] Pista selecionada aparece no select
- [ ] Cor muda para roxo/rosa
- [ ] Ícone muda para "✓"

#### **Progresso:**
- [ ] Atualiza para "2/3"
- [ ] Barra: ~66% preenchida

#### **Botão de Submissão:**
- [ ] Estado: **Ainda desabilitado** (precisa de pista 3)

5. **Selecionar Pista 3**
   - [ ] Clicar no select do Slot 2
   - [ ] Lista de pistas aparece (sem pistas 1 e 2)
   - [ ] Selecionar uma pista

### **Verificações Após Seleção da Pista 3:**

#### **Slot 2:**
- [ ] Pista selecionada aparece no select
- [ ] Cor muda para roxo/rosa
- [ ] Ícone muda para "✓"

#### **Progresso:**
- [ ] Atualiza para "3/3"
- [ ] Barra: 100% preenchida (verde)

#### **Botão de Submissão:**
- [ ] Estado: **Habilitado** (verde)

6. **Aceitar Desafio**
   - [ ] Clicar em "⚔ Aceitar Desafio"
   - [ ] Modal fecha
   - [ ] Toast: "Desafio aceite"

### **Verificações no Banco de Dados:**
- [ ] Desafio tem `type = 'ladder'`
- [ ] Desafio tem `status = 'racing'`
- [ ] Desafio tem `tracks = ["Pista 1", "Pista 2", "Pista 3"]` (3 elementos preenchidos)
- [ ] **Pista 1 foi preservada** (não foi sobrescrita)
- [ ] Desafio tem `expires_at` (original, não mudou)

---

## 🎯 TESTE 4: VALIDAÇÃO DE UNICIDADE

### **Cenário:**
Verificar que o sistema não permite pistas duplicadas.

### **Passos:**

1. **Repetir Teste 3 até o passo 4**
   - [ ] Modal aberto como desafiado
   - [ ] Pista 1 bloqueada (ex: "Pista A")

2. **Tentar Selecionar Pista Duplicada**
   - [ ] Selecionar Pista 2 = "Pista B"
   - [ ] Tentar selecionar Pista 3 = "Pista B" (mesma que Pista 2)
   - [ ] Clicar em "Aceitar Desafio"

### **Verificações:**
- [ ] Alert aparece: "As pistas devem ser diferentes"
- [ ] Modal **não fecha**
- [ ] Desafio **não é aceito**

3. **Corrigir e Aceitar**
   - [ ] Selecionar Pista 3 = "Pista C" (diferente)
   - [ ] Clicar em "Aceitar Desafio"
   - [ ] Modal fecha
   - [ ] Desafio aceito com sucesso

---

## 🎯 TESTE 5: PROTEÇÃO CONTRA ERROS

### **Cenário:**
Verificar que o sistema não quebra com dados inválidos.

### **Passos:**

1. **Abrir DevTools**
   - [ ] Pressionar F12
   - [ ] Ir para aba "Console"

2. **Repetir Teste 1 (MD1)**
   - [ ] Executar todos os passos
   - [ ] Verificar console

### **Verificações:**
- [ ] **Sem erros no console** (apenas logs informativos)
- [ ] **Sem warnings de React** (ex: "Cannot read properties of undefined")
- [ ] **Sem erros de renderização** (tela preta)

3. **Repetir Teste 3 (MD3)**
   - [ ] Executar todos os passos
   - [ ] Verificar console

### **Verificações:**
- [ ] **Sem erros no console**
- [ ] **Sem warnings de React**
- [ ] **Sem erros de renderização**

---

## 🎯 TESTE 6: RESPONSIVIDADE

### **Cenário:**
Verificar que o modal funciona em diferentes tamanhos de tela.

### **Passos:**

1. **Desktop (1920x1080)**
   - [ ] Abrir modal MD1
   - [ ] Verificar layout
   - [ ] Abrir modal MD3
   - [ ] Verificar layout

2. **Tablet (768x1024)**
   - [ ] Redimensionar janela
   - [ ] Abrir modal MD1
   - [ ] Verificar layout
   - [ ] Abrir modal MD3
   - [ ] Verificar layout

3. **Mobile (375x667)**
   - [ ] Redimensionar janela
   - [ ] Abrir modal MD1
   - [ ] Verificar layout
   - [ ] Abrir modal MD3
   - [ ] Verificar layout

### **Verificações:**
- [ ] Todos os elementos visíveis
- [ ] Sem overflow horizontal
- [ ] Botões acessíveis
- [ ] Texto legível

---

## 🎯 TESTE 7: FLUXO COMPLETO MD1

### **Cenário:**
Testar o fluxo completo de um desafio de iniciação.

### **Passos:**

1. **Joker Desafia**
   - [ ] Login como Joker
   - [ ] Desafiar piloto da iniciação
   - [ ] Verificar toast de sucesso

2. **Admin Aprova** (se necessário)
   - [ ] Login como Admin
   - [ ] Aprovar desafio
   - [ ] Verificar toast de sucesso

3. **Piloto Aceita**
   - [ ] Login como piloto desafiado
   - [ ] Abrir modal de aceite
   - [ ] Verificar que é MD1 (1 pista, sem bloqueio)
   - [ ] Selecionar pista
   - [ ] Aceitar desafio

4. **Verificar Estado Final**
   - [ ] Desafio tem `status = 'racing'`
   - [ ] Desafio tem `type = 'initiation'`
   - [ ] Desafio tem `tracks = ["Pista"]` (1 elemento)
   - [ ] Desafio tem `expires_at = NULL`

---

## 🎯 TESTE 8: FLUXO COMPLETO MD3

### **Cenário:**
Testar o fluxo completo de um desafio de ladder.

### **Passos:**

1. **Desafiante Envia**
   - [ ] Login como Piloto A
   - [ ] Desafiar piloto acima
   - [ ] Verificar que é MD3 (3 pistas, slot 0 editável, slots 1-2 bloqueados)
   - [ ] Selecionar pista 1
   - [ ] Enviar desafio

2. **Desafiado Aceita**
   - [ ] Login como Piloto B
   - [ ] Abrir modal de aceite
   - [ ] Verificar que é MD3 (3 pistas, slot 0 bloqueado, slots 1-2 editáveis)
   - [ ] Verificar que pista 1 está visível e bloqueada
   - [ ] Selecionar pistas 2 e 3
   - [ ] Aceitar desafio

3. **Verificar Estado Final**
   - [ ] Desafio tem `status = 'racing'`
   - [ ] Desafio tem `type = 'ladder'`
   - [ ] Desafio tem `tracks = ["Pista 1", "Pista 2", "Pista 3"]` (3 elementos)
   - [ ] **Pista 1 foi preservada** (não foi sobrescrita)
   - [ ] Desafio tem `expires_at` (24h no futuro)

---

## 📊 RESUMO DE VERIFICAÇÕES

### **MD1 (Iniciação):**
- [ ] ✅ Título: "Desafio de Iniciação"
- [ ] ✅ Label: "Pista de Iniciação"
- [ ] ✅ Slot 0: Sempre editável (sem bloqueio)
- [ ] ✅ Slots 1-2: Não aparecem
- [ ] ✅ Progresso: "0/1" → "1/1"
- [ ] ✅ Validação: Apenas 1 pista
- [ ] ✅ Payload: `["pista1"]`
- [ ] ✅ Sem lógica de papéis

### **MD3 (Ladder) - Desafiante:**
- [ ] ✅ Título: "Configuração MD3"
- [ ] ✅ Label: "Pista 1 (Desafiante)"
- [ ] ✅ Slot 0: Editável
- [ ] ✅ Slots 1-2: Bloqueados (cadeado)
- [ ] ✅ Progresso: "0/3" → "1/3"
- [ ] ✅ Validação: Apenas pista 1
- [ ] ✅ Payload: `["pista1", "", ""]`

### **MD3 (Ladder) - Desafiado:**
- [ ] ✅ Título: "Configuração MD3"
- [ ] ✅ Label: "Pista 1 (Desafiante)"
- [ ] ✅ Slot 0: Bloqueado (mostra pista do desafiante)
- [ ] ✅ Slots 1-2: Editáveis
- [ ] ✅ Progresso: "1/3" → "2/3" → "3/3"
- [ ] ✅ Validação: Pistas 2 e 3
- [ ] ✅ Payload: `["pista1", "pista2", "pista3"]`
- [ ] ✅ **Pista 1 preservada**

---

## ⚠️ PROBLEMAS CONHECIDOS

### **SQL Pendente:**
- [ ] ⚠️ Usuário ainda precisa executar `SOLUCAO_DEFINITIVA.sql` no Supabase
- [ ] ⚠️ Sem este SQL, desafios de iniciação podem falhar ao inserir

### **Se Encontrar Erros:**
1. Verificar console do navegador (F12)
2. Verificar logs do Supabase
3. Verificar que o SQL foi executado
4. Verificar que os dados estão corretos no banco

---

## ✅ CRITÉRIOS DE SUCESSO

**O sistema está funcionando corretamente se:**

1. ✅ MD1 mostra apenas 1 slot editável
2. ✅ MD3 mostra 3 slots com bloqueio por papel
3. ✅ Validação é condicional ao tipo
4. ✅ Payloads são corretos por tipo
5. ✅ Pista 1 é preservada no MD3
6. ✅ Sem erros no console
7. ✅ Sem tela preta (React #310)
8. ✅ UI responsiva em todos os tamanhos

---

**Execute todos os testes e marque as caixas!** ✅
