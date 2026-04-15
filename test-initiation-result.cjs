/**
 * Script de teste para verificar notificação de resultado da lista de iniciação
 * Deve ir para: VITE_DISCORD_WEBHOOK_RESULTS_URL (webhook 1 - ...164)
 */

const WEBHOOK_RESULTS = 'https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X';

async function testInitiationResult() {
  console.log('🧪 Testando notificação de RESULTADO da INICIAÇÃO...');
  console.log('📍 Webhook: ...164 (RESULTS)');
  
  // Teste 1: DG #06 (Joker) atacou e GANHOU do Pedrin - Progresso 1/5
  const mentionsContent1 = '🔔 <@336172343086809088> <@312761084757016578>';
  
  const embed1 = {
    title: 'Iniciação — corrida decidida',
    description: '<@336172343086809088> atacou e ganhou do <@312761084757016578> | Iniciação\nPlacar: **1 × 0**\n\n**Progresso**: 1/5 membros derrotados | Faltam 4 para subir de cargo',
    color: 0x00ff7f, // Verde (vitória)
    fields: [
      { name: 'Lista', value: 'Lista de Iniciação', inline: true },
      { name: 'Formato', value: 'MD1', inline: true }
    ],
    footer: { text: 'Midnight Club 夜中 — Iniciação' },
    timestamp: new Date().toISOString()
  };

  try {
    console.log('\n📤 Enviando: DG #06 atacou e GANHOU do Pedrin #22 (1/5)');
    const response1 = await fetch(WEBHOOK_RESULTS, {
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

    // Teste 2: PINO #14 (Joker) atacou e GANHOU do Pedrin - Progresso 3/5
    const mentionsContent2 = '🔔 <@687186315778981896> <@312761084757016578>';
    
    const embed2 = {
      title: 'Iniciação — corrida decidida',
      description: '<@687186315778981896> atacou e ganhou do <@312761084757016578> | Iniciação\nPlacar: **1 × 0**\n\n**Progresso**: 3/5 membros derrotados | Faltam 2 para subir de cargo',
      color: 0x00ff7f,
      fields: [
        { name: 'Lista', value: 'Lista de Iniciação', inline: true },
        { name: 'Formato', value: 'MD1', inline: true }
      ],
      footer: { text: 'Midnight Club 夜中 — Iniciação' },
      timestamp: new Date().toISOString()
    };

    console.log('\n📤 Enviando: PINO #14 atacou e GANHOU do Pedrin #22 (3/5)');
    const response2 = await fetch(WEBHOOK_RESULTS, {
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

    // Teste 3: oKAKA (Joker) atacou e PERDEU do Pedrin - Sem progresso
    const mentionsContent3 = '🔔 <@405485689891979266> <@312761084757016578>';
    
    const embed3 = {
      title: 'Iniciação — corrida decidida',
      description: '<@405485689891979266> atacou e perdeu do <@312761084757016578> | Iniciação\nPlacar: **0 × 1**',
      color: 0x5865f2, // Azul (derrota)
      fields: [
        { name: 'Lista', value: 'Lista de Iniciação', inline: true },
        { name: 'Formato', value: 'MD1', inline: true }
      ],
      footer: { text: 'Midnight Club 夜中 — Iniciação' },
      timestamp: new Date().toISOString()
    };

    console.log('\n📤 Enviando: oKAKA atacou e PERDEU do Pedrin #22 (sem progresso)');
    const response3 = await fetch(WEBHOOK_RESULTS, {
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

    // Teste 4: Tigas (Joker) atacou e GANHOU - Completou 5/5!
    const mentionsContent4 = '🔔 <@239062624023609347> <@312761084757016578>';
    
    const embed4 = {
      title: 'Iniciação — corrida decidida',
      description: '<@239062624023609347> atacou e ganhou do <@312761084757016578> | Iniciação\nPlacar: **1 × 0**\n\n✅ **5/5 membros derrotados! Pronto para subir de cargo!**',
      color: 0x00ff7f,
      fields: [
        { name: 'Lista', value: 'Lista de Iniciação', inline: true },
        { name: 'Formato', value: 'MD1', inline: true }
      ],
      footer: { text: 'Midnight Club 夜中 — Iniciação' },
      timestamp: new Date().toISOString()
    };

    console.log('\n📤 Enviando: Tigas #71 atacou e GANHOU - COMPLETOU 5/5!');
    const response4 = await fetch(WEBHOOK_RESULTS, {
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

    console.log('\n✅ Todos os testes de iniciação concluídos!');
    console.log('✅ As mensagens devem aparecer no canal do webhook ...164');
    console.log('✅ Formato correto: "Joker atacou e ganhou/perdeu do Membro | Iniciação"');
    console.log('✅ Progresso mostrado quando Joker vence');

  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testInitiationResult();
