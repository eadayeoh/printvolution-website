'use client';

// Interactive 3-question widget that recommends 3 combos. Name-card
// specific by default but designed so any product can power it via
// product.extras.chooser (jsonb). If no chooser data exists on the
// product, the component renders nothing.

import { useMemo, useState } from 'react';

type Choice = { val: string; primary: string; sub?: string };
type Question = { num: string; title: string; choices: Choice[] };

type Combo = {
  tag: string;
  match: string;
  title: string;
  /** New preferred shape: step_id -> option_slug (or raw value for qty/text).
   *  Resolved against the product's configurator at render. */
  picks?: Record<string, string>;
  /** Legacy manually-typed spec rows. Used as a fallback when `picks` is empty. */
  specs?: Array<{ k: string; v: string }>;
  why: string;
  price: string;
  cta_label: string;
  recommended?: boolean;
};

export type ChooserData = {
  kicker?: string;
  title?: string;        // e.g. "Find your perfect card"
  title_em?: string;     // e.g. "in 30 seconds."
  intro?: string;
  questions?: Question[];
  summary_prefix?: string; // e.g. "For"
  summary_suffix?: string; // e.g. "…"
  results_title?: string;
  combos?: Combo[];
};

/** Configurator shape used to resolve combo `picks` into readable spec rows. */
export type ChooserConfiguratorStep = {
  step_id: string;
  label: string;
  type: string;
  options?: Array<{ slug: string; label: string }>;
};

function resolveSpecs(
  combo: Combo,
  configurator: ChooserConfiguratorStep[] | undefined,
): Array<{ k: string; v: string }> {
  if (combo.picks && configurator && configurator.length > 0) {
    const rows: Array<{ k: string; v: string }> = [];
    for (const step of configurator) {
      const picked = combo.picks[step.step_id];
      if (!picked) continue;
      if (step.type === 'swatch' || step.type === 'select') {
        const opt = (step.options ?? []).find((o) => o.slug === picked);
        rows.push({ k: step.label, v: opt?.label ?? picked });
      } else {
        rows.push({ k: step.label, v: picked });
      }
    }
    if (rows.length > 0) return rows;
  }
  return combo.specs ?? [];
}

export const DEFAULT_NAME_CARD_CHOOSER: ChooserData = {
  kicker: 'Not sure which paper?',
  title: 'Find your perfect card',
  title_em: 'in 30 seconds.',
  intro: "Answer three quick questions — we'll recommend three combos that fit.",
  summary_prefix: 'For',
  summary_suffix: '',
  results_title: 'Here are your three best matches.',
  questions: [
    {
      num: 'Q 01',
      title: 'How many cards do you need?',
      choices: [
        { val: 'small', primary: '100 – 250', sub: 'Small run' },
        { val: 'medium', primary: '500 – 1,000', sub: 'Most popular' },
        { val: 'large', primary: '2,500+', sub: 'Volume' },
      ],
    },
    {
      num: 'Q 02',
      title: "What vibe are you going for?",
      choices: [
        { val: 'corporate', primary: 'Corporate & clean', sub: 'Finance, legal, B2B' },
        { val: 'creative', primary: 'Creative & bold', sub: 'Design, agency, media' },
        { val: 'warm', primary: 'Warm & personal', sub: 'F&B, wellness, retail' },
      ],
    },
    {
      num: 'Q 03',
      title: "What's your budget per card?",
      choices: [
        { val: 'tight', primary: 'Under S$0.15', sub: 'Budget-conscious' },
        { val: 'mid', primary: 'S$0.15 – S$0.30', sub: 'Sweet spot' },
        { val: 'premium', primary: 'S$0.30+', sub: 'No expense spared' },
      ],
    },
  ],
  combos: [
    {
      tag: 'Safe Bet',
      match: '88% match',
      title: 'The Classic.',
      specs: [
        { k: 'Paper', v: 'Matt Art 300gsm' },
        { k: 'Finish', v: 'Silk Lamination' },
        { k: 'Sides', v: 'Double-sided' },
        { k: 'Quantity', v: '500 cards' },
      ],
      why: "The *safe default*. Won't embarrass you at any meeting. Silk lam keeps fingerprints off and edges sharp.",
      price: 'S$58',
      cta_label: 'Use this combo',
    },
    {
      tag: '★ Recommended',
      match: '96% match',
      title: 'The Sweet Spot.',
      specs: [
        { k: 'Paper', v: 'Matt Art 350gsm Premium' },
        { k: 'Finish', v: 'Silk Lamination' },
        { k: 'Sides', v: 'Double-sided' },
        { k: 'Quantity', v: '500 cards' },
      ],
      why: "What *most of our corporate clients order*. Thicker feel, same clean look, only S$10 more. This is the one.",
      price: 'S$68.40',
      cta_label: 'Use this combo',
      recommended: true,
    },
    {
      tag: 'Step Up',
      match: '82% match',
      title: 'The Statement.',
      specs: [
        { k: 'Paper', v: 'Matt Art 350gsm Premium' },
        { k: 'Finish', v: 'Silk Lam + Spot UV' },
        { k: 'Sides', v: 'Double-sided' },
        { k: 'Quantity', v: '500 cards' },
      ],
      why: "For when *first impressions matter most*. Spot UV on the logo catches light — people notice, and remember.",
      price: 'S$96.40',
      cta_label: 'Use this combo',
    },
  ],
};

