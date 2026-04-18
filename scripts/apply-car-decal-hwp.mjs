// Car-decal-specific "How we print" 4-card override.
// Replaces generic site-default cards (Pre-press / Digital mockup /
// Island delivery / Express) with production concerns that actually
// matter for vehicle vinyl jobs.

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

const how_we_print = [
  { icon_url: null, emoji: '🎯', title: 'Cast vinyl only', desc: 'No calendared film sneaked in — 3–5 year UV-rated stock across every job.' },
  { icon_url: null, emoji: '✂️', title: 'Contour-cut to art', desc: 'Plotter-cut to your vector shape, not a rectangular crop. Weeded and ready to apply.' },
  { icon_url: null, emoji: '🎨', title: 'Pantone-matched fleets', desc: 'Colour profile logged — recut from the master when the fleet grows.' },
  { icon_url: null, emoji: '🚗', title: 'Install-ready pack', desc: 'Squeegee, application tape, and a step-by-step card — DIY-friendly.' },
];

const [prod] = await sql`select id from products where slug = 'car-decal'`;
await sql`update product_extras set how_we_print = ${sql.json(how_we_print)} where product_id = ${prod.id}`;
console.log('✓ car-decal how_we_print updated');
await sql.end();
