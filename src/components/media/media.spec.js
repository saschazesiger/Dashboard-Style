/**
 * Media cards and the gallery grid: the columns at every size, the gap per
 * density, two columns on a phone, the shape; the grid as one tab stop with
 * the arrows in two dimensions, Space, Shift ranges, Ctrl+A, Escape and
 * Enter; the other cards' checkboxes and actions out of the tab order; the
 * controller; the checkbox that shows on demand; the selected look; a menu's
 * Escape; the bare card; forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/test/browser/fixtures/component.html?c=media');
  await ready(page);
  await page.mouse.move(1, 1);
}

const grid = (page) => page.locator('[data-demo="grid"]');
const card = (page, n) => grid(page).locator(':scope > .ds-media').nth(n);
const checked = (page) => grid(page).evaluate((el) => [...el.querySelectorAll('.ds-media__check')].flatMap((box, i) => (box.checked ? [i] : [])));
const focusedCard = (page) => page.evaluate(() => {
  const cards = [...document.querySelectorAll('[data-demo="grid"] > .ds-media')];
  return cards.findIndex((each) => each.contains(document.activeElement));
});

test('columns: at least --ds-media-min, 32px per size step; the gap per density; two columns on a phone', async ({ page }) => {
  await open(page);
  const columns = (cls) => page.evaluate((cls) => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', `<div id="probe-host" class="${cls}" style="inline-size: 800px;"><ul class="ds-media-grid">${'<li class="ds-media"><span class="ds-media__thumb"></span></li>'.repeat(8)}</ul></div>`);
    const list = host.querySelector('#probe-host > ul');
    const style = getComputedStyle(list);
    const out = [style.gridTemplateColumns.split(' ').length, parseFloat(style.columnGap)];
    host.querySelector('#probe-host').remove();
    return out;
  }, cls);
  // 800px: (800 + 16) / (128 + 16) = 5 columns at md.
  expect(await columns('')).toEqual([5, 16]);
  expect(await columns('ds-xs')).toEqual([10, 16]);
  expect(await columns('ds-xl')).toEqual([3, 16]);
  expect(await columns('ds-density-compact')).toEqual([5, 12]);
  expect(await columns('ds-density-tight')).toEqual([6, 4]);
  await open(page, 360);
  expect(await grid(page).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
});

test('shape: the card\'s radius times --ds-shape', async ({ page }) => {
  await open(page);
  const radius = (cls) => page.evaluate((cls) => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', `<div id="probe-host" class="${cls}"><div class="ds-media"></div></div>`);
    const value = parseFloat(getComputedStyle(host.querySelector('#probe-host > .ds-media')).borderTopLeftRadius);
    host.querySelector('#probe-host').remove();
    return value;
  }, cls);
  const base = await radius('');
  expect(base).toBeGreaterThan(0);
  expect(await radius('ds-shape-square')).toBe(0);
  expect(await radius('ds-shape-soft')).toBe(base / 2);
});

test('one tab stop: Tab enters at a card, then its checkbox and menu, then leaves; the other cards are out of the tab order', async ({ page }) => {
  await open(page);
  const stops = await grid(page).evaluate((el) => [...el.querySelectorAll('.ds-media__open, .ds-media__check, .ds-media__actions > button')].map((node) => node.tabIndex));
  // Card 0 is current: its open control, checkbox and menu button take Tab; the rest -1.
  expect(stops.slice(0, 3).sort()).toEqual([0, 0, 0]);
  expect(stops.slice(3).every((value) => value === -1)).toBe(true);
  await page.locator('[data-demo="bar"]').evaluate((el) => el.previousElementSibling?.focus?.());
  await card(page, 0).locator('.ds-media__open').focus();
  await page.keyboard.press('ArrowRight');
  await expect(card(page, 1).locator('.ds-media__open')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(card(page, 1).locator('.ds-media__check')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(card(page, 1).locator('.ds-media__actions > button')).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await focusedCard(page), 'the grid is left').toBe(-1);
  await page.keyboard.press('Shift+Tab');
  await expect(card(page, 1).locator('.ds-media__actions > button')).toBeFocused();
  expect(await card(page, 0).locator('.ds-media__check').evaluate((el) => el.tabIndex)).toBe(-1);
});

test('the arrows move in two dimensions, Home and End to the ends', async ({ page }) => {
  await open(page, 700);
  const columns = await grid(page).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  await card(page, 0).locator('.ds-media__open').focus();
  await page.keyboard.press('ArrowDown');
  expect(await focusedCard(page)).toBe(columns);
  await page.keyboard.press('ArrowRight');
  expect(await focusedCard(page)).toBe(columns + 1);
  await page.keyboard.press('ArrowUp');
  expect(await focusedCard(page)).toBe(1);
  await page.keyboard.press('ArrowLeft');
  expect(await focusedCard(page)).toBe(0);
  await page.keyboard.press('End');
  expect(await focusedCard(page)).toBe(7);
  await page.keyboard.press('Home');
  expect(await focusedCard(page)).toBe(0);
});

test('Space selects, Shift+Space a range, Ctrl+A all, Escape none; ds:change and the page\'s toolbar follow; Enter opens', async ({ page }) => {
  await open(page);
  const events = [];
  await page.exposeFunction('mediaHeard', (keys) => events.push(keys));
  await grid(page).evaluate((el) => el.addEventListener('ds:change', (event) => window.mediaHeard(event.detail.selected)));
  await card(page, 0).locator('.ds-media__open').focus();
  await page.keyboard.press('Space');
  expect(await checked(page)).toEqual([0]);
  await expect(page.locator('[data-demo="count"]')).toHaveText('1 selected');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+Space');
  expect(await checked(page)).toEqual([0, 1, 2, 3]);
  await page.keyboard.press('Space');
  expect(await checked(page)).toEqual([0, 1, 2]);
  await page.keyboard.press('ControlOrMeta+a');
  expect(await checked(page)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  await page.keyboard.press('Escape');
  expect(await checked(page)).toEqual([]);
  await expect(page.locator('[data-demo="bar"]')).toBeHidden();
  expect(events).toEqual([['m1'], ['m1', 'm2', 'm3', 'm4'], ['m1', 'm2', 'm3'], ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'], []]);
  await page.keyboard.press('Enter');
  await expect(page.locator('.ds-toast, .ds-snackbar').filter({ hasText: 'Open Ticket TCK-1042 report.pdf' }).first()).toBeVisible();
});

test('a checkbox: a click selects one, Shift+click the range, one ds:change each', async ({ page }) => {
  await open(page);
  const count = await grid(page).evaluate((el) => {
    window.mediaEvents = 0;
    el.addEventListener('ds:change', () => { window.mediaEvents += 1; });
  });
  void count;
  await card(page, 1).hover();
  await card(page, 1).locator('.ds-media__check').click();
  await card(page, 4).locator('.ds-media__check').click({ modifiers: ['Shift'] });
  expect(await checked(page)).toEqual([1, 2, 3, 4]);
  expect(await page.evaluate(() => window.mediaEvents)).toBe(2);
});

test('the controller: get, set, selectAll, clear, on; destroy gives the tab order back', async ({ page }) => {
  await open(page);
  const out = await grid(page).evaluate((el) => {
    const media = DS.core.get(el, 'media');
    const heard = [];
    const off = media.on('change', ({ selected }) => heard.push(selected.join()));
    media.set(['m2', 'm5']);
    const first = media.get();
    media.selectAll();
    const all = media.get().length;
    off();
    media.clear();
    const none = media.get();
    media.destroy();
    const parked = el.querySelectorAll('.ds-media__check[tabindex="-1"]').length;
    return { first, all, none, heard, parked };
  });
  expect(out).toEqual({ first: ['m2', 'm5'], all: 8, none: [], heard: ['m2,m5', 'm1,m2,m3,m4,m5,m6,m7,m8'], parked: 0 });
});

test('the checkbox shows on demand: hidden at rest, with hover or focus, all of them once one is selected, always under .ds-touch', async ({ page }) => {
  await open(page);
  const opacity = (n) => card(page, n).locator('.ds-media__select').evaluate((el) => getComputedStyle(el).opacity);
  expect(await opacity(2)).toBe('0');
  await card(page, 2).hover();
  await settle(page);
  expect(await opacity(2)).toBe('1');
  await page.mouse.move(1, 1);
  await card(page, 0).locator('.ds-media__open').focus();
  await settle(page);
  expect(await opacity(0)).toBe('1');
  await page.keyboard.press('Space');
  await card(page, 0).locator('.ds-media__open').blur();
  await settle(page);
  expect(await opacity(5)).toBe('1');
  await page.keyboard.press('Escape');
  await grid(page).evaluate((el) => { DS.core.get(el, 'media').clear(); el.closest('.ds-theme').classList.add('ds-touch'); });
  await settle(page);
  expect(await opacity(6)).toBe('1');
});

test('selected: the tint with its text, the ring inside the edge, the checked box; the focus ring goes round the card', async ({ page }) => {
  await open(page);
  const variants = page.locator('[data-demo="variants"] > .ds-media');
  const selected = variants.nth(3);
  const look = await selected.evaluate((el) => {
    const read = (value) => {
      const probe = document.createElement('span');
      probe.style.color = value;
      el.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    };
    return [getComputedStyle(el).backgroundColor === read('var(--ds-accent)'), getComputedStyle(el).color === read('var(--ds-on-accent)'), parseFloat(getComputedStyle(el, '::before').borderTopWidth), el.querySelector('.ds-media__check').checked];
  });
  expect(look).toEqual([true, true, 2, true]);
  await page.keyboard.press('Tab');
  await variants.nth(0).locator('.ds-media__open').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await settle(page);
  expect(await variants.nth(0).evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
});

test('Escape in a card\'s open menu closes the menu and keeps the selection', async ({ page }) => {
  await open(page);
  await card(page, 0).locator('.ds-media__open').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const button = card(page, 0).locator('.ds-media__actions > button');
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
  const menu = card(page, 0).locator('.ds-menu');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(await checked(page)).toEqual([0]);
  await settle(page);
});

test('names: the grid, every checkbox and menu button; the bare card keeps its title in the tree', async ({ page }) => {
  await open(page);
  await expect(grid(page)).toHaveAccessibleName('Files of device 12');
  await expect(card(page, 0).locator('.ds-media__check')).toHaveAccessibleName('Select Device 12, front panel.jpg');
  await expect(card(page, 0).locator('.ds-media__actions > button')).toHaveAccessibleName('More for Device 12, front panel.jpg');
  const bare = page.locator('[data-demo="variants"] > .ds-media--bare');
  await expect(bare.locator('.ds-media__open')).toHaveAccessibleName('Bare: Product photo.jpg');
  const box = await bare.locator('.ds-media__title').boundingBox();
  expect(box.width).toBeLessThanOrEqual(1);
  const actions = await bare.evaluate((el) => el.querySelector('.ds-media__actions').getBoundingClientRect().top - el.getBoundingClientRect().top);
  expect(actions).toBeLessThan(16);
});

test('forced colours: a selected card is Highlight, every card keeps its border, the state layer goes', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const highlight = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'Highlight';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  const selected = page.locator('[data-demo="variants"] > .ds-media').nth(3);
  expect(await selected.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(highlight);
  expect(await card(page, 0).evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
  expect(await card(page, 0).locator('.ds-media__open').evaluate((el) => getComputedStyle(el, '::after').display)).toBe('none');
});
