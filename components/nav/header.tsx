'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, ShoppingCart, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Print', type: 'dropdown' as const, key: 'print' },
  { label: 'Gifts', type: 'dropdown' as const, key: 'gifts' },
  { label: 'Bundles', href: '/bundles' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-[62px] items-center justify-between border-b border-neutral-200 bg-white/95 px-7 backdrop-blur-md">
        <Link href="/" className="text-[20px] font-black tracking-tight text-ink">
          Print<span className="text-pink">volution</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((item) =>
            item.type === 'dropdown' ? (
              <button
                key={item.label}
                className={cn(
                  'nav-lnk rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-700 transition-colors hover:text-pink',
                  openMega === item.key && 'text-pink'
                )}
                onMouseEnter={() => setOpenMega(item.key!)}
                onClick={() => setOpenMega(openMega === item.key ? null : item.key!)}
              >
                {item.label} ▾
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-700 transition-colors hover:text-pink"
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-pink-dark"
          >
            <ShoppingCart size={14} />
            Cart
          </Link>
          <Link
            href="/admin"
            className="hidden h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200 lg:flex"
            aria-label="Admin"
          >
            <Settings size={14} />
          </Link>
          <button
            className="flex h-9 w-9 items-center justify-center text-ink lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[62px] z-40 border-b border-neutral-200 bg-white shadow-lg lg:hidden">
          <div className="flex flex-col py-4">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href ?? '/shop'}
                className="px-6 py-3 text-sm font-semibold text-ink hover:bg-neutral-50"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Spacer so content doesn't sit under fixed nav */}
      <div className="h-[62px]" aria-hidden />
    </>
  );
}
