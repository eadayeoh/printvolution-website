/**
 * Brand colour + metadata constants — the single source of truth for
 * anywhere we can't use Tailwind classes or CSS variables (email HTML,
 * server-generated JSON-LD, inline server styles, etc.).
 *
 * For client-side styling prefer the Tailwind classes `bg-pink`,
 * `text-pink`, `bg-ink`, etc. defined in tailwind.config.ts — those
 * compile to the same hex values. Use these constants only where a
 * string literal is the right shape.
 */

export const BRAND = {
  pink: '#E91E8C',        // primary
  pinkDark: '#C4157A',    // hover / pressed
  pinkLight: '#FFE4F1',   // backgrounds / chips
  ink: '#0a0a0a',         // near-black copy + dark panels
  cream: '#FBF7F1',       // page background
  whatsapp: '#25D366',    // WhatsApp brand
  addToCart: '#FF6B1A',   // primary commerce CTA
  success: '#16a34a',     // confirmation states
} as const;

export const BRAND_CMYK = {
  cyan: '#00B8D9',
  magenta: BRAND.pink,
  yellow: '#FFD100',
  key: BRAND.ink,
} as const;

export const SITE = {
  name: 'Printvolution',
  legalName: 'Printvolution Pte Ltd',
  url: 'https://printvolution.sg',
  whatsappE164: '6585533497',
  whatsappDisplay: '+65 8553 3497',
  address: '60 Paya Lebar Road #B1-35, S409051',
} as const;
