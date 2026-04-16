# Desafio de Vaga - Lista 02

**Data**: 2026-04-15  
**Status**: ✅ Implementado (UI + Backend)

---

## 🎯 Funcionalidade

Pilotos que completam a Lista de Iniciação podem desafiar o 8º da Lista 02 para conquistar uma vaga.

---

## ✅ O que foi implementado

### 1. Backend (Já existia)
- ✅ Flag `elegivelDesafioVaga` no tipo `Player`
- ✅ Tipo `'desafio-vaga'` no `Challenge`
- ✅ Função `tryDesafioVaga()` com validações completas
- ✅ Atualização automática da flag quando admin marca iniciação completa
- ✅ Reset automático da flag após enviar desafio

### 2. UI (NOVO - Implementado agora)
- ✅ Componente `DesafioVagaButton.tsx` criado
- ✅ Botão aparece na página inicial para pilotos elegíveis
- ✅ Modal para configurar o desafio (escolher 1 pista)
- ✅ Integração completa com o backend

---

## 🎮 Como Funciona

### Para o Piloto Elegível:

1. **Completar a Iniciação**
   - Admin marca "Completou a lista de iniciação" no painel de gerenciar piloto
   - Flag `elegivel_desafio_vaga` é automaticamente setada para `true`

2. **Ver o Botão**
   - Ao fazer login, o piloto vê um card verde na página inicial
   - Card mostra: "Você está elegível!"
   - Botão: "Desafiar Vaga Lista 2"

3. **Enviar Desafio**
   - Clicar no botão abre um modal
   - Modal mostra quem é o 8º da Lista 02
   - Piloto escolhe 1 pista para iniciar
   - Clica em "Enviar Desafio"

4. **Aguardar Resposta**
   - Desafio é enviado para o 8º da Lista 02
   - Formato: MD3 (melhor de 3)
   - Desafiado tem 24h para aceitar
   - Se não aceitar, W.O. para o desafiante

5. **Se Vencer**
   - Piloto assume a 8ª posição da Lista 02
   - Torna-se Night Driver
   - Ganha direito de usar a tag [夜中]

---

## 📋 Validações Implementadas

### No Backend (`tryDesafioVaga`):

1. ✅ Verifica se Lista 02 existe e tem pilotos
2. ✅ Verifica se o 8º está disponível (não em corrida/cooldown)
3. ✅ Verifica se o desafiante está elegível (`elegivelDesafioVaga = true`)
4. ✅ Verifica se o 8º não tem desafio ativo
5. ✅ Valida que 1 pista foi escolhida (MD3 começa com 1 pista)
6. ✅ Reseta a flag `elegivelDesafioVaga` após enviar desafio

### Na UI:

1. ✅ Botão só aparece se piloto está elegível
2. ✅ Botão só aparece se há um 8º na Lista 02
3. ✅ Modal valida que 1 pista foi escolhida
4. ✅ Mostra mensagens de erro claras
5. ✅ Desabilita botões durante envio

---

## 🗂️ Arquivos Modificados/Criados

### Criados:
1. **`src/components/DesafioVagaButton.tsx`**
   - Componente do botão e modal
   - Validação de pista
   - Integração com backend

### Modificados:
2. **`src/components/IndexPage.tsx`**
   - Import do `DesafioVagaButton`
   - Adicionado `tryDesafioVaga` ao destructuring
   - Card verde na página inicial para pilotos elegíveis
   - Lógica para detectar se piloto está elegível

3. **`src/components/ManagePilotModal.tsx`** (já estava modificado)
   - Seção separada para "Completou a lista de iniciação"
   - Botão exclusivo "Salvar Status de Iniciação"
   - Badge "✓ Elegível Vaga Lista 2" quando marcado

---

## 🧪 Como Testar

### Passo 1: Marcar Piloto como Elegível

1. Login como Admin
2. Ir para aba "Pilotos"
3. Clicar em "Gerir" no piloto (ex: Connor)
4. Marcar "Completou a lista de iniciação"
5. Clicar em "Salvar Status de Iniciação"

**Verificar no SQL**:
```sql
SELECT name, initiation_complete, elegivel_desafio_vaga
FROM players
WHERE LOWER(name) = 'connor';
```

Deve retornar:
- `initiation_complete`: `true`
- `elegivel_desafio_vaga`: `true`

### Passo 2: Ver o Botão

1. Fazer logout
2. Login como o piloto (ex: Connor)
3. Ir para aba "Início"
4. ✅ Deve aparecer um card verde com:
   - Título: "Você está elegível!"
   - Botão: "Desafiar Vaga Lista 2"

### Passo 3: Enviar Desafio

1. Clicar em "Desafiar Vaga Lista 2"
2. Modal abre mostrando:
   - Quem você vai desafiar (8º da Lista 02)
   - Campo para escolher 1 pista
3. Digitar nome da pista (ex: "Tokyo")
4. Clicar em "Enviar Desafio"
5. ✅ Deve aparecer toast: "Desafio enviado!"

