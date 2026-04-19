// Flyers — hybrid Digital + Offset pricing_table, pulled from pvpricelist.
//
// DIGITAL (small runs 50 → 500 pcs):
//   size × paper × sides → price computed from pvpricelist BM tiers
//   (print unit × a3Qty with min-floor) + A4/A5 cut fee. Ports
//   pvpricelist/src/calc/basicMaterials.ts computeBasicMaterials().
//   Covers A4/A5 × 128gsm/157gsm Art Paper × Single/Double.
//   Lamination is an add-on formula on top of the tier price (calculator
//   handles this natively via the axis_order add-on sum).
//
// OFFSET (bulk runs 300 → 200k pcs for paper, 600 → 10k for thicker card):
//   A4 + A5 × 128/157gsm Art Paper → pvpricelist live prices (already
//   have $150 min-invoice floor baked in for 300–2000 tiers).
//   A5 × 260/310gsm Art Card → user's separate supplier screenshots.
//   A5 paper extended tiers 40k–200k → user's separate screenshots.

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

// ────────────────────────────────────────────────────────────────────
// Digital pricing — port of pvpricelist BM calc
// ────────────────────────────────────────────────────────────────────

// [minA3Qty, unitPrice] tiers, from pvpricelist basicMaterials.ts.
// Keys: `${gsmGroup}${sides}`. gsmGroup 100 = 128gsm Art Paper,
// 150 = 157gsm Art Paper, 260 = 250gsm Art Card, 310 = 300gsm Art Card.
const BM = {
  '100ss': [[11,1.9],[20,1.7],[30,1.55],[40,1.45],[50,1.35],[60,1.3],[70,1.25],[80,1.2],[90,1.15],[100,1.1],[150,1.05],[200,1.0],[250,0.95],[300,0.9],[350,0.85],[400,0.8],[450,0.75]],
  '100ds': [[11,3.2],[20,2.65],[30,2.25],[40,1.95],[50,1.8],[60,1.75],[70,1.7],[80,1.65],[90,1.6],[100,1.55],[150,1.5],[200,1.45],[250,1.4],[300,1.35],[350,1.3],[400,1.25],[450,1.2]],
  '150ss': [[11,2.1],[20,1.85],[30,1.65],[40,1.5],[50,1.4],[60,1.35],[70,1.3],[80,1.25],[90,1.2],[100,1.15],[150,1.1],[200,1.05],[250,1.0],[300,0.95],[350,0.9],[400,0.85],[450,0.8]],
  '150ds': [[11,3.3],[20,2.75],[30,2.35],[40,2.05],[50,1.9],[60,1.85],[70,1.8],[80,1.75],[90,1.7],[100,1.65],[150,1.6],[200,1.55],[250,1.5],[300,1.45],[350,1.4],[400,1.35],[450,1.3]],
  '260ss': [[11,2.7],[20,2.4],[30,2.15],[40,2.0],[50,1.9],[60,1.85],[70,1.8],[80,1.75],[90,1.7],[100,1.65],[150,1.6],[200,1.55],[250,1.5],[300,1.45],[350,1.4],[400,1.35],[450,1.3]],
  '260ds': [[11,4.4],[20,3.45],[30,2.75],[40,2.25],[50,2.0],[60,1.95],[70,1.9],[80,1.85],[90,1.8],[100,1.75],[150,1.7],[200,1.65],[250,1.6],[300,1.55],[350,1.5],[400,1.45],[450,1.4]],
  '310ss': [[11,2.9],[20,2.55],[30,2.3],[40,2.1],[50,1.95],[60,1.9],[70,1.85],[80,1.8],[90,1.75],[100,1.7],[150,1.65],[200,1.6],[250,1.55],[300,1.5],[350,1.45],[400,1.4],[450,1.35]],
  '310ds': [[11,5.0],[20,3.85],[30,3.0],[40,2.4],[50,2.05],[60,2.0],[70,1.95],[80,1.9],[90,1.85],[100,1.8],[150,1.75],[200,1.7],[250,1.65],[300,1.6],[350,1.55],[400,1.5],[450,1.45]],
};

const BM_PRINT_UPS = { a4: 2, a5: 4, a6: 8 };

// Cutting fee by finished size + a3Qty column.
// Columns: idx0=≤100, idx1=≤200, idx2=≤300, idx3=≤400, idx4=≤500
const BM_CUT_TABLE = {
  a4: [4, 7, 10, 13, 16],
  a5: [10, 18, 25, 32, 40],
  a6: [12, 21, 30, 39, 48],
};

