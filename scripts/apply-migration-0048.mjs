import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSql } from './_lib-merge-gift-group.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sql = await openSql();
try {
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0048_gift_order_items_production_files.sql'), 'utf8'),
  );
  console.log('✓ migration 0048 applied (production_files jsonb on gift_order_items)');
} finally {
  await sql.end();
}
