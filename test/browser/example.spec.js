/**
 * The reference app (example/, published on GitHub Pages): it starts
 * without a console error, every view renders and takes focus on its
 * title, and the main flows work end to end (filter to the empty state
 * and back, delete with the confirm dialog and undo, a ticket through the
 * dialog's validation and combobox, the accent of the theme). It runs in
 * the `fallback` project too, so the app also works on the browser floor.
 * `?live=0` stops the polling, so no live update moves a row under a click.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const APP = '/example/index.html?live=0';

/** Console errors and warnings, page errors and unhandled rejections of the page. */
function collectErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

async function open(page, hash = '') {
  await page.goto(APP + hash);
  await ready(page);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-ex-ready'));
  await settle(page);
}

test('starts without a console error and renders every view with focus on its title', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  await expect(page.locator('.ds-skeleton')).toHaveCount(0);
  await expect(page.locator('.ds-tile')).toHaveCount(4);
  await expect(page.locator('.ds-drawer__item[aria-current="page"]')).toHaveAttribute('data-route', 'overview');
  for (const [route, title] of [['devices', 'Devices'], ['tickets', 'Tickets'], ['settings', 'Settings'], ['overview', 'Overview']]) {
    await page.locator(`.ds-drawer__item[data-route="${route}"]`).click();
    await settle(page);
    await expect(page.locator('#page h1')).toHaveText(title);
    await expect(page.locator('#page h1')).toBeFocused();
    await expect(page.locator('.ds-drawer__item[aria-current="page"]')).toHaveAttribute('data-route', route);
    expect(new URL(page.url()).hash).toBe(`#/${route}`);
  }
  await page.goBack();
  await settle(page);
  await expect(page.locator('#page h1')).toHaveText('Settings');
  expect(errors).toEqual([]);
});

test('a tile opens the devices filtered by its status', async ({ page }) => {
  await open(page);
  await page.locator('.ds-tile[href="#/devices?status=warning"]').click();
  await settle(page);
  await expect(page.locator('#status-chips input[value="warning"]')).toBeChecked();
  const statuses = await page.locator('#devices-body .ds-status').allTextContents();
  expect(statuses.length).toBeGreaterThan(0);
  expect(new Set(statuses)).toEqual(new Set(['Update due']));
});

test('a search that leaves nothing shows the empty state; clearing the filters brings the rows back', async ({ page }) => {
  await open(page, '#/devices');
  const rows = page.locator('#devices-body tr');
  const total = await rows.count();
  expect(total).toBeGreaterThan(0);
  await page.locator('#q').fill('no such device');
  await settle(page);
  await expect(rows).toHaveCount(0);
  await expect(page.locator('#devices-empty')).toBeVisible();
  await page.locator('[data-act="clear-filters"]').click();
  await settle(page);
  await expect(rows).toHaveCount(total);
  await expect(page.locator('#devices-empty')).toBeHidden();
  await expect(page.locator('#q')).toBeFocused();
});

test('select all is indeterminate for some rows; deleting asks first and the snackbar undoes it', async ({ page }) => {
  await open(page, '#/devices');
  const rows = page.locator('#devices-body tr');
  const total = await rows.count();
  await page.locator('#devices-body tr').nth(0).locator('[data-select]').check();
  await page.locator('#devices-body tr').nth(1).locator('[data-select]').check();
  expect(await page.locator('#select-all').evaluate((box) => box.indeterminate)).toBe(true);
  await page.locator('[data-act="delete-selected"]').click();
  await settle(page);
  await expect(page.locator('#confirm')).toHaveAttribute('data-state', 'open');
  await expect(page.locator('#confirm-ok')).toHaveText('Delete 2 devices');
  await expect(page.locator('#confirm [autofocus]')).toBeFocused();
  await page.locator('#confirm-ok').click();
  await expect(rows).toHaveCount(total - 2);
  const toast = page.locator('.ds-toast', { hasText: '2 devices deleted.' });
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Undo' }).click();
  await expect(rows).toHaveCount(total);
  await expect(page.locator('.ds-toast', { hasText: '2 devices restored.' })).toBeVisible();
});

test('a row opens the side sheet, whose arrows step through the devices', async ({ page }) => {
  await open(page, '#/devices');
  const first = page.locator('#devices-body tr').nth(0).locator('[data-open]');
  const second = await page.locator('#devices-body tr').nth(1).locator('[data-open]').textContent();
  await first.click();
  await settle(page);
  await expect(page.locator('#sheet-title')).toHaveText(await first.textContent());
  await page.locator('#sheet-next').click();
  await settle(page);
  await expect(page.locator('#sheet-title')).toHaveText(second);
  await page.locator('#sheet [data-close].ds-btn').click();
  await settle(page);
  await expect(page.locator('#sheet')).not.toHaveAttribute('open', '');
  await expect(first).toBeFocused();
});

test('a new ticket shows its errors on submit, takes a device from the combobox and lands in the table', async ({ page }) => {
  await open(page, '#/tickets');
  const rows = page.locator('#tickets-body tr:not(.ds-table__detail)');
  const before = await rows.count();
  await page.locator('[data-act="new-ticket"]').click();
  await settle(page);
  await expect(page.locator('#ticket-subject')).toBeFocused();
  await page.locator('#ticket-form [type="submit"]').click();
  await expect(page.locator('#ticket-subject')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#ticket-device-error')).toHaveText('Choose a device.');
  await expect(page.locator('#ticket-subject')).toBeFocused();
  await page.locator('#ticket-subject').fill('Fan is loud');
  await expect(page.locator('#ticket-subject')).not.toHaveAttribute('aria-invalid', 'true');
  await page.locator('#ticket-device').pressSequentially('grace');
  await expect(page.locator('#ticket-device')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#ticket-device').press('ArrowDown');
  await page.locator('#ticket-device').press('Enter');
  await expect(page.locator('#ticket-device')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#ticket-device')).toHaveValue(/^[A-Z]+-\d{4}$/);
  await page.locator('#ticket-form [type="submit"]').click();
  await expect(rows).toHaveCount(before + 1);
  await expect(rows.first()).toContainText('Fan is loud');
  await expect(page.locator('.ds-toast', { hasText: 'created' })).toBeVisible();
});

test('the accent radio cards switch the theme through its tokens and keep the choice', async ({ page }) => {
  await open(page, '#/settings');
  const primary = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-primary').trim());
  const blue = await primary();
  await page.locator('.ds-radio', { hasText: 'Teal' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-ex-accent', 'teal');
  expect(await primary()).not.toBe(blue);
  await page.reload();
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-ex-accent', 'teal');
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-ex-ready'));
  await page.locator('.ds-radio', { hasText: 'Blue' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-ex-accent', /./);
  expect(await primary()).toBe(blue);
});
