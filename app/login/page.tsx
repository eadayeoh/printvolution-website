import { LoginForm } from '@/components/auth/login-form';
import { Suspense } from 'react';
import Link from 'next/link';

export const metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#fafaf7',
      backgroundImage: 'radial-gradient(circle, #e8e4dc 1.2px, transparent 1.2px)',
      backgroundSize: '22px 22px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24,
    }}>
      <Link href="/" style={{
        marginTop: 48, marginBottom: 32,
        fontSize: 24, fontWeight: 800, color: '#0a0a0a', textDecoration: 'none',
      }}>
        Print<span style={{ color: '#E91E8C' }}>volution</span>
      </Link>

      <div className="pv-login-box">
        <h1>Sign in</h1>
        <p className="sub">Admin &amp; staff access</p>

        <Suspense>
          <LoginForm />
        </Suspense>

        <div style={{
          marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee',
          fontSize: 11, color: '#aaa', textAlign: 'center',
        }}>
          Not an admin?{' '}
          <Link href="/" style={{ fontWeight: 700, color: '#E91E8C', textDecoration: 'none' }}>
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
