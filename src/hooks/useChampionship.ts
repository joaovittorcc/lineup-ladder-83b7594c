import { useState, useEffect, useCallback, useRef } from 'react';
import { ChampionshipState, Player, Challenge, JokerProgress, PlayerList } from '@/types/championship';
import { supabase } from '@/integrations/supabase/client';
import { syncChallengeInsert, syncChallengeStatusUpdate, syncChallengeScoreUpdate } from '@/lib/challengeSync';
import { formatPlayersTableError } from '@/lib/playerAllocation';

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
  lists: [],
  challenges: [],
  jokerProgress: {},
};

// Convert DB player row to local Player type
function dbPlayerToLocal(row: any): Player {
  return {
    id: row.id,
    name: row.name,
    status: row.status as Player['status'],
    defenseCount: row.defense_count ?? 0,
    cooldownUntil: row.cooldown_until ? new Date(row.cooldown_until).getTime() : null,
    challengeCooldownUntil: row.challenge_cooldown_until ? new Date(row.challenge_cooldown_until).getTime() : null,
    initiationComplete: row.initiation_complete ?? false,
  };
}

// Convert DB challenge row to local Challenge type
function dbChallengeToLocal(row: any): Challenge {
  return {
    id: row.id,
    listId: row.list_id,
    challengerId: row.challenger_id,
    challengedId: row.challenged_id,
    challengerName: row.challenger_name,
    challengedName: row.challenged_name,
    challengerPos: row.challenger_pos,
    challengedPos: row.challenged_pos,
    status: row.status as Challenge['status'],
    type: row.type as Challenge['type'],
    createdAt: new Date(row.created_at).getTime(),
    tracks: row.tracks as [string, string, string] | undefined,
    score: [row.score_challenger ?? 0, row.score_challenged ?? 0],
  };
}

