import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSql } from './_lib-merge-gift-group.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sql = await openSql();
try {
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0049_gift_templates_group.sql'), 'utf8'),
  );
  console.log('✓ migration 0049 applied (group_name on gift_templates)');
} finally {
  await sql.end();
}
