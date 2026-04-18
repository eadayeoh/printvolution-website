'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithPassword } from '@/app/(site)/account/actions';

export function AccountLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const r = await loginWithPassword({ email, password });
      if (!r.ok) { setErr(r.error); return; }
      router.push('/account');
      router.refresh();
    });
  }

  const inp = 'w-full rounded border-2 border-neutral-200 bg-white px-4 py-3 text-sm focus:border-pink focus:outline-none';

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Email</span>
        <input type="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} autoComplete="email" maxLength={200} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Password</span>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inp} autoComplete="current-password" maxLength={200} />
      </label>
      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">✗ {err}</div>}
      <button type="submit" disabled={isPending} className="w-full rounded-full bg-pink py-3 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50">
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
