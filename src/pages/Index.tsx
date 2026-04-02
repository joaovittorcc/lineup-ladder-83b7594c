import { useState } from 'react';
import PlayerList from '@/components/PlayerList';
import AdminPanel from '@/components/AdminPanel';
import RankingTable from '@/components/RankingTable';
import PendingChallengeNotification from '@/components/PendingChallengeNotification';
import { useSupabaseChampionship } from '@/hooks/useSupabaseChampionship';
import { toast } from '@/hooks/use-toast';
import { LogIn, Crown, ListOrdered, Home, Trophy, Flag, Loader2 } from 'lucide-react';
import midclubLogo from '@/assets/midclub-logo.png';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authenticateUser, type AuthUser } from '@/data/users';

type TabId = 'inicio' | 'lista' | 'campeonato' | 'ranking';
type CampeonatoSub = 'ativo' | 'historico';

// Adapter: convert DB player to the legacy Player shape for PlayerList
function toLegacyPlayer(p: { id: string; name: string; status: string; defense_count: number; cooldown_until: string | null; challenge_cooldown_until: string | null; initiation_complete: boolean }) {
  return {
    id: p.id,
    name: p.name,
    status: p.status as 'available' | 'racing' | 'cooldown',
    defenseCount: p.defense_count,
    cooldownUntil: p.cooldown_until ? new Date(p.cooldown_until).getTime() : null,
    challengeCooldownUntil: p.challenge_cooldown_until ? new Date(p.challenge_cooldown_until).getTime() : null,
    initiationComplete: p.initiation_complete,
  };
}

// Adapter: convert DB challenge to the legacy Challenge shape
function toLegacyChallenge(c: { id: string; list_id: string; challenger_id: string; challenged_id: string; challenger_name: string; challenged_name: string; challenger_pos: number; challenged_pos: number; status: string; type: string; created_at: string; tracks: string[] | null; score_challenger: number; score_challenged: number }) {
  return {
    id: c.id,
    listId: c.list_id,
    challengerId: c.challenger_id,
    challengedId: c.challenged_id,
    challengerName: c.challenger_name,
    challengedName: c.challenged_name,
    challengerPos: c.challenger_pos,
    challengedPos: c.challenged_pos,
    status: (c.status === 'wo' ? 'completed' : c.status === 'accepted' ? 'racing' : c.status) as 'pending' | 'racing' | 'completed',
    type: c.type as 'ladder' | 'initiation',
    createdAt: new Date(c.created_at).getTime(),
    tracks: c.tracks as [string, string, string] | undefined,
    score: [c.score_challenger, c.score_challenged] as [number, number],
  };
}

