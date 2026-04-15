/**
 * Mapeamento de usernames para IDs do Discord
 * Para obter o ID de um usuário no Discord:
 * 1. Ative o Modo Desenvolvedor: Configurações → Avançado → Modo Desenvolvedor
 * 2. Clique com botão direito no usuário → Copiar ID
 */

export interface DiscordUserMapping {
  username: string;
  discordId: string | null;
  displayName: string;
}

export const discordUserMappings: DiscordUserMapping[] = [
  // Admins
  { username: 'evojota', discordId: null, displayName: 'Evojota' },
  { username: 'lunatic', discordId: null, displayName: 'Lunatic' },
  { username: 'sant', discordId: null, displayName: 'Sant' },
  { username: 'zanin', discordId: null, displayName: 'Zanin' },
  
  // Midnight Drivers
  { username: 'flpn', discordId: null, displayName: 'Flpn' },
  { username: 'rocxs', discordId: null, displayName: 'Rocxs' },
  { username: 'pedrin', discordId: null, displayName: 'Pedrin' },
  
  // Street Runners
  { username: 'repre', discordId: null, displayName: 'Repre' },
  { username: 'chico penha', discordId: null, displayName: 'Chico Penha' },
  { username: 'load', discordId: null, displayName: 'Load' },
  { username: '0000', discordId: null, displayName: '0000' },
  { username: 'blake', discordId: null, displayName: 'Blake' },
  { username: 'nash', discordId: null, displayName: 'Nash' },
  { username: 'cyber', discordId: null, displayName: 'Cyber' },
  { username: 'leite', discordId: null, displayName: 'Leite' },
  
  // Night Drivers
  { username: '12yph', discordId: null, displayName: 'ph' },
  { username: 'vitin', discordId: null, displayName: 'Vitin' },
  { username: 'mnz', discordId: null, displayName: 'Mnz' },
  { username: 'k1', discordId: null, displayName: 'K1' },
  { username: 'veiga', discordId: null, displayName: 'Veiga' },
  { username: 'gus', discordId: null, displayName: 'Gus' },
  { username: 'watzel', discordId: null, displayName: 'Watzel' },
  { username: 'gui', discordId: null, displayName: 'Gui' },
  { username: 'f.mid', discordId: null, displayName: 'F.mid' },
  { username: 'porto', discordId: null, displayName: 'Porto' },
  { username: 'connor', discordId: null, displayName: 'Connor' },
  
  // Jokers
  { username: 'p1n0', discordId: null, displayName: 'P1N0' },
  { username: 'furiatti', discordId: null, displayName: 'Furiatti' },
  { username: 'syds', discordId: null, displayName: 'Syds' },
  { username: 'dasmilf', discordId: null, displayName: 'Dasmilf' },
  { username: 'rev', discordId: null, displayName: 'Rev' },
  { username: 'dgp1', discordId: null, displayName: 'DGP1' },
];

/**
 * Formata o nome do usuário para menção no Discord
 * Se tiver ID do Discord, retorna <@ID>, senão retorna **Nome**
 */
export function formatUserMention(username: string): string {
  const mapping = discordUserMappings.find(
    m => m.username.toLowerCase() === username.toLowerCase()
  );
  
  if (!mapping) {
    return `**${username}**`;
  }
  
  if (mapping.discordId) {
    return `<@${mapping.discordId}>`;
  }
  
  return `**${mapping.displayName}**`;
}

/**
 * Formata múltiplos usuários para menção
 */
export function formatUsersMention(usernames: string[]): string {
  return usernames.map(u => formatUserMention(u)).join(', ');
}

/**
 * Obtém o ID do Discord de um usuário
 */
export function getDiscordId(username: string): string | null {
  const mapping = discordUserMappings.find(
    m => m.username.toLowerCase() === username.toLowerCase()
  );
  return mapping?.discordId || null;
}
