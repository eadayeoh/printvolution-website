import { getGlobalSection } from '@/lib/data/page_content';

type AnnounceItem = {
  text?: string;
  bold_part?: string;
};

export async function AnnounceBar() {
  const items = (await getGlobalSection('announce')) as AnnounceItem[];
  if (!items.length) return null;

  return (
    <div
      style={{
        background: 'var(--pv-ink)',
        color: '#fff',
        padding: '10px 24px',
        fontFamily: 'var(--pv-f-mono)',
        fontSize: 12,
        letterSpacing: '0.02em',
        display: 'flex',
        justifyContent: 'center',
        gap: 32,
        flexWrap: 'wrap',
      }}
    >
      {items.map((item, i) => {
        const text = item.text ?? '';
        if (!text) return null;
        if (item.bold_part && text.includes(item.bold_part)) {
          const [before, after] = text.split(item.bold_part);
          return (
            <span key={i}>
              {before}
              <b style={{ color: 'var(--pv-yellow)', fontWeight: 500 }}>{item.bold_part}</b>
              {after}
            </span>
          );
        }
        return <span key={i}>{text}</span>;
      })}
    </div>
  );
}
