'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function StaffSignOut() {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }
  return (
    <button onClick={signOut} className="flex items-center gap-1 rounded border border-white/20 px-3 py-1 text-[11px] font-bold text-white/80 hover:border-pink hover:text-pink">
      <LogOut size={12} /> Sign out
    </button>
  );
}
