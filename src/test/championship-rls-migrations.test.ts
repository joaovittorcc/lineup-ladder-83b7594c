import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('championship_seasons RLS no repositório', () => {
  it('inclui políticas anon para INSERT em championship_seasons', () => {
    const path = resolve(root, 'supabase/migrations/20260411180000_championship_command_center.sql');
    const sql = readFileSync(path, 'utf8');
    expect(sql).toContain('Anon can insert championship seasons');
    expect(sql).toContain('ON public.championship_seasons FOR INSERT TO anon');
  });

  it('inclui GRANT para anon nas tabelas do campeonato', () => {
    const path = resolve(root, 'supabase/migrations/20260411203000_championship_anon_grants.sql');
    const sql = readFileSync(path, 'utf8');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_seasons TO anon');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_registrations TO anon');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_race_results TO anon');
  });

  it('paste_championship_setup.sql alinha com migrações (políticas + grants)', () => {
    const path = resolve(root, 'supabase/paste_championship_setup.sql');
    const sql = readFileSync(path, 'utf8');
    expect(sql).toContain('Anon can insert championship seasons');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_seasons TO anon');
  });
});
