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
  // The devices come in pages; the range counts them all.
  const range = page.locator('#devices-range');
  const all = Number(/of (\d+)$/.exec(await range.textContent())[1]);
  const picked = [await rows.nth(0).locator('[data-device]').textContent(), await rows.nth(1).locator('[data-device]').textContent()];
  await page.locator('#devices-body tr').nth(0).locator('[data-select]').check();
  // The selection bar takes the toolbar's place; its count changes at once.
  await expect(page.locator('#bulk .ds-selection-bar__count')).toHaveText('1 selected');
  await page.locator('#devices-body tr').nth(1).locator('[data-select]').check();
  await expect(page.locator('#bulk .ds-selection-bar__count')).toHaveText('2 selected');
  expect(await page.locator('#select-all').evaluate((box) => box.indeterminate)).toBe(true);
  await page.locator('[data-act="delete-selected"]').click();
  await settle(page);
  // DS.overlay.confirm() built the dialog: destructive, so Cancel has the first focus.
  const confirm = page.locator('.ds-dialog[role="alertdialog"][data-state="open"]');
  await expect(confirm).toHaveCount(1);
  await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Delete 2 devices' }).click();
  await expect(range).toHaveText(new RegExp(`of ${all - 2}$`));
  for (const name of picked) await expect(page.locator('#devices-body [data-device]', { hasText: name })).toHaveCount(0);
  await expect(rows).toHaveCount(Math.min(total, all - 2));
  await expect(page.locator('.ds-dialog[role="alertdialog"]')).toHaveCount(0);
  const toast = page.locator('.ds-toast', { hasText: '2 devices deleted.' });
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Undo' }).click();
  await expect(range).toHaveText(new RegExp(`of ${all}$`));
  await expect(rows).toHaveCount(total);
  await expect(page.locator('.ds-toast', { hasText: '2 devices restored.' })).toBeVisible();
});

test('the devices come in pages: next and last move the range, the ends are blocked there, clearing the selection hands focus to select all', async ({ page }) => {
  await open(page, '#/devices');
  const range = page.locator('#devices-range');
  await expect(range).toHaveText(/^1–25 of \d+$/);
  const all = Number(/of (\d+)$/.exec(await range.textContent())[1]);
  await expect(page.locator('[data-page="first"]')).toHaveAttribute('aria-disabled', 'true');
  const first = await page.locator('#devices-body [data-device]').first().textContent();
  await page.locator('[data-page="next"]').click();
  await settle(page);
  await expect(range).toHaveText(`26–50 of ${all}`);
  expect(await page.locator('#devices-body [data-device]').first().textContent()).not.toBe(first);
  await page.locator('[data-page="last"]').click();
  await settle(page);
  await expect(range).toHaveText(new RegExp(`–${all} of ${all}$`));
  await expect(page.locator('[data-page="next"]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('#page-size').selectOption('50');
  await expect(range).toHaveText(`1–50 of ${all}`);
  await expect(page.locator('#devices-body tr')).toHaveCount(50);
  // The selection bar: Clear moves focus to the header checkbox, and the toolbar comes back.
  await page.locator('#devices-body tr').nth(0).locator('[data-select]').check();
  await page.locator('#bulk [data-act="clear-selection"]').click();
  await expect(page.locator('#select-all')).toBeFocused();
  await settle(page);
  await expect(page.locator('#bulk .ds-selection-bar')).toHaveCount(0);
  await expect(page.locator('#devices-title')).toHaveText('Fleet');
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

test.describe('the combobox under touch (WebKit)', () => {
  // A phone: Firefox cannot create an isMobile context, and the tap's click is WebKit's question.
  test.skip(({ browserName }) => browserName !== 'webkit', 'the iOS engine');
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 664 } });

  test('a tap on an option chooses it: the list cancels mousedown, never pointerdown', async ({ page }) => {
    await open(page, '#/tickets');
    await page.locator('[data-act="new-ticket"]').tap();
    await settle(page);
    const field = page.locator('#ticket-device');
    await field.tap();
    await page.locator('#ticket-device ~ .ds-combo__toggle').tap();
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await settle(page);
    const option = page.locator('#ticket-device-list [role="option"]').first();
    await option.tap();
    await expect(field).toHaveValue(/^[A-Z]+-\d{4}$/);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
  });
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

test('edits of the organisation wait in the save bar: changed fields marked, Discard restores, Save keeps them (2.0)', async ({ page }) => {
  await open(page, '#/settings');
  const name = page.locator('#org-name');
  const field = page.locator('#org-form .ds-field', { has: name });
  const bar = page.locator('#savebar .ds-savebar__bar');
  const saved = await name.inputValue();
  await expect(bar).toBeHidden();
  await name.fill('Example Labs');
  await expect(bar).toBeVisible();
  await expect(bar).toContainText('1 unsaved change');
  await expect(field).toHaveClass(/ds-field--changed/);
  await expect(page.locator('#main')).toHaveAttribute('data-ds-savebar', '');
  await page.locator('#org-timezone').selectOption('Asia/Tokyo');
  await expect(bar).toContainText('2 unsaved changes');
  // Discard: the saved values come back, the bar leaves and the focus lands on the first field.
  await page.locator('#savebar-discard').click();
  await expect(bar).toBeHidden();
  await expect(name).toHaveValue(saved);
  await expect(name).toBeFocused();
  await expect(page.locator('#org-form .ds-field--changed')).toHaveCount(0);
  // Save: busy until the backend answered, then the bar leaves and a snackbar says so; the new value is the one to return to.
  await name.fill('Example Labs');
  await page.locator('#savebar-save').click();
  await expect(page.locator('.ds-toast', { hasText: 'Organisation saved.' })).toBeVisible();
  await expect(bar).toBeHidden();
  await expect(field).not.toHaveClass(/ds-field--changed/);
  await name.fill('Example Labs 2');
  await expect(bar).toBeVisible();
  await page.locator('#savebar-discard').click();
  await expect(name).toHaveValue('Example Labs');
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
  await page.locator('#devices-body tr').nth(0).locator('[data-device]').click();
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
