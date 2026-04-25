'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Copy } from 'lucide-react';
import { duplicateTemplate } from '@/app/admin/gifts/actions';

export function GiftTemplateDuplicateButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      title={`Duplicate "${name}"`}
      aria-label={`Duplicate ${name}`}
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setBusy(true);
        const r = await duplicateTemplate(id);
        if (!r.ok) {
          alert(r.error ?? 'Duplicate failed');
          setBusy(false);
          return;
        }
        router.push(`/admin/gifts/templates/${r.id}`);
      }}
      className="absolute right-2 top-2 z-10 inline-flex items-center justify-center rounded-full bg-white/95 p-1.5 text-neutral-700 shadow-sm ring-1 ring-neutral-200 hover:bg-white hover:text-pink disabled:opacity-50"
    >
      <Copy size={13} />
    </button>
  );
}
