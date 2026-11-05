/**
 * Saved views (DS.views): the menu button and its views by keyboard, picking
 * a view (ds:view, the page's controls, the address, the announcement),
 * "Edited", saving as new, renaming, the default and deleting through the
 * dialogs, the store across tabs, the address in and out, sharing, the
 * controller, the options, the chevron and forced colours. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const PAGE = '/test/browser/fixtures/component.html?c=views';

async function open(page, query = '', width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(PAGE + query);
  await ready(page);
  await page.mouse.move(1, 1);
}

const said = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((node) => node.textContent).join('\n'));
const trigger = (page) => page.getByRole('button', { name: /^View: / });
const menu = (page) => page.getByRole('menu', { name: 'Views' });

async function openMenu(page) {
  await trigger(page).focus();
  await page.keyboard.press('Enter');
  await expect(menu(page)).toBeVisible();
  await settle(page);
}

test('names and roles: a menu button, the views as radio items with the default in words, actions off where they do not apply', async ({ page }) => {
  await open(page);
  await expect(trigger(page)).toHaveAccessibleName('View: All devices');
  await expect(trigger(page)).toHaveAttribute('aria-haspopup', 'menu');
  await expect(page.locator('.ds-views__save')).toBeHidden();
  await openMenu(page);
  const views = menu(page).getByRole('group', { name: 'Views' }).getByRole('menuitemradio');
  await expect(views).toHaveCount(3);
  await expect(menu(page).getByRole('menuitemradio', { name: /^All devices/ })).toHaveAttribute('aria-checked', 'true');
  await expect(menu(page).getByRole('menuitemradio', { name: /^All devices/ })).toHaveAccessibleName('All devices Default');
  for (const name of ['Save changes', 'Rename …', 'Make default', 'Delete view']) {
    await expect(menu(page).getByRole('menuitem', { name })).toHaveAttribute('aria-disabled', 'true');
  }
  await expect(menu(page).getByRole('menuitem', { name: 'Save as new view …' })).not.toHaveAttribute('aria-disabled', /.*/);
  await expect(page.locator('.ds-views__chevron')).toHaveCSS('rotate', '180deg');
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator('.ds-views__chevron')).toHaveCSS('rotate', 'none');
});

test('picking a view: ds:view, the page applies its state, the address follows, it is announced', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.seen = [];
    document.querySelector('.ds-views').addEventListener('ds:view', (event) => window.seen.push(event.detail));
  });
  await openMenu(page);
  await page.keyboard.press('ArrowDown');
  await expect(menu(page).getByRole('menuitemradio', { name: 'Offline' })).toBeFocused();
  await page.keyboard.press('Enter');
  await settle(page);
  expect(await page.evaluate(() => window.seen)).toEqual([{
    id: 'offline', name: 'Offline', reason: 'select',
    state: { filters: { status: ['offline'] }, sort: '-seen', columns: ['owner', 'storage', 'seen'] },
  }]);
  await expect(trigger(page)).toHaveAccessibleName('View: Offline');
  await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('offline');
  await expect(page.locator('.ds-filterbar__count')).toHaveText('3 devices');
  await expect.poll(() => said(page)).toContain('View: Offline');
  const query = new URL(page.url()).searchParams;
  expect(query.get('c')).toBe('views');
  expect(query.get('dv.view')).toBe('offline');
  expect(query.getAll('dv.status')).toEqual(['offline']);
  expect(query.get('dv.sort')).toBe('-seen');
});

