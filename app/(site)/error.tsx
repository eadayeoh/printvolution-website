'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[site] route error', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-pink">Something went wrong</div>
      <h1 className="mb-4 text-4xl font-black text-ink">We hit a snag.</h1>
      <p className="mb-8 text-sm text-neutral-600">
        The page failed to load. Try again, or head back to the shop and re-open it.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-pink px-6 py-3 text-sm font-bold text-white hover:bg-pink-dark"
        >
          Try again
        </button>
        <Link
          href="/shop"
          className="rounded-full border-2 border-ink px-6 py-3 text-sm font-bold text-ink hover:bg-ink hover:text-white"
        >
          Back to shop
        </Link>
      </div>
      {error.digest && (
        <div className="mt-8 text-[11px] text-neutral-400">Error ref: {error.digest}</div>
      )}
    </div>
  );
}
