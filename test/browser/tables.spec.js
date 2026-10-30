/**
 * Tables of 2.0 on fixtures/tables.html: stacked rows (by container query
 * and in a side sheet body, table roles kept), the full-page table (a
 * sticky header, a pinned first column, cut cells, its fades), a pinned
 * card table (opaque layers, the hairline, click forwarding and the
 * two-part ripple of DS.ripple.attach()), interactive rows without a row
 * link, row actions and the summary row, pagination, the selection bar,
 * print and forced colours. Scroll-driven parts are read after setting
 * the scroll position and two frames; engines without scroll timelines
 * (Firefox, the `fallback` project) assert the attribute fallback.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const TABLES = '/test/browser/fixtures/tables.html';

async function open(page, { attach = false } = {}) {
  await page.goto(TABLES);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  if (attach) await page.evaluate(() => { window.fxRipples = DS.ripple.attach(document); });
}

/** Brings `selector` into the viewport (hit tests and the pointer need it there). */
const show = (page, selector) => page.locator(selector).first().scrollIntoViewIfNeeded();

const scrollTimelines = (page) => page.evaluate(() => CSS.supports('animation-timeline: scroll()'));

/** Scrolls `selector` and waits two frames, so scroll timelines have run. */
function scrollTo(page, selector, { top, left }) {
  return page.evaluate(async ([sel, y, x]) => {
    const scroller = document.querySelector(sel);
    if (y !== null) scroller.scrollTop = y;
    if (x !== null) scroller.scrollLeft = x;
    for (let i = 0; i < 2; i += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
  }, [selector, top ?? null, left ?? null]);
}

/** The two edge numbers of a scroller. */
const edges = (page, selector) => page.evaluate((sel) => {
  const style = getComputedStyle(document.querySelector(sel));
  return [Number(style.getPropertyValue('--ds-scroll-edge-start')), Number(style.getPropertyValue('--ds-scroll-edge-end'))];
}, selector);

test('stacked rows: a block per row with its labels in a 560px content area, a sheet body and --stack-wide at 800px; table roles stay', async ({ page }) => {
  await open(page);
  const look = (selector) => page.evaluate((sel) => {
    const table = document.querySelector(sel);
    const body = table.tBodies[0];
    const row = body.rows[0];
    const cell = row.cells[0];
    return {
      body: getComputedStyle(body).display,
      border: getComputedStyle(row).borderTopWidth,
      radius: getComputedStyle(row).borderTopLeftRadius,
      head: Math.round(table.tHead.getBoundingClientRect().height),
      label: getComputedStyle(cell, '::before').content,
      labelSize: getComputedStyle(cell, '::before').fontSize,
    };
  }, selector);
  for (const selector of ['#stack', '#stack-wide', '#stack-sheet']) {
    const stacked = await look(selector);
    expect(stacked.body, selector).toBe('grid');
    expect(stacked.border, selector).toBe('1px');
    expect(stacked.radius, selector).not.toBe('0px');
    expect(stacked.head, `${selector}: the header is for screen readers only`).toBeLessThanOrEqual(1);
    expect(stacked.label, selector).toMatch(/Name/);
    expect(stacked.labelSize, selector).toBe('14px');
  }
  // --stack at 800px of content: a table as usual.
  expect((await look('#stack-800')).body).toBe('table-row-group');
  // The label sits above the field, the remove button at the block's top end.
  const layout = await page.evaluate(() => {
    const row = document.querySelector('#stack tbody tr');
    const input = row.querySelector('input').getBoundingClientRect();
    const remove = row.querySelector('.ds-table__actions .ds-btn').getBoundingClientRect();
    const box = row.getBoundingClientRect();
    return { inputTop: input.top - box.top, removeTop: remove.top - box.top, removeRight: box.right - remove.right, inputRight: input.right, removeLeft: remove.left };
  });
  expect(layout.inputTop).toBeGreaterThan(20);
  expect(layout.removeTop).toBeLessThan(layout.inputTop);
  expect(layout.removeRight).toBeLessThan(24);
  expect(layout.removeLeft).toBeGreaterThan(layout.inputRight);
  // In a card the blocks keep the card's padding; the wrapper of stacked rows never fades.
  const card = await page.evaluate(() => {
    const wrap = document.getElementById('stack-wrap');
    const card = wrap.closest('.ds-card').getBoundingClientRect();
    const row = wrap.querySelector('tbody tr').getBoundingClientRect();
    const style = getComputedStyle(wrap);
    return { inset: row.left - card.left, mask: style.maskImage || style.webkitMaskImage };
  });
  expect(card.inset).toBeGreaterThanOrEqual(16);
  expect(card.mask).toBe('none');
  // The roles survive the display changes in every engine.
  await expect(page.locator('#stack')).toMatchAriaSnapshot(`
    - table "Sources":
      - rowgroup:
        - row:
          - columnheader "Name"
          - columnheader "URL"
          - columnheader "Remove"
      - rowgroup:
        - row:
          - cell:
            - textbox "Name"
          - cell:
            - textbox "URL"
          - cell:
            - button "Remove source 1"
        - row:
          - cell:
            - textbox "Name"
          - cell:
            - textbox "URL"
          - cell:
            - button "Remove source 2"
  `);
});

test('full-page table: the header sticks, the first column stays, long cells are cut, the corner is on top', async ({ page }) => {
  await open(page);
  await show(page, '#fill-frame');
  await scrollTo(page, '#fill', { top: 400, left: 300 });
  const state = await page.evaluate(() => {
    const wrap = document.getElementById('fill');
    const box = wrap.getBoundingClientRect();
    const head = wrap.querySelector('thead th:nth-child(7)');
    const corner = wrap.querySelector('thead th:first-child');
    const first = wrap.querySelector('tbody tr:nth-child(12) > :first-child');
    const long = wrap.querySelector('tbody tr:nth-child(2) > :nth-child(4)');
    const at = (el) => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.left + 4, r.top + r.height / 2); };
    return {
      border: getComputedStyle(wrap).borderTopWidth,
      headTop: Math.round(head.getBoundingClientRect().top - box.top),
      cornerLeft: Math.round(corner.getBoundingClientRect().left - box.left),
      firstLeft: Math.round(first.getBoundingClientRect().left - box.left),
      headHit: head.contains(at(head)),
      cornerHit: corner.contains(at(corner)),
      firstHit: first.contains(at(first)),
      cut: long.scrollWidth > long.clientWidth,
      longWidth: long.getBoundingClientRect().width,
      ellipsis: getComputedStyle(long).textOverflow,
      cornerZ: getComputedStyle(corner).zIndex,
      bodyZ: getComputedStyle(first).zIndex,
    };
  });
  expect(state.border).toBe('1px');
  expect(state.headTop).toBe(1);
  expect(state.cornerLeft).toBe(1);
  expect(state.firstLeft).toBe(1);
  expect(state).toMatchObject({ headHit: true, cornerHit: true, firstHit: true, cut: true, ellipsis: 'ellipsis' });
  // max-width 280px plus the cell's padding (the cell box).
  expect(state.longWidth).toBeLessThanOrEqual(280 + 2 * 16 + 1);
  expect(Number(state.cornerZ)).toBeGreaterThan(Number(state.bodyZ));
  // Keyboard focus never lands under the header: the scroll padding is the head's height.
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('fill')).scrollPaddingTop)).toBe('48px');
});

