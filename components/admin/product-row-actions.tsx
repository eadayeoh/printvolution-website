'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { toggleProductActive, deleteProduct } from '@/app/admin/products/actions';
import { useRouter } from 'next/navigation';

export function ProductRowActions({ slug, name, isActive }: { slug: string; name: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await toggleProductActive(slug, !isActive);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Delete "${name}"? This removes the product and all its pricing/configurator/FAQs. Cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteProduct(slug);
      if (!result.ok) alert('Failed: ' + result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <Link
        href={`/admin/products/${slug}`}
        className="rounded border border-neutral-200 px-3 py-1 text-[11px] font-bold text-neutral-700 hover:border-pink hover:text-pink"
      >
        Edit
      </Link>
      <button
        onClick={toggle}
        disabled={isPending}
        className="rounded border border-neutral-200 px-3 py-1 text-[11px] font-bold text-neutral-700 hover:border-ink disabled:opacity-50"
      >
        {isActive ? 'Hide' : 'Show'}
      </button>
      <button
        onClick={remove}
        disabled={isPending}
        className="rounded border border-red-200 px-3 py-1 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
