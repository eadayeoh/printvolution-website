// "Everything worth knowing, before you order." — magazine-style
// long-form SEO block for product pages. Each article renders with a
// big pink numeral, body copy, and an optional side widget (pill list,
// stat, schedule table, pull quote). Data comes from
// product.extras.seo_magazine (jsonb). If missing, component returns null.
//
// Inline formatting in body: **text** → bold ink, *text* → yellow-bg em.

import React from 'react';

export type MagazineSide =
  | { kind: 'pills'; label: string; items: Array<{ text: string; pop?: boolean }> }
  | { kind: 'stat'; label: string; num: string; suffix?: string; caption?: string }
  | { kind: 'list'; label: string; rows: Array<{ text: string; time?: string }> }
  | { kind: 'quote'; text: string; attr?: string };

export type MagazineArticle = {
  num?: string;
  title?: string;
  body?: string[]; // paragraphs
  side?: MagazineSide;
};

export type SeoMagazineData = {
  issue_label?: string;   // "Issue №01 · Name Cards"
  title?: string;         // "Everything worth knowing,"
  title_em?: string;      // "before you order."
  lede?: string;          // First paragraph under the title
  articles?: MagazineArticle[];
};

export const DEFAULT_NAME_CARD_MAGAZINE: SeoMagazineData = {
  issue_label: 'Issue №01 · Name Cards',
  title: 'Everything worth knowing,',
  title_em: 'before you order.',
  lede:
    "Ordering **name cards in Singapore** shouldn't take a design degree. Here's what actually matters when you're picking paper, finish, and turnaround — written plainly, with the details you need to make a decision you won't regret.",
  articles: [
    {
      num: '01',
      title: 'Why the paper matters more than the design.',
      body: [
        "A name card is a first impression in your hand. Before anyone reads the text, they feel the **weight, the finish, and the thickness**. Our most popular stock for corporate clients is **Matt Art Premium 350gsm** — heavyweight enough to feel substantial, silky enough to take silk lamination beautifully, and neutral enough to let any design breathe.",
        "For creative and artisanal brands, we recommend Natural Linen (textured) or Cotton 600gsm (luxury weight, letterpress-ready). Every paper we stock is **FSC-certified** and sourced from established Japanese and Korean mills — no budget paper sneaked in to cut margins.",
      ],
      side: {
        kind: 'pills',
        label: 'Our Top 6 Papers',
        items: [
          { text: 'Matt Art 350gsm', pop: true },
          { text: 'Gloss Art 350gsm' },
          { text: 'Natural Linen' },
          { text: 'Kraft Brown' },
          { text: 'Cotton 600gsm' },
          { text: 'Pearl' },
        ],
      },
    },
    {
      num: '02',
      title: 'Finishes: the detail people remember.',
      body: [
        "A good finish is the difference between a card that gets kept in a wallet and one that gets tossed in a drawer. **Silk lamination** is our most ordered finish — adds durability, a subtle sheen, and a premium feel without the plastic look of gloss.",
        "For cards that need to photograph well on LinkedIn or Instagram, **Spot UV** raises selected elements (logos, names, patterns) in a glossy coat against matt. **Foil stamping** in gold, rose gold, or copper adds metallic catch-light that cheap cards simply can't replicate. **Die-cut** custom shapes give a silhouette that stands out in a stack of 50.",
      ],
      side: {
        kind: 'stat',
        label: 'Order Rate',
        num: '62',
        suffix: '%',
        caption: 'of our name card orders include silk lamination',
      },
    },
    {
      num: '03',
      title: "Fast when you need it, careful when you don't.",
      body: [
        "Our standard offset turnaround is **3 working days** from approved preflight. Orders with spot UV or foil stamp add 1–2 days for curing — rushing that step means the finish peels, so we don't. If you need something today, **same-day digital printing** is available for orders submitted before 4pm at our Paya Lebar Square location.",
        "We offer **islandwide next-day delivery** across Singapore, free on orders over S$80. Or you can collect in person from our Paya Lebar shop — 2 minutes from the MRT.",
      ],
      side: {
        kind: 'list',
        label: 'Turnaround Times',
        rows: [
          { text: 'Digital (same-day)', time: '< 8hr' },
          { text: 'Offset standard', time: '3 days' },
          { text: 'Offset + Foil/UV', time: '4–5 days' },
          { text: 'SG delivery', time: 'Next day' },
        ],
      },
    },
    {
      num: '04',
      title: 'Why we check every file by hand.',
      body: [
        "Every order at Printvolution gets reviewed by a real person within **2 working hours**. We check **CMYK conversion, 300dpi resolution, 3mm bleed, and font embedding** before anything touches the press. If there's an issue, we flag it and hold production until you resubmit.",
        "It's a small difference on paper, a big one when your 500 cards arrive correctly instead of with faded colour, cut-off edges, or missing fonts.",
      ],
      side: {
        kind: 'quote',
        text: 'They caught a CMYK conversion issue before going to press. Saved my launch campaign.',
        attr: 'Marketing Director, SG Fintech',
      },
    },
  ],
};

