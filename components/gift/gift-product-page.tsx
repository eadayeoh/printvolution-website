'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadAndPreviewGift, uploadGiftSurfacePhoto, restylePreviewFromSource, uploadGiftCartSnapshot } from '@/app/(site)/gift/actions';
import { useCart } from '@/lib/cart-store';
import { formatSGD } from '@/lib/utils';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';
import type { GiftProduct, GiftProductVariant, GiftTemplate, GiftCropRect, GiftVariantColourSwatch } from '@/lib/gifts/types';
import { TemplateMultiSlotForm } from './template-multi-slot-form';
import { GiftTemplateLayoutPreview } from './gift-template-layout-preview';
import { GiftVariantSurfaces, type SurfaceFillMap } from './gift-variant-surfaces';
import type { GiftPrompt } from '@/lib/gifts/prompts';
import { GiftCropTool } from '@/components/gift/gift-crop-tool';
import { GiftMockupPreview } from '@/components/gift/gift-mockup-preview';
import { GiftReadyByCard } from '@/components/gift/gift-ready-by-card';
import { GiftMockupPreviewInteractive } from '@/components/gift/gift-mockup-preview-interactive';
import { GiftVariantPicker } from '@/components/gift/gift-variant-picker';
import { GiftVariantLivePreview } from '@/components/gift/gift-variant-live-preview';
import { GiftRetentionNotice } from '@/components/gift/gift-retention-notice';
import { SeoMagazine, type SeoMagazineData } from '@/components/product/seo-magazine';
import {
  appendPreviewHit,
  loadPreviewHistory,
  removePreviewHit,
  type PreviewHit,
} from '@/lib/gifts/preview-history';
import { GiftShapePicker } from './gift-shape-picker';
import type { ShapeKind, ShapeOption } from '@/lib/gifts/shape-options';
import { shapeOptionsPriceDelta } from '@/lib/gifts/shape-options';

type Props = {
  product: GiftProduct;
  templates: GiftTemplate[];
  prompts: GiftPrompt[];
  variants?: GiftProductVariant[];
  relatedGifts?: Array<Pick<GiftProduct, 'slug' | 'name' | 'thumbnail_url' | 'base_price_cents' | 'price_tiers'>>;
};

