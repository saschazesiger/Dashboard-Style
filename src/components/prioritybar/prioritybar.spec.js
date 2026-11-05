/**
 * The priority action bar (DS.prioritybar): every action while there is
 * room and no More; narrower, the lowest priority folds first (the last
 * among equals), More appears, and its menu holds the same commands in the
 * bar's order (a toggle as a check item); a pick presses the action; wider
 * again, they come back. The toolbar is one tab stop with the arrow keys;
 * a focused action that folds hands its focus to More; the arrow keys of
 * the menu stay in the menu; the bar keeps its height; 360px; forced
 * colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=prioritybar');
  await ready(page);
  await page.mouse.move(1, 1);
}

const frame = (page) => page.locator('[data-demo="frame"]');
const bar = (page) => frame(page).locator('.ds-priority-bar');
const shown = (page) => bar(page).evaluate((el) => [...el.querySelectorAll(':scope > [data-demo-action]:not([data-ds-folded])')].map((action) => action.getAttribute('data-demo-action')));
const resize = (page, width) => frame(page).evaluate((el, width) => { el.style.inlineSize = width; }, width);

test('room for everything: every action, no More', async ({ page }) => {
  await open(page);
  await expect(bar(page)).toHaveAttribute('role', 'toolbar');
  await expect(bar(page)).toHaveAccessibleName('Ticket actions');
  expect(await shown(page)).toEqual(['Edit', 'Assign', 'Label', 'Mute', 'Archive', 'Duplicate', 'Delete']);
  await expect(bar(page).locator('.ds-priority-bar__more')).toBeHidden();
  await expect(bar(page).locator('.ds-priority-bar__more')).toHaveAttribute('data-ds-folded', '');
});

test('narrower: the lowest priority folds first, the last among equals; wider, they come back', async ({ page }) => {
  await open(page);
  const more = bar(page).locator('.ds-priority-bar__more');
  const heights = [await bar(page).evaluate((el) => el.getBoundingClientRect().height)];
  await resize(page, '520px');
  // Folded first: the priority 0 ones from the end, then Delete (1), Assign (2), Edit (3).
  const ORDER = ['Duplicate', 'Archive', 'Mute', 'Label', 'Delete', 'Assign', 'Edit'];
  const BAR = ['Edit', 'Assign', 'Label', 'Mute', 'Archive', 'Duplicate', 'Delete'];
  await expect.poll(() => shown(page)).not.toHaveLength(7);
  const now = await shown(page);
  const folded = ORDER.slice(0, 7 - now.length);
  expect(now).toEqual(BAR.filter((name) => !folded.includes(name)));
  expect(now).toContain('Delete');
  await expect(more).toBeVisible();
  await expect(more).toHaveAccessibleName('More actions');
  await expect(more).toHaveAttribute('aria-haspopup', 'menu');
  heights.push(await bar(page).evaluate((el) => el.getBoundingClientRect().height));
  await resize(page, '300px');
  await expect.poll(() => shown(page)).toEqual(['Edit', 'Assign']);
  await resize(page, '160px');
  await expect.poll(() => shown(page)).toEqual(['Edit']);
  heights.push(await bar(page).evaluate((el) => el.getBoundingClientRect().height));
  // Everything fits in the bar, More included.
  const fits = await bar(page).evaluate((el) => {
    const box = el.getBoundingClientRect();
    return [...el.children].filter((child) => child.getClientRects().length).every((child) => child.getBoundingClientRect().right <= box.right + 0.5);
  });
  expect(fits).toBe(true);
  await resize(page, '100%');
  await expect.poll(() => shown(page)).toHaveLength(7);
  await expect(more).toBeHidden();
  // The bar never changes its height while it folds.
  expect(new Set(heights.map(Math.round)).size).toBe(1);
});

test('More holds the same commands: in the bar\'s order, a toggle as a check item, a pick presses the action', async ({ page }) => {
  await open(page);
  await resize(page, '300px');
  await expect.poll(() => shown(page)).toEqual(['Edit', 'Assign']);
  const more = bar(page).locator('.ds-priority-bar__more');
  await more.click();
  const menu = bar(page).locator('.ds-priority-bar__menu');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('role', 'menu');
  const items = menu.locator('.ds-menu__item');
  expect(await items.evaluateAll((list) => list.map((item) => [item.getAttribute('role'), item.textContent.trim()]))).toEqual([
    ['menuitem', 'Label'],
    ['menuitemcheckbox', 'Mute'],
    ['menuitem', 'Archive'],
    ['menuitem', 'Duplicate'],
    ['menuitem', 'Delete'],
  ]);
  await expect(menu.getByRole('menuitemcheckbox', { name: 'Mute' })).toHaveAttribute('aria-checked', 'false');
  await menu.getByRole('menuitemcheckbox', { name: 'Mute' }).click();
  // The folded toggle flipped, as a press in the bar would.
  await expect(bar(page).locator('[data-demo-action="Mute"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(menu).toBeHidden();
  await more.click();
  await expect(menu.getByRole('menuitemcheckbox', { name: 'Mute' })).toHaveAttribute('aria-checked', 'true');
  await menu.getByRole('menuitem', { name: 'Archive' }).click();
  await expect(page.locator('.ds-toast').filter({ hasText: 'Archive: done.' })).toBeVisible();
});

test('keyboard: one tab stop, the arrows move along what shows, More opens on ArrowDown, Escape comes back', async ({ page }) => {
  await open(page);
  await resize(page, '300px');
  await expect.poll(() => shown(page)).toEqual(['Edit', 'Assign']);
  const edit = bar(page).locator('[data-demo-action="Edit"]');
  const more = bar(page).locator('.ds-priority-bar__more');
  await focusByKeyboard(page, edit);
  expect(await bar(page).evaluate((el) => [...el.querySelectorAll(':scope > .ds-btn')].filter((b) => b.tabIndex === 0).length)).toBe(1);
  await page.keyboard.press('ArrowRight');
  await expect(bar(page).locator('[data-demo-action="Assign"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(more).toBeFocused();
  await page.keyboard.press('Home');
  await expect(edit).toBeFocused();
  await page.keyboard.press('End');
  await expect(more).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const menu = bar(page).locator('.ds-priority-bar__menu');
  await expect(menu).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.textContent.trim())).toBe('Label');
  // The menu's arrows move in the menu, not along the toolbar.
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => page.evaluate(() => document.activeElement?.textContent.trim())).toBe('Mute');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(menu).toBeVisible();
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.ds-priority-bar__menu')))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();
  // Tab leaves the toolbar in one step.
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-demo="frame"]')))).toBe(false);
});

test('a focused action that folds hands its focus to More', async ({ page }) => {
  await open(page);
  const label = bar(page).locator('[data-demo-action="Label"]');
  await focusByKeyboard(page, bar(page).locator('[data-demo-action="Edit"]'));
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(label).toBeFocused();
  await resize(page, '300px');
  await expect(bar(page).locator('.ds-priority-bar__more')).toBeFocused();
});

test('the imperative API: create, get, update; plan() decides', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(() => {
    const host = document.createElement('div');
    host.style.inlineSize = '200px';
    host.innerHTML = '<div class="ds-priority-bar" role="toolbar" aria-label="Probe"><button class="ds-btn" type="button">Alpha</button><button class="ds-btn" type="button">Bravo</button><button class="ds-btn" type="button" data-ds-priority="5">Charlie</button></div>';
    document.querySelector('#fx-component').append(host);
    const element = host.firstElementChild;
    const control = DS.prioritybar.create(element);
    const folded = control.get().map((action) => action.textContent);
    host.style.inlineSize = '800px';
    control.update();
    const after = control.get().length;
    const made = Boolean(element.querySelector('.ds-priority-bar__more[data-ds-keep]'));
    control.destroy();
    const cleaned = !element.querySelector('.ds-priority-bar__more, .ds-priority-bar__menu, [data-ds-folded]');
    host.remove();
    return { folded, after, made, cleaned, plan: DS.prioritybar.plan({ widths: [50, 50, 50], priorities: [0, 1, 0], available: 120, more: 20, gap: 0 }) };
  });
  expect(out.folded).toContain('Bravo');
  expect(out.folded).not.toContain('Charlie');
  expect(out).toMatchObject({ after: 0, made: true, cleaned: true, plan: [2] });
  expect(await page.evaluate(() => DS.prioritybar.plan({ widths: [50, 50, 50], priorities: [0, 1, 0], available: 100, more: 20, gap: 0 }))).toEqual([0, 2]);
});

test('options: the gap with the density, the touch minimum on every action and More, 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const out = await page.evaluate(async () => {
    const result = {};
    for (const cls of ['', 'ds-density-tight', 'ds-touch']) {
      const region = document.createElement('div');
      region.className = cls;
      region.innerHTML = '<div class="ds-priority-bar" role="toolbar" aria-label="P"><button class="ds-btn ds-btn--quiet" type="button">Edit</button><button class="ds-btn ds-btn--quiet" type="button">Assign</button><button class="ds-btn ds-btn--quiet" type="button">Archive</button><button class="ds-btn ds-btn--quiet" type="button">Duplicate</button><button class="ds-btn ds-btn--quiet" type="button">Delete</button></div>';
      document.querySelector('#fx-component').append(region);
      const element = region.firstElementChild;
      const control = DS.prioritybar.create(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const visible = [...element.children].filter((child) => child.getClientRects().length);
      result[cls || 'comfortable'] = { gap: parseFloat(getComputedStyle(element).columnGap), min: Math.min(...visible.map((child) => child.getBoundingClientRect().height)), more: visible.some((child) => child.matches('.ds-priority-bar__more')), width: element.getBoundingClientRect().width };
      control.destroy();
      region.remove();
    }
    return result;
  });
  expect(out.comfortable.gap).toBe(4);
  expect(out['ds-density-tight'].gap).toBe(1);
  expect(out['ds-touch'].min).toBe(48);
  for (const entry of Object.values(out)) expect(entry.more).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('forced colours: More and its menu keep their system colours and the menu its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await resize(page, '300px');
  const more = bar(page).locator('.ds-priority-bar__more');
  await expect(more).toBeVisible();
  await more.click();
  const menu = bar(page).locator('.ds-priority-bar__menu');
  await expect(menu).toBeVisible();
  const edge = await menu.evaluate((el) => Math.max(parseFloat(getComputedStyle(el).outlineWidth) || 0, parseFloat(getComputedStyle(el).borderTopWidth) || 0));
  expect(edge).toBeGreaterThan(0);
});
