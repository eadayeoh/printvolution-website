'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/admin/image-upload';
import { updateSiteSettings } from '@/app/admin/settings/actions';
import type { ProductFeature, SiteSettings } from '@/lib/data/site-settings';

export function SiteSettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? '');
  const [logoWidth, setLogoWidth] = useState((initial.logo_width_px ?? '').toString());
  const [favicon, setFavicon] = useState(initial.favicon_url ?? '');
  const [brand, setBrand] = useState(initial.brand_text);
  const [features, setFeatures] = useState<ProductFeature[]>(initial.product_features);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  function updateFeature(idx: number, patch: Partial<ProductFeature>) {
    setFeatures((xs) => xs.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function save() {
    setErr(null);
    startTransition(async () => {
      const r = await updateSiteSettings({
        logo_url: logoUrl || null,
        logo_width_px: logoWidth ? parseInt(logoWidth, 10) : null,
        favicon_url: favicon || null,
        brand_text: brand.trim() || 'Printvolution',
        product_features: features.map((f) => ({
          icon_url: f.icon_url || null,
          emoji: f.emoji || null,
          title: f.title.trim(),
          desc: f.desc.trim(),
        })),
      });
      if (!r.ok) setErr(r.error);
      else {
        setFlash(true);
        setTimeout(() => setFlash(false), 1600);
        router.refresh();
      }
    });
  }

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">Site settings</h1>
        <p className="mt-1 text-sm text-neutral-500">Logo, favicon, brand text shown in the header and email signatures.</p>
      </div>

      <div className="max-w-3xl space-y-5">
        <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
          <div>
            <div className="mb-2 text-xs font-bold text-ink">Header logo</div>
            <p className="mb-3 text-[11px] text-neutral-500">
              Replaces the &quot;Printvolution&quot; text in the top-left of every page.
              Logo auto-scales to a max height of 38px in the header. Use a transparent PNG or SVG for best results.
            </p>
            <ImageUpload
              value={logoUrl}
              onChange={setLogoUrl}
              prefix="logo"
              size="lg"
              label="Header logo"
              skipCrop
            />
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Logo max width (px, optional)</span>
              <input
                type="number"
                value={logoWidth}
                onChange={(e) => setLogoWidth(e.target.value)}
                placeholder="220"
                className={`${inputCls} max-w-xs`}
              />
              <span className="mt-1 block text-[10px] text-neutral-500">Defaults to 220px if blank.</span>
            </label>
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Brand text fallback</span>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={`${inputCls} max-w-xs`}
                placeholder="Printvolution"
              />
              <span className="mt-1 block text-[10px] text-neutral-500">Shown if the logo image fails to load + as alt text.</span>
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-1 text-xs font-bold text-ink">Product-page feature row</div>
          <p className="mb-4 text-[11px] text-neutral-500">
            Four trust signals shown just below the hero on <em>every</em> product page.
            Upload a square icon (auto-cropped to 1:1) or leave blank to use an emoji.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((f, i) => (
              <div key={i} className="rounded border border-neutral-200 p-4 bg-neutral-50/50 min-w-0">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink text-[10px] text-white">{i + 1}</span>
                  Feature {i + 1}
                </div>
                <div className="space-y-3 min-w-0">
                  <ImageUpload
                    value={f.icon_url ?? ''}
                    onChange={(v) => updateFeature(i, { icon_url: v || null })}
                    prefix={`feat-${i + 1}`}
                    aspect={1}
                    size="sm"
                    label="Icon"
                  />
                  <label className="block">
                    <span className="mb-0.5 block text-[10px] font-bold uppercase text-neutral-500">
                      Emoji fallback {f.icon_url && <em className="font-normal normal-case text-neutral-400">(ignored while icon is set)</em>}
                    </span>
                    <input
                      value={f.emoji ?? ''}
                      onChange={(e) => updateFeature(i, { emoji: e.target.value })}
                      className={`${inputCls} w-20`}
                      placeholder="✓"
                      maxLength={4}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-0.5 block text-[10px] font-bold uppercase text-neutral-500">Title</span>
                    <input
                      value={f.title}
                      onChange={(e) => updateFeature(i, { title: e.target.value })}
                      className={inputCls}
                      maxLength={60}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-0.5 block text-[10px] font-bold uppercase text-neutral-500">Description</span>
                    <textarea
                      value={f.desc}
                      onChange={(e) => updateFeature(i, { desc: e.target.value })}
                      className={inputCls}
                      rows={2}
                      maxLength={200}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-2 text-xs font-bold text-ink">Favicon (optional)</div>
          <p className="mb-3 text-[11px] text-neutral-500">
            Browser tab icon. Square PNG or ICO, ideally 512×512.
          </p>
          <ImageUpload
            value={favicon}
            onChange={setFavicon}
            prefix="favicon"
            aspect={1}
            size="md"
            label="Favicon"
          />
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-lg border-2 border-ink bg-white p-4 shadow-brand">
          <div className="text-xs">
            {err && <span className="font-bold text-red-600">{err}</span>}
            {flash && <span className="font-bold text-green-600">✓ Saved</span>}
            {!err && !flash && <span className="text-neutral-500">Changes apply site-wide on save.</span>}
          </div>
          <button
            onClick={save}
            disabled={isPending}
            className="rounded-full bg-pink px-6 py-2 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
