import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { ALL_ROLES, getRoleLabel, type PilotRole } from '@/data/users';
import { UserCog, Star, ShieldOff, Save, Trash2, RotateCcw, UserX } from 'lucide-react';
import RoleBadge from '@/components/RoleBadge';
import type { Player } from '@/types/championship';
import { clearStreetRunnerList02UnlockAt, clearJokerInitiationCooldownUntil } from '@/lib/ladderPilotMeta';

export type LadderPilotContext = Player & { listTitle: string; listId: string };

interface ManagePilotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pilotName: string;
  currentRole: PilotRole;
  currentElo: number;
  onChangeRole: (name: string, newRole: PilotRole) => void;
  onEditElo: (name: string, newElo: number) => void;
  onResetCooldown: (name: string) => void;
  ladderPlayer?: LadderPilotContext | null;
  jokerProgressCount?: number;
  onAdminPatchPlayer?: (playerId: string, patch: Record<string, unknown>) => Promise<void>;
  onClearJokerProgress?: (nameKey: string) => Promise<void>;
  /** ELO base + overrides + meta local + joker BD + campos de lista (exceto remover da lista). */
  onResetProfile?: (name: string) => void | Promise<void>;
  /** Apaga o piloto desta lista na BD e reindexa. */
  onRemoveFromList?: () => Promise<string | null>;
}

