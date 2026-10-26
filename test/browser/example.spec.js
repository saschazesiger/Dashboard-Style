/**
 * The reference app (example/, published on GitHub Pages): it starts
 * without a console error, every view renders (a navigation from the modal
 * drawer focuses its title), and the main flows work end to end (filter to the empty state
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

test('a navigation from the modal drawer lands on the new title (transition({ focus: true }), 2.0)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page);
  await page.locator('#menu').click();
  await settle(page);
  await page.locator('.ds-drawer__item[data-route="tickets"]').click();
  await settle(page);
  await expect(page.locator('#page h1')).toHaveText('Tickets');
  await expect(page.locator('#page h1')).toBeFocused();
});

test('dismissing an alert moves the focus to the same action of a neighbour, else to the title (flip() refocus, 2.0)', async ({ page }) => {
  await open(page);
  const dismiss = page.locator('#alerts [data-dismiss]');
  test.skip(await dismiss.count() === 0, 'the fake backend raised no alert');
  await dismiss.first().focus();
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(dismiss).toHaveCount(0);
  // The offline alert's "Show" is the same kind of action; without a neighbour the title takes it.
  const left = await page.locator('#alerts .ds-alert').count();
  if (left) await expect(page.locator('#alerts .ds-alert .ds-btn').first()).toBeFocused();
  else await expect(page.locator('#page h1')).toBeFocused();
});

test('starts without a console error and renders every view; a navigation that took the focus lands on the title', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  await expect(page.locator('.ds-skeleton')).toHaveCount(0);
  await expect(page.locator('.ds-tile')).toHaveCount(4);
  await expect(page.locator('.ds-drawer__item[aria-current="page"]')).toHaveAttribute('data-route', 'overview');
  for (const [route, title] of [['devices', 'Devices'], ['tickets', 'Tickets'], ['settings', 'Settings'], ['overview', 'Overview']]) {
    const item = page.locator(`.ds-drawer__item[data-route="${route}"]`);
    await item.click();
    await settle(page);
    await expect(page.locator('#page h1')).toHaveText(title);
    // transition({ focus: true }) (2.0): the docked drawer keeps its focus, so the next item is one Tab away.
    await expect(item).toBeFocused();
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
  // DS.overlay.confirm() built the dialog: destructive, so Cancel has the first focus.
  const confirm = page.locator('.ds-dialog[role="alertdialog"][data-state="open"]');
  await expect(confirm).toHaveCount(1);
  await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Delete 2 devices' }).click();
  await expect(rows).toHaveCount(total - 2);
  await expect(page.locator('.ds-dialog[role="alertdialog"]')).toHaveCount(0);
  const toast = page.locator('.ds-toast', { hasText: '2 devices deleted.' });
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Undo' }).click();
  await expect(rows).toHaveCount(total);
  await expect(page.locator('.ds-toast', { hasText: '2 devices restored.' })).toBeVisible();
});

test('a row opens the side sheet, whose arrows step through the devices', async ({ page }) => {
  await open(page, '#/devices');
  const first = page.locator('#devices-body tr').nth(0).locator('[data-device]');
  const second = await page.locator('#devices-body tr').nth(1).locator('[data-device]').textContent();
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

test('a view opened from the overview offers the way back in its page head', async ({ page }) => {
  await open(page);
  await page.locator('.ds-tile[href="#/devices?status=warning"]').click();
  await settle(page);
  const back = page.locator('#page .ds-page-head__back');
  await expect(back).toHaveText('Back to Overview');
  await expect(page.locator('#page .ds-page-head__actions [data-act="refresh"]')).toBeVisible();
  await back.click();
  await settle(page);
  await expect(page.locator('#page h1')).toHaveText('Overview');
  await page.locator('.ds-drawer__item[data-route="tickets"]').click();
  await settle(page);
  await expect(page.locator('#page .ds-page-head__back')).toHaveCount(0);
});

test('the sheet\'s tabs switch between Details and History, by click and by arrow key', async ({ page }) => {
  await open(page, '#/devices');
  await page.locator('#devices-body tr').nth(0).locator('[data-open]').click();
  await settle(page);
  const details = page.locator('#sheet-t-details');
  const history = page.locator('#sheet-t-history');
  await expect(details).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sheet-p-history')).toBeHidden();
  await expect(page.locator('#sheet-tabs > .ds-indicator')).toHaveCount(1);
  await history.click();
  await expect(history).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sheet-p-history')).toBeVisible();
  await expect(page.locator('#sheet-p-details')).toBeHidden();
  await settle(page);
  // The choice holds while the sheet steps to the next device.
  await page.locator('#sheet-next').click();
  await settle(page);
  await expect(history).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sheet-tabs > .ds-indicator')).toHaveCount(1);
  await history.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(details).toBeFocused();
  await expect(details).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sheet-p-details')).toBeVisible();
});

test('a drawer group closes and opens, shows its count while closed and keeps its state', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  const group = page.locator('#nav-design');
  const count = group.locator('summary .ds-drawer__count');
  await expect(count).toBeHidden();
  await group.locator('summary').click();
  await settle(page);
  await expect(group).not.toHaveAttribute('open', '');
  await expect(count).toBeVisible();
  await page.reload();
  await ready(page);
  await expect(page.locator('#nav-design')).not.toHaveAttribute('open', '');
  await page.locator('#nav-design summary').click();
  await expect(page.locator('#nav-design')).toHaveAttribute('open', '');
});

test('a lost connection shows the banner above the view; it goes once the backend answers', async ({ page }) => {
  await open(page, '#/settings');
  const toggle = page.locator('[data-setting="offline"]');
  await toggle.check({ force: true });
  const banner = page.locator('.ds-panel > .ds-banner');
  await expect(banner).toBeVisible();
  await expect(banner.locator('.ds-alert')).toHaveAttribute('role', 'status');
  await expect(banner).toContainText('offline');
  expect(await page.evaluate(() => document.querySelector('.ds-panel').firstElementChild.classList.contains('ds-banner'))).toBe(true);
  await banner.getByRole('button', { name: 'Retry' }).click();
  await expect(banner).toBeVisible();
  await toggle.uncheck({ force: true });
  await expect(banner).toHaveCount(0);
});
