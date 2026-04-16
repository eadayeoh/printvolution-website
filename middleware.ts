import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Only run middleware on routes that need auth session refresh.
     * Skip: static assets, API routes, public pages that don't need auth.
     */
    '/admin/:path*',
    '/staff/:path*',
    '/login',
  ],
};
