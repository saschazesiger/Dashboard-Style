/**
 * The date field (3.0): typing part by part in the locale's order (digits
 * move on, a separator moves on, a short year), the spinbutton keys, clearing,
 * paste, ds:change and validity (min, a range in order), the hour cycle and
 * the day period, the zone hint, a hidden input in a form, names and roles,
 * disabled and read-only, the box at every size x density with .ds-touch as a
 * minimum, and forced colours. Runs on the generated fixture of the demo,
 * with fields of its own mounted on it, at a fixed date (2026-11-04), and in
 * the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

test.use({ locale: 'en-US', timezoneId: 'UTC' });

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.clock.setFixedTime(new Date('2026-11-04T10:00:00Z'));
  await page.goto('/test/browser/fixtures/component.html?c=datefield');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Mounts a field of its own (attributes as text) under a label, and returns its locator. */
async function mount(page, attrs, wrap = '') {
  await page.evaluate(({ html, wrap }) => {
    const host = document.createElement(wrap || 'div');
    host.id = 'fx-mine';
    host.innerHTML = html;
    document.querySelector('#fx-component').prepend(host);
    window.DS.init(host);
    window.fxEvents = [];
    host.addEventListener('ds:change', (event) => window.fxEvents.push(event.detail));
  }, { html: `<span id="fx-label">Due date</span><div class="ds-datefield" role="group" aria-labelledby="fx-label" data-ds-datefield ${attrs}></div>`, wrap });
  return page.locator('#fx-mine .ds-datefield');
}

const segment = (field, key) => field.locator(`.ds-datefield__segment[data-segment="${key}"]`);
const focusedKey = (page) => page.evaluate(() => document.activeElement?.getAttribute('data-segment') ?? null);
const events = (page) => page.evaluate(() => window.fxEvents);
const value = (field) => field.evaluate((el) => window.DS.datefield.create(el).get());

test('typing: the parts in the locale\'s order, digits move on, the value and ds:change once it is whole', async ({ page }) => {
  await open(page);
  const field = await mount(page, '');
  const order = await field.locator('.ds-datefield__segment').evaluateAll((items) => items.map((item) => item.getAttribute('data-segment')));
  expect(order).toEqual(['month', 'day', 'year']);
  await expect(field.locator('.ds-datefield__literal').first()).toHaveText('/');
  await expect(segment(field, 'month')).toHaveText('mm');
  await expect(segment(field, 'month')).toHaveAttribute('data-placeholder', '');
  await segment(field, 'month').click();
  // "1" could be 10-12: it waits; "1" then "2" is 12 and moves on. "4" cannot take a digit more.
  await page.keyboard.type('1');
  expect(await focusedKey(page)).toBe('month');
  await page.keyboard.type('2');
  expect(await focusedKey(page)).toBe('day');
  await page.keyboard.type('4');
  expect(await focusedKey(page)).toBe('year');
  expect(await events(page)).toEqual([]);
  await page.keyboard.type('2027');
  expect(await value(field)).toBe('2027-12-04');
  expect(await events(page)).toEqual([{ value: '2027-12-04', valid: true }]);
  await expect(segment(field, 'month')).toHaveText('12');
  await expect(segment(field, 'month')).toHaveAttribute('aria-valuetext', '12 – December');
  // A separator moves on; a two-digit year is this century's once the part is left.
  await segment(field, 'month').click();
  await page.keyboard.type('3/');
  expect(await focusedKey(page)).toBe('day');
  await page.keyboard.type('15');
  await page.keyboard.type('27');
  await page.keyboard.press('ArrowLeft');
  expect(await value(field)).toBe('2027-03-15');
});

test('the spinbutton keys: step and wrap, bigger steps, the ends, clear and go back, move between parts', async ({ page }) => {
  await open(page);
  const field = await mount(page, 'data-ds-value="2026-11-30"');
  await segment(field, 'month').focus();
  await page.keyboard.press('ArrowUp');
  expect(await value(field)).toBe('2026-12-30');
  await page.keyboard.press('ArrowUp');
  expect(await value(field)).toBe('2026-01-30');
  await page.keyboard.press('ArrowUp');
  // February has no 30th: the day becomes its last.
  expect(await value(field)).toBe('2026-02-28');
  await page.keyboard.press('PageUp');
  expect(await value(field)).toBe('2026-05-28');
  await page.keyboard.press('End');
  expect(await value(field)).toBe('2026-12-28');
  await page.keyboard.press('Home');
  expect(await value(field)).toBe('2026-01-28');
  await page.keyboard.press('ArrowRight');
  expect(await focusedKey(page)).toBe('day');
  await page.keyboard.press('PageDown');
  expect(await value(field)).toBe('2026-01-21');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  expect(await value(field)).toBe('2025-01-21');
  // Backspace clears the part (the value goes), and on an empty part goes back.
  await page.keyboard.press('Backspace');
  expect(await value(field)).toBe('');
  expect(await focusedKey(page)).toBe('year');
  expect(await events(page)).toContainEqual({ value: '', valid: false });
  await page.keyboard.press('Backspace');
  expect(await focusedKey(page)).toBe('day');
  // An empty part steps from today's.
  await segment(field, 'year').focus();
  await page.keyboard.press('ArrowUp');
  expect(await value(field)).toBe('2026-01-21');
});

