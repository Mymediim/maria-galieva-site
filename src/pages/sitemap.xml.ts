import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const allowIndexing = import.meta.env.PUBLIC_SITE_INDEXING === 'true' && Boolean(siteUrl);

  if (!allowIndexing) {
    return new Response('Sitemap is disabled before production launch.\n', { status: 404 });
  }

  const paths = ['/', '/privacy/', '/agreement/'];
  const urls = paths.map((path) => `<url><loc>${siteUrl}${path}</loc></url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
