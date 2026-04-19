// Populates site_settings.product_features — the 4 "How we print"
// cards shown on every product page. Run once; admin can tweak
// from /admin/settings after.

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

const product_features = [
  {
    icon_url: null,
    emoji: '🔍',
    title: 'Human file check',
    desc: 'Every PDF reviewed by a real person within 12 hours — CMYK, 3mm bleed, 300dpi, fonts. We catch issues before the plates or the press run.',
  },
  {
    icon_url: null,
    emoji: '💰',
    title: 'Live pricing, no quote emails',
    desc: 'Pick size, finish and quantity — the total updates as you go. Volume breaks are on the page, never hidden behind a "contact us".',
  },
  {
    icon_url: null,
    emoji: '🚚',
    title: 'Islandwide delivery or pickup',
    desc: 'Next-day courier across Singapore, free on orders over S$150. Or walk into Paya Lebar Square and collect the box over the counter.',
  },
  {
    icon_url: null,
    emoji: '⚡',
    title: 'Rush? Tell us up front',
    desc: 'Many jobs can ship next-day or collect same-day from Paya Lebar. WhatsApp us the deadline with your file and we\'ll confirm the fastest route before production starts.',
  },
];

try {
  const rows = await sql`select id from public.site_settings limit 1`;
  if (rows.length === 0) {
    // Insert fresh row if table is empty
    await sql`
      insert into public.site_settings (product_features)
      values (${sql.json(product_features)})
    `;
    console.log('✓ inserted new site_settings row');
  } else {
    await sql`
      update public.site_settings
      set product_features = ${sql.json(product_features)}
      where id = ${rows[0].id}
    `;
    console.log('✓ updated site_settings row', rows[0].id);
  }
  const [check] = await sql`select product_features from public.site_settings limit 1`;
  console.log(JSON.stringify(check.product_features, null, 2));
} finally {
  await sql.end();
}
