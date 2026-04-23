// Rewrite the homepage Gifts tab so its slugs point at the new merged
// parents instead of the deleted individual products.

import { openSql } from './_lib-merge-gift-group.mjs';
const sql = await openSql();

// Slug → slug rewrites. Left: old slug the tabs used to reference.
// Right: what it maps to now. Slugs that no longer exist (like
// `apron`) get dropped from the list entirely.
const REWRITES = {
  'bar-necklace':               'engraved-necklace-bracelet',
  '3d-bar-keychain':            'engraved-keychain',
  'line-art-embroidery-shirt':  'line-art-embroidery',
  'led-black-base':             'led-base',
  'led-wood-circle-base':       'led-base',
  'led-wood-rectangle-base':    'led-base',
};
const DROP = new Set(['apron']); // slug doesn't exist in either table

try {
  const [row] = await sql`
    select section_key, data
    from page_content
    where page_key = 'home' and section_key = 'categories.tabs'
  `;
  if (!row) { console.log('no categories.tabs row — nothing to patch'); process.exit(0); }

  const items = row.data?.items ?? [];
  for (const tab of items) {
    const before = tab.product_slugs ?? [];
    const after = [];
    const seen = new Set();
    for (const s of before) {
      if (DROP.has(s)) continue;
      const next = REWRITES[s] ?? s;
      if (seen.has(next)) continue;
      seen.add(next);
      after.push(next);
    }
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      console.log(`  [${tab.tab_key}] ${before.length} → ${after.length} slugs`);
      tab.product_slugs = after;
    } else {
      console.log(`  [${tab.tab_key}] unchanged (${before.length} slugs)`);
    }
  }

  await sql`
    update page_content
      set data = ${sql.json({ items })}
      where page_key = 'home' and section_key = 'categories.tabs'
  `;
  console.log('Patched homepage categories.tabs.');
} finally {
  await sql.end();
}
