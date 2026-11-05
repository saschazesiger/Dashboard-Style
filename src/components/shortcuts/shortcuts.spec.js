/**
 * The shortcut sheet (3.0): "?" opens it (never from a field) and closes it,
 * focus on the filter, every registration of DS.hotkeys listed with its keys
 * as one phrase, a blocked control off in words, scopes as sections with
 * their labels, the filter, a list that follows changes while open, the
 * inline render(), the options, a phone and forced colours. Runs in
 * `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=shortcuts');
  await ready(page);
  await page.mouse.move(1, 1);
}

const sheet = (page) => page.locator('[data-demo="sheet"]');
const rows = (page) => sheet(page).locator('.ds-shortcuts__item');

test('"?" opens the sheet with focus on its filter; "?" and Escape close it, focus back where it was', async ({ page }) => {
  await open(page);
  const save = page.getByRole('button', { name: 'Save' });
  await save.focus();
  await page.keyboard.press('?');
  await expect(sheet(page)).toHaveAttribute('data-state', 'open');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Find a shortcut' })).toBeFocused();
  // In the filter "?" types.
  await page.keyboard.press('?');
  await expect(page.getByRole('searchbox', { name: 'Find a shortcut' })).toHaveValue('?');
  // Escape first clears a filled search field of the overlay (DS.overlay), then closes.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('searchbox', { name: 'Find a shortcut' })).toHaveValue('');
  await expect(sheet(page)).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(sheet(page)).not.toHaveAttribute('data-state', 'open');
  await expect(save).toBeFocused();
  // "?" in a field types; it never opens the sheet.
  await page.getByRole('searchbox', { name: 'Search devices' }).focus();
  await page.keyboard.press('?');
  await expect(sheet(page)).not.toHaveAttribute('data-state', 'open');
  await expect(page.getByRole('searchbox', { name: 'Search devices' })).toHaveValue('?');
});

test('it lists every registration with its keys as one phrase, by group; a blocked control is off, in words', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Keyboard shortcuts/ }).click();
  await expect(sheet(page)).toHaveAttribute('data-state', 'open');
  const listed = await sheet(page).evaluate((el) => [...el.querySelectorAll('.ds-shortcuts__group')].map((group) => ({
    heading: group.querySelector('.ds-shortcuts__heading').textContent,
    named: document.getElementById(group.getAttribute('aria-labelledby')) === group.querySelector('.ds-shortcuts__heading'),
    items: [...group.querySelectorAll('.ds-shortcuts__item')].map((row) => [row.querySelector('.ds-shortcuts__label').firstChild.textContent, [...row.querySelectorAll('.ds-shortcuts__combo')].map((combo) => combo.getAttribute('aria-label')), row.hasAttribute('data-off')]),
  })));
  expect(listed).toEqual([
    { heading: 'Editing', named: true, items: [['Save', ['Ctrl+S'], false]] },
    { heading: 'Tickets', named: true, items: [['Open a ticket', ['N'], false]] },
    { heading: 'Devices', named: true, items: [['Restart the device', ['Ctrl+Shift+R'], true]] },
    { heading: 'Navigation', named: true, items: [['Go to search', ['/'], false]] },
    { heading: 'General', named: true, items: [['Show the keyboard shortcuts', ['?'], false]] },
  ]);
  await expect(sheet(page).locator('.ds-shortcuts__item[data-off] .ds-shortcuts__off')).toHaveText('Not available here');
  await expect(sheet(page).getByRole('img', { name: 'Ctrl+S', exact: true })).toBeVisible();
});

test('scopes: a section each once a second scope has shortcuts, the one that counts first first, global last; the list follows while open', async ({ page }) => {
  await open(page);
  await page.getByRole('switch', { name: 'Board view' }).check();
  await page.mouse.move(1, 1);
  await page.keyboard.press('?');
  await expect(sheet(page)).toHaveAttribute('data-state', 'open');
  await expect(sheet(page).locator('.ds-shortcuts__title')).toHaveText(['Board view', 'Everywhere']);
  const board = sheet(page).locator('.ds-shortcuts__scope').first();
  await expect(board.locator('.ds-shortcuts__label')).toHaveText(['Next card', 'Previous card', 'Move the card to the next column']);
  await expect(board.locator('.ds-shortcuts__or')).toHaveText(['or']);
  // A change while the sheet is open is listed at once.
  await page.evaluate(() => { window.__extra = DS.hotkeys.register('mod+e', () => {}, { description: 'Export', group: 'Editing' }); });
  await expect(sheet(page).locator('.ds-shortcuts__label', { hasText: 'Export' })).toBeVisible();
  await page.evaluate(() => window.__extra.destroy());
  await expect(sheet(page).locator('.ds-shortcuts__label', { hasText: 'Export' })).toHaveCount(0);
});

test('the filter hides what does not match, by description or keys; nothing left says so', async ({ page }) => {
  await open(page);
  await page.keyboard.press('?');
  const filter = page.getByRole('searchbox', { name: 'Find a shortcut' });
  await filter.fill('ticket');
  await expect(rows(page).locator('.ds-shortcuts__label')).toHaveText(['Open a ticket']);
  await filter.fill('/');
  await expect(rows(page).locator('.ds-shortcuts__label')).toHaveText(['Go to search']);
  await filter.fill('ctrl+shift+r');
  await expect(rows(page).locator('.ds-shortcuts__label')).toHaveText([/^Restart the device/]);
  await filter.fill('nothing like it');
  await expect(rows(page)).toHaveCount(0);
  await expect(sheet(page).locator('.ds-shortcuts__empty')).toHaveText('No results');
  // Opened again: the filter is empty (Escape clears it first, then closes).
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(sheet(page)).not.toHaveAttribute('data-state', 'open');
  await settle(page);
  await page.keyboard.press('?');
  await expect(filter).toHaveValue('');
  await expect(rows(page)).toHaveCount(5);
});

test('render() writes the same list into a help page and follows changes', async ({ page }) => {
  await open(page);
  const inline = page.locator('[data-demo="inline"]');
  await expect(inline.locator('.ds-shortcuts__item')).toHaveCount(5);
  await page.getByRole('switch', { name: 'Board view' }).check();
  await expect(inline.locator('.ds-shortcuts__title')).toHaveText(['Board view', 'Everywhere']);
  const count = await page.evaluate(() => DS.shortcuts.render(document.createElement('div')));
  expect(count).toBe(8);
});

test('the options: density changes a row, size the label\'s type, shape the keys', async ({ page }) => {
  await open(page);
  const measure = (classes) => page.evaluate((classes) => {
    const host = document.createElement('div');
    host.className = classes;
    document.querySelector('#fx-component').append(host);
    DS.shortcuts.render(host);
    const row = host.querySelector('.ds-shortcuts__item');
    const out = { height: row.getBoundingClientRect().height, font: getComputedStyle(row.querySelector('.ds-shortcuts__label')).fontSize, radius: parseFloat(getComputedStyle(row.querySelector('.ds-kbd')).borderTopLeftRadius) };
    host.remove();
    return out;
  }, classes);
  const plain = await measure('');
  const dense = await measure('ds-density-dense');
  expect(plain.height - dense.height).toBeCloseTo(8, 0);
  expect((await measure('ds-xl')).font).not.toBe(plain.font);
  expect((await measure('ds-shape-square')).radius).toBe(0);
});

test('a phone: one column, the sheet fits the width', async ({ page }) => {
  await open(page, 360);
  await page.keyboard.press('?');
  await settle(page);
  const layout = await sheet(page).evaluate((el) => {
    const groups = [...el.querySelectorAll('.ds-shortcuts__group')].map((group) => group.getBoundingClientRect());
    return { lefts: new Set(groups.map((box) => Math.round(box.left))).size, box: el.querySelector('.ds-dialog__box').getBoundingClientRect().right, wide: document.documentElement.scrollWidth };
  });
  expect(layout.lefts).toBe(1);
  expect(layout.box).toBeLessThanOrEqual(360);
  expect(layout.wide).toBeLessThanOrEqual(360);
});

test('forced colours: a shortcut that is off reads GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await page.keyboard.press('?');
  const colours = await sheet(page).evaluate((el) => {
    const off = el.querySelector('.ds-shortcuts__item[data-off] .ds-shortcuts__label');
    const on = el.querySelector('.ds-shortcuts__item:not([data-off]) .ds-shortcuts__label');
    // A row with one under it: its hairline is a border.
    const row = [...el.querySelectorAll('.ds-shortcuts__item')].find((item) => item.nextElementSibling);
    return { off: getComputedStyle(off).color, on: getComputedStyle(on).color, border: row ? getComputedStyle(row).borderBottomStyle : 'solid' };
  });
  expect(colours.off).not.toBe(colours.on);
  expect(colours.border).toBe('solid');
});
