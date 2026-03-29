import PlayerList from '@/components/PlayerList';
import AdminPanel from '@/components/AdminPanel';
import { useChampionship } from '@/hooks/useChampionship';
import { toast } from '@/hooks/use-toast';
import { Flame } from 'lucide-react';

const Index = () => {
  const {
    lists,
    activeChallenges,
    tryChallenge,
    resolveChallenge,
    reorderPlayers,
    promoteFromInitiation,
    resetAll,
  } = useChampionship();

  const handleChallenge = (listId: string) => (challengerIdx: number, challengedIdx: number) => {
    const err = tryChallenge(listId, challengerIdx, challengedIdx);
    if (err) {
      toast({ title: '🚫 Desafio Bloqueado', description: err, variant: 'destructive' });
    } else {
      toast({ title: '⚔ Desafio Aceito!', description: 'A corrida vai começar!' });
    }
    return err;
  };

  const handleResolve = (challengeId: string, winnerId: string) => {
    resolveChallenge(challengeId, winnerId);
    toast({ title: '🏆 Corrida Finalizada', description: 'Classificação atualizada!' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border py-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-wider uppercase neon-text-purple font-['Orbitron']">
                Street Ladder
              </h1>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-bold">
                Campeonato Underground
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              {activeChallenges.length} corrida{activeChallenges.length !== 1 ? 's' : ''} ativa{activeChallenges.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {lists.map(list => (
            <PlayerList
              key={list.id}
              listId={list.id}
              title={list.title}
              players={list.players}
              onChallenge={handleChallenge(list.id)}
              onReorder={(oldIdx, newIdx) => reorderPlayers(list.id, oldIdx, newIdx)}
              isInitiation={list.id === 'initiation'}
              onPromote={list.id === 'initiation' ? promoteFromInitiation : undefined}
            />
          ))}

          <AdminPanel
            activeChallenges={activeChallenges}
            onResolve={handleResolve}
            onReset={resetAll}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
