// Teste dos dois webhooks separados
const https = require('https');

// Webhook de RESULTADOS (campeonatos)
const resultsWebhook = 'https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X';

// Webhook de DESAFIOS (x1 das listas)
const challengesWebhook = 'https://discord.com/api/webhooks/1493812852300189756/mozb4Dm4mFoz0YUYyQeo_D6jF9brsxMCO33tJ0Ie4TBuCAmHCU8FRAbECh-12FFdmnnO';

const evojotaId = '734902826479648808';
const zaninId = '319597654730342411';

function sendWebhook(webhookUrl, payload, description) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          console.log(`✅ ${description} enviado!`);
          resolve();
        } else {
          console.log(`❌ Erro ao enviar ${description}: ${res.statusCode}`);
          reject();
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Erro: ${error}`);
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function testBothWebhooks() {
  console.log('🧪 TESTANDO OS DOIS WEBHOOKS\n');
  
  // 1. Teste do webhook de RESULTADOS (campeonatos)
  console.log('📊 1. Testando webhook de RESULTADOS (campeonatos)...');
  const resultsPayload = {
    content: null,
    embeds: [{
      title: '🧪 Teste - Resultado de Corrida',
      description: '1º — **Evojota** (20pts)\n2º — **Zanin** (17pts)\n3º — **Lunatic** (15pts)',
      color: 0x5865f2, // Azul
      fields: [
        { name: 'Campeonato', value: 'Temporada de Teste', inline: true },
        { name: 'Pista', value: 'DOUBLE BREEZE', inline: true }
      ],
      footer: { text: 'Midnight Club 夜中 — Campeonato' },
      timestamp: new Date().toISOString()
    }]
  };
  
  await sendWebhook(resultsWebhook, resultsPayload, 'Teste de RESULTADOS');
  
  console.log('\n⏳ Aguardando 2 segundos...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 2. Teste do webhook de DESAFIOS
  console.log('🏁 2. Testando webhook de DESAFIOS (x1)...');
  const challengesPayload = {
    content: `🔔 <@${evojotaId}> <@${zaninId}>`,
    embeds: [{
      title: '🧪 Teste - DESAFIO ACEITO',
      description: `<@${zaninId}> aceitou o desafio de <@${evojotaId}> na **Lista 01**.`,
      color: 0xff1493, // Rosa
      fields: [
        { name: 'Confronto', value: `<@${evojotaId}> (3º) vs <@${zaninId}> (2º)`, inline: false },
        { name: 'Lista', value: 'Lista 01', inline: true },
        { name: 'Formato', value: 'MD3', inline: true },
        { name: 'Pistas', value: 'Pista 1: DOUBLE BREEZE\nPista 2: MIDNIGHT RUN\nPista 3: YOKAI TOUGE', inline: false }
      ],
      footer: { text: 'Midnight Club 夜中 — Ladder' },
      timestamp: new Date().toISOString()
    }]
  };
  
  await sendWebhook(challengesWebhook, challengesPayload, 'Teste de DESAFIOS');
  
  console.log('\n✅ TESTES CONCLUÍDOS!\n');
  console.log('🔔 Verifique o Discord:');
  console.log('   📊 Canal de RESULTADOS: deve ter mensagem de corrida');
  console.log('   🏁 Canal de DESAFIOS: deve ter mensagem de desafio aceito com menções');
}

testBothWebhooks();
