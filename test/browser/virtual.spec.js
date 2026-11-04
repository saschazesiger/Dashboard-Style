/**
 * DS.virtual in real engines: only the window is in the DOM, spacers stand in
 * for the rest at the right size, dynamic heights correct the model without
 * moving what shows, ARIA tells the real numbers, the keyboard reaches every
 * row, the focused row survives scrolling away and data changes, and morphHtml
 * (its own and a parent's) patches in place. Forced colours: rows keep what
 * their component does, spacers do not paint. Runs in the `fallback` project too
 * (no moveBefore).
 */
import { test, expect } from './base-test.js';
import { ready } from './helpers/motion.js';

const open = async (page) => {
  await page.goto('/test/browser/fixtures/virtual.html');
  await ready(page);
};

/** The rendered rows of a content element: not the spacers. */
const rows = (page, selector = '#list') => page.evaluate((sel) => Array.from(document.querySelector(sel).children).filter((el) => !el.hasAttribute('data-ds-virtual-gap')).map((el) => el.getAttribute('data-ds-key')), selector);

/** A frame for the scroll listener and its update. */
const frame = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

test('10,000 rows: only the window is in the DOM, and the scroll height stands for all of them', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    window.list = fxList({ estimate: 48 });
    const scroller = document.querySelector('#list-scroller');
    return { state: list.get(), height: scroller.scrollHeight, count: document.querySelector('#list').children.length };
  });
  expect(result.state.start).toBe(0);
  expect(result.state.count).toBe(10000);
  expect(result.count).toBeLessThan(30);
  expect(result.height).toBeGreaterThan(400000);
});

test('a jump renders the rows there, with spacers at the true size and no blank viewport', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.list = fxList({ estimate: 48 }); });
  await page.evaluate(() => { document.querySelector('#list-scroller').scrollTop = 200000; });
  await frame(page);
  const result = await page.evaluate(() => {
    const scroller = document.querySelector('#list-scroller');
    const box = scroller.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + 40, box.top + 150);
    return { state: list.get(), row: hit.closest('li')?.hasAttribute('data-ds-virtual-gap') ?? null, inRow: Boolean(hit.closest('.fx-row')) };
  });
  expect(result.state.start).toBeGreaterThan(1000);
  expect(result.inRow).toBe(true);
  expect(result.row).toBe(false);
});

test('dynamic heights: the first row sets the estimate, and rows measured above the viewport do not move what shows', async ({ page }) => {
  await open(page);
  // No estimate: the first row measured stands in. Row heights differ by index.
  await page.evaluate(() => { window.list = fxList(); });
  const after = await page.evaluate(async () => {
    const scroller = document.querySelector('#list-scroller');
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    scroller.scrollTop = 100000;
    await nextFrame();
    await nextFrame();
    const { start } = list.get();
    const target = list.row(start + 8);
    const top = target.getBoundingClientRect().top;
    // Scrolling up renders rows whose height the estimate had wrong, above what shows.
    scroller.scrollTop -= 200;
    await nextFrame();
    await nextFrame();
    const moved = list.row(start + 8)?.getBoundingClientRect().top;
    return { top, moved, end: scroller.scrollTop };
  });
  expect(after.moved).toBeCloseTo(after.top + 200, 0);
  // The measured sizes add up to what the layout shows at the end of the list.
  const bottom = await page.evaluate(async () => {
    const row = list.scrollTo(9999, { align: 'end' });
    const scroller = document.querySelector('#list-scroller');
    const rowBox = row.getBoundingClientRect();
    const box = scroller.getBoundingClientRect();
    return { delta: Math.abs(rowBox.bottom - (box.top + scroller.clientTop + scroller.clientHeight)), last: row.getAttribute('data-ds-key'), max: Math.abs(scroller.scrollTop + scroller.clientHeight - scroller.scrollHeight) };
  });
  expect(bottom.last).toBe('row-9999');
  expect(bottom.delta).toBeLessThan(2);
  expect(bottom.max).toBeLessThan(2);
});

test('a row that grows later is measured, and the rows after it stay in flow', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.list = fxList({ estimate: 48 }); });
  const total = () => page.evaluate(() => document.querySelector('#list-scroller').scrollHeight);
  const before = await total();
  // Not through the markup, so a morph leaves it: what a wrapped text or a stylesheet does.
  await page.addStyleTag({ content: '#list > [data-ds-key="row-2"] { height: 300px !important; }' });
  await expect.poll(total).toBeGreaterThan(before + 200);
});

