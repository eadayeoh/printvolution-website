'use client';

import { useState, useTransition } from 'react';
import { trackOrder, type TrackedOrder } from '@/app/(site)/track/actions';
import { formatSGD } from '@/lib/utils';

const STATUS_STEPS = [
  { key: 'pending',    label: 'Order received',    icon: '🛒' },
  { key: 'processing', label: 'Working on it',     icon: '🛠️' },
  { key: 'ready',      label: 'Ready / shipped',   icon: '📦' },
  { key: 'completed',  label: 'Completed',         icon: '✅' },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  processing: 1,
  ready: 2,
  completed: 3,
};

export function TrackForm({ initialOrderNumber }: { initialOrderNumber?: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber ?? '');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOrder(null);
    start(async () => {
      const r = await trackOrder(orderNumber, email);
      if (r.ok) setOrder(r.order);
      else setErr(r.error);
    });
  }

  return (
    <div>
      {!order && (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 24, background: '#fff', border: '2px solid #0a0a0a', borderRadius: 8, boxShadow: '6px 6px 0 #E91E8C' }}>
          <div style={{ fontSize: 12, color: '#888' }}>Enter your order number and the email you used at checkout.</div>
          <Field label="Order number">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="PV12345"
              className="pv-checkout-input"
              required
              autoComplete="off"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.sg"
              className="pv-checkout-input"
              required
              autoComplete="email"
            />
          </Field>
          {err && <div style={{ padding: 12, background: '#fef2f2', border: '2px solid #dc2626', color: '#991b1b', fontSize: 13, borderRadius: 6 }}>{err}</div>}
          <button
            type="submit"
            disabled={isPending}
            style={{ padding: 14, borderRadius: 999, background: '#E91E8C', color: '#fff', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', opacity: isPending ? 0.5 : 1 }}
          >{isPending ? 'Looking up…' : 'Track order'}</button>
        </form>
      )}

      {order && <OrderTrackedView order={order} onBack={() => setOrder(null)} />}
    </div>
  );
}

function OrderTrackedView({ order, onBack }: { order: TrackedOrder; onBack: () => void }) {
  const stepIdx = STATUS_INDEX[order.status] ?? 0;
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase' }}>Order</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0a0a0a' }}>{order.order_number}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Placed {new Date(order.created_at).toLocaleString('en-SG')}</div>
        </div>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'transparent', border: '1px solid #ddd', padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#666', borderRadius: 6, cursor: 'pointer' }}
        >Look up another</button>
      </div>

      {/* Progress timeline */}
      <div style={{ background: '#fff', border: '2px solid #0a0a0a', borderRadius: 8, padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 }}>Progress</div>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
          {STATUS_STEPS.map((step, i) => {
            const reached = i <= stepIdx;
            const active = i === stepIdx;
            return (
              <li key={step.key} style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: reached ? 1 : 0.35 }}>
                <span style={{ fontSize: 22 }}>{step.icon}</span>
                <span style={{ fontSize: 14, fontWeight: active ? 800 : 600, color: reached ? '#0a0a0a' : '#888' }}>{step.label}</span>
                {active && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: '#E91E8C', textTransform: 'uppercase', letterSpacing: 0.4 }}>← current</span>}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Items */}
      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Items</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          {[...order.items, ...order.gifts.map((g) => ({ qty: g.qty, product_name: `🎁 ${g.product_name}` + (g.production_status === 'failed' ? ' (production issue — we\u2019ll WhatsApp you)' : '') }))].map((item, i) => (
            <li key={i} style={{ fontSize: 14, color: '#0a0a0a' }}>
              <span style={{ color: '#666' }}>{item.qty}×</span> {item.product_name}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#666' }}>Delivery: <strong style={{ color: '#0a0a0a' }}>{order.delivery_method}</strong>{order.gift_wrap ? ' · 🎁 Gift wrapped' : ''}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#E91E8C' }}>{formatSGD(order.total_cents)}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>
        Need help?{' '}
        <a href="https://wa.me/6585533497" target="_blank" rel="noopener noreferrer" style={{ color: '#E91E8C', fontWeight: 700 }}>
          WhatsApp us →
        </a>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0a0a0a', marginBottom: 6, letterSpacing: 0.3 }}>{label}</span>
      {children}
    </label>
  );
}
