# 🧪 Como Testar o Webhook Discord

## 📋 Pré-requisitos

1. ✅ Webhook criado no Discord
2. ✅ `.env` configurado com `VITE_DISCORD_WEBHOOK_URL`
3. ✅ Servidor rodando (`npm run dev`)

## 🎯 Testes Disponíveis

### 1. Teste Básico (Console do Navegador)

Abra o console do navegador (F12) e execute:

```javascript
// Teste de conexão básica
testDiscordWebhook()
```

**Resultado esperado:**
- ✅ Mensagem no console: "Webhook enviado com sucesso!"
- ✅ Mensagem no Discord com título "Teste de Integração Discord"

---

### 2. Teste de Notificação de Corrida

No console do navegador:

```javascript
// Teste de resultado de corrida
testRaceResultNotification()
```

**Resultado esperado:**
- ✅ Mensagem no Discord com:
  - Título: "Resultado — corrida 1"
  - Classificação: Evojota (1º), Lunatic (2º), Sant (3º), Flpn (NP)
  - Campeonato: "Temporada de Teste"
  - Pista: "Tokyo Highway"

---

### 3. Teste de Notificação de Desafio

No console do navegador:

```javascript
// Teste de resultado de desafio
testChallengeNotification()
```

**Resultado esperado:**
- ✅ Mensagem no Discord com:
  - Título: "Desafio finalizado"
  - Descrição: "Lunatic venceu Sant..."
  - Placar: 2 × 1
  - Pistas MD3

---

## 🏁 Teste Real - Resultado de Corrida

### Passo a Passo:

1. **Abra a aplicação** (`http://localhost:5173`)

2. **Vá para a aba "Campeonato"**

3. **Crie um campeonato de teste** (se não houver):
   - Nome: "Teste Webhook"
   - Número de corridas: 3
   - Adicione alguns pilotos

4. **Inicie o campeonato**

5. **Adicione resultados para a Corrida 1:**
   - Selecione a corrida 1
   - Defina as posições dos pilotos
   - Clique em "Salvar Resultados"

6. **Verifique o Discord:**
   - Deve aparecer uma mensagem com o resultado da corrida
   - Com todas as posições e pontos

---

## 🎯 Teste Real - Desafio

### Passo a Passo:

1. **Vá para a aba "Lista 01" ou "Lista 02"**

2. **Crie um desafio:**
   - Clique em um piloto
   - Selecione "Desafiar"
   - Escolha o oponente

3. **Verifique o Discord:**
   - ✅ Deve aparecer: "Novo desafio na lista"

4. **Aceite o desafio:**
   - Clique no desafio pendente
   - Clique em "Aceitar"
   - Defina as pistas MD3

5. **Verifique o Discord:**
   - ✅ Deve aparecer: "Desafio aceite" (com pistas)

6. **Complete o desafio:**
   - Registre os resultados das 3 corridas
   - Finalize o desafio

7. **Verifique o Discord:**
   - ✅ Deve aparecer: "Desafio finalizado" (com placar)

---

## 🔍 Verificação de Problemas

### ❌ Nenhuma mensagem aparece no Discord

**Checklist:**

```bash
# 1. Verificar se o .env está configurado
cat .env | grep DISCORD

# 2. Verificar se o servidor está rodando
# Deve mostrar: Local: http://localhost:5173

# 3. Reiniciar o servidor
# Ctrl+C para parar
npm run dev
```

**No console do navegador (F12):**
- Procure por erros relacionados a "Discord"
- Procure por mensagens de "[Discord]"

---

### ❌ Erro de CORS

**Solução:** Use Edge Function

```env
# No .env, adicione:
VITE_DISCORD_USE_SUPABASE_EDGE=true
```

Depois faça deploy:
```bash
supabase functions deploy discord-webhook-proxy
```

E configure o secret no Supabase Dashboard.

---

### ❌ Mensagem "Sem notificação: define VITE_DISCORD_WEBHOOK_URL"

**Solução:**

1. Verifique se o `.env` existe na raiz do projeto
2. Verifique se a linha está correta:
   ```env
   VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```
3. **Importante:** Reinicie o servidor após editar o `.env`

---

## 📊 Teste Manual do Webhook

Para testar se o webhook está funcionando diretamente:

```bash
curl -X POST "https://discord.com/api/webhooks/SEU_WEBHOOK_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Teste manual do webhook",
    "embeds": [{
      "title": "Teste",
      "description": "Se você vê isso, o webhook funciona!",
      "color": 65280
    }]
  }'
```

Se este comando funcionar, o problema está na configuração do projeto.

---

## ✅ Checklist Final

Antes de considerar o teste completo, verifique:

- [ ] Teste básico funcionou (console)
- [ ] Teste de corrida funcionou (console)
- [ ] Teste de desafio funcionou (console)
- [ ] Resultado de corrida real enviou notificação
- [ ] Desafio criado enviou notificação
- [ ] Desafio aceito enviou notificação
- [ ] Desafio completado enviou notificação

---

## 🎉 Tudo Funcionando?

Se todos os testes passaram, a integração está **100% funcional**!

Agora todas as atualizações de corridas e desafios serão automaticamente enviadas para o Discord.

---

## 📝 Logs Úteis

### Ver logs no console do navegador:

```javascript
// Ativar logs detalhados
localStorage.debug = '*'

// Desativar logs
localStorage.debug = ''
```

### Ver logs da Edge Function (se usar):

```bash
supabase functions logs discord-webhook-proxy --follow
```

---

**Midnight Club 夜中** - Sistema de gerenciamento de corridas e desafios