test('a list says its size: aria-setsize and aria-posinset on every row', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.list = fxList({ estimate: 48 }); });
  const first = page.locator('#list > [data-ds-key="row-0"]');
  await expect(first).toHaveAttribute('aria-setsize', '10000');
  await expect(first).toHaveAttribute('aria-posinset', '1');
  await page.evaluate(() => list.scrollTo(5000, { align: 'start' }));
  await expect(page.locator('#list > [data-ds-key="row-5000"]')).toHaveAttribute('aria-posinset', '5001');
  await page.evaluate(() => list.set({ count: 20000 }));
  await expect(page.locator('#list > [data-ds-key="row-5000"]')).toHaveAttribute('aria-setsize', '20000');
  await page.evaluate(() => list.set({ total: -1 }));
  await expect(page.locator('#list > [data-ds-key="row-5000"]')).toHaveAttribute('aria-setsize', '-1');
  // The spacers are nothing to a screen reader.
  const hidden = await page.evaluate(() => Array.from(document.querySelectorAll('#list > [data-ds-virtual-gap]')).every((gap) => gap.getAttribute('aria-hidden') === 'true' && getComputedStyle(gap).visibility === 'hidden'));
  expect(hidden).toBe(true);
});

test('a table says its rows: aria-rowcount with the header, aria-rowindex after it; columns and the sticky header hold', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.table = fxTable(); });
  await expect(page.locator('#table')).toHaveAttribute('aria-rowcount', '10001');
  await expect(page.locator('#rows > [data-ds-key="row-0"]')).toHaveAttribute('aria-rowindex', '2');
  const before = await page.evaluate(() => document.querySelector('#table th').getBoundingClientRect().width);
  const result = await page.evaluate(async () => {
    table.scrollTo(5000, { align: 'center' });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const scroller = document.querySelector('#table-scroller');
    const head = document.querySelector('#table th').getBoundingClientRect();
    const box = scroller.getBoundingClientRect();
    const gap = document.querySelector('#rows > [data-ds-virtual-gap] td');
    const row = table.row(5000);
    return { top: head.top - box.top, width: head.width, rowIndex: row.getAttribute('aria-rowindex'), span: gap.colSpan, tag: gap.parentElement.localName };
  });
  expect(result.top).toBeLessThan(2);
  expect(result.rowIndex).toBe('5002');
  expect(result.span).toBe(2);
  expect(result.tag).toBe('tr');
  expect(Math.abs(result.width - before)).toBeLessThan(80);
});

test('keyboard: one tab stop; arrows, Home, End and page keys reach any row and render it first', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.list = fxList({ estimate: 48 }); });
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  const focused = () => page.evaluate(() => document.activeElement.getAttribute('data-ds-key'));
  expect(await focused()).toBe('row-0');
  expect(await page.locator('#list > [tabindex="0"]').count()).toBe(1);
  await page.keyboard.press('ArrowDown');
  expect(await focused()).toBe('row-1');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  expect(await focused()).toBe('row-0');
  await page.keyboard.press('PageDown');
  const paged = await focused();
  expect(Number(paged.slice(4))).toBeGreaterThan(3);
  await page.keyboard.press('End');
  expect(await focused()).toBe('row-9999');
  expect(await page.evaluate(() => list.get().active)).toBe(9999);
  const visible = await page.evaluate(() => {
    const box = document.querySelector('#list-scroller').getBoundingClientRect();
    const row = document.activeElement.getBoundingClientRect();
    return row.top >= box.top - 1 && row.bottom <= box.bottom + 1;
  });
  expect(visible).toBe(true);
  await page.keyboard.press('Home');
  expect(await focused()).toBe('row-0');
  // One tab stop: Tab leaves the list.
  await page.keyboard.press('Tab');
  await expect(page.locator('#after')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await focused()).toBe('row-0');
});

test('the focused row stays rendered and focused when the window scrolls away, and Tab comes back to it', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.list = fxList({ estimate: 48 }); list.focus(3); });
  await page.evaluate(() => { document.querySelector('#list-scroller').scrollTop = 200000; });
  await frame(page);
  const result = await page.evaluate(() => {
    const { start, active } = list.get();
    const row = list.row(3);
    const children = Array.from(document.querySelector('#list').children);
    return { start, active, connected: row?.isConnected, focused: document.activeElement === row, order: children.indexOf(row) < children.indexOf(list.row(start)) };
  });
  expect(result.start).toBeGreaterThan(1000);
  expect(result).toMatchObject({ active: 3, connected: true, focused: true, order: true });
  // Its place is true: a spacer on each side.
  const gaps = await page.evaluate(() => {
    const children = Array.from(document.querySelector('#list').children);
    const at = children.indexOf(list.row(3));
    return { before: children[at - 1]?.hasAttribute('data-ds-virtual-gap'), after: children[at + 1]?.hasAttribute('data-ds-virtual-gap') };
  });
  expect(gaps).toEqual({ before: true, after: true });
});

