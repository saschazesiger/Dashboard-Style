/**
 * The reference app (example/, published on GitHub Pages), on its project
 * bundle (example/ds/): it starts without a console error, every view
 * renders (a navigation from the modal drawer focuses its title), and the
 * flows work end to end: saved views, the filter bar and the data grid
 * (sort, selection, the column chooser, paging, delete with undo), the
 * device's object page (an edit in place, a restart in a waiting toast),
 * the ticket facets and the ticket dialog (combobox, date picker), the
 * command palette, the notification centre, the time range of the charts,
 * the accent preset and the appearance, the save bar, the offline banner,
 * and phones at 360px. It runs in the `fallback` project too, so the app
 * also works on the browser floor. `?live=0` stops the polling, so no live
 * update moves a row under a click.
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

/** The status words of the grid's rows on show. */
const statuses = (page) => page.locator('#devices-grid tbody .ds-status').allTextContents();
const gridRows = (page, id = 'devices-grid') => page.locator(`#${id} tbody tr[data-ds-key]:not(.ds-table__detail)`);

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
    // transition({ focus: true }): the docked drawer keeps its focus, so the next item is one Tab away.
    await expect(item).toBeFocused();
    await expect(page.locator('.ds-drawer__item[aria-current="page"]')).toHaveAttribute('data-route', route);
    expect(new URL(page.url()).hash).toMatch(new RegExp(`^#/${route}(\\?|$)`));
  }
  await page.goBack();
  await settle(page);
  await expect(page.locator('#page h1')).toHaveText('Settings');
  expect(errors).toEqual([]);
});

test('loads the project bundle, not the whole of ds.css and ds.js', async ({ page }) => {
  const loaded = [];
  page.on('request', (request) => loaded.push(new URL(request.url()).pathname));
  await open(page);
  expect(loaded).toContain('/example/ds/ds.bundle.css');
  expect(loaded).toContain('/example/ds/ds.bundle.js');
  expect(loaded.filter((path) => /\/dist\/ds(\.min)?\.(css|js)$/.test(path))).toEqual([]);
  // The modules the app uses are there, the others are not.
  const modules = await page.evaluate(() => ['datagrid', 'filterbar', 'views', 'command', 'notifications', 'timerange', 'chart', 'object', 'facets', 'datepicker', 'combobox', 'composer', 'upload', 'kveditor']
    .filter((name) => window.DS[name]));
  expect(modules).toEqual(['datagrid', 'filterbar', 'views', 'command', 'notifications', 'timerange', 'chart', 'object', 'facets', 'datepicker', 'combobox']);
});

test('a navigation from the modal drawer lands on the new title (transition({ focus: true }))', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page);
  await page.locator('#menu').click();
  await settle(page);
  await page.locator('.ds-drawer__item[data-route="tickets"]').click();
  await settle(page);
  await expect(page.locator('#page h1')).toHaveText('Tickets');
  await expect(page.locator('#page h1')).toBeFocused();
});

test('dismissing an alert moves the focus to the same action of a neighbour, else to the title (flip() refocus)', async ({ page }) => {
  await open(page);
  const dismiss = page.locator('#alerts [data-dismiss]');
  test.skip(await dismiss.count() === 0, 'the fake backend raised no alert');
  await dismiss.first().focus();
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(dismiss).toHaveCount(0);
  const left = await page.locator('#alerts .ds-alert').count();
  if (left) await expect(page.locator('#alerts .ds-alert .ds-btn').first()).toBeFocused();
  else await expect(page.locator('#page h1')).toBeFocused();
});

