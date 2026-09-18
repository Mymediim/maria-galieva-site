import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const mode = process.argv[2];
assert.match(mode ?? '', /^(closed|open)$/, 'Usage: node scripts/verify-seo-build.mjs <closed|open>');

const dist = resolve('dist');
const read = (path) => readFile(resolve(dist, path), 'utf8');
const [home, privacy, agreement, robots, sitemap] = await Promise.all([
  read('index.html'),
  read('privacy/index.html'),
  read('agreement/index.html'),
  read('robots.txt'),
  read('sitemap.xml'),
]);

const metaRobots = (html) => html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '';
const canonical = (html) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '';
const urlCount = (xml) => (xml.match(/<url>/g) ?? []).length;

assert.equal(canonical(home), 'https://maria-galieva.ru/');
assert.equal(canonical(privacy), 'https://maria-galieva.ru/privacy/');
assert.equal(canonical(agreement), 'https://maria-galieva.ru/agreement/');
assert.equal(metaRobots(privacy), 'noindex, follow');
assert.equal(metaRobots(agreement), 'noindex, follow');

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
  assert.equal(urlCount(sitemap), 1);
  assert.match(sitemap, /<loc>https:\/\/maria-galieva\.ru\/<\/loc>/);
} else {
  assert.equal(metaRobots(home), 'noindex, nofollow');
  assert.match(robots, /^User-agent: \*\nDisallow: \/\n$/);
  assert.equal(urlCount(sitemap), 0);
}

console.log(`SEO build verification passed (${mode}).`);
