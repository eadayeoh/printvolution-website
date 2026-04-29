'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/auth/require-admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/captcha';

/**
 * Rate-limited login + signup.
 *
 * Two keys per action — an IP key (stops one attacker spraying many
 * emails) and an email key (stops credential-stuffing a single account
 * from a botnet of IPs). Both must pass; either tripping blocks.
 */

const LOGIN_IP_WINDOW = 600;  // 10 min
const LOGIN_IP_MAX = 12;
const LOGIN_EMAIL_WINDOW = 900;  // 15 min
const LOGIN_EMAIL_MAX = 6;

const SIGNUP_IP_WINDOW = 3600;  // 1 h
const SIGNUP_IP_MAX = 6;

export async function loginWithPassword(input: { email: string; password: string; captchaToken?: string | null }) {
  const email = (input.email ?? '').trim().toLowerCase();
  const password = input.password ?? '';
  if (!email || !password) return { ok: false as const, error: 'Email and password required' };
  if (email.length > 200 || password.length > 200) {
    return { ok: false as const, error: 'Invalid input' };
  }

  const ip = getClientIp();
  const captcha = await verifyTurnstile(input.captchaToken ?? null, ip);
  if (!captcha.ok) {
    return { ok: false as const, error: captcha.error ?? 'Captcha check failed' };
  }

  const ipRl = await checkRateLimit(`login-ip:${ip}`, { max: LOGIN_IP_MAX, windowSeconds: LOGIN_IP_WINDOW });
  if (!ipRl.allowed) {
    return { ok: false as const, error: `Too many attempts. Try again in ${ipRl.retryAfterSeconds}s.` };
  }
  const emailRl = await checkRateLimit(`login-email:${email}`, { max: LOGIN_EMAIL_MAX, windowSeconds: LOGIN_EMAIL_WINDOW });
  if (!emailRl.allowed) {
    // Intentionally vague — don't confirm the email exists.
    return { ok: false as const, error: 'Too many attempts for this account. Try again later.' };
  }

  const sb = createClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    // Generic message — don't leak whether the account exists.
    return { ok: false as const, error: 'Invalid email or password' };
  }
  // Backfill any anon gift generations onto the user_id so the weekly
  // quota survives the conversion (anon used 3 → user has 5 left).
  if (data?.user?.id) {
    try {
      const { claimAnonGiftCreditsAfterLogin } = await import('@/app/login/actions');
      await claimAnonGiftCreditsAfterLogin(data.user.id);
    } catch { /* non-fatal */ }
  }
  return { ok: true as const };
}

export async function signUpWithPassword(input: { email: string; password: string; name?: string | null; captchaToken?: string | null }) {
  const email = (input.email ?? '').trim().toLowerCase();
  const password = input.password ?? '';
  const name = (input.name ?? '').trim().slice(0, 100) || null;

  if (!email || !password) return { ok: false as const, error: 'Email and password required' };
  if (password.length < 8) return { ok: false as const, error: 'Password must be at least 8 characters' };
  if (password.length > 200) return { ok: false as const, error: 'Password too long' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false as const, error: 'Invalid email' };

  const ip = getClientIp();
  const captcha = await verifyTurnstile(input.captchaToken ?? null, ip);
  if (!captcha.ok) {
    return { ok: false as const, error: captcha.error ?? 'Captcha check failed' };
  }

  const rl = await checkRateLimit(`signup-ip:${ip}`, { max: SIGNUP_IP_MAX, windowSeconds: SIGNUP_IP_WINDOW });
  if (!rl.allowed) {
    return { ok: false as const, error: `Too many signups. Try again in ${rl.retryAfterSeconds}s.` };
  }

  const sb = createClient();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: name ? { full_name: name } : undefined },
  });
  if (error) {
    // Generic message — don't confirm whether the email is registered.
    return { ok: false as const, error: 'Could not create account' };
  }
  // Backfill anon gift generations onto the new user_id so they don't
  // get a fresh 8 after burning their 3 anon credits.
  if (data?.user?.id) {
    try {
      const { claimAnonGiftCreditsAfterLogin } = await import('@/app/login/actions');
      await claimAnonGiftCreditsAfterLogin(data.user.id);
    } catch { /* non-fatal */ }
  }

  // Background welcome email — registered via Vercel's waitUntil so the
  // function is allowed to finish after the response is flushed. A bare
  // `void (async () => ...)()` would be killed on serverless.
  const { waitUntil } = await import('@vercel/functions');
  waitUntil((async () => {
    try {
      const { sendEmail, welcomeEmail } = await import('@/lib/email');
      const m = welcomeEmail(email, name);
      await sendEmail({ to: email, subject: m.subject, html: m.html });
    } catch (e) {
      const { reportError } = await import('@/lib/observability');
      reportError(e, { route: 'account.signup', action: 'welcome_email' });
    }
  })());

  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Signed-in profile management
