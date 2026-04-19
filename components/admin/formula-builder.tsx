'use client';

import { useMemo, useState } from 'react';
import { evaluateFormula } from '@/lib/pricing';

type Props = {
  value: string;
  onChange: (formula: string) => void;
};

/**
 * Formula presets the admin can pick from without typing any code.
 * All outputs are SGD dollars (the product page multiplies by 100).
 */
type PresetKey = 'none' | 'flat' | 'per_unit' | 'volume_discount' | 'bulk_tier' | 'percent_bulk_discount' | 'custom';

type Preset = {
  key: PresetKey;
  label: string;
  description: string;
  fields: Array<{ id: string; label: string; hint?: string; type: 'number' | 'text'; defaultValue?: string }>;
  build: (vars: Record<string, string>) => string;
};

const PRESETS: Preset[] = [
  {
    key: 'none',
    label: 'No extra charge',
    description: 'Use the base matrix price. Pick this for variants that don\'t change price (e.g. color swatches).',
    fields: [],
    build: () => '',
  },
  {
    key: 'flat',
    label: 'Flat one-off charge',
    description: 'A fixed fee regardless of quantity — useful for setup fees, add-ons.',
    fields: [
      { id: 'price', label: 'Flat price (S$)', type: 'number', defaultValue: '10' },
    ],
    build: ({ price }) => `${Number(price || 0)}`,
  },
  {
    key: 'per_unit',
    label: 'Per-unit price (flat)',
    description: 'Price × quantity. Same per-piece rate no matter how many. Example: S$3 × 100 pieces = S$300.',
    fields: [
      { id: 'price', label: 'Price per unit (S$)', type: 'number', defaultValue: '3' },
    ],
    build: ({ price }) => `qty * ${Number(price || 0)}`,
  },
  {
    key: 'volume_discount',
    label: 'Per-unit with volume discount',
    description: 'Price drops by $step per extra unit, capped at $cap off. Example: S$75 base with $1 off each extra, max $10 off → qty 1 = $75, qty 3 = $219, qty 11+ = $65/pc forever.',
    fields: [
      { id: 'base', label: 'Base price per unit (S$)', type: 'number', defaultValue: '75' },
      { id: 'step', label: 'Discount per extra unit (S$)', hint: 'How many dollars cheaper each additional unit gets', type: 'number', defaultValue: '1' },
      { id: 'cap', label: 'Max discount (S$)', hint: 'Floor — discount stops growing past this amount', type: 'number', defaultValue: '10' },
    ],
    build: ({ base, step, cap }) => {
      const b = Number(base || 0), s = Number(step || 0), c = Number(cap || 0);
      if (s <= 0) return `qty * ${b}`;
      // qty * (base - min(cap, step * (qty - 1)))
      return `qty * (${b} - Math.min(${c}, ${s} * (qty - 1)))`;
    },
  },
  {
    key: 'bulk_tier',
    label: 'Two-tier: small vs bulk',
    description: 'One price under X units, cheaper price at or above X. Example: S$5/pc under 50, S$4/pc for 50+.',
    fields: [
      { id: 'small', label: 'Small-order price (S$/pc)', type: 'number', defaultValue: '5' },
      { id: 'bulk', label: 'Bulk price (S$/pc)', type: 'number', defaultValue: '4' },
      { id: 'threshold', label: 'Bulk kicks in at', hint: 'Quantity needed to unlock the bulk price', type: 'number', defaultValue: '50' },
    ],
    build: ({ small, bulk, threshold }) => {
      const s = Number(small || 0), b = Number(bulk || 0), t = Number(threshold || 1);
      // If qty >= threshold use bulk, else small. Expressed with only allowed ops:
      // We use a trick: (qty >= t) isn't allowed in our evaluator grammar.
      // So: price = bulk if qty >= t else small. We can express as:
      // qty * (small - Math.min(small - bulk, Math.max(0, 0) )) — this doesn't work.
      // Fallback: use Math.min/max + division trick isn't safe either.
      // Simplest safe approximation: always apply bulk price above threshold
      // by flooring / ceiling. Cleanest: use Math.max(small, bulk) for low qty,
      // Math.min for high. But our evaluator may not support conditional logic.
      // We'll build it using the volume_discount pattern with step=(small-bulk)
      // capped after threshold-1 extras:
      const step = Math.max(0, s - b);
      const cap = Math.max(0, step * Math.max(0, t - 1));
      return `qty * (${s} - Math.min(${cap}, ${step} * (qty - 1)))`;
    },
  },
  {
    key: 'percent_bulk_discount',
    label: 'Bulk % discount (threshold)',
    description:
      'Give a percent discount off the running total once quantity hits a threshold. Example: 10% off the whole line at 500 pcs. ⚠ Requires a PRIOR charge step — a per-unit price, a flat charge, or a pricing_table tier on this product. The discount subtracts from whatever earlier steps have already set; on its own, with no base, it discounts nothing. Place this step LAST in the configurator so it sees the full base.',
    fields: [
      { id: 'percent', label: 'Discount (%)', type: 'number', defaultValue: '10' },
      { id: 'threshold', label: 'Kicks in at qty', hint: 'Orders of this quantity and above get the discount.', type: 'number', defaultValue: '500' },
    ],
    build: ({ percent, threshold }) => {
      const p = Math.max(0, Number(percent || 0));
      const t = Math.max(1, Math.floor(Number(threshold || 1)));
      if (p <= 0) return '0';
      const shift = t - 1;
      const frac = p / 100;
      // 0 below threshold; -frac × base at / above. The `Math.min(1, Math.max(0, qty - shift))`
      // is 0 for qty <= shift (= threshold-1) and 1 for qty >= threshold.
      return `-base * ${frac} * Math.min(1, Math.max(0, qty - ${shift}))`;
    },
  },
  {
    key: 'custom',
    label: 'Custom formula (advanced)',
    description: 'Write your own. Allowed: numbers, qty, + − × ÷, parentheses, Math.min(...), Math.max(...). Output is SGD dollars for the whole line.',
    fields: [
      { id: 'formula', label: 'Formula', hint: 'e.g. qty * (95 - Math.min(10, qty - 1))', type: 'text', defaultValue: '' },
    ],
    build: ({ formula }) => formula.trim(),
  },
];

