import 'server-only';
import { lookup } from 'node:dns/promises';

/**
 * Block SSRF to private / link-local / loopback IPv4 ranges.
 * Call before any fetch() against a user-supplied URL.
 */
export async function assertPublicUrl(urlStr: string): Promise<URL> {
  let url: URL;
  try { url = new URL(urlStr); }
  catch { throw new Error('Invalid URL'); }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) URLs allowed');
  }
  if (url.username || url.password) {
    throw new Error('URLs with credentials rejected');
  }

  // Resolve hostname and check against blocked CIDRs
  let ip: string;
  try {
    const { address } = await lookup(url.hostname);
    ip = address;
  } catch {
    throw new Error('Cannot resolve host');
  }

  if (isPrivateIp(ip)) {
    throw new Error(`URL resolves to a private address (${ip})`);
  }

  return url;
}

/** IPv4 private / loopback / link-local / CGNAT test. */
function isPrivateIp(ip: string): boolean {
  // IPv6 loopback / link-local
  if (ip === '::1' || ip === '::') return true;
  if (/^fe80:/i.test(ip) || /^fc/i.test(ip) || /^fd/i.test(ip)) return true;

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 10) return true;                              // 10.0.0.0/8
  if (a === 127) return true;                             // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true;                // 169.254.0.0/16 AWS metadata
  if (a === 172 && b >= 16 && b <= 31) return true;       // 172.16.0.0/12
  if (a === 192 && b === 168) return true;                // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true;      // 100.64.0.0/10 CGNAT
  if (a === 0) return true;                               // 0.0.0.0/8
  return false;
}

/**
 * Safely resolve the client IP for rate-limiting. Uses Cloudflare
 * headers first (we trust these because they come from their edge),
 * then falls back to the rightmost x-forwarded-for hop (the one our
 * proxy added). Simple left-most x-forwarded-for is spoofable.
 */
export function getTrustedClientIp(headers: Headers): string {
  const cf = headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xri = headers.get('x-real-ip');
  if (xri) return xri.trim();
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    // Use rightmost (closest to our proxy), not leftmost (which a client can forge)
    const parts = xff.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return 'unknown';
}
