'use client';

import { useMemo, useState } from 'react';
import { formatSGD, isImageUrl } from '@/lib/utils';
import { saveCustomerOrderEdit } from '@/app/(site)/order/actions';
import { DELIVERY_FLAT_CENTS, FREE_DELIVERY_THRESHOLD_CENTS, deliveryCentsFor } from '@/lib/checkout-rates';

export type EditableLine = {
  id: string;
  product_name: string;
  icon: string | null;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  personalisation_notes: string;
};

type Props = {
  token: string;
  orderNumber: string;
  items: EditableLine[];
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress: string;
  notes: string;
  subtotalCents: number;
  deliveryCents: number;
  giftWrap: boolean;
  giftWrapCents: number;
  couponCode: string | null;
  couponDiscountCents: number;
  pointsDiscountCents: number;
  totalCents: number;
};

export function OrderEditForm(p: Props) {
  // Local working copy. Customer can change qty per line + delivery
  // method/address + per-line notes + order-level notes.
  const [lines, setLines] = useState<EditableLine[]>(p.items);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>(p.deliveryMethod);
  const [deliveryAddress, setDeliveryAddress] = useState(p.deliveryAddress);
  const [notes, setNotes] = useState(p.notes);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Re-derive totals client-side using the same deliveryCentsFor()
  // helper the server uses, so the customer sees an honest preview.
  // Coupons + points discounts are kept at their stored values
  // (customer can't redeem more points or apply a different coupon
  // here) and are simply scaled to fit the new subtotal at submit.
  const { subtotal, delivery, total } = useMemo(() => {
    const s = lines.reduce((acc, l) => acc + l.qty * l.unit_price_cents, 0);
    const d = deliveryCentsFor(deliveryMethod, s);
    const w = p.giftWrap ? p.giftWrapCents : 0;
    // Cap discounts at subtotal so a stale coupon on a now-smaller
    // order doesn't push total below zero.
    const couponCapped = Math.min(p.couponDiscountCents, s);
    const pointsCapped = Math.min(p.pointsDiscountCents, Math.max(0, s - couponCapped));
    const t = Math.max(0, s + d + w - couponCapped - pointsCapped);
    return { subtotal: s, delivery: d, total: t };
  }, [lines, deliveryMethod, p.giftWrap, p.giftWrapCents, p.couponDiscountCents, p.pointsDiscountCents]);

  const dirty =
    lines.some((l, i) => l.qty !== p.items[i].qty || l.personalisation_notes !== p.items[i].personalisation_notes) ||
    deliveryMethod !== p.deliveryMethod ||
    deliveryAddress !== p.deliveryAddress ||
    notes !== p.notes;

  function setQty(id: string, qty: number) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.max(0, Math.min(999, qty | 0)) } : l)));
  }
  function setLineNote(id: string, note: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, personalisation_notes: note.slice(0, 500) } : l)));
  }

  async function submit() {
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      setErr('Delivery address is required.');
      return;
    }
    if (lines.every((l) => l.qty === 0)) {
      setErr('At least one item must have a quantity above zero — reply to your email if you want to cancel the order.');
      return;
    }
    setErr(null);
    setSubmitting(true);
    const r = await saveCustomerOrderEdit(p.token, {
      lines: lines.map((l) => ({
        id: l.id,
        qty: l.qty,
        personalisation_notes: l.personalisation_notes || null,
      })),
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress.trim() || null,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (r.ok) setDone(true);
    else setErr(r.error);
  }

  if (done) {
    return (
      <div style={{
        padding: 24, borderRadius: 12, background: '#dcfce7', border: '1px solid #86efac',
        color: '#166534', fontSize: 14, fontWeight: 600, textAlign: 'center',
      }}>
        ✓ Saved. We&rsquo;ve got your changes — anything else, just reply to the order email.
      </div>
    );
  }

  return (
    <div>
      {/* Items */}
      <div style={{ background: '#fff', border: '1.5px solid #0a0a0a', borderRadius: 12, marginBottom: 24 }}>
        {lines.map((line, idx) => {
          const removed = line.qty === 0;
          return (
            <div
              key={line.id}
              style={{
                padding: 18, borderBottom: idx < lines.length - 1 ? '1px solid #eee' : 'none',
                opacity: removed ? 0.5 : 1, background: removed ? '#fafaf7' : '#fff',
              }}
            >
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, background: '#f5f2ea', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, overflow: 'hidden', borderRadius: 8,
                }}>
                  {isImageUrl(line.icon)
                    ? <img src={line.icon as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{line.icon ?? '📦'}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>{line.product_name}</div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
                    {formatSGD(line.unit_price_cents)} each
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <QtyStepper value={line.qty} onChange={(v) => setQty(line.id, v)} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#E91E8C' }}>
                      = {formatSGD(line.qty * line.unit_price_cents)}
                    </span>
                    {removed && <span style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>(removed)</span>}
                  </div>
                  <label style={{ display: 'block', marginTop: 12 }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4 }}>
                      Notes for this line
                    </span>
                    <textarea
                      value={line.personalisation_notes}
                      onChange={(e) => setLineNote(line.id, e.target.value)}
                      maxLength={500}
                      rows={2}
                      style={{
                        width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e5e5',
                        fontSize: 12, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                      }}
                      placeholder="Anything we should know about this item"
                    />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 18, marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px', color: '#0a0a0a' }}>Delivery</h3>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {(['pickup', 'delivery'] as const).map((m) => (
            <label key={m} style={{
              cursor: 'pointer', padding: 14, borderRadius: 8,
              border: `2px solid ${deliveryMethod === m ? '#E91E8C' : '#e5e5e5'}`,
              background: deliveryMethod === m ? 'rgba(233,30,140,.05)' : '#fff',
            }}>
              <input
                type="radio"
                name="delivery_method"
                checked={deliveryMethod === m}
                onChange={() => setDeliveryMethod(m)}
                style={{ display: 'none' }}
              />
              <div style={{ fontWeight: 800, fontSize: 13, color: '#0a0a0a', marginBottom: 2, textTransform: 'capitalize' }}>{m === 'pickup' ? 'Self-pickup' : 'Delivery'}</div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {m === 'pickup'
                  ? 'Paya Lebar Square · Free'
                  : subtotal >= FREE_DELIVERY_THRESHOLD_CENTS ? 'Singapore-wide · Free' : `Singapore-wide · ${formatSGD(DELIVERY_FLAT_CENTS)}`}
              </div>
            </label>
          ))}
        </div>
        {deliveryMethod === 'delivery' && (
          <label style={{ display: 'block', marginTop: 14 }}>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4 }}>
              Delivery address
            </span>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={2}
              maxLength={500}
              style={{
                width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e5e5',
                fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              }}
              placeholder="Postal code, unit, street"
            />
          </label>
        )}
      </div>

      {/* Notes */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 18, marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px', color: '#0a0a0a' }}>Order notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          style={{
            width: '100%', padding: 12, borderRadius: 6, border: '1px solid #e5e5e5',
            fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          }}
          placeholder="Special instructions, deadline, artwork notes..."
        />
      </div>

      {/* Live totals */}
      <div style={{ background: '#fff', border: '2px solid #0a0a0a', borderRadius: 12, padding: 18, marginBottom: 18, boxShadow: '6px 6px 0 #E91E8C' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px', color: '#0a0a0a' }}>Updated totals</h3>
        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
          <Row label="Subtotal" value={formatSGD(subtotal)} />
          <Row label="Delivery" value={delivery === 0 ? 'Free' : formatSGD(delivery)} />
          {p.giftWrap && <Row label="Gift wrap" value={formatSGD(p.giftWrapCents)} />}
          {p.couponCode && p.couponDiscountCents > 0 && (
            <Row label={`Coupon ${p.couponCode}`} value={`-${formatSGD(Math.min(p.couponDiscountCents, subtotal))}`} accent />
          )}
          {p.pointsDiscountCents > 0 && (
            <Row label="Points" value={`-${formatSGD(Math.min(p.pointsDiscountCents, Math.max(0, subtotal - p.couponDiscountCents)))}`} accent />
          )}
          <div style={{ height: 1, background: '#0a0a0a', margin: '6px 0' }} />
          <Row label="Total" value={formatSGD(total)} bold />
        </div>
      </div>

      {err && <div style={{ marginBottom: 12, fontSize: 12, color: '#dc2626' }}>{err}</div>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting || !dirty}
        style={{
          width: '100%', padding: '16px 24px', borderRadius: 999,
          background: !dirty ? '#ccc' : '#E91E8C', color: '#fff',
          fontWeight: 800, fontSize: 13, letterSpacing: 0.3, border: 'none',
          cursor: submitting || !dirty ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Saving…' : dirty ? 'Save changes' : 'Nothing to save'}
      </button>
    </div>
  );
}

function QtyStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      border: '1.5px solid #0a0a0a', borderRadius: 999, overflow: 'hidden', background: '#fff',
    }}>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
        style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>−</button>
      <input
        type="number"
        min={0}
        max={999}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') { onChange(0); return; }
          const n = parseInt(raw, 10);
          if (!Number.isFinite(n)) return;
          onChange(Math.max(0, Math.min(999, n)));
        }}
        aria-label="Quantity"
        style={{
          width: 50, height: 32, border: 'none', outline: 'none',
          textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#0a0a0a',
          background: 'transparent', MozAppearance: 'textfield',
        }}
      />
      <button type="button" onClick={() => onChange(Math.min(999, value + 1))}
        style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>+</button>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: bold ? '#0a0a0a' : '#666', fontWeight: bold ? 800 : 400 }}>{label}</span>
      <span style={{ color: accent ? '#16a34a' : (bold ? '#E91E8C' : '#0a0a0a'), fontWeight: bold ? 800 : 600 }}>{value}</span>
    </div>
  );
}
