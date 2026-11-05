/**
 * Meter variants: the segmented mask, a threshold mark at its own share,
 * the gauge's size and ring at every size step (density and touch change
 * nothing), the arc, the tone from the class on the gauge only, the share
 * that glides, a bar gauge's zones and rows, names and values, forced
 * colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=meter');
  await ready(page);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe" style="inline-size: 400px">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', 'holder', `return (${read});`)(el, style, holder);
  holder.remove();
  return out;
}, { html, read });

const colour = (page, value) => page.evaluate((value) => {
  const el = document.createElement('span');
  el.style.color = value;
  document.querySelector('#fx-component').append(el);
  const out = getComputedStyle(el).color;
  el.remove();
  return out;
}, value);

test('a gauge: 96px at md, 16px per size step, its ring 2px per step; density and touch change nothing', async ({ page }) => {
  await open(page);
  for (const touch of ['', ' ds-touch']) {
    for (const density of ['', ' ds-density-tight']) {
      for (const [size, step] of SIZES) {
        const [width, ring] = await probe(page, `<div class="${size}${touch}${density}"><div id="probe" class="ds-gauge" role="meter" aria-label="x" style="--ds-share: .5"></div></div>`,
          '[el.getBoundingClientRect().width, (() => { const c = document.createElement("i"); c.style.cssText = "position: absolute; inline-size: var(--_t)"; el.append(c); return c.getBoundingClientRect().width; })()]');
        expect(width, `${size}${touch}${density}`).toBe(96 + step * 16);
        expect(ring, `${size} ring`).toBe(8 + step * 2);
      }
    }
  }
  // The hook is the md base; the steps still apply.
  expect(await probe(page, '<div class="ds-lg"><div id="probe" class="ds-gauge" style="--ds-gauge-size: 120px"></div></div>', 'el.getBoundingClientRect().width')).toBe(136);
});

test('the ring sweeps 360 degrees, the arc 240 from -120; the threshold tick turns to its share', async ({ page }) => {
  await open(page);
  const read = '[style.getPropertyValue("--_from").trim(), style.getPropertyValue("--_sweep").trim()]';
  expect(await probe(page, '<div id="probe" class="ds-gauge"></div>', read)).toEqual(['0deg', '360deg']);
  expect(await probe(page, '<div id="probe" class="ds-gauge ds-gauge--arc"></div>', read)).toEqual(['-120deg', '240deg']);
  const rotate = await probe(page, '<div class="ds-gauge ds-gauge--arc" style="--ds-share: .3"><span id="probe" class="ds-gauge__threshold" style="--ds-share: .5"></span></div>', 'style.rotate');
  expect(rotate).toBe('0deg');
  const ringTick = await probe(page, '<div class="ds-gauge"><span id="probe" class="ds-gauge__threshold" style="--ds-share: .25"></span></div>', 'style.rotate');
  expect(ringTick).toBe('90deg');
});

test('tone: from the class on the gauge itself; an inherited tone changes nothing', async ({ page }) => {
  await open(page);
  // The private fill, resolved to a colour by a child that paints with it.
  const fill = '(() => { const c = document.createElement("i"); c.style.color = "var(--_fill)"; el.append(c); return getComputedStyle(c).color; })()';
  const own = await probe(page, '<div id="probe" class="ds-gauge ds-tone-error"></div>', `(${fill})`);
  const inherited = await probe(page, '<div class="ds-tone-error"><div id="probe" class="ds-gauge"></div></div>', `(${fill})`);
  const plain = await probe(page, '<div id="probe" class="ds-gauge"></div>', `(${fill})`);
  expect(inherited).toBe(plain);
  expect(own).not.toBe(plain);
  expect(own).toBe(await colour(page, 'var(--ds-chart-error)'));
});

test('a linear threshold mark sits at its own share, across the track; a segmented meter is masked into its parts', async ({ page }) => {
  await open(page);
  const offset = await probe(page, '<span class="ds-meter" style="--ds-share: .3; inline-size: 400px"><span id="probe" class="ds-meter__threshold" style="--ds-share: .8"></span></span>',
    '[el.getBoundingClientRect().left + 1 - el.parentElement.getBoundingClientRect().left, el.getBoundingClientRect().height - el.parentElement.getBoundingClientRect().height]');
  expect(offset).toEqual([320, 6]);
  const mask = await probe(page, '<span id="probe" class="ds-meter ds-meter--segmented" style="--ds-share: .6"></span>', 'style.maskImage || style.webkitMaskImage');
  expect(mask).toContain('repeating-linear-gradient');
  expect(await probe(page, '<span class="ds-meter ds-meter--segmented"><span id="probe" class="ds-meter__threshold" style="--ds-share: .5"></span></span>', 'style.display')).toBe('none');
});

test('the share glides on the value curve; the demo\'s meters have names and values in words', async ({ page }) => {
  await open(page);
  const transition = await probe(page, '<div id="probe" class="ds-gauge"></div>', '[style.transitionProperty, style.transitionTimingFunction]');
  expect(transition[0]).toBe('--ds-share');
  for (const meter of await page.locator('#fx-component [role="meter"]').all()) {
    await expect(meter).toHaveAttribute('aria-valuetext', /\S/);
    await expect(meter).toHaveAccessibleName(/\S/);
  }
  await expect(page.locator('#fx-component .ds-gauge__value[aria-hidden="true"]').first()).toBeAttached();
  // New values: the share and the value text change together.
  const gauge = page.locator('#fx-component [data-demo="gauge"]').first();
  await page.locator('#fx-component [data-demo="shuffle"]').click();
  const now = await gauge.getAttribute('aria-valuenow');
  await expect(gauge).toHaveAttribute('aria-valuetext', `${now}%`);
  expect(await gauge.evaluate((el) => el.style.getPropertyValue('--ds-share'))).toBe(String(Number(now) / 100));
});

test('a bar gauge: label and figure on a row, the track under them at 12px plus 2px per step; zones from its shares', async ({ page }) => {
  await open(page);
  const html = (cls) => `<div class="${cls}"><div id="probe" class="ds-bar-gauge" role="meter" aria-label="x" style="--ds-share: .5; --ds-bar-gauge-warning: .7; --ds-bar-gauge-error: .9"><span class="ds-bar-gauge__label">Memory</span><span class="ds-bar-gauge__value">50%</span><span class="ds-bar-gauge__track"></span></div></div>`;
  for (const [size, step] of SIZES) {
    expect(await probe(page, html(size), 'el.querySelector(".ds-bar-gauge__track").getBoundingClientRect().height'), size).toBe(12 + step * 2);
  }
  const rows = await probe(page, html(''), '(() => { const [l, v, t] = [...el.children].map((c) => c.getBoundingClientRect()); return [Math.round(l.top) === Math.round(v.top), t.top >= l.bottom, Math.round(t.width) === Math.round(el.getBoundingClientRect().width)]; })()');
  expect(rows).toEqual([true, true, true]);
  const zones = await probe(page, html(''), 'getComputedStyle(el.querySelector(".ds-bar-gauge__track")).backgroundImage');
  expect(zones).toContain('linear-gradient');
  const [warning, error] = [await colour(page, 'var(--ds-chart-warning)'), await colour(page, 'var(--ds-chart-error)')];
  expect(zones).toContain(warning);
  expect(zones).toContain(error);
  // Density: the gap between the rows, 1px per step.
  const gap = (cls) => probe(page, html(cls), 'parseFloat(style.rowGap)');
  expect(await gap('')).toBe(4);
  expect(await gap('ds-density-dense')).toBe(2);
});

test('a bar gauge in a narrow card: the label ends in an ellipsis, the figure stays whole (360px)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const narrow = page.locator('#fx-component .ds-bar-gauge').last();
  const fits = await narrow.evaluate((el) => {
    const label = el.querySelector('.ds-bar-gauge__label');
    const value = el.querySelector('.ds-bar-gauge__value');
    return [label.scrollWidth > label.clientWidth, value.scrollWidth <= value.clientWidth, el.getBoundingClientRect().right <= document.documentElement.clientWidth];
  });
  expect(fits).toEqual([true, true, true]);
});

test('forced colours: the fill in CanvasText, the marks CanvasText, a bar gauge\'s zones hatched', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const ring = await probe(page, '<div id="probe" class="ds-gauge ds-tone-error" style="--ds-share: .5"></div>', '[getComputedStyle(el, "::before").backgroundImage, getComputedStyle(el, "::before").forcedColorAdjust]');
  expect(ring[1]).toBe('none');
  expect(ring[0]).toContain('conic-gradient');
  const mark = await probe(page, '<span class="ds-meter"><span id="probe" class="ds-meter__threshold" style="--ds-share: .5"></span></span>', 'style.backgroundColor');
  expect(mark).toBe(await colour(page, 'CanvasText'));
  const track = await probe(page, '<div class="ds-bar-gauge" style="--ds-share: .5; --ds-bar-gauge-warning: .7"><span id="probe" class="ds-bar-gauge__track"></span></div>', 'style.backgroundImage');
  expect(track).toContain('repeating-linear-gradient(45deg');
  expect(track).toContain('repeating-linear-gradient(135deg');
});
