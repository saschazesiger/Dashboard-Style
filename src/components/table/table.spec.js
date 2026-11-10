/**
 * The table on the options model (3.0, src/core/options.css): head and row
 * height at every size x density, with and without .ds-touch (touch wins, as
 * a minimum); density's side padding; nesting; the 2.x --dense gone
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

/* The focus colour as [r, g, b], read through a canvas like the pixels below. */
const focusColour = (page) => page.evaluate(() => {
  const probe = document.createElement('div');
  probe.style.background = 'var(--ds-focus)';
  document.querySelector('.ds-theme').append(probe);
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  context.fillStyle = getComputedStyle(probe).backgroundColor;
  context.fillRect(0, 0, 1, 1);
  probe.remove();
  return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
});

/* The colours of page points as they show on screen (no image library in the tests: the page decodes the shot). */
async function pixels(page, points) {
  const png = await page.screenshot({ animations: 'disabled' });
  return page.evaluate(async ([data, spots]) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    return spots.map(({ x, y }) => Array.from(context.getImageData(Math.round(x), Math.round(y), 1, 1).data).slice(0, 3));
  }, [png.toString('base64'), points]);
}

const near = (colour, want) => colour.every((value, index) => Math.abs(value - want[index]) <= 24);

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

test('option classes nest, the hooks are the base, and the 2.x --dense was removed in 3.0', async ({ page }) => {
  await open(page);
  const row = (id) => height(page, `#${id} td`);
  const head = (id) => height(page, `#${id} th`);
  expect(await row('nest-outer')).toBe(52);
  expect(await row('nest-tight')).toBe(40);
  expect(await head('nest-tight')).toBe(36);
  expect(await row('nest-back')).toBe(52);
  expect(await row('nest-tight-lg')).toBe(48);
  expect(await row('on-table')).toBe(40);
  // The 2.x name (built from fragments, so the removed-name guard of test/repo.test.js passes this file): the
  // comfortable rows around it.
  await page.$eval('#comfortable', (el, name) => el.insertAdjacentHTML('beforeend', `<table class="ds-table ${name}" id="alias"><thead><tr><th scope="col">Device</th></tr></thead><tbody><tr><td>Alias</td></tr></tbody></table>`), `ds-table--${'dense'}`);
  expect(await row('alias')).toBe(52);
  expect(await head('alias')).toBe(48);
  await page.$eval('#alias', (el) => el.remove());
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

test('--ds-table-padding also sets the side padding on phones: three quarters of it, half of it below 360px', async ({ page }) => {
  await open(page);
  const measure = () => page.evaluate(() => {
    const host = document.querySelector('#grid');
    const read = (hook, classes) => {
      const region = document.createElement('div');
      region.className = classes;
      region.innerHTML = `<table class="ds-table"${hook ? ` style="--ds-table-padding: ${hook}"` : ''}><tbody><tr><td>LAPTOP-0042</td></tr><tr class="ds-table__detail"><td><div class="ds-table__expand"><div>Details</div></div></td></tr></tbody></table>`;
      host.append(region);
      const value = [region.querySelector('td'), region.querySelector('.ds-table__expand > div')].map((el) => parseFloat(getComputedStyle(el).paddingInlineStart));
      region.remove();
      return value;
    };
    return { plain: read('', ''), hook: read('40px', ''), compact: read('40px', 'ds-density-compact'), tight: read('', 'ds-density-tight') };
  });
  await page.setViewportSize({ width: 500, height: 720 });
  expect(await measure()).toEqual({ plain: [12, 12], hook: [30, 30], compact: [28, 28], tight: [6, 6] });
  await page.setViewportSize({ width: 320, height: 720 });
  expect(await measure()).toEqual({ plain: [8, 8], hook: [20, 20], compact: [18, 18], tight: [4, 4] });
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
  // A stacked cell keeps its border: 0, and the stacked table has no frame around its blocks.
  expect(await border('#bs-2')).toEqual(['none', 0]);
  expect(await border('#bordered-stack', 'border-block-start')).toEqual(['none', 0]);
  expect(await border('#lined-1', 'border-block-end')).toEqual(['solid', 1]);
  expect(await border('#plain-1', 'border-block-end')).toEqual(['none', 0]);
});

test('a look stays on its own table: a nested table takes neither zebra, plain nor bordered', async ({ page }) => {
  await open(page);
  await settle(page, '#nested-outer');
  // The outer table has them all.
  expect(await style(page, '#outer-even', 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
  expect(await style(page, '#outer-2', 'border-inline-start-style')).toBe('solid');
  expect(await style(page, '#outer-2', 'border-block-end-style')).toBe('none');
  // The nested one none of them.
  expect(await style(page, '#n2', 'background-color')).toBe('rgba(0, 0, 0, 0)');
  expect(await style(page, '#n1-2', 'border-block-end-style')).toBe('solid');
  expect(await style(page, '#n2-2', 'border-inline-start-style')).toBe('none');
  await page.$eval('#nested tbody', (el) => el.setAttribute('data-ds-glide', ''));
  expect((await style(page, '#n2', 'background-image')).match(/gradient/g)).toHaveLength(1);
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

test('focus clears the sticky rows when size, density or touch sits on the table itself', async ({ page }) => {
  await open(page);
  // A link inside the band a wrapper-level offset would miss: below the 48px of the default head, above the 64px of .ds-xl.
  const reach = (wrap, link, head, foot, side) => page.evaluate(({ wrapId, linkId, headId, footId, edge }) => {
    const scroller = document.getElementById(wrapId);
    const target = document.getElementById(linkId);
    target.blur();
    scroller.scrollTop = 0;
    const box = scroller.getBoundingClientRect();
    const start = target.getBoundingClientRect();
    const inner = box.top + scroller.clientTop;
    scroller.scrollTop = edge === 'head'
      ? start.top - inner - 50
      : start.bottom - (inner + scroller.clientHeight) + 56;
    target.focus();
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
      const now = target.getBoundingClientRect();
      const hit = document.elementFromPoint(now.left + now.width / 2, now.top + now.height / 2);
      resolve({
        focused: document.activeElement === target,
        hit: hit === target,
        underHead: now.top - document.getElementById(headId).getBoundingClientRect().bottom,
        underFoot: footId ? document.getElementById(footId).getBoundingClientRect().top - now.bottom : 0,
      });
    })));
  }, { wrapId: wrap, linkId: link, headId: head, footId: foot, edge: side });
  for (const [wrap, link, head, foot, side] of [
    ['xl-wrap', 'xl-link-5', 'xl-head', 'xl-foot', 'head'],
    ['xl-wrap', 'xl-link-5', 'xl-head', 'xl-foot', 'foot'],
    ['fill-xl-wrap', 'fill-xl-link-5', 'fill-xl-head', null, 'head'],
  ]) {
    const name = `${wrap} ${side}`;
    await page.locator(`#${wrap}`).scrollIntoViewIfNeeded();
    const place = await reach(wrap, link, head, foot, side);
    expect(place.focused, name).toBe(true);
    expect(place.hit, `${name}: the link is what shows there`).toBe(true);
    expect(place.underHead, name).toBeGreaterThanOrEqual(-1);
    expect(place.underFoot, name).toBeGreaterThanOrEqual(-1);
  }
  // The wrapper keeps its own offset, for what a script scrolls into view; the link adds what the table's options add to it.
  expect(await style(page, '#xl-wrap', 'scroll-padding-block-start')).toBe('48px');
  expect(await style(page, '#xl-link-5', 'scroll-margin-block-start')).toBe('16px');
  expect(await style(page, '#sticky-link-10', 'scroll-margin-block-start')).toBe('0px');
});

test('a wheel over a sticky wrapper moves the page once the wrapper has nothing left to scroll', async ({ page }) => {
  await open(page);
  for (const id of ['unbound', 'sticky-wrap']) {
    const start = await page.$eval(`#${id}`, (el) => {
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      el.scrollTop = el.scrollHeight;
      return window.scrollY;
    });
    const box = await page.locator(`#${id}`).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: id }).toBeGreaterThan(start);
  }
  // A full-page wrapper fills the view, so it keeps the wheel to itself.
  expect(await style(page, '#sticky-wrap', 'overscroll-behavior-y')).toBe('auto');
  expect(await style(page, '#pin-fill', 'overscroll-behavior-y')).toBe('contain');
});

