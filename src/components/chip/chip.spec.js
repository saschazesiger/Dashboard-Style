/**
 * Chips on the options model (3.0): the height at every size x density, with
 * and without .ds-touch; side padding, check and type by size; the shape; the
 * tone on the chip itself (with a word, an inherited one ignored); keyboard,
 * names and forced colours. Toggle, wrap glide and removal stay in
 * controls.spec.js and regressions.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=chip');
  await ready(page);
  await page.mouse.move(1, 1);
}

const add = (page, html) => page.evaluate((markup) => {
  const host = document.createElement('div');
  host.id = 'fx-added';
  host.insertAdjacentHTML('beforeend', markup);
  document.querySelector('#fx-component').prepend(host);
}, html);

const check = '<svg class="ds-chip__check" width="18" height="18" aria-hidden="true"></svg>';
const filter = (attrs = '', cls = '', id = '') => `<label class="ds-chip ${cls}"${id ? ` id="${id}"` : ''}><input class="ds-chip__input" type="checkbox" ${attrs}><span class="ds-chip__body">${check}<span>Active</span></span></label>`;
const action = (attrs = '', cls = '', id = '') => `<button class="ds-chip ${cls}" type="button"${id ? ` id="${id}"` : ''} ${attrs}><span class="ds-chip__body"><span class="ds-chip__label">Only mine</span></span></button>`;

const body = (page, selector) => page.$eval(`${selector} .ds-chip__body`, (el) => {
  const css = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return { height: rect.height, radius: parseFloat(css.borderTopLeftRadius), background: css.backgroundColor, color: css.color, border: css.borderTopColor, font: parseFloat(css.fontSize), padEnd: parseFloat(css.paddingInlineEnd), line: parseFloat(css.lineHeight) };
});

const role = (page, value) => page.evaluate((css) => {
  const probe = document.createElement('span');
  probe.style.color = css;
  document.querySelector('.ds-theme').append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}, value);

test('the height at every size x density, never below its line, and .ds-touch as a minimum', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities, html }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `ds-chips ${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = html;
          main.prepend(region);
          for (const chip of region.querySelectorAll('.ds-chip__body')) {
            out.push({ touch, density, size, height: chip.getBoundingClientRect().height, line: parseFloat(getComputedStyle(chip).lineHeight) });
          }
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES, html: filter() + action() });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2 * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    expect(entry.height, name).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 32 + step * 8 + density * 4, entry.line + 2), 0);
  }
});

test('the compact theme: a chip is its density\'s 24px', async ({ page }) => {
  await open(page);
  await page.addStyleTag({ url: '/dist/themes/compact.css' });
  await add(page, filter('', '', 'c-plain') + action('', '', 'c-action') + `<div class="ds-density-comfortable">${filter('', '', 'c-back')}</div>`);
  await expect.poll(async () => (await body(page, '#c-plain')).height).toBe(24);
  expect((await body(page, '#c-action')).height).toBe(24);
  expect((await body(page, '#c-back')).height).toBe(32);
});

test('the default chip is 32px; type, side padding and check follow size, not density', async ({ page }) => {
  await open(page);
  await add(page, SIZES.map(([size]) => filter('checked', size, `c-${size}`) + action('', size, `a-${size}`)).join('') + filter('', 'ds-density-tight', 'tight') + filter('', '', 'plain'));
  await settle(page);
  expect((await body(page, '#plain')).height).toBe(32);
  const fonts = [];
  const pads = [];
  const checks = [];
  for (const [size] of SIZES) {
    const read = await body(page, `#c-${size}`);
    fonts.push(read.font);
    pads.push(read.padEnd);
    checks.push(await page.$eval(`#c-${size} .ds-chip__check`, (el) => el.getBoundingClientRect().width));
  }
  expect(fonts).toEqual([12, 14, 14, 16, 16]);
  expect(pads).toEqual([8, 12, 16, 20, 24]);
  expect(checks).toEqual([14, 16, 18, 20, 22]);
  expect((await body(page, '#tight')).padEnd).toBe((await body(page, '#plain')).padEnd);
  // The check stays in the room its slot opens.
  const room = await page.$eval('#c-ds-lg .ds-chip__body', (el) => parseFloat(getComputedStyle(el, '::after').width));
  expect(room).toBe(20);
});

test('shape: the radius times the shape, at most half the height; the glide backing follows', async ({ page }) => {
  await open(page);
  await add(page, ['square', 'soft', 'default', 'round'].map((shape) => `<div class="ds-shape-${shape}">${filter('', '', `s-${shape}`)}${action('', '', `sa-${shape}`)}</div>`).join(''));
  const base = (await body(page, '#s-default')).radius;
  expect(base).toBeGreaterThan(0);
  expect((await body(page, '#s-square')).radius).toBe(0);
  expect((await body(page, '#s-soft')).radius).toBeCloseTo(base / 2, 1);
  expect((await body(page, '#s-round')).radius).toBeCloseTo(base * 1.5, 1);
  expect((await body(page, '#sa-square')).radius).toBe(0);
  expect(await page.$eval('#sa-square', (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBe(0);
});

test('tone: a selected, an input and an action chip take it from their own class; a resting filter and an inherited tone do not', async ({ page }) => {
  await open(page);
  await add(page, filter('checked', 'ds-tone-error', 't-on') + filter('', 'ds-tone-error', 't-rest')
    + `<button class="ds-chip ds-chip--input ds-tone-warning" id="t-input" type="button"><span class="ds-chip__body"><span class="ds-chip__label">Laptops</span></span></button>`
    + action('', 'ds-tone-success', 't-action') + action('disabled', 'ds-tone-success', 't-off')
    + `<div class="ds-tone-error">${filter('checked', '', 't-in')}${action('', '', 't-in-a')}</div>`);
  await settle(page);
  const colours = {
    errorBox: await role(page, 'var(--ds-error-container)'), onError: await role(page, 'var(--ds-on-error-container)'),
    warningBox: await role(page, 'var(--ds-warning-container)'), onWarning: await role(page, 'var(--ds-on-warning-container)'),
    successBox: await role(page, 'var(--ds-success-container)'), onSuccess: await role(page, 'var(--ds-on-success-container)'),
    accent: await role(page, 'var(--ds-accent)'), onAccent: await role(page, 'var(--ds-on-accent)'),
  };
  expect(await body(page, '#t-on')).toMatchObject({ background: colours.errorBox, color: colours.onError });
  const rest = await body(page, '#t-rest');
  expect(rest.background).toBe('rgba(0, 0, 0, 0)');
  expect(await body(page, '#t-input')).toMatchObject({ background: colours.warningBox, color: colours.onWarning });
  expect(await body(page, '#t-action')).toMatchObject({ background: colours.successBox, color: colours.onSuccess });
  // A blocked chip keeps the disabled model, whatever its tone.
  expect((await body(page, '#t-off')).background).toBe('rgba(0, 0, 0, 0)');
  // An inherited tone changes nothing.
  expect(await body(page, '#t-in')).toMatchObject({ background: colours.accent, color: colours.onAccent });
  expect((await body(page, '#t-in-a')).background).toBe('rgba(0, 0, 0, 0)');
  // The word stays: never the colour alone.
  expect((await page.locator('#t-on').textContent()).trim()).toBe('Active');
  await page.locator('#t-on').click();
  await expect(page.locator('#t-on input')).not.toBeChecked();
});

test('keyboard and names: Tab reaches a chip, Space toggles a filter, Enter presses an action, a blocked one ignores both', async ({ page }) => {
  await open(page);
  await add(page, '<fieldset class="ds-chips" id="row"><legend class="ds-sr">Status</legend>' + filter('id="k1" aria-label="Active"') + filter('id="k2" aria-disabled="true" aria-label="Blocked"') + '</fieldset>' + action('id="k3"'));
  await page.locator('#k1').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#k1')).toBeChecked();
  // The ring on the body, solid from the first frame.
  expect(await page.$eval('#k1', (input) => input.matches(':focus-visible') && getComputedStyle(input.nextElementSibling).outlineStyle)).toBe('solid');
  await page.keyboard.press('Tab');
  await expect(page.locator('#k2')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('#k2')).not.toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.locator('#k3')).toBeFocused();
  let clicks = 0;
  await page.exposeFunction('countClick', () => { clicks += 1; });
  await page.$eval('#k3', (el) => el.addEventListener('click', () => window.countClick()));
  await page.keyboard.press('Enter');
  await expect.poll(() => clicks).toBe(1);
  await expect(page.locator('#fx-added').getByRole('group', { name: 'Status' })).toHaveCount(1);
});

test('the input chips of the demo remove themselves through flip; a chip row without chips takes no room', async ({ page }) => {
  await open(page);
  const row = page.locator('[data-demo="input-chips"]');
  await expect(row.locator('.ds-chip--input')).toHaveCount(3);
  await row.locator('.ds-chip--input').first().click();
  await expect(row.locator('.ds-chip--input')).toHaveCount(2);
  await add(page, '<div class="ds-chips" id="empty"></div>');
  expect(await page.$eval('#empty', (el) => getComputedStyle(el).display)).toBe('none');
});

test('forced colours: a selected chip in the selection colours, a toned action chip with a real edge, a blocked one GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, filter('checked', 'ds-tone-error', 'f-on') + action('', 'ds-tone-success', 'f-action') + filter('disabled', '', 'f-off'));
  await settle(page);
  const system = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    return { highlight: probe('backgroundColor', 'Highlight'), highlightText: probe('color', 'HighlightText'), gray: probe('color', 'GrayText'), text: probe('borderTopColor', 'CanvasText') };
  });
  expect(await body(page, '#f-on')).toMatchObject({ background: system.highlight, color: system.highlightText });
  expect((await body(page, '#f-action')).border).toBe(system.text);
  expect((await body(page, '#f-off')).color).toBe(system.gray);
});
