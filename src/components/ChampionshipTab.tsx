import { useState } from 'react';
import { useChampionshipSeason, positionToPoints, CHAMPIONSHIP_TRACKS, CHAMPIONSHIP_ADMINS } from '@/hooks/useChampionshipSeason';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Flag, Trophy, Settings, UserPlus, Play, Lock, Crown, Trash2, MapPin, AlertTriangle } from 'lucide-react';
import { authenticateUser, type PilotRole } from '@/data/users';
import { notifyRaceResult, notifySeasonCreated, notifyPilotRegistered, notifyChampionshipStarted } from '@/lib/discord';

interface Props {
  isAdmin: boolean;
  loggedNick: string | null;
  pilotRole: PilotRole | null;
  isInList01: boolean;
  isInList02: boolean;
}

const phaseLabels = {
  inscricoes: '📋 INSCRIÇÕES ABERTAS',
  ativo: '🏁 EM ANDAMENTO',
  finalizado: '🏆 FINALIZADO',
};

const ChampionshipTab = ({ isAdmin, loggedNick, pilotRole, isInList01, isInList02 }: Props) => {
  const {
    seasonId, seasonName, phase, raceCount, registrations, leaderboard, loading,
    isFinalized, canFinalize,
    createSeason, startChampionship, finalizeChampionship, resetChampionship,
    registerPilot, setRaceResult, setRaceTrack, getTrackForRace, results,
  } = useChampionshipSeason();

  const [newSeasonName, setNewSeasonName] = useState('');
  const [newRaceCount, setNewRaceCount] = useState('3');
  const [pinInput, setPinInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingRace, setEditingRace] = useState<number>(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [manualPoints, setManualPoints] = useState<Record<string, string>>({});

  const isChampAdmin = loggedNick ? CHAMPIONSHIP_ADMINS.includes(loggedNick.toLowerCase()) : false;
  const isRegistered = registrations.some(r => r.pilot_name.toLowerCase() === loggedNick?.toLowerCase());
  const isBlocked = isInList01 || isInList02;
  const canRegister = loggedNick && !isBlocked && !isRegistered && (phase === 'inscricoes' || isChampAdmin);

  const raceNumbers = Array.from({ length: raceCount }, (_, i) => i + 1);

  const handleRegister = async () => {
    if (!loggedNick || !pinInput.trim()) {
      toast({ title: '⚠️ Erro', description: 'Informe sua senha de piloto para se inscrever.', variant: 'destructive' });
      return;
    }
    if (isBlocked) {
      toast({ title: '🚫 Acesso Negado', description: 'Pilotos da Lista 01 e Lista 02 não podem participar.', variant: 'destructive' });
      return;
    }
    const user = authenticateUser(loggedNick.toLowerCase(), pinInput.trim());
    if (!user) {
      toast({ title: '🚫 Senha Incorreta', description: 'A senha informada não confere com seu cadastro.', variant: 'destructive' });
      return;
    }
    const err = await registerPilot(loggedNick, 'N/A', isChampAdmin);
    if (err) {
      toast({ title: '🚫 Erro', description: err, variant: 'destructive' });
    } else {
      toast({ title: '✅ Inscrito!', description: `${loggedNick} inscrito no campeonato!` });
      setPinInput('');
      try { await notifyPilotRegistered({ seasonName, pilotName: loggedNick, totalPilots: registrations.length + 1 }); } catch {}
    }
  };

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim()) return;
    const count = parseInt(newRaceCount) || 3;
    if (count < 1 || count > 10) {
      toast({ title: '⚠️ Erro', description: 'Quantidade de corridas deve ser entre 1 e 10.', variant: 'destructive' });
      return;
    }
    await createSeason(newSeasonName.trim(), count);
    setNewSeasonName('');
    setNewRaceCount('3');
    toast({ title: '🏁 Campeonato Criado!', description: `${newSeasonName.trim()} — ${count} corrida(s)` });
    try { await notifySeasonCreated({ seasonName: newSeasonName.trim() }); } catch {}
  };

  const handleStartChampionship = async () => {
    if (registrations.length < 2) {
      toast({ title: '⚠️ Erro', description: 'Mínimo de 2 pilotos inscritos para iniciar.', variant: 'destructive' });
      return;
    }
    await startChampionship();
    toast({ title: '🟢 Campeonato Iniciado!', description: 'Inscrições encerradas. Boa corrida!' });
    try { await notifyChampionshipStarted({ seasonName, pilotCount: registrations.length, pilots: registrations.map(r => r.pilot_name) }); } catch {}
  };

  const handleFinalize = async () => {
    await finalizeChampionship();
    toast({ title: '🏆 Campeonato Finalizado!', description: 'Classificação final definida e resultado enviado ao Discord.' });
  };

  const handleDeleteChampionship = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await resetChampionship();
    setConfirmDelete(false);
    toast({ title: '🗑️ Campeonato Excluído', description: 'Todos os dados foram apagados.' });
  };

  const handleSetPosition = async (registrationId: string, race: number, pos: string) => {
    const key = `${registrationId}-${race}`;
    const customPts = manualPoints[key];
    
    if (pos === 'NP') {
      await setRaceResult(registrationId, race, 0, customPts ? parseInt(customPts) : undefined);
      return;
    }
    const p = parseInt(pos);
    if (isNaN(p) || p < 1 || p > 20) return;
    await setRaceResult(registrationId, race, p, customPts ? parseInt(customPts) : undefined);
  };

  const handleManualPointsSave = async (registrationId: string, race: number) => {
    const key = `${registrationId}-${race}`;
    const pts = parseInt(manualPoints[key] || '0');
    if (isNaN(pts) || pts < 0) return;
    const existing = getResultForReg(registrationId, race);
    const pos = existing?.finish_position ?? 0;
    await setRaceResult(registrationId, race, pos, pts);
    toast({ title: '✅ Pontos atualizados', description: `${pts} pontos salvos manualmente.` });
  };

  const getResultForReg = (regId: string, race: number) => {
    return results.find(r => r.registration_id === regId && r.race_number === race);
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Season header */}
      {seasonId ? (
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Flag className="h-5 w-5 text-pink-500" />
            <h2 className="text-xl font-black uppercase tracking-wider font-['Orbitron']"
                style={{ color: 'hsl(330, 100%, 60%)', textShadow: '0 0 20px hsl(330, 100%, 50%), 0 0 40px hsl(330, 100%, 40%)' }}>
              {seasonName}
            </h2>
          </div>
          <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-['Orbitron'] border ${
            phase === 'inscricoes' ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' :
            phase === 'ativo' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
            'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
          }`}>
            {phaseLabels[phase]}
          </div>
          <p className="text-xs text-muted-foreground">
            {registrations.length} piloto(s) inscrito(s) · {raceCount} corrida(s)
          </p>
        </div>
      ) : (
        <div className="text-center space-y-4 py-8">
          <Trophy className="h-12 w-12 mx-auto text-pink-500/30" />
          <h2 className="text-xl font-black uppercase tracking-wider font-['Orbitron']"
              style={{ color: 'hsl(330, 100%, 60%)', textShadow: '0 0 20px hsl(330, 100%, 50%)' }}>
            Nenhum Campeonato Ativo
          </h2>
          <p className="text-sm text-muted-foreground">Aguarde o Admin criar um novo campeonato.</p>
          
          {isChampAdmin && (
            <div className="space-y-3 max-w-sm mx-auto pt-4">
              <Input
                value={newSeasonName}
                onChange={e => setNewSeasonName(e.target.value)}
                placeholder="Nome do campeonato"
                className="h-9 text-xs bg-black/60 border-pink-500/30 focus:border-pink-500"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-pink-400/60 font-['Orbitron'] uppercase whitespace-nowrap">Corridas:</span>
                <Select value={newRaceCount} onValueChange={setNewRaceCount}>
                  <SelectTrigger className="h-9 text-xs bg-black/60 border-pink-500/30 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <SelectItem key={n} value={n.toString()} className="text-xs">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleCreateSeason}
                  className="h-9 text-xs bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/30 font-['Orbitron'] flex-1">
                  Criar
                </Button>
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-pink-500/10 mt-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-['Orbitron']">
              📜 Histórico de campeonatos — em breve
            </p>
          </div>
        </div>
      )}

      {seasonId && (
        <>
          {/* Registration */}
          {(phase === 'inscricoes' || isChampAdmin) && loggedNick && !isFinalized && (
            <div className="rounded-xl border-2 border-pink-500/20 bg-black/40 backdrop-blur p-5 space-y-3"
                 style={{ boxShadow: '0 0 30px hsl(330, 100%, 50%, 0.1), inset 0 0 30px hsl(330, 100%, 50%, 0.05)' }}>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-pink-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400 font-['Orbitron']">
                  Inscrição
                </h3>
              </div>

              {isRegistered && (
                <p className="text-sm text-green-400 font-bold">✅ Você já está inscrito neste campeonato!</p>
              )}

              {isBlocked && !isRegistered && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400 font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    🚫 Pilotos da Lista 01 e Lista 02 não podem participar.
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
                    className="h-9 text-xs bg-black/60 border-pink-500/20 flex-1 focus:border-pink-500"
                    maxLength={10}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  />
                  <Button size="sm" onClick={handleRegister}
                    className="h-9 text-xs bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/30 font-bold">
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

          {/* Track layout - dynamic races */}
          <div className="rounded-xl border-2 border-pink-500/20 bg-black/40 backdrop-blur overflow-hidden"
               style={{ boxShadow: '0 0 30px hsl(330, 100%, 50%, 0.08)' }}>
            <div className="bg-pink-500/5 px-5 py-4 border-b border-pink-500/20 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-pink-400" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                Pistas do Campeonato — {raceCount} Corrida{raceCount > 1 ? 's' : ''}
              </h3>
            </div>
            <div className="p-5">
              <div className={`grid gap-3 ${raceCount <= 3 ? 'grid-cols-3' : raceCount <= 5 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5'}`}>
                {raceNumbers.map(r => {
                  const track = getTrackForRace(r);
                  return (
                    <div key={r} className={`rounded-lg p-3 text-center border-2 transition-all ${
                      track 
                        ? 'border-pink-500/30 bg-pink-500/5 shadow-[0_0_20px_hsl(330_100%_50%_/_0.1)]' 
                        : 'border-pink-500/10 bg-black/20'
                    }`}>
                      <p className="text-[9px] font-bold text-pink-400/60 font-['Orbitron'] uppercase tracking-wider mb-2">
                        Corrida {r}
                      </p>
                      {isChampAdmin ? (
                        <Select
                          value={track || undefined}
                          onValueChange={(v) => setRaceTrack(r, v)}
                        >
                          <SelectTrigger className="h-7 text-[10px] bg-black/40 border-pink-500/20">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {CHAMPIONSHIP_TRACKS.map(t => (
                              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className={`text-xs font-bold ${track ? 'text-pink-300' : 'text-muted-foreground/30'}`}>
                          {track || '—'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Finalized: Winners */}
          {isFinalized && leaderboard.length >= 2 && (
            <div className="rounded-xl border-2 border-green-500/30 bg-black/40 backdrop-blur p-5 space-y-3"
                 style={{ boxShadow: '0 0 30px hsl(120, 100%, 40%, 0.1)' }}>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-green-400 font-['Orbitron']">
                  🏆 Classificados para a Lista 02!
                </h3>
              </div>
              <div className="flex gap-4">
                {leaderboard.slice(0, 2).map((entry, idx) => (
                  <div key={entry.registration_id} className="flex-1 bg-green-500/5 rounded-lg p-4 text-center border border-green-500/20">
                    <p className="text-[10px] text-green-400/60 font-['Orbitron'] uppercase">{idx + 1}º Lugar</p>
                    <p className="text-lg font-black" style={{ color: 'hsl(330, 100%, 60%)', textShadow: '0 0 10px hsl(330, 100%, 50%)' }}>
                      {entry.pilot_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.car}</p>
                    <p className="text-sm font-bold text-green-400">{entry.total}pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="rounded-xl border-2 border-pink-500/20 bg-black/40 backdrop-blur overflow-hidden"
               style={{ boxShadow: '0 0 30px hsl(330, 100%, 50%, 0.08)' }}>
            <div className="bg-pink-500/5 px-5 py-4 border-b border-pink-500/20 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-pink-400" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                Classificação Geral
              </h3>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Nenhum piloto inscrito ainda.</p>
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
                                <span className="text-[7px] text-pink-400/40 font-normal normal-case tracking-normal max-w-[80px] truncate">
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
                        <tr key={entry.registration_id}
                            className={`border-b border-pink-500/10 transition-colors ${
                              isPromoZone
                                ? 'bg-green-500/5 shadow-[inset_0_0_30px_hsl(330_100%_50%_/_0.06)]'
                                : 'hover:bg-pink-500/5'
                            }`}>
                          <td className={`px-3 py-3 font-bold font-['Orbitron'] text-xs ${isPromoZone ? 'text-green-400' : 'text-muted-foreground'}`}>
                            {idx + 1}º
                          </td>
                          <td className={`px-3 py-3 font-bold`}
                              style={isPromoZone ? { color: 'hsl(330, 100%, 60%)', textShadow: '0 0 8px hsl(330, 100%, 50%)' } : {}}>
                            {entry.pilot_name}
                          </td>
                          {entry.racePoints.map((pts, ri) => (
                            <td key={ri} className="px-2 py-3 text-center text-xs">
                              {pts !== null ? (
                                <span className={pts >= 15 ? 'text-pink-400 font-bold' : pts > 0 ? 'text-foreground' : 'text-red-400/70 font-bold'}>
                                  {pts === 0 ? 'NP' : pts}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          ))}
                          <td className={`px-3 py-3 text-center font-black font-['Orbitron'] text-xs ${isPromoZone ? 'text-green-400' : 'text-foreground'}`}>
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

          {/* Admin Panel */}
          {isChampAdmin && (
            <div className="rounded-xl border-2 border-pink-500/20 bg-black/40 backdrop-blur overflow-hidden"
                 style={{ boxShadow: '0 0 30px hsl(330, 100%, 50%, 0.08)' }}>
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className="w-full bg-pink-500/5 px-5 py-4 border-b border-pink-500/20 flex items-center gap-2 hover:bg-pink-500/10 transition-colors"
              >
                <Settings className="h-4 w-4 text-pink-400" />
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 font-['Orbitron']">
                  Painel de Controle
                </h3>
                <span className="ml-auto text-[10px] text-muted-foreground">{showAdmin ? '▲' : '▼'}</span>
              </button>

              {showAdmin && (
                <div className="p-4 space-y-4">
                  {/* Phase controls */}
                  <div className="space-y-3">
                    <p className="text-[10px] text-pink-400/60 uppercase tracking-wider font-['Orbitron']">Controle de Status</p>
                    <div className="flex flex-wrap gap-2">
                      {phase === 'inscricoes' && (
                        <Button size="sm" onClick={handleStartChampionship}
                          className="h-8 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30">
                          <Play className="h-3 w-3 mr-1" /> Iniciar Campeonato
                        </Button>
                      )}
                      {phase === 'ativo' && canFinalize && (
                        <Button size="sm" onClick={handleFinalize}
                          className="h-8 text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30">
                          <Trophy className="h-3 w-3 mr-1" /> Finalizar Campeonato
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <div className="space-y-2 pt-2 border-t border-pink-500/10">
                    <p className="text-[10px] text-red-400/70 uppercase tracking-wider font-['Orbitron']">Zona de Perigo</p>
                    {!confirmDelete ? (
                      <Button size="sm" onClick={() => setConfirmDelete(true)} variant="destructive" className="h-8 text-xs">
                        <Trash2 className="h-3 w-3 mr-1" /> Excluir Campeonato
                      </Button>
                    ) : (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-2">
                        <p className="text-xs text-red-400 font-bold">⚠️ Excluir todos os dados? Irreversível.</p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleDeleteChampionship} variant="destructive" className="h-7 text-xs">
                            <Trash2 className="h-3 w-3 mr-1" /> Sim, Excluir
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} className="h-7 text-xs">Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Race result entry */}
                  {phase === 'ativo' && (
                    <>
                      <div className="pt-2 border-t border-pink-500/10">
                        <p className="text-[10px] text-pink-400/60 uppercase tracking-wider font-['Orbitron'] mb-3">
                          Lançamento de Resultados — {raceCount} Corrida{raceCount > 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Race tabs */}
                      <div className="flex gap-1 flex-wrap">
                        {raceNumbers.map(r => (
                          <button key={r} onClick={() => setEditingRace(r)}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider font-['Orbitron'] rounded-lg border-2 transition-all
                              ${editingRace === r
                                ? 'border-pink-500 bg-pink-500/20 text-pink-400 shadow-[0_0_15px_hsl(330_100%_50%_/_0.2)]'
                                : 'border-pink-500/10 bg-black/20 text-muted-foreground hover:text-pink-300'
                              }`}>
                            C{r}
                          </button>
                        ))}
                      </div>

                      {/* Track selector */}
                      <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-pink-500/10">
                        <MapPin className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                        <span className="text-[10px] text-pink-400/60 font-bold uppercase tracking-wider whitespace-nowrap">
                          Pista C{editingRace}:
                        </span>
                        <Select
                          value={getTrackForRace(editingRace) || undefined}
                          onValueChange={(v) => setRaceTrack(editingRace, v)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-black/40 border-pink-500/20 flex-1">
                            <SelectValue placeholder="Selecionar pista..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {CHAMPIONSHIP_TRACKS.map(track => (
                              <SelectItem key={track} value={track} className="text-xs">{track}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Points reference */}
                      <div className="bg-black/30 rounded-lg p-3 text-[10px] text-muted-foreground border border-pink-500/10">
                        <span className="font-bold text-pink-400">Pontos (padrão):</span>{' '}
                        1º=20 | 2º=17 | 3º=15 | 4º=13 | 5º=11 | 6º=9 | 7º=7 | 8º=5 | 9º=3 | 10º=1 | NP=0
                        <br />
                        <span className="text-pink-400/60">💡 Você pode sobrescrever os pontos manualmente em cada piloto.</span>
                      </div>

                      {/* Position & manual points entry per pilot */}
                      {registrations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum inscrito ainda.</p>
                      ) : (
                        <div className="space-y-2">
                          {registrations.map(reg => {
                            const existing = getResultForReg(reg.id, editingRace);
                            const key = `${reg.id}-${editingRace}`;
                            return (
                              <div key={reg.id} className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2.5 border border-pink-500/10 flex-wrap sm:flex-nowrap">
                                <span className="text-sm font-bold flex-1 text-foreground min-w-[80px]">{reg.pilot_name}</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] text-muted-foreground">Pos:</span>
                                  <Select
                                    value={existing?.finish_position === 0 ? 'NP' : existing?.finish_position?.toString() || undefined}
                                    onValueChange={(v) => handleSetPosition(reg.id, editingRace, v)}
                                  >
                                    <SelectTrigger className="h-7 w-20 text-xs bg-black/40 border-pink-500/20">
                                      <SelectValue placeholder="—" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 20 }, (_, i) => i + 1).map(pos => (
                                        <SelectItem key={pos} value={pos.toString()} className="text-xs">
                                          {pos}º — {positionToPoints(pos)}pts
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="NP" className="text-xs text-red-400">
                                        NP — 0pts
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  {/* Manual points override */}
                                  <span className="text-[10px] text-muted-foreground">Pts:</span>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={manualPoints[key] ?? (existing?.points?.toString() || '')}
                                    onChange={e => setManualPoints(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="h-7 w-16 text-xs bg-black/40 border-pink-500/20 text-center"
                                    placeholder="—"
                                  />
                                  <Button size="sm" variant="ghost" onClick={() => handleManualPointsSave(reg.id, editingRace)}
                                    className="h-7 px-2 text-[10px] text-pink-400 hover:text-pink-300 hover:bg-pink-500/10">
                                    Salvar
                                  </Button>

                                  {existing && (
                                    <span className="text-[10px] text-pink-400 font-bold">{existing.points}pts</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Action buttons */}
                      {registrations.length > 0 && (
                        <div className="flex gap-2 pt-3 border-t border-pink-500/10">
                          {editingRace < raceCount ? (
                            <Button size="sm" onClick={async () => {
                              const allFilled = registrations.every(reg => getResultForReg(reg.id, editingRace));
                              if (!allFilled) {
                                toast({ title: '⚠️ Incompleto', description: `Defina a posição de todos os pilotos na Corrida ${editingRace} antes de avançar.`, variant: 'destructive' });
                                return;
                              }
                              const raceResults = registrations
                                .map(reg => {
                                  const r = getResultForReg(reg.id, editingRace);
                                  return r ? { pilot_name: reg.pilot_name, position: r.finish_position, points: r.points } : null;
                                })
                                .filter((r): r is { pilot_name: string; position: number; points: number } => r !== null)
                                .sort((a, b) => a.position - b.position);
                              try {
                                await notifyRaceResult({ seasonName, raceNumber: editingRace, trackName: getTrackForRace(editingRace), results: raceResults });
                              } catch (e) { console.error('Discord notify failed:', e); }
                              toast({ title: `✅ Corrida ${editingRace} salva!`, description: `Avançando para Corrida ${editingRace + 1}.` });
                              setEditingRace(editingRace + 1);
                            }}
                              className="h-9 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 font-['Orbitron'] flex-1">
                              <Flag className="h-3 w-3 mr-1" /> Salvar C{editingRace} → C{editingRace + 1}
                            </Button>
                          ) : (
                            <Button size="sm" onClick={async () => {
                              const allFilled = registrations.every(reg => getResultForReg(reg.id, editingRace));
                              if (!allFilled) {
                                toast({ title: '⚠️ Incompleto', description: `Defina a posição de todos os pilotos na Corrida ${editingRace} antes de finalizar.`, variant: 'destructive' });
                                return;
                              }
                              const raceResults = registrations
                                .map(reg => {
                                  const r = getResultForReg(reg.id, editingRace);
                                  return r ? { pilot_name: reg.pilot_name, position: r.finish_position, points: r.points } : null;
                                })
                                .filter((r): r is { pilot_name: string; position: number; points: number } => r !== null)
                                .sort((a, b) => a.position - b.position);
                              try {
                                await notifyRaceResult({ seasonName, raceNumber: editingRace, trackName: getTrackForRace(editingRace), results: raceResults });
                              } catch (e) { console.error('Discord notify failed:', e); }
                              handleFinalize();
                            }}
                              className="h-9 text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 font-['Orbitron'] flex-1">
                              <Trophy className="h-3 w-3 mr-1" /> Finalizar Campeonato 🏆
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {isFinalized && (
                    <p className="text-center text-sm text-yellow-400 font-bold py-2">
                      🏆 Campeonato finalizado. Resultado enviado ao Discord.
                    </p>
                  )}

                  {/* Create new */}
                  <div className="pt-3 border-t border-pink-500/10">
                    <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Criar novo (encerra o atual)</p>
                    <div className="flex gap-2 flex-wrap">
                      <Input value={newSeasonName} onChange={e => setNewSeasonName(e.target.value)}
                        placeholder="Nome do novo campeonato"
                        className="h-8 text-xs bg-black/40 border-pink-500/20 flex-1 min-w-[120px]" />
                      <Select value={newRaceCount} onValueChange={setNewRaceCount}>
                        <SelectTrigger className="h-8 text-xs bg-black/40 border-pink-500/20 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <SelectItem key={n} value={n.toString()} className="text-xs">{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleCreateSeason}
                        className="h-8 text-xs bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/30">
                        Criar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChampionshipTab;
