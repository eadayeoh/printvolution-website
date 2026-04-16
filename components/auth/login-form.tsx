'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    // Refresh to let middleware pick up new cookie and redirect
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none"
        />
      </label>
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-pink py-2.5 text-sm font-bold text-white transition-colors hover:bg-pink-dark disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
