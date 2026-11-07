/**
 * The ordered choice (3.0): the places of the checked rows (a disc and
 * words), the maximum, Alt with the arrows, Home and End, the keyboard drag
 * of DS.dnd with its announcements, a pointer drag, ds:change, set(), and
 * forced colours. Runs on the generated fixture of the demo, and in
 * `fallback`.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=orderedchoice');
  await ready(page);
  await page.mouse.move(1, 1);
}

const list = (page) => page.locator('[data-demo="columns"]');
const control = (page, method) => page.evaluate((name) => DS.get(document.querySelector('[data-demo="columns"]'), 'orderedchoice')[name](), method);
const ranks = (page) => list(page).locator('.ds-orderedchoice__rank').evaluateAll((discs) => discs.map((disc) => disc.querySelector('[aria-hidden]')?.textContent ?? ''));

test('the checked rows show their place in a disc and in words, named by their box', async ({ page }) => {
  await open(page);
  expect(await ranks(page)).toEqual(['1', '2', '3', '', '', '', '']);
  const box = list(page).getByRole('checkbox', { name: 'Status' });
  await expect(box).toHaveAccessibleDescription('Position 2');
  await list(page).getByRole('checkbox', { name: 'Name' }).uncheck();
  expect(await ranks(page)).toEqual(['', '1', '2', '', '', '', '']);
  await expect(box).toHaveAccessibleDescription('Position 1');
  expect(await control(page, 'get')).toEqual(['status', 'owner']);
  await expect(page.locator('[data-demo-out]')).toHaveText('Status, Owner');
});

test('at the maximum the unchecked boxes wait and the status says why', async ({ page }) => {
  await open(page);
  await list(page).getByRole('checkbox', { name: 'Site' }).check();
  await list(page).getByRole('checkbox', { name: 'Model' }).check();
  await expect(list(page).getByRole('checkbox', { name: 'Last seen' })).toBeDisabled();
  await expect(page.locator('.ds-orderedchoice__status')).toHaveText('Up to 5 items');
  await list(page).getByRole('checkbox', { name: 'Site' }).uncheck();
  await expect(list(page).getByRole('checkbox', { name: 'Last seen' })).toBeEnabled();
  await expect(page.locator('.ds-orderedchoice__status')).toBeHidden();
});

test('Alt with an arrow, Home and End move the row at once and keep the focus; one ds:change each', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.__changes = [];
    document.querySelector('[data-demo="columns"]').addEventListener('ds:change', (event) => window.__changes.push(event.detail.value));
  });
  const owner = list(page).getByRole('checkbox', { name: 'Owner' });
  await owner.focus();
  await page.keyboard.press('Alt+ArrowUp');
  expect(await control(page, 'get')).toEqual(['name', 'owner', 'status']);
  await expect(owner).toBeFocused();
  await page.keyboard.press('Alt+Home');
  expect(await control(page, 'get')).toEqual(['owner', 'name', 'status']);
  await page.keyboard.press('Alt+End');
  expect((await control(page, 'order')).at(-1)).toBe('owner');
  await expect(owner).toBeFocused();
  expect(await page.evaluate(() => window.__changes.length)).toBe(3);
  await expect(page.locator('.ds-toasts [aria-live], .ds-sr[aria-live]').filter({ hasText: /Owner.*position 7 of 7/ })).toHaveCount(1);
});

test('the grip lifts by Space, the arrows move, Space drops; Escape cancels', async ({ page }) => {
  await open(page);
  const grip = list(page).getByRole('button', { name: 'Move Status' });
  await grip.focus();
  await page.keyboard.press('Space');
  await expect(list(page).locator('[data-ds-dragging]')).toHaveCount(1);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Space');
  await settle(page);
  expect(await control(page, 'get')).toEqual(['status', 'name', 'owner']);
  expect(await ranks(page)).toEqual(['1', '2', '3', '', '', '', '']);
  await grip.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await settle(page);
  expect(await control(page, 'get')).toEqual(['status', 'name', 'owner']);
});

test('a pointer drag by the grip moves the row', async ({ page }) => {
  await open(page);
  const grip = list(page).getByRole('button', { name: 'Move Owner' });
  const rows = list(page).locator('.ds-orderedchoice__item');
  const first = await rows.first().boundingBox();
  const from = await grip.boundingBox();
  const x = from.x + from.width / 2;
  const y = from.y + from.height / 2;
  // Past the first row's middle: the moved row's centre leads.
  const dy = first.y - y - 4;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step += 1) await page.mouse.move(x, y + (dy * step) / 10);
  await page.mouse.up();
  await settle(page);
  expect(await control(page, 'get')).toEqual(['owner', 'name', 'status']);
});

test('set() lays out and checks without an event', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-demo="columns"]');
    let events = 0;
    el.addEventListener('ds:change', () => { events += 1; });
    const c = DS.get(el, 'orderedchoice');
    c.set(['seen', 'name']);
    return { value: c.get(), order: c.order(), events };
  });
  expect(result.value).toEqual(['seen', 'name']);
  expect(result.order.slice(0, 3)).toEqual(['seen', 'name', 'status']);
  expect(result.events).toBe(0);
});

test('forced colours: the box keeps its border and the disc an edge', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const edges = await list(page).evaluate((el) => [getComputedStyle(el).borderTopStyle, getComputedStyle(el.querySelector('.ds-orderedchoice__rank')).borderTopStyle]);
  expect(edges).toEqual(['solid', 'solid']);
});
