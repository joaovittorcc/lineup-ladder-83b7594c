// Teste de menções no Discord
const https = require('https');

const webhookUrl = 'https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X';

// IDs do Discord
const evojotaId = '734902826479648808';
const zaninId = '319597654730342411';

// Exemplo de desafio com menções
const payload = {
  content: `🔔 <@${evojotaId}> <@${zaninId}>`, // Menções no content para garantir notificação
  embeds: [
    {
      title: '🧪 Teste de Menções - Desafio',
      description: `<@${evojotaId}> desafiou <@${zaninId}> pelo **top 2** da **Lista 01**.\n_Aguarda aceitação na app (24h) ou W.O._`,
      color: 0xffd700, // Amarelo
      fields: [
        {
          name: 'Lista',
          value: 'Lista 01',
          inline: true
        },
        {
          name: 'Posição em jogo',
          value: 'Top 2',
          inline: true
        },
        {
          name: '👥 Confronto',
          value: `<@${evojotaId}> (3º) vs <@${zaninId}> (2º)`,
          inline: false
        }
      ],
      footer: {
        text: 'Midnight Club 夜中 — Teste de Menções'
      },
      timestamp: new Date().toISOString()
    }
  ]
};

const url = new URL(webhookUrl);
const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('📤 Enviando teste de menções...');
console.log(`👤 Mencionando: @Evojota (ID: ${evojotaId})`);
console.log(`👤 Mencionando: @Zanin (ID: ${zaninId})`);
console.log('');

const req = https.request(options, (res) => {
  res.on('data', () => {});
  res.on('end', () => {
    if (res.statusCode === 204 || res.statusCode === 200) {
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('');
      console.log('🔔 Verifique o Discord:');
      console.log('   - @Evojota e @Zanin devem receber notificação');
      console.log('   - Os nomes devem aparecer como menções clicáveis');
      console.log('   - A mensagem deve estar destacada para eles');
    } else {
      console.log(`❌ Erro: Status ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro ao enviar:', error);
});

req.write(JSON.stringify(payload));
req.end();
