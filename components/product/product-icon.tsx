/**
 * Display a product icon: if it's a URL (or starts with /), render an img.
 * Otherwise treat it as an emoji / text glyph.
 */
export function ProductIcon({
  src,
  fallback = '📦',
  size = 40,
  style,
}: {
  src?: string | null;
  fallback?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const isUrl = !!src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'));
  if (isUrl) {
    return (
      <img
        src={src!}
        alt=""
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          display: 'block',
          ...style,
        }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: size * 0.9,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        ...style,
      }}
    >
      {src || fallback}
    </span>
  );
}
