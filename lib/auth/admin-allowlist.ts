import 'server-only';

/** Email → role allow-list for the admin/staff dashboard. Anyone
 *  signing in via Google OAuth whose email isn't in this map is
 *  signed out immediately at /auth/callback. To grant access, add
 *  the email here, deploy, and have the user sign in once — the
 *  callback upserts their profile row with the role. */
export const ADMIN_EMAIL_ROLES = {
  'multipleaddictions@gmail.com': 'admin',
  'printvolution@gmail.com':      'staff',
} as const satisfies Record<string, 'admin' | 'staff'>;

export type AdminRole = 'admin' | 'staff';

export function roleForEmail(email: string | null | undefined): AdminRole | null {
  if (!email) return null;
  const key = email.trim().toLowerCase() as keyof typeof ADMIN_EMAIL_ROLES;
  return (ADMIN_EMAIL_ROLES[key] ?? null) as AdminRole | null;
}
