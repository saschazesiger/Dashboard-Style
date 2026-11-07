/**
 * The data grid (DS.datagrid) on its demo: sort by one and several columns,
 * selection with Shift ranges and "Select all N" through the selection bar,
 * resize and reorder by keys and pointer, the chooser and its presets, the
 * remembered columns, the APG keys in cell and row mode, tree rows, row
 * groups, inline edit, the row menu, server data with its states, windowed
 * rows, export, the options and forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page, query = '') {
  await page.goto(`/test/browser/fixtures/component.html?c=datagrid${query}`);
  await ready(page);
  await page.mouse.move(1, 1);
}

const full = (page) => page.locator('[data-demo="full-table"]');
const bodyRows = (table) => table.locator(':scope > tbody > tr[data-ds-datagrid-row]');
const names = (table) => table.locator(':scope > tbody > tr[data-ds-datagrid-row] > td[data-ds-key="c:name"]').allTextContents();
const heads = (table) => table.locator(':scope > thead th[data-ds-datagrid-col]').evaluateAll((cells) => cells.map((cell) => cell.getAttribute('data-ds-datagrid-col')));
const focusedInfo = (page) => page.evaluate(() => {
  const el = document.activeElement;
  const cell = el?.closest('td, th');
  const row = el?.closest('tr');
  return { tag: el?.tagName.toLowerCase(), key: cell?.getAttribute('data-ds-key') ?? null, row: row?.getAttribute('data-ds-key') ?? null, label: el?.getAttribute('aria-label') ?? null };
});
/** What the page announced through DS.a11y.announce (the snackbar region's live announcers). */
const said = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((node) => node.textContent).join(' | '));
/** A clipboard that keeps what it is given in window.specClip. */
const stubClipboard = (page) => page.evaluate(() => {
  window.specClip = [];
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (text) => { window.specClip.push(text); return Promise.resolve(); } } });
});

test('a grid without options stays the table it was; focus mode makes it a grid with one tab stop', async ({ page }) => {
  await open(page);
  const states = page.locator('[data-demo="empty"]');
  await expect(states).not.toHaveAttribute('role');
  await expect(states.locator('th')).toHaveCount(3);
  await expect(states.locator('th button')).toHaveCount(0);
  const table = full(page);
  await expect(table).toHaveAttribute('role', 'grid');
  await expect(table).toHaveAttribute('aria-multiselectable', 'true');
  const stops = await table.evaluate((el) => [...el.querySelectorAll('[tabindex="0"]')].length);
  expect(stops).toBe(1);
  // Widgets inside wait at -1.
  const widgets = await table.evaluate((el) => [...el.querySelectorAll('button, input')].filter((node) => node.getAttribute('tabindex') !== '-1' && node.getAttribute('tabindex') !== '0').length);
  expect(widgets).toBe(0);
});

test('sorts by a column, again descending; Shift adds a second column with its rank', async ({ page }) => {
  await open(page);
  const table = full(page);
  const device = table.locator('th[data-ds-datagrid-col="name"]');
  await expect(device).toHaveAttribute('aria-sort', 'ascending');
  await table.locator('th[data-ds-datagrid-col="model"] .ds-table__sort').click();
  await expect(table.locator('th[data-ds-datagrid-col="model"]')).toHaveAttribute('aria-sort', 'ascending');
  await expect(device).not.toHaveAttribute('aria-sort');
  await table.locator('th[data-ds-datagrid-col="model"] .ds-table__sort').click();
  await expect(table.locator('th[data-ds-datagrid-col="model"]')).toHaveAttribute('aria-sort', 'descending');
  expect(await said(page)).toContain('Sorted by Model, descending.');
  await table.locator('th[data-ds-datagrid-col="load"] .ds-table__sort').click({ modifiers: ['Shift'] });
  const load = table.locator('th[data-ds-datagrid-col="load"]');
  await expect(load).not.toHaveAttribute('aria-sort');
  await expect(load).toHaveAttribute('data-ds-datagrid-dir', 'ascending');
  await expect(load.locator('.ds-datagrid__rank')).toHaveText('2');
  await expect(load.locator('.ds-sr')).toHaveText(', sort 2, ascending');
  // The rows follow both: model descending, then load ascending within a model.
  const rows = await page.evaluate(() => DS.get(document.querySelector('[data-demo="full-table"]'), 'datagrid')?.get().rows ?? DS.datagrid.create(document.querySelector('[data-demo="full-table"]')).get().rows);
  for (let i = 1; i < rows.length; i += 1) {
    const a = rows[i - 1];
    const b = rows[i];
    expect(a.model.localeCompare(b.model) > 0 || (a.model === b.model && a.load <= b.load)).toBe(true);
  }
});

test('selects a row, a Shift range and the page; the bar offers every row and clears', async ({ page }) => {
  await open(page);
  const table = full(page);
  const bar = page.locator('[data-demo="full"] .ds-selection-bar');
  await expect(bar).toHaveCount(0);
  const boxes = table.locator('tbody [data-ds-datagrid-check]');
  await boxes.nth(1).click();
  await expect(bar).toBeVisible();
  await expect(bar.locator('.ds-selection-bar__count')).toHaveText('1 selected');
  await expect(bodyRows(table).nth(1)).toHaveClass(/ds-table__row--selected/);
  await expect(bodyRows(table).nth(1)).toHaveAttribute('aria-selected', 'true');
  await boxes.nth(4).click({ modifiers: ['Shift'] });
  await expect(bar.locator('.ds-selection-bar__count')).toHaveText('4 selected');
  expect(await table.locator('thead [data-ds-datagrid-all]').evaluate((box) => box.indeterminate)).toBe(true);
  await table.locator('thead [data-ds-datagrid-all]').click();
  await expect(bar.locator('.ds-selection-bar__count')).toHaveText('10 selected');
  const every = bar.locator('.ds-datagrid__every');
  await expect(every).toHaveText('Select all 36');
  await every.click();
  await expect(bar.locator('.ds-selection-bar__count')).toHaveText('All 36 selected');
  // Another page is selected as well.
  await page.locator('[data-demo="full"] [data-ds-datagrid-page="next"]').click();
  await expect(boxes.first()).toBeChecked();
  await boxes.first().click();
  await expect(bar.locator('.ds-selection-bar__count')).toHaveText('35 selected');
  await bar.getByRole('button', { name: 'Clear selection' }).click();
  await expect(bar).toHaveCount(0);
  await expect(table.locator('thead [data-ds-datagrid-all]')).toBeFocused();
});

