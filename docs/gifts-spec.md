# Gifts Section — Technical Specification

> **Scope:** This document specifies the **Gifts** subsystem only. It is intentionally isolated from the existing Print catalog, pricing, and order processing flows. Shared code is limited to authentication, base cart state, and checkout payment. Everything else — product model, upload pipeline, production file generation, order records, admin UI — lives in its own namespace and tables.

---

## 1. System Overview

### 1.1 Purpose

Gifts are **personalised, one-off production items** that start from a customer-supplied photo or text. Unlike Print (which sells catalog SKUs at configured sizes), each Gifts order requires:

1. A **source asset** from the customer (photo, usually).
2. A **transformation step** that adapts the photo to the production method.
3. A **customer-safe preview** (low-res JPG, watermarked).
4. An **admin-only production file** (300 DPI, PDF wrapper) produced at submission.

### 1.2 Four Product Modes

| Mode | Transformation | Typical products | Output target |
|---|---|---|---|
| **Laser** | AI → high-contrast line/halftone art | Wood engraving, acrylic cut, metal plate | Laser engraver vector or 1-bit raster |
| **UV** | AI → colour-flattened artwork for UV print | UV-printed keychains, phone cases, mugs | CMYK raster at 300 DPI |
| **Embroidery** | AI → stitch-simulated posterised art | Caps, bags, patches | Indexed-colour PNG (≤ 15 colours) for digitiser |
| **Photo Resize** | No AI. Crop + bleed only. | Prints, photo gifts | CMYK raster at 300 DPI, with bleed |

Each mode has its own pipeline. The customer never picks a mode — it's a property of the product.

### 1.3 Architectural Isolation from Print

| Concern | Print | Gifts |
|---|---|---|
| Product table | `products` | `gift_products` |
| Order item row | `order_items` (no source file) | `gift_order_items` (source + preview + production refs) |
| Pricing | matrix + configurator formulas | flat or simple tiers, NO formulas |
| Admin editor | `product-editor.tsx` | `gift-product-editor.tsx` (separate) |
| Customer page | `product-page.tsx` | `gift-product-page.tsx` (separate) |
| Production artefact | none (buyer sends artwork separately) | PDF in storage, admin-only bucket |
| Realtime hooks | `orders` table | `gift_order_items` status updates |

The **cart** accepts both product types (they can check out together). Down-stream code discriminates on `line.kind === 'print' | 'gift'`.

---

## 2. User Flow (Customer)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │ 1. Customer lands on /gift/[category]/[slug]                    │
 └────────────────────────────────────────┬────────────────────────┘
                                          ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 2. Page branches by product.template_mode:                      │
 │    - none        → go straight to upload                        │
 │    - optional    → show template picker + "or upload your own"  │
 │    - required    → force template selection first               │
 └────────────────────────────────────────┬────────────────────────┘
                                          ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 3. Customer uploads photo (max 20 MB, JPG/PNG/HEIC/WebP).       │
 │    Client-side resizes to ≤ 3000 px long edge before upload.   │
 └────────────────────────────────────────┬────────────────────────┘
                                          ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 4. Pipeline runs on the server (by mode):                       │
 │    - Laser/UV/Embroidery → AI transform with admin prompt       │
 │    - Photo Resize         → interactive crop + bleed            │
 │    Customer sees a JPG preview at ≤ 1200 px long edge,          │
 │    watermarked "PREVIEW — PRINTVOLUTION".                       │
 └────────────────────────────────────────┬────────────────────────┘
                                          ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 5. Customer can "Regenerate" (consumes a generation quota per   │
 │    session) or "Continue" to confirm the preview.               │
 └────────────────────────────────────────┬────────────────────────┘
                                          ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 6. Customer approves → line added to cart. The cart line        │
 │    references gift_source_asset_id + gift_preview_id. The       │
 │    production artefact is NOT generated yet.                    │
 └────────────────────────────────────────┬────────────────────────┘
                                          ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 7. Checkout proceeds. On order placement, the server finalises: │
 │    - runs the 300 DPI production pipeline                        │
 │    - packages to PDF                                             │
 │    - writes to the private `gift-production` bucket              │
 │    - creates gift_order_item rows                                │
 │    - returns order number to customer                            │
 └────────────────────────────────────────┬────────────────────────┘
                                          ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 8. Customer receipt shows the JPG preview only. Any deep-link   │
 │    to the production file requires an admin session.            │
 └─────────────────────────────────────────────────────────────────┘
