'use client';

/**
 * Song Lyrics Photo Frame template renderer.
 *
 * Lyrics flow along an Archimedean spiral around the customer's photo (placed
 * inside a centre circle). Title / names / year render below the disc. Used
 * by gift-product-page.tsx for the song-lyrics-photo-frame product slug.
 *
 * Output is an SVG sized to the printed product (100x130 mm — 100mm square
 * vinyl area + 30mm footer text area). The PDF / production pipeline can
 * re-render the same component for output, since SVG scales losslessly.
 */

/**
 * Footer / look layouts:
 *   • 'song'    — Title (bold serif) / Names (script) / EST. Year. Cream paper
 *                 with vinyl photo disc. Print on photo paper.
 *   • 'wedding' — Names (serif italic, big) / Date / Subtitle. Same paper look.
 *   • 'foil'    — Navy background, gold spiral lyrics, gold script names + serif
 *                 tagline. Centre is a gold disc with title/subtitle (no photo).
 *                 Designed for metallic-foil printing — exportSvg() strips the
 *                 navy background so the file contains only the foil layer.
 */
export type SongLyricsLayout = 'song' | 'wedding' | 'foil';

type Props = {
  photoUrl?: string | null;
  lyrics: string;
  title: string;
  names: string;
  year: string;
  /** Foil-layout extras. Empty in the other layouts. */
  subtitle?: string;
  tagline?: string;
  /** Per-field fonts. `font` is kept as a fallback for back-compat. */
  font?: string;
  titleFont?: string;
  namesFont?: string;
  yearFont?: string;
  taglineFont?: string;
  /** Multiplier for the auto-computed lyrics font size. 1 = auto. */
  lyricsScale?: number;
  layout?: SongLyricsLayout;
  /** Pink wash colour around the disc — only used by song / wedding layouts. */
  accentColor?: string;
  /** Foil colour for the foil layout. Defaults to a warm gold. */
  foilColor?: string;
  /** Material colour for the foil layout (the dark canvas behind the gold).
   *  Set to null when serialising the SVG for the printer so the output
   *  contains only the foil paths. */
  materialColor?: string | null;
  /** Stable id used by the parent to find this SVG in the DOM for download. */
  svgId?: string;
};

/**
 * Build an Archimedean spiral path going from `outerR` inward to `innerR`
 * over `turns` revolutions, centred on (cx, cy). Path is a polyline of
 * many short segments — close enough to a smooth curve for SVG textPath.
 */
