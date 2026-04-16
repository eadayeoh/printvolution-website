#!/usr/bin/env node
/**
 * Seed Supabase from /data/*.json
 *
 * Reads extracted JSON files, transforms them to match the schema, and
 * inserts via the Supabase REST API using the service-role key.
 *
 * Usage:
 *   node scripts/seed-supabase.mjs
 *   node scripts/seed-supabase.mjs --truncate    # wipe tables first
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env.local manually
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const TRUNCATE = process.argv.includes('--truncate');
const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────
const J = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `${name}.json`), 'utf8'));

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

/** Convert a price from S$X.XX format (number in dollars) to cents (int). */
function toCents(dollars) {
  if (typeof dollars !== 'number') return 0;
  return Math.round(dollars * 100);
}

/** Convert a pricing.rows array — prices are dollars, store as cents in jsonb. */
function pricingRowsToCents(rows) {
  return (rows || []).map((r) => ({
    qty: r.qty,
    prices: (r.prices || []).map(toCents),
  }));
}

async function ensureRpc(name) {
  // We use the REST endpoint directly for truncate to avoid TS friction.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  return res.ok;
}

async function truncateAll() {
  console.log('⚠️  Truncating tables...');
  // Order matters due to FKs — children first
  const tables = [
    'order_items', 'orders',
    'points_transactions', 'members',
    'coupon_redemptions', 'coupons', 'discount_rules',
    'mega_menu_items', 'mega_menus',
    'navigation', 'contact_methods', 'page_content',
    'bundle_faqs', 'bundle_whys', 'bundle_products', 'bundles',
    'product_related', 'product_faqs', 'product_configurator',
    'product_pricing', 'product_extras', 'gift_personalisation',
    'products', 'categories',
    'gift_methods', 'fonts', 'image_library',
  ];
  for (const t of tables) {
    const { error } = await sb.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error && !error.message.includes('column "id" does not exist')) {
      // Some tables have composite PKs without "id" — try alt approach
      console.warn(`  ${t}: ${error.message}`);
    } else {
      console.log(`  cleared ${t}`);
    }
  }
}

async function step(label, fn) {
  process.stdout.write(`→ ${label}... `);
  try {
    const result = await fn();
    console.log(`✓ ${result ?? 'ok'}`);
  } catch (err) {
    console.log(`✗`);
    console.error(err);
    throw err;
  }
}

// ── Seed: Categories ─────────────────────────────────────────────────────
async function seedCategories() {
  // Top-level categories come from CAT_GROUP keys + product `category` values
  const products = J('products');

  // Build category set: top-level from product.category, sub from product.subcategory
  const topLevel = new Map();   // slug -> {slug, name}
  const sub = new Map();        // slug -> {slug, name, parent_slug}

  for (const [, p] of Object.entries(products)) {
    if (p.category) {
      const sl = slugify(p.category);
      topLevel.set(sl, { slug: sl, name: p.category });
      if (p.subcategory) {
        const ssl = slugify(p.subcategory);
        sub.set(`${sl}/${ssl}`, { slug: ssl, name: p.subcategory, parent_slug: sl });
      }
    }
  }

  // Insert top-level (already deduped by Map)
  const topLevelRows = Array.from(topLevel.values()).map((c, i) => ({
    slug: c.slug, name: c.name, display_order: i,
  }));
  // Wipe + insert is simpler than upsert with onConflict
  await sb.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { data: topInserted, error: topErr } = await sb.from('categories')
    .insert(topLevelRows).select('id, slug');
  if (topErr) throw topErr;
  const slugToId = new Map(topInserted.map((r) => [r.slug, r.id]));

  // Sub-cats: dedupe by (parent_slug + slug) since slug alone might collide
  // (e.g. multiple parents could have a sub called "keychains")
  // Schema requires globally unique slug, so prefix with parent
  const subRows = Array.from(sub.values()).map((c, i) => ({
    slug: `${c.parent_slug}-${c.slug}`,  // make globally unique
    name: c.name,
    parent_id: slugToId.get(c.parent_slug),
    display_order: i,
  }));
  // Dedupe by slug (in case prefix produces same key)
  const subBySlug = new Map();
  for (const r of subRows) subBySlug.set(r.slug, r);
  const subUnique = Array.from(subBySlug.values());
  if (subUnique.length) {
    const { data: subInserted, error: subErr } = await sb.from('categories')
      .insert(subUnique).select('id, slug, parent_id');
    if (subErr) throw subErr;
    for (const r of subInserted) {
      slugToId.set(`sub:${r.slug}:${r.parent_id}`, r.id);
    }
  }

  return `${topLevelRows.length} top + ${subUnique.length} sub`;
}

