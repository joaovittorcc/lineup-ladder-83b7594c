import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import ChallengeTimer from '@/components/ChallengeTimer';
import { AlertTriangle, Check, X, Swords } from 'lucide-react';

type DbChallenge = Tables<'challenges'>;

interface PendingChallengeNotificationProps {
  challenges: DbChallenge[];
  loggedNick: string | null;
  isAdmin: boolean;
  onAccept: (challengeId: string) => void;
  onDecline: (challengeId: string) => void;
  onForceWO: (challengeId: string) => void;
}

const PendingChallengeNotification = ({
  challenges,
  loggedNick,
  isAdmin,
  onAccept,
  onDecline,
  onForceWO,
}: PendingChallengeNotificationProps) => {
  if (challenges.length === 0) return null;

  // Filter challenges relevant to the logged user
  const myChallenges = loggedNick
    ? challenges.filter(c => c.challenged_name.toLowerCase() === loggedNick.toLowerCase())
    : [];

  const otherChallenges = loggedNick
    ? challenges.filter(c => c.challenged_name.toLowerCase() !== loggedNick.toLowerCase())
    : challenges;

  return (
    <div className="space-y-2">
      {/* Challenges where I'M the one being challenged */}
      {myChallenges.map(challenge => (
        <div
          key={challenge.id}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 rounded-xl
            bg-yellow-400/10 border border-yellow-400/30 animate-pulse-slow"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-yellow-400 truncate">
                [!] VOCÊ FOI DESAFIADO!
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{challenge.challenger_name}</span> desafiou você
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ChallengeTimer expiresAt={challenge.expires_at} compact />
            <Button
              size="sm"
              className="h-7 text-[10px] px-3 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 font-bold"
              onClick={() => onAccept(challenge.id)}
            >
              <Check className="h-3 w-3 mr-1" /> Aceitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] px-3 text-muted-foreground border-border hover:border-destructive hover:text-destructive"
              onClick={() => onDecline(challenge.id)}
            >
              <X className="h-3 w-3 mr-1" /> Recusar
            </Button>
          </div>
        </div>
      ))}

      {/* Admin view: other pending challenges */}
      {isAdmin && otherChallenges.map(challenge => (
        <div
          key={challenge.id}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 rounded-xl
            bg-accent/5 border border-accent/20"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Swords className="h-4 w-4 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold neon-text-pink">{challenge.challenger_name}</span>
                {' → '}
                <span className="font-semibold neon-text-purple">{challenge.challenged_name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ChallengeTimer expiresAt={challenge.expires_at} compact />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] px-3 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10 font-bold"
              onClick={() => onForceWO(challenge.id)}
            >
              ⚡ Forçar W.O.
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] px-3 text-muted-foreground border-border hover:border-destructive hover:text-destructive"
              onClick={() => onDecline(challenge.id)}
            >
              <X className="h-3 w-3 mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingChallengeNotification;
