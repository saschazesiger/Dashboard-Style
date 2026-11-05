/**
 * The select panel (3.0): opening through DS.overlay with the focus in the
 * filter, the keys (arrows, Enter, Ctrl+Enter), pending until Apply,
 * Escape and a press outside discarding, the summary, one value applied on
 * the choice, data windowed, the filter's empty line, names and states, the
 * placement and forced colours. Runs on the generated fixture of the demo,
 * and in `fallback` (no anchor positioning: the absolute panel).
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=selectpanel');
  await ready(page);
  await page.mouse.move(1, 1);
}

const root = (page, name) => page.locator(`[data-demo="${name}"]`);
const trigger = (page, name) => root(page, name).locator('.ds-selectpanel__trigger');
const panel = (page, name) => root(page, name).locator('.ds-selectpanel__panel');
const value = (page, name) => page.evaluate((demo) => DS.get(document.querySelector(`[data-demo="${demo}"]`), 'selectpanel').get(), name);

test('the button names the panel and its state; the panel opens with the focus in the filter, below the button', async ({ page }) => {
  await open(page);
  const button = trigger(page, 'labels');
  await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button.locator('.ds-selectpanel__summary')).toHaveText('Bug and Urgent');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(panel(page, 'labels')).toHaveAttribute('data-state', 'open');
  await expect(panel(page, 'labels')).toHaveAttribute('role', 'dialog');
  await expect(root(page, 'labels').locator('.ds-selectpanel__search')).toBeFocused();
  await settle(page);
  const boxes = await page.evaluate(() => {
    const el = document.querySelector('[data-demo="labels"]');
    return { button: el.querySelector('.ds-selectpanel__trigger').getBoundingClientRect().toJSON(), panel: el.querySelector('.ds-selectpanel__panel').getBoundingClientRect().toJSON() };
  });
  expect(boxes.panel.top).toBeGreaterThanOrEqual(boxes.button.bottom);
  expect(Math.abs(boxes.panel.left - boxes.button.left)).toBeLessThan(2);
});

test('keys: the arrows move the active option, Enter checks it, Ctrl+Enter applies; the change comes once', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.__changes = [];
    document.querySelector('[data-demo="labels"]').addEventListener('ds:change', (event) => window.__changes.push(event.detail.value));
  });
  await trigger(page, 'labels').focus();
  await page.keyboard.press('ArrowDown');
  const search = root(page, 'labels').locator('.ds-selectpanel__search');
  await expect(search).toBeFocused();
  // The first chosen option is active on open.
  const active = () => search.evaluate((el) => document.getElementById(el.getAttribute('aria-activedescendant'))?.querySelector('.ds-listbox__name')?.textContent);
  expect(await active()).toBe('Bug');
  await page.keyboard.press('ArrowDown');
  expect(await active()).toBe('Docs');
  await page.keyboard.press('Enter');
  await expect(root(page, 'labels').locator('[data-value="docs"]')).toHaveAttribute('aria-selected', 'true');
  // Pending: nothing applied yet.
  expect(await value(page, 'labels')).toEqual(['bug', 'urgent']);
  await page.keyboard.press('Control+Enter');
  await expect(trigger(page, 'labels')).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger(page, 'labels')).toBeFocused();
  expect(await value(page, 'labels')).toEqual(['bug', 'docs', 'urgent']);
  expect(await page.evaluate(() => window.__changes)).toEqual([['bug', 'docs', 'urgent']]);
  await expect(trigger(page, 'labels').locator('.ds-selectpanel__summary')).toHaveText('3 selected');
  await expect(page.locator('[data-demo-out]')).toHaveText('Applied: bug, docs, urgent');
});

test('Escape and a press outside discard; the first Escape in a filled filter clears it', async ({ page }) => {
  await open(page);
  await trigger(page, 'labels').click();
  await root(page, 'labels').locator('[data-value="docs"]').click();
  await page.keyboard.type('net');
  await expect(root(page, 'labels').locator('.ds-listbox__option:visible')).toHaveCount(1);
  await expect(root(page, 'labels').locator('.ds-listbox__match')).toHaveText(['Net']);
  await page.keyboard.press('Escape');
  await expect(root(page, 'labels').locator('.ds-selectpanel__search')).toHaveValue('');
  await expect(trigger(page, 'labels')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(trigger(page, 'labels')).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger(page, 'labels')).toBeFocused();
  expect(await value(page, 'labels')).toEqual(['bug', 'urgent']);
  // Reopened: the pending choice is gone.
  await trigger(page, 'labels').click();
  await expect(root(page, 'labels').locator('[data-value="docs"]')).toHaveAttribute('aria-selected', 'false');
  await root(page, 'labels').locator('[data-value="docs"]').click();
  await page.mouse.click(5, 5);
  await expect(panel(page, 'labels')).toBeHidden();
  expect(await value(page, 'labels')).toEqual(['bug', 'urgent']);
});

test('Clear and Apply by the pointer; nothing found says so', async ({ page }) => {
  await open(page);
  await trigger(page, 'labels').click();
  await root(page, 'labels').locator('.ds-selectpanel__search').fill('zzz');
  await expect(root(page, 'labels').locator('.ds-selectpanel__status')).toHaveText('No results');
  await root(page, 'labels').locator('.ds-selectpanel__search').fill('');
  await root(page, 'labels').locator('[data-ds-selectpanel-clear]').click();
  await expect(root(page, 'labels').locator('[aria-selected="true"]')).toHaveCount(0);
  await root(page, 'labels').locator('[data-ds-selectpanel-apply]').click();
  await expect(panel(page, 'labels')).toBeHidden();
  expect(await value(page, 'labels')).toEqual([]);
  await expect(trigger(page, 'labels').locator('.ds-selectpanel__summary')).toBeHidden();
  await expect(page.locator('.ds-toasts [aria-live], .ds-sr[aria-live]').filter({ hasText: '0 selected' })).toHaveCount(1);
});

test('one value applies and closes on the choice; a list without a filter is the tab stop', async ({ page }) => {
  await open(page);
  await trigger(page, 'assignee').click();
  const list = root(page, 'assignee').locator('.ds-selectpanel__list');
  await expect(list).toBeFocused();
  // The first option is active on focus; one step on.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(panel(page, 'assignee')).toBeHidden();
  expect(await value(page, 'assignee')).toBe('u1');
  await expect(trigger(page, 'assignee').locator('.ds-selectpanel__summary')).toHaveText('Alan Turing');
});

test('2,000 options as data: windowed, filtered, the active one rendered', async ({ page }) => {
  await open(page);
  await trigger(page, 'devices').click();
  const options = root(page, 'devices').locator('.ds-listbox__option');
  expect(await options.count()).toBeLessThan(80);
  await page.keyboard.type('mon 1999');
  await expect(root(page, 'devices').locator('.ds-listbox__option').first()).toContainText('Monitor 1999');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Control+Enter');
  expect(await value(page, 'devices')).toEqual(['d-999']);
});

test('a disabled button does not open', async ({ page }) => {
  await open(page);
  const sites = page.locator('.ds-selectpanel:has(.ds-selectpanel__trigger:disabled)');
  await expect(sites.locator('.ds-selectpanel__trigger')).toBeDisabled();
  await sites.locator('.ds-selectpanel__trigger').click({ force: true });
  await expect(sites.locator('.ds-selectpanel__panel')).toBeHidden();
  await expect(sites.locator('.ds-selectpanel__summary')).toHaveText('North building');
});

test('forced colours: the panel keeps an edge', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await trigger(page, 'labels').click();
  const outline = await panel(page, 'labels').evaluate((el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth);
  expect(outline).toBe('solid 1px');
});