test('full-page table: the fades follow the scroll (or the attributes) and leave the border opaque', async ({ page }) => {
  await open(page);
  if (await scrollTimelines(page)) {
    expect(await edges(page, '#fill')).toEqual([0, 1]);
    await scrollTo(page, '#fill', { left: 100000 });
    expect(await edges(page, '#fill')).toEqual([1, 0]);
  } else {
    expect(await edges(page, '#fill')).toEqual([0, 0]);
    await page.evaluate(() => document.getElementById('fill').setAttribute('data-ds-overflow-end', ''));
    await settle(page);
    expect(await edges(page, '#fill')).toEqual([0, 1]);
  }
  const mask = await page.evaluate(() => {
    const style = getComputedStyle(document.getElementById('fill'));
    return { clip: style.maskClip || style.webkitMaskClip, composite: style.maskComposite || style.webkitMaskComposite };
  });
  expect(mask.clip.replace(/\s+/g, ' ')).toMatch(/padding-box, padding-box, border-box/);
  expect(mask.composite).toMatch(/exclude|xor/);
});

test('pinned card table: the first column stays on an opaque base, with the row layers and the hairline over it', async ({ page }) => {
  await open(page);
  await show(page, '#pinned-card');
  const has = await scrollTimelines(page);
  const read = () => page.evaluate(() => {
    const wrap = document.getElementById('pinned-wrap');
    const cell = document.querySelector('#pinned-3 > :first-child');
    const selected = document.querySelector('#pinned-2 > :first-child');
    const foot = document.getElementById('foot-first');
    const style = getComputedStyle(cell);
    return {
      scrolls: wrap.scrollWidth > wrap.clientWidth,
      left: Math.round(cell.getBoundingClientRect().left - wrap.getBoundingClientRect().left),
      footLeft: Math.round(foot.getBoundingClientRect().left - wrap.getBoundingClientRect().left),
      position: style.position,
      layer: style.getPropertyValue('--ds-table-sticky-layer').trim(),
      tint: getComputedStyle(selected).getPropertyValue('--ds-table-sticky-tint').trim(),
      image: style.backgroundImage,
      hairline: Number(getComputedStyle(cell, '::after').opacity),
    };
  });
  const rest = await read();
  expect(rest.scrolls).toBe(true);
  expect(rest.position).toBe('sticky');
  expect(rest.image).toMatch(/linear-gradient.*linear-gradient.*linear-gradient/);
  expect(rest.hairline).toBe(0);
  // A selected row: its pinned cell takes the selection colour as its tint.
  const accent = await page.evaluate(() => { const probe = document.createElement('span'); probe.style.color = 'var(--ds-accent)'; document.querySelector('.ds-theme').append(probe); const value = getComputedStyle(probe).color; probe.remove(); return value; });
  expect(rest.tint).toBe(accent);
  await scrollTo(page, '#pinned-wrap', { left: 200 });
  if (!has) {
    await page.evaluate(() => document.getElementById('pinned-wrap').setAttribute('data-ds-overflow-start', ''));
    await settle(page);
  }
  const scrolled = await read();
  expect(scrolled.left).toBe(rest.left);
  expect(scrolled.footLeft).toBe(rest.footLeft);
  expect(scrolled.hairline).toBe(1);
  // Hover lays the layer colour over the base (devices that hover).
  if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
    const box = await page.locator('#pinned-3 > :nth-child(3)').boundingBox();
    await page.mouse.move(box.x + 4, box.y + box.height / 2);
    await settle(page);
    expect((await read()).layer).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  }
  // Nothing of the cells that scroll under it shows through: the pixel under the pinned cell is its base.
  const covered = await page.evaluate(() => {
    const cell = document.querySelector('#pinned-4 > :first-child').getBoundingClientRect();
    const hit = document.elementFromPoint(cell.right - 3, cell.top + cell.height / 2);
    return hit === document.querySelector('#pinned-4 > :first-child') || document.querySelector('#pinned-4 > :first-child').contains(hit);
  });
  expect(covered).toBe(true);
});

