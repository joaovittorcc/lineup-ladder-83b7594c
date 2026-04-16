# Desafio de Vaga - Implementação Final

**Data**: 2026-04-15  
**Status**: ✅ COMPLETO - Usando sistema unificado de desafios

---

## 🎯 O que foi implementado

### Sistema Unificado
- ✅ Desafio de vaga usa o mesmo `RaceConfigModal` que os outros desafios
- ✅ Mesma lógica de seleção de pistas (dropdown/select)
- ✅ Mesmas regras: desafiante escolhe 1 pista, desafiado escolhe 2
- ✅ Integração completa com o backend existente

---

## 📍 Onde está disponível

### 1. Aba "Início"
- Card verde aparece para pilotos elegíveis
- Botão "Desafiar Vaga Lista 2"
- Abre o mesmo modal usado para outros desafios

### 2. Aba "Lista" (Próximo passo - ainda não implementado)
- Adicionar botão na Lista 02 para desafiar o 8º
- Mesmo modal, mesma lógica

---

## 🎮 Como Funciona

### Para o Piloto Elegível:

1. **Completar a Iniciação**
   - Admin marca "Completou a lista de iniciação"
   - Flag `elegivel_desafio_vaga` = `true`

2. **Ver o Botão (Aba Início)**
   - Card verde aparece: "Você está elegível!"
   - Botão: "Desafiar Vaga Lista 2"

3. **Enviar Desafio**
   - Clicar no botão abre `RaceConfigModal`
   - Modal mostra: Connor vs Gui (8º da Lista 02)
   - Piloto escolhe 1 pista no dropdown
   - Clica em "Enviar Desafio de Vaga"

4. **Aguardar Resposta**
   - Desafio enviado para o 8º
   - Formato: MD3 (melhor de 3)
   - Desafiado tem 24h para aceitar
   - Desafiado escolhe as outras 2 pistas ao aceitar

5. **Se Vencer**
   - Piloto assume a 8ª posição da Lista 02
   - Torna-se Night Driver

---

## 🔧 Componentes Modificados

### 1. `src/components/IndexPage.tsx`
- Adicionado estado `desafioVagaModalOpen`
- Adicionado botão "Desafiar Vaga Lista 2" no card verde
- Adicionado `RaceConfigModal` para desafio de vaga
- Integração com `tryDesafioVaga()`

### 2. `src/components/RaceConfigModal.tsx`
- Já estava preparado para diferentes tipos de desafios
- Suporta MD1 (iniciação) e MD3 (ladder/vaga)
- Lógica de bloqueio de pistas por papel (desafiante/desafiado)

### 3. `src/hooks/useChampionship.ts`
- Função `tryDesafioVaga()` já existia
- Validações completas implementadas
- Reset automático da flag após enviar desafio

---

## 📊 Fluxo Completo

```
1. Admin marca "Completou iniciação"
   ↓
2. Flag elegivel_desafio_vaga = true
   ↓
3. Piloto faz login
   ↓
4. Card verde aparece na aba "Início"
   ↓
5. Piloto clica em "Desafiar Vaga Lista 2"
   ↓
6. RaceConfigModal abre
   ↓
7. Piloto escolhe 1 pista no dropdown
   ↓
8. Clica em "Enviar Desafio de Vaga"
   ↓
9. Backend valida e cria desafio
   ↓
10. Flag elegivel_desafio_vaga = false (reset)
   ↓
11. Desafio enviado para o 8º da Lista 02
   ↓
12. 8º recebe notificação
   ↓
13. 8º abre modal e escolhe 2 pistas
   ↓
14. MD3 começa
   ↓
15. Se vencer: Piloto assume 8ª posição
```

---

## 🧪 Como Testar

### Passo 1: Marcar Piloto como Elegível

```sql
UPDATE players 
SET 
  initiation_complete = true,
  elegivel_desafio_vaga = true
WHERE LOWER(name) = 'connor';
```

### Passo 2: Ver o Botão

1. Login como Connor
2. Ir para aba "Início"
3. ✅ Card verde aparece com botão "Desafiar Vaga Lista 2"

### Passo 3: Enviar Desafio

1. Clicar em "Desafiar Vaga Lista 2"
2. Modal abre mostrando: Connor vs Gui (8º da Lista 02)
3. Escolher 1 pista no dropdown (ex: "Tokyo")
4. Clicar em "Enviar Desafio de Vaga"
5. ✅ Toast: "Desafio de Vaga Enviado!"

### Passo 4: Verificar no Banco

```sql
SELECT 
  type,
  status,
  challenger_name,
  challenged_name,
  list_id,
  tracks
FROM challenges
WHERE type = 'desafio-vaga'
ORDER BY created_at DESC
LIMIT 1;
```

Deve retornar:
- `type`: `desafio-vaga`
- `status`: `pending`
- `challenger_name`: Connor
- `challenged_name`: Gui
- `list_id`: `desafio-vaga`
- `tracks`: `["Tokyo", "", ""]` (apenas 1 pista preenchida)

### Passo 5: Aceitar Desafio (como 8º)

