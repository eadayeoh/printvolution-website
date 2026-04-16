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

  if (!mounted) return <div className="text-sm text-neutral-500">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-neutral-200 p-12 text-center">
        <p className="mb-6 text-lg text-neutral-500">Your cart is empty.</p>
        <Link
          href="/shop"
          className="inline-flex items-center rounded-full bg-pink px-6 py-3 text-sm font-bold text-white hover:bg-pink-dark"
        >
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-5">
      {/* Form fields */}
      <div className="space-y-8 lg:col-span-3">
        <section>
          <h2 className="mb-4 text-lg font-black text-ink">Your details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.customer_name?.message}>
              <input {...register('customer_name')} className={inputCls} placeholder="Jane Tan" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input type="email" {...register('email')} className={inputCls} placeholder="jane@company.sg" />
            </Field>
            <Field label="Mobile" error={errors.phone?.message}>
              <input {...register('phone')} className={inputCls} placeholder="8123 4567" />
            </Field>
            <Field label="Company (optional)">
              <input {...register('company')} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Position (optional)">
                <input {...register('position')} className={inputCls} />
              </Field>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-black text-ink">Delivery</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${deliveryMethod === 'pickup' ? 'border-pink bg-pink/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
              <input type="radio" value="pickup" {...register('delivery_method')} className="sr-only" />
              <div className="mb-1 text-sm font-bold text-ink">Self-pickup</div>
              <div className="text-xs text-neutral-500">60 Paya Lebar Road #B1-35 · Free</div>
            </label>
            <label className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${deliveryMethod === 'delivery' ? 'border-pink bg-pink/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
              <input type="radio" value="delivery" {...register('delivery_method')} className="sr-only" />
              <div className="mb-1 text-sm font-bold text-ink">Delivery</div>
              <div className="text-xs text-neutral-500">Singapore-wide · S$8.00</div>
            </label>
          </div>
          {deliveryMethod === 'delivery' && (
            <div className="mt-4">
              <Field label="Delivery address">
                <textarea {...register('delivery_address')} rows={2} className={inputCls} placeholder="Postal code, unit number, street..." />
              </Field>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-black text-ink">Notes <span className="text-xs font-normal text-neutral-400">(optional)</span></h2>
          <textarea {...register('notes')} rows={3} className={inputCls} placeholder="Special instructions, delivery timing, etc." />
        </section>

        {submitError && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-sm text-red-700">
            {submitError}
          </div>
        )}
      </div>

      {/* Summary */}
      <aside className="lg:col-span-2">
        <div className="sticky top-20 rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
          <h3 className="mb-4 text-lg font-black text-ink">Order summary</h3>
          <div className="mb-4 space-y-3 text-xs">
            {items.map((i) => (
              <div key={i.id} className="flex gap-2">
                <span className="text-lg">{i.icon ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-bold text-ink">{i.product_name}</div>
                  <div className="truncate text-[11px] text-neutral-500">
                    Qty {i.qty} · {formatSGD(i.line_total_cents)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mb-4 space-y-2 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-semibold text-ink">{formatSGD(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Delivery</span>
              <span className="font-semibold text-ink">{deliveryCost === 0 ? 'Free' : formatSGD(deliveryCost)}</span>
            </div>
          </div>
          <div className="mb-5 border-t-2 border-ink pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-neutral-600">Total</span>
              <span className="text-2xl font-black text-pink">{formatSGD(total)}</span>
            </div>
            <div className="mt-1 text-right text-[10px] text-neutral-500">
              +{Math.floor(subtotal / 100)} points on this order
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-pink py-3 text-sm font-bold text-white transition-colors hover:bg-pink-dark disabled:opacity-50"
          >
            {isPending ? 'Placing order…' : 'Place Order'}
          </button>
          <p className="mt-3 text-center text-[10px] text-neutral-500">
            Payment handled via WhatsApp after order confirmation.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-red-600">{error}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
