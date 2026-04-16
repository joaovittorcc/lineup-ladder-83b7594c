#!/bin/bash

# Script para deploy da Edge Function do Discord no Supabase
# Execute: bash deploy-discord-edge-function.sh

echo "🚀 Deploy da Edge Function discord-webhook-proxy"
echo ""

# Deploy da função
echo "📦 Fazendo deploy..."
npx supabase functions deploy discord-webhook-proxy

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. Configure os secrets no Supabase (se ainda não fez):"
echo "   https://supabase.com/dashboard/project/tfraqopkwqgwvutqnznh/settings/functions"
echo ""
echo "   Adicione estes 3 secrets:"
echo "   - DISCORD_WEBHOOK_RESULTS_URL"
echo "   - DISCORD_WEBHOOK_CHALLENGES_URL"
echo "   - DISCORD_WEBHOOK_FRIENDLY_URL"
echo ""
echo "2. Adicione esta variável de ambiente em PRODUÇÃO:"
echo "   VITE_DISCORD_USE_SUPABASE_EDGE=true"
echo ""
echo "3. Faça commit e push das alterações"
echo ""
echo "4. Teste criando um desafio no site em produção"
echo ""
echo "📊 Ver logs da função:"
echo "   npx supabase functions logs discord-webhook-proxy"
echo ""
