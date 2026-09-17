import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const allowIndexing = import.meta.env.PUBLIC_SITE_INDEXING === 'true' && Boolean(siteUrl);
  const lines = allowIndexing
    ? ['User-agent: *', 'Allow: /', `Sitemap: ${siteUrl}/sitemap.xml`]
    : ['User-agent: *', 'Disallow: /'];

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
