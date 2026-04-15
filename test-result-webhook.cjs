/**
 * Script de teste para verificar se o resultado do desafio vai para o webhook correto
 * Deve ir para: VITE_DISCORD_WEBHOOK_RESULTS_URL (webhook 1 - ...164)
 */

const WEBHOOK_RESULTS = 'https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X';

async function testResultNotification() {
  console.log('🧪 Testando notificação de RESULTADO do desafio...');
  console.log('📍 Webhook: ...164 (RESULTS)');
  
  const mentionsContent = '🔔 <@734902826479648808> <@319597654730342411>';
  
  const embed = {
    title: 'Desafio finalizado',
    description: '<@734902826479648808> venceu <@319597654730342411> e **subiu** para posição **#5** na **Lista 01**.\nPlacar: **2 × 1**',
    color: 0x00ff7f, // Verde
    fields: [
      { name: 'Lista', value: 'Lista 01', inline: true },
      { 
        name: 'Antes (ordem)', 
        value: '<@734902826479648808> (6º) vs <@319597654730342411> (5º)', 
        inline: false 
      },
      { 
        name: 'Pistas (MD3)', 
        value: 'Pista 1: DOUBLE BREEZE\nPista 2: DOCKS LINES\nPista 3: DOUBLE TROUBLE', 
        inline: false 
      }
    ],
    footer: { text: 'Midnight Club 夜中 — Ladder' },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(WEBHOOK_RESULTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: mentionsContent,
        embeds: [embed]
      })
    });

    if (response.ok) {
      console.log('✅ Notificação de resultado enviada com sucesso!');
      console.log('✅ Evojota e Zanin devem ter sido mencionados');
      console.log('✅ Mensagem deve aparecer no canal do webhook ...164');
    } else {
      console.error('❌ Erro ao enviar:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testResultNotification();
