/**
 * The container presets on probes of a fixed width and on their demo: each
 * .ds-hide-* and .ds-only-* class answers for the nearest container at the
 * compact (< 600px), medium (600-839px) and expanded (>= 840px) sizes, at
 * the exact edges; two classes hide below or above a size; a hidden part
 * leaves the accessibility tree and the Tab order; .ds-stack-compact turns
 * a row into a column of full-width items; with no container around,
 * everything shows; the nearest container decides, not the window; forced
 * colours draw nothing. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=container');
  await ready(page);
}

/** A probe at the top of the body, outside the fixture's stage (replaced by the next one). */
const add = (page, html) => page.evaluate((markup) => {
  document.getElementById('probe')?.remove();
  const region = document.createElement('div');
  region.id = 'probe';
  region.insertAdjacentHTML('beforeend', markup);
  document.body.prepend(region);
}, html);

const PARTS = '<span class="ds-hide-compact">hide-compact</span><span class="ds-hide-medium">hide-medium</span><span class="ds-hide-expanded">hide-expanded</span>' +
  '<span class="ds-only-compact">only-compact</span><span class="ds-only-medium">only-medium</span><span class="ds-only-expanded">only-expanded</span>' +
  '<span class="ds-hide-compact ds-hide-medium">below-expanded-hidden</span><span class="ds-hide-medium ds-hide-expanded">above-compact-hidden</span>';

/** The parts that show in a container of `width`. */
async function shown(page, width) {
  await add(page, `<div class="ds-container" style="inline-size: ${width}px"><div class="ds-cluster" id="parts">${PARTS}</div></div>`);
  return page.$$eval('#parts > span', (items) => items.filter((item) => getComputedStyle(item).display !== 'none').map((item) => item.textContent));
}

test('each class answers for its size, at the exact edges of 600px and 840px', async ({ page }) => {
  await open(page);
  const compact = ['hide-medium', 'hide-expanded', 'only-compact'];
  const medium = ['hide-compact', 'hide-expanded', 'only-medium'];
  const expanded = ['hide-compact', 'hide-medium', 'only-expanded', 'below-expanded-hidden'];
  expect(await shown(page, 320)).toEqual([...compact, 'above-compact-hidden']);
  expect(await shown(page, 599)).toEqual([...compact, 'above-compact-hidden']);
  expect(await shown(page, 600)).toEqual(medium);
  expect(await shown(page, 839)).toEqual(medium);
  expect(await shown(page, 840)).toEqual(expanded);
  expect(await shown(page, 1200)).toEqual(expanded);
});

test('with no container around, every part shows and nothing stacks', async ({ page }) => {
  await open(page);
  await add(page, `<div style="inline-size: 320px"><div class="ds-cluster" id="parts">${PARTS}</div><div class="ds-cluster ds-stack-compact" id="row"><span>A</span><span>B</span></div></div>`);
  const hidden = await page.$$eval('#parts > span', (items) => items.filter((item) => getComputedStyle(item).display === 'none').length);
  expect(hidden).toBe(0);
  expect(await page.$eval('#row', (el) => getComputedStyle(el).flexDirection)).toBe('row');
});

