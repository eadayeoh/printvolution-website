export function GiftRetentionNotice({ days = 30 }: { days?: number }) {
  return (
    <div className="rounded border-2 border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
      <strong>We delete your files {days} days after ordering.</strong> Your uploaded photo and the 300 DPI print file are removed {days} days after checkout. We keep only a watermarked preview so you can still see your order in your account history. If you need a reprint, please place a new order before then.
    </div>
  );
}
