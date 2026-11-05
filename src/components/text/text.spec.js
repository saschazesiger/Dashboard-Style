/**
 * The text utilities on probes and on their demo: .ds-truncate cuts one
 * line with an ellipsis and lets a flex item shrink; .ds-clamp-n and
 * .ds-clamp (--ds-clamp-lines) show n lines; .ds-break keeps a long token
 * inside its column; .ds-mono sets the code family at the size around it;
 * .ds-tabular sets figures of one width; .ds-balance and .ds-pretty set
 * text-wrap (pretty where supported); on paper cut text prints in full;
 * the cut text stays whole for assistive technology; forced colours draw
 * nothing. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { focusByKeyboard, ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=text');
  await ready(page);
}

const add = (page, html) => page.evaluate((markup) => {
  document.getElementById('probe')?.remove();
  const region = document.createElement('div');
  region.id = 'probe';
  region.insertAdjacentHTML('beforeend', markup);
  document.getElementById('fx-component').prepend(region);
}, html);

const LONG = 'Replace the battery of LAPTOP-0042 before the next sync window, Ada Lovelace reported it swelling. '.repeat(3);
const HASH = 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

/** The number of lines a box shows: its height over its line height. */
const lines = (page, selector) => page.$eval(selector, (el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));

test('truncate: one line with an ellipsis; in a flex row it shrinks beside its action', async ({ page }) => {
  await open(page);
  await add(page, `<div style="inline-size: 240px"><p class="ds-truncate" id="cut">${LONG}</p>
    <div style="display: flex"><span class="ds-truncate" id="item">${LONG}</span><button type="button" class="ds-btn" id="action">Open</button></div></div>`);
  const cut = await page.$eval('#cut', (el) => ({ over: el.scrollWidth > el.clientWidth, overflow: getComputedStyle(el).textOverflow, space: getComputedStyle(el).whiteSpace }));
  expect(cut).toEqual({ over: true, overflow: 'ellipsis', space: 'nowrap' });
  expect(await lines(page, '#cut')).toBe(1);
  const row = await page.evaluate(() => {
    const item = document.getElementById('item').getBoundingClientRect();
    const action = document.getElementById('action').getBoundingClientRect();
    return { fits: item.right <= action.left + 0.5, inside: action.right <= document.getElementById('item').parentElement.getBoundingClientRect().right + 0.5 };
  });
  expect(row).toEqual({ fits: true, inside: true });
});

test('clamp: -1 to -5 show so many lines, .ds-clamp follows --ds-clamp-lines (2 by default)', async ({ page }) => {
  await open(page);
  const probes = [1, 2, 3, 4, 5].map((n) => `<p class="ds-clamp-${n}" id="c${n}" style="margin: 0">${LONG}${LONG}</p>`).join('');
  await add(page, `<div style="inline-size: 260px">${probes}<p class="ds-clamp" id="hook" style="margin: 0">${LONG}</p><p class="ds-clamp" id="seven" style="margin: 0; --ds-clamp-lines: 7">${LONG}${LONG}</p></div>`);
  for (const n of [1, 2, 3, 4, 5]) expect(await lines(page, `#c${n}`), `.ds-clamp-${n}`).toBe(n);
  expect(await lines(page, '#hook')).toBe(2);
  expect(await lines(page, '#seven')).toBe(7);
  // In a row that stretches its items (a grid of cards, a flex row), the box keeps its own height.
  await add(page, `<div style="display: grid; grid-template-columns: 200px 200px"><div class="ds-clamp-2" id="stretched" style="margin: 0">${LONG}</div><div style="block-size: 400px">Tall</div></div>`);
  expect(await lines(page, '#stretched')).toBe(2);
});

