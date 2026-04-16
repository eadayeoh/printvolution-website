import { FAQList } from '@/components/product/bundle-faq';

const GENERAL_FAQ = [
  { question: 'How long does printing take?', answer: 'Standard turnaround is 2–5 working days depending on the product. Express 24-hour turnaround is available for most print items (name cards, flyers, posters, banners) — contact us before 12pm.' },
  { question: 'Do you do file check?', answer: 'Yes, free file-check on every job. We\'ll flag low-resolution images, cut-off text, wrong color modes, missing bleeds — before we print a single copy.' },
  { question: 'Can I walk in?', answer: 'Absolutely. 60 Paya Lebar Road #B1-35. Mon–Sat 10am–7.30pm. Come with your file or just an idea — we\'ll help you work it out.' },
  { question: 'What file formats do you accept?', answer: 'PDF is preferred (especially for print). AI, PSD, EPS, PNG, JPG, TIFF also accepted. We can also work from Canva, Figma, or design briefs if you don\'t have a file yet.' },
  { question: 'Do you offer delivery?', answer: 'Yes — S$8 flat delivery Singapore-wide. Pickup is free at Paya Lebar Square.' },
  { question: 'How do I pay?', answer: 'After you place an order online we\'ll WhatsApp you to confirm. Payment via PayNow, bank transfer, or card at the counter.' },
  { question: 'Do you do bulk/corporate pricing?', answer: 'Yes — WhatsApp us for volume quotes (100+ name cards, 500+ flyers, 50+ corporate gifts, etc.). We\'re competitive for repeat business and multi-outlet groups.' },
];

export const metadata = {
  title: 'FAQ',
  description: 'Common questions about printing, turnaround, file formats, delivery, and payment.',
  alternates: { canonical: 'https://printvolution.sg/faq' },
};

export default function FAQPage() {
  return (
    <div className="screen active" id="screen-faq">
      <div className="ab-hero">
        <div className="ab-hero-inner" style={{ gridTemplateColumns: '1fr', maxWidth: 900 }}>
          <div className="ab-hero-text">
            <div className="hs-tag" style={{ color: '#E91E8C' }}>FAQ</div>
            <h1 className="ab-h1">Common <em>questions.</em></h1>
            <p className="ab-sub" style={{ color: 'rgba(255,255,255,.7)' }}>Answers to the things people ask us every week.</p>
          </div>
        </div>
      </div>

      <div className="ab-section">
        <div className="ab-section-in" style={{ maxWidth: 800 }}>
          <FAQList faqs={GENERAL_FAQ} />
        </div>
      </div>
    </div>
  );
}
