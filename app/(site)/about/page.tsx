import { getPageContent } from '@/lib/data/page_content';

export const metadata = {
  title: 'About Printvolution',
  description: 'Printing and personalised gifts at Paya Lebar Square, Singapore. Started small, stayed obsessed with quality.',
  alternates: { canonical: 'https://printvolution.sg/about' },
};

type Item = { image_url?: string; emoji?: string; title: string; desc: string };

/** Look up the first item in a section (section_content is an array — we
 *  treat single-row sections like hero/story/cta as "take item[0]"). */
function first<T = any>(section: any): T | null {
  const items = section?.items;
  if (Array.isArray(items) && items.length > 0) return items[0] as T;
  return null;
}

export default async function AboutPage() {
  const content = await getPageContent('about');
  const hero = first<any>(content.hero) ?? {};
  const story = first<any>(content.story) ?? {};
  const cta = first<any>(content.cta) ?? {};
  const values = (content.values?.items ?? []) as Item[];
  const clients = (content.clients?.items ?? []) as Item[];

  // Fallbacks so the page still looks good if admin hasn't edited yet
  const heroTag = hero.tag || 'About';
  const heroH1 = hero.h1 || 'We\'re the print shop\nthat actually gives a damn.';
  const heroSub = hero.sub || 'Based at Paya Lebar Square. Been doing this long enough to know what matters — and what doesn\'t.';
  const stats = [
    { n: hero.stat1_n || '2015', l: hero.stat1_l || 'Founded' },
    { n: hero.stat2_n || '5K+', l: hero.stat2_l || 'Clients Served' },
    { n: hero.stat3_n || '90+', l: hero.stat3_l || 'Products' },
    { n: hero.stat4_n || '10+', l: hero.stat4_l || 'Years' },
  ].filter((s) => s.n && s.l);

  const storyTag = story.tag || 'Our Story';
  const storyH2 = story.h2 || 'Started small.\nStayed obsessed with quality.';
  const storyParas = [story.para1, story.para2, story.para3].filter(Boolean);

  const ctaH2 = cta.h2 || 'Walk in. Or just ask.';
  const ctaP = cta.p || 'Not sure what you need? Come to Paya Lebar Square and we\'ll help you figure it out. Or WhatsApp us — usually a reply within 30 minutes during opening hours.';
  const btn1 = { label: cta.btn1_label || '💬 WhatsApp Us', href: cta.btn1_href || 'https://wa.me/6585533497' };
  const btn2 = { label: cta.btn2_label || 'Get Directions', href: cta.btn2_href || 'https://maps.google.com/?q=60+Paya+Lebar+Road+B1-35' };

  return (
    <div className="screen active" id="screen-about">
      {/* Hero */}
      <div className="ab-hero">
        <div className="ab-hero-inner">
          <div className="ab-hero-text">
            <div className="hs-tag" style={{ color: '#E91E8C' }}>{heroTag}</div>
            <h1 className="ab-h1" style={{ whiteSpace: 'pre-line' }}>{heroH1}</h1>
            <p className="ab-sub" style={{ color: 'rgba(255,255,255,.7)' }}>{heroSub}</p>
          </div>
          <div className="ab-hero-stat">
            {stats.map((s, i) => (
              <div key={i} className="ab-stat">
                <div className="ab-stat-n">{s.n}</div>
                <div className="ab-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="ab-section">
        <div className="ab-section-in">
          <div className="ab-story-grid">
            <div>
              <div className="hs-tag">{storyTag}</div>
              <h2 className="ab-sh" style={{ whiteSpace: 'pre-line' }}>{storyH2}</h2>
              {storyParas.map((p, i) => (
                <p key={i} className="ab-p">{p}</p>
              ))}
            </div>
            {values.length > 0 && (
              <div className="ab-values">
                {values.map((v, i) => (
                  <div key={i} className="ab-val">
                    {(v.image_url || v.emoji) && (
                      <div className="ab-val-ic" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 64 }}>
                        {v.image_url ? (
                          <img src={v.image_url} alt={v.title} style={{ width: 56, height: 56, objectFit: 'contain' }} />
                        ) : (
                          <span>{v.emoji}</span>
                        )}
                      </div>
                    )}
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
                  {(c.image_url || c.emoji) && (
                    <div className="ab-cl-ic" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56 }}>
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.title} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                      ) : (
                        <span>{c.emoji}</span>
                      )}
                    </div>
                  )}
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
          <h2>{ctaH2}</h2>
          <p>{ctaP}</p>
          <div className="cta-btns">
            <a href={btn1.href} target="_blank" rel="noopener noreferrer" className="btn-wh">{btn1.label}</a>
            <a href={btn2.href} target="_blank" rel="noopener noreferrer" className="btn-wh-o">{btn2.label}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
