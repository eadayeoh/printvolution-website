export type GiftMode = 'laser' | 'uv' | 'embroidery' | 'photo-resize';
export type GiftTemplateMode = 'none' | 'optional' | 'required';
export type GiftAssetRole = 'source' | 'preview' | 'production' | 'production-pdf';
export type GiftProductionStatus = 'pending' | 'processing' | 'ready' | 'failed';

export const GIFT_MODE_LABEL: Record<GiftMode, string> = {
  'laser': 'Laser',
  'uv': 'UV Print',
  'embroidery': 'Embroidery',
  'photo-resize': 'Photo Resize',
};

export const GIFT_MODE_DESCRIPTION: Record<GiftMode, string> = {
  'laser': 'AI-stylises the photo for laser engraving (high contrast, line-art output).',
  'uv': 'AI-stylises the photo for UV flatbed printing (flat, saturated colours).',
  'embroidery': 'AI-stylises + posterises the photo for embroidery (limited colour palette).',
  'photo-resize': 'No AI. Customer crops to exact dimensions; system adds bleed automatically.',
};

export type GiftPriceTier = {
  qty: number;
  price_cents: number;
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
  mode: GiftMode;
  template_mode: GiftTemplateMode;
  ai_prompt: string | null;
  ai_negative_prompt: string | null;
  ai_params: Record<string, unknown>;
  color_profile: string | null;
  base_price_cents: number;
  price_tiers: GiftPriceTier[];
  seo_title: string | null;
  seo_desc: string | null;
  is_active: boolean;
  first_ordered_at: string | null;
  created_at: string;
  updated_at: string;
  // Mockup — product shot that the transformed design is composited onto
  mockup_url?: string | null;
  mockup_area?: { x: number; y: number; width: number; height: number } | null;
};

export type GiftTemplateZoneBase = {
  id: string;
  label: string;
  x_mm: number;
  y_mm: number;
  width_mm: number;
  height_mm: number;
  rotation_deg?: number;
};

export type GiftTemplateImageZone = GiftTemplateZoneBase & {
  type?: 'image';
  mask_url?: string | null;
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

export type GiftTemplateZone = GiftTemplateImageZone | GiftTemplateTextZone;

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
