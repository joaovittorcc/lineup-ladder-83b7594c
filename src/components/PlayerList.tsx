import { useState } from 'react';
import { Player } from '@/types/championship';
import { Clock, Swords, Zap, Crown, Shield, Settings2, Check, UserCog, Flame, Plus } from 'lucide-react';
import { getListCapacity } from '@/constants/listCapacities';
import RoleBadge from '@/components/RoleBadge';
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
import type { PilotRole } from '@/data/users';

interface PlayerListProps {
  listId: string;
  title: string;
  players: Player[];
  onChallenge: (challengerIdx: number, challengedIdx: number, tracks?: string[]) => string | null;
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
  onManagePilot?: (playerName: string) => void;
  onFriendlyChallenge?: (challengerName: string, challengedName: string) => void;
  isLoggedInAnyList?: boolean;
  /** When set, list shows empty slots up to this capacity (admin allocation UI). */
  capacity?: number;
  /** Highlight empty slot being filled (visual index 0..capacity-1). */
  selectedSlotIndex?: number | null;
  /** Admin: next free slot only (index === players.length) opens allocation modal. */
  onEmptySlotClick?: (slotIndex: number) => void;
  /** Resolve cargo (incl. overrides de admin); se omitido, RoleBadge usa só users.ts */
  getPilotRole?: (name: string) => PilotRole;
}