function cutCol(a3Qty) {
  return a3Qty <= 100 ? 0 : a3Qty <= 200 ? 1 : a3Qty <= 300 ? 2 : a3Qty <= 400 ? 3 : 4;
}

// applyTierFloor — mirrors pvpricelist/tierFloor.ts exactly.
function applyTierFloor(tiers, qty) {
  let unitIdx = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (qty >= tiers[i][0]) unitIdx = i;
  }
  const unit = tiers[unitIdx][1];
  const raw = qty * unit;
  let minFloor = 0;
  if (unitIdx > 0) {
    const prev = tiers[unitIdx - 1];
    const prevUpper = tiers[unitIdx][0] - 1;
    minFloor = prevUpper * prev[1];
  }
  return Math.max(raw, minFloor);
}

function computeDigital(size, gsmGroup, sides, qty) {
  const ups = BM_PRINT_UPS[size];
  const a3Qty = Math.ceil(qty / ups);
  const tiers = BM[`${gsmGroup}${sides}`];
  const print = applyTierFloor(tiers, a3Qty);
  const cut = BM_CUT_TABLE[size][cutCol(a3Qty)];
  return print + cut;
}

// Digital qty is now continuous (1 → 500 finished pieces) via the
// pricing_compute.bm path on the product, not tier entries in the
// pricing_table. These qty presets are just helpful shortcuts.
const digitalQtyPresets = [50, 100, 200, 300, 400, 500];
const MAX_DIGITAL_FINISHED_QTY = 500;

// ────────────────────────────────────────────────────────────────────
// Offset pricing — pvpricelist live prices (already have $150 floor)
// plus user's separate screenshots for 260/310gsm Art Card and
// extended A5 paper tiers (40k–200k).
// ────────────────────────────────────────────────────────────────────
const RAW_OFFSET = {
  // ─ A4 Art Paper (pvpricelist) ─
  'a4:128art:4c0c': { 300:150, 500:150, 1000:150, 2000:150, 3000:183.9, 4000:229.1, 5000:279.2, 6000:323.4, 7000:367.7, 8000:412, 9000:451.4, 10000:490.9, 12000:585.2, 16000:778, 20000:912.3 },
  'a4:128art:4c4c': { 300:150, 500:150, 1000:150, 2000:177.1, 3000:219.9, 4000:262.8, 5000:311.9, 6000:373.2, 7000:434.5, 8000:495.7, 9000:539, 10000:595, 12000:669, 16000:880, 20000:1077.4 },
  'a4:157art:4c0c': { 300:150, 500:150, 1000:150, 2000:152.1, 3000:203.1, 4000:254.1, 5000:302.3, 6000:355.8, 7000:409.4, 8000:463, 9000:517.4, 10000:571.8, 12000:682.4, 16000:902.9, 20000:1056.6 },
  'a4:157art:4c4c': { 300:150, 500:150, 1000:150, 2000:189.7, 3000:239.2, 4000:288.8, 5000:339.8, 6000:402.7, 7000:466.2, 8000:529.4, 9000:591, 10000:652.6, 12000:775.8, 16000:1070.7, 20000:1203.8 },

  // ─ A5 Art Paper ($150 floor for 600–4000 per pvpricelist; 6000+ match
  //   supplier; 60k/100k/200k are user's extended tiers from supplier
  //   sheet — NOT in pvpricelist; kept per user's call) ─
  'a5:128art:4c0c': { 600:150, 1000:150, 2000:150, 4000:150, 6000:195.9, 8000:249.3, 10000:285.9, 12000:339.5, 14000:393.1, 16000:446.6, 18000:470.1, 20000:494, 40000:1014.3, 60000:1512.4, 100000:2419.5, 200000:4826.7 },
  'a5:128art:4c4c': { 600:150, 1000:150, 2000:150, 4000:189.7, 6000:233, 8000:276.3, 10000:329.2, 12000:387, 14000:444.7, 16000:502.5, 18000:531, 20000:561.5, 40000:1108.9, 60000:1651.3, 100000:2628.7, 200000:5241.2 },
  'a5:157art:4c0c': { 600:150, 1000:150, 2000:150, 4000:160.8, 6000:216.1, 8000:271.5, 10000:323.4, 12000:380, 14000:435.7, 16000:491.9, 18000:520.8, 20000:560, 40000:1125, 60000:1654.2, 100000:2813.5, 200000:5613.6 },
  'a5:157art:4c4c': { 600:150, 1000:150, 2000:150, 4000:207.9, 6000:254.1, 8000:300.3, 10000:368.7, 12000:431, 14000:494, 16000:555.4, 18000:587.7, 20000:636, 40000:1275, 60000:1832.4, 100000:3022.7, 200000:6028.1 },

  // ─ A5 Art Card (thicker stock — user screenshots only, no pvpricelist
  //   equivalent; kept per user's call) ─
  'a5:260card:4c0c': { 600:120.6, 1000:130, 2000:190.6, 3000:217.6, 4000:263.8, 5000:313.8, 6000:380.2, 7000:440.9, 8000:501.5, 9000:562.1, 10000:622.8 },
  'a5:260card:4c4c': { 600:159.7, 1000:173.3, 2000:221.7, 3000:273.4, 4000:322.5, 5000:369.6, 6000:431.2, 7000:481.3, 8000:526.5, 9000:589.1, 10000:651.7 },
  'a5:310card:4c0c': { 600:144.8, 1000:156, 2000:228.8, 3000:261.2, 4000:316.6, 5000:376.6, 6000:456.3, 7000:529.1, 8000:601.8, 9000:674.6, 10000:747.4 },
  'a5:310card:4c4c': { 600:191.7, 1000:208, 2000:256.5, 3000:328.1, 4000:387, 5000:443.6, 6000:517.5, 7000:577.6, 8000:631.8, 9000:707, 10000:782.1 },
};

