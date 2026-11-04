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
  expect(Math.abs(result.width - before)).toBeLessThan(1);
});

test('fixed layout holds every column as the window moves over rows of very different text', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.table = fxTable(); });
  const widths = () => page.evaluate(() => Array.from(document.querySelectorAll('#table th')).map((th) => th.getBoundingClientRect().width));
  const before = await widths();
  for (const index of [1, 800, 5000, 9999]) {
    await page.evaluate((at) => table.scrollTo(at, { align: 'start' }), index);
    const now = await widths();
    now.forEach((width, column) => expect(Math.abs(width - before[column])).toBeLessThan(1));
  }
});

test('scrolling and focus keep a row out from under a sticky header', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.table = fxTable(); });
  const clear = (index) => page.evaluate((at) => {
    const row = table.row(at).getBoundingClientRect();
    const head = document.querySelector('#table th').getBoundingClientRect();
    return row.top - head.bottom;
  }, index);
  await page.evaluate(() => table.scrollTo(4000, { align: 'start' }));
  expect(await clear(4000)).toBeGreaterThan(-1);
  await page.evaluate(() => table.focus(4000));
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  expect(await clear(3998)).toBeGreaterThan(-1);
  await page.keyboard.press('PageUp');
  const active = await page.evaluate(() => table.get().active);
  expect(await clear(active)).toBeGreaterThan(-1);
});

for (const [title, wrapped] of [['is the scroller', false], ['sits in the scroller', true]]) {
  test(`an ARIA grid that ${title} keeps its header row group: the rows go in the group after it`, async ({ page }) => {
    await open(page);
    const result = await page.evaluate((inside) => {
      const grid = `<div id="grid" role="grid" aria-label="Devices"${inside ? '' : ' class="fx-scroller"'}><div role="rowgroup" id="grid-head"><div role="row"><div role="columnheader">Device</div></div></div><div role="rowgroup" id="grid-body"></div></div>`;
      document.querySelector('main').insertAdjacentHTML('beforeend', inside ? `<div id="grid-scroller" class="fx-scroller">${grid}</div>` : grid);
      const rows = DS.virtual.create(document.querySelector(inside ? '#grid-scroller' : '#grid'), {
        count: 1000,
        estimate: 40,
        render: (index) => `<div role="row" data-ds-key="row-${index}" style="height:40px"><div role="gridcell">Device ${index}</div></div>`,
      });
      const element = document.querySelector('#grid');
      return {
        children: Array.from(element.children).map((child) => child.id || child.getAttribute('role')),
        head: document.querySelector('#grid-head').textContent,
        row: rows.row(0)?.parentElement.id,
        index: rows.row(0)?.getAttribute('aria-rowindex'),
        count: element.getAttribute('aria-rowcount'),
      };
    }, wrapped);
    expect(result).toEqual({ children: ['grid-head', 'grid-body'], head: 'Device', row: 'grid-body', index: '2', count: '1001' });
  });
}

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

test('rows with controls stay one stop: Tab goes through the active row and leaves the list, and back', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.list = fxList({ estimate: 48, render: fxRowWithControls }); });
  const focused = () => page.evaluate(() => document.activeElement.id || document.activeElement.getAttribute('data-ds-key'));
  await page.locator('#before').focus();
  const forward = [];
  for (let press = 0; press < 4; press += 1) {
    await page.keyboard.press('Tab');
    forward.push(await focused());
  }
  expect(forward).toEqual(['row-0', 'b0', 'a0', 'after']);
  const back = [];
  for (let press = 0; press < 4; press += 1) {
    await page.keyboard.press('Shift+Tab');
    back.push(await focused());
  }
  expect(back).toEqual(['a0', 'b0', 'row-0', 'before']);
  expect(await page.evaluate(() => list.get().end)).toBeLessThan(40);
});

test('the controls follow the active row, keep their own tabindex through a morph, and destroy() gives them back', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.list = fxList({ estimate: 48, render: fxRowWithControls }); });
  const tabindexes = (index) => page.evaluate((at) => [`#b${at}`, `#a${at}`, `#own${at}`].map((selector) => document.querySelector(selector)?.getAttribute('tabindex') ?? null), index);
  expect(await tabindexes(0)).toEqual([null, null, '-1']);
  expect(await tabindexes(1)).toEqual(['-1', '-1', '-1']);
  await page.evaluate(() => list.focus(0));
  await page.keyboard.press('ArrowDown');
  expect(await tabindexes(0)).toEqual(['-1', '-1', '-1']);
  expect(await tabindexes(1)).toEqual([null, null, '-1']);
  // A click on a waiting control makes its row the active one.
  await page.locator('#b3').click();
  expect(await page.evaluate(() => list.get().active)).toBe(3);
  expect(await tabindexes(3)).toEqual([null, null, '-1']);
  expect(await tabindexes(1)).toEqual(['-1', '-1', '-1']);
  // A morph patches the row in place and leaves what the system wrote; new rows wait as well.
  await page.evaluate(() => { list.refresh(); list.scrollTo(500, { align: 'start' }); });
  expect(await tabindexes(3)).toEqual([null, null, '-1']);
  expect(await tabindexes(500)).toEqual(['-1', '-1', '-1']);
  await page.evaluate(() => list.set({ active: 500 }));
  expect(await tabindexes(500)).toEqual([null, null, '-1']);
  expect(await tabindexes(501)).toEqual(['-1', '-1', '-1']);
  await page.evaluate(() => list.destroy());
  expect(await tabindexes(500)).toEqual([null, null, '-1']);
  expect(await tabindexes(501)).toEqual([null, null, '-1']);
});

