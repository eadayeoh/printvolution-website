// Write a fully car-decal-specific seo_magazine (4 unique articles).
// Zero boilerplate, zero name-card residue, zero generic
// "first impression in hand" filler. Every paragraph about vinyl,
// adhesive, fleet, or car body realities.

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

const magazine = {
  issue_label: 'Issue №01 · Car Decal',
  title: 'Everything worth knowing,',
  title_em: 'before you stick.',
  lede:
    'Most car decal jobs in Singapore look fine on day one and fall apart by month eighteen. The difference lives in four decisions — the vinyl, the adhesive, the colour management, and how the graphic sits against a real car body. Here\'s the plain version of each.',
  articles: [
    {
      num: '01',
      title: 'Why vinyl choice decides the next three years.',
      body: [
        "Car decals are judged by how they look after 18 months, not day one. The difference between a **cast vinyl** and cheap **calendared film** is invisible in the shop — and brutally obvious in a Paya Lebar carpark after one monsoon. Cast vinyl conforms to curves without lifting, holds pigment against SG's UV load, and peels cleanly when the wrap comes off. Calendared shrinks, browns at the edges, and leaves glue residue behind.",
        "We only stock **outdoor-graded cast vinyl** rated for 3–5 years of daily tropical exposure. The pigment is UV-stable, the backing survives the temperature swing between aircon carparks and open-road noon, and the release liner holds grip until you're ready to apply. No budget substitutions sneaked in to save a few cents per square foot.",
      ],
      side: {
        kind: 'pills',
        label: 'Vinyl finish',
        items: [
          { text: 'Gloss', pop: true },
          { text: 'Matt' },
          { text: 'Chrome' },
          { text: 'Perforated (windows)' },
        ],
      },
    },
    {
      num: '02',
      title: "The adhesive question nobody asks until it's too late.",
      body: [
        "Wrong adhesive and your 'temporary' roadshow wrap takes three hours and a heat gun to remove. Right one and a two-year fleet livery peels off in minutes with zero residue. **Permanent adhesive** bonds aggressively for long-term branding — survives high-pressure car washes, road grit, daily thermal cycling. **Removable adhesive** holds firmly up to 12 months, then lifts in one piece, no gummy aftermath on the paint.",
        "We spec the adhesive against your actual use case, not the default. Weekend launch? Removable. LTA-mandated PHV decal living on the car until COE expires? Permanent. Fleet that might rebrand next year? We'll walk through both and pick the one that saves you money on the back end.",
      ],
      side: {
        kind: 'list',
        label: 'Adhesive by job type',
        rows: [
          { text: 'Event / roadshow', time: 'Removable' },
          { text: '6–12 months', time: 'Removable' },
          { text: 'Long-term fleet', time: 'Permanent' },
          { text: 'Window (see-through)', time: 'Perforated' },
        ],
      },
    },
    {
      num: '03',
      title: 'Colour-matching across a fleet of fifty vans.',
      body: [
        "One decal is easy. Fifty vans rolled out across six months of production is where most print shops fail. Without **colour management**, van 1 prints magenta-heavy and van 50 looks faded — same artwork, same vinyl, different day on the printer. Customers notice, and the whole fleet starts to look cheap.",
        "We calibrate to **Pantone references** every run for fleet jobs, log the ICC profile against your brand, and recut from the master when you add vehicles. Logistics operator planning a six-month rollout? Franchise opening outlets quarterly? Tell us upfront and we hold your colour profile on file — so van 50 comes off the press matching van 1 pixel-for-pixel.",
      ],
      side: {
        kind: 'stat',
        label: 'Fleet variance',
        num: '<ΔE 2',
        caption: 'across a full rollout',
      },
    },
    {
      num: '04',
      title: 'Curves, rivets, and the two-millimetre rule.',
      body: [
        "A car body isn't a flat sheet. Door handles, fuel flaps, rivets, panel seams, compound curves — they all conspire to crease and lift cheap vinyl. Good installation starts at the **design stage**: graphics that straddle body seams without critical detail crossing the gap, text sized up so edge-bleed doesn't clip it, and **2mm of clear space around every rivet** so the vinyl heat-forms without tearing.",
        "Upload your artwork and we preflight against panel dimensions before anything hits the plotter. If your design crosses a door seam where it'll rip within three months, we flag it and propose a split. Better to fix the file once than reprint a fleet.",
      ],
      side: {
        kind: 'quote',
        text: 'They caught a rivet clash on our fleet design before we printed 20 vans. Would have been a disaster.',
        attr: 'Operations Lead, SG Logistics',
      },
    },
  ],
};

const [prod] = await sql`select id from products where slug = 'car-decal'`;
await sql`update product_extras set seo_magazine = ${sql.json(magazine)} where product_id = ${prod.id}`;
console.log('✓ car-decal magazine updated');
await sql.end();
