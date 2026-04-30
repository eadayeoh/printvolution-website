import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { signUrl } from '@/lib/gifts/storage';
import { ProofForm } from '@/components/proof/proof-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Approve your proof', robots: { index: false, follow: false } };

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export default async function ProofPage({ params }: { params: { token: string } }) {
  const sb = service();
  const { data } = await sb
    .from('gift_order_items')
    .select(`
      id, proof_status, proof_response_note, product_name_snapshot,
      qty,
      preview:gift_assets!gift_order_items_preview_asset_id_fkey(bucket, path),
      order:orders(order_number, customer_name)
    `)
    .eq('proof_token', params.token)
    .maybeSingle();
  if (!data) notFound();

  const row = data as any;
  const preview = Array.isArray(row.preview) ? row.preview[0] : row.preview;
  const order = Array.isArray(row.order) ? row.order[0] : row.order;
  // 30-min signed URL — long enough that the customer can leave the
  // tab open while reading the email and still see the image.
  const previewUrl = preview ? await signUrl(preview.bucket, preview.path, 1800).catch(() => null) : null;

  const alreadyResponded = row.proof_status === 'approved' || row.proof_status === 'rejected';

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 8 }}>
        Proof for approval
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        {row.product_name_snapshot ?? 'Your gift'}
      </h1>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 24px' }}>
        Order <strong>{order?.order_number}</strong> · Qty {row.qty}
      </p>

      {previewUrl ? (
        <div style={{ background: '#fafaf7', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <img
            src={previewUrl}
            alt="Proof preview"
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
          />
        </div>
      ) : (
        <div style={{
          padding: 24, borderRadius: 12, background: '#fef3c7', border: '1px solid #fde68a',
          color: '#92400e', fontSize: 13, fontWeight: 600, marginBottom: 24,
        }}>
          Preview not yet ready. We'll email again once it is.
        </div>
      )}

      {alreadyResponded ? (
        <div style={{
          padding: 20, borderRadius: 12,
          background: row.proof_status === 'approved' ? '#dcfce7' : '#fee2e2',
          border: row.proof_status === 'approved' ? '1px solid #86efac' : '1px solid #fca5a5',
          color: row.proof_status === 'approved' ? '#166534' : '#991b1b',
          fontSize: 14, fontWeight: 600,
        }}>
          {row.proof_status === 'approved' ? '✓ Approved — thank you. We\'re sending it to print.' : '↺ Changes requested.'}
          {row.proof_response_note && (
            <p style={{ marginTop: 10, fontWeight: 500, fontStyle: 'italic' }}>
              &ldquo;{row.proof_response_note}&rdquo;
            </p>
          )}
        </div>
      ) : (
        previewUrl && <ProofForm token={params.token} />
      )}
    </main>
  );
}
