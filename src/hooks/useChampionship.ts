import { useState, useEffect, useCallback } from 'react';
import { ChampionshipState, Player, Challenge, JokerProgress } from '@/types/championship';
import { syncChallengeInsert, syncChallengeStatusUpdate, syncChallengeScoreUpdate } from '@/lib/challengeSync';

const STORAGE_KEY = 'championship-state';
const SAVED_LAYOUT_KEY = 'championship-saved-layout';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const CHALLENGE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

function createPlayer(name: string, initiationComplete = false): Player {
  return {
    id: crypto.randomUUID(),
    name,
    status: 'available',
    defenseCount: 0,
    cooldownUntil: null,
    challengeCooldownUntil: null,
    initiationComplete,
  };
}

const defaultState: ChampionshipState = {
  lists: [
    {
      id: 'initiation',
      title: 'LISTA INICIAÇÃO',
      players: ['Muniz', 'Evojota', '​Pedrin', 'K1', 'Zanin'].map(n => createPlayer(n, false)),
    },
    {
      id: 'list-01',
      title: 'LISTA - 01',
      players: ['Evojota', 'Zanin', 'Rocxs', 'Flpn', 'Porto'].map(n => createPlayer(n, true)),
    },
    {
      id: 'list-02',
      title: 'LISTA - 02',
      players: ['Lunatic', 'F.mid', 'Veiga', 'Pedrin', 'Gus', 'Sant', 'Vitin'].map(n => createPlayer(n, true)),
    },
  ],
  challenges: [],
  jokerProgress: {},
};

function loadState(): ChampionshipState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.jokerProgress) parsed.jokerProgress = {};
      return parsed;
    }
  } catch {}
  return defaultState;
}

