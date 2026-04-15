/**
 * Script de teste para verificar se a criação de desafio vai para o webhook correto
 * Deve ir para: VITE_DISCORD_WEBHOOK_CHALLENGES_URL (webhook 2 - ...756)
 */

const WEBHOOK_CHALLENGES = 'https://discord.com/api/webhooks/1493812852300189756/mozb4Dm4mFoz0YUYyQeo_D6jF9brsxMCO33tJ0Ie4TBuCAmHCU8FRAbECh-12FFdmnnO';

async function testChallengeCreatedNotification() {
  console.log('🧪 Testando notificação de DESAFIO CRIADO...');
  console.log('📍 Webhook: ...756 (CHALLENGES)');
  
  const mentionsContent = '🔔 <@734902826479648808> <@319597654730342411>';
  
  const embed = {
    title: 'Novo desafio na lista',
    description: '<@734902826479648808> desafiou <@319597654730342411> pelo **top 5** da **Lista 01**.\n_Aguarda aceitação na app (24h) ou W.O._',
    color: 0xffd700, // Amarelo
    fields: [
      { name: 'Lista', value: 'Lista 01', inline: true },
      { name: 'Posição em jogo', value: 'Top 5', inline: true }
    ],
    footer: { text: 'Midnight Club 夜中 — Ladder' },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(WEBHOOK_CHALLENGES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: mentionsContent,
        embeds: [embed]
      })
    });

    if (response.ok) {
      console.log('✅ Notificação de desafio criado enviada com sucesso!');
      console.log('✅ Evojota e Zanin devem ter sido mencionados');
      console.log('✅ Mensagem deve aparecer no canal do webhook ...756');
    } else {
      console.error('❌ Erro ao enviar:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testChallengeCreatedNotification();