```

**Interactive corrections:**
- Upload errors (too small, wrong ratio, unrecognised format) surface inline with specific fixes.
- AI generation takes 5-20s; show a progress state with a clear "This is running, don't leave the page" message.
- Regeneration is capped at 3 per session per line to manage cost.

---

## 3. Product Mode Logic

### 3.1 Shared Pipeline Skeleton

```ts
// lib/gifts/pipeline.ts (pseudo)
interface PipelineInput {
  productId: string;                // loads the admin prompt + params
  sourceAssetId: string;            // customer-uploaded original
  templateId?: string | null;       // if a template was picked
  cropRect?: { x: number; y: number; w: number; h: number };  // Photo Resize only
}

interface PipelineOutput {
  previewJpgUrl: string;            // public bucket, ≤ 1200 px, watermarked
  productionAssetId: string;        // private bucket, 300 DPI
  productionPdfAssetId: string;     // private bucket, PDF wrap
  colorProfile: 'sRGB' | 'CMYK';
  widthPx: number;
  heightPx: number;
  dpi: number;
  meta: Record<string, unknown>;    // per-mode: stitch count, laser paths, etc
}
```

Entry points:
- `runPreviewPipeline(input)` → generates `previewJpgUrl` only. Called during the "upload → preview" flow.
- `runProductionPipeline(input)` → generates all production artefacts. Called at **order placement**, never before.

Running production deferred to order placement avoids paying for unordered generations.

### 3.2 Mode A — Laser

**Goal:** produce a high-contrast, 1-bit friendly image that laser engravers can cut or burn cleanly.

**Customer inputs:** photo only.

**Preview pipeline:**
1. Resize source to 1200 px long edge.
2. Send to AI (Replicate — `tencentarc/gfpgan` or a ControlNet model with admin's prompt) with the admin's prompt merged into a system template:
   ```
   {{ admin_prompt }}
   Output must be: black-and-white line art, high contrast, no mid-tones,
   suitable for laser engraving on {{ product.material }}.
   Target size: {{ product.width_mm }}×{{ product.height_mm }}mm.
   ```
3. Post-process (threshold at 50 %, minor despeckle).
4. Add preview watermark → store in `gift-previews`.

**Production pipeline (at checkout):**
1. Re-run AI at full resolution (3000 px long edge) with the same params.
2. Threshold to 1-bit.
3. Compute DPI so physical size matches `product.width_mm × height_mm` exactly.
4. Wrap in PDF using `pdf-lib` with a single full-bleed image object.
5. Save PNG + PDF to `gift-production`.

**Admin prompt fields** (stored on product):
- `ai_prompt` (free text)
- `ai_negative_prompt` (free text)
- `ai_threshold` (0-255, default 127)
- `ai_style_ref_url` (optional — a reference image embedded in the prompt)

### 3.3 Mode B — UV

**Goal:** produce a flat, high-saturation colour artwork ready for UV flatbed printing.

**Preview pipeline:**
1. Resize to 1200 px long edge.
2. AI call with admin prompt template:
   ```
   {{ admin_prompt }}
   Output: flat cel-shaded illustration, bold colours, no fine detail smaller
   than 1.5mm at the final print size ({{ product.width_mm }}×{{ product.height_mm }}mm).
   Solid colour regions preferred over gradients.
   ```
3. Watermark + store.

**Production:**
1. Full-res AI call.
2. Colour convert sRGB → Printvolution CMYK ICC profile (`assets/icc/printvolution-uv.icc`).
3. Resample to exactly 300 DPI for `product.width_mm × height_mm`.
4. Write TIFF (for archive) + PDF wrapper.

**Admin fields:**
- `ai_prompt`, `ai_negative_prompt`
- `cmyk_profile` (dropdown — defaults to shop profile)
- `saturation_boost` (-50..+50)

### 3.4 Mode C — Embroidery

**Goal:** posterised image with a bounded colour count, suitable handoff to a digitiser or direct to a stitch-simulation service.

**Preview:**
1. Resize to 1200 px.
2. AI → stylise to flat simplified art.
3. Quantise to N colours (admin configurable; default 8). Use k-means in Lab colour space, then snap to the nearest Madeira / Isacord thread palette.
4. Watermark + store.

**Production:**
1. Full-res AI.
2. Quantise identical palette.
3. Output PNG (indexed) + a colour-legend PDF page listing each thread code, number of instances, approximate stitch count estimate (`stitches ≈ area_cm² × density_factor`).

**Admin fields:**
- `ai_prompt`, `ai_negative_prompt`
- `thread_palette` (dropdown: Madeira Classic, Isacord, Robison-Anton)
- `max_colours` (2-15, default 8)
- `min_detail_mm` (default 1.2 — warns if features are thinner)

### 3.5 Mode D — Photo Resize (NO AI)

**Goal:** prepare a customer photo to exact production size with proper bleed.

**Customer UI:** a crop rectangle constrained to `product.width_mm : product.height_mm` aspect. Shows three overlaid rectangles:

```
┌─────────────────────────────────────┐
│           ███████████████           │   <- bleed area (2 mm outside the
│           ███████████████           │      trim, overlayed in pink @ 20%)
│           ███████████████           │
│           ███████████████           │
│     ┌───────────────────────┐       │   <- trim line (solid 1 px white)
│     │                       │       │
│     │    ░░░░░░░░░░░░░       │      │   <- safe area (3 mm inside trim,
│     │    ░ safe zone ░       │      │      dashed white line)
│     │    ░░░░░░░░░░░░░       │      │
│     └───────────────────────┘       │
│           ███████████████           │
└─────────────────────────────────────┘
```

- Drag to pan, scroll to zoom, two-finger pinch on mobile.
- Rotation (90° increments) via a rotate button.
- The customer's image MUST cover the full bleed rectangle — the UI prevents dragging past an edge that would leave white.
- Below the canvas: pixel resolution warning (`Your photo is 1840 px at trim size — OK`). Red warning if source isn't enough for 300 DPI.

**Preview pipeline:**
1. Apply `cropRect` to source at 1200 px.
2. Watermark.

**Production pipeline:**
1. Apply crop to full-resolution source.
2. Upsample or downsample to exact `width_mm × height_mm + 2 mm bleed` at 300 DPI.
3. Convert sRGB → CMYK.
4. Write TIFF + PDF (PDF has trim box and bleed box metadata set to match).

**Admin fields:**
- `bleed_mm` (default 2, adjustable per product)
- `safe_zone_mm` (default 3)
- `min_source_px` (below this, block upload with a clear message)

---

## 4. Template System

### 4.1 Concept

A **template** is a pre-designed base layout that the customer's photo gets dropped into. Examples:
- A keychain template with decorative borders
- A cap embroidery template with a placeholder logo area
- A photo-print template with captions

Templates are **per-product**, not global — a template belongs to one gift product (or a group via tags).

### 4.2 Admin Actions

| Action | Requires |
|---|---|
| Create | name, assigned product(s), base asset(s), placeholder zones |
| Edit | any field |
| Upload assets | foreground PNG (with transparency for photo zone), optional background, thumbnail |
| Assign to product | checkbox in product editor |
| Activate / deactivate | per-template toggle |
| Reorder | drag-handle (same pattern as mega-menu items) |

### 4.3 Placeholder Zones

Each template defines one or more **zones** where the customer photo lands:

```jsonc
{
  "zones": [
    {
      "id": "main",
      "label": "Main photo",
      "x_mm": 20,     // top-left from the template's coordinate space
      "y_mm": 15,
      "width_mm": 60,
      "height_mm": 80,
      "rotation_deg": 0,
      "mask_url": "/gift-templates/abc-mask.png"  // optional alpha mask
    }
  ]
}
```

The customer sees their photo constrained to the zone's aspect ratio, scrollable / zoomable within that zone only (reuses the Photo Resize cropper, scoped).

### 4.4 Template + Mode Interaction

A template flows through the same mode pipeline. Example:
- **UV product + template:** customer picks a UV template → uploads photo → AI transforms their photo → result is composited into the template's photo zone → final composite goes through the UV production pipeline.
- **Photo Resize product + template:** simple compose (crop + paste into zone + bleed).
- **Laser product + template:** AI runs on the photo, result is alpha-composited into the template's foreground (usually a laser-cut shape).

Templates cannot override the mode — they layer on top.

### 4.5 Template File Requirements

Each template stores these assets in the `gift-templates` bucket:
- `preview.jpg` — thumbnail for the customer picker (square, ≤ 400 px)
- `background.png` or `background.svg` — the art that sits behind the customer photo
- `foreground.png` — art that sits on top (masks, frames, text)
- `zones.json` — placeholder zone metadata
- `admin_notes.md` — optional instructions for the production team

All template files are public-readable (so the picker loads fast); the customer's rendered composite goes through the normal preview/production split.

---

## 5. Admin Dashboard Modules

All modules live under `/admin/gifts` — completely separate from `/admin/products`.

### 5.1 Gift Products

**List view** (`/admin/gifts`): thumbnail, name, mode badge, template count, active toggle, CRUD links. Filter by mode.

**Editor tabs** (`/admin/gifts/[id]`):

1. **Basics** — slug, name, category, description, active toggle, dimensions (`width_mm`, `height_mm`), pricing (flat or qty tiers — NO formulas), gallery images.
2. **Mode** — mode selector (radio: Laser / UV / Embroidery / Photo Resize). Mode is **locked after first order** (schema check) to preserve integrity of past production files.
3. **AI Settings** — only shown for Laser/UV/Embroidery. Fields per mode (§3). Includes a "Test" panel: upload a test photo, run the preview pipeline, see the output. Cached test results per prompt hash.
4. **Template Selection** — `template_mode` (none / optional / required) and the list of assigned templates with reorder handles.
5. **Production** — bleed, safe zone, colour profile, minimum source resolution, ICC profile override.
6. **SEO & Content** — reuses the existing product editor's SEO panel.

### 5.2 Templates

**List view** (`/admin/gifts/templates`): grid of thumbnails with status badges, sorted by assigned-product + display order.

**Editor** (`/admin/gifts/templates/[id]`):
- Name, description, active toggle
- Assigned products (multi-select)
- Uploads: thumbnail, background, foreground (with the crop tool for each)
- Zones editor: visual canvas showing the template with draggable rectangles for each zone. Save outputs the `zones.json`.
- Preview pane: show how a placeholder photo looks composited.

### 5.3 AI Prompt Library (optional, later)

`/admin/gifts/prompts` — a shared library of reusable prompt snippets that can be inserted into any product's prompt. Avoids admins re-typing the same instructions across similar products.

### 5.4 Order Dashboard (Gift-specific view)

Extends the existing `/admin/orders` with a **Gifts** filter. Each gift line item has:

- Source photo thumbnail (click → open in lightbox, admin-only)
- Template name (if any)
- Mode badge
- Preview JPG (what the customer saw)
- **Production file** download (PDF + raw artefact)
- Re-generate button (triggers production pipeline again — useful if the admin tweaks the prompt and wants to reprocess without making the customer re-upload)
- Production status: `pending | processing | ready | failed` with an error log
- Notes field (admin-only)
- Status transitions: Queued → In Production → Ready → Shipped

---

## 6. File Processing Workflow

### 6.1 Storage Buckets

| Bucket | Public? | Contents | Retention |
|---|---|---|---|
| `gift-sources` | **private** | Customer's original upload | 90 days after order fulfilment, then purge unless order kept as case study |
| `gift-previews` | **public (signed URL, 24 h)** | Low-res watermarked JPG | Same as sources |
| `gift-production` | **private** | 300 DPI TIFFs/PNGs + PDFs | Indefinite for audit |
| `gift-templates` | public | Template assets | Indefinite |

Signed URLs are generated on demand; no public URL is ever put on a production file.

### 6.2 Upload Path

1. Browser uses Supabase client with a **session-scoped JWT** to request an upload token for `gift-sources/{user_session}/{uuid}.{ext}`.
2. Upload hits storage directly (no server round-trip for the bytes).
3. Server action `registerGiftUpload({ path, contentType, size })` verifies, creates a `gift_source_assets` row and returns its id.

Max size: 20 MB. Accepted MIME: `image/jpeg|png|webp|heic|heif`.

### 6.3 Preview Generation

Runs on a background worker (Vercel cron or dedicated queue, NOT in the page render):

```
Source → resize to 1200 px → pipeline (mode) → add watermark → upload to gift-previews
```

The watermark is a diagonal repeating "PREVIEW — PRINTVOLUTION" in 30 % opacity at 40° rotation, large enough that screenshotting or cropping is impractical.

### 6.4 Production Generation

Triggered at the moment the order transitions to `paid` (or `pending_production` for manual-payment orders):

```
Source → full-res pipeline (mode) → CMYK convert if needed → wrap in PDF with trim+bleed boxes → upload to gift-production → update gift_order_items.production_ready = true
```

If the job fails, the item is marked `production_failed` and the admin sees the error in the dashboard. Customers are not notified — the admin decides whether to contact them or re-run.

### 6.5 Preventing Production Leakage

1. Production bucket is **private** — even with the URL, a direct request returns 403.
2. Signed URLs are generated only from server actions that check `profile.role in ('admin', 'staff')`.
3. Production files are never embedded in customer emails — only the JPG preview is linked.
4. The admin UI that shows the production file uses a short-lived signed URL (5 minutes).

---

## 7. Order Dashboard Structure

The existing orders table keeps its schema; gift-specific data lives in a related table.

```
orders
  ├── order_items        (existing — for Print)
  └── gift_order_items   (new — for Gifts)
         ├── source_asset (FK → gift_source_assets)
         ├── preview_asset (FK → gift_preview_assets)
         ├── production_asset (FK → gift_production_assets, nullable)
         ├── production_pdf (FK → gift_production_assets, nullable)
         ├── template_id (FK → gift_templates, nullable)
         ├── mode ('laser'|'uv'|'embroidery'|'photo-resize')
         ├── ai_prompt_snapshot (text — exact prompt at time of order)
         ├── crop_rect (jsonb — for photo-resize)
         ├── production_status ('pending'|'processing'|'ready'|'failed')
         └── production_error (text, nullable)