function SortablePlayer({
  player,
  index,
  isInitiation,
  isExternal,
  isJoker,
  isAdmin,
  onStartChallenge,
  onStartFriendly,
  onChallengeInitiation,
  showChallenge,
  showFriendly,
  isLoggedIn,
  isValidTarget,
  isFriendlyTarget,
  onSetPlayerStatus,
  isDefeatedByJoker,
  onManagePilot,
  getPilotRole,
}: {
  player: Player;
  index: number;
  isInitiation?: boolean;
  isExternal?: boolean;
  isJoker?: boolean;
  isAdmin?: boolean;
  onStartChallenge: (idx: number) => void;
  onStartFriendly: (idx: number) => void;
  onChallengeInitiation?: (playerId: string) => void;
  showChallenge: boolean;
  showFriendly: boolean;
  isLoggedIn: boolean;
  isValidTarget: boolean;
  isFriendlyTarget: boolean;
  onSetPlayerStatus?: (playerId: string, status: 'available' | 'racing' | 'cooldown') => void;
  isDefeatedByJoker?: boolean;
  onManagePilot?: (playerName: string) => void;
  getPilotRole?: (name: string) => PilotRole;
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

  const isFirst = index === 0 && !isInitiation;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''} group
        ${isFirst ? 'first-place-row' : ''}
        ${isRacing ? 'bg-accent/10 border-l-2 border-l-accent' : ''}
        ${isCooldown ? 'bg-muted/30 opacity-70' : ''}
        ${isDefeatedByJoker ? 'opacity-50 bg-muted/20' : ''}
        ${!isRacing && !isCooldown && !isFirst && !isDefeatedByJoker ? 'hover:bg-secondary/60 hover:translate-x-1' : ''}
        ${isFirst && !isRacing && !isCooldown ? 'hover:bg-yellow-400/10' : ''}
      `}
    >
      {isInitiation ? (
        <span className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 transition-all duration-200 ${
          isDefeatedByJoker 
            ? 'bg-green-400/20 border border-green-400/40' 
            : 'bg-muted/40'
        }`}>
          {isDefeatedByJoker ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
          )}
        </span>
      ) : (
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold font-['Orbitron'] shrink-0 transition-all duration-200 ${
          isFirst
            ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40'
            : 'bg-primary/10 text-primary border border-primary/20'
        }`}>
          {isFirst ? <Crown className="h-4 w-4" /> : index + 1}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-bold tracking-wide truncate transition-all duration-200 ${
            isFirst ? 'text-yellow-400' : 
            isDefeatedByJoker ? 'text-muted-foreground line-through' : 
            'text-foreground'
          }`}>
            {player.name}
          </span>
          <RoleBadge playerName={player.name} role={getPilotRole?.(player.name)} />
          {isInitiation && isDefeatedByJoker && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-green-400 px-1.5 py-0.5 rounded bg-green-400/10 border border-green-400/30">
              ✓ Derrotado
            </span>
          )}
        </div>
      </div>

      {/* Action buttons area */}
      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
        {/* Admin management buttons */}
        {isAdmin && onSetPlayerStatus && !isInitiation && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                <Settings2 className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-secondary border-border">
              <DropdownMenuItem onClick={() => onSetPlayerStatus(player.id, 'available')} className="text-xs">
                ✅ Disponível
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetPlayerStatus(player.id, 'racing')} className="text-xs">
                ⚡ Em Corrida
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetPlayerStatus(player.id, 'cooldown')} className="text-xs">
                ⏳ Cooldown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isAdmin && onManagePilot && !isInitiation && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onManagePilot(player.name); }}
          >
            <UserCog className="h-3 w-3" />
          </Button>
        )}

        {/* Initiation challenge for Jokers */}
        {isInitiation && isJoker && onChallengeInitiation && !isDefeatedByJoker && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] px-2 text-accent hover:bg-accent/15 hover:text-accent"
            onClick={(e) => { e.stopPropagation(); onChallengeInitiation(player.id); }}
          >
            <Swords className="h-3 w-3 mr-1" /> Desafiar MD1
          </Button>
        )}

        {isInitiation && isJoker && isDefeatedByJoker && (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-green-400 px-3 py-1 rounded-full bg-green-400/15 border border-green-400/40 shadow-sm">
            <Check className="h-3.5 w-3.5" /> Derrotado
          </span>
        )}

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

        {/* Challenge button (ladder position) */}
        {showChallenge && !isInitiation && isValidTarget && player.status === 'available' && !hasChallengeCooldown && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[9px] px-1.5 text-accent hover:bg-accent/15 hover:text-accent"
            onClick={(e) => { e.stopPropagation(); onStartChallenge(index); }}
          >
            <Swords className="h-3 w-3 mr-0.5" /> Desafiar
          </Button>
        )}

        {showChallenge && !isInitiation && isValidTarget && player.status === 'available' && hasChallengeCooldown && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-muted/30 border border-border">
            <Clock className="h-3 w-3" /> Bloqueado ({challengeCooldownDays}d)
          </span>
        )}

        {/* Friendly button (any player, orange) */}
        {showFriendly && !isInitiation && isFriendlyTarget && player.status === 'available' && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[9px] px-1.5 text-orange-400 hover:bg-orange-500/15 hover:text-orange-300"
            onClick={(e) => { e.stopPropagation(); onStartFriendly(index); }}
          >
            <Flame className="h-3 w-3 mr-0.5" /> Amistoso
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
  isJoker,
  onChallengeInitiation,
  isAdmin,
  highlight,
  loggedNick,
  onSetPlayerStatus,
  jokerDefeatedIds = [],
  onManagePilot,
  onFriendlyChallenge,
  isLoggedInAnyList,
  capacity: capacityProp,
  selectedSlotIndex = null,
  onEmptySlotClick,
  getPilotRole,
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
    setChallengerIdx(loggedPlayerIndex);
    setSelectedOpponentIdx(targetIdx);
    setRaceModalOpen(true);
    setError(null);
  };

  const handleStartFriendly = (targetIdx: number) => {
    if (!loggedNick || !onFriendlyChallenge) return;
    const target = players[targetIdx];
    if (target) {
      onFriendlyChallenge(loggedNick, target.name);
    }
  };

  const handleConfirmRace = (tracks: string[]) => {
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

  const showChallengeButtons = isLoggedIn && !isInitiation && !isExternal && !isJoker;
  const showFriendlyButtons = isLoggedIn && !isInitiation && (loggedPlayerIndex >= 0 || isLoggedInAnyList === true);

  const capacity =
    capacityProp !== undefined && capacityProp > 0 ? capacityProp : getListCapacity(listId);
  // ✅ NOVO: Mostrar slots vazios para todos, mas só admin pode clicar
  const showEmptySlots = Boolean(capacity > 0 && capacity > players.length);
  const emptyCount = showEmptySlots ? Math.max(0, capacity - players.length) : 0;
  const nextSlotIndex = players.length;

  return (
    <div className={`card-racing overflow-hidden hover-lift ${highlight ? 'neon-glow neon-border border-2' : 'neon-border'}`}>
      <div className="bg-secondary/80 px-5 py-4 border-b border-border flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${highlight ? 'bg-accent' : 'bg-primary'} animate-pulse`} />
        <h2 className={`text-xs font-bold tracking-[0.2em] uppercase font-['Orbitron'] ${highlight ? 'neon-text-pink' : 'neon-text-purple'}`}>
          {title}
        </h2>
        {!isInitiation && (
          <span className="kanji-accent text-[10px] text-primary/30 ml-1">夜</span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground font-bold">
          {showEmptySlots ? `${players.length} / ${capacity}` : players.length} pilotos
        </span>
      </div>

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
                onStartFriendly={handleStartFriendly}
                onChallengeInitiation={onChallengeInitiation}
                showChallenge={showChallengeButtons}
                showFriendly={showFriendlyButtons}
                isLoggedIn={isLoggedIn}
                isValidTarget={
                  loggedPlayerIndex > 0 && i === loggedPlayerIndex - 1
                }
                isFriendlyTarget={
                  isLoggedIn && i !== loggedPlayerIndex && (loggedNick || '').toLowerCase() !== player.name.toLowerCase()
                }
                onSetPlayerStatus={onSetPlayerStatus}
                isDefeatedByJoker={isJoker && (jokerDefeatedIds.includes(player.id) || player.initiationComplete)}
                onManagePilot={onManagePilot}
                getPilotRole={getPilotRole}
              />
            ))}
            {showEmptySlots &&
              emptyCount > 0 &&
              Array.from({ length: emptyCount }, (_, i) => {
                const slotIndex = nextSlotIndex + i;
                const isNextFree = i === 0;
                const isSelected = selectedSlotIndex === slotIndex;
                
                // ✅ Admin: slot clicável
                if (isAdmin && onEmptySlotClick && isNextFree) {
                  return (
                    <li key={`empty-${listId}-${slotIndex}`}>
                      <button
                        type="button"
                        onClick={() => onEmptySlotClick?.(slotIndex)}
                        className={`
                          flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200
                          border-2 border-dashed rounded-none
                          ${isSelected
                            ? 'border-accent bg-accent/10 ring-1 ring-accent/50'
                            : 'border-muted-foreground/35 bg-muted/5 hover:border-accent/50 hover:bg-accent/5'
                          }
                        `}
                        aria-label={`Adicionar piloto na posição ${slotIndex + 1} em ${title}`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground shrink-0">
                          <Plus className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          Vaga livre — clique para alocar piloto
                        </span>
                      </button>
                    </li>
                  );
                }
                
                // ✅ Não-admin ou slots bloqueados: apenas visualização
                return (
                  <li
                    key={`empty-${listId}-${slotIndex}`}
                    className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-muted-foreground/20 bg-muted/5 opacity-60"
                    aria-label={`Vaga ${slotIndex + 1} aguardando preenchimento`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/25 shrink-0">
                      <Plus className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                      {isNextFree 
                        ? 'Vaga livre — Aguardando preenchimento pelo admin'
                        : 'Vaga — Preenche a posição anterior primeiro'
                      }
                    </span>
                  </li>
                );
              })}
          </ul>
        </SortableContext>
      </DndContext>

      {/* Telemetry data stream */}
      <div className="telemetry-data" />

      {challengerIdx !== null && selectedOpponentIdx !== null && (
        <RaceConfigModal
          open={raceModalOpen}
          onOpenChange={(open) => {
            setRaceModalOpen(open);
            if (!open) { setSelectedOpponentIdx(null); }
          }}
          challengerName={players[challengerIdx]?.name || ''}
          challengedName={players[selectedOpponentIdx]?.name || ''}
          currentUserName={loggedNick || undefined}
          trackCount={1}
          matchCount={3}
          submitLabel="Enviar Desafio"
          descriptionText="Escolha 1 pista inicial. O desafiado escolherá as outras 2 pistas quando aceitar."
          onConfirm={handleConfirmRace}
        />
      )}
    </div>
  );
};

export default PlayerList;
