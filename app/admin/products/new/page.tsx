import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NewProductForm } from '@/components/admin/new-product-form';

export const metadata = { title: 'New Product' };

export default async function NewProductPage() {
  const supabase = createClient();
  const { data: cats } = await supabase
    .from('categories')
    .select('id, slug, name, parent_id')
    .order('display_order');
  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/products" className="mb-4 inline-flex items-center text-xs font-bold text-pink hover:underline">
        ← Back to products
      </Link>
      <h1 className="mb-6 text-2xl font-black text-ink">New product</h1>
      <NewProductForm categories={((cats ?? []) as any[])} />
    </div>
  );
}
