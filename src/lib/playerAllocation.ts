import type { PlayerList } from '@/types/championship';
import type { AuthUser } from '@/data/users';

export function pilotNameMatchesUser(playerName: string, u: AuthUser): boolean {
  const n = playerName.trim().toLowerCase();
  return n === u.displayName.trim().toLowerCase() || n === u.username.trim().toLowerCase();
}

export function userAlreadyInList(list: PlayerList | undefined, u: AuthUser): boolean {
  if (!list) return false;
  return list.players.some(p => pilotNameMatchesUser(p.name, u));
}

/**
 * Pilots selectable for allocation into `targetListId`:
 * - initiation: anyone not already in initiation (may be on L01/L02 or new).
 * - list-01 / list-02: not already on that list and not on the other main list (one main slot per person).
 */
export function getAllocatableCandidates(
  targetListId: string,
  lists: PlayerList[],
  authorizedUsers: AuthUser[]
): AuthUser[] {
  const initiation = lists.find(l => l.id === 'initiation');
  const list01 = lists.find(l => l.id === 'list-01');
  const list02 = lists.find(l => l.id === 'list-02');
  const target = lists.find(l => l.id === targetListId);

  if (targetListId === 'initiation') {
    return authorizedUsers.filter(u => !userAlreadyInList(initiation, u));
  }

  if (targetListId === 'list-01' || targetListId === 'list-02') {
    return authorizedUsers.filter(
      u => !userAlreadyInList(list01, u) && !userAlreadyInList(list02, u)
    );
  }

  return authorizedUsers.filter(u => !userAlreadyInList(target, u));
}

/** Maps PostgREST / Postgres errors to clearer copy for admins. */
export function formatPlayersTableError(message: string | undefined | null): string {
  const m = (message || '').trim();
  if (!m) return 'Erro desconhecido ao atualizar pilotos.';
  const lower = m.toLowerCase();
  if (lower.includes('row-level security') || lower.includes('rls') || lower.includes('policy')) {
    return 'Permissão negada na base de dados (RLS). No Supabase, aplica as políticas para o role anon em public.players (INSERT/UPDATE/DELETE) — ver migração 20260411120000_anon_players_write.sql.';
  }
  return m;
}
