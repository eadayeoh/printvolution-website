import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSql } from './_lib-merge-gift-group.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sql = await openSql();
try {
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0043_gift_input_mode.sql'), 'utf8'),
  );
  console.log('✓ migration 0043 applied (input_mode on gift_products)');

  // The engraved necklace parent is text-only by its nature (customer
  // types a name / date). Flip it so the text UI shows up for customers
  // without waiting for someone to toggle it in admin.
  const r = await sql`
    update gift_products set input_mode = 'text'
    where slug = 'engraved-necklace-bracelet'
    returning slug, input_mode
  `;
  if (r.length > 0) console.log(`  set ${r[0].slug} → input_mode=${r[0].input_mode}`);
} finally {
  await sql.end();
}
