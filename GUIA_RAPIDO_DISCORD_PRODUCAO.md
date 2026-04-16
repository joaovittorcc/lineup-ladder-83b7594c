# Guia Rápido: Ativar Discord em Produção

## 🎯 Objetivo
Fazer as notificações do Discord funcionarem no site em produção (atualmente só funciona no localhost).

---

## ⚡ Execução Rápida (3 comandos)

```bash
# 1. Configurar secrets no Supabase (lê do .env automaticamente)
bash configurar-secrets-supabase.sh

# 2. Deploy da Edge Function
bash deploy-discord-edge-function.sh

# 3. Adicionar variável de ambiente em PRODUÇÃO
# No seu serviço de hospedagem (Vercel/Netlify/etc):
VITE_DISCORD_USE_SUPABASE_EDGE=true
```

Depois faça commit, push e teste!

---

## 📋 Passo a Passo Detalhado

### 1. Login no Supabase (primeira vez)

```bash
npx supabase login
```

### 2. Link com o projeto

```bash
npx supabase link --project-ref tfraqopkwqgwvutqnznh
```

### 3. Configurar secrets

**Opção A: Automático (recomendado)**
```bash
bash configurar-secrets-supabase.sh
```

**Opção B: Manual**
```bash
npx supabase secrets set DISCORD_WEBHOOK_RESULTS_URL=https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X

npx supabase secrets set DISCORD_WEBHOOK_CHALLENGES_URL=https://discord.com/api/webhooks/1493812852300189756/mozb4Dm4mFoz0YUYyQeo_D6jF9brsxMCO33tJ0Ie4TBuCAmHCU8FRAbECh-12FFdmnnO

npx supabase secrets set DISCORD_WEBHOOK_FRIENDLY_URL=https://discord.com/api/webhooks/1493989507945726024/3pE4dAbkrvAZUs7PdVacfrWSNBzrcXYySG4LhNM9RA4ZowOm3h0pZuxbpdXPQ4CS8g29
```

### 4. Deploy da Edge Function

```bash
bash deploy-discord-edge-function.sh
```

Ou manualmente:
```bash
npx supabase functions deploy discord-webhook-proxy
```

### 5. Configurar variável de ambiente em PRODUÇÃO

No seu serviço de hospedagem (Vercel, Netlify, etc.), adicione:

```
VITE_DISCORD_USE_SUPABASE_EDGE=true
```

**Importante**: Você pode manter as variáveis de webhook direto no `.env` local (para desenvolvimento), mas em produção só precisa da variável acima.

### 6. Commit e Push

```bash
git add .
git commit -m "feat: configurar Discord via Edge Function para produção"
git push
```

### 7. Testar

1. Aguarde o deploy em produção
2. Acesse o site em produção
3. Crie um desafio
4. Verifique se a mensagem aparece no Discord com menções

---

## 🔍 Debug

### Ver logs da Edge Function

```bash
npx supabase functions logs discord-webhook-proxy
```

Ou no dashboard:
https://supabase.com/dashboard/project/tfraqopkwqgwvutqnznh/logs/edge-functions

### Verificar secrets configurados

```bash
npx supabase secrets list
```

### Testar Edge Function localmente

```bash
npx supabase functions serve discord-webhook-proxy
```

---

## 🎯 Como Funciona

### Localhost (desenvolvimento)
```
App → Webhook Discord direto
```
- Usa variáveis `VITE_DISCORD_WEBHOOK_*_URL` do `.env`
- Funciona porque não há restrições CORS no localhost

### Produção
```
App → Edge Function (Supabase) → Webhook Discord
```
- Usa `VITE_DISCORD_USE_SUPABASE_EDGE=true`
- Edge Function lê secrets do Supabase
- Evita problemas de CORS (servidor-lado)

---

## ✅ Checklist

- [ ] Login no Supabase (`npx supabase login`)
- [ ] Link com projeto (`npx supabase link`)
- [ ] Configurar 3 secrets (RESULTS, CHALLENGES, FRIENDLY)
- [ ] Deploy da Edge Function
- [ ] Adicionar `VITE_DISCORD_USE_SUPABASE_EDGE=true` em produção
- [ ] Commit e push
- [ ] Testar em produção

---

## 📚 Documentação Completa

Para mais detalhes, veja: `CONFIGURAR_DISCORD_PRODUCAO.md`
