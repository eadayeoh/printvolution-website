'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { formatSGD, isImageUrl } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function CartView() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
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
                width: 72, height: 72, background: '#f5f2ea', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, overflow: 'hidden', borderRadius: 8,
              }}>
                {item.gift_image_url ? (
                  // Gift: show the customer's configured/transformed preview
                  <img src={item.gift_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : isImageUrl(item.icon) ? (
                  // Print product with uploaded thumbnail
                  <img src={item.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer' }}
                    aria-label="Remove"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#888' }}>Qty {item.qty}</span>
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
        <div style={{
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
