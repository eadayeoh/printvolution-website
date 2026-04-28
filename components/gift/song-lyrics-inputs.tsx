'use client';

type Props = {
  lyrics: string;
  onLyrics: (s: string) => void;
  title: string;
  onTitle: (s: string) => void;
  names: string;
  onNames: (s: string) => void;
  year: string;
  onYear: (s: string) => void;
  photoUrl: string;
  onPhotoUrl: (s: string) => void;
  allowedFonts: string[];
  font: string;
  onFont: (f: string) => void;
};

export function SongLyricsInputs({
  lyrics, onLyrics, title, onTitle, names, onNames,
  year, onYear, photoUrl, onPhotoUrl,
  allowedFonts, font, onFont,
}: Props) {
  return (
    <div style={{ padding: '20px 22px', display: 'grid', gap: 14 }}>
      <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-magenta)' }}>
        Make your record
      </div>
      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          Lyrics (max 600 chars)
        </span>
        <textarea
          value={lyrics}
          onChange={(e) => onLyrics(e.target.value.slice(0, 600))}
          placeholder={'Paste the lyric you want spiraling around the photo.\nKeep it short — long verses get tiny.'}
          rows={5}
          style={{ width: '100%', padding: '12px 14px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14, lineHeight: 1.45, resize: 'vertical' }}
        />
        <div style={{ marginTop: 4, textAlign: 'right', fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: lyrics.length >= 560 ? 'var(--pv-magenta)' : 'var(--pv-muted)' }}>
          {lyrics.length} / 600
        </div>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            Title
          </span>
          <input
            type="text" value={title}
            onChange={(e) => onTitle(e.target.value.slice(0, 30))}
            placeholder="OUR SONG"
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            Year
          </span>
          <input
            type="text" value={year}
            onChange={(e) => onYear(e.target.value.slice(0, 4))}
            placeholder="2026" maxLength={4}
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
      </div>
      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          Names (e.g. Bruce &amp; Janie)
        </span>
        <input
          type="text" value={names}
          onChange={(e) => onNames(e.target.value.slice(0, 50))}
          placeholder="Bruce & Janie"
          style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
        />
      </label>
      {allowedFonts.length > 0 && (
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            Title font
          </span>
          <select
            value={font}
            onChange={(e) => onFont(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: font, fontSize: 14 }}
          >
            {allowedFonts.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        </label>
      )}
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
    </div>
  );
}
