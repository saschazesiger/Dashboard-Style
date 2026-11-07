/**
 * The JSON viewer: names and roles; exact big numbers in the row, in a copy
 * and through get() and text(); the tree's keyboard with lazy rows and Tab
 * to the copy buttons; copy value and copy path; search with marks, the
 * count, Enter, Shift+Enter and Escape; ranges for large containers and a
 * search that reveals inside them; expand and collapse all; text that is
 * no JSON; rows at every size x density x touch; forced colours. Runs in
 * the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/component.html?c=jsonview';
const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  // A clipboard of our own: every engine, no permission prompt.
  await page.addInitScript(() => {
    window.__copied = [];
    const clipboard = { writeText: (text) => { window.__copied.push(text); return Promise.resolve(); } };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => clipboard });
  });
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const viewer = (page, name) => page.locator(`[data-demo="${name}"]`);
const row = (page, name, text) => viewer(page, name).locator('[role="treeitem"]').filter({ has: page.locator(':scope > .ds-tree__row > .ds-tree__label', { hasText: text }) }).first();
const activeLabel = (page) => page.evaluate(() => document.activeElement?.querySelector(':scope > .ds-tree__row > .ds-tree__label')?.textContent ?? document.activeElement?.getAttribute('aria-label'));

test('roles and names: a tree named by the viewer, items by key and value, buttons by what they copy', async ({ page }) => {
  await open(page);
  const device = viewer(page, 'device');
  const tree = device.locator('[role="tree"]');
  await expect(tree).toHaveAttribute('aria-label', 'Response of GET /devices/42');
  await expect(device.locator('input[type="search"]')).toHaveAttribute('aria-label', 'Search keys and values');
  await expect(device.getByRole('treeitem', { name: 'name: "LAPTOP-0042"' })).toHaveCount(1);
  await expect(device.getByRole('treeitem', { name: 'owner: {…}' })).toHaveAttribute('aria-expanded', 'true');
  await expect(device.getByRole('button', { name: 'Copy the value of owner' })).toHaveCount(1);
  await expect(device.getByRole('button', { name: 'Copy the path of owner' })).toHaveCount(1);
  // One tab stop in the tree.
  expect(await tree.locator('[role="treeitem"][tabindex="0"]').count()).toBe(1);
  // The source stays, hidden.
  await expect(device.locator('script[type="application/json"]')).toHaveCount(1);
});

test('big numbers keep every digit: in the row, in a copy, through get() and text()', async ({ page }) => {
  await open(page);
  const id = row(page, 'device', 'id:');
  await expect(id.locator('.ds-jsonview__value--number')).toHaveText('9007199254740993');
  const api = await viewer(page, 'device').evaluate((el) => {
    const view = DS.jsonview.create(el);
    const value = view.get();
    return { type: typeof value.id, id: String(value.id), text: view.text().includes('"id": 9007199254740993') };
  });
  expect(api).toEqual({ type: 'bigint', id: '9007199254740993', text: true });
  await id.locator('.ds-tree__row').hover();
  await id.getByRole('button', { name: 'Copy the value of id' }).click();
  await expect.poll(() => page.evaluate(() => window.__copied.at(-1))).toBe('9007199254740993');
});

test('copy value gives a string\'s text and a container\'s JSON; copy path the JavaScript path; ds:copy tells the page', async ({ page }) => {
  await open(page);
  const device = viewer(page, 'device');
  const events = await device.evaluate((el) => {
    window.__events = [];
    el.addEventListener('ds:copy', (event) => window.__events.push(event.detail));
    return true;
  });
  expect(events).toBe(true);
  const name = row(page, 'device', 'display name:');
  await name.locator(':scope > .ds-tree__row').hover();
  await name.getByRole('button', { name: 'Copy the path of display name' }).click();
  await expect.poll(() => page.evaluate(() => window.__copied.at(-1))).toBe('$.owner["display name"]');
  await name.getByRole('button', { name: 'Copy the value of display name' }).click();
  await expect.poll(() => page.evaluate(() => window.__copied.at(-1))).toBe('Ada L.');
  const battery = row(page, 'device', 'battery:');
  await battery.locator(':scope > .ds-tree__row').hover();
  await battery.getByRole('button', { name: 'Copy the value of battery' }).click();
  await expect.poll(() => page.evaluate(() => window.__copied.at(-1))).toBe('{\n  "health": 0.87,\n  "cycles": 412\n}');
  const details = await page.evaluate(() => window.__events.map((detail) => [detail.kind, detail.path]));
  expect(details).toEqual([['path', '$.owner["display name"]'], ['value', '$.owner["display name"]'], ['value', '$.battery']]);
});

test('the keyboard: the tree walks and opens lazy rows; Tab reaches the copy buttons, which show while the row is in use', async ({ page }) => {
  await open(page);
  const tickets = row(page, 'device', 'tickets:');
  const first = tickets.locator('[role="treeitem"]').first();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(first).toHaveAttribute('data-ds-tree-lazy', '');
  await expect(first.locator('[role="group"]')).toHaveCount(0);
  await focusByKeyboard(page, first);
  await page.keyboard.press('ArrowRight');
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(first.locator('[role="treeitem"]')).toHaveCount(3);
  await page.keyboard.press('ArrowRight');
  expect(await activeLabel(page)).toBe('id: 42');
  await page.keyboard.press('ArrowDown');
  expect(await activeLabel(page)).toBe('title: "Replace the fan"');
  // Letters jump by key.
  await page.keyboard.press('o');
  expect(await activeLabel(page)).toBe('open: true');
  // The focused row's buttons show; Tab reaches them.
  const focused = page.locator(':focus');
  await expect(focused.locator(':scope > .ds-tree__row > .ds-jsonview__actions')).toHaveCSS('opacity', '1');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.getAttribute('aria-label'))).toBe('Copy the value of open');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.getAttribute('aria-label'))).toBe('Copy the path of open');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__copied.at(-1))).toBe('$.tickets[0].open');
  // Another row's buttons rest hidden.
  await settle(page);
  await expect(row(page, 'device', 'model:').locator(':scope > .ds-tree__row > .ds-jsonview__actions')).toHaveCSS('opacity', '0');
});

test('search marks keys and values, counts and walks the matches; Escape clears it', async ({ page }) => {
  await open(page);
  const device = viewer(page, 'device');
  const field = device.locator('input[type="search"]');
  await field.fill('lovelace');
  await expect(device.locator('.ds-jsonview__count')).toHaveText('1 of 3');
  await expect(device.locator('mark.ds-jsonview__mark')).toHaveCount(3);
  await expect(row(page, 'device', 'name: "Ada Lovelace"')).toHaveAttribute('aria-selected', 'true');
  await field.press('Enter');
  await expect(device.locator('.ds-jsonview__count')).toHaveText('2 of 3');
  await expect(row(page, 'device', '2: "lovelace"')).toHaveAttribute('aria-selected', 'true');
  await field.press('Enter');
  await expect(row(page, 'device', 'notes:')).toHaveAttribute('aria-selected', 'true');
  await field.press('Enter');
  await expect(device.locator('.ds-jsonview__count')).toHaveText('1 of 3');
  await field.press('Shift+Enter');
  await expect(device.locator('.ds-jsonview__count')).toHaveText('3 of 3');
  // The buttons too.
  await device.getByRole('button', { name: 'Next match' }).click();
  await expect(device.locator('.ds-jsonview__count')).toHaveText('1 of 3');
  // A key matches, inside a closed level: the level opens.
  await field.fill('title');
  await expect(device.locator('.ds-jsonview__count')).toHaveText('1 of 2');
  await expect(row(page, 'device', 'title: "Replace the fan"')).toHaveAttribute('aria-selected', 'true');
  await expect(device.locator('mark.ds-jsonview__mark')).toHaveText(['title']);
  await field.fill('nothing like it');
  await expect(device.locator('.ds-jsonview__count')).toHaveText('No results');
  await expect(device.getByRole('button', { name: 'Next match' })).toBeDisabled();
  await field.press('Escape');
  await expect(field).toHaveValue('');
  await expect(device.locator('mark')).toHaveCount(0);
  await expect(device.locator('.ds-jsonview__count')).toBeHidden();
});

test('a large container opens into ranges of 100; a search reveals a match inside a range', async ({ page }) => {
  await open(page);
  const log = viewer(page, 'log');
  const events = row(page, 'log', 'events:');
  await expect(events.locator(':scope > .ds-tree__row > .ds-tree__meta')).toHaveText('250 items');
  await expect(events.locator(':scope > [role="group"] > [role="treeitem"]')).toHaveText(['[0 … 99]', '[100 … 199]', '[200 … 249]']);
  // Nothing inside the ranges is rendered yet.
  expect(await log.locator('[role="treeitem"]').count()).toBe(5);
  await log.locator('input[type="search"]').fill('149');
  await expect(log.locator('.ds-jsonview__count')).toHaveText('1 of 1');
  const hit = log.locator('[role="treeitem"][aria-selected="true"]');
  await expect(hit.locator(':scope > .ds-tree__row > .ds-tree__label')).toHaveText('n: 149');
  await expect(row(page, 'log', '[100 … 199]')).toHaveAttribute('aria-expanded', 'true');
  await expect(row(page, 'log', '[0 … 99]')).toHaveAttribute('aria-expanded', 'false');
  expect(await log.locator('[role="treeitem"]').count()).toBeLessThan(120);
  const path = await hit.evaluate((item) => item.querySelector('[aria-label^="Copy the path"]').getAttribute('aria-label'));
  expect(path).toBe('Copy the path of n');
});

test('expand all opens every level within its limit, collapse all closes them', async ({ page }) => {
  await open(page);
  const device = viewer(page, 'device');
  await device.getByRole('button', { name: 'Expand all' }).click();
  await expect(device.locator('[role="treeitem"][aria-expanded="false"]')).toHaveCount(0);
  await expect(row(page, 'device', 'title: "Second dock for the lab"')).toHaveCount(1);
  await device.getByRole('button', { name: 'Collapse all' }).click();
  await expect(device.locator('[role="treeitem"][aria-expanded="true"]')).toHaveCount(0);
  const quiet = viewer(page, 'quiet');
  await expect(quiet.locator('.ds-jsonview__bar')).toBeHidden();
});

test('large: after Expand all an arrow key costs no pass over every row', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const el = document.createElement('div');
    el.className = 'ds-jsonview';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Large');
    document.querySelector('#fx-component').append(el);
    const value = Array.from({ length: 90 }, (_, index) => ({ id: index, name: `DEVICE-${index}`, owner: { name: 'Ada Lovelace', team: 'Lab' }, tags: ['lab', 'loan'], ports: [1, 2] }));
    const view = DS.jsonview.create(el, { value, open: 1 });
    view.expandAll();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const rows = el.querySelectorAll('[role="treeitem"]').length;
    const first = el.querySelector('[role="treeitem"]');
    first.focus();
    // The DOM queries the presses make: a pass over every row makes thousands each, a move of the tab stop a few.
    // Counted, not timed, so a busy machine cannot fail it.
    let queries = 0;
    const originals = { one: Element.prototype.querySelector, all: Element.prototype.querySelectorAll };
    Element.prototype.querySelector = function (...args) { queries += 1; return originals.one.apply(this, args); };
    Element.prototype.querySelectorAll = function (...args) { queries += 1; return originals.all.apply(this, args); };
    const start = performance.now();
    try {
      for (let step = 0; step < 20; step += 1) document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    } finally {
      Element.prototype.querySelector = originals.one;
      Element.prototype.querySelectorAll = originals.all;
    }
    const time = performance.now() - start;
    const moved = document.activeElement !== first && el.contains(document.activeElement);
    view.destroy();
    el.remove();
    return { rows, time, queries, moved };
  });
  expect(result.rows).toBeGreaterThan(1000);
  expect(result.moved).toBe(true);
  expect(result.queries, `${result.queries} queries in ${Math.round(result.time)}ms`).toBeLessThan(20 * 20);
});

test('text that is no JSON says where, in words, and sets data-state="error"', async ({ page }) => {
  await open(page);
  const broken = viewer(page, 'broken');
  await expect(broken).toHaveAttribute('data-state', 'error');
  await expect(broken.locator('.ds-jsonview__error')).toHaveText('Not valid JSON: line 3, column 13.');
  await expect(broken.locator('.ds-jsonview__error svg')).toHaveCount(1);
  await expect(broken.locator('.ds-jsonview__bar')).toBeHidden();
  await expect(broken.locator('[role="treeitem"]')).toHaveCount(0);
  // New text mends it.
  await broken.evaluate((el) => DS.jsonview.create(el).setText('{"retries": 3, "timeout": 30}'));
  await expect(broken).not.toHaveAttribute('data-state', /.*/);
  await expect(broken.locator('[role="treeitem"]')).toHaveCount(2);
});

