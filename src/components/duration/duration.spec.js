/**
 * The duration input (3.0, tier 2): typed text read and written back in the
 * locale's words, ds:change with ISO 8601, the spinbutton keys and their
 * limits, the error set only once the field is left, a hidden input in a
 * form, disabled and read-only, names and roles, the box of the text field
 * at every option, and forced colours. Runs on the generated fixture of the
 * demo, with inputs of its own mounted on it, and in the `fallback` project
 * too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

test.use({ locale: 'en-US' });

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=duration');
  await ready(page);
  await page.mouse.move(1, 1);
}

async function mount(page, attrs, wrap = 'div') {
  await page.evaluate(({ html, wrap }) => {
    const host = document.createElement(wrap);
    host.id = 'fx-mine';
    host.innerHTML = html;
    document.querySelector('#fx-component').prepend(host);
    window.DS.init(host);
    window.fxEvents = [];
    host.addEventListener('ds:change', (event) => window.fxEvents.push(event.detail));
  }, { html: `<span id="fx-label">Timeout</span><input class="ds-input ds-duration" type="text" aria-labelledby="fx-label" data-ds-duration ${attrs}><button type="button" id="fx-after">After</button>`, wrap });
  return page.locator('#fx-mine .ds-duration');
}

const events = (page) => page.evaluate(() => window.fxEvents);
const get = (input) => input.evaluate((el) => window.DS.duration.create(el).get());

test('typed as people write it, written back in the locale\'s words once left; ds:change with ISO 8601', async ({ page }) => {
  await open(page);
  const input = await mount(page, '');
  await input.fill('90');
  expect(await events(page)).toEqual([]);
  await page.keyboard.press('Tab');
  await expect(input).toHaveValue('1h 30m');
  expect(await get(input)).toBe('PT1H30M');
  expect(await events(page)).toEqual([{ value: 'PT1H30M', ms: 5400000, text: '1h 30m', valid: true }]);
  await expect(input).toHaveAttribute('aria-valuenow', '5400');
  await expect(input).toHaveAttribute('aria-valuetext', '1 hour, 30 minutes');
  for (const [text, shown] of [['2 days 4 hours', '2d 4h'], ['1:30:15', '1h 30m 15s'], ['PT45S', '45s'], ['1.5h', '1h 30m']]) {
    await input.fill(text);
    await input.press('Enter');
    await expect(input, text).toHaveValue(shown);
  }
});

test('unreadable text stays as typed and is invalid once left; a readable value clears it at once', async ({ page }) => {
  await open(page);
  const input = await mount(page, 'data-ds-value="10m"');
  await input.fill('soon');
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.press('Tab');
  await expect(input).toHaveValue('soon');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  expect((await events(page)).at(-1)).toEqual({ value: '', ms: null, text: 'soon', valid: false });
  await input.fill('15m');
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
});

test('the spinbutton keys: a step, ten steps, the limits; never past them', async ({ page }) => {
  await open(page);
  const input = await mount(page, 'data-ds-value="PT1H" data-ds-duration-step="15m" data-ds-duration-min="5m" data-ds-duration-max="2h"');
  await expect(page.getByRole('spinbutton', { name: 'Timeout', exact: true })).toHaveCount(1);
  await expect(input).toHaveAttribute('aria-valuemin', '300');
  await expect(input).toHaveAttribute('aria-valuemax', '7200');
  await input.focus();
  await page.keyboard.press('ArrowUp');
  await expect(input).toHaveValue('1h 15m');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveValue('45m');
  await page.keyboard.press('PageUp');
  await expect(input).toHaveValue('2h');
  await page.keyboard.press('Home');
  await expect(input).toHaveValue('5m');
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveValue('5m');
  await page.keyboard.press('End');
  expect(await get(input)).toBe('PT2H');
  expect((await events(page)).map((entry) => entry.value)).toEqual(['PT1H15M', 'PT1H', 'PT45M', 'PT2H', 'PT5M', 'PT2H']);
  // Typed past a limit: invalid.
  await input.fill('3h');
  await page.keyboard.press('Tab');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  expect((await events(page)).at(-1)).toMatchObject({ value: 'PT3H', valid: false });
});

test('a bare number counts the unit of the markup; the value rounds to its smallest unit', async ({ page }) => {
  await open(page);
  const input = await mount(page, 'data-ds-duration-unit="h" data-ds-duration-smallest="hour"');
  await input.fill('2');
  await input.press('Enter');
  await expect(input).toHaveValue('2h');
  await input.fill('2h 20m');
  await input.press('Enter');
  await expect(input).toHaveValue('2h');
});

test('a name keeps a hidden input with the ISO value for a form', async ({ page }) => {
  await open(page);
  const input = await mount(page, 'data-ds-value="7d" data-ds-duration-name="retention"', 'form');
  expect(await page.evaluate(() => new FormData(document.querySelector('#fx-mine')).get('retention'))).toBe('P7D');
  // Enter would submit the form (and reload the page): the value is written on leaving it.
  await input.fill('36h');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => new FormData(document.querySelector('#fx-mine')).get('retention'))).toBe('P1DT12H');
});

test('disabled and read-only: the keys change nothing', async ({ page }) => {
  await open(page);
  const input = await mount(page, 'data-ds-value="10m" readonly');
  await input.focus();
  await page.keyboard.press('ArrowUp');
  await expect(input).toHaveValue('10m');
  expect(await events(page)).toEqual([]);
});

test('the box is the text field\'s at every size, density and touch; the figures have one width', async ({ page }) => {
  await open(page);
  const pairs = await page.evaluate(() => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const cls of ['ds-xs', 'ds-md ds-density-tight', 'ds-xl', 'ds-sm ds-touch']) {
      const box = document.createElement('div');
      box.className = cls;
      box.innerHTML = '<input class="ds-input" aria-label="Plain"><input class="ds-input ds-duration" aria-label="Measured">';
      main.append(box);
      window.DS.duration.create(box.lastElementChild, { value: '1h' });
      const [plain, measured] = [...box.children].map((el) => el.getBoundingClientRect().height);
      out.push([cls, plain, measured, getComputedStyle(box.lastElementChild).fontVariantNumeric]);
      box.remove();
    }
    return out;
  });
  for (const [cls, plain, measured, figures] of pairs) {
    expect(measured, cls).toBe(plain);
    expect(figures).toBe('tabular-nums');
  }
});

test('forced colours: the box keeps its border; an invalid one too', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const input = await mount(page, 'value="soon"');
  await settle(page);
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(await input.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
});
