import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Refreshes the Supabase auth session cookie on every request.
 * Called from root middleware.ts. Must never throw — if anything goes wrong
 * (missing env, Supabase down, network blip), just pass the request through.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env isn't configured yet, don't crash — just pass through
  if (!url || !key) return response;

  try {
    const supabase = createServerClient<Database>(url, key, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    // Guard /admin and /staff routes
    const { pathname } = request.nextUrl;
    if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) {
      if (!user && pathname !== '/admin/login' && pathname !== '/staff/login') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (err) {
    // Log but don't break the site. Middleware errors should never 500.
    console.error('Middleware error:', err);
  }

  return response;
}
