// Five visual-language mockups for the homepage hero. Same content
// in every block, different typography / colour / treatment so the
// owner can pick one. Lives at /preview/styles — not linked from
// production nav, robots disallowed.
//
// Each variant is a single full-bleed section, so the page reads as
// a vertical scroll-through. Ignore fidelity to actual brand assets;
// this is purely about feel.

export const metadata = {
  title: 'Homepage style options',
  robots: { index: false, follow: false },
};

const HEADLINE = 'Print + personalised gifts, made on-site at Paya Lebar Square.';
const EYEBROW = 'Studio · Singapore';
const BODY = 'Walk in for same-day flyers. Commission a one-off engraved frame. We figure it out — and we keep our prices on the wall.';
const CTA_PRIMARY = 'Browse the catalogue';
const CTA_SECONDARY = 'WhatsApp the studio';

export default function HomepageStyleGallery() {
  return (
    <div style={{ background: '#1a1a1a', color: '#fff', paddingBottom: 80 }}>
      <header style={{ padding: '40px 28px 16px', borderBottom: '1px solid #333', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>
          Homepage hero — visual-language options
        </div>
        <p style={{ fontSize: 14, color: '#aaa', margin: 0, maxWidth: 600, marginInline: 'auto', lineHeight: 1.6 }}>
          Same words in every block. Each shows a different typography + colour + treatment — pick the letter you want and we&rsquo;ll build the full homepage in that style.
        </p>
      </header>

      <Variant
        letter="A"
        name="Risograph zine"
        descriptor="Bold condensed sans + halftone dots · Two-colour bleed · Posterised photos · Pink/Black"
      >
        <RisographHero />
      </Variant>

      <Variant
        letter="B"
        name="Editorial quiet"
        descriptor="Big serif headline + thin sans body · Cream + one accent · Real product photos · Lots of whitespace"
      >
        <EditorialHero />
      </Variant>

      <Variant
        letter="C"
        name="Y2K maximalist"
        descriptor="Display sans with chrome/bevel · Saturated pink + lime · Stickers and scribbles · Loud"
      >
        <Y2KHero />
      </Variant>

      <Variant
        letter="D"
        name="Brutalist grid"
        descriptor="Monospace everywhere · B&W with one pink ribbon · Tight grid · Technical, designer-tier"
      >
        <BrutalistHero />
      </Variant>

      <Variant
        letter="E"
        name="Soft 90s catalogue"
        descriptor="Rounded sans + handwritten captions · Pastel cream / baby-pink / soft mint · Rounded photo frames · Friendly"
      >
        <SoftCatalogueHero />
      </Variant>

      <div style={{
        textAlign: 'center', marginTop: 60, padding: '32px 28px',
        border: '1px dashed #444', maxWidth: 640, marginInline: 'auto', borderRadius: 8,
      }}>
        <p style={{ fontSize: 14, color: '#bbb', margin: 0, lineHeight: 1.7 }}>
          Tell me a letter (A / B / C / D / E) and I&rsquo;ll build the full homepage — every section re-skinned in that visual language. Or paste a reference site and I&rsquo;ll match its feel.
        </p>
      </div>
    </div>
  );
}

function Variant({
  letter, name, descriptor, children,
}: { letter: string; name: string; descriptor: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: '60px 24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: 8, background: '#E91E8C',
            color: '#fff', fontWeight: 900, fontSize: 22, fontFamily: 'monospace',
          }}>
            {letter}
          </span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{name}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{descriptor}</div>
          </div>
        </div>
        <div style={{
          borderRadius: 12, overflow: 'hidden', border: '1px solid #333',
        }}>
          {children}
        </div>
      </div>
    </section>
  );
}

