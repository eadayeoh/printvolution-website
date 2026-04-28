/** What kind of customer input a gift product accepts.
 *  - photo → upload a photo (existing behaviour)
 *  - text  → engrave a short string, no upload (necklaces, keychains, etc.)
 *  - both  → either; reserved for future, UI currently treats as 'photo'. */
export type GiftInputMode = 'photo' | 'text' | 'both';

/** Processing-mode slug. Was a strict union of the original 7 modes;
 *  now `string` because admins can add custom modes via /admin/gifts/modes
 *  without a code change. Existing switch/lookup sites either fall back
 *  to a default branch or use `GIFT_MODE_LABEL[slug] ?? slug`. */
export type GiftMode = string;

/** The original baseline mode slugs. Used by code paths that have
 *  hard-coded handling (AI prompt switches, pipeline classification). */
export const WELL_KNOWN_GIFT_MODES = [
  'laser', 'uv', 'embroidery', 'photo-resize', 'eco-solvent', 'digital', 'uv-dtf',
] as const;
export type WellKnownGiftMode = (typeof WELL_KNOWN_GIFT_MODES)[number];
export type GiftTemplateMode = 'none' | 'optional' | 'required';
export type GiftAssetRole = 'source' | 'preview' | 'production' | 'production-pdf';
export type GiftProductionStatus = 'pending' | 'processing' | 'ready' | 'failed';

// Fallback labels/descriptions used when the gift_modes metadata table
// is unavailable. Admin can override every row at /admin/gifts/modes,
// and may also add new mode slugs that aren't in this baseline record.
// Lookups should always fall back to the slug itself: `LABEL[m] ?? m`.
export const GIFT_MODE_LABEL: Record<string, string> = {
  'laser': 'Laser Engraving',
  'uv': 'UV Printing',
  'embroidery': 'Embroidery',
  'photo-resize': 'Photo Resize',
  'eco-solvent': 'Eco Solvent',
  'digital': 'Digital Printing',
  'uv-dtf': 'UV DTF',
};

/** Resolve a mode slug to a human label, falling back to the slug itself
 *  for custom modes added via /admin/gifts/modes that aren't in the
 *  baseline record. */
export function giftModeLabel(slug: string): string {
  return GIFT_MODE_LABEL[slug] ?? slug;
}

export const GIFT_MODE_DESCRIPTION: Record<string, string> = {
  'laser': 'AI-stylises the photo for laser engraving (high contrast, line-art output).',
  'uv': 'AI-stylises the photo for UV flatbed printing (flat, saturated colours).',
  'embroidery': 'AI-stylises + posterises the photo for embroidery (limited colour palette).',
  'photo-resize': 'No AI. Customer crops to exact dimensions; system adds bleed automatically.',
  'eco-solvent': 'Large-format eco-solvent printing on banner vinyl, poster paper, and adhesive rolls.',
  'digital': 'High-resolution digital press — paper, card, sticker rolls. No AI transform.',
  'uv-dtf': 'UV DTF transfer film for curved and irregular surfaces. Customer uploads artwork.',
};

export type GiftPriceTier = {
  qty: number;
  price_cents: number;
};

export type GiftSize = {
  slug: string;
  name: string;
  width_mm: number;
  height_mm: number;
  /** Added on top of the selected variant's base price. A product with
   *  a single baseline size typically has delta = 0. */
  price_delta_cents: number;
  display_order: number;
};