export function useChampionship() {
  const [state, setState] = useState<ChampionshipState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const now = Date.now();
    let changed = false;
    const newLists = state.lists.map(list => ({
      ...list,
      players: list.players.map(p => {
        let updated = { ...p };
        let playerChanged = false;
        if (p.status === 'cooldown' && p.cooldownUntil && p.cooldownUntil <= now) {
          updated = { ...updated, status: 'available' as const, cooldownUntil: null, defenseCount: 0 };
          playerChanged = true;
        }
        if (p.challengeCooldownUntil && p.challengeCooldownUntil <= now) {
          updated = { ...updated, challengeCooldownUntil: null };
          playerChanged = true;
        }
        if (playerChanged) changed = true;
        return playerChanged ? updated : p;
      }),
    }));
    if (changed) setState(prev => ({ ...prev, lists: newLists }));
  }, [state.lists]);

  const tryChallenge = useCallback((listId: string, challengerIdx: number, challengedIdx: number, isAdminOverride = false, tracks?: [string, string, string]): string | null => {
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

    if (challenger.challengeCooldownUntil && challenger.challengeCooldownUntil > Date.now()) {
      const remaining = Math.ceil((challenger.challengeCooldownUntil - Date.now()) / (1000 * 60 * 60 * 24));
      return `Bloqueado: Aguarde ${remaining} dia(s) para desafiar novamente`;
    }

    if (challengerIdx === challengedIdx) return 'Não pode desafiar a si mesmo';
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
      tracks,
      score: [0, 0],
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
      return { ...prev, lists: newLists, challenges: [...prev.challenges, challenge] };
    });

    // Sync to Supabase (triggers Discord notification for 'racing' status)
    syncChallengeInsert(challenge);

    return null;
  }, [state.lists]);

  const tryCrossListChallenge = useCallback((tracks?: [string, string, string]): string | null => {
    const list02 = state.lists.find(l => l.id === 'list-02');
    const list01 = state.lists.find(l => l.id === 'list-01');
    if (!list02 || !list01) return 'Listas não encontradas';
    if (list02.players.length === 0 || list01.players.length === 0) return 'Listas vazias';

    const challenger = list02.players[0];
    const challenged = list01.players[list01.players.length - 1];

    if (challenger.status !== 'available') return 'Você está ocupado (em corrida ou cooldown)';
    if (challenged.status !== 'available') return 'O adversário está ocupado (em corrida ou cooldown)';

    if (challenger.challengeCooldownUntil && challenger.challengeCooldownUntil > Date.now()) {
      const remaining = Math.ceil((challenger.challengeCooldownUntil - Date.now()) / (1000 * 60 * 60 * 24));
      return `Bloqueado: Aguarde ${remaining} dia(s) para desafiar novamente`;
    }

    const challenge: Challenge = {
      id: crypto.randomUUID(),
      listId: 'cross-list',
      challengerId: challenger.id,
      challengedId: challenged.id,
      challengerName: challenger.name,
      challengedName: challenged.name,
      challengerPos: 0,
      challengedPos: list01.players.length - 1,
      status: 'racing',
      type: 'ladder',
      createdAt: Date.now(),
      tracks,
      score: [0, 0],
    };

    setState(prev => {
      const newLists = prev.lists.map(l => {
        if (l.id === 'list-02') {
          return { ...l, players: l.players.map(p => p.id === challenger.id ? { ...p, status: 'racing' as const } : p) };
        }
        if (l.id === 'list-01') {
          return { ...l, players: l.players.map(p => p.id === challenged.id ? { ...p, status: 'racing' as const } : p) };
        }
        return l;
      });
      return { ...prev, lists: newLists, challenges: [...prev.challenges, challenge] };
    });

    syncChallengeInsert(challenge);
    return null;
  }, [state.lists]);

  const tryStreetRunnerChallenge = useCallback((streetRunnerName: string, tracks?: [string, string, string]): string | null => {
    const list02 = state.lists.find(l => l.id === 'list-02');
    if (!list02 || list02.players.length === 0) return 'Lista 02 vazia';

    const lastPlayer = list02.players[list02.players.length - 1];
    if (lastPlayer.status !== 'available') return 'O adversário está ocupado (em corrida ou cooldown)';

    const challenge: Challenge = {
      id: crypto.randomUUID(),
      listId: 'street-runner',
      challengerId: 'sr-' + streetRunnerName,
      challengedId: lastPlayer.id,
      challengerName: streetRunnerName,
      challengedName: lastPlayer.name,
      challengerPos: -1,
      challengedPos: list02.players.length - 1,
      status: 'racing',
      type: 'ladder',
      createdAt: Date.now(),
      tracks,
      score: [0, 0],
    };

    setState(prev => {
      const newLists = prev.lists.map(l => {
        if (l.id === 'list-02') {
          return { ...l, players: l.players.map(p => p.id === lastPlayer.id ? { ...p, status: 'racing' as const } : p) };
        }
        return l;
      });
      return { ...prev, lists: newLists, challenges: [...prev.challenges, challenge] };
    });

    syncChallengeInsert(challenge);
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

    // Sync to Supabase (pending status - no Discord notification)
    syncChallengeInsert(challenge);
  }, [state.lists]);

  const approveInitiationChallenge = useCallback((challengeId: string) => {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(c =>
        c.id === challengeId ? { ...c, status: 'racing' as const } : c
      ),
    }));

    // Sync to Supabase (triggers Discord notification for 'racing')
    syncChallengeStatusUpdate(challengeId, 'racing');
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

      // Handle initiation (MD1) resolution
      if (challenge.type === 'initiation') {
        const jokerWon = winnerId === challenge.challengerId;
        let newJokerProgress = { ...prev.jokerProgress };

        if (jokerWon) {
          // Extract joker username from challengerId (format: "external-NickName")
          const jokerNick = challenge.challengerName.toLowerCase();
          const defeated = newJokerProgress[jokerNick] || [];
          if (!defeated.includes(challenge.challengedId)) {
            newJokerProgress[jokerNick] = [...defeated, challenge.challengedId];
          }
        }

        const newChallenges = prev.challenges.map(c =>
          c.id === challengeId ? { ...c, status: 'completed' as const } : c
        );

        // Sync initiation resolution to Supabase
        syncChallengeStatusUpdate(challengeId, 'completed');

        return { ...prev, challenges: newChallenges, jokerProgress: newJokerProgress };
      }

      // Handle cross-list challenge (L02 #1 vs L01 last)
      if (challenge.listId === 'cross-list') {
        const challengerWon = winnerId === challenge.challengerId;
        const challengeCooldown = Date.now() + CHALLENGE_COOLDOWN_MS;

        const newLists = prev.lists.map(l => {
          if (l.id === 'list-02') {
            return {
              ...l,
              players: l.players.map(p => {
                if (p.id === challenge.challengerId) {
                  if (challengerWon) return p; // will be removed
                  return { ...p, status: 'available' as const, challengeCooldownUntil: challengeCooldown };
                }
                return p;
              }),
            };
          }
          if (l.id === 'list-01') {
            return {
              ...l,
              players: l.players.map(p => {
                if (p.id === challenge.challengedId) {
                  if (challengerWon) return p; // will be removed
                  const newDefenseCount = p.defenseCount + 1;
                  const needsCooldown = newDefenseCount >= 2;
                  return {
                    ...p,
                    status: needsCooldown ? 'cooldown' as const : 'available' as const,
                    defenseCount: newDefenseCount,
                    cooldownUntil: needsCooldown ? Date.now() + COOLDOWN_MS : null,
                  };
                }
                return p;
              }),
            };
          }
          return l;
        });

        let finalLists = newLists;
        if (challengerWon) {
          // Swap: challenger goes to last of L01, challenged goes to first of L02
          const list02 = finalLists.find(l => l.id === 'list-02')!;
          const list01 = finalLists.find(l => l.id === 'list-01')!;
          const challengerPlayer = list02.players.find(p => p.id === challenge.challengerId)!;
          const challengedPlayer = list01.players.find(p => p.id === challenge.challengedId)!;

          finalLists = finalLists.map(l => {
            if (l.id === 'list-02') {
              const without = l.players.filter(p => p.id !== challenge.challengerId);
              return { ...l, players: [{ ...challengedPlayer, status: 'available' as const, defenseCount: 0, cooldownUntil: null, challengeCooldownUntil: null }, ...without] };
            }
            if (l.id === 'list-01') {
              const without = l.players.filter(p => p.id !== challenge.challengedId);
              return { ...l, players: [...without, { ...challengerPlayer, status: 'available' as const, defenseCount: 0, challengeCooldownUntil: challengeCooldown }] };
            }
            return l;
          });
        }

        const newChallenges = prev.challenges.map(c =>
          c.id === challengeId ? { ...c, status: 'completed' as const } : c
        );

        syncChallengeStatusUpdate(challengeId, 'completed', challenge.score);
        return { ...prev, lists: finalLists, challenges: newChallenges };
      }

      // Handle ladder (MD3) resolution
      const challengerWon = winnerId === challenge.challengerId;

      const newLists = prev.lists.map(l => {
        if (l.id !== challenge.listId) return l;

        let players = [...l.players];
        const challengerIdx = players.findIndex(p => p.id === challenge.challengerId);
        const challengedIdx = players.findIndex(p => p.id === challenge.challengedId);

        if (challengerIdx === -1 || challengedIdx === -1) return l;

        const challengeCooldown = Date.now() + CHALLENGE_COOLDOWN_MS;

        if (challengerWon) {
          const temp = players[challengedIdx];
          players[challengedIdx] = { ...players[challengerIdx], status: 'available', defenseCount: 0, challengeCooldownUntil: challengeCooldown };
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
          players[challengerIdx] = { ...players[challengerIdx], status: 'available', challengeCooldownUntil: challengeCooldown };
        }

        return { ...l, players };
      });

      const newChallenges = prev.challenges.map(c =>
        c.id === challengeId ? { ...c, status: 'completed' as const } : c
      );

      syncChallengeStatusUpdate(challengeId, 'completed', challenge.score);

      return { ...prev, lists: newLists, challenges: newChallenges };
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

  const clearAllCooldowns = useCallback(() => {
    setState(prev => ({
      ...prev,
      lists: prev.lists.map(list => ({
        ...list,
        players: list.players.map(p => ({
          ...p,
          status: p.status === 'cooldown' ? 'available' as const : p.status,
          cooldownUntil: null,
          challengeCooldownUntil: null,
          defenseCount: p.status === 'cooldown' ? 0 : p.defenseCount,
        })),
      })),
    }));
  }, []);

  const setPlayerStatus = useCallback((playerId: string, newStatus: 'available' | 'racing' | 'cooldown') => {
    setState(prev => ({
      ...prev,
      lists: prev.lists.map(list => ({
        ...list,
        players: list.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            status: newStatus,
            cooldownUntil: newStatus === 'cooldown' ? Date.now() + COOLDOWN_MS : null,
            defenseCount: newStatus === 'available' ? 0 : p.defenseCount,
            challengeCooldownUntil: newStatus === 'available' ? null : p.challengeCooldownUntil,
          };
        }),
      })),
    }));
  }, []);

  const addPoint = useCallback((challengeId: string, side: 'challenger' | 'challenged') => {
    setState(prev => {
      const challenge = prev.challenges.find(c => c.id === challengeId);
      if (!challenge || challenge.status !== 'racing') return prev;

      // For initiation challenges (MD1): 1 point = winner
      if (challenge.type === 'initiation') {
        const winnerId = side === 'challenger' ? challenge.challengerId : challenge.challengedId;
        const jokerWon = winnerId === challenge.challengerId;
        let newJokerProgress = { ...prev.jokerProgress };

        if (jokerWon) {
          const jokerNick = challenge.challengerName.toLowerCase();
          const defeated = newJokerProgress[jokerNick] || [];
          if (!defeated.includes(challenge.challengedId)) {
            newJokerProgress[jokerNick] = [...defeated, challenge.challengedId];
          }
        }

        const initScore: [number, number] = side === 'challenger' ? [1, 0] : [0, 1];
        const newChallenges = prev.challenges.map(c =>
          c.id === challengeId ? { ...c, status: 'completed' as const, score: initScore } : c
        );

        // Sync initiation completion to Supabase
        syncChallengeScoreUpdate(challengeId, initScore, 'completed', {
          challenger_name: challenge.challengerName,
          challenged_name: challenge.challengedName,
          challenger_pos: challenge.challengerPos,
          challenged_pos: challenge.challengedPos,
          list_id: challenge.listId,
          type: challenge.type,
        });

        return { ...prev, challenges: newChallenges, jokerProgress: newJokerProgress };
      }

      // MD3 logic
      const [cs, ds] = challenge.score || [0, 0];
      if (cs >= 2 || ds >= 2) return prev;

      const newScore: [number, number] = side === 'challenger' ? [cs + 1, ds] : [cs, ds + 1];
      const newChallenges = prev.challenges.map(c =>
        c.id === challengeId ? { ...c, score: newScore } : c
      );

      if (newScore[0] >= 2 || newScore[1] >= 2) {
        const winnerId = newScore[0] >= 2 ? challenge.challengerId : challenge.challengedId;
        const challengerWon = winnerId === challenge.challengerId;
        const challengeCooldown = Date.now() + CHALLENGE_COOLDOWN_MS;

        // Cross-list resolution
        if (challenge.listId === 'cross-list') {
          let finalLists = prev.lists.map(l => {
            if (l.id === 'list-02') {
              return {
                ...l,
                players: l.players.map(p => {
                  if (p.id === challenge.challengerId) {
                    if (challengerWon) return p;
                    return { ...p, status: 'available' as const, challengeCooldownUntil: challengeCooldown };
                  }
                  return p;
                }),
              };
            }
            if (l.id === 'list-01') {
              return {
                ...l,
                players: l.players.map(p => {
                  if (p.id === challenge.challengedId) {
                    if (challengerWon) return p;
                    const newDefenseCount = p.defenseCount + 1;
                    const needsCooldown = newDefenseCount >= 2;
                    return {
                      ...p,
                      status: needsCooldown ? 'cooldown' as const : 'available' as const,
                      defenseCount: newDefenseCount,
                      cooldownUntil: needsCooldown ? Date.now() + COOLDOWN_MS : null,
                    };
                  }
                  return p;
                }),
              };
            }
            return l;
          });

          if (challengerWon) {
            const list02 = finalLists.find(l => l.id === 'list-02')!;
            const list01 = finalLists.find(l => l.id === 'list-01')!;
            const challengerPlayer = list02.players.find(p => p.id === challenge.challengerId)!;
            const challengedPlayer = list01.players.find(p => p.id === challenge.challengedId)!;

            finalLists = finalLists.map(l => {
              if (l.id === 'list-02') {
                const without = l.players.filter(p => p.id !== challenge.challengerId);
                return { ...l, players: [{ ...challengedPlayer, status: 'available' as const, defenseCount: 0, cooldownUntil: null, challengeCooldownUntil: null }, ...without] };
              }
              if (l.id === 'list-01') {
                const without = l.players.filter(p => p.id !== challenge.challengedId);
                return { ...l, players: [...without, { ...challengerPlayer, status: 'available' as const, defenseCount: 0, challengeCooldownUntil: challengeCooldown }] };
              }
              return l;
            });
          }

          syncChallengeScoreUpdate(challengeId, newScore, 'completed', {
            challenger_name: challenge.challengerName,
            challenged_name: challenge.challengedName,
            challenger_pos: challenge.challengerPos,
            challenged_pos: challenge.challengedPos,
            list_id: challenge.listId,
            type: challenge.type,
          });

          return {
            ...prev,
            lists: finalLists,
            challenges: newChallenges.map(c =>
              c.id === challengeId ? { ...c, status: 'completed' as const, score: newScore } : c
            ),
          };
        }

        // Street runner challenge resolution
        if (challenge.listId === 'street-runner') {
          let finalLists = prev.lists.map(l => {
            if (l.id === 'list-02') {
              return {
                ...l,
                players: l.players.map(p => {
                  if (p.id === challenge.challengedId) {
                    if (challengerWon) return p; // will be replaced below
                    const newDefenseCount = p.defenseCount + 1;
                    const needsCooldown = newDefenseCount >= 2;
                    return {
                      ...p,
                      status: needsCooldown ? 'cooldown' as const : 'available' as const,
                      defenseCount: newDefenseCount,
                      cooldownUntil: needsCooldown ? Date.now() + COOLDOWN_MS : null,
                    };
                  }
                  return p;
                }),
              };
            }
            return l;
          });

          if (challengerWon) {
            // Street runner takes the last spot of L02, defender is removed
            const newPlayer = createPlayer(challenge.challengerName, true);
            newPlayer.challengeCooldownUntil = challengeCooldown;
            finalLists = finalLists.map(l => {
              if (l.id === 'list-02') {
                const without = l.players.filter(p => p.id !== challenge.challengedId);
                return { ...l, players: [...without, newPlayer] };
              }
              return l;
            });
          }

          syncChallengeScoreUpdate(challengeId, newScore, 'completed', {
            challenger_name: challenge.challengerName,
            challenged_name: challenge.challengedName,
            challenger_pos: challenge.challengerPos,
            challenged_pos: challenge.challengedPos,
            list_id: challenge.listId,
            type: challenge.type,
          });

          return {
            ...prev,
            lists: finalLists,
            challenges: newChallenges.map(c =>
              c.id === challengeId ? { ...c, status: 'completed' as const, score: newScore } : c
            ),
          };
        }

        // Standard same-list resolution
        const newLists = prev.lists.map(l => {
          if (l.id !== challenge.listId) return l;
          let players = [...l.players];
          const cIdx = players.findIndex(p => p.id === challenge.challengerId);
          const dIdx = players.findIndex(p => p.id === challenge.challengedId);
          if (cIdx === -1 || dIdx === -1) return l;

          if (challengerWon) {
            const temp = players[dIdx];
            players[dIdx] = { ...players[cIdx], status: 'available', defenseCount: 0, challengeCooldownUntil: challengeCooldown };
            players[cIdx] = { ...temp, status: 'available', defenseCount: 0 };
          } else {
            const defender = players[dIdx];
            const newDefenseCount = defender.defenseCount + 1;
            const needsCooldown = newDefenseCount >= 2;
            players[dIdx] = {
              ...defender,
              status: needsCooldown ? 'cooldown' : 'available',
              defenseCount: newDefenseCount,
              cooldownUntil: needsCooldown ? Date.now() + COOLDOWN_MS : null,
            };
            players[cIdx] = { ...players[cIdx], status: 'available', challengeCooldownUntil: challengeCooldown };
          }
          return { ...l, players };
        });

        syncChallengeScoreUpdate(challengeId, newScore, 'completed', {
          challenger_name: challenge.challengerName,
          challenged_name: challenge.challengedName,
          challenger_pos: challenge.challengerPos,
          challenged_pos: challenge.challengedPos,
          list_id: challenge.listId,
          type: challenge.type,
        });

        return {
          ...prev,
          lists: newLists,
          challenges: newChallenges.map(c =>
            c.id === challengeId ? { ...c, status: 'completed' as const, score: newScore } : c
          ),
        };
      }

      // Sync score update (no status change yet)
      syncChallengeScoreUpdate(challengeId, newScore);

      return { ...prev, challenges: newChallenges };
    });
  }, []);

  const movePlayerToList = useCallback((playerName: string, fromListId: string, toListId: string, toPosition?: number) => {
    setState(prev => {
      const fromList = prev.lists.find(l => l.id === fromListId);
      const toList = prev.lists.find(l => l.id === toListId);
      if (!fromList || !toList) return prev;

      const playerIdx = fromList.players.findIndex(p => p.name.toLowerCase() === playerName.toLowerCase());
      if (playerIdx === -1) return prev;

      const player = { ...fromList.players[playerIdx], status: 'available' as const, cooldownUntil: null, challengeCooldownUntil: null, defenseCount: 0 };

      const newFromPlayers = fromList.players.filter((_, i) => i !== playerIdx);
      const newToPlayers = [...toList.players];
      const insertAt = toPosition !== undefined ? toPosition : newToPlayers.length;
      newToPlayers.splice(insertAt, 0, player);

      const newLists = prev.lists.map(l => {
        if (l.id === fromListId) return { ...l, players: newFromPlayers };
        if (l.id === toListId) return { ...l, players: newToPlayers };
        return l;
      });

      return { ...prev, lists: newLists };
    });
  }, []);

  const autoPromoteTopFromList02 = useCallback(() => {
    setState(prev => {
      const list02 = prev.lists.find(l => l.id === 'list-02');
      const list01 = prev.lists.find(l => l.id === 'list-01');
      if (!list02 || !list01 || list02.players.length === 0) return prev;

      const topPlayer = { ...list02.players[0], status: 'available' as const, cooldownUntil: null, challengeCooldownUntil: null, defenseCount: 0 };

      const newList02Players = list02.players.slice(1);
      const newList01Players = [...list01.players, topPlayer];

      const newLists = prev.lists.map(l => {
        if (l.id === 'list-02') return { ...l, players: newList02Players };
        if (l.id === 'list-01') return { ...l, players: newList01Players };
        return l;
      });

      return { ...prev, lists: newLists };
    });
  }, []);

  const saveListLayout = useCallback(() => {
    const layout = state.lists.map(l => ({
      id: l.id,
      title: l.title,
      playerNames: l.players.map(p => p.name),
      initiationComplete: l.players.map(p => p.initiationComplete),
    }));
    localStorage.setItem(SAVED_LAYOUT_KEY, JSON.stringify(layout));
  }, [state.lists]);

  const resetAll = useCallback(() => {
    const savedLayout = localStorage.getItem(SAVED_LAYOUT_KEY);
    if (savedLayout) {
      try {
        const layout = JSON.parse(savedLayout) as { id: string; title: string; playerNames: string[]; initiationComplete: boolean[] }[];
        const restoredState: ChampionshipState = {
          lists: layout.map(l => ({
            id: l.id,
            title: l.title,
            players: l.playerNames.map((name, i) => createPlayer(name, l.initiationComplete?.[i] ?? true)),
          })),
          challenges: [],
          jokerProgress: {},
        };
        setState(restoredState);
        localStorage.removeItem(STORAGE_KEY);
        return;
      } catch {}
    }
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const activeChallenges = state.challenges.filter(c => c.status === 'racing');
  const pendingInitiationChallenges = state.challenges.filter(c => c.status === 'pending' && c.type === 'initiation');

  const isPlayerInLists = useCallback((nick: string): boolean => {
    if (!nick.trim()) return false;
    const lower = nick.trim().toLowerCase();
    return state.lists.some(l => l.players.some(p => p.name.toLowerCase() === lower));
  }, [state.lists]);

  const getJokerProgress = useCallback((jokerNick: string): string[] => {
    return state.jokerProgress[jokerNick.toLowerCase()] || [];
  }, [state.jokerProgress]);

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
    clearAllCooldowns,
    setPlayerStatus,
    resetAll,
    addPoint,
    getJokerProgress,
    movePlayerToList,
    autoPromoteTopFromList02,
    tryCrossListChallenge,
    tryStreetRunnerChallenge,
    saveListLayout,
  };
}
