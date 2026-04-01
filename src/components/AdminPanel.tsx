import { Challenge } from '@/types/championship';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, RotateCcw, UserPlus, Check, X, ShieldOff, Flag } from 'lucide-react';

interface AdminPanelProps {
  activeChallenges: Challenge[];
  pendingInitiationChallenges: Challenge[];
  onResolve: (challengeId: string, winnerId: string) => void;
  onApproveInitiation: (challengeId: string) => void;
  onRejectInitiation: (challengeId: string) => void;
  onReset: () => void;
  onClearAllCooldowns: () => void;
  isAdmin: boolean;
}

const AdminPanel = ({
  activeChallenges,
  pendingInitiationChallenges,
  onResolve,
  onApproveInitiation,
  onRejectInitiation,
  onReset,
  onClearAllCooldowns,
  isAdmin,
}: AdminPanelProps) => {
  if (!isAdmin) return null;

  return (
    <div className="card-racing rounded-xl neon-border overflow-hidden">
      <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
        <Trophy className="h-4 w-4 text-accent" />
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
          Painel Admin
        </h2>
      </div>

      <div className="p-4 space-y-3">
        {/* Pending initiation challenges */}
        {pendingInitiationChallenges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
              <UserPlus className="h-3.5 w-3.5" />
              Desafios de Entrada
            </div>
            {pendingInitiationChallenges.map(challenge => (
              <div
                key={challenge.id}
                className="bg-primary/10 rounded-lg p-3 border border-primary/20 space-y-2"
              >
                <div className="flex items-center justify-center gap-2 text-sm font-bold">
                  <span className="neon-text-pink">{challenge.challengerName}</span>
                  <span className="text-muted-foreground text-xs">→</span>
                  <span className="neon-text-purple">{challenge.challengedName}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-xs font-bold"
                    onClick={() => onApproveInitiation(challenge.id)}
                  >
                    <Check className="h-3 w-3 mr-1" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs text-muted-foreground border-border hover:border-destructive hover:text-destructive"
                    onClick={() => onRejectInitiation(challenge.id)}
                  >
                    <X className="h-3 w-3 mr-1" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active races */}
        {activeChallenges.length === 0 && pendingInitiationChallenges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma corrida em andamento
          </p>
        ) : (
          activeChallenges.map(challenge => (
            <div
              key={challenge.id}
              className="bg-secondary/50 rounded-lg p-4 border border-accent/20 space-y-3"
            >
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-3.5 w-3.5 text-accent" />
                <span className="font-bold text-accent text-[10px] uppercase tracking-wider">Em Corrida (MD3)</span>
              </div>

              <div className="flex items-center justify-center gap-3 text-sm font-bold">
                <span className="neon-text-pink">{challenge.challengerName}</span>
                <span className="text-muted-foreground text-xs">VS</span>
                <span className="neon-text-purple">{challenge.challengedName}</span>
              </div>

              {/* Track info */}
              {challenge.tracks && (
                <div className="space-y-1">
                  {challenge.tracks.map((track, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Flag className="h-2.5 w-2.5" />
                      <span>Pista {i + 1}:</span>
                      <span className="font-semibold">{track || 'Não definida'}</span>
                    </div>
                  ))}
                </div>
              )}

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

        <div className="pt-3 border-t border-border space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-primary border-primary/30 hover:bg-primary/10"
            onClick={onClearAllCooldowns}
          >
            <ShieldOff className="h-3 w-3 mr-1" /> Limpar Todos os Cooldowns
          </Button>
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
