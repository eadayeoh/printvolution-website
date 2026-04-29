'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { formatSGD, isImageUrl } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function CartView() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const updateQty = useCart((s) => s.updateQty);
  const subtotal = useCart((s) => s.subtotalCents());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>;

  if (items.length === 0) {
    return (
      <div style={{
        padding: 80, textAlign: 'center', border: '2px dashed #ddd',
        background: '#fff', maxWidth: 600, margin: '0 auto',
      }}>
        <p style={{ fontSize: 18, color: '#666', marginBottom: 24 }}>Your cart is empty.</p>
        <Link href="/shop" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div className="cart-main">
        <div style={{ background: '#fff', border: '1.5px solid #0a0a0a' }}>
          {items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex', gap: 16, padding: '18px 22px',
                borderBottom: idx < items.length - 1 ? '1px solid #eee' : 'none',
              }}
            >
              <div style={{
                position: 'relative',
                width: 72, height: 72, background: '#f5f2ea', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, overflow: 'hidden', borderRadius: 8,
              }}>
                {item.gift_image_url ? (
                  // Gift: show the customer's configured/transformed preview
                  <Image
                    src={item.gift_image_url}
                    alt={item.product_name}
                    fill
                    sizes="72px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : isImageUrl(item.icon) ? (
                  // Print product with uploaded thumbnail
                  <Image
                    src={item.icon as string}
                    alt={item.product_name}
                    fill
                    sizes="72px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  // Fallback: emoji
                  <span>{item.icon ?? '📦'}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
                    {item.product_name}
                  </h3>
                  <button
                    onClick={() => remove(item.id)}
                    style={{
                      background: 'none', border: 'none', color: '#bbb', cursor: 'pointer',
                      // 44px tap target on mobile without changing the visual icon size.
                      padding: 14, margin: -14,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    aria-label="Remove from cart"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {Object.keys(item.config).length > 0 && (
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                    {Object.entries(item.config).map(([k, v]) => (
                      <span key={k} style={{ marginRight: 14 }}>
                        <span style={{ color: '#bbb' }}>{k}:</span>{' '}
                        <strong style={{ color: '#555' }}>{v}</strong>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    border: '1.5px solid #0a0a0a', borderRadius: 999, overflow: 'hidden',
                    background: '#fff',
                  }}>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                      disabled={item.qty <= 1}
                      aria-label="Decrease quantity"
                      style={{
                        width: 32, height: 32, border: 'none', background: 'transparent',
                        cursor: item.qty <= 1 ? 'not-allowed' : 'pointer',
                        color: item.qty <= 1 ? '#ccc' : '#0a0a0a',
                        fontSize: 16, fontWeight: 700, lineHeight: 1,
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={item.qty}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isFinite(n)) return;
                        const clamped = Math.max(1, Math.min(999, n));
                        updateQty(item.id, clamped);
                      }}
                      aria-label="Quantity"
                      style={{
                        width: 44, height: 32, border: 'none', outline: 'none',
                        textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#0a0a0a',
                        background: 'transparent', MozAppearance: 'textfield',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, Math.min(999, item.qty + 1))}
                      disabled={item.qty >= 999}
                      aria-label="Increase quantity"
                      style={{
                        width: 32, height: 32, border: 'none', background: 'transparent',
                        cursor: item.qty >= 999 ? 'not-allowed' : 'pointer',
                        color: item.qty >= 999 ? '#ccc' : '#0a0a0a',
                        fontSize: 16, fontWeight: 700, lineHeight: 1,
                      }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{
                    fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 700, color: '#E91E8C',
                  }}>
                    {formatSGD(item.line_total_cents)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="cart-rail">
        <div className="cart-summary-card" style={{
          position: 'sticky', top: 80, padding: 28, background: '#fff',
          border: '2px solid #0a0a0a', boxShadow: '6px 6px 0 #E91E8C',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 6 }}>Summary</div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, marginBottom: 18, color: '#0a0a0a' }}>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </h3>

          <div style={{ marginBottom: 14, fontSize: 13, lineHeight: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Subtotal</span>
              <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{formatSGD(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
              <span>Delivery</span>
              <span>At checkout</span>
            </div>
          </div>

          <div style={{ borderTop: '2px solid #0a0a0a', paddingTop: 14, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, color: '#E91E8C' }}>
                {formatSGD(subtotal)}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            style={{
              display: 'block', textAlign: 'center', padding: '14px',
              borderRadius: 999, background: '#E91E8C', color: '#fff',
              fontSize: 13, fontWeight: 800, letterSpacing: 0.3,
              textDecoration: 'none', fontFamily: 'var(--sans)', marginBottom: 8,
            }}
          >
            Proceed to Checkout →
          </Link>
          <Link
            href="/shop"
            style={{
              display: 'block', textAlign: 'center', padding: '14px',
              borderRadius: 999, background: '#fff', color: '#0a0a0a',
              fontSize: 13, fontWeight: 800, letterSpacing: 0.3,
              textDecoration: 'none', fontFamily: 'var(--sans)',
              border: '2px solid #e5e5e5',
            }}
          >
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}
