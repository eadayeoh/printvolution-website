import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileEditor } from '@/components/account/profile-editor';
import { PasswordChangeForm } from '@/components/account/password-change-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit profile' };

export default async function AccountProfilePage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/account/login');

  const { data: profile } = await sb
    .from('profiles')
    .select('name, phone')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
      <Link
        href="/account"
        style={{ fontSize: 12, fontWeight: 700, color: '#E91E8C', textDecoration: 'none' }}
      >
        ← My account
      </Link>
      <header style={{ marginTop: 16, marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 6 }}>
          Profile
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0a0a0a' }}>
          Edit your profile.
        </h1>
        <p style={{ fontSize: 14, color: '#666', margin: '10px 0 0', lineHeight: 1.6 }}>
          Update your name, contact number, and password. Your email address is tied to your account and can&apos;t be changed here — WhatsApp us if you need to.
        </p>
      </header>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 28, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 4 }}>
          Account details
        </div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 18 }}>
          Email: <span style={{ color: '#555', fontWeight: 600 }}>{user.email}</span>
        </div>
        <ProfileEditor
          initialName={profile?.name ?? ''}
          initialPhone={profile?.phone ?? ''}
        />
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 4 }}>
          Change password
        </div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 18 }}>
          You&apos;ll stay signed in on this device after the change.
        </div>
        <PasswordChangeForm />
      </div>
    </main>
  );
}
