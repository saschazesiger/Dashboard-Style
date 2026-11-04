/**
 * The tile on the options model (3.0): the value at every size, the padding
 * and the gap at every density, .ds-touch on a tile that opens; the shape at
 * rest and pressed; the delta (an arrow and a word, a tone on the delta
 * itself and none inherited) and the trend slot at the foot; the keyboard
 * path and the names of the demo; forced colours. The 2.x behaviour stays
 * in test/browser/ (countup, controls-2). Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/component.html?c=tile';
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

/** A colour role as a computed colour, through a probe in the theme. */
const role = (page, name, property) => page.evaluate(([value, prop]) => {
  const probe = document.createElement('span');
  probe.style[prop] = `var(${value})`;
  document.querySelector('#fx-component').append(probe);
  const colour = getComputedStyle(probe)[prop];
  probe.remove();
  return colour;
}, [name, property]);

test('size steps the value only; density the padding and the gap only; touch the target of a tile that opens', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const host = document.querySelector('#fx-component');
    const out = [];
    for (const [density] of densities) {
      for (const [size] of sizes) {
        for (const touch of [false, true]) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.style.inlineSize = '800px';
          // A clickable tile with no text is the smallest there is: the touch minimum shows on it.
          region.innerHTML = '<div class="ds-tiles"><div class="ds-tile"><p class="ds-tile__label"><span>Label</span></p><p class="ds-tile__value">128</p><p class="ds-tile__note">Note</p></div><div class="ds-tile"><p class="ds-tile__value">7</p></div></div>'
            + '<button class="ds-tile" type="button" style="padding:0" aria-label="Empty"></button>';
          host.append(region);
          const tile = region.querySelector('.ds-tile');
          const style = getComputedStyle(tile);
          const value = getComputedStyle(region.querySelector('.ds-tile__value'));
          const row = getComputedStyle(region.querySelector('.ds-tiles'));
          out.push({
            density, size, touch,
            pad: [parseFloat(style.paddingTop), parseFloat(style.paddingInlineStart), parseFloat(style.paddingBottom)],
            gap: parseFloat(row.columnGap),
            value: parseFloat(value.fontSize), line: parseFloat(value.lineHeight),
            label: parseFloat(getComputedStyle(region.querySelector('.ds-tile__label')).fontSize),
            note: parseFloat(getComputedStyle(region.querySelector('.ds-tile__note')).fontSize),
            empty: region.querySelector('button').getBoundingClientRect().height,
          });
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
    const pad = 20 + density * 2;
    expect(entry.pad, `${name}: padding`).toEqual([pad - 4, pad, pad]);
    expect(entry.gap, `${name}: gap`).toBe(12 + density * 2);
    expect(entry.value, `${name}: value`).toBeCloseTo(36 * (1 + step / 8), 1);
    expect(entry.line, `${name}: value line`).toBeCloseTo(44 * (1 + step / 8), 0);
    expect(entry.label, `${name}: label`).toBe(14);
    expect(entry.note, `${name}: note`).toBe(12);
    if (entry.touch) expect(entry.empty, `${name}: target`).toBeGreaterThanOrEqual(TOUCH);
    else expect(entry.empty, `${name}: no target`).toBeLessThan(TOUCH);
  }
});

test('--ds-tile-value-line: a theme\'s line height holds on the value and steps with the size', async ({ page }) => {
  await open(page);
  await add(page, `<div style="--ds-tile-value-line:40px"><div class="ds-tile"><p class="ds-tile__value" id="md">1</p></div><div class="ds-lg"><div class="ds-tile"><p class="ds-tile__value" id="lg">1</p></div></div></div>`);
  const line = (id) => page.$eval(`#${id}`, (el) => parseFloat(getComputedStyle(el).lineHeight));
  expect(await line('md')).toBeCloseTo(40, 0);
  expect(await line('lg')).toBeCloseTo(45, 0);
});

test('a narrow tile still shrinks its value at every size; the value never takes a tone', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-lg ds-tone-error" style="inline-size:120px"><div class="ds-tile" id="narrow"><p class="ds-tile__value">128</p></div></div>`);
  const read = await page.$eval('#narrow', (el) => {
    const value = el.querySelector('.ds-tile__value');
    return { font: parseFloat(getComputedStyle(value).fontSize), inner: el.clientWidth - parseFloat(getComputedStyle(el).paddingInlineStart) * 2, color: getComputedStyle(value).color, text: getComputedStyle(document.querySelector('#fx-component')).color };
  });
  expect(read.font).toBeCloseTo(read.inner * 0.26, 0);
  expect(read.color).toBe(read.text);
});

