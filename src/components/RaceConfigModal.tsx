import { useState } from 'react';
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
  currentUserName?: string; // Nome do usuário logado
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
  currentUserName,
}: RaceConfigModalProps) => {
  // ✅ ESTADO SIMPLES - Array de 3 strings
  const [selectedTracks, setSelectedTracks] = useState<string[]>(['', '', '']);

  if (!open) return null;

  // ✅ IDENTIFICAÇÃO DE PAPEL
  const isChallenger = currentUserName?.toLowerCase() === challengerName.toLowerCase();
  const isChallenged = currentUserName?.toLowerCase() === challengedName.toLowerCase();
  const isAdmin = !isChallenger && !isChallenged; // Admin pode editar tudo

  // ✅ HANDLER ULTRA SIMPLES - Apenas atualiza estado
  const handleSelectChange = (index: number, value: string) => {
    const newTracks = [...selectedTracks];
    newTracks[index] = value;
    setSelectedTracks(newTracks);
  };

  // ✅ VALIDAÇÃO APENAS NO BOTÃO - Não executa durante render
  const handleConfirm = () => {
    // Monta array final: slot 0 = initialTracks[0] ou selectedTracks[0], slots 1-2 = selectedTracks
    const finalTracks = [
      initialTracks[0] || selectedTracks[0] || '',
      selectedTracks[1],
      selectedTracks[2]
    ];

    // Validação simples
    const allFilled = finalTracks.every(t => t && t.trim());
    const allUnique = new Set(finalTracks).size === 3;

    if (!allFilled) {
      alert('Preencha todas as 3 pistas');
      return;
    }

    if (!allUnique) {
      alert('As 3 pistas devem ser diferentes');
      return;
    }

    onConfirm(finalTracks);
    onOpenChange(false);
    setSelectedTracks(['', '', '']); // Reset
  };

  // ✅ CÁLCULO SIMPLES - Apenas para progresso visual
  const filledCount = (initialTracks[0] ? 1 : 0) + 
                      (selectedTracks[1] ? 1 : 0) + 
                      (selectedTracks[2] ? 1 : 0);
  const progressPercent = (filledCount / 3) * 100;

  // ✅ FILTRO SIMPLES - Executado inline, sem função complexa
  const getOptions = (slotIndex: number) => {
    const used = new Set<string>();
    if (initialTracks[0]) used.add(initialTracks[0]);
    if (selectedTracks[1]) used.add(selectedTracks[1]);
    if (selectedTracks[2]) used.add(selectedTracks[2]);
    excludedTracks.forEach(t => used.add(t));
    
    return TRACKS_LIST.filter(track => !used.has(track));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-racing neon-border max-w-lg !p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="neon-text-purple font-['Orbitron'] text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Configuração MD{matchCount || 3}
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              <span className="neon-text-pink font-semibold">{challengerName}</span>
              {' '}vs{' '}
              <span className="neon-text-purple font-semibold">{challengedName}</span>
              <br />
              <span className="text-muted-foreground">Formato: Melhor de {matchCount || 3}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 space-y-5 py-5 border-t border-border/30">
          <div className="rounded-lg border border-accent/40 bg-accent/15 px-5 py-4 text-sm text-accent">
            <div className="font-bold uppercase tracking-wider mb-2">📋 Instruções</div>
            <div className="text-accent/90 leading-relaxed">
              {descriptionText || 'Escolha as 2 pistas restantes para completar a MD3. A primeira pista já foi selecionada pelo desafiante.'}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground">Progresso</span>
              <span className="text-sm font-bold text-accent">{filledCount}/3</span>
            </div>
            <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-accent/60 to-accent transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Track selection */}
          <div className="space-y-4">
            {/* SLOT 0 - Pista do DESAFIANTE */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  (initialTracks[0] || selectedTracks[0])
                    ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50'
                    : 'bg-secondary/60 text-muted-foreground border border-border/50'
                }`}>
                  {isChallenged ? <Lock className="h-4 w-4" /> : (initialTracks[0] || selectedTracks[0]) ? '✓' : '1'}
                </div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3 w-3 inline" /> 
                  Pista 1 (Desafiante)
                  {isChallenged && <span className="text-orange-500/80">(Bloqueada)</span>}
                </label>
              </div>
              {/* Se já tem initialTracks[0], mostra bloqueado. Senão, mostra select */}
              {initialTracks[0] ? (
                <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-3 text-sm text-orange-500 font-semibold ml-10 flex items-center justify-between">
                  <span>{initialTracks[0]}</span>
                  <Lock className="h-4 w-4 opacity-60" />
                </div>
              ) : (
                <select
                  key="slot-0"
                  value={selectedTracks[0]}
                  onChange={(e) => handleSelectChange(0, e.target.value)}
                  disabled={isChallenged} // ✅ Desafiado NÃO pode escolher pista 1
                  className={`ml-10 h-11 w-full rounded-md border px-4 text-sm transition-all ${
                    selectedTracks[0]
                      ? 'border-orange-500/60 bg-orange-500/10 text-orange-500 font-semibold'
                      : 'border-border/50 bg-secondary/60 text-foreground'
                  } ${isChallenged ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-orange-500/50`}
                >
                  <option value="">Selecionar pista...</option>
                  {getOptions(0).map((track) => (
                    <option key={track} value={track}>
                      {track}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* SLOT 1 - Pista do DESAFIADO */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  selectedTracks[1]
                    ? 'bg-accent text-background'
                    : 'bg-secondary/60 text-muted-foreground border border-border/50'
                }`}>
                  {isChallenger ? <Lock className="h-4 w-4" /> : selectedTracks[1] ? '✓' : '2'}
                </div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3 w-3 inline" /> 
                  Pista 2 (Desafiado)
                  {isChallenger && <span className="text-accent/80">(Bloqueada)</span>}
                </label>
              </div>
              <select
                key="slot-1"
                value={selectedTracks[1]}
                onChange={(e) => handleSelectChange(1, e.target.value)}
                disabled={isChallenger} // ✅ Desafiante NÃO pode escolher pistas 2-3
                className={`ml-10 h-11 w-full rounded-md border px-4 text-sm transition-all ${
                  selectedTracks[1]
                    ? 'border-accent/60 bg-accent/10 text-accent font-semibold'
                    : 'border-border/50 bg-secondary/60 text-foreground'
                } ${isChallenger ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-accent/50`}
              >
                <option value="">Selecionar pista...</option>
                {getOptions(1).map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>

            {/* SLOT 2 - Pista do DESAFIADO */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  selectedTracks[2]
                    ? 'bg-accent text-background'
                    : 'bg-secondary/60 text-muted-foreground border border-border/50'
                }`}>
                  {isChallenger ? <Lock className="h-4 w-4" /> : selectedTracks[2] ? '✓' : '3'}
                </div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3 w-3 inline" /> 
                  Pista 3 (Desafiado)
                  {isChallenger && <span className="text-accent/80">(Bloqueada)</span>}
                </label>
              </div>
              <select
                key="slot-2"
                value={selectedTracks[2]}
                onChange={(e) => handleSelectChange(2, e.target.value)}
                disabled={isChallenger} // ✅ Desafiante NÃO pode escolher pistas 2-3
                className={`ml-10 h-11 w-full rounded-md border px-4 text-sm transition-all ${
                  selectedTracks[2]
                    ? 'border-accent/60 bg-accent/10 text-accent font-semibold'
                    : 'border-border/50 bg-secondary/60 text-foreground'
                } ${isChallenger ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-accent/50`}
              >
                <option value="">Selecionar pista...</option>
                {getOptions(2).map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-border/30 flex justify-end gap-3 bg-secondary/30">
          <Button
            variant="outline"
            size="sm"
            className="text-sm h-10"
            onClick={() => {
              onOpenChange(false);
              setSelectedTracks(['', '', '']);
            }}
          >
            ✕ Cancelar
          </Button>
          <Button
            size="sm"
            className="text-sm font-bold transition-all h-10 px-5 bg-accent/30 text-accent hover:bg-accent/40 border border-accent/50"
            onClick={handleConfirm}
          >
            ⚔ {submitLabel || 'Confirmar Desafio'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RaceConfigModal;
