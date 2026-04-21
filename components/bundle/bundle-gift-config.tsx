'use client';

import { useMemo, useState } from 'react';
import { BundleGiftUploadBlock, type UploadState } from './bundle-gift-upload-block';
import { GiftRetentionNotice } from '@/components/gift/gift-retention-notice';
import type { BundleGiftComponent } from '@/lib/data/bundles';

export function BundleGiftConfig({
  bundleName,
  giftComponents,
}: {
  bundleName: string;
  giftComponents: BundleGiftComponent[];
}) {
  const [states, setStates] = useState<UploadState[]>(
    giftComponents.map(() => ({ sourceAssetId: null, previewAssetId: null, previewUrl: null })),
  );

  const allReady = useMemo(
    () => states.length > 0 && states.every((s) => !!s.previewUrl),
    [states],
  );

  const retentionDays = Math.max(
    30,
    ...giftComponents.map((g) => g.source_retention_days ?? 30),
  );

  // Build a WhatsApp message the customer can send with their preview URLs
  const whatsappMessage = useMemo(() => {
    const lines = [
      `Hi! I'd like to order the "${bundleName}" bundle.`,
      '',
      'My personalised items:',
      ...states.map((s, i) => {
        const g = giftComponents[i];
        const url = s.previewUrl ?? 'pending upload';
        return `${i + 1}. ${g.gift_product_name}${g.variant_name ? ` (${g.variant_name})` : ''} × ${g.override_qty} — preview: ${url}`;
      }),
    ];
    return encodeURIComponent(lines.join('\n'));
  }, [bundleName, giftComponents, states]);

  return (
    <section className="mt-10 rounded-lg border-2 border-ink bg-neutral-50 p-6 lg:p-8">
      <div className="mb-5">
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-pink">● Upload your photos</div>
        <h3 className="text-2xl font-black">Your personalised items</h3>
        <p className="mt-1 max-w-2xl text-sm text-neutral-700">
          This bundle includes {giftComponents.length} item{giftComponents.length === 1 ? '' : 's'} we
          personalise with your photo. Upload a photo for each and see a live preview. The base, style,
          and quantity are already set by the bundle.
        </p>
      </div>

      <div className="space-y-4">
        {giftComponents.map((g, i) => (
          <BundleGiftUploadBlock
            key={`${g.gift_product_id}-${i}`}
            component={g}
            index={i}
            onChange={(s) => setStates((prev) => prev.map((p, idx) => idx === i ? s : p))}
          />
        ))}
      </div>

      <div className="mt-5">
        <GiftRetentionNotice days={retentionDays} />
      </div>

      {allReady ? (
        <div className="mt-5 rounded-lg border-2 border-green-500 bg-green-50 p-4">
          <div className="text-sm font-bold text-green-800">✓ All photos uploaded and previewed.</div>
          <p className="mt-1 text-xs text-green-700">
            Tap below to open WhatsApp with your bundle details + preview URLs already filled in. We&apos;ll confirm quantity + shipping and take payment over the chat.
          </p>
          <a
            href={`https://wa.me/6585533497?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-pink"
          >
            💬 Send bundle order to WhatsApp
          </a>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border-2 border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-600">
          Upload a photo for each item to enable the WhatsApp send.
        </div>
      )}
    </section>
  );
}
