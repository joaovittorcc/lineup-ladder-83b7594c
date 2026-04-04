import { supabase } from '@/integrations/supabase/client';
import { Challenge } from '@/types/championship';

/**
 * Send a Discord notification via the edge function (avoids CORS issues).
 */
async function sendDiscordNotification(payload: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.functions.invoke('discord-challenge-notify', {
      body: payload,
    });
    if (error) {
      console.error('❌ Erro ao enviar notificação Discord via edge function:', error);
    } else {
      console.log('✅ Notificação Discord enviada com sucesso via edge function:', data);
    }
  } catch (err) {
    console.error('❌ Falha na requisição ao edge function Discord:', err);
  }
}

function getListLabel(listId: string): string {
  if (listId.toLowerCase().includes('01') || listId === 'list-1') return 'Lista 01';
  if (listId.toLowerCase().includes('02') || listId === 'list-2') return 'Lista 02';
  return listId;
}

/**
 * Insert a new challenge into Supabase and notify Discord (status=racing).
 */
export async function syncChallengeInsert(challenge: Challenge) {
  const { error } = await supabase.from('challenges').insert({
    id: challenge.id,
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
    score: challenge.score ?? [0, 0],
  });
  if (error) {
    console.error('Failed to sync challenge insert:', error);
  }

  // Send Discord notification for accepted challenge via edge function
  if (challenge.status === 'racing' && challenge.type === 'ladder') {
    console.log('📤 Enviando notificação de desafio confirmado ao Discord...');
    await sendDiscordNotification({
      id: challenge.id,
      list_id: challenge.listId,
      challenger_name: challenge.challengerName,
      challenged_name: challenge.challengedName,
      challenger_pos: challenge.challengerPos + 1,
      challenged_pos: challenge.challengedPos + 1,
      status: 'racing',
      type: challenge.type,
      tracks: challenge.tracks ?? null,
      score: challenge.score ?? [0, 0],
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
    update.score = score;
  }
  const { error } = await supabase
    .from('challenges')
    .update(update)
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
  const update: Record<string, unknown> = { score };
  if (status) update.status = status;
  const { error } = await supabase
    .from('challenges')
    .update(update)
    .eq('id', challengeId);
  if (error) console.error('Failed to sync challenge score update:', error);

  // Send Discord notification for completed challenge via edge function
  if (status === 'completed' && challengeData && challengeData.type === 'ladder') {
    console.log('📤 Enviando resultado do desafio ao Discord...');
    await sendDiscordNotification({
      id: challengeId,
      list_id: challengeData.list_id,
      challenger_name: challengeData.challenger_name,
      challenged_name: challengeData.challenged_name,
      challenger_pos: challengeData.challenger_pos + 1,
      challenged_pos: challengeData.challenged_pos + 1,
      status: 'completed',
      type: challengeData.type,
      tracks: null,
      score,
    });
  }
}
