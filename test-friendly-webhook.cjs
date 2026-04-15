/**
 * Script de teste para verificar notificações de desafios amistosos
 * Deve ir para: VITE_DISCORD_WEBHOOK_FRIENDLY_URL (webhook 3 - ...024)
 */

const WEBHOOK_FRIENDLY = 'https://discord.com/api/webhooks/1493989507945726024/3pE4dAbkrvAZUs7PdVacfrWSNBzrcXYySG4LhNM9RA4ZowOm3h0pZuxbpdXPQ4CS8g29';

async function testFriendlyNotifications() {
  console.log('🧪 Testando notificações de DESAFIOS AMISTOSOS...');
  console.log('📍 Webhook: ...024 (FRIENDLY)');
  
  // Teste 1: Desafio criado
  const mentionsContent1 = '🔔 <@734902826479648808> <@319597654730342411>';
  
  const embed1 = {
    title: '🎮 Novo Desafio Amistoso',
    description: '<@734902826479648808> desafiou <@319597654730342411> para um amistoso!',
    color: 0x5865f2, // Azul
    fields: [
      { name: 'Evojota (Desafiante)', value: '⭐ ELO: 1500', inline: true },
      { name: 'Zanin (Desafiado)', value: '⭐ ELO: 1450', inline: true },
    ],
    footer: { text: 'Midnight Club 夜中 — Amistoso' },
    timestamp: new Date().toISOString()
  };

  try {
    console.log('\n📤 Teste 1: Desafio criado (Evojota vs Zanin)');
    const response1 = await fetch(WEBHOOK_FRIENDLY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: mentionsContent1,
        embeds: [embed1]
      })
    });

    if (response1.ok) {
      console.log('✅ Notificação 1 enviada com sucesso!');
    } else {
      console.error('❌ Erro ao enviar notificação 1:', response1.status, await response1.text());
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 2: Desafio aceito (mostra pista)
    const mentionsContent2 = '🔔 <@734902826479648808> <@319597654730342411>';
    
    const embed2 = {
      title: '✅ Desafio Amistoso Aceito',
      description: '<@319597654730342411> aceitou o desafio de <@734902826479648808>!',
      color: 0x00ff7f, // Verde
      fields: [
        { name: 'Evojota', value: '⭐ ELO: 1500', inline: true },
        { name: 'Zanin', value: '⭐ ELO: 1450', inline: true },
        { name: '🏁 Pista', value: 'DOUBLE BREEZE', inline: false },
      ],
      footer: { text: 'Midnight Club 夜中 — Amistoso' },
      timestamp: new Date().toISOString()
    };

    console.log('\n📤 Teste 2: Desafio aceito (pista: DOUBLE BREEZE)');
    const response2 = await fetch(WEBHOOK_FRIENDLY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: mentionsContent2,
        embeds: [embed2]
      })
    });

    if (response2.ok) {
      console.log('✅ Notificação 2 enviada com sucesso!');
    } else {
      console.error('❌ Erro ao enviar notificação 2:', response2.status, await response2.text());
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 3: Resultado (Evojota venceu)
    const mentionsContent3 = '🔔 <@734902826479648808> <@319597654730342411>';
    
    const embed3 = {
      title: '🏆 Amistoso Finalizado',
      description: '<@734902826479648808> venceu <@319597654730342411>!',
      color: 0x00ff7f, // Verde
      fields: [
        { name: '🏁 Pista', value: 'DOUBLE BREEZE', inline: false },
        { name: 'Evojota 🏆', value: '⭐ 1500 → **1525** (+25)', inline: true },
        { name: 'Zanin', value: '⭐ 1450 → **1425** (-25)', inline: true },
      ],
      footer: { text: 'Midnight Club 夜中 — Amistoso' },
      timestamp: new Date().toISOString()
    };

    console.log('\n📤 Teste 3: Resultado (Evojota venceu, ELO atualizado)');
    const response3 = await fetch(WEBHOOK_FRIENDLY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: mentionsContent3,
        embeds: [embed3]
      })
    });

    if (response3.ok) {
      console.log('✅ Notificação 3 enviada com sucesso!');
    } else {
      console.error('❌ Erro ao enviar notificação 3:', response3.status, await response3.text());
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 4: Resultado (Zanin venceu)
    const mentionsContent4 = '🔔 <@734902826479648808> <@319597654730342411>';
    
    const embed4 = {
      title: '🏆 Amistoso Finalizado',
      description: '<@319597654730342411> venceu <@734902826479648808>!',
      color: 0xff1493, // Rosa
      fields: [
        { name: '🏁 Pista', value: 'DOCKS LINES', inline: false },
        { name: 'Evojota', value: '⭐ 1525 → **1500** (-25)', inline: true },
        { name: 'Zanin 🏆', value: '⭐ 1425 → **1450** (+25)', inline: true },
      ],
      footer: { text: 'Midnight Club 夜中 — Amistoso' },
      timestamp: new Date().toISOString()
    };

    console.log('\n📤 Teste 4: Resultado (Zanin venceu, ELO atualizado)');
    const response4 = await fetch(WEBHOOK_FRIENDLY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: mentionsContent4,
        embeds: [embed4]
      })
    });

    if (response4.ok) {
      console.log('✅ Notificação 4 enviada com sucesso!');
    } else {
      console.error('❌ Erro ao enviar notificação 4:', response4.status, await response4.text());
    }

    console.log('\n✅ Todos os testes de amistosos concluídos!');
    console.log('✅ As mensagens devem aparecer no canal do webhook ...024');
    console.log('✅ Formato: Criação → Aceitação (com pista) → Resultado (com ELO)');

  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testFriendlyNotifications();
