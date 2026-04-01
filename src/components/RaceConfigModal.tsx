import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flag, Trophy } from 'lucide-react';

interface RaceConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengerName: string;
  challengedName: string;
  onConfirm: (tracks: [string, string, string]) => void;
}

const RaceConfigModal = ({
  open,
  onOpenChange,
  challengerName,
  challengedName,
  onConfirm,
}: RaceConfigModalProps) => {
  const [tracks, setTracks] = useState<[string, string, string]>(['', '', '']);

  const handleConfirm = () => {
    onConfirm(tracks);
    setTracks(['', '', '']);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-racing neon-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="neon-text-purple font-['Orbitron'] text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            Configuração MD3
          </DialogTitle>
          <DialogDescription className="text-xs">
            <span className="neon-text-pink font-semibold">{challengerName}</span>
            {' '}vs{' '}
            <span className="neon-text-purple font-semibold">{challengedName}</span>
            <br />
            <span className="text-muted-foreground">Formato: Melhor de 3 (MD3)</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Flag className="h-3 w-3" /> Pista {i + 1}
              </label>
              <Select
                value={tracks[i] || undefined}
                onValueChange={v => {
                  const newTracks = [...tracks] as [string, string, string];
                  newTracks[i] = v;
                  setTracks(newTracks);
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-secondary/60 border-border">
                  <SelectValue placeholder="Selecionar Pista (Em breve)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tbd" disabled>
                    Em breve...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="text-xs bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 font-bold"
            onClick={handleConfirm}
          >
            ⚔ Confirmar Desafio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RaceConfigModal;
