// Builds the Books product configurator + pricing_table.prices from the
// pvpricelist snapshot. Follows the flyers pattern: a `method` toggle
// (Digital / Offset) with parallel step_id paths gated via show_if,
// using `axis_order_by_method` for per-path price key composition.
//
// Sources (pvpricelist):
//   • Digital    → `books` tab: BM (mono) and PM (colour) per-sheet
//                  rate tiers + SADDLE_TIERS / PERFECT_TIERS binding
//                  cost tiers.
//   • Offset SS  → `saddleStitch` tab: OSS_TABLES keyed
//                  `${size}-${content}-${cover}` → {pages: [qty-tier prices]}.
//   • Offset PB  → `perfectBinding` tab: PB_${size}_${finish}_260 →
//                  {qty: {pages: dollars}}.  Only 260GSM covers exist
//                  upstream (310GSM omitted).
//
// Cover and lamination are separate steps — customer picks the cover
// paper first, then the finish. Steps appear before inner-paper so the
// form reads top-down in the natural "outside-in" book anatomy order:
// method → binding → size → cover → lamination → inner paper → pages → qty.
//
// Two '260' cover slugs (`260_pb`, `260_ss`) exist because perfect and
// saddle price 260gsm cover differently upstream; the customer sees
// identical labels ("260gsm Art Card") — only one is ever visible
// depending on their binding choice.

import fs from 'node:fs';

const env = fs.readFileSync(
  '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
  'utf8',
);
const kv = Object.fromEntries(
  env
    .trim()
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);
const URL = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

const PRODUCT_ID = '3a5ed230-31e8-40df-845f-a250677914ca'; // books

const snap = JSON.parse(
  fs.readFileSync(
    '/Users/eadayeoh/Desktop/PrintVolution-Tools/.claude/worktrees/modest-morse-51181c/scripts/pvpricelist-snapshot.json',
    'utf8',
  ),
);
const pvp = snap.rates;

// ────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────

const SADDLE_PAGES = [8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68];
const PERFECT_PAGES = [32, 48, 64, 80, 96, 128, 160, 200];

const QTY_DIGITAL = [3, 5, 10, 20, 30, 50, 100, 200, 300];
const QTY_OFFSET = [50, 100, 200, 300, 500, 700, 1000, 2000, 3000, 4000, 5000];

// ────────────────────────────────────────────────────────────────
// AXES
// ────────────────────────────────────────────────────────────────

const axes = {
  method: [
    { slug: 'digital', label: 'Digital', note: 'Small runs (3–300 books)' },
    { slug: 'offset', label: 'Offset', note: 'Bulk runs (50+ books), lower unit cost at scale' },
  ],
  binding: [
    { slug: 'saddle', label: 'Saddle Stitch', note: 'Stapled spine · up to ~68 pages' },
    { slug: 'perfect', label: 'Perfect Bound', note: 'Glued square spine · 32–200 pages' },
  ],
  size: [
    { slug: 'a5', label: 'A5 (148 × 210mm)', note: 'A4 open · most common' },
    { slug: 'a4', label: 'A4 (210 × 297mm)', note: 'A3 open' },
  ],
  size_offset: [
    { slug: 'a5', label: 'A5 (148 × 210mm)', note: 'A4 open · most common' },
    { slug: 'a4', label: 'A4 (210 × 297mm)', note: 'A3 open' },
  ],
  cover: [
    {
      slug: 'self',
      label: 'Self-cover',
      note: 'Same paper as inner pages',
      show_if: { step: 'binding', value: 'saddle' },
    },
    {
      slug: '260_pb',
      label: '260gsm Art Card',
      note: 'Laminated cover — the standard perfect-bound look',
      show_if: { step: 'binding', value: 'perfect' },
    },
    {
      slug: '260_ss',
      label: '260gsm Art Card',
      note: 'Laminated cover',
      show_if: [{ step: 'binding', value: 'saddle' }, { step: 'method', value: 'offset' }],
    },
    {
      slug: '310_ss',
      label: '310gsm Art Card',
      note: 'Heaviest cover option',
      show_if: [{ step: 'binding', value: 'saddle' }, { step: 'method', value: 'offset' }],
    },
  ],
  lamination: [
    {
      slug: 'none',
      label: 'None',
      note: 'No lamination — only for self-cover',
      show_if: { step: 'cover', value: 'self' },
    },
    {
      slug: 'gloss_matt',
      label: 'Gloss or Matt Lam',
      note: 'Standard lamination · same price either finish',
      show_if: { step: 'cover', value: ['260_pb', '260_ss', '310_ss'] },
    },
    {
      slug: 'matt_spot_uv',
      label: 'Matt Lam + Spot UV',
      note: 'Matt base with gloss highlights on artwork areas',
      // Only offered on perfect-bound offset (the only combo priced
      // upstream with Spot UV).
      show_if: [
        { step: 'cover', value: '260_pb' },
        { step: 'method', value: 'offset' },
      ],
    },
  ],
  paper_digital: [
    { slug: '100', label: '100gsm · standard text stock' },
    { slug: '150', label: '150gsm · heavier, less show-through' },
  ],
  content: [
    { slug: '128', label: '128gsm Art Paper', note: 'Standard', show_if: { step: 'binding', value: 'saddle' } },
    { slug: '157', label: '157gsm Art Paper', note: 'Heavier, more premium feel', show_if: { step: 'binding', value: 'saddle' } },
    { slug: 'standard', label: 'Standard book paper', note: 'Included in perfect-bound runs', show_if: { step: 'binding', value: 'perfect' } },
  ],
  pages: [
    ...SADDLE_PAGES.map((p) => ({
      slug: String(p), label: `${p} pages`, show_if: { step: 'binding', value: 'saddle' },
    })),
    ...PERFECT_PAGES.map((p) => ({
      slug: String(p), label: `${p} pages`, show_if: { step: 'binding', value: 'perfect' },
    })),
  ],
};

