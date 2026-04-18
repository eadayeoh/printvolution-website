import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/auth/require-admin';
import { formatSGD } from '@/lib/utils';
import { MemberDeleteButton } from '@/components/admin/member-delete-button';
import { AdminNotesEditor } from '@/components/admin/admin-notes-editor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Member detail' };

export default async function AdminMemberDetail({ params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: member } = await sb
    .from('members')
    .select('id, email, name, phone, points_balance, total_earned, tier, joined_at, updated_at')
    .eq('id', params.id)
    .maybeSingle();
  if (!member) notFound();

  // Orders + points ledger — public-read via staff RLS.
  const [ordersRes, txRes] = await Promise.all([
    sb.from('orders')
      .select('id, order_number, status, created_at, total_cents, delivery_method')
      .eq('email', member.email)
      .order('created_at', { ascending: false })
      .limit(50),
    sb.from('points_transactions')
      .select('id, points, reason, created_at, order_id')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const orders = (ordersRes.data ?? []) as Array<{ id: string; order_number: string; status: string; created_at: string; total_cents: number; delivery_method: string }>;
  const txns = (txRes.data ?? []) as Array<{ id: string; points: number; reason: string | null; created_at: string; order_id: string | null }>;

  // Linked auth profile lookup. auth.users isn't exposed over PostgREST,
  // so we walk the Supabase admin listUsers API. Small shops will rarely
  // exceed a single 1000-user page; if the user base grows we'll swap
  // this for a SECURITY DEFINER SQL function.
  const svc = createServiceClient();
  const { data: userRow } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const matchedUser = (userRow?.users ?? []).find((u) => u.email?.toLowerCase() === member.email.toLowerCase());
  let profile: {
    id: string; name: string | null; phone: string | null; role: string;
    address_line1: string | null; address_line2: string | null; postal_code: string | null; country: string | null;
    company: string | null; telegram: string | null; line_id: string | null; wechat: string | null;
    date_of_birth: string | null; marketing_opt_in: boolean; referral_source: string | null;
    admin_notes: string | null; created_at: string;
  } | null = null;
  if (matchedUser) {
    // The generated Database types in types/database.ts don't yet
    // include the migration-0018 columns, so cast the query's row.
    const resp = await svc
      .from('profiles')
      .select(
        'id, name, phone, role, address_line1, address_line2, postal_code, country, ' +
        'company, telegram, line_id, wechat, date_of_birth, marketing_opt_in, referral_source, ' +
        'admin_notes, created_at'
      )
      .eq('id', matchedUser.id)
      .maybeSingle();
    profile = (resp as any).data ?? null;
  }

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/members" className="text-xs font-bold text-pink hover:underline">
        ← All members
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink">{member.name ?? '(no name)'}</h1>
          <p className="mt-1 text-sm text-neutral-600">{member.email}</p>
          {member.phone && <p className="text-sm text-neutral-600">{member.phone}</p>}
          <p className="mt-1 text-[11px] text-neutral-400">
            Joined {new Date(member.joined_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
            {profile && <> · has sign-in account (<span className="font-semibold capitalize">{profile.role}</span>)</>}
          </p>
        </div>
        <MemberDeleteButton memberId={member.id} label={member.name || member.email} />
      </div>

      {/* Stat tiles */}
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Points balance" value={String(member.points_balance)} accent="pink" />
        <Stat label="Total earned" value={String(member.total_earned)} />
        <Stat label="Tier" value={(member.tier ?? 'Standard').toString()} />
        <Stat label="Orders" value={String(orders.length)} />
      </div>

      {/* Profile detail */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">Profile</h2>
          {!profile && <span className="text-[11px] text-neutral-400">Guest — no sign-in account</span>}
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 p-5 text-sm md:grid-cols-2">
            <ProfileField label="Name" value={profile?.name ?? member.name} />
            <ProfileField label="Phone" value={profile?.phone ?? member.phone} />
            <ProfileField label="Company" value={profile?.company} />
            <ProfileField label="Date of birth" value={profile?.date_of_birth} />
            <ProfileField label="Address line 1" value={profile?.address_line1} />
            <ProfileField label="Address line 2" value={profile?.address_line2} />
            <ProfileField label="Postal code" value={profile?.postal_code} />
            <ProfileField label="Country" value={profile?.country ?? '—'} />
            <ProfileField label="Telegram" value={profile?.telegram} />
            <ProfileField label="LINE ID" value={profile?.line_id} />
            <ProfileField label="WeChat" value={profile?.wechat} />
            <ProfileField
              label="Marketing"
              value={profile ? (profile.marketing_opt_in ? 'Opted in' : 'Not opted in') : null}
            />
            <ProfileField label="Referral source" value={profile?.referral_source} />
          </dl>
        </div>
      </section>

      {/* Admin-only notes */}
      {profile && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-ink">Admin notes (internal)</h2>
          <AdminNotesEditor profileId={profile.id} initial={profile.admin_notes ?? ''} />
        </section>
      )}

      {/* Orders */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-ink">Recent orders</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Delivery</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">No orders yet.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-bold text-ink">
                    <Link href={`/admin/orders/${o.id}`} className="hover:text-pink">{o.order_number}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-700">{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-neutral-600">{o.delivery_method}</td>
                  <td className="px-4 py-3 text-right font-bold text-pink tabular-nums">{formatSGD(o.total_cents)}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(o.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Points ledger */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-ink">Points ledger</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {txns.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-neutral-500">No points transactions yet.</td></tr>
              ) : txns.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {new Date(t.created_at).toLocaleString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-700">{t.reason ?? '—'}</td>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${t.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.points >= 0 ? '+' : ''}{t.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'pink' }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-1 text-3xl font-black ${accent === 'pink' ? 'text-pink' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className={`mt-0.5 text-sm ${value ? 'text-ink' : 'text-neutral-300'}`}>{value || '—'}</dd>
    </div>
  );
}
