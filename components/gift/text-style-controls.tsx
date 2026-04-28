'use client';

/**
 * Shared font / size / rotation controls used in two PDP locations:
 *   • Surfaces-flow toolbar under the per-side text inputs
 *   • Legacy "Add text" step for laser/UV products without surfaces
 *
 * Single source of truth — adding a colour picker (or any new control) here
 * lands in both surfaces + legacy paths simultaneously.
 */

type Props = {
  allowedFonts: string[];
  font: string;
  onFont: (f: string) => void;
  sizePct: number;
  onSizePct: (n: number) => void;
  rotation: number;
  onRotation: (n: number) => void;
  /** Optional header (e.g. "Text style — applies across all surfaces"). */
  header?: string;
  /** Optional hint shown below the rotation row. */
  hint?: string;
};

export function TextStyleControls({
  allowedFonts, font, onFont, sizePct, onSizePct, rotation, onRotation, header, hint,
}: Props) {
  return (
    <div style={{
      padding: '12px 14px',
      background: '#fafaf7',
      border: '1px solid var(--pv-rule)',
      borderRadius: 8,
      display: 'grid',
      gap: 10,
    }}>
      {header && (
        <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          {header}
        </div>
      )}
      {allowedFonts.length > 0 && (
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>Font</span>
          <select
            value={font}
            onChange={(e) => onFont(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: font, fontSize: 14, fontWeight: 500 }}
          >
            {allowedFonts.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        </label>
      )}
      <label style={{ display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>Size</span>
          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>{sizePct}%</span>
        </div>
        <input type="range" min={2} max={20} step={0.5} value={sizePct}
          onChange={(e) => onSizePct(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--pv-magenta)' }} />
      </label>
      <label style={{ display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>Rotation</span>
          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>{rotation}°</span>
        </div>
        <input type="range" min={-180} max={180} step={1} value={rotation}
          onChange={(e) => onRotation(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--pv-magenta)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <button type="button" onClick={() => onRotation(Math.max(-180, rotation - 15))}
            style={{ background: 'transparent', border: '1px solid var(--pv-rule)', padding: '2px 8px', fontFamily: 'var(--pv-f-mono)', fontSize: 10, cursor: 'pointer' }}>↺ −15°</button>
          <button type="button" onClick={() => onRotation(0)}
            style={{ background: 'transparent', border: '1px solid var(--pv-rule)', padding: '2px 8px', fontFamily: 'var(--pv-f-mono)', fontSize: 10, cursor: 'pointer' }}>Reset</button>
          <button type="button" onClick={() => onRotation(Math.min(180, rotation + 15))}
            style={{ background: 'transparent', border: '1px solid var(--pv-rule)', padding: '2px 8px', fontFamily: 'var(--pv-f-mono)', fontSize: 10, cursor: 'pointer' }}>+15° ↻</button>
        </div>
      </label>
      {hint && (
        <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)', letterSpacing: '0.04em' }}>
          {hint}
        </div>
      )}
    </div>
  );
}
