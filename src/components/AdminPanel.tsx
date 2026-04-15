import { useState, useEffect, useMemo } from 'react';
import { Challenge, Player, PlayerList } from '@/types/championship';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Trophy,
  RotateCcw,
  UserPlus,
  Check,
  X,
  ShieldOff,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Save,
  ListOrdered,
  Timer,
  Settings2,
  Flag,
  ArrowUpDown,
  Users,
} from 'lucide-react';
import MD3Scoreboard from '@/components/MD3Scoreboard';
import PilotSettingsModal from '@/components/PilotSettingsModal';
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
const SEL_NONE = '__none__';

interface AdminPanelProps {
  activeChallenges: Challenge[];
  pendingInitiationChallenges: Challenge[];
  pendingLadderChallenges?: Challenge[];
  onAcceptLadderChallenge?: (challengeId: string) => string | null;
  onRejectLadderChallenge?: (challengeId: string) => string | null;
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
  lists?: PlayerList[];
  onReorderPlayer?: (playerId: string, newPositionIndex: number) => void;
  onApplyPilotCooldown?: (playerId: string) => void;
  onClearPilotCooldown?: (playerId: string) => void;
}

type PilotRow = {
  id: string;
  name: string;
  listId: string;
  listTitle: string;
  index: number;
};

