'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Menu, ShoppingCart, Settings, X } from 'lucide-react';
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

  // Delay-based hover: close after 200ms of no pointer on nav OR dropdown.
  // Cancelled if pointer re-enters either → prevents flicker when moving
  // from the menu button to the dropdown across the gap.
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

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-[62px] items-center justify-between border-b border-neutral-200 bg-white/95 px-7 backdrop-blur-md">
        <Link href="/" className="text-[20px] font-black tracking-tight text-ink">
          Print<span className="text-pink">volution</span>
        </Link>

        {/* Desktop nav */}
        <div
          className="relative hidden items-center gap-1 lg:flex"
          onMouseLeave={scheduleClose}
          onMouseEnter={cancelClose}
        >
          {nav.map((item, i) => {
            if (item.type === 'sep') {
              return <span key={i} className="mx-2 h-4 w-px bg-neutral-300" />;
            }
            if (item.type === 'dropdown' && item.mega_key) {
              const key = item.mega_key;
              return (
                <button
                  key={i}
                  className={cn(
                    'rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-700 transition-colors hover:text-pink',
                    openMega === key && 'text-pink'
                  )}
                  onMouseEnter={() => openKey(key)}
                  onClick={() => setOpenMega(openMega === key ? null : key)}
                >
                  {item.label} ▾
                </button>
              );
            }
            return (
              <Link
                key={i}
                href={mapAction(item.action) ?? '/shop'}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-700 transition-colors hover:text-pink"
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-pink-dark"
          >
            <ShoppingCart size={14} />
            Cart
            {mounted && count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-pink">
                {count}
              </span>
            )}
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

      {/* Mega menu (desktop) — sits right under the 62px nav with a
          2px transparent bridge to catch the mouse when moving from the button. */}
      {openMega && mega[openMega] && (
        <div
          className="fixed left-0 right-0 top-[60px] z-40 hidden border-b border-pink/20 bg-white shadow-2xl lg:block"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{ paddingTop: 2 }}
        >
          <div className="mx-auto max-w-7xl px-8 py-8">
            <div
              className="grid gap-8"
              style={{ gridTemplateColumns: `repeat(${Math.min(mega[openMega].length, 4)}, minmax(0, 1fr))` }}
            >
              {mega[openMega].map((section) => (
                <div key={section.id}>
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-pink">
                    {section.section_heading}
                  </h4>
                  <ul className="space-y-2">
                    {section.items.map((it) => (
                      <li key={it.product_slug}>
                        <Link
                          href={productHref(it.product_slug, productRoutes)}
                          onClick={() => setOpenMega(null)}
                          className="text-sm text-neutral-700 transition-colors hover:text-pink"
                        >
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

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[62px] z-40 max-h-[calc(100vh-62px)] overflow-y-auto border-b border-neutral-200 bg-white shadow-lg lg:hidden">
          <div className="flex flex-col py-2">
            {nav.map((item, i) => {
              if (item.type === 'sep') return <div key={i} className="my-1 mx-6 border-t border-neutral-100" />;
              if (item.type === 'dropdown' && item.mega_key) {
                return (
                  <div key={i} className="px-6 py-2">
                    <div className="mb-2 text-sm font-bold text-ink">{item.label}</div>
                    {mega[item.mega_key]?.map((section) => (
                      <div key={section.id} className="mb-3 pl-3">
                        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-pink">
                          {section.section_heading}
                        </div>
                        <ul className="space-y-1">
                          {section.items.slice(0, 6).map((it) => (
                            <li key={it.product_slug}>
                              <Link
                                href={productHref(it.product_slug, productRoutes)}
                                onClick={() => setMobileOpen(false)}
                                className="block py-1 text-xs text-neutral-600 hover:text-pink"
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
                  className="px-6 py-3 text-sm font-semibold text-ink hover:bg-neutral-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer so content doesn't sit under fixed nav */}
      <div className="h-[62px]" aria-hidden />
    </>
  );
}

/** Convert legacy action strings like "go('shop')" into URLs, or pass through if already a path. */
function mapAction(action: string | null): string | null {
  if (!action) return null;
  if (action.startsWith('/')) return action;
  const m = action.match(/go\(['"]([^'"]+)['"]\)/);
  if (m) {
    const key = m[1];
    const map: Record<string, string> = {
      home: '/', shop: '/shop', bundles: '/bundles', about: '/about',
      contact: '/contact', cart: '/cart', checkout: '/checkout',
      faq: '/faq', membership: '/membership',
    };
    return map[key] ?? '/shop';
  }
  return action;
}
