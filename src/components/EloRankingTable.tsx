import { Trophy, TrendingUp, TrendingDown, Medal, Flame } from 'lucide-react';
import { FriendlyMatch } from '@/types/championship';
import RoleBadge from '@/components/RoleBadge';

interface EloRankingEntry {
  name: string;
  elo: number;
  wins: number;
  losses: number;
}

interface EloRankingTableProps {
  rankings: EloRankingEntry[];
  matches: FriendlyMatch[];
}

const medalColors = [
  { bg: 'bg-yellow-400/20', text: 'text-yellow-400', border: 'border-yellow-400/40', shadow: 'shadow-[0_0_15px_hsl(45_100%_60%_/_0.3)]', label: '🥇' },
  { bg: 'bg-gray-300/20', text: 'text-gray-300', border: 'border-gray-300/40', shadow: 'shadow-[0_0_15px_hsl(0_0%_80%_/_0.3)]', label: '🥈' },
  { bg: 'bg-orange-400/20', text: 'text-orange-400', border: 'border-orange-400/40', shadow: 'shadow-[0_0_15px_hsl(30_100%_60%_/_0.3)]', label: '🥉' },
];

const EloRankingTable = ({ rankings, matches }: EloRankingTableProps) => {
  const getPlayerHistory = (name: string): FriendlyMatch[] => {
    const lower = name.toLowerCase();
    return matches
      .filter(m => m.challengerName.toLowerCase() === lower || m.challengedName.toLowerCase() === lower)
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      {rankings.length >= 3 && (
        <div className="relative flex items-end justify-center gap-4 pt-6 pb-4">
          {/* Kanji watermark behind podium */}
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="kanji-accent text-[10rem] leading-none text-primary/[0.03]">夜中</span>
          </span>

          {/* 2nd place */}
          <div className={`relative flex flex-col items-center gap-2 p-4  border ${medalColors[1].bg} ${medalColors[1].border} ${medalColors[1].shadow} w-28 hover-lift animate-fade-in-up animate-fill-both stagger-1`}>
            <span className="text-2xl">{medalColors[1].label}</span>
            <span className={`text-xs font-bold tracking-wide ${medalColors[1].text}`}>
              {rankings[1].name}
            </span>
            <span className="text-lg font-black font-['Orbitron'] text-foreground">{rankings[1].elo}</span>
            <span className="text-[10px] text-muted-foreground">{rankings[1].wins}V / {rankings[1].losses}D</span>
          </div>
          {/* 1st place */}
          <div className={`relative flex flex-col items-center gap-2 p-5  border ${medalColors[0].bg} ${medalColors[0].border} w-36 -mb-2 hover-lift animate-fade-in-up animate-fill-both animate-podium-glow`}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 kanji-accent text-xs text-yellow-400/60 tracking-widest">夜中</span>
            <span className="text-3xl animate-float">{medalColors[0].label}</span>
            <span className="text-sm font-bold tracking-wide neon-text-gold">
              {rankings[0].name}
            </span>
            <span className="text-2xl font-black font-['Orbitron'] neon-text-purple">{rankings[0].elo}</span>
            <span className="text-[10px] text-muted-foreground">{rankings[0].wins}V / {rankings[0].losses}D</span>
          </div>
          {/* 3rd place */}
          <div className={`relative flex flex-col items-center gap-2 p-4  border ${medalColors[2].bg} ${medalColors[2].border} ${medalColors[2].shadow} w-28 hover-lift animate-fade-in-up animate-fill-both stagger-2`}>
            <span className="text-2xl">{medalColors[2].label}</span>
            <span className={`text-xs font-bold tracking-wide ${medalColors[2].text}`}>
              {rankings[2].name}
            </span>
            <span className="text-lg font-black font-['Orbitron'] text-foreground">{rankings[2].elo}</span>
            <span className="text-[10px] text-muted-foreground">{rankings[2].wins}V / {rankings[2].losses}D</span>
          </div>
        </div>
      )}

      {/* Full Ranking Table */}
      <div className="card-racing  neon-border overflow-hidden kanji-watermark-sm">
        <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
            Ranking ELO — Amistosos
          </h2>
          <span className="ml-1 kanji-accent text-[10px] text-primary/40">夜中</span>
          <Flame className="h-4 w-4 text-orange-400 ml-auto animate-neon-pulse" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto-layout">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left font-bold w-14">#</th>
                <th className="px-4 py-3 text-left font-bold">Piloto</th>
                <th className="px-4 py-3 text-center font-bold">Pontuação</th>
                <th className="px-4 py-3 text-center font-bold">V/D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rankings.map((entry, i) => (
                <tr
                  key={entry.name}
                  className={`transition-all duration-200 hover:bg-secondary/60 hover:translate-x-1 ${
                    i === 0 ? 'first-place-row' : i === 1 ? 'bg-gray-300/5' : i === 2 ? 'bg-orange-400/5' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-['Orbitron'] ${
                      i === 0 ? 'bg-yellow-400/20 text-yellow-400 neon-border-gold' :
                      i === 1 ? 'bg-gray-300/20 text-gray-300' :
                      i === 2 ? 'bg-orange-400/20 text-orange-400' :
                      'bg-muted/40 text-muted-foreground'
                    }`}>
                      {i < 3 ? medalColors[i].label : i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold tracking-wide ${i === 0 ? 'neon-text-gold text-base' : i < 3 ? 'text-foreground' : ''}`}>
                        {entry.name}
                      </span>
                      <RoleBadge playerName={entry.name} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className={`text-sm font-black font-['Orbitron'] ${
                      i === 0 ? 'neon-text-purple text-base' : 'text-primary'
                    }`}>
                      {entry.elo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-primary font-bold flex items-center gap-0.5 text-xs">
                        <TrendingUp className="h-3 w-3" /> {entry.wins}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground font-bold flex items-center gap-0.5 text-xs">
                        <TrendingDown className="h-3 w-3" /> {entry.losses}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Telemetry data stream */}
        <div className="telemetry-data" />

        {rankings.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum amistoso registrado ainda.
          </p>
        )}
      </div>

      {/* Match History per player */}
      {rankings.length > 0 && (
        <div className="card-racing  neon-border overflow-hidden">
          <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
            <Medal className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase neon-text-purple font-['Orbitron']">
              Histórico por Piloto
            </h2>
            <span className="ml-1 kanji-accent text-[10px] text-accent/40">中</span>
          </div>
          <div className="divide-y divide-border/50">
            {rankings.slice(0, 10).map((entry, idx) => {
              const history = getPlayerHistory(entry.name);
              if (history.length === 0) return null;
              return (
                <div key={entry.name} className={`px-4 py-3 space-y-2 transition-colors hover:bg-secondary/40 ${idx === 0 ? 'first-place-row' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${idx === 0 ? 'neon-text-gold' : 'text-foreground'}`}>{entry.name}</span>
                    <span className="text-[10px] text-muted-foreground font-['Orbitron']">{entry.elo} ELO</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map(match => {
                      const isWinner = match.winnerName.toLowerCase() === entry.name.toLowerCase();
                      const opponent = isWinner ? match.loserName : match.winnerName;
                      return (
                        <span
                          key={match.id}
                          className={`text-[9px] px-2 py-1 rounded-full border font-bold uppercase tracking-wider transition-transform hover:scale-105 ${
                            isWinner
                              ? 'border-primary/30 bg-primary/10 text-primary'
                              : 'border-destructive/30 bg-destructive/10 text-destructive'
                          }`}
                        >
                          {isWinner ? '✓' : '✗'} {opponent} {isWinner ? `+${match.eloChange}` : `-${match.eloChange}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EloRankingTable;