/** Pull the first swatch/select option group from a product's configurator
 *  — if there is one, we use those option labels to flavour the "combos"
 *  recommended below, so each product's chooser surfaces real choices
 *  instead of a placeholder. Returns the first 3 labels (or fewer). */
function extractOptionLabels(
  configurator: Array<{ type?: string; options?: Array<{ label?: string }> }> | undefined,
): string[] {
  for (const step of configurator ?? []) {
    if (step.type !== 'swatch' && step.type !== 'select') continue;
    const opts = (step.options ?? []).map((o) => o.label ?? '').filter(Boolean);
    if (opts.length >= 2) return opts.slice(0, 3);
  }
  return [];
}

/** Generate a chooser tailored to a given product. Uses the product name for
 *  headings and (where possible) the first configurator option group for the
 *  combo specs so the widget feels bespoke per product without per-product
 *  authoring. Admin can always override by setting product.extras.chooser. */
export function buildDefaultChooser(input: {
  name: string;
  category_name?: string | null;
  configurator?: Array<{ step_id?: string; type?: string; options?: Array<{ slug?: string; label?: string }> }>;
}): ChooserData {
  const name = input.name;
  const lower = name.toLowerCase();
  // Crude plural — works for the vast majority of print products. Admin
  // can override with custom chooser text when needed.
  const plural = /s$/i.test(lower) ? lower : `${lower}s`;
  const optLabels = extractOptionLabels(input.configurator);
  const defaultOpt = optLabels[0] ?? 'Standard';
  const premiumOpt = optLabels[1] ?? 'Premium';
  const topOpt = optLabels[2] ?? premiumOpt;

  // For generated combos, pick the first swatch/select step and assign
  // option 0 / 1 / 2 across Safe Bet / Recommended / Step Up combos.
  // Renderer resolves these picks to the step's option labels.
  const firstStep = (input.configurator ?? []).find(
    (s) => (s.type === 'swatch' || s.type === 'select') && (s.options ?? []).length >= 1,
  );
  const firstStepId = firstStep?.step_id;
  const firstStepOptionSlugs = (firstStep?.options ?? []).map((o) => o.slug ?? '').filter(Boolean);
  function picksFor(index: 0 | 1 | 2): Record<string, string> | undefined {
    if (!firstStepId) return undefined;
    const optIdx = Math.min(index, firstStepOptionSlugs.length - 1);
    const slug = firstStepOptionSlugs[optIdx];
    return slug ? { [firstStepId]: slug } : undefined;
  }
  return {
    kicker: 'Not sure which option?',
    title: `Find your perfect ${lower}`,
    title_em: 'in 30 seconds.',
    intro: "Answer three quick questions — we'll recommend three combos that fit.",
    summary_prefix: 'For',
    results_title: 'Here are your three best matches.',
    questions: [
      {
        num: 'Q 01',
        title: `How many ${plural} do you need?`,
        choices: [
          { val: 'small', primary: 'Small run', sub: 'Testing / personal' },
          { val: 'medium', primary: 'Medium run', sub: 'Most popular' },
          { val: 'large', primary: 'Large run', sub: 'Volume / launch' },
        ],
      },
      {
        num: 'Q 02',
        title: "What's the use case?",
        choices: [
          { val: 'corporate', primary: 'Corporate & clean', sub: 'Finance, legal, B2B' },
          { val: 'creative', primary: 'Creative & bold', sub: 'Design, agency, media' },
          { val: 'warm', primary: 'Warm & personal', sub: 'F&B, wellness, retail' },
        ],
      },
      {
        num: 'Q 03',
        title: "What's your budget?",
        choices: [
          { val: 'tight', primary: 'Budget-conscious', sub: 'Get it done' },
          { val: 'mid', primary: 'Sweet spot', sub: 'Most orders' },
          { val: 'premium', primary: 'No expense spared', sub: 'Statement piece' },
        ],
      },
    ],
    combos: [
      {
        tag: 'Safe Bet',
        match: '88% match',
        title: 'The Classic.',
        picks: picksFor(0),
        // Specs fallback for products with no configurator at all.
        specs: firstStep ? undefined : [
          { k: 'Option', v: defaultOpt },
          { k: 'Turnaround', v: '3 working days' },
          { k: 'Best for', v: 'Everyday use' },
        ],
        why: `The *safe default*. Standard ${lower}, standard turnaround — reliable, no surprises.`,
        price: 'Live pricing',
        cta_label: 'Use this combo',
      },
      {
        tag: '★ Recommended',
        match: '96% match',
        title: 'The Sweet Spot.',
        picks: picksFor(1),
        specs: firstStep ? undefined : [
          { k: 'Option', v: premiumOpt },
          { k: 'Turnaround', v: '3 working days' },
          { k: 'Best for', v: 'Most corporate orders' },
        ],
        why: `What *most of our corporate clients order*. Better ${lower} without breaking the bank. This is the one.`,
        price: 'Live pricing',
        cta_label: 'Use this combo',
        recommended: true,
      },
      {
        tag: 'Step Up',
        match: '82% match',
        title: 'The Statement.',
        picks: picksFor(2),
        specs: firstStep ? undefined : [
          { k: 'Option', v: topOpt },
          { k: 'Turnaround', v: '4–5 working days' },
          { k: 'Best for', v: 'First impressions' },
        ],
        why: `For when *first impressions matter most*. Top-tier ${lower}. Costs more, a little longer — lands different.`,
        price: 'Live pricing',
        cta_label: 'Use this combo',
      },
    ],
  };
}

