import { CheckoutForm } from '@/components/cart/checkout-form';

export const metadata = { title: 'Checkout', alternates: { canonical: 'https://printvolution.sg/checkout' } };

export default function CheckoutPage() {
  return (
    <div className="screen active" id="screen-checkout">
      <div style={{ background: '#0D0D0D', color: '#fff', padding: '48px 28px 32px' }}>
        <div className="home-sec-inner" style={{ padding: 0 }}>
          <div className="hs-tag" style={{ color: '#E91E8C' }}>Checkout</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#fff', margin: '10px 0 0', lineHeight: 1.1 }}>
            Nearly done.
          </h1>
        </div>
      </div>
      <div className="home-sec-inner" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <CheckoutForm />
      </div>
    </div>
  );
}
