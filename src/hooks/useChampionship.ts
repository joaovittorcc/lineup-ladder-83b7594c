import { useState, useEffect, useCallback } from 'react';
import { ChampionshipState, Player, Challenge } from '@/types/championship';

const STORAGE_KEY = 'championship-state';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

function createPlayer(name: string, initiationComplete = false): Player {
  return {
    id: crypto.randomUUID(),
    name,
    status: 'available',
    defenseCount: 0,
    cooldownUntil: null,
    initiationComplete,
  };
}

const defaultState: ChampionshipState = {
  lists: [
    {
      id: 'initiation',
      title: 'LISTA INICIAÇÃO',
      players: ['Jota', 'Jota', 'Blake', 'K1', 'Zanin'].map(n => createPlayer(n, false)),
    },
    {
      id: 'list-01',
      title: 'LISTA - 01',
      players: ['Jota', 'Zanin', 'Rocxs', 'Flpn', 'Pedrin'].map(n => createPlayer(n, true)),
    },
    {
      id: 'list-02',
      title: 'LISTA - 02',
      players: ['F.Mid', 'Lunatic', 'Porto', 'Vega', 'Sant', 'Gus', 'And'].map(n => createPlayer(n, true)),
    },
  ],
  challenges: [],
};

function loadState(): ChampionshipState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return defaultState;
}