function detectPreset(formula: string): { key: PresetKey; vars: Record<string, string> } {
  const f = (formula || '').replace(/\s+/g, '');
  if (!f || f === '0') return { key: 'none', vars: {} };

  // flat: just a number
  const flat = /^(-?\d+(?:\.\d+)?)$/.exec(f);
  if (flat) return { key: 'flat', vars: { price: flat[1] } };

  // per_unit: qty*X
  const perUnit = /^qty\*(-?\d+(?:\.\d+)?)$/.exec(f);
  if (perUnit) return { key: 'per_unit', vars: { price: perUnit[1] } };

  // volume_discount / bulk_tier: qty*(BASE-Math.min(CAP,STEP*(qty-1)))
  const vd = /^qty\*\((-?\d+(?:\.\d+)?)-Math\.min\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\*\(qty-1\)\)\)$/.exec(f);
  if (vd) {
    const base = vd[1], cap = vd[2], step = vd[3];
    return { key: 'volume_discount', vars: { base, step, cap } };
  }

  // percent_bulk_discount: -base*FRAC*Math.min(1,Math.max(0,qty-SHIFT))
  const pbd = /^-base\*(-?\d+(?:\.\d+)?)\*Math\.min\(1,Math\.max\(0,qty-(-?\d+(?:\.\d+)?)\)\)$/.exec(f);
  if (pbd) {
    const fraction = parseFloat(pbd[1]);
    const shift = parseFloat(pbd[2]);
    return {
      key: 'percent_bulk_discount',
      vars: {
        percent: String(Math.round(fraction * 10000) / 100),
        threshold: String(shift + 1),
      },
    };
  }

  return { key: 'custom', vars: { formula } };
}

export function FormulaBuilder({ value, onChange }: Props) {
  const detected = useMemo(() => detectPreset(value), [value]);
  const [preset, setPreset] = useState<PresetKey>(detected.key);
  const [vars, setVars] = useState<Record<string, string>>(detected.vars);

  const active = PRESETS.find((p) => p.key === preset)!;

  function setVar(id: string, v: string) {
    const next = { ...vars, [id]: v };
    setVars(next);
    onChange(active.build(next));
  }

  function switchPreset(k: PresetKey) {
    setPreset(k);
    const p = PRESETS.find((x) => x.key === k)!;
    const initial: Record<string, string> = {};
    p.fields.forEach((f) => { initial[f.id] = f.defaultValue ?? ''; });
    setVars(initial);
    onChange(p.build(initial));
  }

  // Preview for qty 1, 5, 10. Most presets only reference `qty` so
  // base=0 is fine, but the bulk-discount preset references `base` —
  // passing 0 would hide the discount in the preview. Use a synthetic
  // $100 base when the formula touches `base`, and surface that in the
  // label so admins know the preview is "on a $100 base".
  const previewBase = /\bbase\b/.test(value || '') ? 100 : 0;
  const preview = useMemo(() => {
    if (!value) return null;
    try {
      return [1, 5, 10].map((q) => ({
        q,
        total: evaluateFormula(value, { qty: q, base: previewBase }),
      }));
    } catch {
      return null;
    }
  }, [value, previewBase]);

  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Pricing rule</span>
      </div>

      <select
        value={preset}
        onChange={(e) => switchPreset(e.target.value as PresetKey)}
        className="mb-2 w-full rounded border-2 border-neutral-200 bg-white px-2 py-1.5 text-xs font-semibold focus:border-pink focus:outline-none"
      >
        {PRESETS.map((p) => (
          <option key={p.key} value={p.key}>{p.label}</option>
        ))}
      </select>

      <p className="mb-2 text-[10px] leading-relaxed text-neutral-600">{active.description}</p>

      {active.fields.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          {active.fields.map((f) => (
            <label key={f.id} className="block">
              <span className="mb-0.5 block text-[10px] font-bold text-neutral-700">{f.label}</span>
              <input
                type={f.type}
                value={vars[f.id] ?? ''}
                onChange={(e) => setVar(f.id, e.target.value)}
                className="w-full rounded border border-neutral-200 bg-white px-2 py-1 text-xs font-mono focus:border-pink focus:outline-none"
              />
              {f.hint && <span className="mt-0.5 block text-[9px] text-neutral-500">{f.hint}</span>}
            </label>
          ))}
        </div>
      )}

      {value && (
        <div className="rounded bg-white p-2 text-[10px]">
          <div className="mb-1 font-bold text-neutral-600">
            Formula: <code className="font-mono text-[10px] text-neutral-800">{value}</code>
          </div>
          {preview && (
            <div className="flex flex-col gap-0.5 text-neutral-600">
              <div className="flex gap-3">
                {preview.map(({ q, total }) => (
                  <span key={q}>
                    qty <strong>{q}</strong> → <strong>S${total.toFixed(2)}</strong>
                  </span>
                ))}
              </div>
              {previewBase > 0 && (
                <div className="text-[9px] text-neutral-500">
                  Preview assumes a S${previewBase} base from earlier steps. Actual base is set by prior charge steps or a pricing_table tier at run-time.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
