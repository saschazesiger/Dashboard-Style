/**
 * What 3.0 adds to the scroll areas, on their demo: the reel (a row, a share
 * of the panel per child, resting on the start of one, the gap at each
 * density), .ds-scroll-y (the fades on the block axis, the scrollbar's room,
 * the tab stop, keyboard scrolling), names, print and forced colours. The
 * 2.x behaviour of .ds-scroll-x and .ds-jump is test/browser/scroller.spec.js.
 * Runs in the `fallback` project too, where only the attributes of
 * DS.dom.scrollEdges() drive the fades.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=scroller');
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const edges = (locator) => locator.evaluate((el) => {
  const style = getComputedStyle(el);
  return [Number(style.getPropertyValue('--ds-scroll-edge-start')), Number(style.getPropertyValue('--ds-scroll-edge-end'))];
});

test('a reel: the children in a row, each a share of the panel, so the next peeks in; the scroll rests on the start of one', async ({ page }) => {
  await open(page);
  const reel = page.locator('[data-demo="reel"]');
  const measured = await reel.evaluate((el) => {
    const style = getComputedStyle(el);
    const [first, second] = el.children;
    return { display: style.display, snap: style.scrollSnapType, align: getComputedStyle(first).scrollSnapAlign, overflow: el.scrollWidth > el.clientWidth, sameRow: first.getBoundingClientRect().top === second.getBoundingClientRect().top, width: first.getBoundingClientRect().width, gap: second.getBoundingClientRect().left - first.getBoundingClientRect().right, panel: el.clientWidth };
  });
  expect(measured.display).toBe('flex');
  expect(measured.snap, 'proximity, the default strictness').toMatch(/^x( proximity)?$/);
  expect(measured.align).toContain('start');
  expect(measured.overflow).toBe(true);
  expect(measured.sameRow).toBe(true);
  expect(measured.width).toBeCloseTo(Math.min(280, (measured.panel - 8) * 0.8), 0);
  expect(measured.gap).toBe(16);
  // The cards inside take focus: Tab moves through them, each scrolled clear of the fades.
  await focusByKeyboard(page, reel.locator('a').nth(3));
  await settle(page);
  const visible = await reel.evaluate((el) => {
    const focused = document.activeElement.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return focused.left >= box.left && focused.left < box.right;
  });
  expect(visible).toBe(true);
});

test('the reel\'s gap follows the density; its children may set their width through the hook', async ({ page }) => {
  await open(page);
  const reel = page.locator('[data-demo="reel"]');
  for (const [density, step] of DENSITIES) {
    const gap = await reel.evaluate((el, cls) => {
      el.classList.add(cls);
      const [first, second] = el.children;
      const value = second.getBoundingClientRect().left - first.getBoundingClientRect().right;
      el.classList.remove(cls);
      return value;
    }, density);
    expect(gap, density).toBe(16 + step * 2);
  }
  const width = await reel.evaluate((el) => {
    el.style.setProperty('--ds-scroll-reel-item', '120px');
    return el.children[0].getBoundingClientRect().width;
  });
  expect(width).toBe(120);
});

test('a column scrolls down from --ds-scroll-max-height and fades at each end that still has content', async ({ page }) => {
  await open(page);
  const column = page.locator('[data-demo="column"]');
  const box = await column.evaluate((el) => ({ height: el.getBoundingClientRect().height, scrolls: el.scrollHeight > el.clientHeight, gutter: getComputedStyle(el).scrollbarGutter }));
  expect(box.height).toBe(160);
  expect(box.scrolls).toBe(true);
  expect(await edges(column)).toEqual([0, 1]);
  await column.evaluate((el) => { el.scrollTop = el.scrollHeight / 2 - el.clientHeight / 2; });
  await settle(page);
  expect(await edges(column)).toEqual([1, 1]);
  await column.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await settle(page);
  expect(await edges(column)).toEqual([1, 0]);
  // The mask turned to the block axis, the scrollbar strip opaque at the end.
  const mask = await column.evaluate((el) => ({ image: getComputedStyle(el).maskImage, size: getComputedStyle(el).maskSize, position: getComputedStyle(el).maskPosition }));
  expect(mask.image).not.toContain('to right');
  expect(mask.image).toContain('linear-gradient');
  expect(mask.position).toContain('100%');
});

test('a column is a tab stop: an inset ring, no mask while focused, the arrow keys scroll it', async ({ page, browserName }) => {
  await open(page);
  const column = page.locator('[data-demo="column"]');
  await expect(column).toHaveRole('region');
  await expect(column).toHaveAccessibleName('Activity');
  await focusByKeyboard(page, column);
  await settle(page);
  const focused = await column.evaluate((el) => {
    const style = getComputedStyle(el);
    return { outline: style.outlineStyle, offset: style.outlineOffset, mask: style.maskImage };
  });
  expect(focused).toEqual({ outline: 'solid', offset: '-2px', mask: 'none' });
  await column.evaluate((el) => { el.style.scrollBehavior = 'auto'; el.scrollTop = 0; });
  await page.keyboard.press('ArrowDown');
  if (browserName !== 'webkit') await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => document.querySelector('[data-demo="column"]').scrollTop > 0, null, { timeout: 3000 });
});

test('a strip that fits fades nowhere and has no scrollbar room', async ({ page }) => {
  await open(page);
  const fits = page.locator('[data-demo="fits"]');
  expect(await edges(fits)).toEqual([0, 0]);
  expect(await fits.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test('the jump pill floats in a block scroll area without taking room; it comes when the reader scrolls up', async ({ page }) => {
  await open(page);
  const log = page.locator('[data-demo="log"]');
  const pill = log.locator('.ds-presence');
  await log.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await settle(page);
  await expect(pill).toBeHidden();
  await log.evaluate((el) => { el.scrollTop = 0; });
  await expect(pill).toBeVisible();
  expect(await log.locator('.ds-jump').evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
  await expect(pill.getByRole('button', { name: 'Latest' })).toBeVisible();
});

test('print: the column shows all of its content, unmasked; a reel wraps', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  const read = (selector) => page.locator(selector).evaluate((el) => {
    const style = getComputedStyle(el);
    return { overflow: style.overflowX, mask: style.maskImage, wrap: style.flexWrap, maxHeight: style.maxHeight };
  });
  const column = await read('[data-demo="column"]');
  expect([column.overflow, column.mask, column.maxHeight]).toEqual(['visible', 'none', 'none']);
  expect((await read('[data-demo="reel"]')).wrap).toBe('wrap');
});

test('forced colours: the ring takes the system colour', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const strip = page.locator('[data-demo="strip"]');
  await focusByKeyboard(page, strip);
  await settle(page);
  expect(await strip.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
});
