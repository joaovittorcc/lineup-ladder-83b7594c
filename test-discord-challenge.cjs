// Exemplo de notificação de desafio completo
const https = require('https');

const webhookUrl = 'https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X';

// Exemplo 1: Desafio Finalizado
const payload1 = {
  content: null,
  embeds: [
    {
      title: 'Desafio finalizado',
      description: '**Lunatic** venceu **Sant** e **subiu** para posição **#2** na **Lista 01**.\nPlacar: **2 × 1**',
      color: 0x00ff7f, // Verde
      fields: [
        {
          name: 'Lista',
          value: 'Lista 01',
          inline: true
        },
        {
          name: 'Antes (ordem)',
          value: 'Lunatic (3º) vs Sant (2º)',
          inline: false
        },
        {
          name: 'Pistas (MD3)',
          value: 'Pista 1: Tokyo Highway\nPista 2: Osaka Loop\nPista 3: Yokohama Bay',
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

function sendMessage(payload, description) {
  const url = new URL(webhookUrl);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          console.log(`✅ ${description} enviado!`);
          resolve();
        } else {
          console.log(`❌ Erro ao enviar ${description}`);
          reject();
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro:', error);
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function sendExamples() {
  console.log('📤 Enviando exemplo de desafio finalizado...\n');
  await sendMessage(payload1, 'Exemplo de desafio finalizado');
  
  console.log('\n✅ Exemplo enviado com sucesso!');
  console.log('Verifique o canal do Discord para ver como ficou.');
}

sendExamples();