// ---------- A. Risograph zine ----------
function RisographHero() {
  return (
    <div
      style={{
        position: 'relative',
        background: '#FFEDC2',
        color: '#0a0a0a',
        padding: '64px 56px 80px',
        backgroundImage: `radial-gradient(circle, #E91E8C 1.2px, transparent 1.2px)`,
        backgroundSize: '14px 14px',
        backgroundPosition: '0 0',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: -40, right: -60,
        width: 320, height: 320, borderRadius: '50%',
        background: '#E91E8C', mixBlendMode: 'multiply', opacity: 0.85,
      }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase', marginBottom: 20 }}>
          ▲ {EYEBROW}
        </div>
        <h1 style={{
          fontFamily: 'Impact, "Helvetica Neue Condensed", sans-serif',
          fontSize: 'clamp(44px, 6vw, 84px)',
          fontWeight: 900, letterSpacing: '-0.01em',
          lineHeight: 0.95, margin: 0,
          textTransform: 'uppercase',
        }}>
          {HEADLINE}
        </h1>
        <p style={{ fontSize: 16, fontFamily: 'ui-monospace, monospace', maxWidth: 540, marginTop: 28, lineHeight: 1.7 }}>
          {BODY}
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Btn variant="riso-primary">{CTA_PRIMARY} →</Btn>
          <Btn variant="riso-secondary">{CTA_SECONDARY}</Btn>
        </div>
      </div>
    </div>
  );
}

// ---------- B. Editorial quiet ----------
function EditorialHero() {
  return (
    <div style={{ background: '#FAF7F0', padding: '120px 80px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 80, alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700, color: '#E91E8C', textTransform: 'uppercase', marginBottom: 28 }}>
          {EYEBROW}
        </div>
        <h1 style={{
          fontFamily: 'Georgia, "Iowan Old Style", serif',
          fontSize: 'clamp(40px, 5vw, 68px)',
          fontWeight: 400, letterSpacing: '-0.02em',
          lineHeight: 1.05, margin: 0, color: '#0a0a0a',
        }}>
          {HEADLINE}
        </h1>
        <p style={{ fontSize: 16, color: '#444', maxWidth: 480, marginTop: 32, lineHeight: 1.8, fontWeight: 300 }}>
          {BODY}
        </p>
        <div style={{ marginTop: 40, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn variant="editorial-primary">{CTA_PRIMARY}</Btn>
          <a href="#" style={{
            color: '#0a0a0a', textDecoration: 'none', fontSize: 13, fontWeight: 600,
            borderBottom: '1px solid #0a0a0a', paddingBottom: 3,
          }}>
            {CTA_SECONDARY} →
          </a>
        </div>
      </div>
      <div style={{
        aspectRatio: '3/4',
        background: 'linear-gradient(135deg, #f0e8d8 0%, #e8dcc8 100%)',
        borderRadius: 4, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', bottom: 18, left: 18, right: 18,
          fontSize: 10, color: '#777', letterSpacing: 1, textTransform: 'uppercase', fontStyle: 'italic',
        }}>
          plate 01 — engraved acrylic, walnut base
        </div>
      </div>
    </div>
  );
}

// ---------- C. Y2K maximalist ----------
function Y2KHero() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #FF1B8B 0%, #FF6BC4 50%, #C9F23B 100%)',
      padding: '60px 40px 90px',
      position: 'relative',
      overflow: 'hidden',
      color: '#0a0a0a',
    }}>
      <div style={{
        position: 'absolute', top: 30, right: 40,
        background: '#FFD700',
        padding: '8px 18px', borderRadius: 999,
        fontFamily: '"Bungee", "Trebuchet MS", sans-serif',
        fontSize: 13, fontWeight: 900, letterSpacing: 0.6,
        transform: 'rotate(8deg)', boxShadow: '4px 4px 0 #0a0a0a',
        border: '2.5px solid #0a0a0a',
      }}>
        ✦ NEW ! ✦
      </div>
      <div style={{ display: 'inline-block', background: '#fff', padding: '4px 14px', borderRadius: 999, border: '2.5px solid #0a0a0a', fontFamily: 'monospace', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>
          ☆ {EYEBROW} ☆
        </div>
      <h1 style={{
        fontFamily: '"Trebuchet MS", "Arial Rounded MT Bold", sans-serif',
        fontSize: 'clamp(48px, 7vw, 96px)', fontWeight: 900,
        letterSpacing: '-0.02em', lineHeight: 0.95, margin: 0,
        background: 'linear-gradient(180deg, #fff 0%, #ffd2ec 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        textShadow: '4px 4px 0 #0a0a0a',
        filter: 'drop-shadow(0 0 0 #0a0a0a)',
      }}>
        {HEADLINE}
      </h1>
      <p style={{ fontSize: 17, color: '#0a0a0a', maxWidth: 560, marginTop: 30, lineHeight: 1.5, fontWeight: 600, background: 'rgba(255,255,255,0.55)', padding: '12px 16px', borderRadius: 12, border: '2px solid #0a0a0a' }}>
        {BODY}
      </p>
      <div style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Btn variant="y2k-primary">▶ {CTA_PRIMARY}</Btn>
        <Btn variant="y2k-secondary">{CTA_SECONDARY}</Btn>
      </div>
    </div>
  );
}

// ---------- D. Brutalist grid ----------
function BrutalistHero() {
  return (
    <div style={{
      background: '#fff', color: '#0a0a0a',
      fontFamily: 'ui-monospace, "JetBrains Mono", "IBM Plex Mono", monospace',
      borderTop: '4px solid #0a0a0a', borderBottom: '4px solid #0a0a0a',
    }}>
      <div style={{ padding: '14px 28px', borderBottom: '1px solid #0a0a0a', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
        <span>PRINTVOLUTION_/_HOME.001</span>
        <span style={{ color: '#E91E8C' }}>● LIVE</span>
        <span>PAYA_LEBAR_SG</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0 }}>
        <div style={{ padding: '64px 40px', borderRight: '1px solid #0a0a0a' }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 24 }}>
            {'>'} {EYEBROW.toLowerCase()}
          </div>
          <h1 style={{
            fontFamily: 'inherit',
            fontSize: 'clamp(34px, 4.5vw, 60px)',
            fontWeight: 700, letterSpacing: '-0.02em',
            lineHeight: 1.05, margin: 0,
          }}>
            {HEADLINE.toLowerCase()}
          </h1>
          <div style={{
            display: 'inline-block', marginTop: 22, padding: '4px 10px',
            background: '#E91E8C', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: 1,
          }}>
            * print + gifts · same day if you walk in *
          </div>
          <p style={{ fontSize: 13, color: '#444', maxWidth: 540, marginTop: 28, lineHeight: 1.7 }}>
            {BODY}
          </p>
          <div style={{ marginTop: 36, display: 'flex', gap: 12 }}>
            <Btn variant="brutal-primary">[ {CTA_PRIMARY.toLowerCase()} ]</Btn>
            <Btn variant="brutal-secondary">[ {CTA_SECONDARY.toLowerCase()} ]</Btn>
          </div>
        </div>
        <div style={{ background: '#fafaf7', padding: 28, fontSize: 11, lineHeight: 1.9 }}>
          <div style={{ fontWeight: 800, marginBottom: 14, fontSize: 11, letterSpacing: 1 }}>// METADATA</div>
          <div>shop_floor.....paya_lebar_sq</div>
          <div>open_hours.....mon-fri_10-19</div>
          <div>turnaround.....24h_typical</div>
          <div>min_order......$28_namecards</div>
          <div>nps_90d........—</div>
          <div style={{ marginTop: 14, fontWeight: 800, fontSize: 11, letterSpacing: 1 }}>// CTA</div>
          <div>walk_in........confirmed</div>
          <div>ship_island....\${'<'}_3_days</div>
        </div>
      </div>
    </div>
  );
}

// ---------- E. Soft 90s catalogue ----------
function SoftCatalogueHero() {
  return (
    <div style={{
      background: '#FFF6EE',
      padding: '72px 56px 96px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 28, right: 56,
        width: 92, height: 92, borderRadius: '50%',
        background: '#FFD3DD', filter: 'blur(2px)',
      }} />
      <div style={{
        position: 'absolute', bottom: 32, left: '52%',
        width: 60, height: 60, borderRadius: '50%',
        background: '#C7E9D6', filter: 'blur(1px)',
      }} />
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 999,
            background: '#FFE0EC', color: '#A11460', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20,
          }}>
            ✿ {EYEBROW}
          </div>
          <h1 style={{
            fontFamily: '"Quicksand", "Avenir Next Rounded", "SF Pro Rounded", sans-serif',
            fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 700,
            letterSpacing: '-0.01em', lineHeight: 1.1, margin: 0, color: '#0a0a0a',
          }}>
            {HEADLINE}
          </h1>
          <div style={{
            marginTop: 14, fontFamily: '"Caveat", "Marker Felt", cursive',
            fontSize: 22, color: '#A11460',
          }}>
            ~ made for your good people ~
          </div>
          <p style={{ fontFamily: '"Quicksand", sans-serif', fontSize: 16, color: '#555', maxWidth: 460, marginTop: 22, lineHeight: 1.7 }}>
            {BODY}
          </p>
          <div style={{ marginTop: 30, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn variant="soft-primary">{CTA_PRIMARY}</Btn>
            <Btn variant="soft-secondary">{CTA_SECONDARY}</Btn>
          </div>
        </div>
        <div style={{
          aspectRatio: '4/5',
          background: 'linear-gradient(135deg, #FFD3DD 0%, #FFE7B0 100%)',
          borderRadius: 32, border: '4px solid #fff',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -14, left: -14,
            background: '#0a0a0a', color: '#fff',
            padding: '4px 12px', borderRadius: 999,
            fontFamily: '"Caveat", cursive', fontSize: 18, transform: 'rotate(-6deg)',
          }}>
            new!
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- shared button styles ----------
function Btn({ variant, children }: { variant: string; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    'riso-primary':       { background: '#0a0a0a', color: '#FFEDC2', border: '3px solid #0a0a0a', fontFamily: 'ui-monospace, monospace', padding: '14px 26px', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 0 },
    'riso-secondary':     { background: '#FFEDC2', color: '#0a0a0a', border: '3px solid #0a0a0a', fontFamily: 'ui-monospace, monospace', padding: '14px 26px', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 0 },
    'editorial-primary':  { background: '#0a0a0a', color: '#fff', padding: '14px 32px', fontSize: 13, fontWeight: 600, letterSpacing: 0.5, borderRadius: 0, border: 'none', fontFamily: 'inherit' },
    'y2k-primary':        { background: '#0a0a0a', color: '#fff', padding: '14px 28px', fontSize: 14, fontWeight: 900, borderRadius: 999, border: '2.5px solid #0a0a0a', boxShadow: '5px 5px 0 #FFD700', fontFamily: '"Trebuchet MS", sans-serif', letterSpacing: 0.5 },
    'y2k-secondary':      { background: '#fff',   color: '#0a0a0a', padding: '14px 28px', fontSize: 14, fontWeight: 900, borderRadius: 999, border: '2.5px solid #0a0a0a', boxShadow: '5px 5px 0 #C9F23B', fontFamily: '"Trebuchet MS", sans-serif', letterSpacing: 0.5 },
    'brutal-primary':     { background: '#0a0a0a', color: '#fff', padding: '12px 22px', fontSize: 12, fontFamily: 'inherit', fontWeight: 700, borderRadius: 0, border: '2px solid #0a0a0a' },
    'brutal-secondary':   { background: '#fff',   color: '#0a0a0a', padding: '12px 22px', fontSize: 12, fontFamily: 'inherit', fontWeight: 700, borderRadius: 0, border: '2px solid #0a0a0a' },
    'soft-primary':       { background: '#A11460', color: '#fff', padding: '14px 28px', fontSize: 13, fontWeight: 700, borderRadius: 999, border: 'none', fontFamily: '"Quicksand", sans-serif', letterSpacing: 0.3 },
    'soft-secondary':     { background: '#fff',   color: '#A11460', padding: '14px 28px', fontSize: 13, fontWeight: 700, borderRadius: 999, border: '2px solid #A11460', fontFamily: '"Quicksand", sans-serif', letterSpacing: 0.3 },
  };
  return (
    <button type="button" style={{ cursor: 'pointer', ...(styles[variant] ?? {}) }}>
      {children}
    </button>
  );
}
