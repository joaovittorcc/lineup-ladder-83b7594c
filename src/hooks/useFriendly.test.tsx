import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useFriendly } from '@/hooks/useFriendly';
import { TRACKS_LIST } from '@/data/tracks';

const pendingRows: {
  id: string;
  challenger_name: string;
  challenged_name: string;
  status: string;
  track_name: string | null;
  created_at: string;
}[] = [];

function jsonRes(data: unknown, error: unknown = null) {
  return Promise.resolve({ data, error });
}

const channelMock = {
  on: vi.fn(function chain(this: typeof channelMock) {
    return this;
  }),
  subscribe: vi.fn(() => ({})),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'friendly_matches') {
        return {
          select: () => ({
            order: () => jsonRes([]),
          }),
          insert: () => jsonRes(null),
        };
      }
      if (table === 'elo_ratings') {
        return {
          select: () => jsonRes([]),
          upsert: () => jsonRes(null),
        };
      }
      if (table === 'friendly_pending_challenges') {
        return {
          select: () => ({
            in: () => ({
              order: () => jsonRes([...pendingRows]),
            }),
          }),
          insert: (payload: Record<string, unknown>) => {
            pendingRows.push({
              id: `pid-${pendingRows.length}`,
              challenger_name: String(payload.challenger_name),
              challenged_name: String(payload.challenged_name),
              status: String(payload.status),
              track_name: null,
              created_at: new Date().toISOString(),
            });
            return jsonRes(null);
          },
          update: (payload: Record<string, unknown>) => ({
            eq: () => ({
              eq: () => {
                for (const r of pendingRows) {
                  if (r.status === 'pending') {
                    if (typeof payload.status === 'string') r.status = payload.status;
                    if (typeof payload.track_name === 'string') r.track_name = payload.track_name;
                  }
                }
                return jsonRes(null);
              },
            }),
          }),
          delete: () => ({
            eq: () => {
              pendingRows.length = 0;
              return jsonRes(null);
            },
          }),
        };
      }
      if (table === 'championship_seasons') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => jsonRes({ pistas: [] }),
            }),
          }),
        };
      }
      return {};
    },
    channel: () => channelMock,
    removeChannel: vi.fn(),
  },
}));

