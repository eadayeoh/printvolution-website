import Link from 'next/link';
import { getGlobalSection } from '@/lib/data/page_content';

type BrandItem = { tagline?: string };
type LinkItem = { label?: string; href?: string };
type VisitItem = { kind?: string; label?: string; detail?: string; href?: string };
type SocialItem = { label?: string; href?: string; aria?: string };

export async function Footer() {
  const [brandItems, companyItems, supportItems, visitItems, socialItems] = await Promise.all([
    getGlobalSection('footer.brand') as Promise<BrandItem[]>,
    getGlobalSection('footer.company') as Promise<LinkItem[]>,
    getGlobalSection('footer.support') as Promise<LinkItem[]>,
    getGlobalSection('footer.visit') as Promise<VisitItem[]>,
    getGlobalSection('footer.social') as Promise<SocialItem[]>,
  ]);

  const tagline = brandItems[0]?.tagline ?? '';

  return (
    <footer
      style={{
        background: 'var(--pv-ink)',
        color: '#fff',
        padding: '80px 24px 28px',
        borderTop: '3px solid var(--pv-magenta)',
      }}
    >
      <div
        className="pv-footer-grid"
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
          gap: 48,
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontFamily: 'var(--pv-f-display)',
              fontSize: 28,
              letterSpacing: '-0.02em',
              marginBottom: 16,
              color: '#fff',
            }}
          >
            <span style={{ color: 'var(--pv-magenta)' }}>Print</span>volution
          </div>
          {tagline && (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.72)',
                maxWidth: 340,
                margin: 0,
                marginBottom: 20,
              }}
            >
              {tagline}
            </p>
          )}
          {socialItems.length > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              {socialItems.map((s, i) =>
                s.href ? (
                  <a
                    key={i}
                    href={s.href}
                    aria-label={s.aria ?? s.label ?? 'Social link'}
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="pv-social-btn"
                    style={{
                      width: 40,
                      height: 40,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 13,
                    }}
                  >
                    {s.label ?? ''}
                  </a>
                ) : null
              )}
            </div>
          )}
        </div>

        <FooterColumn title="Company" items={companyItems} />
        <FooterColumn title="Support" items={supportItems} />

        {/* Visit column */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--pv-yellow)',
              marginTop: 0,
              marginBottom: 18,
              fontWeight: 700,
            }}
          >
            Visit the shop
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {visitItems.map((v, i) => (
              <li
                key={i}
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.65)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.5,
                }}
              >
                {v.href ? (
                  <a
                    href={v.href}
                    target={v.href.startsWith('http') ? '_blank' : undefined}
                    rel={v.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    style={{ color: '#fff', fontWeight: 600 }}
                  >
                    {v.label}
                  </a>
                ) : (
                  <b style={{ color: '#fff', fontWeight: 600 }}>{v.label}</b>
                )}
                {v.detail && (
                  <>
                    <br />
                    {v.detail}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1560,
          margin: '56px auto 0',
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        <span>© {new Date().getFullYear()} Printvolution Pte Ltd</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>

      <style>{`
        .pv-social-btn { transition: background 0.15s, border-color 0.15s, transform 0.15s; }
        .pv-social-btn:hover {
          background: var(--pv-magenta);
          border-color: var(--pv-magenta);
          transform: translateY(-2px);
        }
        @media (max-width: 900px) {
          .pv-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }
        }
        @media (max-width: 560px) {
          .pv-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: { label?: string; href?: string }[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4
        style={{
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--pv-yellow)',
          marginTop: 0,
          marginBottom: 18,
          fontWeight: 700,
        }}
      >
        {title}
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
        {items.map((it, i) =>
          it.href && it.label ? (
            <li key={i} style={{ fontSize: 14 }}>
              <Link href={it.href} style={{ color: 'rgba(255,255,255,0.85)' }}>
                {it.label}
              </Link>
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}
