/**
 * The bottom sheet: modal at the bottom edge, its detents (the handle's click
 * and keys, said), a drag that follows the finger, settles at a detent or
 * dismisses, the width, the options, names and forced colours. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 390) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=bottomsheet');
  await ready(page);
  await page.mouse.move(1, 1);
}

const top = (page, selector = '[data-demo="filters"]') => page.evaluate((selector) => Math.round(document.querySelector(`${selector} .ds-bottomsheet__panel`).getBoundingClientRect().top), selector);

test('it opens modal at its smallest detent; the handle steps the detents and says each; Escape closes and focus goes back', async ({ page }) => {
  await open(page);
  const trigger = page.getByRole('button', { name: 'Filters' });
  await trigger.click();
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  await expect(sheet).toBeVisible();
  await settle(page);
  const panelHeight = await page.evaluate(() => document.querySelector('[data-demo="filters"] .ds-bottomsheet__panel').getBoundingClientRect().height);
  expect(panelHeight).toBeCloseTo(800 - 48, 0);
  expect(await top(page), 'half of it shows').toBeCloseTo(800 - panelHeight / 2, -1);
  const handle = sheet.getByRole('button', { name: 'Resize the filters' });
  await expect(handle, 'focus on the handle').toBeFocused();
  await page.keyboard.press('ArrowUp');
  await settle(page);
  expect(await top(page)).toBeCloseTo(48, 0);
  expect(await page.evaluate(() => [...document.querySelectorAll('[aria-live]')].some((region) => region.textContent.includes('Sheet at 100 percent of the screen')))).toBe(true);
  await page.keyboard.press('ArrowDown');
  await settle(page);
  expect(await top(page)).toBeCloseTo(800 - panelHeight / 2, -1);
  await page.keyboard.press('Enter');
  await settle(page);
  expect(await top(page), 'Enter: the next detent').toBeCloseTo(48, 0);
  expect(await page.evaluate(() => DS.bottomsheet.create(document.querySelector('[data-demo="filters"]')).get())).toMatchObject({ open: true, detent: 1, index: 1 });
  expect(await page.evaluate(() => document.body.classList.contains('ds-no-scroll') || document.querySelectorAll('[inert]').length > 0 || Boolean(document.querySelector('dialog[open]:modal')))).toBe(true);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('at the smallest detent the foot sits at the window\'s edge and the body scrolls within what shows', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Filters' }).click();
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  await settle(page);
  const show = sheet.getByRole('button', { name: 'Show devices' });
  await show.focus();
  const seen = await page.evaluate(() => {
    const panel = document.querySelector('[data-demo="filters"] .ds-bottomsheet__panel');
    const button = [...panel.querySelectorAll('.ds-sheet__foot .ds-btn')].at(-1).getBoundingClientRect();
    const body = panel.querySelector('.ds-sheet__body');
    return { bottom: Math.round(button.bottom), body: Math.round(body.getBoundingClientRect().bottom), scrolls: body.scrollHeight > body.clientHeight };
  });
  expect(seen.bottom, 'the primary action is inside the window').toBeLessThanOrEqual(800);
  expect(seen.body).toBeLessThanOrEqual(800);
  expect(seen.scrolls, 'the body scrolls within what shows').toBe(true);
  await page.keyboard.press('Escape');
  await settle(page);
});

test('a drag from the handle follows the finger, settles at the nearest detent, and dismisses below half the smallest', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Filters' }).click();
  await settle(page);
  const handle = page.locator('[data-demo="filters"] .ds-bottomsheet__handle');
  const drag = async (dy, steps = 8) => {
    const box = await handle.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= steps; i += 1) await page.mouse.move(x, y + (dy * i) / steps);
    return async () => { await page.mouse.up(); };
  };
  const start = await top(page);
  const release = await drag(-200, 10);
  await expect(page.locator('[data-demo="filters"] .ds-bottomsheet__panel')).toHaveAttribute('data-dragging', '');
  expect(await top(page), 'it follows the finger').toBeCloseTo(start - 200, -1);
  await release();
  await settle(page);
  expect(await top(page), 'nearer the full height').toBeCloseTo(48, 0);
  const releaseDown = await drag(600, 12);
  await releaseDown();
  await settle(page);
  await expect(page.getByRole('dialog', { name: 'Filters' }), 'dragged down: dismissed').toBeHidden();
});

test('a sheet without detents is as tall as its content; a drag down still dismisses it', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Actions for LAPTOP-0042' }).click();
  await settle(page);
  const height = await page.evaluate(() => document.querySelector('[data-demo="actions"] .ds-bottomsheet__panel').getBoundingClientRect().height);
  expect(height).toBeLessThan(400);
  expect(await top(page, '[data-demo="actions"]')).toBeCloseTo(800 - height, 0);
  const box = await page.locator('[data-demo="actions"] .ds-sheet__head').boundingBox();
  await page.mouse.move(box.x + 20, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + box.height / 2 + 120, { steps: 6 });
  await page.mouse.up();
  await settle(page);
  await expect(page.getByRole('dialog', { name: 'LAPTOP-0042' })).toBeHidden();
});

test('wide screens: at most 640px, centred; shape on the top corners; touch on the handle', async ({ page }) => {
  await open(page, 1280);
  await page.evaluate(() => document.querySelector('#fx-component > div').classList.add('ds-touch'));
  await page.getByRole('button', { name: 'Filters' }).click();
  await settle(page);
  const seen = await page.evaluate(() => {
    const panel = document.querySelector('[data-demo="filters"] .ds-bottomsheet__panel');
    const rect = panel.getBoundingClientRect();
    return { width: rect.width, left: rect.left, radius: parseFloat(getComputedStyle(panel).borderTopLeftRadius), bottomRadius: parseFloat(getComputedStyle(panel).borderBottomLeftRadius), handle: document.querySelector('[data-demo="filters"] .ds-bottomsheet__handle').getBoundingClientRect().height };
  });
  expect(seen.width).toBeCloseTo(640, 0);
  expect(seen.left).toBeCloseTo((1280 - 640) / 2, 0);
  expect(seen.radius).toBeGreaterThan(0);
  expect(seen.bottomRadius).toBe(0);
  expect(seen.handle).toBeGreaterThanOrEqual(48);
  await page.keyboard.press('Escape');
  await settle(page);
  await page.evaluate(() => document.querySelector('#fx-component > div').classList.replace('ds-touch', 'ds-shape-square'));
  await page.getByRole('button', { name: 'Filters' }).click();
  await settle(page);
  expect(await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-demo="filters"] .ds-bottomsheet__panel')).borderTopLeftRadius))).toBe(0);
  await page.keyboard.press('Escape');
});

test('forced colours: the handle\'s pill in system colours, the panel keeps its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await page.getByRole('button', { name: 'Filters' }).click();
  await settle(page);
  const seen = await page.evaluate(() => {
    const panel = document.querySelector('[data-demo="filters"] .ds-bottomsheet__panel');
    const pill = getComputedStyle(panel.querySelector('.ds-bottomsheet__handle'), '::before');
    return { pill: pill.backgroundColor, opacity: pill.opacity, edge: getComputedStyle(panel).outlineColor };
  });
  expect(seen.opacity).toBe('1');
  expect(seen.pill).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  expect(seen.edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  await page.keyboard.press('Escape');
});
