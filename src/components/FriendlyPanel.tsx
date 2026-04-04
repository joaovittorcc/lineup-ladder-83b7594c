import { useState } from 'react';
import { Flame, Swords, Trophy, Check, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FriendlyMatch } from '@/types/championship';

interface FriendlyPanelProps {
  allPlayerNames: string[];
  isAdmin: boolean;
  loggedNick: string | null;
  pendingFriendly: {
    id: string;
    challengerName: string;
    challengedName: string;
    status: 'pending' | 'racing';
    createdAt: number;
  } | null;
  getPlayerElo: (name: string) => number;
  onCreateChallenge: (challengerName: string, challengedName: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onResolve: (winnerName: string) => void;
  matches: FriendlyMatch[];
}

const FriendlyPanel = ({
  allPlayerNames,
  isAdmin,
  loggedNick,
  pendingFriendly,
  getPlayerElo,
  onCreateChallenge,
  onApprove,
  onReject,
  onResolve,
  matches,
}: FriendlyPanelProps) => {
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');

  const handleChallenge = () => {
    if (!loggedNick || !selectedOpponent) return;
    onCreateChallenge(loggedNick, selectedOpponent);
    setSelectedOpponent('');
  };

  const availableOpponents = allPlayerNames.filter(
    n => n.toLowerCase() !== (loggedNick || '').toLowerCase()
  );

  const last5Matches = matches.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Challenge Card */}
      <div className="card-racing  neon-border overflow-hidden animate-glow-breathe hover-lift">
        <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
            Desafio Amistoso
          </h2>
          <span className="ml-1 kanji-accent text-[10px] text-accent/40">夜中</span>
        </div>

        <div className="p-5 space-y-4">
          {/* ELO Info */}
          {loggedNick && (
            <div className="flex items-center justify-between bg-primary/10 rounded-lg px-4 py-3 border border-primary/20">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seu ELO</span>
              <span className="text-lg font-black font-['Orbitron'] neon-text-purple">{getPlayerElo(loggedNick)}</span>
            </div>
          )}

          {/* Pending friendly */}
          {pendingFriendly && pendingFriendly.status === 'pending' && (
            <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                <Swords className="h-3.5 w-3.5" />
                Desafio Pendente (Aguardando Admin)
              </div>
              <div className="flex items-center justify-center gap-2 text-sm font-bold">
                <span className="neon-text-pink">{pendingFriendly.challengerName}</span>
                <span className="text-muted-foreground text-xs">vs</span>
                <span className="neon-text-purple">{pendingFriendly.challengedName}</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <span>{getPlayerElo(pendingFriendly.challengerName)} ELO</span>
                <span>vs</span>
                <span>{getPlayerElo(pendingFriendly.challengedName)} ELO</span>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-xs font-bold"
                    onClick={onApprove}
                  >
                    <Check className="h-3 w-3 mr-1" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs text-muted-foreground border-border hover:border-destructive hover:text-destructive"
                    onClick={onReject}
                  >
                    <X className="h-3 w-3 mr-1" /> Rejeitar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Active friendly - admin resolves */}
          {pendingFriendly && pendingFriendly.status === 'racing' && (
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/30 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-accent">
                <Zap className="h-3.5 w-3.5" />
                Amistoso em Andamento
              </div>
              <div className="flex items-center justify-center gap-4 text-sm font-bold">
                <span className="neon-text-pink">{pendingFriendly.challengerName}</span>
                <span className="text-muted-foreground text-lg font-black">×</span>
                <span className="neon-text-purple">{pendingFriendly.challengedName}</span>
              </div>
              {isAdmin && (
                <div className="space-y-2">
                  <p className="text-[9px] text-muted-foreground text-center italic">Selecione o vencedor:</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 text-xs font-bold"
                      onClick={() => onResolve(pendingFriendly.challengerName)}
                    >
                      <Trophy className="h-3 w-3 mr-1" /> {pendingFriendly.challengerName}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-xs font-bold"
                      onClick={() => onResolve(pendingFriendly.challengedName)}
                    >
                      <Trophy className="h-3 w-3 mr-1" /> {pendingFriendly.challengedName}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create challenge */}
          {loggedNick && !pendingFriendly && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Desafie qualquer piloto — sem regras de posição!
              </p>
              <Select value={selectedOpponent} onValueChange={setSelectedOpponent}>
                <SelectTrigger className="h-9 text-xs bg-secondary/60 border-border">
                  <SelectValue placeholder="Escolher oponente..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOpponents.map(name => (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center justify-between gap-3 w-full">
                        <span>{name}</span>
                        <span className="text-[10px] text-muted-foreground">{getPlayerElo(name)} ELO</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 font-['Orbitron'] hover-scale neon-border-pink transition-all duration-300"
                onClick={handleChallenge}
                disabled={!selectedOpponent}
              >
                <Flame className="h-4 w-4 mr-2" />
                Desafiar Amistoso
              </Button>
            </div>
          )}

          {!loggedNick && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Faça login para desafiar amistosos.
            </p>
          )}
        </div>
      </div>

      {/* ELO Leaderboard Mini */}
      <div className="card-racing  neon-border overflow-hidden hover-lift">
        <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-purple font-['Orbitron']">
            Top ELO
          </h2>
          <span className="ml-1 kanji-accent text-[10px] text-primary/30">夜</span>
        </div>
        <div className="p-3">
          {allPlayerNames
            .map(name => ({ name, elo: getPlayerElo(name) }))
            .sort((a, b) => b.elo - a.elo)
            .slice(0, 5)
            .map((entry, i) => (
              <div
                key={entry.name}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${i === 0 ? 'first-place-row bg-yellow-400/5' : 'hover:bg-secondary/40 hover:translate-x-1'}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold font-['Orbitron'] ${
                  i === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                  i === 1 ? 'bg-gray-300/20 text-gray-300' :
                  i === 2 ? 'bg-orange-400/20 text-orange-400' :
                  'bg-muted/40 text-muted-foreground'
                }`}>
                  {i + 1}
                </span>
                <span className={`text-xs font-semibold flex-1 ${i === 0 ? 'neon-text-gold font-bold' : ''}`}>
                  {entry.name}
                </span>
                <span className={`text-xs font-bold font-['Orbitron'] ${i === 0 ? 'neon-text-purple' : 'text-primary'}`}>{entry.elo}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Matches */}
      {last5Matches.length > 0 && (
      <div className="card-racing  neon-border overflow-hidden hover-lift">
          <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
            <Swords className="h-4 w-4 text-accent" />
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
              Últimos Amistosos
            </h2>
            <span className="ml-1 kanji-accent text-[10px] text-accent/30">中</span>
          </div>
          <div className="divide-y divide-border/50">
            {last5Matches.map(match => (
              <div key={match.id} className="px-4 py-3 flex items-center gap-3 transition-colors hover:bg-secondary/40">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`font-bold ${match.winnerName === match.challengerName ? 'neon-text-pink' : ''}`}>
                      {match.challengerName}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className={`font-bold ${match.winnerName === match.challengedName ? 'neon-text-pink' : ''}`}>
                      {match.challengedName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Trophy className="h-3 w-3 text-yellow-400" />
                    <span className="font-bold text-foreground">{match.winnerName}</span>
                    <span className="text-primary font-bold">+{match.eloChange}pts</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-muted-foreground">
                    {new Date(match.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendlyPanel;
