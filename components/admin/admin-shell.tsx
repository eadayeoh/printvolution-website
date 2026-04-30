'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Ticket,
  FileText, LogOut, Layers, ExternalLink, Newspaper, Gift, FolderTree,
  Sparkles, Image as ImageIcon, Settings, UserCircle2, Library, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type Props = {
  userEmail: string;
  userName: string;
  role: string;
  children: React.ReactNode;
};

// Grouped navigation. Flat list of 15 items was the main "eye is all
// over the place" complaint; sections give the admin a mental model
// for where things live. Order inside each group = frequency-of-use,
// most-used at the top.
type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV_GROUPS: Array<{ heading: string | null; items: NavItem[] }> = [
  {
    heading: null,
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/promos', label: 'Promos', icon: Ticket },
      { href: '/admin/members', label: 'Members', icon: Users },
    ],
  },
  {
    heading: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Services', icon: Package },
      { href: '/admin/gifts', label: 'Gifts', icon: Gift },
      { href: '/admin/gifts/templates', label: 'Gift templates', icon: ImageIcon },
      { href: '/admin/gifts/prompts', label: 'AI prompts', icon: Sparkles },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
      { href: '/admin/bundles', label: 'Bundles', icon: Layers },
    ],
  },
  {
    heading: 'Content',
    items: [
      { href: '/admin/blog', label: 'Blog', icon: Newspaper },
      { href: '/admin/pages', label: 'Pages', icon: FileText },
      { href: '/admin/media', label: 'Media library', icon: Library },
    ],
  },
  {
    heading: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/account', label: 'My account', icon: UserCircle2 },
    ],
  },
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
        id="admin-sidebar"
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

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={cn(gi > 0 && 'mt-5')}>
              {group.heading && (
                <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  {group.heading}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
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
              </div>
            </div>
          ))}

          {/* Back to site */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
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

      {/* Click-anywhere-to-close scrim, mobile only when sidebar is open. */}
      {sidebarOpen && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Topbar for mobile */}
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
          <Link href="/admin" className="text-lg font-black text-ink">
            Print<span className="text-pink">volution</span>
          </Link>
          <button
            type="button"
            className="rounded border border-neutral-200 p-2 text-ink hover:border-pink hover:text-pink"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
