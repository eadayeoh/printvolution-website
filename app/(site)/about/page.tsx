import { getPageContent } from '@/lib/data/page_content';

export const metadata = {
  title: 'About Printvolution',
  description: 'Printing and personalised gifts at Paya Lebar Square, Singapore. Started small, stayed obsessed with quality.',
  alternates: { canonical: 'https://printvolution.sg/about' },
};

export default async function AboutPage() {
  const content = await getPageContent('about');
  const values = (content.values?.items ?? []) as Array<{ emoji?: string; title: string; desc: string }>;
  const clients = (content.clients?.items ?? []) as Array<{ emoji?: string; title: string; desc: string }>;

  return (
    <div className="screen active" id="screen-about">
      {/* Hero */}
      <div className="ab-hero">
        <div className="ab-hero-inner">
          <div className="ab-hero-text">
            <div className="hs-tag" style={{ color: '#E91E8C' }}>About</div>
            <h1 className="ab-h1">We&rsquo;re the print shop<br />that actually <em>gives a damn.</em></h1>
            <p className="ab-sub" style={{ color: 'rgba(255,255,255,.7)' }}>Based at Paya Lebar Square. Been doing this long enough to know what matters — and what doesn&rsquo;t.</p>
          </div>
          <div className="ab-hero-stat">
            <div className="ab-stat"><div className="ab-stat-n">2015</div><div className="ab-stat-l">Founded</div></div>
            <div className="ab-stat"><div className="ab-stat-n">5K+</div><div className="ab-stat-l">Clients Served</div></div>
            <div className="ab-stat"><div className="ab-stat-n">90+</div><div className="ab-stat-l">Products</div></div>
            <div className="ab-stat"><div className="ab-stat-n">10+</div><div className="ab-stat-l">Years</div></div>
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="ab-section">
        <div className="ab-section-in">
          <div className="ab-story-grid">
            <div>
              <div className="hs-tag">Our Story</div>
              <h2 className="ab-sh">Started small.<br />Stayed obsessed with quality.</h2>
              <p className="ab-p">Printvolution started because we were tired of watching businesses settle for mediocre print. Blurry name cards. Banners that fade after one event. Corporate gifts nobody actually wants to keep.</p>
              <p className="ab-p">We set up at Paya Lebar Square with one goal — be the print shop we wished existed. Sharp quality. Honest pricing. People who pick up the phone.</p>
              <p className="ab-p">Today we serve over 5,000 businesses across Singapore — from solo freelancers ordering their first name cards to MNCs running full corporate campaigns. The size of the order doesn&rsquo;t change how seriously we take it.</p>
            </div>
            {values.length > 0 && (
              <div className="ab-values">
                {values.map((v, i) => (
                  <div key={i} className="ab-val">
                    {v.emoji && <div className="ab-val-ic">{v.emoji}</div>}
                    <div className="ab-val-t">{v.title}</div>
                    <div className="ab-val-d">{v.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clients */}
      {clients.length > 0 && (
        <div className="ab-section" style={{ background: '#f8f8f8' }}>
          <div className="ab-section-in">
            <div className="hs-tag">Who we serve</div>
            <h2 className="ab-sh">5,000+ Singapore businesses trust us.</h2>
            <div className="ab-client-grid">
              {clients.map((c, i) => (
                <div key={i} className="ab-client">
                  {c.emoji && <div className="ab-cl-ic">{c.emoji}</div>}
                  <div className="ab-cl-t">{c.title}</div>
                  <div className="ab-cl-d">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="cta-strip">
        <div className="home-sec-inner">
          <h2>Walk in. Or just ask.</h2>
          <p>Not sure what you need? Come to Paya Lebar Square and we&rsquo;ll help you figure it out. Or WhatsApp us — usually a reply within 30 minutes during opening hours.</p>
          <div className="cta-btns">
            <a href="https://wa.me/6585533497" target="_blank" rel="noopener noreferrer" className="btn-wh">💬 WhatsApp Us</a>
            <a href="https://maps.google.com/?q=60+Paya+Lebar+Road+B1-35" target="_blank" rel="noopener noreferrer" className="btn-wh-o">Get Directions</a>
          </div>
        </div>
      </div>
    </div>
  );
}