// ────────────────────────────────────────────────────────────────────
// Axes
// ────────────────────────────────────────────────────────────────────
const methodAxis = [
  { slug: 'digital', label: 'Digital' },
  { slug: 'offset',  label: 'Offset' },
];

// DIGITAL axis options (step_ids: size, paper, sides)
// DL removed — pvpricelist basic-materials has no tier data for DL.
// A4 / A5 / A6 are the supported digital sizes (finished-size cut fees
// exist for all three; BM tier tables share the per-A3-sheet rates).
const sizeDigitalAxis = [
  { slug: 'a4', label: 'A4 (210 × 297mm)', note: 'Most common' },
  { slug: 'a5', label: 'A5 (148 × 210mm)' },
  { slug: 'a6', label: 'A6 (105 × 148mm)' },
];

// Digital paper options — 128/157gsm Art Paper for flyer stock,
// 250/300gsm Art Card for heavier card-stock flyers (postcards,
// door-hangers-style). Art Card is lamination-eligible; Art Paper
// isn't (enforced via step-level show_if on the Lamination step).
const paperDigitalAxis = [
  { slug: '128art', label: '128gsm Art Paper', note: 'Standard' },
  { slug: '157art', label: '157gsm Art Paper' },
  { slug: '250card', label: '250gsm Art Card' },
  { slug: '300card', label: '300gsm Art Card' },
];

const sidesDigitalAxis = [
  { slug: '2', label: 'Double Sided', note: 'Recommended' },
  { slug: '1', label: 'Single Sided' },
];

// OFFSET axis options (step_ids: size_offset, paper_offset, sides_offset)
const sizeOffsetAxis = [
  { slug: 'a4', label: 'A4 (210 × 297mm)' },
  { slug: 'a5', label: 'A5 (148 × 210mm)' },
];

// Offset paper — 128/157gsm art paper for any size, 260/310gsm art
// card only for A5 (supplier sheet limitation). Option-level show_if
// hides the card options when size_offset isn't A5.
const paperOffsetAxis = [
  { slug: '128art',  label: '128gsm Art Paper' },
  { slug: '157art',  label: '157gsm Art Paper' },
  { slug: '260card', label: '260gsm Art Card', show_if: { step: 'size_offset', value: 'a5' } },
  { slug: '310card', label: '310gsm Art Card', show_if: { step: 'size_offset', value: 'a5' } },
];

const sidesOffsetAxis = [
  { slug: '4c0c', label: 'Single Sided (4C + 0C)' },
  { slug: '4c4c', label: 'Double Sided (4C + 4C)' },
];

// pricing_table qty tiers — offset only now; digital is formula-driven
// via pricing_compute.bm so it doesn't need tier entries.
const qtyTiers = [
  300, 500, 600, 1000, 2000, 3000, 4000, 5000,
  6000, 7000, 8000, 9000, 10000, 12000, 14000, 16000, 18000, 20000,
  40000, 60000, 100000, 200000,
];

