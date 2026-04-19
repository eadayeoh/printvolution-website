// Scans every car-decal content field for stale terms from the
// pre-pricing_table era (A5/A4/A3 sizes, gloss/matt/chrome finishes,
// removable/permanent adhesive, calendared vinyl, etc.).

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

const STALE = /gloss|matt\b|chrome|calendared|removable|permanent|\bA[345]\b|vinyl|peel|weeded|plotter|pantone|installer|install-ready|squeegee/i;

function scan(label, text) {
  if (!text) return;
  const s = String(text);
  const m = s.match(STALE);
  if (m) {
    const idx = s.search(STALE);
    const snippet = s.slice(Math.max(0, idx - 40), idx + 60);
    console.log(`  ✗ ${label} — "${m[0]}" …${snippet}…`);
  }
}

function scanJson(label, j) {
  if (!j) return;
  const flat = JSON.stringify(j);
  scan(label, flat);
}

try {
  const [prod] = await sql`select id, name, tagline, description from public.products where slug = 'car-decal'`;
  const [extras] = await sql`select * from public.product_extras where product_id = ${prod.id}`;
  const faqs = await sql`select question, answer from public.product_faqs where product_id = ${prod.id}`;
  const cfg = await sql`select step_id, label, options, step_config from public.product_configurator where product_id = ${prod.id}`;
  const [pricing] = await sql`select * from public.product_pricing where product_id = ${prod.id}`;

  console.log('Car-decal stale-term scan:');
  scan('products.name', prod.name);
  scan('products.tagline', prod.tagline);
  scan('products.description', prod.description);
  if (extras) {
    scan('extras.seo_title', extras.seo_title);
    scan('extras.seo_desc', extras.seo_desc);
    scan('extras.seo_body', extras.seo_body);
    scan('extras.h1', extras.h1);
    scan('extras.h1em', extras.h1em);
    scan('extras.intro', extras.intro);
    scanJson('extras.matcher', extras.matcher);
    scanJson('extras.seo_magazine', extras.seo_magazine);
    scanJson('extras.how_we_print', extras.how_we_print);
  }
  for (const f of faqs) {
    scan(`faq "${f.question.slice(0, 40)}"`, f.answer);
    scan(`faq (question)`, f.question);
  }
  for (const step of cfg) {
    scan(`cfg.${step.step_id}.label`, step.label);
    scanJson(`cfg.${step.step_id}.options`, step.options);
    scanJson(`cfg.${step.step_id}.step_config`, step.step_config);
  }
  if (pricing) {
    console.log('  ⚠ legacy product_pricing row still exists', { label: pricing.label, configs: pricing.configs });
  }
  console.log('(done)');
} finally {
  await sql.end();
}
