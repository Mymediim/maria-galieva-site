import { readFile } from 'node:fs/promises';
import process from 'node:process';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const requireConfiguredIds = process.argv[2] === 'configured';

const fail = (message) => {
  console.error(`Analytics verification failed: ${message}`);
  process.exitCode = 1;
};

const expectedEvents = [
  ['calendar_click', ['header', 'hero', 'meeting', 'services', 'footer']],
  ['telegram_click', ['hero', 'meeting', 'footer']],
  ['it_production_click', ['cases', 'method', 'footer']],
  ['case_click', ['locapp', 'hmb-bank']],
];

for (const [eventName, placements] of expectedEvents) {
  for (const placement of placements) {
    const eventPattern = new RegExp(
      `<a[^>]+data-analytics-event=["']${eventName}["'][^>]+data-analytics-placement=["']${placement}["']`,
      'i',
    );
    if (!eventPattern.test(html)) fail(`missing ${eventName} event for ${placement}`);
  }
}

for (const caseName of ['locapp', 'hmb-bank']) {
  const casePattern = new RegExp(
    `<a(?=[^>]+data-analytics-event=["']case_click["'])(?=[^>]+data-analytics-case-name=["']${caseName}["'])[^>]*>`,
    'i',
  );
  if (!casePattern.test(html)) fail(`missing case_name for ${caseName}`);
}

if (!/case_name:\s*link\.dataset\.analyticsCaseName/.test(html)) {
  fail('case_name is not sent with delegated analytics events');
}

if (!/data-cookie-settings/.test(html)) fail('missing analytics settings control');
if (!/analytics_consent_granted/.test(html)) fail('missing consent event');
if (!/data-analytics-event/.test(html)) fail('missing delegated analytics tracking');

if (requireConfiguredIds) {
  if (!/data-yandex-id=["']\d+["']/.test(html)) fail('missing valid Yandex Metrika ID');
  if (!/data-google-id=["']G-[A-Z0-9]+["']/i.test(html)) fail('missing valid GA4 ID');
}

const staticAnalyticsScript = /<script[^>]+src=["']https:\/\/(?:mc\.yandex\.ru|www\.googletagmanager\.com)/i;
if (staticAnalyticsScript.test(html)) fail('analytics script is loaded before consent');

if (!process.exitCode) {
  console.log(`Analytics verification passed${requireConfiguredIds ? ' with both configured IDs' : ''}: consent gate, settings control and CTA events are present.`);
}
