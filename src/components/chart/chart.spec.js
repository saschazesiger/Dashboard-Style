/**
 * The charts on the options model (3.0): the height of a meter and the plot
 * of the columns at every size x density, a sparkline that stays 32px, a
 * column's value still riding on its fill; the shape on every radius, in
 * the clip too; the tone on the mark itself, none inherited, and the 2.x
 * aliases; .ds-touch on a column that opens; the keyboard path and the
 * names of the demo; forced colours with a tone. The 2.x behaviour stays in
 * test/browser/charts.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/component.html?c=chart';
const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const add = (page, html) => page.evaluate((markup) => {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.querySelector('#fx-component').prepend(box);
}, html);

test('size and density: the meter, the plot, a legend key and the sparkline; the value rides on its fill', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const host = document.querySelector('#fx-component');
    const out = [];
    for (const [density] of densities) {
      for (const [size] of sizes) {
        const region = document.createElement('div');
        region.className = `${density} ${size}`;
        region.innerHTML = '<span class="ds-meter" style="--ds-share:.5"></span>'
          + '<figure class="ds-columns"><ol class="ds-columns__plot"><li class="ds-columns__col" style="--ds-share:.5" id="col"><span class="ds-columns__value">42</span><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-columns__label">Mon</span></li></ol></figure>'
          + '<figure class="ds-columns ds-columns--mini" role="img" aria-label="x"><ol class="ds-columns__plot" aria-hidden="true"><li class="ds-columns__col" style="--ds-share:1" id="mini"><span class="ds-columns__fill"></span></li></ol></figure>'
          + '<ul class="ds-legend"><li><span class="ds-legend__key"></span>Opened</li></ul>';
        host.append(region);
        const fill = region.querySelector('#col .ds-columns__fill').getBoundingClientRect();
        const value = region.querySelector('#col .ds-columns__value').getBoundingClientRect();
        const key = region.querySelector('.ds-legend__key').getBoundingClientRect();
        out.push({
          density, size,
          meter: region.querySelector('.ds-meter').getBoundingClientRect().height,
          meterRadius: parseFloat(getComputedStyle(region.querySelector('.ds-meter')).borderTopLeftRadius),
          plot: fill.height,
          // The top of the fill at --ds-share .5, and the value 4px above it.
          valueGap: (fill.bottom - fill.height * 0.5) - value.bottom,
          mini: region.querySelector('#mini').getBoundingClientRect().height,
          key: [key.width, key.height],
          label: parseFloat(getComputedStyle(region.querySelector('.ds-columns__label')).fontSize),
        });
        region.remove();
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}`;
    expect(entry.meter, `${name}: meter, size only`).toBeCloseTo(4 + step, 1);
    expect(entry.meterRadius, `${name}: meter radius`).toBeCloseTo((4 + step) / 2, 1);
    expect(entry.plot, `${name}: plot`).toBeCloseTo(120 + step * 24 + density * 12, 0);
    expect(Math.abs(entry.valueGap - 4), `${name}: the value on its fill`).toBeLessThanOrEqual(1);
    expect(entry.mini, `${name}: a sparkline stays`).toBe(32);
    expect(entry.key, `${name}: key`).toEqual([12 + step * 2, 12 + step * 2]);
    expect(entry.label, `${name}: type`).toBe(12);
  }
});

test('the shape multiplies every radius, in the clip of the fills too', async ({ page }) => {
  await open(page);
  const read = (shape) => page.evaluate((cls) => {
    const region = document.createElement('div');
    region.className = cls;
    region.innerHTML = '<span class="ds-meter" style="--ds-share:.5"></span>'
      + '<figure class="ds-columns"><ol class="ds-columns__plot"><li><button class="ds-columns__col" type="button" style="--ds-share:.5"><span class="ds-columns__fill" aria-hidden="true"></span></button></li></ol></figure>'
      + '<ul class="ds-legend"><li><span class="ds-legend__key"></span>x</li></ul>';
    document.querySelector('#fx-component').prepend(region);
    const out = {
      meter: parseFloat(getComputedStyle(region.querySelector('.ds-meter')).borderTopLeftRadius),
      meterClip: getComputedStyle(region.querySelector('.ds-meter'), '::before').clipPath,
      column: parseFloat(getComputedStyle(region.querySelector('.ds-columns__col')).borderTopLeftRadius),
      fillClip: getComputedStyle(region.querySelector('.ds-columns__fill')).clipPath,
      key: parseFloat(getComputedStyle(region.querySelector('.ds-legend__key')).borderTopLeftRadius),
    };
    region.remove();
    return out;
  }, shape);
  const square = await read('ds-shape-square');
  expect([square.meter, square.column, square.key]).toEqual([0, 0, 0]);
  expect(square.meterClip).not.toMatch(/round [1-9]/);
  expect(square.fillClip).not.toMatch(/round [1-9]/);
  const soft = await read('ds-shape-soft');
  // A meter is half its height times the shape, at most half its height.
  expect([soft.meter, soft.column, soft.key]).toEqual([1, 2, 2]);
  expect(soft.meterClip).toMatch(/round 1px/);
  const plain = await read('');
  expect([plain.meter, plain.column, plain.key]).toEqual([2, 4, 4]);
  expect(plain.meterClip).toMatch(/round 2px/);
  expect(plain.fillClip).toMatch(/round 4px 4px 0(px)? 0(px)?/);
  const round = await read('ds-shape-round');
  expect([round.meter, round.column, round.key]).toEqual([2, 6, 6]);
});

test('a tone on the mark colours it, an inherited one does not; the 2.x names stay aliases; it beats --ds-meter-color', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-tone-error" id="region">
    <span class="ds-meter" id="m-plain" style="--ds-share:1"></span>
    <span class="ds-meter ds-tone-warning" id="m-warning" style="--ds-share:1"></span>
    <span class="ds-meter ds-meter--warning" id="m-warning-alias" style="--ds-share:1"></span>
    <span class="ds-meter ds-tone-error" id="m-error" style="--ds-share:1"></span>
    <span class="ds-meter ds-meter--error" id="m-error-alias" style="--ds-share:1"></span>
    <span class="ds-meter ds-tone-neutral" id="m-neutral" style="--ds-share:1"></span>
    <span class="ds-meter ds-meter--neutral" id="m-neutral-alias" style="--ds-share:1"></span>
    <span class="ds-meter ds-tone-success" id="m-success" style="--ds-share:1"></span>
    <span class="ds-meter ds-tone-warning" id="m-hook" style="--ds-share:1;--ds-meter-color:#000"></span>
    <span class="ds-meter" id="m-custom" style="--ds-share:1;--ds-meter-color:rgb(1, 2, 3)"></span>
    <figure class="ds-columns"><ol class="ds-columns__plot">
      <li class="ds-columns__col" id="c-plain" style="--ds-share:1"><span class="ds-columns__fill"></span></li>
      <li class="ds-columns__col ds-tone-warning" id="c-warning" style="--ds-share:1"><span class="ds-columns__fill"></span></li>
      <li class="ds-columns__col ds-columns__col--warning" id="c-warning-alias" style="--ds-share:1"><span class="ds-columns__fill"></span></li>
      <li class="ds-columns__col ds-tone-error" id="c-error" style="--ds-share:1"><span class="ds-columns__fill"></span></li>
      <li class="ds-columns__col ds-columns__col--error" id="c-error-alias" style="--ds-share:1"><span class="ds-columns__fill"></span></li>
    </ol></figure>
    <figure class="ds-columns ds-columns--mini"><ol class="ds-columns__plot"><li class="ds-columns__col ds-tone-error" id="mini-error" style="--ds-share:1"><span class="ds-columns__fill"></span></li></ol></figure>
    <ul class="ds-legend">
      <li><span class="ds-legend__key" id="k-plain"></span>a</li>
      <li><span class="ds-legend__key ds-tone-warning" id="k-warning"></span>b</li>
      <li><span class="ds-legend__key ds-legend__key--warning" id="k-warning-alias"></span>c</li>
      <li><span class="ds-legend__key ds-tone-neutral" id="k-neutral"></span>d</li>
      <li><span class="ds-legend__key ds-legend__key--neutral" id="k-neutral-alias"></span>e</li>
      <li><span class="ds-legend__key ds-tone-error" id="k-error"></span>f</li>
      <li><span class="ds-legend__key ds-legend__key--error" id="k-error-alias"></span>g</li>
    </ul>
  </div>`);
  const fills = await page.evaluate(() => {
    const out = {};
    for (const el of document.querySelectorAll('#region [id]')) {
      if (el.classList.contains('ds-meter')) out[el.id] = getComputedStyle(el, '::before').backgroundColor;
      else if (el.classList.contains('ds-columns__col')) out[el.id] = getComputedStyle(el.querySelector('.ds-columns__fill')).backgroundColor;
      else if (el.classList.contains('ds-legend__key')) out[el.id] = getComputedStyle(el).backgroundColor;
    }
    return out;
  });
  const role = (name) => page.evaluate((value) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = `var(${value})`;
    document.querySelector('#fx-component').append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  }, name);
  const [series, warning, error, neutral, success] = await Promise.all(['--ds-chart-1', '--ds-chart-warning', '--ds-chart-error', '--ds-chart-neutral', '--ds-success'].map(role));
  expect(fills['m-plain'], 'an inherited tone does not colour a meter').toBe(series);
  expect(fills['c-plain']).toBe(series);
  expect(fills['k-plain']).toBe(series);
  for (const id of ['m-warning', 'm-warning-alias', 'c-warning', 'c-warning-alias', 'k-warning', 'k-warning-alias', 'm-hook']) expect(fills[id], id).toBe(warning);
  for (const id of ['m-error', 'm-error-alias', 'c-error', 'c-error-alias', 'k-error', 'k-error-alias', 'mini-error']) expect(fills[id], id).toBe(error);
  for (const id of ['m-neutral', 'm-neutral-alias', 'k-neutral', 'k-neutral-alias']) expect(fills[id], id).toBe(neutral);
  expect(fills['m-success']).toBe(success);
  expect(fills['m-custom'], 'the hook still sets an untoned meter').toBe('rgb(1, 2, 3)');
});

test('.ds-touch: a column that opens is at least the target high, a plain column unchanged', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-touch"><button class="ds-columns__col" type="button" id="touch" style="--ds-share:0;--ds-columns-height:8px;--ds-size-step:0"><span class="ds-columns__fill" aria-hidden="true"></span></button></div>
    <button class="ds-columns__col" type="button" id="plain" style="--ds-share:0;--ds-columns-height:8px"><span class="ds-columns__fill" aria-hidden="true"></span></button>`);
  const heights = await page.evaluate(() => ['#touch', '#plain'].map((id) => document.querySelector(id).getBoundingClientRect().height));
  expect(heights[0]).toBeGreaterThanOrEqual(TOUCH);
  expect(heights[1]).toBeLessThan(TOUCH);
});

test('keyboard and names: Tab reaches a column that opens; Enter opens; the marks say their value', async ({ page }) => {
  await open(page);
  const column = page.getByRole('button', { name: 'Mon: 36 tickets' });
  await focusByKeyboard(page, column);
  await expect(column).toBeFocused();
  // The ring is solid from the first frame; its offset snaps inward.
  await column.evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null))).then(() => undefined));
  const ring = await column.evaluate((el) => ({ outline: getComputedStyle(el).outlineStyle, offset: parseFloat(getComputedStyle(el).outlineOffset) }));
  expect(ring).toEqual({ outline: 'solid', offset: -2 });
  await page.keyboard.press('Enter');
  await expect(page.locator('.ds-toast').last()).toContainText('Opened the tickets of Mon');
  const meter = page.getByRole('meter', { name: 'Disk' });
  await expect(meter).toHaveAttribute('aria-valuetext', '62% used');
  await expect(page.getByRole('img', { name: /Tickets per day, last 14 days/ })).toBeVisible();
  // A plain column is no stop.
  const plain = await page.locator('[data-chart="columns"] .ds-columns__col').first().evaluate((el) => el.tabIndex);
  expect(plain).toBe(-1);
});

test('forced colours: a toned meter and column in the text colour, a meter\'s track with an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, `<span class="ds-meter ds-tone-error" id="meter" style="--ds-share:.5"></span>
    <figure class="ds-columns"><ol class="ds-columns__plot"><li class="ds-columns__col ds-tone-warning" id="col" style="--ds-share:1"><span class="ds-columns__fill"></span></li></ol></figure>`);
  const read = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.forcedColorAdjust = 'none';
    probe.style.color = 'CanvasText';
    document.querySelector('#fx-component').append(probe);
    const text = getComputedStyle(probe).color;
    probe.remove();
    return {
      text,
      meter: getComputedStyle(document.querySelector('#meter'), '::before').backgroundColor,
      column: getComputedStyle(document.querySelector('#col .ds-columns__fill')).backgroundColor,
      outline: getComputedStyle(document.querySelector('#meter')).outlineStyle,
    };
  });
  expect(read.meter).toBe(read.text);
  expect(read.column).toBe(read.text);
  expect(read.outline).toBe('solid');
});
