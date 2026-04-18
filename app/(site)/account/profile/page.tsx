import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileEditor, type ProfileFormInitial } from '@/components/account/profile-editor';
import { PasswordChangeForm } from '@/components/account/password-change-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit profile' };

export default async function AccountProfilePage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/account/login');

  // Generated Database types don't yet include the 0018 columns.
  const profileResp = await sb
    .from('profiles')
    .select(
      'name, phone, address_line1, address_line2, postal_code, country, company, ' +
      'telegram, line_id, wechat, date_of_birth, marketing_opt_in, referral_source'
    )
    .eq('id', user.id)
    .maybeSingle();
  const profile: any = profileResp.data;

  const initial: ProfileFormInitial = {
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    address_line1: profile?.address_line1 ?? '',
    address_line2: profile?.address_line2 ?? '',
    postal_code: profile?.postal_code ?? '',
    country: profile?.country ?? 'SG',
    company: profile?.company ?? '',
    telegram: profile?.telegram ?? '',
    line_id: profile?.line_id ?? '',
    wechat: profile?.wechat ?? '',
    date_of_birth: profile?.date_of_birth ?? '',
    marketing_opt_in: !!profile?.marketing_opt_in,
    referral_source: profile?.referral_source ?? '',
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <Link
        href="/account"
        style={{ fontSize: 12, fontWeight: 700, color: '#E91E8C', textDecoration: 'none' }}
      >
        ← My account
      </Link>
      <header className="mt-4 mb-8">
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 6 }}>
          Profile
        </div>
        <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">
          Edit your profile.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Update your contact details, delivery address, and communication preferences.
          Your email (<span className="font-semibold text-ink">{user.email}</span>) is tied to
          your account and can&apos;t be changed here — WhatsApp us if you need to.
        </p>
      </header>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 md:p-8">
        <ProfileEditor initial={initial} />
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 md:p-8">
        <div className="mb-1 text-sm font-black text-ink">Change password</div>
        <p className="mb-4 text-[11px] text-neutral-500">
          You&apos;ll stay signed in on this device after the change.
        </p>
        <PasswordChangeForm />
      </div>
    </main>
  );
}
