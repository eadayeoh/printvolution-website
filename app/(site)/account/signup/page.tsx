import Link from 'next/link';
import { AccountSignupForm } from '@/components/account/account-signup-form';

export const metadata = { title: 'Create account' };

export default function CustomerSignupPage() {
  return (
    <main style={{ maxWidth: 460, margin: '0 auto', padding: '56px 24px 80px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 10 }}>
        Account
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.05 }}>
        Create your account.
      </h1>
      <p style={{ color: '#666', fontSize: 14, margin: '0 0 28px' }}>
        Track orders, save your details for faster checkout, earn points on every order. Already have an account? <Link href="/account/login" style={{ color: '#E91E8C', fontWeight: 700 }}>Sign in →</Link>
      </p>
      <AccountSignupForm />
    </main>
  );
}
