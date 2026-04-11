import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notifyChampionshipFinalized } from '@/lib/discord';
import { ALL_ROLES, type PilotRole } from '@/data/users';

export const DEFAULT_POINTS_CONFIG: Record<number, number> = {
  1: 20, 2: 17, 3: 15, 4: 13, 5: 11, 6: 9, 7: 7, 8: 5, 9: 3, 10: 1,
};

function parsePointsConfig(raw: unknown): Record<number, number> {
  const out = { ...DEFAULT_POINTS_CONFIG };
  if (!raw || typeof raw !== 'object') return out;
  const o = raw as Record<string, unknown>;
  for (let i = 1; i <= 10; i++) {
    const v = o[String(i)] ?? o[i as unknown as string];
    if (typeof v === 'number' && !Number.isNaN(v) && v >= 0) out[i] = v;
  }
  return out;
}

function parsePistas(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string').map(s => s.trim()).filter(Boolean);
}

const KNOWN_ROLES = new Set<string>(ALL_ROLES);

function parseAllowedParticipantRoles(raw: unknown): PilotRole[] {
  if (raw == null) return [...ALL_ROLES];
  if (!Array.isArray(raw)) return [...ALL_ROLES];
  return raw.filter((x): x is PilotRole => typeof x === 'string' && KNOWN_ROLES.has(x));
}

/** PostgREST / cache: coluna ainda não aplicada na BD remota. */
function isMissingAllowedParticipantRolesColumn(err: { message?: string; code?: string }): boolean {
  const m = err.message || '';
  if (!/allowed_participant_roles/i.test(m)) return false;
  return /schema cache|could not find|column/i.test(m) || err.code === 'PGRST204';
}

/** Inscrição: cargo permitido na época, ou admin de campeonato (operação). */
export function isPilotRoleAllowedForSeason(
  role: PilotRole | null | undefined,
  allowed: PilotRole[],
  isChampAdmin: boolean
): boolean {
  if (isChampAdmin) return true;
  if (!role) return false;
  return allowed.length === 0 ? false : allowed.includes(role);
}

/** @deprecated use points from hook; kept for quick static fallback */
export function positionToPoints(pos: number, config: Record<number, number> = DEFAULT_POINTS_CONFIG): number {
  return config[pos] ?? 0;
}

export { TRACKS_LIST as CHAMPIONSHIP_TRACKS } from '@/data/tracks';

export type RegistrationStatus = 'pending' | 'confirmed';

export interface SeasonRegistration {
  id: string;
  pilot_name: string;
  car: string;
  registration_status: RegistrationStatus;
  created_at?: string;
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
  racePoints: (number | null)[];
  wins: number;
  total: number;
}

export type SeasonPhase = 'inscricoes' | 'ativo' | 'finalizado';

export interface RaceTrack {
  race_number: number;
  track_name: string;
}

export const CHAMPIONSHIP_ADMINS = ['sant', 'zanin', 'evojota', 'lunatic'];

export interface ActiveChampionship {
  id: string;
  name: string;
  /** Epoca ativa na BD (`is_active`) — o fluxo usa `phase` para inscrições/ativo/finalizado */
  status: 'active';
  phase: SeasonPhase;
  raceCount: number;
  allowedParticipantRoles: PilotRole[];
}

