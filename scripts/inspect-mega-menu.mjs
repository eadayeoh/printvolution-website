#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const envFile = path.resolve(process.cwd(), '.env.local');
for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const pg = postgres(process.env.SUPABASE_DB_URL, {
  max: 1, connect_timeout: 30, ssl: { rejectUnauthorized: false },
});

try {
  const menus = await pg`select * from mega_menus order by menu_key, display_order;`;
  for (const m of menus) {
    console.log(`\n═══ [${m.menu_key}] ${m.section_heading} (col=${m.column_index}, ord=${m.display_order}) id=${m.id}`);
    const items = await pg`select * from mega_menu_items where mega_menu_id = ${m.id} order by display_order;`;
    for (const it of items) {
      console.log(`   · ${it.label.padEnd(35)} → ${it.product_slug}`);
    }
  }
} finally {
  await pg.end({ timeout: 5 });
}
