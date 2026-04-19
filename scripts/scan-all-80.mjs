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
  // Narrow: look for S$80 that appears within 40 chars of "delivery" or "free"
  const rxDeliveryNearby = /(over|above|free.{0,30}?)S\$\s*80\b|S\$\s*80\b(?=[^\d].{0,30}?(deliver|free|island))/i;
  for (const tbl of ['page_content', 'product_extras', 'gift_products']) {
    const all = await sql.unsafe(`select * from public.${tbl}`);
    for (const r of all) {
      const blob = JSON.stringify(r);
      if (rxDeliveryNearby.test(blob)) {
        console.log(`${tbl} row ${r.id ?? r.section_key ?? r.slug}:`);
        const m = blob.match(/(.{30}S\$\s*80\b.{30})/gi);
        if (m) for (const s of m) console.log('  →', s);
      }
    }
  }
  console.log('---done---');
} finally { await sql.end(); }
