const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1490438882548908204/tQQvPgMuqczmwdeKyt2Y5QkmM0JwVOFirUeQp7CSltk-DCSazdDIso9YP8kelZkgqKx4';

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export async function sendDiscordWebhook(
  content: string | null,
  embeds: DiscordEmbed[]
) {
  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, embeds }),
    });
    if (!res.ok) {
      console.error('❌ Discord webhook falhou:', res.status, await res.text());
    } else {
      console.log('✅ Notificação Discord enviada com sucesso');
    }
  } catch (err) {
    console.error('❌ Falha ao enviar webhook Discord:', err);
  }
}

// ── Colors (decimal) ──
const COLOR_PINK = 0xff1493;
const COLOR_GREEN = 0x00ff7f;
const COLOR_YELLOW = 0xffd700;
const COLOR_RED = 0xff4444;
const COLOR_BLUE = 0x5865f2;

// ── Challenge notifications ──

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
      title: '⚔️ DESAFIO CONFIRMADO',
      description: `**${data.challengerName}** (${data.challengerPos}º) desafiou **${data.challengedName}** (${data.challengedPos}º)`,
      color: COLOR_PINK,
      fields: [
        { name: '📋 Lista', value: data.listLabel, inline: true },
        { name: '🏁 Formato', value: 'MD3', inline: true },
        { name: '🛣️ Pistas', value: trackList },
      ],
      footer: { text: 'Midnight Club 夜中 — Campeonato Interno' },
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
  const winnerName = cs > ds ? data.challengerName : data.challengedName;
  const loserName = cs > ds ? data.challengedName : data.challengerName;
  return sendDiscordWebhook(null, [
    {
      title: '🏆 DESAFIO FINALIZADO',
      description: `**${winnerName}** venceu **${loserName}**\nPlacar: **${cs} × ${ds}**`,
      color: COLOR_GREEN,
      fields: [
        { name: '📋 Lista', value: data.listLabel, inline: true },
        { name: '📊 Posições', value: `${data.challengerName} (${data.challengerPos}º) vs ${data.challengedName} (${data.challengedPos}º)`, inline: false },
      ],
      footer: { text: 'Midnight Club 夜中 — Campeonato Interno' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

// ── Season lifecycle notifications ──

export function notifySeasonCreated(data: { seasonName: string }) {
  return sendDiscordWebhook(null, [
    {
      title: '🏁 NOVO CAMPEONATO CRIADO',
      description: `**${data.seasonName}**\nInscrições abertas! Use o app para se inscrever.`,
      color: COLOR_PINK,
      footer: { text: 'Midnight Club 夜中 — Campeonato' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

export function notifyPilotRegistered(data: { seasonName: string; pilotName: string; totalPilots: number }) {
  return sendDiscordWebhook(null, [
    {
      title: '✍️ NOVO PILOTO INSCRITO',
      description: `**${data.pilotName}** se inscreveu no campeonato **${data.seasonName}**`,
      color: COLOR_GREEN,
      fields: [
        { name: '👥 Total de Pilotos', value: `${data.totalPilots}`, inline: true },
      ],
      footer: { text: 'Midnight Club 夜中 — Campeonato' },
      timestamp: new Date().toISOString(),
    },
  ]);
}

export function notifyChampionshipStarted(data: { seasonName: string; pilotCount: number; pilots: string[] }) {
  return sendDiscordWebhook(null, [
    {
      title: '🟢 CAMPEONATO INICIADO',
      description: `**${data.seasonName}** começou com **${data.pilotCount} pilotos**!\n\n${data.pilots.map(p => `• ${p}`).join('\n')}`,
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
      title: `🏁 RESULTADO — CORRIDA ${data.raceNumber}`,
      description: lines.join('\n'),
      color: COLOR_BLUE,
      fields: [
        { name: '🏆 Campeonato', value: data.seasonName, inline: true },
        { name: '🛣️ Pista', value: data.trackName || 'N/A', inline: true },
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
  const medals = ['🥇', '🥈', '🥉'];
  const podium = top.map(
    (e, i) => `${medals[i]} **${e.pilot_name}** — ${e.total}pts (${e.wins} vitória${e.wins !== 1 ? 's' : ''})`
  ).join('\n');

  const fullTable = data.leaderboard.map(
    (e) => {
      const rp = e.racePoints.map(p => p === null ? '—' : p === 0 ? 'NP' : `${p}`).join(' | ');
      return `${e.position}º **${e.pilot_name}** — ${e.total}pts [${rp}]`;
    }
  ).join('\n');

  return sendDiscordWebhook(null, [
    {
      title: '🏆 CAMPEONATO FINALIZADO',
      description: `**${data.seasonName}**\n\n${podium}`,
      color: COLOR_YELLOW,
      fields: [
        { name: '📊 Classificação Completa', value: fullTable || 'N/A' },
        { name: '🎉 Classificados Lista 02', value: top.length >= 2 ? `**${top[0].pilot_name}** e **${top[1].pilot_name}**` : 'N/A' },
      ],
      footer: { text: 'Midnight Club 夜中 — Campeonato' },
      timestamp: new Date().toISOString(),
    },
  ]);
}
