import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = ['/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', path.join(root, '.env.local')].find((p) => {
  try { fsSync.accessSync(p); return true; } catch { return false; }
});
const envFile = await fs.readFile(envPath, 'utf8');
for (const raw of envFile.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('='); if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}
// ALTER TYPE ADD VALUE can't be used in the same transaction where the
// new value is referenced. Split the migration: enum adds first (each
// in its own statement), then the metadata upserts.
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
try {
  for (const slug of ['eco-solvent', 'digital', 'uv-dtf']) {
    await sql.unsafe(`
      do $$ begin
        if not exists (
          select 1 from pg_enum e
          join pg_type t on e.enumtypid = t.oid
          where t.typname = 'gift_mode' and e.enumlabel = '${slug}'
        ) then
          execute 'alter type gift_mode add value ''${slug}''';
        end if;
      end $$;
    `);
  }
  console.log('✓ enum gift_mode extended with eco-solvent / digital / uv-dtf');

  // Second call: metadata table upserts (can now reference new enum values).
  await sql.unsafe(`
    update public.gift_modes set label = 'Laser Engraving', icon = null where slug = 'laser';
    update public.gift_modes set label = 'UV Printing',     icon = null where slug = 'uv';
    update public.gift_modes set icon = null where slug in ('embroidery', 'photo-resize');
    insert into public.gift_modes (slug, label, description, icon, display_order) values
      ('eco-solvent', 'Eco Solvent',      'Large-format eco-solvent printing on banner vinyl, poster paper, and adhesive rolls.', null, 5),
      ('digital',     'Digital Printing', 'High-resolution digital press — paper, card, sticker rolls. No AI transform.',         null, 6),
      ('uv-dtf',      'UV DTF',           'UV DTF transfer film for curved and irregular surfaces. Customer uploads artwork.',    null, 7)
    on conflict (slug) do update
      set label = excluded.label,
          description = excluded.description,
          icon = excluded.icon,
          display_order = excluded.display_order;
  `);
  console.log('✓ gift_modes metadata updated (4 renamed/stripped + 3 new)');
} finally {
  await sql.end();
}
