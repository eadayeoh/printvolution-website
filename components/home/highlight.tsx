// Tiny inline highlighter used in hero and section titles.
// Wraps spans between *asterisks* in one of two treatments:
//
//   mode: 'underline' (default) — yellow skewed underline sitting
//     behind the text (z-index: -1). Matches v4's .section-title em
//     treatment. Only works on LIGHT-background sections where
//     nothing creates a stacking context.
//
//   mode: 'yellow-text' — just recolors the emphasized text yellow.
//     Use this on dark backgrounds (e.g. the proof testimonial) where
//     a z-index: -1 underline would render behind the section bg.

import React from 'react';

export type HighlightMode = 'underline' | 'yellow-text';

export function renderHighlight(
  text: string | undefined | null,
  opts?: { underlineHeight?: number; mode?: HighlightMode }
): React.ReactNode[] {
  if (!text) return [];
  const mode = opts?.mode ?? 'underline';
  const height = opts?.underlineHeight ?? 14;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
      const inner = p.slice(1, -1);
      if (mode === 'yellow-text') {
        return (
          <span key={i} style={{ color: 'var(--pv-yellow)' }}>
            {inner}
          </span>
        );
      }
      return (
        <span
          key={i}
          style={{ position: 'relative', display: 'inline-block', fontStyle: 'normal' }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              bottom: 4,
              left: '-2%',
              width: '104%',
              height,
              background: 'var(--pv-yellow)',
              zIndex: -1,
              transform: 'skew(-6deg)',
            }}
          />
          {inner}
        </span>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}
