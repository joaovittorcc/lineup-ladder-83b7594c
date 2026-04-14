import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Flag, Trophy } from 'lucide-react';
import { TRACKS_LIST } from '@/data/tracks';

interface RaceConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengerName: string;
  challengedName: string;
  onConfirm: (tracks: string[]) => void;
  trackCount?: number;
  matchCount?: number;
  submitLabel?: string;
  descriptionText?: string;
  excludedTracks?: string[];
  initialTracks?: string[];
}

const RaceConfigModal = ({
  open,
  onOpenChange,
  challengerName,
  challengedName,
  onConfirm,
  trackCount = 3,
  matchCount,
  submitLabel,
  descriptionText,
  excludedTracks = [],
  initialTracks = [],
}: RaceConfigModalProps) => {
  const [tracks, setTracks] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      // Initialize with initialTracks or empty strings
      const init = Array.from({ length: trackCount }, (_, i) => initialTracks[i] || '');
      setTracks(init);
    }
  }, [open]);

  // Direct calculations, no memos
  const requiredTrackCount = trackCount;
  const selectedCount = tracks.filter(t => t.trim().length > 0).length;
  const allSelected = selectedCount === requiredTrackCount;
  const effectiveMatchCount = matchCount ?? trackCount;

  const handleConfirm = () => {
    if (allSelected) {
      onConfirm(tracks);
      setTracks([]);
    }
  };

  const getAvailableTracks = (idx: number) => {
    const selected = new Set<string>();
    tracks.forEach((t, i) => {
      if (i !== idx && t.trim()) selected.add(t);
    });
    initialTracks.forEach(t => {
      if (t.trim()) selected.add(t);
    });
    excludedTracks.forEach(t => {
      if (t.trim()) selected.add(t);
    });
    return TRACKS_LIST.filter(t => !selected.has(t));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-racing neon-border max-w-lg !p-0 overflow-hidden race-config-modal-shell flex flex-col">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="neon-text-purple font-['Orbitron'] text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Configuração MD{effectiveMatchCount}
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              <span className="neon-text-pink font-semibold">{challengerName}</span>
              {' '}vs{' '}
              <span className="neon-text-purple font-semibold">{challengedName}</span>
              <br />
              <span className="text-muted-foreground">Formato: Melhor de {effectiveMatchCount}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 space-y-5 py-5 border-t border-border/30">
          <div className="rounded-lg border border-accent/40 bg-accent/15 px-5 py-4 text-sm text-accent">
            <div className="font-bold uppercase tracking-wider mb-2">📋 Instruções</div>
            <div className="text-accent/90 leading-relaxed">
              {descriptionText || (
                trackCount === 1
                  ? 'Escolha a pista inicial. O desafiado escolherá as outras 2 pistas quando aceitar.'
                  : `Escolha ${requiredTrackCount} pista${requiredTrackCount > 1 ? 's' : ''} para completar a MD${effectiveMatchCount}.`
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground">Progresso</span>
              <span className="text-sm font-bold text-accent">{selectedCount}/{requiredTrackCount}</span>
            </div>
            <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${(selectedCount / requiredTrackCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Track selection */}
          <div className="space-y-4">
            {Array.from({ length: trackCount }, (_, slotIndex) => {
              const fixedTrack = initialTracks[slotIndex];
              const currentValue = tracks[slotIndex] || '';
              const isSelected = currentValue.trim().length > 0;
              return (
                <div key={`slot-${slotIndex}`} className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isSelected
                        ? 'bg-accent text-background'
                        : 'bg-secondary/60 text-muted-foreground border border-border/50'
                    }`}>
                      {isSelected ? '✓' : slotIndex + 1}
                    </div>
                    <label htmlFor={`track-select-${slotIndex}`} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Flag className="h-3 w-3 inline mr-1" /> Pista {slotIndex + 1}
                    </label>
                  </div>
                  {fixedTrack ? (
                    <div className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-xs text-accent font-semibold ml-8">
                      {fixedTrack}
                    </div>
                  ) : (
                    <select
                      id={`track-select-${slotIndex}`}
                      name={`track-${slotIndex}`}
                      value={currentValue}
                      onChange={(e) => {
                        const newTracks = [...tracks];
                        newTracks[slotIndex] = e.target.value;
                        setTracks(newTracks);
                      }}
                      className={`ml-10 h-11 w-full custom-select rounded-md border px-4 text-sm transition-all ${
                        isSelected
                          ? 'border-accent/60 bg-accent/10 text-accent font-semibold focus:ring-accent/50'
                          : 'border-border/50 bg-secondary/60 text-foreground focus:ring-accent/30'
                      } focus:outline-none focus:ring-1`}
                    >
                      <option value="">Selecionar pista...</option>
                      {getAvailableTracks(slotIndex).map((track) => (
                        <option key={track} value={track}>
                          {track}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-5 border-t border-border/30 flex justify-end gap-3 bg-secondary/30">
          <Button
            variant="outline"
            size="sm"
            className="text-sm h-10"
            onClick={() => onOpenChange(false)}
          >
            ✕ Cancelar
          </Button>
          <Button
            size="sm"
            className={`text-sm font-bold transition-all h-10 px-5 ${
              allSelected
                ? 'bg-accent/30 text-accent hover:bg-accent/40 border border-accent/50'
                : 'bg-muted/30 text-muted-foreground border border-muted/50 cursor-not-allowed'
            }`}
            onClick={handleConfirm}
            disabled={!allSelected}
          >
            ⚔ {submitLabel || 'Confirmar Desafio'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RaceConfigModal;