test('a click in a row makes it the active row', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.list = fxList({ estimate: 48 }); window.fxActive = []; list.on('active', ({ index }) => fxActive.push(index)); });
  await page.locator('#list > [data-ds-key="row-2"]').click();
  expect(await page.evaluate(() => ({ active: list.get().active, events: fxActive }))).toEqual({ active: 2, events: [2] });
  await expect(page.locator('#list > [data-ds-key="row-2"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#list > [data-ds-key="row-0"]')).toHaveAttribute('tabindex', '-1');
});

test('keys stay out of text fields; keyboard: false leaves focus to the page', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.list = fxList({ estimate: 48, render: (index) => `<li class="fx-row" data-ds-key="row-${index}"><input aria-label="Field ${index}" value="x"></li>` });
  });
  await page.locator('#list input').first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#list input').first()).toBeFocused();
  await page.evaluate(() => {
    list.destroy();
    window.list = fxList({ estimate: 48, keyboard: false, render: (index) => `<li class="fx-row" data-ds-key="row-${index}">Row ${index}</li>` });
  });
  expect(await page.locator('#list > [tabindex]').count()).toBe(0);
});

test('refresh() patches rows in place: same nodes, focus and listeners; a row is rendered once while it shows', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    window.list = fxList({ estimate: 48 });
    const before = fxData.renders;
    const row = list.row(1);
    const text = row.querySelector('.fx-text');
    let clicks = 0;
    text.addEventListener('click', () => { clicks += 1; });
    list.focus(1);
    // Moving the window a little renders only the new rows.
    const scroller = document.querySelector('#list-scroller');
    scroller.scrollTop = 40;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const renders = fxData.renders - before;
    const rendered = list.get().end - list.get().start;
    fxData.version = 'b';
    list.refresh();
    text.click();
    return { same: list.row(1) === row && row.querySelector('.fx-text') === text, content: text.textContent, focused: document.activeElement === row, clicks, renders, rendered };
  });
  expect(result).toMatchObject({ same: true, content: 'Row row-1 b', focused: true, clicks: 1 });
  expect(result.renders).toBeLessThan(result.rendered);
});

test('a keyed reorder keeps the focus on its row; when the row goes the focus moves to the active row', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const items = Array.from({ length: 100 }, (unused, index) => `row-${index}`);
    window.list = fxList({ estimate: 48, count: 100, items });
    const row = list.row(2);
    list.focus(2);
    // Something inserted above: the key moves one index on.
    fxData.items = ['new', ...items];
    list.set({ count: 101 });
    list.refresh();
    const out = { same: document.activeElement === row, active: list.get().active, index: list.indexOf(row), tabStops: document.querySelectorAll('#list > [tabindex="0"]').length };
    // Now the focused row leaves the data.
    fxData.items = fxData.items.filter((key) => key !== 'row-2');
    list.set({ count: 100 });
    list.refresh();
    await Promise.resolve();
    out.gone = row.isConnected;
    out.focusOn = document.activeElement.getAttribute('data-ds-key');
    return out;
  });
  expect(result.same).toBe(true);
  expect(result.index).toBe(3);
  expect(result.gone).toBe(false);
  expect(result.focusOn).toMatch(/^row-|^new$/);
  expect(result.focusOn).not.toBe('row-2');
});

test('morphHtml of a parent that empties the rows is put right before paint, focus included', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    window.list = fxList({ estimate: 48 });
    list.focus(1);
    const section = document.querySelector('#list-scroller');
    DS.dom.morphHtml(section, '<ul id="list" aria-labelledby="list-title"></ul>');
    // The microtask of the observer, before any frame.
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve));
    return {
      rows: document.querySelector('#list').children.length,
      focusOn: document.activeElement.getAttribute('data-ds-key'),
      setsize: list.row(1).getAttribute('aria-setsize'),
    };
  });
  expect(result.rows).toBeGreaterThan(5);
  expect(result.focusOn).toBe('row-1');
  expect(result.setsize).toBe('10000');
});

