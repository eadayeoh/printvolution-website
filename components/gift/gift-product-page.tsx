'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadAndPreviewGift } from '@/app/(site)/gift/actions';
import { useCart } from '@/lib/cart-store';
import { formatSGD } from '@/lib/utils';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';
import type { GiftProduct, GiftTemplate, GiftCropRect } from '@/lib/gifts/types';

type Props = {
  product: GiftProduct;
  templates: GiftTemplate[];
};

export function GiftProductPage({ product, templates }: Props) {
  const addToCart = useCart((s) => s.add);
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ sourceAssetId: string; previewAssetId: string; previewUrl: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [addedFlash, setAddedFlash] = useState(false);

  const needTemplate = product.template_mode === 'required' && !selectedTemplateId;
  const hasTemplates = templates.length > 0 && product.template_mode !== 'none';

  async function onFile(file: File) {
    setErr(null);
    if (file.size > 20 * 1024 * 1024) { setErr('File too large (max 20 MB)'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('product_slug', product.slug);
    if (selectedTemplateId) fd.append('template_id', selectedTemplateId);
    try {
      const r = await uploadAndPreviewGift(fd);
      if (!r.ok) setErr(r.error);
      else setPreview(r);
    } catch (e: any) {
      setErr(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleAddToCart() {
    if (!preview) return;
    // Unit price: base price (we're not doing variants yet for gifts)
    const unit = product.base_price_cents;
    const lineTotal = unit * qty;
    addToCart({
      product_slug: product.slug,
      product_name: product.name,
      icon: product.thumbnail_url ?? null,
      config: {
        Mode: GIFT_MODE_LABEL[product.mode],
        ...(selectedTemplateId ? { Template: templates.find((t) => t.id === selectedTemplateId)?.name ?? '' } : {}),
      },
      qty,
      unit_price_cents: unit,
      line_total_cents: lineTotal,
      gift_image_url: preview.previewUrl,
      personalisation_notes: `gift_source:${preview.sourceAssetId};gift_preview:${preview.previewAssetId}`,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2200);
  }

  const thumb = product.thumbnail_url;

  return (
    <article>
      {/* Dark hero */}
      <section style={{ background: '#0d0d1a', color: '#fff', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 40, gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 12 }}>
              Personalised gift · {GIFT_MODE_LABEL[product.mode]}
            </div>
            <h1 style={{ fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.08, margin: '0 0 16px' }}>
              {product.name}
            </h1>
            {product.tagline && (
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', margin: '0 0 20px', lineHeight: 1.5 }}>
                {product.tagline}
              </p>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, padding: '10px 18px', background: 'rgba(233,30,140,0.15)', borderRadius: 999, color: '#E91E8C', fontSize: 13, fontWeight: 700 }}>
              From <strong style={{ fontSize: 18 }}>{formatSGD(product.base_price_cents)}</strong>
            </div>
          </div>
          <div style={{ position: 'relative', aspectRatio: '1 / 1', maxWidth: 420, marginLeft: 'auto', borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {thumb ? (
              <img src={thumb} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: 120 }}>🎁</div>
            )}
          </div>
        </div>
      </section>

      {/* Main configurator */}
      <section style={{ background: '#fff', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 36, gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 8 }}>
              Personalise
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 24px', color: '#0a0a0a' }}>
              Make it yours.
            </h2>

            {/* Step 1: template picker (if applicable) */}
            {hasTemplates && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', background: '#0a0a0a', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, marginRight: 8 }}>1</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a' }}>
                    Pick a template {product.template_mode === 'optional' && <span style={{ color: '#888', fontWeight: 500 }}>(or upload your own below)</span>}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                  {templates.map((t) => {
                    const active = selectedTemplateId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(active ? null : t.id)}
                        style={{
                          border: active ? '3px solid #E91E8C' : '3px solid transparent',
                          borderRadius: 12, background: '#fff', cursor: 'pointer', padding: 0,
                          overflow: 'hidden', transition: 'border-color .15s',
                        }}
                      >
                        <div style={{ aspectRatio: '1/1', background: '#fafaf7', overflow: 'hidden' }}>
                          {t.thumbnail_url ? (
                            <img src={t.thumbnail_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎨</div>
                          )}
                        </div>
                        <div style={{ padding: 10, textAlign: 'left' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>{t.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: upload */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ display: 'inline-block', padding: '3px 10px', background: '#0a0a0a', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, marginRight: 8 }}>{hasTemplates ? '2' : '1'}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a' }}>Upload your photo</span>
              </div>

              {needTemplate && (
                <div style={{ padding: 12, background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, fontSize: 13, color: '#92400e', marginBottom: 10 }}>
                  ⚠️ Pick a template above first.
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = '';
                }}
              />

              <button
                type="button"
                disabled={uploading || needTemplate}
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', padding: '24px', background: '#fafaf7',
                  border: '2px dashed #d4d4d4', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
                  cursor: uploading || needTemplate ? 'not-allowed' : 'pointer',
                  opacity: uploading || needTemplate ? 0.6 : 1,
                }}
              >
                {uploading ? (
                  <><Loader2 size={22} className="animate-spin" /> <span style={{ fontWeight: 700, color: '#666' }}>Processing…</span></>
                ) : (
                  <>
                    <Upload size={22} style={{ color: '#E91E8C' }} />
                    <span style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, color: '#0a0a0a', fontSize: 14 }}>Choose photo</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>JPG · PNG · HEIC · Max 20 MB</div>
                    </span>
                  </>
                )}
              </button>

              {err && (
                <div style={{ marginTop: 10, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991b1b', display: 'flex', gap: 8 }}>
                  <AlertCircle size={16} /> {err}
                </div>
              )}

              {uploading && (
                <div style={{ marginTop: 10, padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1e40af' }}>
                  {product.mode === 'photo-resize'
                    ? 'Cropping and adding bleed…'
                    : `Stylising your photo for ${GIFT_MODE_LABEL[product.mode].toLowerCase()}…`}
                  <div style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }}>This can take up to 20 seconds. Don&apos;t close the page.</div>
                </div>
              )}
            </div>

            {/* Step 3: preview */}
            {preview && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', background: '#0a0a0a', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, marginRight: 8 }}>{hasTemplates ? '3' : '2'}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a' }}>Preview</span>
                </div>
                <div style={{ border: '2px solid #0a0a0a', borderRadius: 12, overflow: 'hidden', background: '#fafaf7' }}>
                  <img src={preview.previewUrl} alt="Preview" style={{ width: '100%', display: 'block' }} />
                </div>
                <p style={{ marginTop: 10, fontSize: 12, color: '#666', lineHeight: 1.55 }}>
                  This is a <strong>low-resolution preview</strong>. The final printed piece is produced at 300 DPI with professional colour correction — quality is much higher than what you see here.
                </p>
                <button
                  type="button"
                  onClick={() => { setPreview(null); fileRef.current?.click(); }}
                  style={{ marginTop: 6, fontSize: 12, color: '#E91E8C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  ↻ Try a different photo
                </button>
              </div>
            )}
          </div>

          {/* Sticky buy box */}
          <aside style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: '#0a0a0a', color: '#fff', borderRadius: 14, padding: 26 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>Your order</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>{product.name}</div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, marginBottom: 14, display: 'grid', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mode</span><span style={{ fontWeight: 700 }}>{GIFT_MODE_LABEL[product.mode]}</span></div>
                {selectedTemplateId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Template</span>
                    <span style={{ fontWeight: 700 }}>{templates.find((t) => t.id === selectedTemplateId)?.name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Photo</span>
                  <span style={{ fontWeight: 700 }}>{preview ? '✓ Uploaded' : '—'}</span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                  Quantity
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 36, height: 36, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>−</button>
                  <input value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))} style={{ width: 60, padding: '6px 10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: 6 }} />
                  <button type="button" onClick={() => setQty(qty + 1)} style={{ width: 36, height: 36, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>+</button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Total</span>
                <span style={{ fontSize: 28, fontWeight: 900 }}>{formatSGD(product.base_price_cents * qty)}</span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!preview}
                style={{
                  width: '100%', padding: '14px', background: addedFlash ? '#16a34a' : (!preview ? 'rgba(255,255,255,0.1)' : '#E91E8C'),
                  color: '#fff', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 800,
                  cursor: preview ? 'pointer' : 'not-allowed', letterSpacing: 0.3,
                }}
              >
                {addedFlash ? <><CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />Added to Cart</> : 'Add to Cart'}
              </button>

              {!preview && (
                <p style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                  Upload your photo above to continue.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}