test('edited, then saved as a new view by keyboard; renamed, made the default, deleted after asking', async ({ page }) => {
  await open(page);
  await page.getByRole('combobox', { name: 'Type' }).selectOption('laptop');
  await expect(trigger(page)).toHaveAccessibleName('View: All devices Edited');
  const save = page.getByRole('button', { name: 'Save view' });
  await expect(save).toBeVisible();
  await save.click();
  const dialog = page.getByRole('dialog', { name: 'Save as a new view' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Name' }).fill('My laptops');
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(dialog).toBeHidden();
  await expect(trigger(page)).toHaveAccessibleName('View: My laptops');
  await expect(save).toBeHidden();
  await expect(page.locator('.ds-toast').filter({ hasText: 'Saved My laptops' })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ds:views:sg-demo-devices')));
  expect(stored.views).toEqual([{ id: 'my-laptops', name: 'My laptops', state: { filters: { kind: ['laptop'] }, sort: 'name', columns: ['owner', 'storage', 'seen'] } }]);

  // Rename: the dialog opens with the name; the focus comes back to the trigger.
  await openMenu(page);
  await menu(page).getByRole('menuitem', { name: 'Rename …' }).click();
  const rename = page.getByRole('dialog', { name: 'Rename view' });
  await expect(rename.getByRole('textbox', { name: 'Name' })).toHaveValue('My laptops');
  await rename.getByRole('textbox', { name: 'Name' }).fill('Mine');
  await rename.getByRole('button', { name: 'Save' }).click();
  await settle(page);
  await expect(trigger(page)).toHaveAccessibleName('View: Mine');
  await expect(trigger(page)).toBeFocused();

  // The default moves, in words.
  await openMenu(page);
  await menu(page).getByRole('menuitem', { name: 'Make default' }).click();
  await settle(page);
  await expect.poll(() => said(page)).toContain('Mine is the default view');
  await openMenu(page);
  await expect(menu(page).getByRole('menuitemradio', { name: /^Mine/ })).toHaveAccessibleName('Mine Default');
  await expect(menu(page).getByRole('menuitemradio', { name: /^All devices/ })).toHaveAccessibleName('All devices');

  // Delete asks first, in the error tone; the default goes back to the built-in one.
  await menu(page).getByRole('menuitem', { name: 'Delete view' }).click();
  const ask = page.getByRole('alertdialog', { name: 'Delete “Mine”?' });
  await expect(ask).toBeVisible();
  await expect(ask.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await ask.getByRole('button', { name: 'Delete view' }).click();
  await settle(page);
  await expect(trigger(page)).toHaveAccessibleName('View: All devices');
  await expect(page.getByRole('combobox', { name: 'Type' })).toHaveValue('');
  await expect.poll(() => said(page)).toContain('Deleted Mine');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ds:views:sg-demo-devices')))).toEqual({ views: [], default: null });
});

test('the address: a view and a state come in, an edited state says so; another tab\'s view shows at once', async ({ page }) => {
  await open(page, '&dv.view=laptops');
  await expect(trigger(page)).toHaveAccessibleName('View: Laptops by storage');
  await expect(page.getByRole('combobox', { name: 'Type' })).toHaveValue('laptop');
  await expect(page.getByRole('checkbox', { name: 'Last seen' })).not.toBeChecked();
  await open(page, '&dv.view=all&dv.status=maintenance&dv.sort=name&dv.cols=owner,storage,seen');
  await expect(trigger(page)).toHaveAccessibleName('View: All devices Edited');
  await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('maintenance');
  // Another tab of the same origin saves a view: it shows here.
  const other = await page.context().newPage();
  await other.goto(PAGE);
  await ready(other);
  await other.evaluate(() => DS.get(document.querySelector('.ds-views')).create('From the other tab'));
  await openMenu(page);
  await expect(menu(page).getByRole('menuitemradio', { name: 'From the other tab' })).toBeVisible();
  await other.close();
});

test('share: the link carries the view; copied with a snackbar, else shown to copy', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.copied = text; } } });
  });
  await page.getByRole('combobox', { name: 'Status' }).selectOption('online');
  await openMenu(page);
  await menu(page).getByRole('menuitem', { name: 'Copy link' }).click();
  await expect(page.locator('.ds-toast').filter({ hasText: 'Link copied' })).toBeVisible();
  const copied = new URL(await page.evaluate(() => window.copied));
  expect(copied.searchParams.get('dv.view')).toBe('all');
  expect(copied.searchParams.getAll('dv.status')).toEqual(['online']);
  expect(copied.searchParams.get('c')).toBe('views');
  // Without a clipboard the link shows in a dialog.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
  });
  await openMenu(page);
  await menu(page).getByRole('menuitem', { name: 'Copy link' }).click();
  const dialog = page.getByRole('dialog', { name: 'Link to this view' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Link to this view' })).toHaveValue(/dv\.status=online/);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(trigger(page)).toBeFocused();
});

test('the controller: set (silent), create, setDefault, link, remove, toQuery and fromQuery', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const el = document.querySelector('.ds-views');
    const views = DS.views.create(el);
    let told = 0;
    el.addEventListener('ds:view', () => { told += 1; });
    const changes = [];
    el.addEventListener('ds:views', (event) => changes.push(event.detail.reason));
    views.set('offline');
    const picked = views.get();
    views.set({ state: { filters: { kind: ['tablet'] } } });
    const edited = views.get().edited;
    const id = await views.create('Tablets');
    await views.setDefault();
    const link = new URL(views.link()).searchParams.get('dv.view');
    const removed = await views.remove();
    return { same: DS.get(el) === views, picked: [picked.id, picked.edited], edited, id, link, removed, told, changes, after: views.get().id, list: views.get().views.map((entry) => entry.id) };
  });
  expect(seen).toEqual({
    same: true,
    picked: ['offline', false],
    edited: true,
    id: 'tablets',
    link: 'tablets',
    removed: 'tablets',
    told: 1,
    changes: ['create', 'default', 'delete'],
    after: 'all',
    list: ['all', 'offline', 'laptops'],
  });
});

test('options: size and density reach the trigger, touch wins, a phone keeps it in 360px', async ({ page }) => {
  await open(page);
  const height = (classes) => page.evaluate((classes) => {
    const block = document.querySelector('.sg-views-block');
    block.parentElement.className = classes;
    const out = document.querySelector('.ds-views__trigger').getBoundingClientRect().height;
    block.parentElement.className = '';
    return out;
  }, classes);
  expect(await height('')).toBe(40);
  expect(await height('ds-sm')).toBe(32);
  expect(await height('ds-density-compact')).toBe(36);
  expect(await height('ds-touch ds-density-tight')).toBeGreaterThanOrEqual(48);
  await page.setViewportSize({ width: 360, height: 800 });
  const box = await page.locator('.ds-views').boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  await openMenu(page);
  const menuBox = await menu(page).boundingBox();
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(360);
});

test('forced colours: the default and the edited state are words, the current view keeps its check', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await page.getByRole('combobox', { name: 'Type' }).selectOption('phone');
  await expect(page.locator('.ds-views__edited')).toHaveText('Edited');
  await expect(page.locator('.ds-views__edited')).toBeVisible();
  await openMenu(page);
  await expect(menu(page).locator('.ds-views__default')).toHaveText('Default');
  const check = menu(page).getByRole('menuitemradio', { name: /^All devices/ }).locator('.ds-menu__check');
  await expect(check).toBeVisible();
});
