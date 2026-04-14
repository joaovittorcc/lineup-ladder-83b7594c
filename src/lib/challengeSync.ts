import { supabase } from '@/integrations/supabase/client';
import { Challenge } from '@/types/championship';
import {
  getListLabel,
  notifyChallengeAccepted,
  notifyChallengeCancelled,
  notifyChallengePending,
  notifyChallengeResult,
  notifyInitiationChallengePending,
  notifyInitiationChallengeResult,
} from '@/lib/discord';

function dbChallengerPayload(challenge: Challenge): { challenger_id: string | null; synthetic_challenger_id: string | null } {
  const externalList = challenge.listId === 'street-runner' || challenge.listId === 'initiation';
  if (externalList) {
    return { challenger_id: null, synthetic_challenger_id: challenge.challengerId };
  }
  return { challenger_id: challenge.challengerId, synthetic_challenger_id: null };
}

/**
 * Insert a new challenge into Supabase and notify Discord (pending ou já em corrida).
 */
export async function syncChallengeInsert(challenge: Challenge) {
  const score = challenge.score ?? [0, 0];
  const { challenger_id, synthetic_challenger_id } = dbChallengerPayload(challenge);
  const { error } = await supabase.from('challenges').insert({
    list_id: challenge.listId,
    challenger_id,
    synthetic_challenger_id,
    challenged_id: challenge.challengedId,
    challenger_name: challenge.challengerName,
    challenged_name: challenge.challengedName,
    challenger_pos: challenge.challengerPos,
    challenged_pos: challenge.challengedPos,
    status: challenge.status,
    type: challenge.type,
    tracks: challenge.tracks ?? null,
    score_challenger: score[0],
    score_challenged: score[1],
  } as any);
  if (error) {
    console.error('Failed to sync challenge insert:', error);
    return;
  }

  if (challenge.type === 'ladder' && challenge.status === 'pending') {
    await notifyChallengePending({
      challengerName: challenge.challengerName,
      challengedName: challenge.challengedName,
      contestedRank: challenge.challengedPos + 1,
      listLabel: getListLabel(challenge.listId),
      awaitsAcceptance: challenge.listId !== 'street-runner',
    });
  }

  if (challenge.type === 'initiation' && challenge.status === 'pending') {
    await notifyInitiationChallengePending({
      challengerName: challenge.challengerName,
      challengedName: challenge.challengedName,
      listLabel: getListLabel(challenge.listId),
    });
  }

  if (challenge.status === 'racing' && challenge.type === 'ladder') {
    await notifyChallengeAccepted({
      challengerName: challenge.challengerName,
      challengedName: challenge.challengedName,
      challengerPos: challenge.challengerPos + 1,
      challengedPos: challenge.challengedPos + 1,
      listLabel: getListLabel(challenge.listId),
      tracks: challenge.tracks ?? null,
    });
  }
}

/**
 * Update challenge status in Supabase.
 */
export async function syncChallengeStatusUpdate(
  challengeId: string,
  status: string,
  score?: [number, number] | number[] | null,
  meta?: {
    challengerName?: string;
    challengedName?: string;
    challengerPos?: number;
    challengedPos?: number;
    listId?: string;
    tracks?: string[] | null;
    /** Só para cancelamento explícito (ex.: desafiado recusou) — evita notificar em resets admin */
    notifyCancellation?: boolean;
  }
) {
  const update: Record<string, unknown> = { status };
  if (status === 'racing') {
    update.accepted_at = new Date().toISOString();
  }
  if (score !== undefined && score !== null) {
    update.score_challenger = score[0];
    update.score_challenged = score[1];
  }
  if (meta?.tracks) {
    update.tracks = meta.tracks;
  }
  const { error } = await supabase.from('challenges').update(update as any).eq('id', challengeId);
  if (error) console.error('Failed to sync challenge status update:', error);

  if (status === 'racing' && meta?.listId && meta.challengerName && meta.challengedName) {
    await notifyChallengeAccepted({
      challengerName: meta.challengerName,
      challengedName: meta.challengedName,
      challengerPos: (meta.challengerPos ?? 0) + 1,
      challengedPos: (meta.challengedPos ?? 0) + 1,
      listLabel: getListLabel(meta.listId),
      tracks: meta.tracks ?? null,
    });
  }

  if (
    status === 'cancelled' &&
    meta?.notifyCancellation &&
    meta.listId &&
    meta.challengerName &&
    meta.challengedName
  ) {
    await notifyChallengeCancelled({
      challengerName: meta.challengerName,
      challengedName: meta.challengedName,
      listLabel: getListLabel(meta.listId),
      contestedRank: meta.challengedPos != null ? meta.challengedPos + 1 : undefined,
    });
  }
}

/**
 * Update challenge score in Supabase and notify Discord on completion.
 */
export async function syncChallengeScoreUpdate(
  challengeId: string,
  score: [number, number],
  status?: string,
  challengeData?: {
    challenger_name: string;
    challenged_name: string;
    challenger_pos: number;
    challenged_pos: number;
    list_id: string;
    type: string;
    tracks?: string[] | null;
  }
) {
  const update: Record<string, unknown> = { score_challenger: score[0], score_challenged: score[1] };
  if (status) update.status = status;
  const { error } = await supabase.from('challenges').update(update as any).eq('id', challengeId);
  if (error) console.error('Failed to sync challenge score update:', error);

  if (!challengeData) return;

  const [cs, ds] = score;
  const isWo = status === 'wo';

  if ((status === 'completed' || isWo) && challengeData.type === 'ladder') {
    await notifyChallengeResult({
      challengerName: challengeData.challenger_name,
      challengedName: challengeData.challenged_name,
      challengerPos: challengeData.challenger_pos + 1,
      challengedPos: challengeData.challenged_pos + 1,
      listLabel: getListLabel(challengeData.list_id),
      score,
      tracks: challengeData.tracks ?? null,
      isWo,
    });
  }

  if (status === 'completed' && challengeData.type === 'initiation') {
    const challengerWon = cs > ds;
    await notifyInitiationChallengeResult({
      challengerName: challengeData.challenger_name,
      challengedName: challengeData.challenged_name,
      listLabel: getListLabel(challengeData.list_id),
      winnerName: challengerWon ? challengeData.challenger_name : challengeData.challenged_name,
      loserName: challengerWon ? challengeData.challenged_name : challengeData.challenger_name,
      score,
    });
  }
}
