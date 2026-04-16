import { CheckoutForm } from '@/components/cart/checkout-form';

export const metadata = { title: 'Checkout' };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
      <h1 className="mb-8 text-4xl font-black text-ink lg:text-5xl">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
