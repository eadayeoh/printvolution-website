import { CartView } from '@/components/cart/cart-view';
import { BundleSuggestions } from '@/components/cart/bundle-suggestions';

export const metadata = { title: 'Cart', alternates: { canonical: 'https://printvolution.sg/cart' } };

export default function CartPage() {
  return (
    <div className="screen active" id="screen-cart">
      <div className="cart-heading">
        <div className="home-sec-inner" style={{ paddingTop: 48, paddingBottom: 8 }}>
          <h1 className="cart-title">Your Cart</h1>
        </div>
      </div>
      <div className="home-sec-inner" style={{ paddingBottom: 80 }}>
        <CartView />
        <BundleSuggestions />
      </div>
    </div>
  );
}
