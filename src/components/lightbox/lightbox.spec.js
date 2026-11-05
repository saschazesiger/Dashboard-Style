/**
 * The lightbox: a gallery item opens the viewer (a dialog, focus inside, back on
 * the item), the arrows, keys and thumbnails move, zoom and pan stay within the
 * image, Escape takes the zoom back first, swipe on touch, a failed image, the
 * list without a gallery, names, the phone and forced colours. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=lightbox');
  await ready(page);
  await page.mouse.move(1, 1);
}

const viewer = (page) => page.getByRole('dialog', { name: 'Photos of LAPTOP-0042' });

test('an item opens the viewer at its image; the arrows, keys and thumbnails move; focus goes back to the item', async ({ page }) => {
  await open(page);
  const items = page.locator('[data-demo="gallery"] .ds-lightbox__item');
  await items.nth(1).click();
  const box = viewer(page);
  await expect(box).toBeVisible();
  await settle(page);
  await expect(box.locator('.ds-lightbox__count')).toHaveText('Image 2 of 6');
  await expect(box.locator('.ds-lightbox__caption')).toHaveText('The keyboard: two keys are missing');
  await expect(box.getByRole('img', { name: 'The keyboard of LAPTOP-0042' })).toBeVisible();
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.ds-lightbox'))), 'focus inside').toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect(box.locator('.ds-lightbox__count')).toHaveText('Image 3 of 6');
  await page.keyboard.press('End');
  await expect(box.locator('.ds-lightbox__count')).toHaveText('Image 6 of 6');
  await page.keyboard.press('ArrowRight');
  await expect(box.locator('.ds-lightbox__count'), 'wraps round').toHaveText('Image 1 of 6');
  await box.getByRole('button', { name: 'Previous' }).click();
  await expect(box.locator('.ds-lightbox__count')).toHaveText('Image 6 of 6');
  const thumbs = box.getByRole('group', { name: 'Images' }).getByRole('button');
  await expect(thumbs).toHaveCount(6);
  await thumbs.nth(3).click();
  await expect(box.locator('.ds-lightbox__count')).toHaveText('Image 4 of 6');
  await expect(thumbs.nth(3)).toHaveAttribute('aria-current', 'true');
  await expect(thumbs.nth(3)).toHaveAccessibleName('Image 4 of 6: The label of LAPTOP-0042');
  // In the row of thumbnails the arrows move between them and show the image.
  await thumbs.nth(3).focus();
  await page.keyboard.press('ArrowRight');
  await expect(thumbs.nth(4)).toBeFocused();
  await expect(box.locator('.ds-lightbox__count')).toHaveText('Image 5 of 6');
  expect(await page.evaluate(() => [...document.querySelectorAll('[aria-live]')].some((region) => region.textContent.includes('Image 5 of 6')))).toBe(true);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(box).toBeHidden();
  await expect(items.nth(1), 'focus back on the item').toBeFocused();
});

test('zoom: the buttons and keys step 1, 2, 4; the pan stays within the image; Escape takes the zoom back first', async ({ page }) => {
  await open(page);
  await page.locator('[data-demo="gallery"] .ds-lightbox__item').first().click();
  const box = viewer(page);
  await settle(page);
  const frame = box.locator('.ds-lightbox__frame');
  const zoom = () => frame.evaluate((el) => Number(el.style.getPropertyValue('--ds-lightbox-zoom')));
  await expect(box.getByRole('button', { name: 'Zoom out' })).toHaveAttribute('aria-disabled', 'true');
  await box.getByRole('button', { name: 'Zoom in' }).click();
  expect(await zoom()).toBe(2);
  await expect(frame).toHaveAttribute('data-zoomed', '');
  await page.keyboard.press('+');
  expect(await zoom()).toBe(4);
  await expect(box.getByRole('button', { name: 'Zoom in' })).toHaveAttribute('aria-disabled', 'true');
  // Panned far to the right: clamped where the image's edge meets the frame's.
  for (let i = 0; i < 30; i += 1) await page.keyboard.press('ArrowLeft');
  const pan = await page.evaluate(() => {
    const frame = document.querySelector('.ds-lightbox__frame');
    const image = frame.querySelector('.ds-lightbox__image');
    const f = frame.getBoundingClientRect();
    const i = image.getBoundingClientRect();
    return { x: parseFloat(frame.style.getPropertyValue('--ds-lightbox-x')), imageLeft: i.left, frameLeft: f.left };
  });
  await settle(page);
  expect(pan.x).toBeGreaterThan(0);
  expect(await page.evaluate(() => {
    const frame = document.querySelector('.ds-lightbox__frame');
    return Math.round(frame.querySelector('.ds-lightbox__image').getBoundingClientRect().left - frame.getBoundingClientRect().left);
  }), 'the image still covers the frame').toBeLessThanOrEqual(1);
  await page.keyboard.press('Escape');
  expect(await zoom(), 'Escape: back to the fit').toBe(1);
  await expect(box).toBeVisible();
  await expect(frame).not.toHaveAttribute('data-zoomed', '');
  // A double click zooms to 2 there and back.
  const rect = await frame.boundingBox();
  await page.mouse.dblclick(rect.x + rect.width / 2, rect.y + rect.height / 2);
  expect(await zoom()).toBe(2);
  await page.keyboard.press('0');
  expect(await zoom()).toBe(1);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(box).toBeHidden();
});

test('a zoomed image pans with a drag that follows the pointer', async ({ page }) => {
  await open(page);
  await page.locator('[data-demo="gallery"] .ds-lightbox__item').first().click();
  const box = viewer(page);
  await settle(page);
  await box.getByRole('button', { name: 'Zoom in' }).click();
  await settle(page);
  const frame = box.locator('.ds-lightbox__frame');
  const rect = await frame.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2 + 60, rect.y + rect.height / 2 + 20, { steps: 5 });
  await expect(frame).toHaveAttribute('data-dragging', '');
  await page.mouse.up();
  await expect(frame).not.toHaveAttribute('data-dragging', '');
  const x = await frame.evaluate((el) => parseFloat(el.style.getPropertyValue('--ds-lightbox-x')));
  expect(x).toBeCloseTo(60, -1);
});

test('swipe on touch: past a fifth of the frame it goes on, a short one glides back', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'touch pointers are not emulated in Firefox');
  await open(page);
  await page.locator('[data-demo="gallery"] .ds-lightbox__item').first().click();
  const box = viewer(page);
  await settle(page);
  const swipe = (dx) => page.evaluate((dx) => {
    const frame = document.querySelector('.ds-lightbox__frame');
    const r = frame.getBoundingClientRect();
    const at = (type, x) => frame.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, clientX: x, clientY: r.top + r.height / 2, button: 0 }));
    const x0 = r.left + r.width / 2;
    at('pointerdown', x0);
    for (let i = 1; i <= 5; i += 1) at('pointermove', x0 + (dx * i) / 5);
    at('pointerup', x0 + dx);
  }, dx);
  await swipe(-60);
  await expect(box.locator('.ds-lightbox__count'), 'a short swipe stays').toHaveText('Image 1 of 6');
  await swipe(-400);
  await expect(box.locator('.ds-lightbox__count')).toHaveText('Image 2 of 6');
  await swipe(400);
  await expect(box.locator('.ds-lightbox__count')).toHaveText('Image 1 of 6');
});

test('an image that fails shows an icon and words; the list without a gallery goes once it closed', async ({ page }) => {
  await open(page);
  await page.locator('[data-demo="failing"] .ds-lightbox__item').nth(1).click();
  const box = page.getByRole('dialog', { name: 'Attachments of ticket #1042' });
  await expect(box.locator('.ds-lightbox__frame')).toHaveAttribute('data-failed', '');
  await expect(box.locator('.ds-lightbox__error')).toHaveText('The image could not be loaded.');
  await page.keyboard.press('Escape');
  await settle(page);
  const before = await page.locator('.ds-lightbox').count();
  await page.getByRole('button', { name: 'Show the photos of TABLET-0007' }).click();
  const list = page.getByRole('dialog', { name: 'Photos of TABLET-0007' });
  await expect(list).toBeVisible();
  await expect(list.locator('.ds-lightbox__count')).toHaveText('Image 1 of 3');
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(page.locator('.ds-lightbox')).toHaveCount(before);
  await expect(page.getByRole('button', { name: 'Show the photos of TABLET-0007' })).toBeFocused();
});

test('the phone: the viewer fills the window, the arrows over the image, touch-sized thumbnails under .ds-touch', async ({ page }) => {
  await open(page, 390);
  await page.evaluate(() => document.querySelector('#fx-component').classList.add('ds-touch'));
  await page.locator('[data-demo="gallery"] .ds-lightbox__item').first().click();
  const box = viewer(page);
  await settle(page);
  const seen = await page.evaluate(() => {
    const dialog = document.querySelector('.ds-lightbox[open], .ds-lightbox:not([hidden])');
    const rect = (selector) => dialog.querySelector(selector).getBoundingClientRect();
    return { box: rect('.ds-dialog__box').width, prev: rect('.ds-lightbox__nav--prev').left, frame: rect('.ds-lightbox__frame').left, thumb: rect('.ds-lightbox__thumb').width };
  });
  expect(seen.box).toBeCloseTo(390, 0);
  expect(seen.prev).toBeLessThan(seen.frame + 40);
  expect(seen.thumb).toBeGreaterThanOrEqual(48);
  await page.keyboard.press('Escape');
});

test('options: shape on the items and thumbnails, the gallery\'s columns', async ({ page }) => {
  await open(page);
  const radius = (around) => page.evaluate((around) => {
    const gallery = document.querySelector('[data-demo="gallery"]');
    gallery.parentElement.className = around;
    const value = parseFloat(getComputedStyle(gallery.querySelector('.ds-lightbox__item')).borderTopLeftRadius);
    gallery.parentElement.className = '';
    return value;
  }, around);
  const plain = await radius('');
  expect(plain).toBeGreaterThan(0);
  expect(await radius('ds-shape-square')).toBe(0);
  expect(await radius('ds-shape-round')).toBeCloseTo(plain * 1.5, 1);
  const columns = await page.locator('[data-demo="gallery"]').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(columns).toBeGreaterThanOrEqual(4);
});

test('forced colours: the current thumbnail\'s ring is SelectedItem, the items keep an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const edge = await page.locator('[data-demo="gallery"] .ds-lightbox__item').first().evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  await page.locator('[data-demo="gallery"] .ds-lightbox__item').first().click();
  await settle(page);
  const ring = await page.locator('.ds-lightbox__thumb[aria-current="true"]').evaluate((el) => getComputedStyle(el).boxShadow);
  expect(ring).not.toBe('none');
  await page.keyboard.press('Escape');
});
