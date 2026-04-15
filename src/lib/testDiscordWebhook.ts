/**
 * Função de teste para validar a configuração do webhook Discord
 * Use no console do navegador: testDiscordWebhook()
 */

import { sendDiscordWebhook } from './discord';

export async function testDiscordWebhook() {
  console.log('🧪 Testando webhook Discord...');
  
  try {
    await sendDiscordWebhook('🧪 **Teste de Webhook**', [
      {
        title: 'Teste de Integração Discord',
        description: 'Se você está vendo esta mensagem, o webhook está funcionando corretamente! ✅',
        color: 0x00ff00, // Verde
        fields: [
          { name: 'Status', value: 'Conectado', inline: true },
          { name: 'Sistema', value: 'Midnight Club 夜中', inline: true },
        ],
        footer: { text: 'Teste realizado com sucesso' },
        timestamp: new Date().toISOString(),
      },
    ]);
    
    console.log('✅ Webhook enviado com sucesso! Verifique o canal do Discord.');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error);
    console.log('💡 Dicas:');
    console.log('1. Verifique se VITE_DISCORD_WEBHOOK_URL está configurado no .env');
    console.log('2. Reinicie o servidor de desenvolvimento (npm run dev)');
    console.log('3. Se usar Edge Function, verifique se está deployada');
    return false;
  }
}

// Exportar para uso global no console
if (typeof window !== 'undefined') {
  (window as any).testDiscordWebhook = testDiscordWebhook;
}

/**
 * Teste de notificação de resultado de corrida
 */
export async function testRaceResultNotification() {
  console.log('🧪 Testando notificação de resultado de corrida...');
  
  const { notifyRaceResult } = await import('./discord');
  
  try {
    await notifyRaceResult({
      seasonName: 'Temporada de Teste',
      raceNumber: 1,
      trackName: 'Tokyo Highway',
      results: [
        { pilot_name: 'Evojota', position: 1, points: 20 },
        { pilot_name: 'Lunatic', position: 2, points: 17 },
        { pilot_name: 'Sant', position: 3, points: 15 },
        { pilot_name: 'Flpn', position: 0, points: 0 }, // NP
      ],
    });
    
    console.log('✅ Notificação de corrida enviada! Verifique o Discord.');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    return false;
  }
}

if (typeof window !== 'undefined') {
  (window as any).testRaceResultNotification = testRaceResultNotification;
}

/**
 * Teste de notificação de desafio
 */
export async function testChallengeNotification() {
  console.log('🧪 Testando notificação de desafio...');
  
  const { notifyChallengeResult } = await import('./discord');
  
  try {
    await notifyChallengeResult({
      challengerName: 'Lunatic',
      challengedName: 'Sant',
      challengerPos: 3,
      challengedPos: 2,
      listLabel: 'Lista 01',
      score: [2, 1],
      tracks: ['Tokyo Highway', 'Osaka Loop', 'Yokohama Bay'],
    });
    
    console.log('✅ Notificação de desafio enviada! Verifique o Discord.');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    return false;
  }
}

if (typeof window !== 'undefined') {
  (window as any).testChallengeNotification = testChallengeNotification;
}

console.log('🔧 Funções de teste disponíveis no console:');
console.log('  - testDiscordWebhook()');
console.log('  - testRaceResultNotification()');
console.log('  - testChallengeNotification()');