/** Pick the first swatch/select configurator group whose label hints at a
 *  material / paper / finish choice — that'll power the side-widget on
 *  article 01. */
function extractMaterialGroup(
  configurator: Array<{ label?: string; type?: string; options?: Array<{ label?: string }> }> | undefined,
): { label: string; items: string[] } | null {
  if (!configurator) return null;
  const material = configurator.find(
    (s) => (s.type === 'swatch' || s.type === 'select') &&
      /paper|stock|material|fabric|vinyl|acrylic|wood|metal|size|dimension/i.test(s.label ?? ''),
  );
  if (!material) return null;
  const items = (material.options ?? []).map((o) => o.label ?? '').filter(Boolean).slice(0, 6);
  return items.length > 0 ? { label: `Top ${items.length} ${material.label?.toLowerCase() ?? 'options'}`, items } : null;
}

function extractFinishGroup(
  configurator: Array<{ label?: string; type?: string; options?: Array<{ label?: string; note?: string }> }> | undefined,
): { label: string; items: string[] } | null {
  if (!configurator) return null;
  const finish = configurator.find(
    (s) => (s.type === 'swatch' || s.type === 'select') &&
      /finish|lamination|coating|print|sides|quality/i.test(s.label ?? ''),
  );
  if (!finish) return null;
  const items = (finish.options ?? []).map((o) => o.label ?? '').filter(Boolean).slice(0, 6);
  return items.length > 0 ? { label: finish.label ?? 'Finish options', items } : null;
}

/** Generate a magazine block tailored to a specific product. Uses the
 *  product's name for headings, the category for the issue label, and the
 *  configurator's material / finish option groups for the side widgets.
 *  Content is generic enough to apply to any product; admin can override
 *  with fully custom articles via product.extras.seo_magazine. */
