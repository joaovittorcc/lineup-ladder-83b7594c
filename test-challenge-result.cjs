// Teste de resultado de desafio - Evojota vence 2x1
const https = require('https');

const webhookUrl = 'https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X';

// IDs do Discord
const evojotaId = '734902826479648808';
const zaninId = '319597654730342411';

// Simulação de resultado - Evojota (desafiante) vence Zanin (desafiado) 2x1
const payload = {
  content: `🔔 <@${evojotaId}> <@${zaninId}>`,
  embeds: [
    {
      title: 'Desafio finalizado',
      description: `<@${evojotaId}> venceu <@${zaninId}> e **subiu** para posição **#2** na **Lista 01**.\nPlacar: **2 × 1**`,
      color: 0x00ff7f, // Verde (vitória do desafiante)
      fields: [
        {
          name: 'Lista',
          value: 'Lista 01',
          inline: true
        },
        {
          name: 'Antes (ordem)',
          value: `<@${evojotaId}> (3º) vs <@${zaninId}> (2º)`,
          inline: false
        },
        {
          name: 'Pistas (MD3)',
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

console.log('📤 Enviando teste de RESULTADO...');
console.log('🏆 Vencedor: @Evojota');
console.log('😢 Perdedor: @Zanin');
console.log('📊 Placar: 2 × 1');
console.log('🏁 Pistas: DOUBLE BREEZE, MIDNIGHT RUN, YOKAI TOUGE');
console.log('');

const req = https.request(options, (res) => {
  res.on('data', () => {});
  res.on('end', () => {
    if (res.statusCode === 204 || res.statusCode === 200) {
      console.log('✅ Mensagem de RESULTADO enviada!');
      console.log('');
      console.log('🔔 Verifique o Discord:');
      console.log('   - Vocês devem receber notificação');
      console.log('   - Mensagem deve estar destacada');
      console.log('   - Placar 2×1 deve aparecer');
      console.log('   - Evojota subiu para #2');
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
