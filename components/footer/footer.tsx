import Link from 'next/link';
import { getGlobalSection } from '@/lib/data/page_content';
import { SafeEmail } from '@/components/contact/safe-email';

function footerMailto(href: string | undefined): { user: string; domain: string } | null {
  if (!href) return null;
  const m = href.match(/^mailto:([^@]+)@(.+)$/i);
  return m ? { user: m[1], domain: m[2] } : null;
}

type BrandItem = { tagline?: string };
type LinkItem = { label?: string; href?: string };
type VisitItem = { kind?: string; label?: string; detail?: string; href?: string; icon_url?: string | null };
type SocialItem = { label?: string; href?: string; aria?: string; icon_url?: string | null };

// Default inline SVG icons for the Visit-column channel tiles. Any of
// them can be overridden by setting icon_url on the page_content item
// (admin → Pages → Footer visit).
function ChannelIcon({ kind }: { kind: string | undefined }) {
  const stroke = 'currentColor';
  if (kind === 'telegram') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4Z" />
      </svg>
    );
  }
  if (kind === 'email') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
      </svg>
    );
  }
  // phone — also used for WhatsApp since they look alike at 18px
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.8.3 1.7.6 2.5a2 2 0 0 1-.5 2l-1.3 1.3a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.5c.8.3 1.7.5 2.5.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

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
                      overflow: 'hidden',
                    }}
                  >
                    {s.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.icon_url}
                        alt={s.aria ?? s.label ?? ''}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      s.label ?? ''
                    )}
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
          {(() => {
            const addressItems = visitItems.filter((v) => v.kind === 'address');
            const hoursItems = visitItems.filter((v) => v.kind === 'hours');
            const channelItems = visitItems.filter((v) =>
              v.kind === 'phone' || v.kind === 'telegram' || v.kind === 'email',
            );
            const rowStyle: React.CSSProperties = {
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.02em',
              lineHeight: 1.5,
            };
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {/* Row 1 — Address */}
                {addressItems.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                    {addressItems.map((v, i) => (
                      <li key={i} style={rowStyle}>
                        <b style={{ color: '#fff', fontWeight: 600 }}>{v.label}</b>
                        {v.detail && (<><br />{v.detail}</>)}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Row 2 — Hours */}
                {hoursItems.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
                    {hoursItems.map((v, i) => (
                      <li key={i} style={rowStyle}>
                        <b style={{ color: '#fff', fontWeight: 600 }}>{v.label}</b>
                        {v.detail && (<>{' '}<span>{v.detail}</span></>)}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Row 3 — Channel tiles with icons */}
                {channelItems.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 10,
                    }}
                  >
                    {channelItems.map((v, i) => {
                      const email = footerMailto(v.href);
                      const innerLabel = email ? (
                        <SafeEmail
                          user={email.user}
                          domain={email.domain}
                          style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}
                        />
                      ) : (
                        <>
                          <div style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>{v.label}</div>
                          {v.detail && (
                            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>
                              {v.detail}
                            </div>
                          )}
                        </>
                      );
                      const iconBox = (
                        <div
                          aria-hidden
                          style={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            overflow: 'hidden',
                          }}
                        >
                          {v.icon_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.icon_url}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <ChannelIcon kind={v.kind} />
                          )}
                        </div>
                      );
                      const inner = (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          {iconBox}
                          <div style={{ minWidth: 0 }}>{innerLabel}</div>
                        </div>
                      );
                      return v.href && !email ? (
                        <a
                          key={i}
                          href={v.href}
                          target={v.href.startsWith('http') ? '_blank' : undefined}
                          rel={v.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          style={{
                            ...rowStyle,
                            textDecoration: 'none',
                            padding: 10,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.02)',
                          }}
                        >
                          {inner}
                        </a>
                      ) : (
                        <div
                          key={i}
                          style={{
                            ...rowStyle,
                            padding: 10,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.02)',
                          }}
                        >
                          {inner}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
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
          <Link href="/admin">Admin</Link>
          <Link href="/staff">Staff Dashboard</Link>
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
