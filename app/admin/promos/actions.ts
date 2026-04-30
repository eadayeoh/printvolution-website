'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, createServiceClient as adminClient } from '@/lib/auth/require-admin';
import { logAdminAction } from '@/lib/auth/admin-audit';

const CouponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(2).max(40),
  type: z.enum(['pct', 'flat']),
  percent: z.number().int().min(0).max(100).optional().nullable(),
  value_cents: z.number().int().nonnegative().optional().nullable(),
  min_spend_cents: z.number().int().nonnegative(),
  max_uses: z.number().int().nonnegative().nullable(),
  expires_at: z.string().nullable(),
  is_active: z.boolean(),
});

export async function saveCoupon(input: z.infer<typeof CouponSchema>) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const parsed = CouponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const sb = adminClient();

  const row = {
    code: d.code.toUpperCase().trim(),
    type: d.type,
    percent: d.type === 'pct' ? d.percent : null,
    value_cents: d.type === 'flat' ? d.value_cents : null,
    min_spend_cents: d.min_spend_cents,
    max_uses: d.max_uses,
    expires_at: d.expires_at,
    is_active: d.is_active,
  };

  // Guard: if admin lowers max_uses below the current uses_count
  // the coupon flips inactive (validateCoupon's max_uses check
  // returns "Not a valid code"). Customers see a generic failure
  // and the admin doesn't know they nuked an in-flight coupon.
  // Reject the change with a clear message instead.
  if (d.id && row.max_uses !== null) {
    const { data: existing } = await sb
      .from('coupons')
      .select('uses_count')
      .eq('id', d.id)
      .maybeSingle();
    const used = (existing?.uses_count as number | null) ?? 0;
    if (typeof row.max_uses === 'number' && row.max_uses < used) {
      return {
        ok: false,
        error: `Cannot lower Max uses below the current redemption count (${used}). Disable the coupon instead, or set Max uses ≥ ${used}.`,
      };
    }
  }

  const { error } = d.id
    ? await sb.from('coupons').update(row).eq('id', d.id)
    : await sb.from('coupons').insert({ ...row, uses_count: 0 });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/promos');
  return { ok: true };
}

export async function deleteCoupon(id: string) {
  let actor;
  try { actor = (await requireAdmin()).actor; } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();
  const { error } = await sb.from('coupons').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logAdminAction(actor, { action: 'coupon.delete', targetType: 'coupon', targetId: id });
  revalidatePath('/admin/promos');
  return { ok: true };
}

const RuleSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['min_spend', 'min_qty']),
  trigger_value: z.number().int().nonnegative(),  // cents for min_spend, count for min_qty
  reward_type: z.enum(['pct', 'flat']),
  reward_value: z.number().int().nonnegative(),   // 1-100 for pct, cents for flat
  label: z.string().nullable(),
  is_active: z.boolean(),
});

export async function saveRule(input: z.infer<typeof RuleSchema>) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const parsed = RuleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const sb = adminClient();

  const row = {
    type: d.type,
    trigger_value: d.trigger_value,
    reward_type: d.reward_type,
    reward_value: d.reward_value,
    label: d.label,
    is_active: d.is_active,
  };

  const { error } = d.id
    ? await sb.from('discount_rules').update(row).eq('id', d.id)
    : await sb.from('discount_rules').insert(row);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/promos');
  return { ok: true };
}

export async function deleteRule(id: string) {
  let actor;
  try { actor = (await requireAdmin()).actor; } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();
  const { error } = await sb.from('discount_rules').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logAdminAction(actor, { action: 'rule.delete', targetType: 'discount_rule', targetId: id });
  revalidatePath('/admin/promos');
  return { ok: true };
}