```

### 7.1 Admin Order View Additions

Above the standard order line items, a **Gifts** section appears when the order has gift items. For each gift item:

```
┌─────────────────────────────────────────────────────┐
│  [thumbnail]  UV Keychain — template "Hearts"       │
│               Status: Ready ✓   •   300dpi PDF ↓    │
│                                                     │
│  Source: IMG_2048.heic (3024×4032)          [view]  │
│  Preview (customer saw):                    [open]  │
│  Production PDF (300dpi):                   [↓]     │
│  Production TIFF (archive):                 [↓]     │
│  Admin notes: [_________________________]           │
│                                                     │
│  [Re-run production]  [Replace source]  [Remove]    │
└─────────────────────────────────────────────────────┘
```

The customer-facing order page only shows name, preview thumbnail, qty, price. No production links.

---

## 8. Output File Rules

| Artefact | Format | Resolution | Colour space | Audience | Watermark |
|---|---|---|---|---|---|
| Customer preview | JPG | ≤ 1200 px long edge | sRGB | Customer | **Yes** (diagonal) |
| Production raster (UV, Resize) | TIFF | 300 DPI at physical size | CMYK (product-specific ICC) | Admin | No |
| Production raster (Laser) | PNG 1-bit | 300 DPI | 1-bit | Admin | No |
| Production raster (Embroidery) | PNG indexed | 300 DPI | palette | Admin | No |
| Production wrapper | PDF/X-1a | — | matches raster | Admin | No |
| Source original | (whatever) | (whatever) | (whatever) | Admin only | No |

Customer emails, invoices, and the receipt page all reference the preview JPG only. Never the PDF.

---

## 9. Database Schema

```sql
-- Gift-specific product catalog — mirrors some fields of `products` but
-- stays separate so the two flows don't accidentally share logic.
create table gift_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category_id uuid references categories(id),
  description text,
  gallery_images text[] not null default '{}',
  width_mm numeric(6,2) not null,
  height_mm numeric(6,2) not null,
  bleed_mm numeric(4,2) not null default 2.0,
  safe_zone_mm numeric(4,2) not null default 3.0,
  min_source_px integer not null default 1200,
  mode text not null check (mode in ('laser','uv','embroidery','photo-resize')),
  template_mode text not null default 'none' check (template_mode in ('none','optional','required')),
  color_profile text,                  -- ICC path or key
  ai_prompt text,
  ai_negative_prompt text,
  ai_params jsonb default '{}',        -- threshold, saturation_boost, max_colours, etc
  base_price_cents integer not null default 0,
  price_tiers jsonb default '[]',      -- simple qty-tier array, no formulas
  is_active boolean not null default true,
  first_ordered_at timestamptz,        -- null until first order; after that, mode becomes immutable
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table gift_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  thumbnail_url text,
  background_url text,
  foreground_url text,
  zones_json jsonb not null default '[]',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table gift_product_templates (
  gift_product_id uuid references gift_products(id) on delete cascade,
  template_id uuid references gift_templates(id) on delete cascade,
  display_order integer not null default 0,
  primary key (gift_product_id, template_id)
);