test('a table of 10,000 rows with an Edit button in each: Tab reaches what comes after the table, and comes back', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.table = fxTable({ render: (index) => `<tr data-ds-key="row-${index}"><td>Device ${index}</td><td><button type="button" id="edit-${index}">Edit</button></td></tr>` });
  });
  const focused = () => page.evaluate(() => document.activeElement.id || document.activeElement.getAttribute('data-ds-key'));
  await page.locator('#after').focus();
  const forward = [];
  for (let press = 0; press < 3; press += 1) {
    await page.keyboard.press('Tab');
    forward.push(await focused());
  }
  expect(forward).toEqual(['row-0', 'edit-0', 'table-after']);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  expect(await focused()).toBe('after');
});

test('a list that empties under the focus keeps it on the scroller, not on the body; Tab finds the rows again', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.list = fxList({ estimate: 48 }); });
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  const empty = await page.evaluate(() => {
    const scroller = document.querySelector('#list-scroller');
    const top = scroller.scrollTop;
    list.set({ count: 0 });
    return { focus: document.activeElement.id, top: scroller.scrollTop === top, tabindex: scroller.getAttribute('tabindex') };
  });
  expect(empty).toEqual({ focus: 'list-scroller', top: true, tabindex: '-1' });
  await page.evaluate(() => list.set({ count: 20 }));
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.getAttribute('data-ds-key'))).toBe('row-0');
});

test('the document as the scroller takes the focus for the moment when its list empties', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const scroller = document.querySelector('#list-scroller');
    scroller.style.blockSize = 'auto';
    scroller.style.overflow = 'visible';
    const root = document.scrollingElement;
    const rows = DS.virtual.create(root, { content: document.querySelector('#list'), count: 50, estimate: 48, render: (index) => `<li class="fx-row" data-ds-key="row-${index}">Row ${index}</li>` });
    rows.focus(0);
    rows.set({ count: 0 });
    const during = { focused: document.activeElement === root, tabindex: root.getAttribute('tabindex') };
    document.querySelector('#after').focus();
    return { during, after: root.getAttribute('tabindex') };
  });
  expect(result).toEqual({ during: { focused: true, tabindex: '-1' }, after: null });
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

test('the document as the scroller follows a window that grows', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 300 });
  await open(page);
  const small = await page.evaluate(() => {
    const scroller = document.querySelector('#list-scroller');
    scroller.style.blockSize = 'auto';
    scroller.style.overflow = 'visible';
    window.rows = DS.virtual.create(document.scrollingElement, { content: document.querySelector('#list'), count: 5000, estimate: 48, render: (index) => `<li class="fx-row" data-ds-key="row-${index}" style="height:48px">Row ${index}</li>` });
    return rows.get().end;
  });
  await page.setViewportSize({ width: 800, height: 1000 });
  await expect.poll(() => page.evaluate(() => rows.get().end)).toBeGreaterThan(small + 10);
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
    const left = document.querySelector('#list > .fx-row');
    const leftover = ['aria-setsize', 'aria-posinset', 'tabindex'].filter((name) => left.hasAttribute(name));
    return { same, moved: list.get().end !== end, gaps: document.querySelectorAll('#list > [data-ds-virtual-gap]').length, anchor: scroller.style.overflowAnchor, leftover, scrollerStop: scroller.getAttribute('tabindex'), next: fxList({ estimate: 48 }) !== list };
  });
  expect(result).toEqual({ same: true, moved: false, gaps: 0, anchor: '', leftover: [], scrollerStop: null, next: true });
});

test('destroy() takes back what it said about a table, and a value the page had comes back', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const element = document.querySelector('#table');
    const first = fxTable();
    const during = element.getAttribute('aria-rowcount');
    first.destroy();
    const row = document.querySelector('#rows > tr');
    const after = { count: element.getAttribute('aria-rowcount'), index: row.getAttribute('aria-rowindex'), tabindex: row.getAttribute('tabindex') };
    element.setAttribute('aria-rowcount', '77');
    const second = fxTable();
    second.destroy();
    return { during, after, own: element.getAttribute('aria-rowcount') };
  });
  expect(result).toEqual({ during: '10001', after: { count: null, index: null, tabindex: null }, own: '77' });
});

test.describe('forced colours', () => {
  test.use({ forcedColors: 'active' });

  test('spacers paint nothing and a .ds-pressable row keeps its ring in a system colour', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced-colours emulation');
    await open(page);
    await page.evaluate(() => {
      window.list = fxList({ estimate: 48, render: (index) => `<li class="fx-row ds-pressable" data-ds-key="row-${index}">Row ${index}</li>` });
      list.scrollTo(500, { align: 'start' });
    });
    await expect(page.locator('#list > [data-ds-virtual-gap]').first()).toHaveCSS('visibility', 'hidden');
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    await page.evaluate(() => list.focus(500));
    await page.keyboard.press('ArrowDown');
    const ring = await page.evaluate(() => {
      const row = document.activeElement;
      const style = getComputedStyle(row);
      const probe = document.createElement('div');
      probe.style.cssText = 'color: CanvasText; background: Canvas; outline: 2px solid Highlight';
      document.body.append(probe);
      const system = getComputedStyle(probe);
      const colours = { CanvasText: system.color, Canvas: system.backgroundColor, Highlight: system.outlineColor };
      probe.remove();
      return { key: row.getAttribute('data-ds-key'), visible: row.matches(':focus-visible'), style: style.outlineStyle, width: parseFloat(style.outlineWidth), colour: style.outlineColor, colours, layer: getComputedStyle(row, '::before').display };
    });
    expect(ring.key).toBe('row-501');
    expect(ring.visible).toBe(true);
    expect(ring.style).toBe('solid');
    expect(ring.width).toBe(2);
    // The engine picks which: never the theme's own colour.
    expect(Object.values(ring.colours)).toContain(ring.colour);
    expect(ring.layer).toBe('none');
  });
});
