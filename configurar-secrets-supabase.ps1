# Script PowerShell para configurar os secrets do Discord no Supabase
# Execute: .\configurar-secrets-supabase.ps1

Write-Host "🔐 Configurando secrets do Discord no Supabase" -ForegroundColor Cyan
Write-Host ""

# Ler os webhooks do .env
$envContent = Get-Content .env -Raw
$resultsUrl = ($envContent | Select-String -Pattern 'VITE_DISCORD_WEBHOOK_RESULTS_URL=(.+)').Matches.Groups[1].Value.Trim()
$challengesUrl = ($envContent | Select-String -Pattern 'VITE_DISCORD_WEBHOOK_CHALLENGES_URL=(.+)').Matches.Groups[1].Value.Trim()
$friendlyUrl = ($envContent | Select-String -Pattern 'VITE_DISCORD_WEBHOOK_FRIENDLY_URL=(.+)').Matches.Groups[1].Value.Trim()

if (-not $resultsUrl -or -not $challengesUrl -or -not $friendlyUrl) {
    Write-Host "❌ Erro: Não foi possível ler os webhooks do arquivo .env" -ForegroundColor Red
    Write-Host "   Verifique se o arquivo .env existe e contém as variáveis:" -ForegroundColor Yellow
    Write-Host "   - VITE_DISCORD_WEBHOOK_RESULTS_URL"
    Write-Host "   - VITE_DISCORD_WEBHOOK_CHALLENGES_URL"
    Write-Host "   - VITE_DISCORD_WEBHOOK_FRIENDLY_URL"
    exit 1
}

Write-Host "📝 Configurando secret: DISCORD_WEBHOOK_RESULTS_URL" -ForegroundColor Green
npx supabase secrets set "DISCORD_WEBHOOK_RESULTS_URL=$resultsUrl"

Write-Host ""
Write-Host "📝 Configurando secret: DISCORD_WEBHOOK_CHALLENGES_URL" -ForegroundColor Green
npx supabase secrets set "DISCORD_WEBHOOK_CHALLENGES_URL=$challengesUrl"

Write-Host ""
Write-Host "📝 Configurando secret: DISCORD_WEBHOOK_FRIENDLY_URL" -ForegroundColor Green
npx supabase secrets set "DISCORD_WEBHOOK_FRIENDLY_URL=$friendlyUrl"

Write-Host ""
Write-Host "✅ Secrets configurados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Verificar secrets:" -ForegroundColor Cyan
Write-Host "   npx supabase secrets list"
Write-Host ""
Write-Host "🚀 Próximo passo: Deploy da Edge Function" -ForegroundColor Cyan
Write-Host "   .\deploy-discord-edge-function.ps1"
Write-Host ""
