'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ERROR_LABELS: Record<string, string> = {
  not_authorized: 'That Google account isn\'t authorised for the admin / staff dashboard. Sign in with the company gmail.',
  missing_code:   'Sign-in didn\'t complete. Try again.',
  auth_failed:    'Sign-in failed. Try again or contact the admin.',
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const errCode = searchParams.get('error');
  const initialError = errCode ? (ERROR_LABELS[errCode] ?? errCode) : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // Force Google to show the account chooser so an admin who's
        // already logged into a personal gmail in the same browser
        // doesn't accidentally sign in with the wrong account.
        queryParams: { prompt: 'select_account' },
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
      return;
    }
    // Browser is redirecting to Google; loading state stays visible
    // until the navigation lands.
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.5 }}>
        Admin &amp; staff sign in with the company Google account. Customer
        accounts use the regular sign-in on the main site.
      </p>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '12px 20px', borderRadius: 999,
          background: '#fff', color: '#0a0a0a',
          fontSize: 14, fontWeight: 700, letterSpacing: 0.2,
          border: '1.5px solid #0a0a0a', cursor: loading ? 'wait' : 'pointer',
          fontFamily: 'var(--sans)', marginTop: 8,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <GoogleMark />
        {loading ? 'Redirecting to Google…' : 'Sign in with Google'}
      </button>

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca',
            color: '#991b1b', fontSize: 12, borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width={18} height={18} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-5.9 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.8 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.4 0-9.6-3.5-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6.2 5.2c-.4.4 6.4-4.7 6.4-14.2 0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
