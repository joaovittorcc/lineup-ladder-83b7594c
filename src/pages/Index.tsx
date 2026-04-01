import { useState } from 'react';
import PlayerList from '@/components/PlayerList';
import AdminPanel from '@/components/AdminPanel';
import RankingTable from '@/components/RankingTable';
import { useChampionship } from '@/hooks/useChampionship';
import { toast } from '@/hooks/use-toast';
import { LogIn, Crown, ListOrdered, Home, Trophy } from 'lucide-react';
import midclubLogo from '@/assets/midclub-logo.png';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type TabId = 'inicio' | 'lista' | 'ranking';

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
    resolveChallenge,
    reorderPlayers,
    isPlayerInLists,
    clearAllCooldowns,
    setPlayerStatus,
    resetAll,
    addPoint,
  } = useChampionship();

  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  const [nick, setNick] = useState('');
  const [loggedNick, setLoggedNick] = useState<string | null>(() =>
    localStorage.getItem('mc-pilot-nick')
  );

  const isRegistered = loggedNick ? isPlayerInLists(loggedNick) : false;
  const isExternal = loggedNick ? !isRegistered : false;
  const isAdmin = loggedNick?.toLowerCase() === 'evojota';

  const handleLogin = () => {
    if (!nick.trim()) return;
    setLoggedNick(nick.trim());
    localStorage.setItem('mc-pilot-nick', nick.trim());
    toast({ title: '🏎️ Identificado!', description: `Bem-vindo, ${nick.trim()}!` });
  };

  const handleLogout = () => {
    setLoggedNick(null);
    setNick('');
    localStorage.removeItem('mc-pilot-nick');
  };

  const handleChallenge = (listId: string) => (challengerIdx: number, challengedIdx: number, tracks?: [string, string, string]) => {
    const err = tryChallenge(listId, challengerIdx, challengedIdx, isAdmin, tracks);
    if (err) {
      toast({ title: '🚫 Desafio Bloqueado', description: err, variant: 'destructive' });
    } else {
      toast({ title: '⚔ Desafio Aceito!', description: 'A corrida MD3 vai começar!' });
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

  const initiationList = lists.find(l => l.id === 'initiation');
  const list01 = lists.find(l => l.id === 'list-01');
  const list02 = lists.find(l => l.id === 'list-02');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'INÍCIO', icon: <Home className="h-4 w-4" /> },
    { id: 'lista', label: 'LISTA', icon: <ListOrdered className="h-4 w-4" /> },
    { id: 'ranking', label: 'RANKING', icon: <Trophy className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4">
          {/* Top row: logo + login */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <img src={midclubLogo} alt="Midnight Club" className="h-9 w-auto" />
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
                    value={nick}
                    onChange={e => setNick(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="Nick de Piloto"
                    className="h-8 w-36 text-xs bg-secondary/60 border-border"
                  />
                  <Button size="sm" className="h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30" onClick={handleLogin}>
                    <LogIn className="h-3 w-3 mr-1" /> Entrar
                  </Button>
                </div>
              )}
            </div>
          </div>

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
          <div className="animate-fade-in space-y-8">
            <div className="text-center space-y-4 py-8">
              <img src={midclubLogo} alt="Midnight Club" className="h-20 w-auto mx-auto" />
              <h2 className="text-3xl md:text-4xl font-black tracking-wider uppercase neon-text-purple font-['Orbitron']">
                Midnight Club
              </h2>
              <p className="text-lg font-bold uppercase tracking-[0.2em] text-accent font-['Orbitron']">
                Campeonato Interno
              </p>
            </div>

            <div className="card-racing rounded-xl neon-border p-6 space-y-4 max-w-2xl mx-auto">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] neon-text-pink font-['Orbitron']">
                📜 Regras
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary">▸</span> Formato <strong className="text-foreground">Melhor de 3 (MD3)</strong> — primeiro a 2 vitórias.</li>
                <li className="flex gap-2"><span className="text-primary">▸</span> Desafie apenas <strong className="text-foreground">1 posição acima</strong> na lista.</li>
                <li className="flex gap-2"><span className="text-primary">▸</span> Cooldown de <strong className="text-foreground">3 dias</strong> para desafiar novamente após uma corrida.</li>
                <li className="flex gap-2"><span className="text-primary">▸</span> Após <strong className="text-foreground">2 defesas</strong> consecutivas, cooldown de 7 dias.</li>
                <li className="flex gap-2"><span className="text-primary">▸</span> O <strong className="text-foreground">líder</strong> não desafia — ele defende.</li>
              </ul>
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
          </div>
        )}

        {/* LISTA */}
        {activeTab === 'lista' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_240px] gap-6 items-start">
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
                    isAdmin={isAdmin}
                    loggedNick={loggedNick}
                    onChallengeInitiation={isExternal ? handleChallengeInitiation : undefined}
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
                    isAdmin={isAdmin}
                    loggedNick={loggedNick}
                    onSetPlayerStatus={isAdmin ? setPlayerStatus : undefined}
                  />
                )}
              </div>

              <div className="lg:sticky lg:top-[120px]">
                <AdminPanel
                  activeChallenges={activeChallenges}
                  pendingInitiationChallenges={pendingInitiationChallenges}
                  onResolve={(id, winner) => {
                    resolveChallenge(id, winner);
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

        {/* RANKING */}
        {activeTab === 'ranking' && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <RankingTable lists={lists} challenges={challenges} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
