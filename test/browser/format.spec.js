/**
 * DS.format in real engines: the same text from every engine's Intl where the
 * standard fixes it, [data-ds-time] through DS.init(), its one timer, what a
 * morph does to it, the tooltip it feeds, and a second copy of ds.js sharing
 * the clock. Runs in the `fallback` project too.
 */
import { test, expect } from './base-test.js';
import { ready } from './helpers/motion.js';

const open = async (page) => {
  await page.goto('/test/browser/fixtures/format.html');
  await ready(page);
};

test('the functions format through Intl in the locale of DS.core.config()', async ({ page }) => {
  await open(page);
  const texts = await page.evaluate(() => {
    const out = {
      number: DS.format.number(1234.5),
      percent: DS.format.percent(0.42),
      currency: DS.format.currency(19.9, 'USD'),
      bytes: DS.format.bytes(1536),
      binary: DS.format.bytes(1536, { base: 1024 }),
      clock: DS.format.duration(3725000, { style: 'clock' }),
      list: DS.format.list(['Ada', 'Grace', 'Joan']),
      plural: DS.format.plural(3, { one: '{count} device', other: '{count} devices' }),
      relative: DS.format.relative(Date.now() - 180000),
    };
    DS.config({ locale: 'de-DE' });
    out.german = DS.format.number(1234.5);
    DS.config({ locale: 'not_a_locale!' });
    out.refused = typeof DS.format.number(1);
    DS.config({ locale: null });
    return out;
  });
  const clean = Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, text.replace(/[  ]/g, ' ')]));
  expect(clean).toEqual({
    number: '1,234.5',
    percent: '42%',
    currency: '$19.90',
    bytes: '1.5 kB',
    binary: '1.5 KiB',
    clock: '1:02:05',
    list: 'Ada, Grace, and Joan',
    plural: '3 devices',
    relative: '3 minutes ago',
    german: '1.234,5',
    refused: 'string',
  });
});

test('DS.init() writes the relative text and the absolute date in data-tip', async ({ page }) => {
  await open(page);
  await expect(page.locator('#past')).toHaveText('3 minutes ago');
  await expect(page.locator('#future')).toHaveText('in 2 hours');
  await expect(page.locator('#narrow')).toHaveText(/^2\s?h(r)?\.? ago$/);
  await expect(page.locator('#past')).toHaveAttribute('data-tip', /\d{4}/);
  await expect(page.locator('#own-tip')).toHaveAttribute('data-tip', 'Mine');
  expect(await page.locator('#no-tip').getAttribute('data-tip')).toBeNull();
  await expect(page.locator('#broken')).toHaveText('kept text');
  expect(await page.locator('#broken').getAttribute('data-tip')).toBeNull();
  expect(await page.evaluate(() => typeof DS.get(document.querySelector('#past'), 'time').set)).toBe('function');
  // Text, not a live region: nothing here announces a tick.
  expect(await page.locator('#times [aria-live]').count()).toBe(0);
});

test('the absolute date shows in the system tooltip on hover', async ({ page }) => {
  await open(page);
  await page.locator('#past').hover();
  const tip = page.locator('[role="tooltip"]');
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText(await page.locator('#past').getAttribute('data-tip'));
});

test('one timer for every time, with the text changing on the clock', async ({ page }) => {
  await page.clock.install();
  await open(page);
  const state = () => page.evaluate(() => DS.core.runtime.state('format').clients.size);
  expect(await state(), 'all six, on one clock').toBe(6);
  await expect(page.locator('#past')).toHaveText('3 minutes ago');
  await page.clock.runFor(60000);
  await expect(page.locator('#past')).toHaveText('4 minutes ago');
  await page.clock.runFor(3 * 60000);
  await expect(page.locator('#past')).toHaveText('7 minutes ago');
  await expect(page.locator('#future'), 'it counts down too').toHaveText('in 1 hour');
});

test('a morph keeps the tip, a new datetime applies at once and text written back is put right', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const target = document.querySelector('#morph-target');
    const iso = new Date(Date.now() - 120000).toISOString();
    DS.dom.morphHtml(target, `<time id="m" data-ds-time datetime="${iso}">server text</time>`);
    await new Promise((resolve) => setTimeout(resolve));
    const el = document.querySelector('#m');
    const out = { first: el.textContent, tip: el.getAttribute('data-tip') };
    // The same markup again: the morph writes "server text" and takes no data-tip from the template.
    DS.dom.morphHtml(target, `<time id="m" data-ds-time datetime="${iso}">server text</time>`);
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve));
    out.same = document.querySelector('#m') === el;
    out.afterMorph = el.textContent;
    out.tipAfterMorph = el.getAttribute('data-tip');
    const later = new Date(Date.now() - 3600000).toISOString();
    DS.dom.morphHtml(target, `<time id="m" data-ds-time datetime="${later}">server text</time>`);
    await new Promise((resolve) => setTimeout(resolve));
    out.changed = el.textContent;
    target.replaceChildren();
    await new Promise((resolve) => setTimeout(resolve));
    out.gone = DS.get(el, 'time');
    return out;
  });
  expect(result).toMatchObject({ first: '2 minutes ago', same: true, afterMorph: '2 minutes ago', changed: '1 hour ago', gone: null });
  expect(result.tipAfterMorph).toBe(result.tip);
  expect(result.tip).toMatch(/\d{4}/);
});

test('a second copy of ds.js shares the one clock', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const before = DS.core.runtime.state('format').clients.size;
    const firstCopy = window.DS;
    const source = await (await fetch('/dist/ds.js')).text();
    // Another version, so the classic script keeps its own namespace and the same runtime.
    const script = document.createElement('script');
    script.textContent = source.replace(/version:\s*"[^"]+"/, 'version: "0.0.0-other"');
    document.head.append(script);
    const second = window.DashboardStyle.versions['0.0.0-other'] ?? window.DS;
    const span = document.createElement('span');
    span.setAttribute('data-ds-time', new Date().toISOString());
    document.querySelector('#morph-target').append(span);
    const controller = second.format.time(span);
    const shared = firstCopy.core.runtime.state('format');
    const size = shared.clients.size;
    controller.destroy();
    return { before, size, same: firstCopy.core.runtime === second.core.runtime, after: shared.clients.size };
  });
  expect(result.same).toBe(true);
  expect(result.size).toBeGreaterThanOrEqual(result.before + 1);
  expect(result.after).toBeLessThan(result.size);
});
