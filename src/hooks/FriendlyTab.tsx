import { useState } from 'react';
import { Flame, Swords, Check, X, Trophy, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEloFriendlies, type FriendlyMatch, calcEloDelta } from '@/hooks/useEloFriendlies';

interface FriendlyTabProps {
  allPlayerNames: string[];
  loggedNick: string | null;
  isAdmin: boolean;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
      delta > 0
        ? 'text-green-400 bg-green-400/10 border border-green-400/30'
        : 'text-red-400 bg-red-400/10 border border-red-400/30'
    }`}>
      {delta > 0 ? `+${delta}` : delta}
    </span>
  );
}

function MatchCard({
  match,
  loggedNick,
  isAdmin,
  onAccept,
  onCancel,
  onResolve,
}: {
  match: FriendlyMatch;
  loggedNick: string | null;
  isAdmin: boolean;
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
  onResolve: (id: string, winner: string) => void;
}) {
  const isChallenged = loggedNick?.toLowerCase() === match.challenged_name.toLowerCase();
  const isChallenger = loggedNick?.toLowerCase() === match.challenger_name.toLowerCase();
  const isParticipant = isChallenged || isChallenger;

  const previewDelta = calcEloDelta(match.challenger_points_before, match.challenged_points_before);

  return (
    <div className={`card-racing rounded-xl p-4 border space-y-3 ${
      match.status === 'racing'
        ? 'border-accent/40 bg-accent/5'
        : match.status === 'pending'
        ? 'border-yellow-400/30 bg-yellow-400/5'
        : match.status === 'completed'
        ? 'border-border bg-secondary/20'
        : 'border-border/40 bg-muted/10 opacity-50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
          match.status === 'racing' ? 'text-accent border-accent/40 bg-accent/15' :
          match.status === 'pending' ? 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10 animate-pulse' :
          match.status === 'completed' ? 'text-muted-foreground border-border' :
          'text-muted-foreground/50 border-border/40'
        }`}>
          {match.status === 'racing' ? '⚡ Ao Vivo' :
           match.status === 'pending' ? '⏳ Pendente' :
           match.status === 'completed' ? '✓ Finalizado' : '✗ Cancelado'}
        </span>
        <span className="text-[9px] text-muted-foreground">
          {new Date(match.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Players */}
      <div className="flex items-center justify-center gap-3">
        <div className="text-center flex-1">
          <p className={`text-sm font-bold tracking-wide ${
            match.status === 'completed' && match.winner_name === match.challenger_name
              ? 'neon-text-pink' : 'text-foreground'
          }`}>
            {match.challenger_name}
            {match.status === 'completed' && match.winner_name === match.challenger_name && ' 🏆'}
          </p>
          <p className="text-[10px] text-muted-foreground">{match.challenger_points_before} pts</p>
          {match.status === 'completed' && (
            <DeltaBadge delta={match.challenger_points_delta} />
          )}
          {match.status !== 'completed' && (
            <p className="text-[9px] text-muted-foreground/60">
              ↑+{previewDelta.winnerDelta} / ↓{previewDelta.loserDelta}
            </p>
          )}
        </div>

        <span className="text-muted-foreground font-black text-lg font-['Orbitron']">VS</span>

        <div className="text-center flex-1">
          <p className={`text-sm font-bold tracking-wide ${
            match.status === 'completed' && match.winner_name === match.challenged_name
              ? 'neon-text-purple' : 'text-foreground'
          }`}>
            {match.challenged_name}
            {match.status === 'completed' && match.winner_name === match.challenged_name && ' 🏆'}
          </p>
          <p className="text-[10px] text-muted-foreground">{match.challenged_points_before} pts</p>
          {match.status === 'completed' && (
            <DeltaBadge delta={match.challenged_points_delta} />
          )}
          {match.status !== 'completed' && (
            <p className="text-[9px] text-muted-foreground/60">
              ↑+{previewDelta.winnerDelta} / ↓{previewDelta.loserDelta}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {match.status === 'pending' && (isChallenged || isAdmin) && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 h-7 text-[10px] font-bold bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
            onClick={() => onAccept(match.id)}
          >
            <Check className="h-3 w-3 mr-1" /> Aceitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-[10px] text-muted-foreground border-border hover:border-destructive hover:text-destructive"
            onClick={() => onCancel(match.id)}
          >
            <X className="h-3 w-3 mr-1" /> Recusar
          </Button>
        </div>
      )}

      {match.status === 'pending' && isChallenger && !isAdmin && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-[10px] text-muted-foreground border-border hover:border-destructive hover:text-destructive"
            onClick={() => onCancel(match.id)}
          >
            <X className="h-3 w-3 mr-1" /> Cancelar Desafio
          </Button>
        </div>
      )}

      {match.status === 'racing' && isAdmin && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider text-center">Admin — Definir Vencedor</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-7 text-[10px] font-bold bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30"
              onClick={() => onResolve(match.id, match.challenger_name)}
            >
              <Trophy className="h-3 w-3 mr-1" /> {match.challenger_name}
            </Button>
            <Button
              size="sm"
              className="flex-1 h-7 text-[10px] font-bold bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
              onClick={() => onResolve(match.id, match.challenged_name)}
            >
              <Trophy className="h-3 w-3 mr-1" /> {match.challenged_name}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewChallengeForm({
  allPlayerNames,
  loggedNick,
  onCreate,
}: {
  allPlayerNames: string[];
  loggedNick: string;
  onCreate: (challenger: string, challenged: string) => Promise<string | null>;
}) {
  const [opponent, setOpponent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const opponents = allPlayerNames.filter(n => n.toLowerCase() !== loggedNick.toLowerCase());

  const handleCreate = async () => {
    if (!opponent) { setError('Selecione um oponente'); return; }
    setLoading(true);
    const err = await onCreate(loggedNick, opponent);
    setLoading(false);
    if (err) { setError(err); return; }
    setOpponent('');
    setError(null);
    setOpen(false);
  };

  return (
    <div className="card-racing rounded-xl neon-border overflow-hidden">
      <button
        className="w-full bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2 hover:bg-secondary/90 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <Swords className="h-4 w-4 text-accent" />
        <span className="text-xs font-bold tracking-[0.2em] uppercase neon-text-pink font-['Orbitron']">
          Novo Desafio Amistoso
        </span>
        <span className="ml-auto">
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </span>
      </button>

      {open && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Desafiante: <span className="font-bold text-accent">{loggedNick}</span>
          </p>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Escolha o Oponente
            </label>
            <div className="flex flex-wrap gap-2">
              {opponents.map(name => (
                <button
                  key={name}
                  onClick={() => { setOpponent(name); setError(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    opponent === name
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:border-accent/40 hover:text-foreground'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive font-semibold">{error}</p>
          )}

          <Button
            size="sm"
            disabled={!opponent || loading}
            className="w-full h-8 text-xs font-bold bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 font-['Orbitron']"
            onClick={handleCreate}
          >
            <Flame className="h-3 w-3 mr-1.5" />
            {loading ? 'Enviando...' : 'Enviar Desafio'}
          </Button>
        </div>
      )}
    </div>
  );
}

const FriendlyTab = ({ allPlayerNames, loggedNick, isAdmin }: FriendlyTabProps) => {
  const {
    friendlyMatches,
    activeFriendlies,
    pendingFriendlies,
    loading,
    createFriendly,
    acceptFriendly,
    cancelFriendly,
    resolveFriendly,
  } = useEloFriendlies(allPlayerNames);

  const completedMatches = friendlyMatches
    .filter(m => m.status === 'completed' || m.status === 'cancelled')
    .slice(0, 15);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <h2 className="text-xl font-black tracking-wider uppercase neon-text-pink font-['Orbitron'] flex items-center justify-center gap-2">
          <Flame className="h-5 w-5" /> Amistosos
        </h2>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Desafios Livres — Sistema ELO
        </p>
      </div>

      {/* New challenge form */}
      {loggedNick && (
        <NewChallengeForm
          allPlayerNames={allPlayerNames}
          loggedNick={loggedNick}
          onCreate={createFriendly}
        />
      )}

      {/* Active matches */}
      {activeFriendlies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse inline-block" />
            Ao Vivo
          </h3>
          {activeFriendlies.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              loggedNick={loggedNick}
              isAdmin={isAdmin}
              onAccept={acceptFriendly}
              onCancel={cancelFriendly}
              onResolve={resolveFriendly}
            />
          ))}
        </div>
      )}

      {/* Pending matches */}
      {pendingFriendlies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-400 flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Aguardando Confirmação
          </h3>
          {pendingFriendlies.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              loggedNick={loggedNick}
              isAdmin={isAdmin}
              onAccept={acceptFriendly}
              onCancel={cancelFriendly}
              onResolve={resolveFriendly}
            />
          ))}
        </div>
      )}

      {/* History */}
      {completedMatches.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Histórico
          </h3>
          {completedMatches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              loggedNick={loggedNick}
              isAdmin={isAdmin}
              onAccept={acceptFriendly}
              onCancel={cancelFriendly}
              onResolve={resolveFriendly}
            />
          ))}
        </div>
      )}

      {activeFriendlies.length === 0 && pendingFriendlies.length === 0 && completedMatches.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <Flame className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground font-['Orbitron'] uppercase tracking-wider">
            Nenhum amistoso ainda
          </p>
          <p className="text-xs text-muted-foreground/60">
            {loggedNick ? 'Use o botão acima para desafiar alguém!' : 'Faça login para criar um desafio.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FriendlyTab;
