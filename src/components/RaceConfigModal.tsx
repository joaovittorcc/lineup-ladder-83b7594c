import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { TRACKS_LIST } from '@/data/tracks';

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

  const allSelected = tracks.every(t => t !== '');

  const handleConfirm = () => {
    onConfirm(tracks);
    setTracks(['', '', '']);
  };

  // Get tracks already selected in other slots to avoid duplicates
  const getAvailableTracks = (currentIndex: number) => {
    const selected = tracks.filter((t, i) => i !== currentIndex && t !== '');
    return TRACKS_LIST.filter(t => !selected.includes(t));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-racing neon-border max-w-sm !p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
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
        </div>

        <div className="px-5 space-y-3 py-3 border-t border-border/30">
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-1.5">
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
                <SelectTrigger className="h-9 text-xs bg-secondary/60 border-border focus:ring-accent/30">
                  <SelectValue placeholder="Selecionar pista..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {getAvailableTracks(i).map(track => (
                    <SelectItem key={track} value={track} className="text-xs">
                      {track}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-border/30 flex justify-end gap-2">
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
            disabled={!allSelected}
          >
            ⚔ Confirmar Desafio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RaceConfigModal;
