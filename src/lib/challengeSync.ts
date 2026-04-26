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
 * Returns the database-generated ID on success, or error message on failure.
 */
export async function syncChallengeInsert(challenge: Challenge): Promise<{ id?: string; error?: string }> {
  const score = challenge.score ?? [0, 0];
  const { challenger_id, synthetic_challenger_id } = dbChallengerPayload(challenge);
  const expiresAt = challenge.expiresAt
    ? new Date(challenge.expiresAt).toISOString()
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  // 🔍 DEBUG: Log do objeto sendo enviado ao Supabase
  const insertPayload = {
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
    expires_at: expiresAt,
    format: challenge.format ?? 'MD3',
  };
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('💾 ENVIANDO PARA SUPABASE (syncChallengeInsert)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📦 Payload completo:');
  console.log(JSON.stringify({
    challenger_name: insertPayload.challenger_name,
    challenged_name: insertPayload.challenged_name,
    challenger_pos: insertPayload.challenger_pos,
    challenged_pos: insertPayload.challenged_pos,
    list_id: insertPayload.list_id,
    format: insertPayload.format,
    type: insertPayload.type,
    status: insertPayload.status,
  }, null, 2));
  console.log('═══════════════════════════════════════════════════════');
  
  // Don't send 'id' - let Supabase auto-generate it
  const { data, error } = await supabase.from('challenges').insert(insertPayload as any).select('id').single();

  if (error) {
    // Se a coluna 'format' ainda não existe no banco, tenta sem ela
    if (error.message?.includes('format') || error.code === '42703') {
      console.warn('⚠️ ═══════════════════════════════════════════════════════');
      console.warn('⚠️ FALLBACK ATIVADO: Coluna format não existe no banco');
      console.warn('⚠️ Execute ADICIONAR_COLUNA_FORMAT.sql no Supabase');
      console.warn('⚠️ Retentando INSERT sem a coluna format...');
      console.warn('⚠️ ═══════════════════════════════════════════════════════');
      
      const fallbackPayload = {
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
        expires_at: expiresAt,
      };
      
      const { data: data2, error: error2 } = await supabase.from('challenges').insert(fallbackPayload as any).select('id').single();
      if (error2) {
        console.error('❌ Failed to sync challenge insert (fallback):', error2);
        return { error: error2.message };
      }
      const fallbackId = data2?.id;
      if (!fallbackId) return { error: 'No ID returned from database' };
      
      console.log('✅ Fallback bem-sucedido! Challenge ID:', fallbackId);
      console.log('⚠️ ATENÇÃO: Formato NÃO foi salvo no banco (coluna não existe)');
      console.log('═══════════════════════════════════════════════════════');
      return { id: fallbackId };
    }
    console.error('❌ Failed to sync challenge insert:', error);
    return { error: error.message };
  }
  
  const dbId = data?.id;
  if (!dbId) {
    console.error('No ID returned from challenge insert');
    return { error: 'No ID returned from database' };
  }

  console.log('✅ ═══════════════════════════════════════════════════════');
  console.log('✅ CHALLENGE SALVO COM SUCESSO NO SUPABASE');
  console.log('✅ Challenge ID:', dbId);
  console.log('✅ Formato salvo:', insertPayload.format);
  console.log('✅ ═══════════════════════════════════════════════════════');

  // Notificar apenas desafios ladder (nunca friendly ou initiation)
  if (challenge.type === 'ladder' && challenge.status === 'pending') {
    await notifyChallengePending({
      challengerName: challenge.challengerName,
      challengedName: challenge.challengedName,
      contestedRank: challenge.challengedPos + 1,
      listLabel: getListLabel(challenge.listId),
      awaitsAcceptance: challenge.listId !== 'street-runner',
    });
  }

  // Notificar apenas desafios de iniciação (nunca friendly ou ladder)
  if (challenge.type === 'initiation' && challenge.status === 'pending') {
    await notifyInitiationChallengePending({
      challengerName: challenge.challengerName,
      challengedName: challenge.challengedName,
      listLabel: getListLabel(challenge.listId),
    });
  }

  // Desabilitado: usuário quer apenas notificações de desafio criado e resultado
  // if (challenge.status === 'racing' && challenge.type === 'ladder') {
  //   await notifyChallengeAccepted({
  //     challengerName: challenge.challengerName,
  //     challengedName: challenge.challengedName,
  //     challengerPos: challenge.challengerPos + 1,
  //     challengedPos: challenge.challengedPos + 1,
  //     listLabel: getListLabel(challenge.listId),
  //     tracks: challenge.tracks ?? null,
  //   });
  // }
  return { id: dbId };
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
    /** Tipo do desafio para filtrar notificações */
    type?: 'ladder' | 'initiation' | 'friendly';
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

  // Desabilitado: usuário quer apenas notificações de desafio criado e resultado
  // if (status === 'racing' && meta?.listId && meta.challengerName && meta.challengedName) {
  //   await notifyChallengeAccepted({
  //     challengerName: meta.challengerName,
  //     challengedName: meta.challengedName,
  //     challengerPos: (meta.challengerPos ?? 0) + 1,
  //     challengedPos: (meta.challengedPos ?? 0) + 1,
  //     listLabel: getListLabel(meta.listId),
  //     tracks: meta.tracks ?? null,
  //   });
  // }

  // Notificar cancelamento apenas para desafios ladder ou initiation (nunca friendly)
  if (
    status === 'cancelled' &&
    meta?.notifyCancellation &&
    meta.listId &&
    meta.challengerName &&
    meta.challengedName &&
    meta.type !== 'friendly'
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

  // Notificar resultado apenas para desafios ladder (nunca friendly)
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

  // Notificar resultado apenas para desafios de iniciação (nunca friendly)
  if (status === 'completed' && challengeData.type === 'initiation') {
    const challengerWon = cs > ds;
    await notifyInitiationChallengeResult({
      challengerName: challengeData.challenger_name,
      challengedName: challengeData.challenged_name,
      listLabel: getListLabel(challengeData.list_id),
      winnerName: challengerWon ? challengeData.challenger_name : challengeData.challenged_name,
      loserName: challengerWon ? challengeData.challenged_name : challengeData.challenger_name,
      score,
      challengerId: challengeData.challenger_id || challengeData.synthetic_challenger_id || undefined,
    });
  }
}
