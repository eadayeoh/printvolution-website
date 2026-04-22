'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithPassword } from '@/app/(site)/account/actions';
import { Turnstile } from '@/components/common/turnstile';

export function AccountSignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) { setErr('Password must be at least 8 characters'); return; }
    if (!captchaToken) { setErr('Please complete the captcha.'); return; }
    startTransition(async () => {
      const r = await signUpWithPassword({ email, password, name: name || phone || null, captchaToken });
      if (!r.ok) { setErr(r.error); setCaptchaToken(null); return; }
      // Show "check your email" state — the action flow lets Supabase
      // send its verification email rather than auto-signing in here.
      router.push('/account/login?check=1');
    });
  }

  const inp = 'w-full rounded border-2 border-neutral-200 bg-white px-4 py-3 text-sm focus:border-pink focus:outline-none';

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Full name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inp} autoComplete="name" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Email</span>
        <input type="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} autoComplete="email" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Phone (optional)</span>
        <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} placeholder="+65 XXXX XXXX" autoComplete="tel" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Password</span>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inp} autoComplete="new-password" placeholder="Min 8 characters" />
      </label>
      <Turnstile
        onVerify={(token) => setCaptchaToken(token)}
        onExpire={() => setCaptchaToken(null)}
        onError={() => setErr('Captcha failed to load — please refresh.')}
      />
      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">✗ {err}</div>}
      <button type="submit" disabled={isPending || !captchaToken} className="w-full rounded-full bg-pink py-3 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50">
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-[11px] text-neutral-500">
        By signing up you agree to our storage of your name, email and phone for order processing.
      </p>
    </form>
  );
}
