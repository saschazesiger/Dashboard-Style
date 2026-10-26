/**
 * Touch density (CT-5): .ds-touch on the theme root sets every target hook
 * to --ds-touch-target (48px). The controls fixture rendered under it: every
 * interactive box is at least 48px: buttons, chips, switches, checks,
 * drawer items, fields, menu items, combobox options, the snackbar close
 * button, disclosure summaries and tabs (menu, list and snackbar opened
 * through DS.overlay).
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const TARGET = 48;

async function open(page, { touch = true } = {}) {
  await page.goto('/test/browser/fixtures/controls.html');
  await ready(page);
  if (touch) await page.evaluate(() => document.querySelector('.ds-theme').classList.add('ds-touch'));
  await page.mouse.move(1, 1);
  await settle(page);
}

/** Like boxes(), but at least one must be rendered. */
async function present(page, selector) {
  const found = await boxes(page, selector);
  expect(found.length, `${selector}: add it to controls.html`).toBeGreaterThan(0);
  return found;
}

/** Width and height of every element matching `selector` (rendered ones only), with a label. */
const boxes = (page, selector) => page.$$eval(selector, (elements) => elements
  .filter((el) => el.getClientRects().length)
  .map((el) => {
    const rect = el.getBoundingClientRect();
    return { name: `${el.className} ${el.id || el.textContent.trim().slice(0, 24)}`, width: rect.width, height: rect.height };
  }));

test('every button is at least 48px tall, icon buttons 48px round', async ({ page }) => {
  await open(page);
  const buttons = await boxes(page, '.ds-btn');
  expect(buttons.length).toBeGreaterThan(8);
  for (const box of buttons) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
  for (const box of await present(page, '.ds-btn--icon')) expect(box.width, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('chips, switches and drawer items take the touch target', async ({ page }) => {
  await open(page);
  const groups = [['.ds-chip__body', 'height'], ['.ds-switch', 'height'], ['.ds-drawer__item', 'height']];
  for (const [selector, side] of groups) {
    const found = await boxes(page, selector);
    expect(found.length, selector).toBeGreaterThan(0);
    for (const box of found) expect(box[side], box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
  }
  // The switch halo and the halo of checkboxes and radios span the target.
  const halo = await page.$eval('.ds-switch__track', (el) => parseFloat(getComputedStyle(el, '::before').width));
  expect(halo).toBe(TARGET);
  const spread = await page.$eval('.ds-check input', (el) => {
    const parts = getComputedStyle(el).boxShadow.match(/(-?\d*\.?\d+)px/g) || [];
    return { spread: parseFloat(parts[3]), size: el.getBoundingClientRect().width };
  });
  expect(spread.size + 2 * spread.spread).toBeCloseTo(TARGET, 0);
});

test('fields take the input type role under .ds-touch (no zoom on focus in iOS)', async ({ page }) => {
  await open(page);
  const size = await page.$eval('.ds-input', (el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);
});

test('without .ds-touch nothing changes (opt-in, never automatic)', async ({ page }) => {
  await open(page, { touch: false });
  const height = await page.$eval('#btn-outlined', (el) => el.getBoundingClientRect().height);
  expect(height).toBe(36);
  expect(await page.$eval('#btn-sm', (el) => el.getBoundingClientRect().height)).toBe(32);
});

test('fields are 48px tall (--ds-input-height)', async ({ page }) => {
  await open(page);
  for (const box of await present(page, '.ds-input')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('check and radio rows are 48px tall (--ds-check-height)', async ({ page }) => {
  await open(page);
  for (const box of await present(page, '.ds-check')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('combobox options are 48px tall (--ds-combo-option-height)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => DS.overlay.open(document.querySelector('#combo-popup'), { opener: document.querySelector('#combo-input') }));
  await settle(page);
  for (const box of await present(page, '.ds-combo__option')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('menu items are 48px tall (--ds-menu-item-height)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => DS.overlay.open(document.querySelector('#menu'), { opener: document.querySelector('#menu-trigger') }));
  await settle(page);
  for (const box of await present(page, '.ds-menu__item')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('the snackbar close button is 48px (--ds-toast-close-size)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => DS.overlay.toast(document.querySelector('#toasts'), 'Sync failed.', { kind: 'error', persistent: true }));
  await settle(page);
  for (const box of await present(page, '.ds-toast__close')) {
    expect(box.width, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
    expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
  }
});

test('disclosure summaries are 48px tall (--ds-disclosure-height)', async ({ page }) => {
  await open(page);
  for (const box of await present(page, '.ds-disclosure > summary')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('tabs are 48px tall (--ds-tabs-height)', async ({ page }) => {
  await open(page);
  for (const box of await present(page, '.ds-tabs [role="tab"]')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('the controls fixture under .ds-touch (settled shot)', async ({ page }) => {
  await open(page);
  await expect(page).toHaveScreenshot('controls-touch.png', { fullPage: true });
});
