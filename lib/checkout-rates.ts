export const DELIVERY_FLAT_CENTS = 800;
export const GIFT_WRAP_FLAT_CENTS = 300;
/** Subtotal at which local delivery becomes free. Drives both the
 *  cart/checkout upsell ("S$X more for free delivery") and the
 *  server-side waiver in checkout/actions.ts. */
export const FREE_DELIVERY_THRESHOLD_CENTS = 8000;

/** Returns the delivery cents to charge given a subtotal + method.
 *  Single source of truth so client and server agree. */
export function deliveryCentsFor(method: 'pickup' | 'delivery', subtotalCents: number): number {
  if (method !== 'delivery') return 0;
  if (subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS) return 0;
  return DELIVERY_FLAT_CENTS;
}
