import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('migração friendly_pending_and_track', () => {
  const path = resolve(root, 'supabase/migrations/20260413140000_friendly_pending_and_track.sql');
  const sql = readFileSync(path, 'utf8');

  it('cria tabela friendly_pending_challenges e índice único parcial', () => {
    expect(sql).toContain('CREATE TABLE public.friendly_pending_challenges');
    expect(sql).toContain('friendly_pending_active_pair_idx');
    expect(sql).toMatch(/status IN \('pending', 'racing'\)/);
  });

  it('adiciona track_name em friendly_matches', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS track_name');
  });

  it('expõe RLS e políticas anon para pendentes', () => {
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('Anon can insert friendly pending');
    expect(sql).toContain('Anon can update friendly pending');
    expect(sql).toContain('Anon can delete friendly pending');
  });

  it('inclui realtime e grants', () => {
    expect(sql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE public.friendly_pending_challenges');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendly_pending_challenges TO anon');
    expect(sql).toContain('Anon can insert friendly matches');
    expect(sql).toContain('Anon can insert elo ratings');
  });
});
