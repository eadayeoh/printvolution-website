import { LoginForm } from '@/components/auth/login-form';
import { Suspense } from 'react';
import Link from 'next/link';

export const metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="cmyk-bar absolute inset-x-0 top-0" />
      <Link href="/" className="mb-8 text-2xl font-black text-ink">
        Print<span className="text-pink">volution</span>
      </Link>

      <div className="w-full max-w-sm rounded-lg border-2 border-ink bg-white p-8 shadow-brand">
        <h1 className="mb-1 text-2xl font-black text-ink">Sign in</h1>
        <p className="mb-6 text-sm text-neutral-500">Admin &amp; staff access</p>

        <Suspense>
          <LoginForm />
        </Suspense>

        <div className="mt-6 border-t border-neutral-200 pt-4 text-center text-xs text-neutral-400">
          Not an admin?{' '}
          <Link href="/" className="font-semibold text-pink hover:underline">
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
