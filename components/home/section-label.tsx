// Shared brutalist section-label pill used across the homepage.
// If the label starts with a number like "01 Foo", the number gets
// rendered in a yellow-background pill inside the dark label, matching
// the v4 mockup's .section-label .n rule.

type Props = { text?: string };

export function SectionLabel({ text }: Props) {
  if (!text) return null;

  const match = text.match(/^(\d+)\s+(.+)$/);
  const num = match?.[1];
  const label = match?.[2] ?? text;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--pv-ink)',
        color: '#fff',
        padding: '6px 14px',
        fontFamily: 'var(--pv-f-mono)',
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 24,
      }}
    >
      {num && (
        <span
          style={{
            background: 'var(--pv-yellow)',
            color: 'var(--pv-ink)',
            padding: '2px 6px',
            fontWeight: 900,
          }}
        >
          {num}
        </span>
      )}
      {label}
    </div>
  );
}