// ── Seed: Products ───────────────────────────────────────────────────────
async function seedProducts(giftCats) {
  const products = J('products');
  const giftCatSet = new Set(giftCats);

  // Get category IDs
  const { data: cats } = await sb.from('categories').select('id, slug, parent_id');
  const catBySlug = new Map();
  for (const c of cats || []) {
    if (!c.parent_id) catBySlug.set(c.slug, c.id);
  }
  // Sub-cat slugs are stored as "parent-sub" (e.g. "jewellery-keychains")
  const subCatBySlug = new Map();
  for (const c of cats || []) {
    if (c.parent_id) subCatBySlug.set(c.slug, c.id);
  }

  let count = 0;
  const slugToId = new Map();

  for (const [slug, p] of Object.entries(products)) {
    const catId = p.category ? catBySlug.get(slugify(p.category)) : null;
    const catSlug = p.category ? slugify(p.category) : null;
    const subCatId = p.subcategory && catSlug
      ? subCatBySlug.get(`${catSlug}-${slugify(p.subcategory)}`)
      : null;
    const isGift = p.type === 'gift' || (p.category && giftCatSet.has(p.category));

    const { data, error } = await sb.from('products').upsert({
      slug,
      name: p.name || slug,
      category_id: catId,
      subcategory_id: subCatId,
      icon: p.icon || null,
      tagline: p.tagline || null,
      description: p.description || null,
      highlights: p.highlights || [],
      specs: p.specs || [],
      is_gift: !!isGift,
      is_active: true,
      sort_order: count,
    }, { onConflict: 'slug' }).select('id').single();

    if (error) throw new Error(`product ${slug}: ${error.message}`);
    slugToId.set(slug, data.id);
    count++;
  }

  return `${count} products`;
}

// ── Seed: Product extras ─────────────────────────────────────────────────
async function seedProductExtras() {
  const extras = J('product_extras');
  const { data: prods } = await sb.from('products').select('id, slug');
  const slugToId = new Map((prods || []).map((p) => [p.slug, p.id]));

  let count = 0;
  for (const [slug, e] of Object.entries(extras)) {
    if (slug === '_default') continue;
    const id = slugToId.get(slug);
    if (!id) continue;
    const { error } = await sb.from('product_extras').upsert({
      product_id: id,
      seo_title: e.seoTitle || null,
      seo_desc: e.seoDesc || null,
      hero_color: e.heroColor || null,
      hero_big: e.heroBig || null,
      h1: e.h1 || null,
      h1em: e.h1em || null,
      intro: e.intro || null,
      why_headline: e.whyHeadline || null,
      why_us: e.whyUs || [],
      use_cases: e.useCases || [],
      chips: e.chips || [],
      image_url: e.image || null,
    }, { onConflict: 'product_id' });
    if (error) throw new Error(`extras ${slug}: ${error.message}`);
    count++;

    // FAQs
    if (Array.isArray(e.faq) && e.faq.length) {
      // Wipe existing for this product
      await sb.from('product_faqs').delete().eq('product_id', id);
      const faqRows = e.faq.map((qa, i) => ({
        product_id: id,
        question: qa[0],
        answer: qa[1],
        display_order: i,
      }));
      const { error: fErr } = await sb.from('product_faqs').insert(faqRows);
      if (fErr) console.warn(`  faq ${slug}: ${fErr.message}`);
    }
  }
  return `${count} extras`;
}

