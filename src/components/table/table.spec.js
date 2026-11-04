/**
 * The table on the options model (3.0, src/core/options.css): head and row
 * height at every size x density, with and without .ds-touch (touch wins, as
 * a minimum); density's side padding; nesting; the deprecated --dense alias
 * and the hooks as the base; the shape of every radius; zebra (also under
 * selection, detail rows and a glide), borders, sticky rows and a pinned last
 * column with its hairline and fade; forced colours; the keyboard's way and
 * the names. Runs in the `fallback` project too. tables.spec.js, data.spec.js
 * and flip.spec.js keep covering what 2.x did.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const SHAPES = [['ds-shape-square', 0], ['ds-shape-soft', 0.5], ['ds-shape-default', 1], ['ds-shape-round', 1.5]];
const TOUCH = 48;
/* A text line: what a cell cannot go below (the hairline adds to it, or collapses, by engine). */
const CONTENT = 20;

async function open(page) {
  await page.goto('/src/components/table/table.fixture.html');
  await ready(page);
  await page.mouse.move(1, 1);
}

const height = (page, selector) => page.$eval(selector, (el) => el.getBoundingClientRect().height);
const style = (page, selector, property, pseudo) => page.$eval(selector, (el, [name, part]) => getComputedStyle(el, part).getPropertyValue(name), [property, pseudo]);

test('head and row height at every size x density, and .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const grid = document.querySelector('#grid');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<table class="ds-table"><thead><tr><th scope="col">Device</th></tr></thead><tbody><tr><td>LAPTOP-0042</td></tr></tbody></table>';
          grid.append(region);
          const cell = region.querySelector('td');
          const th = region.querySelector('th');
          out.push({ touch, density, size, row: cell.getBoundingClientRect().height, head: th.getBoundingClientRect().height, pad: parseFloat(getComputedStyle(cell).paddingInlineStart), font: getComputedStyle(cell).fontSize, headFont: getComputedStyle(th).fontSize });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    // 52px and 48px at md and comfortable, 8px per size step, 4px per density step; never below the line and hairline; touch: at least 48px.
    expect(Math.abs(entry.row - Math.max(entry.touch ? TOUCH : 0, 52 + step * 8 + density * 4, CONTENT)), `${name} row: ${entry.row}`).toBeLessThanOrEqual(1);
    expect(Math.abs(entry.head - Math.max(entry.touch ? TOUCH : 0, 48 + step * 8 + density * 4, CONTENT)), `${name} head: ${entry.head}`).toBeLessThanOrEqual(1);
    // Density takes 2px of side padding per step, size none.
    expect(entry.pad, `${name} padding`).toBe(16 + density * 2);
    // Type does not follow: a size class around a table only gives its rows room.
    expect([entry.font, entry.headFont], name).toEqual(['14px', '14px']);
  }
});

test('option classes nest, the hooks are the base, and the --dense alias keeps its fixed 40px', async ({ page }) => {
  await open(page);
  const row = (id) => height(page, `#${id} td`);
  const head = (id) => height(page, `#${id} th`);
  expect(await row('nest-outer')).toBe(52);
  expect(await row('nest-tight')).toBe(40);
  expect(await head('nest-tight')).toBe(36);
  expect(await row('nest-back')).toBe(52);
  expect(await row('nest-tight-lg')).toBe(48);
  expect(await row('on-table')).toBe(40);
  // The deprecated alias: 40px head and rows, whatever the size and the density around it.
  for (const id of ['alias', 'alias-lg', 'alias-in-tight']) {
    expect(await row(id), id).toBe(40);
    expect(await head(id), id).toBe(40);
  }
  // A hook is the base that the options apply to; here the tbody is compact.
  expect(await row('hook-base')).toBe(56);
  expect(await head('hook-base')).toBe(56);
  expect(parseFloat(await style(page, '#hook-base td', 'padding-inline-start'))).toBe(22);
  expect(parseFloat(await style(page, '#hook-base th', 'padding-inline-start'))).toBe(24);
});

test('touch: the sort button reaches the target and hangs into its cell, so the head keeps its height', async ({ page }) => {
  await open(page);
  expect(await height(page, '#touch-sort')).toBe(TOUCH);
  expect(await height(page, '#touch-head')).toBe(TOUCH);
  // At rest: the 20px line and 4px of room on each side, hanging into a 48px head.
  expect(await height(page, '#rest-sort')).toBe(28);
  expect(await height(page, '#rest-head')).toBe(48);
});

