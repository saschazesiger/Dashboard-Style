/**
 * Formatted values and relative time: the demo's values, the tip with the
 * exact value on hover and on keyboard focus, set() and a morph that
 * writes a new raw value, a locale switch, the relative times and their
 * absolute tip, the dotted underline, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=formatted');
  await ready(page);
  await page.evaluate(() => window.DS.config({ locale: 'en-US' }));
}

test('every kind is written from its raw value; rounded ones carry the exact value', async ({ page }) => {
  await open(page);
  const shown = await page.locator('#fx-component [data-demo="kinds"] [data-ds-format]').evaluateAll((all) => all.map((el) => [el.textContent, el.getAttribute('data-tip')].map((v) => v && v.replace(/[\u00a0\u202f]/g, ' '))));
  expect(shown).toEqual([
    ['1,234.568', '1,234.5678'], ['1,234.6', '1,234.5678'], ['1.3M', '1,284,902'], ['1.3 million', '1,284,902'],
    ['42.1%', '42.13%'], ['+4.2%', null], ['€1,234.50', null], ['1.5 MB', '1,536,000 bytes'], ['1.5 MiB', '1,536,000 bytes'],
    ['1 hr, 2 min', '1 hour, 2 minutes, 5 seconds'], ['1:02:05', '1 hour, 2 minutes, 5 seconds'],
  ]);
});

test('the tip shows on keyboard focus with the exact value, and is the value\'s description', async ({ page }) => {
  await open(page);
  const value = page.locator('#fx-component [data-demo="kinds"] [data-ds-format="bytes"]').first();
  await value.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const tip = page.getByRole('tooltip');
  await expect(tip).toHaveText(/^1,536,000\s+bytes$/);
  await expect(value).toHaveAccessibleDescription(/^1,536,000\s+bytes$/);
  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();
});

test('set() and a re-render that writes a new raw value format it at once; ds:change after set()', async ({ page }) => {
  await open(page);
  const live = page.locator('#fx-component [data-demo="live"]');
  await expect(live).toHaveText(/^734\s+MB$/);
  const events = await page.evaluate(() => new Promise((done) => {
    const el = document.querySelector('[data-demo="live"]');
    const seen = [];
    el.addEventListener('ds:change', (event) => seen.push(event.detail.text), { once: true });
    window.DS.get(el, 'formatted').set(1000);
    done(seen);
  }));
  expect(events.map((v) => v.replace(/[\u00a0\u202f]/g, ' '))).toEqual(['1 kB']);
  // A morph that patches a new raw figure into the text of a value without data-ds-value.
  const patched = await page.evaluate(async () => {
    const holder = document.createElement('p');
    document.querySelector('#fx-component').append(holder);
    window.DS.dom.morphHtml(holder, '<span data-ds-format="compact">2500</span>');
    await new Promise((r) => requestAnimationFrame(r));
    const first = holder.firstElementChild.textContent;
    window.DS.dom.morphHtml(holder, '<span data-ds-format="compact">7400000</span>');
    await new Promise((r) => requestAnimationFrame(r));
    const out = [first, holder.firstElementChild.textContent];
    holder.remove();
    return out;
  });
  expect(patched).toEqual(['2.5K', '7.4M']);
});

test('a new locale rewrites every value and time at once', async ({ page }) => {
  await open(page);
  const money = page.locator('#fx-component [data-ds-format="currency"][data-ds-value]');
  await expect(money).toHaveText(/^€1,234\.50$/);
  await page.locator('#fx-component [data-demo="locale"]').click();
  await expect(money).toHaveText(/1\.234,50\s€/);
  await expect(page.locator('#fx-component [data-demo="times"] time').first()).toHaveText(/vor|jetzt/);
});

test('relative times tick on the shared clock and carry the absolute date', async ({ page }) => {
  await open(page);
  const times = page.locator('#fx-component [data-demo="times"] time');
  await expect(times.nth(1)).toHaveText('4 minutes ago');
  await expect(times.nth(3)).toHaveText(/yesterday|1 day ago/);
  const tip = await times.nth(1).getAttribute('data-tip');
  expect(tip).toMatch(/\d{4}/);
  const look = await times.nth(1).evaluate((el) => [getComputedStyle(el).textDecorationStyle, getComputedStyle(el).fontVariantNumeric, getComputedStyle(el).whiteSpace]);
  expect(look).toEqual(['dotted', 'tabular-nums', 'nowrap']);
});

test('forced colours: the dotted underline in the text colour', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const [line, ink] = await page.locator('#fx-component [data-ds-format="bytes"]').first().evaluate((el) => [getComputedStyle(el).textDecorationColor, getComputedStyle(el).color]);
  expect(line).toBe(ink);
});