export function buildDefaultMagazine(input: {
  name: string;
  category_name?: string | null;
  tagline?: string | null;
  description?: string | null;
  configurator?: Array<{ label?: string; type?: string; options?: Array<{ label?: string; note?: string }> }>;
}): SeoMagazineData {
  const name = input.name;
  const lower = name.toLowerCase();
  const cat = input.category_name ?? 'Print';
  const material = extractMaterialGroup(input.configurator);
  const finish = extractFinishGroup(input.configurator);

  const lede =
    input.tagline ??
    input.description?.slice(0, 240) ??
    `Ordering **${lower} in Singapore** shouldn't take a design degree. Here's what actually matters when you're picking options, finish, and turnaround — written plainly, with the details you need to make a decision you won't regret.`;

  const article1Side: MagazineSide = material
    ? {
        kind: 'pills',
        label: material.label,
        items: material.items.map((t, i) => ({ text: t, pop: i === 0 })),
      }
    : {
        kind: 'stat',
        label: 'Checked by hand',
        num: '100',
        suffix: '%',
        caption: `of ${lower} orders pass a preflight check`,
      };

  const article2Side: MagazineSide = finish
    ? {
        kind: 'pills',
        label: finish.label,
        items: finish.items.map((t) => ({ text: t })),
      }
    : {
        kind: 'stat',
        label: 'Reorder rate',
        num: '72',
        suffix: '%',
        caption: 'of corporate clients come back within 90 days',
      };

  return {
    issue_label: `Issue №01 · ${name}`,
    title: 'Everything worth knowing,',
    title_em: 'before you order.',
    lede,
    articles: [
      {
        num: '01',
        title: `What makes a good ${lower}.`,
        body: [
          `A ${lower} is a first impression in someone's hand or on their wall. Before anyone reads the text, they feel the **material, the finish, and the weight**. The best ${lower} in Singapore pair thoughtful ${cat.toLowerCase()} craft with a finish that holds up to real-world use — moisture, fingerprints, handbag wear and tear.`,
          `Every option we offer is **FSC-certified** where applicable and carefully sourced. No budget substitutions sneaked in to cut margins — what you see in the configurator is what runs on the press.`,
        ],
        side: article1Side,
      },
      {
        num: '02',
        title: 'The details people remember.',
        body: [
          `A good finish is the difference between a ${lower} that gets kept and one that gets tossed. Our default finishes are chosen to photograph well on LinkedIn and Instagram, age gracefully, and survive SG humidity without curling, delaminating, or fading.`,
          `Upgraded finishes — **spot UV, foil, embossing, die-cut** — cost a little more and take an extra day or two to cure. For a statement piece that has to land, they're worth every dollar.`,
        ],
        side: article2Side,
      },
      {
        num: '03',
        title: "Fast when you need it, careful when you don't.",
        body: [
          'Our standard turnaround is **3 working days** from approved preflight. Orders with speciality finishes (spot UV, foil, embossing) add 1–2 days for curing — rushing that step means the finish peels, so we don\'t. If you need something today, **same-day digital printing** is available for orders submitted before 4pm at our Paya Lebar Square location.',
          'We offer **islandwide next-day delivery** across Singapore, free on orders over S$80. Or collect in person from Paya Lebar Square — 2 minutes from the MRT.',
        ],
        side: {
          kind: 'list',
          label: 'Turnaround Times',
          rows: [
            { text: 'Digital (same-day)', time: '< 8hr' },
            { text: 'Standard', time: '3 days' },
            { text: 'Specialty finish', time: '4–5 days' },
            { text: 'SG delivery', time: 'Next day' },
          ],
        },
      },
      {
        num: '04',
        title: 'Why we check every file by hand.',
        body: [
          `Every ${lower} order at Printvolution gets reviewed by a real person within **2 working hours**. We check **CMYK conversion, 300dpi resolution, 3mm bleed, and font embedding** before anything touches the press. If there's an issue, we flag it and hold production until you resubmit.`,
          `It's a small difference on paper — a big one when the order arrives correctly instead of with faded colour, cut-off edges, or missing fonts.`,
        ],
        side: {
          kind: 'quote',
          text: 'They caught a CMYK conversion issue before going to press. Saved my launch campaign.',
          attr: 'Marketing Director, SG Fintech',
        },
      },
    ],
  };
}