test('a row at every size x density: 8px per size, 4px per density from 32px, .ds-touch as a minimum; the code font stays', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<div class="ds-jsonview" role="region" aria-label="Probe"></div>';
          document.querySelector('#fx-component').append(region);
          const view = DS.jsonview.create(region.firstChild, { value: { a: 1 }, search: false });
          const label = region.querySelector('.ds-tree__label');
          out.push({ touch, density, size, row: region.querySelector('.ds-tree__row').getBoundingClientRect().height, line: parseFloat(getComputedStyle(label).lineHeight), font: getComputedStyle(label).fontSize, mono: getComputedStyle(label).fontFamily });
          view.destroy();
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    expect(entry.row, `${name}: row`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 32 + step * 8 + density * 4, entry.line), 0);
    expect(entry.font, `${name}: font`).toBe('13px');
    expect(entry.mono, name).toMatch(/mono/i);
  }
});

test('forced colours: the types turn CanvasText, a mark is Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const device = viewer(page, 'device');
  await device.locator('input[type="search"]').fill('research');
  await expect(device.locator('mark')).toHaveCount(1);
  const colours = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('#fx-component').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    const view = document.querySelector('[data-demo="device"]');
    const number = [...view.querySelectorAll('.ds-jsonview__value--number')].find((el) => !el.closest('[aria-selected="true"]'));
    return {
      text: probe('color', 'CanvasText'),
      highlight: probe('backgroundColor', 'Highlight'),
      highlightText: probe('color', 'HighlightText'),
      number: getComputedStyle(number).color,
      mark: getComputedStyle(view.querySelector('mark')).backgroundColor,
      markText: getComputedStyle(view.querySelector('mark')).color,
    };
  });
  expect(colours.number).toBe(colours.text);
  expect(colours.mark).toBe(colours.highlight);
  expect(colours.markText).toBe(colours.highlightText);
});
