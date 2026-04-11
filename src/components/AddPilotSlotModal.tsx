import { useMemo, useState } from 'react';
import type { PlayerList } from '@/types/championship';
import { authorizedUsers, getRoleLabel, type AuthUser } from '@/data/users';
import { getAllocatableCandidates } from '@/lib/playerAllocation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PilotSlotTarget = {
  listId: string;
  listTitle: string;
  insertIndex: number;
};

interface AddPilotSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: PilotSlotTarget | null;
  lists: PlayerList[];
  onAllocate: (
    displayName: string,
    listId: string,
    insertIndex: number,
    initiationComplete: boolean
  ) => Promise<string | null>;
}

const AddPilotSlotModal = ({
  open,
  onOpenChange,
  target,
  lists,
  onAllocate,
}: AddPilotSlotModalProps) => {
  const [initiationComplete, setInitiationComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  const candidates = useMemo(() => {
    if (!target) return [];
    return getAllocatableCandidates(target.listId, lists, authorizedUsers).sort((a, b) =>
      a.displayName.localeCompare(b.displayName, 'pt', { sensitivity: 'base' })
    );
  }, [target, lists]);

  const selectedUser = selectedUsername
    ? candidates.find(u => u.username === selectedUsername)
    : undefined;

  const isInitiation = target?.listId === 'initiation';

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedUsername(null);
      setInitiationComplete(false);
      setSubmitting(false);
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!target || !selectedUser) return;
    setSubmitting(true);
    try {
      const err = await onAllocate(
        selectedUser.displayName.trim(),
        target.listId,
        target.insertIndex,
        isInitiation ? initiationComplete : false
      );
      if (!err) handleOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border gap-3">
        <DialogHeader>
          <DialogTitle className="text-sm font-['Orbitron'] tracking-wide uppercase">
            Alocar piloto
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {target ? (
              <>
                Lista: <strong className="text-foreground">{target.listTitle}</strong> — posição{' '}
                <strong className="text-foreground">{target.insertIndex + 1}º</strong>
                {isInitiation && (
                  <span className="block mt-1">
                    Podes escolher pilotos da Lista 01, 02 ou ainda não colocados na iniciação.
                  </span>
                )}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-3">
            <Command className="rounded-lg border border-border bg-secondary/40">
              <CommandInput placeholder="Pesquisar piloto…" className="h-9 text-xs" />
              <CommandList className="max-h-52">
                <CommandEmpty className="text-xs py-6 text-center text-muted-foreground">
                  Nenhum piloto disponível para esta lista.
                </CommandEmpty>
                <CommandGroup>
                  {candidates.map(u => (
                    <CommandItem
                      key={u.username}
                      value={`${u.displayName} ${u.username} ${getRoleLabel(u.role)}`}
                      className="text-xs cursor-pointer"
                      onSelect={() => setSelectedUsername(u.username)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-3.5 w-3.5 shrink-0',
                          selectedUsername === u.username ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-1 flex-col min-w-0">
                        <span className="truncate font-medium">{u.displayName}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          @{u.username} · {getRoleLabel(u.role)}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>

            {isInitiation && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={initiationComplete}
                  onCheckedChange={v => setInitiationComplete(v === true)}
                />
                Iniciação já completa
              </label>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={submitting}
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs bg-accent/20 text-accent hover:bg-accent/30 border border-accent/40"
                disabled={!selectedUser || submitting}
                onClick={handleConfirm}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> A guardar…
                  </>
                ) : (
                  'Confirmar'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddPilotSlotModal;