test('resizes a column by keys and pointer, and Enter gives its width back', async ({ page }) => {
  await open(page);
  const table = full(page);
  const th = table.locator('th[data-ds-datagrid-col="model"]');
  const handle = th.locator('.ds-datagrid__resize');
  await expect(handle).toHaveAttribute('role', 'separator');
  await expect(handle).toHaveAttribute('aria-label', 'Resize Model');
  const before = (await th.boundingBox()).width;
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(table).toHaveAttribute('data-ds-datagrid-layout', 'fixed');
  const now = Number(await handle.getAttribute('aria-valuenow'));
  expect(Math.abs(now - (Math.round(before) + 8))).toBeLessThanOrEqual(1);
  expect(Math.abs((await th.boundingBox()).width - now)).toBeLessThanOrEqual(1);
  await page.keyboard.press('Shift+ArrowLeft');
  await expect(handle).toHaveAttribute('aria-valuenow', String(now - 64));
  await expect(handle).toBeFocused();
  // The pointer: 40px wider.
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  expect(Math.abs(Number(await handle.getAttribute('aria-valuenow')) - (now - 64 + 40))).toBeLessThanOrEqual(1);
  // The other columns kept their widths.
  await handle.focus();
  await page.keyboard.press('Enter');
  // The width given back: the automatic layout again, and the separator reports the width the column is laid out at.
  await expect(table).not.toHaveAttribute('data-ds-datagrid-layout');
  const natural = Math.round((await th.boundingBox()).width);
  expect(Math.abs(Number(await th.locator('.ds-datagrid__resize').getAttribute('aria-valuenow')) - natural)).toBeLessThanOrEqual(1);
});

test('a header is named by its label alone, and every separator has its value from the start', async ({ page }) => {
  await open(page);
  const table = full(page);
  const expected = { name: 'Device', model: 'Model', owner: 'Owner', tickets: 'Tickets', load: 'Load' };
  for (const [key, name] of Object.entries(expected)) {
    const th = table.locator(`thead th[data-ds-datagrid-col="${key}"]`);
    // The grip ("Move …") and the separator ("Resize …", its value) stay out of the header's name.
    await expect(th).toHaveAccessibleName(name);
    const handle = th.locator('.ds-datagrid__resize');
    const now = Number(await handle.getAttribute('aria-valuenow'));
    expect(Math.abs(now - (await th.boundingBox()).width)).toBeLessThanOrEqual(1);
  }
  // A cell's column header is that name too.
  const declared = page.locator('[data-demo="declared"] table');
  for (const name of ['Device', 'Owner', 'Load']) await expect(declared.getByRole('columnheader', { name, exact: true })).toHaveCount(1);
  const values = await page.evaluate(() => [...document.querySelectorAll('.ds-datagrid__resize')].filter((el) => el.getClientRects().length).map((el) => el.getAttribute('aria-valuenow')));
  expect(values.length).toBeGreaterThan(5);
  expect(values.every((value) => Number(value) > 0)).toBe(true);
});

test('right to left: dragging the separator outward widens, and ArrowLeft widens', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const wrap = document.createElement('div');
    wrap.className = 'ds-table-wrap';
    wrap.dir = 'rtl';
    wrap.innerHTML = '<table class="ds-table ds-datagrid" aria-label="Probe" data-spec="rtl"></table>';
    document.querySelector('#fx-component').prepend(wrap);
    DS.datagrid.create(wrap.firstChild, { columns: [{ key: 'a', label: 'Alpha' }, { key: 'b', label: 'Beta' }, { key: 'c', label: 'Gamma' }], rows: [{ id: 1, a: 'one', b: 'two', c: 'three' }], resize: true });
  });
  const th = page.locator('[data-spec="rtl"] th[data-ds-datagrid-col="a"]');
  const handle = th.locator('.ds-datagrid__resize');
  const before = (await th.boundingBox()).width;
  const box = await handle.boundingBox();
  // The separator sits at the left edge, right to left.
  expect(box.x).toBeLessThan((await th.boundingBox()).x + 12);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  const dragged = Number(await handle.getAttribute('aria-valuenow'));
  expect(Math.abs(dragged - (before + 40))).toBeLessThanOrEqual(1);
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(handle).toHaveAttribute('aria-valuenow', String(dragged + 8));
  await page.keyboard.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', String(dragged));
});

test('moves a column with its grip by keys, and the cells follow', async ({ page }) => {
  await open(page);
  const table = full(page);
  expect((await heads(table)).slice(0, 3)).toEqual(['name', 'model', 'owner']);
  const grip = table.locator('th[data-ds-datagrid-col="model"] .ds-datagrid__grip');
  await expect(grip).toHaveAttribute('aria-label', 'Move Model');
  await grip.focus();
  await expect(grip).toHaveCSS('opacity', '1');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect.poll(async () => (await heads(table)).slice(0, 3)).toEqual(['name', 'owner', 'model']);
  const cells = await bodyRows(table).first().locator('td[data-ds-key^="c:"]').evaluateAll((list) => list.map((cell) => cell.getAttribute('data-ds-key')));
  expect(cells.slice(0, 3)).toEqual(['c:name', 'c:owner', 'c:model']);
});

