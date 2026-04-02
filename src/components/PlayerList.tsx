import { useState } from 'react';
import { Player } from '@/types/championship';
import { Clock, Swords, Zap, Crown, Shield, Settings2, Check } from 'lucide-react';
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
  isJoker?: boolean;
  onChallengeInitiation?: (playerId: string) => void;
  isAdmin?: boolean;
  highlight?: boolean;
  loggedNick?: string | null;
  onSetPlayerStatus?: (playerId: string, status: 'available' | 'racing' | 'cooldown') => void;
  jokerDefeatedIds?: string[];
}

function SortablePlayer({
  player,
  index,
  isInitiation,
  isExternal,
  isJoker,
  isAdmin,
  onStartChallenge,
  onChallengeInitiation,
  showChallenge,
  isLoggedIn,
  isValidTarget,
  onSetPlayerStatus,
  isDefeatedByJoker,
}: {
  player: Player;
  index: number;
  isInitiation?: boolean;
  isExternal?: boolean;
  isJoker?: boolean;
  isAdmin?: boolean;
  onStartChallenge: (idx: number) => void;
  onChallengeInitiation?: (playerId: string) => void;
  showChallenge: boolean;
  isLoggedIn: boolean;
  isValidTarget: boolean;
  onSetPlayerStatus?: (playerId: string, status: 'available' | 'racing' | 'cooldown') => void;
  isDefeatedByJoker?: boolean;
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
          {isDefeatedByJoker ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
          )}
        </span>
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary font-['Orbitron'] shrink-0">
          {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
        </span>
      )}

      <span className={`font-semibold text-sm flex-1 tracking-wide transition-all
        ${isDefeatedByJoker ? 'text-green-400/70 line-through' : ''}
        ${isRacing && !isDefeatedByJoker ? 'neon-text-pink' : ''}
        ${!isRacing && !isDefeatedByJoker ? 'text-foreground group-hover:neon-text-pink' : ''}
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

        {/* Initiation: show Desafiar for joker/external — but NOT if already defeated */}
        {isLoggedIn && isInitiation && (isExternal || isJoker) && onChallengeInitiation && !isDefeatedByJoker && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] px-2 text-accent hover:bg-accent/15 hover:text-accent"
            onClick={(e) => { e.stopPropagation(); onChallengeInitiation(player.id); }}
          >
            <Swords className="h-3 w-3 mr-1" /> Desafiar
          </Button>
        )}

        {/* Initiation: defeated check label */}
        {isLoggedIn && isInitiation && (isExternal || isJoker) && isDefeatedByJoker && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/30">
            ✓ Vencido
          </span>
        )}

        {/* Initiation: neutral label for non-external/non-joker */}
        {isLoggedIn && isInitiation && !isExternal && !isJoker && (
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

        {!isInitiation && player.status === 'pending' && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400 px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 animate-pulse">
            ⚠ PENDENTE
          </span>
        )}

        {!isInitiation && player.defenseCount > 0 && !isCooldown && (
          <span className="flex items-center gap-0.5 text-[10px] text-primary">
            <Shield className="h-3 w-3" /> {player.defenseCount}
          </span>
        )}

        {/* Admin god mode: can challenge anyone */}
        {showChallenge && !isInitiation && isValidTarget && isAdmin && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] px-2 text-accent hover:bg-accent/15 hover:text-accent"
            onClick={(e) => { e.stopPropagation(); onStartChallenge(index); }}
          >
            <Swords className="h-3 w-3 mr-1" /> Desafiar
          </Button>
        )}

        {/* Normal player: button only on the one position above */}
        {showChallenge && !isInitiation && isValidTarget && !isAdmin && player.status === 'available' && !hasChallengeCooldown && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] px-2 text-accent hover:bg-accent/15 hover:text-accent"
            onClick={(e) => { e.stopPropagation(); onStartChallenge(index); }}
          >
            <Swords className="h-3 w-3 mr-1" /> Desafiar
          </Button>
        )}

        {showChallenge && !isInitiation && isValidTarget && !isAdmin && player.status === 'available' && hasChallengeCooldown && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-muted/30 border border-border">
            <Clock className="h-3 w-3" /> Bloqueado ({challengeCooldownDays}d)
          </span>
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
  isJoker,
  onChallengeInitiation,
  isAdmin,
  highlight,
  loggedNick,
  onSetPlayerStatus,
  jokerDefeatedIds = [],
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

  const handleStartChallenge = (targetIdx: number) => {
    if (isAdmin) {
      setChallengerIdx(loggedPlayerIndex >= 0 ? loggedPlayerIndex : targetIdx + 1);
      setSelectedOpponentIdx(targetIdx);
      setRaceModalOpen(true);
    } else {
      setChallengerIdx(loggedPlayerIndex);
      setSelectedOpponentIdx(targetIdx);
      setRaceModalOpen(true);
    }
    setError(null);
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

  // Jokers should NOT see challenge buttons on List 01/02
  const showChallengeButtons = isLoggedIn && !isInitiation && !isExternal && !isJoker;

  return (
    <div className={`card-racing rounded-xl overflow-hidden ${highlight ? 'neon-glow neon-border border-2' : 'neon-border'}`}>
      <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${highlight ? 'bg-accent' : 'bg-primary'} animate-pulse`} />
        <h2 className={`text-xs font-bold tracking-[0.2em] uppercase font-['Orbitron'] ${highlight ? 'neon-text-pink' : 'neon-text-purple'}`}>
          {title}
        </h2>
        <span className="ml-auto text-[10px] text-muted-foreground font-bold">{players.length} pilotos</span>
      </div>

      {/* Joker progress counter */}
      {isInitiation && isJoker && (
        <div className="px-5 py-2 bg-primary/5 border-b border-border flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Progresso MD1
          </span>
          <span className="text-[10px] font-bold text-primary">
            {jokerDefeatedIds.length}/{players.length} ✓
          </span>
        </div>
      )}

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
                isJoker={isJoker}
                isAdmin={isAdmin}
                onStartChallenge={handleStartChallenge}
                onChallengeInitiation={onChallengeInitiation}
                showChallenge={showChallengeButtons}
                isLoggedIn={isLoggedIn}
                isValidTarget={
                  isAdmin
                    ? i !== loggedPlayerIndex
                    : (loggedPlayerIndex > 0 && i === loggedPlayerIndex - 1)
                }
                onSetPlayerStatus={onSetPlayerStatus}
                isDefeatedByJoker={isJoker && jokerDefeatedIds.includes(player.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

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
