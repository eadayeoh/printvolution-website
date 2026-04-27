'use server';

import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { reportError } from '@/lib/observability';

const BUCKET = 'product-images';

export type MediaRef = {
  table: string;
  column: string;
  ref_id: string;
};

export type MediaItem = {
  filename: string;       // bare key, e.g. 'logo-1701234-abc123.png'
  url: string;            // full public URL
  size_bytes: number;
  created_at: string;     // ISO
  references: MediaRef[]; // empty = orphan
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the bare filename from a full product-images public URL. */
function filenameFromUrl(url: string): string | null {
  if (!url || !url.includes('/product-images/')) return null;
  const idx = url.lastIndexOf('/product-images/');
  return url.slice(idx + '/product-images/'.length) || null;
}

/** Walk a value (string | string[] | object) and collect product-images filenames. */
function extractFilenames(value: unknown): string[] {
  const out: string[] = [];
  if (typeof value === 'string') {
    const f = filenameFromUrl(value);
    if (f) out.push(f);
  } else if (Array.isArray(value)) {
    for (const el of value) out.push(...extractFilenames(el));
  } else if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) out.push(...extractFilenames(v));
  }
  return out;
}

// ---------------------------------------------------------------------------
// listMediaWithUsage
// ---------------------------------------------------------------------------

export async function listMediaWithUsage(): Promise<
  { ok: true; items: MediaItem[] } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Forbidden' };
  }

  try {
    const sb = createServiceClient();

    // ── 1. List all files in the bucket (paginate past 1 000-item limit) ──
    const allFiles: Array<{
      name: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }> = [];

    let offset = 0;
    while (true) {
      const { data, error } = await sb.storage.from(BUCKET).list('', {
        limit: 1000,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) {
        reportError(error, { route: 'admin.media.list', action: 'storage_list' });
        return { ok: false, error: 'Failed to list storage bucket' };
      }
      if (!data || data.length === 0) break;
      allFiles.push(
        ...data
          .filter((f) => f.name && !f.name.endsWith('/') && !f.name.startsWith('.'))
          .map((f) => ({
            name: f.name,
            metadata: (f.metadata ?? {}) as Record<string, unknown>,
            created_at: f.created_at ?? '',
          })),
      );
      if (data.length < 1000) break;
      offset += 1000;
    }

    // ── 2. Build public URL map ──
    const urlMap = new Map<string, string>();
    for (const f of allFiles) {
      const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(f.name);
      urlMap.set(f.name, urlData.publicUrl);
    }

    // ── 3. Collect all references across every (table, column) pair ──
    // Map<filename, refs[]>
    const refMap = new Map<string, MediaRef[]>();

    function addRef(filename: string, table: string, column: string, ref_id: string) {
      if (!refMap.has(filename)) refMap.set(filename, []);
      refMap.get(filename)!.push({ table, column, ref_id });
    }

    // Plain-text / varchar columns
    const plainCols: Array<{ table: string; col: string }> = [
      { table: 'product_extras', col: 'image_url' },
      { table: 'bundles', col: 'image_url' },
      { table: 'image_library', col: 'url' },
      { table: 'option_image_library', col: 'url' },
      { table: 'gift_products', col: 'thumbnail_url' },
      { table: 'gift_products', col: 'mockup_url' },
      { table: 'gift_product_variants', col: 'mockup_url' },
      { table: 'gift_product_variants', col: 'variant_thumbnail_url' },
      { table: 'site_settings', col: 'logo_url' },
    ];

    for (const { table, col } of plainCols) {
      const { data: rows, error } = await (sb as any)
        .from(table)
        .select(`id, ${col}`)
        .like(col, '%/product-images/%');
      if (error) {
        reportError(error, { route: 'admin.media.list', action: `query_${table}_${col}` });
        // Non-fatal — continue with other columns
        continue;
      }
      for (const row of rows ?? []) {
        const fn = filenameFromUrl(row[col] ?? '');
        if (fn) addRef(fn, table, col, String(row.id));
      }
    }

    // JSONB columns — fetch all rows that reference product-images and parse in JS
    // gallery_images: array of strings
    {
      const { data: rows, error } = await sb
        .from('gift_products')
        .select('id, gallery_images')
        .like('gallery_images::text', '%/product-images/%');
      if (!error) {
        for (const row of rows ?? []) {
          const fns = extractFilenames(row.gallery_images);
          for (const fn of fns) addRef(fn, 'gift_products', 'gallery_images', String(row.id));
        }
      }
    }

    // surfaces: array of { mockup_url, ... }
    {
      const { data: rows, error } = await sb
        .from('gift_product_variants')
        .select('id, surfaces')
        .like('surfaces::text', '%/product-images/%');
      if (!error) {
        for (const row of rows ?? []) {
          const fns = extractFilenames(row.surfaces);
          for (const fn of fns) addRef(fn, 'gift_product_variants', 'surfaces', String(row.id));
        }
      }
    }

    // mockup_by_shape: { <shape>: { url, area } }
    {
      const { data: rows, error } = await sb
        .from('gift_product_variants')
        .select('id, mockup_by_shape')
        .like('mockup_by_shape::text', '%/product-images/%');
      if (!error) {
        for (const row of rows ?? []) {
          const fns = extractFilenames(row.mockup_by_shape);
          for (const fn of fns) addRef(fn, 'gift_product_variants', 'mockup_by_shape', String(row.id));
        }
      }
    }

    // mockup_by_prompt_id: { <prompt_id>: { url, area } }
    {
      const { data: rows, error } = await sb
        .from('gift_product_variants')
        .select('id, mockup_by_prompt_id')
        .like('mockup_by_prompt_id::text', '%/product-images/%');
      if (!error) {
        for (const row of rows ?? []) {
          const fns = extractFilenames(row.mockup_by_prompt_id);
          for (const fn of fns) addRef(fn, 'gift_product_variants', 'mockup_by_prompt_id', String(row.id));
        }
      }
    }

    // colour_swatches: array of { mockup_url, ... }
    {
      const { data: rows, error } = await sb
        .from('gift_product_variants')
        .select('id, colour_swatches')
        .like('colour_swatches::text', '%/product-images/%');
      if (!error) {
        for (const row of rows ?? []) {
          const fns = extractFilenames(row.colour_swatches);
          for (const fn of fns) addRef(fn, 'gift_product_variants', 'colour_swatches', String(row.id));
        }
      }
    }

    // ── 4. Assemble final list ──
    const items: MediaItem[] = allFiles.map((f) => ({
      filename: f.name,
      url: urlMap.get(f.name) ?? '',
      size_bytes: (f.metadata?.size as number) ?? 0,
      created_at: f.created_at,
      references: refMap.get(f.name) ?? [],
    }));

    return { ok: true, items };
  } catch (err) {
    reportError(err, { route: 'admin.media.list' });
    return { ok: false, error: 'Unexpected error loading media library' };
  }
}

