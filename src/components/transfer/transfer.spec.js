/**
 * The transfer list (3.0): marking and moving by the buttons, Enter and a
 * double-click, the buttons' disabled state, the order on each side, a
 * blocked option, announcements, ds:change, the filter, windowed data, the
 * stacked layout when narrow, and forced colours. Runs on the generated
 * fixture of the demo, and in `fallback`.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=transfer');
  await ready(page);
  await page.mouse.move(1, 1);
}

const role = (page) => page.locator('[data-demo="role"]');
const side = (page, which) => role(page).locator(`[data-ds-transfer-side="${which}"] .ds-transfer__list`);
const names = (list) => list.locator('.ds-listbox__name').allTextContents();
const value = (page, demo = 'role') => page.evaluate((name) => DS.transfer.create(document.querySelector(`[data-demo="${name}"]`)).get(), demo);

test('mark and move by the buttons; the buttons wait for a mark; the target keeps the order they came in', async ({ page }) => {
  await open(page);
  const add = role(page).locator('[data-ds-transfer-add]');
  const remove = role(page).locator('[data-ds-transfer-remove]');
  await expect(add).toBeDisabled();
  await expect(remove).toBeDisabled();
  await side(page, 'source').locator('[data-value="wipe"]').click();
  await side(page, 'source').locator('[data-value="edit"]').click();
  await expect(add).toBeEnabled();
  await add.click();
  expect(await value(page)).toEqual(['read', 'edit', 'wipe']);
  expect(await names(side(page, 'target'))).toEqual(['Read devices', 'Edit devices', 'Wipe devices']);
  await expect(page.locator('.ds-toasts [aria-live], .ds-sr[aria-live]').filter({ hasText: 'Moved 2 to Granted' })).toHaveCount(1);
  await expect(page.locator('[data-demo-out]')).toHaveText('Granted: read, edit, wipe');
  // The moved ones stay marked: one press takes them back, into their first places.
  await expect(add).toBeDisabled();
  await expect(remove).toBeEnabled();
  await remove.click();
  expect(await value(page)).toEqual(['read']);
  expect((await names(side(page, 'source'))).slice(0, 3)).toEqual(['Edit devices', 'Restart devices', 'Wipe devices']);
});

test('Enter moves the marked or the active option and keeps the focus in the list; a double-click moves one', async ({ page }) => {
  await open(page);
  const source = side(page, 'source');
  await source.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  expect(await value(page)).toEqual(['read', 'restart']);
  await expect(source).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Enter');
  expect((await value(page)).length).toBe(4);
  await side(page, 'target').locator('[data-value="read"]').dblclick();
  expect(await value(page)).not.toContain('read');
});

test('a blocked option stays where it is', async ({ page }) => {
  await open(page);
  await side(page, 'source').focus();
  await page.keyboard.press('Control+a');
  await role(page).locator('[data-ds-transfer-add]').click();
  expect(await value(page)).not.toContain('owner');
  await expect(side(page, 'source').locator('[data-value="owner"]')).toHaveAttribute('aria-disabled', 'true');
});

test('the filter narrows a side and marks the letters', async ({ page }) => {
  await open(page);
  await role(page).locator('.ds-transfer__search').first().fill('dev');
  await expect(side(page, 'source').locator('.ds-listbox__option')).toHaveCount(3);
  await expect(side(page, 'source').locator('.ds-listbox__match').first()).toHaveText('dev');
});

test('3,000 options as data: windowed on both sides', async ({ page }) => {
  await open(page);
  const devices = page.locator('[data-demo="devices"]');
  expect(await devices.locator('[data-ds-transfer-side="source"] .ds-listbox__option').count()).toBeLessThan(80);
  expect(await value(page, 'devices')).toEqual(['d-3', 'd-7']);
  await expect(devices.locator('[data-ds-transfer-side="source"] .ds-listbox__option').first()).toHaveAttribute('aria-setsize', '2998');
});

test('narrow: the sides stack and the buttons stand in a row between them', async ({ page }) => {
  await open(page);
  await role(page).evaluate((el) => { el.style.inlineSize = '360px'; });
  const boxes = await role(page).evaluate((el) => ['[data-ds-transfer-side="source"]', '.ds-transfer__actions', '[data-ds-transfer-side="target"]'].map((s) => el.querySelector(s).getBoundingClientRect().top));
  expect(boxes[1]).toBeGreaterThan(boxes[0]);
  expect(boxes[2]).toBeGreaterThan(boxes[1]);
  const turned = await role(page).locator('.ds-transfer__actions svg').first().evaluate((svg) => getComputedStyle(svg).rotate);
  expect(turned).toBe('90deg');
});

test('forced colours: the lists keep their edge', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  expect(await side(page, 'source').evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
});