// ────────────────────────────────────────────────────────────────
// DIGITAL PRICING
// ────────────────────────────────────────────────────────────────

const bm = pvp.books.BM;
const pm = pvp.books.PM;
const saddleTiers = pvp.books.SADDLE_TIERS;
const perfectTiers = pvp.books.PERFECT_TIERS;

function tierRate(tiers, qty) {
  const minQty = tiers[0][0];
  const effQty = Math.max(qty, minQty);
  let picked = tiers[0][1];
  for (const [min, rate] of tiers) if (effQty >= min) picked = rate;
  return { rate: picked, effQty };
}
function bindingPerBook(tiers, qty) {
  for (const t of tiers) if (qty >= t.fromBooks && qty <= t.toBooks) return t.perBook;
  return null;
}

const prices = {};

// Digital is always full-colour — customer has no mono option on the
// pvpricelist UI, so expose PM tiers only. BM is ignored.
for (const size of ['a5', 'a4']) {
  for (const gsm of ['100', '150']) {
    const paperKey = `r${gsm}d`; // PM colour double-sided
    const paperTiers = pm[paperKey];
    if (!paperTiers) continue;

    for (const binding of ['saddle', 'perfect']) {
      const pagesList = binding === 'saddle' ? SADDLE_PAGES : PERFECT_PAGES;
      const bindingTiers = binding === 'saddle' ? saddleTiers : perfectTiers;
      const cover = binding === 'saddle' ? 'self' : '260_pb';
      const lam = binding === 'saddle' ? 'none' : 'gloss_matt';

      for (const pages of pagesList) {
        const sheetsPerBook = pages / 2;
        for (const qty of QTY_DIGITAL) {
          const { rate, effQty } = tierRate(paperTiers, qty);
          const perBook = bindingPerBook(bindingTiers, qty);
          if (perBook == null) continue;
          const content = sheetsPerBook * rate * effQty;
          const bind = perBook * qty;
          const cents = Math.round((content + bind) * 100);
          // Digital key: method:binding:size:paper:cover:lam:pages:qty
          const key = ['digital', binding, size, gsm, cover, lam, pages, qty].join(':');
          prices[key] = cents;
        }
      }
    }
  }
}
console.log(`Computed ${Object.keys(prices).length} digital prices.`);

// ────────────────────────────────────────────────────────────────
// OFFSET SADDLE
// ────────────────────────────────────────────────────────────────