test('a pinned first or last column keeps its place when the others move', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const wrap = document.createElement('div');
    wrap.className = 'ds-table-wrap';
    wrap.innerHTML = '<table class="ds-table ds-table--pin-first ds-table--pin-last ds-datagrid" aria-label="Probe" data-spec="pinned"></table>';
    document.querySelector('#fx-component').prepend(wrap);
    window.specPinned = DS.datagrid.create(wrap.firstChild, { columns: ['a', 'b', 'c', 'd'].map((key) => ({ key, label: key.toUpperCase() })), rows: [{ id: 1, a: 1, b: 2, c: 3, d: 4 }], reorder: true });
  });
  const table = page.locator('[data-spec="pinned"]');
  await expect(table.locator('th[data-ds-datagrid-col="a"] .ds-datagrid__grip')).toHaveCount(0);
  await expect(table.locator('th[data-ds-datagrid-col="d"] .ds-datagrid__grip')).toHaveCount(0);
  // B to the left: A is no place to drop at.
  await table.locator('th[data-ds-datagrid-col="b"] .ds-datagrid__grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  // C to the right: nor is D.
  await table.locator('th[data-ds-datagrid-col="c"] .ds-datagrid__grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  expect(await heads(table)).toEqual(['a', 'b', 'c', 'd']);
  // B past C moves.
  await table.locator('th[data-ds-datagrid-col="b"] .ds-datagrid__grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect.poll(() => heads(table)).toEqual(['a', 'c', 'b', 'd']);
  // A drop that put a pinned column in the middle anyway: it goes back to its end.
  await table.evaluate((el) => {
    const row = el.tHead.rows[0];
    row.insertBefore(row.cells[0], row.cells[2]);
    row.append(row.cells[1]);
    if (row.cells[3].getAttribute('data-ds-datagrid-col') !== 'a') throw new Error('the probe drop did not move A to the end');
    el.tHead.dispatchEvent(new CustomEvent('ds:drop', { bubbles: true }));
  });
  // The cells as such a drop left them: C, B, D, A.
  await expect.poll(() => heads(table)).toEqual(['a', 'c', 'b', 'd']);
  expect(await page.evaluate(() => window.specPinned.get().columns.order)).toEqual(['a', 'c', 'b', 'd']);
});

test('the chooser hides and shows columns and stays open; a preset applies and closes it', async ({ page }) => {
  await open(page);
  const table = full(page);
  const trigger = page.locator('[data-demo="full"] button[aria-haspopup="menu"]', { hasText: 'Columns' });
  const menu = page.locator('[data-demo="full"] .ds-menu[aria-label="Columns"]');
  await trigger.click();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitemradio', { name: 'Default' })).toHaveAttribute('aria-checked', 'true');
  const model = menu.getByRole('menuitemcheckbox', { name: 'Model' });
  await expect(model).toHaveAttribute('aria-checked', 'true');
  await model.click();
  await expect(table.locator('th[data-ds-datagrid-col="model"]')).toHaveCount(0);
  await expect(menu).toBeVisible();
  await expect(model).toHaveAttribute('aria-checked', 'false');
  expect(await said(page)).toContain('Model hidden.');
  await menu.getByRole('menuitemradio', { name: 'All columns' }).click();
  await expect(menu).toBeHidden();
  expect(await heads(table)).toEqual(['name', 'model', 'owner', 'place', 'bought', 'tickets', 'load', 'status']);
  await trigger.click();
  await menu.getByRole('menuitemradio', { name: 'Triage' }).click();
  expect(await heads(table)).toEqual(['name', 'load', 'status', 'tickets']);
});

test('remembers order, visibility, widths and sort through DS.store', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    localStorage.removeItem('ds:spec-grid:columns');
    const make = () => {
      const wrap = document.createElement('div');
      wrap.className = 'ds-table-wrap';
      wrap.innerHTML = '<table class="ds-table ds-datagrid" aria-label="Probe"></table>';
      document.querySelector('#fx-component').append(wrap);
      const grid = DS.datagrid.create(wrap.firstChild, { columns: [{ key: 'a', label: 'A', sortable: true }, { key: 'b', label: 'B' }, { key: 'c', label: 'C' }], rows: [{ id: 1, a: 'x', b: 'y', c: 'z' }], persist: 'spec-grid', chooser: document.createElement('div'), resize: true });
      return { wrap, grid };
    };
    const first = make();
    first.grid.set({ columns: { order: ['c', 'a', 'b'], hidden: ['b'], widths: { a: 120 } }, sort: [{ key: 'a', dir: 'descending' }] });
    first.grid.destroy();
    first.wrap.remove();
    const second = make();
    const state = second.grid.get();
    second.grid.destroy();
    second.wrap.remove();
    localStorage.removeItem('ds:spec-grid:columns');
    localStorage.removeItem('ds:spec-grid:widths');
    localStorage.removeItem('ds:spec-grid:sort');
    return state;
  });
  expect(result.columns.order).toEqual(['c', 'a', 'b']);
  expect(result.columns.hidden).toEqual(['b']);
  expect(result.columns.widths).toEqual({ a: 120 });
  expect(result.sort).toEqual([{ key: 'a', dir: 'descending' }]);
});

