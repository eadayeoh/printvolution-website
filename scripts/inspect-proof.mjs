import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = await fs.readFile(path.join(root, '.env.local'), 'utf8');
for (const raw of envFile.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
try {
  const rows = await sql`
    select data from public.page_content
    where page_key = 'home' and section_key = 'proof.main'
  `;
  for (const r of rows) {
    const items = r.data?.items ?? [];
    for (const it of items) {
      if (it?.kind === 'quote') {
        console.log('QUOTE TEXT:');
        console.log(JSON.stringify(it.text));
      }
    }
  }
} finally {
  await sql.end();
}
