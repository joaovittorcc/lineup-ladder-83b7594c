// Teste direto da Edge Function do Supabase
// Execute: node test-edge-function-direct.cjs

const SUPABASE_URL = 'https://tfraqopkwqgwvutqnznh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XDoIms7iv0LhDr36NDINeg_pUBlBee4';

async function testEdgeFunction() {
  console.log('🧪 Testando Edge Function discord-webhook-proxy...\n');

  const payload = {
    content: '🔔 <@405485689891979266>', // Menção do Okaka
    embeds: [
      {
        title: '🧪 Teste da Edge Function',
        description: 'Se você recebeu esta mensagem, a Edge Function está funcionando!',
        color: 0x00ff00,
        fields: [
          { name: 'Teste', value: 'Edge Function', inline: true },
          { name: 'Status', value: '✅ Funcionando', inline: true },
        ],
        footer: { text: 'Midnight Club 夜中 — Teste' },
        timestamp: new Date().toISOString(),
      },
    ],
    type: 'challenges', // Tipo de webhook
  };

  try {
    console.log('📤 Enviando requisição para Edge Function...');
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/discord-webhook-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await response.text();
    console.log(`\n📊 Status: ${response.status}`);
    console.log(`📄 Response: ${responseText}\n`);

    if (response.ok) {
      console.log('✅ Sucesso! Verifique o Discord para ver a mensagem.');
    } else {
      console.log('❌ Erro! Detalhes acima.');
    }
  } catch (error) {
    console.error('❌ Erro ao chamar Edge Function:', error.message);
  }
}

testEdgeFunction();
