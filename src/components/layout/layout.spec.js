/**
 * The layout primitives on their demo and on probes of a fixed width: the
 * cluster wraps, pushes and spreads, its nowrap form lets a truncated title
 * shrink; the split sits side by side and stacks once main gets narrow;
 * the switcher is one row or one column, never two above one; the measure
 * centres at the reading measure; the cover centres its main part; the
 * frame keeps its ratio and crops media, its radius times the shape; the
 * grid fits columns at --ds-grid-min and never more than --max-n; density
 * tightens the default gaps, a .ds-gap-* class sets an exact one; reading
 * and Tab order follow the markup; forced colours. Runs in the `fallback`
 * project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=layout');
  await ready(page);
}

/** A probe region of its own at the top of the fixture (replaced by the next one). */
const add = (page, html) => page.evaluate((markup) => {
  document.getElementById('probe')?.remove();
  const region = document.createElement('div');
  region.id = 'probe';
  region.insertAdjacentHTML('beforeend', markup);
  document.getElementById('fx-component').prepend(region);
}, html);

const rect = (page, selector) => page.$eval(selector, (el) => {
  const box = el.getBoundingClientRect();
  return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
});

const BOX = 'style="block-size: 40px"';

test('cluster: a row that wraps; .ds-push takes the free space; --between, --end and --center place the items', async ({ page }) => {
  await open(page);
  await add(page, `<div style="inline-size: 600px">
    <div class="ds-cluster" id="row"><span id="a" ${BOX}>Alpha</span><span id="b" ${BOX}>Beta</span><span class="ds-push" id="c" ${BOX}>Gamma</span></div>
    <div class="ds-cluster ds-cluster--between" id="between"><span id="d">Delta</span><span id="e">Epsilon</span></div>
    <div class="ds-cluster ds-cluster--end" id="end"><span id="f">Zeta</span></div>
    <div class="ds-cluster ds-cluster--center" id="center"><span id="g">Eta</span></div>
    <div class="ds-cluster" id="wrap" style="inline-size: 200px">${'<span style="inline-size: 80px; block-size: 20px"></span>'.repeat(4)}</div>
  </div>`);
  const row = await rect(page, '#row');
  expect((await rect(page, '#b')).x - ((await rect(page, '#a')).x + (await rect(page, '#a')).width), 'the default gap: --ds-space-2').toBe(8);
  const gamma = await rect(page, '#c');
  expect(gamma.x + gamma.width, '.ds-push sits at the end').toBe(row.x + row.width);
  const between = await rect(page, '#between');
  expect((await rect(page, '#d')).x).toBe(between.x);
  expect((await rect(page, '#e')).x + (await rect(page, '#e')).width).toBe(between.x + between.width);
  const end = await rect(page, '#end');
  expect((await rect(page, '#f')).x + (await rect(page, '#f')).width).toBe(end.x + end.width);
  const center = await rect(page, '#center');
  const eta = await rect(page, '#g');
  expect(Math.abs(eta.x + eta.width / 2 - (center.x + center.width / 2))).toBeLessThanOrEqual(1);
  // Four 80px items in 200px: two lines of two.
  const tops = await page.$$eval('#wrap > span', (items) => items.map((item) => Math.round(item.getBoundingClientRect().y)));
  expect(new Set(tops).size).toBe(2);
});

test('cluster: --nowrap keeps one line and a .ds-truncate title shrinks beside its action; --top and --baseline line up', async ({ page }) => {
  await open(page);
  await add(page, `<div style="inline-size: 300px">
    <div class="ds-cluster ds-cluster--nowrap" id="row"><span class="ds-truncate" id="title">${'A long ticket subject '.repeat(6)}</span><button class="ds-btn ds-push" type="button" id="action">Open</button></div>
    <div class="ds-cluster ds-cluster--top" id="top"><span id="tall" style="block-size: 60px">Tall</span><span id="short" style="block-size: 20px">Short</span></div>
  </div>`);
  const row = await rect(page, '#row');
  const title = await rect(page, '#title');
  const action = await rect(page, '#action');
  expect(Math.abs(title.y + title.height / 2 - (action.y + action.height / 2)), 'one line, centred across').toBeLessThanOrEqual(1);
  expect(action.x + action.width, 'the action stays at the end, in the row').toBe(row.x + row.width);
  expect(title.x + title.width).toBeLessThanOrEqual(action.x);
  expect(await page.$eval('#title', (el) => el.scrollWidth > el.clientWidth), 'the title is cut').toBe(true);
  expect((await rect(page, '#short')).y, '--top: both start at the top').toBe((await rect(page, '#tall')).y);
  await page.$eval('#top', (el) => el.classList.replace('ds-cluster--top', 'ds-cluster--baseline'));
  expect(await page.$eval('#top', (el) => getComputedStyle(el).alignItems)).toBe('baseline');
});

