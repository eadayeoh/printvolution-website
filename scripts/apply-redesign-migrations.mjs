// One-shot runner for the redesign migrations (0019, 0020, 0021).
// Reads SUPABASE_DB_URL from .env.local and applies the SQL via the
// `postgres` npm package (already in deps). Idempotent — migrations
// themselves use `on conflict do nothing`, so re-running is safe.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// Tiny .env.local parser — avoids adding dotenv as a dependency.
try {
  const envFile = await fs.readFile(path.join(root, '.env.local'), 'utf8');
  for (const raw of envFile.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch (err) {
  console.error('Failed to read .env.local:', err.message);
  process.exit(1);
}

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('SUPABASE_DB_URL not set in .env.local');
  process.exit(1);
}

const migrations = [
  '0019_redesign_chunk1_global_content.sql',
  '0020_redesign_chunk2_home_content.sql',
  '0021_redesign_about_contact.sql',
];

const sql = postgres(url, { max: 1, prepare: false });

try {
  for (const name of migrations) {
    const full = path.join(root, 'supabase', 'migrations', name);
    const body = await fs.readFile(full, 'utf8');
    console.log(`• applying ${name} (${body.length} bytes)`);
    await sql.unsafe(body);
  }

  // Quick verification — count the new rows.
  const rows = await sql`
    select page_key, count(*)::int as n
    from public.page_content
    where page_key in ('global', 'home', 'about', 'contact')
    group by page_key
    order by page_key
  `;
  console.log('\nSeeded row counts:');
  for (const r of rows) console.log(`  ${r.page_key.padEnd(10)} ${r.n}`);
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
