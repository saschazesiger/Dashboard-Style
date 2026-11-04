/**
 * The slider on the options model (3.0): its height, handle and track at every
 * size x density, with and without .ds-touch; the shape; keyboard, names and
 * forced colours. Its press and focus timelines stay in controls-2.spec.js.
 * Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=slider');
  await ready(page);
  await page.mouse.move(1, 1);
}

const add = (page, html) => page.evaluate((markup) => {
  const host = document.createElement('div');
  host.id = 'fx-added';
  host.insertAdjacentHTML('beforeend', markup);
  document.querySelector('#fx-component').prepend(host);
}, html);

/**
 * The engine's thumb has no computed style a page can read, so a private value
 * it draws from (`width: var(--_thumb)`, tested below by its rule) resolves on
 * a probe beside the input.
 */
const resolved = (input, name) => {
  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.width = getComputedStyle(input).getPropertyValue(name);
  input.parentElement.append(probe);
  const width = parseFloat(getComputedStyle(probe).width);
  probe.remove();
  return width;
};

test('the height at every size x density, and .ds-touch as a minimum; the handle by size alone', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities, resolvedSource }) => {
    const resolve = new Function(`return (${resolvedSource})`)();
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<input class="ds-slider" type="range" aria-label="Value" value="50">';
          main.prepend(region);
          const input = region.querySelector('input');
          out.push({ touch, density, size, height: input.getBoundingClientRect().height, thumb: resolve(input, '--_thumb'), track: resolve(input, '--_track'), spread: resolve(input, '--_spread') });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES, resolvedSource: resolved.toString() });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    expect(entry.height, name).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 40 + step * 8 + density * 4), 0);
    expect(entry.thumb, `${name} handle`).toBeCloseTo(20 + step * 4, 0);
    expect(entry.track, `${name} track`).toBeCloseTo(4 + step, 0);
    // The halo fills the height around the handle.
    expect(entry.spread * 2 + entry.thumb, `${name} halo`).toBeCloseTo(entry.height, 0);
  }
});

test('shape: the handle and the track square at 0, round at the default', async ({ page }) => {
  await open(page);
  await add(page, ['square', 'soft', 'default', 'round'].map((shape) => `<div class="ds-shape-${shape}"><input class="ds-slider" id="s-${shape}" type="range" aria-label="Value" value="50"></div>`).join(''));
  const radius = (id) => page.$eval(`#${id}`, (el, source) => new Function(`return (${source})`)()(el, '--_thumb-radius'), resolved.toString());
  expect(await radius('s-square')).toBe(0);
  expect(await radius('s-soft')).toBe(5);
  expect(await radius('s-default')).toBe(10);
  expect(await radius('s-round')).toBe(10);
});

test('keyboard and names: Tab reaches it, the arrows, Home and End move it, a disabled one is skipped, its label names it', async ({ page }) => {
  await open(page);
  await add(page, '<label class="ds-field__label" for="k1">Keep history for</label><input class="ds-slider" id="k1" type="range" min="0" max="100" value="50"><input class="ds-slider" id="k2" type="range" aria-label="Off" disabled><button class="ds-btn" id="k3" type="button">After</button>');
  await page.locator('#k1').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#k1')).toHaveValue('51');
  await page.keyboard.press('Home');
  await expect(page.locator('#k1')).toHaveValue('0');
  await page.keyboard.press('End');
  await expect(page.locator('#k1')).toHaveValue('100');
  await page.keyboard.press('Tab');
  await expect(page.locator('#k3')).toBeFocused();
  await expect(page.locator('#fx-added').getByRole('slider', { name: 'Keep history for' })).toHaveCount(1);
});

test('the demo keeps its output in step with the value', async ({ page }) => {
  await open(page);
  const slider = page.locator('[data-demo="value"] .ds-slider');
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(page.locator('[data-demo="value"] .ds-slider__value')).toHaveText('7 days');
  expect(await slider.evaluate((el) => el.style.getPropertyValue('--ds-share'))).toBe('0');
});

test('forced colours: the handle in Highlight, GrayText when blocked', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, '<input class="ds-slider" id="f1" type="range" aria-label="On"><input class="ds-slider" id="f2" type="range" aria-label="Off" disabled>');
  const system = await page.evaluate(() => {
    const probe = (value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style.color = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el).color;
      el.remove();
      return colour;
    };
    return { highlight: probe('Highlight'), gray: probe('GrayText') };
  });
  const colour = (id) => page.$eval(`#${id}`, (el) => getComputedStyle(el).color);
  expect(await colour('f1')).toBe(system.highlight);
  expect(await colour('f2')).toBe(system.gray);
});
