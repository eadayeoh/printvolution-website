import fs from 'node:fs'; import postgres from 'postgres';
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });
console.log('in gift_products:', await pg`select slug, name, is_active, mode from gift_products where slug ilike '%netflix%'`);
console.log('in products:', await pg`select slug, name, is_active from products where slug ilike '%netflix%'`);
console.log('in mega menu:', await pg`select mmi.product_slug, mm.menu_key, mm.section_heading from mega_menu_items mmi join mega_menus mm on mm.id = mmi.mega_menu_id where mmi.product_slug ilike '%netflix%'`);
await pg.end({ timeout: 2 });
