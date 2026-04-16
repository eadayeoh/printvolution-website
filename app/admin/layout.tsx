import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata = { title: { default: 'Admin', template: '%s · Admin' } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirectTo=/admin');

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    redirect('/login?redirectTo=/admin');
  }

  return (
    <AdminShell userEmail={user.email ?? ''} userName={(profile.name as string) ?? ''} role={profile.role as string}>
      {children}
    </AdminShell>
  );
}
