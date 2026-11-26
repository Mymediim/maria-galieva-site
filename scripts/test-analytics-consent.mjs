import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/CookieConsent.astro', import.meta.url), 'utf8').match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
function setup(consent, storageBlocked = false) {
  const handlers = {};
  const element = name => ({ hidden: true, dataset: {}, focus() {}, addEventListener(type, fn) { handlers[`${name}:${type}`] = fn; } });
  const root = element('root');
  root.dataset = { yandexId: '123', googleId: 'G-TEST123' };
  const settings = element('settings');
  const accept = element('accept');
  root.querySelector = selector => selector.includes('accept') ? accept : element('decline');
  const scripts = [], yandex = [], google = [];
  let reloads = 0;
  const window = { ym: (...args) => yandex.push(args), gtag: (...args) => google.push(args), location: { reload() { reloads++; } } };
  vm.runInNewContext(source, {
    window, Date,
    localStorage: { getItem: () => { if (storageBlocked) throw new Error('blocked'); return consent; }, setItem: (key, value) => { if (storageBlocked) throw new Error('blocked'); consent = value; } },
    document: { querySelector: selector => selector.includes('consent') ? root : settings, createElement: () => ({}), head: { appendChild: script => scripts.push(script) }, addEventListener: (type, fn) => { handlers[`document:${type}`] = fn; } },
  });
  const clickCTA = () => handlers['document:click']?.({ target: { closest: () => ({ dataset: { analyticsEvent: 'case_click', analyticsPlacement: 'cases', analyticsCaseName: 'locapp' } }) } });
  return { root, settings, handlers, scripts, yandex, google, clickCTA, reloads: () => reloads };
}
test('returning visitor retains settings, CTA events and withdrawal', () => {
  const s = setup('accepted');
  s.clickCTA();
  assert.equal(s.google.filter(x => x[1] === 'case_click').length, 1, 'GA4 receives returning visitor CTA');
  assert.equal(s.yandex.filter(x => x[1] === 'reachGoal').length, 1);
  s.handlers['settings:click']();
  assert.equal(s.root.hidden, false);
  s.handlers['decline:click']();
  s.clickCTA();
  assert.equal(s.google.filter(x => x[1] === 'case_click').length, 1);
  assert.equal(s.reloads(), 1);
});
for (const consent of [null, 'declined']) test(`consent lifecycle: ${consent}`, () => {
  const s = setup(consent);
  s.clickCTA();
  assert.equal(s.scripts.length, 0);
  assert.equal(s.google.length, 0);
  s.handlers['accept:click']();
  assert.equal(s.scripts.length, 2);
  s.handlers['accept:click']();
  assert.equal(s.scripts.length, 2);
  s.clickCTA();
  assert.equal(s.google.filter(x => x[1] === 'case_click').length, 1);
});


test('blocked storage fails closed, permits explicit choice and withdrawal', () => {
  const s = setup(null, true);
  assert.equal(s.root.hidden, false);
  s.clickCTA();
  assert.equal(s.scripts.length, 0);
  s.handlers['decline:click']();
  assert.equal(s.scripts.length, 0);
  assert.equal(s.settings.hidden, false);
  s.handlers['settings:click']();
  assert.equal(s.root.hidden, false);
  s.handlers['accept:click']();
  assert.equal(s.scripts.length, 2);
  s.clickCTA();
  assert.equal(s.google.filter(x => x[1] === 'case_click').length, 1);
  s.handlers['decline:click']();
  s.clickCTA();
  assert.equal(s.google.filter(x => x[1] === 'case_click').length, 1);
  assert.equal(s.reloads(), 1);
});
