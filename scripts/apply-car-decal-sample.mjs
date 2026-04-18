// One-off: apply car-decal matcher + SEO body sample for voice review.
// Extended by seo-rewrite-services-v2.mjs once the sample is approved.

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

const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the job,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'Every decal is outdoor-graded.',
  right_note_body: 'Printed on calendared vinyl, checked by our team.',
  rows: [
    {
      need: 'Your van starts deliveries *this week*',
      pick_title: 'Gloss Vinyl, A4, Removable',
      pick_detail: 'From S$28/pc · 2–3 day production · one-piece peel-and-stick',
    },
    {
      need: "You're branding *a whole fleet* — same colour on every van",
      pick_title: 'Gloss Vinyl, A3, Permanent',
      pick_detail: 'From S$45/pc · colour-matched across the run · scales to 50+ vehicles',
    },
    {
      need: 'It will sit in *sun, rain and daily washes* for years',
      pick_title: 'Matt Vinyl, A3, Permanent',
      pick_detail: 'From S$47/pc · UV-stable pigment · no lifting edges, no chalking',
    },
    {
      need: 'You want *wow* on the rear window, not just a logo',
      pick_title: 'Chrome Vinyl, A3, Permanent',
      pick_detail: 'From S$50/pc · mirror finish · turns heads in every traffic jam',
    },
    {
      need: 'Personal car, small run, still *clean finish*',
      pick_title: 'Gloss Vinyl, A5, Removable',
      pick_detail: "From S$18/pc · peels off without residue when it's time to sell",
    },
  ],
};

const seo_body = `Every day your vehicle spends on Singapore roads, it crosses paths with tens of thousands of people who have nowhere else to look. That's billboard-grade reach — without the ad spend.

Where car decals pull their weight in SG:
- Private-hire PHVs meeting LTA vehicle-marking rules
- Logistics vans that double as rolling shopfronts
- F&B delivery bikes with clean panel branding
- Dealer event cars and roadshow fleets
- Personal cars, modding scenes, show-ready builds

The variable that separates a clean decal from a peeling one is the vinyl itself, not the design. Singapore's sun hits harder than the manufacturer's spec sheet assumes, and daily carpark wet-rain cycles will chew through the cheap outdoor film you find on marketplaces. We print on calendared vinyl rated for years of daily exposure, with adhesive that grips repainted panels and still lets you peel cleanly when the wrap comes off.

If the job is temporary — a roadshow, a launch, a weekend event — tell us and we'll spec removable adhesive so nothing gets left behind on the paint.`;

const [prod] = await sql`select id from products where slug = 'car-decal'`;
if (!prod) { console.error('car-decal not found'); process.exit(1); }

await sql`
  insert into product_extras (product_id, matcher, seo_body)
  values (${prod.id}, ${sql.json(matcher)}, ${seo_body})
  on conflict (product_id) do update
    set matcher = excluded.matcher,
        seo_body = excluded.seo_body
`;

console.log('✓ car-decal updated');
await sql.end();