function inlineStars(text: string) {
  // **bold** -> yellow highlight
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
      return (
        <b key={i} style={{ background: 'var(--pv-yellow)', padding: '1px 4px', fontWeight: 700 }}>
          {p.slice(1, -1)}
        </b>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export function PaperChooser({
  data,
  configurator,
}: {
  data?: ChooserData | null;
  configurator?: ChooserConfiguratorStep[];
}) {
  const d = data ?? DEFAULT_NAME_CARD_CHOOSER;
  const questions = d.questions ?? [];
  const combos = d.combos ?? [];

  // Track selected value per question index
  const [picks, setPicks] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    questions.forEach((q, i) => {
      const def = q.choices[Math.min(1, q.choices.length - 1)] ?? q.choices[0];
      if (def) initial[i] = def.val;
    });
    return initial;
  });

  const summary = useMemo(() => {
    return questions.map((q, i) => {
      const picked = q.choices.find((c) => c.val === picks[i]);
      return picked?.primary ?? '';
    }).filter(Boolean);
  }, [questions, picks]);

  if (questions.length === 0 || combos.length === 0) return null;

  return (
    <section style={{ background: 'var(--pv-cream)', padding: '72px 24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {d.kicker && (
            <div
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--pv-magenta)',
                marginBottom: 12,
              }}
            >
              {d.kicker}
            </div>
          )}
          <h2
            style={{
              fontFamily: 'var(--pv-f-display)',
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: 0.9,
              letterSpacing: '-0.03em',
              margin: 0,
              marginBottom: 10,
            }}
          >
            {d.title}
            {d.title_em && (
              <>
                <br />
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: '-2%',
                      width: '104%',
                      height: 16,
                      background: 'var(--pv-yellow)',
                      zIndex: -1,
                      transform: 'skew(-6deg)',
                    }}
                  />
                  {d.title_em}
                </span>
              </>
            )}
          </h2>
          {d.intro && (
            <p style={{ fontSize: 15, color: 'var(--pv-muted)', fontWeight: 500, margin: 0 }}>{d.intro}</p>
          )}
        </div>

        {/* Questions */}
        <div
          className="pv-chooser-questions"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, marginBottom: 40 }}
        >
          {questions.map((q, qi) => (
            <div
              key={qi}
              style={{
                background: '#fff',
                border: '2px solid var(--pv-ink)',
                boxShadow: '5px 5px 0 var(--pv-ink)',
                padding: 26,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 13,
                  background: 'var(--pv-ink)',
                  color: 'var(--pv-yellow)',
                  padding: '4px 10px',
                  marginBottom: 14,
                  letterSpacing: '0.04em',
                }}
              >
                {q.num}
              </div>
              <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 20, letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0, marginBottom: 18 }}>
                {q.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.choices.map((c) => {
                  const selected = picks[qi] === c.val;
                  return (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => setPicks((p) => ({ ...p, [qi]: c.val }))}
                      style={{
                        padding: '11px 13px',
                        border: '2px solid var(--pv-ink)',
                        background: selected ? 'var(--pv-ink)' : '#fff',
                        color: selected ? '#fff' : 'var(--pv-ink)',
                        cursor: 'pointer',
                        fontFamily: 'var(--pv-f-body)',
                        fontSize: 14,
                        fontWeight: 600,
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.12s',
                      }}
                    >
                      <span>
                        {c.primary}
                        {c.sub && (
                          <span
                            style={{
                              fontFamily: 'var(--pv-f-mono)',
                              fontSize: 10,
                              color: selected ? 'rgba(255,255,255,0.6)' : 'var(--pv-muted)',
                              letterSpacing: '0.04em',
                              fontWeight: 500,
                              marginLeft: 8,
                            }}
                          >
                            {c.sub}
                          </span>
                        )}
                      </span>
                      <span
                        aria-hidden
                        style={{
                          width: 18,
                          height: 18,
                          border: `2px solid ${selected ? 'var(--pv-yellow)' : 'var(--pv-rule)'}`,
                          background: selected ? 'var(--pv-yellow)' : 'transparent',
                          position: 'relative',
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--pv-ink)',
                          fontWeight: 900,
                          fontSize: 12,
                        }}
                      >
                        {selected ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div style={{ paddingTop: 40, borderTop: '3px solid var(--pv-ink)', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: -13,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--pv-magenta)',
              color: '#fff',
              padding: '5px 16px',
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              border: '2px solid var(--pv-ink)',
            }}
          >
            YOUR MATCHES
          </div>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            {summary.length > 0 && (
              <div
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 13,
                  color: 'var(--pv-muted)',
                  letterSpacing: '0.04em',
                  marginBottom: 8,
                }}
              >
                {d.summary_prefix ?? 'For'}{' '}
                {summary.map((s, i) => (
                  <span key={i}>
                    <b
                      style={{
                        background: 'var(--pv-ink)',
                        color: 'var(--pv-yellow)',
                        padding: '2px 8px',
                        fontWeight: 700,
                        margin: '0 2px',
                      }}
                    >
                      {s}
                    </b>
                    {i < summary.length - 1 ? ', ' : ''}
                  </span>
                ))}
                {d.summary_suffix}
              </div>
            )}
            {d.results_title && (
              <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 28, letterSpacing: '-0.02em', margin: 0 }}>
                {d.results_title}
              </h3>
            )}
          </div>
          <div
            className="pv-chooser-combos"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}
          >
            {combos.map((c, ci) => (
              <div
                key={ci}
                style={{
                  background: '#fff',
                  border: '3px solid var(--pv-ink)',
                  boxShadow: c.recommended ? '6px 6px 0 var(--pv-magenta)' : '6px 6px 0 var(--pv-ink)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    background: c.recommended ? 'var(--pv-magenta)' : 'var(--pv-cream)',
                    color: c.recommended ? '#fff' : 'var(--pv-ink)',
                    borderBottom: '2px solid var(--pv-ink)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {c.tag}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 10,
                      letterSpacing: '0.04em',
                      padding: '3px 8px',
                      background: c.recommended ? 'var(--pv-yellow)' : 'var(--pv-ink)',
                      color: c.recommended ? 'var(--pv-ink)' : 'var(--pv-yellow)',
                    }}
                  >
                    {c.match}
                  </span>
                </div>
                <div style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1, margin: 0, marginBottom: 14 }}>
                    {c.title}
                  </h4>
                  <div style={{ marginBottom: 16, padding: 12, background: 'var(--pv-cream)', border: '1px solid var(--pv-rule)' }}>
                    {resolveSpecs(c, configurator).map((s, si) => (
                      <div key={si} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
                        <span
                          style={{
                            fontFamily: 'var(--pv-f-mono)',
                            fontSize: 11,
                            color: 'var(--pv-muted)',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {s.k}
                        </span>
                        <span style={{ fontWeight: 700 }}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1, marginBottom: 16, fontSize: 13, lineHeight: 1.55, color: 'var(--pv-ink-soft)', fontWeight: 500 }}>
                    {inlineStars(c.why)}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      padding: '10px 0',
                      borderTop: '1px dashed var(--pv-rule)',
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Total incl. GST
                    </span>
                    <span style={{ fontFamily: 'var(--pv-f-display)', fontSize: 26, color: 'var(--pv-magenta)', letterSpacing: '-0.02em' }}>
                      {c.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: c.recommended ? 'var(--pv-magenta)' : 'var(--pv-ink)',
                      color: '#fff',
                      padding: '13px 16px',
                      border: 'none',
                      fontFamily: 'var(--pv-f-body)',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={() => {
                      // Scrolls the user to the configurator — no state integration yet.
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {c.cta_label} <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-chooser-questions, .pv-chooser-combos { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
