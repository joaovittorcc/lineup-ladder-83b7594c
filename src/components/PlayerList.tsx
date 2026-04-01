import { useState } from 'react';
import { Player } from '@/types/championship';
import { Clock, Swords, Zap, Crown, Shield, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import RaceConfigModal from '@/components/RaceConfigModal';

interface PlayerListProps {
  listId: string;
  title: string;
  players: Player[];
  onChallenge: (challengerIdx: number, challengedIdx: number, tracks?: [string, string, string]) => string | null;
  onReorder: (oldIndex: number, newIndex: number) => void;
  isInitiation?: boolean;
  isExternal?: boolean;
  onChallengeInitiation?: (playerId: string) => void;
  isAdmin?: boolean;
  highlight?: boolean;
  loggedNick?: string | null;
  onSetPlayerStatus?: (playerId: string, status: 'available' | 'racing' | 'cooldown') => void;
}

function SortablePlayer({
  player,
  index,
  isInitiation,
  isExternal,
  isAdmin,
  onStartChallenge,
  onChallengeInitiation,
  showChallenge,
  isLoggedIn,
  isCurrentPlayer,
  onSetPlayerStatus,
}: {
  player: Player;
  index: number;
  isInitiation?: boolean;
  isExternal?: boolean;
  isAdmin?: boolean;
  onStartChallenge: (idx: number) => void;
  onChallengeInitiation?: (playerId: string) => void;
  showChallenge: boolean;
  isLoggedIn: boolean;
  isCurrentPlayer: boolean;
  onSetPlayerStatus?: (playerId: string, status: 'available' | 'racing' | 'cooldown') => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: player.id, disabled: !isAdmin });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const isRacing = player.status === 'racing';
  const isCooldown = player.status === 'cooldown';
  const cooldownRemaining = player.cooldownUntil
    ? Math.max(0, player.cooldownUntil - Date.now())
    : 0;
  const cooldownDays = Math.ceil(cooldownRemaining / (1000 * 60 * 60 * 24));

  const hasChallengeCooldown = player.challengeCooldownUntil
    ? player.challengeCooldownUntil > Date.now()
    : false;
  const challengeCooldownRemaining = player.challengeCooldownUntil
    ? Math.max(0, player.challengeCooldownUntil - Date.now())
    : 0;
  const challengeCooldownDays = Math.ceil(challengeCooldownRemaining / (1000 * 60 * 60 * 24));

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 px-4 py-3 transition-all ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''} group
        ${isRacing ? 'bg-accent/10 border-l-2 border-l-accent' : ''}
        ${isCooldown ? 'bg-muted/30 opacity-70' : ''}
        ${!isRacing && !isCooldown ? 'hover:bg-secondary/60' : ''}
      `}
    >
      {isInitiation ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/40 shrink-0">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
        </span>
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary font-['Orbitron'] shrink-0">
          {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
        </span>
      )}

      <span className={`font-semibold text-sm flex-1 tracking-wide transition-all
        ${isRacing ? 'neon-text-pink' : 'text-foreground group-hover:neon-text-pink'}
      `}>
          {player.name === 'Santi' ? 'Sant' : player.name === 'Rox' ? 'Rocxs' : player.name}
      </span>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Admin status control dropdown */}
        {isAdmin && !isInitiation && onSetPlayerStatus && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                onClick={e => e.stopPropagation()}
              >
                <Settings2 className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onSetPlayerStatus(player.id, 'available'); }}
                className={`text-xs ${player.status === 'available' ? 'text-primary font-bold' : ''}`}
              >
                ✅ Disponível
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onSetPlayerStatus(player.id, 'racing'); }}
                className={`text-xs ${player.status === 'racing' ? 'text-accent font-bold' : ''}`}
              >
                🏎️ Em Corrida
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onSetPlayerStatus(player.id, 'cooldown'); }}
                className={`text-xs ${player.status === 'cooldown' ? 'text-muted-foreground font-bold' : ''}`}
              >
                🛡️ Em Defesa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Initiation: show Desafiar button for external pilots only when logged in */}
        {isLoggedIn && isInitiation && isExternal && onChallengeInitiation && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] px-2 text-accent hover:bg-accent/15 hover:text-accent"
            onClick={(e) => { e.stopPropagation(); onChallengeInitiation(player.id); }}
          >
            <Swords className="h-3 w-3 mr-1" /> Desafiar
          </Button>
        )}

        {/* Initiation: neutral label only when logged in */}
        {isLoggedIn && isInitiation && !isExternal && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-muted/30 border border-border">
            Pendente
          </span>
        )}

        {!isInitiation && isRacing && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30">
            <Zap className="h-3 w-3" /> Racing
          </span>
        )}

        {!isInitiation && isCooldown && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-muted/30 border border-border">
            <Clock className="h-3 w-3" /> {cooldownDays}d
          </span>
        )}

        {!isInitiation && player.defenseCount > 0 && !isCooldown && (
          <span className="flex items-center gap-0.5 text-[10px] text-primary">
            <Shield className="h-3 w-3" /> {player.defenseCount}
          </span>
        )}

        {/* For admin: always show Desafiar if current player, ignore cooldown */}
        {showChallenge && !isInitiation && isCurrentPlayer && isAdmin && player.status === 'available' && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] px-2 text-accent hover:bg-accent/15 hover:text-accent"
            onClick={(e) => { e.stopPropagation(); onStartChallenge(index); }}
          >
            <Swords className="h-3 w-3 mr-1" /> Desafiar
          </Button>
        )}

        {/* Normal player: show cooldown or challenge button */}
        {showChallenge && !isInitiation && isCurrentPlayer && !isAdmin && player.status === 'available' && hasChallengeCooldown && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-muted/30 border border-border">
            <Clock className="h-3 w-3" /> Bloqueado ({challengeCooldownDays}d)
          </span>
        )}

        {showChallenge && !isInitiation && isCurrentPlayer && !isAdmin && player.status === 'available' && !hasChallengeCooldown && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] px-2 text-accent hover:bg-accent/15 hover:text-accent"
            onClick={(e) => { e.stopPropagation(); onStartChallenge(index); }}
          >
            <Swords className="h-3 w-3 mr-1" /> Desafiar
          </Button>
        )}
      </div>
    </li>
  );
}

const PlayerList = ({
  listId,
  title,
  players,
  onChallenge,
  onReorder,
  isInitiation,
  isExternal,
  onChallengeInitiation,
  isAdmin,
  highlight,
  loggedNick,
  onSetPlayerStatus,
}: PlayerListProps) => {
  const [challengerIdx, setChallengerIdx] = useState<number | null>(null);
  const [selectedOpponentIdx, setSelectedOpponentIdx] = useState<number | null>(null);
  const [raceModalOpen, setRaceModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!loggedNick;

  const loggedPlayerIndex = loggedNick
    ? players.findIndex(p => p.name.toLowerCase() === loggedNick.toLowerCase())
    : -1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = players.findIndex(p => p.id === active.id);
    const newIdx = players.findIndex(p => p.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) onReorder(oldIdx, newIdx);
  };

  const handleStartChallenge = (idx: number) => {
    setChallengerIdx(idx);

    if (isAdmin) {
      // Admin: pick any opponent, skip adjacency in the selection modal
      setError(null);
      // We'll show opponent list but allow any pick
    }

    // For admin, directly show opponent selection (no adjacency restriction visually)
    setError(null);
  };

  const handleSelectOpponent = (challengedIdx: number) => {
    if (challengerIdx === null) return;
    // Open MD3 config modal instead of immediately challenging
    setSelectedOpponentIdx(challengedIdx);
    setRaceModalOpen(true);
  };

  const handleConfirmRace = (tracks: [string, string, string]) => {
    if (challengerIdx === null || selectedOpponentIdx === null) return;
    const err = onChallenge(challengerIdx, selectedOpponentIdx, tracks);
    if (err) {
      setError(err);
      setRaceModalOpen(false);
    } else {
      setRaceModalOpen(false);
      setChallengerIdx(null);
      setSelectedOpponentIdx(null);
      setError(null);
    }
  };

  const showChallengeButtons = isLoggedIn && !isInitiation && !isExternal;

  return (
    <div className={`card-racing rounded-xl overflow-hidden ${highlight ? 'neon-glow neon-border border-2' : 'neon-border'}`}>
      <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${highlight ? 'bg-accent' : 'bg-primary'} animate-pulse`} />
        <h2 className={`text-xs font-bold tracking-[0.2em] uppercase font-['Orbitron'] ${highlight ? 'neon-text-pink' : 'neon-text-purple'}`}>
          {title}
        </h2>
        <span className="ml-auto text-[10px] text-muted-foreground font-bold">{players.length} pilotos</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={players.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-border/50">
            {players.map((player, i) => (
              <SortablePlayer
                key={player.id}
                player={player}
                index={i}
                isInitiation={isInitiation}
                isExternal={isExternal}
                isAdmin={isAdmin}
                onStartChallenge={handleStartChallenge}
                onChallengeInitiation={onChallengeInitiation}
                showChallenge={showChallengeButtons}
                isLoggedIn={isLoggedIn}
                isCurrentPlayer={isAdmin || i === loggedPlayerIndex}
                onSetPlayerStatus={onSetPlayerStatus}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {/* Opponent selection dialog - shown when challenger clicks Desafiar */}
      {challengerIdx !== null && !raceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setChallengerIdx(null); setError(null); }}>
          <div className="card-racing neon-border rounded-xl p-5 max-w-sm w-full mx-4 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="neon-text-purple font-['Orbitron'] text-sm font-bold">
              ⚔ Escolha o Adversário
            </h3>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent font-semibold">{players[challengerIdx]?.name}</span>
              {' '}— selecione quem desafiar{!isAdmin && ' (1 posição acima)'}
            </p>

            {error && (
              <div className="bg-destructive/15 border border-destructive/30 rounded-lg p-3 text-sm text-destructive font-semibold">
                🚫 {error}
              </div>
            )}

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {players.map((p, i) => {
                if (challengerIdx === null || i === challengerIdx) return null;
                const canChallenge = isAdmin
                  ? p.status === 'available' || isAdmin
                  : (i < challengerIdx && challengerIdx - i <= 1 && p.status === 'available');
                return (
                  <button
                    key={p.id}
                    disabled={!canChallenge}
                    onClick={() => handleSelectOpponent(i)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm
                      ${canChallenge
                        ? 'hover:bg-accent/15 hover:neon-text-pink cursor-pointer border border-transparent hover:border-accent/30'
                        : 'opacity-30 cursor-not-allowed'
                      }`}
                  >
                    <span className="font-bold text-primary text-xs w-6">{i + 1}º</span>
                    <span className="font-semibold">{p.name}</span>
                    {p.status !== 'available' && (
                      <span className="ml-auto text-[10px] uppercase text-muted-foreground">{p.status}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { setChallengerIdx(null); setError(null); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* MD3 Race Config Modal */}
      {challengerIdx !== null && selectedOpponentIdx !== null && (
        <RaceConfigModal
          open={raceModalOpen}
          onOpenChange={(open) => {
            setRaceModalOpen(open);
            if (!open) { setSelectedOpponentIdx(null); }
          }}
          challengerName={players[challengerIdx]?.name || ''}
          challengedName={players[selectedOpponentIdx]?.name || ''}
          onConfirm={handleConfirmRace}
        />
      )}
    </div>
  );
};

export default PlayerList;
