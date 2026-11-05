/**
 * Key combos: the keys written for each platform, the separators, a
 * sequence, the words for a screen reader, set(), a bad combo, forced
 * colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=kbd');
  await ready(page);
}

const shown = (locator) => locator.evaluate((el) => [...el.querySelectorAll('.ds-kbd-combo__combo > *, .ds-kbd-combo__then')].map((node) => node.textContent));

test('pinned platforms: glyphs without separators on Apple systems, names joined by + elsewhere', async ({ page }) => {
  await open(page);
  expect(await shown(page.locator('#fx-component [data-demo="apple"] .ds-kbd-combo').nth(2))).toEqual(['⇧', '⌘', 'P']);
  expect(await shown(page.locator('#fx-component [data-demo="other"] .ds-kbd-combo').nth(2))).toEqual(['Ctrl', '+', 'Shift', '+', 'P']);
  const keyNodes = await page.locator('#fx-component [data-demo="other"] .ds-kbd-combo').nth(2).evaluate((el) => [...el.querySelectorAll('kbd.ds-kbd')].length);
  expect(keyNodes).toBe(3);
});

test('a screen reader hears the words once; the glyphs are hidden', async ({ page }) => {
  await open(page);
  const apple = page.locator('#fx-component [data-demo="apple"] .ds-kbd-combo').nth(2);
  await expect(apple.locator('.ds-kbd-combo__keys')).toHaveAttribute('aria-hidden', 'true');
  await expect(apple.locator('.ds-sr')).toHaveText('Shift Command P');
});

test('a sequence: "then" between its combos; this platform follows the engine', async ({ page }) => {
  await open(page);
  const sequence = page.locator('#fx-component [data-demo="sheet"] [data-ds-kbd="g i"]');
  expect(await shown(sequence)).toEqual(['G', 'then', 'I']);
  await expect(sequence.locator('.ds-sr')).toHaveText('G then I');
  const apple = await page.evaluate(() => window.DS.hotkeys.isApple());
  const search = page.locator('#fx-component [data-demo="sheet"] [data-ds-kbd="mod+k"]');
  expect(await shown(search)).toEqual(apple ? ['⌘', 'K'] : ['Ctrl', '+', 'K']);
});

test('set() writes new keys and words at once and emits ds:change; a bad combo leaves the text', async ({ page }) => {
  await open(page);
  const live = page.locator('#fx-component [data-demo="live"]');
  const events = await live.evaluate((el) => {
    const seen = [];
    el.addEventListener('ds:change', (event) => seen.push(event.detail.combo));
    return seen;
  });
  expect(events).toEqual([]);
  await page.locator('#fx-component [data-demo="swap"]').click();
  expect(await shown(live)).toEqual(['/']);
  await expect(live).toHaveAttribute('data-ds-kbd', '/');
  const bad = await page.evaluate(() => {
    const el = document.createElement('kbd');
    el.className = 'ds-kbd-combo';
    el.textContent = 'Hyper K';
    document.querySelector('#fx-component').append(el);
    const errors = [];
    const onError = (event) => { errors.push(String(event.message)); event.preventDefault(); };
    window.addEventListener('error', onError);
    window.DS.kbd.create(el, { combo: 'hyper+k' });
    window.removeEventListener('error', onError);
    const out = [el.textContent, errors.length > 0];
    el.remove();
    return out;
  });
  expect(bad).toEqual(['Hyper K', true]);
});

test('the keys stay on one line inside a combo at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const tops = await page.locator('#fx-component [data-demo="other"] .ds-kbd-combo').nth(2).evaluate((el) => new Set([...el.querySelectorAll('.ds-kbd')].map((k) => Math.round(k.getBoundingClientRect().top))).size);
  expect(tops).toBe(1);
});

test('forced colours: the keys keep their edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const edge = await page.locator('#fx-component .ds-kbd-combo .ds-kbd').first().evaluate((el) => getComputedStyle(el).borderTopStyle);
  expect(edge).toBe('solid');
});
