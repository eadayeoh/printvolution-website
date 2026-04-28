import fs from 'node:fs/promises';
import postgres from 'postgres';
const envFile = await fs.readFile('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
for (const raw of envFile.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('='); if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
try {
  // 1. Clear preview_max_width_px so the shell stretches full column width
  await sql`update gift_products set preview_max_width_px = null where slug = 'star-map-photo-frame'`;
  // 2. Re-snap each variant's design rect to A3 portrait ratio (297:420 = 0.707).
  //    Keep them centered + sized so they sit roughly where the frame opening is.
  const newArea = { x: 28, y: 19, width: 44, height: 62 }; // 44/62 ≈ 0.71 = A3
  await sql`
    update gift_product_variants
       set mockup_area = ${JSON.stringify(newArea)}::jsonb
     where gift_product_id = (select id from gift_products where slug = 'star-map-photo-frame')
  `;
  // Verify
  const p = await sql`select width_mm, height_mm, preview_max_width_px from gift_products where slug='star-map-photo-frame'`;
  console.log('product:', p[0]);
  const v = await sql`
    select name, mockup_area
    from gift_product_variants
    where gift_product_id=(select id from gift_products where slug='star-map-photo-frame') and is_active=true
    order by display_order
  `;
  for (const r of v) {
    const a = r.mockup_area;
    const ratio = a ? (a.width / a.height).toFixed(3) : 'n/a';
    console.log(`${r.name}: ${a.width.toFixed(1)} × ${a.height.toFixed(1)}  ratio=${ratio} (A3=0.707)`);
  }
} finally { await sql.end(); }
