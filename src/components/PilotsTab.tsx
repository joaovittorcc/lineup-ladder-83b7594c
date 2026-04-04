import { useState, useMemo } from 'react';
import { Search, Users, Crown, Trophy, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RoleBadge from '@/components/RoleBadge';
import { authorizedUsers, type PilotRole, getRoleLabel } from '@/data/users';

interface PilotsTabProps {
  getPlayerElo: (name: string) => number;
  list01Names: string[];
  list02Names: string[];
}

type FilterId = 'todos' | 'list-01' | 'list-02' | 'jokers';

const PilotsTab = ({ getPlayerElo, list01Names, list02Names }: PilotsTabProps) => {
  const [filter, setFilter] = useState<FilterId>('todos');
  const [search, setSearch] = useState('');

  const pilots = useMemo(() => {
    let list = authorizedUsers.map(u => ({
      name: u.displayName,
      username: u.username,
      role: u.role,
      isAdmin: u.isAdmin,
      isPilot: u.isPilot,
      isJoker: u.isJoker,
      elo: getPlayerElo(u.displayName),
      inList01: list01Names.some(n => n.toLowerCase() === u.displayName.toLowerCase()),
      inList02: list02Names.some(n => n.toLowerCase() === u.displayName.toLowerCase()),
    }));

    if (filter === 'list-01') list = list.filter(p => p.inList01);
    else if (filter === 'list-02') list = list.filter(p => p.inList02);
    else if (filter === 'jokers') list = list.filter(p => p.isJoker);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q));
    }

    list.sort((a, b) => b.elo - a.elo);
    return list;
  }, [filter, search, getPlayerElo, list01Names, list02Names]);

  const filters: { id: FilterId; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'list-01', label: 'Lista 01' },
    { id: 'list-02', label: 'Lista 02' },
    { id: 'jokers', label: 'Jokers' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black tracking-[0.2em] uppercase neon-text-purple font-['Orbitron']">
            Pilotos
          </h2>
          <span className="kanji-accent text-lg text-primary/30">夜</span>
        </div>
        <p className="text-xs text-muted-foreground tracking-wider uppercase">
          Diretório Completo — {pilots.length} pilotos
        </p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex gap-1.5 flex-wrap justify-center">
          {filters.map(f => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? 'default' : 'ghost'}
              className={`h-7 text-[10px] px-3 font-bold uppercase tracking-wider font-['Orbitron'] transition-all ${
                filter === f.id
                  ? 'bg-primary/20 text-primary border border-primary/40 neon-border'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar piloto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 pl-9 text-xs bg-secondary/60 border-border"
          />
        </div>
      </div>

      {/* Pilots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pilots.map((pilot, i) => (
          <div
            key={pilot.username}
            className="card-racing  neon-border p-4 flex items-center gap-4 hover:bg-secondary/40 transition-all duration-200 group"
          >
            {/* Avatar */}
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold font-['Orbitron'] shrink-0 border transition-all ${
              pilot.isAdmin
                ? 'bg-yellow-400/15 text-yellow-400 border-yellow-400/40'
                : pilot.isJoker
                  ? 'bg-muted/40 text-muted-foreground border-border'
                  : 'bg-primary/10 text-primary border-primary/30'
            }`}>
              {pilot.isAdmin ? (
                <Crown className="h-5 w-5" />
              ) : (
                pilot.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-wide text-foreground truncate">
                  {pilot.name}
                </span>
                <RoleBadge playerName={pilot.name} role={pilot.role} size="sm" />
              </div>
              <div className="flex items-center gap-3 mt-1">
                {pilot.inList01 && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-accent px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                    L01
                  </span>
                )}
                {pilot.inList02 && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                    L02
                  </span>
                )}
                {pilot.isJoker && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted/20 border border-border">
                    🃏 Joker
                  </span>
                )}
              </div>
            </div>

            {/* ELO */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <Trophy className="h-3 w-3 text-orange-400" />
                <span className="text-sm font-bold font-['Orbitron'] text-orange-400">
                  {pilot.elo}
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">ELO</span>
            </div>
          </div>
        ))}
      </div>

      {pilots.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhum piloto encontrado.
        </div>
      )}
    </div>
  );
};

export default PilotsTab;
