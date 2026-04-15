# 🤖 Webhooks Discord Separados

## ✅ Configuração Completa

Os webhooks foram separados em dois canais diferentes:

### 1️⃣ Webhook de RESULTADOS (Campeonatos)
**Variável:** `VITE_DISCORD_WEBHOOK_RESULTS_URL`
**Configurado:** ✅ `https://discord.com/api/webhooks/1493812023945990164/...`

**Envia notificações de:**
- ✅ Resultados de corridas (posições + pontos + pista)
- ✅ Campeonato criado
- ✅ Piloto inscrito
- ✅ Campeonato iniciado
- ✅ Campeonato finalizado (pódio + classificação)

---

### 2️⃣ Webhook de DESAFIOS (X1 das Listas)
**Variável:** `VITE_DISCORD_WEBHOOK_CHALLENGES_URL`
**Status:** ⚠️ **Aguardando configuração**

**Enviará notificações de:**
- ✅ Novo desafio criado
- ✅ Desafio aceito (com pistas MD3)
- ✅ Resultado do desafio (placar final)
- ✅ Desafio cancelado
- ✅ W.O. (walk over)
- ✅ Desafios de iniciação
- ✅ Snapshot da ordem das listas

---

## 🔧 Como Configurar o Segundo Webhook

### Passo 1: Criar Webhook no Discord

1. Abra o **segundo canal** do Discord (para desafios)
2. Clique em ⚙️ **Configurações do Canal**
3. Vá em **Integrações** → **Webhooks**
4. Clique em **Novo Webhook**
5. **Copie a URL** do webhook

### Passo 2: Adicionar no `.env`

Edite o arquivo `.env` e adicione o URL do segundo webhook:

```env
# Webhook para DESAFIOS (x1 das listas)
VITE_DISCORD_WEBHOOK_CHALLENGES_URL=https://discord.com/api/webhooks/SEU_WEBHOOK_AQUI
```

### Passo 3: Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

---

## 📊 Arquivo `.env` Completo

```env
VITE_SUPABASE_URL=https://tfraqopkwqgwvutqnznh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XDoIms7iv0LhDr36NDINeg_pUBlBee4

# Discord Webhooks - Separados por tipo
# Webhook para RESULTADOS de corridas (campeonatos)
VITE_DISCORD_WEBHOOK_RESULTS_URL=https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X

# Webhook para DESAFIOS (x1 das listas) - adicione o URL do segundo webhook aqui
VITE_DISCORD_WEBHOOK_CHALLENGES_URL=
```

---

## 🎯 Como Funciona

### Automático e Separado!

**Canal de Resultados** receberá:
```
🔵 Resultado — corrida 1

1º — Evojota (20pts)
2º — Lunatic (17pts)
3º — Sant (15pts)

Campeonato: Temporada 2026
Pista: Tokyo Highway
```

**Canal de Desafios** receberá:
```
🟢 Desafio finalizado

Lunatic venceu Sant e subiu para posição #2 na Lista 01.
Placar: 2 × 1

Pistas (MD3):
Pista 1: Tokyo Highway
Pista 2: Osaka Loop
Pista 3: Yokohama Bay
```

---

## 🧪 Testar Separação

### Teste de Resultados (já configurado)
```bash
node test-discord.cjs
```
Deve aparecer no canal de **resultados**.

### Teste de Desafios (após configurar)
Crie um desafio na app e veja aparecer no canal de **desafios**.

---

## 📝 Resumo das Mudanças

### Código Atualizado:
- ✅ `src/lib/discord.ts` - Função `sendDiscordWebhook` agora aceita parâmetro `type`
- ✅ Todas as funções de desafios usam `type: 'challenges'`
- ✅ Todas as funções de campeonato usam `type: 'results'`
- ✅ `.env` configurado com dois webhooks separados

### Arquivos Modificados:
- `src/lib/discord.ts` - Lógica de webhooks separados
- `.env` - Configuração dos dois webhooks
- `.env.example` - Atualizado com exemplo

---

## ⚠️ Importante

### Webhook de Resultados
✅ **JÁ ESTÁ FUNCIONANDO!**
- Configurado e testado
- Enviando para: `...1493812023945990164/...`

### Webhook de Desafios
⚠️ **AGUARDANDO CONFIGURAÇÃO**
- Crie o webhook no Discord
- Adicione no `.env`
- Reinicie o servidor

---

## 🎨 Vantagens da Separação

### Organização
- ✅ Resultados de corridas em um canal
- ✅ Desafios (x1) em outro canal
- ✅ Fácil de acompanhar cada tipo

### Flexibilidade
- ✅ Pode ter permissões diferentes
- ✅ Pode ter notificações diferentes
- ✅ Pode desativar um sem afetar o outro

### Clareza
- ✅ Cada canal tem um propósito específico
- ✅ Menos confusão nas mensagens
- ✅ Melhor experiência para os membros

---

## 🚀 Próximos Passos

1. **Criar segundo webhook** no Discord (canal de desafios)
2. **Adicionar URL** no `.env`
3. **Reiniciar servidor**
4. **Testar** criando um desafio

**Pronto!** Os dois canais estarão recebendo notificações separadas! 🎉

---

**Midnight Club 夜中** - Webhooks separados configurados! 🤖
