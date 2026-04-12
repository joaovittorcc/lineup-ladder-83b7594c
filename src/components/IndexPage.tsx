import { useState, useMemo, useCallback } from 'react';
import PlayerList from '@/components/PlayerList';
import ParallaxBackground from '@/components/ParallaxBackground';
import AdminPanel from '@/components/AdminPanel';
import AddPilotSlotModal, { type PilotSlotTarget } from '@/components/AddPilotSlotModal';
import EloRankingTable from '@/components/EloRankingTable';
import FriendlyPanel from '@/components/FriendlyPanel';
import ManagePilotModal from '@/components/ManagePilotModal';
import PilotsTab from '@/components/PilotsTab';
import { useChampionship, getList02LastPlaceIndex } from '@/hooks/useChampionship';
import { useFriendly } from '@/hooks/useFriendly';
import { toast } from '@/hooks/use-toast';
import { LogIn, Crown, ListOrdered, Home, Trophy, Flag, Flame, ScrollText, Users, Swords, ArrowUpDown, AlertCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authenticateUser, authorizedUsers, getUserByName, type AuthUser, type PilotRole } from '@/data/users';
import RoleBadge from '@/components/RoleBadge';
import RaceConfigModal from '@/components/RaceConfigModal';
import ChampionshipTab from '@/components/ChampionshipTab';
import HistoryTab from '@/components/HistoryTab';
import { insertGlobalLog } from '@/hooks/useGlobalLogs';
import {
  setStreetRunnerList02UnlockAt,
  clearStreetRunnerList02UnlockAt,
  clearJokerInitiationCooldownUntil,
} from '@/lib/ladderPilotMeta';
import { FRIENDLY_BASE_ELO } from '@/lib/friendlyLogic';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type TabId = 'inicio' | 'lista' | 'amistosos' | 'campeonato' | 'ranking' | 'historico' | 'pilotos';

