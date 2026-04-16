'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function BundleFAQ({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <section className="px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-2xl font-black text-ink lg:text-3xl">FAQ</h2>
        <FAQList faqs={faqs} />
      </div>
    </section>
  );
}

export function FAQList({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {faqs.map((f, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-ink transition-colors hover:bg-neutral-50"
          >
            <span>{f.question}</span>
            <ChevronDown size={16} className={`transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
          </button>
          {openIdx === i && <div className="bg-neutral-50 px-6 py-4 text-sm text-neutral-700">{f.answer}</div>}
        </div>
      ))}
    </div>
  );
}
