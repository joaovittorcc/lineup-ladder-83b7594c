import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ChallengeTimerProps {
  expiresAt: string;
  compact?: boolean;
}

const ChallengeTimer = ({ expiresAt, compact = false }: ChallengeTimerProps) => {
  const [remaining, setRemaining] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setRemaining('EXPIRADO');
        setIsExpired(true);
        setIsUrgent(true);
        return;
      }

      setIsExpired(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
      setIsUrgent(diff < 2 * 60 * 60 * 1000); // < 2 hours
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold font-['Orbitron'] tabular-nums
        ${isExpired ? 'text-destructive' : isUrgent ? 'text-yellow-400 animate-pulse' : 'text-primary'}`}>
        <Clock className="h-3 w-3" />
        {remaining}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold font-['Orbitron'] tabular-nums
      ${isExpired
        ? 'bg-destructive/10 border-destructive/30 text-destructive'
        : isUrgent
          ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 animate-pulse'
          : 'bg-primary/10 border-primary/30 text-primary'
      }`}>
      {isUrgent ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {remaining}
    </div>
  );
};

export default ChallengeTimer;
