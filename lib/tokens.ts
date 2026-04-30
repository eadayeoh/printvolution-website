import 'server-only';
import { randomBytes } from 'crypto';

/** 192-bit opaque base64url token used for proof / survey / customer-
 *  edit links. The token itself IS the auth — anyone with the URL
 *  acts on the row, so callers MUST store it on a column with a
 *  partial unique index and never expose it in logs. */
export function mintToken(): string {
  return randomBytes(24).toString('base64url');
}