test('cell mode: the APG keys, the header, Enter sorts, F2 enters a cell, Ctrl+Home', async ({ page }) => {
  await open(page);
  const table = full(page);
  await page.locator('[data-demo="filter"]').focus();
  // Tab past the toolbar into the grid: one stop.
  await table.evaluate((el) => el.querySelector('[tabindex="0"]').focus());
  let at = await focusedInfo(page);
  // Sorted by name: DESKTOP-0114 (d3) first, DESKTOP-0135 (d6) second.
  expect(at.row).toBe('r:d3');
  await page.keyboard.press('ArrowRight');
  at = await focusedInfo(page);
  expect(at.tag).toBe('button');
  expect(at.label).toBe('Details of DESKTOP-0114');
  await page.keyboard.press('ArrowRight');
  at = await focusedInfo(page);
  expect(at.key).toBe('c:name');
  await page.keyboard.press('ArrowDown');
  at = await focusedInfo(page);
  expect(at.row).toBe('r:d6');
  await page.keyboard.press('End');
  at = await focusedInfo(page);
  expect(at.label).toBe('Actions for DESKTOP-0135');
  await page.keyboard.press('Home');
  at = await focusedInfo(page);
  expect(at.label).toBe('Select DESKTOP-0135');
  // Up to the header row, then Enter sorts the focused header cell.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  at = await focusedInfo(page);
  expect(at.key).toBe('c:name');
  expect(at.tag).toBe('th');
  await page.keyboard.press('Enter');
  await expect(table.locator('th[data-ds-datagrid-col="name"]')).toHaveAttribute('aria-sort', 'descending');
  // F2 enters the cell (sort, grip, separator), Tab goes round them, Escape comes back.
  await page.keyboard.press('F2');
  expect((await focusedInfo(page)).tag).toBe('button');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.closest('th').getAttribute('data-ds-datagrid-col'))).toBe('name');
  await page.keyboard.press('Escape');
  expect((await focusedInfo(page)).tag).toBe('th');
  await page.keyboard.press('Control+End');
  at = await focusedInfo(page);
  expect(at.row).toBe(await bodyRows(table).last().getAttribute('data-ds-key'));
  expect(at.label).toMatch(/^Actions for /);
  await page.keyboard.press('Control+Home');
  at = await focusedInfo(page);
  expect(at.label).toBe('Select all rows');
  // Shift+Space selects the row of the focused cell; Ctrl+A the page.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+Space');
  await expect(page.locator('[data-demo="full"] .ds-selection-bar__count')).toHaveText('1 selected');
  await page.keyboard.press('Control+a');
  await expect(page.locator('[data-demo="full"] .ds-selection-bar__count')).toHaveText('10 selected');
});

test('row mode from the markup: arrows, Space selects, Shift extends, aria-selected', async ({ page }) => {
  await open(page);
  const table = page.locator('[data-demo="declared"] table');
  await expect(table).toHaveAttribute('role', 'grid');
  // The markup's aria-sort is the first sort: load descending.
  await expect(table.locator('th[data-ds-datagrid-col="load"]')).toHaveAttribute('aria-sort', 'descending');
  const values = await table.locator('tbody tr[data-ds-datagrid-row] td[data-ds-key="c:load"]').allTextContents();
  expect(values).toEqual(['85%', '59%', '48%', '22%', '11%']);
  await expect(table.locator('tfoot')).toContainText('85');
  await table.evaluate((el) => el.querySelector('tbody [tabindex="0"]').focus());
  expect((await focusedInfo(page)).tag).toBe('tr');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  const second = table.locator('tbody tr[data-ds-datagrid-row]').nth(1);
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Shift+ArrowDown');
  const selected = await table.locator('tbody tr[aria-selected="true"]').count();
  expect(selected).toBe(3);
  await page.keyboard.press('End');
  expect((await focusedInfo(page)).row).toBe('r:d1');
});

test('tree rows: a treegrid with levels; ArrowRight opens, ArrowLeft closes and goes to the parent', async ({ page }) => {
  await open(page);
  const table = page.locator('[data-demo="tree"]');
  await expect(table).toHaveAttribute('role', 'treegrid');
  const building = table.locator('tr[data-ds-datagrid-row="a"]');
  await expect(building).toHaveAttribute('aria-level', '1');
  await expect(building).toHaveAttribute('aria-expanded', 'true');
  await expect(table.locator('tr[data-ds-datagrid-row="a1"]')).toHaveAttribute('aria-level', '2');
  await expect(table.locator('tr[data-ds-datagrid-row="d1"]')).toHaveAttribute('aria-level', '3');
  await expect(table.locator('tr[data-ds-datagrid-row="a2"]')).toHaveAttribute('aria-expanded', 'false');
  await expect(table.locator('tr[data-ds-datagrid-row="a2"]')).toHaveAttribute('aria-posinset', '2');
  await table.locator('tr[data-ds-datagrid-row="d1"]').focus();
  await page.keyboard.press('ArrowLeft');
  expect((await focusedInfo(page)).row).toBe('r:a1');
  await page.keyboard.press('ArrowLeft');
  await expect(table.locator('tr[data-ds-datagrid-row="a1"]')).toHaveAttribute('aria-expanded', 'false');
  await expect(table.locator('tr[data-ds-datagrid-row="d1"]')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await expect(table.locator('tr[data-ds-datagrid-row="a1"]')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowRight');
  expect((await focusedInfo(page)).row).toBe('r:d1');
  // The twist with the pointer, and its chevron turned.
  const twist = table.locator('tr[data-ds-datagrid-row="b"] .ds-datagrid__twist');
  await twist.click();
  await expect(table.locator('tr[data-ds-datagrid-row="b"]')).toHaveAttribute('aria-expanded', 'true');
  await expect(table.locator('tr[data-ds-datagrid-row="b0"]')).toBeVisible();
});

test('tree rows without focus mode: the twists are tab stops and open from the keyboard', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const wrap = document.createElement('div');
    wrap.className = 'ds-table-wrap';
    wrap.innerHTML = '<button type="button" data-spec="before">Before</button><table class="ds-table ds-datagrid" aria-label="Probe" data-spec="tree-table"></table>';
    document.querySelector('#fx-component').prepend(wrap);
    DS.datagrid.create(wrap.querySelector('table'), { columns: [{ key: 'name', label: 'Name' }], rows: [{ id: 'p', name: 'Parent', children: [{ id: 'c', name: 'Child' }] }], tree: true, focus: false });
  });
  const table = page.locator('[data-spec="tree-table"]');
  await expect(table).not.toHaveAttribute('role');
  const twist = table.locator('tr[data-ds-datagrid-row="p"] .ds-datagrid__twist');
  await expect(twist).not.toHaveAttribute('tabindex');
  await page.locator('[data-spec="before"]').focus();
  await page.keyboard.press('Tab');
  await expect(twist).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(twist).toHaveAttribute('aria-expanded', 'true');
  await expect(table.locator('tr[data-ds-datagrid-row="c"]')).toHaveCount(1);
});

