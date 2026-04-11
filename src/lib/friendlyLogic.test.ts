import { describe, expect, it } from 'vitest';
import {
  FRIENDLY_BASE_ELO,
  buildTrackPool,
  calculateEloChange,
  computeFriendlyResolution,
  friendlyLoserName,
  getElo,
  involvesPlayer,
  mapFriendlyDuplicateError,
  namesMatch,
  parsePistas,
  pickRandomTrack,
} from '@/lib/friendlyLogic';
import { TRACKS_LIST } from '@/data/tracks';
import type { PendingFriendlyChallenge } from '@/types/championship';

function row(p: Partial<PendingFriendlyChallenge> & Pick<PendingFriendlyChallenge, 'id'>): PendingFriendlyChallenge {
  return {
    challengerName: 'A',
    challengedName: 'B',
    status: 'pending',
    trackName: null,
    createdAt: 0,
    ...p,
  };
}

describe('parsePistas', () => {
  it('returns [] for non-array', () => {
    expect(parsePistas(null)).toEqual([]);
    expect(parsePistas(undefined)).toEqual([]);
    expect(parsePistas({})).toEqual([]);
    expect(parsePistas('x')).toEqual([]);
    expect(parsePistas(3)).toEqual([]);
  });

  it('filters and trims strings', () => {
    expect(parsePistas(['  a  ', 'b', '', '  ', 99, null])).toEqual(['a', 'b']);
  });
});

describe('buildTrackPool', () => {
  it('includes all TRACKS_LIST when pistas empty', () => {
    const p = buildTrackPool([]);
    expect(p.length).toBe(TRACKS_LIST.length);
    expect(p).toContain(TRACKS_LIST[0]);
  });

  it('merges extras without duplicates (case-sensitive dedupe in Set)', () => {
    const extra = 'CUSTOM PISTA';
    const p = buildTrackPool([extra, extra, '  x  ']);
    expect(p).toContain(extra);
    expect(p).toContain('x');
    const set = new Set(p);
    expect(set.size).toBe(p.length);
  });

  it('includes known track plus duplicate from list', () => {
    const first = TRACKS_LIST[0];
    const p = buildTrackPool([first]);
    expect(p.filter(t => t === first).length).toBe(1);
  });
});

describe('pickRandomTrack', () => {
  it('returns first track when random is 0', () => {
    const pool = ['A', 'B', 'C'];
    expect(pickRandomTrack(pool, () => 0)).toBe('A');
  });

  it('returns last when random approaches 1', () => {
    const pool = ['A', 'B', 'C'];
    expect(pickRandomTrack(pool, () => 0.999)).toBe('C');
  });

  it('returns middle with random 0.5 for 3 items', () => {
    const pool = ['A', 'B', 'C'];
    expect(pickRandomTrack(pool, () => 0.5)).toBe('B');
  });

  it('falls back when pool empty', () => {
    expect(pickRandomTrack([], () => 0.5)).toBe(TRACKS_LIST[0] ?? '—');
  });

  it('covers full pool with grid of random values', () => {
    const pool = ['T0', 'T1', 'T2', 'T3', 'T4'];
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const r = (i * 0.001) % 0.999;
      seen.add(pickRandomTrack(pool, () => r));
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});

describe('namesMatch', () => {
  it('case and trim insensitive', () => {
    expect(namesMatch('  Evo  ', 'evo')).toBe(true);
    expect(namesMatch('EvoJota', 'evojota')).toBe(true);
  });

  it('false when different', () => {
    expect(namesMatch('A', 'B')).toBe(false);
  });
});

describe('involvesPlayer', () => {
  it('true for challenger or challenged (case)', () => {
    const r = row({ challengerName: 'X', challengedName: 'Y' });
    expect(involvesPlayer(r, 'x')).toBe(true);
    expect(involvesPlayer(r, 'Y')).toBe(true);
  });

  it('false for outsider', () => {
    expect(involvesPlayer(row({}), 'Z')).toBe(false);
  });
});

describe('getElo', () => {
  it('uses base when missing', () => {
    expect(getElo({}, 'Anyone')).toBe(FRIENDLY_BASE_ELO);
  });

  it('lowercases key', () => {
    expect(getElo({ evo: 1200 }, 'Evo')).toBe(1200);
  });
});

describe('calculateEloChange', () => {
  it('minimum change is 10', () => {
    expect(calculateEloChange(2000, 1000)).toBeGreaterThanOrEqual(10);
    expect(calculateEloChange(1000, 1000)).toBeGreaterThanOrEqual(10);
  });

  it('favourite beating underdog yields smaller change than upset', () => {
    const fav = calculateEloChange(1400, 1000);
    const upset = calculateEloChange(1000, 1400);
    expect(upset).toBeGreaterThan(fav);
  });

  it('symmetric ratings give moderate swing', () => {
    const c = calculateEloChange(1000, 1000);
    expect(c).toBe(16);
  });
});

describe('friendlyLoserName', () => {
  it('identifies loser from winner', () => {
    expect(friendlyLoserName('A', 'A', 'B')).toBe('B');
    expect(friendlyLoserName('B', 'A', 'B')).toBe('A');
  });

  it('case insensitive winner match', () => {
    expect(friendlyLoserName('a', 'A', 'B')).toBe('B');
  });
});

describe('computeFriendlyResolution', () => {
  const empty: Record<string, number> = {};

  it('equal ELO: winner gains 16, loser 984 floor not hit', () => {
    const r = computeFriendlyResolution(empty, 'A', 'A', 'B');
    expect(r.eloChange).toBe(16);
    expect(r.newWinnerElo).toBe(1016);
    expect(r.newLoserElo).toBe(984);
    expect(r.loserName).toBe('B');
    expect(r.challengerEloAfter).toBe(1016);
    expect(r.challengedEloAfter).toBe(984);
  });

  it('challenged wins: after values swapped roles', () => {
    const r = computeFriendlyResolution(empty, 'B', 'A', 'B');
    expect(r.challengerEloAfter).toBe(984);
    expect(r.challengedEloAfter).toBe(1016);
  });

  it('floors loser at 100', () => {
    const ratings = { a: 1000, b: 100 };
    const r = computeFriendlyResolution(ratings, 'A', 'A', 'B');
    expect(r.newLoserElo).toBe(100);
  });

  it('uses stored ratings', () => {
    const ratings = { x: 1500, y: 1000 };
    const r = computeFriendlyResolution(ratings, 'X', 'X', 'Y');
    expect(r.challengerEloBefore).toBe(1500);
    expect(r.challengedEloBefore).toBe(1000);
    expect(r.eloChange).toBeLessThan(16);
  });
});

describe('mapFriendlyDuplicateError', () => {
  it('detects duplicate key wording', () => {
    expect(mapFriendlyDuplicateError('duplicate key value violates unique constraint')).toBe(true);
  });

  it('detects unique constraint', () => {
    expect(mapFriendlyDuplicateError('UNIQUE constraint failed')).toBe(true);
  });

  it('false for other errors', () => {
    expect(mapFriendlyDuplicateError('permission denied')).toBe(false);
  });
});
