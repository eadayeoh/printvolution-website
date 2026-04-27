// app/api/admin/_sentry-test/route.ts — TEMPORARY. Delete after verifying.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  try { await requireAdmin(); } catch (e: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Throw inside a server route so Sentry catches it via auto-instrumentation.
  throw new Error('Sentry verification: this should appear in the dashboard.');
}
