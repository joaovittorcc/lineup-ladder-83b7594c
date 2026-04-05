import { useState, useEffect, useCallback } from 'react';
import { FriendlyMatch, EloRatings } from '@/types/championship';
import { supabase } from '@/integrations/supabase/client';

const BASE_ELO = 1000;
const K_FACTOR = 32;

interface FriendlyState {
  matches: FriendlyMatch[];
  eloRatings: EloRatings;
  pendingFriendly: {
    id: string;
    challengerName: string;
    challengedName: string;
    status: 'pending' | 'racing';
    createdAt: number;
  } | null;
}

const defaultState: FriendlyState = {
  matches: [],
  eloRatings: {},
  pendingFriendly: null,
};

function calculateEloChange(winnerElo: number, loserElo: number): number {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const change = Math.round(K_FACTOR * (1 - expectedWinner));
  return Math.max(10, change);
}

function getElo(ratings: EloRatings, name: string): number {
  return ratings[name.toLowerCase()] ?? BASE_ELO;
}

export function useFriendly() {
  const [state, setState] = useState<FriendlyState>(defaultState);

  // Fetch from Supabase
  const fetchAll = useCallback(async () => {
    const [matchesRes, ratingsRes] = await Promise.all([
      supabase.from('friendly_matches').select('*').order('created_at', { ascending: false }),
      supabase.from('elo_ratings').select('*'),
    ]);

    const dbMatches = matchesRes.data || [];
    const dbRatings = ratingsRes.data || [];

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
    }));

    const eloRatings: EloRatings = {};
    dbRatings.forEach((r: any) => {
      eloRatings[r.player_name.toLowerCase()] = r.rating;
    });

    setState(prev => ({ ...prev, matches, eloRatings }));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('friendly-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendly_matches' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'elo_ratings' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const getPlayerElo = useCallback((name: string): number => {
    return getElo(state.eloRatings, name);
  }, [state.eloRatings]);

  const getAllEloRatings = useCallback((): EloRatings => {
    return { ...state.eloRatings };
  }, [state.eloRatings]);

  const createFriendlyChallenge = useCallback((challengerName: string, challengedName: string) => {
    setState(prev => ({
      ...prev,
      pendingFriendly: {
        id: crypto.randomUUID(),
        challengerName,
        challengedName,
        status: 'pending',
        createdAt: Date.now(),
      },
    }));
  }, []);

  const approveFriendly = useCallback(() => {
    setState(prev => {
      if (!prev.pendingFriendly) return prev;
      return {
        ...prev,
        pendingFriendly: { ...prev.pendingFriendly, status: 'racing' },
      };
    });
  }, []);

  const rejectFriendly = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingFriendly: null,
    }));
  }, []);

  const resolveFriendly = useCallback(async (winnerName: string) => {
    const pending = state.pendingFriendly;
    if (!pending || pending.status !== 'racing') return;

    const { challengerName, challengedName } = pending;
    const loserName = winnerName === challengerName ? challengedName : challengerName;

    const winnerElo = getElo(state.eloRatings, winnerName);
    const loserElo = getElo(state.eloRatings, loserName);
    const eloChange = calculateEloChange(winnerElo, loserElo);

    const newWinnerElo = winnerElo + eloChange;
    const newLoserElo = Math.max(100, loserElo - eloChange);

    // Insert match into DB
    await supabase.from('friendly_matches').insert({
      challenger_name: challengerName,
      challenged_name: challengedName,
      winner_name: winnerName,
      loser_name: loserName,
      challenger_elo_before: getElo(state.eloRatings, challengerName),
      challenged_elo_before: getElo(state.eloRatings, challengedName),
      challenger_elo_after: winnerName === challengerName ? newWinnerElo : newLoserElo,
      challenged_elo_after: winnerName === challengedName ? newWinnerElo : newLoserElo,
      elo_change: eloChange,
    } as any);

    // Upsert ELO ratings
    await supabase.from('elo_ratings').upsert(
      { player_name: winnerName.toLowerCase(), rating: newWinnerElo } as any,
      { onConflict: 'player_name' }
    );
    await supabase.from('elo_ratings').upsert(
      { player_name: loserName.toLowerCase(), rating: newLoserElo } as any,
      { onConflict: 'player_name' }
    );

    setState(prev => ({ ...prev, pendingFriendly: null }));
    // Refetch to get consistent state
    fetchAll();
  }, [state.pendingFriendly, state.eloRatings, fetchAll]);

  const getPlayerHistory = useCallback((name: string): FriendlyMatch[] => {
    const lower = name.toLowerCase();
    return state.matches
      .filter(m => m.challengerName.toLowerCase() === lower || m.challengedName.toLowerCase() === lower)
      .slice(0, 5);
  }, [state.matches]);

  const getEloRanking = useCallback((allPlayerNames: string[]) => {
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
  }, [state.eloRatings, state.matches]);

  const setManualElo = useCallback(async (name: string, elo: number) => {
    await supabase.from('elo_ratings').upsert(
      { player_name: name.toLowerCase(), rating: elo } as any,
      { onConflict: 'player_name' }
    );
    setState(prev => {
      const newRatings = { ...prev.eloRatings };
      newRatings[name.toLowerCase()] = elo;
      return { ...prev, eloRatings: newRatings };
    });
  }, []);

  const resetFriendly = useCallback(async () => {
    // Note: This only resets local pending state. DB data persists.
    setState(prev => ({ ...prev, pendingFriendly: null }));
  }, []);

  return {
    matches: state.matches,
    eloRatings: state.eloRatings,
    pendingFriendly: state.pendingFriendly,
    getPlayerElo,
    getAllEloRatings,
    createFriendlyChallenge,
    approveFriendly,
    rejectFriendly,
    resolveFriendly,
    getPlayerHistory,
    getEloRanking,
    setManualElo,
    resetFriendly,
  };
}
