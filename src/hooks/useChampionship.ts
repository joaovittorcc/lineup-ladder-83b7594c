import { useState, useEffect, useCallback, useRef } from 'react';
import { ChampionshipState, Player, Challenge, JokerProgress, PlayerList } from '@/types/championship';
import { supabase } from '@/integrations/supabase/client';
import { syncChallengeInsert, syncChallengeStatusUpdate, syncChallengeScoreUpdate } from '@/lib/challengeSync';
import { formatPlayersTableError } from '@/lib/playerAllocation';
import {
  getJokerInitiationCooldownUntil,
  setJokerInitiationCooldownUntil,
  setStreetRunnerList02UnlockAt,
  getStreetRunnerList02UnlockAt,
} from '@/lib/ladderPilotMeta';
import { notifyListStandingsFromPlayers } from '@/lib/discord';

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const CHALLENGE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
/** Cooldown antes do novo último lugar poder receber desafio externo (Street Runner). */
const LIST02_NEW_LAST_EXTERNAL_MS = 1 * 24 * 60 * 60 * 1000;
const LIST02_EXTERNAL_BLOCK_MS = 3 * 24 * 60 * 60 * 1000;

/** Índice do último piloto na Lista 02 (= 8º lugar com 8 vagas). */
export function getList02LastPlaceIndex(playerCount: number): number {
  if (playerCount < 1) return -1;
  return playerCount - 1;
}

function defenderDefenseCooldownMs(listId: string, challengedIdx: number, listLen: number): number {
  if (listId === 'list-02' && challengedIdx === getList02LastPlaceIndex(listLen)) {
    return CHALLENGE_COOLDOWN_MS;
  }
  return COOLDOWN_MS;
}

function createPlayer(name: string, initiationComplete = false): Player {
  return {
    id: crypto.randomUUID(),
    name,
    status: 'available',
    defenseCount: 0,
    cooldownUntil: null,
    challengeCooldownUntil: null,
    initiationComplete,
    defensesWhileSeventhStreak: 0,
    list02ExternalBlockUntil: null,
    list02ExternalEligibleAfter: null,
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
    defensesWhileSeventhStreak: row.defenses_while_seventh_streak ?? 0,
    list02ExternalBlockUntil: row.list02_external_block_until
      ? new Date(row.list02_external_block_until).getTime()
      : null,
    list02ExternalEligibleAfter: row.list02_external_eligible_after
      ? new Date(row.list02_external_eligible_after).getTime()
      : null,
    elegivelDesafioVaga: row.elegivel_desafio_vaga ?? false,
  };
}

// Convert DB challenge row to local Challenge type
function dbChallengeToLocal(row: any): Challenge {
  const cid = row.challenger_id ?? row.synthetic_challenger_id ?? `__legacy__:${row.challenger_name}`;
  const challenge = {
    id: row.id,
    listId: row.list_id,
    challengerId: cid,
    challengedId: row.challenged_id,
    challengerName: row.challenger_name,
    challengedName: row.challenged_name,
    challengerPos: row.challenger_pos,
    challengedPos: row.challenged_pos,
    status: row.status as Challenge['status'],
    type: row.type as Challenge['type'],
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
    tracks: row.tracks as string[] | undefined,
    score: [row.score_challenger ?? 0, row.score_challenged ?? 0],
  };
  
  console.log('🔄 Mapping DB challenge:', {
    id: row.id,
    type: row.type,
    status: row.status,
    expires_at: row.expires_at,
    mapped_expiresAt: challenge.expiresAt
  });
  
  return challenge;
}

