import { createClient } from '@/lib/supabase/server';
import { MembersTable, type MemberRow } from '@/components/admin/members-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Members' };

export default async function AdminMembers() {
  const supabase = createClient();
  const { data } = await supabase
    .from('members')
    .select('id, email, name, phone, points_balance, total_earned, tier, joined_at')
    .order('joined_at', { ascending: false })
    .limit(500);

  const members = ((data ?? []) as MemberRow[]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">Members</h1>
        <p className="text-sm text-neutral-500">
          {members.length} registered customer{members.length === 1 ? '' : 's'} ·
          click a row to view the full profile, points ledger and orders
        </p>
      </div>
      <MembersTable members={members} />
    </div>
  );
}
