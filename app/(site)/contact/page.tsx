import { getPageContent } from '@/lib/data/page_content';
import { ContactForm } from '@/components/contact/contact-form';
import { HoursGrid } from '@/components/contact/hours-grid';

export const metadata = {
  title: 'Contact Printvolution | Paya Lebar Square, Singapore',
  description:
    'Visit Printvolution at Paya Lebar Square or reach us by phone, email or WhatsApp. Open every day except public holidays.',
  alternates: { canonical: 'https://printvolution.sg/contact' },
};

type Item = Record<string, any>;
function first<T = Item>(section: { items?: T[] } | undefined): T | null {
  const items = section?.items;
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}
function items<T = Item>(section: { items?: T[] } | undefined): T[] {
  return Array.isArray(section?.items) ? (section!.items as T[]) : [];
}

const METHOD_BG: Record<string, string> = {
  magenta: 'var(--pv-magenta)',
  yellow: 'var(--pv-yellow)',
  ink: 'var(--pv-ink)',
  green: 'var(--pv-green)',
  cyan: 'var(--pv-cyan)',
};
const METHOD_FG: Record<string, string> = {
  magenta: '#fff',
  yellow: 'var(--pv-ink)',
  ink: 'var(--pv-yellow)',
  green: 'var(--pv-ink)',
  cyan: '#fff',
};

