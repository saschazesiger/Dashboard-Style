/**
 * The switch on the options model (3.0): track and row at every size x density,
 * with and without .ds-touch; the handle's travel and the shape; icons; busy
 * (blocked through the guard, the delayed spinner); keyboard, names and forced
 * colours. The 2.x behaviour stays in controls.spec.js and controls-2.spec.js.
 * Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=switch');
  await ready(page);
  await page.mouse.move(1, 1);
}

const add = (page, html) => page.evaluate((markup) => {
  const host = document.createElement('div');
  host.id = 'fx-added';
  host.insertAdjacentHTML('beforeend', markup);
  document.querySelector('#fx-component').prepend(host);
}, html);

const row = (attrs = '', cls = '', track = '', id = '') => `<label class="ds-switch ${cls}"${id ? ` id="${id}"` : ''}><input type="checkbox" role="switch" ${attrs}><span class="ds-switch__track" aria-hidden="true">${track}</span><span class="ds-switch__label">Nightly sync</span></label>`;

const role = (page, value) => page.evaluate((css) => {
  const probe = document.createElement('span');
  probe.style.color = css;
  document.querySelector('.ds-theme').append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}, value);

test('track and row at every size x density, and .ds-touch as a minimum', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities, html }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = html;
          main.prepend(region);
          const track = region.querySelector('.ds-switch__track').getBoundingClientRect();
          const input = region.querySelector('input').getBoundingClientRect();
          const before = getComputedStyle(region.querySelector('.ds-switch__track'), '::before');
          out.push({
            touch, density, size,
            row: region.querySelector('.ds-switch').getBoundingClientRect().height,
            track: [track.width, track.height], input: [input.width, input.height],
            halo: parseFloat(before.width), base: parseFloat(getComputedStyle(region).getPropertyValue('--ds-switch-height')) || 40,
            haloBase: parseFloat(getComputedStyle(region).getPropertyValue('--ds-switch-halo')) || 40,
            line: parseFloat(getComputedStyle(region.querySelector('.ds-switch')).lineHeight),
          });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES, html: row() });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    // The track: 4px per size step, width 13 : 8, density and touch leave it alone.
    const track = 32 + step * 4;
    expect(entry.track[1], `${name} track`).toBeCloseTo(track, 0);
    expect(entry.track[0], `${name} track width`).toBeCloseTo(track * 13 / 8, 0);
    // The input stays the hit target over the track.
    expect(entry.input[1], `${name} input`).toBeCloseTo(track, 0);
    expect(entry.input[0], `${name} input width`).toBeCloseTo(track * 13 / 8, 0);
    // The row: 8px per size step, 4px per density step; never below the track or the line; touch at least 48px.
    const expected = Math.max(entry.touch ? TOUCH : 0, entry.base + step * 8 + density * 4, track, entry.line);
    expect(entry.row, name).toBeCloseTo(expected, 0);
    // The halo: size only.
    expect(entry.halo, `${name} halo`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, entry.haloBase + step * 8), 0);
  }
});

test('the handle fits its track at every size and travels to the end; never above its box', async ({ page }) => {
  await open(page);
  await add(page, SIZES.map(([size]) => row('checked', size, '', `h-${size}`) + row('', size, '', `o-${size}`)).join(''));
  await settle(page);
  for (const [size, step] of SIZES) {
    const on = await page.$eval(`#h-${size} .ds-switch__track`, (el) => {
      const css = getComputedStyle(el, '::after');
      return { box: parseFloat(css.width), scale: Number(new Function(`return ${css.scale.replace(/\s/g, '') || 1}`)()), translate: parseFloat(css.translate) };
    });
    const track = 32 + step * 4;
    expect(on.box, `${size} box`).toBeCloseTo(track - 4, 0);
    expect(on.translate, `${size} travel`).toBeCloseTo(track * 13 / 8 - track, 0);
    // Rendered on: 6/7 of the box, centred; its end stays inside the padding box.
    expect(on.scale).toBeCloseTo(6 / 7, 2);
    expect(on.translate + on.box, `${size} inside`).toBeLessThanOrEqual(track * 13 / 8 - 4 + 0.5);
  }
});

test('shape: square corners at 0, the pill at the default; the halo stays round', async ({ page }) => {
  await open(page);
  await add(page, ['square', 'soft', 'default', 'round'].map((shape) => `<div class="ds-shape-${shape}">${row('', '', '', `s-${shape}`)}</div>`).join(''));
  const radii = {};
  for (const shape of ['square', 'soft', 'default', 'round']) {
    radii[shape] = await page.$eval(`#s-${shape} .ds-switch__track`, (el) => ({ track: parseFloat(getComputedStyle(el).borderTopLeftRadius), handle: parseFloat(getComputedStyle(el, '::after').borderTopLeftRadius), halo: getComputedStyle(el, '::before').borderTopLeftRadius }));
  }
  expect(radii.square).toEqual({ track: 0, handle: 0, halo: '50%' });
  expect(radii.soft).toEqual({ track: 8, handle: 7, halo: '50%' });
  expect(radii.default).toEqual({ track: 16, handle: 14, halo: '50%' });
  expect(radii.round).toEqual({ track: 16, handle: 14, halo: '50%' });
});

test('.ds-switch--icons: one glyph per state, both handles at 24px, the glyph in the handle centre', async ({ page }) => {
  await open(page);
  const icons = '<svg class="ds-switch__icon ds-switch__icon--off" width="16" height="16" aria-hidden="true"></svg><svg class="ds-switch__icon ds-switch__icon--on" width="16" height="16" aria-hidden="true"></svg>';
  await add(page, row('id="on" checked', 'ds-switch--icons', icons) + row('id="off"', 'ds-switch--icons', icons) + row('id="lg" checked', 'ds-switch--icons ds-lg', icons));
  await settle(page);
  const read = (id) => page.$eval(`#${id}`, (input) => {
    const track = input.nextElementSibling;
    const on = track.querySelector('.ds-switch__icon--on');
    const off = track.querySelector('.ds-switch__icon--off');
    const handle = getComputedStyle(track, '::after');
    return { on: getComputedStyle(on).opacity, off: getComputedStyle(off).opacity, scale: handle.scale, box: parseFloat(handle.width), onSize: on.getBoundingClientRect().width, translate: parseFloat(getComputedStyle(on).translate) || 0 };
  });
  const on = await read('on');
  const off = await read('off');
  expect([on.on, on.off]).toEqual(['1', '0']);
  expect([off.on, off.off]).toEqual(['0', '1']);
  expect(off.scale.replace(/\s/g, '')).toBe(on.scale.replace(/\s/g, ''));
  expect(parseFloat(on.scale)).toBeCloseTo(6 / 7, 2);
  expect(on.onSize).toBeCloseTo(16, 0);
  expect(on.translate).toBeCloseTo(20, 0);
  // The glyph grows with the size.
  expect((await read('lg')).onSize).toBeCloseTo(32 * 4 / 7, 0);
  // A toggle swaps them.
  await page.locator('#off').check({ force: true });
  await settle(page);
  expect((await read('off')).on).toBe('1');
});

test('busy: blocked through aria-disabled, full strength, focusable; the spinner waits, a fast answer shows nothing', async ({ page }) => {
  await open(page);
  const spinner = '<span class="ds-spinner ds-switch__spinner"></span>';
  await add(page, row('id="b" checked aria-busy="true" aria-disabled="true"', '', spinner) + row('id="b-off" aria-busy="true" aria-disabled="true"', '', spinner) + row('id="b-rest"', '', spinner) + row('id="disabled" aria-disabled="true"'));
  await settle(page);
  const primary = await role(page, 'var(--ds-primary)');
  const read = (id) => page.$eval(`#${id}`, (input) => {
    const track = input.nextElementSibling;
    const css = getComputedStyle(track);
    const label = input.closest('.ds-switch').querySelector('.ds-switch__label');
    const spin = track.querySelector('.ds-switch__spinner');
    return { background: css.backgroundColor, opacity: css.opacity, cursor: getComputedStyle(input.closest('.ds-switch')).cursor, label: getComputedStyle(label).color, visible: spin ? getComputedStyle(spin).visibility : null, spinOpacity: spin ? getComputedStyle(spin).opacity : null, scale: getComputedStyle(track, '::after').scale, translate: spin ? parseFloat(getComputedStyle(spin).translate) || 0 : 0 };
  });
  // Waiting: on keeps its full strength, unlike a plain blocked switch; the cursor says progress.
  const busy = await read('b');
  expect(busy.background).toBe(primary);
  expect(busy.opacity).toBe('1');
  expect(busy.cursor).toBe('progress');
  expect(busy.visible).toBe('visible');
  expect(busy.spinOpacity).toBe('1');
  expect(busy.translate).toBeCloseTo(20, 0);
  expect(parseFloat((await read('b-off')).scale)).toBeCloseTo(6 / 7, 2);
  expect((await read('disabled')).cursor).toBe('not-allowed');
  // Not waiting: the spinner is hidden, so its loop does not paint.
  expect((await read('b-rest')).visible).toBe('hidden');
  // Blocked for every input; the focus stays.
  await page.focus('#b');
  await expect(page.locator('#b')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('#b')).toBeChecked();
  // force: Playwright itself refuses a label whose control is aria-disabled; the guard is what is tested.
  await page.locator('.ds-switch:has(#b) .ds-switch__label').click({ force: true });
  await expect(page.locator('#b')).toBeChecked();
  // A fast answer: the spinner's fade has not started before the delay is over.
  const delayed = await page.$eval('#b-rest', (input) => {
    const spin = input.nextElementSibling.querySelector('.ds-switch__spinner');
    input.setAttribute('aria-busy', 'true');
    input.setAttribute('aria-disabled', 'true');
    const opacity = spin.getAnimations().filter((animation) => animation.transitionProperty === 'opacity')[0];
    const delay = opacity ? opacity.effect.getComputedTiming().delay : null;
    const shown = getComputedStyle(spin).opacity;
    input.removeAttribute('aria-busy');
    input.removeAttribute('aria-disabled');
    return { delay, shown };
  });
  expect(delayed.delay).toBeGreaterThan(0);
  expect(parseFloat(delayed.shown)).toBeLessThan(0.05);
});

test('keyboard and names: Tab reaches a switch, Space toggles it, its name comes from its label, the track and word are hidden', async ({ page }) => {
  await open(page);
  await add(page, row('id="k1"') + row('id="k2" aria-disabled="true"') + '<button class="ds-btn" id="k3" type="button">After</button>');
  await page.locator('#k1').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#k1')).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.locator('#k2')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('#k2')).not.toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.locator('#k3')).toBeFocused();
  await expect(page.locator('#fx-added').getByRole('switch', { name: 'Nightly sync' })).toHaveCount(2);
  expect(await page.$eval('#k1', (input) => input.nextElementSibling.getAttribute('aria-hidden'))).toBe('true');
});

test('a list row follows size, density and touch', async ({ page }) => {
  await open(page);
  const list = (cls, id) => `<div class="ds-switch-list ${cls}" id="${id}">${row()}</div>`;
  await add(page, list('', 'l-base') + list('ds-density-dense', 'l-dense') + list('ds-density-tight ds-touch', 'l-touch') + list('ds-lg', 'l-lg'));
  const height = (id) => page.$eval(`#${id} .ds-switch`, (el) => el.getBoundingClientRect().height);
  expect(await height('l-base')).toBe(56);
  expect(await height('l-dense')).toBe(48);
  expect(await height('l-lg')).toBe(64);
  expect(await height('l-touch')).toBeGreaterThanOrEqual(TOUCH);
});

test('forced colours: on and off in system colours; a busy switch keeps them, a blocked one turns GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const spinner = '<span class="ds-spinner ds-switch__spinner"></span>';
  const icons = '<svg class="ds-switch__icon ds-switch__icon--off" width="16" height="16" aria-hidden="true"></svg><svg class="ds-switch__icon ds-switch__icon--on" width="16" height="16" aria-hidden="true"></svg>';
  await add(page, row('id="f-on" checked') + row('id="f-busy" checked aria-busy="true" aria-disabled="true"', '', spinner) + row('id="f-off" aria-busy="true" aria-disabled="true"', '', spinner) + row('id="f-blocked" aria-disabled="true" checked') + row('id="f-icons" checked', 'ds-switch--icons', icons));
  await settle(page);
  const system = await page.evaluate(() => {
    const probe = (value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style.backgroundColor = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el).backgroundColor;
      el.remove();
      return colour;
    };
    return { highlight: probe('Highlight'), gray: probe('GrayText'), canvas: probe('Canvas') };
  });
  const track = (id) => page.$eval(`#${id}`, (input) => getComputedStyle(input.nextElementSibling).backgroundColor);
  expect(await track('f-on')).toBe(system.highlight);
  expect(await track('f-busy')).toBe(system.highlight);
  expect(await track('f-off')).toBe(system.canvas);
  expect(await track('f-blocked')).toBe(system.gray);
  // The icon takes the track's colour on the handle.
  const icon = await page.$eval('#f-icons', (input) => getComputedStyle(input.nextElementSibling.querySelector('.ds-switch__icon--on')).color);
  expect(icon).toBe(system.highlight);
});
