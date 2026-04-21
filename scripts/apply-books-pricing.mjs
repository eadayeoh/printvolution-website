// Builds the Books product configurator + pricing_table.prices from the
// pvpricelist snapshot. Strict mapping — only the axes that pvpricelist
// actually exposes, no invented options.
//
// Sources (pvpricelist):
//   • Digital    → `books` tab: PM (colour) per-sheet rate tiers
//                  + SADDLE_TIERS / PERFECT_TIERS binding cost tiers.
//                  Customer picks paper gsm (100/150/200/250/300/350);
//                  ink is colour-only (no mono axis upstream), cover
//                  isn't separately priced so no cover/lam step on
//                  digital (price key falls back to `self:none`).
//   • Offset SS  → `saddleStitch` tab: OSS_TABLES keyed
//                  `${size}-${content}-${cover}` → {pages: [qty-tier prices]}.
//                  Covers: self / 260 / 310. Lamination on 260/310
//                  bundled as "Gloss or Matt Lam" (single price point).
//   • Offset PB  → `perfectBinding` tab: PB_${size}_${finish}_260 →
//                  {qty: {pages: dollars}}. Only 260GSM cover, two
//                  finishes (Gloss/Matt Lam vs Matt Lam + Spot UV).

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
// CONSTANTS — sourced directly from pvpricelist
// ────────────────────────────────────────────────────────────────

const SADDLE_PAGES = pvp.saddleStitch.OSS_PP_OPTIONS; // [8, 12, ..., 68]
const PERFECT_PAGES = pvp.perfectBinding.PB_PP_COLS;   // [32, 48, ..., 200]
const DIGITAL_GSMS = ['100', '150', '200', '250', '300', '350']; // PM keys
const OSS_QTYS = pvp.saddleStitch.OSS_QTYS;            // [100, 300, ..., 5000]
const PB_QTYS = pvp.perfectBinding.PB_QTY_OPTIONS;     // [50, 100, ..., 5000]
// Digital qty limits from the binding tier tables themselves.
const DIGITAL_SADDLE_MAX = Math.max(
  ...pvp.books.SADDLE_TIERS.map((t) => t.toBooks),
); // 300
const DIGITAL_PERFECT_MAX = Math.max(
  ...pvp.books.PERFECT_TIERS.map((t) => t.toBooks),
); // 50

// ────────────────────────────────────────────────────────────────
// AXES
// ────────────────────────────────────────────────────────────────

