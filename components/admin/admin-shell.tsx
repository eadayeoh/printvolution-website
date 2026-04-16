'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Ticket,
  FileText, LogOut, Layers, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type Props = {
  userEmail: string;
  userName: string;
  role: string;
  children: React.ReactNode;
};

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/bundles', label: 'Bundles', icon: Layers },
  { href: '/admin/pages', label: 'Pages', icon: FileText },
  { href: '/admin/promos', label: 'Promos', icon: Ticket },
  { href: '/admin/members', label: 'Members', icon: Users },
];

export function AdminShell({ userEmail, userName, role, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-neutral-200 bg-ink text-white transition-transform lg:static lg:flex lg:translate-x-0',
          sidebarOpen ? 'flex translate-x-0' : 'hidden -translate-x-full lg:flex'
        )}
      >
        <div className="border-b border-white/10 px-6 py-5">
          <Link href="/" className="text-lg font-black">
            Print<span className="text-pink">volution</span>
          </Link>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-pink">
            {role === 'admin' ? 'Admin Panel' : 'Staff Panel'}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded px-3 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-pink text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}

          {/* Back to site */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded px-3 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-pink"
              title="Opens site in a new tab"
            >
              <ExternalLink size={16} />
              View live site
            </Link>
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-2 text-xs font-semibold text-white/80">{userName || userEmail}</div>
          <div className="mb-3 truncate text-[11px] text-white/40">{userEmail}</div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded border border-white/20 py-2 text-xs font-semibold text-white/70 transition-colors hover:border-pink hover:text-pink"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Topbar for mobile */}
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
          <Link href="/admin" className="text-lg font-black text-ink">
            Print<span className="text-pink">volution</span>
          </Link>
          <button
            className="rounded border border-neutral-200 p-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="mt-1 block h-0.5 w-5 bg-ink" />
            <span className="mt-1 block h-0.5 w-5 bg-ink" />
          </button>
        </header>

        <main className="flex-1 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
