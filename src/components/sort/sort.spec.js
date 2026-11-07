/**
 * The sort control (DS.sort): the state the system writes, the words of the
 * field types, the order button and the menu by keyboard, ds:sort and the
 * announcement, set() and get(), the options around it and forced colours.
 * Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/test/browser/fixtures/component.html?c=sort');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Everything the live regions of the page say now. */
const said = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((node) => node.textContent).join('\n'));

const inline = (page) => page.getByRole('group', { name: 'Sort devices' });

test('the first state comes from data-ds-value; the words follow the field type', async ({ page }) => {
  await open(page);
  const control = inline(page);
  await expect(control).toHaveAttribute('data-state', 'descending');
  await expect(control.getByRole('combobox', { name: 'Sort by' })).toHaveValue('seen');
  await expect(control.getByRole('button', { name: 'Order: Newest first' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Sort by name' }).getByRole('button', { name: 'Order: A to Z' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Sort by storage' }).getByRole('button', { name: 'Order: Highest first' })).toBeVisible();
  // The list was rendered in that order.
  await expect(page.locator('[data-demo-list]').first().locator('.ds-list__title').first()).toHaveText('SERVER-0002');
});

test('the order button flips the order by keyboard, keeps its width, sends ds:sort and is announced', async ({ page }) => {
  await open(page);
  const control = inline(page);
  const button = control.locator('.ds-sort__order');
  const width = (await button.boundingBox()).width;
  await page.evaluate(() => {
    window.seen = [];
    document.addEventListener('ds:sort', (event) => window.seen.push(event.detail));
  });
  await button.focus();
  await page.keyboard.press('Space');
  await expect(control).toHaveAttribute('data-state', 'ascending');
  await expect(control.getByRole('button', { name: 'Order: Oldest first' })).toBeFocused();
  expect((await button.boundingBox()).width).toBeCloseTo(width, 0);
  expect(await page.evaluate(() => window.seen)).toEqual([{ field: 'seen', direction: 'ascending', label: 'Last seen', words: 'Oldest first' }]);
  await expect.poll(() => said(page)).toContain('Sorted by Last seen, Oldest first');
  await page.keyboard.press('Enter');
  await expect(control).toHaveAttribute('data-state', 'descending');
  // The list sorts with it (the page's handler): the oldest last.
  await expect(page.locator('[data-demo-list]').first().locator('.ds-list__title').last()).toHaveText('DESKTOP-0007');
});

test('a field change starts in the field\'s own direction; the arrow turns with the state', async ({ page }) => {
  await open(page);
  const control = inline(page);
  // A field without a start direction keeps the one in force, in its own words.
  await control.getByRole('combobox').selectOption('name');
  await expect(control).toHaveAttribute('data-state', 'descending');
  await expect(control.getByRole('button', { name: 'Order: Z to A' })).toBeVisible();
  await settle(page);
  const turn = () => control.locator('.ds-sort__arrow').evaluate((arrow) => getComputedStyle(arrow).rotate);
  expect(await turn()).toBe('180deg');
  await control.locator('.ds-sort__order').click();
  await settle(page);
  expect(await turn()).toMatch(/^(none|0deg)$/);
  // A field with one starts in it: storage, highest first.
  await control.getByRole('combobox').selectOption('storage');
  await expect(control).toHaveAttribute('data-state', 'descending');
  await expect(control.getByRole('button', { name: 'Order: Highest first' })).toBeVisible();
});

