import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSql } from './_lib-merge-gift-group.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sql = await openSql();
try {
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0044_gift_variants_surfaces.sql'), 'utf8'),
  );
  console.log('✓ migration 0044 applied (surfaces jsonb on gift_product_variants)');
} finally {
  await sql.end();
}
