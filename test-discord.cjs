// Script de teste para enviar mensagem ao Discord
const https = require('https');

const webhookUrl = 'https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X';

const payload = {
  content: null,
  embeds: [
    {
      title: '🧪 Teste de Integração - Bot Midnight Club',
      description: '**Bot configurado e funcionando!** ✅\n\nEste é um teste da integração Discord. O bot está pronto para enviar notificações automáticas de desafios (x1).',
      color: 65280, // Verde
      fields: [
        {
          name: '✅ Status',
          value: 'Conectado e operacional',
          inline: true
        },
        {
          name: '🤖 Sistema',
          value: 'Midnight Club 夜中',
          inline: true
        },
        {
          name: '📋 Funcionalidades',
          value: '• Notificação de desafios criados\n• Notificação de desafios aceitos (com pistas)\n• Notificação de resultados (com placar)\n• W.O. e cancelamentos',
          inline: false
        }
      ],
      footer: {
        text: 'Midnight Club 夜中 — Bot Discord Ativo'
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

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (d) => {
    process.stdout.write(d);
  });
  
  res.on('end', () => {
    if (res.statusCode === 204 || res.statusCode === 200) {
      console.log('\n✅ Mensagem enviada com sucesso para o Discord!');
      console.log('Verifique o canal do Discord para ver a mensagem.');
    } else {
      console.log('\n❌ Erro ao enviar mensagem.');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error);
});

req.write(JSON.stringify(payload));
req.end();
