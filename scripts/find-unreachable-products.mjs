// Scan every active product/gift_product and flag the ones that don't
// appear anywhere discoverable: mega menus, homepage category tabs,
// bundle_gift_items, or (as a safety net) any order.
//
// "Unreachable" here means: a customer landing on the homepage can't
// click their way to this product. Direct-URL visits still work, so
// the decision to delete remains yours.

import { openSql } from './_lib-merge-gift-group.mjs';
const sql = await openSql();

try {
  // 1. Collect every slug referenced from anywhere-linkable.
  const referenced = new Set();

  const megaItems = await sql`select product_slug from mega_menu_items`;
  for (const r of megaItems) referenced.add(r.product_slug);

  const homeRows = await sql`
    select data from page_content
    where page_key = 'home' and section_key = 'categories.tabs'
  `;
  for (const row of homeRows) {
    for (const tab of row.data?.items ?? []) {
      for (const s of tab.product_slugs ?? []) referenced.add(s);
    }
  }

  // Bundles might include gifts as components, keep those reachable.
  const bundleGifts = await sql`
    select gift_product_id from bundle_gift_items where gift_product_id is not null
  `;
  const bundleGiftIds = new Set(bundleGifts.map((r) => r.gift_product_id));

  // Products that have been ordered — keep even if unreachable now.
  const orderedPrintIds = new Set(
    (await sql`select distinct product_id from order_items where product_id is not null`).map((r) => r.product_id),
  );
  const orderedGiftIds = new Set(
    (await sql`select distinct gift_product_id from gift_order_items where gift_product_id is not null`).map((r) => r.gift_product_id),
  );

  // 2. Walk every active product and decide.
  const prints = await sql`select id, slug, name from products where is_active = true order by name`;
  const gifts  = await sql`select id, slug, name from gift_products where is_active = true order by name`;

  console.log('=== PRINT products ===');
  let unreachPrint = 0;
  for (const p of prints) {
    const reachableVia = [];
    if (referenced.has(p.slug)) reachableVia.push('menu/home');
    if (orderedPrintIds.has(p.id)) reachableVia.push('ordered');
    if (reachableVia.length === 0) {
      console.log(`  ❌ ${p.slug.padEnd(36)} ${p.name}`);
      unreachPrint++;
    }
  }
  console.log(`  → ${unreachPrint} of ${prints.length} unreachable.\n`);

  console.log('=== GIFT products ===');
  let unreachGift = 0;
  for (const p of gifts) {
    const reachableVia = [];
    if (referenced.has(p.slug)) reachableVia.push('menu/home');
    if (bundleGiftIds.has(p.id)) reachableVia.push('bundle');
    if (orderedGiftIds.has(p.id)) reachableVia.push('ordered');
    if (reachableVia.length === 0) {
      console.log(`  ❌ ${p.slug.padEnd(36)} ${p.name}`);
      unreachGift++;
    }
  }
  console.log(`  → ${unreachGift} of ${gifts.length} unreachable.`);
} finally {
  await sql.end();
}
