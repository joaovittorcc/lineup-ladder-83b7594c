import { useState, useEffect, useCallback } from 'react';
import { FriendlyMatch, EloRatings } from '@/types/championship';

const FRIENDLY_STORAGE_KEY = 'friendly-state';
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

function loadState(): FriendlyState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = localStorage.getItem(FRIENDLY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.eloRatings) parsed.eloRatings = {};
      if (!parsed.matches) parsed.matches = [];
      if (!parsed.pendingFriendly) parsed.pendingFriendly = null;
      return parsed;
    }
  } catch {}
  return defaultState;
}

function calculateEloChange(winnerElo: number, loserElo: number): number {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const change = Math.round(K_FACTOR * (1 - expectedWinner));
  return Math.max(10, change); // minimum 10 points change
}

function getElo(ratings: EloRatings, name: string): number {
  return ratings[name.toLowerCase()] ?? BASE_ELO;
}

export function useFriendly() {
  const [state, setState] = useState<FriendlyState>(loadState);

  useEffect(() => {
    localStorage.setItem(FRIENDLY_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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

  const resolveFriendly = useCallback((winnerName: string) => {
    setState(prev => {
      if (!prev.pendingFriendly || prev.pendingFriendly.status !== 'racing') return prev;

      const { challengerName, challengedName } = prev.pendingFriendly;
      const loserName = winnerName === challengerName ? challengedName : challengerName;

      const winnerElo = getElo(prev.eloRatings, winnerName);
      const loserElo = getElo(prev.eloRatings, loserName);
      const eloChange = calculateEloChange(winnerElo, loserElo);

      const newRatings = { ...prev.eloRatings };
      newRatings[winnerName.toLowerCase()] = winnerElo + eloChange;
      newRatings[loserName.toLowerCase()] = Math.max(100, loserElo - eloChange);

      const match: FriendlyMatch = {
        id: crypto.randomUUID(),
        challengerName,
        challengedName,
        winnerName,
        loserName,
        challengerEloBefore: getElo(prev.eloRatings, challengerName),
        challengedEloBefore: getElo(prev.eloRatings, challengedName),
        challengerEloAfter: newRatings[challengerName.toLowerCase()],
        challengedEloAfter: newRatings[challengedName.toLowerCase()],
        eloChange,
        createdAt: Date.now(),
      };

      return {
        ...prev,
        matches: [match, ...prev.matches],
        eloRatings: newRatings,
        pendingFriendly: null,
      };
    });
  }, []);

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
      // find display name (original casing)
      const displayName = allPlayerNames.find(n => n.toLowerCase() === name) || name;
      return { name: displayName, elo, wins, losses };
    });
    rankings.sort((a, b) => b.elo - a.elo);
    return rankings;
  }, [state.eloRatings, state.matches]);

  const setManualElo = useCallback((name: string, elo: number) => {
    setState(prev => {
      const newRatings = { ...prev.eloRatings };
      newRatings[name.toLowerCase()] = elo;
      return { ...prev, eloRatings: newRatings };
    });
  }, []);

  const resetFriendly = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(FRIENDLY_STORAGE_KEY);
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
