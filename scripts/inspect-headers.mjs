// Diagnostic: dump the current page_content rows for the 3 headers
// that are rendering wrong on /about and /contact.

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
  const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });

try {
  const rows = await sql`
    select page_key, section_key, data from public.page_content
    where (page_key, section_key) in (
      ('about', 'stats.header'),
      ('contact', 'hours.header'),
      ('contact', 'hours.days')
    )
    order by page_key, section_key
  `;
  for (const r of rows) {
    console.log(`\n— ${r.page_key}:${r.section_key} —`);
    console.log(JSON.stringify(r.data, null, 2));
  }
} finally {
  await sql.end();
}
