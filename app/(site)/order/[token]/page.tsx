import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { formatSGD } from '@/lib/utils';
import { OrderEditForm } from '@/components/order/order-edit-form';
import { GiftDesignEditor } from '@/components/order/gift-design-editor';
import { signUrl } from '@/lib/gifts/storage';

const COST_FREE_PROVIDERS = new Set(['passthrough', 'local_edge', 'local_bw']);

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Review your order', robots: { index: false, follow: false } };

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export default async function CustomerOrderEditPage({ params }: { params: { token: string } }) {
  const sb = service();
  const { data: order } = await sb
    .from('orders')
    .select(`
      id, order_number, status, customer_name, email,
      customer_edit_locked, customer_edit_last_at,
      delivery_method, delivery_address, notes,
      subtotal_cents, delivery_cents, gift_wrap, gift_wrap_cents,
      coupon_code, coupon_discount_cents,
      points_redeemed, points_discount_cents,
      total_cents,
      order_items(id, product_name, qty, unit_price_cents, line_total_cents, personalisation_notes, icon),
      gift_order_items(
        id, qty, product_name_snapshot, variant_name_snapshot, design_dirty,
        original_source_asset_id, personalisation_notes,
        preview:gift_assets!gift_order_items_preview_asset_id_fkey(bucket, path),
        source:gift_assets!gift_order_items_source_asset_id_fkey(bucket, path),
        pipeline:gift_pipelines(provider, slug)
      )
    `)
    .eq('customer_edit_token', params.token)
    .maybeSingle();

  if (!order) notFound();
  const o = order as any;
  const locked = !!o.customer_edit_locked;

  // Resolve preview thumbnails to short-lived signed URLs so the
  // customer can see their current artwork. 30-min validity covers
  // a long edit session without leaking long-lived links.
  const giftItems = await Promise.all(((o.gift_order_items ?? []) as any[]).map(async (g) => {
    const preview = Array.isArray(g.preview) ? g.preview[0] : g.preview;
    const previewUrl = preview ? await signUrl(preview.bucket, preview.path, 1800).catch(() => null) : null;
    const pipeline = Array.isArray(g.pipeline) ? g.pipeline[0] : g.pipeline;
    const provider = (pipeline?.provider ?? 'passthrough') as string;
    return {
      id: g.id as string,
      qty: g.qty as number,
      productName: (g.product_name_snapshot as string) ?? 'Gift item',
      variantName: (g.variant_name_snapshot as string) ?? null,
      designDirty: !!g.design_dirty,
      hasOriginalBackup: !!g.original_source_asset_id,
      personalisationNotes: (g.personalisation_notes as string) ?? '',
      previewUrl,
      photoEditable: COST_FREE_PROVIDERS.has(provider),
      pipelineProvider: provider,
    };
  }));

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 8 }}>
        Order review
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        {o.order_number}
      </h1>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 24px' }}>
        Hi {(o.customer_name as string)?.split(' ')[0] ?? 'there'} — review the order we drafted for you and adjust anything before we send it to print.
      </p>

      {locked ? (
        <div style={{
          padding: 20, borderRadius: 12, background: '#fef3c7', border: '1px solid #fde68a',
          color: '#92400e', fontSize: 14, fontWeight: 600,
        }}>
          🔒 This order is now in production and can&rsquo;t be edited from this link. Reply to your order email or WhatsApp us if you need a change.
        </div>
      ) : (
        <>
          {giftItems.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 14px', color: '#0a0a0a' }}>
                Gift items ({giftItems.length})
              </h2>
              <div style={{ display: 'grid', gap: 18 }}>
                {giftItems.map((g) => (
                  <GiftDesignEditor key={g.id} token={params.token} item={g} />
                ))}
              </div>
            </section>
          )}

          <OrderEditForm
            token={params.token}
            orderNumber={o.order_number}
            items={(o.order_items ?? []).map((i: any) => ({
              id: i.id,
              product_name: i.product_name,
              icon: i.icon,
              qty: i.qty,
              unit_price_cents: i.unit_price_cents,
              line_total_cents: i.line_total_cents,
              personalisation_notes: i.personalisation_notes ?? '',
            }))}
            deliveryMethod={(o.delivery_method ?? 'pickup') as 'pickup' | 'delivery'}
            deliveryAddress={o.delivery_address ?? ''}
            notes={o.notes ?? ''}
            subtotalCents={o.subtotal_cents ?? 0}
            deliveryCents={o.delivery_cents ?? 0}
            giftWrap={!!o.gift_wrap}
            giftWrapCents={o.gift_wrap_cents ?? 0}
            couponCode={o.coupon_code ?? null}
            couponDiscountCents={o.coupon_discount_cents ?? 0}
            pointsDiscountCents={o.points_discount_cents ?? 0}
            totalCents={o.total_cents ?? 0}
          />
        </>
      )}

      <p style={{ fontSize: 11, color: '#aaa', marginTop: 32, textAlign: 'center' }}>
        Last updated{' '}
        {o.customer_edit_last_at
          ? new Date(o.customer_edit_last_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })
          : 'never'}
      </p>
    </main>
  );
}
