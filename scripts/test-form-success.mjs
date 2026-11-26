import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const consentSource = readFileSync(new URL('../src/components/CookieConsent.astro', import.meta.url), 'utf8').match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const formSource = readFileSync(new URL('../products/codex-for-leaders/research/prototype/script.js', import.meta.url), 'utf8');
function setup(consent = 'accepted', response = { ok: true, status: 200, json: async () => ({ status: 'mail_sent' }) }, formConsent = '1') {
  const listeners = new Map(), google = [], yandex = [], dispatched = [];
  const values = new Map(Object.entries({ name: 'Private name', email: 'private@example.test', message: 'Private message', tariff: 'Базовый', source: 'Private source', privacy_consent: formConsent, privacy_consent_version: '2026-11-25' }));
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { hidden: true, disabled: false, dataset: {}, value: '', textContent: '', focus() {}, addEventListener(type, fn) { listeners.set(`${selector}:${type}`, fn); } });
    return nodes.get(selector);
  };
  const root = node('[data-cookie-consent]');
  root.dataset = { yandexId: '123', googleId: 'G-TEST123' };
  root.querySelector = node;
  const form = node('#question-form');
  form.dataset = { endpoint: 'https://example.test/form', contactFormId: '1798' };
  form.querySelector = node;
  form.elements = { namedItem: name => ({ value: values.get(name) }) };
  form.reset = () => { values.set('tariff', ''); };
  node('#application-tariff').value = 'Базовый';
  const document = {
    querySelector: selector => selector === '.hero-portrait-scene' ? null : node(selector),
    querySelectorAll: () => [], createElement: () => ({}), head: { appendChild() {} },
    addEventListener(type, fn) { listeners.set(`document:${type}`, fn); },
    dispatchEvent(event) { dispatched.push(event); listeners.get(`document:${event.type}`)?.(event); },
  };
  let requests = 0;
  const context = vm.createContext({ document, window: { ym: (...args) => yandex.push(args), gtag: (...args) => google.push(args), location: { reload() {} } },
    localStorage: { getItem: () => consent, setItem: (key, value) => { consent = value; } }, Date,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    FormData: class { get(key) { return values.get(key); } set(key, value) { values.set(key, value); } },
    AbortSignal: { timeout: () => ({}) },
    fetch: async () => { requests++; if (response instanceof Error) throw response; return response; },
  });
  vm.runInContext(consentSource, context);
  vm.runInContext(formSource, context);
  return { google, yandex, dispatched, submit: () => listeners.get('#question-form:submit')({ preventDefault() {} }), requests: () => requests, status: node('#application-status'), button: node('button[type="submit"]') };
}
const success = s => s.google.filter(args => args[1] === 'form_success');
test('confirmed submission reports one sanitized event to each counter before reset', async () => {
  const s = setup(); await s.submit();
  assert.equal(success(s).length, 1);
  assert.equal(s.yandex.filter(args => args[1] === 'reachGoal' && args[2] === 'form_success').length, 1);
  assert.equal(JSON.stringify(success(s)[0][2]), JSON.stringify({ service: 'codex_practicum', tariff: 'Базовый' }));
  assert.doesNotMatch(JSON.stringify([s.google, s.yandex, s.dispatched]), /Private|private@example/);
  assert.equal(s.status.textContent, 'Заявка отправлена');
});
for (const consent of [null, 'declined']) test(`no analytics without consent: ${consent}`, async () => {
  const s = setup(consent); await s.submit(); assert.equal(s.google.length, 0); assert.equal(s.yandex.length, 0);
  assert.equal(s.status.textContent, 'Заявка отправлена');
});
for (const [label, response] of [
  ['server error', { ok: false, status: 500 }], ['rate limit', { ok: false, status: 429 }],
  ['timeout', new Error('Timeout')], ['unconfirmed', { ok: true, status: 200, json: async () => ({ status: 'validation_failed' }) }],
]) test(`no false success on ${label}`, async () => {
  const s = setup('accepted', response); await s.submit(); assert.equal(success(s).length, 0);
  assert.notEqual(s.status.textContent, 'Заявка отправлена'); assert.equal(s.button.disabled, false);
});
test('double click while pending sends only one request and one success', async () => {
  let release; const pending = new Promise(resolve => { release = resolve; });
  const s = setup('accepted', { ok: true, status: 200, json: () => pending });
  const first = s.submit(); await Promise.resolve(); await s.submit();
  release({ status: 'mail_sent' }); await first;
  assert.equal(s.requests(), 1); assert.equal(success(s).length, 1);
});

test('missing separate form consent blocks request even when analytics consent is accepted', async () => {
  const s = setup('accepted', undefined, ''); await s.submit();
  assert.equal(s.requests(), 0); assert.equal(success(s).length, 0);
  assert.match(s.status.textContent, /согласие/i);
});
