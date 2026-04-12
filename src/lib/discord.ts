/**
 * Discord webhook (lista ladder, campeonatos).
 * Definir VITE_DISCORD_WEBHOOK_URL no .env (URL completo do webhook do canal).
 *
 * Screenshot automático da UI: não implementado aqui — exigiria html2canvas no cliente
 * (webhook exposto) ou upload via Edge Function com segredo no servidor.
 */

function getDiscordWebhookUrl(): string | null {
  const u = import.meta.env.VITE_DISCORD_WEBHOOK_URL?.trim();
  return u || null;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export async function sendDiscordWebhook(content: string | null, embeds: DiscordEmbed[]) {
  const url = getDiscordWebhookUrl();
  if (!url) {
    if (import.meta.env.DEV) {
      console.warn('Discord: VITE_DISCORD_WEBHOOK_URL não definido — notificação ignorada.');
    }
    return;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, embeds }),
    });
    if (!res.ok) {
      console.error('Discord webhook falhou:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Falha ao enviar webhook Discord:', err);
  }
}

export function getListLabel(listId: string): string {
  const id = listId.toLowerCase();
  if (id === 'list-01' || id === 'list-1' || id.includes('01')) return 'Lista 01';
  if (id === 'list-02' || id === 'list-2' || id.includes('02')) return 'Lista 02';
  if (id === 'initiation') return 'Lista de Iniciação';
  if (id === 'street-runner') return 'Street Runner → Lista 02';
  if (id === 'cross-list') return 'Desafio entre listas (L02 → L01)';
  return listId;
}

// ── Colors (decimal) ──
const COLOR_PINK = 0xff1493;
const COLOR_GREEN = 0x00ff7f;
const COLOR_YELLOW = 0xffd700;
const COLOR_RED = 0xff4444;
const COLOR_BLUE = 0x5865f2;

// ── Challenge notifications ──