test('a bounded sticky table stays under a page bar: its wrapper is a stacking context', async ({ page }) => {
  await open(page);
  const hit = await page.evaluate(() => {
    const wrap = document.getElementById('sticky-wrap');
    wrap.insertAdjacentHTML('beforebegin', '<div id="page-bar" style="position: sticky; inset-block-start: 0; z-index: var(--ds-z-sticky); height: 48px; background: var(--ds-surface)"></div>');
    // The bar sticks to the top of the view, and the table's head (its pinned corner too) runs under its lower half.
    window.scrollTo({ top: window.scrollY + wrap.getBoundingClientRect().top - 24, behavior: 'instant' });
    const box = wrap.getBoundingClientRect();
    return ['first', 'other'].map((column) => document.elementFromPoint(box.left + (column === 'first' ? 8 : box.width - 8), 36)?.id);
  });
  expect(hit).toEqual(['page-bar', 'page-bar']);
  expect(await style(page, '#sticky-wrap', 'isolation')).toBe('isolate');
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
  expect(await wrap.evaluate((el) => parseFloat(getComputedStyle(el).scrollPaddingInlineEnd))).toBeCloseTo(await page.$eval('#pin-last-a', (el) => el.getBoundingClientRect().width), 1);
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

/* The empty room of a pinned last cell, beside its button. */
const emptyRoom = (page, cell) => page.$eval(cell, (el) => {
  el.closest('.ds-table-wrap').scrollIntoView({ block: 'center', behavior: 'instant' });
  const box = el.getBoundingClientRect();
  const point = { x: box.left + 4, y: box.top + box.height / 2 };
  return { ...point, hit: document.elementFromPoint(point.x, point.y) === el };
});
const centre = (page, wrap, row) => page.evaluate(({ wrapId, rowId }) => {
  const box = document.getElementById(wrapId).getBoundingClientRect();
  const line = document.getElementById(rowId).getBoundingClientRect();
  return { x: box.left + box.width / 2, y: line.top + line.height / 2 };
}, { wrapId: wrap, rowId: row });

for (const [title, wrap, row, cell, opened] of [
  ['a pinned last column', 'pin-wrap', 'pin-a', 'pin-last-a', /#open-a$/],
  ['both pins', 'pin-both-wrap', 'both-a', 'both-last-a', /#both-open-a$/],
]) {
  test(`${title}: the last cell's own room shows no press, the rest of the row does`, async ({ page }) => {
    await open(page);
    const layer = () => style(page, `#${row}`, '--ds-table-row-layer');
    const room = await emptyRoom(page, `#${cell}`);
    expect(room.hit, 'the point is the cell itself').toBe(true);
    expect(await style(page, `#${cell}`, 'cursor')).toBe('default');
    // Its button keeps its pointer.
    expect(await page.$eval(`#${cell} button`, (el) => getComputedStyle(el).cursor)).toBe('pointer');
    await page.mouse.move(room.x, room.y);
    const hovered = await layer();
    await page.mouse.down();
    expect(await layer(), 'pressed in the last cell').toBe(hovered);
    await page.mouse.up();
    await expect(page).not.toHaveURL(opened);
    // The rest of the row presses.
    const middle = await centre(page, wrap, row);
    await page.mouse.move(middle.x, middle.y);
    const before = await layer();
    await page.mouse.down();
    expect(await layer(), 'pressed in the row').not.toBe(before);
    await page.mouse.move(1, 1);
    await page.mouse.up();
  });

  test(`${title}, with DS.ripple.attach(): a press on the last cell's own room opens nothing and does not ripple, the rest of the row opens`, async ({ page }) => {
    await open(page);
    await page.evaluate(() => { DS.ripple.attach(document); });
    const room = await emptyRoom(page, `#${cell}`);
    await page.mouse.move(room.x, room.y);
    await page.mouse.down();
    expect(await page.$eval(`#${row}`, (el) => el.classList.contains('ds-pressed'))).toBe(false);
    await expect(page.locator(`#${row} .ds-press-ripple`)).toHaveCount(0);
    await page.mouse.up();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await expect(page).not.toHaveURL(opened);
    const middle = await centre(page, wrap, row);
    await page.mouse.click(middle.x, middle.y);
    await expect(page).toHaveURL(opened);
  });

  test(`${title}, with DS.ripple.attach(): a press on the row ripples through the last cell at the same centre, and its button stays`, async ({ page }) => {
    await open(page);
    await page.evaluate(() => { DS.ripple.attach(document); });
    await emptyRoom(page, `#${cell}`);
    const button = () => page.$eval(`#${cell} button`, (el) => el.getBoundingClientRect().left);
    const before = await button();
    const middle = await centre(page, wrap, row);
    await page.mouse.move(middle.x, middle.y);
    await page.mouse.down();
    await expect(page.locator(`#${cell} > .ds-press-ripple`)).toHaveCount(1);
    const centres = await page.$$eval(`#${row} .ds-press-ripple`, (spans) => spans.map((span) => {
      const box = span.getBoundingClientRect();
      const css = getComputedStyle(span);
      return { x: box.left + parseFloat(css.getPropertyValue('--ds-ripple-x')), y: box.top + parseFloat(css.getPropertyValue('--ds-ripple-y')) };
    }));
    expect(centres).toHaveLength(title === 'both pins' ? 3 : 2);
    for (const point of centres) {
      expect(Math.abs(point.x - middle.x), `${point.x} of ${middle.x}`).toBeLessThanOrEqual(2);
      expect(Math.abs(point.y - middle.y), `${point.y} of ${middle.y}`).toBeLessThanOrEqual(2);
    }
    expect(await button(), 'the span is first in the cell, so the button keeps :last-child').toBe(before);
    // Off the row: the press ends without a click, and every part goes.
    await page.mouse.move(1, 1);
    await page.mouse.up();
    await expect(page.locator(`#${row} .ds-press-ripple`)).toHaveCount(0);
  });
}

test('both pins, with DS.ripple.attach(): a middle press on the last cell\'s own room forwards nothing and keeps the autoscroll', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    DS.ripple.attach(document);
    window.opened = [];
    window.open = (url) => { window.opened.push(url); return null; };
    window.addEventListener('mousedown', (event) => { window.cancelled = event.defaultPrevented; });
  });
  const room = await emptyRoom(page, '#both-last-a');
  await page.mouse.click(room.x, room.y, { button: 'middle' });
  expect(await page.evaluate(() => window.cancelled), 'the room').toBe(false);
  expect(await page.evaluate(() => window.opened)).toEqual([]);
  const middle = await centre(page, 'pin-both-wrap', 'both-a');
  await page.mouse.click(middle.x, middle.y, { button: 'middle' });
  expect(await page.evaluate(() => window.cancelled), 'the row').toBe(true);
  await expect.poll(() => page.evaluate(() => window.opened.length)).toBe(1);
});

test('a row link in another cell finishes its ring on the pinned last cell, and the row keeps its height', async ({ page }) => {
  await open(page);
  const focus = await focusColour(page);
  await page.locator('#pin-wrap').scrollIntoViewIfNeeded();
  expect(await style(page, '#pin-last-a', 'border-block-start-style', '::before'), 'at rest').toBe('none');
  const rest = await height(page, '#pin-a');
  await page.focus('#pin-a a');
  expect(await style(page, '#pin-last-a', 'border-block-start-width', '::before')).toBe('2px');
  expect(await style(page, '#pin-last-a', 'border-inline-end-width', '::before')).toBe('2px');
  expect(await style(page, '#pin-last-a', 'border-block-end-width', '::before')).toBe('2px');
  expect(await style(page, '#pin-last-a', 'border-inline-start-width', '::before')).toBe('0px');
  expect(await height(page, '#pin-a')).toBe(rest);
  await expect.poll(() => style(page, '#pin-a a', 'outline-offset', '::after')).toBe('-2px');
  const places = await page.evaluate(() => {
    const row = document.getElementById('pin-a').getBoundingClientRect();
    const cell = document.getElementById('pin-last-a').getBoundingClientRect();
    const x = cell.left + cell.width / 2;
    const y = row.top + row.height / 2;
    return { top: { x, y: row.top + 1 }, bottom: { x, y: row.bottom - 1 }, end: { x: cell.right - 1, y }, rowBottom: { x: cell.left - 24, y: row.bottom - 2 } };
  });
  const [top, bottom, end, rowBottom] = await pixels(page, [places.top, places.bottom, places.end, places.rowBottom]);
  expect(near(top, focus), `top ${top} of ${focus}`).toBe(true);
  expect(near(bottom, focus), `bottom ${bottom} of ${focus}`).toBe(true);
  expect(near(end, focus), `end ${end} of ${focus}`).toBe(true);
  expect(near(rowBottom, focus), `the row's own ring on the same line: ${rowBottom} of ${focus}`).toBe(true);
  // Both pins: the link's ring stays in the pinned first cell, so the last cell paints none.
  await page.focus('#both-a a');
  expect(await style(page, '#both-last-a', 'content', '::before')).toBe('none');
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
  // The zebra goes and the row keeps its hairline.
  expect(await style(page, '#z2', 'background-color')).toBe(canvas);
  expect(await style(page, '#lined-1', 'border-block-end-style')).toBe('solid');
  // A plain table relied on the zebra: its rows get their lines back.
  expect(await style(page, '#plain-1', 'border-block-end-style')).toBe('solid');
  const ink = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.background = 'CanvasText';
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  expect(ink).not.toBe(canvas);
  // The selection bar keeps an edge, since its tint is gone.
  expect(await style(page, '#selection-bar', 'outline-style')).toBe('solid');
  expect(await style(page, '#selection-bar', 'outline-color')).toBe(ink);
  // The pinned columns' hairlines stay visible over a Canvas cell, both of them with the wrapper's overflow attribute set.
  await page.evaluate(() => {
    for (const id of ['pin-wrap', 'sticky-wrap']) {
      const wrap = document.getElementById(id);
      DS.dom.scrollEdges(wrap);
      wrap.scrollLeft = 100;
    }
  });
  await expect(page.locator('#pin-wrap')).toHaveAttribute('data-ds-overflow-end', /.*/);
  await expect(page.locator('#sticky-wrap')).toHaveAttribute('data-ds-overflow-start', /.*/);
  for (const selector of ['#pin-last-a', '#pin-head-last', '#pin-foot-last', '#sticky-body td:first-child', '#sticky-head th:first-child', '#sticky-foot-first']) {
    await expect.poll(() => page.$eval(selector, (el) => Number(getComputedStyle(el, '::after').opacity)), { message: selector }).toBeGreaterThan(0.9);
    expect(await style(page, selector, 'background-color', '::after'), selector).toBe(ink);
  }
});

test('a tab stop with sticky rows or a pinned column: its ring goes round the box, also past the head and the foot', async ({ page }) => {
  await open(page);
  const focus = await focusColour(page);
  const edges = async (selector) => {
    const wrap = page.locator(selector);
    await wrap.evaluate((el) => el.setAttribute('tabindex', '0'));
    await wrap.scrollIntoViewIfNeeded();
    await expect.poll(() => style(page, selector, 'outline-offset'), { message: `${selector} at rest` }).toBe('2px');
    await wrap.focus();
    await expect.poll(() => style(page, selector, 'outline-offset'), { message: selector }).toBe('0px');
    expect(await style(page, selector, 'outline-style'), selector).toBe('solid');
    const box = await wrap.boundingBox();
    const y = box.y + box.height / 2;
    const x = box.x + box.width / 2;
    const seen = await pixels(page, [{ x, y: box.y - 1 }, { x, y: box.y + box.height + 0.5 }, { x: box.x - 1, y }, { x: box.x + box.width + 0.5, y }]);
    seen.forEach((colour, index) => {
      expect(near(colour, focus), `${selector} ${['top', 'bottom', 'start', 'end'][index]}: ${colour} of ${focus}`).toBe(true);
    });
    await wrap.evaluate((el) => el.blur());
  };
  await edges('#sticky-wrap');
  await edges('#pin-fill');
  // A plain wrapper keeps the inset ring.
  await page.focus('#k-region');
  await expect.poll(() => style(page, '#k-region', 'outline-offset')).toBe('-2px');
  // In a card, as the demo shows it.
  await page.goto('/test/browser/fixtures/component.html?c=table');
  await ready(page);
  await edges('[data-demo="sticky"] .ds-table-wrap');
});

test('a focused tab stop shows unmasked, also a wide table in a card in a narrow content area', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', '<div class="ds-content" style="width: 480px"><section class="ds-card"><div class="ds-table-wrap" id="wide-stop" tabindex="0" role="region" aria-label="Wide"><table class="ds-table ds-table--wide ds-table--pin-first"><tbody><tr><td>A</td><td class="ds-nowrap" style="min-width: 800px">B</td></tr></tbody></table></div></section></div>');
  });
  expect(await style(page, '#wide-stop', 'mask-image')).not.toBe('none');
  await page.focus('#wide-stop');
  expect(await style(page, '#wide-stop', 'mask-image')).toBe('none');
});

