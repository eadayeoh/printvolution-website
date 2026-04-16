export const metadata = {
  title: 'Membership & Points',
  description: 'Earn 1 point per S$1 spent. 1000 points = S$1 off future orders. Auto-enrolled on first order.',
  alternates: { canonical: 'https://printvolution.sg/membership' },
};

export default function MembershipPage() {
  return (
    <div className="screen active" id="screen-membership">
      <div className="ab-hero">
        <div className="ab-hero-inner" style={{ gridTemplateColumns: '1fr', maxWidth: 900 }}>
          <div className="ab-hero-text">
            <div className="hs-tag" style={{ color: '#FFD100' }}>Membership</div>
            <h1 className="ab-h1">Order more.<br /><em style={{ color: '#FFD100' }}>Save more.</em></h1>
            <p className="ab-sub" style={{ color: 'rgba(255,255,255,.7)' }}>Auto-enrolled on your first order. No forms, no cards to carry.</p>
          </div>
        </div>
      </div>

      <div className="ab-section">
        <div className="ab-section-in">
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div style={{ padding: 28, background: '#fff', border: '2px solid #0a0a0a', boxShadow: '4px 4px 0 #E91E8C' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎁</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: '#0a0a0a', marginBottom: 6 }}>Earn 1 point per S$1 spent</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>Points accrue on subtotal (before delivery). No exclusions.</div>
            </div>
            <div style={{ padding: 28, background: '#fff', border: '2px solid #0a0a0a', boxShadow: '4px 4px 0 #00B8D9' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💸</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: '#0a0a0a', marginBottom: 6 }}>1000 points = S$1 off</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>Redeem in chunks of 1000 at checkout. Stacks with coupons.</div>
            </div>
            <div style={{ padding: 28, background: '#fff', border: '2px solid #0a0a0a', boxShadow: '4px 4px 0 #FFD100' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>♾️</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: '#0a0a0a', marginBottom: 6 }}>No expiry</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>Points don&apos;t expire. Save up for the big order.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="ab-section" style={{ background: '#f8f8f8' }}>
        <div className="ab-section-in">
          <div style={{ background: '#fff', padding: 40, border: '1px solid #eee' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, color: '#0a0a0a', marginBottom: 20 }}>How it works</h2>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, lineHeight: 1.8, color: '#333' }}>
              {[
                'Place an order with your email.',
                'Points are credited automatically when the order is placed.',
                'Next order, enter the same email — your balance shows at checkout.',
                'Redeem 1000, 2000, 3000+ points for dollar-off discounts.',
              ].map((step, i) => (
                <li key={i} style={{ paddingLeft: 32, position: 'relative', marginBottom: 10 }}>
                  <strong style={{
                    position: 'absolute', left: 0, top: 0,
                    fontFamily: 'var(--serif)', fontSize: 18, color: '#E91E8C',
                  }}>{i + 1}.</strong>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
