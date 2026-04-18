// Tiny inline highlighter used in hero and section titles.
// Wraps spans between *asterisks* in a yellow-underline pill so admin
// copy like "we *don't suck.*" renders the v4 .section-title em treatment
// without having to split content into multiple fields.

import React from 'react';

export function renderHighlight(text: string | undefined | null, opts?: { underlineHeight?: number }): React.ReactNode[] {
  if (!text) return [];
  const height = opts?.underlineHeight ?? 14;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
      return (
        <span
          key={i}
          style={{
            position: 'relative',
            display: 'inline-block',
            fontStyle: 'normal',
          }}
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
          {p.slice(1, -1)}
        </span>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}
