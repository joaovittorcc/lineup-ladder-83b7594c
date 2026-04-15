/**
 * Discord webhook (lista ladder, campeonatos).
 *
 * Webhooks separados:
 * - VITE_DISCORD_WEBHOOK_RESULTS_URL: para resultados de corridas (campeonatos)
 * - VITE_DISCORD_WEBHOOK_CHALLENGES_URL: para desafios (x1 das listas)
 * 
 * Modo Edge (recomendado se o direto falhar): `VITE_DISCORD_USE_SUPABASE_EDGE=true`, fazer deploy de
 * `supabase/functions/discord-webhook-proxy` e definir o secret `DISCORD_WEBHOOK_URL` no Supabase.
 */

import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import { formatUserMention } from '@/data/discordUsers';

type WebhookType = 'results' | 'challenges';

function getDiscordWebhookUrl(type: WebhookType): string | null {
  if (type === 'results') {
    const u = import.meta.env.VITE_DISCORD_WEBHOOK_RESULTS_URL?.trim();
    return u || null;
  } else {
    const u = import.meta.env.VITE_DISCORD_WEBHOOK_CHALLENGES_URL?.trim();
    return u || null;
  }
}

function useSupabaseEdgeForDiscord(): boolean {
  return import.meta.env.VITE_DISCORD_USE_SUPABASE_EDGE === 'true';
}

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
  embeds: DiscordEmbed[], 
  type: WebhookType = 'challenges'
) {
  if (useSupabaseEdgeForDiscord()) {
    if (!isSupabaseConfigured) {
      console.error(
        '[Discord] VITE_DISCORD_USE_SUPABASE_EDGE=true mas VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY em falta.'
      );
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('discord-webhook-proxy', {
        body: { content, embeds },
      });
      if (error) {
        console.error('[Discord] Edge Function discord-webhook-proxy:', error.message, data);
        return;
      }
    } catch (err) {
      console.error(
        '[Discord] Invocação da Edge Function falhou (função deployada? secret DISCORD_WEBHOOK_URL?)',
        err
      );
    }
    return;
  }

  const url = getDiscordWebhookUrl(type);
  if (!url) {
    const webhookName = type === 'results' ? 'VITE_DISCORD_WEBHOOK_RESULTS_URL' : 'VITE_DISCORD_WEBHOOK_CHALLENGES_URL';
    console.warn(
      `[Discord] Sem notificação (${type}): define ${webhookName} no .env ou VITE_DISCORD_USE_SUPABASE_EDGE=true com função deployada.`
    );
    return;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, embeds }),
    });
    if (!res.ok) {
      console.error('[Discord] Webhook HTTP', res.status, await res.text());
    }
  } catch (err) {
    console.error(
      '[Discord] fetch ao webhook falhou (rede/CORS?). Tenta VITE_DISCORD_USE_SUPABASE_EDGE=true + Edge Function.',
      err
    );
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
  const wait = data.awaitsAcceptance !== false ? '\n_Aguarda aceitação na app (24h) ou W.O._' : '';
  const challengerMention = formatUserMention(data.challengerName);
  const challengedMention = formatUserMention(data.challengedName);
  
  return sendDiscordWebhook(null, [
    {
      title: 'Novo desafio na lista',
      description:
        `${challengerMention} desafiou ${challengedMention} pelo **top ${data.contestedRank}** da **${data.listLabel}**.${wait}`,
      color: COLOR_YELLOW,
      fields: [
        { name: 'Lista', value: data.listLabel, inline: true },
        { name: 'Posição em jogo', value: `Top ${data.contestedRank}`, inline: true },
      ],
      footer: { text: 'Midnight Club 夜中 — Ladder' },
      timestamp: new Date().toISOString(),
    },
  ], 'challenges');
}

export function notifyChallengeAccepted(data: {
  challengerName: string;
  challengedName: string;
  challengerPos: number;
  challengedPos: number;
  listLabel: string;
  tracks: string[] | null;
}) {
  const trackList = data.tracks?.map((t, i) => `Pista ${i + 1}: ${t}`).join('\n') || 'A definir';
  const challengerMention = formatUserMention(data.challengerName);
  const challengedMention = formatUserMention(data.challengedName);
  
  return sendDiscordWebhook(null, [
    {
      title: 'Desafio aceite',
      description: `${challengedMention} aceitou o desafio de ${challengerMention} na **${data.listLabel}**.`,
      color: COLOR_PINK,
      fields: [
        { name: 'Confronto', value: `${challengerMention} (${data.challengerPos}º) vs ${challengedMention} (${data.challengedPos}º)`, inline: false },
        { name: 'Lista', value: data.listLabel, inline: true },
        { name: 'Formato', value: 'MD3', inline: true },
        { name: 'Pistas', value: trackList },
      ],
      footer: { text: 'Midnight Club 夜中 — Ladder' },
      timestamp: new Date().toISOString(),
    },
  ], 'challenges');
}

