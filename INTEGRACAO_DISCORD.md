# Integração Discord - Midnight Club

## 📋 Visão Geral

A integração com Discord permite que todas as atualizações de **resultados de corridas** e **desafios da lista** sejam automaticamente enviadas para um canal do Discord através de webhooks.

## 🎯 Funcionalidades

### Notificações de Desafios (Ladder)
- ✅ **Novo desafio criado** - Quando um piloto desafia outro
- ✅ **Desafio aceito** - Quando o desafiado aceita (com pistas MD3)
- ✅ **Resultado do desafio** - Quando o desafio é finalizado (com placar)
- ✅ **Desafio cancelado** - Quando é recusado ou cancelado
- ✅ **W.O. (Walk Over)** - Quando há vitória por ausência

### Notificações de Iniciação
- ✅ **Desafio de iniciação pendente** - Aguarda aprovação do admin
- ✅ **Resultado de iniciação** - Resultado MD1 da corrida

### Notificações de Campeonato
- ✅ **Campeonato criado** - Quando uma nova temporada é criada
- ✅ **Piloto inscrito** - Quando um piloto se inscreve
- ✅ **Campeonato iniciado** - Lista de todos os pilotos confirmados
- ✅ **Resultado de corrida** - Resultado completo de cada corrida com posições e pontos
- ✅ **Campeonato finalizado** - Classificação final com pódio

### Snapshot de Listas
- ✅ **Ordem atual da lista** - Snapshot textual da ordem dos pilotos

## 🔧 Configuração

### Opção 1: Webhook Direto (Recomendado para desenvolvimento)

1. **Criar webhook no Discord:**
   - Abra o canal do Discord onde deseja receber as notificações
   - Clique em ⚙️ Configurações do Canal
   - Vá em **Integrações** → **Webhooks**
   - Clique em **Novo Webhook**
   - Copie a URL do webhook

2. **Configurar no projeto:**
   - Abra o arquivo `.env` (crie se não existir, baseado no `.env.example`)
   - Adicione a linha:
   ```env
   VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/SEU_WEBHOOK_AQUI
   ```

3. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

### Opção 2: Via Supabase Edge Function (Recomendado para produção)

Esta opção é mais segura pois o webhook URL não fica exposto no código do cliente.

1. **Criar webhook no Discord** (mesmo processo da Opção 1)

2. **Configurar secret no Supabase:**
   - Acesse o Dashboard do Supabase
   - Vá em **Edge Functions** → **Secrets**
   - Adicione um novo secret:
     - Nome: `DISCORD_WEBHOOK_URL`
     - Valor: URL do webhook do Discord

3. **Deploy da Edge Function:**
   ```bash
   supabase functions deploy discord-webhook-proxy
   ```

4. **Configurar no projeto:**
   - No arquivo `.env`, adicione:
   ```env
   VITE_DISCORD_USE_SUPABASE_EDGE=true
   ```

5. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

## 📊 Exemplos de Notificações

### Desafio Criado
```
🟡 Novo desafio na lista
Lunatic desafiou Sant pelo top 2 da Lista 01.
Aguarda aceitação na app (24h) ou W.O.

Lista: Lista 01
Posição em jogo: Top 2
```

### Resultado de Corrida (Campeonato)
```
🔵 Resultado — corrida 1
1º — Evojota (20pts)
2º — Lunatic (17pts)
3º — Sant (15pts)
NP — Flpn (0pts)

Campeonato: Temporada 2026
Pista: Tokyo Highway
```

### Desafio Finalizado
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

## 🎨 Cores das Notificações

- 🟡 **Amarelo** - Desafios pendentes, campeonato iniciado
- 🟢 **Verde** - Vitórias, pilotos inscritos
- 🔵 **Azul** - Resultados de corridas, defesas bem-sucedidas
- 🔴 **Vermelho** - Cancelamentos
- 🟣 **Rosa** - Novos campeonatos, desafios aceitos

## 🔍 Troubleshooting

### Notificações não aparecem

1. **Verifique o arquivo .env:**
   - Certifique-se de que `VITE_DISCORD_WEBHOOK_URL` está configurado
   - Ou `VITE_DISCORD_USE_SUPABASE_EDGE=true` se usar Edge Function

2. **Reinicie o servidor:**
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```

3. **Verifique o console do navegador:**
   - Abra as DevTools (F12)
   - Procure por mensagens de erro relacionadas a Discord

4. **Teste o webhook manualmente:**
   ```bash
   curl -X POST "SEU_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"content": "Teste de webhook"}'
   ```

### Erro de CORS

Se você receber erros de CORS ao usar webhook direto, use a **Opção 2** (Supabase Edge Function) que resolve esse problema.

## 📝 Notas Importantes

- ⚠️ **Nunca faça commit do arquivo `.env`** com o webhook URL real
- 🔒 Para produção, sempre use a Opção 2 (Edge Function)
- 📊 As notificações são enviadas automaticamente quando:
  - Um desafio é criado, aceito ou finalizado
  - Um resultado de corrida é salvo
  - Um campeonato é criado, iniciado ou finalizado
  - Um piloto se inscreve em um campeonato

## 🚀 Próximos Passos

Após configurar o webhook, todas as atualizações serão enviadas automaticamente para o Discord. Não é necessário nenhuma ação manual adicional!

---

**Midnight Club 夜中** - Sistema de gerenciamento de corridas e desafios