// ── Seed: Pricing ────────────────────────────────────────────────────────
async function seedPricing() {
  const products = J('products');
  const { data: prods } = await sb.from('products').select('id, slug');
  const slugToId = new Map((prods || []).map((p) => [p.slug, p.id]));

  let count = 0;
  for (const [slug, p] of Object.entries(products)) {
    const id = slugToId.get(slug);
    if (!id || !p.pricing) continue;
    const { error } = await sb.from('product_pricing').upsert({
      product_id: id,
      label: p.pricing.label || 'Size',
      configs: p.pricing.configs || [],
      rows: pricingRowsToCents(p.pricing.rows),
    }, { onConflict: 'product_id' });
    if (error) throw new Error(`pricing ${slug}: ${error.message}`);
    count++;
  }
  return `${count} pricing rows`;
}

// ── Seed: Configurator ───────────────────────────────────────────────────
async function seedConfigurator() {
  const cfg = J('configurator');
  const { data: prods } = await sb.from('products').select('id, slug');
  const slugToId = new Map((prods || []).map((p) => [p.slug, p.id]));

  let count = 0;
  for (const [slug, c] of Object.entries(cfg)) {
    const id = slugToId.get(slug);
    if (!id || !Array.isArray(c.steps)) continue;
    // Wipe existing for this product
    await sb.from('product_configurator').delete().eq('product_id', id);
    const rows = c.steps.map((step, i) => ({
      product_id: id,
      step_id: step.id,
      step_order: i,
      label: step.label || step.id,
      type: step.type,
      required: !!step.required,
      options: step.options || [],
      show_if: step.show_if || null,
      step_config: {
        presets: step.presets || null,
        min: step.min ?? null,
        step: step.step ?? null,
        labelMultiplier: step.labelMultiplier ?? null,
        discount_note: step.discount_note ?? null,
        note: step.note ?? null,
      },
    }));
    if (!rows.length) continue;
    const { error } = await sb.from('product_configurator').insert(rows);
    if (error) throw new Error(`configurator ${slug}: ${error.message}`);
    count++;
  }
  return `${count} configurators`;
}

// ── Seed: Gift personalisation ───────────────────────────────────────────
async function seedGiftPersonalisation() {
  const fields = J('gift_personalisation');
  const { data: prods } = await sb.from('products').select('id, slug');
  const slugToId = new Map((prods || []).map((p) => [p.slug, p.id]));

  let count = 0;
  for (const [slug, fieldList] of Object.entries(fields)) {
    const id = slugToId.get(slug);
    if (!id || !Array.isArray(fieldList)) continue;
    await sb.from('gift_personalisation').delete().eq('product_id', id);
    const rows = fieldList.map((f, i) => ({
      product_id: id,
      field_type: f.type === 'image' ? 'image' : 'text',
      field_id: `field-${i}`,
      label: f.label || `Field ${i + 1}`,
      placeholder: f.placeholder || null,
      required: !!f.required,
      display_order: i,
    }));
    if (!rows.length) continue;
    const { error } = await sb.from('gift_personalisation').insert(rows);
    if (error) throw new Error(`gift ${slug}: ${error.message}`);
    count++;
  }
  return `${count} products with gift fields`;
}