test('split: the side keeps --ds-split-side beside main, and both stack once main would be narrower than half', async ({ page }) => {
  await open(page);
  const markup = (width, extra = '') => `<div style="inline-size: ${width}px"><div class="ds-split" id="split" ${extra}><div class="ds-split__side" id="side" ${BOX}>Filters</div><div class="ds-split__main" id="main" ${BOX}>Results</div></div></div>`;
  await add(page, markup(900));
  let side = await rect(page, '#side');
  let main = await rect(page, '#main');
  // 18rem, plus its share (1 in 1000) of the free space.
  expect(side.width, '18rem').toBeGreaterThanOrEqual(288);
  expect(side.width, '18rem').toBeLessThanOrEqual(289);
  expect(main.y).toBe(side.y);
  expect(main.x - (side.x + side.width), 'the gap: --ds-space-4').toBeGreaterThanOrEqual(15);
  expect(main.x - (side.x + side.width), 'the gap: --ds-space-4').toBeLessThanOrEqual(17);
  expect(main.x + main.width).toBe(side.x + 900);
  // 18rem + 16px + half of 500px no longer fit: stacked, full width, main below the side (the markup order).
  await add(page, markup(500));
  side = await rect(page, '#side');
  main = await rect(page, '#main');
  expect(side.width).toBe(500);
  expect(main.width).toBe(500);
  expect(main.y).toBe(side.y + side.height + 16);
  // The hooks: a narrower side and a lower minimum keep them side by side.
  await add(page, markup(500, 'style="--ds-split-side: 10rem; --ds-split-min: 40%"'));
  expect((await rect(page, '#main')).y).toBe((await rect(page, '#side')).y);
  expect((await rect(page, '#side')).width).toBeLessThanOrEqual(161);
});

test('switcher: one row of equal parts from --ds-switcher-at up, else one column; five parts always stack', async ({ page }) => {
  await open(page);
  const parts = (n) => Array.from({ length: n }, (_, i) => `<div ${BOX}>Part ${i + 1}</div>`).join('');
  await add(page, `<div style="inline-size: 640px"><div class="ds-switcher" id="wide">${parts(3)}</div></div>
    <div style="inline-size: 470px"><div class="ds-switcher" id="narrow">${parts(3)}</div></div>
    <div style="inline-size: 900px"><div class="ds-switcher" id="five">${parts(5)}</div></div>`);
  const read = (id) => page.$$eval(`#${id} > div`, (items) => items.map((item) => {
    const box = item.getBoundingClientRect();
    return { y: Math.round(box.y), width: Math.round(box.width) };
  }));
  const wide = await read('wide');
  expect(new Set(wide.map((part) => part.y)).size, 'one row').toBe(1);
  expect(new Set(wide.map((part) => part.width)).size, 'equal parts').toBe(1);
  const narrow = await read('narrow');
  expect(new Set(narrow.map((part) => part.y)).size, 'one column').toBe(3);
  expect(narrow.every((part) => part.width === 470)).toBe(true);
  const five = await read('five');
  expect(new Set(five.map((part) => part.y)).size).toBe(5);
});

test('measure: centred at the reading measure, --wide at the content width, --intrinsic centres each child', async ({ page }) => {
  await open(page);
  await add(page, `<div style="inline-size: 1200px" id="outer">
    <div class="ds-measure" id="measure">Text</div>
    <div class="ds-measure ds-measure--wide" id="wide">Text</div>
    <div class="ds-measure" id="hook" style="--ds-measure-max: 300px; --ds-measure-pad: 20px">Text</div>
    <div class="ds-measure ds-measure--intrinsic" id="intrinsic"><button class="ds-btn" type="button" id="child">Load more</button></div>
  </div>`);
  const outer = await rect(page, '#outer');
  const centred = async (id) => {
    const box = await rect(page, `#${id}`);
    return Math.abs(box.x - outer.x - (outer.x + outer.width - box.x - box.width)) <= 1;
  };
  // --ds-measure (76ch) of the body text: narrower than the probe, centred in it.
  expect((await rect(page, '#measure')).width).toBeLessThan(1200);
  expect((await rect(page, '#measure')).width).toBeGreaterThan(400);
  expect(await centred('measure')).toBe(true);
  expect((await rect(page, '#wide')).width, '--ds-content-max (1280px) is wider than the probe').toBe(1200);
  expect((await rect(page, '#hook')).width, 'the padding sits outside the width').toBe(340);
  expect(await centred('hook')).toBe(true);
  const child = await rect(page, '#child');
  expect(child.width).toBeLessThan(300);
  expect(Math.abs(child.x - outer.x - (outer.x + outer.width - child.x - child.width))).toBeLessThanOrEqual(1);
});

