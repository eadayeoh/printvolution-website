import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy & data retention',
  description: 'How Printvolution handles customer data, uploads, and production files.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <h1 className="mb-6 text-4xl font-black text-ink lg:text-6xl">Privacy &amp; data retention.</h1>
      <p className="mb-10 text-neutral-600">
        Short, plain-English version of what we keep and for how long. If anything here is unclear,{' '}
        <a href="mailto:enquiry@printvolution.sg" className="underline">email us</a>.
      </p>

      <section id="gift-retention" className="mb-10 scroll-mt-24 rounded-lg border-2 border-ink bg-white p-6">
        <h2 className="mb-3 text-2xl font-black">Gift uploads — 30-day retention</h2>
        <p className="mb-3 text-sm text-neutral-700">
          <strong>We delete your files 30 days after ordering.</strong> Your uploaded photo and the 300 DPI
          print file are removed 30 days after checkout. We keep only a watermarked preview so you can still
          see your order in your account history. If you need a reprint, please place a new order before
          then.
        </p>
        <p className="mb-3 text-sm text-neutral-700">
          Why: uploaded photos and 300 DPI print files take a lot of storage and hold more data than we need
          to keep past fulfilment. Your <strong>customer order record</strong> — name, email, shipping
          address, what you ordered, what you paid — is retained as part of our business records.
        </p>
        <p className="text-sm text-neutral-700">
          Per-product override: some gift products may set a different retention window — always shown
          on the product page before you order.
        </p>
      </section>

      <section className="mb-10 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-3 text-xl font-bold">Customer records</h2>
        <p className="text-sm text-neutral-700">
          We keep your account email, shipping details, and order history indefinitely so you can re-order,
          track past jobs, and we can meet Singapore accounting requirements. You can request deletion by
          emailing us.
        </p>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-3 text-xl font-bold">Questions?</h2>
        <p className="text-sm text-neutral-700">
          Email{' '}
          <a href="mailto:enquiry@printvolution.sg" className="underline">enquiry@printvolution.sg</a>{' '}
          — we respond within a working day.
        </p>
      </section>
    </div>
  );
}