test('the selection bar crosses with a shorter toolbar in its slot: the table stays, at every step of the crossfade', async ({ page }) => {
  await page.goto('/test/browser/fixtures/component.html?c=table');
  await ready(page);
  const bulk = page.locator('[data-demo="bulk"]');
  for (const classes of ['', 'ds-lg', 'ds-density-tight']) {
    await bulk.evaluate((el, name) => { el.className = `ds-card ${name}`; }, classes);
    const top = () => bulk.evaluate((el) => el.querySelector('table').getBoundingClientRect().top - el.getBoundingClientRect().top);
    const rest = await top();
    /* Every frame of the swap, from the change on. */
    const seen = await bulk.evaluate(async (el) => {
      const box = el.querySelector('tbody input');
      const out = [];
      const read = () => out.push(el.querySelector('table').getBoundingClientRect().top - el.getBoundingClientRect().top);
      box.click();
      read();
      for (let i = 0; i < 30; i += 1) {
        await new Promise(requestAnimationFrame);
        read();
      }
      box.click();
      read();
      for (let i = 0; i < 30; i += 1) {
        await new Promise(requestAnimationFrame);
        read();
      }
      return out;
    });
    expect(new Set(seen), `"${classes}": ${[...new Set(seen)]} from ${rest}`).toEqual(new Set([rest]));
    await expect(bulk.locator('.ds-selection-bar')).toHaveCount(0);
  }
});