test('cover: at least --ds-cover-min high, __main centred between the parts at the edges; --screen fills the viewport', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-cover" id="cover" style="--ds-cover-min: 400px; --ds-cover-pad: 0px">
    <p id="head" style="margin: 0">Step 2 of 3</p><div class="ds-cover__main" id="main" style="block-size: 100px">Main</div><p id="foot" style="margin: 0">Help</p></div>
    <div class="ds-cover ds-cover--screen" id="screen"></div>`);
  const cover = await rect(page, '#cover');
  const main = await rect(page, '#main');
  expect(cover.height).toBe(400);
  expect((await rect(page, '#head')).y).toBe(cover.y);
  const foot = await rect(page, '#foot');
  expect(foot.y + foot.height).toBe(cover.y + cover.height);
  expect(Math.abs(main.y + main.height / 2 - (cover.y + cover.height / 2))).toBeLessThanOrEqual(1);
  expect((await rect(page, '#screen')).height).toBe(page.viewportSize().height);
});

test('frame: the ratio of each modifier, media cropped to cover it; the radius times the shape', async ({ page }) => {
  await open(page);
  const pixel = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="40"/>');
  await add(page, `<div style="inline-size: 420px" class="ds-stack">
    ${['', 'ds-frame--square', 'ds-frame--4-3', 'ds-frame--3-4', 'ds-frame--16-9', 'ds-frame--21-9'].map((cls, i) => `<div class="ds-frame ${cls}" id="f${i}"><img src="${pixel}" alt="LAPTOP-0042" id="img${i}"></div>`).join('')}
    <div class="ds-frame" id="hook" style="--ds-frame-ratio: 2"></div>
    <div class="ds-shape-square"><div class="ds-frame" id="square"></div></div>
    <div class="ds-shape-soft"><div class="ds-frame" id="soft"></div></div>
  </div>`);
  const ratio = async (id) => {
    const box = await page.$eval(`#${id}`, (el) => el.getBoundingClientRect());
    return Math.round((box.width / box.height) * 100) / 100;
  };
  expect(await ratio('f0'), 'default 16 / 9').toBe(1.78);
  expect(await ratio('f1')).toBe(1);
  expect(await ratio('f2')).toBe(1.33);
  expect(await ratio('f3')).toBe(0.75);
  expect(await ratio('f4')).toBe(1.78);
  expect(await ratio('f5')).toBe(2.33);
  expect(await ratio('hook')).toBe(2);
  const img = await page.$eval('#img1', (el) => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, fit: getComputedStyle(el).objectFit }));
  expect(img).toEqual({ width: 420, height: 420, fit: 'cover' });
  const radius = (id) => page.$eval(`#${id}`, (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  const base = await radius('f0');
  expect(base).toBeGreaterThan(0);
  expect(await radius('square')).toBe(0);
  expect(await radius('soft')).toBe(base / 2);
  await expect(page.locator('#img1')).toHaveAccessibleName('LAPTOP-0042');
});

