// Batch-apply matcher / seo_body / seo_magazine / how_we_print for all
// non-gift service products (except car-decal + name-card which are
// already curated). Reads the 4 batch files produced by content-authoring
// agents and upserts into product_extras in a single transaction.

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

const { BATCH: A } = await import('./content-batch-a.mjs');
const { BATCH: B } = await import('./content-batch-b.mjs');
const { BATCH: C } = await import('./content-batch-c.mjs');
const { BATCH: D } = await import('./content-batch-d.mjs');

const ALL = [...A, ...B, ...C, ...D];
console.log(`Applying ${ALL.length} products...`);

let ok = 0, skipped = 0;
await sql.begin(async (tx) => {
  for (const r of ALL) {
    const [prod] = await tx`select id from products where slug = ${r.slug}`;
    if (!prod) { console.warn(`  skip ${r.slug} — not found`); skipped++; continue; }
    await tx`
      insert into product_extras (product_id, matcher, seo_body, seo_magazine, how_we_print)
      values (${prod.id}, ${tx.json(r.matcher)}, ${r.seo_body}, ${tx.json(r.seo_magazine)}, ${tx.json(r.how_we_print)})
      on conflict (product_id) do update
        set matcher = excluded.matcher,
            seo_body = excluded.seo_body,
            seo_magazine = excluded.seo_magazine,
            how_we_print = excluded.how_we_print
    `;
    ok++;
    console.log(`  ✓ ${r.slug}`);
  }
});

console.log(`\nDone: ${ok} applied, ${skipped} skipped.`);
await sql.end();
