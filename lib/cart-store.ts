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

export type CartLineTier = { qty: number; price_cents: number };

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
  /** Snapshot of the variant's (or product's) qty-tier table at
   *  add-to-cart time. updateQty re-derives the per-unit price from
   *  this when the customer changes quantity in the cart, so a tier
   *  break (e.g. qty 50+) actually drops the unit price. Empty / null
   *  means the line had no tier table — fall back to existing
   *  per-unit price preservation. */
  price_tiers?: CartLineTier[];
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

// Cart auto-clears after 6 days of inactivity. Every mutation bumps
// `lastUpdated`; on rehydrate, we wipe if the timestamp is too old.
// Held just under the 7-day signed-URL TTL on `gift_image_url` so the
// cart wipes BEFORE the thumbnails 404 — customers never see a broken
// preview with no UI signal.
const MAX_AGE_MS = 6 * 24 * 60 * 60 * 1000;

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
            // Re-derive unit price from the line's price_tiers snapshot
            // (captured at add-to-cart). Pick the tier whose qty bracket
            // newQty falls into; below the smallest tier the existing
            // unit price applies. Empty/missing tiers means the line was
            // added before tier capture — fall back to keeping the same
            // per-unit price the line already carried.
            let unit = i.qty > 0 ? i.line_total_cents / i.qty : i.unit_price_cents;
            const tiers = (i.price_tiers ?? []).filter(
              (t) => Number.isFinite(t?.qty) && Number.isFinite(t?.price_cents),
            );
            if (tiers.length > 0) {
              const sorted = [...tiers].sort((a, b) => a.qty - b.qty);
              const oldTier = sorted.filter((t) => t.qty <= i.qty).pop();
              const newTier = sorted.filter((t) => t.qty <= qty).pop();
              const oldTierPrice = oldTier?.price_cents;
              const newTierPrice = newTier?.price_cents;
              // Subtract the part of the old line that came from the
              // tier base, replace it with the new tier base. Anything
              // else baked into unit_price_cents (size deltas, shape,
              // figurine, surface) stays untouched.
              if (typeof newTierPrice === 'number') {
                const carry = i.unit_price_cents - (oldTierPrice ?? i.unit_price_cents);
                unit = newTierPrice + (Number.isFinite(carry) ? carry : 0);
              }
            }
            return {
              ...i,
              qty,
              unit_price_cents: Math.round(unit),
              line_total_cents: Math.round(unit * qty),
            };
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
