import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Members' };

export default async function AdminMembers() {
  const supabase = createClient();
  const { data } = await supabase
    .from('members')
    .select('id, email, name, phone, points_balance, total_earned, tier, joined_at')
    .order('joined_at', { ascending: false });

  const members = ((data ?? []) as any[]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">Members</h1>
        <p className="text-sm text-neutral-500">{members.length} registered customers</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3 text-right">Total Earned</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {members.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-500">No members yet.</td></tr>
            ) : members.map((m) => (
              <tr key={m.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-bold text-ink">{m.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-neutral-600">{m.email}</td>
                <td className="px-4 py-3 text-xs text-neutral-600">{m.phone ?? '—'}</td>
                <td className="px-4 py-3 text-right font-bold text-pink">{m.points_balance}</td>
                <td className="px-4 py-3 text-right text-xs text-neutral-600">{m.total_earned}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {new Date(m.joined_at).toLocaleDateString('en-SG')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
