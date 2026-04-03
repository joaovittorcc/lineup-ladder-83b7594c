import { useState, useMemo } from 'react';
import PlayerList from '@/components/PlayerList';
import AdminPanel from '@/components/AdminPanel';
import EloRankingTable from '@/components/EloRankingTable';
import FriendlyPanel from '@/components/FriendlyPanel';
import ManagePilotModal from '@/components/ManagePilotModal';
import { useChampionship } from '@/hooks/useChampionship';
import { useFriendly } from '@/hooks/useFriendly';
import { toast } from '@/hooks/use-toast';
import { LogIn, Crown, ListOrdered, Home, Trophy, Flag, Flame } from 'lucide-react';
import midclubLogo from '@/assets/midclub-logo.png';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authenticateUser, getUserByName, type AuthUser, type PilotRole } from '@/data/users';
import RoleBadge from '@/components/RoleBadge';

type TabId = 'inicio' | 'lista' | 'amistosos' | 'campeonato' | 'ranking';
type CampeonatoSub = 'ativo' | 'historico';

const Index = () => {
  const {
    lists,
    challenges,
    activeChallenges,
    pendingInitiationChallenges,
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
  } = useChampionship();

  const {
    matches: friendlyMatches,
    pendingFriendly,
    getPlayerElo,
    createFriendlyChallenge,
    approveFriendly,
    rejectFriendly,
    resolveFriendly,
    getEloRanking,
    setManualElo,
  } = useFriendly();

  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  const [campeonatoSub, setCampeonatoSub] = useState<CampeonatoSub>('ativo');
  const [loginUser, setLoginUser] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loggedNick, setLoggedNick] = useState<string | null>(() =>
    localStorage.getItem('mc-pilot-nick')
  );
  const [loggedAuth, setLoggedAuth] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('mc-pilot-auth');
    return stored ? JSON.parse(stored) : null;
  });
  const [managePilotName, setManagePilotName] = useState<string | null>(null);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, PilotRole>>(() => {
    try {
      const saved = localStorage.getItem('mc-role-overrides');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const isRegistered = loggedNick ? isPlayerInLists(loggedNick) : false;
  const isExternal = loggedNick ? !isRegistered : false;
  const isAdmin = loggedAuth?.isAdmin ?? false;
  const isJoker = loggedAuth?.isJoker ?? false;
  const jokerDefeatedIds = loggedNick ? getJokerProgress(loggedNick) : [];

  // Collect all unique player names from lists
  const allPlayerNames = [...new Set(
    lists
      .filter(l => l.id !== 'initiation')
      .flatMap(l => l.players.map(p => p.name))
  )];

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
    const err = tryChallenge(listId, challengerIdx, challengedIdx, isAdmin, tracks);
    if (err) {
      toast({ title: '🚫 Desafio Bloqueado', description: err, variant: 'destructive' });
    } else {
      toast({ title: '⚔ Desafio Iniciado!', description: 'A corrida MD3 vai começar!' });
    }
    return err;
  };

  const handleChallengeInitiation = (playerId: string) => {
    if (!loggedNick) return;
    challengeInitiationPlayer(loggedNick, playerId);
    toast({ title: '📩 Desafio Enviado!', description: 'Aguardando aprovação do Admin.' });
  };

  const handleClearCooldowns = () => {
    clearAllCooldowns();
    toast({ title: '🛡️ Cooldowns Limpos', description: 'Todos os pilotos estão disponíveis!' });
  };

  const handleCreateFriendly = (challengerName: string, challengedName: string) => {
    createFriendlyChallenge(challengerName, challengedName);
    toast({ title: '🔥 Amistoso Criado!', description: 'Aguardando aprovação do Admin.' });
  };

  const handleApproveFriendly = () => {
    approveFriendly();
    toast({ title: '✅ Amistoso Aprovado!', description: 'A corrida pode começar!' });
  };

  const handleRejectFriendly = () => {
    rejectFriendly();
    toast({ title: '❌ Amistoso Rejeitado', variant: 'destructive' });
  };

  const handleResolveFriendly = (winnerName: string) => {
    resolveFriendly(winnerName);
    toast({ title: '🏆 Amistoso Finalizado!', description: `${winnerName} venceu! Pontuação ELO atualizada.` });
  };

  const handleChangeRole = (name: string, newRole: PilotRole) => {
    const updated = { ...roleOverrides, [name.toLowerCase()]: newRole };
    setRoleOverrides(updated);
    localStorage.setItem('mc-role-overrides', JSON.stringify(updated));
    toast({ title: '✅ Cargo Alterado', description: `${name} agora é ${newRole}` });
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
      toast({ title: '🛡️ Cooldown Resetado', description: `${name} está disponível!` });
    }
  };

  const getPilotRole = (name: string): PilotRole => {
    const override = roleOverrides[name.toLowerCase()];
    if (override) return override;
    const user = getUserByName(name);
    return user?.role ?? 'night-driver';
  };

  const managedPilotUser = managePilotName ? getUserByName(managePilotName) : undefined;

  const initiationList = lists.find(l => l.id === 'initiation');
  const list01 = lists.find(l => l.id === 'list-01');
  const list02 = lists.find(l => l.id === 'list-02');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'INÍCIO', icon: <Home className="h-4 w-4" /> },
    { id: 'lista', label: 'LISTA', icon: <ListOrdered className="h-4 w-4" /> },
    { id: 'amistosos', label: 'AMISTOSOS', icon: <Flame className="h-4 w-4" /> },
    { id: 'campeonato', label: 'CAMPEONATO', icon: <Flag className="h-4 w-4" /> },
    { id: 'ranking', label: 'RANKING', icon: <Trophy className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="neon-line" />
        <div className="max-w-6xl mx-auto px-4">
          {/* Top row: logo + login */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <img src={midclubLogo} alt="Midnight Club" className="h-[4.5rem] w-auto hover-scale" />
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
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] font-['Orbitron'] border-b-2 transition-all whitespace-nowrap
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* INÍCIO */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="text-center space-y-3 pt-6 relative kanji-watermark">
              <img src={midclubLogo} alt="Midnight Club" className="h-[25rem] w-auto mx-auto animate-float drop-shadow-[0_0_30px_hsl(280_100%_65%_/_0.3)] relative z-10" />
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

              <div className="card-racing rounded-xl neon-border p-5 space-y-3 animate-fade-in-up animate-fill-both stagger-1">
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

              <div className="card-racing rounded-xl neon-border p-5 space-y-3 animate-fade-in-up animate-fill-both stagger-2">
                <h4 className="text-sm font-bold uppercase tracking-[0.15em] neon-text-pink font-['Orbitron']">
                  🏍️ Street Runners — Pós-Iniciação
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary">▸</span> Podem usar o <strong className="text-foreground">Colete Midnight</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Podem desafiar o <strong className="text-foreground">7º colocado da Lista 02</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Desafiado tem <strong className="text-foreground">24h para aceitar</strong> ou perde por W.O.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Formato: <strong className="text-foreground">MD3</strong> — desafiante escolhe 1 pista, desafiado escolhe 2.</li>
                </ul>
                <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
                  <p className="text-accent">🏆 Se vencer o 7º Night Driver → torna-se <strong>NIGHT DRIVER</strong>.</p>
                  <p className="text-muted-foreground">ℹ️ W.O. conta como vitória e aplica cooldown de 3 dias.</p>
                  <p className="text-yellow-400/80">⏳ <strong>Cooldown de Estreia:</strong> Aguardar <strong>03 dias</strong> após receber o Colete antes de desafiar.</p>
                </div>
              </div>

              <div className="card-racing rounded-xl neon-border p-5 space-y-3 animate-fade-in-up animate-fill-both stagger-3">
                <h4 className="text-sm font-bold uppercase tracking-[0.15em] neon-text-pink font-['Orbitron']">
                  🌙 Night Drivers — Lista 02
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary">▸</span> Ganha o direito de usar a tag <strong className="text-foreground">[夜中]</strong> nas corridas.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> O 7º pode desafiar o 6º, e assim por diante.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Objetivo: alcançar a <strong className="text-foreground">Lista 01</strong> e o título de <strong className="text-foreground">MIDNIGHT DRIVER</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> Formato: <strong className="text-foreground">MD3</strong> — desafiante escolhe 1, desafiado escolhe 2.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> A cada defesa → <strong className="text-foreground">03 dias de cooldown</strong>.</li>
                  <li className="flex gap-2"><span className="text-primary">▸</span> 2 defesas seguidas → cooldown sobe para <strong className="text-foreground">07 dias</strong> (exceto 7º).</li>
                </ul>
              </div>

              <div className="card-racing rounded-xl neon-border p-5 space-y-3 border-yellow-500/30 animate-fade-in-up animate-fill-both stagger-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-yellow-400 font-['Orbitron']">
                  ⚠️ Regra Especial — 7º Colocado (Lista 02)
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
              <div className="card-racing rounded-xl neon-border p-5 space-y-3 border-orange-500/30 animate-fade-in-up animate-fill-both stagger-5">
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
          <div className="animate-fade-in-up animate-fill-both">
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
                />
              </div>
            )}

            {/* Collapsed initiation list for non-joker pilots who completed it */}
            {initiationList && !isJoker && !isAdmin && isRegistered && (
              <div className="max-w-md mx-auto mb-6 animate-fade-in-up animate-fill-both stagger-1">
                <details className="card-racing rounded-xl neon-border overflow-hidden">
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
                    highlight
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
                  />
                )}
              </div>

              <div className="lg:sticky lg:top-[120px] animate-fade-in-up animate-fill-both stagger-3">
                <AdminPanel
                  activeChallenges={activeChallenges}
                  pendingInitiationChallenges={pendingInitiationChallenges}
                  onResolve={(id, _winner) => {
                    toast({ title: '🏆 Corrida Finalizada', description: 'Classificação atualizada!' });
                  }}
                  onApproveInitiation={approveInitiationChallenge}
                  onRejectInitiation={rejectInitiationChallenge}
                  onReset={resetAll}
                  onClearAllCooldowns={handleClearCooldowns}
                  onAddPoint={addPoint}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </div>
        )}

        {/* AMISTOSOS */}
        {activeTab === 'amistosos' && (
          <div className="animate-fade-in-up animate-fill-both max-w-lg mx-auto">
            <FriendlyPanel
              allPlayerNames={allPlayerNames}
              isAdmin={isAdmin}
              loggedNick={loggedNick}
              pendingFriendly={pendingFriendly}
              getPlayerElo={getPlayerElo}
              onCreateChallenge={handleCreateFriendly}
              onApprove={handleApproveFriendly}
              onReject={handleRejectFriendly}
              onResolve={handleResolveFriendly}
              matches={friendlyMatches}
            />
          </div>
        )}

        {/* CAMPEONATO */}
        {activeTab === 'campeonato' && (
          <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
            <div className="flex justify-center gap-2">
              {(['ativo', 'historico'] as CampeonatoSub[]).map(sub => (
                <button
                  key={sub}
                  onClick={() => setCampeonatoSub(sub)}
                  className={`px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] font-['Orbitron'] rounded-lg border transition-all
                    ${campeonatoSub === sub
                      ? 'border-primary bg-primary/20 text-primary neon-text-purple'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-primary/40'
                    }`}
                >
                  {sub === 'ativo' ? 'ATIVO' : 'HISTÓRICO'}
                </button>
              ))}
            </div>

            {campeonatoSub === 'ativo' && (
              <div className="flex items-center justify-center min-h-[300px]">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider neon-text-purple font-['Orbitron'] animate-neon-pulse drop-shadow-[0_0_20px_hsl(280_100%_65%_/_0.5)]">
                  EM BREVE
                </h2>
              </div>
            )}

            {campeonatoSub === 'historico' && (
              <div className="flex items-center justify-center min-h-[300px]">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-['Orbitron']">
                  Nenhum registro encontrado
                </p>
              </div>
            )}
          </div>
        )}

        {/* RANKING */}
        {activeTab === 'ranking' && (
          <div className="animate-fade-in-up animate-fill-both max-w-3xl mx-auto">
            <EloRankingTable rankings={eloRankings} matches={friendlyMatches} />
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
        />
      )}
    </div>
  );
};

export default Index;
