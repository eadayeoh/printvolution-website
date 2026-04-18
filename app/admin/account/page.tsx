import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileEditor, type ProfileFormInitial } from '@/components/account/profile-editor';
import { PasswordChangeForm } from '@/components/account/password-change-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My admin account' };

/**
 * Admin / staff self-service page. Same forms as /account/profile for
 * consistency — the underlying server actions check the auth user, not
 * the role, so admins get identical profile editing + password change.
 * Keeps admin folks inside the admin shell instead of bouncing them to
 * the customer-facing account area.
 */
export default async function AdminAccountPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  // Cast to any — the generated Database types in types/database.ts
  // don't yet include the 0018 columns (address_line1, telegram, etc.).
  const profileResp = await sb
    .from('profiles')
    .select(
      'name, phone, role, address_line1, address_line2, postal_code, country, ' +
      'company, telegram, line_id, wechat, date_of_birth, marketing_opt_in, referral_source'
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
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-ink">My account</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Signed in as <span className="font-semibold text-ink">{user.email}</span>
          {profile && <> · role <span className="font-semibold capitalize">{profile.role}</span></>}
        </p>
      </header>

      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-4">
            <div className="text-sm font-black text-ink">Profile</div>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Your name, contact details, and address — kept so orders and invoices stay consistent.
            </p>
          </div>
          <ProfileEditor initial={initial} />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-4">
            <div className="text-sm font-black text-ink">Change password</div>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              You&apos;ll stay signed in on this device after the change. Rate-limited to 5 attempts every 15 minutes.
            </p>
          </div>
          <PasswordChangeForm />
        </div>
      </div>
    </div>
  );
}
