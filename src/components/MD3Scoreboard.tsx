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

  const challengerLeading = challengerScore > challengedScore;
  const challengedLeading = challengedScore > challengerScore;

  return (
    <div className=" border border-accent/20 bg-secondary/40 relative overflow-hidden">
      {/* Winner overlay */}
      {showConfetti && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/85 backdrop-blur-sm animate-fade-in">
          <div className="text-center space-y-1">
            <Trophy className="h-6 w-6 text-yellow-400 mx-auto animate-bounce" />
            <p className="text-sm font-black font-['Orbitron'] neon-text-pink tracking-wider">VENCEDOR!</p>
            <p className="text-xs font-bold text-accent">{winnerName}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-accent/10 bg-accent/5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap className="h-3 w-3 text-accent shrink-0" />
          <span className="font-bold text-accent text-[9px] uppercase tracking-wider font-['Orbitron'] truncate">
            {formatLabel} — Ao Vivo
          </span>
        </div>
        {!hasWinner && !isInitiation && (
          <span className="text-[9px] text-muted-foreground font-bold uppercase flex items-center gap-1 shrink-0 ml-2">
            <Flag className="h-2.5 w-2.5" /> {currentRound}/{maxRounds}
          </span>
        )}
        {isInitiation && !hasWinner && (
          <span className="text-[9px] text-muted-foreground font-bold uppercase shrink-0 ml-2">
            Vitória Única
          </span>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Current track */}
        {!hasWinner && currentTrack && (
          <p className="text-center text-[10px] text-muted-foreground">
            Pista atual: <span className="font-bold text-foreground">{currentTrack}</span>
          </p>
        )}

        {/* Scoreboard */}
        <div className="flex items-center justify-center gap-2">
          {/* Challenger */}
          <button
            onClick={() => !hasWinner && isAdmin && onAddPoint(challenge.id, 'challenger')}
            disabled={!isAdmin || hasWinner}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border transition-colors min-w-0
              ${challengerLeading
                ? 'bg-accent/15 border-accent/40'
                : 'bg-muted/20 border-border/50'}
              ${isAdmin && !hasWinner ? 'cursor-pointer hover:bg-accent/20 active:bg-accent/25' : 'cursor-default'}
            `}
          >
            <span className={`text-[11px] font-bold truncate max-w-full ${challengerLeading ? 'neon-text-pink' : 'text-foreground'}`}>
              {challenge.challengerName}
            </span>
            <span className={`text-2xl font-black font-['Orbitron'] leading-none ${challengerLeading ? 'text-accent' : 'text-muted-foreground'}`}>
              {challengerScore}
            </span>
          </button>

          <span className="text-muted-foreground/50 font-bold text-sm select-none shrink-0">×</span>

          {/* Challenged */}
          <button
            onClick={() => !hasWinner && isAdmin && onAddPoint(challenge.id, 'challenged')}
            disabled={!isAdmin || hasWinner}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border transition-colors min-w-0
              ${challengedLeading
                ? 'bg-primary/15 border-primary/40'
                : 'bg-muted/20 border-border/50'}
              ${isAdmin && !hasWinner ? 'cursor-pointer hover:bg-primary/20 active:bg-primary/25' : 'cursor-default'}
            `}
          >
            <span className={`text-[11px] font-bold truncate max-w-full ${challengedLeading ? 'neon-text-purple' : 'text-foreground'}`}>
              {challenge.challengedName}
            </span>
            <span className={`text-2xl font-black font-['Orbitron'] leading-none ${challengedLeading ? 'text-primary' : 'text-muted-foreground'}`}>
              {challengedScore}
            </span>
          </button>
        </div>

        {/* Track indicators (MD3 only) */}
        {!isInitiation && challenge.tracks && (
          <div className="flex justify-center gap-1.5">
            {challenge.tracks.map((track, i) => {
              const roundDone = i < (challengerScore + challengedScore);
              const isCurrent = i === (challengerScore + challengedScore) && !hasWinner;
              return (
                <div
                  key={i}
                  className={`flex-1 text-center text-[8px] px-1 py-1 rounded-md border font-bold uppercase tracking-wider transition-colors
                    ${isCurrent ? 'border-accent/50 bg-accent/15 text-accent' : ''}
                    ${roundDone ? 'border-muted/30 bg-muted/10 text-muted-foreground/40 line-through' : ''}
                    ${!isCurrent && !roundDone ? 'border-border/30 bg-muted/5 text-muted-foreground/25' : ''}
                  `}
                >
                  <span className="block text-[7px] opacity-50 leading-tight">P{i + 1}</span>
                  <span className="block truncate leading-tight">{track || '—'}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Admin hint */}
        {isAdmin && !hasWinner && (
          <p className="text-[8px] text-muted-foreground/50 text-center italic">
            Clique no nome/placar para {isInitiation ? 'definir o vencedor' : 'adicionar 1 ponto'}
          </p>
        )}
      </div>
    </div>
  );
};

export default MD3Scoreboard;
