'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { checkLoginRateLimit, recordFailedLogin } from '@/app/login/actions';
import { Turnstile } from '@/components/common/turnstile';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!captchaToken) {
      setError('Please complete the captcha.');
      setLoading(false);
      return;
    }
    // Verify the captcha server-side before proceeding.
    const verify = await fetch('/api/verify-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: captchaToken }),
    });
    if (!verify.ok) {
      const data = (await verify.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Captcha failed — please retry.');
      setCaptchaToken(null);
      setLoading(false);
      return;
    }

    // Rate limit check BEFORE hitting Supabase Auth
    const rl = await checkLoginRateLimit();
    if (!rl.allowed) {
      setError(`Too many login attempts. Try again in ${rl.retryAfterSeconds}s.`);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      await recordFailedLogin(email);
      setError(authError.message);
      setCaptchaToken(null);
      setLoading(false);
      return;
    }
    // Backfill anon gift-credit usage onto the user_id so the weekly
    // quota carries over (otherwise burning 3 anon then signing in
    // would refresh to a full 8).
    if (data?.user?.id) {
      const { claimAnonGiftCreditsAfterLogin } = await import('@/app/login/actions');
      await claimAnonGiftCreditsAfterLogin(data.user.id).catch(() => {});
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0a0a0a', marginBottom: 6 }}>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="pv-checkout-input"
        />
      </label>
      <label>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0a0a0a', marginBottom: 6 }}>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="pv-checkout-input"
        />
      </label>
      <Turnstile
        onVerify={(token) => setCaptchaToken(token)}
        onExpire={() => setCaptchaToken(null)}
        onError={() => setError('Captcha failed to load — please refresh.')}
      />
      {error && (
        <div style={{
          padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca',
          color: '#991b1b', fontSize: 12, borderRadius: 4,
        }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !captchaToken}
        style={{
          padding: '12px 20px', borderRadius: 999,
          background: '#E91E8C', color: '#fff', fontSize: 13, fontWeight: 800,
          letterSpacing: 0.3, border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)',
          marginTop: 8, opacity: loading || !captchaToken ? 0.5 : 1,
        }}
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
