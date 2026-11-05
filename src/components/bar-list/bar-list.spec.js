/**
 * Bar list: the row height at every size and density, touch on a row with
 * a link, the bar clipped at the share, the tone from the row only, the
 * figures lined up, the narrow card, names, the link's focus ring, forced
 * colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITY = [['', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=bar-list');
  await ready(page);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe" style="inline-size: 400px">${html}</div>`);
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

const row = (cls = '', label = '<span class="ds-bar-list__label"><span>Printers</span></span>') =>
  `<ol class="ds-bar-list"><li id="probe" class="ds-bar-list__item ${cls}" style="--ds-share: .5">${label}<span class="ds-bar-list__value">412</span></li></ol>`;

test('a row: 32px at md, 8px per size step and 4px per density step; touch lifts only a row with a link', async ({ page }) => {
  await open(page);
  for (const [density, d] of DENSITY) {
    for (const [size, s] of SIZES) {
      const height = await probe(page, `<div class="${size} ${density}">${row()}</div>`, 'el.getBoundingClientRect().height');
      // Never under its line of label type (20px): the extra-small, tight row is as tall as its text.
      expect(height, `${size} ${density}`).toBe(Math.max(20, 32 + s * 8 + d * 4));
    }
  }
  expect(await probe(page, `<div class="ds-touch ds-sm">${row()}</div>`, 'el.getBoundingClientRect().height')).toBe(24);
  const link = '<a class="ds-bar-list__label" href="#x"><span>Printers</span></a>';
  expect(await probe(page, `<div class="ds-touch ds-sm">${row('', link)}</div>`, 'el.getBoundingClientRect().height')).toBe(48);
  // The gap between rows follows density, 1px per step.
  const gap = (cls) => probe(page, `<div class="${cls}"><ol id="probe" class="ds-bar-list"></ol></div>`, 'parseFloat(style.rowGap)');
  expect(await gap('')).toBe(4);
  expect(await gap('ds-density-tight')).toBe(1);
});

test('the bar sits behind the label, clipped at the share; the figures line up at the end', async ({ page }) => {
  await open(page);
  const clip = await probe(page, row(), 'getComputedStyle(el.querySelector(".ds-bar-list__label"), "::before").clipPath');
  expect(clip).toMatch(/inset\(0(px)? 50% 0(px)? 0(px)? round/);
  const ends = await page.locator('#fx-component [data-demo="ranked"] .ds-bar-list__value').evaluateAll((values) => values.map((v) => Math.round(v.getBoundingClientRect().right)));
  expect(new Set(ends).size).toBe(1);
  const shares = await page.locator('#fx-component [data-demo="ranked"] .ds-bar-list__item').evaluateAll((rows) => rows.map((r) => Number(r.style.getPropertyValue('--ds-share'))));
  expect(shares[0]).toBe(1);
});

test('tone: from the class on the row itself; an inherited tone changes nothing; plain uses the track', async ({ page }) => {
  await open(page);
  const bar = 'getComputedStyle(el.querySelector(".ds-bar-list__label"), "::before").backgroundColor';
  const plain = await probe(page, row(), bar);
  expect(plain).toBe(await colour(page, 'var(--ds-accent)'));
  expect(await probe(page, `<div class="ds-tone-error">${row()}</div>`, bar)).toBe(plain);
  expect(await probe(page, row('ds-tone-error'), bar)).toBe(await colour(page, 'var(--ds-error-container)'));
  expect(await probe(page, row().replace('class="ds-bar-list"', 'class="ds-bar-list ds-bar-list--plain"'), bar)).toBe(await colour(page, 'var(--ds-chart-track)'));
});

test('shape: the bar\'s corners times --ds-shape', async ({ page }) => {
  await open(page);
  const radius = (cls) => probe(page, `<div class="${cls}">${row()}</div>`, 'parseFloat(getComputedStyle(el.querySelector(".ds-bar-list__label")).borderTopLeftRadius)');
  const base = await radius('');
  expect(base).toBeGreaterThan(0);
  expect(await radius('ds-shape-square')).toBe(0);
  expect(await radius('ds-shape-soft')).toBe(base / 2);
});

test('names, the link\'s inset focus ring and the narrow card (360px)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  await expect(page.getByRole('list', { name: 'Open tickets per device type' })).toBeVisible();
  const link = page.locator('#fx-component [data-demo="links"] a').first();
  await link.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  // Solid at once; the offset snaps in to the inset ring.
  expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await expect.poll(() => link.evaluate((el) => parseFloat(getComputedStyle(el).outlineOffset))).toBe(-2);
  const long = page.locator('#fx-component [data-demo="links"] .ds-bar-list__label > span').nth(2);
  expect(await long.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  const fits = await page.locator('#fx-component .ds-bar-list__value').evaluateAll((values) => values.every((v) => v.scrollWidth <= v.clientWidth && v.getBoundingClientRect().right <= document.documentElement.clientWidth));
  expect(fits).toBe(true);
});

test('new values glide and the rows reorder', async ({ page }) => {
  await open(page);
  const list = page.locator('#fx-component [data-demo="ranked"]');
  await page.locator('#fx-component [data-demo="shuffle"]').click();
  await expect.poll(() => list.evaluate((el) => [...el.children].map((r) => Number(r.style.getPropertyValue('--ds-share'))).every((s, i, all) => i === 0 || all[i - 1] >= s))).toBe(true);
  expect(await list.locator('.ds-bar-list__item').first().evaluate((el) => getComputedStyle(el).transitionProperty)).toContain('--ds-share');
});

test('forced colours: each bar is a CanvasText outline at its share', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const bar = await probe(page, row('ds-tone-error'), '(() => { const s = getComputedStyle(el.querySelector(".ds-bar-list__label"), "::before"); return [s.outlineStyle, s.outlineColor, s.backgroundColor]; })()');
  expect(bar[0]).toBe('solid');
  expect(bar[1]).toBe(await colour(page, 'CanvasText'));
  expect(bar[2]).toMatch(/, 0\)$/);
});
