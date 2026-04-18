'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/app/admin/products/actions';
import { ImageUpload } from '@/components/admin/image-upload';

type Cat = { id: string; slug: string; name: string; parent_id: string | null };

export function NewProductForm({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [categoryId, setCategoryId] = useState(categories.find((c) => !c.parent_id)?.id ?? '');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  const [isGift, setIsGift] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const topCats = categories.filter((c) => !c.parent_id);
  const subCats = categories.filter((c) => c.parent_id === categoryId);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const result = await createProduct({
        name,
        icon: icon || undefined,
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        is_gift: isGift,
      });
      if (result.ok) {
        router.push(`/admin/products/${result.slug}`);
        router.refresh();
      } else {
        setErr(result.error ?? 'Create failed');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
      <Field label="Product name">
        <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="e.g. Premium Name Card" />
      </Field>
      <Field label="Thumbnail image">
        <ImageUpload value={icon} onChange={setIcon} prefix="product" label="Thumbnail" />
      </Field>
      <Field label="Category">
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(''); }} required className={inputCls}>
          {topCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      {subCats.length > 0 && (
        <Field label="Subcategory (optional)">
          <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className={inputCls}>
            <option value="">— none —</option>
            {subCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
        <span className="font-semibold text-ink">This is a gift/personalised product</span>
      </label>
      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{err}</div>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-pink px-6 py-2 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create product'}
      </button>
      <p className="text-xs text-neutral-500">
        After creating, you&apos;ll edit the pricing, configurator steps, FAQs, and SEO content.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  // <div>, not <label>: nested label swallows file-input change events
  // when children include an ImageUpload.
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-bold text-ink">{label}</span>
      {children}
    </div>
  );
}
const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