test('the shape multiplies the rest and the pressed radius: square stays square, the press never rounder', async ({ page }) => {
  await open(page);
  await add(page, `<div class="fx-row">
    <span class="ds-shape-square"><button class="ds-tile" type="button" id="square">A</button></span>
    <span class="ds-shape-soft"><button class="ds-tile" type="button" id="soft">B</button></span>
    <button class="ds-tile" type="button" id="default">C</button>
    <span class="ds-shape-round"><button class="ds-tile" type="button" id="round">D</button></span>
    <span class="ds-shape-round"><div class="ds-tile" id="static"><p class="ds-tile__delta ds-tone-success" id="delta">Up</p></div></span>
  </div>`);
  const pressed = (id) => page.$eval(`#${id}`, (el) => {
    const rest = parseFloat(getComputedStyle(el).borderTopLeftRadius);
    el.classList.add('ds-pressed');
    return Promise.all(el.getAnimations().map((a) => a.finished.catch(() => null))).then(() => {
      const held = parseFloat(getComputedStyle(el).borderTopLeftRadius);
      el.classList.remove('ds-pressed');
      el.getAnimations().forEach((a) => a.finish());
      return [rest, held];
    });
  });
  expect(await pressed('square')).toEqual([0, 0]);
  expect(await pressed('soft')).toEqual([8, 6]);
  expect(await pressed('default')).toEqual([16, 12]);
  expect(await pressed('round')).toEqual([24, 18]);
  const statics = await page.evaluate(() => [parseFloat(getComputedStyle(document.querySelector('#static')).borderTopLeftRadius), parseFloat(getComputedStyle(document.querySelector('#delta')).borderTopLeftRadius)]);
  expect(statics).toEqual([24, 12]);
});

test('the delta: an arrow and a word; a tone on it lays the tint, an inherited tone does nothing', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-tone-error"><div class="ds-tile"><p class="ds-tile__delta" id="quiet"><svg width="16" height="16"></svg><span>No change</span></p></div></div>
    <div class="ds-tile"><p class="ds-tile__delta ds-tone-success" id="good"><svg width="16" height="16"></svg><span>12 more</span></p></div>`);
  const read = (id) => page.$eval(`#${id}`, (el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, color: style.color, font: parseFloat(style.fontSize), pad: parseFloat(style.paddingInlineStart) };
  });
  const quiet = await read('quiet');
  expect(quiet.background).toBe('rgba(0, 0, 0, 0)');
  expect(quiet.color).toBe(await role(page, '--ds-text-2', 'color'));
  expect(quiet.pad).toBe(0);
  const good = await read('good');
  expect(good.background).toBe(await role(page, '--ds-success-container', 'backgroundColor'));
  expect(good.color).toBe(await role(page, '--ds-on-success-container', 'color'));
  expect(good.font).toBe(12);
  // Every delta of the demo has an arrow and a word.
  const deltas = await page.locator('[data-demo="figures"] .ds-tile__delta').evaluateAll((els) => els.map((el) => ({ glyph: !!el.querySelector('svg'), word: el.textContent.trim().length > 0 })));
  expect(deltas.length).toBeGreaterThanOrEqual(3);
  for (const delta of deltas) expect(delta).toEqual({ glyph: true, word: true });
});