// ────────────────────────────────────────────────────────────────────
// Build prices dictionary
// ────────────────────────────────────────────────────────────────────
const prices = {};
let offsetPriceCount = 0;

// Offset entries: key = method:size_offset:paper_offset:sides_offset:qty
// Digital is no longer in pricing_table — it's handled by
// pricing_compute.bm for continuous-qty pricing.
for (const [comboKey, tierMap] of Object.entries(RAW_OFFSET)) {
  for (const [qty, dollars] of Object.entries(tierMap)) {
    prices[`offset:${comboKey}:${qty}`] = Math.round(dollars * 100);
    offsetPriceCount++;
  }
}

const pricingTable = {
  axes: {
    method: methodAxis,
    size: sizeDigitalAxis,
    paper: paperDigitalAxis,
    sides: sidesDigitalAxis,
    size_offset: sizeOffsetAxis,
    paper_offset: paperOffsetAxis,
    sides_offset: sidesOffsetAxis,
  },
  axis_order: ['method', 'size_offset', 'paper_offset', 'sides_offset'],  // default / fallback
  axis_order_by_method: {
    digital: ['method', 'size', 'paper', 'sides'],
    offset:  ['method', 'size_offset', 'paper_offset', 'sides_offset'],
  },
  qty_tiers: qtyTiers,
  prices,
};

// ────────────────────────────────────────────────────────────────────
// Configurator — digital lam stays a formula add-on on top of tier price
// ────────────────────────────────────────────────────────────────────
const digitalLamOpts = [
  { slug: 'none',  label: 'No Lamination',    price_formula: '0' },
  { slug: 'matt',  label: 'Matt Lamination',  price_formula: '(qty/500)*20' },
  { slug: 'gloss', label: 'Gloss Lamination', price_formula: '(qty/500)*15' },
];

const digitalShowIf = { step: 'method', value: 'digital' };
const offsetShowIf  = { step: 'method', value: 'offset' };

const offsetQtyTiersForStep = [600, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 14000, 16000, 18000, 20000, 40000, 60000, 100000, 200000];
const digitalQtyTiersForStep = digitalQtyPresets; // [50, 100, 200, 300, 400, 500]

// ────────────────────────────────────────────────────────────────────
// pricing_compute.bm — continuous-qty pricing for Digital method.
// The page calculator reads this, computes a3Qty via ups, runs
// applyTierFloor on the right tier table, adds the cut fee, and
// returns the exact price for whatever finished qty the customer types.
// ────────────────────────────────────────────────────────────────────
const pricingCompute = {
  bm: {
    match: { method: 'digital' },
    size_key: 'size',
    paper_key: 'paper',
    sides_key: 'sides',
    ups: BM_PRINT_UPS,  // { a4: 2, a5: 4 }
    tier_map: {
      '128art:1':  '100ss', '128art:2':  '100ds',
      '157art:1':  '150ss', '157art:2':  '150ds',
      '250card:1': '260ss', '250card:2': '260ds',
      '300card:1': '310ss', '300card:2': '310ds',
    },
    tiers: BM,
    cut: {
      col_breaks: [100, 200, 300, 400, 500],
      table: BM_CUT_TABLE,
    },
    max_finished_qty: MAX_DIGITAL_FINISHED_QTY,
  },
};