const axes = {
  method: [
    { slug: 'digital', label: 'Digital', note: 'Small runs · 1 working day', print_mode: 'Digital', lead_time_days: 1 },
    { slug: 'offset', label: 'Offset', note: 'Bulk runs (50+ books) · 7 working days', print_mode: 'Offset', lead_time_days: 7 },
  ],
  binding: [
    { slug: 'saddle', label: 'Saddle Stitch', note: 'Stapled spine · up to 68 pages' },
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
  // Digital inner paper — all 6 gsms priced in pvpricelist's PM (colour) table.
  paper_digital: DIGITAL_GSMS.map((g) => ({
    slug: g,
    label: `${g}gsm`,
    note: g === '100' ? 'Standard text stock' : g === '150' ? 'Heavier, less show-through' : undefined,
  })),
  // Offset saddle content — matches OSS_TABLES key middle segment.
  // The 'standard' slug is the key placeholder for offset perfect (no
  // content choice exists upstream) so the axis key slot is populated.
  content: [
    { slug: '128', label: '128gsm Art Paper', note: 'Standard', show_if: { step: 'binding', value: 'saddle' } },
    { slug: '157', label: '157gsm Art Paper', note: 'Heavier, more premium feel', show_if: { step: 'binding', value: 'saddle' } },
    { slug: 'standard', label: 'Standard book paper', note: 'Included in perfect-bound runs', show_if: { step: 'binding', value: 'perfect' } },
  ],
  // Cover step is visible on every path. On digital it's a single-option
  // confirmation — pvpricelist doesn't separately price a digital cover,
  // so the slug 'self' is reused but with different labels so digital-
  // saddle and digital-perfect customers see accurate wording.
  cover: [
    { slug: 'self', label: 'Self-cover', note: 'Same paper as inner pages', show_if: { step: 'binding', value: 'saddle' } },
    {
      slug: 'self',
      label: 'Standard cover included',
      note: 'Cover bundled with the perfect-bound binding price',
      show_if: [{ step: 'method', value: 'digital' }, { step: 'binding', value: 'perfect' }],
    },
    { slug: '260', label: '260gsm Art Card', show_if: { step: 'method', value: 'offset' } },
    {
      slug: '310',
      label: '310gsm Art Card',
      note: 'Heaviest cover option',
      show_if: [{ step: 'method', value: 'offset' }, { step: 'binding', value: 'saddle' }],
    },
  ],
  // Lamination step is offset-only. Pvpricelist prices Gloss Lam and
  // Matt Lam the same, but customers want to pick the finish — so we
  // expose them as two separate selections that resolve to the same
  // price upstream. Matt Lam + Spot UV is an extra finish on perfect
  // bound offset only (separate price table).
  lamination: [
    { slug: 'none', label: 'None', note: 'No lamination on self-cover', show_if: { step: 'cover', value: 'self' } },
    {
      slug: 'gloss_lam',
      label: 'Gloss Lam',
      show_if: { step: 'cover', value: ['260', '310'] },
    },
    {
      slug: 'matt_lam',
      label: 'Matt Lam',
      show_if: { step: 'cover', value: ['260', '310'] },
    },
    {
      slug: 'suv',
      label: 'Matt Lam + Spot UV',
      note: 'Matt base with gloss highlights on artwork',
      show_if: [{ step: 'cover', value: '260' }, { step: 'binding', value: 'perfect' }],
    },
  ],
  // Page counts are constrained by cover choice on saddle binding —
  // pvpricelist only prices 8pp with self-cover tables, and 68pp only
  // with 260/310 cover tables. Option-level show_if enforces that so
  // the customer can't land on a combo that has no price entry.
  pages: [
    ...SADDLE_PAGES.map((p) => {
      let show_if;
      if (p === 8) {
        // 8pp only with self-cover saddle
        show_if = [{ step: 'binding', value: 'saddle' }, { step: 'cover', value: 'self' }];
      } else if (p === 68) {
        // 68pp only with bound cover (260 or 310) on saddle
        show_if = [{ step: 'binding', value: 'saddle' }, { step: 'cover', value: ['260', '310'] }];
      } else {
        show_if = { step: 'binding', value: 'saddle' };
      }
      return { slug: String(p), label: `${p} pages`, show_if };
    }),
    ...PERFECT_PAGES.map((p) => ({ slug: String(p), label: `${p} pages`, show_if: { step: 'binding', value: 'perfect' } })),
  ],
};

// ────────────────────────────────────────────────────────────────
// DIGITAL PRICING — colour-only (PM), no cover/lamination axis.
// ────────────────────────────────────────────────────────────────

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

// Digital qty presets — union of everything <=300 for saddle + <=50 for
// perfect. The snap-to-tier logic filters to valid combos at runtime.
const QTY_DIGITAL = [3, 5, 10, 20, 30, 50, 100, 200, 300];

const prices = {};
for (const size of ['a5', 'a4']) {
  for (const gsm of DIGITAL_GSMS) {
    const paperKey = `r${gsm}d`; // PM colour double-sided
    const paperTiers = pm[paperKey];
    if (!paperTiers) continue;

    for (const binding of ['saddle', 'perfect']) {
      const pagesList = binding === 'saddle' ? SADDLE_PAGES : PERFECT_PAGES;
      const bindingTiers = binding === 'saddle' ? saddleTiers : perfectTiers;
      const qtyCap = binding === 'saddle' ? DIGITAL_SADDLE_MAX : DIGITAL_PERFECT_MAX;

      for (const pages of pagesList) {
        const sheetsPerBook = pages / 2;
        for (const qty of QTY_DIGITAL) {
          if (qty > qtyCap) continue;
          const { rate, effQty } = tierRate(paperTiers, qty);
          const perBook = bindingPerBook(bindingTiers, qty);
          if (perBook == null) continue;
          const content = sheetsPerBook * rate * effQty;
          const bind = perBook * qty;
          // pvpricelist rounds displayed prices UP to the next whole
          // dollar (e.g. $912.30 → $913). Mirror that rounding here so
          // the site price matches the price sheet the customer is
          // quoted from.
          const cents = Math.ceil(content + bind) * 100;
          // Digital key: method:binding:size:paper:cover:lam:pages:qty
          //   cover + lam are placeholders ('self'/'none') on digital —
          //   the cover/lam steps are hidden for method=digital so the
          //   auto-reset picks the first option as each step's value.
          const key = ['digital', binding, size, gsm, 'self', 'none', pages, qty].join(':');
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

const ossTables = pvp.saddleStitch.OSS_TABLES;
// pvpricelist cover slug → (our cover, valid lam slugs)
// Gloss Lam and Matt Lam both carry the same upstream price — we emit
// both keys from the single source row so either customer pick resolves.
const SADDLE_COVER_MAP = {
  self: { cover: 'self', lams: ['none'] },
  '260': { cover: '260', lams: ['gloss_lam', 'matt_lam'] },
  '310': { cover: '310', lams: ['gloss_lam', 'matt_lam'] },
};

let offsetSaddleCount = 0;
for (const size of ['a5', 'a4']) {
  for (const content of ['128', '157']) {
    for (const ossCover of ['self', '260', '310']) {
      const tbl = ossTables[`${size}-${content}-${ossCover}`];
      if (!tbl) continue;
      const { cover, lams } = SADDLE_COVER_MAP[ossCover];
      for (const [pageStr, row] of Object.entries(tbl)) {
        const pages = parseInt(pageStr, 10);
        row.forEach((dollars, idx) => {
          const qty = OSS_QTYS[idx];
          const cents = Math.ceil(dollars) * 100;
          for (const lam of lams) {
            const key = ['offset', 'saddle', size, content, cover, lam, pages, qty].join(':');
            prices[key] = cents;
            offsetSaddleCount++;
          }
        });
      }
    }
  }
}
console.log(`Copied ${offsetSaddleCount} offset saddle prices.`);

// ────────────────────────────────────────────────────────────────
// OFFSET PERFECT
// ────────────────────────────────────────────────────────────────

// Each upstream finish maps to the lam slug(s) it prices. The 'lam'
// upstream finish (Gloss or Matt Lam) emits both gloss_lam and
// matt_lam keys so customer finish choice resolves at the same price.
const PERFECT_FINISH_MAP = { lam: ['gloss_lam', 'matt_lam'], suv: ['suv'] };

let offsetPerfectCount = 0;
for (const size of ['a5', 'a4']) {
  for (const finish of ['lam', 'suv']) {
    const tbl = pvp.perfectBinding[`PB_${size.toUpperCase()}_${finish.toUpperCase()}_260`];
    if (!tbl) continue;
    const lams = PERFECT_FINISH_MAP[finish];
    for (const [qtyStr, row] of Object.entries(tbl)) {
      const qty = parseInt(qtyStr, 10);
      for (const [pageStr, dollars] of Object.entries(row)) {
        const pages = parseInt(pageStr, 10);
        const cents = Math.ceil(dollars) * 100;
        for (const lam of lams) {
          // Perfect binding has no content-paper choice; use 'standard' placeholder.
          const key = ['offset', 'perfect', size, 'standard', '260', lam, pages, qty].join(':');
          prices[key] = cents;
          offsetPerfectCount++;
        }
      }
    }
  }
}
console.log(`Copied ${offsetPerfectCount} offset perfect prices.`);
console.log(`Total prices: ${Object.keys(prices).length}`);

const qty_tiers = Array.from(new Set([...QTY_DIGITAL, ...OSS_QTYS, ...PB_QTYS])).sort((a, b) => a - b);

// ────────────────────────────────────────────────────────────────
// pricing_table
// ────────────────────────────────────────────────────────────────

const pricingTable = {
  axes,
  axis_order: ['method', 'binding', 'size', 'paper_digital', 'cover', 'lamination', 'pages'],
  axis_order_by_method: {
    // Cover/lam included in digital's axis_order too — they'll always
    // read as 'self'/'none' from the hidden steps' auto-reset defaults,
    // matching the placeholder slots in the generated digital keys.
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
    step_config: { min: 3, step: 1, presets: [3, 5, 10, 20, 50, 100], note: 'Max 50 for perfect bound, 300 for saddle stitch', discount_note: null, labelMultiplier: null },
  },
  {
    step_id: 'qty_offset', step_order: 10, label: 'Quantity (books)', type: 'qty', required: false,
    options: [], show_if: { step: 'method', value: 'offset' },
    step_config: { min: 50, step: 1, presets: [100, 300, 500, 1000, 2000], note: null, discount_note: null, labelMultiplier: null },
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
  console.log('[1/4] products.pricing_table updated.');

  // Clear the stale legacy product_pricing matrix (A4 10k/30k/50k/100k
  // flyer-shaped data) — it was rendering the "Volume Pricing" ladder
  // and driving a fake 99%-off discount when the configurator combo
  // had no lookup hit.
  const delPricing = await fetch(`${URL}/rest/v1/product_pricing?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delPricing.ok) throw new Error(`DELETE product_pricing: ${delPricing.status} ${await delPricing.text()}`);
  console.log('[2/4] Cleared legacy product_pricing matrix.');

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
  console.log(`[3/4] Inserted ${inserted.length} configurator steps.`);

  const spots = [
    { key: ['digital', 'saddle', 'a5', '100', 'self', 'none', 16, 10].join(':'),
      desc: 'Digital saddle A5 100gsm 16pp × 10' },
    { key: ['digital', 'saddle', 'a4', '300', 'self', 'none', 32, 50].join(':'),
      desc: 'Digital saddle A4 300gsm 32pp × 50' },
    { key: ['digital', 'perfect', 'a4', '150', 'self', 'none', 128, 50].join(':'),
      desc: 'Digital perfect A4 150gsm 128pp × 50' },
    { key: ['offset', 'saddle', 'a5', '128', 'self', 'none', 16, 500].join(':'),
      desc: 'Offset saddle A5 128gsm self 16pp × 500' },
    { key: ['offset', 'saddle', 'a4', '128', '260', 'gloss_lam', 32, 1000].join(':'),
      desc: 'Offset saddle A4 128gsm 260 gloss lam 32pp × 1000' },
    { key: ['offset', 'saddle', 'a4', '128', '260', 'matt_lam', 32, 1000].join(':'),
      desc: 'Offset saddle A4 128gsm 260 matt lam 32pp × 1000 (same price)' },
    { key: ['offset', 'perfect', 'a4', 'standard', '260', 'gloss_lam', 128, 1000].join(':'),
      desc: 'Offset perfect A4 260 gloss lam 128pp × 1000' },
    { key: ['offset', 'perfect', 'a4', 'standard', '260', 'matt_lam', 128, 1000].join(':'),
      desc: 'Offset perfect A4 260 matt lam 128pp × 1000 (same price)' },
    { key: ['offset', 'perfect', 'a5', 'standard', '260', 'suv', 80, 500].join(':'),
      desc: 'Offset perfect A5 260 Spot UV 80pp × 500' },
  ];
  console.log('\n[4/4] Spot-check:');
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