test('row groups in cell mode with a selection column: the arrows close and open a group on its head', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const wrap = document.createElement('div');
    wrap.className = 'ds-table-wrap';
    wrap.innerHTML = '<table class="ds-table ds-datagrid" aria-label="Probe" data-spec="groups-cell"></table>';
    document.querySelector('#fx-component').prepend(wrap);
    DS.datagrid.create(wrap.firstChild, { columns: [{ key: 'name', label: 'Name' }, { key: 'kind', label: 'Kind' }], rows: [{ id: 1, name: 'One', kind: 'A' }, { id: 2, name: 'Two', kind: 'A' }, { id: 3, name: 'Three', kind: 'B' }], group: 'kind', select: 'multiple', focus: 'cell' });
  });
  const table = page.locator('[data-spec="groups-cell"]');
  await expect(table).toHaveAttribute('role', 'treegrid');
  const head = table.locator('tr[data-ds-datagrid-group="A"]');
  await head.locator('th').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(head).toHaveAttribute('aria-expanded', 'false');
  await expect(table.locator('tr[data-ds-datagrid-row="1"]')).toHaveCount(0);
  await expect(head.locator('th')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(head).toHaveAttribute('aria-expanded', 'true');
  await expect(table.locator('tr[data-ds-datagrid-row="1"]')).toHaveCount(1);
});

test('row groups: head rows with counts and subtotals, collapsible, and the summary row', async ({ page }) => {
  await open(page);
  const table = page.locator('[data-demo="groups"]');
  const groups = table.locator('tr.ds-datagrid__group');
  await expect(groups).toHaveCount(6);
  const desktop = table.locator('tr[data-ds-datagrid-group="Desktop 7"]');
  await expect(desktop.locator('th')).toContainText('Desktop 7');
  await expect(desktop.locator('.ds-datagrid__count')).toHaveText('2 rows');
  await expect(desktop.locator('td[data-ds-key="c:tickets"]')).toHaveText('13');
  const tablet = table.locator('tr[data-ds-datagrid-group="Tablet 11"]');
  await expect(tablet.locator('.ds-datagrid__twist')).toHaveAttribute('aria-expanded', 'false');
  await tablet.locator('.ds-datagrid__twist').click();
  await expect(tablet.locator('.ds-datagrid__twist')).toHaveAttribute('aria-expanded', 'true');
  await expect(table.locator('tfoot th')).toHaveText('Total');
  await expect(table.locator('tfoot td[data-ds-key="c:tickets"]')).toHaveText('48');
});

test('inline edit: a refused value keeps the editor with its message; Enter saves, Escape cancels', async ({ page }) => {
  await open(page);
  const table = full(page);
  const cell = bodyRows(table).first().locator('td[data-ds-key="c:load"]');
  await expect(cell).toHaveClass(/ds-datagrid__editable/);
  await cell.dblclick();
  const editor = cell.locator('.ds-datagrid__editor');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveAttribute('aria-label', 'Load, DESKTOP-0114');
  await editor.fill('140');
  await page.keyboard.press('Enter');
  await expect(cell.locator('.ds-datagrid__editor')).toHaveAttribute('aria-invalid', 'true');
  await expect(cell.locator('.ds-datagrid__message')).toHaveText('Between 0 and 100.');
  await cell.locator('.ds-datagrid__editor').fill('12');
  await page.evaluate(() => {
    window.specEdit = new Promise((resolve) => document.querySelector('[data-demo="full-table"]').addEventListener('ds:edit', (event) => resolve(event.detail.value), { once: true }));
  });
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.specEdit)).toBe(12);
  await expect(cell).toHaveText('12%');
  await expect(cell).toBeFocused();
  // F2 then Escape: nothing changed.
  await page.keyboard.press('F2');
  await cell.locator('.ds-datagrid__editor').fill('99');
  await page.keyboard.press('Escape');
  await expect(cell).toHaveText('12%');
  // A select editor; Tab goes to the next editable cell.
  const owner = bodyRows(table).first().locator('td[data-ds-key="c:owner"]');
  await owner.dblclick();
  await expect(owner.locator('select.ds-datagrid__editor')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(bodyRows(table).first().locator('td[data-ds-key="c:load"] .ds-datagrid__editor')).toBeFocused();
  await page.keyboard.press('Escape');
});

