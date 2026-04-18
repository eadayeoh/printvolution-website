'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteMember } from '@/app/admin/members/actions';

export function MemberDeleteButton({ memberId, label }: { memberId: string; label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function confirmAndDelete() {
    if (!confirm(`Delete member "${label}"? Their points history will be lost. This can't be undone.`)) return;
    startTransition(async () => {
      const r = await deleteMember(memberId);
      if (!r.ok) { alert(r.error); return; }
      router.push('/admin/members');
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={confirmAndDelete}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-full border-2 border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
      Delete member
    </button>
  );
}