// ---------------------------------------------------------------------------
// buildUsageSet — shared logic for re-checking references before delete
// ---------------------------------------------------------------------------

async function buildUsageSetForFilenames(filenames: string[]): Promise<Set<string>> {
  const sb = createServiceClient();
  const used = new Set<string>();

  function markIfMatch(value: unknown, targets: string[]) {
    const fns = extractFilenames(value);
    for (const fn of fns) {
      if (targets.includes(fn)) used.add(fn);
    }
  }

  // Plain-text columns
  const plainCols: Array<{ table: string; col: string }> = [
    { table: 'product_extras', col: 'image_url' },
    { table: 'bundles', col: 'image_url' },
    { table: 'image_library', col: 'url' },
    { table: 'option_image_library', col: 'url' },
    { table: 'gift_products', col: 'thumbnail_url' },
    { table: 'gift_products', col: 'mockup_url' },
    { table: 'gift_product_variants', col: 'mockup_url' },
    { table: 'gift_product_variants', col: 'variant_thumbnail_url' },
    { table: 'site_settings', col: 'logo_url' },
  ];

  for (const { table, col } of plainCols) {
    const { data: rows } = await (sb as any)
      .from(table)
      .select(`id, ${col}`)
      .like(col, '%/product-images/%');
    for (const row of rows ?? []) {
      const fn = filenameFromUrl(row[col] ?? '');
      if (fn && filenames.includes(fn)) used.add(fn);
    }
  }

  // JSONB columns
  const jsonbCols: Array<{ table: string; col: string }> = [
    { table: 'gift_products', col: 'gallery_images' },
    { table: 'gift_product_variants', col: 'surfaces' },
    { table: 'gift_product_variants', col: 'mockup_by_shape' },
    { table: 'gift_product_variants', col: 'mockup_by_prompt_id' },
    { table: 'gift_product_variants', col: 'colour_swatches' },
  ];

  for (const { table, col } of jsonbCols) {
    const { data: rows } = await (sb as any)
      .from(table)
      .select(`id, ${col}`)
      .like(`${col}::text`, '%/product-images/%');
    for (const row of rows ?? []) {
      markIfMatch(row[col], filenames);
    }
  }

  return used;
}

// ---------------------------------------------------------------------------
// bulkDeleteMedia
// ---------------------------------------------------------------------------

export async function bulkDeleteMedia(filenames: string[]): Promise<
  { ok: true; deleted: number } | { ok: false; error: string; deleted: number }
> {
  try {
    await requireAdmin();
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Forbidden', deleted: 0 };
  }

  // Validate each filename
  for (const fn of filenames) {
    if (typeof fn !== 'string' || fn.length === 0 || fn.length > 200) {
      return { ok: false, error: `Invalid filename: ${fn}`, deleted: 0 };
    }
    if (fn.includes('/') || fn.includes('..')) {
      return { ok: false, error: `Invalid filename (path traversal): ${fn}`, deleted: 0 };
    }
  }

  if (filenames.length === 0) {
    return { ok: false, error: 'No filenames provided', deleted: 0 };
  }

  try {
    // Defence-in-depth: re-check usage server-side before deleting
    const stillUsed = await buildUsageSetForFilenames(filenames);
    if (stillUsed.size > 0) {
      const list = [...stillUsed].slice(0, 5).join(', ');
      return {
        ok: false,
        error: `${stillUsed.size} file(s) became referenced since you loaded the page — refresh and retry. (${list})`,
        deleted: 0,
      };
    }

    const sb = createServiceClient();
    const { error } = await sb.storage.from(BUCKET).remove(filenames);
    if (error) {
      reportError(error, { route: 'admin.media.bulk_delete', extras: { count: filenames.length } });
      return { ok: false, error: 'Storage delete failed', deleted: 0 };
    }

    return { ok: true, deleted: filenames.length };
  } catch (err) {
    reportError(err, { route: 'admin.media.bulk_delete', extras: { count: filenames.length } });
    return { ok: false, error: 'Unexpected error during delete', deleted: 0 };
  }
}