**Verificar no SQL**:
```sql
SELECT 
  type,
  status,
  challenger_name,
  challenged_name,
  list_id
FROM challenges
WHERE type = 'desafio-vaga'
ORDER BY created_at DESC
LIMIT 1;
```

Deve retornar:
- `type`: `desafio-vaga`
- `status`: `pending`
- `challenger_name`: Connor
- `challenged_name`: (nome do 8º)
- `list_id`: `desafio-vaga`

### Passo 4: Verificar Reset da Flag

```sql
SELECT name, elegivel_desafio_vaga
FROM players
WHERE LOWER(name) = 'connor';
```

Deve retornar:
- `elegivel_desafio_vaga`: `false` (resetado após enviar desafio)

---

## 🎨 Visual

### Card na Página Inicial:
```
┌─────────────────────────────────────────┐
│ 🏆 Você está elegível!                  │
│                                         │
│ Completou a iniciação e pode desafiar  │
│ o 8º da Lista 02 para conquistar uma   │
│ vaga.                                   │
│                                         │
│ [Desafiar Vaga Lista 2]                │
└─────────────────────────────────────────┘
```

### Modal de Desafio:
```
┌─────────────────────────────────────────┐
│ 🏆 Desafio de Vaga - Lista 02          │
│ Desafie o 8º da Lista 02 para          │
│ conquistar uma vaga!                    │
├─────────────────────────────────────────┤
│                                         │
│ Connor vai desafiar Bant (8º da Lista  │
│ 02)                                     │
│ Formato: MD3 (melhor de 3) • Se vencer,│
│ assume a 8ª posição                     │
│                                         │
│ Escolha 1 pista para iniciar:          │
│ [_____________________________]         │
│ O desafiado escolherá as outras 2      │
│ pistas ao aceitar                       │
│                                         │
│ [Cancelar]  [Enviar Desafio]           │
└─────────────────────────────────────────┘
```

---

## 📊 Fluxo Completo

```
1. Admin marca "Completou iniciação"
   ↓
2. Flag elegivel_desafio_vaga = true
   ↓
3. Piloto faz login
   ↓
4. Card verde aparece na página inicial
   ↓
5. Piloto clica em "Desafiar Vaga Lista 2"
   ↓
6. Modal abre
   ↓
7. Piloto escolhe 1 pista
   ↓
8. Clica em "Enviar Desafio"
   ↓
9. Backend valida e cria desafio
   ↓
10. Flag elegivel_desafio_vaga = false (reset)
   ↓
11. Desafio enviado para o 8º da Lista 02
   ↓
12. 8º tem 24h para aceitar
   ↓
13. Se aceitar: MD3 começa
   ↓
14. Se vencer: Piloto assume 8ª posição
```

---

## 🚀 Próximos Passos (Opcional)

### 1. Notificações Discord
- [ ] Notificar quando desafio de vaga é enviado
- [ ] Notificar quando desafio é aceito
- [ ] Notificar resultado do desafio

### 2. Histórico de Desafios de Vaga
- [ ] Mostrar histórico na aba "Histórico"
- [ ] Filtro específico para desafios de vaga

### 3. Estatísticas
- [ ] Quantos desafios de vaga foram enviados
- [ ] Taxa de sucesso
- [ ] Tempo médio para aceitar

---

## ✅ Checklist de Implementação

- [x] Backend: Flag `elegivelDesafioVaga`
- [x] Backend: Tipo `'desafio-vaga'`
- [x] Backend: Função `tryDesafioVaga()`
- [x] Backend: Validações completas
- [x] Backend: Reset automático da flag
- [x] UI: Componente `DesafioVagaButton`
- [x] UI: Card na página inicial
- [x] UI: Modal de configuração
- [x] UI: Integração com backend
- [x] UI: Mensagens de erro/sucesso
- [x] Admin: Botão separado para marcar iniciação
- [x] Admin: Badge "✓ Elegível Vaga Lista 2"
- [ ] Migração SQL executada (MIGRATION_DESAFIO_VAGA.sql)
- [ ] Notificações Discord (opcional)

---

## 📝 Notas Importantes

1. **Migração SQL**: Execute `MIGRATION_DESAFIO_VAGA.sql` no SQL Editor do Supabase para adicionar a coluna `elegivel_desafio_vaga` se ainda não foi executado.

2. **Reset Automático**: A flag `elegivel_desafio_vaga` é automaticamente resetada para `false` após enviar o desafio. Isso impede que o piloto envie múltiplos desafios seguidos.

3. **Validação de Pista**: O desafio começa com 1 pista escolhida pelo desafiante. O desafiado escolhe as outras 2 ao aceitar.

4. **Formato MD3**: Desafio de vaga é sempre MD3 (melhor de 3), igual aos desafios de ladder.

5. **Posição**: Se o desafiante vencer, ele assume a 8ª posição da Lista 02. O piloto derrotado é removido da lista.

---

**Última Atualização**: 2026-04-15  
**Status**: ✅ COMPLETO E PRONTO PARA TESTE