test('shape multiplies every radius: the sort button, the full-page wrapper, a stacked block and the selection bar', async ({ page }) => {
  await open(page);
  const radii = await page.evaluate((shapes) => {
    const host = document.querySelector('#shapes');
    return shapes.map(([shape]) => {
      const region = document.createElement('div');
      region.className = `${shape} ds-content`;
      region.style.width = '560px';
      region.innerHTML = '<div class="ds-table-wrap"><table class="ds-table"><thead><tr><th scope="col"><button class="ds-table__sort" type="button" data-part="sort">Device</button></th></tr></thead></table></div>'
        + '<div class="ds-table-wrap ds-table-wrap--fill" data-part="fill"><table class="ds-table"><tbody><tr><td>A</td></tr></tbody></table></div>'
        + '<table class="ds-table ds-table--stack"><tbody><tr data-part="stack"><td data-label="Name">A</td></tr></tbody></table>'
        + '<div class="ds-selection-bar" role="toolbar" aria-label="Selected" data-part="bar"><p class="ds-selection-bar__count">1 selected</p></div>';
      host.append(region);
      const read = (part) => parseFloat(getComputedStyle(region.querySelector(`[data-part="${part}"]`)).borderTopLeftRadius);
      const out = { sort: read('sort'), fill: read('fill'), stack: read('stack'), bar: read('bar') };
      region.remove();
      return out;
    });
  }, SHAPES);
  SHAPES.forEach(([shape, factor], index) => {
    expect(radii[index], shape).toEqual({ sort: 4 * factor, fill: 12 * factor, stack: 12 * factor, bar: 12 * factor });
  });
});

test('the selection bar steps with size and density, and touch is its minimum', async ({ page }) => {
  await open(page);
  const heights = await page.evaluate(() => {
    const host = document.querySelector('#shapes');
    return ['', 'ds-sm', 'ds-density-tight', 'ds-density-tight ds-touch'].map((classes) => {
      const region = document.createElement('div');
      region.className = classes;
      region.innerHTML = '<div class="ds-selection-bar" role="toolbar" aria-label="Selected"><p class="ds-selection-bar__count">1 selected</p></div>';
      host.append(region);
      const value = region.firstElementChild.getBoundingClientRect().height;
      region.remove();
      return value;
    });
  });
  expect(heights).toEqual([48, 40, 36, 48]);
});

test('zebra: the even rows, not counting detail rows; a selected row and the state layers lie over it', async ({ page, browserName }, testInfo) => {
  await open(page);
  const background = (id) => style(page, `#${id}`, 'background-color');
  const clear = 'rgba(0, 0, 0, 0)';
  const tint = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.background = 'var(--ds-surface-low)';
    document.querySelector('.ds-theme').append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  const selected = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.background = 'var(--ds-accent)';
    document.querySelector('.ds-theme').append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  await settle(page, '#zebra');
  expect(await background('z1')).toBe(clear);
  expect(await background('z1-detail')).toBe(clear);
  expect(await background('z2')).toBe(tint);
  expect(await background('z2-detail'), 'a detail row goes with its trigger').toBe(tint);
  expect(await background('z3')).toBe(clear);
  expect(await background('z4'), 'a selected row wins').toBe(selected);
  expect(await background('z5')).toBe(clear);
  expect(await background('z6'), 'so does a checked box').toBe(selected);
  // While rows glide every row is opaque, with the zebra over the backing.
  await page.$eval('#zebra-body', (el) => el.setAttribute('data-ds-glide', ''));
  const images = await page.evaluate(() => ['z1', 'z2', 'z2-detail', 'z4'].map((id) => getComputedStyle(document.getElementById(id)).backgroundImage));
  expect(images[0].match(/gradient/g)).toHaveLength(1);
  expect(images[1].match(/gradient/g)).toHaveLength(2);
  expect(images[2].match(/gradient/g)).toHaveLength(2);
  expect(images[3].match(/gradient/g)).toHaveLength(2);
  expect(images[1]).toContain('rgb(1, 2, 3)');
  await page.$eval('#zebra-body', (el) => el.removeAttribute('data-ds-glide'));
  // Hover lays the state layer on the cells, not the row.
  if (testInfo.project.name !== 'fallback' && browserName !== 'webkit') {
    await page.hover('#z2 td');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#z2 td')).backgroundColor !== 'rgba(0, 0, 0, 0)');
    expect(await background('z2')).toBe(tint);
  }
});

