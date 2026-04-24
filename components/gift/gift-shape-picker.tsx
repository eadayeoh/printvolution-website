'use client';

import type { ShapeOption, ShapeKind } from '@/lib/gifts/shape-options';
import type { GiftTemplate } from '@/lib/gifts/types';

type Props = {
  options: ShapeOption[];
  allTemplates: GiftTemplate[];
  selectedKind: ShapeKind;
  selectedTemplateId: string | null;
  onSelectKind: (k: ShapeKind) => void;
  onSelectTemplate: (id: string) => void;
};

export function GiftShapePicker({
  options,
  allTemplates,
  selectedKind,
  selectedTemplateId,
  onSelectKind,
  onSelectTemplate,
}: Props) {
  const templateRow = options.find((o) => o.kind === 'template');
  const visibleTemplates =
    templateRow && templateRow.kind === 'template'
      ? allTemplates.filter((t) => templateRow.template_ids.includes(t.id))
      : [];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const active = selectedKind === o.kind;
          return (
            <button
              key={o.kind}
              type="button"
              onClick={() => onSelectKind(o.kind)}
              style={{
                padding: '10px 14px',
                border: active ? '3px solid var(--pv-magenta)' : '2px solid var(--pv-ink)',
                background: active ? 'var(--pv-magenta)' : '#fff',
                color: active ? '#fff' : 'var(--pv-ink)',
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: active ? '2px 2px 0 var(--pv-yellow)' : 'none',
              }}
            >
              {o.label}
              {typeof o.price_delta_cents === 'number' && o.price_delta_cents > 0 && (
                <span style={{ opacity: 0.7, marginLeft: 6 }}>+S${(o.price_delta_cents / 100).toFixed(2)}</span>
              )}
            </button>
          );
        })}
      </div>
      {selectedKind === 'template' && visibleTemplates.length > 0 && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            paddingTop: 10,
            borderTop: '1px dashed var(--pv-rule)',
          }}
        >
          {visibleTemplates.map((t) => {
            const active = selectedTemplateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTemplate(t.id)}
                style={{
                  padding: 6,
                  border: active ? '3px solid var(--pv-magenta)' : '2px solid var(--pv-ink)',
                  background: '#fff',
                  cursor: 'pointer',
                  width: 84,
                }}
                title={t.name}
              >
                {t.thumbnail_url ? (
                  <img
                    src={t.thumbnail_url}
                    alt={t.name}
                    style={{ width: 68, height: 68, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                  />
                ) : (
                  <div style={{ width: 68, height: 68, background: '#f3f3f3' }} />
                )}
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, textAlign: 'center' }}>
                  {t.name}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
