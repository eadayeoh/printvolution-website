import postgres from 'postgres';
import fs from 'node:fs';
const env = fs.readFileSync('.env.local','utf8').split('\n').reduce((a,l)=>{const m=l.match(/^([A-Z_]+)=(.+)$/);if(m)a[m[1]]=m[2].replace(/^"(.*)"$/,'$1');return a;},{});
const sql = postgres(env.SUPABASE_DB_URL);
const p = await sql`select * from gift_products where slug = 'song-lyrics-photo-frame' limit 1`;
console.log('=== gift_products row ===');
if (p[0]) {
  for (const k of Object.keys(p[0])) {
    const v = p[0][k];
    if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    const s = typeof v === 'string' ? v.slice(0, 100) : JSON.stringify(v).slice(0, 100);
    console.log(`  ${k.padEnd(28)}: ${s}`);
  }
}
const v = await sql`select id, name, mockup_url, mockup_area, surfaces, base_price_cents from gift_product_variants where gift_product_id = ${p[0].id}`;
console.log(`\n=== variants (${v.length}) ===`);
v.forEach(x => console.log(`  ${x.name}: mockup=${x.mockup_url ? 'set' : 'null'} surfaces=${(x.surfaces||[]).length}`));
const t = await sql`select id, name, thumbnail_url, background_url, foreground_url, zones_json from gift_templates where gift_product_id = ${p[0].id}`;
console.log(`\n=== templates (${t.length}) ===`);
t.forEach(x => console.log(`  ${x.name} [${x.id}]\n    zones=${JSON.stringify(x.zones_json).slice(0,200)}`));
await sql.end();
