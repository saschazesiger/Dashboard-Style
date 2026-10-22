/**
 * The live tour (demo/, the start page on GitHub Pages): it starts without
 * a console error, the drawer follows the sections, and every stop works
 * end to end (a filter to the empty state and back, the confirm dialog with
 * its undo snackbar, the side sheet stepping through the devices, the menu,
 * a form's validation and combobox, the theme choice and the icon filter).
 * It runs in the `fallback` project too, so the tour also works on the
 * browser floor. `?live=0` stops the polling, so no live update moves a row
 * under a click.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const TOUR = '/demo/index.html?live=0';

/** Console errors and warnings, page errors and unhandled rejections of the page. */
function collectErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

async function open(page, hash = '') {
  // A fresh theme for every test: the choice is stored per origin.
  await page.addInitScript(() => { try { localStorage.removeItem('demo-theme'); } catch (error) { /* blocked */ } });
  await page.goto(TOUR + hash);
  await ready(page);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-demo-ready'));
  await settle(page);
}

test('starts without a console error; a drawer link takes the view to its section', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  await expect(page.locator('#facts .ds-tile')).toHaveCount(4);
  await expect(page.locator('#live-tiles .ds-tile')).toHaveCount(4);
  await expect(page.locator('#icon-grid .demo-icon')).toHaveCount(82);
  await expect(page.locator('html')).toHaveClass(/ds-ripples/);
  await expect(page.locator('#nav [aria-current="page"]')).toHaveAttribute('href', '#welcome');
  await page.locator('#nav a[href="#overlays"]').click();
  await expect(page.locator('#nav [aria-current="page"]')).toHaveAttribute('href', '#overlays');
  await expect(page.locator('#overlays-title')).toBeFocused();
  await expect.poll(() => page.locator('#overlays').evaluate((section) => {
    const view = document.getElementById('main');
    return Math.round(section.getBoundingClientRect().top - view.getBoundingClientRect().top);
  })).toBeLessThan(40);
  expect(new URL(page.url()).hash).toBe('#overlays');
  expect(errors).toEqual([]);
});

test('a search that leaves nothing shows the empty state; clearing the filters brings the rows back', async ({ page }) => {
  await open(page);
  const rows = page.locator('#live-body tr');
  const total = await rows.count();
  expect(total).toBeGreaterThan(0);
  await page.locator('#live-search').fill('no such device');
  await settle(page);
  await expect(rows).toHaveCount(0);
  await expect(page.locator('#live-empty .ds-empty')).toBeVisible();
  await page.locator('[data-clear-filters]').click();
  await settle(page);
  await expect(rows).toHaveCount(total);
  await expect(page.locator('#live-empty .ds-empty')).toHaveCount(0);
  await expect(page.locator('#live-search')).toBeFocused();
});

test('sorting by name puts the rows in order and turns the header', async ({ page }) => {
  await open(page);
  await page.locator('[data-sort="name"]').click();
  await settle(page);
  await expect(page.locator('#live-head th[aria-sort]')).toHaveAttribute('aria-sort', 'ascending');
  const names = await page.locator('#live-body [data-open]').allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
});

test('the dialog asks first and the snackbar offers an undo; the menu toggles its check', async ({ page }) => {
  await open(page);
  await page.locator('#open-dialog').click();
  await settle(page);
  await expect(page.locator('#confirm')).toHaveAttribute('data-state', 'open');
  await expect(page.locator('#confirm [autofocus]')).toBeFocused();
  await page.locator('#confirm-delete').click();
  const toast = page.locator('.ds-toast', { hasText: '3 devices deleted.' });
  await expect(toast).toBeVisible();
  await expect(page.locator('#open-dialog')).toBeFocused();
  await toast.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.ds-toast', { hasText: 'Restored.' })).toBeVisible();

  await page.locator('#open-menu').click();
  await settle(page);
  await expect(page.locator('#open-menu')).toHaveAttribute('aria-expanded', 'true');
  const pinned = page.locator('#demo-menu [role="menuitemcheckbox"]');
  await pinned.click();
  await expect(pinned).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('#open-menu')).toHaveAttribute('aria-expanded', 'false');
});

test('a row opens the side sheet, whose arrows step through the devices', async ({ page }) => {
  await open(page);
  const first = page.locator('#live-body [data-open]').first();
  await first.click();
  await settle(page);
  const name = await first.textContent();
  await expect(page.locator('#sheet-title')).toHaveText(name);
  await page.locator('#sheet [data-step="1"]').click();
  await settle(page);
  await expect(page.locator('#sheet-title')).not.toHaveText(name);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(page.locator('#sheet')).not.toHaveAttribute('open', '');
  await expect(first).toBeFocused();
});

test('the form shows its errors on submit, takes a model from the combobox and adds the device', async ({ page }) => {
  await open(page);
  await page.locator('#demo-form [type="submit"]').click();
  await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#f-name-error')).toHaveText('Give the device a name.');
  await expect(page.locator('#f-name')).toBeFocused();
  await page.locator('#f-name').fill('Lab printer');
  await expect(page.locator('#f-name')).not.toHaveAttribute('aria-invalid', 'true');
  await page.locator('#f-model').pressSequentially('rack');
  await expect(page.locator('#f-model')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#model-list [role="option"]')).toHaveCount(2);
  await page.locator('#f-model').press('ArrowDown');
  await page.locator('#f-model').press('Enter');
  await expect(page.locator('#f-model')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#f-model')).toHaveValue('Rack Server 1U');
  await page.locator('#demo-form [type="submit"]').click();
  await expect(page.locator('.ds-toast', { hasText: 'Lab printer added.' })).toBeVisible();
  await expect(page.locator('#f-name')).toHaveValue('');
});

test('the theme choice restyles the page through its tokens, shows its file and keeps the choice', async ({ page }) => {
  await open(page);
  const primary = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-primary').trim());
  const before = await primary();
  await expect(page.locator('#theme-code')).toContainText('nothing to override');
  await page.locator('#theme-form input[value="teal"]').check({ force: true });
  await page.locator('#theme-form input[value="square"]').check({ force: true });
  expect(await primary()).toBe('#006a6a');
  await expect(page.locator('#theme-code')).toContainText('--ds-primary: #006a6a;');
  await expect(page.locator('#theme-code')).toContainText('--ds-radius-action: 4px;');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('demo-theme')))).toEqual({ accent: 'teal', shape: 'square', density: 'comfortable' });
  await page.locator('#theme-form [type="reset"]').click();
  expect(await primary()).toBe(before);
  await expect(page.locator('#theme-form input[value="blue"]')).toBeChecked();
});

test('the icon filter narrows the grid and an unknown name shows the empty state', async ({ page }) => {
  await open(page);
  await page.locator('#icon-search').fill('arrow');
  await settle(page);
  await expect(page.locator('#icon-grid .demo-icon')).toHaveCount(4);
  await page.locator('#icon-search').fill('zzz');
  await settle(page);
  await expect(page.locator('#icon-grid .demo-icon')).toHaveCount(0);
  await expect(page.locator('#icon-empty .ds-empty')).toBeVisible();
});
