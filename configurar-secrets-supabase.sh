#!/bin/bash

# Script para configurar os secrets do Discord no Supabase
# Execute: bash configurar-secrets-supabase.sh

echo "🔐 Configurando secrets do Discord no Supabase"
echo ""

# Ler os webhooks do .env
RESULTS_URL=$(grep VITE_DISCORD_WEBHOOK_RESULTS_URL .env | cut -d '=' -f2)
CHALLENGES_URL=$(grep VITE_DISCORD_WEBHOOK_CHALLENGES_URL .env | cut -d '=' -f2)
FRIENDLY_URL=$(grep VITE_DISCORD_WEBHOOK_FRIENDLY_URL .env | cut -d '=' -f2)

if [ -z "$RESULTS_URL" ] || [ -z "$CHALLENGES_URL" ] || [ -z "$FRIENDLY_URL" ]; then
  echo "❌ Erro: Não foi possível ler os webhooks do arquivo .env"
  echo "   Verifique se o arquivo .env existe e contém as variáveis:"
  echo "   - VITE_DISCORD_WEBHOOK_RESULTS_URL"
  echo "   - VITE_DISCORD_WEBHOOK_CHALLENGES_URL"
  echo "   - VITE_DISCORD_WEBHOOK_FRIENDLY_URL"
  exit 1
fi

echo "📝 Configurando secret: DISCORD_WEBHOOK_RESULTS_URL"
npx supabase secrets set DISCORD_WEBHOOK_RESULTS_URL="$RESULTS_URL"

echo ""
echo "📝 Configurando secret: DISCORD_WEBHOOK_CHALLENGES_URL"
npx supabase secrets set DISCORD_WEBHOOK_CHALLENGES_URL="$CHALLENGES_URL"

echo ""
echo "📝 Configurando secret: DISCORD_WEBHOOK_FRIENDLY_URL"
npx supabase secrets set DISCORD_WEBHOOK_FRIENDLY_URL="$FRIENDLY_URL"

echo ""
echo "✅ Secrets configurados com sucesso!"
echo ""
echo "📊 Verificar secrets:"
echo "   npx supabase secrets list"
echo ""
echo "🚀 Próximo passo: Deploy da Edge Function"
echo "   bash deploy-discord-edge-function.sh"
echo ""
