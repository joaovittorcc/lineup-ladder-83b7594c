import { useState, useEffect, useMemo } from 'react';
import type { ActiveChampionship, LeaderboardEntry, RaceResult, SeasonRegistration, SeasonPhase } from '@/hooks/useChampionshipSeason';
import type { PilotRole } from '@/data/users';
import { getRoleLabel } from '@/data/users';
import { CHAMPIONSHIP_TRACKS, DEFAULT_POINTS_CONFIG } from '@/hooks/useChampionshipSeason';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Flag,
  Trophy,
  UserPlus,
  Play,
  Lock,
  Crown,
  Trash2,
  MapPin,
  AlertTriangle,
  LayoutDashboard,
  Users,
  Calculator,
  Route,
  Check,
  X,
} from 'lucide-react';
import { notifyRaceResult } from '@/lib/discord';

type DashTab = 'geral' | 'inscricoes' | 'pontuacao' | 'pistas';

const phaseLabels: Record<SeasonPhase, string> = {
  inscricoes: '📋 INSCRIÇÕES ABERTAS',
  ativo: '🏁 EM ANDAMENTO',
  finalizado: '🏆 FINALIZADO',
};

const cardClass =
  'rounded-xl border-2 border-pink-500/20 bg-black/40 backdrop-blur overflow-hidden';
const cardHead = 'bg-pink-500/5 px-5 py-4 border-b border-pink-500/20 flex items-center gap-2';

const mergedTracks = (catalog: string[]) =>
  [...new Set([...CHAMPIONSHIP_TRACKS, ...catalog])].sort((a, b) => a.localeCompare(b, 'pt'));

interface ChampionshipDashboardProps {
  activeChampionship: ActiveChampionship;
  isChampAdmin: boolean;
  seasonName: string;
  phase: SeasonPhase;
  raceCount: number;
  registrations: SeasonRegistration[];
  confirmedCount: number;
  pendingCount: number;
  leaderboard: LeaderboardEntry[];
  isFinalized: boolean;
  canFinalize: boolean;
  pointsConfig: Record<number, number>;
  pistasCatalog: string[];
  results: RaceResult[];
  getTrackForRace: (n: number) => string | null;
  pointsForPosition: (pos: number) => number;
  /** Inscrição visitante */
  pinInput: string;
  setPinInput: (v: string) => void;
  loggedNick: string | null;
  isBlocked: boolean;
  isRegistered: boolean;
  isPendingRegistration: boolean;
  canRegister: boolean;
  onRegister: () => void;
  onStartChampionship: () => void;
  onFinalizeChampionship: () => void;
  onResetChampionship: () => void;
  approveRegistration: (id: string) => Promise<string | null>;
  removeRegistration: (id: string) => Promise<string | null>;
  savePointsConfig: (c: Record<number, number>) => Promise<string | null>;
  savePistasCatalog: (list: string[]) => Promise<string | null>;
  setRaceTrack: (raceNumber: number, trackName: string) => Promise<void>;
  setRaceResult: (
    registrationId: string,
    raceNumber: number,
    finishPosition: number,
    manualPoints?: number
  ) => Promise<void>;
  allowedParticipantRoles: PilotRole[];
  /** Piloto com cargo fora da lista admitida (torneio exclusivo). */
  roleAdmissionBlocked: boolean;
  newSeasonName: string;
  setNewSeasonName: (v: string) => void;
  newRaceCount: string;
  setNewRaceCount: (v: string) => void;
  onCreateSeason: () => void;
}

