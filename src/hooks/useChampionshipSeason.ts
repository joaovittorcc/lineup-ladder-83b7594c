import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notifyChampionshipFinalized } from '@/lib/discord';

// New scoring: 1º=20, 2º=17, 3º=15, 4º=13, 5º=11, 6º=9, 7º=7, 8º=5, 9º=3, 10º=1
const CHAMPIONSHIP_POINTS: Record<number, number> = {
  1: 20, 2: 17, 3: 15, 4: 13, 5: 11, 6: 9, 7: 7, 8: 5, 9: 3, 10: 1,
};

export function positionToPoints(pos: number): number {
  return CHAMPIONSHIP_POINTS[pos] ?? 0;
}

// Tracks are now selected from the full tracks list
export { TRACKS_LIST as CHAMPIONSHIP_TRACKS } from '@/data/tracks';

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
  racePoints: (number | null)[]; // index 0-2 for races 1-3
  wins: number;
  total: number;
}

export type SeasonPhase = 'inscricoes' | 'ativo' | 'finalizado';

export interface RaceTrack {
  race_number: number;
  track_name: string;
}

// Admins allowed to create/manage championships
export const CHAMPIONSHIP_ADMINS = ['sant', 'zanin', 'evojota'];

export function useChampionshipSeason() {
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [seasonName, setSeasonName] = useState<string>('');
  const [phase, setPhase] = useState<SeasonPhase>('inscricoes');
  const [raceCount, setRaceCount] = useState<number>(3);
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [raceTracks, setRaceTracks] = useState<RaceTrack[]>([]);
  const [loading, setLoading] = useState(true);

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
      setRaceCount((data as any).race_count ?? 3);
    } else {
      setSeasonId(null);
      setSeasonName('');
      setPhase('inscricoes');
      setRaceCount(3);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    if (!seasonId) { setRegistrations([]); return; }
    const { data } = await supabase
      .from('championship_registrations')
      .select('id, pilot_name, car')
      .eq('season_id', seasonId)
      .order('created_at');
    setRegistrations(data ?? []);
  }, [seasonId]);

  const fetchResults = useCallback(async () => {
    if (!seasonId) { setResults([]); return; }
    const { data } = await supabase
      .from('championship_race_results')
      .select('id, registration_id, race_number, finish_position, points')
      .eq('season_id', seasonId);
    setResults(data ?? []);
  }, [seasonId]);

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

  // Realtime
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

  // Build leaderboard (3 races)
  const leaderboard: LeaderboardEntry[] = registrations.map(reg => {
    const racePoints: (number | null)[] = Array.from({ length: raceCount }, () => null);
    let total = 0;
    let wins = 0;
    results.filter(r => r.registration_id === reg.id).forEach(r => {
      if (r.race_number >= 1 && r.race_number <= raceCount) {
        racePoints[r.race_number - 1] = r.points;
        total += r.points;
        if (r.finish_position === 1) wins++;
      }
    });
    return { registration_id: reg.id, pilot_name: reg.pilot_name, car: reg.car, racePoints, wins, total };
  }).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return b.wins - a.wins;
  });

  const allRacesDone = leaderboard.length >= 2 && leaderboard.every(e => e.racePoints[raceCount - 1] !== null);
  const isFinalized = phase === 'finalizado';
  const canFinalize = allRacesDone && phase === 'ativo';

  // Create season
  const createSeason = useCallback(async (name: string, numRaces: number = 3) => {
    await supabase.from('championship_seasons').update({ is_active: false, phase: 'finalizado' }).eq('is_active', true);
    const { data } = await supabase.from('championship_seasons').insert({ name, is_active: true, phase: 'inscricoes', race_count: numRaces } as any).select().single();
    if (data) {
      setSeasonId(data.id);
      setSeasonName(data.name);
      setPhase('inscricoes');
      setRaceCount((data as any).race_count ?? numRaces);
    }
  }, []);

  const startChampionship = useCallback(async () => {
    if (!seasonId) return;
    await supabase.from('championship_seasons').update({ phase: 'ativo' }).eq('id', seasonId);
    setPhase('ativo');
  }, [seasonId]);

  const finalizeChampionship = useCallback(async () => {
    if (!seasonId) return;
    await supabase.from('championship_seasons').update({ phase: 'finalizado' }).eq('id', seasonId);
    setPhase('finalizado');

    // Send Discord notification via webhook
    try {
      await notifyChampionshipFinalized({
        seasonName,
        leaderboard: leaderboard.map((e, i) => ({
          position: i + 1,
          pilot_name: e.pilot_name,
          total: e.total,
          wins: e.wins,
          racePoints: e.racePoints,
        })),
      });
    } catch (err) {
      console.error('Failed to send tournament result to Discord:', err);
    }
  }, [seasonId, seasonName, leaderboard]);

  const resetChampionship = useCallback(async () => {
    if (!seasonId) return;
    await supabase.from('championship_race_results').delete().eq('season_id', seasonId);
    await supabase.from('championship_race_tracks').delete().eq('season_id', seasonId);
    await supabase.from('championship_registrations').delete().eq('season_id', seasonId);
    await supabase.from('championship_seasons').delete().eq('id', seasonId);
    setSeasonId(null);
    setSeasonName('');
    setPhase('inscricoes');
    setRegistrations([]);
    setResults([]);
  }, [seasonId]);

  const registerPilot = useCallback(async (pilotName: string, car: string, isAdmin = false) => {
    if (!seasonId) return 'Nenhum campeonato ativo';
    if (phase !== 'inscricoes' && !isAdmin) return 'Inscrições encerradas';
    const { error } = await supabase.from('championship_registrations').insert({ season_id: seasonId, pilot_name: pilotName, car });
    if (error) {
      if (error.code === '23505') return 'Você já está inscrito neste campeonato';
      return error.message;
    }
    await fetchRegistrations();
    return null;
  }, [seasonId, phase, fetchRegistrations]);

  const setRaceResult = useCallback(async (registrationId: string, raceNumber: number, finishPosition: number, manualPoints?: number) => {
    if (!seasonId) return;
    if (phase === 'finalizado') return;
    const points = manualPoints !== undefined ? manualPoints : (finishPosition === 0 ? 0 : positionToPoints(finishPosition));
    await supabase.from('championship_race_results').upsert(
      { season_id: seasonId, registration_id: registrationId, race_number: raceNumber, finish_position: finishPosition, points },
      { onConflict: 'season_id,registration_id,race_number' }
    );
    await fetchResults();
  }, [seasonId, phase, fetchResults]);

  const setRaceTrack = useCallback(async (raceNumber: number, trackName: string) => {
    if (!seasonId) return;
    await supabase.from('championship_race_tracks').upsert(
      { season_id: seasonId, race_number: raceNumber, track_name: trackName } as any,
      { onConflict: 'season_id,race_number' }
    );
    await fetchRaceTracks();
  }, [seasonId, fetchRaceTracks]);

  const getTrackForRace = useCallback((raceNumber: number): string | null => {
    return raceTracks.find(t => t.race_number === raceNumber)?.track_name ?? null;
  }, [raceTracks]);

  return {
    seasonId, seasonName, phase, raceCount, registrations, leaderboard, loading,
    isFinalized, canFinalize,
    createSeason, startChampionship, finalizeChampionship, resetChampionship,
    registerPilot, setRaceResult, setRaceTrack, getTrackForRace, raceTracks, results,
  };
}