test('the nearest container decides, not the window; .ds-container takes inline-size containment', async ({ page }) => {
  await open(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await add(page, `<div class="ds-container" style="inline-size: 1000px"><div class="ds-container" style="inline-size: 400px" id="inner"><span class="ds-only-compact" id="compact">compact</span><span class="ds-only-expanded" id="expanded">expanded</span></div></div>`);
  await expect(page.locator('#compact')).toBeVisible();
  await expect(page.locator('#expanded')).toBeHidden();
  expect(await page.$eval('#inner', (el) => getComputedStyle(el).containerType)).toBe('inline-size');
  await page.setViewportSize({ width: 360, height: 800 });
  await add(page, `<div class="ds-container" style="inline-size: 900px"><span class="ds-only-expanded" id="wide">expanded</span></div>`);
  await expect(page.locator('#wide'), 'a wide region on a narrow window is expanded').toBeVisible();
});

test('a hidden part leaves the accessibility tree and the Tab order; its counterpart takes over', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-container" style="inline-size: 400px" id="region">
    <button type="button" class="ds-btn" id="first">Sync</button>
    <button type="button" class="ds-btn ds-hide-compact" id="wide">Lock device</button>
    <button type="button" class="ds-btn ds-btn--icon ds-only-compact" id="narrow" aria-label="More actions">⋯</button>
  </div>`);
  await page.locator('#first').focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.id)).toBe('narrow');
  await expect(page.getByRole('button', { name: 'Lock device' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'More actions' })).toBeVisible();
  await page.$eval('#region', (el) => { el.style.inlineSize = '700px'; });
  await page.locator('#first').focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.id)).toBe('wide');
  await expect(page.getByRole('button', { name: 'More actions' })).toHaveCount(0);
});

test('a visibility class wins over the display a component gives the element', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-container" style="inline-size: 400px"><div class="ds-cluster ds-hide-compact" id="row"><span>A</span></div><button type="button" class="ds-btn ds-only-expanded" id="btn">B</button></div>`);
  expect(await page.$eval('#row', (el) => getComputedStyle(el).display)).toBe('none');
  expect(await page.$eval('#btn', (el) => getComputedStyle(el).display)).toBe('none');
});

test('.ds-stack-compact: a column of full-width items when compact, the row again from medium on', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-container" style="inline-size: 360px" id="region"><div class="ds-cluster ds-stack-compact" id="row">
    <button type="button" class="ds-btn" id="a">Sync</button><button type="button" class="ds-btn ds-push" id="b">Edit</button></div></div>`);
  const read = () => page.evaluate(() => {
    const row = document.getElementById('row').getBoundingClientRect();
    const a = document.getElementById('a').getBoundingClientRect();
    const b = document.getElementById('b').getBoundingClientRect();
    return { row: Math.round(row.width), a: Math.round(a.width), b: Math.round(b.width), stacked: b.top >= a.bottom, bLeft: Math.round(b.left - row.left) };
  });
  const compact = await read();
  expect(compact.stacked).toBe(true);
  expect(compact.a).toBe(compact.row);
  expect(compact.b, 'the pushed item is full width too').toBe(compact.row);
  expect(compact.bLeft).toBe(0);
  await page.$eval('#region', (el) => { el.style.inlineSize = '700px'; });
  const medium = await read();
  expect(medium.stacked).toBe(false);
  expect(medium.a).toBeLessThan(medium.row);
});

test('the demo: the readout names the stage\'s size with an icon and a word, and the width option moves it', async ({ page }) => {
  await open(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  const readout = page.locator('[data-demo="readout"] [data-demo="size"]:visible');
  await expect(readout).toHaveCount(1);
  await expect(readout).toHaveText('Expanded');
  await expect(readout.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(readout).toHaveText('Compact');
  // The fixed regions keep their own answer whatever the window.
  await page.setViewportSize({ width: 1280, height: 800 });
  const regions = await page.$$eval('[data-demo="region"]', (items) => items.map((item) => [...item.querySelectorAll('[data-demo="size"]')].find((el) => getComputedStyle(el).display !== 'none')?.textContent));
  expect(regions.slice(0, 2)).toEqual(['Compact', 'Medium']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no sideways scroll').toBe(true);
});

test('forced colours: the classes draw nothing; a hidden part stays hidden', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  expect(await shown(page, 320)).toEqual(['hide-medium', 'hide-expanded', 'only-compact', 'above-compact-hidden']);
  expect(await page.$eval('.ds-container', (el) => [getComputedStyle(el).borderTopStyle, getComputedStyle(el).outlineStyle])).toEqual(['none', 'none']);
});
