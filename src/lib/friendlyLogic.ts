import type { EloRatings, PendingFriendlyChallenge } from '@/types/championship';
import { TRACKS_LIST } from '@/data/tracks';

export const FRIENDLY_BASE_ELO = 1000;
const K_FACTOR = 32;

export function parsePistas(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string').map(s => s.trim()).filter(Boolean);
}

export function buildTrackPool(pistas: unknown): string[] {
  const extras = parsePistas(pistas);
  return [...new Set([...TRACKS_LIST, ...extras])];
}

/** Deterministic tests: pass random 0..1; default uses Math.random(). */
export function pickRandomTrack(pool: string[], random01: () => number = Math.random): string {
  if (pool.length === 0) return TRACKS_LIST[0] ?? '—';
  return pool[Math.floor(random01() * pool.length)]!;
}

export function namesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function involvesPlayer(row: PendingFriendlyChallenge, nick: string): boolean {
  return namesMatch(row.challengerName, nick) || namesMatch(row.challengedName, nick);
}

export function calculateEloChange(winnerElo: number, loserElo: number): number {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const change = Math.round(K_FACTOR * (1 - expectedWinner));
  return Math.max(10, change);
}

export function getElo(ratings: EloRatings, name: string): number {
  return ratings[name.toLowerCase()] ?? FRIENDLY_BASE_ELO;
}

export function friendlyLoserName(
  winnerName: string,
  challengerName: string,
  challengedName: string
): string {
  return namesMatch(winnerName, challengerName) ? challengedName : challengerName;
}

/** Same math as useFriendly.resolveFriendly (no DB). */
export function computeFriendlyResolution(
  ratings: EloRatings,
  winnerName: string,
  challengerName: string,
  challengedName: string
) {
  const loserName = friendlyLoserName(winnerName, challengerName, challengedName);
  const winnerElo = getElo(ratings, winnerName);
  const loserElo = getElo(ratings, loserName);
  const eloChange = calculateEloChange(winnerElo, loserElo);
  const newWinnerElo = winnerElo + eloChange;
  const newLoserElo = Math.max(100, loserElo - eloChange);
  return {
    loserName,
    eloChange,
    newWinnerElo,
    newLoserElo,
    challengerEloAfter: namesMatch(winnerName, challengerName) ? newWinnerElo : newLoserElo,
    challengedEloAfter: namesMatch(winnerName, challengedName) ? newWinnerElo : newLoserElo,
    challengerEloBefore: getElo(ratings, challengerName),
    challengedEloBefore: getElo(ratings, challengedName),
  };
}

export function mapFriendlyDuplicateError(dbMessage: string): boolean {
  return /duplicate key|unique constraint/i.test(dbMessage);
}
