// Scan + patch DB content that still references the old "free delivery
// over S$80" threshold. The real threshold is S$150. Excludes strings
// that mention "$80" in unrelated contexts (paper weight, product
// pricing like "From S$80", temperatures, percentages).

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

// Phrases that *specifically* describe the free-delivery threshold.
// Every instance gets S$80 swapped to S$150. We do not touch generic
// "S$80" appearances elsewhere (paper weight "80gsm", from-prices).
const PATTERNS = [
  { from: /free delivery over S\$80\b/gi, to: 'Free delivery over S$150' },
  { from: /free on orders over S\$80\b/gi, to: 'free on orders over S$150' },
  { from: /free over S\$80\b/gi, to: 'free over S$150' },
  { from: /"bold_part":"S\$80"/g, to: '"bold_part":"S$150"' },
];

function patch(s) {
  let out = s;
  let changed = false;
  for (const { from, to } of PATTERNS) {
    if (from.test(out)) {
      out = out.replace(from, to);
      changed = true;
    }
  }
  return { out, changed };
}

try {
  // 1. page_content rows (announce bar, footer, any CMS-driven text)
  const pages = await sql`select page_key, section_key, data from public.page_content`;
  let updates = 0;
  for (const row of pages) {
    const json = JSON.stringify(row.data);
    const { out, changed } = patch(json);
    if (changed) {
      await sql`
        update public.page_content
        set data = ${out}::jsonb
        where page_key = ${row.page_key} and section_key = ${row.section_key}
      `;
      console.log(`  patched page_content: ${row.page_key}/${row.section_key}`);
      updates++;
    }
  }

  // 2. product_extras (seo_body, magazine, matcher, etc.)
  const extras = await sql`
    select pe.product_id, p.slug, pe.seo_body, pe.seo_magazine, pe.matcher
    from public.product_extras pe
    join public.products p on p.id = pe.product_id
  `;
  for (const row of extras) {
    const seoBodyPatched = row.seo_body ? patch(row.seo_body) : { out: null, changed: false };
    const magPatched = row.seo_magazine ? patch(JSON.stringify(row.seo_magazine)) : { out: null, changed: false };
    const matcherPatched = row.matcher ? patch(JSON.stringify(row.matcher)) : { out: null, changed: false };

    if (seoBodyPatched.changed || magPatched.changed || matcherPatched.changed) {
      await sql`
        update public.product_extras
        set seo_body = ${seoBodyPatched.changed ? seoBodyPatched.out : row.seo_body},
            seo_magazine = ${magPatched.changed ? magPatched.out : JSON.stringify(row.seo_magazine)}::jsonb,
            matcher = ${matcherPatched.changed ? matcherPatched.out : JSON.stringify(row.matcher)}::jsonb
        where product_id = ${row.product_id}
      `;
      console.log(`  patched product_extras: ${row.slug}`);
      updates++;
    }
  }

  // 3. gift_products (seo_body, magazine, faqs are all jsonb/text on same table)
  const gifts = await sql`select id, slug, seo_body, seo_magazine, faqs, description from public.gift_products`;
  for (const row of gifts) {
    const seoPatched = row.seo_body ? patch(row.seo_body) : { out: null, changed: false };
    const descPatched = row.description ? patch(row.description) : { out: null, changed: false };
    const magPatched = row.seo_magazine ? patch(JSON.stringify(row.seo_magazine)) : { out: null, changed: false };
    const faqsPatched = row.faqs ? patch(JSON.stringify(row.faqs)) : { out: null, changed: false };

    if (seoPatched.changed || descPatched.changed || magPatched.changed || faqsPatched.changed) {
      await sql`
        update public.gift_products
        set seo_body = ${seoPatched.changed ? seoPatched.out : row.seo_body},
            description = ${descPatched.changed ? descPatched.out : row.description},
            seo_magazine = ${magPatched.changed ? magPatched.out : JSON.stringify(row.seo_magazine)}::jsonb,
            faqs = ${faqsPatched.changed ? faqsPatched.out : JSON.stringify(row.faqs)}::jsonb
        where id = ${row.id}
      `;
      console.log(`  patched gift_products: ${row.slug}`);
      updates++;
    }
  }

  console.log(`✓ done — ${updates} row(s) updated`);
} finally {
  await sql.end();
}