test('the trend sits at the foot of the tile, so the sparklines of a row line up', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-tiles" style="inline-size:640px"><div class="ds-tile" id="tall"><p class="ds-tile__value">1</p><p class="ds-tile__note">One</p><p class="ds-tile__note">Two</p><p class="ds-tile__note">Three</p><div class="ds-tile__trend" id="t1"><svg height="24" viewBox="0 0 10 10"></svg></div></div>
    <div class="ds-tile" id="short" style="--ds-tile-trend-color:rgb(1, 2, 3)"><p class="ds-tile__value">2</p><div class="ds-tile__trend" id="t2"><svg height="24" viewBox="0 0 10 10"></svg></div></div></div>`);
  const read = await page.evaluate(() => {
    const box = (id) => document.querySelector(id).getBoundingClientRect();
    const svg = document.querySelector('#t1 svg').getBoundingClientRect();
    const colour = (id) => getComputedStyle(document.querySelector(id)).color;
    return { t1: box('#t1').bottom, t2: box('#t2').bottom, svg: svg.width, width: box('#t1').width, colour: colour('#t1'), hooked: colour('#t2') };
  });
  expect(read.t1).toBeCloseTo(read.t2, 0);
  expect(read.svg).toBeCloseTo(read.width, 0);
  // Its currentColor: the first chart colour, or the hook.
  expect(read.colour).toBe(await role(page, '--ds-chart-1', 'color'));
  expect(read.hooked).toBe('rgb(1, 2, 3)');
  // A sparkline of spans in a clickable tile is 32px high, a block.
  const spark = page.locator('[data-demo="open"] .ds-columns--mini');
  await expect(spark).toHaveAttribute('role', 'img');
  const box = await spark.evaluate((el) => ({ height: el.getBoundingClientRect().height, display: getComputedStyle(el).display }));
  expect(box).toEqual({ height: 32, display: 'block' });
});

test('keyboard and names: Tab reaches a tile that opens or filters; Enter and Space press it; a figure is no stop', async ({ page }) => {
  await open(page);
  // A tile that only shows a figure is out of the tab order.
  expect(await page.locator('[data-demo="figures"] .ds-tile').first().evaluate((el) => el.matches(':focus') || el.tabIndex)).toBe(-1);
  const filter = page.getByRole('group', { name: 'Filter devices' });
  const off = filter.getByRole('button', { name: /In repair/ });
  await expect(off).toHaveAttribute('aria-pressed', 'false');
  await focusByKeyboard(page, off);
  await expect(off).toBeFocused();
  const ring = await off.evaluate((el) => ({ outline: getComputedStyle(el).outlineStyle, width: parseFloat(getComputedStyle(el).outlineWidth) }));
  expect(ring).toEqual({ outline: 'solid', width: 2 });
  await page.keyboard.press('Space');
  await expect(off).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(off).toHaveAttribute('aria-pressed', 'false');
  const link = page.locator('[data-demo="open-link"]');
  await focusByKeyboard(page, link);
  await page.keyboard.press('Enter');
  await expect(page.locator('.ds-toast').last()).toContainText('Opened the list');
  // A blocked tile stays focusable, and no key reaches a handler of the page.
  await add(page, '<button class="ds-tile" type="button" aria-disabled="true" id="blocked"><span class="ds-tile__value">1</span></button>');
  const blocked = page.locator('#blocked');
  await blocked.evaluate((el) => {
    window.blockedRuns = 0;
    el.addEventListener('click', () => { window.blockedRuns += 1; });
  });
  await focusByKeyboard(page, blocked);
  await expect(blocked).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.blockedRuns)).toBe(0);
  // The same keys run it once it is free, so the zero above is the guard's.
  await blocked.evaluate((el) => el.removeAttribute('aria-disabled'));
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.blockedRuns)).toBe(1);
  // The sparkline says its summary.
  await expect(page.getByRole('img', { name: /Devices per day, last 14 days/ })).toBeVisible();
});

test('a tile that filters: a pressed tile has the check, an unpressed one none, the label stays', async ({ page }) => {
  await open(page);
  const filter = page.getByRole('group', { name: 'Filter devices' });
  const read = () => filter.locator('.ds-tile').evaluateAll((els) => els.map((el) => [el.getAttribute('aria-pressed'), el.querySelectorAll('.ds-tile__label svg').length, el.querySelector('.ds-tile__label').textContent]));
  expect(await read()).toEqual([['true', 1, 'Overdue'], ['false', 0, 'In repair'], ['false', 0, 'Retired']]);
  await filter.locator('.ds-tile').nth(0).click();
  await filter.locator('.ds-tile').nth(1).click();
  expect(await read()).toEqual([['false', 0, 'Overdue'], ['true', 1, 'In repair'], ['false', 0, 'Retired']]);
  await filter.locator('.ds-tile').nth(1).click();
  await filter.locator('.ds-tile').nth(0).click();
  expect(await read()).toEqual([['true', 1, 'Overdue'], ['false', 0, 'In repair'], ['false', 0, 'Retired']]);
});

test('forced colours: a selected tile is Highlight with its delta and sparkline; a blocked one GrayText; a delta keeps arrow and word', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, `<div class="ds-tiles">
    <button class="ds-tile" type="button" aria-pressed="true" id="on"><span class="ds-tile__value">1</span><span class="ds-tile__delta ds-tone-error" id="on-delta"><svg width="16" height="16"></svg><span>Up</span></span>
      <span class="ds-tile__trend"><span class="ds-columns ds-columns--mini" role="img" aria-label="x"><span class="ds-columns__plot" aria-hidden="true"><span class="ds-columns__col" style="--ds-share:1"><span class="ds-columns__fill" id="on-fill"></span></span></span></span></span></button>
    <button class="ds-tile" type="button" aria-disabled="true" id="off"><span class="ds-tile__value">1</span><span class="ds-tile__delta ds-tone-error" id="off-delta"><svg width="16" height="16"></svg><span>Up</span></span></button>
    <div class="ds-tile"><p class="ds-tile__delta ds-tone-success" id="plain"><svg width="16" height="16"></svg><span>Up</span></p></div>
  </div>`);
  const system = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('#fx-component').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    return { highlight: probe('backgroundColor', 'Highlight'), highlightText: probe('color', 'HighlightText'), gray: probe('color', 'GrayText'), canvas: probe('backgroundColor', 'Canvas') };
  });
  const read = (id, property) => page.$eval(`#${id}`, (el, prop) => getComputedStyle(el)[prop], property);
  expect(await read('on', 'backgroundColor')).toBe(system.highlight);
  expect(await read('on-delta', 'color')).toBe(system.highlightText);
  expect(await read('on-delta', 'backgroundColor')).toBe('rgba(0, 0, 0, 0)');
  expect(await read('on-fill', 'backgroundColor')).toBe(system.highlightText);
  expect(await read('off', 'color')).toBe(system.gray);
  expect(await read('off-delta', 'color')).toBe(system.gray);
  expect(await page.locator('#plain svg').count()).toBe(1);
  await expect(page.locator('#plain')).toHaveText('Up');
});
