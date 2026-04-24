import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = await fs.readFile('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
for (const raw of envFile.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('='); if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
try {
  await sql.unsafe(await fs.readFile(path.join(root, 'supabase/migrations/0052_gift_pipeline_provider.sql'), 'utf8'));
  const r = await sql`select slug, kind, provider, ai_model_slug from gift_pipelines order by kind, slug`;
  console.log('Pipelines after migration:');
  for (const p of r) console.log(`  [${p.kind}] ${p.slug}  provider=${p.provider}  model=${p.ai_model_slug || '—'}`);
} finally { await sql.end(); }
