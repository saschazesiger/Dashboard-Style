/**
 * The command palette (3.0): Ctrl+K through DS.hotkeys, the APG combobox in a
 * modal dialog (roles, names, aria-activedescendant), the fuzzy search and its
 * marks, the keys, running a command (focus back to the opener first), pages
 * and prefixes, the async search with its busy state, recent commands through
 * DS.store (never a provider's result), safe hrefs, aria-expanded while
 * nothing matches, create() after destroy(), the commands' shortcuts, a blocked and the empty state, the rows
 * on the options model, a phone and forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=command');
  await ready(page);
  await page.evaluate(() => localStorage.clear());
  await page.mouse.move(1, 1);
}

const dialog = (page) => page.locator('[data-demo="palette"]');
const field = (page) => page.getByRole('combobox', { name: 'Search commands' });
const active = (page) => page.evaluate(() => {
  const input = document.querySelector('.ds-command__input');
  const id = input.getAttribute('aria-activedescendant');
  const option = id ? document.getElementById(id) : null;
  return option ? option.querySelector('.ds-command__label').textContent : null;
});

test('Ctrl+K opens it with focus in the field; the combobox, the listbox and their names', async ({ page }) => {
  await open(page);
  const opener = page.getByRole('button', { name: 'Search or run a command' });
  await opener.focus();
  await page.keyboard.press('Control+k');
  await expect(dialog(page)).toHaveAttribute('data-state', 'open');
  await expect(field(page)).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
  const aria = await page.evaluate(() => {
    const input = document.querySelector('.ds-command__input');
    const list = document.getElementById(input.getAttribute('aria-controls'));
    return { expanded: input.getAttribute('aria-expanded'), autocomplete: input.getAttribute('aria-autocomplete'), role: list.getAttribute('role'), label: list.getAttribute('aria-label'), groups: [...list.querySelectorAll('[role="group"]')].map((group) => document.getElementById(group.getAttribute('aria-labelledby')).textContent) };
  });
  expect(aria).toEqual({ expanded: 'true', autocomplete: 'list', role: 'listbox', label: 'Commands', groups: ['Devices', 'Tickets', 'Actions', 'Settings', 'Help'] });
  expect(await active(page)).toBe('Add a device');
  await expect(page.getByRole('option', { name: /Add a device/ })).toHaveAttribute('aria-selected', 'true');
  await expect(opener).toHaveAttribute('aria-keyshortcuts', 'Control+K');
  // The same combo closes it, and focus is back on the opener.
  await page.keyboard.press('Control+k');
  await expect(dialog(page)).not.toHaveAttribute('data-state', 'open');
  await expect(opener).toBeFocused();
});

test('typing finds commands with their letters marked; the status says how many', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Search or run a command' }).click();
  await field(page).fill('adddev');
  await expect(page.locator('.ds-command__item')).toHaveCount(1);
  const marks = await page.locator('.ds-command__item .ds-command__match').allTextContents();
  expect(marks).toEqual(['Add', 'dev']);
  await expect(page.locator('.ds-command__status')).toHaveText('1 result');
  await field(page).fill('dev');
  await expect(page.locator('.ds-command__status')).toHaveText(/^\d+ results$/);
  // Accents and case aside, and a keyword finds it too.
  await field(page).fill('CSV');
  await expect(page.locator('.ds-command__item .ds-command__label')).toHaveText(['Import devices from a file']);
});

test('the keys: arrows wrap, PageDown and PageUp jump between groups, Enter runs and focus goes back first', async ({ page }) => {
  await open(page);
  const opener = page.getByRole('button', { name: 'Search or run a command' });
  await opener.click();
  await expect(field(page)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  expect(await active(page), 'ArrowUp from the first wraps to the last').toBe('Show the keyboard shortcuts');
  await page.keyboard.press('ArrowDown');
  expect(await active(page)).toBe('Add a device');
  await page.keyboard.press('PageDown');
  expect(await active(page), 'the first of the next group').toBe('Open a ticket');
  await page.keyboard.press('PageUp');
  expect(await active(page), 'the start of the group before').toBe('Add a device');
  await page.keyboard.press('ArrowDown');
  expect(await active(page)).toBe('Open devices');
  await expect(field(page), 'focus never leaves the field').toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog(page)).not.toHaveAttribute('data-state', 'open');
  await expect(opener).toBeFocused();
  await expect(page.locator('.ds-toasts .ds-toast__text', { hasText: 'Opened the devices.' })).toBeVisible();
});

test('a blocked command is reached, never run', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Search or run a command' }).click();
  await field(page).fill('retire');
  const option = page.getByRole('option', { name: /Retire devices/ });
  await expect(option).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  // A click too (dispatched: Playwright waits for an aria-disabled element to be enabled).
  await option.dispatchEvent('click');
  await expect(dialog(page)).toHaveAttribute('data-state', 'open');
  await expect(page.locator('.ds-toasts .ds-toast')).toHaveCount(0);
});

test('a page: its label before the field, Backspace and Escape go back, Escape on the first page closes', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Search or run a command' }).click();
  await field(page).fill('theme');
  await page.keyboard.press('Enter');
  await expect(page.locator('.ds-command__back')).toBeVisible();
  await expect(page.locator('.ds-command__back')).toContainText('Change the theme');
  await expect(page.getByRole('listbox')).toHaveAttribute('aria-label', 'Change the theme');
  await expect(page.locator('.ds-command__item .ds-command__label')).toHaveText(['Light', 'Dark', 'As the system']);
  await expect(field(page)).toHaveValue('');
  await page.keyboard.press('Backspace');
  await expect(page.locator('.ds-command__back')).toBeHidden();
  await field(page).fill('theme');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.locator('.ds-command__back')).toBeHidden();
  await expect(dialog(page), 'Escape in a page goes back, it does not close').toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(dialog(page)).not.toHaveAttribute('data-state', 'open');
});

test('a prefix typed first enters its page; the slow search is busy, then answers; a newer query wins', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Search or run a command' }).click();
  await field(page).pressSequentially('>');
  await expect(page.locator('.ds-command__back')).toContainText('Run an action');
  await expect(field(page)).toHaveValue('');
  await page.keyboard.press('Backspace');
  await field(page).pressSequentially('#');
  await expect(page.locator('.ds-command__back')).toContainText('Search tickets');
  const list = page.locator('.ds-command__list');
  await expect(list).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.ds-command__status')).toHaveText('Loading');
  await expect(page.locator('.ds-command__status .ds-spinner')).toBeVisible();
  await expect(page.locator('.ds-command__item')).toHaveCount(4);
  await expect(list).not.toHaveAttribute('aria-busy', 'true');
  await field(page).pressSequentially('print');
  await expect(page.locator('.ds-command__item .ds-command__label')).toHaveText(['Cannot reach the printer']);
  await expect(page.locator('.ds-command__item .ds-command__match').first()).toBeVisible();
});

test('nothing found: the list hides, the message says so', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Nothing found' }).click();
  await expect(field(page)).toHaveValue('zzz');
  await expect(page.locator('.ds-command__empty')).toHaveText('No results for "zzz"');
  await expect(page.locator('.ds-command__list')).toBeHidden();
  await expect(page.locator('.ds-command__status')).toHaveText('0 results');
  expect(await page.evaluate(() => document.querySelector('.ds-command__input').hasAttribute('aria-activedescendant'))).toBe(false);
  // The APG combobox: not expanded while its list is hidden, expanded again once it shows.
  await expect(field(page)).toHaveAttribute('aria-expanded', 'false');
  await field(page).fill('');
  await expect(page.locator('.ds-command__list')).toBeVisible();
  await expect(field(page)).toHaveAttribute('aria-expanded', 'true');
});

test('recent commands lead the empty field, remembered through DS.store', async ({ page }) => {
  await open(page);
  const opener = page.getByRole('button', { name: 'Search or run a command' });
  await opener.click();
  await field(page).fill('ticket');
  await page.keyboard.press('Enter');
  await expect(dialog(page)).not.toHaveAttribute('data-state', 'open');
  await settle(page);
  await opener.click();
  const first = page.locator('.ds-command__group').first();
  await expect(first.locator('.ds-command__heading')).toHaveText('Recent');
  await expect(first.locator('.ds-command__label')).toHaveText(['Open a ticket']);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem(`ds:command:${document.querySelector('[data-demo="palette"]').id}`)));
  expect(stored).toEqual(['new-ticket']);
  // A provider's result runs, but never takes a Recent slot: it could not show there again.
  await field(page).fill('LAPTOP-0042');
  await page.locator('.ds-command__item', { hasText: 'Issued to Ada Lovelace' }).first().click();
  await expect(dialog(page)).not.toHaveAttribute('data-state', 'open');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem(`ds:command:${document.querySelector('[data-demo="palette"]').id}`)));
  expect(after).toEqual(['new-ticket']);
});

test('an href from data is followed only when safe; a javascript: URL goes to reportError', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const el = document.querySelector('[data-demo="palette"]');
    const palette = DS.command.create(el);
    const reported = [];
    window.reportError = (error) => reported.push(String(error && error.message));
    palette.set({ commands: [{ id: 'bad', label: 'Bad link', href: 'javascript:window.__pwn=1' }, { id: 'worse', label: 'Data link', href: 'data:text/html,x' }] });
    palette.run('bad');
    palette.run('worse');
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { reported, pwned: window.__pwn ?? null, url: location.href };
  });
  expect(seen.pwned).toBeNull();
  expect(seen.reported).toHaveLength(2);
  expect(seen.reported[0]).toContain('Bad link');
  expect(seen.url).toContain('component.html?c=command');
});

test('a palette made by create() and destroyed: the next create() makes a new one, and Ctrl+K opens it', async ({ page }) => {
  await open(page);
  const fresh = await page.evaluate(() => {
    const el = document.querySelector('[data-demo="palette"]');
    const before = DS.command.create(el);
    before.destroy();
    const after = DS.command.create(el, { commands: [{ id: 'one', label: 'The only command', run() {} }] });
    return after !== before;
  });
  expect(fresh).toBe(true);
  await page.keyboard.press('Control+k');
  await expect(dialog(page)).toHaveAttribute('data-state', 'open');
  await expect(page.locator('.ds-command__item .ds-command__label')).toHaveText(['The only command']);
});

test('a command\'s shortcut shows as keys and runs it without the palette; the sheet lists it', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Search or run a command' }).click();
  const option = page.getByRole('option', { name: /Add a device/ });
  await expect(option).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+A');
  await expect(option.locator('.ds-command__shortcut kbd')).toHaveText(['Ctrl', 'Shift', 'A']);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).not.toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Control+Shift+A');
  await expect(page.locator('.ds-toasts .ds-toast__text', { hasText: 'Opened the new device form.' })).toBeVisible();
  const listed = await page.evaluate(() => DS.hotkeys.list().flatMap((group) => group.items.map((item) => item.description)));
  expect(listed).toEqual(expect.arrayContaining(['Open the command palette', 'Add a device', 'Export the inventory']));
});

test('an option at every size x density, with and without touch; the shape on its radius', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `ds-command ${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<div class="ds-command__list"><div class="ds-command__item"><span class="ds-command__content"><span class="ds-command__label">Row</span></span></div></div>';
          document.querySelector('#fx-component').append(region);
          const item = region.querySelector('.ds-command__item');
          out.push({ touch, density, size, height: item.getBoundingClientRect().height, line: parseFloat(getComputedStyle(item.querySelector('.ds-command__label')).lineHeight) });
          region.remove();
        }
      }
    }
    const shape = (cls) => {
      const region = document.createElement('div');
      region.className = `ds-command ${cls}`;
      region.innerHTML = '<div class="ds-command__item">Row</div>';
      document.querySelector('#fx-component').append(region);
      const radius = parseFloat(getComputedStyle(region.firstChild).borderTopLeftRadius);
      region.remove();
      return radius;
    };
    return { out, square: shape('ds-shape-square'), plain: shape(''), round: shape('ds-shape-round') };
  }, { sizes: SIZES, densities: DENSITIES });
  for (const entry of measured.out) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const want = Math.max(entry.touch ? 48 : 0, 48 + step * 8 + density * 4);
    expect(entry.height, `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`).toBeGreaterThanOrEqual(want - 0.5);
    expect(entry.height, `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`).toBeLessThanOrEqual(Math.max(want, entry.line + 2 * (8 + density * 2)) + 0.5);
  }
  expect(measured.square).toBe(0);
  expect(measured.plain).toBeGreaterThan(0);
  expect(measured.round).toBeCloseTo(measured.plain * 1.5, 1);
});

test('a phone: the box fills the window, Cancel closes it', async ({ page }) => {
  await open(page, 360);
  await page.getByRole('button', { name: 'Search or run a command' }).click();
  await settle(page);
  const box = await page.locator('[data-demo="palette"] .ds-dialog__box').boundingBox();
  expect(box.width).toBeCloseTo(360, 0);
  expect(box.y).toBeCloseTo(0, 0);
  await expect(page.locator('.ds-command__search .ds-kbd')).toBeHidden();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog(page)).not.toHaveAttribute('data-state', 'open');
});

test('forced colours: the active option keeps a ring, a match its underline', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await page.getByRole('button', { name: 'Search or run a command' }).click();
  await field(page).fill('dev');
  const look = await page.evaluate(() => {
    const option = document.querySelector('.ds-command__item[data-active]');
    return { outline: getComputedStyle(option).outlineStyle, underline: getComputedStyle(option.querySelector('.ds-command__match')).textDecorationLine };
  });
  expect(look).toEqual({ outline: 'solid', underline: 'underline' });
});
