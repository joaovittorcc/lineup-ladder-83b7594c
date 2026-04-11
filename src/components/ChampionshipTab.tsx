import { useState, useMemo } from 'react';
import { useChampionshipSeason, isPilotRoleAllowedForSeason } from '@/hooks/useChampionshipSeason';
import ChampionshipDashboard from '@/components/championship/ChampionshipDashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';
import { authenticateUser, ALL_ROLES, getRoleLabel, type PilotRole } from '@/data/users';
import { Checkbox } from '@/components/ui/checkbox';
import { CHAMPIONSHIP_ADMINS } from '@/hooks/useChampionshipSeason';
import { notifySeasonCreated, notifyPilotRegistered, notifyChampionshipStarted } from '@/lib/discord';

interface Props {
  isAdmin: boolean;
  loggedNick: string | null;
  pilotRole: PilotRole | null;
  isInList01: boolean;
  isInList02: boolean;
}

const ChampionshipTab = ({ isAdmin: _isAdmin, loggedNick, pilotRole, isInList01, isInList02 }: Props) => {
  const {
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
    results,
    getTrackForRace,
    pointsForPosition,
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
  } = useChampionshipSeason();

  const [newSeasonName, setNewSeasonName] = useState('');
  const [newRaceCount, setNewRaceCount] = useState('3');
  const [createAllowedRoles, setCreateAllowedRoles] = useState<PilotRole[]>(() => [...ALL_ROLES]);
  const [pinInput, setPinInput] = useState('');

  const isChampAdmin = loggedNick ? CHAMPIONSHIP_ADMINS.includes(loggedNick.toLowerCase()) : false;
  const isRegistered = registrations.some(r => r.pilot_name.toLowerCase() === loggedNick?.toLowerCase());
  const isPendingRegistration = registrations.some(
    r => r.pilot_name.toLowerCase() === loggedNick?.toLowerCase() && r.registration_status === 'pending'
  );
  const isBlocked = isInList01 || isInList02;
  const roleAllowed = isPilotRoleAllowedForSeason(pilotRole, allowedParticipantRoles, isChampAdmin);
  const roleAdmissionBlocked = Boolean(
    loggedNick &&
      !isChampAdmin &&
      !isRegistered &&
      !isBlocked &&
      phase === 'inscricoes' &&
      !isPilotRoleAllowedForSeason(pilotRole, allowedParticipantRoles, false)
  );
  const canRegister = Boolean(
    loggedNick &&
      !isBlocked &&
      !isRegistered &&
      roleAllowed &&
      (phase === 'inscricoes' || isChampAdmin)
  );

  const confirmedCount = confirmedRegistrations.length;
  const pendingCount = useMemo(
    () => registrations.filter(r => r.registration_status === 'pending').length,
    [registrations]
  );

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
      toast({
        title: isChampAdmin ? '✅ Inscrito!' : '⏳ Pedido enviado',
        description: isChampAdmin
          ? `${loggedNick} inscrito no campeonato.`
          : `${loggedNick} aguarda aprovação do admin.`,
      });
      setPinInput('');
      try {
        await notifyPilotRegistered({ seasonName, pilotName: loggedNick, totalPilots: registrations.length + 1 });
      } catch {
        /* optional */
      }
    }
  };

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim()) return;
    const count = parseInt(newRaceCount, 10) || 3;
    if (count < 1 || count > 10) {
      toast({ title: '⚠️ Erro', description: 'Quantidade de corridas deve ser entre 1 e 10.', variant: 'destructive' });
      return;
    }
    if (createAllowedRoles.length === 0) {
      toast({
        title: 'Escolhe pelo menos um cargo',
        description: 'Indica quem pode inscrever-se neste torneio.',
        variant: 'destructive',
      });
      return;
    }
    const name = newSeasonName.trim();
    const err = await createSeason(name, count, createAllowedRoles);
    if (err) {
      toast({
        title: 'Não foi possível criar o campeonato',
        description: err,
        variant: 'destructive',
      });
      return;
    }
    setNewSeasonName('');
    setNewRaceCount('3');
    toast({ title: '🏁 Campeonato Criado!', description: `${name} — ${count} corrida(s)` });
    try {
      await notifySeasonCreated({ seasonName: name });
    } catch {
      /* optional */
    }
  };

  const handleStartChampionship = async () => {
    if (confirmedCount < 2) {
      toast({
        title: '⚠️ Erro',
        description: 'Mínimo de 2 pilotos com inscrição confirmada para iniciar.',
        variant: 'destructive',
      });
      return;
    }
    await startChampionship();
    toast({ title: '🟢 Campeonato Iniciado!', description: 'Inscrições encerradas. Boa corrida!' });
    try {
      await notifyChampionshipStarted({
        seasonName,
        pilotCount: confirmedCount,
        pilots: confirmedRegistrations.map(r => r.pilot_name),
      });
    } catch {
      /* optional */
    }
  };

  const handleFinalize = async () => {
    await finalizeChampionship();
    toast({ title: '🏆 Campeonato Finalizado!', description: 'Classificação final definida e resultado enviado ao Discord.' });
  };

  const handleDeleteChampionship = async () => {
    await resetChampionship();
    toast({ title: '🗑️ Campeonato Excluído', description: 'Todos os dados foram apagados.' });
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>;
  }

  if (seasonId && activeChampionship) {
    return (
      <ChampionshipDashboard
        activeChampionship={activeChampionship}
        isChampAdmin={isChampAdmin}
        seasonName={seasonName}
        phase={phase}
        raceCount={raceCount}
        registrations={registrations}
        confirmedCount={confirmedCount}
        pendingCount={pendingCount}
        leaderboard={leaderboard}
        isFinalized={isFinalized}
        canFinalize={canFinalize}
        pointsConfig={pointsConfig}
        pistasCatalog={pistasCatalog}
        results={results}
        getTrackForRace={getTrackForRace}
        pointsForPosition={pointsForPosition}
        pinInput={pinInput}
        setPinInput={setPinInput}
        loggedNick={loggedNick}
        isBlocked={isBlocked}
        isRegistered={isRegistered}
        isPendingRegistration={isPendingRegistration}
        canRegister={canRegister}
        onRegister={handleRegister}
        onStartChampionship={handleStartChampionship}
        onFinalizeChampionship={handleFinalize}
        onResetChampionship={handleDeleteChampionship}
        approveRegistration={approveRegistration}
        removeRegistration={removeRegistration}
        savePointsConfig={savePointsConfig}
        savePistasCatalog={savePistasCatalog}
        setRaceTrack={setRaceTrack}
        setRaceResult={setRaceResult}
        allowedParticipantRoles={allowedParticipantRoles}
        roleAdmissionBlocked={roleAdmissionBlocked}
        newSeasonName={newSeasonName}
        setNewSeasonName={setNewSeasonName}
        newRaceCount={newRaceCount}
        setNewRaceCount={setNewRaceCount}
        onCreateSeason={handleCreateSeason}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-4 py-8">
        <Trophy className="h-12 w-12 mx-auto text-pink-500/30" />
        <h2
          className="text-xl font-black uppercase tracking-wider font-['Orbitron']"
          style={{ color: 'hsl(330, 100%, 60%)', textShadow: '0 0 20px hsl(330, 100%, 50%)' }}
        >
          Nenhum Campeonato Ativo
        </h2>
        <p className="text-sm text-muted-foreground">Aguarde o Admin criar um novo campeonato.</p>

        {isChampAdmin && (
          <div className="space-y-3 max-w-md mx-auto pt-4 text-left">
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
                    <SelectItem key={n} value={n.toString()} className="text-xs">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleCreateSeason}
                className="h-9 text-xs bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/30 font-['Orbitron'] flex-1"
              >
                Criar
              </Button>
            </div>
            <div className="rounded-lg border border-pink-500/20 bg-black/40 p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400/80 font-['Orbitron']">
                Cargos que podem inscrever-se
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_ROLES.map(role => (
                  <label key={role} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={createAllowedRoles.includes(role)}
                      onCheckedChange={checked => {
                        setCreateAllowedRoles(prev => {
                          if (checked === true) return prev.includes(role) ? prev : [...prev, role];
                          return prev.filter(r => r !== role);
                        });
                      }}
                    />
                    <span>{getRoleLabel(role)}</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/80">
                Torneio aberto: deixa todos marcados. Exclusivo: só os cargos escolhidos (admins de campeonato podem sempre inscrever-se para gerir).
              </p>
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-pink-500/10 mt-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-['Orbitron']">
            Histórico de campeonatos — em breve
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChampionshipTab;
