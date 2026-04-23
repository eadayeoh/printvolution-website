// Shared helper for merging N existing gift_products into ONE parent
// gift_product with N variants. Idempotent — safe to re-run.
//
// Usage (from a thin wrapper script):
//
//   import { mergeGiftGroup } from './_lib-merge-gift-group.mjs';
//   await mergeGiftGroup(sql, {
//     parent: { slug, name, description?, tagline?, mode, category_id?, ... },
//     sources: [
//       { source_slug: 'bar-necklace', variant_slug: 'bar', variant_name: 'Bar Necklace' },
//       ...
//     ],
//   });

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

export async function openSql() {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const envPath = [
    '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
    path.join(root, '.env.local'),
  ].find((p) => { try { fsSync.accessSync(p); return true; } catch { return false; } });
  const envFile = await fs.readFile(envPath, 'utf8');
  for (const raw of envFile.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('='); if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
  return postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
}

export async function mergeGiftGroup(sql, { parent, sources }) {
  // 1. Ensure the parent row exists. Pull the first source to steal
  //    fallback values (pipeline_id, width/height, bleed, safe_zone,
  //    min_source_px, category_id if not set).
  const sourceRows = [];
  for (const s of sources) {
    const [row] = await sql`select * from gift_products where slug = ${s.source_slug}`;
    if (!row) throw new Error(`Source not found: ${s.source_slug}`);
    sourceRows.push({ input: s, row });
  }
  const proto = sourceRows[0].row;

  const [existingParent] = await sql`select * from gift_products where slug = ${parent.slug}`;
  let parentId;
  if (existingParent) {
    parentId = existingParent.id;
    console.log(`  parent "${parent.slug}" already exists — reusing (id=${parentId})`);
  } else {
    const [inserted] = await sql`
      insert into gift_products (
        slug, name, category_id, description, tagline, gallery_images, thumbnail_url,
        width_mm, height_mm, bleed_mm, safe_zone_mm, min_source_px,
        mode, template_mode, ai_prompt, ai_negative_prompt, ai_params, color_profile,
        base_price_cents, price_tiers,
        seo_title, seo_desc, seo_body, seo_magazine, faqs,
        is_active, mockup_url, mockup_area, pipeline_id, source_retention_days
      ) values (
        ${parent.slug},
        ${parent.name},
        ${parent.category_id ?? proto.category_id},
        ${parent.description ?? proto.description},
        ${parent.tagline ?? proto.tagline},
        ${parent.gallery_images ?? []},
        ${parent.thumbnail_url ?? null},
        ${proto.width_mm},
        ${proto.height_mm},
        ${proto.bleed_mm},
        ${proto.safe_zone_mm},
        ${proto.min_source_px},
        ${parent.mode ?? proto.mode},
        ${parent.template_mode ?? 'none'},
        ${proto.ai_prompt},
        ${proto.ai_negative_prompt},
        ${sql.json(proto.ai_params ?? {})},
        ${proto.color_profile},
        ${parent.base_price_cents ?? Math.min(...sourceRows.map((s) => s.row.base_price_cents || 0))},
        ${sql.json(parent.price_tiers ?? [])},
        ${parent.seo_title ?? null},
        ${parent.seo_desc ?? null},
        ${parent.seo_body ?? null},
        ${sql.json(parent.seo_magazine ?? null)},
        ${sql.json(parent.faqs ?? [])},
        true,
        null,
        ${sql.json(proto.mockup_area ?? { x: 20, y: 20, width: 60, height: 60 })},
        ${proto.pipeline_id},
        ${proto.source_retention_days ?? 30}
      )
      returning id
    `;
    parentId = inserted.id;
    console.log(`  created parent "${parent.slug}" (id=${parentId})`);
  }

  // 2. Upsert variants. slug is unique per parent — we key on (parent_id, slug).
  for (const { input, row } of sourceRows) {
    const [existing] = await sql`
      select id from gift_product_variants
      where gift_product_id = ${parentId} and slug = ${input.variant_slug}
    `;
    const payload = {
      gift_product_id: parentId,
      slug: input.variant_slug,
      name: input.variant_name,
      features: input.features ?? [],
      mockup_url: row.mockup_url ?? '',
      mockup_area: row.mockup_area ?? { x: 20, y: 20, width: 60, height: 60 },
      variant_thumbnail_url: row.thumbnail_url ?? null,
      base_price_cents: row.base_price_cents ?? 0,
      price_tiers: row.price_tiers ?? [],
      display_order: input.display_order ?? sourceRows.findIndex((x) => x.input === input),
      is_active: true,
      variant_kind: input.variant_kind ?? 'base',
      width_mm: input.width_mm ?? null,
      height_mm: input.height_mm ?? null,
      colour_swatches: input.colour_swatches ?? [],
    };
    if (existing) {
      await sql`
        update gift_product_variants set
          name = ${payload.name},
          features = ${sql.json(payload.features)},
          mockup_url = ${payload.mockup_url},
          mockup_area = ${sql.json(payload.mockup_area)},
          variant_thumbnail_url = ${payload.variant_thumbnail_url},
          base_price_cents = ${payload.base_price_cents},
          price_tiers = ${sql.json(payload.price_tiers)},
          display_order = ${payload.display_order},
          is_active = ${payload.is_active},
          variant_kind = ${payload.variant_kind},
          width_mm = ${payload.width_mm},
          height_mm = ${payload.height_mm},
          colour_swatches = ${sql.json(payload.colour_swatches)}
        where id = ${existing.id}
      `;
      console.log(`  updated variant ${input.variant_slug} (from ${input.source_slug})`);
    } else {
      await sql`
        insert into gift_product_variants (
          gift_product_id, slug, name, features, mockup_url, mockup_area,
          variant_thumbnail_url, base_price_cents, price_tiers, display_order,
          is_active, variant_kind, width_mm, height_mm, colour_swatches
        ) values (
          ${payload.gift_product_id}, ${payload.slug}, ${payload.name},
          ${sql.json(payload.features)}, ${payload.mockup_url},
          ${sql.json(payload.mockup_area)}, ${payload.variant_thumbnail_url},
          ${payload.base_price_cents}, ${sql.json(payload.price_tiers)},
          ${payload.display_order}, ${payload.is_active}, ${payload.variant_kind},
          ${payload.width_mm}, ${payload.height_mm},
          ${sql.json(payload.colour_swatches)}
        )
      `;
      console.log(`  inserted variant ${input.variant_slug} (from ${input.source_slug})`);
    }
  }

  // 3. Deactivate the old source rows so they drop out of the catalogue
  //    without destroying the data. User can resurrect by flipping the
  //    flag in admin if the merge was wrong.
  for (const s of sources) {
    await sql`update gift_products set is_active = false where slug = ${s.source_slug}`;
  }
  console.log(`  deactivated ${sources.length} source gift_products`);
  return parentId;
}
