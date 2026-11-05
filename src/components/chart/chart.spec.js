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

/* ── DS.chart ─────────────────────────────────────────── */

/** A chart of its own in the fixture, through DS.chart.create(); returns its id. */
const chart = (page, spec, { caption = 'Test chart', style = '' } = {}) => page.evaluate(({ spec: s, caption: c, style: st }) => {
  window.__charts = (window.__charts || 0) + 1;
  const id = `chart-${window.__charts}`;
  const el = document.createElement('figure');
  el.className = 'ds-chart';
  el.id = id;
  if (st) el.setAttribute('style', st);
  el.innerHTML = c ? `<figcaption>${c}</figcaption>` : '';
  document.querySelector('#fx-component').prepend(el);
  window.__last = window.DS.chart.create(el, s);
  return `#${id}`;
}, { spec, caption, style });

/** Keeps the detail of the next `type` event of the chart; heard() reads it. */
const listen = (page, id, type) => page.evaluate(({ sel, kind }) => {
  window.__heard = null;
  document.querySelector(sel).addEventListener(kind, (event) => { window.__heard = event.detail; }, { once: true });
}, { sel: id, kind: type });
const heard = (page) => page.waitForFunction(() => window.__heard).then((handle) => handle.jsonValue());

const LINE = {
  type: 'line',
  labels: ['2026-11-04T09:00', '2026-11-04T10:00', '2026-11-04T11:00', '2026-11-04T12:00', '2026-11-04T13:00'],
  series: [{ name: 'Requests', values: [120, 340, null, 200, 260] }, { name: 'Errors', values: [20, 30, 25, 40, 10] }],
};

