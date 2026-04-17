import fs from 'node:fs'; import postgres from 'postgres';
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });
console.log('products:', await pg`select slug, name, is_gift from products where slug ilike '%embroid%' or slug = 'aprons'`);
console.log('gift_products:', await pg`select slug, name, mode from gift_products where slug ilike '%embroid%' or slug = 'aprons'`);
await pg.end({ timeout: 2 });