function spiralPath(cx: number, cy: number, outerR: number, innerR: number, turns: number): string {
  const totalAngle = turns * Math.PI * 2;
  const drPerRad = (innerR - outerR) / totalAngle; // negative — radius shrinks
  const steps = Math.max(240, Math.floor(turns * 80));
  const pts: string[] = [];
  // Start at (cx + outerR, cy) and spiral clockwise.
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = t * totalAngle;
    const r = outerR + drPerRad * theta;
    // Start the spiral at top-of-circle (angle = -PI/2) so the first lyric
    // line begins at 12 o'clock — feels more natural to read.
    const a = theta - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`;
}

// VIEWBOX (mm). 100 wide × 130 tall = 100mm vinyl square + 30mm footer.
// Vinyl area is 0–100; footer area is 100–130.
const W = 100;
const FOOTER_TOP = 100;

// Spiral geometry — outer just inside the vinyl edge, inner just outside
// the photo circle. 7 turns gives ~enough text capacity for a short verse.
const cx = 50;
const cy = 50;
const outerR = 38;   // vinyl outer is ~40
const photoR = 13;   // centre photo radius
const innerR = photoR + 1.5; // gap between innermost text + photo edge
const turns = 7;

// Pre-computed at module load — these constants never change between renders.
const SPIRAL_D = spiralPath(cx, cy, outerR, innerR, turns);

// Approximate path length (mm) used to auto-size the lyrics font. Sum of
// average circumferences across each turn — close enough for picking a
// font size that fits the customer's text without measurement.
const SPIRAL_LENGTH_MM = (() => {
  const drPerTurn = (innerR - outerR) / turns;
  let total = 0;
  for (let i = 0; i < turns; i++) {
    const rAvg = outerR + drPerTurn * (i + 0.5);
    total += 2 * Math.PI * rAvg;
  }
  return total;
})();

// Base font size at which ~1100–1200 chars fits naturally. Above that we
// scale down proportionally so any-length paste still renders.
const BASE_FONT_SIZE = 1.55;
const BASE_CAPACITY  = 1150; // chars at BASE_FONT_SIZE
const MIN_FONT_SIZE  = 0.5;  // anything smaller is unreadable

function autoLyricsFontSize(charCount: number): number {
  if (charCount <= BASE_CAPACITY) return BASE_FONT_SIZE;
  const scale = BASE_CAPACITY / charCount;
  return Math.max(MIN_FONT_SIZE, BASE_FONT_SIZE * scale);
}

const CURRENT_YEAR = new Date().getFullYear();

export function SongLyricsTemplate({
  photoUrl,
  lyrics,
  title,
  names,
  year,
  subtitle = '',
  tagline = '',
  font = 'Playfair Display',
  titleFont,
  namesFont,
  yearFont,
  taglineFont,
  lyricsScale = 1,
  layout = 'song',
  accentColor = '#f7c7d8',
  foilColor = '#d4af37',
  materialColor = '#1a2740',
  svgId,
}: Props) {
  // Per-field fonts default to a sensible serif/script/sans combo when the
  // customer hasn't picked one. Falling back to the legacy `font` prop keeps
  // existing call sites working unchanged.
  const tf = titleFont ?? font;
  const nf = namesFont ?? (layout === 'wedding' ? font : 'Dancing Script');
  const yf = yearFont  ?? 'Archivo';
  const tagF = taglineFont ?? font;
  const isFoil = layout === 'foil';

  // Empty-state placeholder so the customer can see the layout before they
  // paste real lyrics. Hidden the moment they type anything.
  const lyricsForRender = lyrics.trim()
    || 'Type your song lyrics in the box on the right and they will spiral around your photo here. Long verses look great. Keep it under 600 characters for clean wrapping.';

  // Colour palette switches with the layout. For foil printing the dark
  // material colour is included only in the on-screen preview — the SVG
  // export sets materialColor=null to drop it from the file.
  //
  // For song / wedding layouts, the customer's colour-overlay pick
  // (foilColor when it's been changed from the default gold) retints
  // the LYRICS + FOOTER TEXT only — never the vinyl disc itself,
  // which stays dark for contrast. `textInk` is the text colour that
  // tracks the overlay; `discFill` is the vinyl disc fill which
  // doesn't.
  const customerOverlayApplied = !isFoil && !!foilColor && foilColor !== '#d4af37';
  const lyricsFill = isFoil ? foilColor : (customerOverlayApplied ? foilColor : '#f4f4f4');
  const textInk    = isFoil ? foilColor : (customerOverlayApplied ? foilColor : '#0d0d0d');
  const subInk     = isFoil ? foilColor : (customerOverlayApplied ? foilColor : '#3a3a3a');
  // Disc + hairline divider stay dark regardless of the overlay.
  const discFill   = '#0d0d0d';
  const footerInk  = textInk;

  return (
    <svg
      id={svgId}
      viewBox={`0 0 ${W} 130`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block', maxHeight: '100%' }}
    >
      <defs>
        <radialGradient id="songWash" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd5e0" />
          <stop offset="60%" stopColor="#fbe7eb" />
          <stop offset="100%" stopColor="#ffffff" />
        </radialGradient>
        <clipPath id="songPhotoClip">
          <circle cx={cx} cy={cy} r={photoR} />
        </clipPath>
        <path id="songLyricsSpiral" d={SPIRAL_D} />
      </defs>

      {/* Material / paper background. For foil export this can be null so the
          SVG ships only the gold layer for the foil printer. */}
      {materialColor !== null && (
        <rect x="0" y="0" width={W} height="130" fill={isFoil ? materialColor : '#ffffff'} />
      )}

      {/* Pink wash + vinyl + photo: only in the song / wedding layouts. */}
      {!isFoil && (
        <>
          <rect x="0" y="0" width={W} height={FOOTER_TOP} fill={accentColor} opacity="0.18" />
          <circle cx={cx} cy={cy} r="46" fill="url(#songWash)" />
          <circle cx={cx} cy={cy} r="40" fill={discFill} />
          {[39, 36, 30, 24, 18].map((r) => (
            <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#1f1f1f" strokeWidth="0.15" />
          ))}
          {photoUrl ? (
            <image
              href={photoUrl}
              x={cx - photoR}
              y={cy - photoR}
              width={photoR * 2}
              height={photoR * 2}
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#songPhotoClip)"
            />
          ) : (
            <>
              <circle cx={cx} cy={cy} r={photoR} fill="#2a2a2a" />
              <text x={cx} y={cy + 1} textAnchor="middle" fontSize="2.4" fill="#777"
                    fontFamily="Archivo, sans-serif" letterSpacing="0.2">
                PHOTO
              </text>
            </>
          )}
          <circle cx={cx} cy={cy} r="0.7" fill={accentColor} />
        </>
      )}

      {/* Foil layout centre: gold disc with title + divider + subtitle. No
          photo, no vinyl rings — this is the foil-printed label. */}
      {isFoil && (
        <>
          <circle cx={cx} cy={cy} r={photoR + 1} fill={foilColor} />
          <text x={cx} y={cy - 1.2} textAnchor="middle" fontSize="3.2"
                fontFamily={`${tf}, Georgia, serif`} fontWeight="700"
                fill={materialColor ?? '#1a2740'} letterSpacing="0.4">
            {title.trim() || "CALLIN'"}
          </text>
          <line x1={cx - 4} x2={cx + 4} y1={cy + 0.4} y2={cy + 0.4}
                stroke={materialColor ?? '#1a2740'} strokeWidth="0.25" />
          <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="2.6"
                fontFamily={`${tf}, Georgia, serif`} fontWeight="700"
                fill={materialColor ?? '#1a2740'} letterSpacing="0.5">
            {subtitle.trim() || 'BATON ROUGE'}
          </text>
        </>
      )}

      {/* Lyrics text spiraling on the disc. Gold on navy for foil; white on
          black for the photo layouts. Font size auto-shrinks. */}
      <text
        fontSize={autoLyricsFontSize(lyricsForRender.length) * Math.max(0.5, Math.min(2, lyricsScale))}
        fontFamily="Archivo, system-ui, sans-serif"
        fill={lyricsFill}
        letterSpacing="0.02"
      >
        <textPath href="#songLyricsSpiral" startOffset="0%" lengthAdjust="spacingAndGlyphs">
          {lyricsForRender}
        </textPath>
      </text>

      {/* Footer block */}
      {isFoil ? (
        <>
          {/* Names — gold script, e.g. "Hello Samantha Dear," */}
          <text x={cx} y={113} textAnchor="middle" fontSize="6.5"
                fontFamily={`'${nf}', cursive`} fontStyle="italic"
                fill={foilColor}>
            {names.trim() || 'Hello Samantha Dear,'}
          </text>
          {/* Tagline — gold serif italic, e.g. "I hope you're feelin' fine." */}
          <text x={cx} y={122} textAnchor="middle" fontSize="4"
                fontFamily={`${tagF}, Georgia, serif`} fontStyle="italic"
                fill={foilColor} letterSpacing="0.2">
            {tagline.trim() || "I hope you're feelin' fine."}
          </text>
        </>
      ) : layout === 'wedding' ? (
        <>
          {/* Names — serif italic, large, top of footer */}
          <text x={cx} y={108} textAnchor="middle" fontSize="7.5"
                fontFamily={`${nf}, Georgia, serif`} fontStyle="italic" fontWeight="600"
                fill={footerInk} letterSpacing="0.4">
            {names.trim() || 'Mercy & Adam'}
          </text>
          {/* Date — sans, mid */}
          <text x={cx} y={117} textAnchor="middle" fontSize="4.2"
                fontFamily={`${yf}, sans-serif`} fill={footerInk} letterSpacing="0.3">
            {year.trim() || '27.08.2023'}
          </text>
          {/* Subtitle — serif italic, small, bottom (e.g. "OUR FIRST DANCE") */}
          <text x={cx} y={125} textAnchor="middle" fontSize="4.5"
                fontFamily={`${tf}, Georgia, serif`} fontStyle="italic" fill={footerInk}
                letterSpacing="0.5">
            {title.trim() || 'OUR FIRST DANCE'}
          </text>
        </>
      ) : (
        <>
          {/* Song layout: Title / Names / EST. Year */}
          <text x={cx} y={108} textAnchor="middle" fontSize="7"
                fontFamily={`${tf}, Georgia, serif`} fontWeight="700" fill={footerInk}
                letterSpacing="0.4">
            {title.trim() || 'OUR SONG'}
          </text>
          <text x={cx} y={117} textAnchor="middle" fontSize="5.5"
                fontFamily={`'${nf}', cursive`} fill={footerInk}>
            {names.trim() || 'Your & Their Name'}
          </text>
          {/* Hairline divider */}
          <line x1={cx - 4} x2={cx + 4} y1={121} y2={121} stroke={footerInk} strokeWidth="0.3" />
          <text x={cx} y={126} textAnchor="middle" fontSize="3"
                fontFamily={`${yf}, sans-serif`} letterSpacing="0.6"
                fill={subInk}>
            EST. {year.trim() || CURRENT_YEAR}
          </text>
        </>
      )}
    </svg>
  );
}
