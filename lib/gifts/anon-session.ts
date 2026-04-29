import 'server-only';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const COOKIE_NAME = 'pv_anon_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Read the anon session id, or mint and set a new one. Used as one of
 * the layered keys for gift-generation quota tracking — gives us a
 * stable per-browser identifier on top of per-IP rate limiting.
 *
 * Note: cookies().set() only persists when called from a Server
 * Action or Route Handler context (Next.js sends a Set-Cookie header
 * on the response). Server Components that try to set will throw —
 * read with getAnonSessionId there instead.
 */
export function getOrSetAnonSessionId(): string {
  const c = cookies();
  const existing = c.get(COOKIE_NAME)?.value;
  if (existing) return existing;
  const id = randomUUID();
  try {
    c.set(COOKIE_NAME, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  } catch {
    // Server Component context — set will throw. Caller will get the
    // generated id back, but the browser won't see it on the next
    // request. The next call from a Server Action / Route Handler
    // will mint and persist.
  }
  return id;
}

/** Read-only — never sets. Use from Server Components. */
export function getAnonSessionId(): string | null {
  return cookies().get(COOKIE_NAME)?.value ?? null;
}
