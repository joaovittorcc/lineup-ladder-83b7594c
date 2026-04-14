import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Flag, Trophy, Lock } from 'lucide-react';
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
  }, [open, trackCount, initialTracks]);

  // Direct calculations, no memos
  const requiredTrackCount = trackCount;
  const lockedSlotsCount = initialTracks.filter(t => t.trim()).length;
  const editableSlotsCount = requiredTrackCount - lockedSlotsCount;
  const selectedEditableCount = tracks.filter((t, i) => !initialTracks[i] && t.trim().length > 0).length;
  const allSelected = selectedEditableCount === editableSlotsCount;
  const effectiveMatchCount = matchCount ?? trackCount;

  const handleConfirm = () => {
    if (allSelected) {
      // Merge initialTracks with user selections
      const finalTracks = tracks.map((t, i) => initialTracks[i] || t);
      onConfirm(finalTracks);
      setTracks([]);
    }
  };

  const getAvailableTracks = (idx: number) => {
    const selected = new Set<string>();
    
    // Add all selected tracks from current state
    tracks.forEach((t, i) => {
      if (i !== idx && t.trim()) selected.add(t);
    });
    
    // Add all initial/locked tracks
    initialTracks.forEach(t => {
      if (t.trim()) selected.add(t);
    });
    
    // Add excluded tracks
    excludedTracks.forEach(t => {
      if (t.trim()) selected.add(t);
    });
    
    return TRACKS_LIST.filter(t => !selected.has(t));
  };

  // Check if all tracks are unique
  const hasUniqueSelections = () => {
    const allTracks = tracks.map((t, i) => initialTracks[i] || t).filter(t => t.trim());
    const uniqueTracks = new Set(allTracks);
    return allTracks.length === uniqueTracks.size;
  };

  const isValidSelection = allSelected && hasUniqueSelections();

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
                  : lockedSlotsCount > 0
                    ? `Escolha as ${editableSlotsCount} pista${editableSlotsCount > 1 ? 's' : ''} restante${editableSlotsCount > 1 ? 's' : ''} para completar a MD${effectiveMatchCount}. A primeira pista já foi selecionada pelo desafiante.`
                    : `Escolha ${requiredTrackCount} pista${requiredTrackCount > 1 ? 's' : ''} diferentes para completar a MD${effectiveMatchCount}.`
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground">Progresso</span>
              <span className="text-sm font-bold text-accent">
                {lockedSlotsCount + selectedEditableCount}/{requiredTrackCount}
              </span>
            </div>
            <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-accent/60 to-accent transition-all duration-300"
                style={{ width: `${((lockedSlotsCount + selectedEditableCount) / requiredTrackCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Track selection */}
          <div className="space-y-4">
            {Array.from({ length: trackCount }, (_, slotIndex) => {
              const fixedTrack = initialTracks[slotIndex];
              const currentValue = tracks[slotIndex] || '';
              const isLocked = !!fixedTrack;
              const isSelected = isLocked || currentValue.trim().length > 0;
              
              return (
                <div key={`slot-${slotIndex}`} className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isSelected
                        ? isLocked
                          ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50'
                          : 'bg-accent text-background'
                        : 'bg-secondary/60 text-muted-foreground border border-border/50'
                    }`}>
                      {isLocked ? <Lock className="h-4 w-4" /> : isSelected ? '✓' : slotIndex + 1}
                    </div>
                    <label htmlFor={`track-select-${slotIndex}`} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Flag className="h-3 w-3 inline" /> 
                      Pista {slotIndex + 1}
                      {isLocked && <span className="text-orange-500/80">(Bloqueada)</span>}
                    </label>
                  </div>
                  {fixedTrack ? (
                    <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-3 text-sm text-orange-500 font-semibold ml-10 flex items-center justify-between">
                      <span>{fixedTrack}</span>
                      <Lock className="h-4 w-4 opacity-60" />
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

          {/* Validation message */}
          {!hasUniqueSelections() && selectedEditableCount > 0 && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              ⚠️ Todas as pistas devem ser diferentes
            </div>
          )}
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
              isValidSelection
                ? 'bg-accent/30 text-accent hover:bg-accent/40 border border-accent/50'
                : 'bg-muted/30 text-muted-foreground border border-muted/50 cursor-not-allowed'
            }`}
            onClick={handleConfirm}
            disabled={!isValidSelection}
          >
            ⚔ {submitLabel || 'Confirmar Desafio'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RaceConfigModal;