try {
  const [prod] = await sql`select id from public.products where slug='flyers'`;
  if (!prod) throw new Error('flyers product not found');
  console.log('✓ found flyers', prod.id);

  await sql`
    update public.products
    set pricing_table = ${sql.json(pricingTable)},
        pricing_compute = ${sql.json(pricingCompute)}
    where id = ${prod.id}
  `;
  console.log(`✓ pricing_table seeded — ${offsetPriceCount} offset price points`);
  console.log(`✓ pricing_compute.bm seeded — any-qty 1→${MAX_DIGITAL_FINISHED_QTY} via pvpricelist basic-materials`);

  await sql`delete from public.product_configurator where product_id = ${prod.id}`;
  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${prod.id}, 'method', 0, 'Print Method', 'swatch', true,
        ${sql.json([
          { slug: 'digital', label: 'Digital', note: 'Short runs · 50 → 500 pcs', lead_time_days: 1, print_mode: 'Digital' },
          { slug: 'offset',  label: 'Offset',  note: 'Bulk runs · 300 → 200,000 pcs', lead_time_days: 7, print_mode: 'Offset' },
        ])},
        null, null
      ),
      (
        ${prod.id}, 'size', 1, 'Size', 'swatch', true,
        ${sql.json(sizeDigitalAxis)},
        ${sql.json(digitalShowIf)}, null
      ),
      (
        ${prod.id}, 'size_offset', 2, 'Size', 'swatch', true,
        ${sql.json(sizeOffsetAxis)},
        ${sql.json(offsetShowIf)}, null
      ),
      (
        ${prod.id}, 'paper', 3, 'Paper', 'swatch', true,
        ${sql.json(paperDigitalAxis)},
        ${sql.json(digitalShowIf)}, null
      ),
      (
        ${prod.id}, 'paper_offset', 4, 'Paper', 'swatch', true,
        ${sql.json(paperOffsetAxis)},
        ${sql.json(offsetShowIf)}, null
      ),
      (
        ${prod.id}, 'sides', 5, 'Printing Sides', 'swatch', true,
        ${sql.json(sidesDigitalAxis)},
        ${sql.json(digitalShowIf)}, null
      ),
      (
        ${prod.id}, 'sides_offset', 6, 'Printing Sides', 'swatch', true,
        ${sql.json(sidesOffsetAxis.map((s) => ({
          ...s,
          ...(s.slug === '4c4c' ? { note: 'Recommended' } : {}),
        })))},
        ${sql.json(offsetShowIf)}, null
      ),
      -- Lamination is only offered on art-card stock (200gsm+), not on
      -- art paper. Show the step only when method=digital AND paper is
      -- one of the card options. Uses show_if array + multi-value form.
      (
        ${prod.id}, 'lamination', 7, 'Lamination', 'swatch', false,
        ${sql.json(digitalLamOpts)},
        ${sql.json([
          { step: 'method', value: 'digital' },
          { step: 'paper',  value: ['250card', '300card'] },
        ])}, null
      ),
      (
        ${prod.id}, 'qty', 8, 'Quantity', 'qty', true,
        '[]'::jsonb,
        ${sql.json(digitalShowIf)},
        ${sql.json({ presets: digitalQtyTiersForStep, min: 1, step: 1, note: `Type any quantity from 1 to ${MAX_DIGITAL_FINISHED_QTY} pcs — price updates live.` })}
      ),
      (
        ${prod.id}, 'qty_offset', 9, 'Quantity', 'qty', true,
        '[]'::jsonb,
        ${sql.json(offsetShowIf)},
        ${sql.json({ presets: offsetQtyTiersForStep, min: 300, step: 1, note: 'Supplier tiers — price snaps to nearest tier below.' })}
      )
  `;
  console.log('✓ configurator rebuilt — method + 4 digital steps + 4 offset steps + 2 qty steps');

  await sql`delete from public.product_pricing where product_id = ${prod.id}`;

  // Verify
  const [check] = await sql`
    select p.name,
           jsonb_array_length(p.pricing_table->'qty_tiers') as tiers,
           (select count(*) from jsonb_object_keys(p.pricing_table->'prices')) as price_count,
           p.pricing_table->'axis_order_by_method' as axm
    from public.products p where p.id = ${prod.id}
  `;
  console.log('\nverify:', JSON.stringify(check, null, 2));

  // Sample prices — digital via pvpricelist BM calc, offset via pricing_table.
  const digitalSamples = [
    ['a4', '100', 'ds', 87],
    ['a4', '100', 'ds', 100],
    ['a4', '100', 'ds', 157],
    ['a4', '100', 'ds', 500],
    ['a5', '150', 'ss', 200],
    ['a5', '150', 'ss', 333],
  ];
  console.log('\nsample digital prices (SGD, continuous qty):');
  for (const [size, gsm, sides, qty] of digitalSamples) {
    const $ = computeDigital(size, gsm, sides, qty);
    console.log(`  ${size.toUpperCase()} ${gsm==='100'?'128':'157'}gsm ${sides.toUpperCase()} × ${qty} pcs: $${$.toFixed(2)}`);
  }
  const offsetSamples = [
    ['offset:a4:128art:4c4c:2000', 'A4 128gsm DS × 2000 pcs (offset · floor)'],
    ['offset:a5:128art:4c0c:600', 'A5 128gsm SS × 600 pcs (offset · floor)'],
    ['offset:a5:260card:4c4c:5000', 'A5 260gsm Card DS × 5000 pcs (offset)'],
  ];
  console.log('\nsample offset prices (SGD):');
  for (const [key, label] of offsetSamples) {
    const cents = prices[key] ?? 0;
    console.log(`  ${label}: $${(cents / 100).toFixed(2)}`);
  }
} finally {
  await sql.end();
}
