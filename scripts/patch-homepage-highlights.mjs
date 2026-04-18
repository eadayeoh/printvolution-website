// One-off patch: update the proof quote to wrap "CMYK conversion issue"
// in *...* markers so the Proof component renders it with the v4 yellow
// underline highlight. Safe to re-run.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

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
  console.error('SUPABASE_DB_URL not set');
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

try {
  // Fetch current proof row
  const rows = await sql`
    select data from public.page_content
    where page_key = 'home' and section_key = 'proof.main'
    limit 1
  `;
  if (rows.length === 0) {
    console.log('No proof.main row — nothing to patch.');
    process.exit(0);
  }
  const data = rows[0].data;
  const items = Array.isArray(data?.items) ? data.items : [];
  let changed = false;
  for (const it of items) {
    if (it?.kind === 'quote' && typeof it.text === 'string') {
      // Wrap the phrase "CMYK conversion issue" in *...* if not already.
      if (it.text.includes('CMYK conversion issue') && !it.text.includes('*CMYK conversion issue*')) {
        it.text = it.text.replace('CMYK conversion issue', '*CMYK conversion issue*');
        changed = true;
      }
    }
  }

  if (!changed) {
    console.log('Quote already has highlight marker (or phrase not found). Nothing to do.');
  } else {
    await sql`
      update public.page_content
      set data = ${sql.json({ ...data, items })}
      where page_key = 'home' and section_key = 'proof.main'
    `;
    console.log('✓ Updated proof quote with *CMYK conversion issue* marker.');
  }
} catch (err) {
  console.error('Patch failed:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
