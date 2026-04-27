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

import { useMemo } from 'react';

type Props = {
  photoUrl?: string | null;
  lyrics: string;
  title: string;
  names: string;
  year: string;
  font?: string;
  /** Pink wash colour around the disc — defaults to a soft blush. */
  accentColor?: string;
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

export function SongLyricsTemplate({
  photoUrl,
  lyrics,
  title,
  names,
  year,
  font = 'Playfair Display',
  accentColor = '#f7c7d8',
}: Props) {
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

  const spiralD = useMemo(
    () => spiralPath(cx, cy, outerR, innerR, turns),
    [],
  );

  // Empty-state placeholder so the customer can see the layout before they
  // paste real lyrics. Hidden the moment they type anything.
  const lyricsForRender = lyrics.trim()
    || 'Type your song lyrics in the box on the right and they will spiral around your photo here. Long verses look great. Keep it under 600 characters for clean wrapping.';

  return (
    <svg
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
        <path id="songLyricsSpiral" d={spiralD} />
      </defs>

      {/* Paper background */}
      <rect x="0" y="0" width={W} height="130" fill="#ffffff" />

      {/* Pink wash square (the printed acrylic background) */}
      <rect x="0" y="0" width={W} height={FOOTER_TOP} fill={accentColor} opacity="0.18" />

      {/* Soft pink halo behind vinyl */}
      <circle cx={cx} cy={cy} r="46" fill="url(#songWash)" />

      {/* Vinyl record disc */}
      <circle cx={cx} cy={cy} r="40" fill="#0d0d0d" />
      {/* Subtle rings on the vinyl for that LP look */}
      {[39, 36, 30, 24, 18].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#1f1f1f" strokeWidth="0.15" />
      ))}

      {/* Photo (clipped to circle in centre of disc) */}
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

      {/* Centre spindle hole */}
      <circle cx={cx} cy={cy} r="0.7" fill={accentColor} />

      {/* Lyrics text spiraling on the disc (white on black) */}
      <text
        fontSize="1.55"
        fontFamily="Archivo, system-ui, sans-serif"
        fill="#f4f4f4"
        letterSpacing="0.02"
      >
        <textPath href="#songLyricsSpiral" startOffset="0%" lengthAdjust="spacing">
          {lyricsForRender}
        </textPath>
      </text>

      {/* Footer block */}
      <text x={cx} y={108} textAnchor="middle" fontSize="7"
            fontFamily={`${font}, Georgia, serif`} fontWeight="700" fill="#0d0d0d"
            letterSpacing="0.4">
        {title.trim() || 'OUR SONG'}
      </text>
      <text x={cx} y={117} textAnchor="middle" fontSize="5.5"
            fontFamily="'Dancing Script', cursive" fill="#0d0d0d">
        {names.trim() || 'Your & Their Name'}
      </text>
      {/* Hairline divider */}
      <line x1={cx - 4} x2={cx + 4} y1={121} y2={121} stroke="#0d0d0d" strokeWidth="0.3" />
      <text x={cx} y={126} textAnchor="middle" fontSize="3"
            fontFamily="Archivo, sans-serif" letterSpacing="0.6"
            fill="#3a3a3a">
        EST. {year.trim() || new Date().getFullYear()}
      </text>
    </svg>
  );
}
