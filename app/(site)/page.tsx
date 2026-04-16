import Link from 'next/link';
import { listProducts } from '@/lib/data/products';
import { listBundles } from '@/lib/data/bundles';
import { getProductRoutes, productHref } from '@/lib/data/navigation';
import { formatSGD } from '@/lib/utils';
import { LocalBusinessSchema } from '@/components/seo/json-ld';

export const metadata = {
  title: 'Printvolution | Printing Services Singapore · Name Cards, Flyers, Banners & Gifts',
  description: 'Printing services Singapore at Paya Lebar Square. Name cards from $28, flyers, banners, custom embroidery, personalised gifts, NFC business cards. WhatsApp for instant quote. Same-day express available.',
  alternates: { canonical: 'https://printvolution.sg/' },
};

const FEATURED_SLUGS = [
  'name-card', 'flyers', 'roll-up-banner', 'acrylic-signage',
  'polo-shirts', 'stickers', 'led-photo-frame', 'nfc-card',
];
const FEATURED_META: Record<string, { cat: string; tags: string[] }> = {
  'name-card': { cat: 'Most Popular', tags: ['Matt', 'Gloss', 'Spot UV', 'Soft Touch'] },
  'flyers': { cat: 'Advertising', tags: ['A4', 'A5', 'DL', 'Double-sided'] },
  'roll-up-banner': { cat: 'Events & Display', tags: ['Stand Included', 'Carry Bag', '24h'] },
  'acrylic-signage': { cat: 'Signage', tags: ['Shop Sign', 'Reception', 'Chrome Bolts'] },
  'polo-shirts': { cat: 'Uniforms', tags: ['Embroidery', 'DTF Print', 'XS–3XL'] },
  'stickers': { cat: 'Branding', tags: ['Die-Cut', 'Vinyl', 'Waterproof'] },
  'led-photo-frame': { cat: 'Personalised Gifts', tags: ['Custom Photo', 'Gift Box', 'Glows'] },
  'nfc-card': { cat: 'Smart Tech', tags: ['Tap to Share', 'Always Updated'] },
};

const MARQUEE = [
  'Name Cards', 'Flyers', 'Roll-Up Banners', 'Stickers', 'Embroidery',
  'Polo Shirts', 'UV DTF', 'NFC Cards', 'Booklets', 'Tote Bags',
  'Acrylic Signs', 'Corporate Gifts', 'Wedding Gifts', 'LED Photo Frames',
];

const PAIN_POINTS = [
  ['"My name cards look embarrassing."', '→ Premium cards from S$28. Matt, gloss, spot UV — cards people actually keep.'],
  ['"Event is next week and I need banners now."', '→ 24-hour express available. Roll-up banner with stand from S$88. Done.'],
  ['"Corporate gifts look generic every year."', '→ Personalised LED frames, engraved tumblers, custom necklaces — from S$22.'],
  ['"My team uniform looks like it cost $5."', '→ Embroidered or DTF polo shirts from S$19/pc. Sizes XS to 3XL.'],
  ['"I need 8 different things from 6 vendors."', '→ 90+ products. One shop. One invoice. Walk in or order online.'],
  ['"Printer sent wrong colour. Again."', '→ Pre-press file check on every order. What you approve is what you get.'],
];

const STEPS = [
  { n: '01', t: 'Pick your product', d: 'Browse 90+ products with live pricing. No hidden costs, no minimum order on most items.' },
  { n: '02', t: 'Send your artwork', d: 'PDF, AI, or JPG. We run a pre-press check and flag any issues before printing starts.' },
  { n: '03', t: 'We print and finish', d: 'Proofed, printed, quality-checked. Most jobs ready in 3–5 days. Express 24h available.' },
  { n: '04', t: 'Collect or delivery', d: 'Walk in at Paya Lebar Square B1-35, or get it sent island-wide for +S$8 flat.' },
];

const WHY_US = [
  { n: '01', t: 'File check before every print', d: 'We catch resolution issues, bleed problems, and colour mismatches before the job goes to press — not after.' },
  { n: '02', t: 'One shop for everything', d: 'Name cards to LED photo frames to polo shirts. 90+ products, one invoice, one collection point.' },
  { n: '03', t: 'Walk in or order online', d: 'Paya Lebar Square B1-35, Mon–Sat 10am–7.30pm. Or order online and we deliver island-wide.' },
  { n: '04', t: 'Express 24h when you need it', d: 'Order before 12pm for same-day processing on most products. Events sneak up — we know.' },
];

const SEO_KW = [
  { slug: 'name-card', label: 'Name Card Printing Singapore', loc: 'From S$28' },
  { slug: 'flyers', label: 'Flyer Printing Singapore', loc: 'From S$65' },
  { slug: 'roll-up-banner', label: 'Banner Printing Singapore', loc: 'From S$88' },
  { slug: 'polo-shirts', label: 'Uniform & T-Shirt Printing', loc: 'From S$19/pc' },
  { slug: 'acrylic-signage', label: 'Acrylic Signage Singapore', loc: 'From S$32' },
  { slug: 'stickers', label: 'Sticker Printing Singapore', loc: 'From S$45' },
  { slug: 'embroidery', label: 'Embroidery Singapore', loc: 'Custom pricing' },
  { slug: null, label: 'Urgent Printing Singapore', loc: '24h Express' },
];

