'use client';

import type { GiftProductVariant } from '@/lib/gifts/types';
import { formatSGD } from '@/lib/utils';

export function GiftVariantPicker({
  variants,
  selectedId,
  onSelect,
}: {
  variants: GiftProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (variants.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {variants.map((v) => {
        const active = v.id === selectedId;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={`border-2 p-3 text-left transition ${
              active ? 'border-pink bg-pink/5' : 'border-ink bg-white hover:bg-yellow-50'
            }`}
          >
            {v.variant_thumbnail_url ? (
              <img
                src={v.variant_thumbnail_url}
                alt={v.name}
                className="mb-2 aspect-square w-full object-cover"
              />
            ) : v.mockup_url ? (
              <img src={v.mockup_url} alt={v.name} className="mb-2 aspect-square w-full object-cover" />
            ) : (
              <div className="mb-2 aspect-square w-full bg-neutral-100" />
            )}
            <div className="text-sm font-bold">{v.name}</div>
            {v.base_price_cents > 0 && (
              <div className="text-xs text-pink">{formatSGD(v.base_price_cents)}</div>
            )}
            {v.features && v.features.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-neutral-600">
                {v.features.slice(0, 4).map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            )}
          </button>
        );
      })}
    </div>
  );
}