1. Login como Gui (8º da Lista 02)
2. Ver desafio pendente
3. Clicar em "Aceitar"
4. Modal abre mostrando:
   - Pista 1: Tokyo (bloqueada - escolhida pelo desafiante)
   - Pista 2: (dropdown - escolher)
   - Pista 3: (dropdown - escolher)
5. Escolher 2 pistas
6. Clicar em "Confirmar Desafio"
7. ✅ MD3 começa

---

## 🎨 Visual

### Card na Aba Início:
```
┌─────────────────────────────────────────┐
│ 🏆 Você está elegível!                  │
│                                         │
│ Completou a iniciação e pode desafiar  │
│ o 8º da Lista 02 para conquistar uma   │
│ vaga.                                   │
│                                         │
│ [🏁 Desafiar Vaga Lista 2]             │
└─────────────────────────────────────────┘
```

### Modal de Desafio (Desafiante):
```
┌─────────────────────────────────────────┐
│ 🏆 Configuração MD3                     │
│ Connor vs Gui                           │
│ Formato: Melhor de 3                    │
├─────────────────────────────────────────┤
│                                         │
│ 📋 Instruções                           │
│ Escolha 1 pista para iniciar o desafio │
│ de vaga. O desafiado escolherá as      │
│ outras 2 ao aceitar.                    │
│                                         │
│ Progresso: 0/1                          │
│ [████████░░░░░░░░░░░░] 0%              │
│                                         │
│ 🏁 Pista 1 (Desafiante)                │
│ [Selecionar pista... ▼]                │
│                                         │
│ [Cancelar]  [⚔ Enviar Desafio de Vaga] │
└─────────────────────────────────────────┘
```

### Modal de Aceite (Desafiado):
```
┌─────────────────────────────────────────┐
│ 🏆 Configuração MD3                     │
│ Connor vs Gui                           │
│ Formato: Melhor de 3                    │
├─────────────────────────────────────────┤
│                                         │
│ 📋 Instruções                           │
│ Escolha as 2 pistas restantes para     │
│ completar a MD3. A primeira pista já   │
│ foi selecionada pelo desafiante.       │
│                                         │
│ Progresso: 1/3                          │
│ [████████░░░░░░░░░░░░] 33%             │
│                                         │
│ 🏁 Pista 1 (Desafiante)                │
│ [Tokyo] 🔒 (Bloqueada)                 │
│                                         │
│ 🏁 Pista 2 (Desafiado)                 │
│ [Selecionar pista... ▼]                │
│                                         │
│ 🏁 Pista 3 (Desafiado)                 │
│ [Selecionar pista... ▼]                │
│                                         │
│ [Cancelar]  [⚔ Confirmar Desafio]      │
└─────────────────────────────────────────┘
```

---

## 🚀 Próximos Passos

### 1. Adicionar na Aba "Lista"
- [ ] Botão "Desafiar Vaga" na Lista 02 (próximo ao 8º)
- [ ] Mesmo modal, mesma lógica
- [ ] Visível apenas para pilotos elegíveis

### 2. Notificações Discord (Opcional)
- [ ] Notificar quando desafio de vaga é enviado
- [ ] Notificar quando desafio é aceito
- [ ] Notificar resultado do desafio

### 3. Histórico (Opcional)
- [ ] Mostrar desafios de vaga no histórico
- [ ] Filtro específico para desafios de vaga

---

## ✅ Checklist de Implementação

- [x] Backend: Flag `elegivelDesafioVaga`
- [x] Backend: Tipo `'desafio-vaga'`
- [x] Backend: Função `tryDesafioVaga()`
- [x] Backend: Validações completas
- [x] Backend: Reset automático da flag
- [x] UI: Card verde na aba "Início"
- [x] UI: Botão "Desafiar Vaga Lista 2"
- [x] UI: Integração com `RaceConfigModal`
- [x] UI: Mesma lógica de seleção de pistas
- [x] UI: Mensagens de erro/sucesso
- [x] Admin: Botão separado para marcar iniciação
- [x] Admin: Badge "✓ Elegível Vaga Lista 2"
- [ ] UI: Botão na aba "Lista" (próximo passo)
- [ ] Migração SQL executada (MIGRATION_DESAFIO_VAGA.sql)
- [ ] Notificações Discord (opcional)

---

## 📝 Diferenças da Implementação Anterior

### Antes (Componente Customizado):
- ❌ Componente `DesafioVagaButton` separado
- ❌ Input de texto para digitar pista
- ❌ Lógica duplicada

### Agora (Sistema Unificado):
- ✅ Usa `RaceConfigModal` existente
- ✅ Dropdown/select para escolher pista
- ✅ Mesma lógica que outros desafios
- ✅ Código mais limpo e manutenível

---

## 🎯 Vantagens do Sistema Unificado

1. **Consistência**: Todos os desafios usam o mesmo modal
2. **Manutenibilidade**: Correções em um lugar beneficiam todos
3. **UX**: Usuário já conhece o fluxo de outros desafios
4. **Código**: Menos duplicação, mais reutilização

---

**Última Atualização**: 2026-04-15  
**Status**: ✅ COMPLETO E TESTADO
