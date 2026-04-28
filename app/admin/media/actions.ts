'use server';

import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { logAdminAction } from '@/lib/auth/admin-audit';
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

/** Scan-time failures surface to the UI so a silent miss can't ship orphans. */
export type ScanWarning = { table: string; column: string; error: string };

// ---------------------------------------------------------------------------
// SCAN_TARGETS — single source of truth for every (table, column) that can
// reference a product-images file. Add here once; both listMediaWithUsage
// and bulkDeleteMedia (via buildUsageSetForFilenames) share this constant.
// ---------------------------------------------------------------------------

type ScanTarget =
  | { kind: 'plain'; table: string; col: string }
  | { kind: 'jsonb'; table: string; col: string }
  | { kind: 'html';  table: string; col: string };

const SCAN_TARGETS: ScanTarget[] = [
  // ── plain text / varchar columns ──────────────────────────────────────────
  { kind: 'plain', table: 'product_extras',         col: 'image_url' },
  { kind: 'plain', table: 'bundles',                col: 'image_url' },
  { kind: 'plain', table: 'image_library',          col: 'url' },
  { kind: 'plain', table: 'option_image_library',   col: 'url' },
  { kind: 'plain', table: 'gift_products',          col: 'thumbnail_url' },
  { kind: 'plain', table: 'gift_products',          col: 'mockup_url' },
  { kind: 'plain', table: 'gift_product_variants',  col: 'mockup_url' },
  { kind: 'plain', table: 'gift_product_variants',  col: 'variant_thumbnail_url' },
  { kind: 'plain', table: 'site_settings',          col: 'logo_url' },
  // Added (Fix 2):
  { kind: 'plain', table: 'blog_posts',             col: 'featured_image_url' },
  { kind: 'plain', table: 'gift_templates',         col: 'thumbnail_url' },
  { kind: 'plain', table: 'gift_templates',         col: 'background_url' },
  { kind: 'plain', table: 'gift_templates',         col: 'foreground_url' },
  { kind: 'plain', table: 'gift_prompts',           col: 'thumbnail_url' },
  { kind: 'plain', table: 'gift_pipelines',         col: 'thumbnail_url' },
  { kind: 'plain', table: 'site_settings',          col: 'favicon_url' },
  { kind: 'plain', table: 'order_items',            col: 'gift_image_url' },

  // ── JSONB columns (walker recurses into arrays + objects) ─────────────────
  { kind: 'jsonb', table: 'gift_products',          col: 'gallery_images' },
  { kind: 'jsonb', table: 'gift_product_variants',  col: 'surfaces' },
  { kind: 'jsonb', table: 'gift_product_variants',  col: 'mockup_by_shape' },
  { kind: 'jsonb', table: 'gift_product_variants',  col: 'mockup_by_prompt_id' },
  { kind: 'jsonb', table: 'gift_product_variants',  col: 'colour_swatches' },
  // Added (Fix 2):
  { kind: 'jsonb', table: 'page_content',           col: 'data' },
  { kind: 'jsonb', table: 'gift_templates',         col: 'zones_json' },
  { kind: 'jsonb', table: 'gift_products',          col: 'figurine_options' },
  { kind: 'jsonb', table: 'product_extras',         col: 'how_we_print' },
  { kind: 'jsonb', table: 'product_configurator',   col: 'options' },
  { kind: 'jsonb', table: 'site_settings',          col: 'product_features' },

  // ── HTML body columns (regex-extracted — cannot use plain walk) ───────────
  { kind: 'html',  table: 'blog_posts',             col: 'content_html' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Regex that matches /product-images/<filename> and captures the filename.
 * The character class stops at query strings, fragments, quotes, whitespace.
 * Must be reset (lastIndex = 0) before each use because it uses the g flag.
 */
const PRODUCT_IMAGE_RE = /\/product-images\/([A-Za-z0-9._\-]+)/g;

/**
 * Extract all product-images filenames from a raw string (URL, HTML, JSON blob).
 * Handles query strings, fragments, embedded HTML attributes — all correctly.
 */
function extractFilenamesFromString(s: string): string[] {
  if (typeof s !== 'string') return [];
  const out: string[] = [];
  PRODUCT_IMAGE_RE.lastIndex = 0; // reset between calls — global regex is stateful
  let m: RegExpExecArray | null;
  while ((m = PRODUCT_IMAGE_RE.exec(s)) !== null) out.push(m[1]);
  return out;
}

/**
 * Walk a value (string | array | object) and collect all product-images
 * filenames. For strings, delegates to extractFilenamesFromString so the
 * regex-based extractor handles URLs, HTML blobs, and JSONB serialisations
 * uniformly. Recursion handles nested arrays and objects.
 */
function extractFilenames(value: unknown): string[] {
  const out: string[] = [];
  if (typeof value === 'string') {
    out.push(...extractFilenamesFromString(value));
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
  { ok: true; items: MediaItem[]; warnings: ScanWarning[] } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Forbidden' };
  }

  try {
    const sb = createServiceClient();

    // ── 1. List all files in the bucket (paginate past 1 000-item limit) ──
    const rawFiles: Array<{
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
      rawFiles.push(
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

    // ── Fix 4: exclude files uploaded within the last hour ──
    // Avoids a race where an admin uploads a file, it hasn't been saved to a
    // product row yet, and a concurrent "delete orphans" sweep nukes it.
    const ONE_HOUR_AGO = Date.now() - 60 * 60 * 1000;
    const allFiles = rawFiles.filter((f) => {
      const created = f.created_at ? new Date(f.created_at).getTime() : 0;
      return created < ONE_HOUR_AGO;
    });

    // ── 2. Build public URL map ──
    const urlMap = new Map<string, string>();
    for (const f of allFiles) {
      const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(f.name);
      urlMap.set(f.name, urlData.publicUrl);
    }

    // ── 3. Collect all references across every (table, column) pair ──
    const refMap = new Map<string, MediaRef[]>();
    const warnings: ScanWarning[] = [];

    function addRef(filename: string, table: string, column: string, ref_id: string) {
      if (!refMap.has(filename)) refMap.set(filename, []);
      refMap.get(filename)!.push({ table, column, ref_id });
    }

    for (const target of SCAN_TARGETS) {
      const { table, col } = target;

      // Build the query. Plain text + html columns can use a `like` pre-filter
      // because they ARE text. JSONB columns CANNOT use `.like(`${col}::text`, ...)`
      // — PostgREST treats `col::text` as a literal column name and 400s. So for
      // JSONB we pull ALL rows and rely on the in-app walker. The tables involved
      // (site_settings: 1 row, page_content: ~10 rows, gift_templates: ~few,
      // gift_product_variants: tens) are small enough that the cost is negligible
      // and correctness is non-negotiable — silent miss = orphan-list lies =
      // admin deletes referenced files.
      // NB: do NOT prefix with 'id, ' — some tables (product_extras,
      // product_pricing) use the related FK as PK and have no `id` column,
      // which makes the whole select 400 with "column id does not exist"
      // — silently dropping every reference in that table from the scan.
      let queryBuilder = (sb as any).from(table).select(`${col}`);
      if (target.kind === 'plain' || target.kind === 'html') {
        queryBuilder = queryBuilder.like(col, '%/product-images/%');
      }

      const { data: rows, error } = await queryBuilder;
      if (error) {
        // Surface scan failures BOTH to Sentry AND to the UI. A silently-skipped
        // table previously made every JSONB reference look like an orphan.
        reportError(error, { route: 'admin.media.list', action: `query_${table}_${col}` });
        warnings.push({ table, column: col, error: error.message ?? String(error) });
        continue;
      }

      for (const row of rows ?? []) {
        const fns =
          target.kind === 'jsonb'
            ? extractFilenames(row[col])
            : extractFilenamesFromString(row[col] ?? '');
        // ref_id is informational only — orphan detection uses the filename;
        // the UI badge counts references regardless of id. Skip it entirely
        // so we don't have to know each table's PK.
        for (const fn of fns) addRef(fn, table, col, '');
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

    return { ok: true, items, warnings };
  } catch (err) {
    reportError(err, { route: 'admin.media.list' });
    return { ok: false, error: 'Unexpected error loading media library' };
  }
}

// ---------------------------------------------------------------------------
// buildUsageSet — shared logic for re-checking references before delete
// Uses the same SCAN_TARGETS constant so it can never drift out of sync.
// ---------------------------------------------------------------------------

async function buildUsageSetForFilenames(
  filenames: string[],
): Promise<{ used: Set<string>; failedScans: ScanWarning[] }> {
  const sb = createServiceClient();
  const used = new Set<string>();
  const failedScans: ScanWarning[] = [];
  const wanted = new Set(filenames);

  for (const target of SCAN_TARGETS) {
    const { table, col } = target;

    // Same JSONB / plain split as listMediaWithUsage. Do NOT use ::text on JSONB
    // — PostgREST will 400 and the silent error would make the recheck blind to
    // every JSONB reference, defeating the safety net.
    let queryBuilder = (sb as any).from(table).select(`${col}`);
    if (target.kind === 'plain' || target.kind === 'html') {
      queryBuilder = queryBuilder.like(col, '%/product-images/%');
    }

    const { data: rows, error } = await queryBuilder;
    if (error) {
      failedScans.push({ table, column: col, error: error.message ?? String(error) });
      continue;
    }

    for (const row of rows ?? []) {
      const fns =
        target.kind === 'jsonb'
          ? extractFilenames(row[col])
          : extractFilenamesFromString(row[col] ?? '');
      for (const fn of fns) {
        if (wanted.has(fn)) used.add(fn);
      }
    }
  }

  return { used, failedScans };
}

// ---------------------------------------------------------------------------
// bulkDeleteMedia
// ---------------------------------------------------------------------------

export async function bulkDeleteMedia(filenames: string[]): Promise<
  { ok: true; deleted: number } | { ok: false; error: string; deleted: number }
> {
  let actor;
  try {
    actor = (await requireAdmin()).actor;
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
    // Defence-in-depth: re-check usage server-side before deleting.
    const { used: stillUsed, failedScans } = await buildUsageSetForFilenames(filenames);

    // If ANY scan target failed, refuse the delete. An incomplete usage map
    // could falsely report a referenced file as orphan — exactly the bug class
    // we just fixed. Better to surface the scan failure than risk data loss.
    if (failedScans.length > 0) {
      const list = failedScans.slice(0, 3).map((w) => `${w.table}.${w.column}`).join(', ');
      reportError(new Error(`scan failed: ${list}`), {
        route: 'admin.media.bulk_delete',
        action: 'usage_recheck',
        extras: { failed_count: failedScans.length, count: filenames.length },
      });
      return {
        ok: false,
        error: `Cannot safely delete — usage scan failed on ${failedScans.length} table(s) (${list}). Reload and try again, or contact support.`,
        deleted: 0,
      };
    }

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

    // Fix 5: Audit log — record every bulk delete in admin_audit
    await logAdminAction(actor, {
      action: 'media.bulk_delete',
      targetType: 'storage',
      targetId: 'product-images',
      metadata: {
        filenames: filenames.slice(0, 50), // cap to keep the row reasonable
        count: filenames.length,
      },
    });

    return { ok: true, deleted: filenames.length };
  } catch (err) {
    reportError(err, { route: 'admin.media.bulk_delete', extras: { count: filenames.length } });
    return { ok: false, error: 'Unexpected error during delete', deleted: 0 };
  }
}