test('the row menu: right click at the pointer, an item sends ds:action, focus goes back; Shift+F10', async ({ page }) => {
  await open(page);
  const table = full(page);
  const menu = page.locator('[data-demo="full"] .ds-menu[aria-label="Device actions"]');
  const row = bodyRows(table).nth(2);
  const box = await row.locator('td[data-ds-key="c:model"]').boundingBox();
  await page.mouse.click(box.x + 10, box.y + 10, { button: 'right' });
  await expect(menu).toBeVisible();
  const placed = await menu.boundingBox();
  expect(Math.abs(placed.x - (box.x + 10))).toBeLessThan(24);
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await page.evaluate(() => {
    window.specAction = new Promise((resolve) => document.querySelector('[data-demo="full-table"]').addEventListener('ds:action', (event) => resolve({ action: event.detail.action, key: event.detail.key }), { once: true }));
  });
  await menu.getByRole('menuitem', { name: 'New ticket' }).click();
  expect(await page.evaluate(() => window.specAction)).toEqual({ action: 'ticket', key: await row.getAttribute('data-ds-datagrid-row') });
  await expect(menu).toBeHidden();
  // Focus came back to the grid, not to the page.
  expect((await focusedInfo(page)).row).toBe(await row.getAttribute('data-ds-key'));
  // The keys: Shift+F10 on a focused cell; Escape brings focus back to it.
  await row.locator('td[data-ds-key="c:model"]').click();
  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  expect((await focusedInfo(page)).key).toBe('c:model');
  // The row's own menu button opens it under itself.
  await row.locator('[data-ds-datagrid-menu]').click();
  await expect(menu).toBeVisible();
  await expect(row.locator('[data-ds-datagrid-menu]')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
});

test('server data: the first load, paging and sorting through the source, an error with Try again', async ({ page }) => {
  await open(page);
  const table = page.locator('[data-demo="server"]');
  await expect(table.locator('tbody tr[data-ds-datagrid-row]')).toHaveCount(10);
  const pager = page.locator('nav[aria-label="Pages of tickets"]');
  await expect(pager.locator('.ds-pagination__range')).toHaveText('1–10 of 64');
  await expect(pager.locator('[data-ds-datagrid-page="previous"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(table).toHaveAttribute('aria-rowcount', '66');
  await pager.locator('[data-ds-datagrid-page="last"]').click();
  await expect(table).toHaveAttribute('aria-busy', 'true');
  await expect(pager.locator('.ds-pagination__range')).toHaveText('61–64 of 64');
  await expect(table.locator('tbody tr[data-ds-datagrid-row]')).toHaveCount(4);
  await expect(table).not.toHaveAttribute('aria-busy');
  await expect(table.locator('tbody tr[data-ds-datagrid-row]').first()).toHaveAttribute('aria-rowindex', '62');
  await page.locator('[data-demo="fail"]').click();
  await table.locator('th[data-ds-datagrid-col="title"] .ds-table__sort').click();
  const error = table.locator('.ds-datagrid__state .ds-empty--error');
  await expect(error).toBeVisible();
  await expect(error).toHaveAttribute('role', 'alert');
  await error.getByRole('button', { name: 'Try again' }).click();
  await expect(table.locator('tbody tr[data-ds-datagrid-row]')).toHaveCount(10);
  await expect(table.locator('tfoot')).toContainText('Total');
});

test('ten thousand windowed rows: aria-rowcount, few rows in the DOM, the keys reach the last row', async ({ page }) => {
  await open(page);
  const table = page.locator('[data-demo="virtual"]');
  await expect(table).toHaveAttribute('aria-rowcount', '10001');
  await expect(table).toHaveAttribute('data-ds-datagrid-layout', 'fixed');
  const count = await table.locator('tbody tr[data-ds-datagrid-row]').count();
  expect(count).toBeGreaterThan(5);
  expect(count).toBeLessThan(60);
  await table.evaluate((el) => el.querySelector('[tabindex="0"]').focus());
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Control+End');
  const last = await page.evaluate(() => document.activeElement.closest('tr').getAttribute('aria-rowindex'));
  expect(last).toBe('10001');
  await page.keyboard.press('PageUp');
  expect(await page.evaluate(() => document.activeElement.closest('tr').getAttribute('aria-rowindex'))).toBe('9991');
});

test('the states inside the grid: nothing yet, loading, did not load, no results', async ({ page }) => {
  await open(page);
  await expect(page.locator('[data-demo="empty"] .ds-datagrid__state .ds-empty--no-data')).toContainText('Nothing here yet');
  await expect(page.locator('[data-demo="loading"] .ds-datagrid__state .ds-loading')).toHaveAttribute('role', 'status');
  await expect(page.locator('[data-demo="loading"]')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('[data-demo="error"] .ds-datagrid__state .ds-empty--error')).toContainText('The data did not load.');
  await expect(page.locator('[data-demo="no-results"] .ds-datagrid__state .ds-empty--no-results')).toContainText('No results');
  const span = await page.locator('[data-demo="empty"] .ds-datagrid__state td').getAttribute('colspan');
  expect(span).toBe('3');
});

test('a filter narrows the rows and is announced; export writes CSV of what shows', async ({ page }) => {
  await open(page);
  const table = full(page);
  await page.locator('[data-demo="filter"]').fill('turing');
  await expect.poll(() => bodyRows(table).count()).toBe(6);
  expect(await said(page)).toContain('6 rows');
  const text = await table.evaluate((el) => DS.datagrid.create(el).csv());
  const lines = text.split('\r\n');
  expect(lines[0]).toBe('Device,Model,Owner,Tickets,Load,Status');
  expect(lines).toHaveLength(7);
  expect(lines[1]).toMatch(/^DESKTOP-0135,Tablet 11,Alan Turing,2,96%,Overloaded$/);
  const download = page.waitForEvent('download');
  await page.locator('[data-demo="full"] [data-ds-datagrid-command="csv"]').click();
  expect((await download).suggestedFilename()).toBe('devices.csv');
});

test('copy puts the selected rows on the clipboard as tab-separated text, and Ctrl+C copies a cell', async ({ page }) => {
  await open(page);
  await stubClipboard(page);
  const table = full(page);
  const boxes = table.locator('tbody [data-ds-datagrid-check]');
  await boxes.nth(0).click();
  await boxes.nth(1).click();
  await page.locator('[data-demo="full"] .ds-selection-bar [data-ds-datagrid-command="copy"]').click();
  await expect.poll(() => page.evaluate(() => window.specClip.length)).toBe(1);
  const lines = (await page.evaluate(() => window.specClip[0])).split('\r\n');
  expect(lines[0]).toBe('Device\tModel\tOwner\tTickets\tLoad\tStatus');
  expect(lines).toHaveLength(3);
  expect(lines[1].split('\t')[0]).toBe('DESKTOP-0114');
  await expect.poll(() => said(page)).toContain('2 rows copied.');
  // With nothing selected, Ctrl+C in focus mode copies the focused cell's text.
  await page.locator('[data-demo="full"] .ds-selection-bar [data-ds-datagrid-command="clear"]').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(() => page.evaluate(() => window.specClip.at(-1))).toBe('Desktop 7');
});

test('row mode: Ctrl+C with nothing selected copies the focused row', async ({ page }) => {
  await open(page);
  await stubClipboard(page);
  const table = page.locator('[data-demo="declared"] table');
  const row = table.locator('tbody tr[data-ds-datagrid-row]').first();
  const name = (await row.locator('td:not(.ds-datagrid__select)').first().textContent()).trim();
  await row.focus();
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(() => page.evaluate(() => window.specClip.length)).toBe(1);
  const lines = (await page.evaluate(() => window.specClip[0])).split('\r\n');
  expect(lines[0]).toBe('Device\tOwner\tLoad');
  expect(lines).toHaveLength(2);
  expect(lines[1].split('\t')[0]).toBe(name);
  await expect.poll(() => said(page)).toContain('1 row copied.');
});

test('server data: an export and a copy of every selected row ask the source for every row', async ({ page }) => {
  await open(page);
  await stubClipboard(page);
  await page.evaluate(() => {
    const rows = Array.from({ length: 64 }, (_, at) => ({ id: `t${at + 1}`, title: `Ticket ${at + 1}`, opened: at % 9 }));
    const wrap = document.createElement('div');
    wrap.className = 'ds-table-wrap';
    wrap.innerHTML = '<table class="ds-table ds-datagrid" aria-label="Probe" data-spec="server-export"></table>';
    document.querySelector('#fx-component').prepend(wrap);
    window.specQueries = [];
    const columns = [{ key: 'title', label: 'Ticket' }, { key: 'opened', label: 'Open for', type: 'number' }];
    window.specServer = DS.datagrid.create(wrap.firstChild, {
      columns,
      select: 'multiple',
      page: { size: 10 },
      source: (query, context) => {
        window.specQueries.push({ page: query.page, export: Boolean(context.export) });
        const result = DS.datagrid.query(rows, { columns, sort: query.sort, filter: query.filter, page: query.page });
        return Promise.resolve({ rows: result.rows, total: result.total });
      },
    });
  });
  const table = page.locator('[data-spec="server-export"]');
  await expect(table.locator('tbody tr[data-ds-datagrid-row]')).toHaveCount(10);
  const text = await page.evaluate(() => window.specServer.csv());
  expect(text.split('\r\n')).toHaveLength(65);
  expect(await page.evaluate(() => window.specQueries.at(-1))).toEqual({ page: null, export: true });
  // Every row selected, two unchecked: the copy holds the other 62.
  await page.evaluate(() => window.specServer.select('all'));
  await table.locator('tbody [data-ds-datagrid-check]').nth(0).click();
  await table.locator('tbody [data-ds-datagrid-check]').nth(1).click();
  expect(await page.evaluate(() => window.specServer.copy())).toBe(true);
  const lines = (await page.evaluate(() => window.specClip.at(-1))).split('\r\n');
  expect(lines).toHaveLength(63);
  expect(lines[1].split('\t')[0]).toBe('Ticket 3');
  await expect.poll(() => said(page)).toContain('62 rows copied.');
  // Rows selected on this page only: no second trip to the source.
  const trips = await page.evaluate(() => window.specQueries.length);
  await page.evaluate(() => window.specServer.select(['t4', 't5']));
  await page.evaluate(() => window.specServer.copy());
  expect(await page.evaluate(() => window.specQueries.length)).toBe(trips);
  expect((await page.evaluate(() => window.specClip.at(-1))).split('\r\n')).toHaveLength(3);
});

test('single selection: a radio per row, one group; checking one leaves the other', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const wrap = document.createElement('div');
    wrap.className = 'ds-table-wrap';
    wrap.innerHTML = '<table class="ds-table ds-datagrid" aria-label="Probe" data-spec="single"></table>';
    document.querySelector('#fx-component').prepend(wrap);
    DS.datagrid.create(wrap.firstChild, { columns: [{ key: 'name', label: 'Name' }], rows: [{ id: 1, name: 'One' }, { id: 2, name: 'Two' }, { id: 3, name: 'Three' }], select: 'single' });
  });
  const table = page.locator('[data-spec="single"]');
  const radios = table.getByRole('radio');
  await expect(radios).toHaveCount(3);
  await expect(table.getByRole('checkbox')).toHaveCount(0);
  await radios.nth(0).click();
  await expect(table.locator('tr[data-ds-datagrid-row="1"]')).toHaveClass(/ds-table__row--selected/);
  await radios.nth(0).focus();
  await page.keyboard.press('ArrowDown');
  await expect(table.locator('tr[data-ds-datagrid-row="2"]')).toHaveClass(/ds-table__row--selected/);
  await expect(table.locator('tr[data-ds-datagrid-row="1"]')).not.toHaveClass(/ds-table__row--selected/);
  await expect(radios.nth(0)).not.toBeChecked();
});