test('the menu look: keyboard, radio items in two groups, the trigger names field and order', async ({ page }) => {
  await open(page);
  const sort = page.locator('.ds-sort--menu').first();
  const trigger = sort.locator('.ds-sort__trigger');
  await expect(trigger).toHaveAccessibleName(/^Sort by Name ?, A to Z$/);
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Sort' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('group', { name: 'Sort by' }).getByRole('menuitemradio')).toHaveCount(3);
  await expect(menu.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute('aria-checked', 'true');
  await expect(menu.getByRole('menuitemradio', { name: 'A to Z' })).toHaveAttribute('aria-checked', 'true');
  await expect(menu.getByRole('menuitemradio', { name: 'A to Z' })).toBeVisible();
  // Down to Last seen, choose it: the menu closes, focus is back on the trigger.
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitemradio', { name: 'Last seen' })).toBeFocused();
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName(/^Sort by Last seen ?, Newest first$/);
  await expect(sort).toHaveAttribute('data-state', 'descending');
  // The order group now speaks of dates.
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitemradio', { name: 'Newest first' })).toHaveAttribute('aria-checked', 'true');
  await menu.getByRole('menuitemradio', { name: 'Oldest first' }).click();
  await settle(page);
  await expect(sort).toHaveAttribute('data-state', 'ascending');
  await expect(trigger).toHaveAccessibleName(/^Sort by Last seen ?, Oldest first$/);
});

test('the controller: get, set (silent), parse and stringify, update', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(() => {
    const el = document.querySelector('.ds-sort');
    const sort = DS.sort.create(el);
    const same = sort === DS.get(el, 'sort');
    const told = [];
    const off = sort.on('change', (detail) => told.push(detail));
    el.addEventListener('ds:sort', (event) => told.push(event.detail));
    const first = sort.get();
    sort.set('name');
    const second = sort.get();
    sort.set({ direction: 'descending' });
    const third = sort.get();
    sort.set('-nope');
    off();
    return { same, first, second, third, fourth: sort.get(), told: told.length, state: el.getAttribute('data-state'),
      parse: DS.sort.parse('seen:desc'), text: DS.sort.stringify({ field: 'seen', direction: 'descending' }) };
  });
  expect(seen).toEqual({
    same: true,
    first: { field: 'seen', direction: 'descending' },
    second: { field: 'name', direction: 'ascending' },
    third: { field: 'name', direction: 'descending' },
    fourth: { field: 'name', direction: 'descending' },
    told: 0,
    state: 'descending',
    parse: { field: 'seen', direction: 'descending' },
    text: '-seen',
  });
});

test('options reach the controls: size, density, touch, shape; the label hides when narrow', async ({ page }) => {
  await open(page);
  const measure = (classes) => page.evaluate((classes) => {
    const host = document.createElement('div');
    host.className = classes;
    host.innerHTML = document.querySelector('.ds-sort').outerHTML;
    document.querySelector('#fx-component').append(host);
    const select = host.querySelector('.ds-sort__field').getBoundingClientRect().height;
    const order = host.querySelector('.ds-sort__order');
    const out = { select, order: order.getBoundingClientRect().height, radius: parseFloat(getComputedStyle(order).borderTopLeftRadius) };
    host.remove();
    return out;
  }, classes);
  const plain = await measure('');
  expect(plain.select).toBeCloseTo(40, 0);
  expect(plain.order).toBeCloseTo(40, 0);
  expect((await measure('ds-sm')).select).toBeCloseTo(32, 0);
  expect((await measure('ds-lg')).order).toBeCloseTo(48, 0);
  expect((await measure('ds-density-compact')).select).toBeCloseTo(36, 0);
  expect((await measure('ds-touch ds-density-tight')).order).toBeGreaterThanOrEqual(48);
  expect((await measure('ds-shape-square')).radius).toBe(0);
  const narrow = page.locator('.ds-sort').filter({ has: page.locator('#' + await page.locator('.ds-sort__field').nth(3).getAttribute('id')) });
  const label = narrow.locator('.ds-sort__label');
  expect((await label.boundingBox())?.width ?? 0).toBeLessThanOrEqual(1);
  await expect(narrow.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
});

test('a phone: the controls stay in the width of 360px', async ({ page }) => {
  await open(page, 360);
  for (const control of await page.locator('.ds-sort').all()) {
    const box = await control.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
});

test('forced colours: the arrow and the words keep the system colours', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const colours = await page.evaluate(() => {
    const order = document.querySelector('.ds-sort__order');
    return { arrow: getComputedStyle(order.querySelector('.ds-sort__arrow')).color, text: getComputedStyle(order).color };
  });
  expect(colours.arrow).toBe(colours.text);
  // Only the current word shows.
  await expect(inline(page).locator('.ds-sort__word:visible')).toHaveCount(1);
});
