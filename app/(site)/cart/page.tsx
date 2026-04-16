import { CartView } from '@/components/cart/cart-view';

export const metadata = { title: 'Cart' };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10">
      <h1 className="mb-8 text-4xl font-black text-ink lg:text-5xl">Your Cart</h1>
      <CartView />
    </div>
  );
}
