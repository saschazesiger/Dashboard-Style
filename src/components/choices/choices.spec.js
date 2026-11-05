/**
 * The choice list (3.0): "select all" with its three states over the rows
 * that show and are not blocked, one ds:change per act, the count, the
 * filter with its marks and the empty line, Escape in the filter, columns
 * that read top to bottom, the scrolling box and forced colours. Runs on the
 * generated fixture of the demo, and in `fallback`.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=choices');
  await ready(page);
  await page.mouse.move(1, 1);
}

const root = (page, name) => page.locator(`[data-demo="${name}"]`);
const all = (page, name) => root(page, name).locator('[data-ds-choices-all]');
const value = (page, name) => page.evaluate((demo) => DS.get(document.querySelector(`[data-demo="${demo}"]`), 'choices').get(), name);
const state = (locator) => locator.evaluate((box) => (box.indeterminate ? 'some' : box.checked ? 'all' : 'none'));

test('select all: some shows the dash; a press checks every usable box, the next one none; one ds:change each', async ({ page }) => {
  await open(page);
  const box = all(page, 'short');
  await expect(root(page, 'short').locator('.ds-choices__count')).toHaveText('2 selected');
  expect(await state(box)).toBe('some');
  await page.evaluate(() => {
    window.__changes = [];
    window.__native = 0;
    const el = document.querySelector('[data-demo="short"]');
    el.addEventListener('ds:change', (event) => window.__changes.push(event.detail.value));
    el.querySelector('.ds-choices__list').addEventListener('change', () => { window.__native += 1; });
  });
  await box.click();
  expect(await value(page, 'short')).toEqual(['Email', 'Chat', 'Text message']);
  expect(await state(box)).toBe('all');
  await expect(root(page, 'short').locator('.ds-choices__count')).toHaveText('All selected');
  await expect(page.locator('.ds-toasts [aria-live], .ds-sr[aria-live]').filter({ hasText: 'All selected' })).toHaveCount(1);
  await box.press('Space');
  expect(await value(page, 'short')).toEqual([]);
  expect(await state(box)).toBe('none');
  await expect(root(page, 'short').locator('.ds-choices__count')).toHaveText('');
  expect(await page.evaluate(() => window.__changes)).toEqual([['Email', 'Chat', 'Text message'], []]);
  expect(await page.evaluate(() => window.__native)).toBe(4);
  // One box by hand: the summary follows.
  await root(page, 'short').getByLabel('Chat').check();
  expect(await state(box)).toBe('some');
  await expect(page.locator('[data-demo-out="short"]')).toHaveText('Chat');
});

test('the filter hides what does not match, marks the letters, and "select all" acts on what shows', async ({ page }) => {
  await open(page);
  const search = root(page, 'long').locator('.ds-choices__search');
  await search.fill('wing ea');
  const shown = root(page, 'long').locator('.ds-choices__list > .ds-check:visible');
  await expect(shown).toHaveCount(1);
  await expect(shown.first()).toHaveText('East wing');
  await expect(shown.first().locator('.ds-choices__match')).toHaveText(['Ea', 'wing']);
  const weight = await shown.first().locator('.ds-choices__match').first().evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(weight).toBe('underline');
  const before = await value(page, 'long');
  await all(page, 'long').check();
  const after = await value(page, 'long');
  expect(after).toHaveLength(before.length + 1);
  expect(after).toContain('East wing');
  await search.fill('zzz');
  await expect(root(page, 'long').locator('.ds-choices__empty')).toBeVisible();
  await expect(all(page, 'long')).toBeDisabled();
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(root(page, 'long').locator('.ds-choices__empty')).toBeHidden();
  await expect(root(page, 'long').locator('.ds-choices__list > .ds-check:visible')).toHaveCount(36);
  await expect(root(page, 'long').locator('.ds-choices__match')).toHaveCount(0);
});

test('columns fill row by row, the box scrolls on its own and fades its cut edge', async ({ page }) => {
  await open(page);
  const list = root(page, 'long').locator('.ds-choices__list');
  const boxes = await list.evaluate((el) => {
    const rows = [...el.children].map((row) => row.getBoundingClientRect());
    return { first: rows[0], second: rows[1], height: el.getBoundingClientRect().height, scroll: el.scrollHeight, columns: getComputedStyle(el).gridTemplateColumns.split(' ').length };
  });
  expect(boxes.second.top).toBeCloseTo(boxes.first.top, 0);
  expect(boxes.second.left).toBeGreaterThan(boxes.first.left);
  expect(boxes.columns).toBeLessThanOrEqual(4);
  expect(boxes.height).toBeLessThanOrEqual(264 + 1);
  expect(boxes.scroll).toBeGreaterThan(boxes.height);
  await expect(list).toHaveAttribute('data-ds-overflow-end', '');
});

test('a narrow list keeps one column; a checked row takes the label weight', async ({ page }) => {
  await open(page);
  await page.setViewportSize({ width: 360, height: 800 });
  const list = root(page, 'long').locator('.ds-choices__list');
  const lefts = await list.evaluate((el) => [...el.children].slice(0, 3).map((row) => Math.round(row.getBoundingClientRect().left)));
  expect(new Set(lefts).size).toBe(1);
  const weights = await root(page, 'short').locator('.ds-check').evaluateAll((rows) => rows.map((row) => getComputedStyle(row).fontWeight));
  expect(weights[0]).not.toBe(weights[1]);
});

test('forced colours: the scrolling box keeps its border', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const border = await root(page, 'long').locator('.ds-choices__list').evaluate((el) => getComputedStyle(el).borderTopStyle + ' ' + getComputedStyle(el).borderTopWidth);
  expect(border).toBe('solid 1px');
});
