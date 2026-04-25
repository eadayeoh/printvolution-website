import Link from 'next/link';

export const metadata = { title: 'Order Confirmed' };

export default function ConfirmPage({ searchParams }: { searchParams: { order?: string } }) {
  const orderNumber = searchParams.order ?? 'Unknown';
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center lg:px-10">
      <div className="mb-6 text-6xl">✅</div>
      <h1 className="mb-4 text-4xl font-black text-ink lg:text-5xl">Order received!</h1>
      <p className="mb-2 text-lg text-neutral-600">
        Your order number is <strong className="text-pink">{orderNumber}</strong>
      </p>
      <p className="mb-10 text-sm text-neutral-500">
        We&apos;ll WhatsApp you shortly to confirm payment and handle file artwork.
      </p>

      <div className="mx-auto mb-10 max-w-md rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">Next steps</div>
        <ol className="space-y-3 text-left text-sm text-ink">
          <li className="flex gap-3">
            <span className="font-black text-pink">1.</span>
            <span>We&apos;ll WhatsApp you within 30 minutes (Mon–Sat, 10am–7.30pm) to confirm details.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-black text-pink">2.</span>
            <span>Send your artwork file. We&apos;ll do a free file-check and mock-up.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-black text-pink">3.</span>
            <span>Once you approve, we&apos;ll print and contact you when it&apos;s ready.</span>
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="https://wa.me/6585533497"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-green-600"
        >
          💬 WhatsApp us now
        </a>
        <Link
          href={`/track?order=${encodeURIComponent(orderNumber)}`}
          className="inline-flex items-center gap-2 rounded-full bg-pink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-pink-dark"
        >
          📦 Track this order
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center rounded-full border-2 border-ink px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-white"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
