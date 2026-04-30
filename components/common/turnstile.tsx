'use client';

// Cloudflare Turnstile widget wrapper.
//
// Loads the Turnstile script once per page, renders a widget into
// a div, and hands the resulting token back via onVerify. Parent
// components pass the token along with the form submission so the
// server can verify it via lib/captcha.ts.
//
// Defaults to Cloudflare's always-passing test site key when the env
// var is missing, so the site keeps working before the account is
// provisioned. Swap to a real key by setting NEXT_PUBLIC_TURNSTILE_SITE_KEY
// in .env.local (see .env.local.example).

import { useEffect, useRef } from 'react';

// Always-passing test key published by Cloudflare. Safe to commit.
const TEST_SITE_KEY = '1x00000000000000000000AA';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'invisible';
          appearance?: 'always' | 'execute' | 'interaction-only';
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
    __pvTurnstileScriptAdded?: boolean;
  }
}

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__pvTurnstileScriptAdded) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.turnstile) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }
  window.__pvTurnstileScriptAdded = true;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Turnstile'));
    document.head.appendChild(s);
  });
}

type Props = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
};

export function Turnstile({
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Cloudflare site keys are domain-bound. The configured site key
    // is only valid on printvolution.sg, so previews / vercel.app
    // hosts / localhost would fail to render with "invalid sitekey".
    // Detect at runtime and fall back to the always-passing test key
    // on non-production hostnames — server-side `verifyTurnstile`
    // still hard-fails on missing TURNSTILE_SECRET_KEY in real prod,
    // so we're not weakening the canonical domain.
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const isCanonical = host === 'printvolution.sg' || host === 'www.printvolution.sg';
    const configured = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const siteKey = isCanonical && configured ? configured : TEST_SITE_KEY;

    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme,
          callback: (token) => onVerify(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onError?.(),
        });
      })
      .catch(() => onError?.());

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore — widget may have already unmounted */
        }
        widgetId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className={className} style={{ minHeight: 65 }} />;
}
