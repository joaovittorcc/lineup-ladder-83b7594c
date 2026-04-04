import { useState } from 'react';
import { useChampionshipSeason, positionToPoints } from '@/hooks/useChampionshipSeason';
import { TRACKS_LIST } from '@/data/tracks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Flag, Trophy, AlertTriangle, Settings, UserPlus, Play, RotateCcw, Lock, Crown, Trash2, MapPin } from 'lucide-react';
import type { PilotRole } from '@/data/users';

interface Props {
  isAdmin: boolean;
  loggedNick: string | null;
  pilotRole: PilotRole | null;
  isInList01: boolean;
  isInList02: boolean;
}

const phaseLabels = {
  inscricoes: '📋 INSCRIÇÕES ABERTAS',
  ativo: '🏁 CAMPEONATO EM ANDAMENTO',
  finalizado: '🏆 CAMPEONATO FINALIZADO',
};

const ChampionshipTab = ({ isAdmin, loggedNick, pilotRole, isInList01, isInList02 }: Props) => {
  const {
    seasonId, seasonName, phase, registrations, leaderboard, tieAlert, loading,
    isFinalized, canFinalize,
    createSeason, startChampionship, finalizeChampionship, resetChampionship,
    registerPilot, setRaceResult, setRaceTrack, getTrackForRace, raceTracks, results,
  } = useChampionshipSeason();

  const [newSeasonName, setNewSeasonName] = useState('');
  const [carInput, setCarInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingRace, setEditingRace] = useState<number>(1);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isRegistered = registrations.some(r => r.pilot_name.toLowerCase() === loggedNick?.toLowerCase());
  const canRegister = loggedNick && !isInList01 && !isInList02 && !isRegistered && phase === 'inscricoes';
  const isBlocked = isInList01 || isInList02;

  const handleRegister = async () => {
    if (!loggedNick || !carInput.trim()) {
      toast({ title: '⚠️ Erro', description: 'Informe o carro para se inscrever.', variant: 'destructive' });
      return;
    }
    if (isBlocked) {
      toast({ title: '🚫 Acesso Negado', description: 'Este campeonato é apenas para acesso à Lista 02. Pilotos da Lista 01 e Lista 02 não podem participar.', variant: 'destructive' });
      return;
    }
    const err = await registerPilot(loggedNick, carInput.trim());
    if (err) {
      toast({ title: '🚫 Erro', description: err, variant: 'destructive' });
    } else {
      toast({ title: '✅ Inscrito!', description: `${loggedNick} inscrito com ${carInput.trim()}` });
      setCarInput('');
    }
  };

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim()) return;
    await createSeason(newSeasonName.trim());
    setNewSeasonName('');
    toast({ title: '🏁 Campeonato Criado!', description: newSeasonName.trim() });
  };

  const handleStartChampionship = async () => {
    if (registrations.length < 2) {
      toast({ title: '⚠️ Erro', description: 'Mínimo de 2 pilotos inscritos para iniciar.', variant: 'destructive' });
      return;
    }
    await startChampionship();
    toast({ title: '🟢 Campeonato Iniciado!', description: 'Inscrições encerradas. Boa corrida!' });
  };

  const handleFinalize = async () => {
    await finalizeChampionship();
    toast({ title: '🏆 Campeonato Finalizado!', description: 'Classificação final definida.' });
  };

  const handleDeleteChampionship = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await resetChampionship();
    setConfirmDelete(false);
    toast({ title: '🗑️ Campeonato Excluído', description: 'Todos os dados foram apagados. Pronto para um novo campeonato.' });
  };

  const handleSetPosition = async (registrationId: string, race: number, pos: string) => {
    const p = parseInt(pos);
    if (isNaN(p) || p < 1 || p > 15) return;
    await setRaceResult(registrationId, race, p);
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
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wider neon-text-purple font-['Orbitron']">
              {seasonName}
            </h2>
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-['Orbitron'] border ${
            phase === 'inscricoes' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
            phase === 'ativo' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
            'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
          }`}>
            {phaseLabels[phase]}
          </div>
          <p className="text-xs text-muted-foreground">{registrations.length} piloto(s) inscrito(s)</p>
        </div>
      ) : (
        <div className="text-center space-y-4 py-8">
          <h2 className="text-xl font-black uppercase tracking-wider neon-text-purple font-['Orbitron']">
            Nenhum Campeonato Ativo
          </h2>
          {isAdmin && (
            <div className="flex items-center gap-2 justify-center max-w-sm mx-auto">
              <Input
                value={newSeasonName}
                onChange={e => setNewSeasonName(e.target.value)}
                placeholder="Nome do campeonato"
                className="h-9 text-xs bg-secondary/60 border-border"
              />
              <Button size="sm" onClick={handleCreateSeason} className="h-9 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
                Criar
              </Button>
            </div>
          )}
        </div>
      )}

      {seasonId && (
        <>
          {/* Registration section - only visible during inscricoes */}
          {phase === 'inscricoes' && loggedNick && (
            <div className="card-racing  neon-border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] neon-text-pink font-['Orbitron']">
                  Inscrição
                </h3>
              </div>

              {isRegistered && (
                <p className="text-sm text-green-400 font-bold">✅ Você já está inscrito neste campeonato!</p>
              )}

              {isBlocked && !isRegistered && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <p className="text-sm text-destructive font-bold">
                    🚫 Este campeonato é apenas para acesso à Lista 02. Pilotos da Lista 01 e Lista 02 não podem participar.
                  </p>
                </div>
              )}

              {canRegister && (
                <div className="flex items-center gap-2">
                  <Input
                    value={carInput}
                    onChange={e => setCarInput(e.target.value)}
                    placeholder="Modelo do carro (obrigatório)"
                    className="h-9 text-xs bg-secondary/60 border-border flex-1"
                    maxLength={50}
                  />
                  <Button
                    size="sm"
                    onClick={handleRegister}
                    className="h-9 text-xs bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30"
                  >
                    Inscrever-se
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Phase: inscricoes closed notice */}
          {phase !== 'inscricoes' && !isFinalized && (
            <div className="card-racing  neon-border p-4 flex items-center gap-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Inscrições encerradas. Campeonato em andamento.</p>
            </div>
          )}

          {/* Trajetos da Etapa */}
          <div className="card-racing  neon-border overflow-hidden">
            <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-purple font-['Orbitron']">
                📍 Trajetos da Etapa
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(r => {
                  const track = getTrackForRace(r);
                  return (
                    <div key={r} className={`rounded-lg p-3 text-center border transition-all ${
                      track 
                        ? 'border-primary/30 bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)_/_0.1)]' 
                        : 'border-border bg-secondary/30'
                    }`}>
                      <p className="text-[9px] font-bold text-muted-foreground font-['Orbitron'] uppercase tracking-wider mb-1">
                        Corrida {r}
                      </p>
                      <p className={`text-[10px] font-bold truncate ${track ? 'text-primary' : 'text-muted-foreground/40'}`}>
                        {track || '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tie alert */}
          {tieAlert && (
            <div className="bg-yellow-500/10 border-2 border-yellow-500/50  p-5 flex items-center gap-3 animate-pulse">
              <AlertTriangle className="h-8 w-8 text-yellow-400 shrink-0" />
              <div>
                <p className="text-base font-black text-yellow-400 font-['Orbitron'] uppercase tracking-wider">
                  ⚠️ EMPATE PELA VAGA!
                </p>
                <p className="text-sm font-bold text-yellow-300 mt-1">
                  MD3 OBRIGATÓRIA ENTRE {tieAlert.pilot2} E {tieAlert.pilot3}
                </p>
              </div>
            </div>
          )}

          {/* Finalized: Winners highlight */}
          {isFinalized && leaderboard.length >= 2 && (
            <div className="card-racing  border-2 border-green-500/30 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-green-400 font-['Orbitron']">
                  Zona de Subida — Classificados!
                </h3>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 bg-green-500/10 rounded-lg p-3 text-center border border-green-500/20">
                  <p className="text-[10px] text-green-400/60 font-['Orbitron'] uppercase">1º Lugar</p>
                  <p className="text-lg font-black neon-text-purple">{leaderboard[0].pilot_name}</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[0].car}</p>
                  <p className="text-sm font-bold text-green-400">{leaderboard[0].total}pts</p>
                </div>
                <div className="flex-1 bg-green-500/10 rounded-lg p-3 text-center border border-green-500/20">
                  <p className="text-[10px] text-green-400/60 font-['Orbitron'] uppercase">2º Lugar</p>
                  <p className="text-lg font-black neon-text-purple">{leaderboard[1].pilot_name}</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[1].car}</p>
                  <p className="text-sm font-bold text-green-400">{leaderboard[1].total}pts</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="card-racing  neon-border overflow-hidden">
            <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
                Classificação Geral
              </h3>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Nenhum piloto inscrito ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-['Orbitron']">
                      <th className="px-3 py-2 text-left">Pos</th>
                      <th className="px-3 py-2 text-left">Piloto</th>
                      <th className="px-3 py-2 text-left">Carro</th>
                      {[1, 2, 3, 4, 5].map(r => {
                        const track = getTrackForRace(r);
                        return (
                          <th key={r} className="px-2 py-2 text-center" title={track || `Corrida ${r}`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <span>C{r}</span>
                              {track && (
                                <span className="text-[7px] text-primary/60 font-normal normal-case tracking-normal max-w-[60px] truncate">
                                  {track}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                      <th className="px-3 py-2 text-center font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => {
                      const isPromoZone = idx <= 1;
                      return (
                        <tr
                          key={entry.registration_id}
                          className={`border-b border-border/50 transition-colors ${
                            isPromoZone
                              ? 'bg-green-500/5 shadow-[inset_0_0_30px_hsl(280_100%_50%_/_0.06),inset_0_0_20px_hsl(120_100%_50%_/_0.05)]'
                              : 'hover:bg-secondary/30'
                          }`}
                        >
                          <td className={`px-3 py-2.5 font-bold font-['Orbitron'] text-xs ${isPromoZone ? 'text-green-400' : 'text-muted-foreground'}`}>
                            {idx + 1}º
                          </td>
                          <td className={`px-3 py-2.5 font-bold ${isPromoZone ? 'neon-text-purple' : ''}`}>
                            {entry.pilot_name}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground text-xs">{entry.car}</td>
                          {entry.racePoints.map((pts, ri) => (
                            <td key={ri} className="px-2 py-2.5 text-center text-xs">
                              {pts !== null ? (
                                <span className={pts >= 15 ? 'text-accent font-bold' : pts > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                                  {pts}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          ))}
                          <td className={`px-3 py-2.5 text-center font-black font-['Orbitron'] text-xs ${isPromoZone ? 'text-green-400' : 'text-foreground'}`}>
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
          {isAdmin && (
            <div className="card-racing  neon-border overflow-hidden">
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className="w-full bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2 hover:bg-secondary transition-colors"
              >
                <Settings className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
                  Painel de Controle
                </h3>
                <span className="ml-auto text-[10px] text-muted-foreground">{showAdmin ? '▲' : '▼'}</span>
              </button>

              {showAdmin && (
                <div className="p-4 space-y-4">
                  {/* Phase controls */}
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-['Orbitron']">Controle de Status</p>
                    <div className="flex flex-wrap gap-2">
                      {phase === 'inscricoes' && (
                        <Button
                          size="sm"
                          onClick={handleStartChampionship}
                          className="h-8 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Iniciar Campeonato
                        </Button>
                      )}
                      {phase === 'ativo' && canFinalize && (
                        <Button
                          size="sm"
                          onClick={handleFinalize}
                          className="h-8 text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30"
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          Finalizar Campeonato
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Delete championship */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-[10px] text-destructive/70 uppercase tracking-wider font-['Orbitron']">Zona de Perigo</p>
                    {!confirmDelete ? (
                      <Button
                        size="sm"
                        onClick={() => setConfirmDelete(true)}
                        variant="destructive"
                        className="h-8 text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir Campeonato Atual
                      </Button>
                    ) : (
                      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
                        <p className="text-xs text-destructive font-bold">
                          ⚠️ Tem certeza que deseja apagar todos os dados deste campeonato? Essa ação é irreversível.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleDeleteChampionship}
                            variant="destructive"
                            className="h-7 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Sim, Excluir Tudo
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDelete(false)}
                            className="h-7 text-xs"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Race result entry - only during ativo phase */}
                  {phase === 'ativo' && (
                    <>
                      <div className="pt-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-['Orbitron'] mb-2">Lançamento de Resultados</p>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(r => (
                          <button
                            key={r}
                            onClick={() => setEditingRace(r)}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider font-['Orbitron'] rounded-lg border transition-all
                              ${editingRace === r
                                ? 'border-primary bg-primary/20 text-primary'
                                : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                              }`}
                          >
                            Corrida {r}
                          </button>
                        ))}
                      </div>

                      {/* Track selector for current race */}
                      <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-3">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider whitespace-nowrap">
                          Pista C{editingRace}:
                        </span>
                        <Select
                          value={getTrackForRace(editingRace) || undefined}
                          onValueChange={(v) => setRaceTrack(editingRace, v)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-secondary/60 border-border flex-1">
                            <SelectValue placeholder="Selecionar pista..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {TRACKS_LIST.map(track => (
                              <SelectItem key={track} value={track} className="text-xs">
                                {track}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Conversion guide */}
                      <div className="bg-secondary/30 rounded-lg p-3 text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">Pontos F1:</span>{' '}
                        1º=25 | 2º=18 | 3º=15 | 4º=12 | 5º=10 | 6º=8 | 7º=6 | 8º=4 | 9º=2 | 10º=1 | 11º+=0
                      </div>

                      {registrations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum inscrito ainda.</p>
                      ) : (
                        <div className="space-y-2">
                          {registrations.map(reg => {
                            const existing = getResultForReg(reg.id, editingRace);
                            return (
                              <div key={reg.id} className="flex items-center gap-3 bg-secondary/30 rounded-lg px-3 py-2">
                                <span className="text-sm font-bold flex-1">{reg.pilot_name}</span>
                                <span className="text-xs text-muted-foreground">{reg.car}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">Posição:</span>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={15}
                                    defaultValue={existing?.finish_position ?? ''}
                                    className="h-7 w-16 text-xs text-center bg-secondary/60 border-border"
                                    onBlur={e => handleSetPosition(reg.id, editingRace, e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        handleSetPosition(reg.id, editingRace, (e.target as HTMLInputElement).value);
                                      }
                                    }}
                                  />
                                  {existing && (
                                    <span className="text-[10px] text-accent font-bold">{existing.points}pts</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {isFinalized && (
                    <p className="text-center text-sm text-yellow-400 font-bold py-2">
                      🏆 Campeonato finalizado. Crie um novo ou exclua para começar novamente.
                    </p>
                  )}

                  {/* Create new season */}
                  <div className="pt-3 border-t border-border">
                    <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Criar novo campeonato (encerra o atual)</p>
                    <div className="flex gap-2">
                      <Input
                        value={newSeasonName}
                        onChange={e => setNewSeasonName(e.target.value)}
                        placeholder="Nome do novo campeonato"
                        className="h-8 text-xs bg-secondary/60 border-border flex-1"
                      />
                      <Button size="sm" onClick={handleCreateSeason} className="h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
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