test('grid: auto-fit columns at --ds-grid-min, one on a phone, never more than --max-n; --fill keeps a lone card narrow', async ({ page }) => {
  await open(page);
  const cards = (n) => Array.from({ length: n }, () => `<div ${BOX}></div>`).join('');
  await add(page, `<div style="inline-size: 1000px"><div class="ds-grid" id="wide">${cards(6)}</div></div>
    <div style="inline-size: 360px"><div class="ds-grid" id="phone">${cards(3)}</div></div>
    <div style="inline-size: 1000px"><div class="ds-grid ds-grid--max-3" id="max" style="--ds-grid-min: 8rem">${cards(6)}</div></div>
    <div style="inline-size: 1000px"><div class="ds-grid ds-grid--max-2 ds-gap-12" id="max-gap" style="--ds-grid-min: 4rem">${cards(4)}</div></div>
    <div style="inline-size: 1000px"><div class="ds-grid ds-grid--fill" id="fill">${cards(1)}</div></div>
    <div style="inline-size: 1000px"><div class="ds-grid" id="lone">${cards(1)}</div></div>`);
  const columns = (id) => page.$eval(`#${id}`, (el) => getComputedStyle(el).gridTemplateColumns.split(' ').filter((track) => parseFloat(track) > 0).length);
  // 1000px at 256px and a 16px gap: three columns.
  expect(await columns('wide')).toBe(3);
  expect(await columns('phone')).toBe(1);
  expect((await rect(page, '#phone > div')).width, 'never wider than the grid').toBe(360);
  expect(await columns('max'), 'seven would fit at 8rem').toBe(3);
  expect(await columns('max-gap'), 'whatever the gap').toBe(2);
  expect((await rect(page, '#fill > div')).width).toBeLessThan(400);
  expect((await rect(page, '#lone > div')).width, 'auto-fit stretches a lone card').toBe(1000);
});

test('density tightens the default gaps by 2px a step; a .ds-gap-* class is exact whatever the density', async ({ page }) => {
  await open(page);
  const row = (cls, extra = '') => `<div class="${cls}"><div class="ds-cluster ${extra}" data-probe><span>A</span><span>B</span></div><div class="ds-grid ${extra}" data-probe><span>A</span><span>B</span></div></div>`;
  await add(page, `${row('')}${row('ds-density-compact')}${row('ds-density-dense')}${row('ds-density-tight')}${row('ds-density-tight', 'ds-gap-4')}`);
  const gaps = await page.$$eval('[data-probe]', (items) => items.map((item) => getComputedStyle(item).columnGap));
  expect(gaps).toEqual(['8px', '16px', '6px', '14px', '4px', '12px', '2px', '10px', '16px', '16px']);
});

test('reading and Tab order follow the markup: no reordering, the side first where it stands', async ({ page }) => {
  await open(page);
  await add(page, `<div style="inline-size: 900px"><div class="ds-split"><div class="ds-split__side"><button type="button" class="ds-btn" id="one">One</button></div><div class="ds-split__main ds-cluster"><button type="button" class="ds-btn" id="two">Two</button><button type="button" class="ds-btn ds-push" id="three">Three</button></div></div></div>`);
  await page.locator('#one').focus();
  const order = ['one'];
  for (let i = 0; i < 2; i += 1) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => document.activeElement.id));
  }
  expect(order).toEqual(['one', 'two', 'three']);
  const xs = await Promise.all(order.map(async (id) => (await rect(page, `#${id}`)).x));
  expect([...xs].sort((a, b) => a - b), 'left to right as they are reached').toEqual(xs);
  const styles = await page.$$eval('#probe *', (items) => items.map((item) => [getComputedStyle(item).order, getComputedStyle(item).flexDirection]));
  expect(styles.every(([order, direction]) => order === '0' && !direction.includes('reverse'))).toBe(true);
});

test('the demo: every primitive renders, the frames name their glyph nothing, the width reflows the split', async ({ page }) => {
  await open(page);
  for (const name of ['cluster', 'split', 'switcher', 'measure', 'cover', 'frames', 'grids']) await expect(page.locator(`[data-demo="${name}"]`)).toBeVisible();
  await expect(page.locator('[data-demo="frame"] svg').first()).toHaveAttribute('aria-hidden', 'true');
  await page.setViewportSize({ width: 360, height: 800 });
  const side = await rect(page, '[data-demo="split"] .ds-split__side');
  const main = await rect(page, '[data-demo="split"] .ds-split__main');
  expect(main.y, 'stacked on a phone').toBeGreaterThan(side.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no sideways scroll at 360px').toBe(true);
});

test('forced colours: a frame keeps an edge; the primitives draw nothing', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const frame = await page.locator('[data-demo="frame"]').first().evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth }));
  expect(frame).toEqual({ style: 'solid', width: '1px' });
  const drawn = await page.$$eval('.ds-cluster, .ds-split, .ds-switcher, .ds-grid, .ds-measure, .ds-cover', (items) => items.filter((item) => getComputedStyle(item).borderTopStyle !== 'none' && !item.classList.contains('ds-card')).length);
  expect(drawn).toBe(0);
});