test('pinned rows: a click anywhere on the row opens its link, controls keep theirs, a page preventDefault() keeps the click', async ({ page }) => {
  await open(page, { attach: true });
  await show(page, '#fill-frame');
  // The full-page table holds the row link in its pinned first cell: that cell confines the link's
  // stretched area, so a click on another cell lands on the cell and is forwarded.
  await scrollTo(page, '#fill', { left: 200 });
  await page.evaluate(() => {
    window.fxOpened = [];
    window.open = (...args) => { window.fxOpened.push(args); return null; };
  });
  const clickAt = async (selector, options = {}) => {
    const box = await page.locator(selector).boundingBox();
    await page.mouse.click(box.x + 8, box.y + box.height / 2, options);
  };
  const hash = () => page.evaluate(() => location.hash);
  const reset = () => page.evaluate(() => { history.replaceState(null, '', location.pathname); });
  const cell = '#fill tbody tr:nth-child(3) > :nth-child(6)';
  expect(await page.evaluate((sel) => { const box = document.querySelector(sel).getBoundingClientRect(); return document.elementFromPoint(box.left + 8, box.top + box.height / 2) === document.querySelector(sel); }, cell)).toBe(true);
  await clickAt(cell);
  await expect.poll(hash).toBe('#open-d3');
  // In the card table the link sits in the second cell: the pinned first cell (a checkbox) covers its
  // stretched area there, and a click on that cell's padding opens the row too.
  await reset();
  await show(page, '#pinned-card');
  await scrollTo(page, '#pinned-wrap', { left: 200 });
  // Apart from the last click in time and place (a double click would select a word).
  await page.mouse.move(1, 1);
  await page.waitForTimeout(600);
  const pinned = await page.locator('#pinned-1 > :first-child').boundingBox();
  await page.mouse.click(pinned.x + 4, pinned.y + 4);
  await expect.poll(hash).toBe('#open-p1');
  // A control keeps its own click: the checkbox and the action button.
  await reset();
  await page.locator('#pinned-3 input').click();
  await page.locator('#edit-3').click();
  expect(await hash()).toBe('');
  expect(await page.locator('#pinned-3 input').isChecked()).toBe(true);
  // Ctrl or Meta click and the middle button: a new tab for an a[href].
  await show(page, '#fill-frame');
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.down(modifier);
  await clickAt(cell);
  await page.keyboard.up(modifier);
  await clickAt(cell, { button: 'middle' });
  expect(await page.evaluate(() => window.fxOpened.map(([url, target, features]) => [new URL(url).hash, target, features])))
    .toEqual([['#open-d3', '_blank', 'noopener'], ['#open-d3', '_blank', 'noopener']]);
  expect(await hash()).toBe('');
  // A page that handles the click itself keeps it.
  await page.evaluate(() => document.getElementById('fill-table').addEventListener('click', (event) => event.preventDefault(), { once: true }));
  await clickAt(cell);
  expect(await hash()).toBe('');
  // Selected text: no forwarding (a drag that selects ends in a click).
  await page.evaluate((sel) => {
    const target = document.querySelector(sel);
    getSelection().selectAllChildren(target);
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  }, cell);
  expect(await hash()).toBe('');
  // Without attach() nothing forwards (only the link's own cell opens the row).
  await page.evaluate(() => { getSelection().removeAllRanges(); window.fxRipples.detach(); });
  await clickAt(cell);
  expect(await hash()).toBe('');
});

