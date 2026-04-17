// Pure types + static defaults — no server-only imports, so this file is
// safe to consume from client components.

export type ProductFeature = {
  icon_url: string | null;
  emoji: string | null;
  title: string;
  desc: string;
};

export type SiteSettings = {
  logo_url: string | null;
  logo_width_px: number | null;
  favicon_url: string | null;
  brand_text: string;
  product_features: ProductFeature[];
};

export const DEFAULT_PRODUCT_FEATURES: ProductFeature[] = [
  { icon_url: null, emoji: '✓', title: 'Pre-press file check', desc: 'We inspect every file before it hits the printer.' },
  { icon_url: null, emoji: '🖼', title: 'Digital mockup', desc: 'Preview your design before we produce it.' },
  { icon_url: null, emoji: '🚚', title: 'Island-wide delivery', desc: 'Or free pickup at Paya Lebar Square.' },
  { icon_url: null, emoji: '⚡', title: 'Express available', desc: '24-hour turnaround for rush jobs — ask us.' },
];