const ossQtys = pvp.saddleStitch.OSS_QTYS;
const ossTables = pvp.saddleStitch.OSS_TABLES;

// Map from OSS table cover suffix → (cover_slug, lam_slug)
const SADDLE_COVER_MAP = {
  self: { cover: 'self', lam: 'none' },
  '260': { cover: '260_ss', lam: 'gloss_matt' },
  '310': { cover: '310_ss', lam: 'gloss_matt' },
};

let offsetSaddleCount = 0;
for (const size of ['a5', 'a4']) {
  for (const content of ['128', '157']) {
    for (const ossCover of ['self', '260', '310']) {
      const tbl = ossTables[`${size}-${content}-${ossCover}`];
      if (!tbl) continue;
      const { cover, lam } = SADDLE_COVER_MAP[ossCover];
      for (const [pageStr, row] of Object.entries(tbl)) {
        const pages = parseInt(pageStr, 10);
        row.forEach((dollars, idx) => {
          const qty = ossQtys[idx];
          const cents = Math.round(dollars * 100);
          // Offset key: method:binding:size:content:cover:lam:pages:qty
          const key = ['offset', 'saddle', size, content, cover, lam, pages, qty].join(':');
          prices[key] = cents;
          offsetSaddleCount++;
        });
      }
    }
  }
}
console.log(`Copied ${offsetSaddleCount} offset saddle prices.`);

// ────────────────────────────────────────────────────────────────
// OFFSET PERFECT
// ────────────────────────────────────────────────────────────────

const PERFECT_FINISH_MAP = { lam: 'gloss_matt', suv: 'matt_spot_uv' };

let offsetPerfectCount = 0;
for (const size of ['a5', 'a4']) {
  for (const finish of ['lam', 'suv']) {
    const tbl = pvp.perfectBinding[`PB_${size.toUpperCase()}_${finish.toUpperCase()}_260`];
    if (!tbl) continue;
    const lam = PERFECT_FINISH_MAP[finish];
    for (const [qtyStr, row] of Object.entries(tbl)) {
      const qty = parseInt(qtyStr, 10);
      for (const [pageStr, dollars] of Object.entries(row)) {
        const pages = parseInt(pageStr, 10);
        const cents = Math.round(dollars * 100);
        const key = ['offset', 'perfect', size, 'standard', '260_pb', lam, pages, qty].join(':');
        prices[key] = cents;
        offsetPerfectCount++;
      }
    }
  }
}
console.log(`Copied ${offsetPerfectCount} offset perfect prices.`);
console.log(`Total prices: ${Object.keys(prices).length}`);

const qty_tiers = Array.from(new Set([...QTY_DIGITAL, ...QTY_OFFSET])).sort((a, b) => a - b);

// ────────────────────────────────────────────────────────────────
// pricing_table
// ────────────────────────────────────────────────────────────────

const pricingTable = {
  axes,
  axis_order: ['method', 'binding', 'size', 'paper_digital', 'cover', 'lamination', 'pages'],
  axis_order_by_method: {
    digital: ['method', 'binding', 'size', 'paper_digital', 'cover', 'lamination', 'pages'],
    offset: ['method', 'binding', 'size_offset', 'content', 'cover', 'lamination', 'pages'],
  },
  qty_tiers,
  prices,
};

// ────────────────────────────────────────────────────────────────
// CONFIGURATOR STEPS
// Step order: method → binding → size → cover → lamination → inner paper → pages → qty
// ────────────────────────────────────────────────────────────────

