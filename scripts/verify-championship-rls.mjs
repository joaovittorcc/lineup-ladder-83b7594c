/**
 * Verifica INSERT/SELECT/DELETE em championship_seasons com a anon key (igual ao browser).
 * Uso: node scripts/verify-championship-rls.mjs
 * Requer .env na raiz com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

if (!existsSync(envPath)) {
  console.error('SKIP: .env não encontrado em', envPath);
  process.exit(0);
}

let url = '';
let key = '';
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (t.startsWith('VITE_SUPABASE_URL=')) url = t.slice(18).trim();
  if (t.startsWith('VITE_SUPABASE_ANON_KEY=')) key = t.slice(24).trim();
}

if (!url || !key) {
  console.error('Falta VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

const supabase = createClient(url, key);
const testName = `__rls_verify_${Date.now()}`;

const insertPayload = {
  name: testName,
  is_active: false,
  phase: 'inscricoes',
  race_count: 3,
};

let { data, error } = await supabase.from('championship_seasons').insert(insertPayload).select('id').maybeSingle();

if (error && /allowed_participant_roles|column/i.test(error.message)) {
  ({ data, error } = await supabase
    .from('championship_seasons')
    .insert({
      name: testName,
      is_active: false,
      phase: 'inscricoes',
      race_count: 3,
    })
    .select('id')
    .maybeSingle());
}

if (error) {
  console.error('VERIFY_FAIL:', error.message);
  process.exit(1);
}

const id = data?.id;
if (!id) {
  console.error('VERIFY_FAIL: insert não devolveu id');
  process.exit(1);
}

const { error: delErr } = await supabase.from('championship_seasons').delete().eq('id', id);
if (delErr) {
  console.error('VERIFY_WARN: linha de teste criada mas delete falhou:', delErr.message, 'id=', id);
  process.exit(1);
}

console.log('VERIFY_OK: championship_seasons INSERT + SELECT + DELETE com anon key');
