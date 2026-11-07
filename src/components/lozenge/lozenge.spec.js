/**
 * State label: the height at every size (density and touch change
 * nothing), the shape, the filled and subtle tones from the class on the
 * lozenge only, the ellipsis, the state that changes, forced colours.
 * Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=lozenge');
  await ready(page);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', 'holder', `return (${read});`)(el, style, holder);
  holder.remove();
  return out;
}, { html, read });

const colour = (page, value) => page.evaluate((value) => {
  const el = document.createElement('span');
  el.style.color = value;
  document.querySelector('#fx-component').append(el);
  const out = getComputedStyle(el).color;
  el.remove();
  return out;
}, value);

const lozenge = (cls = '') => `<span id="probe" class="ds-lozenge ${cls}"><span>Open</span></span>`;

test('28px at md, 4px per size step; density and touch change nothing; a pill times --ds-shape', async ({ page }) => {
  await open(page);
  for (const extra of ['', ' ds-touch ds-density-tight']) {
    for (const [size, step] of SIZES) {
      expect(await probe(page, `<div class="${size}${extra}">${lozenge()}</div>`, 'el.getBoundingClientRect().height'), `${size}${extra}`).toBe(28 + step * 4);
    }
  }
  expect(await probe(page, lozenge(), 'parseFloat(style.borderTopLeftRadius)')).toBe(14);
  expect(await probe(page, `<div class="ds-shape-square">${lozenge()}</div>`, 'parseFloat(style.borderTopLeftRadius)')).toBe(0);
});

test('tones: filled the tone with its on-colour, subtle the container pair; only from its own class', async ({ page }) => {
  await open(page);
  const read = '[style.backgroundColor, style.color]';
  expect(await probe(page, lozenge('ds-tone-success'), read)).toEqual([await colour(page, 'var(--ds-success)'), await colour(page, 'var(--ds-on-success)')]);
  expect(await probe(page, lozenge('ds-lozenge--subtle ds-tone-error'), read)).toEqual([await colour(page, 'var(--ds-error-container)'), await colour(page, 'var(--ds-on-error-container)')]);
  const plain = await probe(page, lozenge(), read);
  expect(await probe(page, `<div class="ds-tone-error">${lozenge()}</div>`, read)).toEqual(plain);
  expect(plain).toEqual([await colour(page, 'var(--ds-text-2)'), await colour(page, 'var(--ds-surface)')]);
});

test('every demo lozenge has a word; a long one ends in an ellipsis at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const words = await page.locator('#fx-component .ds-lozenge').evaluateAll((all) => all.every((el) => el.textContent.trim().length > 0));
  expect(words).toBe(true);
  const long = page.locator('#fx-component .ds-lozenge').filter({ hasText: 'Waiting for a second review' });
  expect(await long.evaluate((el) => { const s = el.querySelector(':scope > span'); return s.scrollWidth > s.clientWidth && el.getBoundingClientRect().right <= document.documentElement.clientWidth; })).toBe(true);
});

test('a state that changes keeps the element, glides its colours and is announced', async ({ page }) => {
  await open(page);
  const live = page.locator('#fx-component [data-demo="live"] .ds-lozenge');
  const handle = await live.elementHandle();
  expect(await live.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain('background-color');
  await page.locator('#fx-component [data-demo="toggle"]').click();
  await expect(live).toHaveText('Closed');
  expect(await handle.evaluate((el) => el.isConnected && el.classList.contains('ds-tone-error'))).toBe(true);
  await expect(page.locator('[aria-live]').filter({ hasText: 'Ticket closed' })).toHaveCount(1);
});

test('forced colours: a CanvasText edge and CanvasText ink', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const [outline, ink] = await probe(page, lozenge('ds-tone-success'), '[style.outlineColor, style.color]');
  expect(outline).toBe(await colour(page, 'CanvasText'));
  expect(ink).toBe(await colour(page, 'CanvasText'));
});
