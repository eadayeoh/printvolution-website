'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Menu, Settings, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import type { NavItem, MegaMenuSection, ProductLookup } from '@/lib/data/navigation-types';
import { productHref } from '@/lib/data/navigation-types';
import type { SiteSettings } from '@/lib/data/site-settings';

type Props = {
  nav: NavItem[];
  mega: Record<string, MegaMenuSection[]>;
  productRoutes: ProductLookup;
  settings?: SiteSettings;
  isAdmin?: boolean;
};

export function HeaderClient({ nav, mega, productRoutes, settings, isAdmin = false }: Props) {
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

  return (
    <>
      <header
        style={{
          background: '#fff',
          borderBottom: '2px solid var(--pv-ink)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <nav
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            padding: '16px 24px',
            gap: 32,
            maxWidth: 1560,
            margin: '0 auto',
          }}
          aria-label="Main"
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.brand_text || 'Printvolution'}
                style={{
                  height: 38,
                  width: 'auto',
                  maxWidth: settings.logo_width_px ? `${settings.logo_width_px}px` : 220,
                  objectFit: 'contain',
                }}
              />
            ) : (
              <span
                style={{
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 26,
                  letterSpacing: '-0.02em',
                  color: 'var(--pv-ink)',
                }}
              >
                <span style={{ color: 'var(--pv-magenta)' }}>Print</span>volution
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <div
            className="pv-header-links"
            style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 600,
            }}
            onMouseLeave={scheduleClose}
            onMouseEnter={cancelClose}
          >
            {nav.map((item, i) => {
              if (item.type === 'sep') {
                return <span key={i} style={{ alignSelf: 'center', height: 14, width: 1, background: 'var(--pv-rule)' }} />;
              }
              if (item.type === 'dropdown' && item.mega_key) {
                const key = item.mega_key;
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => openKey(key)}
                    onClick={() => setOpenMega(openMega === key ? null : key)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '6px 0',
                      fontFamily: 'var(--pv-f-body)',
                      fontSize: 15,
                      fontWeight: 600,
                      color: openMega === key ? 'var(--pv-magenta)' : 'var(--pv-ink)',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label} ▾
                  </button>
                );
              }
              return (
                <Link
                  key={i}
                  href={mapAction(item.action) ?? '/shop'}
                  style={{ padding: '6px 0', color: 'var(--pv-ink)' }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAdmin && (
              <Link
                href="/admin"
                className="pv-header-admin"
                aria-label="Admin dashboard"
                title="Admin dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--pv-yellow)',
                  color: 'var(--pv-ink)',
                  border: '2px solid var(--pv-ink)',
                  padding: '6px 10px',
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                <Settings size={12} />
                Admin
              </Link>
            )}
            <Link
              href="/account"
              className="pv-header-account"
              style={{
                color: 'var(--pv-muted)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Sign in
            </Link>
            <Link
              href="/cart"
              className="pv-btn pv-btn-primary"
              style={{ padding: '10px 18px', fontSize: 13 }}
              aria-label="Cart"
            >
              <ShoppingCart size={14} />
              Cart
              {mounted && count > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    background: 'var(--pv-yellow)',
                    color: 'var(--pv-ink)',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 10,
                    padding: '2px 6px',
                    letterSpacing: 0,
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="pv-header-hamburger"
              style={{
                border: 'none',
                background: 'transparent',
                padding: 6,
                cursor: 'pointer',
                color: 'var(--pv-ink)',
              }}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Mega menu (desktop) */}
        {openMega && mega[openMega] && (
          <div
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '100%',
              background: '#fff',
              borderTop: '1px solid var(--pv-rule)',
              borderBottom: '2px solid var(--pv-ink)',
              boxShadow: '0 12px 30px rgba(10,10,10,0.08)',
            }}
          >
            <div style={{ maxWidth: 1560, margin: '0 auto', padding: '32px 24px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 40,
                }}
              >
                {mega[openMega].map((section) => (
                  <div key={section.id}>
                    <h4
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 11,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--pv-magenta)',
                        marginBottom: 12,
                        paddingBottom: 6,
                        borderBottom: '1px solid var(--pv-rule)',
                      }}
                    >
                      {section.section_heading}
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                      {section.items.map((it) => (
                        <li key={it.product_slug}>
                          <Link
                            href={productHref(it.product_slug, productRoutes)}
                            onClick={() => setOpenMega(null)}
                            style={{ fontSize: 13, color: 'var(--pv-ink)' }}
                          >
                            {it.label}
                          </Link>
                        </li>
                      ))}
                      {section.items.length === 0 && (
                        <li style={{ fontSize: 11, color: 'var(--pv-muted)' }}>Coming soon</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            background: '#fff',
            zIndex: 60,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottom: '2px solid var(--pv-ink)',
            }}
          >
            <span style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22 }}>Menu</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
              style={{ border: 'none', background: 'transparent', padding: 6, cursor: 'pointer' }}
            >
              <X size={22} />
            </button>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {nav.map((item, i) => {
              if (item.type === 'sep') return <div key={i} style={{ borderTop: '1px solid var(--pv-rule)', margin: '6px 0' }} />;
              if (item.type === 'dropdown' && item.mega_key) {
                return (
                  <div key={i} style={{ padding: '8px 0' }}>
                    <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 18, marginBottom: 8 }}>{item.label}</div>
                    {mega[item.mega_key]?.map((section) => (
                      <div key={section.id} style={{ paddingLeft: 8, marginBottom: 10 }}>
                        <div
                          style={{
                            fontFamily: 'var(--pv-f-mono)',
                            fontSize: 11,
                            color: 'var(--pv-magenta)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: 4,
                          }}
                        >
                          {section.section_heading}
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
                          {section.items.slice(0, 8).map((it) => (
                            <li key={it.product_slug}>
                              <Link
                                href={productHref(it.product_slug, productRoutes)}
                                onClick={() => setMobileOpen(false)}
                                style={{ fontSize: 14, color: 'var(--pv-ink)' }}
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
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: '10px 0',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--pv-ink)',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              style={{ padding: '10px 0', fontSize: 16, fontWeight: 700, color: 'var(--pv-ink)' }}
            >
              Sign in
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: '10px 0',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--pv-magenta)',
                }}
              >
                Admin dashboard →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Responsive tweaks */}
      <style jsx global>{`
        @media (min-width: 900px) {
          .pv-header-hamburger { display: none; }
        }
        @media (max-width: 899px) {
          .pv-header-links { display: none !important; }
          .pv-header-account { display: none; }
        }
      `}</style>
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