export type GiftProduct = {
  id: string;
  slug: string;
  name: string;
  category_id: string | null;
  description: string | null;
  tagline: string | null;
  gallery_images: string[];
  thumbnail_url: string | null;
  width_mm: number;
  height_mm: number;
  bleed_mm: number;
  safe_zone_mm: number;
  min_source_px: number;
  /** Optional cap on the customer-facing live-preview shell width (px).
   *  NULL = auto (parent column width / 480 px renderer fallback).
   *  Migration 0081. */
  preview_max_width_px?: number | null;
  /** Processing mode slug — must match an active row in gift_modes.
   *  Typed as string (not the GiftMode union) since admins can add
   *  custom modes via /admin/gifts/modes without a code change. */
  mode: string;
  /** Optional second production method — products like acrylic wall
   *  art can mix e.g. UV-printed photo panel + laser-engraved border.
   *  Null = single-mode product (the common case). When set, templates
   *  and variant surfaces can pick between {mode, secondary_mode}. */
  secondary_mode?: string | null;
  template_mode: GiftTemplateMode;
  ai_prompt: string | null;
  ai_negative_prompt: string | null;
  ai_params: Record<string, unknown>;
  color_profile: string | null;
  /** Business-day turnaround from order placed to ready. Drives the
   *  "Ready by" calendar card on the customer-facing product page. */
  lead_time_days: number;
  /** Google-Fonts family names the customer can pick from when adding
   *  text to this product. Empty = no font picker. */
  allowed_fonts: string[];
  base_price_cents: number;
  price_tiers: GiftPriceTier[];
  /** Size options for this product. Applies uniformly across every
   *  variant (mockup tile). Empty = the product has a single implicit
   *  size (width_mm × height_mm on the product row itself). */
  sizes: GiftSize[];
  seo_title: string | null;
  seo_desc: string | null;
  is_active: boolean;
  first_ordered_at: string | null;
  created_at: string;
  updated_at: string;
  // Mockup — product shot that the transformed design is composited onto
  mockup_url?: string | null;
  mockup_area?: { x: number; y: number; width: number; height: number } | null;
  /** Admin override for the legacy "Add text" step on the customer PDP.
   *  NULL = use the mode-based default (laser/uv → on, others → off).
   *  TRUE/FALSE wins over the default. */
  show_text_step?: boolean | null;
  /** Optional list of simple text-input fields shown on the PDP without
   *  needing a zones-based template. Useful for jewellery and similar
   *  products that just need to capture a couple of strings cleanly
   *  ("Front engraving" + "Back engraving" etc). Cart notes serialise
   *  as `text_<id>:<value>`. Empty / undefined = no extra fields. */
  extra_text_zones?: Array<{ id: string; label: string; max_chars?: number | null }> | null;
  // Admin-authored content overrides. NULL = use mode-based default.
  seo_body?: string | null;
  seo_magazine?: unknown;
  faqs?: Array<{ question: string; answer: string }> | null;
  occasions?: Array<{ icon: string; title: string; tip: string; suggested?: string }> | null;
  process_steps?: Array<{ title: string; time: string; desc: string }> | null;
  /** NULL / empty = picker disabled. */
  shape_options?: import('./shape-options').ShapeOption[] | null;
  /** NULL / empty = feature disabled. */
  figurine_options?: Array<{
    slug: string;
    name: string;
    image_url: string;
    price_delta_cents?: number;
  }> | null;
  figurine_area?: { x: number; y: number; width: number; height: number } | null;
  // Migration 0035 additions
  pipeline_id?: string | null;
  /** Override for the SECONDARY mode's pipeline. Paired with
   *  `secondary_mode`; ignored when that's null. See migration 0047. */
  secondary_pipeline_id?: string | null;
  source_retention_days?: number;
  // Migration 0043 — photo upload vs text engraving vs both.
  input_mode?: GiftInputMode;
  /** Optional curated allowlist of gift_prompts.id values. When
   *  non-empty, the customer's art-style picker is restricted to
   *  these prompts only. When null or empty, fall back to the
   *  mode + pipeline filtering in listPromptsForProduct. */
  prompt_ids?: string[] | null;
};

export type GiftTemplateZoneBase = {
  id: string;
  label: string;
  x_mm: number;
  y_mm: number;
  width_mm: number;
  height_mm: number;
  rotation_deg?: number;
  /** When true the zone is not draggable/resizable in the editor.
   *  Customer-facing render ignores this — locking is editor-only. */
  locked?: boolean;
  /** Production method for THIS zone. Overrides the product's mode
   *  when set. A template with 2 distinct modes across its zones is a
   *  "dual-mode template" and fans out to 2 production files (one per
   *  mode). Null → inherit the product's primary mode. Validated at
   *  assignment time: must be in {product.mode, product.secondary_mode}. */
  mode?: GiftMode | null;
};

