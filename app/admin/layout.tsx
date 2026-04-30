import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata = { title: { default: 'Admin', template: '%s · Admin' } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirectTo=/admin');

  // Strict admin-only gate. Staff users are sent to /staff (their
  // legitimate workspace) instead of looping back to /login — that
  // would just re-authenticate them and loop. Admin gets full access;
  // anyone else is dropped to login.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/login?redirectTo=/admin');
  if (profile.role === 'staff') redirect('/staff');
  if (profile.role !== 'admin') redirect('/login?redirectTo=/admin');

  return (
    <AdminShell userEmail={user.email ?? ''} userName={(profile.name as string) ?? ''} role={profile.role as string}>
      {children}
    </AdminShell>
  );
}