export function useChampionship() {
  const [state, setState] = useState<ChampionshipState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check and clear expired cooldowns
  useEffect(() => {
    const now = Date.now();
    let changed = false;
    const newLists = state.lists.map(list => ({
      ...list,
      players: list.players.map(p => {
        if (p.status === 'cooldown' && p.cooldownUntil && p.cooldownUntil <= now) {
          changed = true;
          return { ...p, status: 'available' as const, cooldownUntil: null, defenseCount: 0 };
        }
        return p;
      }),
    }));
    if (changed) setState(prev => ({ ...prev, lists: newLists }));
  }, [state.lists]);

  const tryChallenge = useCallback((listId: string, challengerIdx: number, challengedIdx: number): string | null => {
    const list = state.lists.find(l => l.id === listId);
    if (!list) return 'Lista não encontrada';

    const challenger = list.players[challengerIdx];
    const challenged = list.players[challengedIdx];
    if (!challenger || !challenged) return 'Jogador não encontrado';

    if (listId === 'initiation') {
      return 'Jogadores da Iniciação devem completar a iniciação antes de desafiar';
    }

    if (challenger.status !== 'available') return 'Você está ocupado (em corrida ou cooldown)';
    if (challenged.status !== 'available') return 'O adversário está ocupado (em corrida ou cooldown)';

    // Adjacency rule: can only challenge exactly 1 position above
    if (challengerIdx <= challengedIdx) return 'Ação Bloqueada: Desafio inválido';
    const diff = challengerIdx - challengedIdx;
    if (diff > 1) return 'Ação Bloqueada: Você só pode desafiar 1 posição acima';

    const challenge: Challenge = {
      id: crypto.randomUUID(),
      listId,
      challengerId: challenger.id,
      challengedId: challenged.id,
      challengerName: challenger.name,
      challengedName: challenged.name,
      challengerPos: challengerIdx,
      challengedPos: challengedIdx,
      status: 'racing',
      type: 'ladder',
      createdAt: Date.now(),
    };

    setState(prev => {
      const newLists = prev.lists.map(l => {
        if (l.id !== listId) return l;
        return {
          ...l,
          players: l.players.map(p => {
            if (p.id === challenger.id || p.id === challenged.id) {
              return { ...p, status: 'racing' as const };
            }
            return p;
          }),
        };
      });
      return { lists: newLists, challenges: [...prev.challenges, challenge] };
    });

    return null;
  }, [state.lists]);

  const challengeInitiationPlayer = useCallback((externalNick: string, targetPlayerId: string) => {
    const initList = state.lists.find(l => l.id === 'initiation');
    if (!initList) return;

    const target = initList.players.find(p => p.id === targetPlayerId);
    if (!target) return;

    const challenge: Challenge = {
      id: crypto.randomUUID(),
      listId: 'initiation',
      challengerId: 'external-' + externalNick,
      challengedId: target.id,
      challengerName: externalNick,
      challengedName: target.name,
      challengerPos: -1,
      challengedPos: initList.players.indexOf(target),
      status: 'pending',
      type: 'initiation',
      createdAt: Date.now(),
    };

    setState(prev => ({
      ...prev,
      challenges: [...prev.challenges, challenge],
    }));
  }, [state.lists]);

  const approveInitiationChallenge = useCallback((challengeId: string) => {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(c =>
        c.id === challengeId ? { ...c, status: 'racing' as const } : c
      ),
    }));
  }, []);

  const rejectInitiationChallenge = useCallback((challengeId: string) => {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.filter(c => c.id !== challengeId),
    }));
  }, []);

  const resolveChallenge = useCallback((challengeId: string, winnerId: string) => {
    setState(prev => {
      const challenge = prev.challenges.find(c => c.id === challengeId);
      if (!challenge || challenge.status !== 'racing') return prev;

      const challengerWon = winnerId === challenge.challengerId;

      const newLists = prev.lists.map(l => {
        if (l.id !== challenge.listId) return l;

        let players = [...l.players];
        const challengerIdx = players.findIndex(p => p.id === challenge.challengerId);
        const challengedIdx = players.findIndex(p => p.id === challenge.challengedId);

        if (challengerIdx === -1 || challengedIdx === -1) return l;

        if (challengerWon) {
          const temp = players[challengedIdx];
          players[challengedIdx] = { ...players[challengerIdx], status: 'available', defenseCount: 0 };
          players[challengerIdx] = { ...temp, status: 'available', defenseCount: 0 };
        } else {
          const defender = players[challengedIdx];
          const newDefenseCount = defender.defenseCount + 1;
          const needsCooldown = newDefenseCount >= 2;

          players[challengedIdx] = {
            ...defender,
            status: needsCooldown ? 'cooldown' : 'available',
            defenseCount: newDefenseCount,
            cooldownUntil: needsCooldown ? Date.now() + COOLDOWN_MS : null,
          };
          players[challengerIdx] = { ...players[challengerIdx], status: 'available' };
        }

        return { ...l, players };
      });

      const newChallenges = prev.challenges.map(c =>
        c.id === challengeId ? { ...c, status: 'completed' as const } : c
      );

      return { lists: newLists, challenges: newChallenges };
    });
  }, []);

  const reorderPlayers = useCallback((listId: string, oldIndex: number, newIndex: number) => {
    setState(prev => {
      const newLists = prev.lists.map(l => {
        if (l.id !== listId) return l;
        const players = [...l.players];
        const [moved] = players.splice(oldIndex, 1);
        players.splice(newIndex, 0, moved);
        return { ...l, players };
      });
      return { ...prev, lists: newLists };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const activeChallenges = state.challenges.filter(c => c.status === 'racing');
  const pendingInitiationChallenges = state.challenges.filter(c => c.status === 'pending' && c.type === 'initiation');

  // Check if a nick is in any list
  const isPlayerInLists = useCallback((nick: string): boolean => {
    if (!nick.trim()) return false;
    const lower = nick.trim().toLowerCase();
    return state.lists.some(l => l.players.some(p => p.name.toLowerCase() === lower));
  }, [state.lists]);

  return {
    lists: state.lists,
    challenges: state.challenges,
    activeChallenges,
    pendingInitiationChallenges,
    tryChallenge,
    challengeInitiationPlayer,
    approveInitiationChallenge,
    rejectInitiationChallenge,
    resolveChallenge,
    reorderPlayers,
    isPlayerInLists,
    resetAll,
  };
}
