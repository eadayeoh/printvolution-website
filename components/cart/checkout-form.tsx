'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { formatSGD } from '@/lib/utils';
import { submitOrder } from '@/app/(site)/checkout/actions';

const FormSchema = z.object({
  customer_name: z.string().min(2, 'Name too short'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(6, 'Enter a valid phone number'),
  company: z.string().optional(),
  position: z.string().optional(),
  delivery_method: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

export function CheckoutForm() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotalCents());
  const clear = useCart((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { delivery_method: 'pickup' },
  });

  const deliveryMethod = watch('delivery_method');
  const deliveryCost = deliveryMethod === 'delivery' ? 800 : 0;
  const total = subtotal + deliveryCost;

  function onSubmit(values: FormValues) {
    if (items.length === 0) {
      setSubmitError('Your cart is empty.');
      return;
    }
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitOrder({
        ...values,
        items: items.map((i) => ({
          product_slug: i.product_slug,
          product_name: i.product_name,
          icon: i.icon,
          config: i.config,
          qty: i.qty,
          unit_price_cents: i.unit_price_cents,
          line_total_cents: i.line_total_cents,
          personalisation_notes: i.personalisation_notes,
          gift_image_url: i.gift_image_url,
        })),
      });
      if (result.ok) {
        clear();
        router.push(`/checkout/confirm?order=${result.order_number}`);
      } else {
        setSubmitError(result.error);
      }
    });
  }

  if (!mounted) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>;

  if (items.length === 0) {
    return (
      <div style={{
        padding: 80, textAlign: 'center', border: '2px dashed #ddd',
        background: '#fff', maxWidth: 600, margin: '0 auto',
      }}>
        <p style={{ fontSize: 18, color: '#666', marginBottom: 24 }}>Your cart is empty.</p>
        <Link href="/shop" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="co-layout">
      <div className="co-left">
        <div className="co-card">
          <div className="co-card-head">
            <span className="co-card-num">01</span>
            <h2 className="co-card-title">Your details</h2>
          </div>
          <div className="co-card-body">
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <Field label="Full name" error={errors.customer_name?.message}>
                <input {...register('customer_name')} className={inputCls} placeholder="Jane Tan" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input type="email" {...register('email')} className={inputCls} placeholder="jane@company.sg" />
              </Field>
              <Field label="Mobile" error={errors.phone?.message}>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...register('phone')}
                  className={inputCls}
                  placeholder="8123 4567"
                />
              </Field>
              <Field label="Company (optional)">
                <input {...register('company')} className={inputCls} />
              </Field>
              <Field label="Position (optional)">
                <input {...register('position')} className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        <div className="co-card">
          <div className="co-card-head">
            <span className="co-card-num">02</span>
            <h2 className="co-card-title">Delivery</h2>
          </div>
          <div className="co-card-body">
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <label style={{
                cursor: 'pointer', padding: 18, borderRadius: 8,
                border: `2px solid ${deliveryMethod === 'pickup' ? '#E91E8C' : '#e5e5e5'}`,
                background: deliveryMethod === 'pickup' ? 'rgba(233,30,140,.05)' : '#fff',
              }}>
                <input type="radio" value="pickup" {...register('delivery_method')} style={{ display: 'none' }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', marginBottom: 4 }}>Self-pickup</div>
                <div style={{ fontSize: 11, color: '#888' }}>60 Paya Lebar Road #B1-35 · Free</div>
              </label>
              <label style={{
                cursor: 'pointer', padding: 18, borderRadius: 8,
                border: `2px solid ${deliveryMethod === 'delivery' ? '#E91E8C' : '#e5e5e5'}`,
                background: deliveryMethod === 'delivery' ? 'rgba(233,30,140,.05)' : '#fff',
              }}>
                <input type="radio" value="delivery" {...register('delivery_method')} style={{ display: 'none' }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', marginBottom: 4 }}>Delivery</div>
                <div style={{ fontSize: 11, color: '#888' }}>Singapore-wide · S$8.00</div>
              </label>
            </div>
            {deliveryMethod === 'delivery' && (
              <div style={{ marginTop: 16 }}>
                <Field label="Delivery address">
                  <textarea {...register('delivery_address')} rows={2} className={inputCls} placeholder="Postal code, unit number, street..." />
                </Field>
              </div>
            )}
          </div>
        </div>

        <div className="co-card">
          <div className="co-card-head">
            <span className="co-card-num">03</span>
            <h2 className="co-card-title">Notes <span style={{ fontSize: 11, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>optional</span></h2>
          </div>
          <div className="co-card-body">
            <textarea {...register('notes')} rows={3} className={inputCls} placeholder="Special instructions, delivery timing, artwork notes..." />
          </div>
        </div>

        {submitError && (
          <div style={{
            padding: 14, background: '#fef2f2', border: '2px solid #dc2626',
            color: '#991b1b', fontSize: 13, borderRadius: 6,
          }}>
            {submitError}
          </div>
        )}
      </div>

      <aside className="co-rail">
        <div className="co-sum-card" style={{ boxShadow: '6px 6px 0 #E91E8C' }}>
          <div className="co-sum-head">
            <div className="co-sum-head-title">Order summary</div>
          </div>

          <div className="co-sum-items">
            {items.map((i) => (
              <div key={i.id} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 18 }}>{i.icon ?? '📦'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.product_name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Qty {i.qty} · {formatSGD(i.line_total_cents)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="co-sum-totals">
            <div className="co-sum-row">
              <span>Subtotal</span>
              <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{formatSGD(subtotal)}</span>
            </div>
            <div className="co-sum-row">
              <span>Delivery</span>
              <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{deliveryCost === 0 ? 'Free' : formatSGD(deliveryCost)}</span>
            </div>
          </div>

          <div className="co-sum-divider" />

          <div className="co-sum-total-row">
            <span className="co-sum-total-lbl">Total</span>
            <span className="co-sum-total-val">{formatSGD(total)}</span>
          </div>
          <div className="co-earn-row">+{Math.floor(subtotal / 100)} points on this order</div>

          <button
            type="submit"
            disabled={isPending}
            className="co-sum-cta"
            style={{
              width: '100%', padding: 14, marginTop: 16, borderRadius: 999,
              background: '#E91E8C', color: '#fff', fontSize: 13, fontWeight: 800,
              letterSpacing: 0.3, border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)',
              opacity: isPending ? 0.5 : 1,
            }}
          >
            {isPending ? 'Placing order…' : 'Place Order'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 10, color: '#aaa', marginTop: 10 }}>
            Payment handled via WhatsApp after order confirmation.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0a0a0a', marginBottom: 6, letterSpacing: 0.3 }}>
        {label}
      </span>
      {children}
      {error && <span style={{ display: 'block', fontSize: 11, color: '#dc2626', marginTop: 4 }}>{error}</span>}
    </label>
  );
}

const inputCls = 'pv-checkout-input';
