#!/usr/bin/env node
/**
 * Auto-generate seo_title + seo_desc for every Print and Gift product
 * that doesn't have them yet, using the product's name + tagline +
 * description as source.
 *
 * Title format:    "<Name> Printing Singapore | Printvolution"
 *                  "<Name> Personalised Gift Singapore | Printvolution"
 * Desc format:     150-160 chars, derived from tagline or first sentence
 *                  of description, suffixed with the location pitch.
 *
 * Usage: node scripts/backfill-seo-meta.mjs --apply
 */
import fs from 'node:fs';
import postgres from 'postgres';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const APPLY = process.argv.includes('--apply');
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });

function clean(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function firstSentence(text) {
  const cleaned = clean(text).replace(/<[^>]+>/g, '');
  const m = cleaned.match(/^[^.!?]{20,160}[.!?]/);
  return m ? m[0].trim() : cleaned.slice(0, 140);
}

function clip(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd().replace(/[,.;:]$/, '') + '…';
}

function generatePrintMeta(p) {
  const title = clip(`${p.name} Printing Singapore | Printvolution`, 65);
  let desc = '';
  if (p.tagline && p.tagline.length > 20) {
    desc = `${p.tagline}. ${p.name} printing in Singapore — order online or walk in to Paya Lebar Square. Same-day pickup available.`;
  } else {
    const seed = firstSentence(p.description || `Custom ${p.name.toLowerCase()} printing services`);
    desc = `${seed} Order ${p.name.toLowerCase()} in Singapore from Printvolution at Paya Lebar Square — quick turnaround, free pickup, island-wide delivery.`;
  }
  return { seo_title: title, seo_desc: clip(desc, 158) };
}

function generateGiftMeta(p) {
  const modeWord = p.mode === 'embroidery' ? 'Embroidered'
    : p.mode === 'laser' ? 'Laser Engraved'
    : p.mode === 'uv' ? 'Personalised'
    : 'Custom Photo';
  const title = clip(`${modeWord} ${p.name} Singapore | Printvolution`, 65);
  let desc = '';
  if (p.tagline && p.tagline.length > 20) {
    desc = `${p.tagline}. Personalised ${p.name.toLowerCase()} made to order in Singapore. Upload your photo, see the preview, get it shipped.`;
  } else {
    const seed = firstSentence(p.description || `${p.name} personalised with your photo`);
    desc = `${seed} Personalised ${p.name.toLowerCase()} from Printvolution Singapore — upload a photo and we craft it.`;
  }
  return { seo_title: title, seo_desc: clip(desc, 158) };
}

try {
  // ── Print products ──
  const prints = await pg`
    select p.id, p.slug, p.name, p.description, p.tagline,
           ex.seo_title, ex.seo_desc
    from products p
    left join product_extras ex on ex.product_id = p.id
    where p.is_active = true
  `;
  let pUpdated = 0;
  for (const p of prints) {
    if (p.seo_title && p.seo_desc) continue;
    const meta = generatePrintMeta({ ...p, tagline: p.tagline });
    if (APPLY) {
      const [exists] = await pg`select product_id from product_extras where product_id = ${p.id}`;
      if (exists) {
        await pg`update product_extras set seo_title = ${meta.seo_title}, seo_desc = ${meta.seo_desc} where product_id = ${p.id}`;
      } else {
        await pg`insert into product_extras (product_id, seo_title, seo_desc) values (${p.id}, ${meta.seo_title}, ${meta.seo_desc})`;
      }
    }
    console.log(`  print  ${p.slug}  → "${meta.seo_title}"`);
    pUpdated++;
  }

  // ── Gift products ──
  const gifts = await pg`
    select id, slug, name, mode, description, tagline, seo_title, seo_desc
    from gift_products
    where is_active = true
  `;
  let gUpdated = 0;
  for (const g of gifts) {
    if (g.seo_title && g.seo_desc) continue;
    const meta = generateGiftMeta(g);
    if (APPLY) {
      await pg`update gift_products set seo_title = ${meta.seo_title}, seo_desc = ${meta.seo_desc} where id = ${g.id}`;
    }
    console.log(`  gift   ${g.slug}  → "${meta.seo_title}"`);
    gUpdated++;
  }

  console.log(`\n${APPLY ? 'Wrote' : 'Would write'} SEO meta for ${pUpdated} prints + ${gUpdated} gifts`);
} finally {
  await pg.end({ timeout: 2 });
}