test.describe('DS.chart', () => {
  test('every chart of the demo draws, with its role and name, and no error', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await open(page);
    const types = await page.locator('.ds-chart').evaluateAll((els) => els.map((el) => [...el.classList].find((name) => /^ds-chart--(?!stacked|patterns|empty)/.test(name))));
    for (const type of ['line', 'area', 'column', 'bar', 'combo', 'sparkline', 'donut', 'pie', 'ring', 'gauge', 'bargauge']) expect(types, type).toContain(`ds-chart--${type}`);
    await expect(page.getByRole('img', { name: 'Response time per hour' })).toBeVisible();
    const gauge = page.getByRole('meter', { name: 'Processor load' });
    await expect(gauge).toHaveAttribute('aria-valuenow', '76');
    await expect(gauge).toHaveAttribute('aria-valuetext', /76.*High/);
    await expect(page.getByRole('meter', { name: 'Server 3' })).toHaveAttribute('aria-valuetext', /93.*Critical/);
    await expect(page.getByRole('img', { name: /^Requests per minute: from .* highest/ })).toBeVisible();
    await expect(page.getByRole('img', { name: 'No data yet: No data' })).toBeVisible();
    // Lines of series 2 are dashed; a series has its marker shape in the legend too.
    const dash = await page.locator('.ds-chart--line .ds-chart__series--s2 .ds-chart__line').first().evaluate((el) => getComputedStyle(el).strokeDasharray);
    expect(dash).not.toBe('none');
    expect(errors).toEqual([]);
  });

  test('keyboard: one tab stop, arrows along the points and through the series, announced; Escape hides; Enter selects', async ({ page }) => {
    await open(page);
    const id = await chart(page, LINE, { caption: 'Requests per hour' });
    const frame = page.locator(`${id} .ds-chart__frame`);
    await expect(frame).toHaveAttribute('role', 'img');
    await expect(frame).toHaveAccessibleName('Requests per hour');
    await expect(frame).toHaveAccessibleDescription(/Arrow keys/);
    await focusByKeyboard(page, frame);
    await expect(frame).toBeFocused();
    const tip = page.locator(`${id} .ds-chart__tip`);
    await page.keyboard.press('Home');
    await expect(tip).toHaveAttribute('data-state', 'open');
    await expect(tip).toContainText('120');
    await expect(page.locator(`${id} .ds-chart__cursor`)).toHaveClass(/ds-chart__cursor--on/);
    await page.keyboard.press('ArrowRight');
    await expect(tip).toContainText('340');
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((el) => el.textContent).join(' '))).toMatch(/Requests 340, Errors 30/);
    // Down picks one series: the other dims, the tooltip names only it.
    await page.keyboard.press('ArrowDown');
    await expect(tip).not.toContainText('Errors');
    await expect(page.locator(`${id} .ds-chart__lines > .ds-chart__series--dim`)).toHaveCount(1);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(`${id} .ds-chart__series--dim`)).toHaveCount(0);
    // A gap says so.
    await page.keyboard.press('ArrowRight');
    await expect(tip).toContainText('–');
    await page.keyboard.press('End');
    await expect(tip).toContainText('260');
    await listen(page, id, 'ds:select');
    await page.keyboard.press('Enter');
    expect(await heard(page)).toMatchObject({ index: 4 });
    await page.keyboard.press('Escape');
    await expect(tip).not.toHaveAttribute('data-state', 'open');
    await expect(frame).toBeFocused();
  });

  test('pointer: the crosshair snaps to the nearest x; a column band; a click selects', async ({ page }) => {
    await open(page);
    const id = await chart(page, { type: 'column', labels: ['Mon', 'Tue', 'Wed'], series: [{ name: 'Opened', values: [4, 8, 6] }, { name: 'Closed', values: [2, 6, 3] }] }, { caption: 'Tickets' });
    const frame = page.locator(`${id} .ds-chart__frame`);
    const box = await frame.boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    const tip = page.locator(`${id} .ds-chart__tip`);
    await expect(tip).toHaveAttribute('data-state', 'open');
    await expect(tip).toContainText('Tue');
    await expect(tip).toContainText('Opened');
    await expect(tip).toContainText('Closed');
    await expect(page.locator(`${id} .ds-chart__band`)).toHaveClass(/ds-chart__band--on/);
    await listen(page, id, 'ds:select');
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    expect(await heard(page)).toMatchObject({ index: 1, label: 'Tue' });
    await page.mouse.move(1, 1);
    await expect(tip).not.toHaveAttribute('data-state', 'open');
  });

  test('legend: each key toggles its series (aria-pressed, announced), never the last one', async ({ page }) => {
    await open(page);
    const id = await chart(page, LINE);
    const keys = page.locator(`${id} .ds-chart__key`);
    await expect(keys).toHaveCount(2);
    const errors = page.locator(`${id} .ds-chart__key`, { hasText: 'Errors' });
    await expect(errors).toHaveAttribute('aria-pressed', 'true');
    await errors.click();
    await expect(errors).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((el) => el.textContent).join(' '))).toMatch(/Errors hidden/);
    await expect.poll(() => page.locator(`${id} .ds-chart__lines > [data-series="1"] .ds-chart__line`).getAttribute('d')).toBe('');
    // The name is struck through: hidden never by colour alone.
    expect(await errors.locator('.ds-chart__key-name').evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('line-through');
    const requests = page.locator(`${id} .ds-chart__key`, { hasText: 'Requests' });
    await requests.click();
    await expect(requests).toHaveAttribute('aria-pressed', 'true');
    await errors.press('Enter');
    await expect(errors).toHaveAttribute('aria-pressed', 'true');
  });

  test('a ring says each value in its legend; a band\'s word stays inside a narrow plot', async ({ page }) => {
    await open(page);
    const ring = await chart(page, { type: 'ring', format: { style: 'unit', unit: 'percent' }, series: [{ name: 'CPU', values: [64] }, { name: 'Memory', values: [81] }] }, { style: 'width: 560px' });
    await expect(page.locator(`${ring} .ds-chart__key-value`)).toHaveText(['64%', '81%']);
    const narrow = await chart(page, {
      type: 'column', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
      series: [{ name: 'Opened', values: [4, 6, 3, 8, 5, 7] }],
      annotations: [{ from: 'W6', to: 'W6', label: 'This week' }],
    }, { style: 'width: 260px' });
    const box = await page.evaluate((id) => {
      const fig = document.querySelector(id);
      const label = fig.querySelector('.ds-chart__rule-label').getBoundingClientRect();
      const grid = [...fig.querySelectorAll('.ds-chart__gridline')].map((el) => el.getBoundingClientRect());
      return { label: label.right, plot: Math.max(...grid.map((r) => r.right)) };
    }, narrow);
    expect(box.label).toBeLessThanOrEqual(box.plot + 1);
  });

  test('table view: the toggle shows the table in place of the plot; the table is there for screen readers all along', async ({ page }) => {
    await open(page);
    const id = await chart(page, LINE, { caption: 'Requests per hour' });
    const table = page.locator(`${id} table`);
    await expect(table).toHaveCount(1);
    await expect(page.getByRole('table', { name: 'Requests per hour' })).toHaveCount(1);
    expect(await table.evaluate((el) => el.parentElement.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    const toggle = page.locator(`${id} .ds-chart__view`);
    await expect(toggle).toHaveAccessibleName('Show as table');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(id)).toHaveAttribute('data-state', 'table');
    await expect(page.locator(`${id} .ds-chart__frame`)).toBeHidden();
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).toHaveCount(5);
    await toggle.click();
    await expect(page.locator(`${id} .ds-chart__frame`)).toBeVisible();
  });

  test('a table is the data: a change to it redraws the chart', async ({ page }) => {
    await open(page);
    const fig = page.locator('figure[data-ds-chart="column"]');
    await expect(fig.locator('.ds-chart__bar')).toHaveCount(5);
    const before = await fig.locator('.ds-chart__bar').first().evaluate((el) => el.style.getPropertyValue('--ds-share'));
    await fig.locator('tbody tr').first().locator('td').first().evaluate((td) => { td.textContent = '5'; });
    await expect.poll(() => fig.locator('.ds-chart__bar').first().evaluate((el) => el.style.getPropertyValue('--ds-share'))).not.toBe(before);
  });

  test('motion: a line morphs to new data on the glide and continues from where it is when interrupted (D14)', async ({ page }) => {
    await open(page);
    const id = await chart(page, { type: 'line', labels: ['a', 'b', 'c'], series: [{ name: 'Load', values: [0, 0, 0] }], y: { min: 0, max: 100 } });
    const path = `${id} .ds-chart__line`;
    await settle(page);
    // Drive it through a controller made here, so the test holds it.
    const result = await page.evaluate(async ({ sel, line }) => {
      const el = document.querySelector(sel);
      const c = window.DS.core.get(el, 'chart') ?? window.__last;
      await window.DS.motion.settled(el, { subtree: true, names: ['ds-chart-morph'] });
      const read = () => Number(/^M[\d.-]+ ([\d.-]+)/.exec(document.querySelector(line).getAttribute('d'))[1]);
      const start = read();
      c.set({ series: [{ name: 'Load', values: [100, 100, 100] }] });
      const morph = el.querySelector('.ds-chart__svg').getAnimations().find((a) => a.id === 'ds-chart-morph');
      const ys = [];
      const t0 = performance.now();
      while (performance.now() - t0 < 250) {
        await new Promise((r) => requestAnimationFrame(r));
        ys.push(read());
      }
      // Interrupted halfway: back to 0, from where the line is.
      const at = read();
      c.set({ series: [{ name: 'Load', values: [0, 0, 0] }] });
      // The new morph draws its first frame at once, from what showed.
      const after = read();
      await window.DS.motion.settled(el, { subtree: true, names: ['ds-chart-morph'] });
      return { start, ys, at, after, end: read(), duration: morph ? morph.effect.getComputedTiming().duration : null, glide: window.DS.motion.motionDuration(el, '--ds-dur-glide') };
    }, { sel: id, line: path });
    expect(result.duration).toBe(result.glide);
    // Up the screen (y falls) without a step back, then back down from where it was.
    const moving = [result.start, ...result.ys];
    for (let i = 1; i < moving.length; i += 1) expect(moving[i]).toBeLessThanOrEqual(moving[i - 1] + 0.01);
    expect(result.at).toBeLessThan(result.start - 1);
    expect(Math.abs(result.after - result.at)).toBeLessThan(1);
    expect(Math.abs(result.end - result.start)).toBeLessThan(0.5);
  });

  test('bars are value bars: clipped at their share with a rounded data end that follows the shape; a new value glides', async ({ page }) => {
    await open(page);
    const id = await chart(page, { type: 'column', labels: ['Mon', 'Tue'], series: [{ name: 'Opened', values: [5, 10] }], legend: false });
    const bar = page.locator(`${id} .ds-chart__bar`).nth(1);
    await settle(page);
    const read = () => bar.evaluate((el) => ({ share: getComputedStyle(el).getPropertyValue('--ds-share').trim(), clip: getComputedStyle(el).clipPath, transition: getComputedStyle(el).transitionProperty }));
    const rest = await read();
    expect(rest.share).toBe('1');
    expect(rest.clip).toMatch(/round 4px 4px 0px 0px|round 4px 4px 0px/);
    expect(rest.transition).toContain('--ds-share');
    await page.locator(id).evaluate((el) => el.classList.add('ds-shape-square'));
    expect((await read()).clip).not.toMatch(/round 4px/);
  });

  test('options: size and density step the plot, touch makes every legend key a target, a narrow chart is lower', async ({ page }) => {
    await open(page);
    const heights = {};
    for (const [cls, label] of [['', 'base'], ['ds-lg', 'lg'], ['ds-sm', 'sm'], ['ds-density-compact', 'compact']]) {
      const id = await chart(page, LINE, { style: 'inline-size: 640px' });
      if (cls) await page.locator(id).evaluate((el, c) => el.classList.add(c), cls);
      heights[label] = await page.locator(`${id} .ds-chart__frame`).evaluate((el) => el.getBoundingClientRect().height);
    }
    expect(heights).toEqual({ base: 240, lg: 280, sm: 200, compact: 224 });
    const narrow = await chart(page, LINE, { style: 'inline-size: 320px' });
    expect(await page.locator(`${narrow} .ds-chart__frame`).evaluate((el) => el.getBoundingClientRect().height)).toBe(180);
    const touch = await chart(page, LINE);
    await page.locator(touch).evaluate((el) => el.classList.add('ds-touch'));
    const keys = await page.locator(`${touch} .ds-chart__key`).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    for (const height of keys) expect(height).toBeGreaterThanOrEqual(TOUCH);
    // The plot is redrawn at its new size.
    const svgWidth = await page.locator(`${narrow} .ds-chart__svg`).evaluate((el) => Number(el.getAttribute('width')));
    expect(svgWidth).toBeLessThanOrEqual(320);
  });

  test('forced colours: lines and fills in CanvasText, series 2 hatched, a shown legend key Highlight', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    const line = await chart(page, LINE);
    const columns = await chart(page, { type: 'column', labels: ['Mon'], series: [{ name: 'A', values: [3] }, { name: 'B', values: [4] }] });
    const read = await page.evaluate(({ line: l, columns: c }) => {
      const probe = document.createElement('span');
      probe.style.forcedColorAdjust = 'none';
      probe.style.color = 'CanvasText';
      probe.style.backgroundColor = 'Highlight';
      document.querySelector('#fx-component').append(probe);
      const text = getComputedStyle(probe).color;
      const highlight = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        text, highlight,
        stroke: getComputedStyle(document.querySelector(`${l} .ds-chart__line`)).stroke,
        first: getComputedStyle(document.querySelector(`${c} .ds-chart__series:not(.ds-chart__series--s2) .ds-chart__bar`)).fill,
        second: getComputedStyle(document.querySelector(`${c} .ds-chart__series--s2 .ds-chart__bar`)).fill,
        key: getComputedStyle(document.querySelector(`${l} .ds-chart__key`)).backgroundColor,
      };
    }, { line, columns });
    expect(read.stroke).toBe(read.text);
    expect(read.first).toBe(read.text);
    expect(read.second).toMatch(/url\(/);
    expect(read.key).toBe(read.highlight);
  });
});
