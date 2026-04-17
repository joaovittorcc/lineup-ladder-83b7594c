import { useState, useEffect, useCallback } from 'react';
import { FriendlyMatch, EloRatings, PendingFriendlyChallenge } from '@/types/championship';
import { supabase } from '@/integrations/supabase/client';
import { TRACKS_LIST } from '@/data/tracks';
import {
  buildTrackPool,
  calculateEloChange,
  friendlyLoserName,
  getElo,
  involvesPlayer,
  mapFriendlyDuplicateError,
  namesMatch,
  pickRandomTrack,
} from '@/lib/friendlyLogic';
import {
  notifyFriendlyChallengePending,
  notifyFriendlyChallengeAccepted,
  notifyFriendlyChallengeResult,
} from '@/lib/discord';

interface FriendlyState {
  matches: FriendlyMatch[];
  eloRatings: EloRatings;
  pendingChallenges: PendingFriendlyChallenge[];
  trackPool: string[];
}

const defaultState: FriendlyState = {
  matches: [],
  eloRatings: {},
  pendingChallenges: [],
  trackPool: [...TRACKS_LIST],
};

export function useFriendly() {
  const [state, setState] = useState<FriendlyState>(defaultState);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [matchesRes, ratingsRes, pendingRes, seasonRes] = await Promise.all([
      supabase.from('friendly_matches').select('*').order('created_at', { ascending: false }),
      supabase.from('elo_ratings').select('*'),
      supabase
        .from('friendly_pending_challenges')
        .select('*')
        .in('status', ['pending', 'racing'])
        .order('created_at', { ascending: true }),
      supabase.from('championship_seasons').select('pistas').eq('is_active', true).maybeSingle(),
    ]);

    const firstErr =
      matchesRes.error || ratingsRes.error || pendingRes.error || seasonRes.error;
    setFetchError(firstErr ? firstErr.message : null);

    const dbMatches = matchesRes.data || [];
    const dbRatings = ratingsRes.data || [];
    const dbPending = pendingRes.data || [];

    const matches: FriendlyMatch[] = dbMatches.map((m: any) => ({
      id: m.id,
      challengerName: m.challenger_name,
      challengedName: m.challenged_name,
      winnerName: m.winner_name,
      loserName: m.loser_name,
      challengerEloBefore: m.challenger_elo_before,
      challengedEloBefore: m.challenged_elo_before,
      challengerEloAfter: m.challenger_elo_after,
      challengedEloAfter: m.challenged_elo_after,
      eloChange: m.elo_change,
      createdAt: new Date(m.created_at).getTime(),
      trackName: m.track_name ?? null,
    }));

    const eloRatings: EloRatings = {};
    dbRatings.forEach((r: any) => {
      eloRatings[r.player_name.toLowerCase()] = r.rating;
    });

    const pendingChallenges: PendingFriendlyChallenge[] = dbPending.map((r: any) => ({
      id: r.id,
      challengerName: r.challenger_name,
      challengedName: r.challenged_name,
      status: r.status as 'pending' | 'racing',
      trackName: r.track_name ?? null,
      createdAt: new Date(r.created_at).getTime(),
    }));

    const trackPool = buildTrackPool(seasonRes.data?.pistas);

    setState(prev => ({
      ...prev,
      matches,
      eloRatings,
      pendingChallenges,
      trackPool,
    }));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel('friendly-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendly_matches' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'elo_ratings' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendly_pending_challenges' }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const getPlayerElo = useCallback(
    (name: string): number => {
      return getElo(state.eloRatings, name);
    },
    [state.eloRatings]
  );

  const getAllEloRatings = useCallback((): EloRatings => {
    return { ...state.eloRatings };
  }, [state.eloRatings]);

  const createFriendlyChallenge = useCallback(
    async (challengerName: string, challengedName: string): Promise<string | null> => {
      const c1 = challengerName.trim();
      const c2 = challengedName.trim();
      if (!c1 || !c2) return 'Nomes inválidos.';
      if (namesMatch(c1, c2)) return 'Não podes desafiar a ti mesmo.';

      const active = state.pendingChallenges;
      if (active.some(r => involvesPlayer(r, c1))) {
        return 'Já tens um amistoso ativo (como desafiante ou desafiado).';
      }
      if (active.some(r => involvesPlayer(r, c2))) {
        return 'Este piloto já está num amistoso ativo.';
      }

      const { error } = await supabase.from('friendly_pending_challenges').insert({
        challenger_name: c1,
        challenged_name: c2,
        status: 'pending',
      });

      if (error) {
        if (mapFriendlyDuplicateError(error.message)) {
          return 'Já existe um desafio ativo entre estes pilotos.';
        }
        return error.message;
      }

      // Notificar Discord sobre novo desafio amistoso
      await notifyFriendlyChallengePending({
        challengerName: c1,
        challengedName: c2,
        challengerElo: getElo(state.eloRatings, c1),
        challengedElo: getElo(state.eloRatings, c2),
      });

      await fetchAll();
      return null;
    },
    [state.pendingChallenges, state.eloRatings, fetchAll]
  );

  const acceptFriendlyChallenge = useCallback(
    async (
      pendingId: string,
      actingAsName: string
    ): Promise<{ error: string | null; trackName?: string }> => {
      const row = state.pendingChallenges.find(p => p.id === pendingId);
      if (!row || row.status !== 'pending') return { error: 'Desafio não encontrado ou já respondido.' };
      if (!namesMatch(actingAsName, row.challengedName)) return { error: 'Só o desafiado pode aceitar.' };

      const pool = state.trackPool.length > 0 ? state.trackPool : [...TRACKS_LIST];
      const trackName = pickRandomTrack(pool);

      const { error } = await supabase
        .from('friendly_pending_challenges')
        .update({ status: 'racing', track_name: trackName })
        .eq('id', pendingId)
        .eq('status', 'pending');

      if (error) return { error: error.message };

      // Notificar Discord sobre desafio aceito
      await notifyFriendlyChallengeAccepted({
        challengerName: row.challengerName,
        challengedName: row.challengedName,
        challengerElo: getElo(state.eloRatings, row.challengerName),
        challengedElo: getElo(state.eloRatings, row.challengedName),
        track: trackName,
      });

      await fetchAll();
      return { error: null, trackName };
    },
    [state.pendingChallenges, state.trackPool, state.eloRatings, fetchAll]
  );

  const declineFriendlyChallenge = useCallback(
    async (pendingId: string, actingAsName: string): Promise<string | null> => {
      const row = state.pendingChallenges.find(p => p.id === pendingId);
      if (!row || row.status !== 'pending') return 'Desafio não encontrado.';
      if (!namesMatch(actingAsName, row.challengedName)) return 'Só o desafiado pode recusar.';

      const { error } = await supabase.from('friendly_pending_challenges').delete().eq('id', pendingId);
      if (error) return error.message;
      await fetchAll();
      return null;
    },
    [state.pendingChallenges, fetchAll]
  );

  const cancelFriendlyChallenge = useCallback(
    async (pendingId: string, actingAsName: string): Promise<string | null> => {
      const row = state.pendingChallenges.find(p => p.id === pendingId);
      if (!row || row.status !== 'pending') return 'Só podes cancelar um desafio ainda pendente.';
      if (!namesMatch(actingAsName, row.challengerName)) return 'Só o desafiante pode cancelar.';

      const { error } = await supabase.from('friendly_pending_challenges').delete().eq('id', pendingId);
      if (error) return error.message;
      await fetchAll();
      return null;
    },
    [state.pendingChallenges, fetchAll]
  );

  const adminCancelFriendlyChallenge = useCallback(
    async (pendingId: string): Promise<string | null> => {
      const { error } = await supabase.from('friendly_pending_challenges').delete().eq('id', pendingId);
      if (error) return error.message;
      await fetchAll();
      return null;
    },
    [fetchAll]
  );

  const resolveFriendly = useCallback(
    async (winnerName: string, pendingId: string): Promise<string | null> => {
      const row = state.pendingChallenges.find(p => p.id === pendingId);
      if (!row || row.status !== 'racing') return 'Amistoso não está em curso.';

      const { challengerName, challengedName } = row;
      const loserName = friendlyLoserName(winnerName, challengerName, challengedName);

      const winnerElo = getElo(state.eloRatings, winnerName);
      const loserElo = getElo(state.eloRatings, loserName);
      const eloChange = calculateEloChange(winnerElo, loserElo);

      const newWinnerElo = winnerElo + eloChange;
      const newLoserElo = Math.max(100, loserElo - eloChange);

      const challengerEloOld = getElo(state.eloRatings, challengerName);
      const challengedEloOld = getElo(state.eloRatings, challengedName);
      const challengerEloNew = namesMatch(winnerName, challengerName) ? newWinnerElo : newLoserElo;
      const challengedEloNew = namesMatch(winnerName, challengedName) ? newWinnerElo : newLoserElo;

      const insertPayload = {
        challenger_name: challengerName,
        challenged_name: challengedName,
        winner_name: winnerName,
        loser_name: loserName,
        challenger_elo_before: challengerEloOld,
        challenged_elo_before: challengedEloOld,
        challenger_elo_after: challengerEloNew,
        challenged_elo_after: challengedEloNew,
        elo_change: eloChange,
        track_name: row.trackName,
      };

      const { error: insErr } = await supabase.from('friendly_matches').insert(insertPayload as never);
      if (insErr) return insErr.message;

      await supabase.from('elo_ratings').upsert(
        { player_name: winnerName.toLowerCase(), rating: newWinnerElo } as never,
        { onConflict: 'player_name' }
      );
      await supabase.from('elo_ratings').upsert(
        { player_name: loserName.toLowerCase(), rating: newLoserElo } as never,
        { onConflict: 'player_name' }
      );

      const { error: delErr } = await supabase.from('friendly_pending_challenges').delete().eq('id', pendingId);
      if (delErr) return delErr.message;

      // Notificar Discord sobre resultado do amistoso
      await notifyFriendlyChallengeResult({
        challengerName,
        challengedName,
        winnerName,
        loserName,
        track: row.trackName || 'Pista não definida',
        challengerEloOld,
        challengedEloOld,
        challengerEloNew,
        challengedEloNew,
      });

      await fetchAll();
      return null;
    },
    [state.pendingChallenges, state.eloRatings, fetchAll]
  );

  const getPlayerHistory = useCallback(
    (name: string): FriendlyMatch[] => {
      const lower = name.toLowerCase();
      return state.matches
        .filter(m => m.challengerName.toLowerCase() === lower || m.challengedName.toLowerCase() === lower)
        .slice(0, 5);
    },
    [state.matches]
  );

  const getEloRanking = useCallback(
    (allPlayerNames: string[]) => {
      const uniqueNames = [...new Set(allPlayerNames.map(n => n.toLowerCase()))];
      const rankings = uniqueNames.map(name => {
        const elo = getElo(state.eloRatings, name);
        const matches = state.matches.filter(
          m => m.challengerName.toLowerCase() === name || m.challengedName.toLowerCase() === name
        );
        const wins = matches.filter(m => m.winnerName.toLowerCase() === name).length;
        const losses = matches.filter(m => m.loserName.toLowerCase() === name).length;
        const displayName = allPlayerNames.find(n => n.toLowerCase() === name) || name;
        return { name: displayName, elo, wins, losses };
      });
      rankings.sort((a, b) => b.elo - a.elo);
      return rankings;
    },
    [state.eloRatings, state.matches]
  );

  const setManualElo = useCallback(async (name: string, elo: number) => {
    await supabase.from('elo_ratings').upsert(
      { player_name: name.toLowerCase(), rating: elo } as never,
      { onConflict: 'player_name' }
    );
    setState(prev => {
      const newRatings = { ...prev.eloRatings };
      newRatings[name.toLowerCase()] = elo;
      return { ...prev, eloRatings: newRatings };
    });
  }, []);

  const resetFriendly = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  return {
    matches: state.matches,
    eloRatings: state.eloRatings,
    pendingChallenges: state.pendingChallenges,
    getPlayerElo,
    getAllEloRatings,
    createFriendlyChallenge,
    acceptFriendlyChallenge,
    declineFriendlyChallenge,
    cancelFriendlyChallenge,
    adminCancelFriendlyChallenge,
    resolveFriendly,
    getPlayerHistory,
    getEloRanking,
    setManualElo,
    resetFriendly,
    friendlyFetchError: fetchError,
  };
}
