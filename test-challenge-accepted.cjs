// Teste de desafio aceito com pistas
const https = require('https');

const webhookUrl = 'https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X';

// IDs do Discord
const evojotaId = '734902826479648808';
const zaninId = '319597654730342411';

// Simulação de desafio aceito
const payload = {
  content: `🔔 <@${evojotaId}> <@${zaninId}>`,
  embeds: [
    {
      title: 'DESAFIO ACEITO',
      description: `<@${zaninId}> aceitou o desafio de <@${evojotaId}> na **Lista 01**.`,
      color: 0xff1493, // Rosa
      fields: [
        {
          name: 'Confronto',
          value: `<@${evojotaId}> (3º) vs <@${zaninId}> (2º)`,
          inline: false
        },
        {
          name: 'Lista',
          value: 'Lista 01',
          inline: true
        },
        {
          name: 'Formato',
          value: 'MD3',
          inline: true
        },
        {
          name: 'Pistas',
          value: 'Pista 1: DOUBLE BREEZE\nPista 2: MIDNIGHT RUN\nPista 3: YOKAI TOUGE',
          inline: false
        }
      ],
      footer: {
        text: 'Midnight Club 夜中 — Ladder'
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

console.log('📤 Enviando teste de DESAFIO ACEITO...');
console.log(`👤 Mencionando: @Evojota e @Zanin`);
console.log('🏁 Pistas: DOUBLE BREEZE, MIDNIGHT RUN, YOKAI TOUGE');
console.log('');

const req = https.request(options, (res) => {
  res.on('data', () => {});
  res.on('end', () => {
    if (res.statusCode === 204 || res.statusCode === 200) {
      console.log('✅ Mensagem de DESAFIO ACEITO enviada!');
      console.log('');
      console.log('🔔 Verifique o Discord:');
      console.log('   - Vocês devem receber notificação');
      console.log('   - Mensagem deve estar destacada');
      console.log('   - As 3 pistas devem aparecer');
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
