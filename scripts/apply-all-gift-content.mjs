// Batch-apply seo_body / seo_magazine / faqs for all 53 active gift products.
// Reads the 4 batch files produced by parallel content-authoring agents.

import fs from 'node:fs/promises';
import postgres from 'postgres';

const env = await fs.readFile(new URL('../.env.local', import.meta.url), 'utf8');
for (const raw of env.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('='); if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const sql = postgres(process.env.SUPABASE_DB_URL, { prepare: false });

const { BATCH: A } = await import('./gift-content-batch-a.mjs');
const { BATCH: B } = await import('./gift-content-batch-b.mjs');
const { BATCH: C } = await import('./gift-content-batch-c.mjs');
const { BATCH: D } = await import('./gift-content-batch-d.mjs');

const ALL = [...A, ...B, ...C, ...D];
console.log(`Applying ${ALL.length} gift products...`);

let ok = 0, missed = 0;
for (const r of ALL) {
  const [row] = await sql`select id from gift_products where slug = ${r.slug}`;
  if (!row) { console.warn(`  skip ${r.slug} — not found`); missed++; continue; }
  await sql`
    update gift_products
    set seo_body = ${r.seo_body},
        seo_magazine = ${sql.json(r.seo_magazine)},
        faqs = ${sql.json(r.faqs)}
    where id = ${row.id}
  `;
  ok++;
  console.log(`  ✓ ${r.slug}`);
}

console.log(`\nDone: ${ok} applied, ${missed} missed.`);
await sql.end();
