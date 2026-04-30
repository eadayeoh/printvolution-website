/** Production hostname for absolute URLs in emails + redirects.
 *
 *  On Vercel `NEXT_PUBLIC_VERCEL_URL` resolves to the deployment-
 *  specific URL (printvolution-abc123-team.vercel.app), which would
 *  point email links at preview deployments. Prefer the explicit
 *  NEXT_PUBLIC_SITE_URL, fall back to the production host. */
export function siteOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url && url.length > 0) return url.replace(/\/$/, '');
  return 'https://printvolution.sg';
}
