'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AccountSignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) { setErr('Password must be at least 8 characters'); return; }
    startTransition(async () => {
      const sb = createClient();
      const { error, data } = await sb.auth.signUp({
        email: email.trim(), password,
        options: { data: { name: name.trim(), phone: phone.trim() } },
      });
      if (error) { setErr(error.message); return; }
      // Try to immediately sign them in (in case email confirmation is off)
      if (data.session) {
        router.push('/account');
        router.refresh();
        return;
      }
      // Otherwise, show a "check your email" state via query param
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
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} autoComplete="email" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Phone (optional)</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} placeholder="+65 XXXX XXXX" autoComplete="tel" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Password</span>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inp} autoComplete="new-password" placeholder="Min 8 characters" />
      </label>
      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">✗ {err}</div>}
      <button type="submit" disabled={isPending} className="w-full rounded-full bg-pink py-3 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50">
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-[11px] text-neutral-500">
        By signing up you agree to our storage of your name, email and phone for order processing.
      </p>
    </form>
  );
}
