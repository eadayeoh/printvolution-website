/** Sharp options applied to any image bytes that came from an
 *  untrusted source (customer upload, third-party URL, WP import).
 *
 *  - limitInputPixels caps decoded pixel count to 41M — guards
 *    against decompression-bomb PNGs that allocate gigabytes.
 *  - failOn: 'warning' rejects malformed bytes early instead of
 *    handing back a corrupt buffer downstream consumers will misuse. */
export const UNTRUSTED_SHARP_OPTS = {
  limitInputPixels: 41_000_000,
  failOn: 'warning' as const,
};
