interface PlayerListProps {
  title: string;
  players: string[];
}

const PlayerList = ({ title, players }: PlayerListProps) => {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="bg-secondary px-5 py-4 border-b border-border">
        <h2 className="text-sm font-bold tracking-widest uppercase text-primary">
          {title}
        </h2>
      </div>
      <ul className="divide-y divide-border">
        {players.map((player, i) => (
          <li
            key={`${player}-${i}`}
            className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/50 transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {i + 1}
            </span>
            <span className="font-medium text-card-foreground">{player}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
