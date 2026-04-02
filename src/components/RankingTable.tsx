import { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { useEloFriendlies } from '@/hooks/useEloFriendlies';

interface RankingTableProps {
  allPlayerNames: string[];
}

const MEDAL = ['🥇', '🥈', '🥉'];
const MEDAL_STYLES = [
  'bg-yellow-400/10 border-yellow-400/40 text-yellow-400 shadow-[0_0_18px_hsl(45_100%_55%/0.25)]',
  'bg-zinc-400/10 border-zinc-400/40 text-zinc-300 shadow-[0_0_12px_hsl(0_0%_60%/0.15)]',
  'bg-orange-800/10 border-orange-600/40 text-orange-400 shadow-[0_0_12px_hsl(20_80%_50%/0.15)]',
];
const RANK_BADGE = [
  'bg-yellow-400/20 text-yellow-400',
  'bg-zinc-400/20 text-zinc-300',
  'bg-orange-600/20 text-orange-400',
];

function PlayerHistory({ playerName, getPlayerHistory }: { playerName: string; getPlayerHistory: (n: string, l?: number) => ReturnType<ReturnType<typeof useEloFriendlies>['getPlayerHistory']> }) {
  const history = getPlayerHistory(playerName, 5);

  if (history.length === 0) return (
    <p className="text-[10px] text-muted-foreground/60 italic px-1 py-1">Nenhuma partida registrada.</p>
  );

  return (
    <ul className="space-y-1 py-1">
      {history.map(m => {
        const won = m.winner_name === playerName;
        const opponent = m.challenger_name === playerName ? m.challenged_name : m.challenger_name;
        const delta = m.challenger_name === playerName ? m.challenger_points_delta : m.challenged_points_delta;
        return (
          <li key={m.id} className="flex items-center gap-2 text-[10px]">
            <span>{won
              ? <TrendingUp className="h-3 w-3 text-green-400" />
              : <TrendingDown className="h-3 w-3 text-red-400" />}
            </span>
            <span className={won ? 'text-green-400' : 'text-muted-foreground'}>
              {won ? 'Venceu' : 'Perdeu para'} <span className="font-bold">{opponent}</span>
            </span>
            <span className={`ml-auto font-bold ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {delta > 0 ? `+${delta}` : delta} pts
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const RankingTable = ({ allPlayerNames }: RankingTableProps) => {
  const { eloScores, loading, getPlayerHistory } = useEloFriendlies(allPlayerNames);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  const sorted = [...eloScores].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <h2 className="text-xl font-black tracking-wider uppercase neon-text-purple font-['Orbitron'] flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5" /> Ranking ELO
        </h2>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Classificação por Pontos de Amistosos
        </p>
      </div>

      {/* Top 3 podium */}
      {sorted.length >= 1 && (
        <div className="grid grid-cols-3 gap-3">
          {sorted.slice(0, 3).map((entry, i) => (
            <button
              key={entry.player_name}
              onClick={() => setExpandedPlayer(expandedPlayer === entry.player_name ? null : entry.player_name)}
              className={`card-racing rounded-xl p-4 border text-center space-y-2 transition-all hover:scale-[1.03] ${MEDAL_STYLES[i]}`}
            >
              <div className="text-2xl">{MEDAL[i]}</div>
              <p className="text-xs font-black tracking-wide font-['Orbitron'] truncate">{entry.player_name}</p>
              <p className="text-xl font-black font-['Orbitron']">{entry.points}</p>
              <p className="text-[9px] text-muted-foreground">{entry.wins}V · {entry.losses}D</p>
              {expandedPlayer === entry.player_name && (
                <div className="pt-2 border-t border-border/50 text-left">
                  <PlayerHistory playerName={entry.player_name} getPlayerHistory={getPlayerHistory} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Full table */}
      {sorted.length > 0 ? (
        <div className="card-racing rounded-xl neon-border overflow-hidden">
          <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent" />
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
              Classificação Geral
            </h3>
          </div>

          <div className="divide-y divide-border/40">
            {sorted.map((entry, i) => {
              const isExpanded = expandedPlayer === entry.player_name;
              const total = entry.wins + entry.losses;
              const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : null;

              return (
                <div key={entry.player_name}>
                  <button
                    onClick={() => setExpandedPlayer(isExpanded ? null : entry.player_name)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors"
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-['Orbitron'] shrink-0 ${
                      i < 3 ? RANK_BADGE[i] : 'bg-muted/40 text-muted-foreground'
                    }`}>
                      {i < 3 ? MEDAL[i] : i + 1}
                    </span>

                    <span className="font-semibold tracking-wide flex-1 text-left text-sm text-foreground">
                      {entry.player_name}
                    </span>

                    <span className="font-black text-sm font-['Orbitron'] text-primary">
                      {entry.points}
                    </span>

                    <span className="text-xs text-muted-foreground w-14 text-right hidden sm:block">
                      {entry.wins}V · {entry.losses}D
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:block min-w-[38px] text-center ${
                      winRate === null ? 'text-muted-foreground' :
                      winRate >= 60 ? 'bg-primary/15 text-primary' :
                      winRate >= 40 ? 'bg-muted/30 text-foreground' :
                      'bg-muted/30 text-muted-foreground'
                    }`}>
                      {winRate !== null ? `${winRate}%` : <Minus className="h-3 w-3 inline" />}
                    </span>

                    {isExpanded
                      ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    }
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-3 bg-secondary/20 border-t border-border/30">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground pt-2 pb-1">
                        Últimos amistosos
                      </p>
                      <PlayerHistory playerName={entry.player_name} getPlayerHistory={getPlayerHistory} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 space-y-2">
          <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground font-['Orbitron'] uppercase tracking-wider">
            Nenhum ponto registrado ainda
          </p>
          <p className="text-xs text-muted-foreground/60">
            Jogue amistosos para aparecer no ranking!
          </p>
        </div>
      )}
    </div>
  );
};

export default RankingTable;