export function useChampionship() {
  const [state, setState] = useState<ChampionshipState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  // Fetch all data from Supabase
  const fetchAll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [listsRes, playersRes, challengesRes, jokerRes] = await Promise.all([
        supabase.from('player_lists').select('*').order('sort_order'),
        supabase.from('players').select('*').order('position'),
        supabase.from('challenges').select('*').in('status', ['pending', 'racing', 'accepted']),
        supabase.from('joker_progress').select('*'),
      ]);

      const firstErr =
        listsRes.error || playersRes.error || challengesRes.error || jokerRes.error;
      setFetchError(firstErr ? firstErr.message : null);

      const dbLists = listsRes.data || [];
      const dbPlayers = playersRes.data || [];
      const dbChallenges = challengesRes.data || [];
      const dbJoker = jokerRes.data || [];

      // Build player lists
      const lists: PlayerList[] = dbLists.map((l: any) => ({
        id: l.id,
        title: l.title,
        players: dbPlayers
          .filter((p: any) => p.list_id === l.id)
          .sort((a: any, b: any) => a.position - b.position)
          .map(dbPlayerToLocal),
      }));

      // Build challenges
      const challenges: Challenge[] = dbChallenges.map(dbChallengeToLocal);

      // Build joker progress
      const jokerProgress: JokerProgress = {};
      dbJoker.forEach((j: any) => {
        const key = j.joker_user_id;
        if (!jokerProgress[key]) jokerProgress[key] = [];
        jokerProgress[key].push(j.defeated_player_id);
      });

      setState({ lists, challenges, jokerProgress });
      setLoaded(true);
    } catch (err) {
      console.error('Failed to fetch championship data:', err);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('championship-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_lists' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'joker_progress' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // Check expired cooldowns locally
  useEffect(() => {
    if (!loaded) return;
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
  }, [state.lists, loaded]);

  // Helper: update player in DB
  const updatePlayerInDb = async (playerId: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('players').update(updates as any).eq('id', playerId);
    if (error) console.error('Failed to update player:', error);
  };

  // Helper: update player position in DB
  const updatePlayerPositionInDb = async (playerId: string, position: number, listId: string) => {
    const { error } = await supabase.from('players').update({ position, list_id: listId } as any).eq('id', playerId);
    if (error) console.error('Failed to update player position:', error);
  };

  const tryChallenge = useCallback((listId: string, challengerIdx: number, challengedIdx: number, isAdminOverride = false, tracks?: [string, string, string]): string | null => {
    const list = state.lists.find(l => l.id === listId);
    if (!list) return 'Lista não encontrada';

    const challenger = list.players[challengerIdx];
    const challenged = list.players[challengedIdx];
    if (!challenger || !challenged) return 'Jogador não encontrado';

    if (listId === 'initiation') return 'Jogadores da Iniciação devem completar a iniciação antes de desafiar';
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

    // Update local state optimistically
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

    // Sync to DB
    updatePlayerInDb(challenger.id, { status: 'racing' });
    updatePlayerInDb(challenged.id, { status: 'racing' });
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

    updatePlayerInDb(challenger.id, { status: 'racing' });
    updatePlayerInDb(challenged.id, { status: 'racing' });
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

    updatePlayerInDb(lastPlayer.id, { status: 'racing' });
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

    syncChallengeInsert(challenge);
  }, [state.lists]);

  const approveInitiationChallenge = useCallback((challengeId: string) => {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(c =>
        c.id === challengeId ? { ...c, status: 'racing' as const } : c
      ),
    }));
    syncChallengeStatusUpdate(challengeId, 'racing');
  }, []);

  const rejectInitiationChallenge = useCallback((challengeId: string) => {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.filter(c => c.id !== challengeId),
    }));
    syncChallengeStatusUpdate(challengeId, 'cancelled');
  }, []);

  const resolveChallenge = useCallback((challengeId: string, winnerId: string) => {
    setState(prev => {
      const challenge = prev.challenges.find(c => c.id === challengeId);
      if (!challenge || challenge.status !== 'racing') return prev;

      if (challenge.type === 'initiation') {
        const jokerWon = winnerId === challenge.challengerId;
        let newJokerProgress = { ...prev.jokerProgress };

        if (jokerWon) {
          const jokerNick = challenge.challengerName.toLowerCase();
          const defeated = newJokerProgress[jokerNick] || [];
          if (!defeated.includes(challenge.challengedId)) {
            newJokerProgress[jokerNick] = [...defeated, challenge.challengedId];
            // Sync joker progress to DB
            supabase.from('joker_progress').insert({
              joker_user_id: challenge.challengerId,
              defeated_player_id: challenge.challengedId,
            } as any).then(({ error }) => {
              if (error) console.error('Failed to sync joker progress:', error);
            });
          }
        }

        const newChallenges = prev.challenges.map(c =>
          c.id === challengeId ? { ...c, status: 'completed' as const } : c
        );

        syncChallengeStatusUpdate(challengeId, 'completed');
        return { ...prev, challenges: newChallenges, jokerProgress: newJokerProgress };
      }

      // Handle cross-list challenge
      if (challenge.listId === 'cross-list') {
        const challengerWon = winnerId === challenge.challengerId;
        const challengeCooldown = Date.now() + CHALLENGE_COOLDOWN_MS;
        const cooldownIso = new Date(challengeCooldown).toISOString();

        if (challengerWon) {
          // Swap: challenger goes to last of L01, challenged goes to first of L02
          const list02 = prev.lists.find(l => l.id === 'list-02')!;
          const list01 = prev.lists.find(l => l.id === 'list-01')!;
          const challengerPlayer = list02.players.find(p => p.id === challenge.challengerId)!;
          const challengedPlayer = list01.players.find(p => p.id === challenge.challengedId)!;

          // Update DB: move players between lists
          updatePlayerInDb(challenge.challengerId, {
            list_id: 'list-01', position: list01.players.length - 1,
            status: 'available', defense_count: 0, challenge_cooldown_until: cooldownIso
          });
          updatePlayerInDb(challenge.challengedId, {
            list_id: 'list-02', position: 0,
            status: 'available', defense_count: 0, cooldown_until: null, challenge_cooldown_until: null
          });
          // Re-index positions for remaining players
          const remaining02 = list02.players.filter(p => p.id !== challenge.challengerId);
          remaining02.forEach((p, i) => updatePlayerPositionInDb(p.id, i + 1, 'list-02'));
        } else {
          const defender = prev.lists.find(l => l.id === 'list-01')!.players.find(p => p.id === challenge.challengedId)!;
          const newDefenseCount = defender.defenseCount + 1;
          const needsCooldown = newDefenseCount >= 2;
          updatePlayerInDb(challenge.challengerId, { status: 'available', challenge_cooldown_until: cooldownIso });
          updatePlayerInDb(challenge.challengedId, {
            status: needsCooldown ? 'cooldown' : 'available',
            defense_count: newDefenseCount,
            cooldown_until: needsCooldown ? new Date(Date.now() + COOLDOWN_MS).toISOString() : null,
          });
        }

        syncChallengeStatusUpdate(challengeId, 'completed', challenge.score);
        // Refetch to get consistent state
        setTimeout(() => fetchAll(), 300);
        return prev;
      }

      // Handle ladder (MD3) resolution
      const challengerWon = winnerId === challenge.challengerId;
      const challengeCooldown = Date.now() + CHALLENGE_COOLDOWN_MS;
      const cooldownIso = new Date(challengeCooldown).toISOString();

      const list = prev.lists.find(l => l.id === challenge.listId);
      if (!list) return prev;

      const challengerIdx = list.players.findIndex(p => p.id === challenge.challengerId);
      const challengedIdx = list.players.findIndex(p => p.id === challenge.challengedId);
      if (challengerIdx === -1 || challengedIdx === -1) return prev;

      if (challengerWon) {
        // Swap positions in DB
        updatePlayerInDb(challenge.challengerId, {
          position: challengedIdx, status: 'available', defense_count: 0, challenge_cooldown_until: cooldownIso
        });
        updatePlayerInDb(challenge.challengedId, {
          position: challengerIdx, status: 'available', defense_count: 0
        });
      } else {
        const defender = list.players[challengedIdx];
        const newDefenseCount = defender.defenseCount + 1;
        const needsCooldown = newDefenseCount >= 2;
        updatePlayerInDb(challenge.challengedId, {
          status: needsCooldown ? 'cooldown' : 'available',
          defense_count: newDefenseCount,
          cooldown_until: needsCooldown ? new Date(Date.now() + COOLDOWN_MS).toISOString() : null,
        });
        updatePlayerInDb(challenge.challengerId, {
          status: 'available', challenge_cooldown_until: cooldownIso
        });
      }

      syncChallengeStatusUpdate(challengeId, 'completed', challenge.score);
      setTimeout(() => fetchAll(), 300);
      return prev;
    });
  }, [fetchAll]);

  const reorderPlayers = useCallback((listId: string, oldIndex: number, newIndex: number) => {
    setState(prev => {
      const newLists = prev.lists.map(l => {
        if (l.id !== listId) return l;
        const players = [...l.players];
        const [moved] = players.splice(oldIndex, 1);
        players.splice(newIndex, 0, moved);
        // Update positions in DB
        players.forEach((p, i) => updatePlayerPositionInDb(p.id, i, listId));
        return { ...l, players };
      });
      return { ...prev, lists: newLists };
    });
  }, []);

  const clearAllCooldowns = useCallback(() => {
    setState(prev => {
      const newLists = prev.lists.map(list => ({
        ...list,
        players: list.players.map(p => {
          if (p.status === 'cooldown' || p.cooldownUntil || p.challengeCooldownUntil) {
            updatePlayerInDb(p.id, {
              status: p.status === 'cooldown' ? 'available' : p.status,
              cooldown_until: null,
              challenge_cooldown_until: null,
              defense_count: p.status === 'cooldown' ? 0 : p.defenseCount,
            });
          }
          return {
            ...p,
            status: p.status === 'cooldown' ? 'available' as const : p.status,
            cooldownUntil: null,
            challengeCooldownUntil: null,
            defenseCount: p.status === 'cooldown' ? 0 : p.defenseCount,
          };
        }),
      }));
      return { ...prev, lists: newLists };
    });
  }, []);

  const setPlayerStatus = useCallback((playerId: string, newStatus: 'available' | 'racing' | 'cooldown') => {
    const updates: Record<string, any> = {
      status: newStatus,
      cooldown_until: newStatus === 'cooldown' ? new Date(Date.now() + COOLDOWN_MS).toISOString() : null,
      defense_count: newStatus === 'available' ? 0 : undefined,
      challenge_cooldown_until: newStatus === 'available' ? null : undefined,
    };
    // Remove undefined keys
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    updatePlayerInDb(playerId, updates);

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
            supabase.from('joker_progress').insert({
              joker_user_id: challenge.challengerId,
              defeated_player_id: challenge.challengedId,
            } as any);
          }
        }

        const initScore: [number, number] = side === 'challenger' ? [1, 0] : [0, 1];
        const newChallenges = prev.challenges.map(c =>
          c.id === challengeId ? { ...c, status: 'completed' as const, score: initScore } : c
        );

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
        const cooldownIso = new Date(challengeCooldown).toISOString();

        // Cross-list resolution
        if (challenge.listId === 'cross-list') {
          if (challengerWon) {
            const list01 = prev.lists.find(l => l.id === 'list-01')!;
            updatePlayerInDb(challenge.challengerId, {
              list_id: 'list-01', position: list01.players.length - 1,
              status: 'available', defense_count: 0, challenge_cooldown_until: cooldownIso
            });
            updatePlayerInDb(challenge.challengedId, {
              list_id: 'list-02', position: 0,
              status: 'available', defense_count: 0, cooldown_until: null, challenge_cooldown_until: null
            });
          } else {
            const defender = prev.lists.find(l => l.id === 'list-01')!.players.find(p => p.id === challenge.challengedId)!;
            const newDefenseCount = defender.defenseCount + 1;
            const needsCooldown = newDefenseCount >= 2;
            updatePlayerInDb(challenge.challengerId, { status: 'available', challenge_cooldown_until: cooldownIso });
            updatePlayerInDb(challenge.challengedId, {
              status: needsCooldown ? 'cooldown' : 'available',
              defense_count: newDefenseCount,
              cooldown_until: needsCooldown ? new Date(Date.now() + COOLDOWN_MS).toISOString() : null,
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

          setTimeout(() => fetchAll(), 300);
          return {
            ...prev,
            challenges: newChallenges.map(c =>
              c.id === challengeId ? { ...c, status: 'completed' as const, score: newScore } : c
            ),
          };
        }

        // Street runner challenge resolution
        if (challenge.listId === 'street-runner') {
          if (challengerWon) {
            // Create new player in list-02 for the street runner
            const newPlayerId = crypto.randomUUID();
            const list02 = prev.lists.find(l => l.id === 'list-02')!;
            supabase.from('players').insert({
              id: newPlayerId,
              name: challenge.challengerName,
              list_id: 'list-02',
              position: list02.players.length - 1,
              status: 'available',
              initiation_complete: true,
              challenge_cooldown_until: cooldownIso,
            } as any);
            // Remove the defeated player
            supabase.from('players').delete().eq('id', challenge.challengedId);
          } else {
            const defender = prev.lists.find(l => l.id === 'list-02')!.players.find(p => p.id === challenge.challengedId)!;
            const newDefenseCount = defender.defenseCount + 1;
            const needsCooldown = newDefenseCount >= 2;
            updatePlayerInDb(challenge.challengedId, {
              status: needsCooldown ? 'cooldown' : 'available',
              defense_count: newDefenseCount,
              cooldown_until: needsCooldown ? new Date(Date.now() + COOLDOWN_MS).toISOString() : null,
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

          setTimeout(() => fetchAll(), 300);
          return {
            ...prev,
            challenges: newChallenges.map(c =>
              c.id === challengeId ? { ...c, status: 'completed' as const, score: newScore } : c
            ),
          };
        }

        // Standard same-list resolution
        const list = prev.lists.find(l => l.id === challenge.listId);
        if (list) {
          const cIdx = list.players.findIndex(p => p.id === challenge.challengerId);
          const dIdx = list.players.findIndex(p => p.id === challenge.challengedId);
          if (cIdx !== -1 && dIdx !== -1) {
            if (challengerWon) {
              updatePlayerInDb(challenge.challengerId, {
                position: dIdx, status: 'available', defense_count: 0, challenge_cooldown_until: cooldownIso
              });
              updatePlayerInDb(challenge.challengedId, {
                position: cIdx, status: 'available', defense_count: 0
              });
            } else {
              const defender = list.players[dIdx];
              const newDefenseCount = defender.defenseCount + 1;
              const needsCooldown = newDefenseCount >= 2;
              updatePlayerInDb(challenge.challengedId, {
                status: needsCooldown ? 'cooldown' : 'available',
                defense_count: newDefenseCount,
                cooldown_until: needsCooldown ? new Date(Date.now() + COOLDOWN_MS).toISOString() : null,
              });
              updatePlayerInDb(challenge.challengerId, {
                status: 'available', challenge_cooldown_until: cooldownIso
              });
            }
          }
        }

        syncChallengeScoreUpdate(challengeId, newScore, 'completed', {
          challenger_name: challenge.challengerName,
          challenged_name: challenge.challengedName,
          challenger_pos: challenge.challengerPos,
          challenged_pos: challenge.challengedPos,
          list_id: challenge.listId,
          type: challenge.type,
        });

        setTimeout(() => fetchAll(), 300);
        return {
          ...prev,
          challenges: newChallenges.map(c =>
            c.id === challengeId ? { ...c, status: 'completed' as const, score: newScore } : c
          ),
        };
      }

      // Score update only (no completion)
      syncChallengeScoreUpdate(challengeId, newScore);
      return { ...prev, challenges: newChallenges };
    });
  }, [fetchAll]);

  const movePlayerToList = useCallback((playerName: string, fromListId: string, toListId: string, toPosition?: number) => {
    setState(prev => {
      const fromList = prev.lists.find(l => l.id === fromListId);
      const toList = prev.lists.find(l => l.id === toListId);
      if (!fromList || !toList) return prev;

      const playerIdx = fromList.players.findIndex(p => p.name.toLowerCase() === playerName.toLowerCase());
      if (playerIdx === -1) return prev;

      const player = fromList.players[playerIdx];
      const insertAt = toPosition !== undefined ? toPosition : toList.players.length;

      // Update DB
      updatePlayerInDb(player.id, {
        list_id: toListId,
        position: insertAt,
        status: 'available',
        cooldown_until: null,
        challenge_cooldown_until: null,
        defense_count: 0,
      });

      // Re-index from list
      const newFromPlayers = fromList.players.filter((_, i) => i !== playerIdx);
      newFromPlayers.forEach((p, i) => updatePlayerPositionInDb(p.id, i, fromListId));

      // Re-index to list
      const newToPlayers = [...toList.players];
      newToPlayers.splice(insertAt, 0, { ...player, status: 'available', cooldownUntil: null, challengeCooldownUntil: null, defenseCount: 0 });
      newToPlayers.forEach((p, i) => updatePlayerPositionInDb(p.id, i, toListId));

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

      const topPlayer = list02.players[0];

      // Update DB
      updatePlayerInDb(topPlayer.id, {
        list_id: 'list-01',
        position: list01.players.length,
        status: 'available',
        cooldown_until: null,
        challenge_cooldown_until: null,
        defense_count: 0,
      });

      // Re-index list-02
      const remaining = list02.players.slice(1);
      remaining.forEach((p, i) => updatePlayerPositionInDb(p.id, i, 'list-02'));

      const movedPlayer = { ...topPlayer, status: 'available' as const, cooldownUntil: null, challengeCooldownUntil: null, defenseCount: 0 };

      const newLists = prev.lists.map(l => {
        if (l.id === 'list-02') return { ...l, players: remaining };
        if (l.id === 'list-01') return { ...l, players: [...l.players, movedPlayer] };
        return l;
      });

      return { ...prev, lists: newLists };
    });
  }, []);

  const saveListLayout = useCallback(() => {
    // No-op now - data is in the DB
    console.log('Layout salvo no banco de dados automaticamente.');
  }, []);

  /** Admin: insert a new pilot at a chosen list and 0-based index (shift others down). */
  const manualAddPlayer = useCallback(
    async (
      name: string,
      listId: string,
      insertIndex: number,
      initiationComplete?: boolean
    ): Promise<string | null> => {
      const trimmed = name.trim();
      if (!trimmed) return 'Nome do piloto é obrigatório';

      const targetList = state.lists.find(l => l.id === listId);
      if (!targetList) return 'Lista não encontrada';

      const n = targetList.players.length;
      if (insertIndex < 0 || insertIndex > n) return 'Posição inválida';

      const lower = trimmed.toLowerCase();
      const initiation = state.lists.find(l => l.id === 'initiation');
      const list01 = state.lists.find(l => l.id === 'list-01');
      const list02 = state.lists.find(l => l.id === 'list-02');

      if (listId === 'initiation') {
        if (initiation?.players.some(p => p.name.toLowerCase() === lower)) {
          return 'Este piloto já está na lista de iniciação';
        }
      } else if (listId === 'list-01' || listId === 'list-02') {
        if (
          list01?.players.some(p => p.name.toLowerCase() === lower) ||
          list02?.players.some(p => p.name.toLowerCase() === lower)
        ) {
          return 'Este piloto já está na Lista 01 ou 02. Usa mover ou reordenar em vez de adicionar.';
        }
      } else if (state.lists.some(l => l.players.some(p => p.name.toLowerCase() === lower))) {
        return 'Já existe um piloto com este nome nas listas';
      }

      const ordered = targetList.players;
      const initDone = listId === 'initiation' ? (initiationComplete ?? false) : true;

      for (let i = n - 1; i >= insertIndex; i--) {
        const { error } = await supabase
          .from('players')
          .update({ position: i + 1 } as any)
          .eq('id', ordered[i].id);
        if (error) return formatPlayersTableError(error.message);
      }

      const newId = crypto.randomUUID();
      const { error: insertErr } = await supabase.from('players').insert({
        id: newId,
        name: trimmed,
        list_id: listId,
        position: insertIndex,
        status: 'available',
        defense_count: 0,
        initiation_complete: initDone,
        cooldown_until: null,
        challenge_cooldown_until: null,
      } as any);
      if (insertErr) return formatPlayersTableError(insertErr.message);

      await fetchAll();
      return null;
    },
    [state.lists, fetchAll]
  );

  const resetAll = useCallback(async () => {
    // Reset all players to available, clear cooldowns
    const { data: allPlayers } = await supabase.from('players').select('id');
    if (allPlayers) {
      for (const p of allPlayers) {
        await updatePlayerInDb(p.id, {
          status: 'available',
          cooldown_until: null,
          challenge_cooldown_until: null,
          defense_count: 0,
        });
      }
    }
    // Cancel all active challenges
    await supabase.from('challenges').update({ status: 'cancelled' } as any).in('status', ['pending', 'racing', 'accepted']);
    // Refetch
    await fetchAll();
  }, [fetchAll]);

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
    manualAddPlayer,
    championshipLoaded: loaded,
    championshipFetchError: fetchError,
  };
}
