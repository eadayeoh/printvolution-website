import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSql } from './_lib-merge-gift-group.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sql = await openSql();
try {
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0046_gift_secondary_mode.sql'), 'utf8'),
  );
  console.log('✓ migration 0046 applied (secondary_mode on gift_products)');
} finally {
  await sql.end();
}
