// Peek at one necklace, one keychain, one embroidery gift_product row so
// we know exactly which columns the merge scripts need to carry over.

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = ['/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', path.join(root, '.env.local')].find((p) => {
  try { fsSync.accessSync(p); return true; } catch { return false; }
});
const envFile = await fs.readFile(envPath, 'utf8');
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
  for (const slug of ['bar-necklace', 'spotify-keychain', 'line-art-embroidery-shirt']) {
    const [row] = await sql`
      select * from gift_products where slug = ${slug}
    `;
    console.log('\n=== ' + slug + ' ===');
    for (const [k, v] of Object.entries(row ?? {})) {
      const txt = typeof v === 'object' && v !== null ? JSON.stringify(v).slice(0, 120) : String(v).slice(0, 120);
      console.log('  ' + k.padEnd(28) + '  ' + txt);
    }
  }
} finally {
  await sql.end();
}
