import 'server-only';
import { createServiceClient } from '@/lib/auth/require-admin';
import { getClientIp } from '@/lib/rate-limit';
import { headers } from 'next/headers';

/**
 * Record a destructive / privileged admin action in the admin_audit
 * table. Best-effort — if the insert fails we log a warning but never
 * block the caller's action, because losing one audit row is less bad
 * than refusing a legitimate staff operation.
 *
 * The caller should already be past requireAdmin(), so we trust the
 * actor info from that call. Pass `actor: { id, email, role }` in.
 *
 * Convention for `action`: `<subject>.<verb>`
 *   order.delete, order.status_update, order.refund
 *   product.delete, product.create, product.update, product.toggle_active
 *   bundle.delete, bundle.create, bundle.update
 *   blog.delete, blog.bulk_delete, blog.import
 *   coupon.delete, rule.delete
 *   nav.save, mega_menu.save
 *   settings.update
 *   user.role_change, user.delete
 */
export type AuditActor = {
  id: string | null;
  email: string | null;
  role: 'admin' | 'staff' | null;
};

export type AuditLogInput = {
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

export async function logAdminAction(actor: AuditActor, entry: AuditLogInput): Promise<void> {
  try {
    const sb = createServiceClient();
    const h = headers();
    const ua = (h.get('user-agent') ?? '').slice(0, 500);
    const ip = getClientIp();
    await sb.from('admin_audit').insert({
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
      ip,
      user_agent: ua,
    });
  } catch {
    // Swallow — we never fail an action because the audit write failed.
    // The warning lands in the Vercel function log, which is enough.
    console.warn('[audit] failed to record admin action');
  }
}