test('options: size and density change the rows; touch widens the grip and the separator', async ({ page }) => {
  await open(page);
  const measure = () => page.evaluate(() => {
    const table = document.querySelector('[data-demo="full-table"]');
    const row = table.querySelector('tbody tr[data-ds-datagrid-row]');
    const grip = table.querySelector('.ds-datagrid__grip');
    const resize = table.querySelector('.ds-datagrid__resize');
    return { row: row.getBoundingClientRect().height, grip: grip.getBoundingClientRect().width, resize: resize.getBoundingClientRect().width };
  });
  const base = await measure();
  expect(base.row).toBeCloseTo(52, 0);
  expect(base.grip).toBeCloseTo(16, 0);
  expect(base.resize).toBeCloseTo(8, 0);
  await page.evaluate(() => document.querySelector('[data-demo="full"]').classList.add('ds-density-tight'));
  expect((await measure()).row).toBeCloseTo(40, 0);
  await page.evaluate(() => document.querySelector('[data-demo="full"]').classList.replace('ds-density-tight', 'ds-touch'));
  const touch = await measure();
  expect(touch.row).toBeGreaterThanOrEqual(48);
  expect(touch.grip).toBeCloseTo(16, 0);
  expect(touch.resize).toBeCloseTo(12, 0);
  // .ds-touch on the table itself, with a bigger target: the grip widens past the padding, and the padding with it.
  await page.evaluate(() => {
    document.querySelector('[data-demo="full"]').classList.remove('ds-touch');
    const table = document.querySelector('[data-demo="full-table"]');
    table.classList.add('ds-touch');
    table.style.setProperty('--ds-touch-target', '72px');
  });
  const room = await page.evaluate(() => {
    const th = document.querySelector('[data-demo="full-table"] th[data-ds-datagrid-col="model"]');
    const grip = th.querySelector('.ds-datagrid__grip').getBoundingClientRect();
    const label = th.querySelector('.ds-table__sort');
    const text = label.getBoundingClientRect().left + parseFloat(getComputedStyle(label).paddingLeft);
    return { grip: grip.width, gripEnd: grip.right, text, padding: parseFloat(getComputedStyle(th).paddingInlineStart) };
  });
  expect(room.grip).toBeCloseTo(24, 0);
  expect(room.padding).toBeGreaterThanOrEqual(24);
  expect(room.text).toBeGreaterThanOrEqual(room.gripEnd - 0.5);
});

