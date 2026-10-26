/**
 * Touch density (CT-5): .ds-touch on the theme root sets every target hook
 * to --ds-touch-target (48px). The controls fixture rendered under it: every
 * interactive box is at least 48px. Hooks that other parts of 2.0 add are
 * read only once those parts exist; each has its row here, skipped (with
 * the owning package named) while ds.css does not read the hook yet, so the
 * row turns itself on when that package merges; the owner then adds the
 * markup the row measures (the integrator checks that no row still skips).
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const TARGET = 48;

/** Whether dist/ds.css reads the hook (the part that owns it has merged). */
async function reads(page, hook) {
  const css = await (await page.request.get('/dist/ds.css')).text();
  return css.includes(`var(${hook},`) || css.includes(`var(${hook})`);
}

async function open(page, { touch = true } = {}) {
  await page.goto('/test/browser/fixtures/controls.html');
  await ready(page);
  if (touch) await page.evaluate(() => document.querySelector('.ds-theme').classList.add('ds-touch'));
  await page.mouse.move(1, 1);
  await settle(page);
}

/** Like boxes(), but at least one must be rendered (the owner of a row adds the markup it measures). */
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

// The hooks other packages add (CT-5): each owning package turns its row on.
test('fields are 48px tall (--ds-input-height, WP8)', async ({ page }) => {
  test.skip(!(await reads(page, '--ds-input-height')), 'awaits --ds-input-height of WP8 (CT-5): the row turns on when it merges');
  await open(page);
  for (const box of await present(page, '.ds-input')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('check and radio rows are 48px tall (--ds-check-height, WP8)', async ({ page }) => {
  test.skip(!(await reads(page, '--ds-check-height')), 'awaits --ds-check-height of WP8 (CT-5): the row turns on when it merges');
  await open(page);
  for (const box of await present(page, '.ds-check')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('combobox options are 48px tall (--ds-combo-option-height, WP3)', async ({ page }) => {
  test.skip(!(await reads(page, '--ds-combo-option-height')), 'awaits --ds-combo-option-height of WP3 (CT-5): the row turns on when it merges');
  await open(page);
  for (const box of await present(page, '.ds-combo__option')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('menu items are 48px tall (--ds-menu-item-height, WP3)', async ({ page }) => {
  test.skip(!(await reads(page, '--ds-menu-item-height')), 'awaits --ds-menu-item-height of WP3 (CT-5): the row turns on when it merges');
  await open(page);
  for (const box of await present(page, '.ds-menu__item')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('the snackbar close button is 48px (--ds-toast-close-size, WP4)', async ({ page }) => {
  test.skip(!(await reads(page, '--ds-toast-close-size')), 'awaits --ds-toast-close-size of WP4 (CT-5): the row turns on when it merges');
  await open(page);
  for (const box of await present(page, '.ds-toast__close')) expect(box.width, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('disclosure summaries are 48px tall (--ds-disclosure-height, WP6)', async ({ page }) => {
  test.skip(!(await reads(page, '--ds-disclosure-height')), 'awaits --ds-disclosure-height of WP6 (CT-5): the row turns on when it merges');
  await open(page);
  for (const box of await present(page, '.ds-disclosure > summary')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('tabs are 48px tall (--ds-tabs-height, WP9)', async ({ page }) => {
  test.skip(!(await reads(page, '--ds-tabs-height')), 'awaits --ds-tabs-height of WP9 (CT-5): the row turns on when it merges');
  await open(page);
  for (const box of await present(page, '.ds-tabs [role="tab"]')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('the controls fixture under .ds-touch (settled shot)', async ({ page }) => {
  await open(page);
  await expect(page).toHaveScreenshot('controls-touch.png', { fullPage: true });
});