// ---------------------------------------------------------------------------

/**
 * Update the logged-in user's display profile. Writes to public.profiles
 * (auth-linked) and mirrors name/phone onto public.members (email-keyed
 * loyalty record) so the two stay in sync.
 *
 * RLS + the profiles_block_privileged_update trigger together enforce
 * that role and admin_notes can never be touched through this action.
 */
export type ProfileInput = {
  name: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  country?: string;
  company?: string;
  telegram?: string;
  line_id?: string;
  wechat?: string;
  date_of_birth?: string | null;   // ISO yyyy-mm-dd or null
  marketing_opt_in?: boolean;
  referral_source?: string;
};

const trimOrNull = (v: string | undefined, max: number) => {
  const s = (v ?? '').trim();
  if (!s) return null;
  return s.slice(0, max);
};

export async function updateMyProfile(input: ProfileInput) {
  const name = (input.name ?? '').trim().slice(0, 100);
  if (!name) return { ok: false as const, error: 'Name is required' };

  // Light validation: postal code is digits, DOB is sane, telegram
  // handle doesn't include spaces. Everything else is free text.
  const postal = trimOrNull(input.postal_code, 12);
  if (postal && !/^[A-Za-z0-9\s-]{3,12}$/.test(postal)) {
    return { ok: false as const, error: 'Postal code looks invalid' };
  }
  const dob = input.date_of_birth ? input.date_of_birth.trim() : null;
  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return { ok: false as const, error: 'Date of birth must be YYYY-MM-DD' };
  }
  if (dob) {
    const t = Date.parse(dob);
    if (Number.isNaN(t) || t > Date.now()) {
      return { ok: false as const, error: 'Date of birth cannot be in the future' };
    }
  }

  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };

  const patch = {
    name,
    phone: trimOrNull(input.phone, 30),
    address_line1: trimOrNull(input.address_line1, 200),
    address_line2: trimOrNull(input.address_line2, 200),
    postal_code: postal,
    country: trimOrNull(input.country, 60) ?? 'SG',
    company: trimOrNull(input.company, 120),
    telegram: trimOrNull(input.telegram, 80),
    line_id: trimOrNull(input.line_id, 80),
    wechat: trimOrNull(input.wechat, 80),
    date_of_birth: dob || null,
    marketing_opt_in: !!input.marketing_opt_in,
    referral_source: trimOrNull(input.referral_source, 120),
  };

  // Update profile under user's own session (RLS + trigger enforced).
  const { error: profErr } = await sb.from('profiles').update(patch).eq('id', user.id);
  if (profErr) return { ok: false as const, error: 'Could not save profile' };

  // Mirror name/phone onto members (email match) so shipping labels
  // stay correct if the customer updates their details. Points/tier
  // are guarded by the DB trigger.
  if (user.email) {
    const svc = createServiceClient();
    await svc
      .from('members')
      .update({ name, phone: patch.phone })
      .eq('email', user.email);
  }

  revalidatePath('/account');
  revalidatePath('/account/profile');
  revalidatePath('/admin/account');
  return { ok: true as const };
}

/**
 * Change the logged-in user's password. Supabase requires the user to
 * be authenticated for this action, and re-verifies the current
 * password by re-signing them in before calling updateUser(). If
 * re-auth fails we return a generic error and do NOT attempt the
 * password change.
 *
 * Rate-limited per user to slow password-reset abuse from a session
 * whose cookie has been lifted.
 */