const AdminPanel = ({
  activeChallenges,
  pendingInitiationChallenges,
  pendingLadderChallenges = [],
  onAcceptLadderChallenge,
  onRejectLadderChallenge,
  onResolve: _onResolve,
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
  lists = [],
  onReorderPlayer,
  onApplyPilotCooldown,
  onClearPilotCooldown,
}: AdminPanelProps) => {
  const [promotePilotId, setPromotePilotId] = useState<string>(SEL_NONE);
  const [demotePilotId, setDemotePilotId] = useState<string>(SEL_NONE);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'move' | 'auto' | 'demote';
    playerName?: string;
  } | null>(null);

  const [reorderPilotId, setReorderPilotId] = useState<string>(SEL_NONE);
  const [reorderNewRank, setReorderNewRank] = useState('1');

  const [cooldownPilotId, setCooldownPilotId] = useState<string>(SEL_NONE);
  const [pilotSettingsOpen, setPilotSettingsOpen] = useState(false);

  const pilotRows: PilotRow[] = useMemo(
    () =>
      lists.flatMap(l =>
        l.players.map((p, idx) => ({
          id: p.id,
          name: p.name,
          listId: l.id,
          listTitle: l.title,
          index: idx,
        }))
      ),
    [lists]
  );

  const reorderContext = useMemo(() => {
    const row = pilotRows.find(r => r.id === reorderPilotId);
    if (!row) return null;
    const list = lists.find(l => l.id === row.listId);
    if (!list) return null;
    return { row, list, len: list.players.length };
  }, [pilotRows, reorderPilotId, lists]);

  useEffect(() => {
    if (reorderContext) {
      setReorderNewRank(String(reorderContext.row.index + 1));
    } else {
      setReorderNewRank('1');
    }
  }, [reorderPilotId, reorderContext]);

  if (!isAdmin) return null;

  const pilotLabel = (r: PilotRow) => `${r.name} — ${r.listTitle} · ${r.index + 1}º`;

  const applyReorder = () => {
    if (!onReorderPlayer || !reorderContext) return;
    const newIdx = parseInt(reorderNewRank, 10) - 1;
    if (isNaN(newIdx) || newIdx < 0 || newIdx >= reorderContext.len) return;
    if (reorderContext.row.index === newIdx) return;
    onReorderPlayer(reorderPilotId, newIdx);
  };

  return (
    <div className="card-racing neon-border overflow-hidden animate-glow-breathe admin-panel-shell flex flex-col">
      <div className="bg-secondary/80 px-6 py-5 border-b border-border flex items-center gap-3 admin-panel-header">
        <Trophy className="h-5 w-5 text-accent" />
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
          Painel Admin
        </h2>
      </div>

      <div className="admin-panel-body">
      <Tabs defaultValue="corridas" className="w-full h-full flex flex-col">
        <TabsList className="w-full grid grid-cols-2 xl:grid-cols-4 gap-2 rounded-none border-b border-border/30 bg-secondary/30 px-4 xl:px-6 py-3 xl:py-4 admin-panel-tabs tabs-list">
          <TabsTrigger
            value="corridas"
            className="tab-trigger text-xs xl:text-sm px-3 xl:px-4 py-2.5 xl:py-3 rounded-md whitespace-nowrap data-[state=active]:bg-primary/25 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/50 border border-transparent transition-all hover:bg-primary/10"
          >
            <Flag className="h-4 w-4 xl:h-5 xl:w-5 mr-1.5 xl:mr-2 shrink-0" />
            <span className="truncate">Corridas</span>
          </TabsTrigger>
          <TabsTrigger
            value="listas"
            className="tab-trigger text-xs xl:text-sm px-3 xl:px-4 py-2.5 xl:py-3 rounded-md whitespace-nowrap data-[state=active]:bg-accent/25 data-[state=active]:text-accent data-[state=active]:border data-[state=active]:border-accent/50 border border-transparent transition-all hover:bg-accent/10"
          >
            <ListOrdered className="h-4 w-4 xl:h-5 xl:w-5 mr-1.5 xl:mr-2 shrink-0" />
            <span className="truncate">Listas</span>
          </TabsTrigger>
          <TabsTrigger
            value="cooldowns"
            className="tab-trigger text-xs xl:text-sm px-3 xl:px-4 py-2.5 xl:py-3 rounded-md whitespace-nowrap data-[state=active]:bg-orange-500/25 data-[state=active]:text-orange-400 data-[state=active]:border data-[state=active]:border-orange-500/50 border border-transparent transition-all hover:bg-orange-500/10"
          >
            <Timer className="h-4 w-4 xl:h-5 xl:w-5 mr-1.5 xl:mr-2 shrink-0" />
            <span className="truncate">Cooldowns</span>
          </TabsTrigger>
          <TabsTrigger
            value="sistema"
            className="tab-trigger text-xs xl:text-sm px-3 xl:px-4 py-2.5 xl:py-3 rounded-md whitespace-nowrap data-[state=active]:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-muted/50 border border-transparent transition-all hover:bg-muted/20"
          >
            <Settings2 className="h-4 w-4 xl:h-5 xl:w-5 mr-1.5 xl:mr-2 shrink-0" />
            <span className="truncate">Sistema</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="corridas" className="p-4 xl:p-6 2xl:p-8 space-y-5 xl:space-y-6 mt-0 border-0 min-h-96 flex-1 overflow-y-auto">
          {pendingInitiationChallenges.length > 0 && (
            <div className="space-y-4 xl:space-y-5 bg-primary/10 rounded-lg border border-primary/30 p-5 xl:p-6 2xl:p-8">
              <div className="flex items-center gap-2 text-xs xl:text-sm font-bold uppercase tracking-wider text-primary">
                <UserPlus className="h-5 w-5 xl:h-6 xl:w-6" />
                Desafios de Entrada
              </div>
              <div className="space-y-4 xl:space-y-5">
                {pendingInitiationChallenges.map(challenge => (
                  <div
                    key={challenge.id}
                    className="bg-background/50 rounded-lg p-4 xl:p-5 2xl:p-6 border border-primary/25 space-y-4 xl:space-y-5"
                  >
                    <div className="flex items-center justify-center gap-2 xl:gap-3 text-base xl:text-lg 2xl:text-xl font-bold text-center py-2">
                      <span className="neon-text-pink truncate">{challenge.challengerName}</span>
                      <span className="text-muted-foreground/50 text-sm xl:text-base shrink-0">vs</span>
                      <span className="neon-text-purple truncate">{challenge.challengedName}</span>
                    </div>
                    <div className="flex gap-3 xl:gap-4">
                      <Button
                        size="sm"
                        className="flex-1 bg-primary/30 text-primary hover:bg-primary/40 border border-primary/50 text-sm xl:text-base font-bold transition-all h-10 xl:h-12"
                        onClick={() => onApproveInitiation(challenge.id)}
                      >
                        <Check className="h-4 w-4 xl:h-5 xl:w-5 mr-2" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-destructive/25 text-destructive hover:bg-destructive/35 border border-destructive/50 text-sm xl:text-base font-bold transition-all h-10 xl:h-12"
                        onClick={() => onRejectInitiation(challenge.id)}
                      >
                        <X className="h-4 w-4 xl:h-5 xl:w-5 mr-2" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingLadderChallenges.length > 0 && (
            <div className="space-y-4 xl:space-y-5 bg-accent/10 rounded-lg border border-accent/30 p-5 xl:p-6 2xl:p-8">
              <div className="flex items-center gap-2 text-xs xl:text-sm font-bold uppercase tracking-wider text-accent">
                <Zap className="h-5 w-5 xl:h-6 xl:w-6" />
                Desafios MD3 Pendentes (24h)
              </div>
              <div className="space-y-4 xl:space-y-5">
                {pendingLadderChallenges.map(challenge => (
                  <div
                    key={challenge.id}
                    className="bg-background/50 rounded-lg p-4 xl:p-5 2xl:p-6 border border-accent/25 space-y-4 xl:space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs xl:text-sm text-muted-foreground/70 uppercase tracking-widest font-bold px-3 py-1.5 bg-secondary/60 rounded">
                        {challenge.listId}
                      </div>
                      <span className="text-xs xl:text-sm font-bold text-accent/80 tracking-wide">MD3</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 xl:gap-3 text-base xl:text-lg 2xl:text-xl font-bold text-center py-2">
                      <span className="neon-text-pink truncate">{challenge.challengerName}</span>
                      <span className="text-muted-foreground/50 text-sm xl:text-base shrink-0">vs</span>
                      <span className="neon-text-purple truncate">{challenge.challengedName}</span>
                    </div>
                    <div className="flex gap-3 xl:gap-4">
                      {onAcceptLadderChallenge && (
                        <Button
                          size="sm"
                          className="flex-1 bg-accent/30 text-accent hover:bg-accent/40 border border-accent/50 text-sm xl:text-base font-bold transition-all h-10 xl:h-12"
                          onClick={() => onAcceptLadderChallenge(challenge.id)}
                        >
                          <Check className="h-4 w-4 xl:h-5 xl:w-5 mr-2" /> Aceitar
                        </Button>
                      )}
                      {onRejectLadderChallenge && (
                        <Button
                          size="sm"
                          className="flex-1 bg-destructive/25 text-destructive hover:bg-destructive/35 border border-destructive/50 text-sm xl:text-base font-bold transition-all h-10 xl:h-12"
                          onClick={() => onRejectLadderChallenge(challenge.id)}
                        >
                          <X className="h-4 w-4 xl:h-5 xl:w-5 mr-2" /> Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeChallenges.length === 0 &&
          pendingInitiationChallenges.length === 0 &&
          pendingLadderChallenges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <p className="text-sm text-muted-foreground/70">🏁 Nenhuma corrida em andamento</p>
              <p className="text-xs text-muted-foreground/50">Aguardando desafios...</p>
            </div>
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
        </TabsContent>

        <TabsContent value="listas" className="p-4 xl:p-6 2xl:p-8 mt-0 border-0 flex-1 overflow-y-auto">
          <Accordion type="multiple" defaultValue={['reorder']} className="space-y-0">
            {onReorderPlayer && pilotRows.length > 0 && (
              <AccordionItem value="reorder" className="border-border px-1">
                <AccordionTrigger className="text-[10px] font-bold uppercase tracking-wider py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-primary">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Mudar posição na lista
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-1 pb-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Piloto
                    </label>
                    <select
                      value={reorderPilotId}
                      onChange={e => setReorderPilotId(e.target.value)}
                      className="custom-select w-full text-xs"
                    >
                      <option value={SEL_NONE} className="text-xs text-muted-foreground">
                        Selecionar…
                      </option>
                      {pilotRows.map(r => (
                        <option key={r.id} value={r.id} className="text-xs">
                          {pilotLabel(r)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {reorderContext && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Nova posição em «{reorderContext.list.title}» (1 = topo)
                      </label>
                      <select
                        value={reorderNewRank}
                        onChange={e => setReorderNewRank(e.target.value)}
                        className="custom-select w-full text-xs"
                      >
                        {Array.from({ length: reorderContext.len }, (_, i) => i + 1).map(r => (
                          <option key={r} value={String(r)} className="text-xs">
                            {r}º
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs bg-primary/20 text-primary border border-primary/30"
                    disabled={reorderPilotId === SEL_NONE || !reorderContext}
                    onClick={applyReorder}
                  >
                    Aplicar nova posição
                  </Button>
                </AccordionContent>
              </AccordionItem>
            )}

            {(onMovePlayer || onDemotePlayer) && (
              <AccordionItem value="cross" className="border-border px-1">
                <AccordionTrigger className="text-[10px] font-bold uppercase tracking-wider py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Subir ou descer de lista
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  {onMovePlayer && list02Players.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <ArrowUpRight className="h-3 w-3" />
                        Lista 02 → Lista 01
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={promotePilotId}
                          onChange={e => setPromotePilotId(e.target.value)}
                          className="custom-select flex-1 h-8 text-xs"
                        >
                          <option value={SEL_NONE} className="text-xs text-muted-foreground">
                            Selecionar…
                          </option>
                          {list02Players.map((p, idx) => (
                            <option key={p.id} value={p.id} className="text-xs">
                              {p.name} · {idx + 1}º L02
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 shrink-0"
                          disabled={promotePilotId === SEL_NONE}
                          onClick={() => {
                            const p = list02Players.find(x => x.id === promotePilotId);
                            if (p) setConfirmAction({ type: 'move', playerName: p.name });
                          }}
                        >
                          Subir
                        </Button>
                      </div>
                      {onAutoPromote && list02Players.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs text-accent border-accent/30 hover:bg-accent/10"
                          onClick={() =>
                            setConfirmAction({ type: 'auto', playerName: list02Players[0]?.name })
                          }
                        >
                          <Zap className="h-3 w-3 mr-1" /> Promover 1º da L02 automaticamente
                        </Button>
                      )}
                    </div>
                  )}

                  {onDemotePlayer && list01Players.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-destructive">
                        <ArrowDownRight className="h-3 w-3" />
                        Lista 01 → Lista 02
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={demotePilotId}
                          onChange={e => setDemotePilotId(e.target.value)}
                          className="custom-select flex-1 h-8 text-xs"
                        >
                          <option value={SEL_NONE} className="text-xs text-muted-foreground">
                            Selecionar…
                          </option>
                          {list01Players.map((p, idx) => (
                            <option key={p.id} value={p.id} className="text-xs">
                              {p.name} · {idx + 1}º L01
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30 shrink-0"
                          disabled={demotePilotId === SEL_NONE}
                          onClick={() => {
                            const p = list01Players.find(x => x.id === demotePilotId);
                            if (p) setConfirmAction({ type: 'demote', playerName: p.name });
                          }}
                        >
                          Descer
                        </Button>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </TabsContent>

        <TabsContent value="cooldowns" className="p-4 xl:p-6 2xl:p-8 space-y-4 xl:space-y-5 mt-0 border-0 flex-1 overflow-y-auto">
          {pilotRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem pilotos nas listas.</p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Piloto
                </label>
                <select
                  value={cooldownPilotId}
                  onChange={e => setCooldownPilotId(e.target.value)}
                  className="custom-select w-full text-xs"
                >
                  <option value={SEL_NONE} className="text-xs text-muted-foreground">
                    Selecionar…
                  </option>
                  {pilotRows.map(r => (
                    <option key={r.id} value={r.id} className="text-xs">
                      {pilotLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-9 text-xs border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                  disabled={cooldownPilotId === SEL_NONE || !onApplyPilotCooldown}
                  onClick={() => {
                    if (cooldownPilotId !== SEL_NONE && onApplyPilotCooldown) {
                      onApplyPilotCooldown(cooldownPilotId);
                    }
                  }}
                >
                  <Timer className="h-3 w-3 mr-1" />
                  Aplicar cooldown
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-9 text-xs border-primary/40 text-primary hover:bg-primary/10"
                  disabled={cooldownPilotId === SEL_NONE || !onClearPilotCooldown}
                  onClick={() => {
                    if (cooldownPilotId !== SEL_NONE && onClearPilotCooldown) {
                      onClearPilotCooldown(cooldownPilotId);
                    }
                  }}
                >
                  <ShieldOff className="h-3 w-3 mr-1" />
                  Remover cooldown deste piloto
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                «Aplicar» usa o cooldown padrão de defesa (como após 2 defesas). «Remover» deixa o piloto disponível e limpa bloqueios de desafio.
              </p>
            </>
          )}
        </TabsContent>

        <TabsContent value="sistema" className="p-4 xl:p-6 2xl:p-8 space-y-3 xl:space-y-4 mt-0 border-0 flex-1 overflow-y-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
            onClick={() => setPilotSettingsOpen(true)}
          >
            <Users className="h-3 w-3 mr-1" /> Configurações de Pilotos
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-green-400 border-green-400/30 hover:bg-green-400/10"
            onClick={onSaveLayout}
          >
            <Save className="h-3 w-3 mr-1" /> Salvar layout atual
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-primary border-primary/30 hover:bg-primary/10"
            onClick={onClearAllCooldowns}
          >
            <ShieldOff className="h-3 w-3 mr-1" /> Limpar todos os cooldowns
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-muted-foreground border-border hover:border-destructive hover:text-destructive"
            onClick={onReset}
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Resetar campeonato
          </Button>
        </TabsContent>
      </Tabs>
      </div>

      <PilotSettingsModal
        open={pilotSettingsOpen}
        onOpenChange={setPilotSettingsOpen}
      />

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={open => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent className="bg-secondary border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {confirmAction?.type === 'auto'
                ? '⚡ Confirmar promoção automática'
                : confirmAction?.type === 'demote'
                  ? '⬇ Confirmar rebaixamento'
                  : '↗ Confirmar subida de lista'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirmAction?.type === 'auto'
                ? `Tem certeza que deseja promover ${confirmAction?.playerName} (1º da Lista 02) para a Lista 01?`
                : confirmAction?.type === 'demote'
                  ? `Tem certeza que deseja rebaixar ${confirmAction?.playerName} da Lista 01 para a Lista 02?`
                  : `Tem certeza que deseja mover ${confirmAction?.playerName} da Lista 02 para a Lista 01?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={`text-xs border ${confirmAction?.type === 'demote' ? 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30' : 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/30'}`}
              onClick={() => {
                if (confirmAction?.type === 'move' && confirmAction.playerName && onMovePlayer) {
                  onMovePlayer(confirmAction.playerName);
                  setPromotePilotId(SEL_NONE);
                } else if (confirmAction?.type === 'auto' && onAutoPromote) {
                  onAutoPromote();
                } else if (confirmAction?.type === 'demote' && confirmAction.playerName && onDemotePlayer) {
                  onDemotePlayer(confirmAction.playerName);
                  setDemotePilotId(SEL_NONE);
                }
                setConfirmAction(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
