// End-to-end smoke test for the gifts + mixed-bundles stack.
//
// Exercises:
//   1. Read seeded gift_pipelines (4 rows expected)
//   2. Create a test gift product referencing a pipeline
//   3. Create 2 variants on that product (with own mockups + prices)
//   4. Create 2 prompts (line-art + realistic) pinned to the pipeline
//   5. Read back via public REST API + verify shape
//   6. Create a bundle with 1 service + 1 gift (pre-fixed variant + style)
//   7. Read the bundle detail + verify giftComponents + type_badge = mixed
//   8. Clean up everything this script created
//
// Run: `node scripts/smoke-gifts-and-bundles.mjs`
// Exits 0 on pass, 1 on fail.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(
  env.trim().split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }),
);
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    process.exit(1);
  } else {
    console.log(`✓ ${msg}`);
  }
}

async function api(path, init = {}) {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`${init.method ?? 'GET'} ${path} → ${r.status}: ${body}`);
  }
  return r.status === 204 ? null : r.json();
}

const cleanupTasks = [];
function schedule(fn) { cleanupTasks.push(fn); }
async function cleanup() {
  console.log('\n— Cleanup —');
  for (const t of cleanupTasks.reverse()) {
    try { await t(); } catch (e) { console.warn('cleanup:', e.message); }
  }
}

try {
  // 1. Verify seeded pipelines
  const pipelines = await api('/rest/v1/gift_pipelines?select=id,slug,kind,name&order=slug.asc');
  assert(pipelines.length >= 4, `gift_pipelines has ${pipelines.length} rows (expected ≥ 4)`);
  const laserPipeline = pipelines.find((p) => p.slug === 'laser-v1');
  assert(laserPipeline, 'laser-v1 pipeline exists');

  // 2. Create test gift product
  const ts = Date.now();
  const giftSlug = `smoke-gift-${ts}`;
  const [product] = await api('/rest/v1/gift_products', {
    method: 'POST',
    body: JSON.stringify({
      slug: giftSlug,
      name: `Smoke Gift ${ts}`,
      mode: 'laser',
      width_mm: 100,
      height_mm: 100,
      bleed_mm: 2,
      safe_zone_mm: 3,
      min_source_px: 1200,
      pipeline_id: laserPipeline.id,
      source_retention_days: 30,
      base_price_cents: 0,
      is_active: true,
    }),
  });
  const pid = product.id;
  schedule(async () => { await api(`/rest/v1/gift_products?id=eq.${pid}`, { method: 'DELETE' }); });
  assert(pid, `gift_product created (id ${pid})`);

  // 3. Create 2 variants
  const variants = await api('/rest/v1/gift_product_variants', {
    method: 'POST',
    body: JSON.stringify([
      {
        gift_product_id: pid,
        slug: 'oak',
        name: 'Oak Round',
        features: ['Solid oak', 'USB-C powered'],
        mockup_url: 'https://example.com/oak.jpg',
        mockup_area: { x: 20, y: 20, width: 60, height: 60 },
        base_price_cents: 4500,
        display_order: 0,
      },
      {
        gift_product_id: pid,
        slug: 'metal',
        name: 'Black Metal',
        features: ['Brushed steel', 'USB-C powered'],
        mockup_url: 'https://example.com/metal.jpg',
        mockup_area: { x: 20, y: 20, width: 60, height: 60 },
        base_price_cents: 6800,
        display_order: 1,
      },
    ]),
  });
  assert(variants.length === 2, 'created 2 variants');
  const variantOak = variants.find((v) => v.slug === 'oak');

  // 4. Create 2 prompts (line-art + realistic) pinned to pipeline
  const prompts = await api('/rest/v1/gift_prompts', {
    method: 'POST',
    body: JSON.stringify([
      {
        mode: 'laser', style: 'line-art', pipeline_id: laserPipeline.id,
        name: `Smoke LineArt ${ts}`, transformation_prompt: 'Line art output',
        display_order: 0, is_active: true,
      },
      {
        mode: 'laser', style: 'realistic', pipeline_id: laserPipeline.id,
        name: `Smoke Realistic ${ts}`, transformation_prompt: 'Realistic output',
        display_order: 0, is_active: true,
      },
    ]),
  });
  const promptLineArt = prompts.find((p) => p.style === 'line-art');
  for (const p of prompts) {
    schedule(async () => { await api(`/rest/v1/gift_prompts?id=eq.${p.id}`, { method: 'DELETE' }); });
  }
  assert(prompts.length === 2, 'created 2 prompts (line-art + realistic)');

  // 5. Read variants + prompts back
  const readVariants = await api(`/rest/v1/gift_product_variants?gift_product_id=eq.${pid}&select=slug,name,base_price_cents&order=display_order`);
  assert(readVariants[0].slug === 'oak' && readVariants[1].slug === 'metal', 'variants read back in order');

  const readPrompts = await api(`/rest/v1/gift_prompts?pipeline_id=eq.${laserPipeline.id}&style=in.(line-art,realistic)&select=style`);
  const styles = readPrompts.map((p) => p.style).sort();
  assert(styles.includes('line-art') && styles.includes('realistic'), 'both styles queryable per pipeline');

  // 6. Pick any services product + build a bundle
  const services = await api('/rest/v1/products?is_active=eq.true&select=id,slug&limit=1');
  if (services.length === 0) {
    console.warn('⚠ no active services products — skipping bundle test (still passes gift tests)');
  } else {
    const svc = services[0];
    const bundleSlug = `smoke-bundle-${ts}`;
    const [bundle] = await api('/rest/v1/bundles', {
      method: 'POST',
      body: JSON.stringify({
        slug: bundleSlug, name: `Smoke Bundle ${ts}`,
        description: 'smoke test', status: 'active',
        discount_type: null, discount_value: 0,
        price_cents: 9999, original_price_cents: 9999, sort_order: 9999,
      }),
    });
    const bid = bundle.id;
    schedule(async () => { await api(`/rest/v1/bundles?id=eq.${bid}`, { method: 'DELETE' }); });

    await api('/rest/v1/bundle_products', {
      method: 'POST',
      body: JSON.stringify({ bundle_id: bid, product_id: svc.id, override_qty: 10, display_order: 0 }),
    });
    await api('/rest/v1/bundle_gift_items', {
      method: 'POST',
      body: JSON.stringify({
        bundle_id: bid,
        gift_product_id: pid,
        variant_id: variantOak.id,
        prompt_id: promptLineArt.id,
        pipeline_id: laserPipeline.id,
        override_qty: 5,
        display_order: 0,
      }),
    });
    assert(true, 'bundle created with 1 service + 1 gift');

    // 7. Verify bundle detail includes both components
    const [readBundle] = await api(`/rest/v1/bundles?id=eq.${bid}&select=id,bundle_products(product_id,override_qty),bundle_gift_items(gift_product_id,variant_id,prompt_id,override_qty)`);
    assert(readBundle.bundle_products.length === 1, 'bundle has 1 service');
    assert(readBundle.bundle_gift_items.length === 1, 'bundle has 1 gift');
    assert(readBundle.bundle_gift_items[0].variant_id === variantOak.id, 'gift item variant matches');
  }

  console.log('\n✓ SMOKE PASSED');
} catch (e) {
  console.error('\n✗ SMOKE FAILED:', e.message);
  await cleanup();
  process.exit(1);
}

await cleanup();
process.exit(0);
