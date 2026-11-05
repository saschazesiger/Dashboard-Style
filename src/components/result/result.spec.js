/**
 * Result page: the causes' discs, the tone over a cause, the disc and the
 * padding at every size and density, the shape, the stacked actions in a
 * narrow container, names and focus, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=result');
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

const result = (cls = '') => `<section class="ds-result ${cls}"><span id="probe" class="ds-result__disc"></span><h2 class="ds-result__title">Title</h2></section>`;

test('every cause colours its disc; a tone on the result wins', async ({ page }) => {
  await open(page);
  const pairs = [['ds-result--success', 'success-container'], ['ds-result--forbidden', 'surface-high'], ['ds-result--not-found', 'accent'], ['ds-result--error', 'error-container'], ['ds-result--maintenance', 'warning-container'], ['ds-result--offline', 'warning-container'], ['ds-result--error ds-tone-info', 'info-container']];
  for (const [cls, role] of pairs) {
    expect(await probe(page, result(cls), 'style.backgroundColor'), cls).toBe(await colour(page, `var(--ds-${role})`));
  }
});

test('the disc: 80px at md, 8px per size step; padding 8px per size and 4px per density step; shape', async ({ page }) => {
  await open(page);
  for (const [size, step] of SIZES) {
    expect(await probe(page, `<div class="${size}">${result()}</div>`, 'el.getBoundingClientRect().width'), size).toBe(80 + step * 8);
    expect(await probe(page, `<div class="${size} ds-density-dense"><section id="probe" class="ds-result"></section></div>`, 'parseFloat(style.paddingTop)'), size).toBe(48 + step * 8 - 8);
  }
  expect(await probe(page, result(), 'parseFloat(style.borderTopLeftRadius)')).toBe(40);
  expect(await probe(page, `<div class="ds-shape-square">${result()}</div>`, 'parseFloat(style.borderTopLeftRadius)')).toBe(0);
});

test('names: each result is a region named by its title; the disc is hidden; the title takes focus', async ({ page }) => {
  await open(page);
  const region = page.getByRole('region', { name: 'Page not found' });
  await expect(region).toBeVisible();
  await expect(region.locator('.ds-result__disc')).toHaveAttribute('aria-hidden', 'true');
  const title = region.getByRole('heading', { name: 'Page not found' });
  await title.focus();
  await expect(title).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(region.getByRole('button', { name: 'Go to the overview' })).toBeFocused();
});

test('narrow (360px): the actions stack, full width; nothing overflows', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await open(page);
  const actions = page.locator('#fx-component [data-demo="error"]').last().locator('.ds-result__actions');
  const [direction, buttons, box] = await actions.evaluate((el) => {
    const result = el.closest('.ds-result');
    const inner = result.clientWidth - parseFloat(getComputedStyle(result).paddingLeft) - parseFloat(getComputedStyle(result).paddingRight);
    return [getComputedStyle(el).flexDirection, [...el.children].map((b) => Math.round(b.getBoundingClientRect().width)), Math.round(inner)];
  });
  expect(direction).toBe('column');
  expect(buttons.every((width) => width === box)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('forced colours: the disc keeps an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const [style, color] = await probe(page, result('ds-result--error'), '[style.outlineStyle, style.outlineColor]');
  expect(style).toBe('solid');
  expect(color).toBe(await colour(page, 'CanvasText'));
});
