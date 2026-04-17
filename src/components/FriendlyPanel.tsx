import { useMemo, useState } from 'react';
import { Flame, Swords, Trophy, Check, X, Zap, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FriendlyMatch, PendingFriendlyChallenge } from '@/types/championship';

function involvesNick(row: PendingFriendlyChallenge, nick: string | null): boolean {
  if (!nick) return false;
  const l = nick.trim().toLowerCase();
  return (
    row.challengerName.trim().toLowerCase() === l || row.challengedName.trim().toLowerCase() === l
  );
}

interface FriendlyPanelProps {
  allPlayerNames: string[];
  isAdmin: boolean;
  loggedNick: string | null;
  pendingChallenges: PendingFriendlyChallenge[];
  getPlayerElo: (name: string) => number;
  onCreateChallenge: (challengerName: string, challengedName: string) => void | Promise<void>;
  onAccept: (pendingId: string) => void | Promise<void>;
  onDecline: (pendingId: string) => void | Promise<void>;
  onCancel: (pendingId: string) => void | Promise<void>;
  onAdminCancel: (pendingId: string) => void | Promise<void>;
  onResolve: (winnerName: string, pendingId: string) => void | Promise<void>;
  matches: FriendlyMatch[];
}

const FriendlyPanel = ({
  allPlayerNames,
  isAdmin,
  loggedNick,
  pendingChallenges,
  getPlayerElo,
  onCreateChallenge,
  onAccept,
  onDecline,
  onCancel,
  onAdminCancel,
  onResolve,
  matches,
}: FriendlyPanelProps) => {
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');

  const myRow = useMemo(
    () => (loggedNick ? pendingChallenges.find(r => involvesNick(r, loggedNick)) : undefined),
    [loggedNick, pendingChallenges]
  );

  const adminRacingOther = useMemo(
    () =>
      isAdmin
        ? pendingChallenges.filter(c => c.status === 'racing' && !involvesNick(c, loggedNick))
        : [],
    [isAdmin, loggedNick, pendingChallenges]
  );

  const userBusy = Boolean(myRow);

  const handleChallenge = () => {
    if (!loggedNick || !selectedOpponent) return;
    void onCreateChallenge(loggedNick, selectedOpponent);
    setSelectedOpponent('');
  };

  const availableOpponents = [...allPlayerNames]
    .filter(n => n.toLowerCase() !== (loggedNick || '').toLowerCase())
    .sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' }));

  const last5Matches = matches.slice(0, 5);

  const renderRacingCard = (row: PendingFriendlyChallenge, key: string) => (
    <div
      key={key}
      className="bg-accent/10 rounded-lg p-4 border border-accent/30 space-y-3"
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-accent">
        <Zap className="h-3.5 w-3.5" />
        Amistoso em Andamento
      </div>
      <div className="flex items-center justify-center gap-4 text-sm font-bold">
        <span className="neon-text-pink">{row.challengerName}</span>
        <span className="text-muted-foreground text-lg font-black">×</span>
        <span className="neon-text-purple">{row.challengedName}</span>
      </div>
      {row.trackName && (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 py-3 px-4">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Route className="h-3 w-3" /> Pista (sorteada)
          </span>
          <span className="text-sm font-black font-['Orbitron'] text-center neon-text-purple">
            {row.trackName}
          </span>
        </div>
      )}
      {isAdmin && (
        <div className="space-y-2">
          <p className="text-[9px] text-muted-foreground text-center italic">Selecione o vencedor:</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 text-xs font-bold"
              onClick={() => onResolve(row.challengerName, row.id)}
            >
              <Trophy className="h-3 w-3 mr-1" /> {row.challengerName}
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-xs font-bold"
              onClick={() => onResolve(row.challengedName, row.id)}
            >
              <Trophy className="h-3 w-3 mr-1" /> {row.challengedName}
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
            onClick={() => onAdminCancel(row.id)}
          >
            <X className="h-3 w-3 mr-1" /> Cancelar amistoso (admin)
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card-racing  neon-border overflow-hidden animate-glow-breathe hover-lift">
        <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
            Desafio Amistoso
          </h2>
          <span className="ml-1 kanji-accent text-[10px] text-accent/40">夜中</span>
        </div>

        <div className="p-5 space-y-4">
          {loggedNick && (
            <div className="flex items-center justify-between bg-primary/10 rounded-lg px-4 py-3 border border-primary/20">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seu ELO</span>
              <span className="text-lg font-black font-['Orbitron'] neon-text-purple">{getPlayerElo(loggedNick)}</span>
            </div>
          )}

          {myRow && myRow.status === 'pending' && (
            <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                <Swords className="h-3.5 w-3.5" />
                {loggedNick &&
                myRow.challengerName.trim().toLowerCase() === loggedNick.trim().toLowerCase()
                  ? 'À espera que o oponente aceite'
                  : 'Pedido de amistoso'}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm font-bold">
                <span className="neon-text-pink">{myRow.challengerName}</span>
                <span className="text-muted-foreground text-xs">vs</span>
                <span className="neon-text-purple">{myRow.challengedName}</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <span>{getPlayerElo(myRow.challengerName)} ELO</span>
                <span>vs</span>
                <span>{getPlayerElo(myRow.challengedName)} ELO</span>
              </div>
              {loggedNick &&
                myRow.challengedName.trim().toLowerCase() === loggedNick.trim().toLowerCase() && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-xs font-bold"
                      onClick={() => onAccept(myRow.id)}
                    >
                      <Check className="h-3 w-3 mr-1" /> Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs text-muted-foreground border-border hover:border-destructive hover:text-destructive"
                      onClick={() => onDecline(myRow.id)}
                    >
                      <X className="h-3 w-3 mr-1" /> Recusar
                    </Button>
                  </div>
                )}
              {loggedNick &&
                myRow.challengerName.trim().toLowerCase() === loggedNick.trim().toLowerCase() && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs text-muted-foreground border-border hover:border-destructive hover:text-destructive"
                    onClick={() => onCancel(myRow.id)}
                  >
                    <X className="h-3 w-3 mr-1" /> Cancelar pedido
                  </Button>
                )}
              {isAdmin && !(loggedNick && myRow.challengerName.trim().toLowerCase() === loggedNick.trim().toLowerCase()) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                  onClick={() => onAdminCancel(myRow.id)}
                >
                  <X className="h-3 w-3 mr-1" /> Cancelar desafio (admin)
                </Button>
              )}
            </div>
          )}

          {myRow && myRow.status === 'racing' && renderRacingCard(myRow, `mine-${myRow.id}`)}

          {adminRacingOther.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Outros amistosos em curso (admin)
              </p>
              {adminRacingOther.map(row => renderRacingCard(row, `admin-${row.id}`))}
            </div>
          )}

          {loggedNick && !userBusy && availableOpponents.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2 border border-border/60 rounded-lg bg-secondary/30">
              Não há outros pilotos no diretório para desafiar. Se o teu nome não aparece na lista de oponentes, confirma
              o login ou contacta um admin.
            </p>
          )}

          {loggedNick && !userBusy && availableOpponents.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Desafie qualquer piloto — sem cooldown. Ao aceitar, a pista é sorteada ao acaso.
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
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold font-['Orbitron'] ${
                    i === 0
                      ? 'bg-yellow-400/20 text-yellow-400'
                      : i === 1
                        ? 'bg-gray-300/20 text-gray-300'
                        : i === 2
                          ? 'bg-orange-400/20 text-orange-400'
                          : 'bg-muted/40 text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`text-xs font-semibold flex-1 ${i === 0 ? 'neon-text-gold font-bold' : ''}`}>
                  {entry.name}
                </span>
                <span className={`text-xs font-bold font-['Orbitron'] ${i === 0 ? 'neon-text-purple' : 'text-primary'}`}>
                  {entry.elo}
                </span>
              </div>
            ))}
        </div>
      </div>

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
                  <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3 w-3 text-yellow-400 shrink-0" />
                      <span className="font-bold text-foreground">{match.winnerName}</span>
                      <span className="text-primary font-bold">+{match.eloChange}pts</span>
                    </div>
                    {match.trackName && (
                      <span className="pl-5 text-[9px] uppercase tracking-wide text-primary/80">
                        Pista: {match.trackName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
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