export function GiftProductPage({ product, templates, prompts, variants = [], relatedGifts = [] }: Props) {
  const addToCart = useCart((s) => s.add);
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(
    prompts.length === 1 ? prompts[0].id : null,
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null,
  );
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  const productSizes = product.sizes ?? [];
  const sortedSizes = [...productSizes].sort((a, b) => a.display_order - b.display_order);
  const [selectedSizeSlug, setSelectedSizeSlug] = useState<string | null>(
    sortedSizes.length > 0 ? sortedSizes[0].slug : null,
  );
  const selectedSize = sortedSizes.find((s) => s.slug === selectedSizeSlug) ?? null;

  // Customer can drag/resize the design inside the variant's bounds.
  // Reset back to the variant's default starting area whenever the
  // variant changes so selecting a new base doesn't carry stale offsets.
  const defaultArea = (selectedVariant?.mockup_area as any) ?? (product.mockup_area as any) ?? null;
  const [customerArea, setCustomerArea] = useState<{ x: number; y: number; width: number; height: number } | null>(defaultArea);

  // Ref to the preview-stage DIV — lets handleAddToCart snapshot the
  // composited live-preview (mockup + positioned photo + text overlay)
  // via html2canvas so the cart thumbnail reflects what the customer
  // actually arranged, not just the raw AI preview.
  const previewStageRef = useRef<HTMLDivElement | null>(null);
  const [capturingSnapshot, setCapturingSnapshot] = useState(false);

  // Shape picker (cutout / rectangle / template) — enabled on products
  // that have a non-empty `shape_options` column. Customer picks a shape
  // under the big preview; Regenerate button fires when the tab drifts
  // from the last rendered combination.
  const shapeOptions: ShapeOption[] = (product.shape_options ?? []) as ShapeOption[];
  const shapePickerActive = shapeOptions.length > 0;
  const defaultShape: ShapeKind = shapeOptions[0]?.kind ?? 'rectangle';
  const [selectedShapeKind, setSelectedShapeKind] = useState<ShapeKind>(defaultShape);
  const [selectedShapeTemplateId, setSelectedShapeTemplateId] = useState<string | null>(() => {
    const tpl = shapeOptions.find((o) => o.kind === 'template');
    return tpl && tpl.kind === 'template' ? tpl.template_ids[0] ?? null : null;
  });
  const [lastRenderedShape, setLastRenderedShape] = useState<ShapeKind | null>(null);
  const [lastRenderedShapeTemplateId, setLastRenderedShapeTemplateId] = useState<string | null>(null);

  // Which face of a multi-surface variant the live preview shows.
  // Declared here (before shapeMockup) because the resolver reads it —
  // leaving it lower in the file tripped a temporal-dead-zone error in
  // the production bundle on products like the figurine photo frame.
  const [activeSurfaceId, setActiveSurfaceId] = useState<string>('');

  // Resolve the active mockup URL + area for the big live preview.
  // Precedence:
  //   1. If the variant has surfaces[] (front/back/left/right), the
  //      chosen surface's mockup wins so flipping a tab rotates the
  //      preview visually (used by the 360° rotating photo frame).
  //   2. Per-shape override from shape_options config (migration 0058).
  //   3. Variant's base mockup_url / mockup_area.
  //   4. Product's mockup_url / mockup_area as final fallback.
  const shapeMockup = (() => {
    const variantSurfaces = Array.isArray(selectedVariant?.surfaces) ? selectedVariant!.surfaces : [];
    if (variantSurfaces.length > 0) {
      const surface = variantSurfaces.find((s) => s.id === activeSurfaceId)
        ?? variantSurfaces[0];
      if (surface?.mockup_url) {
        return { url: surface.mockup_url, area: surface.mockup_area };
      }
    }
    if (shapePickerActive && selectedVariant?.mockup_by_shape) {
      const override = selectedVariant.mockup_by_shape[selectedShapeKind];
      if (override && override.url) {
        return { url: override.url, area: override.area };
      }
    }
    return {
      url: selectedVariant?.mockup_url || product.mockup_url || '',
      area: (selectedVariant?.mockup_area as any) ?? (product.mockup_area as any) ?? null,
    };
  })();

  // Reset the draggable area whenever the resolved shape mockup area
  // changes — either because variant flipped, or shape flipped, or the
  // selected template inside the shape=template flow changed.
  useEffect(() => {
    setCustomerArea(shapeMockup.area);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId, selectedShapeKind, selectedShapeTemplateId]);

  // Reset the active surface when the variant changes — otherwise a
  // cutout-style flip between variants could leave a stale surface id
  // selected.
  useEffect(() => {
    const first = selectedVariant?.surfaces?.[0]?.id ?? '';
    setActiveSurfaceId(first);
  }, [selectedVariantId, selectedVariant?.surfaces]);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ sourceAssetId: string; previewAssetId: string; previewUrl: string } | null>(null);
  // Which style the CURRENT preview was generated with. Drives the
  // Regenerate CTA: when selectedPromptId drifts from this, the preview
  // is stale relative to the picker and the customer gets a button to
  // re-run the pipeline with the new style against the same source.
  const [lastGeneratedPromptId, setLastGeneratedPromptId] = useState<string | null>(null);
  const [restyling, setRestyling] = useState(false);
  // Per-product preview history — persists to localStorage so customers
  // can flip back to earlier generations (across styles + photo uploads)
  // without re-running generate.
  const [history, setHistory] = useState<PreviewHit[]>([]);
  useEffect(() => {
    setHistory(loadPreviewHistory(product.slug));
  }, [product.slug]);
  const [err, setErr] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [addedFlash, setAddedFlash] = useState(false);
  const [cropPending, setCropPending] = useState<null | { file: File; src: string }>(null);
  const [engravedText, setEngravedText] = useState('');
  const allowedFonts = product.allowed_fonts ?? [];
  const [engravedFont, setEngravedFont] = useState<string>(allowedFonts[0] ?? 'Archivo');
  const [engravedSizePct, setEngravedSizePct] = useState<number>(6); // % of preview height
  const [textPos, setTextPos] = useState<{ x: number; y: number }>({ x: 50, y: 80 });

  // Pull the admin-configured Google Fonts once on mount so the picker
  // dropdown + the draggable text overlay both render in the real font.
  useEffect(() => {
    if (allowedFonts.length === 0) return;
    const families = allowedFonts.map((f) => f.replace(/\s+/g, '+') + ':wght@400;700').join('&family=');
    const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    if (document.querySelector(`link[data-gift-fonts]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-gift-fonts', '1');
    document.head.appendChild(link);
  }, [allowedFonts]);
  // Mirrored state from TemplateMultiSlotForm so the LIVE PREVIEW can
  // paint the zones the moment a file/text changes (before the server
  // composite runs).
  const [templateThumbs, setTemplateThumbs] = useState<Record<string, string>>({});
  const [templateTexts, setTemplateTexts] = useState<Record<string, string>>({});
  // Colour swatch picked inside the currently-selected variant tile (if
  // that variant has colour_swatches). Recorded on the cart line so the
  // admin sees "Navy" on the order, not just "T-shirt".
  const [selectedColour, setSelectedColour] = useState<GiftVariantColourSwatch | null>(null);
  // Per-surface fills (text / photo) when the selected variant has
  // surfaces[] configured. Keyed by surface.id. Cart payload reads from
  // this map; the big LIVE PREVIEW follows the selected surface tab.
  const [surfaceFills, setSurfaceFills] = useState<SurfaceFillMap>({});
  // activeSurfaceId is declared higher up (before shapeMockup reads it)
  // to avoid a temporal-dead-zone crash at render time.
  // Day / Night toggle was used for laser products; removed per user
  // feedback since it only flipped colours without changing the actual
  // preview. `nightMode` stays as a hard-coded `false` so inline styles
  // that reference it still compile — the conditional branches are dead.
  const nightMode = false;

  const needTemplate = product.template_mode === 'required' && !selectedTemplateId;
  const hasTemplates = templates.length > 0 && product.template_mode !== 'none';
  const showPromptPicker = prompts.length >= 2;
  const needPrompt = showPromptPicker && !selectedPromptId;
  const showTextStep = product.mode === 'laser' || product.mode === 'uv';

  // Right-column ComposeSection letters, computed once so adding or
  // removing a step (Shape, Style, Size …) doesn't require rethinking
  // every downstream ternary. Steps only count when their section is
  // actually rendered.
  const sectionLetters = (() => {
    const m: Record<string, string> = {};
    let i = 0;
    if (hasTemplates) m.template = String.fromCharCode(65 + i++);
    m.compose = String.fromCharCode(65 + i++); // Upload / Fill / Configure
    if (variants.length >= 2) m.variants = String.fromCharCode(65 + i++);
    if (shapePickerActive) m.shape = String.fromCharCode(65 + i++);
    if (sortedSizes.length > 0) m.size = String.fromCharCode(65 + i++);
    if (showPromptPicker) m.style = String.fromCharCode(65 + i++);
    if (showTextStep) m.text = String.fromCharCode(65 + i++);
    return m;
  })();
  // Non-AI modes run the server composite as a straight passthrough —
  // the CSS layout preview matches the final output, so we auto-fire
  // generate silently instead of asking the customer to click a button.
  // AI modes (laser / uv / embroidery) keep the explicit button because
  // their stylised output differs from the raw upload.
  const isNonAiMode =
    product.mode === 'photo-resize' ||
    product.mode === 'digital' ||
    product.mode === 'eco-solvent' ||
    product.mode === 'uv-dtf';

  async function onFile(file: File) {
    setErr(null);
    if (file.size > 20 * 1024 * 1024) { setErr('File too large (max 20 MB)'); return; }
    if (product.mode === 'photo-resize') {
      const src = URL.createObjectURL(file);
      setCropPending({ file, src });
      return;
    }
    await doUpload(file, null);
  }

  async function doUpload(file: File, cropRect: GiftCropRect | null) {
    setErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('product_slug', product.slug);
    if (selectedTemplateId) fd.append('template_id', selectedTemplateId);
    if (selectedPromptId) fd.append('prompt_id', selectedPromptId);
    if (selectedVariantId) fd.append('variant_id', selectedVariantId);
    if (cropRect) fd.append('crop_rect', JSON.stringify(cropRect));
    if (shapePickerActive) {
      fd.append('shape_kind', selectedShapeKind);
      if (selectedShapeKind === 'template' && selectedShapeTemplateId) {
        fd.append('shape_template_id', selectedShapeTemplateId);
      }
    }
    try {
      const r = await uploadAndPreviewGift(fd);
      if (!r || typeof r !== 'object') {
        setErr('Server returned no response. Please try again in a moment.');
      } else if (r.ok === true) {
        setPreview(r);
        setLastGeneratedPromptId(selectedPromptId);
        if (shapePickerActive) {
          setLastRenderedShape(selectedShapeKind);
          setLastRenderedShapeTemplateId(selectedShapeKind === 'template' ? selectedShapeTemplateId : null);
        }
        setHistory(appendPreviewHit(product.slug, {
          promptId: selectedPromptId,
          shapeKind: shapePickerActive ? selectedShapeKind : null,
          templateId: selectedShapeKind === 'template' ? selectedShapeTemplateId : null,
          sourceAssetId: r.sourceAssetId,
          previewAssetId: r.previewAssetId,
          previewUrl: r.previewUrl,
        }));
      } else {
        setErr(('error' in r && r.error) ? String(r.error) : 'Upload failed');
      }
    } catch (e: any) {
      setErr(e?.message || e?.toString?.() || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function doMultiSlotUpload(payload: {
    files: Record<string, File>;
    texts: Record<string, string>;
  }) {
    setErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('product_slug', product.slug);
    if (selectedTemplateId) fd.append('template_id', selectedTemplateId);
    if (selectedPromptId) fd.append('prompt_id', selectedPromptId);
    if (selectedVariantId) fd.append('variant_id', selectedVariantId);
    if (shapePickerActive) {
      fd.append('shape_kind', selectedShapeKind);
      if (selectedShapeKind === 'template' && selectedShapeTemplateId) {
        fd.append('shape_template_id', selectedShapeTemplateId);
      }
    }
    // Per-zone files: `file_<zone_id>`. Also emit the first file as
    // the legacy `file` key so the server action can register a primary
    // source asset for cart-tracking regardless of zone layout.
    let primaryAttached = false;
    for (const [zoneId, file] of Object.entries(payload.files)) {
      fd.append(`file_${zoneId}`, file);
      if (!primaryAttached) {
        fd.append('file', file);
        primaryAttached = true;
      }
    }
    for (const [zoneId, text] of Object.entries(payload.texts)) {
      fd.append(`text_${zoneId}`, text);
    }
    try {
      const r = await uploadAndPreviewGift(fd);
      if (!r || typeof r !== 'object') {
        setErr('Server returned no response. Please try again.');
      } else if (r.ok === true) {
        setPreview(r);
        setLastGeneratedPromptId(selectedPromptId);
        if (shapePickerActive) {
          setLastRenderedShape(selectedShapeKind);
          setLastRenderedShapeTemplateId(selectedShapeKind === 'template' ? selectedShapeTemplateId : null);
        }
        setHistory(appendPreviewHit(product.slug, {
          promptId: selectedPromptId,
          shapeKind: shapePickerActive ? selectedShapeKind : null,
          templateId: selectedShapeKind === 'template' ? selectedShapeTemplateId : null,
          sourceAssetId: r.sourceAssetId,
          previewAssetId: r.previewAssetId,
          previewUrl: r.previewUrl,
        }));
      } else {
        setErr(('error' in r && r.error) ? String(r.error) : 'Upload failed');
      }
    } catch (e: any) {
      setErr(e?.message || e?.toString?.() || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function doRestyle() {
    // Regenerate fires when either the style (prompt) or the shape
    // (tab / selected template) drifts from what's currently rendered.
    // Customers without a style picker can still regenerate a shape.
    if (!preview) return;
    if (!selectedPromptId && !shapePickerActive) return;
    setErr(null);
    setRestyling(true);
    try {
      const r = await restylePreviewFromSource({
        product_slug: product.slug,
        source_asset_id: preview.sourceAssetId,
        prompt_id: selectedPromptId,
        variant_id: selectedVariantId,
        shape_kind: shapePickerActive ? selectedShapeKind : null,
        shape_template_id: selectedShapeKind === 'template' ? selectedShapeTemplateId : null,
      });
      if (r.ok) {
        setPreview(r);
        setLastGeneratedPromptId(selectedPromptId);
        if (shapePickerActive) {
          setLastRenderedShape(selectedShapeKind);
          setLastRenderedShapeTemplateId(selectedShapeKind === 'template' ? selectedShapeTemplateId : null);
        }
        setHistory(appendPreviewHit(product.slug, {
          promptId: selectedPromptId,
          shapeKind: shapePickerActive ? selectedShapeKind : null,
          templateId: selectedShapeKind === 'template' ? selectedShapeTemplateId : null,
          sourceAssetId: r.sourceAssetId,
          previewAssetId: r.previewAssetId,
          previewUrl: r.previewUrl,
        }));
      } else {
        setErr(r.error || 'Regenerate failed');
      }
    } catch (e: any) {
      setErr(e?.message || 'Regenerate failed');
    } finally {
      setRestyling(false);
    }
  }

  // Active template, if the customer has picked one.
  const activeTemplate = selectedTemplateId
    ? templates.find((t) => t.id === selectedTemplateId) ?? null
    : null;

  // Multi-surface variants let the customer add to cart with text-only
  // fills — no server preview needed. For every other flow we still
  // require a server-generated preview.
  const hasSurfaces = Boolean(
    selectedVariant && Array.isArray(selectedVariant.surfaces) && selectedVariant.surfaces.length > 0,
  );
  const filledSurfaceCount = hasSurfaces
    ? Object.values(surfaceFills).filter((f) => (f.text ?? '').trim() || f.photoThumb).length
    : 0;
  const requiredSurfaceCount = hasSurfaces ? selectedVariant!.surfaces.length : 0;
  const surfacesReady = hasSurfaces && filledSurfaceCount === requiredSurfaceCount;

  async function handleAddToCart() {
    if (!hasSurfaces && !preview) return;
    if (hasSurfaces && !surfacesReady) return;

    // Surfaces flow: before adding to cart, upload each photo-surface
    // to storage so the cart line carries asset IDs. Text surfaces
    // just pass their string through — no upload.
    let surfacesPayload: Array<{
      id: string;
      label: string;
      text?: string;
      source_asset_id?: string;
      mode: 'laser' | 'uv' | 'embroidery' | 'photo-resize' | 'eco-solvent' | 'digital' | 'uv-dtf';
    }> | undefined;
    if (hasSurfaces && selectedVariant) {
      setUploading(true);
      try {
        surfacesPayload = [];
        for (const s of selectedVariant.surfaces) {
          const fill = surfaceFills[s.id];
          if (!fill) continue;
          const txt = (fill.text ?? '').trim();
          let sourceAssetId: string | undefined;
          if (fill.photoFile) {
            const fd = new FormData();
            fd.append('file', fill.photoFile);
            fd.append('product_slug', product.slug);
            fd.append('surface_id', s.id);
            const r = await uploadGiftSurfacePhoto(fd);
            if (!r.ok) { setErr(r.error); setUploading(false); return; }
            sourceAssetId = r.sourceAssetId;
          }
          surfacesPayload.push({
            id: s.id,
            label: s.label,
            text: txt || undefined,
            source_asset_id: sourceAssetId,
            mode: s.mode ?? product.mode,
          });
        }
      } catch (e: any) {
        setErr(e?.message ?? 'Surface upload failed');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const shapeDelta = shapePickerActive
      ? shapeOptionsPriceDelta(shapeOptions, selectedShapeKind)
      : 0;
    const unit = (selectedVariant?.base_price_cents || product.base_price_cents)
      + (selectedSize?.price_delta_cents ?? 0)
      + shapeDelta;
    const lineTotal = unit * qty;
    const config: Record<string, string> = {
      Mode: GIFT_MODE_LABEL[product.mode],
    };
    if (shapePickerActive) {
      config.Shape = selectedShapeKind === 'template'
        ? `Template — ${templates.find((t) => t.id === selectedShapeTemplateId)?.name ?? 'Template'}`
        : selectedShapeKind.charAt(0).toUpperCase() + selectedShapeKind.slice(1);
    }
    if (selectedVariant) {
      config.Base = selectedVariant.name;
    }
    if (selectedSize) {
      config.Size = `${selectedSize.name} (${selectedSize.width_mm}×${selectedSize.height_mm}mm)`;
    }
    if (selectedColour) {
      config.Colour = selectedColour.name;
    }
    if (selectedTemplateId) {
      config.Template = templates.find((t) => t.id === selectedTemplateId)?.name ?? '';
    }
    if (selectedPromptId && prompts.length > 1) {
      config.Style = prompts.find((p) => p.id === selectedPromptId)?.name ?? '';
    }
    if (engravedText.trim()) {
      config.Text = engravedText.trim();
    }
    // Surfaces: emit one config line per filled surface so the admin
    // order view reads "Front: ELAINE / Back: 2024-01-15" without
    // having to parse the personalisation_notes blob. When a surface
    // has its own production method, annotate the label so production
    // knows which machine runs this face ("Front (laser): ELAINE").
    if (hasSurfaces && selectedVariant) {
      for (const s of selectedVariant.surfaces) {
        const fill = surfaceFills[s.id];
        if (!fill) continue;
        const txt = (fill.text ?? '').trim();
        const method = s.mode ?? null;
        const label = method ? `${s.label} (${GIFT_MODE_LABEL[method]})` : s.label;
        if (txt) config[label] = txt;
        else if (fill.photoThumb) config[label] = '(photo uploaded)';
      }
    }
    // Build the personalisation_notes string. Server preview path keeps
    // the asset-id trail; surfaces path emits one text_<id> pair per
    // surface so the admin / pipeline can read each face separately.
    let notes = '';
    if (preview) {
      notes = `gift_source:${preview.sourceAssetId};gift_preview:${preview.previewAssetId}`;
      if (engravedText.trim()) {
        notes += `;text:${engravedText.trim()}`;
        notes += `;text_font:${engravedFont}`;
        notes += `;text_size:${engravedSizePct}`;
        notes += `;text_pos:${textPos.x.toFixed(1)},${textPos.y.toFixed(1)}`;
      }
    }
    if (hasSurfaces && selectedVariant) {
      for (const s of selectedVariant.surfaces) {
        const fill = surfaceFills[s.id];
        if (!fill) continue;
        const txt = (fill.text ?? '').trim();
        if (txt) notes += `${notes ? ';' : ''}text_${s.id}:${txt}`;
        if (s.mode) notes += `${notes ? ';' : ''}mode_${s.id}:${s.mode}`;
      }
    }
    if (selectedColour) notes += `${notes ? ';' : ''}colour:${selectedColour.name}`;
    // Record the customer's adjusted area so production knows where
    // to place the design on the 300 DPI file (if they dragged/resized).
    if (customerArea && defaultArea && (
      customerArea.x !== defaultArea.x ||
      customerArea.y !== defaultArea.y ||
      customerArea.width !== defaultArea.width ||
      customerArea.height !== defaultArea.height
    )) {
      notes += `${notes ? ';' : ''}area:${customerArea.x.toFixed(2)},${customerArea.y.toFixed(2)},${customerArea.width.toFixed(2)},${customerArea.height.toFixed(2)}`;
    }

    // Snapshot the live preview AS THE CUSTOMER ARRANGED IT. Gives the
    // cart thumbnail a concrete "this is my design" image instead of
    // the raw AI preview (which doesn't show mockup, position, or text).
    // Fails open: if html2canvas or the upload errors, fall back to the
    // existing preview URL so cart-add never blocks on a screenshot.
    let snapshotUrl: string | null = null;
    if (previewStageRef.current && preview) {
      try {
        setCapturingSnapshot(true);
        // Wait a frame so React repaints without the editor chrome.
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(previewStageRef.current, {
          backgroundColor: '#FFF4E5',
          useCORS: true,
          logging: false,
          scale: 2,
        });
        const blob: Blob | null = await new Promise((res) =>
          canvas.toBlob((b) => res(b), 'image/png'),
        );
        if (blob) {
          const fd = new FormData();
          fd.append('file', new File([blob], 'cart.png', { type: 'image/png' }));
          fd.append('product_slug', product.slug);
          const r = await uploadGiftCartSnapshot(fd);
          if (r.ok) snapshotUrl = r.url;
        }
      } catch (e) {
        console.warn('[gift cart] snapshot failed, falling back to preview', e);
      } finally {
        setCapturingSnapshot(false);
      }
    }

    addToCart({
      product_slug: product.slug,
      product_name: product.name,
      icon: product.thumbnail_url ?? null,
      config,
      qty,
      unit_price_cents: unit,
      line_total_cents: lineTotal,
      gift_image_url:
        snapshotUrl ??
        preview?.previewUrl ??
        selectedVariant?.mockup_url ??
        product.thumbnail_url ??
        undefined,
      personalisation_notes: notes,
      surfaces: surfacesPayload,
      gift_variant_id: selectedVariant?.id,
      shape_kind: shapePickerActive ? selectedShapeKind : null,
      shape_template_id: selectedShapeKind === 'template' ? selectedShapeTemplateId : null,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2200);
  }

  const modeLabel = GIFT_MODE_LABEL[product.mode];
  // Admin-authored content wins over the mode-based default. Null / empty
  // in the DB → fall back to built-ins so fresh products aren't blank.
  const adminMagazine = product.seo_magazine as SeoMagazineData | null | undefined;
  const seoMagazineData = adminMagazine && adminMagazine.articles && adminMagazine.articles.length > 0
    ? adminMagazine
    : buildGiftMagazine(product);
  const faqs = Array.isArray(product.faqs) && product.faqs.length > 0
    ? product.faqs.map((f) => ({ q: f.question, a: f.answer }))
    : buildGiftFaqs(product);
  const occasions = Array.isArray(product.occasions) && product.occasions.length > 0
    ? product.occasions
    : DEFAULT_OCCASION_MATCHER;
  const processSteps = Array.isArray(product.process_steps) && product.process_steps.length > 0
    ? product.process_steps
    : buildProcessSteps(product);

  return (
    <article>
      {/* ---------- HERO ---------- */}
      <section
        style={{
          padding: '48px 24px 32px',
          background: 'var(--pv-cream)',
          borderBottom: '2px solid var(--pv-ink)',
        }}
      >
        <div style={{ maxWidth: 1560, margin: '0 auto' }}>
          <div
            className="gift-hero-title-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 32,
              alignItems: 'end',
              marginBottom: 12,
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(44px, 5.5vw, 80px)',
                lineHeight: 0.92,
                letterSpacing: '-0.03em',
                margin: 0,
              }}
            >
              {product.name}
              {product.tagline && (
                <>
                  ,<br />
                  <em
                    style={{
                      fontStyle: 'normal',
                      position: 'relative',
                      display: 'inline-block',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: '-2%',
                        width: '104%',
                        height: 16,
                        background: 'var(--pv-yellow)',
                        zIndex: -1,
                        transform: 'skew(-6deg)',
                      }}
                    />
                    {product.tagline}
                  </em>
                </>
              )}
            </h1>
            <div
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 12,
                color: 'var(--pv-muted)',
                letterSpacing: '0.04em',
              }}
            >
              <span>★ Personalised · {modeLabel}</span>
              <span style={{ color: 'var(--pv-rule)' }}>•</span>
              <span>
                Ready in {product.lead_time_days ?? 5} working day
                {(product.lead_time_days ?? 5) === 1 ? '' : 's'}
              </span>
              <span style={{ color: 'var(--pv-rule)' }}>•</span>
              <span>From {formatSGD(product.base_price_cents)}</span>
            </div>
          </div>
          {(() => {
            // Hero lede: prefer a short first sentence from the description.
            // The raw `description` in the DB is often a multi-paragraph WP
            // import that shouldn't land in the hero verbatim. If tagline is
            // empty (no H1 em treatment) fall back to the first clause.
            const raw = (product.description ?? '').trim();
            if (!raw || product.tagline) return null;
            const firstPara = raw.split(/\n\n|(?<=[.!?])\s+(?=[A-Z])/)[0];
            const trimmed = firstPara.length > 220 ? firstPara.slice(0, 217) + '…' : firstPara;
            return (
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.5,
                  maxWidth: 760,
                  color: 'var(--pv-ink-soft)',
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {trimmed}
              </p>
            );
          })()}
        </div>
      </section>

      {/* ---------- CONFIGURATOR ---------- */}
      <section
        style={{
          background: 'var(--pv-cream-warm, #FFF4E5)',
          padding: '48px 24px',
          borderBottom: '2px solid var(--pv-ink)',
        }}
      >
        <div
          className="gift-config-inner"
          style={{
            maxWidth: 1560,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 40,
            alignItems: 'start',
          }}
        >
          {/* LEFT: Live Preview + Compose Controls */}
          <div className="gift-preview-col" style={{ position: 'sticky', top: 100 }}>
            {/* Preview shell */}
            <div
              style={{
                background: '#fff',
                border: '2px solid var(--pv-ink)',
                boxShadow: '8px 8px 0 var(--pv-ink)',
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              {/* Preview head */}
              <div
                style={{
                  background: 'var(--pv-ink)',
                  color: '#fff',
                  padding: '12px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <span style={{ color: 'var(--pv-yellow)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    aria-hidden
                    style={{ width: 8, height: 8, background: 'var(--pv-magenta)', borderRadius: '50%' }}
                  />
                  Live Preview
                </span>
                {/* Face toggle — shown only when the chosen variant has
                    two or more surfaces (e.g. the 360° rotating photo
                    frame's front + back). Clicking flips the visible
                    face in the big preview; the configurator's inline
                    tabs stay in sync via the shared activeSurfaceId. */}
                {hasSurfaces && (selectedVariant?.surfaces.length ?? 0) >= 2 && (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {selectedVariant!.surfaces.map((s) => {
                      const active = s.id === activeSurfaceId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setActiveSurfaceId(s.id)}
                          style={{
                            background: active ? 'var(--pv-magenta)' : 'transparent',
                            color: active ? '#fff' : 'var(--pv-yellow)',
                            border: `1.5px solid ${active ? 'var(--pv-magenta)' : 'var(--pv-yellow)'}`,
                            padding: '4px 10px',
                            fontFamily: 'var(--pv-f-mono)',
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Preview stage — sized to the mockup so there's no
                  empty space above / below the image. Safety minHeight
                  so the shell never collapses to a thin strip while
                  an async preview is loading / re-rendering. */}
              <div
                ref={previewStageRef}
                style={{
                  background: 'var(--pv-cream-warm, #FFF4E5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  minHeight: 320,
                }}
              >
                {(uploading || restyling) && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: nightMode ? 'rgba(26,20,16,0.92)' : 'rgba(255,244,229,0.92)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 16,
                      zIndex: 10,
                    }}
                  >
                    <Loader2 size={40} className="animate-spin" style={{ color: nightMode ? 'var(--pv-yellow)' : 'var(--pv-magenta)' }} />
                    <div
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 11,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: nightMode ? 'var(--pv-yellow)' : 'var(--pv-ink)',
                      }}
                    >
                      {restyling
                        ? 'Regenerating with new style…'
                        : product.mode === 'photo-resize' ? 'Cropping and adding bleed…' : 'Stylising your photo…'}
                    </div>
                  </div>
                )}

                {(() => {
                  // Surfaces flow: no server preview — composite the
                  // customer's uploaded thumb directly onto the active
                  // surface's mockup so flipping Front/Back updates the
                  // big preview live without a generate call.
                  const surfaceThumb = hasSurfaces
                    ? surfaceFills[activeSurfaceId]?.photoThumb ?? null
                    : null;
                  const effectivePreviewUrl = preview?.previewUrl ?? surfaceThumb;
                  return effectivePreviewUrl;
                })() ? (
                  (selectedVariant?.mockup_url || product.mockup_url) && customerArea ? (
                    <div style={{ width: '100%' }}>
                      <GiftMockupPreviewInteractive
                        mockupUrl={shapeMockup.url}
                        previewUrl={preview?.previewUrl ?? (hasSurfaces ? surfaceFills[activeSurfaceId]?.photoThumb ?? '' : '')}
                        area={customerArea}
                        bounds={(shapeMockup.area as any) ?? null}
                        onAreaChange={setCustomerArea}
                        textLayer={engravedText.trim() ? {
                          text: engravedText.trim(),
                          x: textPos.x,
                          y: textPos.y,
                          sizePct: engravedSizePct,
                          fontFamily: engravedFont,
                          color: '#0a0a0a',
                        } : null}
                        onTextChange={(t) => setTextPos({ x: t.x, y: t.y })}
                        captureMode={capturingSnapshot}
                      />
                    </div>
                  ) : (
                    <img
                      src={preview?.previewUrl ?? (hasSurfaces ? surfaceFills[activeSurfaceId]?.photoThumb ?? '' : '')}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 420,
                        objectFit: 'contain',
                        filter: nightMode ? 'brightness(1.1) contrast(1.2)' : undefined,
                      }}
                    />
                  )
                ) : activeTemplate && (activeTemplate.zones_json?.length ?? 0) > 0 ? (
                  <div style={{ width: '100%', maxWidth: 420 }}>
                    <GiftTemplateLayoutPreview
                      template={activeTemplate}
                      thumbs={templateThumbs}
                      texts={templateTexts}
                      widthMm={selectedVariant?.width_mm || product.width_mm}
                      heightMm={selectedVariant?.height_mm || product.height_mm}
                    />
                  </div>
                ) : shapeMockup.url ? (
                  <div style={{ width: '100%', position: 'relative' }}>
                    <img
                      src={shapeMockup.url}
                      alt={product.name}
                      style={{
                        display: 'block',
                        width: '100%',
                        height: 'auto',
                        filter: nightMode ? 'brightness(0.8) contrast(1.1)' : undefined,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: nightMode ? 'rgba(26,20,16,0.55)' : 'rgba(255,244,229,0.72)',
                        color: nightMode ? 'var(--pv-yellow)' : 'var(--pv-ink)',
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 11,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        textAlign: 'center',
                        padding: 16,
                        lineHeight: 1.6,
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 24, marginBottom: 6, color: 'var(--pv-magenta)' }}>✦</div>
                        Upload a photo<br />
                        {hasTemplates || showPromptPicker ? 'and pick a style' : 'to see a live preview'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: nightMode ? 'rgba(255,221,0,0.5)' : 'rgba(10,10,10,0.4)',
                      textAlign: 'center',
                      fontWeight: 700,
                      lineHeight: 1.6,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--pv-f-display)',
                        fontSize: 24,
                        marginBottom: 6,
                        color: 'var(--pv-magenta)',
                      }}
                    >
                      ✦
                    </div>
                    Upload a photo<br />
                    {hasTemplates || showPromptPicker ? 'and pick a style' : 'to see a live preview'}
                  </div>
                )}

                {/* Text is rendered inside GiftMockupPreviewInteractive as a
                    draggable layer — no separate overlay here. */}
              </div>
            </div>

            {/* Regenerate CTA — surfaces when the customer switches the
                style picker after a generation, so the visible preview
                is now in the *old* style. Re-runs the pipeline against
                the already-uploaded source with the new prompt. */}
            {(() => {
              const styleDrift = showPromptPicker && selectedPromptId != null
                && selectedPromptId !== lastGeneratedPromptId;
              const shapeDrift = shapePickerActive && lastRenderedShape != null
                && (selectedShapeKind !== lastRenderedShape
                  || (selectedShapeKind === 'template' && selectedShapeTemplateId !== lastRenderedShapeTemplateId));
              if (!preview || (!styleDrift && !shapeDrift)) return null;
              const ctaParts: string[] = [];
              if (styleDrift) {
                ctaParts.push(`${prompts.find((p) => p.id === selectedPromptId)?.name ?? 'the new style'}`);
              }
              if (shapeDrift) {
                const shapeName = selectedShapeKind === 'template'
                  ? templates.find((t) => t.id === selectedShapeTemplateId)?.name ?? 'Template'
                  : selectedShapeKind.charAt(0).toUpperCase() + selectedShapeKind.slice(1);
                ctaParts.push(shapeName);
              }
              const oldParts: string[] = [];
              if (styleDrift) oldParts.push(prompts.find((p) => p.id === lastGeneratedPromptId)?.name ?? 'the old style');
              if (shapeDrift) {
                const oldShapeName = lastRenderedShape === 'template'
                  ? templates.find((t) => t.id === lastRenderedShapeTemplateId)?.name ?? 'Template'
                  : lastRenderedShape
                    ? lastRenderedShape.charAt(0).toUpperCase() + lastRenderedShape.slice(1)
                    : 'the old shape';
                oldParts.push(oldShapeName);
              }
              return (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  border: '2px solid var(--pv-ink)',
                  background: 'var(--pv-yellow)',
                  boxShadow: '4px 4px 0 var(--pv-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: 'var(--pv-ink)',
                    lineHeight: 1.4,
                  }}
                >
                  Preview is still <b>{oldParts.join(' · ')}</b>.
                  <br />
                  Regenerate with <b>{ctaParts.join(' · ')}</b>?
                </div>
                <button
                  type="button"
                  onClick={doRestyle}
                  disabled={restyling}
                  style={{
                    padding: '10px 18px',
                    border: '2px solid var(--pv-ink)',
                    background: restyling ? 'var(--pv-muted, #999)' : 'var(--pv-magenta)',
                    color: '#fff',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: restyling ? 'wait' : 'pointer',
                    boxShadow: '3px 3px 0 var(--pv-ink)',
                  }}
                >
                  {restyling ? 'Regenerating…' : '↻ Regenerate'}
                </button>
              </div>
              );
            })()}

            {/* Cross-style generation history — every earlier hit for this
                product (both Line Art and Realistic, across photo swaps).
                Click restores the preview AND flips the style picker to
                match so the configurator stays coherent. */}
            {(() => {
              const allHits = [...history].sort((a, b) => b.ts - a.ts);
              if (allHits.length === 0) return null;
              return (
                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    background: 'var(--pv-cream-warm, #FFF4E5)',
                    border: '2px solid var(--pv-ink)',
                    boxShadow: '4px 4px 0 var(--pv-ink)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--pv-ink)',
                      }}
                    >
                      ↻ Your earlier previews · tap to restore
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Clear all preview history for this product?')) return;
                        // clearPreviewHistoryForStyle with every distinct
                        // promptId would still work, but wiping the whole
                        // localStorage key is simpler — no server state to
                        // reconcile.
                        try { window.localStorage.removeItem(`gift-preview-history:${product.slug}`); } catch {}
                        setHistory([]);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '2px 6px',
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--pv-magenta)',
                        cursor: 'pointer',
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      overflowX: 'auto',
                      paddingBottom: 2,
                    }}
                  >
                    {allHits.map((h) => {
                      const active = preview?.previewAssetId === h.previewAssetId;
                      const styleName = h.promptId
                        ? prompts.find((p) => p.id === h.promptId)?.name ?? 'Style'
                        : 'Preview';
                      const shapeName =
                        h.shapeKind === 'cutout' ? 'Cutout'
                        : h.shapeKind === 'rectangle' ? 'Rectangle'
                        : h.shapeKind === 'template'
                          ? templates.find((t) => t.id === h.templateId)?.name ?? 'Template'
                          : null;
                      const hitLabel = shapeName ? `${shapeName} · ${styleName}` : styleName;
                      return (
                        <div key={h.id} style={{ position: 'relative', flexShrink: 0, width: 80 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setPreview({
                                sourceAssetId: h.sourceAssetId,
                                previewAssetId: h.previewAssetId,
                                previewUrl: h.previewUrl,
                              });
                              if (h.promptId) setSelectedPromptId(h.promptId);
                              // The picked hit IS the current preview now —
                              // keep lastGeneratedPromptId in sync so the
                              // Regenerate button only surfaces on a real
                              // style drift, not right after a restore.
                              setLastGeneratedPromptId(h.promptId);
                              if (h.shapeKind) {
                                setSelectedShapeKind(h.shapeKind);
                                setSelectedShapeTemplateId(h.templateId);
                                setLastRenderedShape(h.shapeKind);
                                setLastRenderedShapeTemplateId(h.templateId);
                              }
                            }}
                            style={{
                              width: 80,
                              height: 80,
                              padding: 0,
                              border: active ? '3px solid var(--pv-magenta)' : '2px solid var(--pv-ink)',
                              boxShadow: active ? '2px 2px 0 var(--pv-yellow)' : 'none',
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'block',
                              overflow: 'hidden',
                            }}
                            title={`${hitLabel} · ${new Date(h.ts).toLocaleString()}`}
                          >
                            <img
                              src={h.previewUrl}
                              alt={`${hitLabel} preview`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          </button>
                          <div
                            style={{
                              marginTop: 4,
                              fontFamily: 'var(--pv-f-mono)',
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              textAlign: 'center',
                              color: 'var(--pv-ink)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {hitLabel}
                          </div>
                          <button
                            type="button"
                            aria-label="Remove from history"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistory(removePreviewHit(product.slug, h.id));
                            }}
                            style={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: '2px solid var(--pv-ink)',
                              background: '#fff',
                              color: 'var(--pv-ink)',
                              cursor: 'pointer',
                              fontSize: 10,
                              fontWeight: 900,
                              lineHeight: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Selected variant's features — playful "inside the box"
                panel. Confetti dots on cream background, thick ink
                border, magenta drop-shadow, corner ribbon tag, and a
                two-column checklist with coloured ✓ badges. */}
            {selectedVariant && selectedVariant.features && selectedVariant.features.length > 0 && (
              <div
                style={{
                  marginTop: 18,
                  position: 'relative',
                  background: 'var(--pv-cream-warm, #FFF4E5)',
                  backgroundImage:
                    'radial-gradient(circle at 10% 20%, rgba(233,30,140,0.35) 0, rgba(233,30,140,0.35) 2px, transparent 2.5px), ' +
                    'radial-gradient(circle at 85% 15%, rgba(255,221,0,0.7) 0, rgba(255,221,0,0.7) 2.5px, transparent 3px), ' +
                    'radial-gradient(circle at 25% 85%, rgba(168,230,207,0.85) 0, rgba(168,230,207,0.85) 2.5px, transparent 3px), ' +
                    'radial-gradient(circle at 92% 75%, rgba(233,30,140,0.3) 0, rgba(233,30,140,0.3) 2px, transparent 2.5px), ' +
                    'radial-gradient(circle at 50% 48%, rgba(255,221,0,0.55) 0, rgba(255,221,0,0.55) 1.5px, transparent 2px)',
                  border: '3px solid var(--pv-ink)',
                  boxShadow: '6px 6px 0 var(--pv-magenta)',
                  padding: '22px 18px 18px',
                }}
              >
                {/* Corner tape ribbon */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: -14,
                    left: 16,
                    background: 'var(--pv-yellow)',
                    border: '2px solid var(--pv-ink)',
                    padding: '4px 12px',
                    transform: 'rotate(-3deg)',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--pv-ink)',
                    boxShadow: '2px 2px 0 var(--pv-ink)',
                  }}
                >
                  ✦ Product features
                </div>
                {/* Variant sub-title */}
                <div
                  style={{
                    fontFamily: 'var(--pv-f-display, var(--pv-f-body))',
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--pv-ink)',
                    marginBottom: 12,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {selectedVariant.name}
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '14px 16px',
                  }}
                >
                  {selectedVariant.features.map((f, i) => {
                    const colours = [
                      { bg: 'var(--pv-magenta)', fg: '#fff',          shadow: 'var(--pv-ink)',     emoji: '✦' },
                      { bg: 'var(--pv-yellow)',  fg: 'var(--pv-ink)', shadow: 'var(--pv-magenta)', emoji: '★' },
                      { bg: '#06b6d4',           fg: '#fff',          shadow: 'var(--pv-ink)',     emoji: '◆' },
                      { bg: '#a8e6cf',           fg: 'var(--pv-ink)', shadow: 'var(--pv-magenta)', emoji: '❋' },
                      { bg: 'var(--pv-ink)',     fg: 'var(--pv-yellow)', shadow: '#06b6d4',        emoji: '❖' },
                    ];
                    const c = colours[i % colours.length];
                    const rotate = [-2.5, 2, -1.5, 1.8, -2, 1.5][i % 6];
                    return (
                      <li
                        key={i}
                        style={{
                          position: 'relative',
                          background: '#fff',
                          border: '2.5px solid var(--pv-ink)',
                          boxShadow: `4px 4px 0 ${c.shadow}`,
                          padding: '14px 14px 14px 48px',
                          transform: `rotate(${rotate}deg)`,
                          fontFamily: 'var(--pv-f-body)',
                          fontSize: 13,
                          fontWeight: 700,
                          lineHeight: 1.3,
                          color: 'var(--pv-ink)',
                          transition: 'transform 0.15s',
                        }}
                      >
                        {/* Big coloured emoji badge in the corner */}
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            top: -8,
                            left: -8,
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            border: '2.5px solid var(--pv-ink)',
                            background: c.bg,
                            color: c.fg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            fontWeight: 900,
                            lineHeight: 1,
                            boxShadow: '2px 2px 0 var(--pv-ink)',
                            transform: `rotate(${-rotate * 1.5}deg)`,
                          }}
                        >
                          {c.emoji}
                        </span>
                        {f}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

          </div>

          {/* RIGHT: Options + Price */}
          <div>
            {/* Compose controls */}
            <div
              style={{
                background: '#fff',
                border: '2px solid var(--pv-ink)',
                boxShadow: '5px 5px 0 var(--pv-ink)',
                marginBottom: 14,
              }}
            >
              {/* Step A: Template picker — picked first so the Fill /
                  Upload section below knows whether to render the
                  multi-slot form or the legacy single-file dropzone. */}
              {hasTemplates && (
                <ComposeSection letter={sectionLetters.template ?? 'A'} title="Pick a template">
                  <div
                    style={{
                      display: 'grid',
                      gap: 8,
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    }}
                  >
                    {templates.map((t) => {
                      const active = selectedTemplateId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTemplateId(active ? null : t.id)}
                          style={{
                            background: '#fff',
                            border: active ? '2px solid var(--pv-magenta)' : '2px solid var(--pv-rule)',
                            cursor: 'pointer',
                            padding: 0,
                            overflow: 'hidden',
                            boxShadow: active ? '3px 3px 0 var(--pv-magenta)' : 'none',
                            transition: 'all 0.12s',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ aspectRatio: '1/1', background: 'var(--pv-cream)', overflow: 'hidden' }}>
                            {t.thumbnail_url ? (
                              <img src={t.thumbnail_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎨</div>
                            )}
                          </div>
                          <div style={{ padding: '8px 10px', fontFamily: 'var(--pv-f-body)', fontSize: 11, fontWeight: 700 }}>
                            {t.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {product.template_mode === 'optional' && (
                    <div
                      style={{
                        marginTop: 8,
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 10,
                        color: 'var(--pv-muted)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Optional — or just upload your own.
                    </div>
                  )}
                </ComposeSection>
              )}

              {/* Multi-surface configurator — only shown when the
                  selected variant has surfaces[] set. Replaces the
                  standard Upload section below since surfaces handle
                  their own input (text / photo / both per surface). */}
              {selectedVariant && selectedVariant.surfaces.length > 0 && (
                <ComposeSection letter={sectionLetters.compose} title={`Configure ${selectedVariant.name}`}>
                  <GiftVariantSurfaces
                    surfaces={selectedVariant.surfaces}
                    fills={surfaceFills}
                    onChange={setSurfaceFills}
                    variantMockupUrl={selectedVariant.mockup_url || undefined}
                    activeSurfaceId={activeSurfaceId || selectedVariant.surfaces[0]?.id}
                    onActiveSurfaceChange={setActiveSurfaceId}
                  />
                </ComposeSection>
              )}

              {/* Step B (or A when there are no templates): Multi-slot
                  upload when a template is active, single-file upload
                  otherwise. Skipped entirely for variants with surfaces[] —
                  those use their own inline configurator above. */}
              {selectedVariant && selectedVariant.surfaces.length > 0 ? null : activeTemplate && (activeTemplate.zones_json?.length ?? 0) > 0 ? (
                <ComposeSection letter={sectionLetters.compose} title="Fill the template">
                  <TemplateMultiSlotForm
                    template={activeTemplate}
                    isWorking={uploading}
                    currentPreviewUrl={preview?.previewUrl ?? null}
                    onReset={() => setPreview(null)}
                    onGeneratePreview={doMultiSlotUpload}
                    autoGenerate={isNonAiMode}
                    onStateChange={({ thumbs, texts }) => {
                      setTemplateThumbs(thumbs);
                      setTemplateTexts(texts);
                    }}
                  />
                  {err && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 12,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        fontSize: 13,
                        color: '#991b1b',
                        display: 'flex',
                        gap: 8,
                      }}
                    >
                      <AlertCircle size={16} /> {err}
                    </div>
                  )}
                </ComposeSection>
              ) : (
              <ComposeSection letter={sectionLetters.compose} title="Upload your photo">
                {!preview && !uploading && (
                  <div
                    onClick={() => !needTemplate && !needPrompt && fileRef.current?.click()}
                    style={{
                      background: 'var(--pv-cream)',
                      border: '3px dashed var(--pv-magenta)',
                      padding: 24,
                      textAlign: 'center',
                      cursor: needTemplate || needPrompt ? 'not-allowed' : 'pointer',
                      opacity: needTemplate || needPrompt ? 0.6 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        border: '2px solid var(--pv-ink)',
                        background: 'var(--pv-magenta)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--pv-f-display)',
                        fontSize: 22,
                        margin: '0 auto 10px',
                        transform: 'rotate(-4deg)',
                        boxShadow: '2px 2px 0 var(--pv-ink)',
                      }}
                    >
                      ↑
                    </div>
                    <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 18, letterSpacing: '-0.02em', marginBottom: 4 }}>
                      Click to upload
                    </div>
                    <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)', letterSpacing: '0.04em' }}>
                      JPG · PNG · HEIC · Max 20 MB
                    </div>
                  </div>
                )}
                {preview && (
                  <div
                    style={{
                      background: 'var(--pv-cream)',
                      border: '2px solid var(--pv-ink)',
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        border: '2px solid var(--pv-ink)',
                        backgroundImage: `url(${preview.previewUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>Photo uploaded</div>
                      <div
                        style={{
                          fontFamily: 'var(--pv-f-mono)',
                          fontSize: 10,
                          color: 'var(--pv-green)',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Ready to order
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPreview(null); fileRef.current?.click(); }}
                      style={{
                        background: 'var(--pv-ink)',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 10px',
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Replace
                    </button>
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
                {err && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      fontSize: 13,
                      color: '#991b1b',
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={16} /> {err}
                  </div>
                )}
              </ComposeSection>
              )}

              {/* Variant picker — label adapts to the variants' kind.
                  If all variants share the same kind, use that kind's
                  picker phrase; otherwise fall back to the generic
                  "Choose an option". */}
              {variants.length >= 2 && (() => {
                const kinds = new Set(variants.map((v) => v.variant_kind || 'base'));
                const singleKind = kinds.size === 1 ? [...kinds][0] : null;
                const title =
                  singleKind === 'size'     ? 'Pick your size' :
                  singleKind === 'colour'   ? 'Pick your colour' :
                  singleKind === 'material' ? 'Pick your material' :
                  singleKind === 'base'     ? 'Pick your base' :
                                              'Choose an option';
                return (
                  <ComposeSection letter={sectionLetters.variants ?? 'B'} title={title}>
                    <GiftVariantLivePreview
                      variants={variants}
                      selectedId={selectedVariantId}
                      onSelect={setSelectedVariantId}
                      previewUrl={preview?.previewUrl ?? null}
                      onColourChange={setSelectedColour}
                    />
                  </ComposeSection>
                );
              })()}

              {/* Shape picker — cutout / rectangle / template. Only appears
                  on products that opted in via admin shape_options. Sits
                  between Variants and Size in the compose flow so the
                  customer picks "which base" first, then "what shape of
                  panel", then "what size of panel". */}
              {shapePickerActive && (
                <ComposeSection letter={sectionLetters.shape ?? 'C'} title="Pick your shape">
                  <GiftShapePicker
                    options={shapeOptions}
                    allTemplates={templates}
                    selectedKind={selectedShapeKind}
                    selectedTemplateId={selectedShapeTemplateId}
                    onSelectKind={setSelectedShapeKind}
                    onSelectTemplate={setSelectedShapeTemplateId}
                  />
                </ComposeSection>
              )}

              {/* Size picker — product-level. Applies to every variant. */}
              {sortedSizes.length > 0 && (
                <ComposeSection letter={sectionLetters.size ?? 'C'} title="Pick a size">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {sortedSizes.map((s) => {
                      const isSelected = s.slug === selectedSizeSlug;
                      return (
                        <button
                          key={s.slug}
                          type="button"
                          onClick={() => setSelectedSizeSlug(s.slug)}
                          style={{
                            padding: '12px 18px',
                            background: isSelected ? 'var(--pv-ink)' : '#fff',
                            color: isSelected ? '#fff' : 'var(--pv-ink)',
                            border: `2px solid ${isSelected ? 'var(--pv-ink)' : '#0a0a0a'}`,
                            borderRadius: 4,
                            fontFamily: 'var(--pv-f-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: 4,
                            minWidth: 140,
                          }}
                        >
                          <span>{s.name}</span>
                          <span style={{ fontSize: 10, opacity: 0.75, letterSpacing: '0.04em' }}>
                            {s.width_mm}×{s.height_mm}mm
                            {s.price_delta_cents > 0 && ` · +S$${(s.price_delta_cents / 100).toFixed(2)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </ComposeSection>
              )}

              {/* Step C: Style picker (AI prompts) */}
              {showPromptPicker && (
                <ComposeSection letter={sectionLetters.style ?? 'C'} title="Pick art style">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {prompts.map((p) => {
                      const active = selectedPromptId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPromptId(p.id)}
                          style={{
                            background: active ? 'var(--pv-cream)' : '#fff',
                            border: active ? '2px solid var(--pv-ink)' : '2px solid var(--pv-rule)',
                            padding: 10,
                            cursor: 'pointer',
                            textAlign: 'center',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              aspectRatio: 1,
                              border: '1.5px solid var(--pv-ink)',
                              background: 'var(--pv-cream)',
                              marginBottom: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'var(--pv-f-display)',
                              fontSize: 20,
                              overflow: 'hidden',
                            }}
                          >
                            {p.thumbnail_url ? (
                              <img src={p.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span>✦</span>
                            )}
                          </div>
                          <div style={{ fontFamily: 'var(--pv-f-body)', fontSize: 11, fontWeight: 800, lineHeight: 1.2 }}>
                            {p.name}
                          </div>
                          {p.description && (
                            <div
                              style={{
                                fontFamily: 'var(--pv-f-mono)',
                                fontSize: 9,
                                color: 'var(--pv-muted)',
                                letterSpacing: '0.04em',
                                marginTop: 2,
                              }}
                            >
                              {p.description}
                            </div>
                          )}
                          {active && (
                            <span
                              aria-hidden
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 18,
                                height: 18,
                                background: 'var(--pv-magenta)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 900,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ComposeSection>
              )}

              {/* Step D: Optional text */}
              {showTextStep && (
                <ComposeSection
                  letter={sectionLetters.text ?? 'C'}
                  title="Add text (optional)"
                >
                  <input
                    type="text"
                    value={engravedText}
                    onChange={(e) => setEngravedText(e.target.value.slice(0, 32))}
                    placeholder="e.g. Mum & me, 2026"
                    maxLength={32}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#fff',
                      border: '2px solid var(--pv-ink)',
                      fontFamily: 'var(--pv-f-body)',
                      fontSize: 15,
                      fontWeight: 500,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 10,
                      color: engravedText.length >= 28 ? 'var(--pv-magenta)' : 'var(--pv-muted)',
                      letterSpacing: '0.04em',
                      marginTop: 6,
                      textAlign: 'right',
                    }}
                  >
                    {engravedText.length} / 32
                  </div>

                  {engravedText.trim() && (
                    <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                      {allowedFonts.length > 0 && (
                        <label style={{ display: 'block' }}>
                          <span style={{ display: 'block', marginBottom: 4, fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>Font</span>
                          <select
                            value={engravedFont}
                            onChange={(e) => setEngravedFont(e.target.value)}
                            style={{
                              width: '100%', padding: '10px 12px', background: '#fff',
                              border: '2px solid var(--pv-ink)', fontFamily: engravedFont,
                              fontSize: 14, fontWeight: 500,
                            }}
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
                          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>{engravedSizePct}%</span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={20}
                          step={0.5}
                          value={engravedSizePct}
                          onChange={(e) => setEngravedSizePct(parseFloat(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--pv-magenta)' }}
                        />
                      </label>
                      <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)', letterSpacing: '0.04em' }}>
                        ✦ Drag the text on the preview to position it inside the safe zone.
                      </div>
                    </div>
                  )}
                </ComposeSection>
              )}
            </div>

            {/* Ready-by calendar — between compose steps and Quantity */}
            <GiftReadyByCard leadTimeDays={product.lead_time_days ?? 5} />

            {/* Quantity step */}
            <div
              style={{
                background: '#fff',
                border: '2px solid var(--pv-ink)',
                boxShadow: '6px 6px 0 var(--pv-ink)',
                padding: 24,
                marginBottom: 14,
              }}
            >
              <StepHead num={1} label="Quantity" current={`${qty} ${qty === 1 ? 'pc' : 'pcs'}`} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  border: '2px solid var(--pv-ink)',
                  maxWidth: 200,
                }}
              >
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    background: '#fff',
                    border: 'none',
                    width: 48,
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 20,
                    cursor: 'pointer',
                  }}
                >
                  −
                </button>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: 14,
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 22,
                    letterSpacing: '-0.02em',
                    background: 'var(--pv-cream)',
                    borderLeft: '2px solid var(--pv-ink)',
                    borderRight: '2px solid var(--pv-ink)',
                  }}
                >
                  {qty}
                </div>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  style={{
                    background: '#fff',
                    border: 'none',
                    width: 48,
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 20,
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Price box */}
            <div
              style={{
                background: 'var(--pv-ink)',
                color: '#fff',
                border: '2px solid var(--pv-ink)',
                boxShadow: '6px 6px 0 var(--pv-magenta)',
                padding: '24px 28px',
                marginTop: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginBottom: 14,
                  paddingBottom: 14,
                  borderBottom: '1px dashed rgba(255,255,255,0.2)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.5)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    Your total · incl. 9% GST
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 48,
                      lineHeight: 0.9,
                      letterSpacing: '-0.04em',
                      color: 'var(--pv-yellow)',
                    }}
                  >
                    {formatSGD((
                      (selectedVariant?.base_price_cents || product.base_price_cents)
                      + (selectedSize?.price_delta_cents ?? 0)
                      + (shapePickerActive ? shapeOptionsPriceDelta(shapeOptions, selectedShapeKind) : 0)
                    ) * qty)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <GiftRetentionNotice days={product.source_retention_days ?? 30} />
              </div>

              {(() => {
                // Surface-driven variants don't need a server preview;
                // add-to-cart enables once every surface is filled.
                const canAdd = hasSurfaces ? surfacesReady : Boolean(preview);
                const cta = hasSurfaces
                  ? surfacesReady
                    ? 'Add to Cart →'
                    : `Fill every side (${filledSurfaceCount}/${requiredSurfaceCount}) →`
                  : preview
                    ? 'Add to Cart →'
                    : 'Upload photo to continue →';
                return (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!canAdd || uploading}
                    style={{
                      background: addedFlash ? 'var(--pv-green)' : !canAdd ? 'rgba(255,255,255,0.15)' : 'var(--pv-orange)',
                      color: !canAdd ? 'rgba(255,255,255,0.4)' : '#fff',
                      width: '100%',
                      padding: '16px 24px',
                      fontWeight: 800,
                      border: '2px solid #fff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontSize: 14,
                      cursor: !canAdd ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--pv-f-body)',
                    }}
                  >
                    {addedFlash ? (
                      <><CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />Added to Cart</>
                    ) : (
                      cta
                    )}
                  </button>
                );
              })()}

              <div
                style={{
                  marginTop: 14,
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: '0.04em',
                  textAlign: 'center',
                  padding: 8,
                  border: '1px dashed rgba(255,255,255,0.2)',
                }}
              >
                Ready in {product.lead_time_days ?? 5} working day
                {(product.lead_time_days ?? 5) === 1 ? '' : 's'} · islandwide delivery or collection
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- OCCASION MATCHER ---------- */}
      <section
        style={{
          padding: '72px 24px',
          background: 'var(--pv-cream-warm, #FFF4E5)',
          borderBottom: '2px solid var(--pv-ink)',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <BandKicker color="var(--pv-magenta)">Who's it for?</BandKicker>
          <BandHeading
            text="Pick the"
            highlight="occasion"
            rest=", we'll help you nail it."
          />
          <p
            style={{
              fontSize: 16,
              color: 'var(--pv-muted)',
              maxWidth: 640,
              marginBottom: 40,
              fontWeight: 500,
              lineHeight: 1.55,
            }}
          >
            Same gift, different stories. Here's what customers actually order for each kind of occasion.
          </p>
          <div
            className="gift-occasion-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
            }}
          >
            {occasions.map((o, i) => (
              <div
                key={i}
                className={`gift-occ-card gift-occ-card-${i}`}
                style={{
                  background: '#fff',
                  border: '2px solid var(--pv-ink)',
                  boxShadow: '5px 5px 0 var(--pv-ink)',
                  padding: 24,
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 28,
                    width: 52,
                    height: 52,
                    border: '2px solid var(--pv-ink)',
                    background: OCCASION_COLORS[i % OCCASION_COLORS.length].bg,
                    color: OCCASION_COLORS[i % OCCASION_COLORS.length].fg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  {o.icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 20,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    marginBottom: 8,
                    margin: '0 0 8px',
                  }}
                >
                  {o.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: 'var(--pv-ink-soft)',
                    fontWeight: 500,
                    marginBottom: 14,
                    margin: '0 0 14px',
                  }}
                  dangerouslySetInnerHTML={{ __html: o.tip }}
                />
                {o.suggested && (
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 10,
                      paddingTop: 12,
                      borderTop: '1px dashed var(--pv-rule)',
                      color: 'var(--pv-magenta)',
                      letterSpacing: '0.04em',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Suggested: {o.suggested}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section
        style={{
          padding: '72px 24px',
          background: 'var(--pv-ink)',
          color: '#fff',
          borderBottom: '2px solid var(--pv-ink)',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <BandKicker color="var(--pv-yellow)">How it works</BandKicker>
          <BandHeading
            text="From your"
            highlight="photo"
            rest=" to a finished piece."
            inverted
          />
          <p
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.7)',
              maxWidth: 640,
              marginBottom: 40,
              fontWeight: 500,
              lineHeight: 1.55,
            }}
          >
            Every step handled in Singapore. Upload, preview, approve, ship. No surprises.
          </p>
          <div
            className="gift-process-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 20,
              marginTop: 32,
            }}
          >
            {processSteps.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '24px 20px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '2px solid rgba(255,255,255,0.15)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 40,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    marginBottom: 16,
                    color: i % 2 === 0 ? 'var(--pv-yellow)' : 'var(--pv-magenta)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h4
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 18,
                    letterSpacing: '-0.02em',
                    marginBottom: 6,
                    margin: '0 0 6px',
                    color: '#fff',
                  }}
                >
                  {s.title}
                </h4>
                <div
                  style={{
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    color: 'var(--pv-yellow)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  {s.time}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: 'rgba(255,255,255,0.75)',
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- GALLERY (if any) ---------- */}
      {product.gallery_images && product.gallery_images.length > 0 && (
        <section
          style={{
            padding: '72px 24px',
            background: 'var(--pv-cream)',
            borderBottom: '2px solid var(--pv-ink)',
          }}
        >
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <BandKicker color="var(--pv-magenta)">Real ones, real reactions</BandKicker>
            <BandHeading
              text="What"
              highlight="customers"
              rest=" have made."
            />
            <p
              style={{
                fontSize: 16,
                color: 'var(--pv-muted)',
                maxWidth: 640,
                marginBottom: 40,
                fontWeight: 500,
                lineHeight: 1.55,
              }}
            >
              Shared with permission, photographed as they actually live in people's homes.
            </p>
            <div
              className="gift-gallery-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 20,
              }}
            >
              {product.gallery_images.slice(0, 6).map((img, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: 1,
                    border: '2px solid var(--pv-ink)',
                    boxShadow: '5px 5px 0 var(--pv-ink)',
                    overflow: 'hidden',
                    background: 'var(--pv-cream)',
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- SEO MAGAZINE ---------- */}
      <SeoMagazine data={seoMagazineData} seoTitle={product.seo_title} productName={product.name} />

      {/* ---------- FAQ ---------- */}
      <section
        style={{
          padding: '72px 24px',
          background: 'var(--pv-cream)',
          borderTop: '2px solid var(--pv-ink)',
          borderBottom: '2px solid var(--pv-ink)',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <BandKicker color="var(--pv-magenta)">Before you order</BandKicker>
          <BandHeading text="Good" highlight="questions." />
          <div style={{ display: 'grid', gap: 12, marginTop: 32 }}>
            {faqs.map((f, i) => (
              <details
                key={i}
                style={{
                  background: '#fff',
                  border: '2px solid var(--pv-ink)',
                  boxShadow: '4px 4px 0 var(--pv-ink)',
                }}
              >
                <summary
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 18,
                    letterSpacing: '-0.01em',
                    padding: '18px 22px',
                    cursor: 'pointer',
                    listStyle: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <span>{f.q}</span>
                  <span
                    aria-hidden
                    style={{
                      width: 32,
                      height: 32,
                      background: 'var(--pv-magenta)',
                      color: '#fff',
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                </summary>
                <div
                  style={{
                    padding: '0 22px 22px',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'var(--pv-ink-soft)',
                    fontWeight: 500,
                  }}
                >
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- MORE GIFTS ---------- */}
      {relatedGifts.length > 0 && (
        <section
          style={{
            padding: '72px 24px',
            background: 'var(--pv-cream-warm, #FFF4E5)',
            borderBottom: '2px solid var(--pv-ink)',
          }}
        >
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <BandKicker color="var(--pv-magenta)">Also personalised</BandKicker>
            <BandHeading text="More ways to" highlight="make it theirs." />
            <div
              className="gift-more-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 20,
                marginTop: 32,
              }}
            >
              {relatedGifts.slice(0, 4).map((g) => (
                <Link
                  key={g.slug}
                  href={`/gift/${g.slug}`}
                  style={{
                    background: '#fff',
                    border: '2px solid var(--pv-ink)',
                    boxShadow: '6px 6px 0 var(--pv-ink)',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: 'var(--pv-ink)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: 1,
                      borderBottom: '2px solid var(--pv-ink)',
                      background: 'var(--pv-cream)',
                      overflow: 'hidden',
                    }}
                  >
                    {g.thumbnail_url ? (
                      <img src={g.thumbnail_url} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎁</div>
                    )}
                  </div>
                  <div style={{ padding: '16px 18px' }}>
                    <h4
                      style={{
                        fontFamily: 'var(--pv-f-display)',
                        fontSize: 18,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        marginBottom: 4,
                        margin: '0 0 4px',
                      }}
                    >
                      {g.name}
                    </h4>
                    <div
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 11,
                        color: 'var(--pv-muted)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      From{' '}
                      <span style={{ fontFamily: 'var(--pv-f-display)', color: 'var(--pv-magenta)', fontSize: 16, marginLeft: 6 }}>
                        {formatSGD(g.base_price_cents)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- SEO BODY (admin-authored crawler footer) ---------- */}
      {(product.seo_body ?? '').trim() && (
        <section style={{ background: '#fff', padding: '40px 24px 64px' }}>
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 12,
              color: 'var(--pv-muted)',
              lineHeight: 1.75,
            }}
          >
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{product.seo_body}</p>
          </div>
        </section>
      )}

      {cropPending && (
        <GiftCropTool
          product={product}
          fileSrc={cropPending.src}
          file={cropPending.file}
          onCancel={() => { URL.revokeObjectURL(cropPending.src); setCropPending(null); }}
          onConfirm={(file, crop) => {
            const pending = cropPending;
            setCropPending(null);
            if (pending) URL.revokeObjectURL(pending.src);
            doUpload(file, crop);
          }}
        />
      )}

      <style jsx>{`
        .gift-occ-card-0 { transform: rotate(-0.5deg); }
        .gift-occ-card-1 { transform: rotate(0.4deg); margin-top: 12px; }
        .gift-occ-card-2 { transform: rotate(-0.3deg); }
        .gift-occ-card-3 { transform: rotate(0.6deg); }
        .gift-occ-card-4 { transform: rotate(-0.4deg); margin-top: 12px; }
        .gift-occ-card-5 { transform: rotate(0.5deg); }
        .gift-occ-card:hover {
          transform: rotate(0deg) translate(-3px, -3px);
          box-shadow: 8px 8px 0 var(--pv-ink);
        }
        @media (max-width: 900px) {
          .gift-hero-title-row { grid-template-columns: 1fr !important; align-items: start !important; }
          .gift-config-inner { grid-template-columns: 1fr !important; }
          .gift-preview-col { position: static !important; }
          .gift-occasion-grid { grid-template-columns: 1fr !important; }
          .gift-occ-card { transform: none !important; margin-top: 0 !important; }
          .gift-process-grid { grid-template-columns: 1fr 1fr !important; }
          .gift-gallery-grid { grid-template-columns: 1fr 1fr !important; }
          .gift-more-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </article>
  );
}

/* ---------- Helper subcomponents ---------- */

function ComposeSection({ letter, title, children }: { letter: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 20, borderBottom: '1px solid var(--pv-rule)' }}>
      <div
        style={{
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 700,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            background: 'var(--pv-ink)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--pv-f-display)',
            fontSize: 11,
          }}
        >
          {letter}
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

function StepHead({ num, label, current }: { num: number; label: string; current: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '1px solid var(--pv-rule)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 28,
            height: 28,
            background: 'var(--pv-ink)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--pv-f-display)',
            fontSize: 12,
          }}
        >
          {num}
        </span>
        <span style={{ fontFamily: 'var(--pv-f-display)', fontSize: 18, letterSpacing: '-0.02em' }}>{label}</span>
      </div>
      {current && (
        <span
          style={{
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 11,
            color: 'var(--pv-magenta)',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {current}
        </span>
      )}
    </div>
  );
}

function BandKicker({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        fontFamily: 'var(--pv-f-mono)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color,
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span aria-hidden style={{ width: 24, height: 2, background: color, display: 'inline-block' }} />
      {children}
    </div>
  );
}

function BandHeading({
  text,
  highlight,
  rest,
  inverted,
}: {
  text: string;
  highlight: string;
  rest?: string;
  inverted?: boolean;
}) {
  return (
    <h2
      style={{
        fontFamily: 'var(--pv-f-display)',
        fontSize: 'clamp(40px, 5vw, 64px)',
        lineHeight: 0.92,
        letterSpacing: '-0.03em',
        marginBottom: 16,
        margin: '0 0 16px',
        color: inverted ? '#fff' : 'var(--pv-ink)',
      }}
    >
      {text}{' '}
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 2,
            left: '-2%',
            width: '104%',
            height: 14,
            background: inverted ? 'var(--pv-magenta)' : 'var(--pv-yellow)',
            zIndex: -1,
            transform: 'skew(-6deg)',
          }}
        />
        {highlight}
      </span>
      {rest}
    </h2>
  );
}

/* ---------- Default content fallbacks ---------- */

const OCCASION_COLORS = [
  { bg: 'var(--pv-magenta)', fg: '#fff' },
  { bg: 'var(--pv-yellow)', fg: 'var(--pv-ink)' },
  { bg: 'var(--pv-cyan, #00AEEF)', fg: '#fff' },
  { bg: 'var(--pv-green, #06D6A0)', fg: 'var(--pv-ink)' },
  { bg: 'var(--pv-purple, #7B2CBF)', fg: '#fff' },
  { bg: 'var(--pv-ink)', fg: 'var(--pv-yellow)' },
];

const DEFAULT_OCCASION_MATCHER: Array<{ icon: string; title: string; tip: string; suggested?: string }> = [
  {
    icon: '♡',
    title: 'Anniversary',
    tip: 'Your <b>earliest photo together</b> works best — the one that captures how it felt before routine took over.',
    suggested: 'Keep it simple & timeless',
  },
  {
    icon: '♛',
    title: 'Parents / Grandparents',
    tip: 'Family portrait with <b>strong contrast</b> — reads clearly from across a room, even for older eyes.',
    suggested: 'Bold shapes, warm tones',
  },
  {
    icon: '✦',
    title: 'Pet Memorial',
    tip: 'A quiet tribute to a pet that\'s gone. <b>Gentle tones</b>, not a photograph — a memory.',
    suggested: 'Soft style, matte finish',
  },
  {
    icon: '★',
    title: 'Wedding Gift',
    tip: 'The couple\'s <b>favourite photo together</b> with the wedding date engraved below. Large size looks best.',
    suggested: 'Classic style + date',
  },
  {
    icon: '▲',
    title: 'Corporate / Team',
    tip: 'Logo or building in <b>geometric style</b>. Add "Employee of the Year" below. Order 5+ for a team gift run.',
    suggested: 'Minimal + text line',
  },
  {
    icon: '❋',
    title: 'Just Because',
    tip: 'No reason needed. <b>Random gifts hit different.</b> Any style works — pick what matches the photo\'s vibe.',
    suggested: 'Any style',
  },
];

function buildProcessSteps(product: GiftProduct): Array<{ title: string; time: string; desc: string }> {
  const modeDesc: Record<string, string> = {
    'laser': 'Our laser engraves your design onto premium acrylic at our Paya Lebar shop. Every piece inspected before shipping.',
    'uv': 'UV-printed directly onto the material with colour-accurate inks. Vibrant and scratch-resistant.',
    'embroidery': 'Stitched on our digital embroidery machine with thread-matched colour conversion from your photo.',
    'photo-resize': 'Printed at exact specs with bleed and colour calibration. No AI — just your photo, perfectly sized.',
  };
  const upload = product.mode === 'photo-resize'
    ? 'Upload a photo. Crop to the exact product dimensions. Bleed added automatically.'
    : 'Upload any clear photo. Pick a style. Live preview updates as you choose.';
  const ai = product.mode === 'photo-resize'
    ? { title: 'Approve the Crop', time: '1 minute', desc: 'Confirm the crop fits the product. We add bleed and safe-zone margins for you.' }
    : { title: 'AI Stylises It', time: '15 seconds', desc: 'Our AI converts your photo into print-ready art tuned for the chosen production method. Review before paying.' };
  return [
    { title: 'Upload & Preview', time: '2 minutes', desc: upload },
    ai,
    { title: 'We Produce It', time: '3–4 days', desc: modeDesc[product.mode] ?? modeDesc['uv'] },
    { title: 'Ship or Pickup', time: 'Next day · SG', desc: 'Islandwide next-day delivery, free over S$150. Or collect at Paya Lebar Square day 5.' },
  ];
}

function buildGiftFaqs(product: GiftProduct): Array<{ q: string; a: string }> {
  const base: Array<{ q: string; a: string }> = [
    {
      q: "What if the AI preview doesn't look right?",
      a: "You'll see the preview before paying. If it's not what you want, try a different photo or style — we only produce what you approve. If you've tried a few and still aren't happy, email us before ordering and our design team will manually review your photo at no extra cost.",
    },
    {
      q: 'How long does it take to arrive?',
      a: 'Standard turnaround is 5 working days from order approval: 1 day review, 3 days production, 1 day ship prep. Islandwide delivery adds another 24 hours. Same-day collection at Paya Lebar Square is available for urgent orders — WhatsApp us first.',
    },
    {
      q: 'What photos work best?',
      a: 'Clear subject, simple background, good lighting. Faces against plain walls, pets against grass, couples against sky all work brilliantly. Messy backgrounds, very dark photos, or group shots with small faces usually come out muddy. Our AI cleans up so-so photos but cannot invent detail that isn\'t there.',
    },
    {
      q: 'Do you do bulk or corporate orders?',
      a: 'Yes — volume discount kicks in at 5 units. For 20+, we assign an account manager who can handle direct shipping to individual recipients with unique engraving on each piece. Contact us for a corporate quote.',
    },
    {
      q: 'Can I change my mind after ordering?',
      a: 'Before we begin production (typically within 24 hours of approval), yes — full refund. Once production has started, we can\'t reverse it because every piece is custom. We\'ll always check the preview with you before starting.',
    },
  ];
  if (product.mode === 'laser') {
    base.splice(1, 0, {
      q: 'Is laser engraving permanent?',
      a: "Yes — the engraving is physically etched into the acrylic surface, not printed. It won't fade, scratch off, or wash away. The laser creates micro-frosted marks that catch light — visible by day, glowing at night when lit from below.",
    });
  }
  if (product.mode === 'photo-resize') {
    base.splice(1, 0, {
      q: 'How does photo-resize differ from AI products?',
      a: 'No AI involved. You upload your photo, crop it to fit the exact product dimensions, and we print it as-is with bleed and safe-zone margins handled automatically. Good for when you want your photo reproduced faithfully, not stylised.',
    });
  }
  return base;
}

function buildGiftMagazine(product: GiftProduct): SeoMagazineData {
  const modeGuides: Record<string, {
    title: string;
    lede: string;
    articles: Array<{ num: string; title: string; body: string[]; side: any }>;
  }> = {
    'laser': {
      title: 'The honest guide to',
      lede: 'Custom laser-engraved gifts have become one of Singapore\'s most-ordered personalised items. Here\'s what actually separates a good engraving from a cheap one — material, contrast, LED quality, and turnaround.',
      articles: [
        {
          num: '01',
          title: 'Why acrylic beats glass and wood.',
          body: [
            "Glass engravings look premium but break easily, weigh too much for bedside bases, and the laser marks go cloudy over time. **Wood engravings** absorb LED glow poorly — the light gets eaten by the grain, so the design barely shows at night.",
            "Premium **clear cast acrylic** is the sweet spot. Light, durable, and the laser creates frosted marks that catch LED light beautifully. By day, a clean etched display. By night, the engraving appears internally lit — because optically, it is.",
          ],
          side: {
            kind: 'list',
            label: 'Material comparison',
            rows: [
              { text: 'Clear Acrylic', time: '★★★★★' },
              { text: 'Frosted Glass', time: '★★★' },
              { text: 'Walnut Wood', time: '★★' },
              { text: 'Metal Plate', time: '★★' },
            ],
          },
        },
        {
          num: '02',
          title: 'What photos work best (and which don\'t).',
          body: [
            "Laser engraving converts photos to **high-contrast line art**. Clear subject-background separation wins — a face against a plain wall, a pet against grass, a couple against sky. Messy backgrounds, very dark photos, or group shots with small faces come out muddy.",
            "Our AI cleans up so-so photos, but can't invent detail that isn't there. Try different styles if the first doesn't feel right. If it still looks off, we'll email you before engraving rather than print something you won't love.",
          ],
          side: { kind: 'stat', label: 'Accept rate', num: '87', suffix: '%', caption: 'customers accept their first result' },
        },
        {
          num: '03',
          title: 'Warm white vs cool white LED.',
          body: [
            "**Warm white** (most popular) gives a candle-like amber glow — bedside-table vibes, flattering for skin tones. **Cool white** feels more modern and clinical, better for architectural subjects or logos. Colour-cycling LED sounds fun but reads as gimmicky — skip unless it's for a kid's room.",
            "All our LED bases run on USB-C or battery. No permanent wall installation, no electrician needed. Plug-and-play from the box.",
          ],
          side: {
            kind: 'pills',
            label: 'LED popularity',
            items: [
              { text: 'Warm 68%', pop: true },
              { text: 'Cool 24%' },
              { text: 'Cycling 8%' },
            ],
          },
        },
        {
          num: '04',
          title: 'Getting it in time.',
          body: [
            "Standard turnaround is **5 working days** from order to shipping. That breaks down into: 1 day for us to review the AI art, 3 days for engraving and assembly, 1 day for ship prep. Same-day courier across SG adds another 24 hours — plan for a week from click to doorstep.",
            "Need it faster for a birthday you forgot? **Order before 10am weekday**, pay the S$20 rush fee, collect at Paya Lebar in 48 hours. We've saved a lot of anniversaries this way — no judgement.",
          ],
          side: { kind: 'stat', label: 'Turnaround', num: '5', suffix: 'days', caption: 'Standard · Rush 48hr available' },
        },
      ],
    },
    'uv': {
      title: 'The honest guide to',
      lede: 'UV-printed gifts give you photograph-grade colour directly on hard surfaces. Here\'s what separates a good UV print from a faded one — ink, substrate prep, and the contrast trick most shops skip.',
      articles: [
        {
          num: '01',
          title: 'Why UV ink beats regular print.',
          body: [
            "Standard inkjet prints fade, scratch, and smudge — especially on anything that gets touched or washed. **UV-cured ink** is polymerised onto the surface by ultraviolet light in a single pass. The result is a rigid, colour-stable layer that survives years of handling, humidity, and light without fading.",
            "We UV-print directly onto acrylic, metal, PVC, wood — anything flat and stable. No laminate, no protective layer needed. The ink itself is the finish.",
          ],
          side: {
            kind: 'pills',
            label: 'Compatible surfaces',
            items: [
              { text: 'Acrylic', pop: true },
              { text: 'Aluminium' },
              { text: 'PVC' },
              { text: 'Wood' },
              { text: 'Glass' },
              { text: 'Leather' },
            ],
          },
        },
        {
          num: '02',
          title: 'The white-underlay trick.',
          body: [
            "Colours printed on a dark or transparent surface look washed out without a white underlay. We print a **white ink layer first**, then the CMYK image on top. That's how your photo keeps skin tones on a dark acrylic and looks vibrant on a transparent phone case.",
            "Most budget UV shops skip the white layer to save ink. You can tell — dark backgrounds come out muddy, whites turn grey. Ask for the white-underlay spec up front and you'll know who knows what they're doing.",
          ],
          side: { kind: 'stat', label: 'Colour accuracy', num: '95', suffix: '%', caption: 'Delta-E under 3 against target' },
        },
        {
          num: '03',
          title: 'Which photos reproduce well.',
          body: [
            "UV print reproduces **photographic detail** faithfully. Unlike laser (which simplifies) or embroidery (which posterises), UV prints what you send. That means crisp edges, saturated colour, fine detail all survive.",
            "Flip side: your source photo has to be good. Blurry phone photos stay blurry. Low-contrast photos stay muddy. Upload the highest-resolution version you have — we scale it up as needed.",
          ],
          side: {
            kind: 'list',
            label: 'Source resolution',
            rows: [
              { text: 'Small gift', time: '≥ 1200px' },
              { text: 'Medium', time: '≥ 2000px' },
              { text: 'Wall art', time: '≥ 3000px' },
            ],
          },
        },
        {
          num: '04',
          title: 'Turnaround & SG delivery.',
          body: [
            "UV-printed gifts go from approved preview to shipped piece in **5 working days**. Same-day pickup at Paya Lebar Square is available for orders before 10am with the rush surcharge.",
            "Islandwide next-day delivery is free on orders over S$150. Otherwise flat rate S$8 for SG-wide door-to-door. Corporate bulk orders (20+) ship direct to each recipient if you need — ask us for the per-piece flow.",
          ],
          side: { kind: 'stat', label: 'Standard', num: '5', suffix: 'days', caption: 'Rush: 48hr available' },
        },
      ],
    },
    'embroidery': {
      title: 'The honest guide to',
      lede: 'Photo-to-embroidery is the fussiest personalisation method we offer — and the most memorable when it works. Here\'s what to know about thread count, backing, colour limits, and why it pays to preview before stitching.',
      articles: [
        {
          num: '01',
          title: 'Embroidery has a colour budget.',
          body: [
            "Every colour change in an embroidery design means a thread-swap on the machine. More colours = more time, more thread, more money. Our AI **posterises your photo to 4-6 key colours** before stitching — the result reads like a graphic illustration, not a photo.",
            "This is a feature, not a flaw. Photo-realistic embroidery exists but costs 4× more and still looks muddy up close. A well-posterised 5-colour embroidery looks intentional and premium — better than a photograph trying and failing to be stitched.",
          ],
          side: { kind: 'stat', label: 'Typical palette', num: '4–6', caption: 'Colours per embroidered piece' },
        },
        {
          num: '02',
          title: 'Stitch count and what you\'re paying for.',
          body: [
            "Embroidery pricing tracks **stitch count**, not image size. A 4×4 inch design might be 5,000 stitches (cheap) or 25,000 stitches (detail-heavy, expensive). More stitches means denser coverage, finer line detail, better definition on small type.",
            "We auto-optimise the stitch density for your fabric — too dense on a light polo and the collar puckers; too sparse on a thick apron and the design reads weak. Your preview shows the final stitch path before production.",
          ],
          side: {
            kind: 'pills',
            label: 'Stitch density',
            items: [
              { text: 'Light (polo)' },
              { text: 'Medium (tote)', pop: true },
              { text: 'Heavy (apron)' },
              { text: 'Extra (cap)' },
            ],
          },
        },
        {
          num: '03',
          title: 'Backing matters for wash durability.',
          body: [
            "Behind every good embroidery is a **stabiliser backing** you never see. Without it, fabric puckers after the first wash. We use **tear-away backing** for polos and tees (removes cleanly, no stiffness), **cut-away backing** for caps and aprons (stays in, protects against daily abuse).",
            "If a shop tells you they use \"standard backing\" on everything, they're using the cheap option and cutting corners. Ask what backing they're using for *your* item specifically — good answer varies by fabric.",
          ],
          side: {
            kind: 'list',
            label: 'Backing by item',
            rows: [
              { text: 'Polo / tee', time: 'Tear-away' },
              { text: 'Cap / apron', time: 'Cut-away' },
              { text: 'Tote / bag', time: 'Cut-away' },
              { text: 'Thin fabric', time: 'Water-soluble' },
            ],
          },
        },
        {
          num: '04',
          title: 'Why embroidery takes longer.',
          body: [
            "Digitising (converting your design to stitch instructions) alone takes 4-24 hours depending on complexity. Running the machine adds another 15-45 minutes per piece. Multiply by your quantity and schedule a **7-working-day** turnaround, not 5.",
            "For corporate uniforms or event kits, we hold your digitised file — so reorders take half the time. Your second batch runs faster and cheaper than the first because the stitch path is already programmed.",
          ],
          side: { kind: 'stat', label: 'Turnaround', num: '7', suffix: 'days', caption: 'Reorders: 4 days' },
        },
      ],
    },
    'photo-resize': {
      title: 'The honest guide to',
      lede: 'Photo-resize products skip the AI entirely — just your photo, cropped to exact dimensions, with bleed added automatically. Here\'s what to know about resolution, crop decisions, and when this method beats AI-styled alternatives.',
      articles: [
        {
          num: '01',
          title: 'When you want the photo, not an interpretation.',
          body: [
            "Our AI-styled products (laser, UV, embroidery) reinterpret your photo into a new medium. Beautiful for some contexts, wrong for others. **Photo-resize** keeps your photo exactly as it is — same colours, same detail, same composition — just cropped and printed at the product's exact dimensions.",
            "Best when your photo *is* the gift: wedding photos, family portraits, travel shots. Worst when your source photo has flaws — bad lighting, low resolution, busy background — because there's no AI cleanup to fall back on.",
          ],
          side: { kind: 'stat', label: 'No AI', num: '1:1', caption: 'Your photo, to scale' },
        },
        {
          num: '02',
          title: 'Resolution rules you can\'t break.',
          body: [
            "For print that doesn't look pixelated up close, your source photo needs to be **at least 300 DPI at the print dimensions**. A 10×15cm gift needs a source image of at least 1200×1800 pixels. A wall print needs 3000+ px on the long side.",
            "Modern phones deliver this easily. Screenshots, WhatsApp-compressed photos, and social-media downloads usually don't. Send us the original file — airdropped, emailed, or from your camera roll — not a downloaded version.",
          ],
          side: {
            kind: 'list',
            label: 'Minimum source size',
            rows: [
              { text: 'Small 10×15cm', time: '1200px' },
              { text: 'Medium 15×20cm', time: '2000px' },
              { text: 'Large 20×28cm', time: '2800px' },
              { text: 'Wall art', time: '3500px+' },
            ],
          },
        },
        {
          num: '03',
          title: 'Crop is where gifts succeed or fail.',
          body: [
            "The most common photo-resize mistake: crop too tight, lose headroom, heads feel squashed. Crop too loose, subject gets lost in background. Our crop tool shows you the **safe zone** (the printed area) and the **bleed margin** (the buffer that gets trimmed) — keep important detail inside the safe zone.",
            "Rule of thumb: for portraits, leave roughly 10% headroom above the top of the head. For landscapes, keep the horizon on the upper or lower third, never dead-centre. For couple/family, centre the group horizontally but biased slightly below the vertical middle.",
          ],
          side: { kind: 'stat', label: 'Safe zone', num: '3mm', caption: 'Buffer from edge on every side' },
        },
        {
          num: '04',
          title: 'Bleed is why your gift doesn\'t have a white border.',
          body: [
            "Printed gifts get trimmed to final size after printing. If the image stops exactly at the edge, tiny misalignments during trimming leave a white stripe. **Bleed** is an extra 2-3mm of image that extends past the final edge — trimmed off, invisible, but it\'s the reason your gift arrives edge-to-edge.",
            "We add bleed automatically. Just make sure the important detail (faces, text, borders you want visible) sits inside the safe zone. If your photo already has a white border as part of the design, mention it — we'll keep it deliberately.",
          ],
          side: { kind: 'stat', label: 'Auto bleed', num: '2mm', caption: 'Added to every side' },
        },
      ],
    },
  };
  const g = modeGuides[product.mode] ?? modeGuides['uv'];
  return {
    issue_label: `Issue №02 · ${product.name}`,
    title: g.title,
    title_em: product.name.toLowerCase().includes('led') ? 'LED photo gifts.' : `${product.name.toLowerCase()}.`,
    lede: g.lede,
    articles: g.articles,
  };
}