function inlineFormat(text: string) {
  // Split on both **bold** and *emph* in a single pass.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) {
      return (
        <b key={i} style={{ color: 'var(--pv-ink)', fontWeight: 700 }}>
          {p.slice(2, -2)}
        </b>
      );
    }
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
      return (
        <em key={i} style={{ background: 'var(--pv-yellow)', padding: '1px 4px', fontStyle: 'normal', fontWeight: 700 }}>
          {p.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

function SideWidget({ side }: { side: MagazineSide | undefined }) {
  if (!side) return null;

  const commonBox: React.CSSProperties = {
    padding: 18,
    background: 'var(--pv-cream)',
    border: '2px solid var(--pv-ink)',
    boxShadow: '4px 4px 0 var(--pv-ink)',
  };
  const label: React.CSSProperties = {
    fontFamily: 'var(--pv-f-mono)',
    fontSize: 10,
    color: 'var(--pv-magenta)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: '1px dashed var(--pv-rule)',
  };

  if (side.kind === 'pills') {
    return (
      <aside style={commonBox}>
        <div style={label}>{side.label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {side.items.map((it, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 10,
                padding: '5px 9px',
                background: it.pop ? 'var(--pv-magenta)' : '#fff',
                color: it.pop ? '#fff' : 'var(--pv-ink)',
                border: `1px solid ${it.pop ? 'var(--pv-magenta)' : 'var(--pv-rule)'}`,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {it.text}
            </span>
          ))}
        </div>
      </aside>
    );
  }

  if (side.kind === 'stat') {
    return (
      <aside style={commonBox}>
        <div style={label}>{side.label}</div>
        <div style={{ textAlign: 'center', padding: '6px 0' }}>
          <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 54, lineHeight: 0.9, letterSpacing: '-0.04em', color: 'var(--pv-ink)', marginBottom: 6 }}>
            {side.num}
            {side.suffix && <sup style={{ fontSize: 20, color: 'var(--pv-magenta)', marginLeft: 2 }}>{side.suffix}</sup>}
          </div>
          {side.caption && (
            <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
              {side.caption}
            </div>
          )}
        </div>
      </aside>
    );
  }

  if (side.kind === 'list') {
    return (
      <aside style={commonBox}>
        <div style={label}>{side.label}</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {side.rows.map((r, i) => (
            <li
              key={i}
              style={{
                padding: '7px 0',
                borderBottom: i === side.rows.length - 1 ? 'none' : '1px dashed var(--pv-rule)',
                fontSize: 13,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'var(--pv-f-mono)',
                letterSpacing: '0.04em',
              }}
            >
              <span>{r.text}</span>
              {r.time && <span style={{ fontWeight: 700, color: 'var(--pv-magenta)' }}>{r.time}</span>}
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  if (side.kind === 'quote') {
    return (
      <aside style={commonBox}>
        <blockquote style={{ margin: 0, fontFamily: 'var(--pv-f-display)', fontSize: 17, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--pv-ink)' }}>
          &ldquo;{side.text}&rdquo;
          {side.attr && (
            <span
              style={{
                display: 'block',
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px dashed var(--pv-rule)',
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pv-muted)',
              }}
            >
              — {side.attr}
            </span>
          )}
        </blockquote>
      </aside>
    );
  }

  return null;
}

export function SeoMagazine({ data }: { data?: SeoMagazineData | null }) {
  const d = data ?? DEFAULT_NAME_CARD_MAGAZINE;
  const articles = d.articles ?? [];
  if (articles.length === 0) return null;

  return (
    <section style={{ background: '#fff', padding: '72px 24px', borderTop: '2px solid var(--pv-ink)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          className="pv-mag-title-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 22,
            alignItems: 'end',
            marginBottom: 40,
            paddingBottom: 22,
            borderBottom: '2px solid var(--pv-ink)',
          }}
        >
          {d.issue_label && (
            <div
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--pv-muted)',
                fontWeight: 700,
                padding: '6px 10px',
                border: '1.5px solid var(--pv-ink)',
                background: 'var(--pv-yellow)',
                alignSelf: 'start',
                marginTop: 8,
              }}
            >
              {d.issue_label}
            </div>
          )}
          {(d.title || d.title_em) && (
            <h2
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(36px, 4.5vw, 60px)',
                lineHeight: 0.92,
                letterSpacing: '-0.04em',
                margin: 0,
              }}
            >
              {d.title}
              {d.title_em && (
                <>
                  <br />
                  <em style={{ fontStyle: 'normal', color: 'var(--pv-magenta)' }}>{d.title_em}</em>
                </>
              )}
            </h2>
          )}
        </div>

        {d.lede && (
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: 'var(--pv-muted)',
              maxWidth: 720,
              marginBottom: 36,
              fontWeight: 500,
            }}
          >
            {inlineFormat(d.lede)}
          </p>
        )}

        {articles.map((a, i) => (
          <article
            key={i}
            className="pv-mag-article"
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 280px',
              gap: 36,
              padding: '36px 0',
              borderBottom: i === articles.length - 1 ? 'none' : '1px solid var(--pv-rule)',
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 64,
                  lineHeight: 0.9,
                  letterSpacing: '-0.06em',
                  color: 'var(--pv-magenta)',
                }}
              >
                {a.num}
              </div>
              <div style={{ width: 50, height: 3, background: 'var(--pv-ink)', marginTop: 10 }} />
            </div>
            <div>
              {a.title && (
                <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0, marginBottom: 12 }}>
                  {a.title}
                </h3>
              )}
              {(a.body ?? []).map((p, pi) => (
                <p
                  key={pi}
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: 'var(--pv-ink-soft)',
                    marginBottom: pi === (a.body ?? []).length - 1 ? 0 : 10,
                    fontWeight: 500,
                  }}
                >
                  {inlineFormat(p)}
                </p>
              ))}
            </div>
            <SideWidget side={a.side} />
          </article>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-mag-title-row { grid-template-columns: 1fr !important; gap: 14px !important; }
          .pv-mag-article { grid-template-columns: 1fr !important; gap: 18px !important; padding: 26px 0 !important; }
        }
      `}</style>
    </section>
  );
}
