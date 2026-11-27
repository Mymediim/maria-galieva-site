import type { APIRoute } from 'astro';
import { getContentLastmod } from '../lib/sitemap-lastmod.mjs';

export const GET: APIRoute = () => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const allowIndexing = import.meta.env.PUBLIC_SITE_INDEXING === 'true' && Boolean(siteUrl);
  const paths = allowIndexing ? ['/', '/cases/avtomatizaciya-rabochego-mesta-myasnika/', '/cases/locapp-pervaya-versiya-prilozheniya/', '/uslugi/codex-dlya-rukovoditeley/', '/cases/hmb-bank/', '/cases/banana-traders/', '/cases/tactus/', '/cases/ommt/', '/cases/artball/'] : [];
  const contentSources: Record<string, string[]> = {
    '/': ['src/pages/index.astro', 'prototype-desktop.html', 'src/components/CaseCallback.astro'],
    '/cases/avtomatizaciya-rabochego-mesta-myasnika/': ['src/pages/cases/avtomatizaciya-rabochego-mesta-myasnika.astro', 'src/components/CaseCallback.astro'],
    '/cases/locapp-pervaya-versiya-prilozheniya/': ['src/pages/cases/locapp-pervaya-versiya-prilozheniya.astro', 'src/components/CaseCallback.astro'],
    '/uslugi/codex-dlya-rukovoditeley/': ['src/pages/uslugi/codex-dlya-rukovoditeley.astro', 'products/codex-for-leaders/research/prototype/index.html'],
  };
  contentSources['/cases/hmb-bank/'] = ['src/pages/cases/hmb-bank.astro', 'src/components/CaseCallback.astro'];
  contentSources['/cases/banana-traders/'] = ['src/pages/cases/banana-traders.astro', 'src/components/CaseCallback.astro'];
  contentSources['/cases/tactus/'] = ['src/pages/cases/tactus.astro', 'src/components/CaseCallback.astro'];
  contentSources['/cases/ommt/'] = ['src/pages/cases/ommt.astro', 'src/components/CaseCallback.astro'];
  contentSources['/cases/artball/'] = ['src/pages/cases/artball.astro', 'src/components/CaseCallback.astro'];
  const urls = paths.map((path) => {
    const lastmod = getContentLastmod(contentSources[path]);
    return `<url><loc>${siteUrl}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
