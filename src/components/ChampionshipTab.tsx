import { useState } from 'react';
import { useChampionshipSeason, positionToPoints } from '@/hooks/useChampionshipSeason';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Flag, Trophy, AlertTriangle, Settings, UserPlus } from 'lucide-react';
import type { PilotRole } from '@/data/users';

interface Props {
  isAdmin: boolean;
  loggedNick: string | null;
  pilotRole: PilotRole | null;
  isInList01: boolean;
  isInList02: boolean;
}

const ChampionshipTab = ({ isAdmin, loggedNick, pilotRole, isInList01, isInList02 }: Props) => {
  const {
    seasonId, seasonName, registrations, leaderboard, tieAlert, loading,
    createSeason, registerPilot, setRaceResult, results,
  } = useChampionshipSeason();

  const [newSeasonName, setNewSeasonName] = useState('');
  const [carInput, setCarInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingRace, setEditingRace] = useState<number>(1);

  const isRegistered = registrations.some(r => r.pilot_name.toLowerCase() === loggedNick?.toLowerCase());
  const canRegister = loggedNick && !isInList01 && !isInList02 && !isRegistered;
  const isBlocked = isInList01 || isInList02;

  const handleRegister = async () => {
    if (!loggedNick || !carInput.trim()) {
      toast({ title: '⚠️ Erro', description: 'Informe o carro para se inscrever.', variant: 'destructive' });
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

  const handleSetPosition = async (registrationId: string, race: number, pos: string) => {
    const p = parseInt(pos);
    if (isNaN(p) || p < 1) return;
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
          {/* Registration section */}
          {loggedNick && (
            <div className="card-racing rounded-xl neon-border p-5 space-y-3">
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
                <p className="text-sm text-destructive font-bold">
                  🚫 Acesso negado. Este campeonato é exclusivo para pilotos que buscam acesso à Lista 02.
                </p>
              )}

              {canRegister && (
                <div className="flex items-center gap-2">
                  <Input
                    value={carInput}
                    onChange={e => setCarInput(e.target.value)}
                    placeholder="Seu carro (obrigatório)"
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

              {!loggedNick && (
                <p className="text-sm text-muted-foreground">Faça login para se inscrever.</p>
              )}
            </div>
          )}

          {/* Tie alert */}
          {tieAlert && (
            <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 flex items-center gap-3 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
              <p className="text-sm font-bold text-yellow-400">
                ⚠️ EMPATE PELA VAGA! MD3 OBRIGATÓRIA ENTRE {tieAlert.pilot2} E {tieAlert.pilot3}
              </p>
            </div>
          )}

          {/* Leaderboard */}
          <div className="card-racing rounded-xl neon-border overflow-hidden">
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
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Piloto</th>
                      <th className="px-3 py-2 text-left">Carro</th>
                      {[1, 2, 3, 4, 5].map(r => (
                        <th key={r} className="px-2 py-2 text-center">E{r}</th>
                      ))}
                      <th className="px-3 py-2 text-center font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => {
                      const isPromoZone = idx <= 1; // 1st and 2nd
                      return (
                        <tr
                          key={entry.registration_id}
                          className={`border-b border-border/50 transition-colors ${
                            isPromoZone
                              ? 'bg-green-500/5 shadow-[inset_0_0_20px_hsl(120_100%_50%_/_0.05)]'
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
            <div className="card-racing rounded-xl neon-border overflow-hidden">
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className="w-full bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2 hover:bg-secondary transition-colors"
              >
                <Settings className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
                  Gerenciar Etapas
                </h3>
                <span className="ml-auto text-[10px] text-muted-foreground">{showAdmin ? '▲' : '▼'}</span>
              </button>

              {showAdmin && (
                <div className="p-4 space-y-4">
                  {/* Race selector */}
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
                        Etapa {r}
                      </button>
                    ))}
                  </div>

                  {/* Results table */}
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
