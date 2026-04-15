# 🚀 Guia Rápido - Webhook Discord

## ⚡ Configuração em 3 Passos

### 1️⃣ Criar Webhook no Discord
1. Abra o canal do Discord
2. Configurações → Integrações → Webhooks → Novo Webhook
3. Copie a URL

### 2️⃣ Configurar no Projeto
Edite o arquivo `.env`:
```env
VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/SEU_WEBHOOK_AQUI
```

### 3️⃣ Reiniciar
```bash
npm run dev
```

## ✅ O que será notificado automaticamente

### 📊 Campeonatos
- ✅ Resultado de cada corrida (posições + pontos)
- ✅ Campeonato criado
- ✅ Piloto inscrito
- ✅ Campeonato iniciado
- ✅ Campeonato finalizado (pódio + classificação)

### 🏁 Desafios (Ladder)
- ✅ Novo desafio criado
- ✅ Desafio aceito (com pistas MD3)
- ✅ Resultado do desafio (placar final)
- ✅ Desafio cancelado
- ✅ W.O. (vitória por ausência)

### 🎯 Iniciação
- ✅ Desafio de iniciação pendente
- ✅ Resultado MD1

### 📋 Listas
- ✅ Snapshot da ordem atual

## 🔧 Opção Avançada (Produção)

Para produção, use Supabase Edge Function (mais seguro):

```env
VITE_DISCORD_USE_SUPABASE_EDGE=true
```

Depois faça deploy:
```bash
supabase functions deploy discord-webhook-proxy
```

E configure o secret no Dashboard do Supabase:
- Nome: `DISCORD_WEBHOOK_URL`
- Valor: URL do webhook

## 📝 Exemplo de Notificação

Quando você salvar um resultado de corrida, o Discord receberá:

```
🔵 Resultado — corrida 1

1º — Evojota (20pts)
2º — Lunatic (17pts)
3º — Sant (15pts)
NP — Flpn (0pts)

Campeonato: Temporada 2026
Pista: Tokyo Highway
```

## ❓ Problemas?

1. **Notificações não aparecem?**
   - Verifique se o `.env` está configurado
   - Reinicie o servidor (`Ctrl+C` e `npm run dev`)
   - Veja o console do navegador (F12)

2. **Erro de CORS?**
   - Use a opção avançada com Edge Function

---

**Pronto!** Agora todas as atualizações serão enviadas automaticamente para o Discord! 🎉