-- Each physical asset (source, preview, production) is a row in this
-- unified table; role + path tell us which bucket + audience.
create table gift_assets (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('source','preview','production','production-pdf')),
  bucket text not null,                -- gift-sources / gift-previews / gift-production
  path text not null,                  -- key within the bucket
  mime_type text,
  width_px integer,
  height_px integer,
  size_bytes integer,
  dpi integer,
  created_at timestamptz default now()
);

create table gift_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  gift_product_id uuid references gift_products(id),
  template_id uuid references gift_templates(id),
  qty integer not null default 1,
  unit_price_cents integer not null,
  source_asset_id uuid references gift_assets(id),
  preview_asset_id uuid references gift_assets(id),
  production_asset_id uuid references gift_assets(id),
  production_pdf_id uuid references gift_assets(id),
  mode text not null,                  -- snapshot of product.mode at order time
  ai_prompt_snapshot text,             -- snapshot of product.ai_prompt at order time
  ai_params_snapshot jsonb,
  crop_rect jsonb,                     -- for photo-resize
  production_status text not null default 'pending'
    check (production_status in ('pending','processing','ready','failed')),
  production_error text,
  admin_notes text,
  created_at timestamptz default now()
);

create index on gift_order_items (order_id);
create index on gift_order_items (production_status) where production_status <> 'ready';
```

RLS: `gift_order_items` and `gift_assets` with role='production' are admin-only. `gift_assets` with role='preview' can be read via signed URL only (the storage bucket policy controls it).

---

## 10. Suggested API Endpoints (Server Actions / Route Handlers)

### Customer-facing

| Endpoint | Method | Purpose |
|---|---|---|
| `POST /api/gifts/upload-token` | POST | Returns a scoped Supabase upload URL for `gift-sources` |
| Server Action `registerGiftUpload` | — | Records the upload, returns `source_asset_id` |
| Server Action `generateGiftPreview` | — | Runs preview pipeline, returns `preview_url` (signed) |
| Server Action `addGiftLineToCart` | — | Adds the configured gift to the cart |
| Server Action `placeOrder` (shared) | — | Triggers production pipeline for gift items after payment |

### Admin-facing

| Endpoint | Method | Purpose |
|---|---|---|
| Server Action `createGiftProduct` | — | New product |
| Server Action `updateGiftProduct` | — | Edit fields (mode locked after first order) |
| Server Action `testGiftPreview` | — | Upload test photo + run with current prompt, returns preview |
| Server Action `createTemplate` / `updateTemplate` / `assignTemplate` | — | Template CRUD |
| Server Action `signGiftProductionUrl` | — | 5-minute signed URL for a production asset |
| Server Action `rerunProduction` | — | Reprocess one order line |
| Server Action `replaceGiftSource` | — | Admin uploads a corrected source on behalf of customer |

### Internal / Queue

| Worker | Trigger | Purpose |
|---|---|---|
| `preview-worker` | Insert to `gift_source_assets` | Generates and uploads preview |
| `production-worker` | Order transitions to `paid` | Generates production artefacts |

Workers are Vercel cron jobs polling a lightweight `gift_jobs` queue table, or a proper queue if you adopt one later.

---

## 11. Edge Cases / Validation Rules

### Upload

- **File too large (> 20 MB):** block with message and show the 20 MB limit.
- **Unsupported format** (SVG, PDF, GIF frame 2+): reject, explain accepted types.
- **Image too small for DPI requirement:** warn at upload; block checkout if the production pipeline cannot hit 300 DPI at the product's physical size. Show exactly what the customer needs: `"Your photo is 1200×800 px. For a 10×15 cm print we need at least 1772×1181. Please upload a larger photo."`
- **Corrupted image / zero dimensions:** server-side sanity check with `sharp`; reject with generic "Could not read this image" + let customer retry.
- **EXIF orientation:** always respect, strip on save.
- **HEIC/HEIF:** convert to JPEG on ingress so downstream tools don't break.
- **NSFW content / content policy:** run a classifier on the source before AI call. If flagged, block with "We can't process this photo — please contact us if you think this is a mistake."

### AI Pipeline

- **AI service down:** gracefully queue the preview job with a 5-minute retry; show the customer "Preparing your preview — we'll email you when it's ready" after 30 s.
- **AI produces gibberish (score threshold check):** retry once with a temperature bump; if still bad, fall back to the template or mark the order as `production_failed` with an admin alert.
- **Prompt changes after order placed:** the order uses `ai_prompt_snapshot` — the customer's production respects the prompt at the time they ordered. Changing the prompt later only affects new orders.

### Cropping (Photo Resize)

- **Crop leaves whitespace within bleed:** prevent by UI constraints.
- **Customer rotates a landscape photo into a portrait product:** allow, warn if the effective resolution drops below threshold.
- **Floating-point rounding on bleed:** round to nearest pixel at full res, not on the preview.

### Templates

- **Template removed after customer added to cart:** cart line retains a reference; admin sees a "template missing" warning; production falls back to photo-only composite.
- **Customer photo wrong aspect for template zone:** force zoom/pan within zone, identical to Photo Resize UX.
- **Template asset missing (background URL 404):** admin list shows broken-asset indicator; preview + production fail with a clear error (not a silent garbled output).

### Orders

- **Customer cancels before production:** production job cancels cleanly.
- **Production fails after payment:** line is flagged; admin is notified; refund workflow is manual (Gifts are low volume, enough).
- **Double submission:** server action is idempotent on `order_id + gift_order_item.id`.
- **Regeneration after placement:** admin-only. `rerunProduction` archives the previous production asset (not deleted — audit trail) and writes a new one.

### Abuse

- **Session-level generation cap:** max 3 preview regenerations per cart line per 15 min window (enforced in `rate_limits` table — already exists for login/checkout).
- **Cross-session replay:** preview URLs are signed, 24 h max.
- **Hotlinking from outside site:** preview bucket returns a short-lived URL only; production bucket blocks all non-admin access.

---

## 12. UX Recommendations

1. **Mode-aware copy.** Never show the word "AI" to customers for Laser/UV/Embroidery — use `"We'll stylise this for engraving"`, `"We'll prepare this for UV print"`. AI is an implementation detail.
2. **Progress feedback.** Show the preview generation as a 3-step progress bar: *Uploading → Transforming → Ready*. Each step has an illustrative micro-animation.
3. **Clear preview guarantee.** Under the preview: `"This is a low-res preview. The final printed piece will be at 300 DPI with true colours."` Makes the slight JPEG softness feel intentional.
4. **Template picker as a visual grid**, not a dropdown. Hover → brief description appears. Selected template is outlined in pink with a corner badge.
5. **Upload zone doubles as drop target**, with a large "Choose photo" button and fine-print hint about max size / recommended resolution.
6. **Mobile-first.** The HEIC/portrait/camera capture flow is critical — most gift buyers will be on a phone with recent photos.
7. **Regeneration affordance.** `"Not quite right? Try again"` (but show the counter: `"2 tries left"`).
8. **Cart line preview.** The cart item thumbnail uses the JPG preview (not the product stock photo) so the customer always sees what they designed.
9. **Production transparency in admin.** A small "hash tag" on each production file is shown — a short digest of the source + prompt + params — so if two orders produced different-looking outputs from identical inputs, the hash immediately reveals whether any input changed.
10. **Fail gracefully.** A failed AI call shouldn't be a red wall. It's a soft message: `"Our stylising service is taking a breather. We'll finish your preview in the background — continue browsing and we'll email it to you."`

---

## 13. Clear Separation Between Gifts and Print Logic

### 13.1 File / Module Boundaries

```
app/
├── (site)/
│   ├── product/           # PRINT — do not touch from Gifts
│   │   └── [category]/
│   │       └── [...slug]/
│   └── gift/              # GIFTS
│       └── [category]/
│           └── [slug]/
│
├── admin/
│   ├── products/          # PRINT admin
│   ├── gifts/             # GIFTS admin (this spec)
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   ├── templates/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   ├── prompts/       # optional library
│   │   └── actions.ts     # all gift-related server actions

