// Print-ready packet PDF for fulfilment. Admin/staff only.

import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PDFName } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import { getObject } from '@/lib/gifts/storage';
import { getOrderById } from '@/lib/data/admin';
import { formatSGD } from '@/lib/utils';
import { giftItemDisplayName } from '@/lib/gifts/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 36;

// pdf-lib's StandardFonts.Helvetica is WinAnsi-encoded; an emoji or
// CJK character in customer-supplied text crashes drawText() and the
// route 500s. Replace anything outside printable ASCII with `?` so
// staff can still print the packet — fulfilment can read the original
// text on the order detail page if they need fidelity.
function ascii(text: string | null | undefined): string {
  if (!text) return '';
  return String(text).replace(/[^\x20-\x7E]/g, '?');
}

// Cap embedded artwork at 50 MB so a hostile PDF can't hang the route
// or balloon memory. Production files are usually well under this.
const MAX_ARTWORK_BYTES = 50 * 1024 * 1024;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = createClient();
  // Auth and order lookup are independent — fire in parallel.
  const [userRes, order] = await Promise.all([
    sb.auth.getUser(),
    getOrderById(params.id),
  ]);
  const user = userRes.data.user;
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!prof || !['admin', 'staff'].includes(prof.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!order) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const doc = await PDFDocument.create();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - MARGIN;

  const drawText = (text: string, opts: { x?: number; size?: number; bold?: boolean; color?: [number, number, number] } = {}) => {
    const x = opts.x ?? MARGIN;
    const size = opts.size ?? 10;
    const font = opts.bold ? helvBold : helv;
    const [r, g, b] = opts.color ?? [0, 0, 0];
    page.drawText(ascii(text), { x, y, size, font, color: rgb(r, g, b) });
    y -= size * 1.4;
  };

  drawText(`Order ${order.order_number}`, { size: 22, bold: true });
  drawText(new Date(order.created_at).toLocaleString('en-SG'), { size: 10, color: [0.4, 0.4, 0.4] });
  y -= 8;
  drawText(`Status: ${order.status}`, { size: 10, color: [0.3, 0.3, 0.3] });
  y -= 12;

  drawText('CUSTOMER', { bold: true, size: 9, color: [0.5, 0.5, 0.5] });
  drawText(order.customer_name ?? '—', { bold: true, size: 12 });
  drawText(order.email ?? '—', { size: 10 });
  if (order.phone) drawText(order.phone, { size: 10 });
  if (order.company) drawText(`${order.company}${order.position ? ` · ${order.position}` : ''}`, { size: 10, color: [0.4, 0.4, 0.4] });
  y -= 8;

  drawText('DELIVERY', { bold: true, size: 9, color: [0.5, 0.5, 0.5] });
  drawText(`${(order.delivery_method ?? '').toString().toUpperCase()}`, { bold: true, size: 11 });
  if (order.delivery_address) {
    for (const line of String(order.delivery_address).split('\n')) {
      drawText(line, { size: 10 });
    }
  }
  y -= 12;

  // Items
  drawText('ITEMS', { bold: true, size: 9, color: [0.5, 0.5, 0.5] });
  const allLines: Array<{ name: string; meta: string; qty: number; line_total_cents: number }> = [];
  for (const it of order.order_items ?? []) {
    const cfg = Object.entries(it.config ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
    allLines.push({
      name: it.product_name ?? '—',
      meta: cfg,
      qty: it.qty ?? 1,
      line_total_cents: it.line_total_cents ?? 0,
    });
  }
  for (const it of order.gift_order_items ?? []) {
    allLines.push({
      name: `[gift] ${giftItemDisplayName(it)}`,
      meta: `${it.mode ?? ''}${it.production_status ? ` · ${it.production_status}` : ''}`,
      qty: it.qty ?? 1,
      line_total_cents: it.line_total_cents ?? 0,
    });
  }
  for (const ln of allLines) {
    drawText(`${ln.qty} × ${ln.name}`, { bold: true, size: 11 });
    if (ln.meta) drawText(ln.meta, { size: 9, x: MARGIN + 12, color: [0.4, 0.4, 0.4] });
    drawText(formatSGD(ln.line_total_cents), { size: 10, x: A4.w - MARGIN - 80 });
    y -= 4;
  }
  y -= 12;

  // Totals
  drawText('TOTALS', { bold: true, size: 9, color: [0.5, 0.5, 0.5] });
  const tot = (label: string, cents: number, opts: { bold?: boolean; color?: [number, number, number] } = {}) => {
    const before = y;
    page.drawText(ascii(label), { x: MARGIN, y: before, size: 11, font: opts.bold ? helvBold : helv, color: rgb(...(opts.color ?? [0, 0, 0])) });
    page.drawText(formatSGD(cents), { x: A4.w - MARGIN - 80, y: before, size: 11, font: opts.bold ? helvBold : helv, color: rgb(...(opts.color ?? [0, 0, 0])) });
    y -= 14;
  };
  tot('Subtotal', order.subtotal_cents ?? 0);
  tot('Delivery', order.delivery_cents ?? 0);
  if (order.gift_wrap) tot('Gift wrap', order.gift_wrap_cents ?? 0);
  if ((order.points_discount_cents ?? 0) > 0) tot(`Points (${order.points_redeemed} pts)`, -(order.points_discount_cents), { color: [0, 0.5, 0] });
  if ((order.coupon_discount_cents ?? 0) > 0) tot(`Coupon${order.coupon_code ? ` (${order.coupon_code})` : ''}`, -(order.coupon_discount_cents), { color: [0, 0.5, 0] });
  tot('TOTAL', order.total_cents ?? 0, { bold: true, color: [0.85, 0.1, 0.5] });

  if (order.gift_wrap) {
    y -= 16;
    drawText('** GIFT WRAP **', { bold: true, size: 12, color: [0.85, 0.1, 0.5] });
    if (order.gift_message) {
      drawText('Handwritten message:', { size: 9, color: [0.4, 0.4, 0.4] });
      for (const line of String(order.gift_message).split('\n')) drawText(line, { size: 11, x: MARGIN + 8 });
    } else {
      drawText('No message — just wrap.', { size: 10, color: [0.4, 0.4, 0.4] });
    }
  }

  // Notes
  if (order.notes) {
    y -= 12;
    drawText('NOTES', { bold: true, size: 9, color: [0.5, 0.5, 0.5] });
    for (const line of String(order.notes).split('\n')) drawText(line, { size: 10 });
  }

  // Fetch artwork bytes in parallel; embedding stays sequential to
  // preserve page order.
  const items = (order.gift_order_items ?? []) as any[];
  const fetched = await Promise.all(items.map(async (item) => {
    const label = `${giftItemDisplayName(item)} · qty ${item.qty ?? 1}`;
    let pdfBytes: Uint8Array | null = null;
    let pngBytes: Uint8Array | null = null;
    if (item.production_pdf?.path) {
      try {
        const bytes = await getObject(item.production_pdf.bucket, item.production_pdf.path);
        if (bytes.byteLength <= MAX_ARTWORK_BYTES) pdfBytes = bytes;
        else console.warn('[packet] PDF skipped — too large', item.id, bytes.byteLength);
      } catch (e) { console.warn('[packet] PDF fetch failed', item.id, e); }
    }
    if (!pdfBytes && item.production?.path) {
      try {
        const bytes = await getObject(item.production.bucket, item.production.path);
        if (bytes.byteLength <= MAX_ARTWORK_BYTES) pngBytes = bytes;
        else console.warn('[packet] PNG skipped — too large', item.id, bytes.byteLength);
      } catch (e) { console.warn('[packet] PNG fetch failed', item.id, e); }
    }
    return { label, pdfBytes, pngBytes };
  }));

  for (const { label, pdfBytes, pngBytes } of fetched) {
    if (pdfBytes) {
      try {
        const src = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const copied = await doc.copyPages(src, src.getPageIndices());
        // Strip annotations (URI actions, JS, embedded files) from
        // any third-party PDF before adding to our packet.
        for (const p of copied) {
          p.node.delete(PDFName.of('Annots'));
          doc.addPage(p);
        }
        const first = copied[0];
        if (first) {
          first.drawText(ascii(label), {
            x: MARGIN, y: first.getHeight() - MARGIN / 2, size: 9, font: helv, color: rgb(0.4, 0.4, 0.4),
          });
        }
        continue;
      } catch (e) {
        console.warn('[packet] PDF embed failed, falling back to PNG', e);
      }
    }
    if (pngBytes) {
      const png = await doc.embedPng(pngBytes);
      const p = doc.addPage([A4.w, A4.h]);
      p.drawText(ascii(label), { x: MARGIN, y: A4.h - MARGIN, size: 12, font: helvBold });
      const maxW = A4.w - MARGIN * 2;
      const maxH = A4.h - MARGIN * 2 - 24;
      const ratio = png.width / png.height;
      let dw = maxW;
      let dh = dw / ratio;
      if (dh > maxH) { dh = maxH; dw = dh * ratio; }
      p.drawImage(png, { x: (A4.w - dw) / 2, y: MARGIN, width: dw, height: dh });
    } else if (!pdfBytes) {
      const p = doc.addPage([A4.w, A4.h]);
      p.drawText(ascii(`${label} - artwork unavailable`), { x: MARGIN, y: A4.h - MARGIN, size: 11, font: helv, color: rgb(0.7, 0.2, 0.2) });
    }
  }

  const bytes = await doc.save();
  return new NextResponse(Buffer.from(bytes) as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="order-${order.order_number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