test('break: a long token stays inside its column; without it the column overflows', async ({ page }) => {
  await open(page);
  await add(page, `<div style="inline-size: 180px"><p class="ds-break" id="broken">${HASH}</p><p id="plain">${HASH}</p></div>`);
  expect(await page.$eval('#broken', (el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await page.$eval('#plain', (el) => el.scrollWidth > el.clientWidth)).toBe(true);
  // A grid or flex item shrinks too (min-width: 0).
  await add(page, `<div style="display: grid; grid-template-columns: 1fr; inline-size: 180px"><p class="ds-break" id="item">${HASH}</p></div>`);
  expect(await page.$eval('#item', (el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(180);
});

test('mono and tabular: the code family at the size around it, figures of one width', async ({ page }) => {
  await open(page);
  await add(page, `<p style="font-size: 20px" id="around">Serial <span class="ds-mono" id="mono">SN 4C1-77Q</span></p>
    <p class="ds-tabular" id="tab"><span id="ones">1111</span><br><span id="eights">8888</span></p>`);
  const mono = await page.evaluate(() => {
    const el = document.getElementById('mono');
    const probe = document.createElement('span');
    probe.style.fontFamily = 'var(--ds-font-mono)';
    el.parentElement.append(probe);
    const family = getComputedStyle(probe).fontFamily;
    probe.remove();
    return { family: getComputedStyle(el).fontFamily === family, size: getComputedStyle(el).fontSize, ligatures: getComputedStyle(el).fontVariantLigatures };
  });
  expect(mono).toEqual({ family: true, size: '20px', ligatures: 'none' });
  expect(await page.$eval('#tab', (el) => getComputedStyle(el).fontVariantNumeric)).toBe('tabular-nums');
  const widths = await page.evaluate(() => ['ones', 'eights'].map((id) => document.getElementById(id).getBoundingClientRect().width));
  expect(Math.abs(widths[0] - widths[1]), 'tabular figures share one width').toBeLessThanOrEqual(0.5);
});

test('balance and pretty set text-wrap; pretty is progressive', async ({ page }) => {
  await open(page);
  await add(page, '<h3 class="ds-balance" id="bal">Pair a new device with the console in three steps</h3><p class="ds-pretty" id="pretty">Text</p>');
  const wrap = (id) => page.$eval(`#${id}`, (el) => getComputedStyle(el).textWrapStyle || getComputedStyle(el).textWrap);
  expect(await wrap('bal')).toContain('balance');
  const pretty = await page.evaluate(() => CSS.supports('text-wrap', 'pretty'));
  if (pretty) expect(await wrap('pretty')).toContain('pretty');
});

test('cut text stays whole for assistive technology and in the tooltip', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const cut = page.locator('[data-demo="truncated"]');
  const full = await cut.getAttribute('data-tip');
  expect(await cut.textContent()).toBe(full);
  // A tip that repeats the visible text shows while that text is cut (tooltip.md).
  await focusByKeyboard(page, cut);
  await expect(page.locator('.ds-tooltip').first()).toBeVisible();
  await expect(page.locator('.ds-tooltip').first()).toHaveText(full);
  // Wide enough to fit, the same tip is not wanted: it would repeat what shows.
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1800, height: 800 });
  await cut.evaluate((el) => { el.parentElement.style.maxInlineSize = 'none'; });
  expect(await cut.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await focusByKeyboard(page, cut);
  await page.waitForTimeout(100);
  await expect(page.locator('.ds-tooltip').first()).toBeHidden();
});

test('print: cut and clamped text prints in full', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  const read = await page.evaluate(() => {
    const cut = document.querySelector('[data-demo="truncated"]');
    const clamp = document.querySelector('[data-demo="clamp-1"]');
    return { space: getComputedStyle(cut).whiteSpace, overflow: getComputedStyle(cut).overflowX, clamp: getComputedStyle(clamp).display, clampOverflow: getComputedStyle(clamp).overflowY };
  });
  expect(read).toEqual({ space: 'normal', overflow: 'visible', clamp: 'block', clampOverflow: 'visible' });
});

test('the demo at 360px: every section renders, nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  for (const name of ['truncate', 'clamp', 'break', 'figures', 'wrap', 'nowrap']) await expect(page.locator(`[data-demo="${name}"]`)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('forced colours: the classes draw nothing', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const drawn = await page.$$eval('.ds-truncate, [class*="ds-clamp"], .ds-break, .ds-mono, .ds-tabular, .ds-balance, .ds-pretty', (items) => items.filter((item) => getComputedStyle(item).borderTopStyle !== 'none' || getComputedStyle(item).backgroundImage !== 'none').length);
  expect(drawn).toBe(0);
});
