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
  total: number;
}

export function useChampionshipSeason() {
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [seasonName, setSeasonName] = useState<string>('');
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
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
    } else {
      setSeasonId(null);
      setSeasonName('');
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

  useEffect(() => { fetchSeason().finally(() => setLoading(false)); }, [fetchSeason]);
  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);
  useEffect(() => { fetchResults(); }, [fetchResults]);

  // Realtime subscriptions
  useEffect(() => {
    if (!seasonId) return;
    const ch = supabase
      .channel('championship-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'championship_registrations', filter: `season_id=eq.${seasonId}` }, () => fetchRegistrations())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'championship_race_results', filter: `season_id=eq.${seasonId}` }, () => fetchResults())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [seasonId, fetchRegistrations, fetchResults]);

  // Build leaderboard
  const leaderboard: LeaderboardEntry[] = registrations.map(reg => {
    const racePoints: (number | null)[] = [null, null, null, null, null];
    let total = 0;
    results.filter(r => r.registration_id === reg.id).forEach(r => {
      racePoints[r.race_number - 1] = r.points;
      total += r.points;
    });
    return { registration_id: reg.id, pilot_name: reg.pilot_name, car: reg.car, racePoints, total };
  }).sort((a, b) => b.total - a.total);

  // Check tie for 2nd/3rd after race 5
  const allRace5Done = leaderboard.length >= 3 && leaderboard.every(e => e.racePoints[4] !== null);
  let tieAlert: { pilot2: string; pilot3: string } | null = null;
  if (allRace5Done && leaderboard.length >= 3 && leaderboard[1].total === leaderboard[2].total) {
    tieAlert = { pilot2: leaderboard[1].pilot_name, pilot3: leaderboard[2].pilot_name };
  }

  // Admin: create season
  const createSeason = useCallback(async (name: string) => {
    // Deactivate old
    await supabase.from('championship_seasons').update({ is_active: false }).eq('is_active', true);
    const { data } = await supabase.from('championship_seasons').insert({ name, is_active: true }).select().single();
    if (data) { setSeasonId(data.id); setSeasonName(data.name); }
  }, []);

  // Register pilot
  const registerPilot = useCallback(async (pilotName: string, car: string) => {
    if (!seasonId) return 'Nenhum campeonato ativo';
    const { error } = await supabase.from('championship_registrations').insert({ season_id: seasonId, pilot_name: pilotName, car });
    if (error) {
      if (error.code === '23505') return 'Você já está inscrito neste campeonato';
      return error.message;
    }
    await fetchRegistrations();
    return null;
  }, [seasonId, fetchRegistrations]);

  // Admin: set race result
  const setRaceResult = useCallback(async (registrationId: string, raceNumber: number, finishPosition: number) => {
    if (!seasonId) return;
    const points = positionToPoints(finishPosition);
    await supabase.from('championship_race_results').upsert(
      { season_id: seasonId, registration_id: registrationId, race_number: raceNumber, finish_position: finishPosition, points },
      { onConflict: 'season_id,registration_id,race_number' }
    );
    await fetchResults();
  }, [seasonId, fetchResults]);

  return {
    seasonId,
    seasonName,
    registrations,
    leaderboard,
    tieAlert,
    loading,
    createSeason,
    registerPilot,
    setRaceResult,
    results,
  };
}