function isoFromMs(ms: number | null | undefined): string {
  if (ms == null) return '';
  try {
    return new Date(ms).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

function msFromIsoLocal(s: string): number | null {
  if (!s.trim()) return null;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}

const ManagePilotModal = ({
  open,
  onOpenChange,
  pilotName,
  currentRole,
  currentElo,
  onChangeRole,
  onEditElo,
  onResetCooldown,
  ladderPlayer,
  jokerProgressCount = 0,
  onAdminPatchPlayer,
  onClearJokerProgress,
  onResetProfile,
  onRemoveFromList,
}: ManagePilotModalProps) => {
  const [selectedRole, setSelectedRole] = useState<PilotRole>(currentRole);
  const [eloValue, setEloValue] = useState(String(currentElo));
  const [defenseCount, setDefenseCount] = useState(String(ladderPlayer?.defenseCount ?? 0));
  const [cooldownIso, setCooldownIso] = useState('');
  const [challengeCdIso, setChallengeCdIso] = useState('');
  const [blockExtIso, setBlockExtIso] = useState('');
  const [eligibleExtIso, setEligibleExtIso] = useState('');
  const [seventhStreak, setSeventhStreak] = useState(String(ladderPlayer?.defensesWhileSeventhStreak ?? 0));
  const [initiationComplete, setInitiationComplete] = useState(Boolean(ladderPlayer?.initiationComplete));

  const [confirmJokerDbOpen, setConfirmJokerDbOpen] = useState(false);
  const [confirmJokerLocalOpen, setConfirmJokerLocalOpen] = useState(false);
  const [confirmSrLocalOpen, setConfirmSrLocalOpen] = useState(false);
  const [confirmProfileOpen, setConfirmProfileOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);

  useEffect(() => {
    setSelectedRole(currentRole);
    setEloValue(String(currentElo));
  }, [currentRole, currentElo, pilotName]);

  useEffect(() => {
    if (!ladderPlayer) return;
    setDefenseCount(String(ladderPlayer.defenseCount));
    setCooldownIso(isoFromMs(ladderPlayer.cooldownUntil));
    setChallengeCdIso(isoFromMs(ladderPlayer.challengeCooldownUntil));
    setBlockExtIso(isoFromMs(ladderPlayer.list02ExternalBlockUntil));
    setEligibleExtIso(isoFromMs(ladderPlayer.list02ExternalEligibleAfter));
    setSeventhStreak(String(ladderPlayer.defensesWhileSeventhStreak ?? 0));
    setInitiationComplete(Boolean(ladderPlayer.initiationComplete));
  }, [ladderPlayer]);

  const handleSaveRole = () => {
    if (selectedRole !== currentRole) {
      onChangeRole(pilotName, selectedRole);
    }
  };

  const handleSaveElo = () => {
    const val = parseInt(eloValue, 10);
    if (!isNaN(val) && val >= 0 && val !== currentElo) {
      onEditElo(pilotName, val);
    }
  };

  const applyLadderPatch = async () => {
    if (!ladderPlayer || !onAdminPatchPlayer) return;
    const dc = parseInt(defenseCount, 10);
    const isoOrNull = (s: string) => {
      const t = s.trim() === '' ? null : msFromIsoLocal(s);
      return t == null ? null : new Date(t).toISOString();
    };
    const patch: Record<string, unknown> = {
      defense_count: Number.isFinite(dc) ? dc : ladderPlayer.defenseCount,
      defenses_while_seventh_streak: parseInt(seventhStreak, 10) || 0,
      cooldown_until: isoOrNull(cooldownIso),
      challenge_cooldown_until: isoOrNull(challengeCdIso),
      list02_external_block_until: isoOrNull(blockExtIso),
      list02_external_eligible_after: isoOrNull(eligibleExtIso),
      initiation_complete: initiationComplete,
    };
    await onAdminPatchPlayer(ladderPlayer.id, patch);
  };

  const runClearJokerDb = async () => {
    if (!onClearJokerProgress) return;
    setPendingAction(true);
    try {
      await onClearJokerProgress(pilotName.toLowerCase());
      setConfirmJokerDbOpen(false);
    } finally {
      setPendingAction(false);
    }
  };

  const runResetProfile = async () => {
    if (!onResetProfile) return;
    setPendingAction(true);
    try {
      await Promise.resolve(onResetProfile(pilotName));
      setConfirmProfileOpen(false);
      onOpenChange(false);
    } finally {
      setPendingAction(false);
    }
  };

  const runRemoveFromList = async () => {
    if (!onRemoveFromList) return;
    setPendingAction(true);
    try {
      const err = await onRemoveFromList();
      setConfirmRemoveOpen(false);
      if (!err) onOpenChange(false);
    } finally {
      setPendingAction(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md neon-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider font-['Orbitron'] neon-text-pink">
              <UserCog className="h-4 w-4" />
              Gerenciar Piloto
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Gerenciando: <span className="font-bold text-foreground">{pilotName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Cargo actual:</span>
              <RoleBadge playerName={pilotName} role={currentRole} size="md" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Star className="h-3 w-3 text-primary" /> Alterar Cargo
              </label>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as PilotRole)}>
                  <SelectTrigger className="h-9 text-xs bg-secondary/60 border-border flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map(role => (
                      <SelectItem key={role} value={role} className="text-xs">
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-9 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                  onClick={handleSaveRole}
                  disabled={selectedRole === currentRole}
                >
                  <Save className="h-3 w-3 mr-1" /> Salvar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Star className="h-3 w-3 text-orange-400" /> ELO amistoso (ranking)
              </label>
              <p className="text-[10px] text-muted-foreground/90">
                Pontos do ranking de amistosos (<code className="text-[10px]">elo_ratings</code>), não do campeonato por posição.
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  value={eloValue}
                  onChange={e => setEloValue(e.target.value)}
                  className="h-9 text-xs bg-secondary/60 border-border flex-1"
                />
                <Button
                  size="sm"
                  className="h-9 text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30"
                  onClick={handleSaveElo}
                  disabled={parseInt(eloValue, 10) === currentElo || isNaN(parseInt(eloValue, 10))}
                >
                  <Save className="h-3 w-3 mr-1" /> Salvar
                </Button>
              </div>
            </div>

            {(jokerProgressCount > 0 || currentRole === 'joker') && onClearJokerProgress && (
              <div className="space-y-2 rounded-md border border-border/60 p-3 bg-secondary/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Iniciação Joker — vitórias na BD: <span className="text-foreground">{jokerProgressCount}</span>
                </p>
                {onClearJokerProgress && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs text-destructive border-destructive/30"
                    onClick={() => setConfirmJokerDbOpen(true)}
                    disabled={jokerProgressCount === 0}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Zerar progresso Joker (apaga linhas na BD)
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs"
                  onClick={() => setConfirmJokerLocalOpen(true)}
                >
                  Limpar cooldown pós-derrota MD1 (localStorage)
                </Button>
              </div>
            )}

            <div className="space-y-2 rounded-md border border-border/60 p-3 bg-secondary/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Street Runner — debut L02</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => setConfirmSrLocalOpen(true)}
              >
                Limpar cooldown de estreia L02 (localStorage)
              </Button>
            </div>

            {/* SEÇÃO 1: INICIAÇÃO (SEPARADA) - DISPONÍVEL PARA TODOS */}
            {onAdminPatchPlayer && (
              <div className="space-y-3 rounded-md border border-green-500/30 p-3 bg-green-500/5">
                <p className="text-[10px] font-bold uppercase text-green-400 tracking-wider">
                  ✓ Iniciação Completa
                </p>
                
                <div className="flex items-start gap-3 rounded-md border border-border/50 bg-background/40 p-3">
                  <Checkbox
                    id="initiation-complete"
                    checked={initiationComplete}
                    onCheckedChange={v => setInitiationComplete(v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="initiation-complete" className="text-xs leading-snug cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Completou a lista de iniciação</span>
                      {initiationComplete && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-green-400 px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/30">
                          ✓ Elegível Vaga Lista 2
                        </span>
                      )}
                    </div>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                      Marca que o piloto completou a lista de iniciação.
                    </span>
                  </label>
                </div>

                <Button 
                  size="sm" 
                  className="w-full h-9 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30" 
                  onClick={async () => {
                    if (!onAdminPatchPlayer) return;
                    
                    // Se tem ladderPlayer, usa o ID dele
                    if (ladderPlayer) {
                      await onAdminPatchPlayer(ladderPlayer.id, {
                        initiation_complete: initiationComplete,
                      });
                      return;
                    }
                    
                    // Se não tem ladderPlayer, busca o piloto pelo nome no banco
                    try {
                      const { supabase } = await import('@/integrations/supabase/client');
                      
                      // Busca com ILIKE para case-insensitive
                      const { data: players, error } = await supabase
                        .from('players')
                        .select('id, name')
                        .ilike('name', pilotName.trim());
                      
                      if (error) {
                        console.error('Erro ao buscar piloto:', error);
                        alert(`Erro ao buscar piloto: ${error.message}`);
                        return;
                      }
                      
                      if (!players || players.length === 0) {
                        console.error('Piloto não encontrado:', pilotName);
                        alert(`Piloto "${pilotName}" não encontrado no banco de dados. Ele precisa estar cadastrado primeiro.`);
                        return;
                      }
                      
                      // Se encontrou múltiplos, usa o primeiro
                      const player = players[0];
                      console.log('Piloto encontrado:', player);
                      
                      await onAdminPatchPlayer(player.id, {
                        initiation_complete: initiationComplete,
                      });
                      
                      alert('Status de iniciação salvo com sucesso!');
                    } catch (err) {
                      console.error('Erro ao salvar:', err);
                      alert('Erro ao salvar. Verifique o console.');
                    }
                  }}
                >
                  <Save className="h-3 w-3 mr-1" /> Salvar Status de Iniciação
                </Button>
                
                {!ladderPlayer && (
                  <p className="text-[10px] text-muted-foreground/80">
                    ℹ️ Este piloto não está em nenhuma lista, mas pode ter a iniciação marcada.
                  </p>
                )}
              </div>
            )}

            {ladderPlayer && onAdminPatchPlayer && (
              <>
                <div className="space-y-3 rounded-md border border-primary/20 p-3 bg-primary/5">
                  <p className="text-[10px] font-bold uppercase text-primary tracking-wider">
                    Lista: {ladderPlayer.listTitle} · {ladderPlayer.listId}
                  </p>
                  <p className="text-[10px] text-muted-foreground">id: {ladderPlayer.id}</p>

                  <div className="grid gap-2">
                    <label className="text-[9px] uppercase text-muted-foreground">defense_count</label>
                    <Input className="h-8 text-xs" value={defenseCount} onChange={e => setDefenseCount(e.target.value)} />
                    <label className="text-[9px] uppercase text-muted-foreground">defenses_while_seventh (L02 — último lugar)</label>
                    <Input className="h-8 text-xs" value={seventhStreak} onChange={e => setSeventhStreak(e.target.value)} />
                    <label className="text-[9px] uppercase text-muted-foreground">cooldown_until (local)</label>
                    <Input className="h-8 text-xs" type="datetime-local" value={cooldownIso} onChange={e => setCooldownIso(e.target.value)} />
                    <label className="text-[9px] uppercase text-muted-foreground">challenge_cooldown_until</label>
                    <Input className="h-8 text-xs" type="datetime-local" value={challengeCdIso} onChange={e => setChallengeCdIso(e.target.value)} />
                    <label className="text-[9px] uppercase text-muted-foreground">list02_external_block_until</label>
                    <Input className="h-8 text-xs" type="datetime-local" value={blockExtIso} onChange={e => setBlockExtIso(e.target.value)} />
                    <label className="text-[9px] uppercase text-muted-foreground">list02_external_eligible_after</label>
                    <Input className="h-8 text-xs" type="datetime-local" value={eligibleExtIso} onChange={e => setEligibleExtIso(e.target.value)} />
                  </div>
                  
                  <Button size="sm" className="w-full h-9 text-xs" onClick={() => void applyLadderPatch()}>
                    <Save className="h-3 w-3 mr-1" /> Aplicar Campos de Lista na BD
                  </Button>
                </div>
              </>
            )}

            <div className="space-y-2 rounded-md border border-destructive/25 p-3 bg-destructive/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-destructive/90">Controlo total (admin)</p>
              {onResetProfile && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-9 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmProfileOpen(true)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Resetar perfil (ELO, overrides, meta, joker BD, lista)
                </Button>
              )}
              {ladderPlayer && onRemoveFromList && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-9 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmRemoveOpen(true)}
                >
                  <UserX className="h-3 w-3 mr-1" /> Remover piloto desta lista (apaga vaga na BD)
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldOff className="h-3 w-3 text-accent" /> Cooldown rápido
              </label>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9 text-xs text-accent border-accent/30 hover:bg-accent/10"
                onClick={() => {
                  onResetCooldown(pilotName);
                  onOpenChange(false);
                }}
              >
                <ShieldOff className="h-3 w-3 mr-1" /> Limpar estado de corrida / cooldown (lista)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmJokerDbOpen} onOpenChange={setConfirmJokerDbOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Zerar progresso Joker?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove todas as entradas de <code className="text-xs">joker_progress</code> para{' '}
              <strong>{pilotName}</strong>. Isto não altera desafios já concluídos no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={pendingAction}
              onClick={e => {
                e.preventDefault();
                void runClearJokerDb();
              }}
            >
              Apagar na BD
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmJokerLocalOpen} onOpenChange={setConfirmJokerLocalOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar cooldown Joker (local)?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove a chave de localStorage do cooldown após derrota na iniciação (MD1) para este piloto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={e => {
                e.preventDefault();
                clearJokerInitiationCooldownUntil(pilotName);
                setConfirmJokerLocalOpen(false);
              }}
            >
              Limpar localStorage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSrLocalOpen} onOpenChange={setConfirmSrLocalOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar debut Street Runner (local)?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove o bloqueio local de 3 dias antes do 1º desafio à Lista 02.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                clearStreetRunnerList02UnlockAt(pilotName);
                setConfirmSrLocalOpen(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmProfileOpen} onOpenChange={setConfirmProfileOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar perfil de {pilotName}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Serão aplicados: ELO amistoso para o valor base (1000), remoção do override de cargo em memória,
                  limpeza de meta local (Street Runner / Joker), progresso Joker na BD, e na lista — estado disponível,
                  contagens e cooldowns a zero, iniciação marcada como <strong>não completa</strong>.
                </p>
                <p className="text-destructive/90 font-medium">Não remove o piloto da lista; usa &quot;Remover desta lista&quot; se precisares disso.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={pendingAction}
              onClick={e => {
                e.preventDefault();
                void runResetProfile();
              }}
            >
              Resetar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {pilotName} da lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Apaga o registo na tabela <code className="text-xs">players</code>, desafios ligados e progresso Joker onde
              era alvo; as posições dos restantes são reindexadas. Esta acção não tem volta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={pendingAction}
              onClick={e => {
                e.preventDefault();
                void runRemoveFromList();
              }}
            >
              Remover da BD
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManagePilotModal;