test('paste fills every part; a click on the box or the label focuses the first empty part', async ({ page }) => {
  await open(page);
  const field = await mount(page, '');
  await segment(field, 'day').focus();
  await page.evaluate(() => {
    // A paste as the engine sends it, with its clipboard data (Firefox takes none in the constructor).
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => '2026-12-24' } });
    document.activeElement.dispatchEvent(event);
  });
  expect(await value(field)).toBe('2026-12-24');
  await page.evaluate(() => window.DS.datefield.create(document.querySelector('#fx-mine .ds-datefield')).set('2026-12-24'));
  await segment(field, 'day').focus();
  await page.keyboard.press('Backspace');
  await page.locator('#fx-label').click();
  expect(await focusedKey(page)).toBe('day');
  await segment(field, 'year').focus();
  const box = await field.boundingBox();
  await page.mouse.click(box.x + box.width - 6, box.y + box.height / 2);
  expect(await focusedKey(page)).toBe('day');
});

test('validity: outside min, a range that ends before it starts and a half-typed value are aria-invalid', async ({ page }) => {
  await open(page);
  const field = await mount(page, 'data-ds-value="2025-12-31" data-ds-datefield-min="2026-01-01"');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(segment(field, 'year')).toHaveAttribute('aria-invalid', 'true');
  await segment(field, 'year').focus();
  await page.keyboard.press('ArrowUp');
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
  expect((await events(page)).at(-1)).toEqual({ value: '2026-12-31', valid: true });
  // A part cleared: invalid once focus leaves the field.
  await page.keyboard.press('Backspace');
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
  await page.locator('#fx-label').evaluate((el) => el.closest('#fx-mine').insertAdjacentHTML('beforeend', '<button id="fx-after" type="button">After</button>'));
  await page.locator('#fx-after').focus();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  // A range in the wrong order.
  await page.evaluate(() => document.querySelector('#fx-mine').remove());
  const range = await mount(page, 'data-ds-datefield-type="range" data-ds-value="2026-11-13/2026-11-02"');
  await expect(range).toHaveAttribute('aria-invalid', 'true');
  await expect(range.getByRole('group', { name: 'Start' })).toHaveCount(1);
  await expect(range.getByRole('group', { name: 'End' })).toHaveCount(1);
  await expect(range.locator('.ds-datefield__between')).toHaveAttribute('aria-hidden', 'true');
});

test('a changed option attribute keeps what was typed; a changed data-ds-value applies', async ({ page }) => {
  await open(page);
  const field = await mount(page, 'data-ds-value="2026-11-04"');
  await field.evaluate((el) => window.DS.datefield.create(el).set('2026-12-25'));
  // A min after it: the field turns invalid (the update ran) and keeps 2026-12-25, not the markup's 2026-11-04.
  await field.evaluate((el) => el.setAttribute('data-ds-datefield-min', '2027-01-01'));
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(await value(field)).toBe('2026-12-25');
  await field.evaluate((el) => el.setAttribute('data-ds-value', '2027-02-01'));
  await expect.poll(() => value(field)).toBe('2027-02-01');
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
});

test('time: the locale\'s hour cycle and its day period (a, p), or 24 hours; seconds', async ({ page }) => {
  await open(page);
  const field = await mount(page, 'data-ds-datefield-type="time" data-ds-value="21:45"');
  const order = await field.locator('.ds-datefield__segment').evaluateAll((items) => items.map((item) => item.getAttribute('data-segment')));
  expect(order).toEqual(['hour', 'minute', 'dayPeriod']);
  await expect(segment(field, 'hour')).toHaveText('09');
  await expect(segment(field, 'dayPeriod')).toHaveText('PM');
  await segment(field, 'dayPeriod').focus();
  await page.keyboard.type('a');
  expect(await value(field)).toBe('09:45');
  await segment(field, 'hour').focus();
  await page.keyboard.type('11');
  expect(await value(field)).toBe('11:45');
  await page.evaluate(() => document.querySelector('#fx-mine').remove());
  const h23 = await mount(page, 'data-ds-datefield-type="time" data-ds-datefield-hour-cycle="h23" data-ds-datefield-seconds data-ds-value="21:45:30"');
  const parts = await h23.locator('.ds-datefield__segment').evaluateAll((items) => items.map((item) => item.getAttribute('data-segment')));
  expect(parts).toEqual(['hour', 'minute', 'second']);
  await expect(segment(h23, 'hour')).toHaveAttribute('aria-valuemax', '23');
  expect(await value(h23)).toBe('21:45:30');
});

