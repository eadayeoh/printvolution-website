'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMyProfile } from '@/app/(site)/account/actions';

const REFERRAL_OPTIONS = [
  'Google search',
  'Instagram',
  'Facebook',
  'TikTok',
  'WhatsApp',
  'Friend / word of mouth',
  'Walk-in / passed by the shop',
  'Returning customer',
  'Other',
];

export type ProfileFormInitial = {
  name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  country: string;
  company: string;
  telegram: string;
  line_id: string;
  wechat: string;
  date_of_birth: string;       // ISO yyyy-mm-dd or ''
  marketing_opt_in: boolean;
  referral_source: string;
};

export function ProfileEditor({ initial }: { initial: ProfileFormInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProfileFormInitial>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = Object.keys(initial).some((k) => {
    const a = (initial as any)[k];
    const b = (form as any)[k];
    if (typeof a === 'boolean') return a !== b;
    return (a ?? '') !== (b ?? '');
  });

  function set<K extends keyof ProfileFormInitial>(key: K, value: ProfileFormInitial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    startTransition(async () => {
      const r = await updateMyProfile({
        ...form,
        date_of_birth: form.date_of_birth || null,
      });
      if (!r.ok) { setErr(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const inp = 'w-full rounded border-2 border-neutral-200 bg-white px-4 py-3 text-sm focus:border-pink focus:outline-none';
  const label = 'mb-1 block text-xs font-bold text-ink';

  return (
    <form onSubmit={submit} className="space-y-6">
      <Fieldset title="Name & contact" desc="Shown on orders, invoices, and WhatsApp messages.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={label}>Full name</span>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inp}
              required
              maxLength={100}
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className={label}>Phone</span>
            <input
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={inp}
              maxLength={30}
              placeholder="+65 XXXX XXXX"
              autoComplete="tel"
            />
          </label>
        </div>
      </Fieldset>

      <Fieldset title="Delivery address" desc="Pre-filled into new orders — you can still edit it at checkout.">
        <label className="block">
          <span className={label}>Street address</span>
          <input
            value={form.address_line1}
            onChange={(e) => set('address_line1', e.target.value)}
            className={inp}
            maxLength={200}
            placeholder="123 Main Street"
            autoComplete="address-line1"
          />
        </label>
        <label className="mt-4 block">
          <span className={label}>Unit / apt (optional)</span>
          <input
            value={form.address_line2}
            onChange={(e) => set('address_line2', e.target.value)}
            className={inp}
            maxLength={200}
            placeholder="#04-08"
            autoComplete="address-line2"
          />
        </label>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={label}>Postal code</span>
            <input
              inputMode="numeric"
              value={form.postal_code}
              onChange={(e) => set('postal_code', e.target.value)}
              className={inp}
              maxLength={12}
              placeholder="409051"
              autoComplete="postal-code"
            />
          </label>
          <label className="block">
            <span className={label}>Country</span>
            <input
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              className={inp}
              maxLength={60}
              placeholder="Singapore"
              autoComplete="country-name"
            />
          </label>
        </div>
      </Fieldset>

      <Fieldset title="Business details (optional)" desc="Useful when you're ordering for a company.">
        <label className="block">
          <span className={label}>Company / organisation</span>
          <input
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            className={inp}
            maxLength={120}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
          />
        </label>
      </Fieldset>

      <Fieldset title="Alternative contacts (optional)" desc="We'll use these only if we can't reach you on WhatsApp.">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className={label}>Telegram</span>
            <input
              value={form.telegram}
              onChange={(e) => set('telegram', e.target.value)}
              className={inp}
              maxLength={80}
              placeholder="@handle"
            />
          </label>
          <label className="block">
            <span className={label}>LINE ID</span>
            <input
              value={form.line_id}
              onChange={(e) => set('line_id', e.target.value)}
              className={inp}
              maxLength={80}
            />
          </label>
          <label className="block">
            <span className={label}>WeChat ID</span>
            <input
              value={form.wechat}
              onChange={(e) => set('wechat', e.target.value)}
              className={inp}
              maxLength={80}
            />
          </label>
        </div>
      </Fieldset>

      <Fieldset title="Personal (optional)" desc="Birthdays help us send you the right promos.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={label}>Date of birth</span>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
              className={inp}
            />
          </label>
          <label className="block">
            <span className={label}>How did you hear about us?</span>
            <select
              value={REFERRAL_OPTIONS.includes(form.referral_source) ? form.referral_source : (form.referral_source ? 'Other' : '')}
              onChange={(e) => set('referral_source', e.target.value)}
              className={inp}
            >
              <option value="">Select one…</option>
              {REFERRAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.marketing_opt_in}
            onChange={(e) => set('marketing_opt_in', e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span className="text-xs text-neutral-700">
            Send me occasional emails about new products, volume deals, and printing tips.
            You can unsubscribe any time — we won&apos;t sell or share your email.
          </span>
        </label>
      </Fieldset>

      {err && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
          ✗ {err}
        </div>
      )}
      {saved && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-800">
          ✓ Profile updated
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-neutral-100 bg-white/95 p-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <button
          type="submit"
          disabled={isPending || !dirty}
          className="w-full rounded-full bg-pink px-6 py-3 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50 md:w-auto"
        >
          {isPending ? 'Saving…' : dirty ? 'Save changes' : 'No changes'}
        </button>
      </div>
    </form>
  );
}

function Fieldset({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 border-b border-neutral-100 pb-2">
        <div className="text-sm font-black text-ink">{title}</div>
        {desc && <div className="mt-0.5 text-[11px] text-neutral-500">{desc}</div>}
      </div>
      {children}
    </section>
  );
}