const Index = () => {
  const {
    lists,
    challenges,
    activeChallenges,
    pendingInitiationChallenges,
    pendingLadderChallenges,
    acceptLadderChallenge,
    rejectLadderChallenge,
    tryChallenge,
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
    movePlayerToList,
    autoPromoteTopFromList02,
    tryCrossListChallenge,
    tryStreetRunnerChallenge,
    saveListLayout,
    manualAddPlayer,
    adminUpdatePlayerById,
    adminClearJokerProgressByNameKey,
    adminRemovePlayerFromList,
    championshipLoaded,
    championshipFetchError,
  } = useChampionship();

  const {
    matches: friendlyMatches,
    pendingChallenges,
    getPlayerElo,
    createFriendlyChallenge,
    acceptFriendlyChallenge,
    declineFriendlyChallenge,
    cancelFriendlyChallenge,
    resolveFriendly,
    getEloRanking,
    setManualElo,
    friendlyFetchError,
  } = useFriendly();

  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  
  const [loginUser, setLoginUser] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loggedNick, setLoggedNick] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('mc-pilot-nick');
  });
  const [loggedAuth, setLoggedAuth] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('mc-pilot-auth');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  });
  const [managePilotName, setManagePilotName] = useState<string | null>(null);
  const [crossListModalOpen, setCrossListModalOpen] = useState(false);
  const [streetRunnerModalOpen, setStreetRunnerModalOpen] = useState(false);
  const [pilotSlotTarget, setPilotSlotTarget] = useState<PilotSlotTarget | null>(null);
  const [addPilotModalOpen, setAddPilotModalOpen] = useState(false);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, PilotRole>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('mc-role-overrides');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const isRegistered = loggedNick ? isPlayerInLists(loggedNick) : false;
  const isExternal = loggedNick ? !isRegistered : false;
  const isAdmin = loggedAuth?.isAdmin ?? false;
  const isJoker = loggedAuth?.isJoker ?? false;
  const isStreetRunner = loggedAuth?.role === 'street-runner';
  const jokerDefeatedIds = loggedNick ? getJokerProgress(loggedNick) : [];

  // Diretório (aba Pilotos) + nomes só nas listas; dedupe case-insensitive, prioriza displayName do diretório
  const allPlayerNames = useMemo(() => {
    const byLower = new Map<string, string>();
    for (const u of authorizedUsers) {
      byLower.set(u.displayName.toLowerCase(), u.displayName);
    }
    const listPlayerNames = lists
      .filter(l => l.id !== 'initiation')
      .flatMap(l => l.players.map(p => p.name));
    for (const n of listPlayerNames) {
      const low = n.toLowerCase();
      if (!byLower.has(low)) byLower.set(low, n);
    }
    return [...byLower.values()];
  }, [lists]);

  const eloRankings = getEloRanking(allPlayerNames);

  const handleLogin = () => {
    if (!loginUser.trim() || !loginPin.trim()) return;
    const user = authenticateUser(loginUser, loginPin);
    if (!user) {
      toast({ title: '🚫 Acesso Negado', description: 'Usuário ou Senha incorretos.', variant: 'destructive' });
      return;
    }
    const displayName = user.displayName;
    setLoggedNick(displayName);
    setLoggedAuth(user);
    localStorage.setItem('mc-pilot-nick', displayName);
    localStorage.setItem('mc-pilot-auth', JSON.stringify(user));
    setLoginUser('');
    setLoginPin('');
    toast({ title: '🏎️ Acesso Liberado!', description: `Bem-vindo, ${displayName}!` });
  };

  const handleLogout = () => {
    setLoggedNick(null);
    setLoggedAuth(null);
    setLoginUser('');
    setLoginPin('');
    localStorage.removeItem('mc-pilot-nick');
    localStorage.removeItem('mc-pilot-auth');
  };

  const handleChallenge = (listId: string) => (challengerIdx: number, challengedIdx: number, tracks?: [string, string, string]) => {
    const list = lists.find(l => l.id === listId);
    const err = tryChallenge(listId, challengerIdx, challengedIdx, isAdmin, tracks);
    if (err) {
      toast({ title: '🚫 Desafio Bloqueado', description: err, variant: 'destructive' });
    } else {
      toast({
        title: isAdmin ? '⚔ Desafio Iniciado!' : '⚔ Desafio enviado',
        description: isAdmin
          ? 'A corrida MD3 vai começar!'
          : 'O desafiado tem 24h para aceitar. Se não aceitar, vitória por W.O.',
      });
      if (list) {
        const challenger = list.players[challengerIdx];
        const challenged = list.players[challengedIdx];
        insertGlobalLog({
          type: 'CHALLENGE',
          description: `${challenger.name} desafiou ${challenged.name} pela posição #${challengedIdx + 1} da ${list.title}!`,
          player_one: challenger.name,
          player_two: challenged.name,
          category: listId,
        });
      }
    }
    return err;
  };

  const handleChallengeInitiation = (playerId: string) => {
    if (!loggedNick) return;
    const initList = lists.find(l => l.id === 'initiation');
    const target = initList?.players.find(p => p.id === playerId);
    const err = challengeInitiationPlayer(loggedNick, playerId);
    if (err) {
      toast({ title: '🚫 Desafio bloqueado', description: err, variant: 'destructive' });
      return;
    }
    toast({ title: '📩 Desafio Enviado!', description: 'Aguardando aprovação do Admin.' });
    if (target) {
      insertGlobalLog({
        type: 'INITIATION',
        description: `${loggedNick} desafiou ${target.name} na Lista de Iniciação!`,
        player_one: loggedNick,
        player_two: target.name,
        category: 'initiation',
      });
    }
  };

  const handleClearCooldowns = () => {
    clearAllCooldowns();
    toast({ title: '🛡️ Cooldowns Limpos', description: 'Todos os pilotos estão disponíveis!' });
  };

  const handleCreateFriendly = async (challengerName: string, challengedName: string) => {
    const err = await createFriendlyChallenge(challengerName, challengedName);
    if (err) {
      toast({ title: 'Não foi possível criar o desafio', description: err, variant: 'destructive' });
      return;
    }
    toast({
      title: '🔥 Desafio enviado',
      description: 'À espera que o oponente aceite. Quando aceitar, a pista é sorteada automaticamente.',
    });
  };

  const handleAcceptFriendly = async (pendingId: string) => {
    if (!loggedNick) return;
    const res = await acceptFriendlyChallenge(pendingId, loggedNick);
    if (res.error) {
      toast({ title: 'Não foi possível aceitar', description: res.error, variant: 'destructive' });
      return;
    }
    toast({
      title: '✅ Amistoso aceite',
      description: res.trackName
        ? `Pista sorteada: ${res.trackName}`
        : 'A corrida pode começar! A pista foi sorteada.',
    });
  };

  const handleDeclineFriendly = async (pendingId: string) => {
    if (!loggedNick) return;
    const err = await declineFriendlyChallenge(pendingId, loggedNick);
    if (err) {
      toast({ title: 'Não foi possível recusar', description: err, variant: 'destructive' });
      return;
    }
    toast({ title: 'Desafio recusado', variant: 'destructive' });
  };

  const handleCancelFriendly = async (pendingId: string) => {
    if (!loggedNick) return;
    const err = await cancelFriendlyChallenge(pendingId, loggedNick);
    if (err) {
      toast({ title: 'Não foi possível cancelar', description: err, variant: 'destructive' });
      return;
    }
    toast({ title: 'Pedido cancelado', description: 'O desafio amistoso foi anulado.' });
  };

  const handleResolveFriendly = async (winnerName: string, pendingId: string) => {
    const row = pendingChallenges.find(p => p.id === pendingId);
    const loser = row
      ? winnerName === row.challengerName
        ? row.challengedName
        : row.challengerName
      : '';
    const err = await resolveFriendly(winnerName, pendingId);
    if (err) {
      toast({ title: 'Erro ao finalizar', description: err, variant: 'destructive' });
      return;
    }
    const trackBit = row?.trackName ? ` Pista: ${row.trackName}.` : '';
    toast({
      title: '🏆 Amistoso finalizado!',
      description: `${winnerName} venceu! ELO atualizado.${trackBit}`,
    });
    insertGlobalLog({
      type: 'FRIENDLY',
      description: `${winnerName} venceu um amistoso contra ${loser} (ELO).${trackBit}`,
      player_one: row?.challengerName,
      player_two: row?.challengedName,
      winner: winnerName,
      category: 'friendly',
    });
  };

  const handleChangeRole = (name: string, newRole: PilotRole) => {
    const updated = { ...roleOverrides, [name.toLowerCase()]: newRole };
    setRoleOverrides(updated);
    localStorage.setItem('mc-role-overrides', JSON.stringify(updated));
    if (newRole === 'street-runner') {
      setStreetRunnerList02UnlockAt(name, Date.now() + 3 * 24 * 60 * 60 * 1000);
    }
    toast({ title: '✅ Cargo Alterado', description: `${name} agora é ${newRole}` });
    insertGlobalLog({
      type: 'PROMOTION',
      description: `Admin ${loggedNick} promoveu ${name} para ${newRole}.`,
      player_one: name,
      category: 'promotion',
    });
  };

  const handleEditElo = (name: string, newElo: number) => {
    setManualElo(name, newElo);
    toast({ title: '✅ ELO Atualizado', description: `${name}: ${newElo} pontos` });
  };

  const handleResetPilotCooldown = (name: string) => {
    const allPlayers = lists.flatMap(l => l.players);
    const player = allPlayers.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (player) {
      setPlayerStatus(player.id, 'available');
      void adminUpdatePlayerById(player.id, {
        list02_external_block_until: null,
        list02_external_eligible_after: null,
        defenses_while_seventh_streak: 0,
      });
      toast({ title: '🛡️ Cooldown Resetado', description: `${name} está disponível!` });
    }
  };

  const handleResetPilotProfile = async (name: string) => {
    const lower = name.trim().toLowerCase();
    const nextOverrides = { ...roleOverrides };
    delete nextOverrides[lower];
    setRoleOverrides(nextOverrides);
    localStorage.setItem('mc-role-overrides', JSON.stringify(nextOverrides));
    clearStreetRunnerList02UnlockAt(name);
    clearJokerInitiationCooldownUntil(name);
    await setManualElo(name, FRIENDLY_BASE_ELO);
    await adminClearJokerProgressByNameKey(name);
    const player = lists.flatMap(l => l.players).find(p => p.name.toLowerCase() === lower);
    if (player) {
      await adminUpdatePlayerById(player.id, {
        status: 'available',
        defense_count: 0,
        cooldown_until: null,
        challenge_cooldown_until: null,
        defenses_while_seventh_streak: 0,
        list02_external_block_until: null,
        list02_external_eligible_after: null,
        initiation_complete: false,
      });
    }
    toast({
      title: 'Perfil reposto',
      description: `${name}: ELO base, overrides, meta local, joker BD e campos de lista normalizados.`,
    });
    insertGlobalLog({
      type: 'PROMOTION',
      description: `Admin ${loggedNick ?? '?'} repôs o perfil de ${name}.`,
      player_one: name,
      category: 'admin',
    });
  };

  const handleRemovePilotFromList = async (playerId: string, displayName: string) => {
    const err = await adminRemovePlayerFromList(playerId);
    if (err) {
      toast({ title: 'Não foi possível remover', description: err, variant: 'destructive' });
      return err;
    }
    toast({ title: 'Piloto removido', description: 'A vaga foi libertada na base de dados.' });
    insertGlobalLog({
      type: 'PROMOTION',
      description: `Admin ${loggedNick ?? '?'} removeu ${displayName} da lista.`,
      category: 'admin',
    });
    return null;
  };

  const getPilotRole = (name: string): PilotRole => {
    const override = roleOverrides[name.toLowerCase()];
    if (override) return override;
    const user = getUserByName(name);
    return user?.role ?? 'night-driver';
  };

  const managedPilotUser = managePilotName ? getUserByName(managePilotName) : undefined;

  const managedLadderPlayer = useMemo(() => {
    if (!managePilotName) return null;
    for (const l of lists) {
      const p = l.players.find(x => x.name.toLowerCase() === managePilotName.toLowerCase());
      if (p) return { ...p, listTitle: l.title, listId: l.id };
    }
    return null;
  }, [lists, managePilotName]);

  const initiationList = lists.find(l => l.id === 'initiation');
  const list01 = lists.find(l => l.id === 'list-01');
  const list02 = lists.find(l => l.id === 'list-02');
  const listsReady = Boolean(list01 && list02);

  const handleEmptySlotClick = useCallback(
    (listId: string, listTitle: string, currentLength: number, clickedSlotIndex: number) => {
      if (clickedSlotIndex !== currentLength) {
        toast({
          title: 'Ordem das vagas',
          description: 'Preenche primeiro a vaga logo abaixo dos pilotos já colocados.',
          variant: 'destructive',
        });
        return;
      }
      setPilotSlotTarget({ listId, listTitle, insertIndex: currentLength });
      setAddPilotModalOpen(true);
    },
    []
  );

  const handleAllocatePilot = useCallback(
    async (
      displayName: string,
      listId: string,
      insertIndex: number,
      initiationComplete: boolean
    ): Promise<string | null> => {
      const err = await manualAddPlayer(displayName, listId, insertIndex, initiationComplete);
      const listTitle = lists.find(l => l.id === listId)?.title ?? listId;
      if (err) {
        toast({ title: 'Não foi possível alocar', description: err, variant: 'destructive' });
        return err;
      }
      toast({
        title: 'Piloto alocado',
        description: `${displayName} → «${listTitle}» (${insertIndex + 1}º).`,
      });
      insertGlobalLog({
        type: 'PROMOTION',
        description: `Alocação: ${displayName} → ${listTitle} (${insertIndex + 1}º).`,
        player_one: displayName,
        category: listId,
      });
      return null;
    },
    [lists, manualAddPlayer]
  );

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'INÍCIO', icon: <Home className="h-4 w-4" /> },
    { id: 'lista', label: 'LISTA', icon: <ListOrdered className="h-4 w-4" /> },
    { id: 'amistosos', label: 'AMISTOSOS', icon: <Flame className="h-4 w-4" /> },
    { id: 'pilotos', label: 'PILOTOS', icon: <Users className="h-4 w-4" /> },
    { id: 'campeonato', label: 'CAMPEONATO', icon: <Flag className="h-4 w-4" /> },
    { id: 'ranking', label: 'RANKING', icon: <Trophy className="h-4 w-4" /> },
    { id: 'historico', label: 'HISTÓRICO', icon: <ScrollText className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground scanlines grain-overlay spotlight-bg relative">
      <ParallaxBackground />
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 relative">
        <div className="neon-line" />
        <div className="max-w-6xl mx-auto px-4">
          {/* Top row: logo + login */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-wider uppercase neon-text-purple font-['Orbitron'] leading-tight">
                    Midnight Club
                  </h1>
                  <span className="kanji-accent text-lg text-primary/50 leading-tight">夜中</span>
                </div>
                <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground font-bold">
                  Campeonato Interno
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {loggedNick ? (
                <div className="flex items-center gap-2">
                  {isAdmin && <Crown className="h-4 w-4 text-yellow-400" />}
                  <span className="text-xs font-bold text-accent tracking-wider uppercase">
                    {loggedNick}
                  </span>
                  {loggedAuth && <RoleBadge playerName={loggedNick!} role={getPilotRole(loggedNick!)} size="md" />}
                  <Button size="sm" variant="ghost" className="text-[10px] text-muted-foreground h-7" onClick={handleLogout}>
                    Sair
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={loginUser}
                    onChange={e => setLoginUser(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="Usuário"
                    className="h-8 w-28 text-xs bg-secondary/60 border-border"
                  />
                  <Input
                    type="password"
                    value={loginPin}
                    onChange={e => setLoginPin(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="Senha"
                    maxLength={4}
                    className="h-8 w-20 text-xs bg-secondary/60 border-border"
                  />
                  <Button size="sm" className="h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 hover-scale neon-border transition-all duration-300" onClick={handleLogin}>
                    <LogIn className="h-3 w-3 mr-1" /> Entrar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] font-['Orbitron'] border-b-2 transition-all whitespace-nowrap hover-glitch
                  ${activeTab === tab.id
                    ? 'border-primary text-primary neon-text-purple'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Tab content */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* INÍCIO */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="text-center space-y-3 pt-6 relative kanji-watermark">
              
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-3xl md:text-4xl font-black tracking-wider uppercase neon-text-purple font-['Orbitron'] animate-fade-in-up animate-fill-both stagger-1">
                  Midnight Club
                </h2>
                <span className="kanji-accent text-3xl md:text-4xl neon-text-purple animate-fade-in-up animate-fill-both stagger-2">夜中</span>
              </div>
              <p className="text-lg font-bold uppercase tracking-[0.2em] text-accent font-['Orbitron'] animate-fade-in-up animate-fill-both stagger-2">
                Campeonato Interno
              </p>
              <div className="neon-line max-w-xs mx-auto animate-fade-in animate-fill-both stagger-3" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto animate-fade-in-up animate-fill-both stagger-3">
              <Button
                className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 font-['Orbitron'] hover-lift neon-border transition-all duration-300"
                onClick={() => setActiveTab('lista')}
              >
                <ListOrdered className="h-4 w-4 mr-2" />
                Ver Listas
              </Button>
              <Button
                className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 font-['Orbitron'] hover-lift transition-all duration-300"
                onClick={() => setActiveTab('amistosos')}
              >
                <Flame className="h-4 w-4 mr-2" />
                Amistosos
              </Button>
              <Button
                className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 font-['Orbitron'] hover-lift neon-border-pink transition-all duration-300"
                onClick={() => setActiveTab('ranking')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Ver Ranking
              </Button>
            </div>

            {/* Rules Cards */}
            <div className="max-w-2xl mx-auto space-y-5 pb-8 animate-fade-in-up animate-fill-both stagger-4">
              <h3 className="text-center text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground font-['Orbitron']">
                ════ Regras & Progressão ════
              </h3>

              <div className="card-racing neon-border p-5 space-y-3 animate-fade-in-up animate-fill-both stagger-1">
                <h4 className="text-sm font-bold uppercase tracking-[0.15em] neon-text-pink font-['Orbitron']">
                  🃏 Lista de Iniciação — JOKER
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary">▸</span> Deve fazer, obrigatoriamente, a <strong className="text-foreground">Lista de Iniciação</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> A Lista é composta por <strong className="text-foreground">05 pilotos</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Deve desafiar e <strong className="text-foreground">vencer todos os 5</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Formato: <strong className="text-foreground">MD1</strong> (uma corrida).</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Pista de <strong className="text-foreground">escolha do desafiado</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Se perder → <strong className="text-foreground">03 dias de cooldown</strong>.</li>
                </ul>
                <div className="pt-2 border-t border-border/50 text-xs text-accent">
                  ✅ Após as 05 vitórias → torna-se <strong>STREET RUNNER</strong> e recebe o <strong>Colete Midnight</strong>.
                </div>
              </div>

              <div className="card-racing neon-border p-5 space-y-3 animate-fade-in-up animate-fill-both stagger-2">
                <h4 className="text-sm font-bold uppercase tracking-[0.15em] neon-text-pink font-['Orbitron']">
                  🏎️ Street Runners — Pós-Iniciação
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary">▸</span> Podem usar o <strong className="text-foreground">Colete Midnight</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Podem desafiar o <strong className="text-foreground">último colocado (8º) da Lista 02</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Desafiado tem <strong className="text-foreground">24h para aceitar</strong> ou perde por W.O.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Formato: <strong className="text-foreground">MD3</strong> — desafiante escolhe 1 pista, desafiado escolhe 2.</li>
                </ul>
                <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
                  <p className="text-accent">🏆 Se vencer o último (8º) Night Driver → torna-se <strong>NIGHT DRIVER</strong>.</p>
                  <p className="text-muted-foreground">ℹ️ W.O. conta como vitória e aplica cooldown de 3 dias.</p>
                  <p className="text-yellow-400/80">⏳ <strong>Cooldown de Estreia:</strong> Aguardar <strong>03 dias</strong> após receber o Colete antes de desafiar.</p>
                </div>
              </div>

              <div className="card-racing neon-border p-5 space-y-3 animate-fade-in-up animate-fill-both stagger-3">
                <h4 className="text-sm font-bold uppercase tracking-[0.15em] neon-text-pink font-['Orbitron']">
                  🌙 Night Drivers — Lista 02
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary">▸</span> Ganha o direito de usar a tag <strong className="text-foreground">[夜中]</strong> nas corridas.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> O 8º pode desafiar o 7º, o 7º o 6º, e assim por diante.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Objetivo: alcançar a <strong className="text-foreground">Lista 01</strong> e o título de <strong className="text-foreground">MIDNIGHT DRIVER</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Formato: <strong className="text-foreground">MD3</strong> — desafiante escolhe 1, desafiado escolhe 2.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> O desafiado tem <strong className="text-foreground">24h para aceitar</strong> na app; se não aceitar, W.O. para o desafiante.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> A cada defesa → <strong className="text-foreground">03 dias de cooldown</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> 2 defesas seguidas → cooldown sobe para <strong className="text-foreground">07 dias</strong> (exceto último / 8º).</li>
                </ul>
              </div>

              <div className="card-racing neon-border p-5 space-y-3 border-yellow-500/30 animate-fade-in-up animate-fill-both stagger-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-yellow-400 font-['Orbitron']">
                  ⚠️ Regra Especial — Último lugar / 8º (Lista 02)
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-yellow-400">▸</span> Se defender o posto <strong className="text-foreground">2 vezes seguidas</strong> → ganha <strong className="text-foreground">03 dias de proteção</strong> contra externos.</li>
                  <li className="flex gap-2"><span className="text-yellow-400">▸</span> Durante o cooldown, <strong className="text-foreground">permanece livre para atacar</strong> pilotos acima.</li>
                  <li className="flex gap-2"><span className="text-yellow-400">▸</span> Novo integrante no posto → apenas <strong className="text-foreground">1 dia de cooldown</strong> antes de ficar disponível.</li>
                </ul>
                <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                  Regra temporária — válida até decisão fixa
                </div>
              </div>

              {/* ELO Rules Card */}
              <div className="card-racing neon-border p-5 space-y-3 border-orange-500/30 animate-fade-in-up animate-fill-both stagger-5">
                <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-orange-400 font-['Orbitron']">
                  🔥 Sistema de Amistosos — ELO
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-orange-400">▸</span> Todos começam com <strong className="text-foreground">1000 pontos</strong> de base.</li>
                  <li className="flex gap-2"><span className="text-orange-400">▸</span> Vencer alguém com <strong className="text-foreground">mais pontos</strong> → recompensa <strong className="text-foreground">maior</strong>.</li>
                  <li className="flex gap-2"><span className="text-orange-400">▸</span> Vencer alguém com <strong className="text-foreground">menos pontos</strong> → recompensa <strong className="text-foreground">menor</strong>.</li>
                  <li className="flex gap-2"><span className="text-orange-400">▸</span> Perder para alguém mais fraco → <strong className="text-destructive">penalidade maior</strong>.</li>
                  <li className="flex gap-2"><span className="text-orange-400">▸</span> Qualquer piloto pode desafiar <strong className="text-foreground">qualquer outro</strong>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* LISTA */}
        {activeTab === 'lista' && (
          <div className="animate-fade-in-up animate-fill-both space-y-4">
            {championshipFetchError && (
              <Alert variant="destructive" className="max-w-3xl mx-auto border-destructive/60">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro ao ler dados do Supabase</AlertTitle>
                <AlertDescription className="text-destructive/90">
                  {championshipFetchError}. Confirma que aplicaste todas as migrações em
                  <code className="mx-1 rounded bg-muted px-1 py-0.5 text-foreground">supabase/migrations</code>
                  (por exemplo <code className="mx-1 rounded bg-muted px-1 py-0.5 text-foreground">supabase db push</code>
                  ou SQL Editor no dashboard).
                </AlertDescription>
              </Alert>
            )}
            {championshipLoaded && !championshipFetchError && !listsReady && (
              <Alert className="max-w-3xl mx-auto border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-200">Listas em falta na base de dados</AlertTitle>
                <AlertDescription className="text-amber-100/90">
                  A app precisa de três linhas em <code className="rounded bg-black/20 px-1">player_lists</code> com ids
                  <code className="mx-1 rounded bg-black/20 px-1">initiation</code>,
                  <code className="mx-1 rounded bg-black/20 px-1">list-01</code> e
                  <code className="mx-1 rounded bg-black/20 px-1">list-02</code>. Corre a migração mais recente do
                  repositório ou executa o SQL do ficheiro
                  <code className="mx-1 rounded bg-black/20 px-1">20260410183000_seed_player_lists_anon_joker.sql</code>
                  no Supabase → SQL Editor.
                </AlertDescription>
              </Alert>
            )}
            {championshipLoaded &&
              loggedNick &&
              pendingLadderChallenges.some(
                c => c.challengedName.toLowerCase() === loggedNick.toLowerCase()
              ) && (
                <div className="max-w-2xl mx-auto mb-4 space-y-2">
                  {pendingLadderChallenges
                    .filter(c => c.challengedName.toLowerCase() === loggedNick.toLowerCase())
                    .map(c => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-accent/30 bg-accent/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="text-sm">
                          <span className="font-bold text-accent">{c.challengerName}</span>
                          <span className="text-muted-foreground"> desafiou-te (MD3). Tens 24h para aceitar.</span>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 bg-accent/20 text-accent border border-accent/40"
                          onClick={() => {
                            const err = acceptLadderChallenge(c.id);
                            if (err) toast({ title: 'Erro', description: err, variant: 'destructive' });
                            else toast({ title: 'Desafio aceite', description: 'A corrida MD3 pode começar.' });
                          }}
                        >
                          Aceitar desafio
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            {/* Initiation List - Visible for Jokers/Admins, collapsible for completed pilots */}
            {initiationList && (isJoker || isAdmin) && (
              <div className="max-w-md mx-auto mb-6 animate-fade-in-up animate-fill-both stagger-1">
                <PlayerList
                  listId={initiationList.id}
                  title={initiationList.title}
                  players={initiationList.players}
                  onChallenge={handleChallenge(initiationList.id)}
                  onReorder={(a, b) => reorderPlayers(initiationList.id, a, b)}
                  isInitiation
                  isExternal={isExternal}
                  isJoker={isJoker}
                  isAdmin={isAdmin}
                  loggedNick={loggedNick}
                  onChallengeInitiation={(isExternal || isJoker) ? handleChallengeInitiation : undefined}
                  jokerDefeatedIds={isJoker ? jokerDefeatedIds : []}
                  onEmptySlotClick={
                    isAdmin
                      ? slotIdx =>
                          handleEmptySlotClick(
                            initiationList.id,
                            initiationList.title,
                            initiationList.players.length,
                            slotIdx
                          )
                      : undefined
                  }
                  selectedSlotIndex={
                    addPilotModalOpen && pilotSlotTarget?.listId === initiationList.id
                      ? pilotSlotTarget.insertIndex
                      : null
                  }
                  getPilotRole={getPilotRole}
                />
              </div>
            )}

            {/* Collapsed initiation list for non-joker pilots who completed it */}
            {initiationList && !isJoker && !isAdmin && isRegistered && (
              <div className="max-w-md mx-auto mb-6 animate-fade-in-up animate-fill-both stagger-1">
                <details className="card-racing neon-border overflow-hidden">
                  <summary className="bg-secondary/80 px-5 py-3 border-b border-border flex items-center gap-2 cursor-pointer hover:bg-secondary transition-colors list-none">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase font-['Orbitron'] text-muted-foreground">
                      {initiationList.title}
                    </span>
                    <span className="ml-auto text-[10px] text-green-400 font-bold uppercase tracking-wider">✓ Concluída — clique para expandir</span>
                  </summary>
                  <PlayerList
                    listId={initiationList.id}
                    title={initiationList.title}
                    players={initiationList.players}
                    onChallenge={handleChallenge(initiationList.id)}
                    onReorder={(a, b) => reorderPlayers(initiationList.id, a, b)}
                    isInitiation
                    isExternal={isExternal}
                    isJoker={isJoker}
                    isAdmin={isAdmin}
                    loggedNick={loggedNick}
                    onChallengeInitiation={undefined}
                    jokerDefeatedIds={[]}
                    onEmptySlotClick={
                      isAdmin
                        ? slotIdx =>
                            handleEmptySlotClick(
                              initiationList.id,
                              initiationList.title,
                              initiationList.players.length,
                              slotIdx
                            )
                        : undefined
                    }
                    selectedSlotIndex={
                      addPilotModalOpen && pilotSlotTarget?.listId === initiationList.id
                        ? pilotSlotTarget.insertIndex
                        : null
                    }
                    getPilotRole={getPilotRole}
                  />
                </details>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 items-start max-w-5xl mx-auto">
              <div className="space-y-6 animate-fade-in-up animate-fill-both stagger-2">
                {list01 && (
                  <PlayerList
                    listId={list01.id}
                    title={list01.title}
                    players={list01.players}
                    onChallenge={handleChallenge(list01.id)}
                    onReorder={(a, b) => reorderPlayers(list01.id, a, b)}
                    isExternal={isExternal}
                    isJoker={isJoker}
                    isAdmin={isAdmin}
                    loggedNick={loggedNick}
                    onSetPlayerStatus={isAdmin ? setPlayerStatus : undefined}
                    onManagePilot={isAdmin ? setManagePilotName : undefined}
                    onFriendlyChallenge={handleCreateFriendly}
                    isLoggedInAnyList={isRegistered}
                    highlight
                    onEmptySlotClick={
                      isAdmin
                        ? slotIdx =>
                            handleEmptySlotClick(list01.id, list01.title, list01.players.length, slotIdx)
                        : undefined
                    }
                    selectedSlotIndex={
                      addPilotModalOpen && pilotSlotTarget?.listId === list01.id
                        ? pilotSlotTarget.insertIndex
                        : null
                    }
                    getPilotRole={getPilotRole}
                  />
                )}

                {/* Cross-list challenge: #1 L02 vs last L01 */}
                {loggedNick && list02 && list01 && list02.players.length > 0 && list01.players.length > 0 && (() => {
                  const isFirstOfL02 = list02.players[0]?.name.toLowerCase() === loggedNick.toLowerCase();
                  const lastOfL01 = list01.players[list01.players.length - 1];
                  const challenger = list02.players[0];
                  const canChallenge = isFirstOfL02 && challenger?.status === 'available' && lastOfL01?.status === 'available'
                    && !(challenger.challengeCooldownUntil && challenger.challengeCooldownUntil > Date.now());
                  const hasCooldown = isFirstOfL02 && challenger?.challengeCooldownUntil && challenger.challengeCooldownUntil > Date.now();
                  const cooldownDays = hasCooldown ? Math.ceil((challenger.challengeCooldownUntil! - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

                  if (!isFirstOfL02 && !isAdmin) return null;

                  return (
                    <div className="card-racing neon-border neon-border-pink overflow-hidden border-2">
                      <div className="bg-secondary/80 px-5 py-3 border-b border-border flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-accent" />
                        <span className="text-xs font-bold tracking-[0.2em] uppercase font-['Orbitron'] neon-text-pink">
                          Desafio entre Listas
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">1º L02</span>
                            <span className="text-sm font-bold text-foreground">{challenger?.name}</span>
                          </div>
                          <Swords className="h-5 w-5 text-accent" />
                          <div className="text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">{list01.players.length}º L01</span>
                            <span className="text-sm font-bold text-foreground">{lastOfL01?.name}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground">
                          Se o 1º da Lista 02 vencer → sobe para a Lista 01 e o último desce.
                        </p>
                        {isFirstOfL02 && canChallenge && (
                          <Button
                            className="w-full h-9 text-xs font-bold uppercase tracking-wider bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 font-['Orbitron']"
                            onClick={() => setCrossListModalOpen(true)}
                          >
                            <Swords className="h-3.5 w-3.5 mr-1.5" /> Desafiar pelo posto — MD3
                          </Button>
                        )}
                        {isFirstOfL02 && hasCooldown && (
                          <div className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            ⏳ Bloqueado ({cooldownDays}d)
                          </div>
                        )}
                        {isFirstOfL02 && challenger?.status === 'racing' && (
                          <div className="text-center text-[10px] font-bold uppercase tracking-wider text-accent">
                            ⚡ Em corrida
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {list02 && list01 && list02.players.length > 0 && list01.players.length > 0 && (
                  <RaceConfigModal
                    open={crossListModalOpen}
                    onOpenChange={setCrossListModalOpen}
                    challengerName={list02.players[0]?.name || ''}
                    challengedName={list01.players[list01.players.length - 1]?.name || ''}
                    onConfirm={(tracks) => {
                      const err = tryCrossListChallenge(tracks, isAdmin);
                      if (err) {
                        toast({ title: '🚫 Desafio Bloqueado', description: err, variant: 'destructive' });
                      } else {
                        toast({ title: '⚔ Desafio entre Listas!', description: `${list02.players[0]?.name} desafiou ${list01.players[list01.players.length - 1]?.name} pelo posto na Lista 01!` });
                        insertGlobalLog({
                          type: 'CHALLENGE',
                          description: `${list02.players[0]?.name} (1º L02) desafiou ${list01.players[list01.players.length - 1]?.name} (${list01.players.length}º L01) pelo posto na Lista 01!`,
                          player_one: list02.players[0]?.name,
                          player_two: list01.players[list01.players.length - 1]?.name,
                          category: 'cross-list',
                        });
                      }
                      setCrossListModalOpen(false);
                    }}
                  />
                )}

                {list02 && (
                  <PlayerList
                    listId={list02.id}
                    title={list02.title}
                    players={list02.players}
                    onChallenge={handleChallenge(list02.id)}
                    onReorder={(a, b) => reorderPlayers(list02.id, a, b)}
                    isExternal={isExternal}
                    isJoker={isJoker}
                    isAdmin={isAdmin}
                    loggedNick={loggedNick}
                    onSetPlayerStatus={isAdmin ? setPlayerStatus : undefined}
                    onManagePilot={isAdmin ? setManagePilotName : undefined}
                    onFriendlyChallenge={handleCreateFriendly}
                    isLoggedInAnyList={isRegistered}
                    onEmptySlotClick={
                      isAdmin
                        ? slotIdx =>
                            handleEmptySlotClick(list02.id, list02.title, list02.players.length, slotIdx)
                        : undefined
                    }
                    selectedSlotIndex={
                      addPilotModalOpen && pilotSlotTarget?.listId === list02.id
                        ? pilotSlotTarget.insertIndex
                        : null
                    }
                    getPilotRole={getPilotRole}
                  />
                )}

                {/* Street Runner / Joker (initiation complete) challenge: vs #7 L02 */}
                {loggedNick && !isRegistered && list02 && list02.players.length >= 1 && (() => {
                  const jokerCompleted = isJoker && initiationList && jokerDefeatedIds.length >= initiationList.players.length;
                  const canShowCard = isStreetRunner || jokerCompleted;
                  if (!canShowCard) return null;
                  const lastIdx = getList02LastPlaceIndex(list02.players.length);
                  const lastOfL02 = list02.players[lastIdx];
                  const roleLabel = jokerCompleted ? 'Joker' : 'Street Runner';
                  const cardTitle = jokerCompleted ? 'Desafio Joker → Lista 02' : 'Desafio Street Runner';
                  const canChallengeLast =
                    lastOfL02?.status === 'available' &&
                    !(lastOfL02.list02ExternalBlockUntil && lastOfL02.list02ExternalBlockUntil > Date.now()) &&
                    !(lastOfL02.list02ExternalEligibleAfter && lastOfL02.list02ExternalEligibleAfter > Date.now());
                  return (
                    <div className="card-racing neon-border neon-border-pink overflow-hidden border-2 border-green-500/30">
                      <div className="bg-secondary/80 px-5 py-3 border-b border-border flex items-center gap-2">
                        <Swords className="h-4 w-4 text-green-400" />
                        <span className="text-xs font-bold tracking-[0.2em] uppercase font-['Orbitron'] text-green-400">
                          {cardTitle}
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">{roleLabel}</span>
                            <span className="text-sm font-bold text-foreground">{loggedNick}</span>
                          </div>
                          <Swords className="h-5 w-5 text-green-400" />
                          <div className="text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">8º L02</span>
                            <span className="text-sm font-bold text-foreground">{lastOfL02?.name}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground">
                          {jokerCompleted
                            ? `Iniciação completa! Se vencer → entra na Lista 02. O desafiado tem 24h para aceitar (W.O. = vitória tua).`
                            : `Se vencer → entras na Lista 02. O 8º tem 24h para aceitar (W.O. = vitória tua).`
                          }
                        </p>
                        {canChallengeLast ? (
                          <Button
                            className="w-full h-9 text-xs font-bold uppercase tracking-wider bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 font-['Orbitron']"
                            onClick={() => setStreetRunnerModalOpen(true)}
                          >
                            <Swords className="h-3.5 w-3.5 mr-1.5" /> Desafiar o 8º — MD3
                          </Button>
                        ) : (
                          <div className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            ⏳ 8º indisponível ou em período de bloqueio / integração
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {loggedNick && (isStreetRunner || isJoker) && !isRegistered && list02 && list02.players.length >= 1 && (
                  <RaceConfigModal
                    open={streetRunnerModalOpen}
                    onOpenChange={setStreetRunnerModalOpen}
                    challengerName={loggedNick}
                    challengedName={list02.players[getList02LastPlaceIndex(list02.players.length)]?.name || ''}
                    onConfirm={(tracks) => {
                      const err = tryStreetRunnerChallenge(loggedNick, tracks, isAdmin);
                      const lastP = list02.players[getList02LastPlaceIndex(list02.players.length)];
                      if (err) {
                        toast({ title: '🚫 Desafio Bloqueado', description: err, variant: 'destructive' });
                      } else {
                        toast({
                          title: '⚔ Desafio enviado',
                          description: isAdmin
                            ? `${loggedNick} vs ${lastP?.name} — MD3 a iniciar.`
                            : `${loggedNick} desafiou ${lastP?.name} (8º L02). Aguarda aceitação em 24h.`,
                        });
                        insertGlobalLog({
                          type: 'CHALLENGE',
                          description: `${loggedNick} desafiou ${lastP?.name} (8º L02).`,
                          player_one: loggedNick,
                          player_two: lastP?.name,
                          category: 'street-runner',
                        });
                      }
                      setStreetRunnerModalOpen(false);
                    }}
                  />
                )}
              </div>

              <div className="lg:sticky lg:top-[120px] animate-fade-in-up animate-fill-both stagger-3">
                <AdminPanel
                  activeChallenges={activeChallenges}
                  pendingInitiationChallenges={pendingInitiationChallenges}
                  pendingLadderChallenges={pendingLadderChallenges}
                  onAcceptLadderChallenge={acceptLadderChallenge}
                  onRejectLadderChallenge={rejectLadderChallenge}
                  onResolve={(id, _winner) => {
                    toast({ title: '🏆 Corrida Finalizada', description: 'Classificação atualizada!' });
                  }}
                  onApproveInitiation={approveInitiationChallenge}
                  onRejectInitiation={rejectInitiationChallenge}
                  onReset={resetAll}
                  onClearAllCooldowns={handleClearCooldowns}
                  onAddPoint={addPoint}
                  onSaveLayout={() => {
                    saveListLayout();
                    toast({ title: '💾 Layout Salvo', description: 'A ordem atual das listas foi salva. O reset vai restaurar esse layout.' });
                  }}
                  isAdmin={isAdmin}
                  list02Players={list02?.players || []}
                  list01Players={list01?.players || []}
                  onMovePlayer={(playerName) => {
                    movePlayerToList(playerName, 'list-02', 'list-01');
                    toast({ title: '✅ Piloto Movido', description: `${playerName} foi promovido para a Lista 01!` });
                    insertGlobalLog({
                      type: 'PROMOTION',
                      description: `${playerName} foi promovido da Lista 02 para a Lista 01!`,
                      player_one: playerName,
                      category: 'list-01',
                    });
                  }}
                  onDemotePlayer={(playerName) => {
                    movePlayerToList(playerName, 'list-01', 'list-02', 0);
                    toast({ title: '⬇ Piloto Rebaixado', description: `${playerName} foi rebaixado para a Lista 02!` });
                    insertGlobalLog({
                      type: 'DEMOTION',
                      description: `${playerName} foi rebaixado da Lista 01 para a Lista 02!`,
                      player_one: playerName,
                      category: 'list-02',
                    });
                  }}
                  onAutoPromote={() => {
                    const topPlayer = list02?.players[0];
                    if (topPlayer) {
                      autoPromoteTopFromList02();
                      toast({ title: '⚡ Promoção Automática', description: `${topPlayer.name} (1º da L02) foi promovido para a Lista 01!` });
                      insertGlobalLog({
                        type: 'AUTO_PROMOTION',
                        description: `${topPlayer.name} foi automaticamente promovido da Lista 02 para a Lista 01!`,
                        player_one: topPlayer.name,
                        category: 'list-01',
                      });
                    }
                  }}
                  lists={lists}
                  onReorderPlayer={(playerId, newPositionIndex) => {
                    const list = lists.find(l => l.players.some(p => p.id === playerId));
                    if (!list) return;
                    const oldIdx = list.players.findIndex(p => p.id === playerId);
                    if (oldIdx < 0 || oldIdx === newPositionIndex) return;
                    const name = list.players[oldIdx].name;
                    reorderPlayers(list.id, oldIdx, newPositionIndex);
                    toast({
                      title: 'Posição atualizada',
                      description: `${name} → ${newPositionIndex + 1}º em «${list.title}».`,
                    });
                  }}
                  onApplyPilotCooldown={(playerId) => {
                    const p = lists.flatMap(l => l.players).find(x => x.id === playerId);
                    if (!p) return;
                    setPlayerStatus(playerId, 'cooldown');
                    toast({
                      title: 'Cooldown aplicado',
                      description: `${p.name} ficou em cooldown (defesa).`,
                    });
                  }}
                  onClearPilotCooldown={(playerId) => {
                    const p = lists.flatMap(l => l.players).find(x => x.id === playerId);
                    if (!p) return;
                    setPlayerStatus(playerId, 'available');
                    toast({
                      title: 'Cooldown removido',
                      description: `${p.name} está disponível.`,
                    });
                  }}
                />
              </div>
            </div>

            <AddPilotSlotModal
              open={addPilotModalOpen}
              onOpenChange={open => {
                setAddPilotModalOpen(open);
                if (!open) setPilotSlotTarget(null);
              }}
              target={pilotSlotTarget}
              lists={lists}
              onAllocate={handleAllocatePilot}
            />
          </div>
        )}

        {/* AMISTOSOS */}
        {activeTab === 'amistosos' && (
          <div className="animate-tab-slide-in max-w-lg mx-auto space-y-4">
            {friendlyFetchError && (
              <Alert variant="destructive" className="border-destructive/60">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar amistosos / ELO</AlertTitle>
                <AlertDescription className="text-destructive/90">{friendlyFetchError}</AlertDescription>
              </Alert>
            )}
            <FriendlyPanel
              allPlayerNames={allPlayerNames}
              isAdmin={isAdmin}
              loggedNick={loggedNick}
              pendingChallenges={pendingChallenges}
              getPlayerElo={getPlayerElo}
              onCreateChallenge={handleCreateFriendly}
              onAccept={handleAcceptFriendly}
              onDecline={handleDeclineFriendly}
              onCancel={handleCancelFriendly}
              onResolve={handleResolveFriendly}
              matches={friendlyMatches}
            />
          </div>
        )}

        {/* PILOTOS */}
        {activeTab === 'pilotos' && (
          <div className="animate-tab-slide-in">
            <PilotsTab
              getPlayerElo={getPlayerElo}
              getPilotRole={getPilotRole}
              list01Names={list01?.players.map(p => p.name) ?? []}
              list02Names={list02?.players.map(p => p.name) ?? []}
              isAdmin={isAdmin}
              onManagePilot={isAdmin ? setManagePilotName : undefined}
            />
          </div>
        )}

        {/* CAMPEONATO */}
        {activeTab === 'campeonato' && (
          <div className="animate-tab-slide-in">
            <ChampionshipTab
              isAdmin={isAdmin}
              loggedNick={loggedNick}
              pilotRole={loggedNick ? getPilotRole(loggedNick) : null}
              isInList01={!!list01?.players.some(p => p.name.toLowerCase() === loggedNick?.toLowerCase())}
              isInList02={!!list02?.players.some(p => p.name.toLowerCase() === loggedNick?.toLowerCase())}
            />
          </div>
        )}

        {/* RANKING */}
        {activeTab === 'ranking' && (
          <div className="animate-tab-slide-in max-w-3xl mx-auto">
            <EloRankingTable rankings={eloRankings} matches={friendlyMatches} getPilotRole={getPilotRole} />
          </div>
        )}

        {/* HISTÓRICO */}
        {activeTab === 'historico' && (
          <div className="animate-tab-slide-in">
            <HistoryTab />
          </div>
        )}
      </main>

      {/* Admin: Manage Pilot Modal */}
      {managePilotName && (
        <ManagePilotModal
          open={!!managePilotName}
          onOpenChange={(open) => { if (!open) setManagePilotName(null); }}
          pilotName={managePilotName}
          currentRole={getPilotRole(managePilotName)}
          currentElo={getPlayerElo(managePilotName)}
          onChangeRole={handleChangeRole}
          onEditElo={handleEditElo}
          onResetCooldown={handleResetPilotCooldown}
          ladderPlayer={managedLadderPlayer}
          jokerProgressCount={getJokerProgress(managePilotName).length}
          onAdminPatchPlayer={adminUpdatePlayerById}
          onClearJokerProgress={adminClearJokerProgressByNameKey}
          onResetProfile={handleResetPilotProfile}
          onRemoveFromList={
            managedLadderPlayer
              ? () => handleRemovePilotFromList(managedLadderPlayer.id, managePilotName)
              : undefined
          }
        />
      )}
    </div>
  );
};

export default Index;
