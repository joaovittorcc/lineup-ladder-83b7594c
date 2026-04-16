# Script PowerShell para deploy da Edge Function do Discord no Supabase
# Execute: .\deploy-discord-edge-function.ps1

Write-Host "🚀 Deploy da Edge Function discord-webhook-proxy" -ForegroundColor Cyan
Write-Host ""

# Deploy da função
Write-Host "📦 Fazendo deploy..." -ForegroundColor Yellow
npx supabase functions deploy discord-webhook-proxy

Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure os secrets no Supabase (se ainda não fez):" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard/project/tfraqopkwqgwvutqnznh/settings/functions" -ForegroundColor Gray
Write-Host ""
Write-Host "   Adicione estes 3 secrets:" -ForegroundColor White
Write-Host "   - DISCORD_WEBHOOK_RESULTS_URL" -ForegroundColor Gray
Write-Host "   - DISCORD_WEBHOOK_CHALLENGES_URL" -ForegroundColor Gray
Write-Host "   - DISCORD_WEBHOOK_FRIENDLY_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Adicione esta variável de ambiente em PRODUÇÃO:" -ForegroundColor White
Write-Host "   VITE_DISCORD_USE_SUPABASE_EDGE=true" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Faça commit e push das alterações" -ForegroundColor White
Write-Host ""
Write-Host "4. Teste criando um desafio no site em produção" -ForegroundColor White
Write-Host ""
Write-Host "📊 Ver logs da função:" -ForegroundColor Cyan
Write-Host "   npx supabase functions logs discord-webhook-proxy" -ForegroundColor Gray
Write-Host ""