export function useChampionship() {
  const [state, setState] = useState<ChampionshipState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const woHandledRef = useRef(new Set<string>());

  const isPlayerInActiveChallenge = useCallback((playerId: string, challenges: Challenge[]) => {
    return challenges.some(
      c =>
        (c.status === 'pending' || c.status === 'accepted' || c.status === 'racing') &&
        (c.challengerId === playerId || c.challengedId === playerId)
    );
  }, []);

  // Fetch all data from Supabase
  const fetchAll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    console.log('🔄 fetchAll() called - fetching from database...');
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

      console.log('📥 Fetched from DB - challenges:', dbChallenges);

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

      console.log('🔄 Mapped challenges:', challenges);

      // Build joker progress
      const jokerProgress: JokerProgress = {};
      dbJoker.forEach((j: any) => {
        const key = String(j.joker_name_key || j.joker_user_id || '')
          .trim()
          .toLowerCase();
        if (!key) return;
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

  /**
   * Após mutações na BD: refetch e, por defeito, snapshot textual ao Discord.
   * `discordSnapshot: false` evita duplicar mensagem quando já foi enviado embed de resultado (MD3/W.O.).
   */
  const scheduleFetchAndListSnapshots = useCallback(
    (listIds: string[], options?: { discordSnapshot?: boolean }) => {
      const unique = [...new Set(listIds.filter(Boolean))];
      if (unique.length === 0) return;
      const sendDiscord = options?.discordSnapshot !== false;
      setTimeout(() => {
        void (async () => {
          await fetchAll();
          if (!sendDiscord) return;
          const lists = stateRef.current.lists;
          for (const id of unique) {
            const pl = lists.find(l => l.id === id);
            if (pl?.players.length) {
              await notifyListStandingsFromPlayers(
                id,
                pl.players.map(p => ({ name: p.name }))
              );
            }
          }
        })();
      }, 300);
    },
    [fetchAll]
  );

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

  // Polling fallback — syncs state every 15 s in case realtime misses an event
  useEffect(() => {
    const id = setInterval(() => { void fetchAll(); }, 15000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Refresh immediately when the user switches back to this tab
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') void fetchAll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
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
        if (p.list02ExternalBlockUntil && p.list02ExternalBlockUntil <= now) {
          updated = { ...updated, list02ExternalBlockUntil: null };
          playerChanged = true;
        }
        if (p.list02ExternalEligibleAfter && p.list02ExternalEligibleAfter <= now) {
          updated = { ...updated, list02ExternalEligibleAfter: null };
          playerChanged = true;
        }
        if (playerChanged) changed = true;
        return playerChanged ? updated : p;
      }),
    }));
    if (changed) setState(prev => ({ ...prev, lists: newLists }));
  }, [state.lists, loaded]);

  // Helper: update player in DB
  const updatePlayerInDb = useCallback(async (playerId: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('players').update(updates as any).eq('id', playerId);
    if (error) console.error('Failed to update player:', error);
  }, []);

  // Helper: update player position in DB
  const updatePlayerPositionInDb = useCallback(async (playerId: string, position: number, listId: string) => {
    const { error } = await supabase.from('players').update({ position, list_id: listId } as any).eq('id', playerId);
    if (error) console.error('Failed to update player position:', error);
  }, []);

  const tryChallenge = useCallback((listId: string, challengerIdx: number, challengedIdx: number, isAdminOverride = false, tracks?: string[], onDbError?: (err: string) => void): string | null => {
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

    if (isPlayerInActiveChallenge(challenger.id, state.challenges) || isPlayerInActiveChallenge(challenged.id, state.challenges)) {
      return 'Um dos pilotos já tem um desafio pendente ou em curso';
    }

    if (!isAdminOverride) {
      // ✅ Proteção contra undefined/null
      const tracksArray = Array.isArray(tracks) ? tracks : [];
      const filledTracks = tracksArray.filter(t => t && t.trim());
      if (filledTracks.length !== 1) return 'Desafios normais devem iniciar com 1 pista preenchida';
    } else {
      // Admin: precisa de 3 pistas preenchidas
      const tracksArray = Array.isArray(tracks) ? tracks : [];
      const filledTracks = tracksArray.filter(t => t && t.trim());
      if (filledTracks.length !== 3) return 'Admins devem selecionar 3 pistas';
    }

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const challenge: Challenge = {
      id: '', // Will be set from DB response
      listId,
      challengerId: challenger.id,
      challengedId: challenged.id,
      challengerName: challenger.name,
      challengedName: challenged.name,
      challengerPos: challengerIdx,
      challengedPos: challengedIdx,
      status: isAdminOverride ? 'racing' : 'pending',
      type: 'ladder',
      createdAt: Date.now(),
      expiresAt,
      tracks,
      score: [0, 0],
    };

    setState(prev => ({
      ...prev,
      challenges: [...prev.challenges, challenge],
    }));

    if (isAdminOverride) {
      updatePlayerInDb(challenger.id, { status: 'racing' });
      updatePlayerInDb(challenged.id, { status: 'racing' });
    }
    
    syncChallengeInsert(challenge).then(result => {
      if (result.error && onDbError) {
        onDbError(result.error);
      } else if (result.id) {
        // Update local state with the DB-generated ID
        setState(prev => ({
          ...prev,
          challenges: prev.challenges.map(c => 
            c === challenge ? { ...c, id: result.id! } : c
          ),
        }));
      }
    });

    return null;
  }, [state.lists, state.challenges, isPlayerInActiveChallenge]);

  const tryCrossListChallenge = useCallback((tracks?: string[], isAdminOverride = false): string | null => {
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

    if (isPlayerInActiveChallenge(challenger.id, state.challenges) || isPlayerInActiveChallenge(challenged.id, state.challenges)) {
      return 'Um dos pilotos já tem um desafio pendente ou em curso';
    }

    if (!isAdminOverride) {
      // ✅ Proteção contra undefined/null
      const tracksArray = Array.isArray(tracks) ? tracks : [];
      const filledTracks = tracksArray.filter(t => t && t.trim());
      if (filledTracks.length !== 1) return 'Desafios normais devem iniciar com 1 pista preenchida';
    } else {
      // Admin: precisa de 3 pistas preenchidas
      const tracksArray = Array.isArray(tracks) ? tracks : [];
      const filledTracks = tracksArray.filter(t => t && t.trim());
      if (filledTracks.length !== 3) return 'Admins devem selecionar 3 pistas';
    }

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const challenge: Challenge = {
      id: '', // Will be set from DB response
      listId: 'cross-list',
      challengerId: challenger.id,
      challengedId: challenged.id,
      challengerName: challenger.name,
      challengedName: challenged.name,
      challengerPos: 0,
      challengedPos: list01.players.length - 1,
      status: isAdminOverride ? 'racing' : 'pending',
      type: 'ladder',
      createdAt: Date.now(),
      expiresAt,
      tracks,
      score: [0, 0],
    };

    setState(prev => ({
      ...prev,
      challenges: [...prev.challenges, challenge],
    }));

    if (isAdminOverride) {
      updatePlayerInDb(challenger.id, { status: 'racing' });
      updatePlayerInDb(challenged.id, { status: 'racing' });
    }
    
    syncChallengeInsert(challenge).then(result => {
      if (result.id) {
        setState(prev => ({
          ...prev,
          challenges: prev.challenges.map(c => 
            c === challenge ? { ...c, id: result.id! } : c
          ),
        }));
      }
    });
    
    return null;
  }, [state.lists, state.challenges, isPlayerInActiveChallenge]);

  const tryStreetRunnerChallenge = useCallback(
    (streetRunnerName: string, tracks?: string[], isAdminOverride = false): string | null => {
      const list02 = state.lists.find(l => l.id === 'list-02');
      if (!list02 || list02.players.length < 1) return 'Lista 02 vazia';

      const lastIdx = getList02LastPlaceIndex(list02.players.length);
      const lastOfL02 = list02.players[lastIdx];
      if (!lastOfL02) return 'Lista 02 inválida';
      if (lastOfL02.status !== 'available') return 'O adversário está ocupado (em corrida ou cooldown)';

      const debutUntil = getStreetRunnerList02UnlockAt(streetRunnerName);
      if (!isAdminOverride && debutUntil && debutUntil > Date.now()) {
        const d = Math.ceil((debutUntil - Date.now()) / (1000 * 60 * 60 * 24));
        return `Cooldown de estreia: aguarda ${d} dia(s) após o Colete Midnight para desafiar o último (8º) da Lista 02`;
      }

      const blockUntil = lastOfL02.list02ExternalBlockUntil;
      if (!isAdminOverride && blockUntil && blockUntil > Date.now()) {
        return 'Este colocado está em período de defesa (não pode receber desafio externo).';
      }
      const eligibleAfter = lastOfL02.list02ExternalEligibleAfter;
      if (!isAdminOverride && eligibleAfter && eligibleAfter > Date.now()) {
        return 'O último lugar ainda não está disponível para desafios externos (cooldown de integração).';
      }

      const syntheticId = crypto.randomUUID();
      if (isPlayerInActiveChallenge(lastOfL02.id, state.challenges)) {
        return 'Este piloto já tem um desafio pendente ou em curso';
      }

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      if (!isAdminOverride) {
        // ✅ Proteção contra undefined/null
        const tracksArray = Array.isArray(tracks) ? tracks : [];
        const filledTracks = tracksArray.filter(t => t && t.trim());
        if (filledTracks.length !== 1) return 'Desafios normais devem iniciar com 1 pista preenchida';
      } else {
        // Admin: precisa de 3 pistas preenchidas
        const tracksArray = Array.isArray(tracks) ? tracks : [];
        const filledTracks = tracksArray.filter(t => t && t.trim());
        if (filledTracks.length !== 3) return 'Admins devem selecionar 3 pistas';
      }

      const challenge: Challenge = {
        id: '', // Will be set from DB response
        listId: 'street-runner',
        challengerId: syntheticId,
        challengedId: lastOfL02.id,
        challengerName: streetRunnerName,
        challengedName: lastOfL02.name,
        challengerPos: -1,
        challengedPos: lastIdx,
        status: isAdminOverride ? 'racing' : 'pending',
        type: 'ladder',
        createdAt: Date.now(),
        expiresAt,
        tracks,
        score: [0, 0],
      };

      setState(prev => ({
        ...prev,
        challenges: [...prev.challenges, challenge],
      }));

      if (isAdminOverride) {
        updatePlayerInDb(lastOfL02.id, { status: 'racing' });
      }
      
      syncChallengeInsert(challenge).then(result => {
        if (result.id) {
          setState(prev => ({
            ...prev,
            challenges: prev.challenges.map(c => 
              c === challenge ? { ...c, id: result.id! } : c
            ),
          }));
        }
      });
      
      return null;
    },
    [state.lists, state.challenges, isPlayerInActiveChallenge]
  );

  const tryDesafioVaga = useCallback(
    (challengerName: string, tracks?: string[], isAdminOverride = false): string | null => {
      const list02 = state.lists.find(l => l.id === 'list-02');
      if (!list02 || list02.players.length < 1) return 'Lista 02 vazia ou não encontrada';

      // Encontrar o 8º da Lista 02 (último colocado)
      const lastIdx = getList02LastPlaceIndex(list02.players.length);
      const oitavoDaLista02 = list02.players[lastIdx];
      
      if (!oitavoDaLista02) return 'Não foi possível encontrar o 8º da Lista 02';
      if (oitavoDaLista02.status !== 'available') return 'O 8º da Lista 02 está ocupado (em corrida ou cooldown)';

      // Verificar se o desafiante completou a iniciação
      const allPlayers = state.lists.flatMap(l => l.players);
      const challenger = allPlayers.find(p => p.name.toLowerCase() === challengerName.toLowerCase());
      
      if (!challenger) return 'Piloto desafiante não encontrado';
      if (!isAdminOverride && !challenger.initiationComplete) {
        return 'Você precisa completar a lista de iniciação primeiro. Peça ao admin para marcar no seu perfil.';
      }

      // Verificar se já tem desafio ativo
      if (isPlayerInActiveChallenge(oitavoDaLista02.id, state.challenges)) {
        return 'O 8º da Lista 02 já tem um desafio pendente ou em curso';
      }

      // Validar pistas (MD3 = 3 pistas)
      if (!isAdminOverride) {
        const tracksArray = Array.isArray(tracks) ? tracks : [];
        const filledTracks = tracksArray.filter(t => t && t.trim());
        if (filledTracks.length !== 1) return 'Desafios de vaga devem iniciar com 1 pista preenchida';
      } else {
        const tracksArray = Array.isArray(tracks) ? tracks : [];
        const filledTracks = tracksArray.filter(t => t && t.trim());
        if (filledTracks.length !== 3) return 'Admins devem selecionar 3 pistas';
      }

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      const syntheticId = crypto.randomUUID();

      const challenge: Challenge = {
        id: '',
        listId: 'desafio-vaga',
        challengerId: syntheticId,
        challengedId: oitavoDaLista02.id,
        challengerName: challengerName,
        challengedName: oitavoDaLista02.name,
        challengerPos: -1,
        challengedPos: lastIdx,
        status: isAdminOverride ? 'racing' : 'pending',
        type: 'desafio-vaga',
        createdAt: Date.now(),
        expiresAt,
        tracks,
        score: [0, 0],
      };

      setState(prev => ({
        ...prev,
        challenges: [...prev.challenges, challenge],
      }));

      if (isAdminOverride) {
        updatePlayerInDb(oitavoDaLista02.id, { status: 'racing' });
      }

      syncChallengeInsert(challenge).then(result => {
        if (result.id) {
          setState(prev => ({
            ...prev,
            challenges: prev.challenges.map(c =>
              c === challenge ? { ...c, id: result.id! } : c
            ),
          }));
        }
      });

      return null;
    },
    [state.lists, state.challenges, isPlayerInActiveChallenge, updatePlayerInDb]
  );

  const challengeInitiationPlayer = useCallback((externalNick: string, targetPlayerId: string): string | null => {
    const initList = state.lists.find(l => l.id === 'initiation');
    if (!initList) return 'Lista de iniciação não encontrada';

    const target = initList.players.find(p => p.id === targetPlayerId);
    if (!target) return 'Piloto alvo não encontrado';

    // ✅ NOVO: Bloquear desafio se o piloto já foi derrotado
    if (target.initiationComplete) {
      return 'Este piloto já foi derrotado e não pode mais ser desafiado na iniciação';
    }

    const cd = getJokerInitiationCooldownUntil(externalNick);
    if (cd && cd > Date.now()) {
      const d = Math.ceil((cd - Date.now()) / (1000 * 60 * 60 * 24));
      return `Após uma derrota na iniciação, aguarda ${d} dia(s) para desafiar novamente.`;
    }

    const challenge: Challenge = {
      id: '', // Will be set from DB response
      listId: 'initiation',
      challengerId: crypto.randomUUID(),
      challengedId: target.id,
      challengerName: externalNick,
      challengedName: target.name,
      challengerPos: -1,
      challengedPos: initList.players.indexOf(target),
      status: 'pending',
      type: 'initiation',
      createdAt: Date.now(),
      // No expiresAt for initiation challenges - they don't expire
    };

    console.log('🎯 Creating initiation challenge:', challenge);

    // Don't add to local state - let the database insert trigger realtime update
    syncChallengeInsert(challenge).then(result => {
      console.log('💾 syncChallengeInsert result:', result);
      if (result.id) {
        console.log('✅ Challenge inserted with ID:', result.id);
        // Force a fetch to get the new challenge
        setTimeout(() => fetchAll(), 500);
      } else if (result.error) {
        console.error('❌ Failed to insert challenge:', result.error);
      }
    });
    
    return null;
  }, [state.lists, fetchAll]);

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

  const rejectLadderChallenge = useCallback((challengeId: string) => {
    const c = stateRef.current.challenges.find(x => x.id === challengeId);
    if (!c || c.status !== 'pending' || c.type !== 'ladder') return 'Desafio inválido';

    setState(prev => ({
      ...prev,
      challenges: prev.challenges.filter(x => x.id !== challengeId),
    }));
    syncChallengeStatusUpdate(challengeId, 'cancelled', undefined, {
      challengerName: c.challengerName,
      challengedName: c.challengedName,
      challengerPos: c.challengerPos,
      challengedPos: c.challengedPos,
      listId: c.listId,
      type: c.type,
      notifyCancellation: true,
    });
    return null;
  }, []);

  const acceptLadderChallenge = useCallback((challengeId: string, selectedTracks?: string[]) => {
    const c = stateRef.current.challenges.find(x => x.id === challengeId);
    if (!c || c.status !== 'pending' || c.type !== 'ladder') return 'Desafio não está pendente';

    // 🛡️ CORREÇÃO: Aceita array de 3 pistas que já vem completo do modal
    const finalTracks = (() => {
      // Se selectedTracks já vem com 3 pistas (novo comportamento)
      if (selectedTracks && selectedTracks.length === 3) {
        const filledTracks = selectedTracks.filter(t => t && t.trim());
        if (filledTracks.length === 3) {
          return selectedTracks;
        }
      }
      
      // Fallback: comportamento antigo (se vier com 2 pistas)
      if (c.tracks?.length === 1) {
        if (!selectedTracks || selectedTracks.length !== 2) return null;
        return [c.tracks[0], selectedTracks[0], selectedTracks[1]];
      }
      
      // Se já tem 3 pistas no desafio
      if (c.tracks?.length === 3) {
        return c.tracks;
      }
      
      return null;
    })();

    if (!finalTracks || finalTracks.length !== 3) {
      return 'Necessário escolher as 2 pistas restantes';
    }

    if (c.listId === 'cross-list') {
      updatePlayerInDb(c.challengerId, { status: 'racing' });
      updatePlayerInDb(c.challengedId, { status: 'racing' });
    } else if (c.listId === 'street-runner') {
      updatePlayerInDb(c.challengedId, { status: 'racing' });
    } else {
      updatePlayerInDb(c.challengerId, { status: 'racing' });
      updatePlayerInDb(c.challengedId, { status: 'racing' });
    }

    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(ch =>
        ch.id === challengeId ? { ...ch, status: 'racing' as const, tracks: finalTracks } : ch
      ),
      lists: prev.lists.map(list => ({
        ...list,
        players: list.players.map(p => {
          if (c.listId === 'street-runner') {
            if (list.id === 'list-02' && p.id === c.challengedId) return { ...p, status: 'racing' as const };
            return p;
          }
          if (c.listId === 'cross-list') {
            if ((list.id === 'list-01' || list.id === 'list-02') && (p.id === c.challengerId || p.id === c.challengedId)) {
              return { ...p, status: 'racing' as const };
            }
            return p;
          }
          if (list.id === c.listId && (p.id === c.challengerId || p.id === c.challengedId)) {
            return { ...p, status: 'racing' as const };
          }
          return p;
        }),
      })),
    }));

    syncChallengeStatusUpdate(challengeId, 'racing', undefined, {
      challengerName: c.challengerName,
      challengedName: c.challengedName,
      challengerPos: c.challengerPos,
      challengedPos: c.challengedPos,
      listId: c.listId,
      tracks: finalTracks,
    });
    return null;
  }, [updatePlayerInDb]);

  const acceptInitiationChallenge = useCallback((challengeId: string, chosenTrack: string) => {
    const c = stateRef.current.challenges.find(x => x.id === challengeId);
    if (!c || c.status !== 'pending' || c.type !== 'initiation') return 'Desafio de iniciação não está pendente';

    updatePlayerInDb(c.challengedId, { status: 'racing' });

    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(ch =>
        ch.id === challengeId ? { ...ch, status: 'racing' as const, tracks: [chosenTrack] } : ch
      ),
      lists: prev.lists.map(list => ({
        ...list,
        players: list.players.map(p => {
          if (list.id === 'initiation' && p.id === c.challengedId) {
            return { ...p, status: 'racing' as const };
          }
          return p;
        }),
      })),
    }));

    syncChallengeStatusUpdate(challengeId, 'racing', undefined, {
      challengerName: c.challengerName,
      challengedName: c.challengedName,
      challengerPos: c.challengerPos,
      challengedPos: c.challengedPos,
      listId: c.listId,
      tracks: [chosenTrack],
    });
    return null;
  }, [updatePlayerInDb]);

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

        const initScore: [number, number] = jokerWon ? [1, 0] : [0, 1];
        syncChallengeScoreUpdate(challengeId, initScore, 'completed', {
          challenger_name: challenge.challengerName,
          challenged_name: challenge.challengedName,
          challenger_pos: challenge.challengerPos,
          challenged_pos: challenge.challengedPos,
          list_id: challenge.listId,
          type: challenge.type,
          tracks: challenge.tracks ?? null,
        });
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

        const finalScore: [number, number] =
          challenge.score?.[0] !== undefined && challenge.score?.[1] !== undefined
            ? ([challenge.score[0], challenge.score[1]] as [number, number])
            : challengerWon
              ? [2, 0]
              : [0, 2];
        syncChallengeScoreUpdate(challengeId, finalScore, 'completed', {
          challenger_name: challenge.challengerName,
          challenged_name: challenge.challengedName,
          challenger_pos: challenge.challengerPos,
          challenged_pos: challenge.challengedPos,
          list_id: challenge.listId,
          type: challenge.type,
          tracks: challenge.tracks ?? null,
        });
        scheduleFetchAndListSnapshots(['list-01', 'list-02'], { discordSnapshot: false });
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

      const finalScore: [number, number] =
        challenge.score?.[0] !== undefined && challenge.score?.[1] !== undefined
          ? ([challenge.score[0], challenge.score[1]] as [number, number])
          : challengerWon
            ? [2, 0]
            : [0, 2];
      syncChallengeScoreUpdate(challengeId, finalScore, 'completed', {
        challenger_name: challenge.challengerName,
        challenged_name: challenge.challengedName,
        challenger_pos: challenge.challengerPos,
        challenged_pos: challenge.challengedPos,
        list_id: challenge.listId,
        type: challenge.type,
        tracks: challenge.tracks ?? null,
      });
      if (challenge.listId === 'list-01' || challenge.listId === 'list-02') {
        scheduleFetchAndListSnapshots([challenge.listId], { discordSnapshot: false });
      }
      return prev;
    });
  }, [fetchAll, scheduleFetchAndListSnapshots]);

  const reorderPlayers = useCallback((listId: string, oldIndex: number, newIndex: number) => {
    setState(prev => {
      // ✅ PROTEÇÃO: Verificar se prev e prev.lists existem
      if (!prev || !prev.lists || !Array.isArray(prev.lists)) {
        console.warn('⚠️ Estado inválido em reorderPlayers:', prev);
        return prev;
      }

      const newLists = prev.lists.map(l => {
        if (l.id !== listId) return l;
        const players = [...(l.players || [])];
        const [moved] = players.splice(oldIndex, 1);
        players.splice(newIndex, 0, moved);
        // Update positions in DB
        players.forEach((p, i) => updatePlayerPositionInDb(p.id, i, listId));
        return { ...l, players };
      });
      const updated = newLists.find(l => l.id === listId);
      if (updated?.players.length) {
        queueMicrotask(() => {
          void notifyListStandingsFromPlayers(
            listId,
            updated.players.map(p => ({ name: p.name }))
          );
        });
      }
      return { ...prev, lists: newLists };
    });
  }, []);

  const clearAllCooldowns = useCallback(() => {
    setState(prev => {
      // ✅ PROTEÇÃO: Verificar se prev e prev.lists existem
      if (!prev || !prev.lists || !Array.isArray(prev.lists)) {
        console.warn('⚠️ Estado inválido em clearAllCooldowns:', prev);
        return prev;
      }

      const newLists = prev.lists.map(list => ({
        ...list,
        players: (list.players || []).map(p => {
          if (
            p.status === 'cooldown' ||
            p.cooldownUntil ||
            p.challengeCooldownUntil ||
            p.list02ExternalBlockUntil ||
            p.list02ExternalEligibleAfter
          ) {
            updatePlayerInDb(p.id, {
              status: p.status === 'cooldown' ? 'available' : p.status,
              cooldown_until: null,
              challenge_cooldown_until: null,
              defense_count: p.status === 'cooldown' ? 0 : p.defenseCount,
              list02_external_block_until: null,
              list02_external_eligible_after: null,
              defenses_while_seventh_streak: 0,
            });
          }
          return {
            ...p,
            status: p.status === 'cooldown' ? 'available' as const : p.status,
            cooldownUntil: null,
            challengeCooldownUntil: null,
            defenseCount: p.status === 'cooldown' ? 0 : p.defenseCount,
            list02ExternalBlockUntil: null,
            list02ExternalEligibleAfter: null,
            defensesWhileSeventhStreak: 0,
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

    setState(prev => {
      // ✅ PROTEÇÃO: Verificar se prev e prev.lists existem
      if (!prev || !prev.lists || !Array.isArray(prev.lists)) {
        console.warn('⚠️ Estado inválido em setPlayerStatus:', prev);
        return prev;
      }

      return {
        ...prev,
        lists: prev.lists.map(list => ({
          ...list,
          players: (list.players || []).map(p => {
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
      };
    });
  }, []);

  const addPoint = useCallback((challengeId: string, side: 'challenger' | 'challenged') => {
    setState(prev => {
      // ✅ PROTEÇÃO 1: Verificar se prev e prev.challenges existem
      if (!prev || !prev.challenges) {
        console.warn('⚠️ Estado inválido em addPoint:', prev);
        return prev;
      }

      const challenge = prev.challenges.find(c => c.id === challengeId);
      if (!challenge || (challenge.status !== 'racing' && challenge.status !== 'accepted')) return prev;

      // For initiation challenges (MD1): 1 point = winner
      if (challenge.type === 'initiation') {
        const winnerId = side === 'challenger' ? challenge.challengerId : challenge.challengedId;
        const loserId = side === 'challenger' ? challenge.challengedId : challenge.challengerId;
        const jokerWon = winnerId === challenge.challengerId;
        let newJokerProgress = { ...prev.jokerProgress };

        if (jokerWon) {
          const jokerNick = challenge.challengerName.toLowerCase();
          const defeated = newJokerProgress[jokerNick] || [];
          if (!defeated.includes(challenge.challengedId)) {
            const nextDefeated = [...defeated, challenge.challengedId];
            newJokerProgress[jokerNick] = nextDefeated;
            
            // Inserir no banco de dados
            supabase.from('joker_progress').insert({
              joker_name_key: jokerNick,
              joker_user_id: null,
              defeated_player_id: challenge.challengedId,
            } as any).then(({ error }) => {
              if (error) console.error('❌ Erro ao inserir joker_progress:', error);
            });
            
            if (nextDefeated.length >= 5) {
              setStreetRunnerList02UnlockAt(challenge.challengerName, Date.now() + CHALLENGE_COOLDOWN_MS);
            }
          }

          // ✅ SINCRONIZAÇÃO: Atualizar banco E forçar refresh
          const updatePromise = supabase.from('players').update({
            status: 'cooldown',
            initiation_complete: true,
            cooldown_until: new Date(Date.now() + CHALLENGE_COOLDOWN_MS).toISOString(),
          } as any).eq('id', loserId);

          updatePromise.then(({ error }) => {
            if (error) {
              console.error('❌ Erro ao atualizar piloto derrotado:', error);
            } else {
              console.log('✅ Piloto derrotado atualizado no banco, sincronizando...');
              // ✅ REFRESH FORÇADO: Buscar dados atualizados do banco
              setTimeout(() => {
                fetchAll();
              }, 300);
            }
          });

        } else {
          setJokerInitiationCooldownUntil(challenge.challengerName, Date.now() + CHALLENGE_COOLDOWN_MS);
        }

        const initScore: [number, number] = side === 'challenger' ? [1, 0] : [0, 1];
        
        // ✅ PROTEÇÃO 2: Usar fallback para array vazio
        const newChallenges = (prev.challenges || []).map(c =>
          c.id === challengeId ? { ...c, status: 'completed' as const, score: initScore } : c
        );

        syncChallengeScoreUpdate(challengeId, initScore, 'completed', {
          challenger_name: challenge.challengerName,
          challenged_name: challenge.challengedName,
          challenger_pos: challenge.challengerPos,
          challenged_pos: challenge.challengedPos,
          list_id: challenge.listId,
          type: challenge.type,
          tracks: challenge.tracks ?? null,
        });

        // ✅ PROTEÇÃO 3: Verificar se lists existe antes de mapear
        if (!prev.lists || !Array.isArray(prev.lists)) {
          console.warn('⚠️ prev.lists não é um array válido:', prev.lists);
          return { ...prev, challenges: newChallenges, jokerProgress: newJokerProgress };
        }

        // ✅ ATUALIZAÇÃO LOCAL: Marcar piloto como derrotado imediatamente
        const updatedLists = prev.lists.map(list => {
          if (list.id === 'initiation') {
            return {
              ...list,
              players: (list.players || []).map(p =>
                p.id === loserId
                  ? {
                      ...p,
                      status: 'cooldown' as const,
                      initiationComplete: true,
                      cooldownUntil: Date.now() + CHALLENGE_COOLDOWN_MS,
                    }
                  : p
              ),
            };
          }
          return list;
        });

        return { ...prev, challenges: newChallenges, jokerProgress: newJokerProgress, lists: updatedLists };
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
            tracks: challenge.tracks ?? null,
          });

          scheduleFetchAndListSnapshots(['list-01', 'list-02'], { discordSnapshot: false });
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
              defenses_while_seventh_streak: 0,
              list02_external_block_until: null,
              list02_external_eligible_after: null,
            } as any);
            // Remove the defeated player
            supabase.from('players').delete().eq('id', challenge.challengedId);
          } else {
            const list02 = prev.lists.find(l => l.id === 'list-02')!;
            const defender = list02.players.find(p => p.id === challenge.challengedId)!;
            const newDefenseCount = defender.defenseCount + 1;
            const needsCooldown = newDefenseCount >= 2;
            const lastIdx = getList02LastPlaceIndex(list02.players.length);
            const challengedIdx = list02.players.findIndex(p => p.id === challenge.challengedId);
            const isLastPlaceDefense = challengedIdx === lastIdx;
            const streak = defender.defensesWhileSeventhStreak ?? 0;
            let newStreak = isLastPlaceDefense ? streak + 1 : 0;
            let blockIso: string | null = null;
            if (isLastPlaceDefense && streak + 1 >= 2) {
              blockIso = new Date(Date.now() + LIST02_EXTERNAL_BLOCK_MS).toISOString();
              newStreak = 0;
            }
            const defMs = needsCooldown
              ? defenderDefenseCooldownMs('list-02', challengedIdx, list02.players.length)
              : 0;
            updatePlayerInDb(challenge.challengedId, {
              status: needsCooldown ? 'cooldown' : 'available',
              defense_count: newDefenseCount,
              cooldown_until: needsCooldown ? new Date(Date.now() + defMs).toISOString() : null,
              defenses_while_seventh_streak: newStreak,
              ...(blockIso ? { list02_external_block_until: blockIso } : {}),
            });
          }

          syncChallengeScoreUpdate(challengeId, newScore, 'completed', {
            challenger_name: challenge.challengerName,
            challenged_name: challenge.challengedName,
            challenger_pos: challenge.challengerPos,
            challenged_pos: challenge.challengedPos,
            list_id: challenge.listId,
            type: challenge.type,
            tracks: challenge.tracks ?? null,
          });

          scheduleFetchAndListSnapshots(['list-02'], { discordSnapshot: false });
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
              if (challenge.listId === 'list-02') {
                const lastIdx = getList02LastPlaceIndex(list.players.length);
                if (lastIdx >= 1 && cIdx === lastIdx && dIdx === lastIdx - 1) {
                  updatePlayerInDb(challenge.challengedId, {
                    list02_external_eligible_after: new Date(Date.now() + LIST02_NEW_LAST_EXTERNAL_MS).toISOString(),
                  });
                }
              }
            } else {
              const defender = list.players[dIdx];
              const newDefenseCount = defender.defenseCount + 1;
              const needsCooldown = newDefenseCount >= 2;
              const lastIdx = challenge.listId === 'list-02' ? getList02LastPlaceIndex(list.players.length) : -1;
              const isLastPlaceDefense = challenge.listId === 'list-02' && dIdx === lastIdx;
              const streak = defender.defensesWhileSeventhStreak ?? 0;
              let newStreak = isLastPlaceDefense ? streak + 1 : 0;
              let blockIso: string | null = null;
              if (isLastPlaceDefense && streak + 1 >= 2) {
                blockIso = new Date(Date.now() + LIST02_EXTERNAL_BLOCK_MS).toISOString();
                newStreak = 0;
              }
              const defMs = needsCooldown
                ? defenderDefenseCooldownMs(challenge.listId, dIdx, list.players.length)
                : 0;
              updatePlayerInDb(challenge.challengedId, {
                status: needsCooldown ? 'cooldown' : 'available',
                defense_count: newDefenseCount,
                cooldown_until: needsCooldown ? new Date(Date.now() + defMs).toISOString() : null,
                defenses_while_seventh_streak: newStreak,
                ...(blockIso ? { list02_external_block_until: blockIso } : {}),
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
          tracks: challenge.tracks ?? null,
        });

        if (challenge.listId === 'list-01' || challenge.listId === 'list-02') {
          scheduleFetchAndListSnapshots([challenge.listId], { discordSnapshot: false });
        }
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
  }, [fetchAll, scheduleFetchAndListSnapshots]);

  const movePlayerToList = useCallback((playerName: string, fromListId: string, toListId: string, toPosition?: number) => {
    setState(prev => {
      // ✅ PROTEÇÃO: Verificar se prev e prev.lists existem
      if (!prev || !prev.lists || !Array.isArray(prev.lists)) {
        console.warn('⚠️ Estado inválido em movePlayerToList:', prev);
        return prev;
      }

      const fromList = prev.lists.find(l => l.id === fromListId);
      const toList = prev.lists.find(l => l.id === toListId);
      if (!fromList || !toList) return prev;

      const playerIdx = (fromList.players || []).findIndex(p => p.name.toLowerCase() === playerName.toLowerCase());
      if (playerIdx === -1) return prev;

      const player = fromList.players[playerIdx];
      const insertAt = toPosition !== undefined ? toPosition : (toList.players || []).length;

      // Update DB
      updatePlayerInDb(player.id, {
        list_id: toListId,
        position: insertAt,
        status: 'available',
        cooldown_until: null,
        challenge_cooldown_until: null,
        defense_count: 0,
        list02_external_block_until: null,
        list02_external_eligible_after: null,
        defenses_while_seventh_streak: 0,
      });

      // Re-index from list
      const newFromPlayers = (fromList.players || []).filter((_, i) => i !== playerIdx);
      newFromPlayers.forEach((p, i) => updatePlayerPositionInDb(p.id, i, fromListId));

      // Re-index to list
      const newToPlayers = [...(toList.players || [])];
      newToPlayers.splice(insertAt, 0, {
        ...player,
        status: 'available',
        cooldownUntil: null,
        challengeCooldownUntil: null,
        defenseCount: 0,
        defensesWhileSeventhStreak: 0,
        list02ExternalBlockUntil: null,
        list02ExternalEligibleAfter: null,
      });
      newToPlayers.forEach((p, i) => updatePlayerPositionInDb(p.id, i, toListId));

      const newLists = prev.lists.map(l => {
        if (l.id === fromListId) return { ...l, players: newFromPlayers };
        if (l.id === toListId) return { ...l, players: newToPlayers };
        return l;
      });

      queueMicrotask(() => {
        const a = newLists.find(l => l.id === fromListId);
        const b = newLists.find(l => l.id === toListId);
        if (a?.players.length) void notifyListStandingsFromPlayers(fromListId, a.players.map(p => ({ name: p.name })));
        if (b?.players.length) void notifyListStandingsFromPlayers(toListId, b.players.map(p => ({ name: p.name })));
      });

      return { ...prev, lists: newLists };
    });
  }, []);

  const autoPromoteTopFromList02 = useCallback(() => {
    setState(prev => {
      // ✅ PROTEÇÃO: Verificar se prev e prev.lists existem
      if (!prev || !prev.lists || !Array.isArray(prev.lists)) {
        console.warn('⚠️ Estado inválido em autoPromoteTopFromList02:', prev);
        return prev;
      }

      const list02 = prev.lists.find(l => l.id === 'list-02');
      const list01 = prev.lists.find(l => l.id === 'list-01');
      if (!list02 || !list01 || (list02.players || []).length === 0) return prev;

      const topPlayer = list02.players[0];

      // Update DB
      updatePlayerInDb(topPlayer.id, {
        list_id: 'list-01',
        position: (list01.players || []).length,
        status: 'available',
        cooldown_until: null,
        challenge_cooldown_until: null,
        defense_count: 0,
        list02_external_block_until: null,
        list02_external_eligible_after: null,
        defenses_while_seventh_streak: 0,
      });

      // Re-index list-02
      const remaining = (list02.players || []).slice(1);
      remaining.forEach((p, i) => updatePlayerPositionInDb(p.id, i, 'list-02'));

      const movedPlayer = {
        ...topPlayer,
        status: 'available' as const,
        cooldownUntil: null,
        challengeCooldownUntil: null,
        defenseCount: 0,
        defensesWhileSeventhStreak: 0,
        list02ExternalBlockUntil: null,
        list02ExternalEligibleAfter: null,
      };

      const newLists = prev.lists.map(l => {
        if (l.id === 'list-02') return { ...l, players: remaining };
        if (l.id === 'list-01') return { ...l, players: [...(l.players || []), movedPlayer] };
        return l;
      });

      queueMicrotask(() => {
        const l01 = newLists.find(l => l.id === 'list-01');
        const l02 = newLists.find(l => l.id === 'list-02');
        if (l01?.players.length) void notifyListStandingsFromPlayers('list-01', l01.players.map(p => ({ name: p.name })));
        if (l02?.players.length) void notifyListStandingsFromPlayers('list-02', l02.players.map(p => ({ name: p.name })));
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
        defenses_while_seventh_streak: 0,
        list02_external_block_until: null,
        list02_external_eligible_after: null,
      } as any);
      if (insertErr) return formatPlayersTableError(insertErr.message);

      await fetchAll();
      const pl = stateRef.current.lists.find(l => l.id === listId);
      if (pl?.players.length) {
        void notifyListStandingsFromPlayers(listId, pl.players.map(p => ({ name: p.name })));
      }
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
          list02_external_block_until: null,
          list02_external_eligible_after: null,
          defenses_while_seventh_streak: 0,
        });
      }
    }
    // Cancel all active challenges
    await supabase.from('challenges').update({ status: 'cancelled' } as any).in('status', ['pending', 'racing', 'accepted']);
    // Refetch
    await fetchAll();
  }, [fetchAll]);

  const activeChallenges = state.challenges.filter(c => c.status === 'racing' || c.status === 'accepted');
  const pendingInitiationChallenges = state.challenges.filter(c => c.status === 'pending' && c.type === 'initiation');
  const pendingLadderChallenges = state.challenges.filter(c => c.status === 'pending' && c.type === 'ladder');

  const applyLadderWOChallengerWins = useCallback(
    async (c: Challenge) => {
      if (woHandledRef.current.has(c.id)) return;
      woHandledRef.current.add(c.id);
      const challengeCooldown = Date.now() + CHALLENGE_COOLDOWN_MS;
      const cooldownIso = new Date(challengeCooldown).toISOString();
      const list02 = stateRef.current.lists.find(l => l.id === 'list-02');
      const list01 = stateRef.current.lists.find(l => l.id === 'list-01');

      if (c.listId === 'cross-list' && list02 && list01) {
        updatePlayerInDb(c.challengerId, {
          list_id: 'list-01',
          position: list01.players.length - 1,
          status: 'available',
          defense_count: 0,
          challenge_cooldown_until: cooldownIso,
        });
        updatePlayerInDb(c.challengedId, {
          list_id: 'list-02',
          position: 0,
          status: 'available',
          defense_count: 0,
          cooldown_until: null,
          challenge_cooldown_until: null,
        });
        const remaining02 = list02.players.filter(p => p.id !== c.challengerId);
        remaining02.forEach((p, i) => updatePlayerPositionInDb(p.id, i + 1, 'list-02'));
      } else if (c.listId === 'street-runner' && list02) {
        const newPlayerId = crypto.randomUUID();
        await supabase.from('players').insert({
          id: newPlayerId,
          name: c.challengerName,
          list_id: 'list-02',
          position: list02.players.length - 1,
          status: 'available',
          initiation_complete: true,
          challenge_cooldown_until: cooldownIso,
          defenses_while_seventh_streak: 0,
          list02_external_block_until: null,
          list02_external_eligible_after: null,
        } as any);
        await supabase.from('players').delete().eq('id', c.challengedId);
      } else if (c.listId === 'list-01' || c.listId === 'list-02') {
        const list = stateRef.current.lists.find(l => l.id === c.listId);
        if (!list) return;
        const challengerIdx = list.players.findIndex(p => p.id === c.challengerId);
        const challengedIdx = list.players.findIndex(p => p.id === c.challengedId);
        if (challengerIdx === -1 || challengedIdx === -1) return;
        updatePlayerInDb(c.challengerId, {
          position: challengedIdx,
          status: 'available',
          defense_count: 0,
          challenge_cooldown_until: cooldownIso,
        });
        updatePlayerInDb(c.challengedId, {
          position: challengerIdx,
          status: 'available',
          defense_count: 0,
        });
        const lastIdx = c.listId === 'list-02' ? getList02LastPlaceIndex(list.players.length) : -1;
        if (
          c.listId === 'list-02' &&
          lastIdx >= 1 &&
          challengerIdx === lastIdx &&
          challengedIdx === lastIdx - 1
        ) {
          updatePlayerInDb(c.challengedId, {
            list02_external_eligible_after: new Date(Date.now() + LIST02_NEW_LAST_EXTERNAL_MS).toISOString(),
          });
        }
      }

      await syncChallengeScoreUpdate(
        c.id,
        [2, 0],
        'wo',
        {
          challenger_name: c.challengerName,
          challenged_name: c.challengedName,
          challenger_pos: c.challengerPos,
          challenged_pos: c.challengedPos,
          list_id: c.listId,
          type: c.type,
          tracks: c.tracks ?? null,
        }
      );
      setState(prev => ({
        ...prev,
        challenges: prev.challenges.filter(x => x.id !== c.id),
      }));
      if (c.listId === 'cross-list') {
        scheduleFetchAndListSnapshots(['list-01', 'list-02'], { discordSnapshot: false });
      } else if (c.listId === 'street-runner') {
        scheduleFetchAndListSnapshots(['list-02'], { discordSnapshot: false });
      } else if (c.listId === 'list-01' || c.listId === 'list-02') {
        scheduleFetchAndListSnapshots([c.listId], { discordSnapshot: false });
      }
    },
    [fetchAll, scheduleFetchAndListSnapshots]
  );

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      const expired = stateRef.current.challenges.filter(
        ch =>
          ch.type === 'ladder' &&
          ch.status === 'pending' &&
          ch.expiresAt != null &&
          ch.expiresAt <= now
      );
      expired.forEach(ch => {
        void applyLadderWOChallengerWins(ch);
      });
    }, 15000);
    return () => clearInterval(iv);
  }, [applyLadderWOChallengerWins]);

  const isPlayerInLists = useCallback((nick: string): boolean => {
    if (!nick.trim()) return false;
    const lower = nick.trim().toLowerCase();
    return state.lists.some(l => l.players.some(p => p.name.toLowerCase() === lower));
  }, [state.lists]);

  const getJokerProgress = useCallback((jokerNick: string): string[] => {
    return state.jokerProgress[jokerNick.toLowerCase()] || [];
  }, [state.jokerProgress]);

  const adminUpdatePlayerById = useCallback(
    async (playerId: string, patch: Record<string, unknown>) => {
      const { error } = await supabase.from('players').update(patch as any).eq('id', playerId);
      if (error) console.error('adminUpdatePlayerById', error);
      await fetchAll();
    },
    [fetchAll]
  );

  const adminClearJokerProgressByNameKey = useCallback(
    async (nameKey: string) => {
      const k = nameKey.trim().toLowerCase();
      const { error } = await supabase.from('joker_progress').delete().eq('joker_name_key', k);
      if (error) console.error('adminClearJokerProgressByNameKey', error);
      await fetchAll();
    },
    [fetchAll]
  );

  /** Admin: remove piloto da lista (apaga linha em `players`, limpa FKs e reindexa posições). */
  const adminRemovePlayerFromList = useCallback(
    async (playerId: string): Promise<string | null> => {
      const list = stateRef.current.lists.find(l => l.players.some(p => p.id === playerId));
      if (!list) return 'Piloto não encontrado nas listas.';

      const { error: jpErr } = await supabase.from('joker_progress').delete().eq('defeated_player_id', playerId);
      if (jpErr) return jpErr.message;

      const { error: chDelErr } = await supabase
        .from('challenges')
        .delete()
        .or(`challenged_id.eq.${playerId},challenger_id.eq.${playerId}`);
      if (chDelErr) return chDelErr.message;

      const remaining = list.players.filter(p => p.id !== playerId);
      const { error: delErr } = await supabase.from('players').delete().eq('id', playerId);
      if (delErr) return delErr.message;

      for (let i = 0; i < remaining.length; i++) {
        await updatePlayerPositionInDb(remaining[i].id, i, list.id);
      }

      const listIdForSnap = list.id;
      await fetchAll();
      const pl = stateRef.current.lists.find(l => l.id === listIdForSnap);
      if (pl?.players.length) {
        void notifyListStandingsFromPlayers(listIdForSnap, pl.players.map(p => ({ name: p.name })));
      }
      return null;
    },
    [fetchAll]
  );

  return {
    lists: state.lists,
    challenges: state.challenges,
    activeChallenges,
    pendingInitiationChallenges,
    pendingLadderChallenges,
    acceptLadderChallenge,
    rejectLadderChallenge,
    acceptInitiationChallenge,
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
    tryDesafioVaga,
    saveListLayout,
    manualAddPlayer,
    adminUpdatePlayerById,
    adminClearJokerProgressByNameKey,
    adminRemovePlayerFromList,
    championshipLoaded: loaded,
    championshipFetchError: fetchError,
  };
}
