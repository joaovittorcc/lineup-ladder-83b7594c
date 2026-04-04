import { useState } from 'react';
import { Challenge, Player } from '@/types/championship';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, UserPlus, Check, X, ShieldOff, ArrowUpRight, ArrowDownRight, Zap, Save } from 'lucide-react';
import MD3Scoreboard from '@/components/MD3Scoreboard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminPanelProps {
  activeChallenges: Challenge[];
  pendingInitiationChallenges: Challenge[];
  onResolve: (challengeId: string, winnerId: string) => void;
  onApproveInitiation: (challengeId: string) => void;
  onRejectInitiation: (challengeId: string) => void;
  onReset: () => void;
  onClearAllCooldowns: () => void;
  onAddPoint: (challengeId: string, side: 'challenger' | 'challenged') => void;
  onSaveLayout: () => void;
  isAdmin: boolean;
  list02Players?: Player[];
  list01Players?: Player[];
  onMovePlayer?: (playerName: string) => void;
  onDemotePlayer?: (playerName: string) => void;
  onAutoPromote?: () => void;
}

const AdminPanel = ({
  activeChallenges,
  pendingInitiationChallenges,
  onResolve,
  onApproveInitiation,
  onRejectInitiation,
  onReset,
  onClearAllCooldowns,
  onAddPoint,
  onSaveLayout,
  isAdmin,
  list02Players = [],
  list01Players = [],
  onMovePlayer,
  onDemotePlayer,
  onAutoPromote,
}: AdminPanelProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedDemotePlayer, setSelectedDemotePlayer] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'move' | 'auto' | 'demote'; playerName?: string } | null>(null);

  if (!isAdmin) return null;

  return (
    <div className="card-racing neon-border overflow-hidden animate-glow-breathe">
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

        {/* Active races with MD3 scoreboard */}
        {activeChallenges.length === 0 && pendingInitiationChallenges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma corrida em andamento
          </p>
        ) : (
          activeChallenges.map(challenge => (
            <MD3Scoreboard
              key={challenge.id}
              challenge={challenge}
              isAdmin={isAdmin}
              onAddPoint={onAddPoint}
            />
          ))
        )}

        {/* Move pilot from List 02 to List 01 */}
        {onMovePlayer && list02Players.length > 0 && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Mover Piloto (L02 → L01)
            </div>
            <div className="flex gap-2">
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="flex-1 h-8 text-xs bg-secondary border-border">
                  <SelectValue placeholder="Selecionar piloto..." />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-border">
                  {list02Players.map(p => (
                    <SelectItem key={p.id} value={p.name} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                disabled={!selectedPlayer}
                onClick={() => {
                  if (selectedPlayer) {
                    setConfirmAction({ type: 'move', playerName: selectedPlayer });
                  }
                }}
              >
                <ArrowUpRight className="h-3 w-3 mr-1" /> Mover
              </Button>
            </div>
            {onAutoPromote && list02Players.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-accent border-accent/30 hover:bg-accent/10"
                onClick={() => setConfirmAction({ type: 'auto', playerName: list02Players[0]?.name })}
              >
                <Zap className="h-3 w-3 mr-1" /> Promover 1º da Lista 02 Automaticamente
              </Button>
            )}
          </div>
        )}

        {/* Demote pilot from List 01 to List 02 */}
        {onDemotePlayer && list01Players.length > 0 && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-destructive">
              <ArrowDownRight className="h-3.5 w-3.5" />
              Rebaixar Piloto (L01 → L02)
            </div>
            <div className="flex gap-2">
              <Select value={selectedDemotePlayer} onValueChange={setSelectedDemotePlayer}>
                <SelectTrigger className="flex-1 h-8 text-xs bg-secondary border-border">
                  <SelectValue placeholder="Selecionar piloto..." />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-border">
                  {list01Players.map(p => (
                    <SelectItem key={p.id} value={p.name} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 text-xs bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30"
                disabled={!selectedDemotePlayer}
                onClick={() => {
                  if (selectedDemotePlayer) {
                    setConfirmAction({ type: 'demote', playerName: selectedDemotePlayer });
                  }
                }}
              >
                <ArrowDownRight className="h-3 w-3 mr-1" /> Rebaixar
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
          <AlertDialogContent className="bg-secondary border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {confirmAction?.type === 'auto' ? '⚡ Confirmar Promoção Automática' : confirmAction?.type === 'demote' ? '⬇ Confirmar Rebaixamento' : '↗ Confirmar Movimentação'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {confirmAction?.type === 'auto'
                  ? `Tem certeza que deseja promover ${confirmAction?.playerName} (1º da Lista 02) para a Lista 01?`
                  : confirmAction?.type === 'demote'
                  ? `Tem certeza que deseja rebaixar ${confirmAction?.playerName} da Lista 01 para a Lista 02?`
                  : `Tem certeza que deseja mover ${confirmAction?.playerName} da Lista 02 para a Lista 01?`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className={`text-xs border ${confirmAction?.type === 'demote' ? 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30' : 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/30'}`}
                onClick={() => {
                  if (confirmAction?.type === 'move' && confirmAction.playerName && onMovePlayer) {
                    onMovePlayer(confirmAction.playerName);
                    setSelectedPlayer('');
                  } else if (confirmAction?.type === 'auto' && onAutoPromote) {
                    onAutoPromote();
                  } else if (confirmAction?.type === 'demote' && confirmAction.playerName && onDemotePlayer) {
                    onDemotePlayer(confirmAction.playerName);
                    setSelectedDemotePlayer('');
                  }
                  setConfirmAction(null);
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="pt-3 border-t border-border space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-green-400 border-green-400/30 hover:bg-green-400/10"
            onClick={onSaveLayout}
          >
            <Save className="h-3 w-3 mr-1" /> Salvar Layout Atual
          </Button>
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
