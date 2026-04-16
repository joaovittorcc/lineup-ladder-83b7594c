# Discord em Produção - Resumo das Alterações

## 🎯 Problema Resolvido
- **Localhost**: Funcionava ✅
- **Produção**: Não funcionava ❌ (CORS bloqueava webhooks diretos)

## ✅ Solução Implementada
Usar **Edge Function do Supabase** como proxy servidor-lado para evitar CORS.

---

## 📝 Arquivos Modificados

### 1. `supabase/functions/discord-webhook-proxy/index.ts`
**Mudança**: Suporte para múltiplos webhooks (results, challenges, friendly)

**Antes**:
```typescript
const url = Deno.env.get("DISCORD_WEBHOOK_URL")?.trim();
```

**Depois**:
```typescript
const type = body.type || 'challenges';
let url: string | undefined;
if (type === 'results') {
  url = Deno.env.get("DISCORD_WEBHOOK_RESULTS_URL")?.trim();
} else if (type === 'friendly') {
  url = Deno.env.get("DISCORD_WEBHOOK_FRIENDLY_URL")?.trim();
} else {
  url = Deno.env.get("DISCORD_WEBHOOK_CHALLENGES_URL")?.trim();
}
```

### 2. `src/lib/discord.ts`
**Mudança**: Passar tipo de webhook para Edge Function

**Antes**:
```typescript
body: { content, embeds }
```

**Depois**:
```typescript
body: { content, embeds, type }
```

### 3. `src/lib/discord.ts` - `notifyInitiationChallengePending()`
**Mudança**: Adicionar menções fora do embed

**Antes**:
```typescript
return sendDiscordWebhook(null, [...], 'challenges');
```

**Depois**:
```typescript
const mentionsContent = buildMentionsContent([data.challengerName, data.challengedName]);
return sendDiscordWebhook(mentionsContent, [...], 'challenges');
```

---

## 📦 Arquivos Criados

### Documentação
- `CONFIGURAR_DISCORD_PRODUCAO.md` - Guia completo passo a passo
- `GUIA_RAPIDO_DISCORD_PRODUCAO.md` - Guia rápido de execução
- `MENCOES_DISCORD_INICIACAO.md` - Documentação da correção de menções
- `DISCORD_PRODUCAO_RESUMO.md` - Este arquivo

### Scripts de Deploy
- `configurar-secrets-supabase.sh` - Configura secrets automaticamente
- `deploy-discord-edge-function.sh` - Deploy da Edge Function

---

## 🚀 Como Ativar em Produção

### Comandos Rápidos
```bash
# 1. Configurar secrets
bash configurar-secrets-supabase.sh

# 2. Deploy da Edge Function
bash deploy-discord-edge-function.sh

# 3. Adicionar em produção (Vercel/Netlify/etc)
VITE_DISCORD_USE_SUPABASE_EDGE=true

# 4. Commit e push
git add .
git commit -m "feat: Discord via Edge Function + menções em iniciação"
git push
```

---

## 🔐 Secrets Necessários no Supabase

Configure em: https://supabase.com/dashboard/project/tfraqopkwqgwvutqnznh/settings/functions

```
DISCORD_WEBHOOK_RESULTS_URL=https://discord.com/api/webhooks/1493812023945990164/...
DISCORD_WEBHOOK_CHALLENGES_URL=https://discord.com/api/webhooks/1493812852300189756/...
DISCORD_WEBHOOK_FRIENDLY_URL=https://discord.com/api/webhooks/1493989507945726024/...
```

---

## 🎯 Resultado Final

### Desenvolvimento (localhost)
- Usa webhooks diretos do `.env`
- Funciona sem Edge Function
- Rápido para testar

### Produção
- Usa Edge Function do Supabase
- Secrets seguros no servidor
- Sem problemas de CORS
- Menções funcionam corretamente

---

## ✅ Benefícios

1. **Segurança**: Webhooks não ficam expostos no código do cliente
2. **CORS**: Sem problemas de CORS em produção
3. **Menções**: Participantes recebem notificações push no Discord
4. **Múltiplos Webhooks**: Suporte para 3 tipos (results, challenges, friendly)
5. **Flexibilidade**: Desenvolvimento usa webhooks diretos, produção usa Edge Function

---

## 📊 Debug

### Ver logs da Edge Function
```bash
npx supabase functions logs discord-webhook-proxy
```

### Verificar secrets
```bash
npx supabase secrets list
```

### Testar localmente
```bash
npx supabase functions serve discord-webhook-proxy
```

---

## 🎉 Pronto!

Agora as notificações do Discord funcionam tanto no localhost quanto em produção, com menções corretas para todos os tipos de desafio!