/** Built-in alpha-mask shapes for an image zone. The customer's
 *  photo is clipped to this silhouette in both the live preview and
 *  the server composite. Independent of `mask_url` (which is a
 *  legacy frame-overlay PNG used by hand-authored templates). */
export type GiftImageZoneMaskPreset = 'circle' | 'heart' | 'star';

export type GiftTemplateImageZone = GiftTemplateZoneBase & {
  type?: 'image';
  mask_url?: string | null;
  mask_preset?: GiftImageZoneMaskPreset | null;
  fit_mode?: 'cover' | 'contain' | 'fill';
  bg_color?: string | null;
  border_radius_mm?: number;
  allow_rotate?: boolean;
  allow_zoom?: boolean;
  default_image_url?: string | null;
};

export type GiftTemplateTextZone = GiftTemplateZoneBase & {
  type: 'text';
  default_text?: string;
  placeholder?: string;
  font_family?: string;
  font_size_mm?: number;
  font_weight?: '300' | '400' | '600' | '700' | '800' | '900';
  font_style?: 'normal' | 'italic';
  color?: string;
  align?: 'left' | 'center' | 'right';
  vertical_align?: 'top' | 'middle' | 'bottom';
  max_chars?: number | null;
  editable?: boolean;
  text_transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  line_height?: number;
  letter_spacing_em?: number;
};

/** Customer picks a month + year + a single highlighted day. The
 *  template engine renders the month grid (weekday row + 6×7 day
 *  cells); the picked day gets a coloured shape behind its number.
 *  Reusable: any product's template can include a calendar zone. */
export type GiftTemplateCalendarZone = GiftTemplateZoneBase & {
  type: 'calendar';

  // "October 2024" header. Layout: above the grid, to the left of it,
  // or hidden (admin can use a separate text zone for fancy
  // typography).
  header_layout?: 'above' | 'left' | 'hidden';
  header_font_family?: string;
  header_font_size_mm?: number;
  header_font_weight?: '300' | '400' | '600' | '700' | '800' | '900';
  header_color?: string;

  // Day grid — weekday row + day cells.
  grid_font_family?: string;
  grid_font_size_mm?: number;
  grid_color?: string;
  week_start?: 'sunday' | 'monday';

  // Highlighted-day treatment. The customer-picked day gets the shape
  // drawn behind its number; everything else stays plain.
  highlight_shape?: 'circle' | 'square' | 'heart';
  highlight_fill?: string;
  highlight_text_color?: string;

  // What customers see before they pick. Null falls back to the
  // current month / no highlight at render time.
  default_month?: number | null;       // 1–12
  default_year?: number | null;        // YYYY
  default_highlighted_day?: number | null; // 1–31
};

/** A code-driven region inside a renderer template (city_map / star_map).
 *  Content is generated by the renderer (e.g. the projected sky disk on a
 *  star map) — admins can't edit what's drawn inside the box, but they CAN
 *  drag the box to reposition / resize the region on the canvas. The
 *  renderer reads anchor_kind to know which region this rectangle defines.
 *
 *  Distinct from image / text / calendar zones: those are customer-fed
 *  content slots; render_anchor is purely a layout primitive that hands
 *  the renderer a target rectangle. */
export type GiftTemplateRenderAnchorZone = GiftTemplateZoneBase & {
  type: 'render_anchor';
  /** Renderer-specific identifier. The star_map renderer recognises
   *  'star_disk' (sky disk). The city_map renderer recognises
   *  'city_disk' (square map area). Other anchor_kind values are
   *  ignored by the renderer and fall back to its hardcoded defaults. */
  anchor_kind: string;
  /** Friendly admin label shown on the editor handle. */
  label: string;
};

