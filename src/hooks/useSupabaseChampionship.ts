import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type DbPlayer = Tables<'players'>;
type DbChallenge = Tables<'challenges'>;
type DbPlayerList = Tables<'player_lists'>;

export interface PlayerListData {
  id: string;
  title: string;
  players: DbPlayer[];
}

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const CHALLENGE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

export function useSupabaseChampionship() {
  const [lists, setLists] = useState<PlayerListData[]>([]);
  const [challenges, setChallenges] = useState<DbChallenge[]>([]);
  const [jokerProgress, setJokerProgress] = useState<Tables<'joker_progress'>[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    const [listsRes, playersRes, challengesRes, jokerRes] = await Promise.all([
      supabase.from('player_lists').select('*').order('sort_order'),
      supabase.from('players').select('*').order('position'),
      supabase.from('challenges').select('*').order('created_at', { ascending: false }),
      supabase.from('joker_progress').select('*'),
    ]);

    if (listsRes.data && playersRes.data) {
      const playersByList = new Map<string, DbPlayer[]>();
      playersRes.data.forEach(p => {
        const arr = playersByList.get(p.list_id) || [];
        arr.push(p);
        playersByList.set(p.list_id, arr);
      });

      setLists(listsRes.data.map(l => ({
        id: l.id,
        title: l.title,
        players: playersByList.get(l.id) || [],
      })));
    }

    if (challengesRes.data) setChallenges(challengesRes.data);
    if (jokerRes.data) setJokerProgress(jokerRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time subscriptions
  useEffect(() => {
    const playersChannel = supabase
      .channel('players-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchAll())
      .subscribe();

    const challengesChannel = supabase
      .channel('challenges-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => fetchAll())
      .subscribe();

    const jokerChannel = supabase
      .channel('joker-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'joker_progress' }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(challengesChannel);
      supabase.removeChannel(jokerChannel);
    };
  }, [fetchAll]);

  // Create a challenge (pending with 24h timer)
  const tryChallenge = useCallback(async (
    listId: string, challengerIdx: number, challengedIdx: number,
    isAdminOverride = false, tracks?: [string, string, string]
  ): Promise<string | null> => {
    const list = lists.find(l => l.id === listId);
    if (!list) return 'Lista não encontrada';

    const challenger = list.players[challengerIdx];
    const challenged = list.players[challengedIdx];
    if (!challenger || !challenged) return 'Jogador não encontrado';

    if (listId === 'initiation') {
      return 'Jogadores da Iniciação devem completar a iniciação antes de desafiar';
    }

    if (!isAdminOverride) {
      if (challenger.status !== 'available') return 'Você está ocupado (em corrida ou cooldown)';
      if (challenged.status !== 'available') return 'O adversário está ocupado (em corrida ou cooldown)';

      if (challenger.challenge_cooldown_until && new Date(challenger.challenge_cooldown_until) > new Date()) {
        const remaining = Math.ceil((new Date(challenger.challenge_cooldown_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return `Bloqueado: Aguarde ${remaining} dia(s) para desafiar novamente`;
      }

      if (challengerIdx <= challengedIdx) return 'Ação Bloqueada: Desafio inválido';
      const diff = challengerIdx - challengedIdx;
      if (diff > 1) return 'Ação Bloqueada: Você só pode desafiar 1 posição acima';
    } else {
      if (challengerIdx === challengedIdx) return 'Não pode desafiar a si mesmo';
    }

    // Create pending challenge with 24h expiry
    const { error } = await supabase.from('challenges').insert({
      list_id: listId,
      challenger_id: challenger.id,
      challenged_id: challenged.id,
      challenger_name: challenger.name,
      challenged_name: challenged.name,
      challenger_pos: challengerIdx,
      challenged_pos: challengedIdx,
      status: 'pending',
      type: 'ladder',
      tracks: tracks || null,
    });

    if (error) return error.message;

    // Set challenged player to pending status
    await supabase.from('players').update({ status: 'pending' }).eq('id', challenged.id);

    return null;
  }, [lists]);

  // Accept a challenge
  const acceptChallenge = useCallback(async (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.status !== 'pending') return;

    await supabase.from('challenges').update({
      status: 'racing',
      accepted_at: new Date().toISOString(),
    }).eq('id', challengeId);

    // Set both players to racing
    await Promise.all([
      supabase.from('players').update({ status: 'racing' }).eq('id', challenge.challenger_id),
      supabase.from('players').update({ status: 'racing' }).eq('id', challenge.challenged_id),
    ]);
  }, [challenges]);

  // Decline / cancel a challenge
  const declineChallenge = useCallback(async (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    await supabase.from('challenges').update({ status: 'cancelled' }).eq('id', challengeId);
    await supabase.from('players').update({ status: 'available' }).eq('id', challenge.challenged_id);
  }, [challenges]);

  // Force W.O. (admin)
  const forceWO = useCallback(async (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const cooldownDate = new Date(Date.now() + CHALLENGE_COOLDOWN_MS).toISOString();

    // W.O. — challenger wins
    await supabase.from('challenges').update({
      status: 'wo',
      completed_at: new Date().toISOString(),
      winner_id: challenge.challenger_id,
    }).eq('id', challengeId);

    // Swap positions
    await Promise.all([
      supabase.from('players').update({
        position: challenge.challenged_pos,
        status: 'available',
      }).eq('id', challenge.challenger_id),
      supabase.from('players').update({
        position: challenge.challenger_pos,
        status: 'cooldown',
        cooldown_until: cooldownDate,
        challenge_cooldown_until: cooldownDate,
      }).eq('id', challenge.challenged_id),
    ]);
  }, [challenges]);

  // Challenge initiation player (joker)
  const challengeInitiationPlayer = useCallback(async (externalNick: string, targetPlayerId: string) => {
    const initList = lists.find(l => l.id === 'initiation');
    if (!initList) return;

    const target = initList.players.find(p => p.id === targetPlayerId);
    if (!target) return;

    await supabase.from('challenges').insert({
      list_id: 'initiation',
      challenger_id: targetPlayerId, // Will be overridden — we store joker info in names
      challenged_id: targetPlayerId,
      challenger_name: externalNick,
      challenged_name: target.name,
      challenger_pos: -1,
      challenged_pos: target.position,
      status: 'pending',
      type: 'initiation',
    });
  }, [lists]);

  // Approve initiation challenge
  const approveInitiationChallenge = useCallback(async (challengeId: string) => {
    await supabase.from('challenges').update({ status: 'racing' }).eq('id', challengeId);
  }, []);

  // Reject initiation challenge
  const rejectInitiationChallenge = useCallback(async (challengeId: string) => {
    await supabase.from('challenges').update({ status: 'cancelled' }).eq('id', challengeId);
  }, []);

  // Add point (MD3 or MD1)
  const addPoint = useCallback(async (challengeId: string, side: 'challenger' | 'challenged') => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.status !== 'racing') return;

    const isInitiation = challenge.type === 'initiation';
    const cs = challenge.score_challenger;
    const ds = challenge.score_challenged;

    if (isInitiation) {
      // MD1: 1 point = winner
      const newCs = side === 'challenger' ? 1 : 0;
      const newDs = side === 'challenged' ? 1 : 0;
      const winnerId = side === 'challenger' ? challenge.challenger_id : challenge.challenged_id;

      await supabase.from('challenges').update({
        score_challenger: newCs,
        score_challenged: newDs,
        status: 'completed',
        completed_at: new Date().toISOString(),
        winner_id: winnerId,
      }).eq('id', challengeId);

      // If joker won, record progress
      if (side === 'challenger') {
        // We'd need the joker's user_id here — for now we just mark completed
      }
      return;
    }

    // MD3 logic
    if (cs >= 2 || ds >= 2) return;

    const newCs = side === 'challenger' ? cs + 1 : cs;
    const newDs = side === 'challenged' ? ds + 1 : ds;

    const updateData: Record<string, unknown> = {
      score_challenger: newCs,
      score_challenged: newDs,
    };

    // Check if someone won
    if (newCs >= 2 || newDs >= 2) {
      const winnerId = newCs >= 2 ? challenge.challenger_id : challenge.challenged_id;
      const challengerWon = newCs >= 2;
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
      updateData.winner_id = winnerId;

      // Update positions and statuses
      const cooldownDate = new Date(Date.now() + CHALLENGE_COOLDOWN_MS).toISOString();

      if (challengerWon) {
        // Swap positions
        await Promise.all([
          supabase.from('players').update({
            position: challenge.challenged_pos,
            status: 'available',
            defense_count: 0,
            challenge_cooldown_until: cooldownDate,
          }).eq('id', challenge.challenger_id),
          supabase.from('players').update({
            position: challenge.challenger_pos,
            status: 'available',
            defense_count: 0,
          }).eq('id', challenge.challenged_id),
        ]);
      } else {
        // Defender wins
        const defender = lists.flatMap(l => l.players).find(p => p.id === challenge.challenged_id);
        const newDefenseCount = (defender?.defense_count || 0) + 1;
        const needsCooldown = newDefenseCount >= 2;

        await Promise.all([
          supabase.from('players').update({
            status: needsCooldown ? 'cooldown' : 'available',
            defense_count: newDefenseCount,
            cooldown_until: needsCooldown ? new Date(Date.now() + COOLDOWN_MS).toISOString() : null,
          }).eq('id', challenge.challenged_id),
          supabase.from('players').update({
            status: 'available',
            challenge_cooldown_until: cooldownDate,
          }).eq('id', challenge.challenger_id),
        ]);
      }
    }

    await supabase.from('challenges').update(updateData).eq('id', challengeId);
  }, [challenges, lists]);

  // Clear all cooldowns (admin)
  const clearAllCooldowns = useCallback(async () => {
    const allPlayerIds = lists.flatMap(l => l.players.map(p => p.id));
    for (const id of allPlayerIds) {
      await supabase.from('players').update({
        status: 'available',
        cooldown_until: null,
        challenge_cooldown_until: null,
        defense_count: 0,
      }).eq('id', id);
    }
  }, [lists]);

  // Set player status (admin)
  const setPlayerStatus = useCallback(async (playerId: string, newStatus: 'available' | 'racing' | 'cooldown' | 'pending') => {
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'cooldown') {
      updateData.cooldown_until = new Date(Date.now() + COOLDOWN_MS).toISOString();
    }
    if (newStatus === 'available') {
      updateData.cooldown_until = null;
      updateData.challenge_cooldown_until = null;
      updateData.defense_count = 0;
    }
    await supabase.from('players').update(updateData).eq('id', playerId);
  }, []);

  // Reorder players (admin drag-drop)
  const reorderPlayers = useCallback(async (listId: string, oldIndex: number, newIndex: number) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const players = [...list.players];
    const [moved] = players.splice(oldIndex, 1);
    players.splice(newIndex, 0, moved);

    // Update all positions
    await Promise.all(
      players.map((p, i) =>
        supabase.from('players').update({ position: i }).eq('id', p.id)
      )
    );
  }, [lists]);

  // Reset all (admin)
  const resetAll = useCallback(async () => {
    // Delete all challenges
    await supabase.from('challenges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('joker_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // Reset all player statuses
    const allPlayerIds = lists.flatMap(l => l.players.map(p => p.id));
    for (const id of allPlayerIds) {
      await supabase.from('players').update({
        status: 'available',
        cooldown_until: null,
        challenge_cooldown_until: null,
        defense_count: 0,
      }).eq('id', id);
    }
  }, [lists]);

  // Check if player is in any list
  const isPlayerInLists = useCallback((nick: string): boolean => {
    if (!nick.trim()) return false;
    const lower = nick.trim().toLowerCase();
    return lists.some(l => l.players.some(p => p.name.toLowerCase() === lower));
  }, [lists]);

  // Get joker progress
  const getJokerProgress = useCallback((jokerNick: string): string[] => {
    // For now, return defeated player IDs from jokerProgress table
    // This would need the joker's user_id; for now use name matching
    return jokerProgress.map(jp => jp.defeated_player_id);
  }, [jokerProgress]);

  const activeChallenges = challenges.filter(c => c.status === 'racing');
  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const pendingInitiationChallenges = challenges.filter(c => c.status === 'pending' && c.type === 'initiation');

  return {
    lists,
    challenges,
    activeChallenges,
    pendingChallenges,
    pendingInitiationChallenges,
    loading,
    tryChallenge,
    acceptChallenge,
    declineChallenge,
    forceWO,
    challengeInitiationPlayer,
    approveInitiationChallenge,
    rejectInitiationChallenge,
    reorderPlayers,
    isPlayerInLists,
    clearAllCooldowns,
    setPlayerStatus,
    resetAll,
    addPoint,
    getJokerProgress,
    refetch: fetchAll,
  };
}
