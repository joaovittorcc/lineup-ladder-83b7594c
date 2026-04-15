# 🤖 Bot Discord - Notificações de X1 (Desafios)

## ✅ Configuração Completa

**Webhook configurado:** ✅
```
https://discord.com/api/webhooks/1493812023945990164/...
```

## 🎯 O que o Bot Faz Automaticamente

### 1️⃣ Quando um X1 é Criado
**Mensagem enviada:**
```
🟡 Novo desafio na lista

Lunatic desafiou Sant pelo top 2 da Lista 01.
Aguarda aceitação na app (24h) ou W.O.

Lista: Lista 01
Posição em jogo: Top 2
```

**Informações incluídas:**
- ✅ Nome do desafiante
- ✅ Nome do desafiado
- ✅ Posição em disputa
- ✅ Lista (01, 02, Iniciação, etc.)

---

### 2️⃣ Quando o X1 é Aceito
**Mensagem enviada:**
```
🟣 Desafio aceite

Sant aceitou o desafio de Lunatic na Lista 01.

Confronto: Lunatic (3º) vs Sant (2º)
Lista: Lista 01
Formato: MD3
Pistas:
Pista 1: Tokyo Highway
Pista 2: Osaka Loop
Pista 3: Yokohama Bay
```

**Informações incluídas:**
- ✅ Quem aceitou
- ✅ Posições dos pilotos
- ✅ Formato (MD3 = melhor de 3)
- ✅ **Todas as 3 pistas escolhidas**

---

### 3️⃣ Quando o X1 é Finalizado
**Mensagem enviada:**
```
🟢 Desafio finalizado

Lunatic venceu Sant e subiu para posição #2 na Lista 01.
Placar: 2 × 1

Lista: Lista 01
Antes (ordem): Lunatic (3º) vs Sant (2º)
Pistas (MD3):
Pista 1: Tokyo Highway
Pista 2: Osaka Loop
Pista 3: Yokohama Bay
```

**Informações incluídas:**
- ✅ **Quem venceu**
- ✅ **Quem perdeu**
- ✅ **Placar final** (ex: 2×1, 2×0)
- ✅ Posições antes do desafio
- ✅ **Todas as 3 pistas**
- ✅ Mudança de posição na lista

---

### 4️⃣ Quando há W.O. (Walk Over)
**Mensagem enviada:**
```
🟡 Desafio — W.O.

Lunatic venceu por W.O. — Sant não cumpriu o prazo ou a corrida.
Placar: W.O. (2 × 0)

Lista: Lista 01
Antes (ordem): Lunatic (3º) vs Sant (2º)
```

**Informações incluídas:**
- ✅ Quem venceu por W.O.
- ✅ Motivo (não cumpriu prazo)
- ✅ Placar W.O.

---

### 5️⃣ Quando o X1 é Cancelado
**Mensagem enviada:**
```
🔴 Desafio cancelado

Sant recusou ou cancelou o desafio de Lunatic pelo top 2 na Lista 01.

Lista: Lista 01
Posição: Top 2
```

---

## 🎨 Cores das Notificações

- 🟡 **Amarelo** - Desafio criado (aguardando)
- 🟣 **Rosa** - Desafio aceito (vai rolar!)
- 🟢 **Verde** - Desafio finalizado (vitória)
- 🔴 **Vermelho** - Desafio cancelado
- 🟡 **Amarelo** - W.O.

---

## 📋 Tipos de Desafios Suportados

### Lista 01 (Midnight Drivers)
- ✅ Desafios entre pilotos da Lista 01
- ✅ Formato MD3 (melhor de 3)
- ✅ Mostra todas as pistas

### Lista 02 (Night Drivers)
- ✅ Desafios entre pilotos da Lista 02
- ✅ Formato MD3
- ✅ Mostra todas as pistas

### Cross-List (L02 → L01)
- ✅ Desafio do último da L02 para o último da L01
- ✅ Formato MD3
- ✅ Mostra todas as pistas

### Street Runner → Lista 02
- ✅ Desafio externo para entrar na L02
- ✅ Formato MD3
- ✅ Mostra todas as pistas

### Iniciação (Joker)
- ✅ Desafio de iniciação
- ✅ Formato MD1 (corrida única)
- ✅ Aguarda aprovação do admin

---

## 🚀 Como Funciona

### Automático! Sem ação necessária

1. **Você cria um desafio na app** → Bot envia notificação
2. **Desafio é aceito** → Bot envia notificação com pistas
3. **Você registra os resultados** → Bot envia resultado final

**Tudo automático!** Não precisa fazer nada no Discord.

---

## 🧪 Testar Agora

### Opção 1: Teste no Console (F12)

```javascript
// Teste básico de conexão
testDiscordWebhook()

// Teste de desafio completo
testChallengeNotification()
```

### Opção 2: Teste Real

1. Abra a app
2. Vá para Lista 01 ou Lista 02
3. Crie um desafio
4. **Verifique o Discord** - deve aparecer a notificação!

---

## 📊 Exemplo Completo de Fluxo

### Cenário: Lunatic desafia Sant

**1. Desafio criado:**
```
🟡 Novo desafio na lista
Lunatic desafiou Sant pelo top 2 da Lista 01.
```

**2. Sant aceita e escolhe pistas:**
```
🟣 Desafio aceite
Sant aceitou o desafio de Lunatic na Lista 01.

Pistas:
Pista 1: Tokyo Highway
Pista 2: Osaka Loop
Pista 3: Yokohama Bay
```

**3. Corridas acontecem:**
- Corrida 1: Lunatic vence
- Corrida 2: Sant vence
- Corrida 3: Lunatic vence

**4. Resultado final:**
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

## ⚠️ Importante

### Reinicie o servidor para ativar!

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

Após reiniciar, o bot estará **100% ativo** e enviará todas as notificações automaticamente! 🎉

---

## 🔧 Configuração Atual

```env
VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1493812023945990164/...
```

✅ **Configurado e pronto para usar!**

---

## 📝 Resumo

O bot vai enviar automaticamente para o Discord:

✅ **Quem desafiou quem**
✅ **Qual lista**
✅ **Qual posição em jogo**
✅ **Quando foi aceito**
✅ **Quais as 3 pistas (MD3)**
✅ **Resultado final (placar)**
✅ **Quem venceu e quem perdeu**
✅ **Mudança de posição**

**Tudo automático, sem precisar fazer nada manualmente!** 🚀

---

**Midnight Club 夜中** - Bot Discord ativo! 🤖
