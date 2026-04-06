import { supabase } from '@/integrations/supabase/client';
import { Challenge } from '@/types/championship';
import { notifyChallengeAccepted, notifyChallengeResult } from '@/lib/discord';

function getListLabel(listId: string): string {
  if (listId.toLowerCase().includes('01') || listId === 'list-1') return 'Lista 01';
  if (listId.toLowerCase().includes('02') || listId === 'list-2') return 'Lista 02';
  return listId;
}

/**
 * Insert a new challenge into Supabase and notify Discord (status=racing).
 */
export async function syncChallengeInsert(challenge: Challenge) {
  const score = challenge.score ?? [0, 0];
  const { error } = await supabase.from('challenges').insert({
    list_id: challenge.listId,
    challenger_id: challenge.challengerId,
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
  }

  // Send Discord webhook for accepted challenge
  if (challenge.status === 'racing' && challenge.type === 'ladder') {
    console.log('📤 Enviando notificação de desafio confirmado ao Discord...');
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
  score?: [number, number] | number[] | null
) {
  const update: Record<string, unknown> = { status };
  if (score !== undefined && score !== null) {
    update.score_challenger = score[0];
    update.score_challenged = score[1];
  }
  const { error } = await supabase
    .from('challenges')
    .update(update as any)
    .eq('id', challengeId);
  if (error) console.error('Failed to sync challenge status update:', error);
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
  }
) {
  const update: Record<string, unknown> = { score_challenger: score[0], score_challenged: score[1] };
  if (status) update.status = status;
  const { error } = await supabase
    .from('challenges')
    .update(update as any)
    .eq('id', challengeId);
  if (error) console.error('Failed to sync challenge score update:', error);

  // Send Discord webhook for completed challenge
  if (status === 'completed' && challengeData && challengeData.type === 'ladder') {
    console.log('📤 Enviando resultado do desafio ao Discord...');
    await notifyChallengeResult({
      challengerName: challengeData.challenger_name,
      challengedName: challengeData.challenged_name,
      challengerPos: challengeData.challenger_pos + 1,
      challengedPos: challengeData.challenged_pos + 1,
      listLabel: getListLabel(challengeData.list_id),
      score,
    });
  }
}
