import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const mode = process.argv[2];
assert.match(mode ?? '', /^(closed|open)$/, 'Usage: node scripts/verify-seo-build.mjs <closed|open>');

const dist = resolve('dist');
const read = (path) => readFile(resolve(dist, path), 'utf8');
const [home, privacy, agreement, robots, sitemap, casePage] = await Promise.all([
  read('index.html'),
  read('privacy/index.html'),
  read('agreement/index.html'),
  read('robots.txt'),
  read('sitemap.xml'),
  read('cases/avtomatizaciya-rabochego-mesta-myasnika/index.html'),
]);

const metaRobots = (html) => html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '';
const canonical = (html) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '';
const urlCount = (xml) => (xml.match(/<url>/g) ?? []).length;

assert.equal(canonical(home), 'https://maria-galieva.ru/');
assert.equal(canonical(privacy), 'https://maria-galieva.ru/privacy/');
assert.equal(canonical(agreement), 'https://maria-galieva.ru/agreement/');
assert.equal(metaRobots(privacy), 'noindex, follow');
assert.equal(metaRobots(agreement), 'noindex, follow');
assert.equal(canonical(casePage), 'https://maria-galieva.ru/cases/avtomatizaciya-rabochego-mesta-myasnika/');
assert.match(home, /href="\/cases\/avtomatizaciya-rabochego-mesta-myasnika\/"/);
assert.match(casePage, /<title>Рабочее место мясника: автоматизация учёта/);
assert.match(casePage, /<meta property="og:type" content="article"/);
assert.match(casePage, /<meta name="twitter:image"/);
assert.match(casePage, /"@type":"Article"/);
assert.match(casePage, /"@type":"BreadcrumbList"/);
assert.equal((casePage.match(/<h1\b/g) ?? []).length, 1);
assert.match(casePage, /data-cookie-consent/);
assert.doesNotMatch(casePage, /<script[^>]+src="https:\/\/(?:mc\.yandex\.ru|www\.googletagmanager\.com)/i);
assert.match(casePage, /Поможет ли автоматизация выявлять воровство в магазинах/);

assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);

assert.match(home, /"@type":"ProfilePage"/);
assert.match(home, /"mainEntity":\{"@id":"https:\/\/maria-galieva\.ru\/#maria-galieva"/);
assert.match(home, /<meta property="og:image:width" content="1200"/);
assert.match(home, /<meta property="og:image:height" content="630"/);
assert.match(home, /<meta property="og:image:alt"/);
assert.match(home, /<meta name="twitter:image"/);

if (mode === 'open') {
  assert.equal(metaRobots(home), 'index, follow');
  assert.match(robots, /^User-agent: \*\nAllow: \/\nSitemap: https:\/\/maria-galieva\.ru\/sitemap\.xml\n$/);
  assert.equal(urlCount(sitemap), 2);
  assert.equal(metaRobots(casePage), 'index, follow');
  assert.match(sitemap, /<loc>https:\/\/maria-galieva\.ru\/cases\/avtomatizaciya-rabochego-mesta-myasnika\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/maria-galieva\.ru\/<\/loc>/);
} else {
  assert.equal(metaRobots(home), 'noindex, nofollow');
  assert.equal(metaRobots(casePage), 'noindex, nofollow');
  assert.match(robots, /^User-agent: \*\nDisallow: \/\n$/);
  assert.equal(urlCount(sitemap), 0);
}

console.log(`SEO build verification passed (${mode}).`);