test('pinned rows ripple in two parts from one centre; a row without a row link stays plain', async ({ page }) => {
  await open(page, { attach: true });
  await show(page, '#pinned-card');
  await scrollTo(page, '#pinned-wrap', { left: 120 });
  const box = await page.locator('#pinned-3 > :nth-child(5)').boundingBox();
  await page.mouse.move(box.x + 10, box.y + box.height / 2);
  await page.mouse.down();
  const parts = await page.evaluate(() => [...document.querySelectorAll('#pinned-3 .ds-press-ripple')].map((span) => {
    const rect = span.getBoundingClientRect();
    return {
      cell: [...span.parentElement.parentElement.children].indexOf(span.parentElement),
      x: rect.left + parseFloat(span.style.getPropertyValue('--ds-ripple-x')),
      y: rect.top + parseFloat(span.style.getPropertyValue('--ds-ripple-y')),
      r: parseFloat(span.style.getPropertyValue('--ds-ripple-r')),
      width: Math.round(rect.width),
    };
  }));
  expect(parts.map((part) => part.cell).sort()).toEqual([0, 1]);
  const [row, cell] = [parts.find((part) => part.cell === 1), parts.find((part) => part.cell === 0)];
  expect(Math.abs(row.x - (box.x + 10))).toBeLessThanOrEqual(1);
  expect(Math.abs(cell.x - row.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(cell.y - row.y)).toBeLessThanOrEqual(1);
  expect(cell.r).toBe(row.r);
  // The row's part covers the row, the pinned part its cell.
  const widths = await page.evaluate(() => [document.getElementById('pinned-3').getBoundingClientRect().width, document.querySelector('#pinned-3 > :first-child').getBoundingClientRect().width].map(Math.round));
  expect([row.width, cell.width]).toEqual(widths);
  await page.mouse.up();
  await expect.poll(() => page.locator('#pinned-3 .ds-press-ripple').count(), { timeout: 3000 }).toBe(0);
  // Interactive rows: with a row link a pointer and a ripple, without one neither.
  await show(page, '#plain');
  for (const [id, cursor, count] of [['#row-linked', 'pointer', 1], ['#row-plain', 'auto', 0]]) {
    const target = page.locator(`${id} > :nth-child(2)`);
    expect(await target.evaluate((el) => getComputedStyle(el.parentElement).cursor), id).toBe(cursor);
    const at = await target.boundingBox();
    await page.mouse.move(at.x + 8, at.y + at.height / 2);
    await page.mouse.down();
    expect(await page.locator(`${id} .ds-press-ripple`).count(), id).toBe(count);
    await page.mouse.up();
  }
});

test('each row link stretches over its own row only: hit tests, clicks, hover, the ripple box; a row keeps a menu placed inside it unclipped', async ({ page }) => {
  await open(page, { attach: true });
  await show(page, '#rows-card');
  // WebKit lays table rows out static whatever their position: without the row's transform every
  // row's stretched link covered the whole wrapper, the last row's on top.
  const hits = await page.evaluate(() => [...document.querySelectorAll('#rows tbody tr')].map((row) => [...row.cells].slice(0, 3).map((cell) => {
    const box = cell.getBoundingClientRect();
    const hit = document.elementFromPoint(box.right - 4, box.top + box.height / 2);
    return hit?.closest('a')?.getAttribute('href') ?? hit?.tagName;
  })));
  expect(hits).toEqual([1, 2, 3].map((n) => Array(3).fill(`#run-${n}`)));
  // A row without a row link below a linked one keeps its own cells.
  expect(await page.evaluate(() => {
    const box = document.querySelector('#row-plain > :nth-child(2)').getBoundingClientRect();
    return document.elementFromPoint(box.left + 8, box.top + box.height / 2)?.closest('tr, a')?.id;
  })).toBe('row-plain');
  // The row actions stay above the stretched link.
  expect(await page.evaluate(() => {
    const box = document.getElementById('rows-1-more').getBoundingClientRect();
    return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest('button')?.id;
  })).toBe('rows-1-more');
  // A real click on another cell opens that row, and the hover layer is that row's.
  const hash = () => page.evaluate(() => location.hash);
  for (const n of [1, 3]) {
    const box = await page.locator(`#rows-${n} > :nth-child(3)`).boundingBox();
    await page.mouse.move(box.x + 8, box.y + box.height / 2);
    await settle(page);
    const layers = await page.evaluate(() => [...document.querySelectorAll('#rows tbody tr')].map((row) => getComputedStyle(row.cells[1]).backgroundColor));
    expect(layers.map((layer) => !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(layer)), `hover on row ${n}`).toEqual([1, 2, 3].map((m) => m === n));
    await page.mouse.click(box.x + 8, box.y + box.height / 2);
    await expect.poll(hash).toBe(`#run-${n}`);
  }
  // The ripple box is the row's, not the table's.
  const box = await page.locator('#rows-2 > :nth-child(3)').boundingBox();
  await page.mouse.move(box.x + 8, box.y + box.height / 2);
  await page.mouse.down();
  const ripple = await page.evaluate(() => {
    const [span, row] = [document.querySelector('#rows-2 .ds-press-ripple'), document.getElementById('rows-2')];
    const [a, b] = [span.getBoundingClientRect(), row.getBoundingClientRect()];
    return [a.left - b.left, a.top - b.top, a.width - b.width, a.height - b.height].map((value) => Math.round(value));
  });
  expect(ripple).toEqual([0, 0, 0, 0]);
  await page.mouse.up();
  await page.evaluate(() => history.replaceState(null, '', location.pathname));
  // A menu inside a row: in the top layer (popover and anchor positioning) the row keeps its transform;
  // placed by the script it is fixed against the viewport, so the row drops its transform while it shows
  // (it would be the menu's box, clipped by the wrapper and painted under the rows below).
  const transformOf = () => page.evaluate(() => getComputedStyle(document.getElementById('rows-2')).transform);
  expect(await transformOf()).not.toBe('none');
  await page.evaluate(() => DS.overlay.open(document.getElementById('rows-menu'), { opener: document.getElementById('rows-2-more') }));
  await settle(page);
  const placed = await page.evaluate(() => {
    const menu = document.getElementById('rows-menu');
    const [m, t, w] = [menu.getBoundingClientRect(), document.getElementById('rows-2-more').getBoundingClientRect(), document.getElementById('rows-wrap').getBoundingClientRect()];
    const x = m.left + m.width / 2;
    const y = Math.min(m.bottom - 4, Math.max(w.bottom + 4, m.top + 4));
    return { anchored: menu.hasAttribute('data-anchored'), below: m.top >= t.bottom - 1, out: m.bottom > w.bottom, hit: Boolean(document.elementFromPoint(x, y)?.closest('#rows-menu')) };
  });
  if (placed.anchored) expect(await transformOf()).not.toBe('none');
  else expect(await transformOf()).toBe('none');
  // Below its trigger, reaching past the wrapper, and on top there.
  expect(placed).toMatchObject({ below: true, out: true, hit: true });
  await page.keyboard.press('Escape');
  await settle(page);
  expect(await transformOf()).not.toBe('none');
});

test('row actions keep the row height and end at the column edge; the summary row has a hairline above', async ({ page }) => {
  await open(page);
  const rows = await page.evaluate(() => {
    const row = document.getElementById('pinned-1');
    const actions = row.querySelector('.ds-table__actions');
    const button = actions.querySelector('.ds-btn').getBoundingClientRect();
    const cell = actions.getBoundingClientRect();
    const foot = document.getElementById('foot-load');
    return {
      height: Math.round(row.getBoundingClientRect().height),
      align: getComputedStyle(actions).textAlign,
      narrow: cell.width < 80,
      end: Math.round(cell.right - button.right),
      footBorder: getComputedStyle(foot).borderTopWidth,
      footFont: getComputedStyle(foot).fontWeight,
    };
  });
  expect(rows.height).toBe(52);
  expect(rows.align).toBe('end');
  expect(rows.narrow).toBe(true);
  // The card's padding minus the hang of the round button (10px).
  expect(rows.end).toBeLessThanOrEqual(24 - 10 + 1);
  expect(rows.footBorder).toBe('1px');
  expect(Number(rows.footFont)).toBeGreaterThanOrEqual(500);
});

test('pagination sits under the table with a hairline, drops the size field in a narrow content area; the selection bar is tinted', async ({ page }) => {
  await open(page);
  await show(page, '#paged-card');
  const read = () => page.evaluate(() => {
    const nav = document.getElementById('pages');
    const wrap = document.getElementById('paged-wrap').getBoundingClientRect();
    const card = document.getElementById('paged-card').getBoundingClientRect();
    const box = nav.getBoundingClientRect();
    const bar = getComputedStyle(document.getElementById('selection-bar'));
    return {
      gap: Math.round(box.top - wrap.bottom),
      edges: [Math.round(box.left - card.left), Math.round(card.right - box.right)],
      border: getComputedStyle(nav).borderTopWidth,
      range: getComputedStyle(document.getElementById('pages-range')).fontSize,
      size: getComputedStyle(document.getElementById('pages-size')).display,
      lastEnd: Math.round(card.right - document.getElementById('page-last').getBoundingClientRect().right),
      barHeight: Math.round(document.getElementById('selection-bar').getBoundingClientRect().height),
      barBg: bar.backgroundColor,
    };
  });
  const wide = await read();
  expect(wide.gap).toBe(0);
  expect(wide.edges).toEqual([1, 1]);
  expect(wide.border).toBe('1px');
  expect(wide.range).toBe('12px');
  expect(wide.size).not.toBe('none');
  expect(wide.barHeight).toBeGreaterThanOrEqual(48);
  expect(wide.barBg).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  await page.evaluate(() => document.getElementById('pages-content').style.setProperty('width', '520px'));
  expect((await read()).size).toBe('none');
});

test('pagination baselines: the table card with its pages at 1280px and at 390px (Chromium)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'one baseline per width, in Chromium only, to keep the set lean');
  await open(page);
  await show(page, '#paged-card');
  await page.mouse.move(1, 1);
  await settle(page);
  await expect.soft(page.locator('#paged-card'), 'pagination-1280.png').toHaveScreenshot('pagination-1280.png', { animations: 'allow' });
  await page.setViewportSize({ width: 390, height: 800 });
  await page.evaluate(() => document.getElementById('pages-content').style.setProperty('width', '358px'));
  await show(page, '#paged-card');
  await settle(page);
  await expect.soft(page.locator('#paged-card'), 'pagination-390.png').toHaveScreenshot('pagination-390.png', { animations: 'allow' });
});

