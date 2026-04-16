'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Menu, ShoppingCart, Settings, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import type { NavItem, MegaMenuSection, ProductLookup } from '@/lib/data/navigation-types';
import { productHref } from '@/lib/data/navigation-types';

type Props = {
  nav: NavItem[];
  mega: Record<string, MegaMenuSection[]>;
  productRoutes: ProductLookup;
};

export function HeaderClient({ nav, mega, productRoutes }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function openKey(key: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMega(key);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMega(null), 200);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  // Extra standalone links we always want available
  const extraLinks = [{ label: 'Blog', href: '/blog' }];

  return (
    <>
      {/* Top CMYK accent stripe — brand identity signature */}
      <div className="fixed left-0 right-0 top-0 z-[51] grid h-[3px] grid-cols-4">
        <div className="bg-cyan-400" />
        <div className="bg-pink" />
        <div className="bg-yellow-300" />
        <div className="bg-ink" />
      </div>

      <nav className="fixed left-0 right-0 top-[3px] z-50 h-[64px] border-b border-white/5 bg-ink text-white">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-[22px] font-black tracking-tight">
            <span className="text-white">Print</span>
            <span className="-ml-2 text-pink">volution</span>
          </Link>

          {/* Desktop nav */}
          <div
            className="relative hidden items-center gap-0.5 lg:flex"
            onMouseLeave={scheduleClose}
            onMouseEnter={cancelClose}
          >
            {nav.map((item, i) => {
              if (item.type === 'sep') {
                return <span key={i} className="mx-2 h-4 w-px bg-white/15" />;
              }
              if (item.type === 'dropdown' && item.mega_key) {
                const key = item.mega_key;
                const active = openMega === key;
                return (
                  <button
                    key={i}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-4 py-2 text-[13px] font-bold uppercase tracking-wide transition-colors',
                      active ? 'bg-pink text-white' : 'text-white/80 hover:text-white'
                    )}
                    onMouseEnter={() => openKey(key)}
                    onClick={() => setOpenMega(openMega === key ? null : key)}
                  >
                    {item.label}
                    <ChevronDown size={13} className={cn('transition-transform', active && 'rotate-180')} />
                  </button>
                );
              }
              return (
                <Link
                  key={i}
                  href={mapAction(item.action) ?? '/shop'}
                  className="rounded-full px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-white/80 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              );
            })}
            {extraLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-white/80 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-2 rounded-full bg-pink px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_-6px_rgba(233,30,140,0.55)] transition-colors hover:bg-pink-dark"
            >
              <ShoppingCart size={14} />
              Cart
              {mounted && count > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-black text-pink">
                  {count}
                </span>
              )}
            </Link>
            <Link
              href="/admin"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/40 hover:text-white lg:inline-flex"
              aria-label="Admin"
            >
              <Settings size={14} />
            </Link>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mega menu (desktop) — dark panel to match the header */}
      {openMega && mega[openMega] && (
        <div
          className="fixed left-0 right-0 top-[67px] z-40 hidden border-b border-white/5 bg-ink text-white shadow-2xl lg:block"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{ paddingTop: 2 }}
        >
          <div className="mx-auto max-w-[1400px] px-8 py-10">
            <div
              className="grid gap-10"
              style={{ gridTemplateColumns: `repeat(${Math.min(mega[openMega].length, 4)}, minmax(0, 1fr))` }}
            >
              {mega[openMega].map((section) => (
                <div key={section.id}>
                  <h4 className="mb-4 border-b border-white/10 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-pink">
                    {section.section_heading}
                  </h4>
                  <ul className="space-y-2.5">
                    {section.items.map((it) => (
                      <li key={it.product_slug}>
                        <Link
                          href={productHref(it.product_slug, productRoutes)}
                          onClick={() => setOpenMega(null)}
                          className="group flex items-center gap-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white"
                        >
                          <span className="h-1 w-1 rounded-full bg-pink/0 transition-colors group-hover:bg-pink" />
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer — dark to match */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[67px] z-40 max-h-[calc(100vh-67px)] overflow-y-auto border-b border-white/5 bg-ink text-white lg:hidden">
          <div className="flex flex-col py-4">
            {nav.map((item, i) => {
              if (item.type === 'sep') return <div key={i} className="my-2 mx-6 border-t border-white/10" />;
              if (item.type === 'dropdown' && item.mega_key) {
                return (
                  <div key={i} className="px-6 py-2">
                    <div className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-pink">{item.label}</div>
                    {mega[item.mega_key]?.map((section) => (
                      <div key={section.id} className="mb-3">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                          {section.section_heading}
                        </div>
                        <ul className="space-y-1">
                          {section.items.slice(0, 8).map((it) => (
                            <li key={it.product_slug}>
                              <Link
                                href={productHref(it.product_slug, productRoutes)}
                                onClick={() => setMobileOpen(false)}
                                className="block py-1.5 text-[13px] font-medium text-white/75 hover:text-white"
                              >
                                {it.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <Link
                  key={i}
                  href={mapAction(item.action) ?? '/shop'}
                  className="px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-white/90 hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            {extraLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-white/90 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Spacer for 3px stripe + 64px nav */}
      <div className="h-[67px]" aria-hidden />
    </>
  );
}

function mapAction(action: string | null): string | null {
  if (!action) return null;
  if (action.startsWith('/')) return action;
  const m = action.match(/go\(['"]([^'"]+)['"]\)/);
  if (m) {
    const key = m[1];
    const map: Record<string, string> = {
      home: '/', shop: '/shop', bundles: '/bundles', about: '/about',
      contact: '/contact', cart: '/cart', checkout: '/checkout',
      faq: '/faq', membership: '/membership', blog: '/blog',
    };
    return map[key] ?? '/shop';
  }
  return action;
}
