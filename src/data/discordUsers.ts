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
  { username: 'evojota', discordId: '734902826479648808', displayName: 'Evojota' },
  { username: 'lunatic', discordId: '652265924417552394', displayName: 'Lunatic' },
  { username: 'sant', discordId: '513476782469677066', displayName: 'Sant' },
  { username: 'zanin', discordId: '319597654730342411', displayName: 'Zanin' },
  
  // Midnight Drivers
  { username: 'flpn', discordId: '523296490161176596', displayName: 'Flpn' },
  { username: 'rocxs', discordId: '591712848967762001', displayName: 'Rocxs' },
  { username: 'pedrin', discordId: '312761084757016578', displayName: 'Pedrin' },
  
  // Street Runners
  { username: 'repre', discordId: '215924984500060171', displayName: 'Repre' },
  { username: 'chico penha', discordId: '435240027832713226', displayName: 'Chico Penha' },
  { username: 'load', discordId: '309765159168114690', displayName: 'Load' },
  { username: '0000', discordId: '345705957898190848', displayName: '0000' },
  { username: 'blake', discordId: '865901275022884885', displayName: 'Blake' },
  { username: 'nash', discordId: '350377178715914253', displayName: 'Nash' },
  { username: 'cyber', discordId: null, displayName: 'Cyber' },
  { username: 'leite', discordId: '390615783962574848', displayName: 'Leite' },
  
  // Night Drivers
  { username: '12yph', discordId: '840019036087648316', displayName: 'ph' },
  { username: 'vitin', discordId: '893943211087777862', displayName: 'Vitin' },
  { username: 'mnz', discordId: '193002981468274698', displayName: 'Mnz' },
  { username: 'k1', discordId: '834866441945350165', displayName: 'K1' },
  { username: 'veiga', discordId: '1018606842559082646', displayName: 'Veiga' },
  { username: 'gus', discordId: '1365975695896875018', displayName: 'Gus' },
  { username: 'watzel', discordId: '585532483425009694', displayName: 'Watzel' },
  { username: 'gui', discordId: null, displayName: 'Gui' },
  { username: 'f.mid', discordId: '355126945551351809', displayName: 'F.mid' },
  { username: 'porto', discordId: '410542578279120898', displayName: 'Porto' },
  { username: 'connor', discordId: '328579769199493122', displayName: 'Connor' },
  
  // Jokers
  { username: 'p1n0', discordId: '687186315778981896', displayName: 'P1N0' },
  { username: 'furiatti', discordId: '582249935471378515', displayName: 'Furiatti' },
  { username: 'syds', discordId: '110679914778644489', displayName: 'Syds' },
  { username: 'dasmilf', discordId: '447546450671435778', displayName: 'Dasmilf' },
  { username: 'rev', discordId: '509399520162086912', displayName: 'Rev' },
  { username: 'dgp1', discordId: '336172343086809088', displayName: 'DGP1' },
  
  // Novos usuários (ainda não cadastrados na app)
  // NOTA: jota = evojota (mesmo ID), luca = porto (mesmo ID) - removidos para evitar duplicação
  { username: 'vitória', discordId: '349935809870430209', displayName: 'Vitória' },
  { username: 'okaka', discordId: '405485689891979266', displayName: 'Okaka' },
  { username: 'tigas', discordId: '239062624023609347', displayName: 'Tigas' },
  { username: 'uchoa', discordId: '757595122723586080', displayName: 'Uchoa' },
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
