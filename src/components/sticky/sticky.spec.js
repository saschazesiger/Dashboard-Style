/**
 * Sticky on probes and its demo: the head, foot, start column and side
 * stay in view while their scroller moves; the raised edge shows exactly
 * while content passes under the box (on the scroller's scroll timeline where
 * scroll-driven animations exist, else through DS.dom.watchScrolled() and
 * DS.dom.scrollEdges()); --flat, the offset hook, the opaque fill; the
 * scrollers are named regions in the Tab order; forced colours; print.
 * Runs in the `fallback` project too (the DS.dom path in Chromium).
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=sticky');
  await ready(page);
}

/** A probe region at the top of the fixture, with the DS.dom watches a page attaches (the fallback path). */
const add = (page, html) => page.evaluate((markup) => {
  document.getElementById('probe')?.remove();
  const region = document.createElement('div');
  region.id = 'probe';
  region.insertAdjacentHTML('beforeend', markup);
  document.getElementById('fx-component').prepend(region);
  const list = region.querySelector('#list');
  if (list) {
    const head = list.querySelector('.ds-sticky--head');
    if (head) DS.dom.watchScrolled(list, head);
    DS.dom.scrollEdges(list, { axis: 'block' });
  }
  const board = region.querySelector('#board');
  if (board) DS.dom.scrollEdges(board);
}, html);

const ROWS = Array.from({ length: 20 }, (_, i) => `<p style="margin: 0; block-size: 40px">Ticket ${1040 + i}</p>`).join('');
const LIST = (head = '', foot = '', before = '') => `<div id="list" style="overflow: auto; position: relative; block-size: 300px">${before}${head}${ROWS}${foot}</div>`;
const HEAD = '<header class="ds-sticky ds-sticky--head" id="head" style="block-size: 48px">Tickets</header>';
const FOOT = '<div class="ds-sticky ds-sticky--foot" id="foot" style="block-size: 48px">3 selected</div>';

const edge = (page, id) => page.$eval(`#${id}`, (el) => Number(getComputedStyle(el, '::after').opacity));
const top = (page, id) => page.$eval(`#${id}`, (el) => Math.round(el.getBoundingClientRect().top - el.closest('#list, #board, #side-scroller').getBoundingClientRect().top));

/** Scrolls a probe scroller and waits for the watches (an IntersectionObserver, a frame) and the fade. */
async function scrollTo(page, id, options) {
  await page.$eval(`#${id}`, (el, to) => el.scrollTo({ ...to, behavior: 'instant' }), options);
  await page.waitForTimeout(100);
  await settle(page);
}

test('head: sticks to its scroller\'s top and raises its edge once rows pass under it, down again at the top', async ({ page }) => {
  await open(page);
  await add(page, LIST(HEAD));
  expect(await page.$eval('#head', (el) => getComputedStyle(el).position)).toBe('sticky');
  await settle(page);
  expect(await edge(page, 'head'), 'at the top nothing passes under it').toBe(0);
  await scrollTo(page, 'list', { top: 200 });
  expect(await top(page, 'head')).toBe(0);
  expect(await edge(page, 'head')).toBe(1);
  await scrollTo(page, 'list', { top: 0 });
  expect(await edge(page, 'head')).toBe(0);
  const after = await page.$eval('#head', (el) => {
    const style = getComputedStyle(el, '::after');
    return { line: style.borderBottomWidth, top: style.borderTopWidth, shadow: style.boxShadow !== 'none', z: style.zIndex };
  });
  expect(after).toEqual({ line: '1px', top: '0px', shadow: true, z: '-1' });
});

test('foot: sticks to the bottom and is raised while rows are hidden under it, flat at the end', async ({ page }) => {
  await open(page);
  await add(page, LIST('', FOOT));
  await page.waitForTimeout(100);
  await settle(page);
  const foot = await page.$eval('#foot', (el) => Math.round(el.closest('#list').getBoundingClientRect().bottom - el.getBoundingClientRect().bottom));
  expect(foot, 'at the bottom edge').toBe(0);
  expect(await edge(page, 'foot')).toBe(1);
  expect(await page.$eval('#foot', (el) => getComputedStyle(el, '::after').borderTopWidth)).toBe('1px');
  await scrollTo(page, 'list', { top: 10000 });
  expect(await edge(page, 'foot')).toBe(0);
  await scrollTo(page, 'list', { top: 100 });
  expect(await edge(page, 'foot')).toBe(1);
});

test('start column: stays at the inline start and raises its end edge once columns pass under it', async ({ page }) => {
  await open(page);
  const cells = Array.from({ length: 12 }, (_, i) => `<span style="inline-size: 100px; flex: none">Day ${i}</span>`).join('');
  await add(page, `<div id="board" style="overflow: auto; position: relative; inline-size: 400px"><div style="display: flex; inline-size: max-content">
    <span class="ds-sticky ds-sticky--start" id="start" style="inline-size: 120px; flex: none">LAPTOP-0042</span>${cells}
    <span class="ds-sticky ds-sticky--end" id="end" style="inline-size: 80px; flex: none">Total</span></div></div>`);
  await page.waitForTimeout(100);
  await settle(page);
  expect(await edge(page, 'start')).toBe(0);
  expect(await edge(page, 'end'), 'columns hidden under the end column').toBe(1);
  expect(await page.$eval('#start', (el) => getComputedStyle(el, '::after').borderRightWidth)).toBe('1px');
  expect(await page.$eval('#end', (el) => getComputedStyle(el, '::after').borderLeftWidth)).toBe('1px');
  await scrollTo(page, 'board', { left: 300 });
  expect(await page.$eval('#start', (el) => Math.round(el.getBoundingClientRect().left - el.closest('#board').getBoundingClientRect().left))).toBe(0);
  expect(await edge(page, 'start')).toBe(1);
  await scrollTo(page, 'board', { left: 100000 });
  expect(await edge(page, 'end')).toBe(0);
});