const Index = () => {
  const {
    lists,
    challenges,
    activeChallenges,
    pendingChallenges,
    pendingInitiationChallenges,
    loading,
    tryChallenge,
    acceptChallenge,
    declineChallenge,
    forceWO,
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
  } = useSupabaseChampionship();

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

  const isRegistered = loggedNick ? isPlayerInLists(loggedNick) : false;
  const isExternal = loggedNick ? !isRegistered : false;
  const isAdmin = loggedAuth?.isAdmin ?? false;
  const isJoker = loggedAuth?.isJoker ?? false;
  const jokerDefeatedIds = loggedNick ? getJokerProgress(loggedNick) : [];

  const handleLogin = () => {
    if (!loginUser.trim() || !loginPin.trim()) return;
    const user = authenticateUser(loginUser, loginPin);
    if (!user) {
      toast({ title: '🚫 Acesso Negado', description: 'Usuário ou Senha incorretos.', variant: 'destructive' });
      return;
    }
    const displayName = loginUser.trim();
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
    // Now async
    tryChallenge(listId, challengerIdx, challengedIdx, isAdmin, tracks).then(err => {
      if (err) {
        toast({ title: '🚫 Desafio Bloqueado', description: err, variant: 'destructive' });
      } else {
        toast({ title: '⚔ Desafio Enviado!', description: 'O oponente tem 24h para aceitar.' });
      }
    });
    return null; // sync return for component compat
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

  const handleAcceptChallenge = (challengeId: string) => {
    acceptChallenge(challengeId);
    toast({ title: '⚔ Desafio Aceito!', description: 'A corrida MD3 vai começar!' });
  };

  const handleDeclineChallenge = (challengeId: string) => {
    declineChallenge(challengeId);
    toast({ title: '❌ Desafio Recusado', description: 'O desafio foi cancelado.' });
  };

  const handleForceWO = (challengeId: string) => {
    forceWO(challengeId);
    toast({ title: '⚡ W.O. Aplicado', description: 'O desafiante venceu por W.O.' });
  };

  // Convert DB data to legacy format for existing components
  const legacyLists = lists.map(l => ({
    id: l.id,
    title: l.title,
    players: l.players.map(toLegacyPlayer),
  }));

  const legacyChallenges = challenges.map(toLegacyChallenge);
  const legacyActiveChallenges = activeChallenges.map(toLegacyChallenge);
  const legacyPendingInitiation = pendingInitiationChallenges.map(toLegacyChallenge);

  const initiationList = legacyLists.find(l => l.id === 'initiation');
  const list01 = legacyLists.find(l => l.id === 'list-01');
  const list02 = legacyLists.find(l => l.id === 'list-02');

  // Non-initiation pending challenges (ladder type)
  const pendingLadderChallenges = pendingChallenges.filter(c => c.type === 'ladder');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'INÍCIO', icon: <Home className="h-4 w-4" /> },
    { id: 'lista', label: 'LISTA', icon: <ListOrdered className="h-4 w-4" /> },
    { id: 'campeonato', label: 'CAMPEONATO', icon: <Flag className="h-4 w-4" /> },
    { id: 'ranking', label: 'RANKING', icon: <Trophy className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4">
          {/* Top row: logo + login */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <img src={midclubLogo} alt="Midnight Club" className="h-[4.5rem] w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-black tracking-wider uppercase neon-text-purple font-['Orbitron'] leading-tight">
                  Midnight Club
                </h1>
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
                    {loggedNick}{isAdmin ? ' [ADMIN]' : ''}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider
                    ${isExternal
                      ? 'text-muted-foreground border-border bg-muted/30'
                      : 'text-primary border-primary/30 bg-primary/10'
                    }`}>
                    {isExternal ? 'Externo' : 'Piloto'}
                  </span>
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
                  <Button size="sm" className="h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30" onClick={handleLogin}>
                    <LogIn className="h-3 w-3 mr-1" /> Entrar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Pending challenge notifications */}
          {loggedNick && pendingLadderChallenges.length > 0 && (
            <div className="pb-3">
              <PendingChallengeNotification
                challenges={pendingLadderChallenges}
                loggedNick={loggedNick}
                isAdmin={isAdmin}
                onAccept={handleAcceptChallenge}
                onDecline={handleDeclineChallenge}
                onForceWO={handleForceWO}
              />
            </div>
          )}

          {/* Tab navigation */}
          <nav className="flex gap-1 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] font-['Orbitron'] border-b-2 transition-all
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
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-1 pt-6">
              <img src={midclubLogo} alt="Midnight Club" className="h-[25rem] w-auto mx-auto" />
              <h2 className="text-3xl md:text-4xl font-black tracking-wider uppercase neon-text-purple font-['Orbitron']">
                Midnight Club
              </h2>
              <p className="text-lg font-bold uppercase tracking-[0.2em] text-accent font-['Orbitron']">
                Campeonato Interno
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button
                className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 font-['Orbitron']"
                onClick={() => setActiveTab('lista')}
              >
                <ListOrdered className="h-4 w-4 mr-2" />
                Ver Listas
              </Button>
              <Button
                className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 font-['Orbitron']"
                onClick={() => setActiveTab('ranking')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Ver Ranking
              </Button>
            </div>

            {/* Rules Cards */}
            <div className="max-w-2xl mx-auto space-y-5 pb-8">
              <h3 className="text-center text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground font-['Orbitron']">
                ════ Regras & Progressão ════
              </h3>

              <div className="card-racing rounded-xl neon-border p-5 space-y-3">
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

              <div className="card-racing rounded-xl neon-border p-5 space-y-3">
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

              <div className="card-racing rounded-xl neon-border p-5 space-y-3">
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

              <div className="card-racing rounded-xl neon-border p-5 space-y-3 border-yellow-500/30">
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
            </div>
          </div>
        )}

        {/* LISTA */}
        {activeTab === 'lista' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_240px] gap-6 items-start max-w-6xl mx-auto">
              <div className="lg:sticky lg:top-[120px]">
                {initiationList && (
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
                )}
              </div>

              <div className="space-y-6">
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
                  />
                )}
              </div>

              <div className="lg:sticky lg:top-[120px]">
                <AdminPanel
                  activeChallenges={legacyActiveChallenges}
                  pendingInitiationChallenges={legacyPendingInitiation}
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
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider neon-text-purple font-['Orbitron'] animate-pulse">
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
          <div className="animate-fade-in max-w-3xl mx-auto">
            <RankingTable lists={legacyLists} challenges={legacyChallenges} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
