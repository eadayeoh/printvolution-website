'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'id'>) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotalCents: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const id = `ci_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({ items: [...s.items, { ...item, id }] }));
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            const unit = i.qty > 0 ? i.line_total_cents / i.qty : i.unit_price_cents;
            return { ...i, qty, line_total_cents: Math.round(unit * qty) };
          }),
        })),
      clear: () => set({ items: [] }),
      subtotalCents: () => get().items.reduce((sum, i) => sum + i.line_total_cents, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: 'pv-cart-v1' }
  )
);