export function notifyChallengePending(data: {
  challengerName: string;
  challengedName: string;
  /** Posição humana (1-based) que o desafiado ocupa e está em disputa */
  contestedRank: number;
  listLabel: string;
  /** Se o desafio expira em 24h (ladder normal) */
  awaitsAcceptance?: boolean;
}) {
  const wait = data.awaitsAcceptance !== false ? 'Aguarda aceitação na app (24h) ou W.O.' : '';
  return sendDiscordWebhook(null, [
    {
      title: 'Desafio de lista enviado',
      description: `**${data.challengerName}** desafiou **${data.challengedName}** pela posição **#${data.contestedRank}** (${data.listLabel}).${wait ? `\n${wait}` : ''}`,
      color: COLOR_YELLOW,
      fields: [
        { name: 'Lista', value: data.listLabel, inline: true },
        { name: 'Posição em jogo', value: `#${data.contestedRank}`, inline: true },
      ],
      footer: { text: 'Midnight Club 夜中 — Ladder' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

export function notifyChallengeAccepted(data: {
  challengerName: string;
  challengedName: string;
  challengerPos: number;
  challengedPos: number;
  listLabel: string;
  tracks: string[] | null;
}) {
  const trackList = data.tracks?.map((t, i) => `P${i + 1}: ${t}`).join('\n') || 'N/A';
  return sendDiscordWebhook(null, [
    {
      title: 'Desafio confirmado',
      description: `**${data.challengerName}** (${data.challengerPos}º) vs **${data.challengedName}** (${data.challengedPos}º)`,
      color: COLOR_PINK,
      fields: [
        { name: 'Lista', value: data.listLabel, inline: true },
        { name: 'Formato', value: 'MD3', inline: true },
        { name: 'Pistas', value: trackList },
      ],
      footer: { text: 'Midnight Club 夜中 — Ladder' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

export function notifyChallengeResult(data: {
  challengerName: string;
  challengedName: string;
  challengerPos: number;
  challengedPos: number;
  listLabel: string;
  score: [number, number];
}) {
  const [cs, ds] = data.score;
  const challengerWon = cs > ds;
  const winnerName = challengerWon ? data.challengerName : data.challengedName;
  const loserName = challengerWon ? data.challengedName : data.challengerName;
  const rankPhrase = `posição **#${data.challengedPos}**`;
  const headline = challengerWon
    ? `**${winnerName}** venceu **${loserName}** e **subiu** para ${rankPhrase} na ${data.listLabel}.`
    : `**${winnerName}** venceu **${loserName}** e **defendeu** ${rankPhrase} na ${data.listLabel}.`;

  return sendDiscordWebhook(null, [
    {
      title: 'Desafio finalizado',
      description: `${headline}\nPlacar: **${cs} × ${ds}**`,
      color: challengerWon ? COLOR_GREEN : COLOR_BLUE,
      fields: [
        { name: 'Lista', value: data.listLabel, inline: true },
        {
          name: 'Antes (ordem)',
          value: `${data.challengerName} (${data.challengerPos}º) vs ${data.challengedName} (${data.challengedPos}º)`,
          inline: false,
        },
      ],
      footer: { text: 'Midnight Club 夜中 — Ladder' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

/** Snapshot textual da ordem (substitui “print” da UI; evita duplicar por tab). */
export async function notifyListStandingsFromPlayers(listId: string, players: { name: string }[]) {
  const label = getListLabel(listId);
  const block = players.map((p, i) => `${String(i + 1).padStart(2, ' ')}. ${p.name}`).join('\n');
  const desc = `\`\`\`\n${block}\n\`\`\``;
  return sendDiscordWebhook(null, [
    {
      title: `Ordem atual — ${label}`,
      description: desc,
      color: COLOR_BLUE,
      footer: { text: 'Midnight Club 夜中 — Snapshot da lista' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

// ── Season lifecycle notifications ──

export function notifySeasonCreated(data: { seasonName: string }) {
  return sendDiscordWebhook(null, [
    {
      title: 'Novo campeonato criado',
      description: `**${data.seasonName}**\nInscrições abertas.`,
      color: COLOR_PINK,
      footer: { text: 'Midnight Club 夜中 — Campeonato' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

export function notifyPilotRegistered(data: { seasonName: string; pilotName: string; totalPilots: number }) {
  return sendDiscordWebhook(null, [
    {
      title: 'Novo piloto inscrito',
      description: `**${data.pilotName}** inscreveu-se em **${data.seasonName}**`,
      color: COLOR_GREEN,
      fields: [{ name: 'Total de pilotos', value: `${data.totalPilots}`, inline: true }],
      footer: { text: 'Midnight Club 夜中 — Campeonato' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

export function notifyChampionshipStarted(data: { seasonName: string; pilotCount: number; pilots: string[] }) {
  return sendDiscordWebhook(null, [
    {
      title: 'Campeonato iniciado',
      description: `**${data.seasonName}** — ${data.pilotCount} pilotos.\n\n${data.pilots.map(p => `• ${p}`).join('\n')}`,
      color: COLOR_YELLOW,
      footer: { text: 'Midnight Club 夜中 — Campeonato' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

// ── Championship notifications ──

export function notifyRaceResult(data: {
  seasonName: string;
  raceNumber: number;
  trackName: string | null;
  results: { pilot_name: string; position: number; points: number }[];
}) {
  const lines = data.results.map(
    (r) => `${r.position === 0 ? 'NP' : `${r.position}º`} — **${r.pilot_name}** (${r.points}pts)`
  );
  return sendDiscordWebhook(null, [
    {
      title: `Resultado — corrida ${data.raceNumber}`,
      description: lines.join('\n'),
      color: COLOR_BLUE,
      fields: [
        { name: 'Campeonato', value: data.seasonName, inline: true },
        { name: 'Pista', value: data.trackName || 'N/A', inline: true },
      ],
      footer: { text: 'Midnight Club 夜中 — Campeonato' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

export function notifyChampionshipFinalized(data: {
  seasonName: string;
  leaderboard: { position: number; pilot_name: string; total: number; wins: number; racePoints: (number | null)[] }[];
}) {
  const top = data.leaderboard.slice(0, 3);
  const medals = ['1.', '2.', '3.'];
  const podium = top.map(
    (e, i) => `${medals[i]} **${e.pilot_name}** — ${e.total}pts (${e.wins} vitória${e.wins !== 1 ? 's' : ''})`
  ).join('\n');

  const fullTable = data.leaderboard
    .map((e) => {
      const rp = e.racePoints.map(p => (p === null ? '—' : p === 0 ? 'NP' : `${p}`)).join(' | ');
      return `${e.position}º **${e.pilot_name}** — ${e.total}pts [${rp}]`;
    })
    .join('\n');

  return sendDiscordWebhook(null, [
    {
      title: 'Campeonato finalizado',
      description: `**${data.seasonName}**\n\n${podium}`,
      color: COLOR_YELLOW,
      fields: [
        { name: 'Classificação', value: fullTable || 'N/A' },
        {
          name: 'Classificados Lista 02',
          value: top.length >= 2 ? `**${top[0].pilot_name}** e **${top[1].pilot_name}**` : 'N/A',
        },
      ],
      footer: { text: 'Midnight Club 夜中 — Campeonato' },
      timestamp: new Date().toISOString(),
    },
  ]);
}