export async function changeMyPassword(input: { currentPassword: string; newPassword: string }) {
  const current = input.currentPassword ?? '';
  const next = input.newPassword ?? '';
  if (!current || !next) return { ok: false as const, error: 'Both passwords required' };
  if (next.length < 8) return { ok: false as const, error: 'New password must be at least 8 characters' };
  if (next.length > 200) return { ok: false as const, error: 'Password too long' };
  if (next === current) return { ok: false as const, error: 'New password must differ from current' };

  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !user.email) return { ok: false as const, error: 'Not signed in' };

  const rl = await checkRateLimit(`password-change:${user.id}`, { max: 5, windowSeconds: 900 });
  if (!rl.allowed) {
    return { ok: false as const, error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` };
  }

  // Re-verify identity with the current password. Supabase's
  // signInWithPassword on an already-signed-in client refreshes the
  // session if the password matches and throws otherwise.
  // Side effect: this rotates the refresh token and invalidates other
  // device sessions — the form UI surfaces this warning to the user.
  const { error: reAuthErr } = await sb.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (reAuthErr) {
    return { ok: false as const, error: 'Current password is incorrect' };
  }

  const { error: updErr } = await sb.auth.updateUser({ password: next });
  if (updErr) {
    return { ok: false as const, error: 'Could not update password' };
  }
  return { ok: true as const };
}

// Reorder: pull a past order's PRINT line items back as cart-shaped
// rows. Gift items aren't reorderable directly — they reference
// uploaded photos + AI-generated previews that may have been purged
// after the source-retention window. Customers re-create those via
// the gift configurator. PRINT items are stateless and can replay.
export type ReorderItem = {
  product_slug: string;
  product_name: string;
  icon: string | null;
  config: Record<string, string>;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  personalisation_notes?: string;
  gift_image_url?: string;
};

export async function reorderPastOrder(orderId: string): Promise<
  | { ok: true; items: ReorderItem[]; gift_count: number }
  | { ok: false; error: string }
> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in to reorder.' };
  if (!user.email) return { ok: false, error: 'Account email missing — contact support.' };

  const rl = await checkRateLimit(`reorder:${user.id}`, { max: 20, windowSeconds: 600 });
  if (!rl.allowed) return { ok: false, error: `Too many tries — wait ${rl.retryAfterSeconds}s.` };

  // Single message for missing-order vs not-yours so an attacker can't
  // probe order id existence by comparing error strings.
  const NOT_FOUND = "We couldn't find that order on your account.";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    return { ok: false, error: NOT_FOUND };
  }

  const { data: order } = await sb
    .from('orders')
    .select('id, email')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: NOT_FOUND };
  if ((order.email ?? '').toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: NOT_FOUND };
  }

  // Items + gift count in parallel — both are independent of each other.
  const [itemsRes, giftCountRes] = await Promise.all([
    sb
      .from('order_items')
      .select('product_slug, product_name, icon, config, qty, unit_price_cents, line_total_cents, personalisation_notes')
      .eq('order_id', orderId),
    sb
      .from('gift_order_items')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId),
  ]);

  const items = (itemsRes.data ?? []) as any[];
  const slugs = Array.from(new Set(items.map((i) => i.product_slug).filter(Boolean)));
  let active = new Set<string>();
  if (slugs.length) {
    const { data: prods } = await sb
      .from('products')
      .select('slug')
      .in('slug', slugs)
      .eq('is_active', true);
    active = new Set(((prods ?? []) as any[]).map((p) => p.slug));
  }

  const reorderItems: ReorderItem[] = items
    .filter((i) => active.has(i.product_slug))
    .map((i) => ({
      product_slug: i.product_slug,
      product_name: i.product_name,
      icon: i.icon,
      config: i.config ?? {},
      qty: i.qty,
      unit_price_cents: i.unit_price_cents,
      line_total_cents: i.line_total_cents,
      personalisation_notes: i.personalisation_notes ?? undefined,
    }));

  return { ok: true, items: reorderItems, gift_count: giftCountRes.count ?? 0 };
}
