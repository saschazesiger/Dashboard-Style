/**
 * The status chip and the tag on the options model: the height at every
 * size x density (touch changes nothing, a chip is no target), the shape, the
 * tone from the class on the element only, the deprecated kinds, an icon and a
 * word on every chip of the demo, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=status');
  await ready(page);
}

/** Appends `html` to the fixture and returns what `read` makes of the element with id="probe". */
const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', `return (${read});`)(el, style);
  holder.remove();
  return out;
}, { html, read });

const colours = (page) => page.evaluate(() => {
  const read = (value) => {
    const el = document.createElement('span');
    el.style.color = value;
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  };
  const names = ['success', 'warning', 'error', 'info', 'primary'];
  return Object.fromEntries(names.flatMap((name) => [[`${name}-container`, read(`var(--ds-${name}-container)`)], [`on-${name}-container`, read(`var(--ds-on-${name}-container)`)]]).concat([['high', read('var(--ds-surface-high)')], ['text-2', read('var(--ds-text-2)')]]));
});

const chip = (cls) => `<span id="probe" class="ds-status ${cls}"><span>Word</span></span>`;

test('the height at every size x density; never below its line; touch changes nothing', async ({ page }) => {
  await open(page);
  for (const touch of [false, true]) {
    for (const [density, densityStep] of DENSITIES) {
      for (const [size, sizeStep] of SIZES) {
        for (const name of ['ds-status', 'ds-tag']) {
          const height = await probe(page, `<div class="${density}${touch ? ' ds-touch' : ''}"><span id="probe" class="${name} ${size}"><span>Word</span></span></div>`, 'el.getBoundingClientRect().height');
          expect(height, `${name} ${size} ${density} touch ${touch}`).toBeCloseTo(Math.max(16, 24 + sizeStep * 4 + densityStep * 2), 0);
        }
      }
    }
  }
  // The default chip is 2.x's: 24px.
  expect(await probe(page, chip(''), 'el.getBoundingClientRect().height')).toBe(24);
});

test('type and side padding: the caption stays at every size; side padding steps with size, not density', async ({ page }) => {
  await open(page);
  const read = '[parseFloat(style.fontSize), parseFloat(style.paddingInlineStart), parseFloat(style.paddingInlineEnd)]';
  expect(await probe(page, chip('ds-xl'), read)).toEqual([12, 10, 12]);
  expect(await probe(page, chip('ds-xs'), read)).toEqual([12, 2, 4]);
  expect(await probe(page, chip(''), read)).toEqual([12, 6, 8]);
  expect(await probe(page, `<div class="ds-density-tight">${chip('')}</div>`, read)).toEqual([12, 6, 8]);
});

test('shape: the radius times --ds-shape; a tag stays at most half its height', async ({ page }) => {
  await open(page);
  const radius = 'parseFloat(style.borderTopLeftRadius)';
  for (const [shape, status, tag] of [['ds-shape-square', 0, 0], ['ds-shape-soft', 6, 6], ['ds-shape-default', 12, 12], ['ds-shape-round', 18, 12]]) {
    expect(await probe(page, `<div class="${shape}">${chip('')}</div>`, radius), shape).toBe(status);
    expect(await probe(page, `<div class="${shape}"><span id="probe" class="ds-tag">Word</span></div>`, radius), `${shape} tag`).toBe(tag);
  }
});

test('tones: the container pair, from the class on the element; an inherited tone changes nothing', async ({ page }) => {
  await open(page);
  const c = await colours(page);
  const read = '[style.backgroundColor, style.color]';
  for (const name of ['success', 'warning', 'error', 'info', 'primary']) {
    expect(await probe(page, chip(`ds-tone-${name}`), read), name).toEqual([c[`${name}-container`], c[`on-${name}-container`]]);
    expect(await probe(page, `<span id="probe" class="ds-tag ds-tone-${name}">Word</span>`, read), `tag ${name}`).toEqual([c[`${name}-container`], c[`on-${name}-container`]]);
  }
  expect(await probe(page, chip('ds-tone-neutral'), read)).toEqual([c.high, c['text-2']]);
  const plain = await probe(page, chip(''), read);
  expect(await probe(page, `<div class="ds-tone-error">${chip('')}</div>`, read)).toEqual(plain);
  expect(await probe(page, `<div class="ds-tone-error"><span id="probe" class="ds-tag">Word</span></div>`, read)).toEqual(await probe(page, '<span id="probe" class="ds-tag">Word</span>', read));
});

test('the deprecated kinds look like their tones until 3.0 ships', async ({ page }) => {
  await open(page);
  const read = '[style.backgroundColor, style.color]';
  for (const [kind, tone] of [['ok', 'success'], ['warning', 'warning'], ['error', 'error']]) {
    expect(await probe(page, chip(`ds-status--${kind}`), read), kind).toEqual(await probe(page, chip(`ds-tone-${tone}`), read));
  }
  expect(await probe(page, '<span id="probe" class="ds-tag ds-tag--neutral">Word</span>', read)).toEqual(await probe(page, '<span id="probe" class="ds-tag ds-tone-neutral">Word</span>', read));
});

test('every chip of the demo has its icon and its word; none is a stop of its own', async ({ page }) => {
  await open(page);
  const chips = await page.$$eval('#fx-component .ds-status', (all) => all.map((el) => ({
    mark: Boolean(el.querySelector('svg, .ds-spinner')),
    word: el.textContent.trim(),
    focusable: el.tabIndex >= 0,
  })));
  expect(chips.length).toBeGreaterThan(8);
  for (const entry of chips) {
    expect(entry.mark, entry.word).toBe(true);
    expect(entry.word.length, 'a word').toBeGreaterThan(1);
    expect(entry.focusable).toBe(false);
  }
});

test('the polled chip is kept: the button drives it by keyboard, morphHtml patches the same node', async ({ page }) => {
  await open(page);
  const button = page.locator('[data-demo="poll"]');
  const holder = page.locator('[data-demo="polled"]');
  await holder.locator('.ds-status').evaluate((el) => { window.kept = el; });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(holder.locator('.ds-tone-success')).toBeVisible({ timeout: 10000 });
  expect(await holder.locator('.ds-status').evaluate((el) => el === window.kept)).toBe(true);
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('forced colours: the word and the icon stay, a tone changes nothing, the running arc is Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const read = '[style.backgroundColor, style.color]';
  expect(await probe(page, chip('ds-tone-error'), read)).toEqual(await probe(page, chip('ds-tone-success'), read));
  expect(await probe(page, '<span id="probe" class="ds-tag ds-tone-error">Word</span>', 'style.outlineStyle')).toBe('solid');
  const running = await page.$eval('#fx-component .ds-status--running .ds-spinner', (el) => getComputedStyle(el).getPropertyValue('--ds-spinner-color').trim());
  expect(running.toLowerCase()).toBe('highlight');
});