test('a phone at 360px: the grid scrolls inside its wrapper and the page does not', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await open(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const table = full(page);
  // The secondary look of the table stays: every cell carries its label for stacked rows.
  await expect(bodyRows(table).first().locator('td[data-ds-key="c:model"]')).toHaveAttribute('data-label', 'Model');
  // A grid with .ds-table--stack stacks its rows: each a block, each cell labelled by the label the grid wrote.
  const stack = page.locator('[data-demo="stack"]');
  const first = bodyRows(stack).first();
  await expect(first.locator('td[data-ds-key="c:owner"]')).toHaveAttribute('data-label', 'Owner');
  expect(await first.evaluate((row) => getComputedStyle(row).display)).not.toBe('table-row');
  const label = await first.locator('td[data-ds-key="c:owner"]').evaluate((cell) => getComputedStyle(cell, '::before').content);
  expect(label).not.toBe('none');
  // Editing still works in a stacked row.
  await first.locator('td[data-ds-key="c:place"]').dblclick();
  await expect(first.locator('td[data-ds-key="c:place"] .ds-datagrid__editor')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(first.locator('td[data-ds-key="c:place"]')).toHaveText('Building A, 1st floor');
});

test('forced colours: the separator line is a border, rings stay, the group row loses its tint', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const table = full(page);
  const line = await table.locator('.ds-datagrid__resize').first().evaluate((el) => getComputedStyle(el, '::before').borderInlineEndStyle);
  expect(line).toBe('solid');
  await table.evaluate((el) => el.querySelector('[tabindex="0"]').focus());
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  expect(ring).toBe('solid');
  const group = page.locator('[data-demo="groups"] tr.ds-datagrid__group').first();
  const tint = await group.evaluate((el) => getComputedStyle(el).backgroundColor);
  const canvas = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'Canvas';
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  expect(tint).toBe(canvas);
});

test('destroy() gives the table back what the grid wrote', async ({ page }) => {
  await open(page);
  const left = await page.evaluate(() => {
    const table = document.querySelector('[data-demo="full-table"]');
    DS.datagrid.create(table).destroy();
    return { role: table.getAttribute('role'), multi: table.getAttribute('aria-multiselectable'), stops: table.querySelectorAll('[data-ds-datagrid-stop]').length };
  });
  expect(left).toEqual({ role: null, multi: null, stops: 0 });
});

test('destroy() before the next frame: the frames it asked for write nothing', async ({ page }) => {
  await open(page);
  const left = await page.evaluate(async () => {
    const make = (options) => {
      const wrap = document.createElement('div');
      wrap.className = 'ds-table-wrap';
      wrap.innerHTML = '<table class="ds-table ds-datagrid" aria-label="Probe"></table>';
      document.querySelector('#fx-component').append(wrap);
      const table = wrap.firstChild;
      DS.datagrid.create(table, { columns: [{ key: 'a', label: 'A', width: 100 }, { key: 'b', label: 'B' }], rows: Array.from({ length: 40 }, (_, at) => ({ id: at, a: at, b: at })), ...options }).destroy();
      return table;
    };
    const tables = [make({ focus: 'cell' }), make({ virtual: true, focus: 'cell' })];
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return tables.map((table) => ({ role: table.getAttribute('role'), layout: table.getAttribute('data-ds-datagrid-layout'), width: table.style.getPropertyValue('--ds-datagrid-width') }));
  });
  expect(left).toEqual([{ role: null, layout: null, width: '' }, { role: null, layout: null, width: '' }]);
});
