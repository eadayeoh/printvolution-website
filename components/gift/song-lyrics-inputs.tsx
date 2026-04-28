'use client';

import type { SongLyricsLayout } from './song-lyrics-template';

type Props = {
  lyrics: string;
  onLyrics: (s: string) => void;
  title: string;
  onTitle: (s: string) => void;
  names: string;
  onNames: (s: string) => void;
  year: string;
  onYear: (s: string) => void;
  /** Foil-layout extras. */
  subtitle: string;
  onSubtitle: (s: string) => void;
  tagline: string;
  onTagline: (s: string) => void;
  photoUrl: string;
  onPhotoUrl: (s: string) => void;
  allowedFonts: string[];
  // Per-field fonts. Each defaults to a sensible choice when empty.
  titleFont: string;
  onTitleFont: (f: string) => void;
  namesFont: string;
  onNamesFont: (f: string) => void;
  yearFont: string;
  onYearFont: (f: string) => void;
  layout: SongLyricsLayout;
  onLayout: (l: SongLyricsLayout) => void;
  /** Foil-layout SVG export trigger. Parent owns the actual download. */
  onExportSvg?: () => void;
};

export function SongLyricsInputs({
  lyrics, onLyrics, title, onTitle, names, onNames,
  year, onYear, subtitle, onSubtitle, tagline, onTagline,
  photoUrl, onPhotoUrl,
  allowedFonts,
  titleFont, onTitleFont, namesFont, onNamesFont, yearFont, onYearFont,
  layout, onLayout, onExportSvg,
}: Props) {
  // Field labels + placeholders shift with the chosen layout so the inputs
  // match what the customer sees on the preview (year vs full date, etc).
  const isWedding = layout === 'wedding';
  const isFoil = layout === 'foil';
  return (
    <div style={{ padding: '20px 22px', display: 'grid', gap: 14 }}>
      <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-magenta)' }}>
        Make your record
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {([
          { v: 'song',    label: 'Song record',   hint: 'Photo · Title · Names · Year' },
          { v: 'wedding', label: 'Wedding date',  hint: 'Photo · Names · Date · Sub'   },
          { v: 'foil',    label: 'Gold foil',     hint: 'No photo · Foil-printed SVG'  },
        ] as Array<{ v: SongLyricsLayout; label: string; hint: string }>).map((opt) => {
          const active = layout === opt.v;
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => onLayout(opt.v)}
              style={{
                padding: '10px 12px',
                background: active ? 'var(--pv-ink)' : '#fff',
                color: active ? '#fff' : 'var(--pv-ink)',
                border: '2px solid var(--pv-ink)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--pv-f-body)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <div>{opt.label}</div>
              <div style={{ marginTop: 2, fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 400, opacity: 0.75 }}>
                {opt.hint}
              </div>
            </button>
          );
        })}
      </div>
      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          Lyrics
        </span>
        <textarea
          value={lyrics}
          // No length cap — the spiral renderer auto-shrinks font size to
          // fit any paste length. Customer sees the text get smaller in
          // the preview as they add more.
          onChange={(e) => onLyrics(e.target.value)}
          placeholder={'Paste the lyric you want spiraling around the photo.\nText auto-shrinks to fit — no length limit.'}
          rows={6}
          style={{ width: '100%', padding: '12px 14px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14, lineHeight: 1.45, resize: 'vertical' }}
        />
        <div style={{ marginTop: 4, textAlign: 'right', fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>
          {lyrics.length} chars
        </div>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            {isWedding ? 'Subtitle' : 'Title'}
          </span>
          <input
            type="text" value={title}
            onChange={(e) => onTitle(e.target.value.slice(0, 30))}
            placeholder={isWedding ? 'OUR FIRST DANCE' : 'OUR SONG'}
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            {isWedding ? 'Date' : 'Year'}
          </span>
          <input
            type="text" value={year}
            onChange={(e) => onYear(e.target.value.slice(0, isWedding ? 14 : 4))}
            placeholder={isWedding ? '27.08.2023' : '2026'}
            maxLength={isWedding ? 14 : 4}
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
      </div>
      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          {isFoil ? 'Greeting (e.g. "Hello Samantha Dear,")' : `Names (e.g. ${isWedding ? 'Mercy & Adam' : 'Bruce & Janie'})`}
        </span>
        <input
          type="text" value={names}
          onChange={(e) => onNames(e.target.value.slice(0, isFoil ? 60 : 50))}
          placeholder={isFoil ? 'Hello Samantha Dear,' : (isWedding ? 'Mercy & Adam' : 'Bruce & Janie')}
          style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
        />
      </label>
      {isFoil && (
        <>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
              Tagline (under the greeting)
            </span>
            <input
              type="text" value={tagline}
              onChange={(e) => onTagline(e.target.value.slice(0, 80))}
              placeholder="I hope you're feelin' fine."
              style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
              Centre subtitle (e.g. "BATON ROUGE")
            </span>
            <input
              type="text" value={subtitle}
              onChange={(e) => onSubtitle(e.target.value.slice(0, 30))}
              placeholder="BATON ROUGE"
              style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
            />
          </label>
        </>
      )}
      {allowedFonts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {([
            { label: isWedding ? 'Subtitle font' : 'Title font', value: titleFont, onChange: onTitleFont },
            { label: 'Names font',                                value: namesFont, onChange: onNamesFont },
            { label: isWedding ? 'Date font' : 'Year font',       value: yearFont,  onChange: onYearFont  },
          ]).map((f) => (
            <label key={f.label} style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
                {f.label}
              </span>
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: f.value, fontSize: 14 }}
              >
                {allowedFonts.map((opt) => (
                  <option key={opt} value={opt} style={{ fontFamily: opt }}>{opt}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      {!isFoil && (
        <div style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            Photo (centred in the disc)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              if (f.size > 15 * 1024 * 1024) { alert('Photo too large (max 15 MB).'); return; }
              const reader = new FileReader();
              reader.onload = () => onPhotoUrl(String(reader.result));
              reader.onerror = () => alert('Could not read that file.');
              reader.readAsDataURL(f);
            }}
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-mono)', fontSize: 12, cursor: 'pointer' }}
          />
          {photoUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <img src={photoUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--pv-ink)' }} />
              <button
                type="button"
                onClick={() => onPhotoUrl('')}
                style={{ background: 'transparent', border: '1px solid var(--pv-ink)', padding: '6px 12px', fontFamily: 'var(--pv-f-mono)', fontSize: 11, cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>
            ✦ Square crop works best. The photo is masked into a circle in the centre.
          </div>
        </div>
      )}
      {isFoil && onExportSvg && (
        <button
          type="button"
          onClick={onExportSvg}
          style={{ marginTop: 4, padding: '12px 14px', background: 'var(--pv-ink)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--pv-f-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          ↓ Download foil SVG
        </button>
      )}
    </div>
  );
}
