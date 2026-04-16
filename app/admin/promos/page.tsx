import { createClient } from '@/lib/supabase/server';
import { PromosEditor } from '@/components/admin/promos-editor';

export const metadata = { title: 'Promos & Coupons' };

export default async function AdminPromos() {
  const supabase = createClient();
  const [coupons, rules] = await Promise.all([
    supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    supabase.from('discount_rules').select('*').order('created_at', { ascending: false }),
  ]);
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">Promos &amp; Coupons</h1>
        <p className="text-sm text-neutral-500">Coupon codes customers enter + automatic cart-level rules.</p>
      </div>
      <PromosEditor
        coupons={((coupons.data ?? []) as any[])}
        rules={((rules.data ?? []) as any[])}
      />
    </div>
  );
}