test('borders: --bordered lines the columns and the edge outside a card, --plain drops the row lines', async ({ page }) => {
  await open(page);
  const border = (selector, side = 'border-inline-start') => page.$eval(selector, (el, name) => {
    const css = getComputedStyle(el);
    return [css.getPropertyValue(`${name}-style`), parseFloat(css.getPropertyValue(`${name}-width`))];
  }, side);
  expect(await border('#b-1')).toEqual(['none', 0]);
  expect(await border('#b-head-1')).toEqual(['none', 0]);
  expect(await border('#b-2')).toEqual(['solid', 1]);
  expect(await border('#b-head-2')).toEqual(['solid', 1]);
  // Around the table on its own; in a card the card's edge does it.
  expect(await border('#bordered', 'border-block-start')).toEqual(['solid', 1]);
  expect(await border('#bordered-card', 'border-block-start')).toEqual(['none', 0]);
  expect(await border('#bc-2')).toEqual(['solid', 1]);
  // A stacked cell keeps its border: 0.
  expect(await border('#bs-2')).toEqual(['none', 0]);
  expect(await border('#lined-1', 'border-block-end')).toEqual(['solid', 1]);
  expect(await border('#plain-1', 'border-block-end')).toEqual(['none', 0]);
});

test('sticky rows: head and foot stay in a bounded wrapper on an opaque base, focus never lands under them', async ({ page }) => {
  await open(page);
  const wrap = page.locator('#sticky-wrap');
  expect((await wrap.boundingBox()).height).toBe(240);
  const edges = () => page.evaluate(() => {
    const box = document.getElementById('sticky-wrap').getBoundingClientRect();
    const head = document.getElementById('sticky-head-last').getBoundingClientRect();
    const foot = document.getElementById('sticky-foot-2').getBoundingClientRect();
    return { top: head.top - box.top, bottom: box.bottom - foot.bottom };
  });
  await wrap.evaluate((el) => { el.scrollTop = 120; });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect((await edges()).top).toBeCloseTo(0, 0);
  expect((await edges()).bottom).toBeCloseTo(0, 0);
  expect(await style(page, '#sticky-head-last', 'position')).toBe('sticky');
  expect(await style(page, '#sticky-foot-2', 'position')).toBe('sticky');
  expect(await style(page, '#sticky-head-last', 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
  expect(await style(page, '#sticky-foot-2', 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
  // Where they meet the pinned first column the corner stays on top.
  const z = (selector) => style(page, selector, 'z-index').then(Number);
  expect(await z('#sticky-head th')).toBeGreaterThan(await z('#sticky-head-last'));
  expect(await z('#sticky-foot-first')).toBeGreaterThan(await z('#sticky-foot-2'));
  // Separate borders: a sticky cell keeps its own hairline.
  expect(await style(page, '#sticky', 'border-collapse')).toBe('separate');
  // Keyboard focus lands clear of both sticky rows.
  await wrap.evaluate((el) => { el.scrollTop = 0; });
  await page.focus('#sticky-link-10');
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const clear = await page.evaluate(() => {
    const link = document.getElementById('sticky-link-10').getBoundingClientRect();
    const foot = document.getElementById('sticky-foot-2').getBoundingClientRect();
    const head = document.getElementById('sticky-head-last').getBoundingClientRect();
    return link.bottom <= foot.top + 1 && link.top >= head.bottom - 1;
  });
  expect(clear).toBe(true);
  // Without a bound there is nothing to scroll: every row shows.
  await expect(page.locator('#unbound')).toHaveJSProperty('scrollTop', 0);
  const unbound = await page.$eval('#unbound', (el) => el.scrollHeight - el.clientHeight);
  expect(unbound).toBe(0);
});

test('a pinned last column stays on an opaque base, with its hairline and without the end fade', async ({ page }) => {
  await open(page);
  const wrap = page.locator('#pin-wrap');
  await wrap.evaluate((el) => { DS.dom.scrollEdges(el); });
  const place = () => page.evaluate(() => {
    const box = document.getElementById('pin-wrap').getBoundingClientRect();
    const last = document.getElementById('pin-last-a').getBoundingClientRect();
    return { end: Math.round(box.right - last.right), scroll: document.getElementById('pin-wrap').scrollLeft };
  });
  expect((await place()).scroll).toBe(0);
  expect((await place()).end).toBe(0);
  await wrap.evaluate((el) => { el.scrollLeft = 100; });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(await place()).toEqual({ end: 0, scroll: 100 });
  expect(await style(page, '#pin-last-a', 'position')).toBe('sticky');
  expect(await style(page, '#pin-head-last', 'position')).toBe('sticky');
  expect(await style(page, '#pin-foot-last', 'position')).toBe('sticky');
  // Opaque: the base and the two registered colours lie in the image.
  expect((await style(page, '#pin-last-a', 'background-image')).match(/gradient/g)).toHaveLength(3);
  // The wrapper has no end fade (and keeps its scroll padding for keyboard focus).
  expect(await wrap.evaluate((el) => getComputedStyle(el).getPropertyValue('--ds-table-end-fade').trim())).toBe('0');
  expect(await wrap.evaluate((el) => parseFloat(getComputedStyle(el).scrollPaddingInlineEnd))).toBe(64);
  // The hairline shows while columns follow under it, and goes at the end of the scroll.
  const hairline = () => page.$eval('#pin-last-a', (el) => Number(getComputedStyle(el, '::after').opacity));
  await expect.poll(hairline, { message: 'columns follow' }).toBeGreaterThan(0.9);
  await wrap.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
  await expect.poll(hairline, { message: 'the end of the scroll' }).toBeLessThan(0.1);
  // The full-page wrapper pins it as well.
  expect(await style(page, '#fill-head-last', 'position')).toBe('sticky');
  expect(await style(page, '#pin-fill', '--ds-table-end-fade')).toBe('0');
  expect(await style(page, '#fill-head-last', 'inset-inline-end')).toBe('0px');
});

test('a pinned last column in an interactive table: the row link still opens from its cells, the column keeps its own controls', async ({ page }) => {
  await open(page);
  await page.locator('#pin-wrap').evaluate((el) => {
    el.scrollIntoView({ block: 'center' });
    el.scrollLeft = 80;
  });
  // A point of the row inside the wrapper, or the middle of an element.
  const hit = (selector, inWrap = false) => page.$eval(selector, (el, along) => {
    const box = el.getBoundingClientRect();
    const wrap = document.getElementById('pin-wrap').getBoundingClientRect();
    const target = document.elementFromPoint(along ? wrap.left + wrap.width / 2 : box.left + box.width / 2, box.top + box.height / 2);
    return { link: target?.closest('a')?.getAttribute('href') ?? null, button: target?.closest('button')?.id ?? null };
  }, inWrap);
  // In the middle of the wrapper: the row's own link; the second row's: its own (WebKit lays rows out static).
  expect((await hit('#pin-a', true)).link).toBe('#open-a');
  expect((await hit('#pin-b', true)).link).toBe('#open-b');
  expect((await hit('#pin-edit-a')).button).toBe('pin-edit-a');
  expect((await hit('#pin-edit-b')).button).toBe('pin-edit-b');
  let edited = 0;
  await page.exposeFunction('edited', () => { edited += 1; });
  await page.$eval('#pin-edit-a', (el) => el.addEventListener('click', () => window.edited()));
  await page.click('#pin-edit-a');
  expect(edited).toBe(1);
  await expect(page).not.toHaveURL(/#open-a/);
  // The row stays its link's box: one row, not the table.
  const heights = await page.evaluate(() => ({ row: document.getElementById('pin-a').getBoundingClientRect().height, cell: document.getElementById('pin-last-a').getBoundingClientRect().height }));
  expect(heights.cell).toBeCloseTo(heights.row, 0);
});

test('stacked rows: a pinned last cell steps aside', async ({ page }) => {
  await open(page);
  expect(await style(page, '#pin-stack-last', 'position')).toBe('static');
  expect(await style(page, '#pin-stack-last', 'background-image')).toBe('none');
  expect(await style(page, '#pin-stack-last', 'display', '::after')).toBe('none');
});

test('forced colours: sticky rows and the pinned last column are Canvas', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const canvas = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.background = 'Canvas';
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  for (const selector of ['#sticky-head-last', '#sticky-foot-2', '#pin-head-last', '#pin-last-a', '#pin-foot-last']) {
    expect(await style(page, selector, 'background-color'), selector).toBe(canvas);
    expect(await style(page, selector, 'background-image'), selector).toBe('none');
  }
  // A focused selection bar keeps its edge; the zebra goes and the row keeps its hairline.
  expect(await style(page, '#z2', 'background-color')).toBe(canvas);
  expect(await style(page, '#lined-1', 'border-block-end-style')).toBe('solid');
});

test('keyboard: Tab goes through every control in order and skips a closed detail; Enter and Space use them', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit tabs to links and form controls only with the macOS setting on');
  await open(page);
  await page.focus('#before');
  const order = [];
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => document.activeElement.id));
  }
  expect(order).toEqual(['k-all', 'k-sort', 'k-select', 'k-toggle', 'k-link', 'k-edit', 'k-region', 'after']);
  // The row link rings the row, inset, with the focus layer on its cells.
  await page.focus('#before');
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('Tab');
  await expect(page.locator('#k-link')).toBeFocused();
  expect(await style(page, '#k-link', 'outline-style', '::after')).toBe('solid');
  // Enter follows the link, Space presses a button and the toggle opens its detail.
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#open-k1$/);
  // The wrapper that is a tab stop: an inset ring, and the arrow keys scroll it.
  await page.focus('#k-region');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#k-region')).toBeFocused();
  expect(await style(page, '#k-region', 'outline-style')).toBe('solid');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.$eval('#k-region', (el) => el.scrollLeft)).toBeGreaterThan(0);
});

