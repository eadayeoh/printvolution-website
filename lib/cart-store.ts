'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** One face of a surfaces-driven gift line item. Mirrors the shape of
 *  gift_order_item_surfaces that checkout will write. Mode is now a
 *  free string (admins can add custom modes via /admin/gifts/modes);
 *  checkout validates against the live gift_modes table. */
export type CartItemSurface = {
  id: string;                // matches surface.id on the variant
  label: string;             // 'Front' — for admin + cart display
  text?: string;             // text-surface content
  source_asset_id?: string;  // photo-surface asset (pre-uploaded on add to cart)
  mode: string;
};

export type CartItem = {
  id: string;             // local ID (ci_<timestamp>)
  product_slug: string;
  product_name: string;
  icon: string | null;
  config: Record<string, string>;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  personalisation_notes?: string;
  gift_image_url?: string;
  /** Per-surface fill data. Present only when the variant uses
   *  surfaces[]; checkout fans out into gift_order_item_surfaces rows
   *  and the pipeline produces one file per entry. */
  surfaces?: CartItemSurface[];
  /** Gift variant id (uuid) picked at Add-to-Cart. Needed at checkout
   *  so we can join to the variant row for price / mockup / dimensions
   *  / surface config even if the parent product changes later. */
  gift_variant_id?: string;
  /** Customer-picked shape from the product's shape_options (migration
   *  0056). NULL / undefined = product has no shape picker — production
   *  pipeline treats it as rectangle-equivalent. */
  shape_kind?: 'cutout' | 'rectangle' | 'template' | null;
  /** Only set when shape_kind === 'template'. Picks which gift_template
   *  row the laser composites into at fan-out time. */
  shape_template_id?: string | null;
  /** Migration 0060 — picked figurine slug (from product.figurine_options).
   *  NULL when the product has no figurine picker. */
  figurine_slug?: string | null;
};

type CartState = {
  items: CartItem[];
  lastUpdated: number | null;
  add: (item: Omit<CartItem, 'id'>) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotalCents: () => number;
  count: () => number;
};

// Cart auto-clears after 7 days of inactivity. Every mutation bumps
// `lastUpdated`; on rehydrate, we wipe if the timestamp is too old.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lastUpdated: null,
      add: (item) => {
        const id = `ci_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({ items: [...s.items, { ...item, id }], lastUpdated: Date.now() }));
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id), lastUpdated: Date.now() })),
      updateQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            const unit = i.qty > 0 ? i.line_total_cents / i.qty : i.unit_price_cents;
            return { ...i, qty, line_total_cents: Math.round(unit * qty) };
          }),
          lastUpdated: Date.now(),
        })),
      clear: () => set({ items: [], lastUpdated: Date.now() }),
      subtotalCents: () => get().items.reduce((sum, i) => sum + i.line_total_cents, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: 'pv-cart-v1',
      storage: createJSONStorage(() => localStorage),
      // On rehydrate, wipe if the cart is older than MAX_AGE_MS. This
      // prevents stale carts from piling up indefinitely while still
      // letting customers come back within the week and resume.
      onRehydrateStorage: () => (state) => {
        if (!state || !state.lastUpdated) return;
        if (Date.now() - state.lastUpdated > MAX_AGE_MS) {
          state.items = [];
          state.lastUpdated = null;
        }
      },
    }
  )
);
