import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatSGD } from '@/lib/utils';
import { SignOutButton } from '@/components/account/sign-out-button';
import { ReorderButton } from '@/components/account/reorder-button';
import { TierProgress } from '@/components/account/tier-progress';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My account' };

export default async function AccountPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/account/login');

  const { data: profile } = await sb
    .from('profiles')
    .select('name, phone, role')
    .eq('id', user.id)
    .maybeSingle();

  const email = user.email ?? '';
  const { data: member } = await sb
    .from('members')
    .select('points_balance, total_earned, tier')
    .eq('email', email)
    .maybeSingle();

  // Pull past orders by email (since checkout links by email, not user id)
  const { data: orders } = await sb
    .from('orders')
    .select('id, order_number, status, created_at, total_cents')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 6 }}>My account</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            Hi, {profile?.name || email.split('@')[0]}.
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            href="/account/profile"
            style={{
              fontSize: 12, fontWeight: 800, letterSpacing: 0.3,
              padding: '10px 18px', borderRadius: 999,
              border: '1.5px solid rgba(233,30,140,0.3)',
              color: '#E91E8C', textDecoration: 'none',
            }}
          >
            Edit profile
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 32 }}>
        <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 14, background: '#fff' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Points</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#0a0a0a', marginTop: 4 }}>{member?.points_balance ?? 0}</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{member?.total_earned ?? 0} earned all-time</div>
        </div>
        <TierProgress totalEarned={member?.total_earned ?? 0} />
        <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 14, background: '#fff' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Orders</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#0a0a0a', marginTop: 4 }}>{orders?.length ?? 0}</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Across all time</div>
        </div>
      </div>

      {/* Past orders */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 14px' }}>Past orders</h2>
        <div style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
          {(orders ?? []).length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 13 }}>
              No orders yet. <Link href="/shop" style={{ color: '#E91E8C', fontWeight: 700 }}>Start shopping →</Link>
            </div>
          ) : (
            (orders ?? []).map((o: any, i, arr) => (
              <div key={o.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto auto', gap: 12, alignItems: 'center',
                padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid #eee' : 'none',
                fontSize: 13,
              }}>
                <div style={{ fontWeight: 800 }}>{o.order_number}</div>
                <div style={{ color: '#666', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                    background: o.status === 'completed' ? '#dcfce7' : o.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                    color: o.status === 'completed' ? '#166534' : o.status === 'cancelled' ? '#991b1b' : '#92400e',
                  }}>
                    {o.status}
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: '#E91E8C' }}>{formatSGD(o.total_cents)}</div>
                <Link
                  href={`/track?order=${encodeURIComponent(o.order_number)}`}
                  style={{
                    padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#0a0a0a',
                    border: '1px solid #ddd', borderRadius: 999, textDecoration: 'none',
                  }}
                >Track</Link>
                <ReorderButton orderId={o.id} orderNumber={o.order_number} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Profile details */}
      <div style={{ marginTop: 32, padding: 20, border: '1px solid #eee', borderRadius: 14, background: '#fff' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 14px' }}>Profile</h2>
        <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
          <div><span style={{ color: '#888' }}>Name:</span> <strong>{profile?.name || '—'}</strong></div>
          <div><span style={{ color: '#888' }}>Email:</span> <strong>{email}</strong></div>
          <div><span style={{ color: '#888' }}>Phone:</span> <strong>{profile?.phone || '—'}</strong></div>
        </div>
      </div>
    </main>
  );
}