test('date and time: the zone at the end is the field\'s description; instant() reads the wall time in it', async ({ page }) => {
  await open(page);
  const field = await mount(page, 'data-ds-datefield-type="datetime" data-ds-datefield-zone="America/New_York" data-ds-value="2026-11-04T09:30"');
  const zone = field.locator('.ds-datefield__zone');
  await expect(zone).toHaveText('GMT-5');
  await expect(zone).toHaveAttribute('data-tip', 'Eastern Standard Time');
  expect((await field.getAttribute('aria-describedby')).split(' ')).toContain(await zone.getAttribute('id'));
  expect(await field.evaluate((el) => window.DS.datefield.create(el).instant().toISOString())).toBe('2026-11-04T14:30:00.000Z');
});

test('a name keeps a hidden input in step for a form', async ({ page }) => {
  await open(page);
  const field = await mount(page, 'data-ds-datefield-name="inspection" data-ds-value="2026-11-04"', 'form');
  expect(await page.evaluate(() => new FormData(document.querySelector('#fx-mine')).get('inspection'))).toBe('2026-11-04');
  await segment(field, 'day').focus();
  await page.keyboard.press('ArrowUp');
  expect(await page.evaluate(() => new FormData(document.querySelector('#fx-mine')).get('inspection'))).toBe('2026-11-05');
});

test('names and roles: a group named by its label, a spinbutton per part with its name, range and value text', async ({ page }) => {
  await open(page);
  const field = await mount(page, 'data-ds-value="2026-11-04"');
  await expect(page.getByRole('group', { name: 'Due date' })).toHaveCount(1);
  const month = field.getByRole('spinbutton', { name: 'month' });
  await expect(month).toHaveAttribute('aria-valuemin', '1');
  await expect(month).toHaveAttribute('aria-valuemax', '12');
  await expect(month).toHaveAttribute('aria-valuenow', '11');
  await expect(field.getByRole('spinbutton', { name: 'day' })).toHaveAttribute('aria-valuemax', '30');
  await expect(field.getByRole('spinbutton', { name: 'year' })).toHaveAttribute('aria-valuenow', '2026');
  await expect(month).toHaveAttribute('inputmode', 'numeric');
  await page.evaluate(() => window.DS.datefield.create(document.querySelector('#fx-mine .ds-datefield')).set(''));
  await expect(month).toHaveAttribute('aria-valuetext', 'Empty');
  await expect(month).not.toHaveAttribute('aria-valuenow', /.*/);
});

test('disabled: no part takes focus; read-only: focusable, nothing changes', async ({ page }) => {
  await open(page);
  const field = await mount(page, 'aria-disabled="true" data-ds-value="2026-11-04"');
  await expect(segment(field, 'day')).toHaveAttribute('tabindex', '-1');
  await expect(segment(field, 'day')).toHaveAttribute('aria-disabled', 'true');
  await page.evaluate(() => document.querySelector('#fx-mine').remove());
  const readOnly = await mount(page, 'aria-readonly="true" data-ds-value="2026-11-04"');
  await segment(readOnly, 'day').focus();
  expect(await focusedKey(page)).toBe('day');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.type('9');
  expect(await value(readOnly)).toBe('2026-11-04');
  await expect(segment(readOnly, 'day')).toHaveAttribute('aria-readonly', 'true');
});

test('the box at every size x density, .ds-touch as a minimum; the radius follows the shape', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const box = document.createElement('div');
          box.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          box.innerHTML = '<div class="ds-datefield" role="group" aria-label="Measured"></div>';
          main.append(box);
          window.DS.datefield.create(box.firstElementChild, { value: '2026-11-04' });
          const line = box.querySelector('.ds-datefield__segment').getBoundingClientRect().height + 2;
          out.push({ touch, density, size, line, height: box.firstElementChild.getBoundingClientRect().height });
          box.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const level = DENSITIES.find(([density]) => density === entry.density)[1];
    const base = 40 + step * 8 + level * 4;
    // Never less than its text (and its border), as a text field.
    expect(entry.height, `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, base, entry.line), 0);
  }
  const field = await mount(page, 'data-ds-value="2026-11-04"');
  const radius = () => field.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(await radius()).toBeGreaterThan(0);
  await page.evaluate(() => document.querySelector('#fx-mine').classList.add('ds-shape-square'));
  await expect.poll(radius).toBe(0);
});

test('forced colours: the box keeps its border, the focused part is Highlight, a placeholder GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const field = await mount(page, 'data-ds-datefield-type="range" data-ds-value=""');
  await segment(field, 'start.day').focus();
  await settle(page);
  const styles = await field.evaluate((el) => {
    const probe = document.createElement('span');
    el.append(probe);
    const system = (name) => {
      probe.style.color = name;
      return getComputedStyle(probe).color;
    };
    const out = {
      highlight: system('Highlight'),
      gray: system('GrayText'),
      border: getComputedStyle(el).borderTopStyle,
      focused: getComputedStyle(el.querySelector('[data-segment="start.day"]')).backgroundColor,
      placeholder: getComputedStyle(el.querySelector('[data-segment="start.month"]')).color,
    };
    probe.remove();
    return out;
  });
  expect(styles.border).toBe('solid');
  expect(styles.focused).toBe(styles.highlight);
  expect(styles.placeholder).toBe(styles.gray);
});