test('a tile opens the devices in its saved view, with the way back to the overview', async ({ page }) => {
  await open(page);
  await page.locator('.ds-tile[href="#/devices?view=update"]').click();
  await settle(page);
  await expect(page.locator('#devices-views .ds-views__name')).toHaveText('Update due');
  await expect(page.locator('#f-status')).toHaveValue('warning');
  const words = await statuses(page);
  expect(words.length).toBeGreaterThan(0);
  expect(new Set(words)).toEqual(new Set(['Update due']));
  expect(new URL(page.url()).hash).toMatch(/^#\/devices\?view=update&/);
  const back = page.locator('#page .ds-page-head__back');
  await expect(back).toHaveText('Back to Overview');
  await back.click();
  await settle(page);
  await expect(page.locator('#page h1')).toHaveText('Overview');
  await page.locator('.ds-drawer__item[data-route="tickets"]').click();
  await settle(page);
  await expect(page.locator('#page .ds-page-head__back')).toHaveCount(0);
});

test('the filter bar filters the grid: a search that leaves nothing shows the no-results state, Clear all brings the rows back', async ({ page }) => {
  await open(page, '#/devices');
  const count = page.locator('#devices-filters .ds-filterbar__count');
  await expect(count).toHaveText('128 devices');
  await page.locator('#f-status').selectOption('error');
  await settle(page);
  await expect(page.locator('#devices-filters .ds-filterbar__chips .ds-chip')).toHaveCount(1);
  expect(new Set(await statuses(page))).toEqual(new Set(['Offline']));
  await expect(page.locator('#devices-views .ds-views__edited')).toBeVisible();
  await page.locator('#devices-filters input[name="q"]').fill('no such device');
  await settle(page);
  await expect(count).toHaveText('0 devices');
  await expect(page.locator('#devices-grid .ds-datagrid__state')).toBeVisible();
  await page.locator('#devices-filters .ds-filterbar__clear').click();
  await page.locator('#devices-filters input[name="q"]').fill('');
  await settle(page);
  await expect(count).toHaveText('128 devices');
  await expect(gridRows(page)).toHaveCount(25);
  await expect(page.locator('#devices-views .ds-views__edited')).toBeHidden();
});

test('saved views: a view sets the filters, the sort and the columns; the address carries it', async ({ page }) => {
  await open(page, '#/devices');
  await page.locator('#devices-views .ds-views__trigger').click();
  await settle(page);
  await page.locator('#views-menu [data-ds-view="offline"]').click();
  await settle(page);
  await expect(page.locator('#devices-views .ds-views__name')).toHaveText('Offline');
  await expect(page.locator('#f-status')).toHaveValue('error');
  // Offline shows the location column, hidden by default.
  await expect(page.locator('#devices-grid thead th', { hasText: 'Location' })).toHaveCount(1);
  const hash = new URL(page.url()).hash;
  expect(hash).toContain('view=offline');
  expect(hash).toContain('status=error');
  // The address alone brings the same list back.
  await page.goto(`${APP}${hash}`);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-ex-ready'));
  await settle(page);
  await expect(page.locator('#devices-views .ds-views__name')).toHaveText('Offline');
  expect(new Set(await statuses(page))).toEqual(new Set(['Offline']));
});

test('the grid sorts by a header, hides a column through the chooser and comes in pages', async ({ page }) => {
  await open(page, '#/devices');
  const owner = page.locator('#devices-grid thead th', { hasText: 'Owner' });
  await owner.locator('.ds-table__sort').click();
  await settle(page);
  await expect(owner).toHaveAttribute('aria-sort', 'ascending');
  expect(new URL(page.url()).hash).toContain('sort=owner');
  // The chooser: a column box toggles and the menu stays open.
  await page.locator('[data-ds-open="#devices-columns"]').click();
  await settle(page);
  await page.locator('#devices-columns [role="menuitemcheckbox"]', { hasText: 'Model' }).click();
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(page.locator('#devices-grid thead th', { hasText: 'Model' })).toHaveCount(0);
  expect(new URL(page.url()).hash).toContain('cols=');
  // Pages: next moves the range, the first page's ends are blocked.
  const range = page.locator('#devices-pages .ds-pagination__range');
  await expect(range).toHaveText(/^1–25 of 128$/);
  await expect(page.locator('#devices-pages [data-ds-datagrid-page="previous"]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('#devices-pages [data-ds-datagrid-page="next"]').click();
  await expect(range).toHaveText(/^26–50 of 128$/);
});

test('rows are selected into the bar; deleting asks first and the snackbar undoes it', async ({ page }) => {
  await open(page, '#/devices');
  const rows = gridRows(page);
  const names = [await rows.nth(0).locator('.ds-table__row-link').textContent(), await rows.nth(1).locator('.ds-table__row-link').textContent()];
  await rows.nth(0).locator('.ds-datagrid__select input').check();
  await rows.nth(1).locator('.ds-datagrid__select input').check();
  await settle(page);
  const bar = page.locator('#devices-bar');
  await expect(bar).toBeVisible();
  await expect(bar.locator('.ds-selection-bar__count')).toContainText('2');
  await bar.locator('[data-act="delete-selected"]').click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete 2 devices' }).click();
  await expect(page.locator('.ds-toast', { hasText: '2 devices deleted.' })).toBeVisible();
  await expect(page.locator('#devices-filters .ds-filterbar__count')).toHaveText('126 devices');
  for (const name of names) await expect(page.locator('#devices-grid .ds-table__row-link', { hasText: name })).toHaveCount(0);
  await page.locator('.ds-toast', { hasText: '2 devices deleted.' }).getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.ds-toast', { hasText: '2 devices restored.' })).toBeVisible();
  await expect(page.locator('#devices-filters .ds-filterbar__count')).toHaveText('128 devices');
});

test('a row opens the device page; a section edits in place and saves; the restart waits in a toast', async ({ page }) => {
  await open(page, '#/devices');
  const link = gridRows(page).first().locator('.ds-table__row-link');
  const name = await link.textContent();
  await link.click();
  await settle(page);
  await expect(page.locator('#page h1')).toHaveText(name);
  await expect(page.locator('#page h1')).toBeFocused();
  await expect(page.locator('.ds-toc__link')).toHaveCount(5);
  // General: Edit turns it into its form, the first field takes the focus; Save goes to the backend.
  const general = page.locator('#general');
  // The form's date picker is made when the section starts to edit (ds:edit), with the device's date.
  await expect(page.locator('#dev-warranty input[name="warranty"]')).toHaveCount(0);
  await general.locator('.ds-object__edit').click();
  await expect(general.locator('form')).toBeVisible();
  await expect(page.locator('#dev-owner')).toBeFocused();
  await page.locator('#dev-owner').selectOption('Grace Hopper');
  await expect(general.locator('.ds-datefield')).toBeVisible();
  await expect(page.locator('#dev-warranty input[name="warranty"]')).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
  await general.locator('[type="submit"]').click();
  await expect(page.locator('.ds-toast', { hasText: `${name} saved.` })).toBeVisible();
  await expect(general.locator('.ds-object__view')).toContainText('Grace Hopper');
  await expect(page.locator('#device-details')).toContainText('Grace Hopper');
  // Restart: the snackbar waits with its spinner, then says how it ended.
  await page.locator('[data-act="restart-device"]').click();
  await expect(page.locator('.ds-toast', { hasText: `Restarting ${name}` })).toBeVisible();
  await expect(page.locator('.ds-toast', { hasText: `${name} restarted.` })).toBeVisible();
  await expect(page.locator('#device-status')).toContainText('Syncing');
  // The way back: at the top of the page (a condensed head hides it until the page scrolls back).
  await page.locator('#main').evaluate((main) => main.scrollTo(0, 0));
  await page.locator('#page .ds-page-head__back').click();
  await settle(page);
  await expect(page.locator('#page h1')).toHaveText('Devices');
});

test('a new ticket shows its errors on submit, takes a device from the combobox and a due date, and lands in the grid', async ({ page }) => {
  await open(page, '#/tickets');
  const rows = gridRows(page, 'tickets-grid');
  const before = await rows.count();
  await page.locator('#page [data-act="new-ticket"]').click();
  await settle(page);
  await expect(page.locator('#ticket-subject')).toBeFocused();
  await page.locator('#ticket-form [type="submit"]').click();
  await expect(page.locator('#ticket-subject')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#ticket-device-error')).toHaveText('Choose a device.');
  await expect(page.locator('#ticket-subject')).toBeFocused();
  await page.locator('#ticket-subject').fill('Fan is loud');
  await expect(page.locator('#ticket-subject')).not.toHaveAttribute('aria-invalid', 'true');
  await page.locator('#ticket-device').pressSequentially('laptop-004');
  await expect(page.locator('#ticket-device')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#ticket-device').press('ArrowDown');
  await page.locator('#ticket-device').press('Enter');
  await expect(page.locator('#ticket-device')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#ticket-device')).toHaveValue(/^[A-Z]+-\d{4}$/);
  // The due date: the calendar's Today.
  await page.locator('#ticket-due .ds-datefield__toggle').click();
  await settle(page);
  await page.locator('#ticket-due .ds-picker__foot .ds-btn').first().click();
  await settle(page);
  await expect(page.locator('#ticket-due input[type="hidden"][name="due"]')).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
  await page.locator('#ticket-form [type="submit"]').click();
  await expect(page.locator('.ds-toast', { hasText: 'created' })).toBeVisible();
  await expect(rows).toHaveCount(before + 1);
  await expect(rows.first()).toContainText('Fan is loud');
});

test.describe('the combobox under touch (WebKit)', () => {
  // A phone: Firefox cannot create an isMobile context, and the tap's click is WebKit's question.
  test.skip(({ browserName }) => browserName !== 'webkit', 'the iOS engine');
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 664 } });

  test('a tap on an option chooses it', async ({ page }) => {
    await open(page, '#/tickets');
    await page.locator('#page [data-act="new-ticket"]').tap();
    await settle(page);
    const field = page.locator('#ticket-device');
    await page.locator('#ticket-device ~ .ds-combo__toggle').tap();
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await settle(page);
    await page.locator('#ticket-combo [role="option"]').first().tap();
    await expect(field).toHaveValue(/^[A-Z]+-\d{4}$/);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
  });
});

test('the ticket facets filter the grid with their counts; a link from the overview opens its ticket', async ({ page }) => {
  await open(page, '#/tickets');
  const count = page.locator('#page .ds-facets__count').first();
  const rows = gridRows(page, 'tickets-grid');
  const shown = await rows.count();
  await expect(count).toHaveText(`${shown} tickets`);
  await page.locator('#ticket-facets input[name="status"][value="closed"]').check();
  await settle(page);
  await expect(rows).toHaveCount(shown + 2);
  await page.locator('#ticket-facets input[name="priority"][value="high"]').check();
  await settle(page);
  const priorities = await page.locator('#tickets-grid tbody .ds-status', { hasText: 'High' }).count();
  await expect(rows).toHaveCount(priorities);
  await expect(page.locator('#ticket-facets .ds-facets__chips .ds-chip')).toHaveCount(4);
  // From the overview: the ticket's row is open.
  await page.locator('.ds-drawer__item[data-route="overview"]').click();
  await settle(page);
  await page.locator('#open-tickets .ds-list__action').first().click();
  await settle(page);
  await expect(page.locator('#tickets-grid .ds-table__toggle[aria-expanded="true"]')).toHaveCount(1);
  await expect(page.locator('#tickets-grid .ds-table__detail:not([inert])')).toContainText('Close ticket');
});

test('the command palette opens with Ctrl+K, runs a command and finds a device', async ({ page }) => {
  await open(page);
  await page.locator('#page h1').focus();
  await page.keyboard.press('Control+k');
  const palette = page.locator('#palette');
  await expect(palette).toBeVisible();
  const input = palette.locator('.ds-command__input');
  await expect(input).toBeFocused();
  await input.fill('ticke');
  await expect(palette.locator('.ds-command__item[data-active]')).toContainText('Tickets');
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(palette).toBeHidden();
  await expect(page.locator('#page h1')).toHaveText('Tickets');
  // A device, found by its owner, opens its page.
  await page.locator('#palette-open').click();
  await expect(input).toBeFocused();
  await input.fill('LAPTOP-0040');
  await expect(palette.locator('.ds-command__item', { hasText: 'LAPTOP-0040' })).toBeVisible();
  await palette.locator('.ds-command__item', { hasText: 'LAPTOP-0040' }).click();
  await settle(page);
  await expect(page.locator('#page h1')).toHaveText('LAPTOP-0040');
});

test('the notification centre: the bell counts the unread, a link opens its record and closes the sheet', async ({ page }) => {
  await open(page);
  const bell = page.locator('#inbox-open');
  await expect(bell).toHaveAccessibleName(/2 unread/);
  await bell.click();
  await settle(page);
  const inbox = page.locator('#inbox');
  await expect(inbox).toBeVisible();
  await expect(inbox.locator('.ds-notifications__item')).toHaveCount(4);
  await expect(inbox.locator('.ds-notifications__item[data-unread]')).toHaveCount(2);
  await inbox.locator('.ds-notifications__link').first().click();
  await settle(page);
  await expect(inbox).toBeHidden();
  await expect(page.locator('#page h1')).toHaveText(/^PRINTER-\d{4}$/);
  await expect(bell).toHaveAccessibleName(/1 unread/);
  await bell.click();
  await settle(page);
  await inbox.locator('[data-ds-notifications-read-all]').click();
  await expect(inbox.locator('.ds-notifications__item[data-unread]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(bell).toBeFocused();
  await expect(bell).not.toHaveAccessibleName(/unread/);
});

test('the time range of the overview goes into the address and loads the chart again', async ({ page }) => {
  await open(page);
  await expect(page.locator('#fleet-chart .ds-chart__line, #fleet-chart .ds-chart__area').first()).toBeAttached();
  await page.locator('#overview-range .ds-timerange__trigger').click();
  await settle(page);
  await page.locator('#overview-range .ds-picker__preset[data-from="now-6h"]').click();
  await settle(page);
  await expect(page.locator('#overview-range .ds-timerange__label')).toHaveText('Last 6 hours');
  expect(new URL(page.url()).hash).toContain('from=now-6h');
  // The range survives a reload through the address.
  await page.reload();
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-ex-ready'));
  await expect(page.locator('#overview-range .ds-timerange__label')).toHaveText('Last 6 hours');
});

test('the accent is a theme preset: another file, other roles, kept across a reload', async ({ page }) => {
  await open(page, '#/settings');
  const primary = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-primary').trim());
  const blue = await primary();
  await page.locator('.ds-radio', { hasText: 'Forest' }).click();
  await expect(page.locator('#ex-preset')).toHaveAttribute('href', /presets\/forest\.css$/);
  await expect.poll(primary).not.toBe(blue);
  await page.reload();
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-ex-ready'));
  await expect(page.locator('#ex-preset')).toHaveAttribute('href', /presets\/forest\.css$/);
  await expect(page.locator('input[name="accent"][value="forest"]')).toBeChecked();
  await page.locator('.ds-radio', { hasText: 'Blue' }).click();
  await expect(page.locator('#ex-preset')).toHaveAttribute('href', /presets\/default\.css$/);
  await expect.poll(primary).toBe(blue);
});

test('the appearance switch of Settings and the account menu move together and pin the scheme', async ({ page }) => {
  await open(page, '#/settings');
  await page.locator('#appearance [data-ds-scheme-value="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-ds-scheme', 'dark');
  await expect(page.locator('#appearance [data-ds-scheme-value="dark"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#account [data-ds-scheme-value="dark"]')).toHaveAttribute('aria-checked', 'true');
  const surface = await page.evaluate(() => getComputedStyle(document.querySelector('.ds-panel')).backgroundColor);
  await page.locator('.ds-account__trigger').click();
  await expect(page.locator('#account')).toBeVisible();
  await page.locator('#account [data-ds-scheme-value="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-ds-scheme', 'light');
  await expect(page.locator('#appearance [data-ds-scheme-value="light"]')).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.ds-panel')).backgroundColor)).not.toBe(surface);
});

test('edits of the organisation wait in the save bar: changed fields marked, Discard restores, Save keeps them', async ({ page }) => {
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
  await page.locator('#org-timezone').selectOption('Asia/Tokyo');
  await expect(bar).toContainText('2 unsaved changes');
  await page.locator('#savebar-discard').click();
  await expect(bar).toBeHidden();
  await expect(name).toHaveValue(saved);
  await expect(name).toBeFocused();
  await expect(page.locator('#org-form .ds-field--changed')).toHaveCount(0);
  await name.fill('Example Labs');
  await page.locator('#savebar-save').click();
  await expect(page.locator('.ds-toast', { hasText: 'Organisation saved.' })).toBeVisible();
  await expect(bar).toBeHidden();
  await expect(field).not.toHaveClass(/ds-field--changed/);
});

test('the sync runs in a progress toast from the palette, and says when it is done', async ({ page }) => {
  await open(page, '#/tickets');
  await page.locator('#palette-open').click();
  await page.locator('#palette .ds-command__input').fill('run the sync');
  await page.keyboard.press('Enter');
  const toast = page.locator('.ds-toast--progress');
  await expect(toast).toBeVisible();
  await expect(toast.locator('[role="progressbar"]')).toBeAttached();
  await expect(page.locator('.ds-toast', { hasText: /Sync finished: \d+ devices checked\./ })).toBeVisible({ timeout: 15000 });
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
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-ex-ready'));
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
  await banner.getByRole('button', { name: 'Retry' }).click();
  await expect(banner).toBeVisible();
  await toggle.uncheck({ force: true });
  await expect(banner).toHaveCount(0);
});

test.describe('phones at 360px', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('no view is wider than the phone; the device filters fold into a sheet', async ({ page }) => {
    const errors = collectErrors(page);
    for (const hash of ['#/overview', '#/devices', '#/devices/laptop-0040', '#/tickets', '#/settings']) {
      await open(page, hash);
      const overflow = await page.evaluate(() => {
        const view = document.querySelector('#main');
        const page = document.querySelector('#page');
        return { doc: document.documentElement.scrollWidth - window.innerWidth, page: page.scrollWidth - view.clientWidth };
      });
      expect(overflow.doc, hash).toBeLessThanOrEqual(0);
      expect(overflow.page, hash).toBeLessThanOrEqual(0);
    }
    await open(page, '#/devices');
    await expect(page.locator('#devices-filters')).toHaveAttribute('data-folded', '');
    await page.locator('#devices-filters .ds-filterbar__more').click();
    await settle(page);
    const sheet = page.locator('#filters-sheet');
    await expect(sheet).toBeVisible();
    await sheet.locator('#f-status').selectOption('error');
    await sheet.locator('.ds-filterbar__results').click();
    await settle(page);
    await expect(sheet).toBeHidden();
    expect(new Set(await statuses(page))).toEqual(new Set(['Offline']));
    await expect(page.locator('#devices-filters .ds-filterbar__badge')).toHaveAttribute('data-count', '1');
    expect(errors).toEqual([]);
  });
});
