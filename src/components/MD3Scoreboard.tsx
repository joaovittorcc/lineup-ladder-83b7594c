import { Challenge } from '@/types/championship';
import { Flag, Trophy, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MD3ScoreboardProps {
  challenge: Challenge;
  isAdmin: boolean;
  onAddPoint: (challengeId: string, side: 'challenger' | 'challenged') => void;
}

const MD3Scoreboard = ({ challenge, isAdmin, onAddPoint }: MD3ScoreboardProps) => {
  const [challengerScore, challengedScore] = challenge.score || [0, 0];
  const isInitiation = challenge.type === 'initiation';
  const winThreshold = isInitiation ? 1 : 2;
  const maxRounds = isInitiation ? 1 : 3;
  const currentRound = challengerScore + challengedScore + 1;
  const hasWinner = challengerScore >= winThreshold || challengedScore >= winThreshold;
  const winnerName = challengerScore >= winThreshold ? challenge.challengerName : challengedScore >= winThreshold ? challenge.challengedName : null;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (hasWinner) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [hasWinner]);

  const currentTrack = challenge.tracks?.[Math.min(currentRound - 1, 2)] || null;
  const formatLabel = isInitiation ? 'MD1' : 'MD3';

  return (
    <div className="bg-secondary/50 rounded-lg p-4 border border-accent/20 space-y-3 relative overflow-hidden">
      {/* Winner confetti overlay */}
      {showConfetti && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center space-y-1">
            <Trophy className="h-8 w-8 text-yellow-400 mx-auto animate-bounce" />
            <p className="text-lg font-black font-['Orbitron'] neon-text-pink tracking-wider">VENCEDOR!</p>
            <p className="text-sm font-bold text-accent">{winnerName}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 text-sm">
        <Zap className="h-3.5 w-3.5 text-accent" />
        <span className="font-bold text-accent text-[10px] uppercase tracking-wider">{formatLabel} — Ao Vivo</span>
        {!hasWinner && !isInitiation && (
          <span className="ml-auto text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
            <Flag className="h-2.5 w-2.5" /> Rodada {currentRound}/{maxRounds}
          </span>
        )}
        {isInitiation && !hasWinner && (
          <span className="ml-auto text-[10px] text-muted-foreground font-bold uppercase">
            Vitória Única
          </span>
        )}
      </div>

      {/* Current track */}
      {!hasWinner && currentTrack && (
        <div className="text-center text-[10px] text-muted-foreground">
          Pista atual: <span className="font-bold text-foreground">{currentTrack}</span>
        </div>
      )}

      {/* Scoreboard */}
      <div className="flex items-center justify-center gap-4">
        {/* Challenger */}
        <button
          onClick={() => !hasWinner && isAdmin && onAddPoint(challenge.id, 'challenger')}
          disabled={!isAdmin || hasWinner}
          className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all
            ${challengerScore > challengedScore ? 'bg-accent/20 border border-accent/40 shadow-[0_0_15px_hsl(var(--accent)/0.3)]' : 'bg-muted/30 border border-border'}
            ${isAdmin && !hasWinner ? 'cursor-pointer hover:scale-105 hover:bg-accent/25 active:scale-95' : 'cursor-default'}
          `}
        >
          <span className={`text-xs font-bold tracking-wide ${challengerScore > challengedScore ? 'neon-text-pink' : 'text-foreground'}`}>
            {challenge.challengerName}
          </span>
          <span className={`text-2xl font-black font-['Orbitron'] transition-all ${challengerScore > challengedScore ? 'text-accent scale-110' : 'text-muted-foreground'}`}>
            {challengerScore}
          </span>
        </button>

        <span className="text-muted-foreground font-bold text-lg">×</span>

        {/* Challenged */}
        <button
          onClick={() => !hasWinner && isAdmin && onAddPoint(challenge.id, 'challenged')}
          disabled={!isAdmin || hasWinner}
          className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all
            ${challengedScore > challengerScore ? 'bg-primary/20 border border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.3)]' : 'bg-muted/30 border border-border'}
            ${isAdmin && !hasWinner ? 'cursor-pointer hover:scale-105 hover:bg-primary/25 active:scale-95' : 'cursor-default'}
          `}
        >
          <span className={`text-xs font-bold tracking-wide ${challengedScore > challengerScore ? 'neon-text-purple' : 'text-foreground'}`}>
            {challenge.challengedName}
          </span>
          <span className={`text-2xl font-black font-['Orbitron'] transition-all ${challengedScore > challengerScore ? 'text-primary scale-110' : 'text-muted-foreground'}`}>
            {challengedScore}
          </span>
        </button>
      </div>

      {/* Track indicators (only for MD3) */}
      {!isInitiation && challenge.tracks && (
        <div className="flex justify-center gap-2">
          {challenge.tracks.map((track, i) => {
            const roundDone = i < (challengerScore + challengedScore);
            const isCurrent = i === (challengerScore + challengedScore) && !hasWinner;
            return (
              <div
                key={i}
                className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider transition-all
                  ${isCurrent ? 'border-accent/50 bg-accent/15 text-accent' : ''}
                  ${roundDone ? 'border-muted bg-muted/20 text-muted-foreground line-through' : ''}
                  ${!isCurrent && !roundDone ? 'border-border bg-muted/10 text-muted-foreground/50' : ''}
                `}
              >
                P{i + 1}{track ? `: ${track}` : ''}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin hint */}
      {isAdmin && !hasWinner && (
        <p className="text-[9px] text-muted-foreground text-center italic">
          Clique no nome/placar para {isInitiation ? 'definir o vencedor' : 'adicionar 1 ponto'}
        </p>
      )}
    </div>
  );
};

export default MD3Scoreboard;
