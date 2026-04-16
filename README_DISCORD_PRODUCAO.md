# 🎯 Discord em Produção - Guia Completo

## 📋 Problema
- ✅ **Localhost**: Notificações funcionam
- ❌ **Produção**: Notificações não funcionam (CORS)

## 🔧 Solução
Usar **Edge Function do Supabase** como proxy servidor-lado.

---

## ⚡ Execução Rápida (5 minutos)

### 1️⃣ Configurar Secrets
```bash
bash configurar-secrets-supabase.sh
```

### 2️⃣ Deploy da Edge Function
```bash
bash deploy-discord-edge-function.sh
```

### 3️⃣ Adicionar Variável em Produção
No seu serviço de hospedagem (Vercel/Netlify/etc):
```
VITE_DISCORD_USE_SUPABASE_EDGE=true
```

### 4️⃣ Commit e Push
```bash
git add .
git commit -m "feat: Discord via Edge Function"
git push
```

### 5️⃣ Testar
Crie um desafio no site em produção e verifique o Discord!

---

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| `GUIA_RAPIDO_DISCORD_PRODUCAO.md` | Guia rápido passo a passo |
| `CONFIGURAR_DISCORD_PRODUCAO.md` | Documentação completa e detalhada |
| `COMANDOS_DISCORD_PRODUCAO.txt` | Comandos prontos para copiar |
| `DISCORD_PRODUCAO_RESUMO.md` | Resumo das alterações técnicas |
| `MENCOES_DISCORD_INICIACAO.md` | Correção de menções em iniciação |

---

## 🔍 Debug

### Ver Logs
```bash
npx supabase functions logs discord-webhook-proxy
```

### Verificar Secrets
```bash
npx supabase secrets list
```

### Dashboard
https://supabase.com/dashboard/project/tfraqopkwqgwvutqnznh/logs/edge-functions

---

## ✅ Alterações Implementadas

### 1. Edge Function Atualizada
- ✅ Suporte para 3 tipos de webhook (results, challenges, friendly)
- ✅ Lê secrets do Supabase (seguro)
- ✅ Evita CORS

### 2. Código Atualizado
- ✅ `src/lib/discord.ts` passa tipo de webhook para Edge Function
- ✅ Menções adicionadas em `notifyInitiationChallengePending()`
- ✅ Participantes recebem notificações push

### 3. Scripts Criados
- ✅ `configurar-secrets-supabase.sh` - Configura secrets automaticamente
- ✅ `deploy-discord-edge-function.sh` - Deploy da Edge Function

---

## 🎯 Como Funciona

### Desenvolvimento (localhost)
```
App → Webhook Discord (direto)
```
- Usa `.env` local
- Rápido para testar

### Produção
```
App → Edge Function → Webhook Discord
```
- Usa secrets do Supabase
- Sem problemas de CORS
- Seguro (webhooks não expostos)

---

## 🚀 Próximos Passos

1. Execute os comandos acima
2. Configure a variável em produção
3. Faça commit e push
4. Teste criando um desafio
5. Verifique se as menções funcionam no Discord

---

## 💡 Dicas

- **Primeira vez?** Leia `GUIA_RAPIDO_DISCORD_PRODUCAO.md`
- **Problemas?** Veja os logs com `npx supabase functions logs discord-webhook-proxy`
- **Dúvidas técnicas?** Consulte `CONFIGURAR_DISCORD_PRODUCAO.md`

---

## 🎉 Resultado

Após seguir este guia:
- ✅ Notificações funcionam em localhost
- ✅ Notificações funcionam em produção
- ✅ Menções funcionam corretamente
- ✅ Webhooks seguros (não expostos no código)
- ✅ Suporte para 3 tipos de notificação

---

**Pronto para começar?** Execute: `bash configurar-secrets-supabase.sh`
