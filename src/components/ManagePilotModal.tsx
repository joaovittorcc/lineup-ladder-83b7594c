import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_ROLES, getRoleLabel, type PilotRole } from '@/data/users';
import { UserCog, Star, ShieldOff, Save } from 'lucide-react';
import RoleBadge from '@/components/RoleBadge';

interface ManagePilotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pilotName: string;
  currentRole: PilotRole;
  currentElo: number;
  onChangeRole: (name: string, newRole: PilotRole) => void;
  onEditElo: (name: string, newElo: number) => void;
  onResetCooldown: (name: string) => void;
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
}: ManagePilotModalProps) => {
  const [selectedRole, setSelectedRole] = useState<PilotRole>(currentRole);
  const [eloValue, setEloValue] = useState(String(currentElo));

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm neon-border">
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
          {/* Current role display */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Cargo atual:</span>
            <RoleBadge playerName={pilotName} role={currentRole} size="md" />
          </div>

          {/* Change Role */}
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

          {/* Edit ELO */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Star className="h-3 w-3 text-orange-400" /> Editar Pontuação ELO
            </label>
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

          {/* Reset Cooldown */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldOff className="h-3 w-3 text-accent" /> Resetar Cooldown
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
              <ShieldOff className="h-3 w-3 mr-1" /> Limpar Cooldown deste Piloto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePilotModal;
