import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-pink">404</div>
      <h1 className="mb-4 text-4xl font-black text-ink">We can't find that page.</h1>
      <p className="mb-8 text-sm text-neutral-600">
        It might have moved, or the link is out of date. Try the shop or get in touch.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-pink px-6 py-3 text-sm font-bold text-white hover:bg-pink-dark"
        >
          Browse the shop
        </Link>
        <Link
          href="/contact"
          className="rounded-full border-2 border-ink px-6 py-3 text-sm font-bold text-ink hover:bg-ink hover:text-white"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
