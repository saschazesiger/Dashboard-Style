/**
 * DS.motion.sortable() (2.0) in real engines: a pointer drag on the grip
 * moves the row (data-ds-dragging while it moves, the others glide through
 * flip()) and lands it in its new place; ArrowUp, ArrowDown, Home and End
 * on the grip move it and keep the focus there; every move reports the
 * new order (onChange) and speaks the position through a polite region.
 * fixtures/helpers-2.html. Runs in the `fallback` project too.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/helpers-2.html');
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const order = (page) => page.evaluate(() => [...document.querySelectorAll('#steps > li')].map((row) => row.getAttribute('data-ds-key')));

/** The text of the polite region sortable() speaks through (after its task). */
async function spoken(page) {
  await page.waitForTimeout(50);
  return page.evaluate(() => [...document.querySelectorAll('[aria-live="polite"][data-ds-keep]')].map((region) => region.textContent).join(' | '));
}

test('the keyboard on the grip moves the row, keeps the focus and speaks the position', async ({ page }) => {
  await open(page);
  const grip = page.locator('[data-ds-key="backup"] .ds-grip');
  await grip.focus();
  await page.keyboard.press('ArrowDown');
  expect(await order(page)).toEqual(['update', 'backup', 'restart', 'report']);
  expect(await page.evaluate(() => window.fxOrder)).toEqual(['update', 'backup', 'restart', 'report']);
  await expect(grip).toBeFocused();
  expect(await spoken(page)).toBe('Moved to position 2 of 4');
  await page.keyboard.press('End');
  expect(await order(page)).toEqual(['update', 'restart', 'report', 'backup']);
  await expect(grip).toBeFocused();
  expect(await spoken(page)).toBe('Moved to position 4 of 4');
  await page.keyboard.press('ArrowDown');
  expect(await order(page), 'already last: nothing moves').toEqual(['update', 'restart', 'report', 'backup']);
  await page.keyboard.press('Home');
  expect(await order(page)).toEqual(['backup', 'update', 'restart', 'report']);
  // The others glide (flip()), from their old places.
  const glides = await page.evaluate(() => document.getAnimations().filter((animation) => animation.id === 'ds-flip').length);
  expect(glides).toBeGreaterThan(0);
  await settle(page);
});

test('a pointer drag on the grip carries the row past two others; it lands, settles and reports the order', async ({ page }) => {
  await open(page);
  const grip = page.locator('[data-ds-key="backup"] .ds-grip');
  const box = await grip.boundingBox();
  const row = await page.locator('[data-ds-key="backup"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Two rows and a bit down, in steps.
  for (let i = 1; i <= 10; i += 1) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + (row.height * 2.2 * i) / 10);
  const during = await page.evaluate(() => ({
    dragging: document.querySelector('[data-ds-key="backup"]').getAttribute('data-ds-dragging'),
    shadow: getComputedStyle(document.querySelector('[data-ds-key="backup"]')).boxShadow,
  }));
  expect(during.dragging).toBe('');
  expect(during.shadow).not.toBe('none');
  await page.mouse.up();
  expect(await order(page)).toEqual(['update', 'restart', 'backup', 'report']);
  expect(await page.evaluate(() => window.fxOrder)).toEqual(['update', 'restart', 'backup', 'report']);
  expect(await spoken(page)).toBe('Moved to position 3 of 4');
  await settle(page, { timeout: 5000 });
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const moved = document.querySelector('[data-ds-key="backup"]');
    return { dragging: moved.hasAttribute('data-ds-dragging'), translate: moved.style.translate, style: moved.getAttribute('style') };
  });
  expect(after).toEqual({ dragging: false, translate: '', style: null });
});

test('destroy() lets the list go', async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.fxSortable.destroy());
  await page.locator('[data-ds-key="backup"] .ds-grip').focus();
  await page.keyboard.press('ArrowDown');
  expect(await order(page)).toEqual(['backup', 'update', 'restart', 'report']);
});