export type GiftTemplateZone =
  | GiftTemplateImageZone
  | GiftTemplateTextZone
  | GiftTemplateCalendarZone
  | GiftTemplateRenderAnchorZone;

export const GIFT_FONT_FAMILIES: Array<{ value: string; label: string; stack: string }> = [
  { value: 'inter', label: 'Inter (sans)', stack: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { value: 'fraunces', label: 'Fraunces (serif)', stack: 'Fraunces, Georgia, serif' },
  { value: 'cormorant', label: 'Cormorant (serif italic)', stack: '"Cormorant Garamond", Georgia, serif' },
  { value: 'playfair', label: 'Playfair (display)', stack: '"Playfair Display", Georgia, serif' },
  { value: 'caveat', label: 'Caveat (handwritten)', stack: 'Caveat, cursive' },
  { value: 'bebas', label: 'Bebas Neue (condensed)', stack: '"Bebas Neue", Impact, sans-serif' },
  { value: 'mono', label: 'JetBrains Mono', stack: '"JetBrains Mono", ui-monospace, monospace' },
];

export function giftFontStack(value: string | undefined): string {
  return GIFT_FONT_FAMILIES.find((f) => f.value === value)?.stack ?? GIFT_FONT_FAMILIES[0].stack;
}

export type GiftTemplate = {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  background_url: string | null;
  foreground_url: string | null;
  zones_json: GiftTemplateZone[];
  display_order: number;
  is_active: boolean;
  reference_width_mm: number | null;
  reference_height_mm: number | null;
  /** Admin-assigned grouping label ("Wall art", "Necklaces", …).
   *  Null = "Ungrouped". Drives the buckets in the templates list. */
  group_name?: string | null;
  /** When true, customer sees colour pickers in the "Fill the
   *  template" form (Theme color + per-text-zone + per-calendar-zone).
   *  Default false — admin opts in per template. */
  customer_can_recolor?: boolean;
  /** When true, customer sees a font-family dropdown next to each
   *  text zone. Default false — admin opts in per template. */
  customer_can_change_font?: boolean;
  /** Routes the template to a renderer:
   *   • 'zones'       — standard multi-slot form (default).
   *   • 'song_lyrics' — SongLyricsTemplate React component (spiral lyrics
   *                     around photo + title/names/year footer).
   *   • 'city_map'    — CityMapTemplate (OSM-derived foil city map).
   *   • 'star_map'    — StarMapTemplate (sky chart for date+location;
   *                     foil or poster layout).
   *
   *  Renderer-driven templates bypass zones_json entirely; the
   *  customer's inputs are defined by the renderer's React component
   *  on the product page (CityMapInputs / StarMapInputs / SongLyricsInputs).
   */
  renderer?: 'zones' | 'song_lyrics' | 'city_map' | 'star_map' | 'spotify_plaque';
  /** Per-template customer colour picker (migration 0079). Overrides
   *  variant.colour_swatches when customer_swatches is non-empty.
   *
   *    'none' | null   — no picker for this template
   *    'mockup_swap'   — pick swaps the displayed photo (uses .mockup_url)
   *    'foil_overlay'  — pick retints the renderer foil (uses .hex)
   *
   *  Lets one product carry multiple templates with DIFFERENT swatch
   *  sets — e.g. Template A: Red/Blue/Green for mockup-swap; Template B:
   *  Gold/Rose Gold/Silver for foil overlay. */
  customer_picker_role?: 'none' | 'mockup_swap' | 'foil_overlay' | null;
  customer_swatches?: Array<{ name: string; hex: string; mockup_url?: string }>;
  /** Optional production mode this template forces on the order line,
   *  overriding gift_products.mode. NULL = inherit. Used when one product
   *  hosts multiple physical SKUs (e.g. foil vs poster) selectable via
   *  the customer template picker. Free-form string — must match a
   *  gift_modes.slug (no DB FK; gift_modes is admin-extendable per
   *  migration 0072). Migration 0080. */
  mode_override?: string | null;
};

export type GiftCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Minimum price display helper (used in cards / nav) */
export function giftFromPrice(p: Pick<GiftProduct, 'base_price_cents' | 'price_tiers'>): number {
  let min = p.base_price_cents;
  for (const t of p.price_tiers ?? []) {
    if (typeof t.price_cents === 'number' && (min === 0 || t.price_cents < min)) min = t.price_cents;
  }
  return min;
}

/** Unit price at a given quantity. Walks the tier ladder and returns
 *  the price_cents from the highest tier whose qty ≤ requested. Below
 *  the first tier — base_price_cents. Tiers are stored as
 *  {qty, price_cents} where qty is "from this quantity onwards". */
export function giftUnitPrice(
  base_price_cents: number,
  tiers: GiftPriceTier[] | null | undefined,
  qty: number,
): number {
  let unit = base_price_cents;
  let bestQty = 0;
  for (const t of tiers ?? []) {
    if (typeof t.qty === 'number' && typeof t.price_cents === 'number'
      && t.qty <= qty && t.qty > bestQty) {
      bestQty = t.qty;
      unit = t.price_cents;
    }
  }
  return unit;
}

// ---------------------------------------------------------------------------
// Pipelines (migration 0033) + product/prompt extensions (migration 0035)
// ---------------------------------------------------------------------------

export type GiftPipelineKind = GiftMode;

export type GiftPipelineProvider = 'passthrough' | 'replicate' | 'openai';

export type GiftPipeline = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: GiftPipelineKind;
  provider: GiftPipelineProvider;
  ai_endpoint_url: string | null;
  ai_model_slug: string | null;
  default_params: Record<string, unknown>;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type GiftStyle = 'line-art' | 'realistic';

export const GIFT_STYLE_LABEL: Record<GiftStyle, string> = {
  'line-art': 'Line Art',
  'realistic': 'Realistic',
};

// ---------------------------------------------------------------------------
// Variants (migration 0034) — per-product physical bases
// ---------------------------------------------------------------------------

export type GiftVariantKind = 'base' | 'size' | 'colour' | 'material';

export const GIFT_VARIANT_KIND_LABEL: Record<GiftVariantKind, string> = {
  base:     'Base',
  size:     'Size',
  colour:   'Colour',
  material: 'Material',
};

export const GIFT_VARIANT_PICKER_LABEL: Record<GiftVariantKind, string> = {
  base:     'Choose a base',
  size:     'Choose a size',
  colour:   'Choose a colour',
  material: 'Choose a material',
};

export type GiftVariantColourSwatch = {
  name: string;
  hex: string;
  mockup_url: string;
};

/** One engravable / printable face of a variant. 3D bar keychains have
 *  four of these (front / back / left / right); a plain necklace has
 *  one or — when surfaces is empty — zero (falls back to the variant's
 *  own mockup_url + mockup_area). */
export type GiftVariantSurface = {
  /** Stable key used in cart payload + admin. e.g. 'front'. */
  id: string;
  /** Customer-facing label. e.g. 'Front'. */
  label: string;
  /** What input this surface accepts. Overrides the parent's input_mode. */
  accepts: GiftInputMode;
  /** Photo of THIS face, with mockup_area marking the engraving zone. */
  mockup_url: string;
  mockup_area: { x: number; y: number; width: number; height: number };
  /** Text-surface character cap (ignored for photo surfaces). */
  max_chars?: number | null;
  /** Optional default engraving-text style for this surface. */
  font_family?: string | null;
  font_size_pct?: number | null;
  color?: string | null;
  /** Production method for THIS face. Overrides the parent product's
   *  `mode` when set. Lets a single variant mix methods — e.g. the front
   *  of an acrylic wall art is UV-printed, the border text is laser
   *  engraved — or split the parent catalogue into method-choice
   *  variants like "Laser-engraved figurine" vs "UV-printed figurine"
   *  under one parent. Null → inherit the parent's mode. */
  mode?: string | null;
  /** Per-surface upcharge in cents. Added to the unit price for every
   *  surface the customer fills (text typed or photo uploaded), on top
   *  of the variant's base_price. Missing/0 → no surcharge. Stored as
   *  cents to match base_price_cents and the rest of the pricing
   *  surface; admin UI shows it as S$. */
  price_delta_cents?: number;
};

export type GiftProductVariant = {
  id: string;
  gift_product_id: string;
  slug: string;
  name: string;
  features: string[];
  mockup_url: string;
  mockup_area: { x: number; y: number; width: number; height: number };
  /** Outer box (as % of mockup image) inside which the customer can
   *  drag/resize their design. mockup_area starts inside this. Null →
   *  customer cannot adjust position on this variant. */
  mockup_bounds: { x: number; y: number; width: number; height: number } | null;
  variant_thumbnail_url: string | null;
  base_price_cents: number;
  price_tiers: GiftPriceTier[];
  display_order: number;
  is_active: boolean;
  variant_kind: GiftVariantKind;
  /** Print width override (mm) for size variants. Null → fallback to gift_products.width_mm. */
  width_mm: number | null;
  /** Print height override (mm) for size variants. */
  height_mm: number | null;
  /** Optional nested colour choices. When non-empty the customer-facing
   *  grid renders a swatch row under the tile; clicking a swatch swaps
   *  the shown mockup and records the chosen colour in the cart. */
  colour_swatches: GiftVariantColourSwatch[];
  /** Per-face customisation. Empty → single-surface fallback using
   *  this variant's mockup_url + mockup_area + parent input_mode. */
  surfaces: GiftVariantSurface[];
  /** Per-shape mockup override. Missing key falls back to the
   *  variant's base `mockup_url` + `mockup_area`. */
  mockup_by_shape?: Partial<Record<
    import('./shape-options').ShapeKind,
    MockupOverride
  >> | null;
  /** Per-prompt mockup override keyed by prompt UUID. Missing key
   *  falls back to mockup_by_shape / variant.mockup_url. */
  mockup_by_prompt_id?: Record<string, MockupOverride> | null;
  /** When true the area rectangle is locked and the customer pans
   *  the photo inside it. Used when the panel slot has a fixed
   *  position on the mockup (e.g. Figurine Photo Frame). */
  photo_pan_mode?: boolean;
  /** Per-variant overrides keyed by `gift_products.sizes[].slug`. Each
   *  entry can flip `available: false` to hide that size when the
   *  customer picks this variant, and/or override the product-level
   *  `price_delta_cents` for that variant × size combo. Missing key =
   *  inherit product defaults. Empty object = all defaults. */
  size_overrides?: Record<string, { available?: boolean; price_delta_cents?: number }>;
  /** Material / background colour behind the foil for renderer-driven
   *  products (city_map / star_map / song_lyrics). Hex string. Null =
   *  fall back to the renderer's hardcoded default per layout
   *  (#1a2740 navy for foil, #ffffff white for poster). */
  material_color?: string | null;
};

export type MockupArea = { x: number; y: number; width: number; height: number };
export type MockupOverride = { url: string; area: MockupArea };

/** Minimum price display for a variant (parallels giftFromPrice). */
export function variantFromPrice(v: Pick<GiftProductVariant, 'base_price_cents' | 'price_tiers'>): number {
  let min = v.base_price_cents;
  for (const t of v.price_tiers ?? []) {
    if (typeof t.price_cents === 'number' && (min === 0 || t.price_cents < min)) min = t.price_cents;
  }
  return min;
}

/** Display name for a gift order item — snapshot first (frozen at
 *  order time), then current product name, then a generic fallback. */
export function giftItemDisplayName(item: {
  product_name_snapshot?: string | null;
  gift_product?: { name?: string | null } | null;
}): string {
  return item.product_name_snapshot ?? item.gift_product?.name ?? 'Gift';
}