components/
├── product/               # PRINT — untouched
├── gift/                  # GIFTS — new
│   ├── GiftProductPage.tsx
│   ├── GiftUploader.tsx
│   ├── GiftCropTool.tsx
│   ├── GiftTemplatePicker.tsx
│   ├── GiftPreviewCanvas.tsx
│   └── GiftCartLine.tsx
└── admin/
    ├── gift-product-editor.tsx
    ├── gift-template-editor.tsx
    └── gift-prompt-library.tsx

lib/
├── gifts/
│   ├── pipeline.ts          # orchestration
│   ├── pipelines/
│   │   ├── laser.ts
│   │   ├── uv.ts
│   │   ├── embroidery.ts
│   │   └── photo-resize.ts
│   ├── ai.ts                # replicate/openai wrapper
│   ├── watermark.ts
│   ├── pdf.ts               # pdf-lib wrapper
│   ├── cmyk.ts              # ICC conversion via sharp + lcms
│   └── storage.ts           # bucket-aware upload/download helpers
```

### 13.2 Non-Negotiable Rules

1. **Nothing in `lib/gifts/` imports from `lib/pricing.ts` or `lib/data/products.ts`.** Gifts has its own data layer.
2. **Cart items have a discriminator:** `kind: 'print' | 'gift'`. Rendering the cart picks the correct component.
3. **Checkout sums are unified** (one order total, one payment) but order items are split into `order_items` (print) and `gift_order_items` (gift) at insert time.
4. **Order status is per-line for gifts.** A gift line can be `production_failed` while a print line is `ready`. The order's overall status reflects the worst of its items.
5. **No cross-linking from admin Print editor to gift products or vice versa.** A gift category-filter in `/admin/orders` surfaces gift items, but the editors never cross.

### 13.3 Failure Mode Isolation

If the AI service goes down:
- Print ordering is **unaffected** (no shared code path).
- Gift uploads queue up but customers see an honest "preparing your preview" state.
- Admin dashboard keeps working; failed gift items are visible and re-runnable.

---

## Appendix A — Recommended Third-Party Services

| Concern | Recommendation | Notes |
|---|---|---|
| AI image transforms | **Replicate.com** (per-call billing) | `replicate_tool` suite fits naturally; each mode maps to a specific model. |
| HEIC → JPEG | `sharp` with `heif-convert` (WASM) | Done on server side at ingress. |
| CMYK / ICC conversion | `sharp` + `lcms2` native binding OR `ImageMagick` shell | Sharp doesn't do CMYK natively; `lcms` is the reference library. |
| PDF wrapping | `pdf-lib` | Supports trim boxes, bleed boxes, embedded profiles. |
| Content classifier | Replicate: nudity/NSFW classifier before AI call | Cheap, keeps you out of policy disputes. |
| Queue / worker | Vercel cron (simple) OR **Upstash QStash** (robust) | Start with cron, move to QStash when volume justifies it. |

## Appendix B — MVP Cut-Line

To ship a working Gifts flow faster, these can be v2:
- AI Prompt Library (§5.3)
- Embroidery stitch-count estimator
- ICC profile per product (start with one shop-wide profile)
- HEIC support (ask customers to convert)
- Regeneration counter (start unlimited with monitoring, add cap when abuse appears)

What **cannot** be cut from v1 without breaking the premise:
- Separation from Print (§13)
- Private production bucket + signed URLs (§6.5)
- Watermarked preview (§8)
- PDF production wrapper (§3, §6)
- Order-time production (not upload-time) (§2, §6.4)
