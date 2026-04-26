import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Flag, Trophy, Lock, Loader2 } from 'lucide-react';
import { TRACKS_LIST } from '@/data/tracks';

interface RaceConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengerName: string;
  challengedName: string;
  onConfirm: (tracks: string[]) => void;
  trackCount?: number;
  matchCount?: number; // 3 para MD3, 5 para MD5
  submitLabel?: string;
  descriptionText?: string;
  excludedTracks?: string[];
  initialTracks?: string[];
  currentUserName?: string;
  challengeType?: 'ladder' | 'initiation';
}

const RaceConfigModal = ({
  open,
  onOpenChange,
  challengerName,
  challengedName,
  onConfirm,
  trackCount = 3,
  matchCount = 3, // Padrão MD3
  submitLabel,
  descriptionText,
  excludedTracks = [],
  initialTracks = [],
  currentUserName,
  challengeType = 'ladder',
}: RaceConfigModalProps) => {
  // 🛡️ Proteção: não renderiza se modal fechado ou dados faltando
  if (!open) return null;
  if (!challengerName || !challengedName) {
    console.warn('⚠️ RaceConfigModal: Dados críticos ausentes');
    return null;
  }

  // 🎯 Detecção de modo
  const isInitiation = challengeType === 'initiation';
  const totalSlots = isInitiation ? 1 : matchCount; // MD1=1, MD3=3, MD5=5

  // ✅ Estado dinâmico: array com tamanho baseado em matchCount
  const [selectedTracks, setSelectedTracks] = useState<string[]>(() => {
    const initial = Array(totalSlots).fill('');
    if (Array.isArray(initialTracks) && initialTracks.length > 0) {
      initialTracks.forEach((track, idx) => {
        if (idx < totalSlots && track) initial[idx] = track;
      });
    }
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ Normalização
  const safeInitialTracks = useMemo(() => {
    if (!Array.isArray(initialTracks)) return Array(totalSlots).fill('');
    return initialTracks.map(t => (t && typeof t === 'string' ? t : ''));
  }, [initialTracks, totalSlots]);

  const safeExcludedTracks = useMemo(() => {
    if (!Array.isArray(excludedTracks)) return [];
    return excludedTracks.filter(t => t && typeof t === 'string');
  }, [excludedTracks]);

  const safeCurrentUserName = currentUserName || '';
  const safeChallengerName = challengerName || '';
  const safeChallengedName = challengedName || '';

  // ✅ Identificação de papel
  const isChallenger = safeCurrentUserName.toLowerCase() === safeChallengerName.toLowerCase();
  const isChallenged = safeCurrentUserName.toLowerCase() === safeChallengedName.toLowerCase();
  const isAdmin = !isChallenger && !isChallenged;

  // 🎯 LÓGICA DE BLOQUEIO DINÂMICA
  /**
   * MD1 (Iniciação): 1 slot, sem bloqueio
   * MD3: 3 slots
   *   - Slot 0: Desafiante (bloqueado para desafiado)
   *   - Slots 1-2: Desafiado (bloqueados para desafiante)
   * MD5: 5 slots
   *   - Slots 0-1: Desafiante (bloqueados para desafiado)
   *   - Slots 2-4: Desafiado (bloqueados para desafiante)
   */
  const getSlotOwner = (slotIndex: number): 'challenger' | 'challenged' => {
    if (isInitiation) return 'challenger'; // MD1: apenas desafiante escolhe
    if (matchCount === 3) {
      // MD3: slot 0 = desafiante, slots 1-2 = desafiado
      return slotIndex === 0 ? 'challenger' : 'challenged';
    }
    // MD5: slots 0-1 = desafiante, slots 2-4 = desafiado
    return slotIndex <= 1 ? 'challenger' : 'challenged';
  };

  const isSlotDisabled = (slotIndex: number): boolean => {
    if (isAdmin) return false; // Admin pode editar tudo
    if (isInitiation) return false; // MD1: sem bloqueio
    
    const owner = getSlotOwner(slotIndex);
    if (isChallenger) return owner === 'challenged'; // Desafiante não pode editar slots do desafiado
    if (isChallenged) return owner === 'challenger'; // Desafiado não pode editar slots do desafiante
    return false;
  };

  const getSlotLabel = (slotIndex: number): string => {
    if (isInitiation) return 'Pista de Iniciação';
    const owner = getSlotOwner(slotIndex);
    return `Pista ${slotIndex + 1} (${owner === 'challenger' ? 'Desafiante' : 'Desafiado'})`;
  };

  // 🛡️ Loading state
  if (isSubmitting) {
    return (
      <Dialog open={open} onOpenChange={(newOpen) => !newOpen && !isSubmitting && onOpenChange(false)}>
        <DialogContent className="card-racing neon-border max-w-lg">
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-accent" />
            <div className="space-y-2">
              <p className="text-lg font-bold text-accent">Processando aceite...</p>
              <p className="text-sm text-muted-foreground">Aguarde enquanto sincronizamos com o servidor</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ✅ Handler dinâmico
  const handleSelectChange = (index: number, value: string) => {
    if (index < 0 || index >= totalSlots) return;
    const newTracks = [...selectedTracks];
    newTracks[index] = value;
    setSelectedTracks(newTracks);
  };

  // ✅ Validação dinâmica
  const canSubmit = useMemo(() => {
    if (isInitiation) {
      // MD1: apenas slot 0 precisa estar preenchido
      const track = safeInitialTracks[0] || selectedTracks[0];
      return !!(track && track.trim());
    }

    if (isChallenger) {
      // 🎯 DESAFIANTE: Precisa preencher APENAS seus slots
      // MD3: slot 0 (1 pista)
      // MD5: slots 0-1 (2 pistas)
      const challengerSlots = Array.from({ length: totalSlots }, (_, i) => i)
        .filter(i => getSlotOwner(i) === 'challenger');
      
      const allChallengerSlotsFilled = challengerSlots.every(i => {
        const track = safeInitialTracks[i] || selectedTracks[i];
        return track && track.trim();
      });

      console.log('🔍 [RaceConfigModal] Validação Desafiante:');
      console.log('  - matchCount:', matchCount);
      console.log('  - challengerSlots:', challengerSlots);
      console.log('  - selectedTracks:', selectedTracks);
      console.log('  - allChallengerSlotsFilled:', allChallengerSlotsFilled);

      return allChallengerSlotsFilled;
    }

    if (isChallenged) {
      // 🎯 DESAFIADO: Precisa preencher APENAS seus slots
      // MD3: slots 1-2 (2 pistas)
      // MD5: slots 2-4 (3 pistas)
      const challengedSlots = Array.from({ length: totalSlots }, (_, i) => i)
        .filter(i => getSlotOwner(i) === 'challenged');
      
      const allChallengedSlotsFilled = challengedSlots.every(i => {
        const track = safeInitialTracks[i] || selectedTracks[i];
        const isValid = track && track.trim();
        console.log(`  - Slot ${i}: track="${track}", isValid=${isValid}`);
        return isValid;
      });

      console.log('🔍 [RaceConfigModal] Validação Desafiado:');
      console.log('  - matchCount:', matchCount);
      console.log('  - challengedSlots:', challengedSlots);
      console.log('  - selectedTracks:', selectedTracks);
      console.log('  - safeInitialTracks:', safeInitialTracks);
      console.log('  - allChallengedSlotsFilled:', allChallengedSlotsFilled);

      return allChallengedSlotsFilled;
    }

    // Admin: todos os slots precisam estar preenchidos
    return selectedTracks.every(t => t && t.trim());
  }, [selectedTracks, safeInitialTracks, isChallenger, isChallenged, isInitiation, totalSlots, matchCount, getSlotOwner]);

  // 🛡️ Handler de confirmação
  const handleConfirm = async () => {
    if (isSubmitting) return;

    console.log('🚀 [RaceConfigModal] handleConfirm iniciado');
    console.log('  - isChallenger:', isChallenger);
    console.log('  - isChallenged:', isChallenged);
    console.log('  - isAdmin:', isAdmin);
    console.log('  - matchCount:', matchCount);
    console.log('  - totalSlots:', totalSlots);
    console.log('  - selectedTracks:', selectedTracks);
    console.log('  - safeInitialTracks:', safeInitialTracks);

    try {
      setIsSubmitting(true);

      // Monta array final preservando pistas iniciais (pistas bloqueadas têm prioridade)
      const finalTracks = Array.from({ length: totalSlots }, (_, idx) => {
        // Pistas iniciais (bloqueadas) têm prioridade
        if (safeInitialTracks[idx] && safeInitialTracks[idx].trim()) {
          return safeInitialTracks[idx];
        }
        // Senão, usa a pista selecionada pelo usuário
        return selectedTracks[idx] || '';
      });

      console.log('  - finalTracks:', finalTracks);

      // 🎯 VALIDAÇÃO ESPECÍFICA POR PAPEL
      if (isChallenger) {
        // Desafiante: valida apenas seus slots
        const challengerSlots = Array.from({ length: totalSlots }, (_, i) => i)
          .filter(i => getSlotOwner(i) === 'challenger');
        
        console.log('  - challengerSlots:', challengerSlots);
        
        const challengerTracks = challengerSlots.map(i => finalTracks[i]).filter(t => t && t.trim());
        
        console.log('  - challengerTracks:', challengerTracks);
        console.log('  - challengerSlots.length:', challengerSlots.length);
        console.log('  - challengerTracks.length:', challengerTracks.length);
        
        if (challengerTracks.length !== challengerSlots.length) {
          const msg = `Preencha ${challengerSlots.length === 1 ? 'a pista' : `as ${challengerSlots.length} pistas`} do desafiante`;
          console.log('❌ Validação falhou:', msg);
          alert(msg);
          setIsSubmitting(false);
          return;
        }

        // Validação de unicidade (apenas nas pistas do desafiante)
        if (new Set(challengerTracks).size !== challengerTracks.length) {
          console.log('❌ Validação falhou: pistas duplicadas');
          alert('As pistas devem ser diferentes');
          setIsSubmitting(false);
          return;
        }
      } else if (isChallenged) {
        // Desafiado: valida apenas seus slots
        const challengedSlots = Array.from({ length: totalSlots }, (_, i) => i)
          .filter(i => getSlotOwner(i) === 'challenged');
        
        console.log('  - challengedSlots:', challengedSlots);
        
        const challengedTracks = challengedSlots.map(i => finalTracks[i]).filter(t => t && t.trim());
        
        console.log('  - challengedTracks:', challengedTracks);
        console.log('  - challengedSlots.length:', challengedSlots.length);
        console.log('  - challengedTracks.length:', challengedTracks.length);
        
        if (challengedTracks.length !== challengedSlots.length) {
          const msg = `Preencha ${challengedSlots.length === 1 ? 'a pista' : `as ${challengedSlots.length} pistas`} do desafiado`;
          console.log('❌ Validação falhou:', msg);
          alert(msg);
          setIsSubmitting(false);
          return;
        }

        // Validação de unicidade (todas as pistas)
        const allFilledTracks = finalTracks.filter(t => t && t.trim());
        if (new Set(allFilledTracks).size !== allFilledTracks.length) {
          console.log('❌ Validação falhou: pistas duplicadas');
          alert('As pistas devem ser diferentes');
          setIsSubmitting(false);
          return;
        }
      } else {
        // Admin: valida todos os slots
        const filledTracks = finalTracks.filter(t => t && t.trim());
        
        console.log('  - filledTracks (admin):', filledTracks);
        console.log('  - totalSlots:', totalSlots);
        
        if (filledTracks.length !== totalSlots) {
          const msg = `Preencha todas as ${totalSlots} pistas`;
          console.log('❌ Validação falhou:', msg);
          alert(msg);
          setIsSubmitting(false);
          return;
        }

        // Validação de unicidade
        if (new Set(filledTracks).size !== filledTracks.length) {
          console.log('❌ Validação falhou: pistas duplicadas');
          alert('As pistas devem ser diferentes');
          setIsSubmitting(false);
          return;
        }
      }

      console.log('✅ Validação passou, chamando onConfirm');
      await onConfirm(finalTracks);
      onOpenChange(false);
      setSelectedTracks(Array(totalSlots).fill(''));
      setIsSubmitting(false);
    } catch (error) {
      console.error('❌ Erro ao confirmar desafio:', error);
      alert('Erro ao processar desafio. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  // ✅ Progresso dinâmico
  const filledCount = selectedTracks.filter((t, idx) => {
    const track = t || safeInitialTracks[idx];
    return track && track.trim();
  }).length;
  const progressPercent = (filledCount / totalSlots) * 100;

  // ✅ Filtro de opções
  const getOptions = (slotIndex: number) => {
    const used = new Set<string>();
    selectedTracks.forEach((t, idx) => {
      if (idx !== slotIndex && t) used.add(t);
    });
    safeInitialTracks.forEach((t, idx) => {
      if (idx !== slotIndex && t) used.add(t);
    });
    safeExcludedTracks.forEach(t => used.add(t));
    return TRACKS_LIST.filter(track => !used.has(track));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-racing neon-border max-w-lg !p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="neon-text-purple font-['Orbitron'] text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              {isInitiation ? 'Desafio de Iniciação' : `Configuração ${matchCount === 5 ? 'MD5' : 'MD3'}`}
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              <span className="neon-text-pink font-semibold">{safeChallengerName}</span>
              {' '}vs{' '}
              <span className="neon-text-purple font-semibold">{safeChallengedName}</span>
              <br />
              <span className="text-muted-foreground">
                {isInitiation ? 'Desafio de Iniciação (1 pista)' : `Formato: Melhor de ${matchCount}`}
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 space-y-5 py-5 border-t border-border/30">
          <div className="rounded-lg border border-accent/40 bg-accent/15 px-5 py-4 text-sm text-accent">
            <div className="font-bold uppercase tracking-wider mb-2">📋 Instruções</div>
            <div className="text-accent/90 leading-relaxed">
              {descriptionText || (isInitiation 
                ? 'Escolha 1 pista para o desafio de iniciação.' 
                : `Escolha as pistas para completar a MD${matchCount}.`
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground">Progresso</span>
              <span className="text-sm font-bold text-accent">{filledCount}/{totalSlots}</span>
            </div>
            <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-accent/60 to-accent transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 🎯 RENDERIZAÇÃO DINÂMICA DE SLOTS */}
          <div className="space-y-4">
            {Array.from({ length: totalSlots }).map((_, slotIndex) => {
              const isDisabled = isSlotDisabled(slotIndex);
              const currentValue = selectedTracks[slotIndex] || '';
              const initialValue = safeInitialTracks[slotIndex] || '';
              const hasValue = currentValue || initialValue;
              const owner = getSlotOwner(slotIndex);
              const isLocked = initialValue && !isAdmin && owner === 'challenger' && isChallenged;

              return (
                <div key={slotIndex} className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      hasValue
                        ? owner === 'challenger'
                          ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50'
                          : 'bg-accent/20 text-accent border border-accent/50'
                        : 'bg-secondary/60 text-muted-foreground border border-border/50'
                    }`}>
                      {isDisabled || isLocked ? <Lock className="h-4 w-4" /> : hasValue ? '✓' : slotIndex + 1}
                    </div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Flag className="h-3 w-3 inline" /> 
                      {getSlotLabel(slotIndex)}
                      {(isDisabled || isLocked) && <span className="text-accent/80">(Bloqueada)</span>}
                    </label>
                  </div>

                  {isLocked ? (
                    // Pista bloqueada (já preenchida pelo desafiante)
                    <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ml-10 flex items-center justify-between ${
                      owner === 'challenger'
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
                        : 'border-accent/50 bg-accent/10 text-accent'
                    }`}>
                      <span>{initialValue}</span>
                      <Lock className="h-4 w-4 opacity-60" />
                    </div>
                  ) : (
                    // Select editável
                    <select
                      value={currentValue}
                      onChange={(e) => handleSelectChange(slotIndex, e.target.value)}
                      disabled={isDisabled}
                      className={`ml-10 h-11 w-full rounded-md border px-4 text-sm transition-all ${
                        hasValue
                          ? owner === 'challenger'
                            ? 'border-orange-500/60 bg-orange-500/10 text-orange-500 font-semibold'
                            : 'border-accent/60 bg-accent/10 text-accent font-semibold'
                          : 'border-border/50 bg-secondary/60 text-foreground'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 ${
                        owner === 'challenger' ? 'focus:ring-orange-500/50' : 'focus:ring-accent/50'
                      }`}
                    >
                      <option value="">Selecionar pista...</option>
                      {getOptions(slotIndex).map((track: string) => (
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
            onClick={() => {
              onOpenChange(false);
              setSelectedTracks(Array(totalSlots).fill(''));
              setIsSubmitting(false);
            }}
            disabled={isSubmitting}
          >
            ✕ Cancelar
          </Button>
          <Button
            size="sm"
            className={`text-sm font-bold transition-all h-10 px-5 ${
              canSubmit && !isSubmitting
                ? 'bg-accent/30 text-accent hover:bg-accent/40 border border-accent/50'
                : 'bg-muted/30 text-muted-foreground border border-muted/50 cursor-not-allowed opacity-50'
            }`}
            onClick={handleConfirm}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>⚔ {submitLabel || 'Confirmar Desafio'}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RaceConfigModal;