export default async function ContactPage() {
  const content = await getPageContent('contact');
  const hero = first<Item>(content['hero.v4']);
  const methods = items<Item>(content['methods']);
  const formHeader = first<Item>(content['form.header']);
  const formTabs = items<Item>(content['form.tabs']);
  const location = first<Item>(content['location.main']);
  const hoursHeader = first<Item>(content['hours.header']);
  const hoursDays = items<Item>(content['hours.days']);
  const faqItems = items<Item>(content['faq']);

  const whatsappNumber =
    (location?.whatsapp_url && String(location.whatsapp_url).match(/wa\.me\/(\d+)/)?.[1]) ||
    '6585533497';

  return (
    <article>
      {/* HERO */}
      {hero && (
        <section style={{ padding: '56px 24px 40px', borderBottom: '2px solid var(--pv-ink)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {hero.kicker && (
              <div
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--pv-magenta)',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ width: 24, height: 2, background: 'var(--pv-magenta)' }} />
                {hero.kicker}
              </div>
            )}
            <h1
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(44px, 6.5vw, 84px)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                margin: 0,
                marginBottom: 20,
              }}
            >
              {hero.headline}{' '}
              {hero.headline_accent && (
                <span style={{ color: 'var(--pv-magenta)' }}>{hero.headline_accent}</span>
              )}
            </h1>
            {hero.body && (
              <p style={{ fontSize: 16, lineHeight: 1.55, maxWidth: 560, color: 'var(--pv-muted)', fontWeight: 500 }}>
                {hero.body}
              </p>
            )}
          </div>
        </section>
      )}

      {/* 4 METHODS */}
      {methods.length > 0 && (
        <section style={{ padding: '40px 24px', background: 'var(--pv-cream)', borderBottom: '2px solid var(--pv-ink)' }}>
          <div
            className="pv-methods-grid"
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 18,
            }}
          >
            {methods.map((m, i) => {
              const tone = String(m.tone ?? 'magenta');
              return (
                <a
                  key={i}
                  href={m.href ?? '#'}
                  target={String(m.href ?? '').startsWith('http') ? '_blank' : undefined}
                  rel={String(m.href ?? '').startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="pv-method-tile"
                  style={{
                    background: '#fff',
                    border: '2px solid var(--pv-ink)',
                    boxShadow: '6px 6px 0 var(--pv-ink)',
                    padding: 26,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.15s',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 28,
                      width: 52,
                      height: 52,
                      border: '2px solid var(--pv-ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 18,
                      background: METHOD_BG[tone] ?? 'var(--pv-magenta)',
                      color: METHOD_FG[tone] ?? '#fff',
                    }}
                  >
                    {m.icon}
                  </div>
                  {m.label && (
                    <div
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--pv-muted)',
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      {m.label}
                    </div>
                  )}
                  {m.title && (
                    <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1, margin: 0, marginBottom: 10 }}>
                      {m.title}
                    </h3>
                  )}
                  {m.body && (
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--pv-ink-soft)', fontWeight: 500, margin: 0, marginBottom: 14, flex: 1 }}>
                      {m.body}
                    </p>
                  )}
                  {m.value && (
                    <div
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 13,
                        fontWeight: 700,
                        paddingTop: 14,
                        borderTop: '2px dashed var(--pv-rule)',
                        color: 'var(--pv-magenta)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {m.value}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
          <style>{`
            .pv-method-tile:hover { transform: translate(-3px, -3px); box-shadow: 9px 9px 0 var(--pv-ink) !important; }
            @media (max-width: 900px) { .pv-methods-grid { grid-template-columns: 1fr 1fr !important; } }
            @media (max-width: 520px) { .pv-methods-grid { grid-template-columns: 1fr !important; } }
          `}</style>
        </section>
      )}

      {/* FORM + LOCATION */}
      <section
        id="location"
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '72px 24px',
          borderBottom: '2px solid var(--pv-ink)',
        }}
      >
        <div
          className="pv-form-location-grid"
          style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'start' }}
        >
          {/* FORM */}
          <div
            style={{
              background: '#fff',
              border: '2px solid var(--pv-ink)',
              boxShadow: '8px 8px 0 var(--pv-magenta)',
              padding: 36,
            }}
          >
            {formHeader && (
              <>
                {formHeader.kicker && (
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--pv-magenta)',
                      marginBottom: 10,
                    }}
                  >
                    {formHeader.kicker}
                  </div>
                )}
                {formHeader.title && (
                  <h2
                    style={{
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 'clamp(30px, 3.5vw, 40px)',
                      lineHeight: 0.95,
                      letterSpacing: '-0.03em',
                      margin: 0,
                      marginBottom: 10,
                    }}
                  >
                    {formHeader.title}{' '}
                    {formHeader.title_em && (
                      <span style={{ position: 'relative', display: 'inline-block' }}>
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            bottom: 2,
                            left: '-2%',
                            width: '104%',
                            height: 12,
                            background: 'var(--pv-yellow)',
                            zIndex: -1,
                            transform: 'skew(-6deg)',
                          }}
                        />
                        {formHeader.title_em}
                      </span>
                    )}
                  </h2>
                )}
                {formHeader.sub && (
                  <p style={{ fontSize: 14, color: 'var(--pv-muted)', marginBottom: 28, fontWeight: 500 }}>
                    {formHeader.sub}
                  </p>
                )}
              </>
            )}

            <ContactForm
              whatsappNumber={`+${whatsappNumber}`}
              enquiryTabs={formTabs.map((t) => String(t.label ?? '')).filter(Boolean)}
            />
          </div>

          {/* LOCATION */}
          {location && (
            <aside
              className="pv-location-block"
              style={{
                background: '#fff',
                border: '2px solid var(--pv-ink)',
                boxShadow: '6px 6px 0 var(--pv-ink)',
                position: 'sticky',
                top: 100,
                overflow: 'hidden',
              }}
            >
              {(() => {
                const query = encodeURIComponent(
                  [location.address_line1, location.address_line2, location.address_line3]
                    .filter(Boolean)
                    .join(', ') || String(location.name ?? 'Paya Lebar Square, Singapore'),
                );
                return (
                  <div
                    style={{
                      aspectRatio: '4/3',
                      borderBottom: '2px solid var(--pv-ink)',
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'var(--pv-cream)',
                    }}
                  >
                    <iframe
                      title={`Map of ${location.name ?? 'Paya Lebar Square'}`}
                      src={`https://www.google.com/maps?q=${query}&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                    />
                  </div>
                );
              })()}

              <div style={{ padding: 26 }}>
                <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1, margin: 0, marginBottom: 4 }}>
                  {location.name}
                </h3>
                {location.subtitle && (
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      color: 'var(--pv-magenta)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      marginBottom: 18,
                    }}
                  >
                    {location.subtitle}
                  </div>
                )}

                <LocRow k="Address">
                  <>
                    {location.address_line1}
                    {location.address_line2 && (
                      <>
                        <br />
                        {location.address_line2}
                      </>
                    )}
                    {location.address_line3 && (
                      <>
                        <br />
                        {location.address_line3}
                      </>
                    )}
                  </>
                </LocRow>
                {location.phone_label && (
                  <LocRow k="Phone">
                    {location.phone_href ? (
                      <a href={String(location.phone_href)} style={{ color: 'var(--pv-magenta)', fontWeight: 700 }}>
                        {location.phone_label}
                      </a>
                    ) : (
                      <>{location.phone_label}</>
                    )}
                  </LocRow>
                )}
                {location.email_label && (
                  <LocRow k="Email">
                    {location.email_href ? (
                      <a href={String(location.email_href)} style={{ color: 'var(--pv-magenta)', fontWeight: 700 }}>
                        {location.email_label}
                      </a>
                    ) : (
                      <>{location.email_label}</>
                    )}
                  </LocRow>
                )}
                {(location.mrt_label || location.mrt_detail) && (
                  <LocRow k="MRT">
                    <>
                      {location.mrt_label}
                      {location.mrt_detail && (
                        <>
                          <br />
                          {location.mrt_detail}
                        </>
                      )}
                    </>
                  </LocRow>
                )}
                {(location.parking_label || location.parking_detail) && (
                  <LocRow k="Parking">
                    <>
                      {location.parking_label}
                      {location.parking_detail && (
                        <>
                          <br />
                          {location.parking_detail}
                        </>
                      )}
                    </>
                  </LocRow>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
                  {location.maps_url && (
                    <a
                      href={String(location.maps_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'var(--pv-ink)',
                        color: '#fff',
                        padding: 12,
                        border: '2px solid var(--pv-ink)',
                        fontFamily: 'var(--pv-f-body)',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      Directions
                    </a>
                  )}
                  {location.whatsapp_url && (
                    <a
                      href={String(location.whatsapp_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'var(--pv-ink)',
                        color: '#fff',
                        padding: 12,
                        border: '2px solid var(--pv-ink)',
                        fontFamily: 'var(--pv-f-body)',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
        <style>{`
          @media (max-width: 900px) {
            .pv-form-location-grid { grid-template-columns: 1fr !important; }
            .pv-location-block { position: static !important; }
          }
        `}</style>
      </section>

      {/* HOURS */}
      {(hoursHeader || hoursDays.length > 0) && (
        <section
          style={{
            background: 'var(--pv-ink)',
            color: '#fff',
            padding: '56px 24px',
            borderBottom: '2px solid var(--pv-ink)',
          }}
        >
          <div
            className="pv-hours-grid"
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr',
              gap: 40,
              alignItems: 'center',
            }}
          >
            {hoursHeader && (
              <div>
                {hoursHeader.kicker && (
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      color: 'var(--pv-yellow)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      marginBottom: 14,
                    }}
                  >
                    {hoursHeader.kicker}
                  </div>
                )}
                <h2
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 'clamp(32px, 4vw, 48px)',
                    lineHeight: 0.95,
                    letterSpacing: '-0.03em',
                    margin: 0,
                    color: '#fff',
                  }}
                >
                  {hoursHeader.title}{' '}
                  {hoursHeader.title_yellow && <span style={{ color: 'var(--pv-yellow)' }}>{hoursHeader.title_yellow}</span>}
                  {hoursHeader.title_suffix && (
                    <>
                      <br />
                      <span style={{ color: '#fff' }}>{hoursHeader.title_suffix}</span>
                    </>
                  )}
                </h2>
                {hoursHeader.body && (
                  <p style={{ fontSize: 14, marginTop: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                    {hoursHeader.body}
                  </p>
                )}
              </div>
            )}
            <HoursGrid
              days={hoursDays.map((d) => ({
                day_label: String(d.day_label ?? ''),
                time: String(d.time ?? ''),
                is_closed: Boolean(d.is_closed),
              }))}
            />
          </div>
          <style>{`
            @media (max-width: 900px) {
              .pv-hours-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
              .pv-hours-table { grid-template-columns: repeat(3, 1fr) !important; }
            }
          `}</style>
        </section>
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section style={{ padding: '72px 24px', background: 'var(--pv-cream)', borderBottom: '2px solid var(--pv-ink)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 11,
                color: 'var(--pv-magenta)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 24, height: 2, background: 'var(--pv-magenta)' }} />
              Quick answers
            </div>
            <h2
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(32px, 4vw, 52px)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                marginBottom: 28,
              }}
            >
              Before you{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '-2%',
                    width: '104%',
                    height: 14,
                    background: 'var(--pv-yellow)',
                    zIndex: -1,
                    transform: 'skew(-6deg)',
                  }}
                />
                write.
              </span>
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {faqItems.map((f, i) => (
                <details
                  key={i}
                  className="pv-contact-faq-item"
                  style={{
                    background: '#fff',
                    border: '2px solid var(--pv-ink)',
                    boxShadow: '4px 4px 0 var(--pv-ink)',
                  }}
                >
                  <summary
                    style={{
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 18,
                      letterSpacing: '-0.01em',
                      padding: '18px 22px',
                      cursor: 'pointer',
                      listStyle: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    {f.question}
                    <span
                      aria-hidden
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        background: 'var(--pv-magenta)',
                        color: '#fff',
                        fontFamily: 'var(--pv-f-display)',
                        fontSize: 20,
                      }}
                    >
                      +
                    </span>
                  </summary>
                  <div style={{ padding: '0 22px 22px', fontSize: 14, lineHeight: 1.6, color: 'var(--pv-ink-soft)', fontWeight: 500 }}>
                    {f.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
          <style>{`
            .pv-contact-faq-item summary::-webkit-details-marker { display: none; }
          `}</style>
        </section>
      )}
    </article>
  );
}

function LocRow({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr',
        padding: '12px 0',
        borderBottom: '1px dashed var(--pv-rule)',
        fontSize: 14,
        alignItems: 'start',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 10,
          color: 'var(--pv-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 700,
          paddingTop: 3,
        }}
      >
        {k}
      </span>
      <span style={{ fontWeight: 500, lineHeight: 1.45 }}>{children}</span>
    </div>
  );
}
