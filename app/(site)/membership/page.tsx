export const metadata = {
  title: 'Membership & Points',
  description: 'Earn points on every order. 1000 points = S$1 off future orders.',
};

export default function MembershipPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10 lg:py-24">
      <div className="mb-12 text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-brand">● Membership</div>
        <h1 className="mb-4 text-5xl font-black text-ink lg:text-6xl">Order more. Save more.</h1>
        <p className="text-lg text-neutral-600">
          Auto-enrolled on your first order. No forms, no cards to carry.
        </p>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
          <div className="mb-3 text-4xl">🎁</div>
          <div className="mb-1 text-lg font-black text-ink">Earn 1 point per $1 spent</div>
          <p className="text-sm text-neutral-600">Points accrue on subtotal (before delivery). No exclusions.</p>
        </div>
        <div className="rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
          <div className="mb-3 text-4xl">💸</div>
          <div className="mb-1 text-lg font-black text-ink">1000 points = S$1 off</div>
          <p className="text-sm text-neutral-600">Redeem in chunks of 1000 at checkout. Stacks with coupons.</p>
        </div>
        <div className="rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
          <div className="mb-3 text-4xl">♾️</div>
          <div className="mb-1 text-lg font-black text-ink">No expiry</div>
          <p className="text-sm text-neutral-600">Points don&apos;t expire. Save up for the big order.</p>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8">
        <h2 className="mb-3 text-xl font-black text-ink">How it works</h2>
        <ol className="space-y-2 text-sm text-neutral-700">
          <li><strong className="text-pink">1.</strong> Place an order with your email.</li>
          <li><strong className="text-pink">2.</strong> Points are credited automatically when the order is placed.</li>
          <li><strong className="text-pink">3.</strong> Next order, enter the same email — your balance shows at checkout.</li>
          <li><strong className="text-pink">4.</strong> Redeem 1000, 2000, 3000+ points for dollar-off discounts.</li>
        </ol>
      </div>
    </div>
  );
}
