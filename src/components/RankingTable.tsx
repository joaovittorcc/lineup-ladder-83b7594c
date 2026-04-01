import { Challenge, PlayerList as PlayerListType } from '@/types/championship';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RankingTableProps {
  lists: PlayerListType[];
  challenges: Challenge[];
}

interface RankingEntry {
  name: string;
  wins: number;
  losses: number;
  winRate: number;
  list: string;
  position: number;
}

const RankingTable = ({ lists, challenges }: RankingTableProps) => {
  const completed = challenges.filter(c => c.status === 'completed');

  const statsMap = new Map<string, { wins: number; losses: number }>();

  completed.forEach(c => {
    const [cs, ds] = c.score || [0, 0];
    const challengerWon = cs >= 2;

    const winnerName = challengerWon ? c.challengerName : c.challengedName;
    const loserName = challengerWon ? c.challengedName : c.challengerName;

    const w = statsMap.get(winnerName) || { wins: 0, losses: 0 };
    w.wins++;
    statsMap.set(winnerName, w);

    const l = statsMap.get(loserName) || { wins: 0, losses: 0 };
    l.losses++;
    statsMap.set(loserName, l);
  });

  // Build ranking from all players in list-01 and list-02
  const rankings: RankingEntry[] = [];
  lists
    .filter(l => l.id !== 'initiation')
    .forEach(list => {
      list.players.forEach((p, idx) => {
        const stats = statsMap.get(p.name) || { wins: 0, losses: 0 };
        const total = stats.wins + stats.losses;
        rankings.push({
          name: p.name,
          wins: stats.wins,
          losses: stats.losses,
          winRate: total > 0 ? Math.round((stats.wins / total) * 100) : 0,
          list: list.title,
          position: idx + 1,
        });
      });
    });

  rankings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return a.position - b.position;
  });

  return (
    <div className="card-racing rounded-xl neon-border overflow-hidden">
      <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
        <Trophy className="h-4 w-4 text-accent" />
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
          Ranking Geral
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-bold">#</th>
              <th className="px-4 py-3 text-left font-bold">Piloto</th>
              <th className="px-4 py-3 text-center font-bold">V</th>
              <th className="px-4 py-3 text-center font-bold">D</th>
              <th className="px-4 py-3 text-center font-bold">%</th>
              <th className="px-4 py-3 text-right font-bold">Lista</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rankings.map((entry, i) => (
              <tr
                key={entry.name}
                className={`transition-colors hover:bg-secondary/60 ${i === 0 ? 'bg-accent/5' : ''}`}
              >
                <td className="px-4 py-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-['Orbitron'] ${
                    i === 0 ? 'bg-accent/20 text-accent' : i < 3 ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold tracking-wide ${i === 0 ? 'neon-text-pink' : ''}`}>
                    {entry.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-primary font-bold flex items-center justify-center gap-0.5">
                    {entry.wins > 0 && <TrendingUp className="h-3 w-3" />}
                    {entry.wins}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-muted-foreground font-bold flex items-center justify-center gap-0.5">
                    {entry.losses > 0 && <TrendingDown className="h-3 w-3" />}
                    {entry.losses}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    entry.winRate >= 60 ? 'bg-primary/15 text-primary' :
                    entry.winRate >= 40 ? 'bg-muted/30 text-foreground' :
                    'bg-muted/30 text-muted-foreground'
                  }`}>
                    {entry.wins + entry.losses > 0 ? `${entry.winRate}%` : <Minus className="h-3 w-3 inline" />}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {entry.list.replace('LISTA - ', 'L')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rankings.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum piloto registrado ainda.
        </p>
      )}
    </div>
  );
};

export default RankingTable;