export function useChampionshipSeason() {
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [seasonName, setSeasonName] = useState<string>('');
  const [phase, setPhase] = useState<SeasonPhase>('inscricoes');
  const [raceCount, setRaceCount] = useState<number>(3);
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [raceTracks, setRaceTracks] = useState<RaceTrack[]>([]);
  const [pointsConfig, setPointsConfig] = useState<Record<number, number>>(() => ({ ...DEFAULT_POINTS_CONFIG }));
  const [pistasCatalog, setPistasCatalog] = useState<string[]>([]);
  const [allowedParticipantRoles, setAllowedParticipantRoles] = useState<PilotRole[]>(() => [...ALL_ROLES]);
  const [loading, setLoading] = useState(true);
  const pointsConfigRef = useRef(pointsConfig);
  pointsConfigRef.current = pointsConfig;

  const fetchSeason = useCallback(async () => {
    const { data, error } = await supabase
      .from('championship_seasons')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('fetchSeason', error);
      // Não limpar estado: após criar época o realtime chama isto; se SELECT falhar (RLS), não apagar seasonId.
      return;
    }
    if (data) {
      setSeasonId(data.id);
      setSeasonName(data.name);
      setPhase((data.phase as SeasonPhase) || 'inscricoes');
      setRaceCount((data as { race_count?: number }).race_count ?? 3);
      const row = data as {
        points_config?: unknown;
        pistas?: unknown;
      };
      setPointsConfig(parsePointsConfig(row.points_config));
      setPistasCatalog(parsePistas(row.pistas));
      setAllowedParticipantRoles(parseAllowedParticipantRoles((data as { allowed_participant_roles?: unknown }).allowed_participant_roles));
    } else {
      setSeasonId(null);
      setSeasonName('');
      setPhase('inscricoes');
      setRaceCount(3);
      setPointsConfig({ ...DEFAULT_POINTS_CONFIG });
      setPistasCatalog([]);
      setAllowedParticipantRoles([...ALL_ROLES]);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    if (!seasonId) {
      setRegistrations([]);
      return;
    }
    const { data, error } = await supabase
      .from('championship_registrations')
      .select('*')
      .eq('season_id', seasonId)
      .order('created_at');
    if (error) {
      console.error('fetchRegistrations', error);
      setRegistrations([]);
      return;
    }
    const rows = (data ?? []) as Record<string, unknown>[];
    setRegistrations(
      rows.map(r => ({
        id: r.id as string,
        pilot_name: r.pilot_name as string,
        car: (r.car as string) || '',
        registration_status:
          r.registration_status === 'pending' ? 'pending' : 'confirmed',
        created_at: r.created_at as string | undefined,
      }))
    );
  }, [seasonId]);

  const fetchResults = useCallback(async () => {
    if (!seasonId) {
      setResults([]);
      return;
    }
    const { data } = await supabase
      .from('championship_race_results')
      .select('id, registration_id, race_number, finish_position, points')
      .eq('season_id', seasonId);
    setResults(data ?? []);
  }, [seasonId]);

  const fetchRaceTracks = useCallback(async () => {
    if (!seasonId) {
      setRaceTracks([]);
      return;
    }
    const { data } = await supabase
      .from('championship_race_tracks')
      .select('race_number, track_name')
      .eq('season_id', seasonId)
      .order('race_number');
    setRaceTracks((data as RaceTrack[]) ?? []);
  }, [seasonId]);

  useEffect(() => {
    fetchSeason().finally(() => setLoading(false));
  }, [fetchSeason]);
  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);
  useEffect(() => {
    fetchRaceTracks();
  }, [fetchRaceTracks]);

  useEffect(() => {
    if (!seasonId) return;
    const ch = supabase
      .channel('championship-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'championship_registrations', filter: `season_id=eq.${seasonId}` },
        () => fetchRegistrations()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'championship_race_results', filter: `season_id=eq.${seasonId}` },
        () => fetchResults()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'championship_race_tracks', filter: `season_id=eq.${seasonId}` },
        () => fetchRaceTracks()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'championship_seasons' }, () => fetchSeason())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [seasonId, fetchRegistrations, fetchResults, fetchRaceTracks, fetchSeason]);

  const confirmedRegistrations = useMemo(
    () => registrations.filter(r => r.registration_status === 'confirmed'),
    [registrations]
  );

  const leaderboard: LeaderboardEntry[] = useMemo(
    () =>
      confirmedRegistrations
        .map(reg => {
          const racePoints: (number | null)[] = Array.from({ length: raceCount }, () => null);
          let total = 0;
          let wins = 0;
          results
            .filter(r => r.registration_id === reg.id)
            .forEach(r => {
              if (r.race_number >= 1 && r.race_number <= raceCount) {
                racePoints[r.race_number - 1] = r.points;
                total += r.points;
                if (r.finish_position === 1) wins++;
              }
            });
          return {
            registration_id: reg.id,
            pilot_name: reg.pilot_name,
            car: reg.car,
            racePoints,
            wins,
            total,
          };
        })
        .sort((a, b) => {
          if (b.total !== a.total) return b.total - a.total;
          return b.wins - a.wins;
        }),
    [confirmedRegistrations, results, raceCount]
  );

  const allRacesDone =
    leaderboard.length >= 2 && leaderboard.every(e => e.racePoints[raceCount - 1] !== null);
  const isFinalized = phase === 'finalizado';
  const canFinalize = allRacesDone && phase === 'ativo';

  const activeChampionship: ActiveChampionship | null = useMemo(() => {
    if (!seasonId) return null;
    return {
      id: seasonId,
      name: seasonName,
      status: 'active',
      phase,
      raceCount,
      allowedParticipantRoles,
    };
  }, [seasonId, seasonName, phase, raceCount, allowedParticipantRoles]);

  const applySeasonRowToState = useCallback((row: Record<string, unknown>, fallbackRaces?: number) => {
    setSeasonId(row.id as string);
    setSeasonName((row.name as string) || '');
    setPhase(((row.phase as SeasonPhase) || 'inscricoes') as SeasonPhase);
    setRaceCount((row.race_count as number) ?? fallbackRaces ?? 3);
    setPointsConfig(parsePointsConfig(row.points_config));
    setPistasCatalog(parsePistas(row.pistas));
    setAllowedParticipantRoles(parseAllowedParticipantRoles(row.allowed_participant_roles));
  }, []);

  /** Cria época ativa. Devolve mensagem de erro ou null se OK. */
  const createSeason = useCallback(
    async (name: string, numRaces: number = 3, roles: PilotRole[] = [...ALL_ROLES]): Promise<string | null> => {
      await supabase.from('championship_seasons').update({ is_active: false, phase: 'finalizado' }).eq('is_active', true);

      let legacyNoRolesColumn = false;
      let { data, error } = await supabase
        .from('championship_seasons')
        .insert({
          name,
          is_active: true,
          phase: 'inscricoes',
          race_count: numRaces,
          allowed_participant_roles: roles,
        } as never)
        .select('id, name, phase, race_count, allowed_participant_roles')
        .maybeSingle();

      if (error && isMissingAllowedParticipantRolesColumn(error)) {
        legacyNoRolesColumn = true;
        ({ data, error } = await supabase
          .from('championship_seasons')
          .insert({
            name,
            is_active: true,
            phase: 'inscricoes',
            race_count: numRaces,
          } as never)
          .select('id, name, phase, race_count')
          .maybeSingle());
      }

      if (error) {
        console.error('championship_seasons insert', error);
        const msg = error.message || String(error);
        if (/row-level security|RLS|policy/i.test(msg)) {
          return `${msg} — Cola no SQL Editor o ficheiro supabase/paste_championship_setup.sql (políticas anon + colunas).`;
        }
        return msg;
      }

      if (data && (data as { id?: string }).id) {
        applySeasonRowToState(data as Record<string, unknown>, numRaces);
        if (legacyNoRolesColumn) setAllowedParticipantRoles(roles);
        return null;
      }

      // INSERT sem linha devolvida (ex.: RLS bloqueia SELECT após insert): tentar recarregar época ativa
      const { data: again, error: e2 } = await supabase
        .from('championship_seasons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (e2) {
        console.error('championship_seasons reload', e2);
        return e2.message;
      }
      if (again) {
        applySeasonRowToState(again as Record<string, unknown>, numRaces);
        if (legacyNoRolesColumn) setAllowedParticipantRoles(roles);
        return null;
      }

      return 'Não foi possível criar ou ler o campeonato. Cola supabase/paste_championship_setup.sql no SQL Editor do Supabase.';
    },
    [applySeasonRowToState]
  );

  const startChampionship = useCallback(async () => {
    if (!seasonId) return;
    await supabase.from('championship_seasons').update({ phase: 'ativo' }).eq('id', seasonId);
    setPhase('ativo');
  }, [seasonId]);

  const finalizeChampionship = useCallback(async () => {
    if (!seasonId) return;
    await supabase.from('championship_seasons').update({ phase: 'finalizado' }).eq('id', seasonId);
    setPhase('finalizado');

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
    setPointsConfig({ ...DEFAULT_POINTS_CONFIG });
    setPistasCatalog([]);
    setAllowedParticipantRoles([...ALL_ROLES]);
  }, [seasonId]);

  const registerPilot = useCallback(
    async (pilotName: string, car: string, isAdmin = false) => {
      if (!seasonId) return 'Nenhum campeonato ativo';
      if (phase !== 'inscricoes' && !isAdmin) return 'Inscrições encerradas';
      const { error } = await supabase.from('championship_registrations').insert({
        season_id: seasonId,
        pilot_name: pilotName,
        car,
        registration_status: isAdmin ? 'confirmed' : 'pending',
      } as never);
      if (error) {
        if (error.code === '23505') return 'Você já está inscrito neste campeonato';
        return error.message;
      }
      await fetchRegistrations();
      return null;
    },
    [seasonId, phase, fetchRegistrations]
  );

  const approveRegistration = useCallback(
    async (registrationId: string) => {
      if (!seasonId) return 'Sem temporada';
      const { error } = await supabase
        .from('championship_registrations')
        .update({ registration_status: 'confirmed' } as never)
        .eq('id', registrationId)
        .eq('season_id', seasonId);
      if (error) return error.message;
      await fetchRegistrations();
      return null;
    },
    [seasonId, fetchRegistrations]
  );

  const removeRegistration = useCallback(
    async (registrationId: string) => {
      if (!seasonId) return 'Sem temporada';
      const { error } = await supabase
        .from('championship_registrations')
        .delete()
        .eq('id', registrationId)
        .eq('season_id', seasonId);
      if (error) return error.message;
      await fetchRegistrations();
      return null;
    },
    [seasonId, fetchRegistrations]
  );

  const savePointsConfig = useCallback(
    async (config: Record<number, number>) => {
      if (!seasonId) return 'Sem temporada';
      const json = Object.fromEntries(
        Object.entries(config)
          .filter(([k]) => {
            const n = parseInt(k, 10);
            return n >= 1 && n <= 10;
          })
          .map(([k, v]) => [k, Math.max(0, Math.floor(Number(v)) || 0)])
      );
      const { error } = await supabase
        .from('championship_seasons')
        .update({ points_config: json } as never)
        .eq('id', seasonId);
      if (error) return error.message;
      setPointsConfig(parsePointsConfig(json));
      return null;
    },
    [seasonId]
  );

  const savePistasCatalog = useCallback(
    async (list: string[]) => {
      if (!seasonId) return 'Sem temporada';
      const clean = [...new Set(list.map(s => s.trim()).filter(Boolean))];
      const { error } = await supabase
        .from('championship_seasons')
        .update({ pistas: clean } as never)
        .eq('id', seasonId);
      if (error) return error.message;
      setPistasCatalog(clean);
      return null;
    },
    [seasonId]
  );

  const setRaceResult = useCallback(
    async (registrationId: string, raceNumber: number, finishPosition: number, manualPoints?: number) => {
      if (!seasonId) return;
      if (phase === 'finalizado') return;
      const cfg = pointsConfigRef.current;
      const points =
        manualPoints !== undefined ? manualPoints : finishPosition === 0 ? 0 : cfg[finishPosition] ?? 0;
      await supabase.from('championship_race_results').upsert(
        {
          season_id: seasonId,
          registration_id: registrationId,
          race_number: raceNumber,
          finish_position: finishPosition,
          points,
        } as never,
        { onConflict: 'season_id,registration_id,race_number' }
      );
      await fetchResults();
    },
    [seasonId, phase, fetchResults]
  );

  const setRaceTrack = useCallback(
    async (raceNumber: number, trackName: string) => {
      if (!seasonId) return;
      await supabase
        .from('championship_race_tracks')
        .upsert({ season_id: seasonId, race_number: raceNumber, track_name: trackName } as never, {
          onConflict: 'season_id,race_number',
        });
      await fetchRaceTracks();
    },
    [seasonId, fetchRaceTracks]
  );

  const getTrackForRace = useCallback(
    (raceNumber: number): string | null => {
      return raceTracks.find(t => t.race_number === raceNumber)?.track_name ?? null;
    },
    [raceTracks]
  );

  const pointsForPosition = useCallback((pos: number) => pointsConfig[pos] ?? 0, [pointsConfig]);

  return {
    seasonId,
    activeChampionship,
    seasonName,
    phase,
    raceCount,
    registrations,
    confirmedRegistrations,
    leaderboard,
    loading,
    isFinalized,
    canFinalize,
    pointsConfig,
    pistasCatalog,
    allowedParticipantRoles,
    createSeason,
    startChampionship,
    finalizeChampionship,
    resetChampionship,
    registerPilot,
    approveRegistration,
    removeRegistration,
    savePointsConfig,
    savePistasCatalog,
    setRaceResult,
    setRaceTrack,
    getTrackForRace,
    raceTracks,
    results,
    pointsForPosition,
  };
}
