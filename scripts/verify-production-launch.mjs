import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';

const baseUrl = (process.env.PUBLIC_SITE_URL || 'https://maria-galieva.ru').replace(/\/$/, '');
const requestTimeoutMs = 15_000;

const fetchText = async (path) => {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  return { response, text: await response.text() };
};

const head = (url) => new Promise((resolve, reject) => {
  const parsed = new URL(url);
  const transport = parsed.protocol === 'https:' ? https : http;
  const request = transport.request({
    hostname: parsed.hostname,
    port: parsed.port || undefined,
    path: `${parsed.pathname}${parsed.search}`,
    method: 'HEAD',
    servername: parsed.hostname,
    timeout: requestTimeoutMs,
  }, (response) => {
    resolve({
      status: response.statusCode,
      location: response.headers.location || '',
      tlsAuthorized: parsed.protocol === 'https:' ? response.socket.authorized : null,
    });
    response.resume();
  });
  request.on('timeout', () => request.destroy(new Error(`Timed out: ${url}`)));
  request.on('error', reject);
  request.end();
});

const [home, privacy, agreement, robots, sitemap, missing] = await Promise.all([
  fetchText('/'),
  fetchText('/privacy/'),
  fetchText('/agreement/'),
  fetchText('/robots.txt'),
  fetchText('/sitemap.xml'),
  fetchText('/definitely-missing-production-check'),
]);

assert.equal(home.response.status, 200, 'home must return 200');
assert.equal(privacy.response.status, 200, 'privacy page must return 200');
assert.equal(agreement.response.status, 200, 'agreement page must return 200');
assert.equal(robots.response.status, 200, 'robots.txt must return 200');
assert.equal(sitemap.response.status, 200, 'sitemap.xml must return 200');
assert.equal(missing.response.status, 404, 'unknown URL must return 404');

assert.match(home.text, /<meta name="robots" content="index, follow">/, 'home must be indexable');
assert.match(home.text, /<link rel="canonical" href="https:\/\/maria-galieva\.ru\/">/, 'home canonical is invalid');
assert.match(home.text, /"@type":"ProfilePage"/, 'ProfilePage structured data is missing');
assert.match(home.text, /"@type":"Person"/, 'Person structured data is missing');
assert.match(home.text, /data-yandex-id="\d+"/, 'Yandex Metrika is not configured');
assert.match(home.text, /data-google-id="G-[A-Z0-9]+"/i, 'GA4 is not configured');
assert.doesNotMatch(
  home.text,
  /<script[^>]+src="https:\/\/(?:mc\.yandex\.ru|www\.googletagmanager\.com)/i,
  'analytics must not load statically before consent',
);
assert.match(privacy.text, /<meta name="robots" content="noindex, follow">/, 'privacy page must be noindex, follow');
assert.match(agreement.text, /<meta name="robots" content="noindex, follow">/, 'agreement page must be noindex, follow');

assert.match(robots.text, /^User-agent: \*\nAllow: \/\nSitemap: https:\/\/maria-galieva\.ru\/sitemap\.xml\n$/);
assert.match(sitemap.text, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
assert.equal((sitemap.text.match(/<url>/g) || []).length, 1, 'sitemap must contain one indexable URL');
assert.match(sitemap.text, /<loc>https:\/\/maria-galieva\.ru\/<\/loc>/);

const redirectChecks = [
  'http://maria-galieva.ru/',
  'https://www.maria-galieva.ru/',
  'http://xn----7sbbajepud3af3c2m.xn--p1ai/',
  'https://xn----7sbbajepud3af3c2m.xn--p1ai/',
];

for (const source of redirectChecks) {
  const result = await head(source);
  assert.equal(result.status, 301, `${source} must return 301`);
  assert.equal(new URL(result.location, source).href, 'https://maria-galieva.ru/', `${source} has an invalid redirect target`);
  if (source.startsWith('https://')) assert.equal(result.tlsAuthorized, true, `${source} has an invalid TLS certificate`);
}

console.log('Production launch verification passed: indexability, sitemap, canonical, analytics consent gate, redirects and TLS are valid.');