export function notifyChallengeResult(data: {
  challengerName: string;
  challengedName: string;
  challengerPos: number;
  challengedPos: number;
  listLabel: string;
  score: [number, number];
  tracks?: string[] | null;
  /** Vitória por W.O. (ex.: desafiado não aceitou a tempo) */
  isWo?: boolean;
}) {
  const [cs, ds] = data.score;
  const challengerWon = cs > ds;
  const winnerName = challengerWon ? data.challengerName : data.challengedName;
  const loserName = challengerWon ? data.challengedName : data.challengerName;
  const winnerMention = formatUserMention(winnerName);
  const loserMention = formatUserMention(loserName);
  const challengerMention = formatUserMention(data.challengerName);
  const challengedMention = formatUserMention(data.challengedName);
  
  const rankPhrase = `posição **#${data.challengedPos}**`;
  const placar = data.isWo
    ? `**W.O.** (${cs} × ${ds})`
    : `Placar: **${cs} × ${ds}**`;
  const headline = data.isWo
    ? `${winnerMention} venceu por **W.O.** — ${loserMention} não cumpriu o prazo ou a corrida.`
    : challengerWon
      ? `${winnerMention} venceu ${loserMention} e **subiu** para ${rankPhrase} na **${data.listLabel}**.`
      : `${winnerMention} venceu ${loserMention} e **defendeu** ${rankPhrase} na **${data.listLabel}**.`;

  const tracksBlock =
    data.tracks?.length && !data.isWo
      ? data.tracks.map((t, i) => `Pista ${i + 1}: ${t}`).join('\n')
      : null;

  const fields: DiscordEmbed['fields'] = [
    { name: 'Lista', value: data.listLabel, inline: true },
    {
      name: 'Antes (ordem)',
      value: `${challengerMention} (${data.challengerPos}º) vs ${challengedMention} (${data.challengedPos}º)`,
      inline: false,
    },
  ];
  if (tracksBlock) {
    fields.push({ name: 'Pistas (MD3)', value: tracksBlock, inline: false });
  }

  return sendDiscordWebhook(null, [
    {
      title: data.isWo ? 'Desafio — W.O.' : 'Desafio finalizado',
      description: `${headline}\n${placar}`,
      color: data.isWo ? COLOR_YELLOW : challengerWon ? COLOR_GREEN : COLOR_BLUE,
      fields,
      footer: { text: 'Midnight Club 夜中 — Ladder' },
      timestamp: new Date().toISOString(),
    },
  ], 'challenges');
}

export function notifyChallengeCancelled(data: {
  challengerName: string;
  challengedName: string;
  listLabel: string;
  /** Posição disputada (1-based), opcional */
  contestedRank?: number;
}) {
  const pos =
    data.contestedRank != null ? ` pelo top **${data.contestedRank}**` : '';
  return sendDiscordWebhook(null, [
    {
      title: 'Desafio cancelado',
      description: `**${data.challengedName}** recusou ou cancelou o desafio de **${data.challengerName}**${pos} na **${data.listLabel}**.`,
      color: COLOR_RED,
      fields: [
        { name: 'Lista', value: data.listLabel, inline: true },
        ...(data.contestedRank != null
          ? [{ name: 'Posição', value: `Top ${data.contestedRank}`, inline: true }]
          : []),
      ],
      footer: { text: 'Midnight Club 夜中 — Ladder' },
      timestamp: new Date().toISOString(),
    },
  ], 'challenges');
}

/** Lista de iniciação: desafio pendente (aguarda admin). */
export function notifyInitiationChallengePending(data: {
  challengerName: string;
  challengedName: string;
  listLabel: string;
}) {
  return sendDiscordWebhook(null, [
    {
      title: 'Novo desafio — Iniciação',
      description: `**${data.challengerName}** desafiou **${data.challengedName}** na **${data.listLabel}**.\n_Aguarda aprovação do admin._`,
      color: COLOR_YELLOW,
      footer: { text: 'Midnight Club 夜中 — Iniciação' },
      timestamp: new Date().toISOString(),
    },
  ], 'challenges');
}

/** Lista de iniciação: resultado MD1. */
export function notifyInitiationChallengeResult(data: {
  challengerName: string;
  challengedName: string;
  listLabel: string;
  winnerName: string;
  loserName: string;
  score: [number, number];
}) {
  const [cs, ds] = data.score;
  return sendDiscordWebhook(null, [
    {
      title: 'Iniciação — corrida decidida',
      description: `**${data.winnerName}** venceu **${data.loserName}** (**${cs} × ${ds}**) na **${data.listLabel}**.`,
      color: COLOR_GREEN,
      fields: [
        { name: 'Desafiante', value: data.challengerName, inline: true },
        { name: 'Desafiado', value: data.challengedName, inline: true },
      ],
      footer: { text: 'Midnight Club 夜中 — Iniciação' },
      timestamp: new Date().toISOString(),
    },
  ], 'challenges');
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
  ], 'challenges');
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
  ], 'results');
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
  ], 'results');
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
  ], 'results');
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
  ], 'results');
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
  ], 'results');
}