export default async function HomePage() {
  const [products, bundles, routes] = await Promise.all([
    listProducts(),
    listBundles(),
    getProductRoutes(),
  ]);

  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <div className="screen active" id="screen-home">
      <LocalBusinessSchema />
      {/* HERO */}
      <div className="hero pv-hero-split">
        <div className="hero-bg-grid" />
        <div className="hero-side hero-print">
          <div className="hero-side-img" />
          <div className="hero-side-content">
            <div className="hero-side-num">01 / 02 · PRINT</div>
            <div className="hero-eyebrow">Printing Services</div>
            <h1 className="hero-h">Print that makes<br /><em>your brand look<br />the part.</em></h1>
            <p className="hero-sub">
              Name cards, flyers, banners, uniforms, signage — all under one roof at Paya Lebar Square.
              File check on every job. Express 24h available.
            </p>
            <div className="hero-btns">
              <Link href="/shop" className="btn-primary">Browse Printing</Link>
              <a href="https://wa.me/6585533497" target="_blank" rel="noopener noreferrer" className="btn-sec">WhatsApp Us</a>
            </div>
            <div className="hero-trust">
              <span>24h Express</span>
              <span>File Check</span>
              <span>From S$28</span>
            </div>
          </div>
        </div>
        <div className="hero-side hero-gifts">
          <div className="hero-side-img" />
          <div className="hero-side-content">
            <div className="hero-side-num">02 / 02 · GIFTS</div>
            <div className="hero-eyebrow">Personalised Gifts</div>
            <h1 className="hero-h">Gifts that feel<br /><em>made for them.</em></h1>
            <p className="hero-sub">
              LED photo frames, engraved tumblers, custom tote bags, corporate hampers.
              Walk in with an idea — leave with a gift they&rsquo;ll keep.
            </p>
            <div className="hero-btns">
              <Link href="/shop?gift=1" className="btn-primary">Shop Gifts</Link>
              <a href="https://wa.me/6585533497" target="_blank" rel="noopener noreferrer" className="btn-sec">WhatsApp Us</a>
            </div>
            <div className="hero-trust">
              <span>Ready in 3 Days</span>
              <span>Custom Engraving</span>
              <span>Gift-Wrap Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* MARQUEE */}
      <div className="marquee-bar">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i}>{w} &bull;</span>
          ))}
        </div>
      </div>

      {/* POPULAR PRODUCTS */}
      <div className="home-sec">
        <div className="home-sec-inner">
          <div className="hs-head">
            <div>
              <div className="hs-tag">90+ Print &amp; Gift Products</div>
              <h2 className="hs-h">Everything you need.<br /><em>In one place.</em></h2>
              <p className="hs-sub">From your first name card to your next event — we print it, check it, and get it to you fast.</p>
            </div>
            <Link href="/shop" className="btn-outline">Shop All Products &rarr;</Link>
          </div>
          <div className="cat-grid">
            {FEATURED_SLUGS.map((slug) => {
              const p = bySlug.get(slug);
              const meta = FEATURED_META[slug];
              if (!p) return null;
              return (
                <Link
                  key={slug}
                  href={productHref(slug, routes)}
                  className="cat-card"
                >
                  {p.icon && (p.icon.startsWith('http') || p.icon.startsWith('/')) ? (
                    <span className="cc-ic" style={{ padding: 0 }}>
                      <img src={p.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </span>
                  ) : (
                    <span className="cc-ic">{p.icon ?? '📦'}</span>
                  )}
                  <div className="cc-cat">{meta?.cat ?? p.category?.name ?? 'Print'}</div>
                  <div className="cc-name">{p.name}</div>
                  <div className="cc-tags">
                    {(meta?.tags ?? []).map((t) => <span key={t}>{t}</span>)}
                  </div>
                  <div className="cc-from">
                    {p.min_price !== null ? `From ${formatSGD(p.min_price)}` : 'Quote'}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="view-all-row">
            <Link href="/shop" className="btn-outline" style={{ padding: '12px 36px', fontSize: 14 }}>
              See All {products.length}+ Products &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* PROBLEMS WE SOLVE */}
      <div className="home-sec" style={{ background: '#0D0D0D' }}>
        <div className="home-sec-inner">
          <div className="hs-tag" style={{ color: '#E91E8C' }}>Sound familiar?</div>
          <h2 className="hs-h" style={{ color: '#fff' }}>
            Every business has a printing problem.<br /><em style={{ color: '#E91E8C' }}>We fix all of them.</em>
          </h2>
          <div className="pain-grid">
            {PAIN_POINTS.map(([q, a], i) => (
              <div key={i} className="pain-card">
                <div className="pain-q">{q}</div>
                <div className="pain-a">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="home-sec" style={{ background: '#f8f8f8' }}>
        <div className="home-sec-inner">
          <div className="hs-tag">How It Works</div>
          <h2 className="hs-h">Order to delivery.<br /><em>Simpler than you think.</em></h2>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <div className="step-n">{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOCIAL PROOF */}
      <div className="proof-strip">
        <div className="home-sec-inner">
          <div className="proof-grid">
            <div className="proof-item">
              <div className="proof-num">5,000+</div>
              <div className="proof-lbl">businesses served</div>
            </div>
            <div className="proof-div" />
            <div className="proof-item">
              <div className="proof-num">{products.length}+</div>
              <div className="proof-lbl">products available</div>
            </div>
            <div className="proof-div" />
            <div className="proof-item">
              <div className="proof-num">24h</div>
              <div className="proof-lbl">express turnaround</div>
            </div>
            <div className="proof-div" />
            <div className="proof-item">
              <div className="proof-num">10+</div>
              <div className="proof-lbl">years in Singapore</div>
            </div>
          </div>
        </div>
      </div>

      {/* HOME BUNDLES */}
      {bundles.length > 0 && (
        <div className="bun-section" id="home-bundles-section">
          <div className="bun-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: '#E91E8C', marginBottom: 8 }}>Bundle &amp; Save</div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: '#0a0a0a', lineHeight: 1.2, margin: 0 }}>
                  More products,<br /><em style={{ color: '#E91E8C' }}>bigger savings.</em>
                </h2>
              </div>
              <Link href="/bundles" className="btn-outline">See All Bundles &rarr;</Link>
            </div>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24, maxWidth: 480 }}>
              Products that work best together — already discounted, so you can see exactly what you save.
            </p>
            <div className="bun-grid">
              {bundles.slice(0, 3).map((b) => (
                <Link key={b.id} href={`/bundle/${b.slug}`} className="bun-card">
                  <div className="bun-name">{b.name}</div>
                  {b.description && <div className="bun-desc">{b.description}</div>}
                  <div className="bun-price">{formatSGD(b.price_cents)}</div>
                  {b.discount_cents > 0 && (
                    <div className="bun-cs-body" style={{ fontSize: 12, color: '#666' }}>
                      <span style={{ textDecoration: 'line-through' }}>{formatSGD(b.subtotal_cents)}</span>
                      {' · Save '}{formatSGD(b.discount_cents)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WHY US */}
      <div className="home-sec" style={{ background: '#0D0D0D' }}>
        <div className="home-sec-inner">
          <div className="hs-tag" style={{ color: '#E91E8C' }}>Why Printvolution</div>
          <h2 className="hs-h" style={{ color: '#fff' }}>
            Not just printed.<br /><em style={{ color: '#E91E8C' }}>Printed properly.</em>
          </h2>
          <div className="why-grid-home">
            {WHY_US.map((w) => (
              <div key={w.n} className="why-home-item">
                <div className="why-home-num">{w.n}</div>
                <div className="why-home-title">{w.t}</div>
                <div className="why-home-desc">{w.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEO KEYWORDS */}
      <div className="home-sec">
        <div className="home-sec-inner">
          <div className="hs-tag">Printing Services in Singapore</div>
          <h2 className="hs-h" style={{ maxWidth: 600 }}>
            Looking for a specific print service?<br /><em>We probably do it.</em>
          </h2>
          <div className="seo-kw-grid">
            {SEO_KW.map((k, i) => {
              const href = k.slug ? productHref(k.slug, routes) : '/shop';
              return (
                <Link key={i} href={href} className="seo-kw-item">
                  <div className="ski-label">{k.label}</div>
                  <div className="ski-loc">{k.loc}</div>
                </Link>
              );
            })}
          </div>
          <p className="seo-fine">
            <strong>Printvolution</strong> is a <strong>printing company in Singapore</strong> at Paya Lebar Square offering
            {' '}<strong>name card printing</strong>, <strong>flyer printing</strong>, <strong>banner printing Singapore</strong>,
            corporate gifts, uniform printing, personalised gifts, and 90+ other <strong>printing services in Singapore</strong>.
            Walk in or order online with island-wide delivery.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-strip">
        <div className="home-sec-inner">
          <h2>Ready to order?</h2>
          <p>
            Browse our products, configure your order, and place it online — or walk into Paya Lebar Square
            and we&rsquo;ll sort it on the spot.
          </p>
          <div className="cta-btns">
            <Link href="/shop" className="btn-wh">Browse All Products</Link>
            <a href="https://wa.me/6585533497" target="_blank" rel="noopener noreferrer" className="btn-wh-o">WhatsApp Us</a>
          </div>
        </div>
      </div>
    </div>
  );
}
