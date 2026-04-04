import { useState, useMemo } from 'react';
import { useGlobalLogs, type GlobalLog, type LogType } from '@/hooks/useGlobalLogs';
import { Swords, Trophy, ArrowUp, ArrowDown, Flame, ScrollText, Filter, Zap, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FilterType = 'ALL' | 'CHALLENGE' | 'FRIENDLY' | 'INITIATION' | 'PROMOTION' | 'DEMOTION' | 'STREET_RUNNER';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'ALL', label: 'Tudo' },
  { value: 'CHALLENGE', label: 'Lista' },
  { value: 'FRIENDLY', label: 'Amistosos' },
  { value: 'INITIATION', label: 'Iniciação' },
  { value: 'PROMOTION', label: 'Promoções' },
  { value: 'DEMOTION', label: 'Rebaixamentos' },
  { value: 'STREET_RUNNER', label: 'Street Runner' },
];

function isStreetRunnerLog(log: GlobalLog): boolean {
  return log.type === 'CHALLENGE' && log.category === 'street-runner';
}

function getLogIcon(log: GlobalLog) {
  if (isStreetRunnerLog(log)) return <UserPlus className="h-4 w-4 text-green-400" />;
  switch (log.type) {
    case 'CHALLENGE': return <Swords className="h-4 w-4 text-primary" />;
    case 'FRIENDLY': return <Flame className="h-4 w-4 text-orange-400" />;
    case 'INITIATION': return <Trophy className="h-4 w-4 text-accent" />;
    case 'PROMOTION': return <ArrowUp className="h-4 w-4 text-green-400" />;
    case 'AUTO_PROMOTION': return <Zap className="h-4 w-4 text-green-400" />;
    case 'DEMOTION': return <ArrowDown className="h-4 w-4 text-red-400" />;
  }
}

function getLogAccent(log: GlobalLog): string {
  if (isStreetRunnerLog(log)) return 'border-l-green-400/60';
  switch (log.type) {
    case 'CHALLENGE': return 'border-l-primary/60';
    case 'FRIENDLY': return 'border-l-orange-400/60';
    case 'INITIATION': return 'border-l-accent/60';
    case 'PROMOTION': return 'border-l-green-400/60';
    case 'AUTO_PROMOTION': return 'border-l-green-400/60';
    case 'DEMOTION': return 'border-l-red-400/60';
  }
}

function isDefenseLog(log: GlobalLog): boolean {
  return log.type === 'CHALLENGE' && (log.category === 'list-01' || log.category === 'list-02') && log.description.includes('defendeu');
}

function groupByDate(logs: GlobalLog[]): { label: string; logs: GlobalLog[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; logs: GlobalLog[] }[] = [
    { label: '⚡ Hoje', logs: [] },
    { label: '📅 Ontem', logs: [] },
    { label: '🗓️ Esta Semana', logs: [] },
    { label: '📦 Anteriores', logs: [] },
  ];

  logs.forEach(log => {
    const d = new Date(log.created_at);
    if (d >= today) groups[0].logs.push(log);
    else if (d >= yesterday) groups[1].logs.push(log);
    else if (d >= weekAgo) groups[2].logs.push(log);
    else groups[3].logs.push(log);
  });

  return groups.filter(g => g.logs.length > 0);
}

function LogCard({ log }: { log: GlobalLog }) {
  const defense = isDefenseLog(log);
  const time = new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`
        relative border-l-[3px] ${getLogAccent(log)} pl-4 py-3 pr-3
        bg-secondary/40 rounded-r-lg
        ${defense ? 'animate-pulse-slow ring-1 ring-accent/40 bg-accent/5' : ''}
        transition-all hover:bg-secondary/60
      `}
    >
      {defense && (
        <div className="absolute top-1 right-2 text-[9px] font-bold uppercase tracking-wider text-accent animate-pulse">
          🔥 TRETA
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{getLogIcon(log)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono text-foreground leading-snug">{log.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-mono text-muted-foreground">{time}</span>
            {log.winner && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                🏆 {log.winner}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const HistoryTab = () => {
  const { logs, loading } = useGlobalLogs();
  const [filter, setFilter] = useState<FilterType>('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') return logs;
    if (filter === 'PROMOTION') return logs.filter(l => l.type === 'PROMOTION' || l.type === 'AUTO_PROMOTION');
    if (filter === 'STREET_RUNNER') return logs.filter(l => l.type === 'CHALLENGE' && l.category === 'street-runner');
    if (filter === 'CHALLENGE') return logs.filter(l => l.type === 'CHALLENGE' && l.category !== 'street-runner');
    return logs.filter(l => l.type === filter);
  }, [logs, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScrollText className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-black tracking-[0.2em] uppercase neon-text-purple font-['Orbitron']">
          Histórico Global
        </h2>
        <span className="kanji-accent text-sm text-primary/40">記録</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {FILTER_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            size="sm"
            variant={filter === opt.value ? 'default' : 'outline'}
            className={`h-7 text-[10px] font-bold uppercase tracking-wider font-mono
              ${filter === opt.value
                ? 'bg-primary/20 text-primary border border-primary/40 neon-border'
                : 'text-muted-foreground border-border hover:text-foreground'
              }`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="neon-line" />

      {/* Feed */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-sm font-mono text-muted-foreground animate-pulse">Carregando registros...</div>
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <ScrollText className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="text-sm font-mono text-muted-foreground">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-['Orbitron']">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {group.logs.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {group.logs.map(log => (
                  <LogCard key={log.id} log={log} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