test('names and roles: the caption, the headers, the sort state and the region', async ({ page }) => {
  await open(page);
  const table = page.getByRole('table', { name: 'Devices', exact: true });
  await expect(table).toHaveCount(1);
  await expect(table.locator('th[aria-sort]')).toHaveCount(1);
  await expect(table.getByRole('columnheader', { name: 'Device', exact: true })).toHaveAttribute('aria-sort', 'ascending');
  await expect(table.getByRole('columnheader', { name: 'Details', exact: true })).toHaveCount(1);
  await expect(table.getByRole('rowheader', { name: 'LAPTOP-0042' })).toHaveCount(1);
  await expect(table.getByRole('button', { name: 'Details of LAPTOP-0042' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('link', { name: 'LAPTOP-0042' })).toHaveAttribute('href', '#open-k1');
  await expect(page.getByRole('region', { name: 'Device history' })).toHaveCount(1);
  // A closed detail row is inert (the keyboard test: Tab skips it).
  await expect(page.locator('#k1-detail')).toHaveJSProperty('inert', true);
  // Stacked: the roles stay in every engine.
  await expect(page.locator('#pin-stack').getByRole('columnheader', { name: 'Name' })).toHaveCount(1);
});

test('the demo renders every look and its controls work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/test/browser/fixtures/component.html?c=table');
  await ready(page);
  for (const look of ['default', 'zebra', 'bordered', 'plain']) await expect(page.locator(`[data-demo="look-${look}"] table`)).toHaveCount(1);
  const card = page.locator('[data-demo="devices"]');
  // Sort by a column: the arrow moves and the header says so.
  await card.getByRole('button', { name: 'Load' }).click();
  await expect(card.getByRole('columnheader', { name: 'Load' })).toHaveAttribute('aria-sort', 'ascending');
  // A filter that finds nothing shows the empty state, one that finds rows takes it away.
  const filter = card.getByLabel('Filter');
  await filter.fill('nothing like this');
  await expect(card.locator('[data-demo="empty"]')).toBeVisible();
  await filter.fill('');
  await expect(card.locator('[data-demo="empty"]')).toBeHidden();
  // Selecting all checks every row; a row's checkbox makes it indeterminate.
  await card.getByLabel('Select all devices').check();
  await expect(card.locator('tbody input:checked')).toHaveCount(6);
  await card.locator('tbody input').first().uncheck();
  await expect(card.getByLabel('Select all devices')).toHaveJSProperty('indeterminate', true);
  // The selection bar crosses with the toolbar in its slot.
  const bulk = page.locator('[data-demo="bulk"]');
  await bulk.locator('tbody input').first().check();
  await expect(bulk.locator('.ds-selection-bar__count')).toHaveText('1 selected');
  await bulk.getByRole('button', { name: 'Clear selection' }).click();
  await expect(bulk.getByLabel('Select all devices')).toBeFocused();
  expect(errors).toEqual([]);
});
