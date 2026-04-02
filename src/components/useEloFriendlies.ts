import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EloScore {
  id: string;
  player_name: string;
  points: number;
  wins: number;
  losses: number;
  updated_at: string;
}

export interface FriendlyMatch {
  id: string;
  challenger_name: string;
  challenged_name: string;
  winner_name: string | null;
  challenger_points_before: number;
  challenged_points_before: number;
  challenger_points_delta: number;
  challenged_points_delta: number;
  status: 'pending' | 'racing' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
}

// ELO delta calculation
// K-factor base: 100
// If winner has LESS points than loser  → big reward (+150 max)
// If winner has MORE points than loser  → small reward (+50 min)
export function calcEloDelta(
  winnerPoints: number,
  loserPoints: number
): { winnerDelta: number; loserDelta: number } {
  const diff = winnerPoints - loserPoints; // positive = winner was stronger
  // Scale: diff > 200 → +50, diff < -200 → +150, linear between
  const clamped = Math.max(-200, Math.min(200, diff));
  // Map [-200, 200] → [150, 50]
  const winnerDelta = Math.round(100 - (clamped / 200) * 50);
  const loserDelta = -winnerDelta;
  return { winnerDelta, loserDelta };
}

export function useEloFriendlies(allPlayerNames: string[]) {
  const [eloScores, setEloScores] = useState<EloScore[]>([]);
  const [friendlyMatches, setFriendlyMatches] = useState<FriendlyMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [eloRes, matchRes] = await Promise.all([
      supabase.from('elo_scores').select('*').order('points', { ascending: false }),
      supabase.from('friendly_matches').select('*').order('created_at', { ascending: false }),
    ]);
    if (eloRes.data) setEloScores(eloRes.data as EloScore[]);
    if (matchRes.data) setFriendlyMatches(matchRes.data as FriendlyMatch[]);
    setLoading(false);
  }, []);

  // Ensure every known player has an ELO row (upsert on first load)
  const ensureEloRows = useCallback(async (names: string[]) => {
    for (const name of names) {
      await supabase
        .from('elo_scores')
        .upsert({ player_name: name, points: 1000, wins: 0, losses: 0 }, { onConflict: 'player_name', ignoreDuplicates: true });
    }
    await fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (allPlayerNames.length > 0) {
      ensureEloRows(allPlayerNames);
    }
  }, [allPlayerNames.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time
  useEffect(() => {
    const eloChannel = supabase
      .channel('elo-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'elo_scores' }, fetchAll)
      .subscribe();
    const matchChannel = supabase
      .channel('friendly-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendly_matches' }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(eloChannel);
      supabase.removeChannel(matchChannel);
    };
  }, [fetchAll]);

  // Create a friendly challenge (pending)
  const createFriendly = useCallback(async (challengerName: string, challengedName: string): Promise<string | null> => {
    if (challengerName === challengedName) return 'Não pode desafiar a si mesmo';

    // Check for existing active match between the two
    const existing = friendlyMatches.find(
      m => m.status === 'pending' || m.status === 'racing'
        ? (m.challenger_name === challengerName && m.challenged_name === challengedName) ||
          (m.challenger_name === challengedName && m.challenged_name === challengerName)
        : false
    );
    if (existing) return 'Já existe um amistoso ativo entre esses pilotos';

    const challengerElo = eloScores.find(e => e.player_name === challengerName)?.points ?? 1000;
    const challengedElo = eloScores.find(e => e.player_name === challengedName)?.points ?? 1000;

    const { error } = await supabase.from('friendly_matches').insert({
      challenger_name: challengerName,
      challenged_name: challengedName,
      challenger_points_before: challengerElo,
      challenged_points_before: challengedElo,
      status: 'pending',
    });

    if (error) return error.message;
    return null;
  }, [friendlyMatches, eloScores]);

  // Accept (start) a friendly
  const acceptFriendly = useCallback(async (matchId: string) => {
    await supabase.from('friendly_matches').update({ status: 'racing' }).eq('id', matchId);
  }, []);

  // Cancel a friendly
  const cancelFriendly = useCallback(async (matchId: string) => {
    const match = friendlyMatches.find(m => m.id === matchId);
    if (!match) return;
    await supabase.from('friendly_matches').update({ status: 'cancelled' }).eq('id', matchId);
  }, [friendlyMatches]);

  // Resolve a friendly (admin sets the winner)
  const resolveFriendly = useCallback(async (matchId: string, winnerName: string) => {
    const match = friendlyMatches.find(m => m.id === matchId);
    if (!match || match.status !== 'racing') return;

    const loserName = winnerName === match.challenger_name
      ? match.challenged_name
      : match.challenger_name;

    const winnerPoints = eloScores.find(e => e.player_name === winnerName)?.points ?? 1000;
    const loserPoints = eloScores.find(e => e.player_name === loserName)?.points ?? 1000;

    const { winnerDelta, loserDelta } = calcEloDelta(winnerPoints, loserPoints);

    const isChallenger = winnerName === match.challenger_name;
    const challengerDelta = isChallenger ? winnerDelta : loserDelta;
    const challengedDelta = isChallenger ? loserDelta : winnerDelta;

    // Update match
    await supabase.from('friendly_matches').update({
      status: 'completed',
      winner_name: winnerName,
      challenger_points_delta: challengerDelta,
      challenged_points_delta: challengedDelta,
      completed_at: new Date().toISOString(),
    }).eq('id', matchId);

    // Upsert ELO scores
    const winnerCurrent = eloScores.find(e => e.player_name === winnerName);
    const loserCurrent = eloScores.find(e => e.player_name === loserName);

    await supabase.from('elo_scores').upsert({
      player_name: winnerName,
      points: (winnerCurrent?.points ?? 1000) + winnerDelta,
      wins: (winnerCurrent?.wins ?? 0) + 1,
      losses: winnerCurrent?.losses ?? 0,
    }, { onConflict: 'player_name' });

    await supabase.from('elo_scores').upsert({
      player_name: loserName,
      points: Math.max(0, (loserCurrent?.points ?? 1000) + loserDelta),
      wins: loserCurrent?.wins ?? 0,
      losses: (loserCurrent?.losses ?? 0) + 1,
    }, { onConflict: 'player_name' });
  }, [friendlyMatches, eloScores]);

  // Get last N matches for a specific player
  const getPlayerHistory = useCallback((playerName: string, limit = 5): FriendlyMatch[] => {
    return friendlyMatches
      .filter(m =>
        m.status === 'completed' &&
        (m.challenger_name === playerName || m.challenged_name === playerName)
      )
      .slice(0, limit);
  }, [friendlyMatches]);

  const activeFriendlies = friendlyMatches.filter(m => m.status === 'racing');
  const pendingFriendlies = friendlyMatches.filter(m => m.status === 'pending');

  return {
    eloScores,
    friendlyMatches,
    activeFriendlies,
    pendingFriendlies,
    loading,
    createFriendly,
    acceptFriendly,
    cancelFriendly,
    resolveFriendly,
    getPlayerHistory,
    refetch: fetchAll,
  };
}
