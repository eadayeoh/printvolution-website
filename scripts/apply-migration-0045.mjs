import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSql } from './_lib-merge-gift-group.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sql = await openSql();
try {
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0045_gift_order_item_surfaces.sql'), 'utf8'),
  );
  console.log('✓ migration 0045 applied (gift_order_item_surfaces table)');
} finally {
  await sql.end();
}
