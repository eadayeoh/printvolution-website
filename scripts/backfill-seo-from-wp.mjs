#!/usr/bin/env node
/**
 * Backfill SEO content on every product (Print + Gift) from the legacy
 * WordPress site at printvolution.sg.
 *
 * For each product in our DB (matched by slug), fetch the matching WP
 * post and extract the product description, highlights, features, FAQ.
 * If our existing description is < 500 characters, replace it with a
 * cleaned, de-HTMLd version of the WP copy.
 *
 * Also updates product_extras.intro (Print) or gift_products.description
 * (Gifts) with long-form body copy.
 *
 * Usage:
 *   node scripts/backfill-seo-from-wp.mjs            # dry run
 *   node scripts/backfill-seo-from-wp.mjs --apply   # write changes
 */
import fs from 'node:fs';
import postgres from 'postgres';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const APPLY = process.argv.includes('--apply');
const SITE = 'https://printvolution.sg';
const MIN_CHARS = 500; // if existing description is shorter, we backfill

const pg = postgres(process.env.SUPABASE_DB_URL, {
  max: 1, connect_timeout: 30, ssl: { rejectUnauthorized: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtml(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—').replace(/&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text) {
  return (text.match(/\b[\w']+\b/g) ?? []).length;
}

/** Extract clean paragraphs of body copy from a WP post's rendered HTML. */
function extractBody(html) {
  if (!html) return '';
  const paragraphs = [];
  // Pull <p> contents; filter out empties/nbsp-only
  const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const m of pMatches) {
    const text = stripHtml(m[1]);
    if (text.length < 20) continue; // skip nav / single-word lines
    if (/subscribe|newsletter|cookie|privacy/i.test(text) && text.length < 120) continue;
    paragraphs.push(text);
  }
  // De-dupe
  const seen = new Set();
  const clean = [];
  for (const p of paragraphs) {
    const key = p.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push(p);
  }
  return clean.join('\n\n');
}

/** Pull list items as bullet strings. */
function extractList(html, maxItems = 12) {
  if (!html) return [];
  const items = [];
  const liMatches = html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  for (const m of liMatches) {
    const t = stripHtml(m[1]);
    if (t.length < 6 || t.length > 220) continue;
    items.push(t);
    if (items.length >= maxItems) break;
  }
  return items;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Printvolution-SEO-Backfill/1.0' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

/** Fetch WP post by slug — tries both WP /product and /posts endpoints. */
async function fetchLegacyBySlug(slug) {
  try {
    const products = await fetchJson(`${SITE}/wp-json/wp/v2/product?slug=${encodeURIComponent(slug)}&_embed=1`);
    if (Array.isArray(products) && products.length > 0) return products[0];
  } catch { /* ignore */ }
  try {
    const posts = await fetchJson(`${SITE}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`);
    if (Array.isArray(posts) && posts.length > 0) return posts[0];
  } catch { /* ignore */ }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(APPLY ? '── APPLY MODE ──' : '── DRY RUN (use --apply to write) ──\n');

  // Load all products in scope: Print + Gift
  const prints = await pg`
    select p.id, p.slug, p.name, p.description,
           ex.intro as extras_intro, ex.seo_title, ex.seo_desc, ex.why_us
    from products p
    left join product_extras ex on ex.product_id = p.id
    where p.is_active = true
    order by p.name
  `;
  const gifts = await pg`
    select id, slug, name, description, tagline, seo_title, seo_desc
    from gift_products
    where is_active = true
    order by name
  `;

  console.log(`${prints.length} Print products · ${gifts.length} Gift products`);
  let updated = 0, skipped = 0, notFound = 0, errors = 0;

  for (const kind of ['print', 'gift']) {
    const rows = kind === 'print' ? prints : gifts;
    for (const row of rows) {
      const currentChars = (row.description ?? '').length
        + (row.extras_intro ?? '').length;
      if (currentChars >= MIN_CHARS) { skipped++; continue; }

      let legacy = null;
      try { legacy = await fetchLegacyBySlug(row.slug); }
      catch (e) { errors++; console.log(`  [${kind}] ${row.slug}: fetch error ${e.message}`); continue; }

      if (!legacy) {
        notFound++;
        console.log(`  [${kind}] ${row.slug}: not found on legacy site`);
        continue;
      }

      const content = legacy.content?.rendered ?? '';
      const body = extractBody(content);
      const bullets = extractList(content, 8);
      const wc = countWords(body);

      if (wc < 80) {
        console.log(`  [${kind}] ${row.slug}: legacy content too thin (${wc}w) — skipping`);
        skipped++;
        continue;
      }

      console.log(`  [${kind}] ${row.slug} · ${row.name}: pulled ${wc}w + ${bullets.length} bullets`);

      if (!APPLY) continue;

      if (kind === 'print') {
        // description = first 1-2 paragraphs (short)
        const shortDesc = body.split('\n\n').slice(0, 2).join(' ').slice(0, 600);
        await pg`update products set description = ${shortDesc} where id = ${row.id}`;
        // extras.intro = full long-form body
        const [existingExtras] = await pg`select product_id from product_extras where product_id = ${row.id}`;
        if (existingExtras) {
          await pg`update product_extras set intro = ${body}${
            bullets.length > 0 ? pg`, why_us = ${bullets}` : pg``
          } where product_id = ${row.id}`;
        } else {
          await pg`
            insert into product_extras (product_id, intro, why_us)
            values (${row.id}, ${body}, ${bullets})
          `;
        }
      } else {
        // Gift: description holds the long body
        await pg`update gift_products set description = ${body} where id = ${row.id}`;
      }
      updated++;
      // Polite rate limiting
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  console.log(`\n${APPLY ? 'Applied' : 'Would update'}: ${updated}`);
  console.log(`Already long enough (skipped): ${skipped}`);
  console.log(`Not found on legacy site: ${notFound}`);
  console.log(`Fetch errors: ${errors}`);
}

try {
  await main();
} finally {
  await pg.end({ timeout: 5 });
}
