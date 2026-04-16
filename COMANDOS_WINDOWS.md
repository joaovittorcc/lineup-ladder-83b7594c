# 🪟 Comandos para Windows (PowerShell)

## ⚡ Execução Rápida

### 1️⃣ Abrir PowerShell
Clique com botão direito na pasta do projeto → "Abrir no Terminal" ou "Open in Terminal"

### 2️⃣ Login no Supabase (primeira vez)
```powershell
npx supabase login
```

### 3️⃣ Link com o projeto
```powershell
npx supabase link --project-ref tfraqopkwqgwvutqnznh
```

### 4️⃣ Configurar secrets
```powershell
.\configurar-secrets-supabase.ps1
```

**Se der erro de execução de script**, execute primeiro:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 5️⃣ Deploy da Edge Function
```powershell
.\deploy-discord-edge-function.ps1
```

### 6️⃣ Commit e Push
```powershell
git add .
git commit -m "feat: Discord via Edge Function + menções em iniciação"
git push
```

### 7️⃣ Configurar variável em produção
No seu serviço de hospedagem (Vercel/Netlify/etc), adicione:
```
VITE_DISCORD_USE_SUPABASE_EDGE=true
```

---

## 🔧 Alternativa: Comandos Manuais

Se os scripts PowerShell não funcionarem, execute manualmente:

### Configurar Secrets
```powershell
npx supabase secrets set DISCORD_WEBHOOK_RESULTS_URL=https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X

npx supabase secrets set DISCORD_WEBHOOK_CHALLENGES_URL=https://discord.com/api/webhooks/1493812852300189756/mozb4Dm4mFoz0YUYyQeo_D6jF9brsxMCO33tJ0Ie4TBuCAmHCU8FRAbECh-12FFdmnnO

npx supabase secrets set DISCORD_WEBHOOK_FRIENDLY_URL=https://discord.com/api/webhooks/1493989507945726024/3pE4dAbkrvAZUs7PdVacfrWSNBzrcXYySG4LhNM9RA4ZowOm3h0pZuxbpdXPQ4CS8g29
```

### Deploy da Edge Function
```powershell
npx supabase functions deploy discord-webhook-proxy
```

---

## 🔍 Debug

### Ver logs
```powershell
npx supabase functions logs discord-webhook-proxy
```

### Verificar secrets
```powershell
npx supabase secrets list
```

---

## ✅ Checklist

- [ ] Login no Supabase
- [ ] Link com projeto
- [ ] Configurar 3 secrets
- [ ] Deploy da Edge Function
- [ ] Commit e push
- [ ] Adicionar `VITE_DISCORD_USE_SUPABASE_EDGE=true` em produção
- [ ] Testar em produção

---

## 💡 Dica

Se preferir, pode fazer tudo pelo dashboard do Supabase:
https://supabase.com/dashboard/project/tfraqopkwqgwvutqnznh/settings/functions
