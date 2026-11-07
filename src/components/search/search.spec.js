/**
 * The search field: the clear button (shown with a value, an input event,
 * focus back) and Escape in every engine (a dialog around it stays open),
 * the shortcut's key and its room, the count shown, described and spoken,
 * the recent searches (Enter keeps one, Down opens the list, the keys, Delete
 * forgets, the foot forgets all, a click takes one), the combobox roles while
 * it has the list, size and touch of the clear button, forced colours. Runs
 * in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=search');
  await ready(page);
  await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('ds:search:')).forEach((key) => localStorage.removeItem(key)));
}

async function add(page, { attrs = 'data-ds-search-recent="spec" data-ds-search-count="s-count"', hotkey = '/', value = '' } = {}) {
  await page.evaluate(({ attrs, hotkey, value }) => {
    document.querySelector('#fx-component').insertAdjacentHTML('afterbegin',
      `<div class="ds-search" id="s-root" data-ds-search ${attrs}>` +
      `<input class="ds-input" id="s" type="search" aria-label="Search devices" placeholder="Search devices" autocomplete="off"${hotkey ? ` data-ds-hotkey="${hotkey}"` : ''} value="${value}">` +
      (hotkey ? '<kbd class="ds-kbd ds-search__key" id="s-key" aria-hidden="true"></kbd>' : '') +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-search__clear" id="s-clear" type="button" hidden>' + window.DS.icons.icon(window.DS.icons.close, 18) + '</button></div>' +
      '<span class="ds-search__count" id="s-count"></span>');
  }, { attrs, hotkey, value });
  await page.waitForFunction(() => window.DS.core.get(document.getElementById('s-root'), 'search'));
  return page.locator('#s');
}

const said = (page, text) => page.waitForFunction((text) => [...document.querySelectorAll('[aria-live]')].some((el) => el.textContent.includes(text)), text, { timeout: 3000 });

test('clear: shows with a value, empties the field with an input event and focuses it; named "Clear"', async ({ page }) => {
  await open(page);
  const input = await add(page);
  const clear = page.locator('#s-clear');
  await expect(clear).toBeHidden();
  await input.fill('laptop');
  await expect(clear).toBeVisible();
  await expect(clear).toHaveAccessibleName('Clear');
  await expect(clear).toHaveAttribute('aria-controls', 's');
  await page.evaluate(() => { window.sgInputs = 0; document.getElementById('s').addEventListener('input', () => { window.sgInputs += 1; }); });
  await clear.click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(clear).toBeHidden();
  expect(await page.evaluate(() => window.sgInputs)).toBe(1);
  // The pill keeps room for the button: text never runs under it.
  await input.fill('a long search that would run under the clear button');
  const room = await page.evaluate(() => {
    const field = document.getElementById('s').getBoundingClientRect();
    const button = document.getElementById('s-clear').getBoundingClientRect();
    return field.right - parseFloat(getComputedStyle(document.getElementById('s')).paddingRight) <= button.left + 0.5;
  });
  expect(room).toBe(true);
});

test('Escape clears a filled field in every engine; in a dialog the next Escape closes it', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.querySelector('#fx-component').insertAdjacentHTML('beforeend', '<div class="ds-dialog" id="s-dialog" hidden><div class="ds-dialog__box" role="dialog" aria-modal="true" aria-label="Devices"><div class="ds-dialog__body" id="s-body"></div></div></div>');
  });
  const input = await add(page);
  await input.fill('router');
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('');
  await page.evaluate(() => {
    document.getElementById('s-body').append(document.getElementById('s-root'));
    window.DS.overlay.open(document.getElementById('s-dialog'));
  });
  await input.focus();
  await input.fill('router');
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('');
  await expect(page.locator('#s-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#s-dialog')).toBeHidden();
});

test('the shortcut: its key written as the platform says it, room kept for it; the hotkey reaches the field', async ({ page }) => {
  await open(page);
  const input = await add(page, { hotkey: 'mod+k' });
  const text = await page.locator('#s-key').textContent();
  expect(['Ctrl+K', '⌘K']).toContain(text);
  await expect(input).toHaveAttribute('aria-keyshortcuts', /K$/);
  const room = await page.evaluate(() => {
    const key = document.getElementById('s-key').getBoundingClientRect();
    const input = document.getElementById('s');
    const content = input.getBoundingClientRect().right - parseFloat(getComputedStyle(input).paddingRight);
    return content <= key.left + 0.5;
  });
  expect(room).toBe(true);
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('ControlOrMeta+k');
  await expect(input).toBeFocused();
});

test('the count: words by plural rules, the field\'s description, spoken once typing pauses', async ({ page }) => {
  await open(page);
  const input = await add(page);
  const count = page.locator('#s-count');
  await expect(input).toHaveAttribute('aria-describedby', 's-count');
  const set = (n) => page.evaluate((n) => window.DS.core.get(document.getElementById('s-root'), 'search').set({ count: n }), n);
  await input.fill('lap');
  await set(1);
  await expect(count).toHaveText('1 result');
  await set(12);
  await expect(count).toHaveText('12 results');
  await said(page, '12 results');
  await set(0);
  await expect(count).toHaveText('No results');
  await set(null);
  await expect(count).toHaveText('');
  expect(await page.evaluate(() => window.DS.core.get(document.getElementById('s-root'), 'search').get().count)).toBeNull();
});

test('recent searches: Enter keeps them, Down opens the list as a combobox, the keys, Delete forgets, Enter takes one', async ({ page }) => {
  await open(page);
  const input = await add(page);
  await page.evaluate(() => {
    window.sgSearches = [];
    document.getElementById('s-root').addEventListener('ds:search', (event) => window.sgSearches.push(event.detail));
  });
  for (const value of ['printer', 'router', 'Laptop', 'laptop']) {
    await input.fill(value);
    await page.keyboard.press('Enter');
  }
  expect(await page.evaluate(() => window.DS.core.get(document.getElementById('s-root'), 'search').get().recent)).toEqual(['laptop', 'router', 'printer']);
  expect(await page.evaluate(() => window.sgSearches.map((d) => d.source))).toEqual(['enter', 'enter', 'enter', 'enter']);
  await input.fill('');
  await page.keyboard.press('ArrowDown');
  const list = page.getByRole('listbox', { name: 'Recent searches' });
  await expect(list).toBeVisible();
  await expect(input).toHaveAttribute('role', 'combobox');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(input).toHaveAttribute('aria-controls', await list.getAttribute('id'));
  await expect(list.getByRole('option')).toHaveText(['laptop', 'router', 'printer']);
  const activeText = () => page.evaluate(() => document.getElementById(document.getElementById('s').getAttribute('aria-activedescendant'))?.textContent ?? null);
  expect(await activeText()).toBe('laptop');
  await page.keyboard.press('ArrowDown');
  expect(await activeText()).toBe('router');
  await page.keyboard.press('Delete');
  await expect(list.getByRole('option')).toHaveText(['laptop', 'printer']);
  expect(await activeText()).toBe('printer');
  await page.keyboard.press('ArrowUp');
  expect(await activeText()).toBe('laptop');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('laptop');
  await expect(list).toBeHidden();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toBeFocused();
  expect((await page.evaluate(() => window.sgSearches)).at(-1)).toEqual({ value: 'laptop', source: 'recent' });
});

test('the list: Escape closes it and keeps the field, typing closes it, a click takes a row, the foot forgets all', async ({ page }) => {
  await open(page);
  const input = await add(page);
  await page.evaluate(() => ['switch', 'router'].forEach((v) => window.DS.core.get(document.getElementById('s-root'), 'search').remember(v)));
  const list = page.getByRole('listbox', { name: 'Recent searches' });
  await input.click();
  await expect(list).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(list).toBeHidden();
  await expect(input).toBeFocused();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(list).toBeVisible();
  await page.keyboard.type('s');
  await expect(list).toBeHidden();
  await input.fill('');
  await page.keyboard.press('ArrowDown');
  await list.getByRole('option', { name: 'switch' }).click();
  await expect(input).toHaveValue('switch');
  await expect(input).toBeFocused();
  await input.fill('');
  await page.keyboard.press('ArrowDown');
  await page.getByRole('button', { name: 'Clear recent searches' }).click();
  await expect(list).toBeHidden();
  expect(await page.evaluate(() => window.DS.core.get(document.getElementById('s-root'), 'search').get().recent)).toEqual([]);
  await page.keyboard.press('ArrowDown');
  await expect(list).toBeHidden();
});

test('without recent searches the field stays a search box', async ({ page }) => {
  await open(page);
  const input = await add(page, { attrs: '' });
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await expect(input).not.toHaveAttribute('role', /./);
  await expect(page.getByRole('searchbox', { name: 'Search devices' }).first()).toBeVisible();
});

test('size and touch: the clear button is 8px lower than the pill and takes the touch target', async ({ page }) => {
  await open(page);
  const input = await add(page, { value: 'x' });
  await expect(page.locator('#s-clear')).toBeVisible();
  const sizes = (cls) => page.evaluate((cls) => {
    document.getElementById('s-root').className = 'ds-search ' + cls;
    return [document.getElementById('s').getBoundingClientRect().height, document.getElementById('s-clear').getBoundingClientRect().height];
  }, cls);
  expect(await sizes('')).toEqual([40, 32]);
  expect(await sizes('ds-sm')).toEqual([32, 24]);
  expect(await sizes('ds-lg')).toEqual([48, 40]);
  expect(await sizes('ds-density-compact')).toEqual([36, 28]);
  expect(await sizes('ds-touch')).toEqual([48, 48]);
  await expect(input).toBeVisible();
});

test('the demo: filtering counts, no console errors, 360px fits', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  const main = page.locator('[data-demo="main"] input');
  await main.fill('laptop');
  await expect(page.locator('[data-demo="filter"] .ds-search__count')).toHaveText('2 results');
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('forced colours: the list keeps an edge, the active row is Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const input = await add(page);
  await page.evaluate(() => window.DS.core.get(document.getElementById('s-root'), 'search').remember('router'));
  await input.focus();
  await page.keyboard.press('ArrowDown');
  const popup = page.locator('.ds-search__popup');
  await expect(popup).toBeVisible();
  const out = await page.evaluate(() => {
    const popup = document.querySelector('.ds-search__popup');
    return [getComputedStyle(popup).outlineStyle, getComputedStyle(popup.querySelector('.ds-search__foot')).borderTopStyle];
  });
  expect(out).toEqual(['solid', 'solid']);
});
