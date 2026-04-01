import { useState } from 'react';
import PlayerList from '@/components/PlayerList';
import AdminPanel from '@/components/AdminPanel';
import { useChampionship } from '@/hooks/useChampionship';
import { toast } from '@/hooks/use-toast';
import { LogIn, Crown } from 'lucide-react';
import midclubLogo from '@/assets/midclub-logo.png';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
    lists,
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

  const [nick, setNick] = useState('');
  const [loggedNick, setLoggedNick] = useState<string | null>(() => {
    return localStorage.getItem('mc-pilot-nick');
  });

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

  const handleResolve = (challengeId: string, winnerId: string) => {
    resolveChallenge(challengeId, winnerId);
    toast({ title: '🏆 Corrida Finalizada', description: 'Classificação atualizada!' });
  };

  const handleClearCooldowns = () => {
    clearAllCooldowns();
    toast({ title: '🛡️ Cooldowns Limpos', description: 'Todos os pilotos estão disponíveis!' });
  };

  const initiationList = lists.find(l => l.id === 'initiation');
  const list01 = lists.find(l => l.id === 'list-01');
  const list02 = lists.find(l => l.id === 'list-02');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border py-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={midclubLogo} alt="Midnight Club" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-wider uppercase neon-text-purple font-['Orbitron']">
                Midnight Club
              </h1>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-bold">
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
                  placeholder="Digite seu Nick de Piloto"
                  className="h-8 w-44 text-xs bg-secondary/60 border-border"
                />
                <Button size="sm" className="h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30" onClick={handleLogin}>
                  <LogIn className="h-3 w-3 mr-1" /> Entrar
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_240px] gap-6 items-start">
          <div className="lg:sticky lg:top-8">
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

          <div className="lg:sticky lg:top-8">
            <AdminPanel
              activeChallenges={activeChallenges}
              pendingInitiationChallenges={pendingInitiationChallenges}
              onResolve={handleResolve}
              onApproveInitiation={approveInitiationChallenge}
              onRejectInitiation={rejectInitiationChallenge}
              onReset={resetAll}
              onClearAllCooldowns={handleClearCooldowns}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
