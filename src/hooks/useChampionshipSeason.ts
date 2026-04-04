import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const F1_POINTS: Record<number, number> = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
};

export function positionToPoints(pos: number): number {
  return F1_POINTS[pos] ?? 0;
}

export interface SeasonRegistration {
  id: string;
  pilot_name: string;
  car: string;
}

export interface RaceResult {
  id: string;
  registration_id: string;
  race_number: number;
  finish_position: number;
  points: number;
}

export interface LeaderboardEntry {
  registration_id: string;
  pilot_name: string;
  car: string;
  racePoints: (number | null)[]; // index 0-4 for races 1-5
  wins: number;
  total: number;
}

export type SeasonPhase = 'inscricoes' | 'ativo' | 'finalizado';

export interface RaceTrack {
  race_number: number;
  track_name: string;
}

export function useChampionshipSeason() {
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [seasonName, setSeasonName] = useState<string>('');
  const [phase, setPhase] = useState<SeasonPhase>('inscricoes');
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [raceTracks, setRaceTracks] = useState<RaceTrack[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active season
  const fetchSeason = useCallback(async () => {
    const { data } = await supabase
      .from('championship_seasons')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (data) {
      setSeasonId(data.id);
      setSeasonName(data.name);
      setPhase((data.phase as SeasonPhase) || 'inscricoes');
    } else {
      setSeasonId(null);
      setSeasonName('');
      setPhase('inscricoes');
    }
  }, []);

  // Fetch registrations for active season
  const fetchRegistrations = useCallback(async () => {
    if (!seasonId) { setRegistrations([]); return; }
    const { data } = await supabase
      .from('championship_registrations')
      .select('id, pilot_name, car')
      .eq('season_id', seasonId)
      .order('created_at');
    setRegistrations(data ?? []);
  }, [seasonId]);

  // Fetch results
  const fetchResults = useCallback(async () => {
    if (!seasonId) { setResults([]); return; }
    const { data } = await supabase
      .from('championship_race_results')
      .select('id, registration_id, race_number, finish_position, points')
      .eq('season_id', seasonId);
    setResults(data ?? []);
  }, [seasonId]);

  // Fetch race tracks
  const fetchRaceTracks = useCallback(async () => {
    if (!seasonId) { setRaceTracks([]); return; }
    const { data } = await supabase
      .from('championship_race_tracks')
      .select('race_number, track_name')
      .eq('season_id', seasonId)
      .order('race_number');
    setRaceTracks((data as RaceTrack[]) ?? []);
  }, [seasonId]);

  useEffect(() => { fetchSeason().finally(() => setLoading(false)); }, [fetchSeason]);
  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);
  useEffect(() => { fetchResults(); }, [fetchResults]);
  useEffect(() => { fetchRaceTracks(); }, [fetchRaceTracks]);

  // Realtime subscriptions
  useEffect(() => {
    if (!seasonId) return;
    const ch = supabase
      .channel('championship-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'championship_registrations', filter: `season_id=eq.${seasonId}` }, () => fetchRegistrations())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'championship_race_results', filter: `season_id=eq.${seasonId}` }, () => fetchResults())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'championship_race_tracks', filter: `season_id=eq.${seasonId}` }, () => fetchRaceTracks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'championship_seasons' }, () => fetchSeason())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [seasonId, fetchRegistrations, fetchResults, fetchRaceTracks, fetchSeason]);

  // Build leaderboard
  const leaderboard: LeaderboardEntry[] = registrations.map(reg => {
    const racePoints: (number | null)[] = [null, null, null, null, null];
    let total = 0;
    let wins = 0;
    results.filter(r => r.registration_id === reg.id).forEach(r => {
      racePoints[r.race_number - 1] = r.points;
      total += r.points;
      if (r.finish_position === 1) wins++;
    });
    return { registration_id: reg.id, pilot_name: reg.pilot_name, car: reg.car, racePoints, wins, total };
  }).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return b.wins - a.wins; // tiebreaker: more wins
  });

  // Check tie for 2nd/3rd after race 5
  const allRace5Done = leaderboard.length >= 3 && leaderboard.every(e => e.racePoints[4] !== null);
  let tieAlert: { pilot2: string; pilot3: string } | null = null;
  if (allRace5Done && leaderboard.length >= 3 && leaderboard[1].total === leaderboard[2].total) {
    // Only alert if wins are also equal (for 2nd/3rd, if wins differ, one is already ahead)
    if (leaderboard[1].wins === leaderboard[2].wins) {
      tieAlert = { pilot2: leaderboard[1].pilot_name, pilot3: leaderboard[2].pilot_name };
    }
  }

  // Auto-finalize after race 5
  const isFinalized = phase === 'finalizado';
  const canFinalize = allRace5Done && phase === 'ativo';

  // Admin: create season
  const createSeason = useCallback(async (name: string) => {
    // Deactivate old
    await supabase.from('championship_seasons').update({ is_active: false, phase: 'finalizado' }).eq('is_active', true);
    const { data } = await supabase.from('championship_seasons').insert({ name, is_active: true, phase: 'inscricoes' }).select().single();
    if (data) {
      setSeasonId(data.id);
      setSeasonName(data.name);
      setPhase('inscricoes');
    }
  }, []);

  // Admin: start championship (inscricoes -> ativo)
  const startChampionship = useCallback(async () => {
    if (!seasonId) return;
    await supabase.from('championship_seasons').update({ phase: 'ativo' }).eq('id', seasonId);
    setPhase('ativo');
  }, [seasonId]);

  // Admin: finalize championship (ativo -> finalizado)
  const finalizeChampionship = useCallback(async () => {
    if (!seasonId) return;
    await supabase.from('championship_seasons').update({ phase: 'finalizado' }).eq('id', seasonId);
    setPhase('finalizado');
  }, [seasonId]);

  // Admin: reset / cancel championship
  const resetChampionship = useCallback(async () => {
    if (!seasonId) return;
    // Delete results, registrations, then season
    await supabase.from('championship_race_results').delete().eq('season_id', seasonId);
    await supabase.from('championship_registrations').delete().eq('season_id', seasonId);
    await supabase.from('championship_seasons').delete().eq('id', seasonId);
    setSeasonId(null);
    setSeasonName('');
    setPhase('inscricoes');
    setRegistrations([]);
    setResults([]);
  }, [seasonId]);

  // Register pilot
  const registerPilot = useCallback(async (pilotName: string, car: string) => {
    if (!seasonId) return 'Nenhum campeonato ativo';
    if (phase !== 'inscricoes') return 'Inscrições encerradas';
    const { error } = await supabase.from('championship_registrations').insert({ season_id: seasonId, pilot_name: pilotName, car });
    if (error) {
      if (error.code === '23505') return 'Você já está inscrito neste campeonato';
      return error.message;
    }
    await fetchRegistrations();
    return null;
  }, [seasonId, phase, fetchRegistrations]);

  // Admin: set race result
  const setRaceResult = useCallback(async (registrationId: string, raceNumber: number, finishPosition: number) => {
    if (!seasonId) return;
    if (phase === 'finalizado') return;
    const points = positionToPoints(finishPosition);
    await supabase.from('championship_race_results').upsert(
      { season_id: seasonId, registration_id: registrationId, race_number: raceNumber, finish_position: finishPosition, points },
      { onConflict: 'season_id,registration_id,race_number' }
    );
    await fetchResults();
  }, [seasonId, phase, fetchResults]);

  // Admin: set race track
  const setRaceTrack = useCallback(async (raceNumber: number, trackName: string) => {
    if (!seasonId) return;
    await supabase.from('championship_race_tracks').upsert(
      { season_id: seasonId, race_number: raceNumber, track_name: trackName } as any,
      { onConflict: 'season_id,race_number' }
    );
    await fetchRaceTracks();
  }, [seasonId, fetchRaceTracks]);

  // Helper: get track name for a race
  const getTrackForRace = useCallback((raceNumber: number): string | null => {
    return raceTracks.find(t => t.race_number === raceNumber)?.track_name ?? null;
  }, [raceTracks]);

  return {
    seasonId,
    seasonName,
    phase,
    registrations,
    leaderboard,
    tieAlert,
    loading,
    isFinalized,
    canFinalize,
    createSeason,
    startChampionship,
    finalizeChampionship,
    resetChampionship,
    registerPilot,
    setRaceResult,
    setRaceTrack,
    getTrackForRace,
    raceTracks,
    results,
  };
}