const ChampionshipDashboard = ({
  activeChampionship,
  isChampAdmin,
  seasonName,
  phase,
  raceCount,
  registrations,
  confirmedCount,
  pendingCount,
  leaderboard,
  isFinalized,
  canFinalize,
  pointsConfig,
  pistasCatalog,
  results,
  getTrackForRace,
  pointsForPosition,
  pinInput,
  setPinInput,
  loggedNick,
  isBlocked,
  isRegistered,
  isPendingRegistration,
  canRegister,
  onRegister,
  onStartChampionship,
  onFinalizeChampionship,
  onResetChampionship,
  approveRegistration,
  removeRegistration,
  savePointsConfig,
  savePistasCatalog,
  setRaceTrack,
  setRaceResult,
  allowedParticipantRoles,
  roleAdmissionBlocked,
  newSeasonName,
  setNewSeasonName,
  newRaceCount,
  setNewRaceCount,
  onCreateSeason,
}: ChampionshipDashboardProps) => {
  const [activeTab, setActiveTab] = useState<DashTab>('geral');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingRace, setEditingRace] = useState(1);
  const [manualPoints, setManualPoints] = useState<Record<string, string>>({});
  const [pointsDraft, setPointsDraft] = useState<Record<number, string>>({});
  const [pistasDraft, setPistasDraft] = useState<string[]>(pistasCatalog);
  const [newPista, setNewPista] = useState('');
  const [savingPoints, setSavingPoints] = useState(false);
  const [savingPistas, setSavingPistas] = useState(false);

  const raceNumbers = useMemo(() => Array.from({ length: raceCount }, (_, i) => i + 1), [raceCount]);
  const trackOptions = useMemo(() => mergedTracks(pistasCatalog), [pistasCatalog]);

  useEffect(() => {
    const d: Record<number, string> = {};
    for (let i = 1; i <= 10; i++) d[i] = String(pointsConfig[i] ?? DEFAULT_POINTS_CONFIG[i] ?? 0);
    setPointsDraft(d);
  }, [pointsConfig]);

  useEffect(() => {
    setPistasDraft(pistasCatalog);
  }, [pistasCatalog]);

  const getResultForReg = (regId: string, race: number) =>
    results.find(r => r.registration_id === regId && r.race_number === race);

  const handleSetPosition = async (registrationId: string, race: number, pos: string) => {
    const key = `${registrationId}-${race}`;
    const customPts = manualPoints[key];
    if (pos === 'NP') {
      await setRaceResult(registrationId, race, 0, customPts ? parseInt(customPts, 10) : undefined);
      return;
    }
    const p = parseInt(pos, 10);
    if (Number.isNaN(p) || p < 1 || p > 20) return;
    await setRaceResult(registrationId, race, p, customPts ? parseInt(customPts, 10) : undefined);
  };

  const handleManualPointsSave = async (registrationId: string, race: number) => {
    const key = `${registrationId}-${race}`;
    const pts = parseInt(manualPoints[key] || '0', 10);
    if (Number.isNaN(pts) || pts < 0) return;
    const existing = getResultForReg(registrationId, race);
    const pos = existing?.finish_position ?? 0;
    await setRaceResult(registrationId, race, pos, pts);
    toast({ title: '✅ Pontos atualizados', description: `${pts} pontos salvos.` });
  };

  const handleSavePoints = async () => {
    const cfg: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      const v = parseInt(pointsDraft[i] || '0', 10);
      cfg[i] = Number.isNaN(v) || v < 0 ? 0 : v;
    }
    setSavingPoints(true);
    try {
      const err = await savePointsConfig(cfg);
      if (err) toast({ title: 'Erro ao guardar', description: err, variant: 'destructive' });
      else toast({ title: 'Pontuação guardada', description: 'Tabela 1º–10º atualizada na base de dados.' });
    } finally {
      setSavingPoints(false);
    }
  };

  const handleSavePistas = async () => {
    setSavingPistas(true);
    try {
      const err = await savePistasCatalog(pistasDraft);
      if (err) toast({ title: 'Erro ao guardar', description: err, variant: 'destructive' });
      else toast({ title: 'Pistas guardadas', description: 'Catálogo atualizado.' });
    } finally {
      setSavingPistas(false);
    }
  };

  const addPista = () => {
    const t = newPista.trim();
    if (!t || pistasDraft.includes(t)) return;
    setPistasDraft([...pistasDraft, t]);
    setNewPista('');
  };

  const tabBtn =
    'text-[10px] font-bold uppercase tracking-wider font-[\'Orbitron\'] data-[state=active]:bg-pink-500/25 data-[state=active]:text-pink-300 data-[state=active]:border-pink-500/40 border border-transparent rounded-md px-2 py-2';

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="text-center space-y-2 pb-2">
        <div className="flex items-center justify-center gap-2">
          <Flag className="h-5 w-5 text-pink-500" />
          <h2
            className="text-xl font-black uppercase tracking-wider font-['Orbitron']"
            style={{
              color: 'hsl(330, 100%, 60%)',
              textShadow: '0 0 20px hsl(330, 100%, 50%), 0 0 40px hsl(330, 100%, 40%)',
            }}
          >
            {seasonName}
          </h2>
        </div>
        <div
          className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-['Orbitron'] border ${
            phase === 'inscricoes'
              ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
              : phase === 'ativo'
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
          }`}
        >
          {phaseLabels[phase]}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Centro de comando · ID <code className="text-pink-400/80">{activeChampionship.id.slice(0, 8)}…</code>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as DashTab)} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-black/50 border border-pink-500/20 p-1 justify-start rounded-lg">
          <TabsTrigger value="geral" className={tabBtn}>
            <LayoutDashboard className="h-3 w-3 mr-1 shrink-0" /> Geral
          </TabsTrigger>
          <TabsTrigger value="inscricoes" className={tabBtn}>
            <Users className="h-3 w-3 mr-1 shrink-0" /> Inscrições
          </TabsTrigger>
          <TabsTrigger value="pontuacao" className={tabBtn}>
            <Calculator className="h-3 w-3 mr-1 shrink-0" /> Pontuação
          </TabsTrigger>
          <TabsTrigger value="pistas" className={tabBtn}>
            <Route className="h-3 w-3 mr-1 shrink-0" /> Pistas
          </TabsTrigger>
        </TabsList>

        {/* ——— GERAL ——— */}
        <TabsContent value="geral" className="mt-4 space-y-4">
          <div className={`${cardClass}`} style={{ boxShadow: '0 0 30px hsl(330, 100%, 50%, 0.08)' }}>
            <div className={cardHead}>
              <LayoutDashboard className="h-4 w-4 text-pink-400" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                Visão geral
              </h3>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-lg bg-pink-500/5 border border-pink-500/15 p-3">
                <p className="text-[9px] text-pink-400/60 font-['Orbitron'] uppercase">Corridas</p>
                <p className="text-2xl font-black text-pink-300 font-['Orbitron']">{raceCount}</p>
              </div>
              <div className="rounded-lg bg-pink-500/5 border border-pink-500/15 p-3">
                <p className="text-[9px] text-pink-400/60 font-['Orbitron'] uppercase">Confirmados</p>
                <p className="text-2xl font-black text-pink-300 font-['Orbitron']">{confirmedCount}</p>
              </div>
              <div className="rounded-lg bg-pink-500/5 border border-pink-500/15 p-3">
                <p className="text-[9px] text-pink-400/60 font-['Orbitron'] uppercase">Pendentes</p>
                <p className="text-2xl font-black text-amber-400/90 font-['Orbitron']">{pendingCount}</p>
              </div>
              <div className="rounded-lg bg-pink-500/5 border border-pink-500/15 p-3">
                <p className="text-[9px] text-pink-400/60 font-['Orbitron'] uppercase">Fase</p>
                <p className="text-sm font-bold text-foreground mt-1">{phaseLabels[phase]}</p>
              </div>
            </div>
            <div className="px-5 pb-5 pt-0 border-t border-pink-500/10">
              <p className="text-[9px] text-pink-400/60 font-['Orbitron'] uppercase tracking-wider mb-2">Cargos admitidos</p>
              <div className="flex flex-wrap gap-1.5">
                {allowedParticipantRoles.length === 0 ? (
                  <span className="text-xs text-amber-400/90">Nenhum (só admins de campeonato)</span>
                ) : (
                  allowedParticipantRoles.map(r => (
                    <span
                      key={r}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-300 border border-pink-500/25"
                    >
                      {getRoleLabel(r)}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {(phase === 'inscricoes' || isChampAdmin) && loggedNick && !isFinalized && (
            <div
              className="rounded-xl border-2 border-pink-500/20 bg-black/40 backdrop-blur p-5 space-y-3"
              style={{ boxShadow: '0 0 30px hsl(330, 100%, 50%, 0.1)' }}
            >
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-pink-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400 font-['Orbitron']">
                  Inscrição
                </h3>
              </div>
              {isRegistered && (
                <p className="text-sm text-green-400 font-bold">
                  {isPendingRegistration ? '⏳ Inscrição pendente de aprovação pelo admin.' : '✅ Inscrito neste campeonato.'}
                </p>
              )}
              {isBlocked && !isRegistered && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400 font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Pilotos da Lista 01 e 02 não podem participar.
                  </p>
                </div>
              )}
              {roleAdmissionBlocked && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-sm text-amber-400 font-bold flex items-center gap-2">
                    <Lock className="h-4 w-4 shrink-0" />
                    O teu cargo não está admitido neste torneio (exclusivo por função).
                  </p>
                </div>
              )}
              {canRegister && (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    placeholder="Senha de piloto"
                    className="h-9 text-xs bg-black/60 border-pink-500/20 flex-1"
                    maxLength={10}
                    onKeyDown={e => e.key === 'Enter' && onRegister()}
                  />
                  <Button
                    size="sm"
                    onClick={onRegister}
                    className="h-9 text-xs bg-pink-500/20 text-pink-400 border border-pink-500/30 font-bold"
                  >
                    Participar
                  </Button>
                </div>
              )}
            </div>
          )}

          {phase !== 'inscricoes' && !isFinalized && !isChampAdmin && (
            <div className="rounded-xl border border-pink-500/10 bg-black/30 p-4 flex items-center gap-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Inscrições encerradas. Campeonato em andamento.</p>
            </div>
          )}

          {isFinalized && leaderboard.length >= 2 && (
            <div
              className="rounded-xl border-2 border-green-500/30 bg-black/40 backdrop-blur p-5 space-y-3"
              style={{ boxShadow: '0 0 30px hsl(120, 100%, 40%, 0.1)' }}
            >
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-green-400 font-['Orbitron']">
                  Classificados (top 2)
                </h3>
              </div>
              <div className="flex gap-4">
                {leaderboard.slice(0, 2).map((entry, idx) => (
                  <div key={entry.registration_id} className="flex-1 bg-green-500/5 rounded-lg p-4 text-center border border-green-500/20">
                    <p className="text-[10px] text-green-400/60 font-['Orbitron'] uppercase">{idx + 1}º</p>
                    <p
                      className="text-lg font-black"
                      style={{ color: 'hsl(330, 100%, 60%)', textShadow: '0 0 10px hsl(330, 100%, 50%)' }}
                    >
                      {entry.pilot_name}
                    </p>
                    <p className="text-sm font-bold text-green-400">{entry.total}pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`${cardClass}`} style={{ boxShadow: '0 0 30px hsl(330, 100%, 50%, 0.08)' }}>
            <div className={cardHead}>
              <Trophy className="h-4 w-4 text-pink-400" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                Classificação geral
              </h3>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Nenhum piloto confirmado com pontos ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pink-500/20 text-[10px] uppercase tracking-wider text-pink-400/60 font-['Orbitron']">
                      <th className="px-3 py-3 text-left">Pos</th>
                      <th className="px-3 py-3 text-left">Piloto</th>
                      {raceNumbers.map(r => {
                        const track = getTrackForRace(r);
                        return (
                          <th key={r} className="px-2 py-3 text-center" title={track || `Corrida ${r}`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <span>C{r}</span>
                              {track && (
                                <span className="text-[7px] text-pink-400/40 font-normal normal-case max-w-[72px] truncate">
                                  {track}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                      <th className="px-3 py-3 text-center font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => {
                      const isPromoZone = idx <= 1;
                      return (
                        <tr
                          key={entry.registration_id}
                          className={`border-b border-pink-500/10 ${isPromoZone ? 'bg-green-500/5' : 'hover:bg-pink-500/5'}`}
                        >
                          <td
                            className={`px-3 py-3 font-bold font-['Orbitron'] text-xs ${isPromoZone ? 'text-green-400' : 'text-muted-foreground'}`}
                          >
                            {idx + 1}º
                          </td>
                          <td
                            className={`px-3 py-3 font-bold ${isPromoZone ? 'text-pink-300' : ''}`}
                            style={
                              isPromoZone
                                ? { color: 'hsl(330, 100%, 60%)', textShadow: '0 0 8px hsl(330, 100%, 50%)' }
                                : {}
                            }
                          >
                            {entry.pilot_name}
                          </td>
                          {entry.racePoints.map((pts, ri) => (
                            <td key={ri} className="px-2 py-3 text-center text-xs">
                              {pts !== null ? (
                                <span
                                  className={
                                    pts >= 15
                                      ? 'text-pink-400 font-bold'
                                      : pts > 0
                                        ? 'text-foreground'
                                        : 'text-red-400/70 font-bold'
                                  }
                                >
                                  {pts === 0 ? 'NP' : pts}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          ))}
                          <td
                            className={`px-3 py-3 text-center font-black font-['Orbitron'] text-xs ${isPromoZone ? 'text-green-400' : ''}`}
                          >
                            {entry.total}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isChampAdmin && (
            <div className={`${cardClass}`} style={{ boxShadow: '0 0 30px hsl(330, 100%, 50%, 0.08)' }}>
              <div className={cardHead}>
                <Flag className="h-4 w-4 text-pink-400" />
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                  Admin — ciclo e resultados
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {phase === 'inscricoes' && (
                    <Button
                      size="sm"
                      onClick={onStartChampionship}
                      className="h-8 text-xs bg-green-500/20 text-green-400 border border-green-500/30"
                    >
                      <Play className="h-3 w-3 mr-1" /> Iniciar campeonato
                    </Button>
                  )}
                  {phase === 'ativo' && canFinalize && (
                    <Button
                      size="sm"
                      onClick={onFinalizeChampionship}
                      className="h-8 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    >
                      <Trophy className="h-3 w-3 mr-1" /> Finalizar campeonato
                    </Button>
                  )}
                </div>

                {phase === 'ativo' && (
                  <>
                    <p className="text-[10px] text-pink-400/60 uppercase font-['Orbitron']">Lançamento de resultados</p>
                    <div className="flex gap-1 flex-wrap">
                      {raceNumbers.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setEditingRace(r)}
                          className={`px-3 py-2 text-[10px] font-bold uppercase font-['Orbitron'] rounded-lg border-2 transition-all ${
                            editingRace === r
                              ? 'border-pink-500 bg-pink-500/20 text-pink-400'
                              : 'border-pink-500/10 bg-black/20 text-muted-foreground'
                          }`}
                        >
                          C{r}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-pink-500/10">
                      <MapPin className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                      <span className="text-[10px] text-pink-400/60 font-bold uppercase whitespace-nowrap">Pista C{editingRace}:</span>
                      <Select
                        value={getTrackForRace(editingRace) || undefined}
                        onValueChange={v => setRaceTrack(editingRace, v)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-black/40 border-pink-500/20 flex-1">
                          <SelectValue placeholder="Selecionar…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {trackOptions.map(track => (
                            <SelectItem key={track} value={track} className="text-xs">
                              {track}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Pontos por posição vêm da aba <strong className="text-pink-400">Pontuação</strong> (1º–10º).
                    </p>
                    {confirmedCount === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem pilotos confirmados.</p>
                    ) : (
                      <div className="space-y-2">
                        {registrations
                          .filter(r => r.registration_status === 'confirmed')
                          .map(reg => {
                            const existing = getResultForReg(reg.id, editingRace);
                            const key = `${reg.id}-${editingRace}`;
                            return (
                              <div
                                key={reg.id}
                                className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 border border-pink-500/10 flex-wrap"
                              >
                                <span className="text-sm font-bold flex-1 min-w-[80px]">{reg.pilot_name}</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Select
                                    value={
                                      existing?.finish_position === 0
                                        ? 'NP'
                                        : existing?.finish_position?.toString() || undefined
                                    }
                                    onValueChange={v => handleSetPosition(reg.id, editingRace, v)}
                                  >
                                    <SelectTrigger className="h-7 w-[5.5rem] text-xs bg-black/40 border-pink-500/20">
                                      <SelectValue placeholder="—" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 20 }, (_, i) => i + 1).map(pos => (
                                        <SelectItem key={pos} value={String(pos)} className="text-xs">
                                          {pos}º — {pointsForPosition(pos)}pts
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="NP" className="text-xs text-red-400">
                                        NP — 0pts
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={manualPoints[key] ?? (existing?.points?.toString() || '')}
                                    onChange={e => setManualPoints(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="h-7 w-16 text-xs bg-black/40 border-pink-500/20 text-center"
                                    placeholder="pts"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-[10px] text-pink-400"
                                    onClick={() => handleManualPointsSave(reg.id, editingRace)}
                                  >
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                    {confirmedCount > 0 && (
                      <div className="flex gap-2 pt-2">
                        {editingRace < raceCount ? (
                          <Button
                            size="sm"
                            className="flex-1 h-9 text-xs bg-green-500/20 text-green-400 border border-green-500/30 font-['Orbitron']"
                            onClick={async () => {
                              const regs = registrations.filter(r => r.registration_status === 'confirmed');
                              const allFilled = regs.every(reg => getResultForReg(reg.id, editingRace));
                              if (!allFilled) {
                                toast({
                                  title: 'Incompleto',
                                  description: `Define todas as posições na corrida ${editingRace}.`,
                                  variant: 'destructive',
                                });
                                return;
                              }
                              const raceResults = regs
                                .map(reg => {
                                  const r = getResultForReg(reg.id, editingRace);
                                  return r
                                    ? { pilot_name: reg.pilot_name, position: r.finish_position, points: r.points }
                                    : null;
                                })
                                .filter((r): r is { pilot_name: string; position: number; points: number } => r !== null)
                                .sort((a, b) => a.position - b.position);
                              try {
                                await notifyRaceResult({
                                  seasonName,
                                  raceNumber: editingRace,
                                  trackName: getTrackForRace(editingRace),
                                  results: raceResults,
                                });
                              } catch (e) {
                                console.error(e);
                              }
                              toast({ title: `Corrida ${editingRace} guardada` });
                              setEditingRace(editingRace + 1);
                            }}
                          >
                            Salvar C{editingRace} → C{editingRace + 1}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1 h-9 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-['Orbitron']"
                            onClick={async () => {
                              const regs = registrations.filter(r => r.registration_status === 'confirmed');
                              const allFilled = regs.every(reg => getResultForReg(reg.id, editingRace));
                              if (!allFilled) {
                                toast({
                                  title: 'Incompleto',
                                  description: `Define todas as posições na corrida ${editingRace}.`,
                                  variant: 'destructive',
                                });
                                return;
                              }
                              const raceResults = regs
                                .map(reg => {
                                  const r = getResultForReg(reg.id, editingRace);
                                  return r
                                    ? { pilot_name: reg.pilot_name, position: r.finish_position, points: r.points }
                                    : null;
                                })
                                .filter((r): r is { pilot_name: string; position: number; points: number } => r !== null)
                                .sort((a, b) => a.position - b.position);
                              try {
                                await notifyRaceResult({
                                  seasonName,
                                  raceNumber: editingRace,
                                  trackName: getTrackForRace(editingRace),
                                  results: raceResults,
                                });
                              } catch (e) {
                                console.error(e);
                              }
                              onFinalizeChampionship();
                            }}
                          >
                            Finalizar campeonato
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {isFinalized && (
                  <p className="text-center text-sm text-yellow-400 font-bold py-2">Campeonato finalizado.</p>
                )}

                <div className="pt-3 border-t border-pink-500/10 space-y-2">
                  <p className="text-[10px] text-red-400/70 uppercase font-['Orbitron']">Zona de perigo</p>
                  {!confirmDelete ? (
                    <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Excluir campeonato
                    </Button>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-red-400 font-bold">Apagar todos os dados?</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { setConfirmDelete(false); onResetChampionship(); }}>
                          Sim, excluir
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmDelete(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-pink-500/10">
                  <p className="text-[10px] text-muted-foreground mb-2 uppercase">Novo campeonato (substitui o atual)</p>
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      value={newSeasonName}
                      onChange={e => setNewSeasonName(e.target.value)}
                      placeholder="Nome"
                      className="h-8 text-xs bg-black/40 border-pink-500/20 flex-1 min-w-[120px]"
                    />
                    <Select value={newRaceCount} onValueChange={setNewRaceCount}>
                      <SelectTrigger className="h-8 text-xs w-16 bg-black/40 border-pink-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <SelectItem key={n} value={String(n)} className="text-xs">
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={onCreateSeason}
                      className="h-8 text-xs bg-pink-500/20 text-pink-400 border border-pink-500/30"
                    >
                      Criar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ——— INSCRIÇÕES ——— */}
        <TabsContent value="inscricoes" className="mt-4">
          <div className={`${cardClass}`}>
            <div className={cardHead}>
              <Users className="h-4 w-4 text-pink-400" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                Pilotos inscritos
              </h3>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {registrations.length} total · {confirmedCount} confirmados · {pendingCount} pendentes
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pink-500/20 text-[10px] uppercase text-pink-400/60 font-['Orbitron']">
                    <th className="px-3 py-2 text-left">Piloto</th>
                    <th className="px-3 py-2 text-left">Carro</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    {isChampAdmin && <th className="px-3 py-2 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isChampAdmin ? 4 : 3}
                        className="px-3 py-8 text-center text-muted-foreground text-xs"
                      >
                        Sem inscrições.
                      </td>
                    </tr>
                  ) : (
                    registrations.map(reg => (
                      <tr key={reg.id} className="border-b border-pink-500/10">
                        <td className="px-3 py-2 font-medium">{reg.pilot_name}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{reg.car}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              reg.registration_status === 'confirmed'
                                ? 'border-green-500/40 text-green-400 bg-green-500/10'
                                : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                            }`}
                          >
                            {reg.registration_status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </span>
                        </td>
                        {isChampAdmin && (
                          <td className="px-3 py-2 text-right space-x-1 whitespace-nowrap">
                            {reg.registration_status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] border-green-500/40 text-green-400"
                                onClick={async () => {
                                  const err = await approveRegistration(reg.id);
                                  if (err) toast({ title: 'Erro', description: err, variant: 'destructive' });
                                  else toast({ title: 'Aprovado', description: reg.pilot_name });
                                }}
                              >
                                <Check className="h-3 w-3 mr-0.5" /> Aprovar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] border-red-500/40 text-red-400"
                              onClick={async () => {
                                const err = await removeRegistration(reg.id);
                                if (err) toast({ title: 'Erro', description: err, variant: 'destructive' });
                                else toast({ title: 'Removido', description: reg.pilot_name });
                              }}
                            >
                              <X className="h-3 w-3 mr-0.5" /> Remover
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ——— PONTUAÇÃO ——— */}
        <TabsContent value="pontuacao" className="mt-4">
          <div className={`${cardClass}`}>
            <div className={cardHead}>
              <Calculator className="h-4 w-4 text-pink-400" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                Pontos por posição (1º–10º)
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Guardado em <code className="text-pink-400/80">championship_seasons.points_config</code> (JSON). NP continua a valer 0
                pts nos resultados.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(pos => (
                  <div key={pos} className="space-y-1">
                    <label className="text-[10px] text-pink-400/70 font-['Orbitron'] uppercase">{pos}º</label>
                    <Input
                      type="number"
                      min={0}
                      value={pointsDraft[pos] ?? '0'}
                      onChange={e => setPointsDraft(d => ({ ...d, [pos]: e.target.value }))}
                      className="h-9 text-xs bg-black/50 border-pink-500/25"
                      disabled={!isChampAdmin}
                    />
                  </div>
                ))}
              </div>
              {isChampAdmin && (
                <Button
                  size="sm"
                  className="h-9 text-xs bg-pink-500/20 text-pink-400 border border-pink-500/35"
                  onClick={handleSavePoints}
                  disabled={savingPoints}
                >
                  {savingPoints ? 'A guardar…' : 'Guardar pontuação'}
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ——— PISTAS ——— */}
        <TabsContent value="pistas" className="mt-4 space-y-4">
          <div className={`${cardClass}`}>
            <div className={cardHead}>
              <Route className="h-4 w-4 text-pink-400" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                Catálogo extra de pistas
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Array JSON em <code className="text-pink-400/80">championship_seasons.pistas</code>. Junta-se à lista global para os selects
                por etapa.
              </p>
              {isChampAdmin && (
                <div className="flex gap-2">
                  <Input
                    value={newPista}
                    onChange={e => setNewPista(e.target.value)}
                    placeholder="Nome da pista"
                    className="h-9 text-xs bg-black/50 border-pink-500/25 flex-1"
                    onKeyDown={e => e.key === 'Enter' && addPista()}
                  />
                  <Button type="button" size="sm" className="h-9 text-xs bg-pink-500/20 text-pink-400 border border-pink-500/30" onClick={addPista}>
                    Adicionar
                  </Button>
                </div>
              )}
              <ul className="flex flex-wrap gap-2">
                {pistasDraft.map(p => (
                  <li
                    key={p}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-pink-500/10 border border-pink-500/25"
                  >
                    {p}
                    {isChampAdmin && (
                      <button
                        type="button"
                        className="text-red-400 hover:text-red-300 p-0.5"
                        aria-label={`Remover ${p}`}
                        onClick={() => setPistasDraft(pistasDraft.filter(x => x !== p))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {isChampAdmin && (
                <Button
                  size="sm"
                  className="h-9 text-xs bg-pink-500/20 text-pink-400 border border-pink-500/35"
                  onClick={handleSavePistas}
                  disabled={savingPistas}
                >
                  {savingPistas ? 'A guardar…' : 'Guardar catálogo'}
                </Button>
              )}
            </div>
          </div>

          <div className={`${cardClass}`}>
            <div className={cardHead}>
              <MapPin className="h-4 w-4 text-pink-400" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                Pista por corrida ({raceCount} etapas)
              </h3>
            </div>
            <div className="p-5">
              <div
                className={`grid gap-3 ${raceCount <= 3 ? 'grid-cols-3' : raceCount <= 5 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5'}`}
              >
                {raceNumbers.map(r => {
                  const track = getTrackForRace(r);
                  return (
                    <div
                      key={r}
                      className={`rounded-lg p-3 text-center border-2 ${
                        track ? 'border-pink-500/30 bg-pink-500/5' : 'border-pink-500/10 bg-black/20'
                      }`}
                    >
                      <p className="text-[9px] font-bold text-pink-400/60 font-['Orbitron'] uppercase mb-2">Corrida {r}</p>
                      {isChampAdmin ? (
                        <Select value={track || undefined} onValueChange={v => setRaceTrack(r, v)}>
                          <SelectTrigger className="h-7 text-[10px] bg-black/40 border-pink-500/20">
                            <SelectValue placeholder="…" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {trackOptions.map(t => (
                              <SelectItem key={t} value={t} className="text-xs">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className={`text-xs font-bold ${track ? 'text-pink-300' : 'text-muted-foreground/30'}`}>{track || '—'}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChampionshipDashboard;
