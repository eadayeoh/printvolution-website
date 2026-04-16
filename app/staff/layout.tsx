import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StaffSignOut } from '@/components/staff/staff-sign-out';

export const metadata = { title: { default: 'Staff', template: '%s · Staff' } };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirectTo=/staff');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    redirect('/login?redirectTo=/staff');
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <Link href="/staff" className="text-lg font-black">
            Print<span className="text-pink">volution</span>
            <span className="ml-3 text-[10px] font-bold uppercase tracking-wider text-pink">Staff</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-white/70 sm:inline">{(profile.name as string) ?? user.email}</span>
            <StaffSignOut />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
