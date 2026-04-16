import { createClient } from '@/lib/supabase/server';
import { formatSGD } from '@/lib/utils';

export const metadata = { title: 'Promos & Coupons' };

export default async function AdminPromos() {
  const supabase = createClient();
  const [coupons, rules] = await Promise.all([
    supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    supabase.from('discount_rules').select('*').order('created_at', { ascending: false }),
  ]);
  const cs = ((coupons.data ?? []) as any[]);
  const rs = ((rules.data ?? []) as any[]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-ink">Promos &amp; Coupons</h1>
        <p className="text-sm text-neutral-500">Coupon codes and cart-level discount rules.</p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-ink">Coupons ({cs.length})</h2>
        </div>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Discount</th>
                <th className="px-4 py-3 text-left">Min Spend</th>
                <th className="px-4 py-3 text-left">Uses</th>
                <th className="px-4 py-3 text-left">Expires</th>
                <th className="px-4 py-3 text-center">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {cs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">No coupons yet.</td></tr>
              ) : cs.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-bold text-ink">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.type === 'pct' ? `${c.percent}%` : formatSGD(c.value_cents ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{formatSGD(c.min_spend_cents ?? 0)}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-SG') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.is_active ? '✓' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="font-bold text-ink">Discount rules ({rs.length})</h2>
          <p className="text-xs text-neutral-500">Automatic discounts based on cart value or item count.</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Reward</th>
                <th className="px-4 py-3 text-left">Label</th>
                <th className="px-4 py-3 text-center">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-500">No rules yet.</td></tr>
              ) : rs.map((r: any) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-xs">
                    {r.type === 'min_spend' ? `Cart ≥ ${formatSGD(r.trigger_value)}` : `${r.trigger_value}+ items`}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold">
                    {r.reward_type === 'pct' ? `${r.reward_value}% off` : `${formatSGD(r.reward_value)} off`}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{r.label ?? '—'}</td>
                  <td className="px-4 py-3 text-center">{r.is_active ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-neutral-500">Creating and editing promos via the admin UI is built in Phase 6.</p>
    </div>
  );
}