test('card tables: the last column still shown keeps the card gutter when trailing secondary columns drop', async ({ page }) => {
  await open(page);
  // Per table: the card's padding, and the end padding of every shown header cell in order.
  const read = () => page.evaluate(() => ['gutter', 'gutter-wide'].map((id) => {
    const table = document.getElementById(id);
    const shown = [...table.tHead.rows[0].cells].filter((cell) => getComputedStyle(cell).display !== 'none');
    return {
      pad: getComputedStyle(table.closest('.ds-card')).paddingRight,
      shown: shown.length,
      ends: shown.map((cell) => getComputedStyle(cell).paddingRight),
      body: getComputedStyle(table.tBodies[0].rows[0].cells[shown.length - 1]).paddingRight,
    };
  }));
  const content = (width) => page.evaluate((w) => document.getElementById('gutter-content').style.setProperty('width', w), width);

  // Wide window, wide content: every column shows, the last cell has the gutter, the others their own 16px.
  await content('1200px');
  for (const table of await read()) {
    expect(table.shown).toBe(4);
    expect(table.ends).toEqual(['16px', '16px', '16px', table.pad]);
  }

  // A 700px content area: the wide table drops its secondary columns, its last shown column takes the gutter.
  await content('700px');
  const [plain, wide] = await read();
  expect(plain.ends).toEqual(['16px', '16px', '16px', plain.pad]);
  expect(wide.shown).toBe(2);
  expect(wide.ends).toEqual(['16px', wide.pad]);
  expect(wide.body).toBe(wide.pad);
  expect(wide.pad).not.toBe('16px');

  // A phone: every table drops them; the gutter (16px there) instead of the phone's 12px.
  await page.setViewportSize({ width: 390, height: 800 });
  await content('');
  for (const table of await read()) {
    expect(table.shown).toBe(2);
    expect(table.ends).toEqual(['12px', table.pad]);
    expect(table.body).toBe(table.pad);
  }
});

