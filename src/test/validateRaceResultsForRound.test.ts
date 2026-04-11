import { describe, expect, it } from 'vitest';
import { validateRaceResultsForRound, type RaceResult } from '@/hooks/useChampionshipSeason';

const mk = (registration_id: string, race_number: number, finish_position: number, points: number): RaceResult => ({
  id: `${registration_id}-${race_number}`,
  registration_id,
  race_number,
  finish_position,
  points,
});

describe('validateRaceResultsForRound', () => {
  const regs = [
    { id: 'a', pilot_name: 'A' },
    { id: 'b', pilot_name: 'B' },
  ];

  it('falha se falta linha para um piloto', () => {
    const r = validateRaceResultsForRound(regs, [mk('a', 1, 1, 20)], 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/B/);
  });

  it('falha com posição duplicada', () => {
    const results = [mk('a', 1, 2, 17), mk('b', 1, 2, 17)];
    const r = validateRaceResultsForRound(regs, results, 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/2º/);
  });

  it('aceita vários NP', () => {
    const results = [mk('a', 1, 0, 0), mk('b', 1, 0, 0)];
    expect(validateRaceResultsForRound(regs, results, 1)).toEqual({ ok: true });
  });

  it('aceita posições únicas', () => {
    const results = [mk('a', 1, 1, 20), mk('b', 1, 2, 17)];
    expect(validateRaceResultsForRound(regs, results, 1)).toEqual({ ok: true });
  });
});