test('the offset hook: a head stops --ds-sticky-offset short of the edge; --flat never raises an edge', async ({ page }) => {
  await open(page);
  await add(page, LIST(HEAD.replace('id="head"', 'id="head" style="--ds-sticky-offset: 24px"').replace('style="block-size: 48px"', '')));
  await scrollTo(page, 'list', { top: 300 });
  expect(await top(page, 'head')).toBe(24);
  expect(await edge(page, 'head')).toBe(1);
  await page.$eval('#head', (el) => el.classList.add('ds-sticky--flat'));
  expect(await page.$eval('#head', (el) => getComputedStyle(el, '::after').display)).toBe('none');
});

test('on the scroll timeline the edge grows over the first --ds-space-2 of scroll', async ({ page }) => {
  await open(page);
  test.skip(!(await page.evaluate(() => CSS.supports('animation-timeline: scroll()'))), 'scroll-driven animations only: the DS.dom fallback switches the edge over --ds-dur-fast');
  await add(page, LIST(HEAD));
  await scrollTo(page, 'list', { top: 4 });
  const half = await edge(page, 'head');
  expect(half).toBeGreaterThan(0.3);
  expect(half).toBeLessThan(0.7);
  await scrollTo(page, 'list', { top: 8 });
  expect(await edge(page, 'head')).toBe(1);
});

test('the fill is opaque and above the rows; a side has no fill and no edge and keeps its own height', async ({ page }) => {
  await open(page);
  const head = page.locator('[data-demo="head"]');
  const style = await head.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, z: getComputedStyle(el).zIndex }));
  expect(style.bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(Number(style.z)).toBeGreaterThan(0);
  const side = page.locator('[data-demo="side"]');
  const read = await side.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, after: getComputedStyle(el, '::after').content, align: getComputedStyle(el).alignSelf, position: getComputedStyle(el).position }));
  expect(read).toEqual({ bg: 'rgba(0, 0, 0, 0)', after: 'none', align: 'start', position: 'sticky' });
  const scroller = page.locator('[data-demo="side-scroller"]');
  await scroller.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(50);
  const offset = await side.evaluate((el) => Math.round(el.getBoundingClientRect().top - el.closest('[data-demo="side-scroller"]').getBoundingClientRect().top));
  // Stuck at the inner edge of the scroller's padding (its border and its own padding: 17px), unless the narrow stage stacked it.
  const inset = await scroller.evaluate((el) => el.clientTop + parseFloat(getComputedStyle(el).paddingTop));
  const stacked = await page.evaluate(() => document.querySelector('[data-demo="side"]').getBoundingClientRect().width > 300);
  if (!stacked) expect(Math.abs(offset - inset)).toBeLessThanOrEqual(1);
});

test('the demo: named scrollable regions in the Tab order; the keyboard scrolls the list and the head stays', async ({ page }) => {
  await open(page);
  const list = page.getByRole('region', { name: 'Tickets' });
  await expect(list).toBeVisible();
  await expect(page.locator('[data-demo="board"]')).toHaveAttribute('tabindex', '0');
  // A header inside a named region is no banner: the region names the list, the heading names the head.
  expect(await page.locator('[data-demo="head"]').evaluate((el) => el.tagName)).toBe('HEADER');
  await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
  await list.focus();
  for (let i = 0; i < 6; i += 1) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(200);
  expect(await list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  const head = await page.locator('[data-demo="head"]').evaluate((el) => Math.round(el.getBoundingClientRect().top - el.parentElement.getBoundingClientRect().top));
  expect(head).toBeLessThanOrEqual(1);
  await settle(page);
  expect(Number(await page.locator('[data-demo="head"]').evaluate((el) => getComputedStyle(el, '::after').opacity))).toBe(1);
  // The flat toggle is a pressed button.
  const flat = page.getByRole('button', { name: /Flat head/ });
  await flat.click();
  await expect(flat).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('[data-demo="head"]').evaluate((el) => getComputedStyle(el, '::after').display)).toBe('none');
});

test('forced colours: the shadow goes, the hairline stays', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, LIST(HEAD));
  await scrollTo(page, 'list', { top: 200 });
  const after = await page.$eval('#head', (el) => ({ shadow: getComputedStyle(el, '::after').boxShadow, line: getComputedStyle(el, '::after').borderBottomStyle, width: getComputedStyle(el, '::after').borderBottomWidth, opacity: getComputedStyle(el, '::after').opacity }));
  expect(after).toEqual({ shadow: 'none', line: 'solid', width: '1px', opacity: '1' });
});

test('print: nothing sticks and no edge shows', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  const read = await page.locator('[data-demo="head"]').evaluate((el) => ({ position: getComputedStyle(el).position, after: getComputedStyle(el, '::after').display }));
  expect(read).toEqual({ position: 'static', after: 'none' });
});