test('print: wrappers unmasked and unclipped, the full-page table unbounded and not sticky; pagination and the selection bar hidden', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  const printed = await page.evaluate(() => {
    const fill = getComputedStyle(document.getElementById('fill'));
    const style = (sel) => getComputedStyle(document.querySelector(sel));
    return {
      fill: [fill.overflowX, fill.maxHeight, fill.maskImage || fill.webkitMaskImage],
      card: style('#pinned-wrap').overflowX,
      head: style('#fill thead th').position,
      pinned: style('#pinned-1 > :first-child').position,
      cell: style('#fill tbody tr:nth-child(2) > :nth-child(4)').whiteSpace,
      pages: style('#pages').display,
      bar: style('#selection-bar').display,
    };
  });
  expect(printed).toEqual({ fill: ['visible', 'none', 'none'], card: 'visible', head: 'static', pinned: 'static', cell: 'normal', pages: 'none', bar: 'none' });
});

test('forced colours: sticky and pinned cells are Canvas, the full-page wrapper keeps its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await open(page);
  await page.emulateMedia({ forcedColors: 'active' });
  const forced = await page.evaluate(() => {
    const style = (sel) => getComputedStyle(document.querySelector(sel));
    return { pinned: style('#pinned-1 > :first-child').backgroundImage, head: style('#fill thead th').backgroundImage, border: style('#fill').borderTopStyle, bar: style('#selection-bar').outlineStyle };
  });
  expect(forced).toEqual({ pinned: 'none', head: 'none', border: 'solid', bar: 'solid' });
});
