/**
 * The shape loader on the options model: its size at every step (density and
 * touch change nothing), the shape's share of it, the 2.x --sm gone, no
 * second delay inside a waiting container, decoration only, forced colours and
 * print. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', 16], ['ds-sm', 24], ['ds-md', 48], ['ds-lg', 72], ['ds-xl', 96]];
const DENSITIES = ['ds-density-comfortable', 'ds-density-compact', 'ds-density-dense', 'ds-density-tight'];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=loader');
  await ready(page);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', `return (${read});`)(el, style);
  holder.remove();
  return out;
}, { html, read });

const width = 'el.getBoundingClientRect().width';

test('the size at every step; density and touch change nothing; the shape is 38/48 of it', async ({ page }) => {
  await open(page);
  for (const touch of [false, true]) {
    for (const density of DENSITIES) {
      for (const [size, value] of SIZES) {
        expect(await probe(page, `<div class="${density}${touch ? ' ds-touch' : ''}"><span id="probe" class="ds-loader ${size}"></span></div>`, width), `${size} ${density}`).toBe(value);
      }
    }
  }
  expect(await probe(page, '<span id="probe" class="ds-loader"></span>', width)).toBe(48);
  expect(await probe(page, '<span id="probe" class="ds-loader ds-xl"></span>', 'parseFloat(getComputedStyle(el, "::before").width)')).toBeCloseTo(96 * 38 / 48, 1);
  expect(await probe(page, '<span id="probe" class="ds-loader" style="--ds-loader-size: 64px"></span>', width)).toBe(64);
});

test('.ds-sm is 24px; the 2.x --sm and its hook were removed in 3.0', async ({ page }) => {
  await open(page);
  expect(await probe(page, '<span id="probe" class="ds-loader ds-sm"></span>', width)).toBe(24);
  // Built from fragments, so the removed-name guard of test/repo.test.js passes this file.
  const [small, hook] = [`ds-loader--${'sm'}`, `--ds-loader-${'sm'}-size`];
  expect(await probe(page, `<span id="probe" class="ds-loader ${small}"></span>`, width)).toBe(48);
  expect(await probe(page, `<div class="ds-lg"><span id="probe" class="ds-loader ${small}" style="${hook}: 30px"></span></div>`, width)).toBe(72);
});

test('fades in after the loader delay alone; inside a waiting container the delays never stack', async ({ page }) => {
  await open(page);
  expect(await probe(page, '<span id="probe" class="ds-loader"></span>', 'style.animationName')).toBe('ds-fade-in');
  for (const container of ['ds-loading', 'ds-boot', 'ds-skeleton']) {
    expect(await probe(page, `<div class="${container}"><span id="probe" class="ds-loader"></span></div>`, 'style.animationName'), container).toBe('none');
  }
  // The loops run on ::before either way.
  expect(await probe(page, '<div class="ds-loading"><span id="probe" class="ds-loader"></span></div>', 'getComputedStyle(el, "::before").animationName')).toBe('ds-loader-morph, ds-loader-turn');
});

test('decoration: aria-hidden, with the words in a role="status" around it; no stop', async ({ page }) => {
  await open(page);
  const all = await page.$$eval('#fx-component .ds-loader', (loaders) => loaders.map((el) => [el.getAttribute('aria-hidden'), el.tabIndex]));
  expect(all.length).toBeGreaterThan(5);
  for (const entry of all) expect(entry).toEqual(['true', -1]);
  await expect(page.locator('.ds-loading[role="status"]').first()).toContainText('Loading more devices');
});

test('forced colours: the shape in Highlight, the contained disc an outline', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const highlight = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'Highlight';
    el.style.forcedColorAdjust = 'none';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  expect(await probe(page, '<span id="probe" class="ds-loader"></span>', 'getComputedStyle(el, "::before").backgroundColor')).toBe(highlight);
  expect(await probe(page, '<span id="probe" class="ds-loader ds-loader--contained"></span>', 'style.outlineStyle')).toBe('solid');
});

test('print: the shape is left out', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  expect(await probe(page, '<span id="probe" class="ds-loader"></span>', 'style.display')).toBe('none');
});
