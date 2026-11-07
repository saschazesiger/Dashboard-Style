/**
 * Category bar: parts as wide as their shares with gaps, the rest left to
 * the track, the track height per size, the marker, the tone from the part
 * only, names, the narrow card, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=category-bar');
  await ready(page);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe" style="inline-size: 404px">${html}</div>`);
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

const bar = (parts, cls = '', extra = '') => `<figure class="ds-category-bar ${cls}"><div id="probe" class="ds-category-bar__track">${parts.map(([share, c]) => `<span class="ds-category-bar__part ${c ?? ''}" style="--ds-share: ${share}"></span>`).join('')}${extra}</div></figure>`;
const widths = 'Array.from(el.querySelectorAll(".ds-category-bar__part"), (p) => Math.round(p.getBoundingClientRect().width))';

test('parts are as wide as their shares, 2px apart; shares under 1 leave the rest to the track', async ({ page }) => {
  await open(page);
  // 404px less two gaps of 2px: 400px to share.
  expect(await probe(page, bar([[0.5], [0.3], [0.2]]), widths)).toEqual([200, 120, 80]);
  expect(await probe(page, bar([[0.5], [0.25]], 'ds-category-bar--rest'), widths)).toEqual([201, 101]);
  const track = await probe(page, bar([[0.5]], 'ds-category-bar--rest'), 'style.backgroundColor');
  expect(track).toBe(await colour(page, 'var(--ds-chart-track)'));
  // The first and the last part carry the bar's round ends.
  const corners = await probe(page, bar([[0.5], [0.5]]), 'Array.from(el.children, (p) => [parseFloat(getComputedStyle(p).borderTopLeftRadius), parseFloat(getComputedStyle(p).borderTopRightRadius)])');
  expect(corners).toEqual([[4, 0], [0, 4]]);
});

test('the track: 8px at md, 2px per size step; density spaces its rows; shape squares its ends', async ({ page }) => {
  await open(page);
  for (const [size, step] of SIZES) {
    expect(await probe(page, `<div class="${size} ds-touch ds-density-tight">${bar([[1]])}</div>`, 'el.getBoundingClientRect().height'), size).toBe(8 + step * 2);
  }
  const gap = (cls) => probe(page, `<div class="${cls}"><figure id="probe" class="ds-category-bar"></figure></div>`, 'parseFloat(style.rowGap)');
  expect(await gap('')).toBe(8);
  expect(await gap('ds-density-dense')).toBe(6);
  expect(await probe(page, `<div class="ds-shape-square">${bar([[1]])}</div>`, 'parseFloat(getComputedStyle(el.firstElementChild).borderTopLeftRadius)')).toBe(0);
});

test('series and tones: from the class on the part itself', async ({ page }) => {
  await open(page);
  const fills = await probe(page, `<div class="ds-tone-error">${bar([[0.25], [0.25, 'ds-category-bar__part--s2'], [0.25, 'ds-tone-warning'], [0.25, 'ds-tone-success']])}</div>`, 'Array.from(el.children, (p) => getComputedStyle(p).backgroundColor)');
  expect(fills).toEqual([await colour(page, 'var(--ds-chart-1)'), await colour(page, 'var(--ds-chart-2)'), await colour(page, 'var(--ds-chart-warning)'), await colour(page, 'var(--ds-success)')]);
});

test('the marker sits at its own share, across the track', async ({ page }) => {
  await open(page);
  const [left, top, height] = await probe(page, bar([[0.5], [0.5]], '', '<span class="ds-category-bar__marker" style="--ds-share: .75"></span>'), '(() => { const m = el.querySelector(".ds-category-bar__marker").getBoundingClientRect(); const t = el.getBoundingClientRect(); return [m.left - t.left, m.top - t.top, m.height]; })()');
  expect(left).toBe(404 * 0.75 - 1);
  expect(top).toBe(-3);
  expect(height).toBe(14);
});

test('names: the track is an image named by every part; the legend is hidden from it; narrow (360px)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const track = page.getByRole('img', { name: /^Open 120 tickets \(50%\), In progress 72 tickets \(30%\), Closed 48 tickets \(20%\); target/ });
  await expect(track).toBeVisible();
  await expect(page.locator('#fx-component [data-demo="status"] .ds-legend')).toHaveAttribute('aria-hidden', 'true');
  const narrow = page.locator('#fx-component [data-demo="narrow"]');
  expect(await narrow.evaluate((el) => {
    const label = el.querySelector('.ds-category-bar__label');
    const total = el.querySelector('.ds-category-bar__total');
    return [label.scrollWidth > label.clientWidth, total.scrollWidth <= total.clientWidth, el.getBoundingClientRect().right <= document.documentElement.clientWidth];
  })).toEqual([true, true, true]);
});

test('new values glide on the share', async ({ page }) => {
  await open(page);
  const part = page.locator('#fx-component [data-demo="status"] .ds-category-bar__part').first();
  expect(await part.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain('--ds-share');
  const before = await part.evaluate((el) => el.style.getPropertyValue('--ds-share'));
  await page.locator('#fx-component [data-demo="refresh"]').click();
  await expect.poll(() => part.evaluate((el) => el.style.getPropertyValue('--ds-share'))).not.toBe(before);
});

test('forced colours: parts CanvasText, series hatched, the marker CanvasText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const parts = await probe(page, bar([[0.5], [0.3, 'ds-category-bar__part--s2']], '', '<span class="ds-category-bar__marker" style="--ds-share: .5"></span>'), '[getComputedStyle(el.children[0]).backgroundColor, getComputedStyle(el.children[1]).backgroundImage, getComputedStyle(el.children[2]).backgroundColor, style.outlineStyle]');
  expect(parts[0]).toBe(await colour(page, 'CanvasText'));
  expect(parts[1]).toContain('repeating-linear-gradient(45deg');
  expect(parts[2]).toBe(await colour(page, 'CanvasText'));
  expect(parts[3]).toBe('solid');
});
