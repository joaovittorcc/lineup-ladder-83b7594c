import { Challenge } from '@/types/championship';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, RotateCcw } from 'lucide-react';

interface AdminPanelProps {
  activeChallenges: Challenge[];
  onResolve: (challengeId: string, winnerId: string) => void;
  onReset: () => void;
}

const AdminPanel = ({ activeChallenges, onResolve, onReset }: AdminPanelProps) => {
  return (
    <div className="card-racing rounded-xl neon-border overflow-hidden">
      <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
        <Trophy className="h-4 w-4 text-accent" />
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
          Painel Admin
        </h2>
      </div>

      <div className="p-4 space-y-3">
        {activeChallenges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma corrida em andamento
          </p>
        ) : (
          activeChallenges.map(challenge => (
            <div
              key={challenge.id}
              className="bg-secondary/50 rounded-lg p-4 border border-accent/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  <span className="font-bold text-accent text-[10px] uppercase tracking-wider">Em Corrida</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-sm font-bold">
                <span className="neon-text-pink">{challenge.challengerName}</span>
                <span className="text-muted-foreground text-xs">VS</span>
                <span className="neon-text-purple">{challenge.challengedName}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 text-xs font-bold"
                  onClick={() => onResolve(challenge.id, challenge.challengerId)}
                >
                  🏆 {challenge.challengerName}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-xs font-bold"
                  onClick={() => onResolve(challenge.id, challenge.challengedId)}
                >
                  🏆 {challenge.challengedName}
                </Button>
              </div>
            </div>
          ))
        )}

        <div className="pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-muted-foreground border-border hover:border-destructive hover:text-destructive"
            onClick={onReset}
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Resetar Campeonato
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
