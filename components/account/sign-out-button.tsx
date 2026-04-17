'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => {
        await createClient().auth.signOut();
        router.push('/');
        router.refresh();
      })}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-full border-2 border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-ink hover:border-ink disabled:opacity-50"
    >
      <LogOut size={14} /> {isPending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