test('a morph of what the system wrote keeps it: ARIA on the rows, aria-rowcount, overflow-anchor', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    window.table = fxTable();
    const host = document.querySelector('#table');
    const scroller = document.querySelector('#table-scroller');
    table.refresh();
    return { count: host.getAttribute('aria-rowcount'), anchor: scroller.style.overflowAnchor, index: table.row(0).getAttribute('aria-rowindex'), tab: table.row(0).getAttribute('tabindex') };
  });
  expect(result).toEqual({ count: '10001', anchor: 'none', index: '2', tab: '0' });
});

test('the document can be the scroller', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const root = document.scrollingElement;
    const scrollerBox = document.querySelector('#list-scroller');
    scrollerBox.style.blockSize = 'auto';
    scrollerBox.style.overflow = 'visible';
    const rows = DS.virtual.create(root, { content: document.querySelector('#list'), count: 5000, estimate: 48, render: (index) => `<li class="fx-row" data-ds-key="row-${index}">Row ${index}</li>` });
    const first = rows.get();
    root.scrollTop = 100000;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const later = rows.get();
    const row = rows.row(later.start + 5);
    const box = row.getBoundingClientRect();
    return { first: first.end - first.start, later, height: root.scrollHeight, onScreen: box.bottom > -500 && box.top < innerHeight + 500 };
  });
  expect(result.first).toBeLessThan(40);
  expect(result.later.start).toBeGreaterThan(1000);
  expect(result.height).toBeGreaterThan(100000);
  expect(result.onScreen).toBe(true);
});

test('count shrinks and grows; ds:range tells the window, for load-more', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const seen = [];
    const scroller = document.querySelector('#list-scroller');
    scroller.addEventListener('ds:range', (event) => seen.push(event.detail));
    window.list = fxList({ estimate: 48, count: 100 });
    list.focus(90);
    list.set({ count: 10 });
    const small = list.get();
    list.set({ count: 0 });
    const none = { state: list.get(), children: document.querySelector('#list').children.length };
    list.set({ count: 5 });
    return { seen, small, none, grown: list.get(), keys: Array.from(document.querySelector('#list').children).filter((el) => !el.hasAttribute('data-ds-virtual-gap')).length };
  });
  expect(result.small.active).toBe(9);
  expect(result.small.count).toBe(10);
  expect(result.none).toEqual({ state: { start: 0, end: 0, count: 0, active: 0 }, children: 0 });
  expect(result.grown.count).toBe(5);
  expect(result.keys).toBe(5);
  expect(result.seen.some((detail) => detail.count === 100)).toBe(true);
  expect(result.seen.at(-1).count).toBe(5);
});

test('a scroller without height (hidden) renders a few rows, and catches up when it shows', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const scroller = document.querySelector('#list-scroller');
    scroller.style.display = 'none';
    window.list = fxList({ estimate: 48 });
    const hidden = list.get();
    scroller.style.display = '';
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    return { hidden, shown: list.get() };
  });
  expect(result.hidden.end).toBeLessThanOrEqual(8);
  expect(result.shown.end).toBeGreaterThan(5);
});

test('destroy() is safe twice, takes the listeners and spacers away and leaves the rows', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const list = fxList({ estimate: 48 });
    const scroller = document.querySelector('#list-scroller');
    const same = fxList() === list;
    list.destroy();
    list.destroy();
    const { end } = list.get();
    scroller.scrollTop = 500;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { same, moved: list.get().end !== end, gaps: document.querySelectorAll('#list > [data-ds-virtual-gap]').length, anchor: scroller.style.overflowAnchor, next: fxList({ estimate: 48 }) !== list };
  });
  expect(result).toEqual({ same: true, moved: false, gaps: 0, anchor: '', next: true });
});

test.describe('forced colours', () => {
  test.use({ forcedColors: 'active' });

  test('spacers paint nothing and a focused row shows its ring', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced-colours emulation');
    await open(page);
    await page.evaluate(() => { window.list = fxList({ estimate: 48 }); list.scrollTo(500, { align: 'start' }); });
    await expect(page.locator('#list > [data-ds-virtual-gap]').first()).toHaveCSS('visibility', 'hidden');
    await page.keyboard.press('Tab');
    await page.evaluate(() => list.focus(500));
    await page.keyboard.press('ArrowDown');
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    expect(outline).toBe('solid');
  });
});