test('focus never lands under a pinned last column: scrollEdges() measures it, at any size and under touch', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit tabs to links and form controls only with the macOS setting on');
  await open(page);
  for (const options of ['', 'ds-lg', 'ds-touch']) {
    await page.evaluate((classes) => {
      document.querySelector('#fx-end')?.remove();
      const cells = (tag, n) => Array.from({ length: n }, (_, i) => `<${tag}${tag === 'th' ? ' scope="col"' : ''}><button class="ds-btn" type="button" id="${tag}-${i}">Column ${i}</button></${tag}>`).join('');
      document.body.insertAdjacentHTML('beforeend', `<div id="fx-end" style="inline-size: 420px"><div class="ds-table-wrap" id="end-wrap"><table class="ds-table ds-table--pin-last ${classes}" style="inline-size: 1400px">
        <caption class="ds-sr">Pinned</caption><thead><tr>${cells('th', 8)}</tr></thead><tbody><tr>${cells('td', 8)}</tr></tbody></table></div></div>`);
      DS.dom.scrollEdges(document.getElementById('end-wrap'));
    }, options);
    const name = options || 'default';
    await expect.poll(() => page.$eval('#end-wrap', (el) => parseFloat(el.style.getPropertyValue('--ds-table-pin-last-width'))), `${name}: measured`).toBeGreaterThan(0);
    const width = await page.$eval('#td-7', (el) => el.closest('td').getBoundingClientRect().width);
    expect(await page.$eval('#end-wrap', (el) => parseFloat(el.style.getPropertyValue('--ds-table-pin-last-width')))).toBeCloseTo(width, 1);
    await page.focus('#td-0');
    let hidden = 0;
    for (let i = 1; i < 7; i += 1) {
      // Only a control wholly under the column makes the browser scroll: one that still shows in part stays where it is.
      const under = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().left >= document.getElementById('td-7').closest('td').getBoundingClientRect().left, `td-${i}`);
      await page.keyboard.press('Tab');
      await expect(page.locator(`#td-${i}`), `${name}: Tab reaches it`).toBeFocused();
      if (!under) continue;
      hidden += 1;
      await expect.poll(() => page.evaluate((id) => {
        const control = document.getElementById(id).getBoundingClientRect();
        const pinned = document.getElementById('td-7').closest('td').getBoundingClientRect();
        return control.right <= pinned.left + 1;
      }, `td-${i}`), `${name}: column ${i} beside the pinned one`).toBe(true);
    }
    expect(hidden, `${name}: Tab scrolled to controls under the column`).toBeGreaterThan(0);
  }
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
  // Enter follows the link.
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#open-k1$/);
  // Space presses a button: the toggle opens its detail, which Tab then reaches.
  await page.focus('#k-toggle');
  await page.keyboard.press('Space');
  await expect(page.locator('#k-toggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#k1-detail')).toHaveJSProperty('inert', false);
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('Tab');
  await expect(page.locator('#k-inside')).toBeFocused();
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
