import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProductBySlug } from '@/lib/data/products';
import { ProductEditor } from '@/components/admin/product-editor';

export const metadata = { title: 'Edit Product' };

export default async function EditProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const supabase = createClient();
  const { data: cats } = await supabase
    .from('categories')
    .select('id, slug, name, parent_id')
    .order('display_order');

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/products" className="mb-4 inline-flex items-center text-xs font-bold text-pink hover:underline">
        ← All products
      </Link>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{product.icon ?? '📦'}</span>
          <div>
            <h1 className="text-2xl font-black text-ink">{product.name}</h1>
            <div className="text-xs text-neutral-500">
              {product.slug} · {product.category?.name ?? 'no category'}
            </div>
          </div>
        </div>
      </div>
      <ProductEditor product={product} categories={((cats ?? []) as any[])} />
    </div>
  );
}
