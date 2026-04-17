import Link from 'next/link';
import { AccountLoginForm } from '@/components/account/account-login-form';

export const metadata = { title: 'Sign in' };

export default function CustomerLoginPage() {
  return (
    <main style={{ maxWidth: 460, margin: '0 auto', padding: '56px 24px 80px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 10 }}>
        Account
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.05 }}>
        Sign in to your account.
      </h1>
      <p style={{ color: '#666', fontSize: 14, margin: '0 0 28px' }}>
        Track orders, reorder past jobs, redeem points. New here? <Link href="/account/signup" style={{ color: '#E91E8C', fontWeight: 700 }}>Create an account →</Link>
      </p>
      <AccountLoginForm />
    </main>
  );
}