const steps = [
  {
    step_id: 'method', step_order: 0, label: 'Print Method', type: 'swatch', required: true,
    options: axes.method, show_if: null, step_config: {},
  },
  {
    step_id: 'binding', step_order: 1, label: 'Binding Style', type: 'swatch', required: true,
    options: axes.binding, show_if: null, step_config: {},
  },
  {
    step_id: 'size', step_order: 2, label: 'Size', type: 'swatch', required: true,
    options: axes.size, show_if: { step: 'method', value: 'digital' }, step_config: {},
  },
  {
    step_id: 'size_offset', step_order: 3, label: 'Size', type: 'swatch', required: true,
    options: axes.size_offset, show_if: { step: 'method', value: 'offset' }, step_config: {},
  },
  {
    step_id: 'cover', step_order: 4, label: 'Cover', type: 'swatch', required: true,
    options: axes.cover, show_if: null, step_config: {},
  },
  {
    step_id: 'lamination', step_order: 5, label: 'Lamination', type: 'swatch', required: true,
    options: axes.lamination, show_if: null, step_config: {},
  },
  {
    step_id: 'paper_digital', step_order: 6, label: 'Inner Paper', type: 'swatch', required: true,
    options: axes.paper_digital, show_if: { step: 'method', value: 'digital' }, step_config: {},
  },
  {
    step_id: 'content', step_order: 7, label: 'Inner Paper', type: 'swatch', required: true,
    options: axes.content, show_if: { step: 'method', value: 'offset' }, step_config: {},
  },
  {
    step_id: 'pages', step_order: 8, label: 'Number of Pages', type: 'select', required: true,
    options: axes.pages, show_if: null, step_config: {},
  },
  {
    step_id: 'qty_digital', step_order: 9, label: 'Quantity (books)', type: 'qty', required: false,
    options: [], show_if: { step: 'method', value: 'digital' },
    step_config: { min: 3, step: 1, presets: [3, 5, 10, 20, 50, 100], note: null, discount_note: null, labelMultiplier: null },
  },
  {
    step_id: 'qty_offset', step_order: 10, label: 'Quantity (books)', type: 'qty', required: false,
    options: [], show_if: { step: 'method', value: 'offset' },
    step_config: { min: 50, step: 1, presets: [50, 100, 300, 500, 1000, 2000], note: null, discount_note: null, labelMultiplier: null },
  },
];

// ────────────────────────────────────────────────────────────────
// APPLY
// ────────────────────────────────────────────────────────────────

async function main() {
  const pRes = await fetch(`${URL}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      pricing_table: pricingTable,
      pricing_compute: null,
      lead_time_days: 5,
      print_mode: null,
    }),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/3] products.pricing_table updated.');

  const delCfg = await fetch(`${URL}/rest/v1/product_configurator?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delCfg.ok) throw new Error(`DELETE configurator: ${delCfg.status} ${await delCfg.text()}`);

  const insCfg = await fetch(`${URL}/rest/v1/product_configurator`, {
    method: 'POST', headers: H,
    body: JSON.stringify(steps.map((s) => ({ ...s, product_id: PRODUCT_ID }))),
  });
  if (!insCfg.ok) throw new Error(`INSERT configurator: ${insCfg.status} ${await insCfg.text()}`);
  const inserted = await insCfg.json();
  console.log(`[2/3] Inserted ${inserted.length} configurator steps.`);

  const spots = [
    { key: ['digital', 'saddle', 'a5', '100', 'self', 'none', 16, 10].join(':'),
      desc: 'Digital saddle A5 100gsm self 16pp × 10' },
    { key: ['digital', 'perfect', 'a4', '150', '260_pb', 'gloss_matt', 128, 50].join(':'),
      desc: 'Digital perfect A4 150gsm 260 lam 128pp × 50' },
    { key: ['offset', 'saddle', 'a5', '128', 'self', 'none', 16, 500].join(':'),
      desc: 'Offset saddle A5 128gsm self 16pp × 500' },
    { key: ['offset', 'saddle', 'a4', '128', '260_ss', 'gloss_matt', 32, 1000].join(':'),
      desc: 'Offset saddle A4 128gsm 260 lam 32pp × 1000' },
    { key: ['offset', 'perfect', 'a4', 'standard', '260_pb', 'gloss_matt', 128, 1000].join(':'),
      desc: 'Offset perfect A4 260 lam 128pp × 1000' },
    { key: ['offset', 'perfect', 'a4', 'standard', '260_pb', 'matt_spot_uv', 200, 5000].join(':'),
      desc: 'Offset perfect A4 260 Spot UV 200pp × 5000' },
  ];
  console.log('\n[3/3] Spot-check:');
  for (const s of spots) {
    const cents = prices[s.key];
    console.log(`  ${s.desc}`);
    console.log(`    key: ${s.key}`);
    console.log(`    $${cents != null ? (cents / 100).toFixed(2) : '(MISSING)'}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
