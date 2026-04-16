import { FAQList } from '@/components/product/bundle-faq';

const GENERAL_FAQ = [
  {
    question: 'How long does printing take?',
    answer: 'Standard turnaround is 2–5 working days depending on the product. Express 24-hour turnaround is available for most print items (name cards, flyers, posters, banners) — contact us before 12pm.',
  },
  {
    question: 'Do you do file check?',
    answer: 'Yes, free file-check on every job. We\'ll flag low-resolution images, cut-off text, wrong color modes, missing bleeds — before we print a single copy.',
  },
  {
    question: 'Can I walk in?',
    answer: 'Absolutely. 60 Paya Lebar Road #B1-35. Mon–Sat 10am–7.30pm. Come with your file or just an idea — we\'ll help you work it out.',
  },
  {
    question: 'What file formats do you accept?',
    answer: 'PDF is preferred (especially for print). AI, PSD, EPS, PNG, JPG, TIFF also accepted. We can also work from Canva, Figma, or design briefs if you don\'t have a file yet.',
  },
  {
    question: 'Do you offer delivery?',
    answer: 'Yes — S$8 flat delivery Singapore-wide. Pickup is free at Paya Lebar Square.',
  },
  {
    question: 'How do I pay?',
    answer: 'After you place an order online we\'ll WhatsApp you to confirm. Payment via PayNow, bank transfer, or card at the counter.',
  },
  {
    question: 'Do you do bulk/corporate pricing?',
    answer: 'Yes — WhatsApp us for volume quotes (100+ name cards, 500+ flyers, 50+ corporate gifts, etc.). We\'re competitive for repeat business and multi-outlet groups.',
  },
];

export const metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about printing, turnaround, file formats, delivery, and payment.',
};

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10 lg:py-24">
      <div className="mb-12 text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">● FAQ</div>
        <h1 className="mb-4 text-5xl font-black text-ink lg:text-6xl">Common questions.</h1>
        <p className="text-lg text-neutral-600">
          Answers to the things people ask us every week.
        </p>
      </div>
      <FAQList faqs={GENERAL_FAQ} />
    </div>
  );
}