// ── Seed: Related products ───────────────────────────────────────────────
async function seedRelated() {
  const related = J('related');
  const { data: prods } = await sb.from('products').select('id, slug');
  const slugToId = new Map((prods || []).map((p) => [p.slug, p.id]));

  // RELATED is keyed by category, listing product slugs that are related across that category
  // For each product, related = others in the same category list
  const all = [];
  for (const [, slugs] of Object.entries(related)) {
    if (!Array.isArray(slugs)) continue;
    for (const slug of slugs) {
      const id = slugToId.get(slug);
      if (!id) continue;
      const others = slugs.filter((s) => s !== slug).slice(0, 6);
      others.forEach((other, i) => {
        const otherId = slugToId.get(other);
        if (otherId) all.push({ product_id: id, related_product_id: otherId, display_order: i });
      });
    }
  }
  if (!all.length) return '0';
  // Wipe + insert
  await sb.from('product_related').delete().neq('product_id', '00000000-0000-0000-0000-000000000000');
  // Dedupe
  const seen = new Set();
  const unique = all.filter((r) => {
    const k = `${r.product_id}|${r.related_product_id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const { error } = await sb.from('product_related').insert(unique);
  if (error) throw error;
  return `${unique.length} related links`;
}

// ── Seed: Bundles ────────────────────────────────────────────────────────
async function seedBundles() {
  const bundles = J('bundles');
  const { data: prods } = await sb.from('products').select('id, slug');
  const slugToId = new Map((prods || []).map((p) => [p.slug, p.id]));

  let count = 0;
  for (const b of bundles) {
    const { data: inserted, error } = await sb.from('bundles').upsert({
      slug: b.id,
      name: b.name,
      description: b.desc || null,
      tagline: b.tagline || null,
      price_cents: toCents(b.price),
      original_price_cents: toCents(b.original),
      image_url: b.image || null,
      status: b.status || 'active',
      sort_order: count,
    }, { onConflict: 'slug' }).select('id').single();
    if (error) throw new Error(`bundle ${b.id}: ${error.message}`);

    // Bundle products
    await sb.from('bundle_products').delete().eq('bundle_id', inserted.id);
    const includes = b.includes || {};
    const bpRows = (b.products || []).map((slug, i) => {
      const inc = includes[slug] || {};
      return {
        bundle_id: inserted.id,
        product_id: slugToId.get(slug),
        qty: inc.qty || null,
        spec: inc.spec || null,
        value: inc.value || null,
        display_order: i,
      };
    }).filter((r) => r.product_id);
    if (bpRows.length) {
      const { error: bpErr } = await sb.from('bundle_products').insert(bpRows);
      if (bpErr) console.warn(`  bundle_products ${b.id}: ${bpErr.message}`);
    }

    // Whys
    if (Array.isArray(b.why) && b.why.length) {
      await sb.from('bundle_whys').delete().eq('bundle_id', inserted.id);
      const wRows = b.why.map((w, i) => ({ bundle_id: inserted.id, text: w, display_order: i }));
      await sb.from('bundle_whys').insert(wRows);
    }

    // FAQs
    if (Array.isArray(b.faq) && b.faq.length) {
      await sb.from('bundle_faqs').delete().eq('bundle_id', inserted.id);
      const fRows = b.faq.map((qa, i) => ({
        bundle_id: inserted.id, question: qa[0], answer: qa[1], display_order: i,
      }));
      await sb.from('bundle_faqs').insert(fRows);
    }

    count++;
  }
  return `${count} bundles`;
}

// ── Seed: Page content (homepage sections, about) ───────────────────────
async function seedPageContent() {
  const pg = J('page_data');
  const sections = [
    ['home', 'pain', pg.pain || []],
    ['home', 'steps', pg.steps || []],
    ['home', 'why', pg.why || []],
    ['about', 'values', pg.values || []],
    ['about', 'clients', pg.clients || []],
  ];
  let count = 0;
  for (const [page_key, section_key, data] of sections) {
    const { error } = await sb.from('page_content').upsert(
      { page_key, section_key, data: { items: data } },
      { onConflict: 'page_key,section_key' }
    );
    if (error) throw new Error(`page_content ${page_key}/${section_key}: ${error.message}`);
    count++;
  }
  return `${count} sections`;
}

// ── Seed: Navigation + Mega menus ────────────────────────────────────────
async function seedNavigation() {
  const pg = J('page_data');
  await sb.from('navigation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const navRows = (pg.nav || []).map((item, i) => ({
    label: item.label || null,
    type: item.type === 'sep' ? 'sep' : (item.type === 'dropdown' ? 'dropdown' : 'link'),
    action: item.action || null,
    mega_key: item.mega ? item.mega.replace(/^mega-/, '') : null,
    display_order: i,
    is_hidden: !!item.hidden,
  }));
  if (navRows.length) {
    const { error } = await sb.from('navigation').insert(navRows);
    if (error) throw new Error(`nav: ${error.message}`);
  }

  // Mega menus
  await sb.from('mega_menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('mega_menus').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const menus = pg.menus || {};
  let menuCount = 0;
  let itemCount = 0;
  for (const [menuKey, sections] of Object.entries(menus)) {
    if (!Array.isArray(sections)) continue;
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const { data: inserted, error } = await sb.from('mega_menus').insert({
        menu_key: menuKey,
        section_heading: sec.heading || `Section ${i + 1}`,
        column_index: 0,  // legacy didn't track columns reliably
        display_order: i,
      }).select('id').single();
      if (error) { console.warn(`  mega ${menuKey}: ${error.message}`); continue; }
      menuCount++;

      const itemRows = (sec.items || []).map((it, j) => ({
        mega_menu_id: inserted.id,
        product_slug: it.slug,
        label: it.label || it.slug,
        display_order: j,
      }));
      if (itemRows.length) {
        const { error: itemErr } = await sb.from('mega_menu_items').insert(itemRows);
        if (itemErr) console.warn(`  mega items ${menuKey}/${sec.heading}: ${itemErr.message}`);
        else itemCount += itemRows.length;
      }
    }
  }
  return `${navRows.length} nav, ${menuCount} sections, ${itemCount} items`;
}

// ── Seed: Contact methods ────────────────────────────────────────────────
async function seedContactMethods() {
  const methods = J('contact_methods');
  if (!Array.isArray(methods) || !methods.length) return '0';
  await sb.from('contact_methods').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const validTypes = ['whatsapp','phone','email','instagram','facebook','tiktok','line','telegram','other'];
  const rows = methods.map((m, i) => ({
    type: validTypes.includes(m.type) ? m.type : 'other',
    value: m.value,
    label: m.label || null,
    note: m.note || null,
    display_order: i,
    is_active: true,
  }));
  const { error } = await sb.from('contact_methods').insert(rows);
  if (error) throw error;
  return `${rows.length}`;
}

// ── Seed: Coupons + discount rules ──────────────────────────────────────
async function seedPromos() {
  const coupons = J('coupons');
  const rules = J('discount_rules');

  await sb.from('coupons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('discount_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  let cCount = 0;
  for (const c of coupons || []) {
    const isPct = c.type === 'pct';
    const value = parseFloat(c.value) || 0;
    const { error } = await sb.from('coupons').insert({
      code: c.code,
      type: isPct ? 'pct' : 'flat',
      value_cents: isPct ? null : toCents(value),
      percent: isPct ? Math.round(value) : null,
      min_spend_cents: toCents(parseFloat(c.min) || 0),
      max_uses: c.uses && c.uses !== '0' ? parseInt(c.uses) : null,
      uses_count: 0,
      expires_at: c.expiry || null,
      is_active: true,
    });
    if (error) console.warn(`  coupon ${c.code}: ${error.message}`);
    else cCount++;
  }

  let rCount = 0;
  for (const r of rules || []) {
    const isPct = r.rewardType === 'pct';
    const reward = parseFloat(r.value) || 0;
    const trigger = parseFloat(r.trigger) || 0;
    const { error } = await sb.from('discount_rules').insert({
      type: r.type === 'min_qty' ? 'min_qty' : 'min_spend',
      trigger_value: r.type === 'min_spend' ? toCents(trigger) : Math.round(trigger),
      reward_type: isPct ? 'pct' : 'flat',
      reward_value: isPct ? Math.round(reward) : toCents(reward),
      label: r.label || null,
      is_active: true,
    });
    if (error) console.warn(`  rule: ${error.message}`);
    else rCount++;
  }

  return `${cCount} coupons, ${rCount} rules`;
}

// ── Run ──────────────────────────────────────────────────────────────────
console.log(`\nSeeding Supabase at ${SUPABASE_URL}\n`);

if (TRUNCATE) await truncateAll();

const giftCats = J('gift_cats');

await step('Categories         ', seedCategories);
await step('Products           ', () => seedProducts(giftCats));
await step('Product extras     ', seedProductExtras);
await step('Pricing            ', seedPricing);
await step('Configurator       ', seedConfigurator);
await step('Gift personalisation', seedGiftPersonalisation);
await step('Related products   ', seedRelated);
await step('Bundles            ', seedBundles);
await step('Page content       ', seedPageContent);
await step('Navigation + mega  ', seedNavigation);
await step('Contact methods    ', seedContactMethods);
await step('Coupons + rules    ', seedPromos);

console.log('\n✓ Seed complete');