describe('useFriendly (Supabase mock)', () => {
  beforeEach(() => {
    pendingRows.length = 0;
    vi.clearAllMocks();
  });

  it('loads without fetch error and empty pending', async () => {
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => {
      expect(result.current.friendlyFetchError).toBeNull();
    });
    expect(result.current.pendingChallenges).toEqual([]);
  });

  it('createFriendlyChallenge inserts and refetch shows pending', async () => {
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.friendlyFetchError).toBeNull());

    await act(async () => {
      const err = await result.current.createFriendlyChallenge('Alpha', 'Beta');
      expect(err).toBeNull();
    });

    await waitFor(() => {
      expect(result.current.pendingChallenges.length).toBe(1);
      expect(result.current.pendingChallenges[0].challengerName).toBe('Alpha');
      expect(result.current.pendingChallenges[0].challengedName).toBe('Beta');
      expect(result.current.pendingChallenges[0].status).toBe('pending');
    });
  });

  it('rejects empty names', async () => {
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.friendlyFetchError).toBeNull());

    await act(async () => {
      expect(await result.current.createFriendlyChallenge(' ', 'B')).toBe('Nomes inválidos.');
      expect(await result.current.createFriendlyChallenge('A', '  ')).toBe('Nomes inválidos.');
    });
  });

  it('rejects self-challenge before insert', async () => {
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.friendlyFetchError).toBeNull());

    await act(async () => {
      const err = await result.current.createFriendlyChallenge('Same', 'same');
      expect(err).toBe('Não podes desafiar a ti mesmo.');
    });
    expect(pendingRows.length).toBe(0);
  });

  it('rejects second challenge while challenger busy', async () => {
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.friendlyFetchError).toBeNull());

    await act(async () => {
      expect(await result.current.createFriendlyChallenge('A', 'B')).toBeNull();
    });
    await waitFor(() => expect(result.current.pendingChallenges.length).toBe(1));

    await act(async () => {
      const err = await result.current.createFriendlyChallenge('A', 'C');
      expect(err).toBe('Já tens um amistoso ativo (como desafiante ou desafiado).');
    });
  });

  it('rejects challenge when opponent already busy', async () => {
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.friendlyFetchError).toBeNull());

    await act(async () => {
      expect(await result.current.createFriendlyChallenge('A', 'B')).toBeNull();
    });
    await waitFor(() => expect(result.current.pendingChallenges.length).toBe(1));

    await act(async () => {
      const err = await result.current.createFriendlyChallenge('C', 'B');
      expect(err).toBe('Este piloto já está num amistoso ativo.');
    });
  });

  it('accept moves to racing with track', async () => {
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.friendlyFetchError).toBeNull());

    await act(async () => {
      await result.current.createFriendlyChallenge('A', 'B');
    });
    await waitFor(() => expect(result.current.pendingChallenges[0]?.id).toBeDefined());

    const id = result.current.pendingChallenges[0].id;
    let chosenTrack: string | undefined;
    await act(async () => {
      const res = await result.current.acceptFriendlyChallenge(id, 'B');
      expect(res.error).toBeNull();
      chosenTrack = res.trackName;
      expect(chosenTrack).toBeTruthy();
      expect(TRACKS_LIST).toContain(chosenTrack!);
    });

    await waitFor(() => {
      expect(result.current.pendingChallenges[0]?.status).toBe('racing');
      expect(result.current.pendingChallenges[0]?.trackName).toBe(chosenTrack);
    });
  });

  it('only challenged can accept', async () => {
    pendingRows.push({
      id: 'x1',
      challenger_name: 'A',
      challenged_name: 'B',
      status: 'pending',
      track_name: null,
      created_at: new Date().toISOString(),
    });
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.pendingChallenges.length).toBe(1));

    await act(async () => {
      const res = await result.current.acceptFriendlyChallenge('x1', 'A');
      expect(res.error).toBe('Só o desafiado pode aceitar.');
    });
  });

  it('decline removes pending for challenged only', async () => {
    pendingRows.push({
      id: 'd1',
      challenger_name: 'A',
      challenged_name: 'B',
      status: 'pending',
      track_name: null,
      created_at: new Date().toISOString(),
    });
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.pendingChallenges.length).toBe(1));

    await act(async () => {
      expect(await result.current.declineFriendlyChallenge('d1', 'A')).toBe('Só o desafiado pode recusar.');
    });
    expect(pendingRows.length).toBe(1);

    await act(async () => {
      expect(await result.current.declineFriendlyChallenge('d1', 'B')).toBeNull();
    });
    await waitFor(() => expect(result.current.pendingChallenges.length).toBe(0));
  });

  it('cancel removes pending for challenger only', async () => {
    pendingRows.push({
      id: 'c1',
      challenger_name: 'A',
      challenged_name: 'B',
      status: 'pending',
      track_name: null,
      created_at: new Date().toISOString(),
    });
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.pendingChallenges.length).toBe(1));

    await act(async () => {
      expect(await result.current.cancelFriendlyChallenge('c1', 'B')).toBe('Só o desafiante pode cancelar.');
    });
    expect(pendingRows.length).toBe(1);

    await act(async () => {
      expect(await result.current.cancelFriendlyChallenge('c1', 'A')).toBeNull();
    });
    await waitFor(() => expect(result.current.pendingChallenges.length).toBe(0));
  });

  it('resolveFriendly errors when not racing', async () => {
    pendingRows.push({
      id: 'p2',
      challenger_name: 'A',
      challenged_name: 'B',
      status: 'pending',
      track_name: null,
      created_at: new Date().toISOString(),
    });
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.pendingChallenges[0]?.status).toBe('pending'));

    await act(async () => {
      const err = await result.current.resolveFriendly('A', 'p2');
      expect(err).toBe('Amistoso não está em curso.');
    });
  });

  it('resolveFriendly completes when racing', async () => {
    pendingRows.push({
      id: 'r1',
      challenger_name: 'A',
      challenged_name: 'B',
      status: 'racing',
      track_name: 'T1',
      created_at: new Date().toISOString(),
    });
    const { result } = renderHook(() => useFriendly());
    await waitFor(() => expect(result.current.pendingChallenges[0]?.status).toBe('racing'));

    await act(async () => {
      const err = await result.current.resolveFriendly('A', 'r1');
      expect(err).toBeNull();
    });

    await waitFor(() => {
      expect(result.current.pendingChallenges.length).toBe(0);
    });
  });
});
