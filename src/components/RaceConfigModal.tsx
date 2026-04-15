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
  matchCount?: number;
  submitLabel?: string;
  descriptionText?: string;
  excludedTracks?: string[];
  initialTracks?: string[];
  currentUserName?: string; // Nome do usuário logado
  challengeType?: 'ladder' | 'initiation'; // Tipo de desafio
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
  challengeType = 'ladder', // Padrão: ladder (MD3)
}: RaceConfigModalProps) => {
  // 🛡️ TRAVA 1: PROTEÇÃO DE RENDERIZAÇÃO - Antes de QUALQUER hook
  // Se modal não está aberto, retorna null imediatamente
  if (!open) return null;

  // 🛡️ TRAVA 1.1: Validação de dados críticos ANTES de hooks
  // Se dados essenciais estão faltando, retorna null (não renderiza)
  if (!challengerName || !challengedName) {
    console.warn('⚠️ RaceConfigModal: Dados críticos ausentes, aguardando sincronização...');
    return null;
  }

  // 🎯 DETECÇÃO DE MODO: MD1 (Iniciação) vs MD3 (Ladder)
  const isInitiation = challengeType === 'initiation';
  const requiredTracksCount = isInitiation ? 1 : 3;

  // ✅ ESTADO SIMPLES - Inicializa com initialTracks se disponível
  // 🛡️ CORREÇÃO: Usa initialTracks do desafio para preservar pista 1
  const [selectedTracks, setSelectedTracks] = useState<string[]>(() => {
    // Se initialTracks tem dados, usa eles (preserva pista 1 do desafiante)
    if (Array.isArray(initialTracks) && initialTracks.length > 0) {
      return [
        initialTracks[0] || '',
        initialTracks[1] || '',
        initialTracks[2] || ''
      ];
    }
    // Senão, inicia vazio
    return ['', '', ''];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ TRAVA 2: NORMALIZAÇÃO DEFENSIVA DE TRACKS
  // Garante que initialTracks é sempre um array válido com strings
  const safeInitialTracks = (() => {
    try {
      if (!Array.isArray(initialTracks)) return ['', '', ''];
      // Normaliza cada elemento para string vazia se for null/undefined
      return initialTracks.map(t => (t && typeof t === 'string' ? t : ''));
    } catch (error) {
      console.error('❌ Erro ao normalizar initialTracks:', error);
      return ['', '', ''];
    }
  })();

  const safeExcludedTracks = (() => {
    try {
      if (!Array.isArray(excludedTracks)) return [];
      return excludedTracks.filter(t => t && typeof t === 'string');
    } catch (error) {
      console.error('❌ Erro ao normalizar excludedTracks:', error);
      return [];
    }
  })();

  // 🛡️ TRAVA 2.1: Normalização de strings críticas
  const safeCurrentUserName = (currentUserName && typeof currentUserName === 'string') ? currentUserName : '';
  const safeChallengerName = (challengerName && typeof challengerName === 'string') ? challengerName : '';
  const safeChallengedName = (challengedName && typeof challengedName === 'string') ? challengedName : '';

  // 🛡️ TRAVA 2.2: Cria array de tracks atual normalizado
  // Este é o array que será usado em TODO o componente
  const currentTracks = [
    safeInitialTracks[0] || '',
    safeInitialTracks[1] || '',
    safeInitialTracks[2] || ''
  ];

  // ✅ IDENTIFICAÇÃO DE PAPEL (com proteção)
  const isChallenger = safeCurrentUserName.toLowerCase() === safeChallengerName.toLowerCase();
  const isChallenged = safeCurrentUserName.toLowerCase() === safeChallengedName.toLowerCase();
  const isAdmin = !isChallenger && !isChallenged; // Admin pode editar tudo

  // 🛡️ TRAVA 4: FEEDBACK DE CARREGAMENTO
  // Se está processando, mostra spinner em vez de formulário
  if (isSubmitting) {
    return (
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen && !isSubmitting) {
          onOpenChange(false);
        }
      }}>
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

  // ✅ HANDLER ULTRA SIMPLES - Apenas atualiza estado (com proteção)
  const handleSelectChange = (index: number, value: string) => {
    try {
      if (typeof index !== 'number' || index < 0 || index > 2) {
        console.error('❌ Índice inválido:', index);
        return;
      }
      if (typeof value !== 'string') {
        console.error('❌ Valor inválido:', value);
        return;
      }
      const newTracks = [...selectedTracks];
      newTracks[index] = value;
      setSelectedTracks(newTracks);
    } catch (error) {
      console.error('❌ Erro ao atualizar pista:', error);
      // Não deixa o erro subir - apenas loga
    }
  };

  // ✅ VALIDAÇÃO CONDICIONAL POR PAPEL (useMemo para performance)
  const canSubmit = useMemo(() => {
    try {
      // 🎯 VALIDAÇÃO DINÂMICA: MD1 vs MD3
      if (isInitiation) {
        // MD1 (Iniciação): Apenas 1 pista necessária
        const pista1 = currentTracks[0] || selectedTracks[0] || '';
        return !!(pista1 && pista1.trim());
      }

      // MD3 (Ladder): Validação por papel
      const pista1 = currentTracks[0] || selectedTracks[0] || '';
      const pista2 = selectedTracks[1] || '';
      const pista3 = selectedTracks[2] || '';

      if (isChallenger) {
        // Desafiante SÓ precisa preencher a primeira pista para enviar
        return !!(pista1 && pista1.trim());
      }
      
      if (isChallenged) {
        // Desafiado PRECISA preencher as 2 pistas restantes
        return !!(pista2 && pista2.trim() && pista3 && pista3.trim());
      }
      
      // Admin: todas as 3 pistas precisam estar preenchidas
      return !!(pista1 && pista1.trim() && pista2 && pista2.trim() && pista3 && pista3.trim());
    } catch (error) {
      console.error('❌ Erro na validação canSubmit:', error);
      return false;
    }
  }, [selectedTracks, currentTracks, isChallenger, isChallenged, isInitiation]);

  // 🛡️ TRAVA 3: TRATAMENTO DE ERRO NO ACEITE - Try/Catch Robusto
  const handleConfirm = async () => {
    // Previne múltiplas submissões
    if (isSubmitting) {
      console.warn('⚠️ Já está processando, ignorando clique duplicado');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🔄 Iniciando aceite de desafio...');

      // 🎯 LÓGICA DINÂMICA: MD1 vs MD3
      if (isInitiation) {
        // MD1 (Iniciação): Envia apenas 1 pista
        const pista1 = currentTracks[0] || selectedTracks[0] || '';
        
        if (!pista1 || !pista1.trim()) {
          alert('Escolha a pista para o desafio de iniciação');
          setIsSubmitting(false);
          return;
        }
        
        console.log('📤 Enviando desafio de iniciação (MD1):', [pista1]);
        await onConfirm([pista1]);
        
        console.log('✅ Desafio de iniciação aceito com sucesso');
        onOpenChange(false);
        setSelectedTracks(['', '', '']);
        setIsSubmitting(false);
        return;
      }

      // MD3 (Ladder): Lógica por papel
      if (isChallenger) {
        // Desafiante: envia apenas Pista 1, as outras ficam vazias
        const pista1 = currentTracks[0] || selectedTracks[0] || '';
        
        if (!pista1 || !pista1.trim()) {
          alert('Escolha a Pista 1');
          setIsSubmitting(false);
          return;
        }
        
        console.log('📤 Enviando como desafiante:', [pista1, '', '']);
        // Payload parcial: [pista1, '', '']
        await onConfirm([pista1, '', '']);
        
        console.log('✅ Desafio enviado com sucesso');
        onOpenChange(false);
        setSelectedTracks(['', '', '']);
        setIsSubmitting(false);
        return;
      }
      
      if (isChallenged) {
        // Desafiado: completa com Pistas 2 e 3
        // 🛡️ CORREÇÃO: PRESERVA a pista 1 do desafiante (currentTracks[0])
        const pista1 = currentTracks[0] || selectedTracks[0] || '';
        const pista2 = selectedTracks[1] || '';
        const pista3 = selectedTracks[2] || '';
        
        if (!pista2 || !pista2.trim() || !pista3 || !pista3.trim()) {
          alert('Escolha as Pistas 2 e 3');
          setIsSubmitting(false);
          return;
        }
        
        // Verifica unicidade
        const allTracks = [pista1, pista2, pista3].filter(t => t && t.trim());
        if (new Set(allTracks).size !== allTracks.length) {
          alert('As pistas devem ser diferentes');
          setIsSubmitting(false);
          return;
        }
        
        // 🛡️ CRÍTICO: Envia array COMPLETO preservando pista 1
        // Payload completo: [pista1_do_desafiante, pista2_escolhida, pista3_escolhida]
        console.log('📤 Enviando como desafiado (PRESERVANDO pista 1):', [pista1, pista2, pista3]);
        await onConfirm([pista1, pista2, pista3]);
        
        console.log('✅ Desafio aceito com sucesso');
        onOpenChange(false);
        setSelectedTracks(['', '', '']);
        setIsSubmitting(false);
        return;
      }
      
      // Admin: envia todas as 3 pistas
      const finalTracks = [
        currentTracks[0] || selectedTracks[0] || '',
        selectedTracks[1] || '',
        selectedTracks[2] || ''
      ];

      const allFilled = finalTracks.every(t => t && t.trim());
      const allUnique = new Set(finalTracks).size === 3;

      if (!allFilled) {
        alert('Preencha todas as 3 pistas');
        setIsSubmitting(false);
        return;
      }

      if (!allUnique) {
        alert('As 3 pistas devem ser diferentes');
        setIsSubmitting(false);
        return;
      }

      console.log('📤 Enviando como admin:', finalTracks);
      await onConfirm(finalTracks);
      
      console.log('✅ Desafio confirmado com sucesso');
      onOpenChange(false);
      setSelectedTracks(['', '', '']);
      setIsSubmitting(false);
      
    } catch (error) {
      // 🛡️ CAPTURA QUALQUER ERRO - Não deixa subir para quebrar o React
      console.error('❌ ERRO CRÍTICO capturado no aceite:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      // Mostra mensagem amigável ao usuário
      alert(
        'Erro ao processar desafio.\n\n' +
        'Por favor:\n' +
        '1. Recarregue a página (F5)\n' +
        '2. Tente novamente\n' +
        '3. Se persistir, contate o suporte'
      );
      
      // Reseta estado para permitir nova tentativa
      setIsSubmitting(false);
      
      // NÃO fecha o modal - deixa usuário tentar novamente ou cancelar
      // onOpenChange(false); // ← Comentado propositalmente
    }
  };

  // ✅ CÁLCULO SIMPLES - Apenas para progresso visual (com proteção)
  const filledCount = (() => {
    try {
      // 🎯 CÁLCULO DINÂMICO: MD1 vs MD3
      if (isInitiation) {
        // MD1: Apenas conta pista 1
        return (currentTracks[0] || selectedTracks[0] ? 1 : 0);
      }
      
      // MD3: Conta todas as 3 pistas
      return (currentTracks[0] || selectedTracks[0] ? 1 : 0) + 
             (selectedTracks[1] ? 1 : 0) + 
             (selectedTracks[2] ? 1 : 0);
    } catch (error) {
      console.error('❌ Erro ao calcular progresso:', error);
      return 0;
    }
  })();
  
  const progressPercent = (filledCount / requiredTracksCount) * 100;

  // ✅ FILTRO SIMPLES - Executado inline, sem função complexa (com proteção)
  const getOptions = (slotIndex: number) => {
    try {
      const used = new Set<string>();
      
      // Usa currentTracks normalizado em vez de acessar diretamente
      if (currentTracks[0]) used.add(currentTracks[0]);
      if (selectedTracks[1]) used.add(selectedTracks[1]);
      if (selectedTracks[2]) used.add(selectedTracks[2]);
      
      // Adiciona pistas excluídas
      safeExcludedTracks.forEach(t => {
        if (t && typeof t === 'string') used.add(t);
      });
      
      return TRACKS_LIST.filter(track => !used.has(track));
    } catch (error) {
      console.error('❌ Erro ao filtrar pistas:', error);
      // Retorna lista completa em caso de erro (melhor que crashar)
      return TRACKS_LIST;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-racing neon-border max-w-lg !p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="neon-text-purple font-['Orbitron'] text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              {isInitiation ? 'Desafio de Iniciação' : `Configuração MD${matchCount || 3}`}
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              <span className="neon-text-pink font-semibold">{safeChallengerName}</span>
              {' '}vs{' '}
              <span className="neon-text-purple font-semibold">{safeChallengedName}</span>
              <br />
              <span className="text-muted-foreground">
                {isInitiation ? 'Desafio de Iniciação (1 pista)' : `Formato: Melhor de ${matchCount || 3}`}
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
                : 'Escolha as 2 pistas restantes para completar a MD3. A primeira pista já foi selecionada pelo desafiante.'
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground">Progresso</span>
              <span className="text-sm font-bold text-accent">{filledCount}/{requiredTracksCount}</span>
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
                  (currentTracks[0] || selectedTracks[0])
                    ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50'
                    : 'bg-secondary/60 text-muted-foreground border border-border/50'
                }`}>
                  {isChallenged ? <Lock className="h-4 w-4" /> : (currentTracks[0] || selectedTracks[0]) ? '✓' : '1'}
                </div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3 w-3 inline" /> 
                  Pista 1 (Desafiante)
                  {isChallenged && <span className="text-orange-500/80">(Bloqueada)</span>}
                </label>
              </div>
              {/* 🛡️ Usa currentTracks normalizado - NUNCA acessa initialTracks diretamente */}
              {currentTracks[0] ? (
                <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-3 text-sm text-orange-500 font-semibold ml-10 flex items-center justify-between">
                  <span>{currentTracks[0]}</span>
                  <Lock className="h-4 w-4 opacity-60" />
                </div>
              ) : (
                <select
                  key="slot-0"
                  value={selectedTracks[0] || ''}
                  onChange={(e) => handleSelectChange(0, e.target.value)}
                  disabled={isChallenged} // ✅ Desafiado NÃO pode escolher pista 1
                  className={`ml-10 h-11 w-full rounded-md border px-4 text-sm transition-all ${
                    selectedTracks[0]
                      ? 'border-orange-500/60 bg-orange-500/10 text-orange-500 font-semibold'
                      : 'border-border/50 bg-secondary/60 text-foreground'
                  } ${isChallenged ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-orange-500/50`}
                >
                  <option value="">Selecionar pista...</option>
                  {getOptions(0).map((track: string) => (
                    <option key={track} value={track}>
                      {track}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* SLOT 1 - Pista do DESAFIADO (apenas para MD3) */}
            {!isInitiation && (
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
                  value={selectedTracks[1] || ''}
                  onChange={(e) => handleSelectChange(1, e.target.value)}
                  disabled={isChallenger} // ✅ Desafiante NÃO pode escolher pistas 2-3
                  className={`ml-10 h-11 w-full rounded-md border px-4 text-sm transition-all ${
                    selectedTracks[1]
                      ? 'border-accent/60 bg-accent/10 text-accent font-semibold'
                      : 'border-border/50 bg-secondary/60 text-foreground'
                  } ${isChallenger ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-accent/50`}
                >
                  <option value="">Selecionar pista...</option>
                  {getOptions(1).map((track: string) => (
                    <option key={track} value={track}>
                      {track}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SLOT 2 - Pista do DESAFIADO (apenas para MD3) */}
            {!isInitiation && (
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
                  value={selectedTracks[2] || ''}
                  onChange={(e) => handleSelectChange(2, e.target.value)}
                  disabled={isChallenger} // ✅ Desafiante NÃO pode escolher pistas 2-3
                  className={`ml-10 h-11 w-full rounded-md border px-4 text-sm transition-all ${
                    selectedTracks[2]
                      ? 'border-accent/60 bg-accent/10 text-accent font-semibold'
                      : 'border-border/50 bg-secondary/60 text-foreground'
                  } ${isChallenger ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-accent/50`}
                >
                  <option value="">Selecionar pista...</option>
                  {getOptions(2).map((track: string) => (
                    <option key={track} value={track}>
                      {track}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
