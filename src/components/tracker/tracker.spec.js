/**
 * Tracker: a shape per state, the row per size, density and shape, one tab
 * stop with the arrow keys and the tooltip on focus, the names, set() from
 * data, the narrow row, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const STATES = ['success', 'info', 'warning', 'error', 'empty'];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=tracker');
  await ready(page);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe" style="inline-size: 600px">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', 'holder', `return (${read});`)(el, style, holder);
  holder.remove();
  return out;
}, { html, read });

const row = (cells, cls = '') => `<div class="ds-tracker ${cls}"><div id="probe" class="ds-tracker__cells">${cells.map((s) => `<span class="ds-tracker__cell ds-tracker__cell--${s}"></span>`).join('')}</div></div>`;

test('every state has its own shape: low or full, solid or dashed, a stub for no data', async ({ page }) => {
  await open(page);
  const shapes = await probe(page, row(STATES), `Array.from(el.children, (c) => {
    const s = getComputedStyle(c);
    const layer = s.backgroundImage;
    // Dashed: the gradient's second colour is transparent; solid: both the fill.
    const colours = layer.match(/rgba?\\([^)]*\\)/g) ?? [];
    return [s.backgroundSize, colours.length >= 2 && colours[0] !== colours[colours.length - 1] ? 'dashed' : 'solid', Math.round(c.getBoundingClientRect().height)];
  })`);
  expect(shapes).toEqual([
    ['100% 60%', 'solid', 32],
    ['100% 60%', 'dashed', 32],
    ['100% 100%', 'dashed', 32],
    ['100% 100%', 'solid', 32],
    ['100% 4px', 'solid', 32],
  ]);
});

test('the row: 32px at md, 4px per size step, touch changes nothing; density spaces the parts; shape squares the cells', async ({ page }) => {
  await open(page);
  for (const [size, step] of SIZES) {
    for (const extra of ['', ' ds-touch ds-density-tight']) {
      expect(await probe(page, `<div class="${size}${extra}">${row(['success'])}</div>`, 'el.getBoundingClientRect().height'), size + extra).toBe(32 + step * 4);
    }
  }
  const gap = (cls) => probe(page, `<div class="${cls}"><figure id="probe" class="ds-tracker"></figure></div>`, 'parseFloat(style.rowGap)');
  expect(await gap('')).toBe(8);
  expect(await gap('ds-density-dense')).toBe(6);
  // 600px, 3 cells, 2 gaps of 2px.
  for (const width of await probe(page, row(['success', 'error', 'success']), 'Array.from(el.children, (c) => c.getBoundingClientRect().width)')) expect(width).toBeCloseTo(596 / 3, 1);
  expect(await probe(page, `<div class="ds-shape-square">${row(['success'])}</div>`, 'parseFloat(getComputedStyle(el.firstElementChild).borderTopLeftRadius)')).toBe(0);
  expect(await probe(page, row(['success']), 'parseFloat(getComputedStyle(el.firstElementChild).borderTopLeftRadius)')).toBe(2);
});

test('one tab stop on the most recent cell; arrows, Home and End move; the focused cell shows its tooltip', async ({ page }) => {
  await open(page);
  const cells = page.locator('#fx-component [data-demo="uptime"] .ds-tracker__cells > .ds-tracker__cell');
  await expect(cells).toHaveCount(90);
  expect(await page.locator('#fx-component [data-demo="uptime"] .ds-tracker__cells').evaluate((el) => [...el.children].filter((c) => c.tabIndex === 0).length)).toBe(1);
  await expect(cells.last()).toHaveAttribute('tabindex', '0');
  await page.locator('#fx-component [data-demo="refresh"]').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(cells.last()).toBeFocused();
  const tip = page.locator('.ds-tooltip');
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText(await cells.last().getAttribute('aria-label'));
  await page.keyboard.press('ArrowLeft');
  await expect(cells.nth(88)).toBeFocused();
  await expect(tip).toHaveText(await cells.nth(88).getAttribute('aria-label'));
  await page.keyboard.press('Home');
  await expect(cells.first()).toBeFocused();
  // No wrap: Left at the first cell stays.
  await page.keyboard.press('ArrowLeft');
  await expect(cells.first()).toBeFocused();
  await page.keyboard.press('End');
  await expect(cells.last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();
});

test('names: a named group of named images; a cell with a tip only takes it as its name', async ({ page }) => {
  await open(page);
  const group = page.getByRole('group', { name: 'Printer 7, last 90 days' });
  await expect(group).toBeVisible();
  await expect(group.getByRole('img', { name: /^Nov 4: / })).toHaveCount(1);
  const named = await page.evaluate(async () => {
    const el = document.createElement('div');
    el.className = 'ds-tracker__cells';
    el.innerHTML = '<span class="ds-tracker__cell ds-tracker__cell--error" data-tip="Run 7: failed"></span>';
    document.querySelector('#fx-component').append(el);
    const handle = window.DS.tracker.create(el);
    const cell = el.firstElementChild;
    const out = [cell.getAttribute('role'), cell.getAttribute('aria-label'), cell.tabIndex];
    handle.destroy();
    el.remove();
    return out;
  });
  expect(named).toEqual(['img', 'Run 7: failed', 0]);
});

test('set() renders the cells from data in place, keeps focus and emits ds:change with the counts', async ({ page }) => {
  await open(page);
  const cells = page.locator('#fx-component [data-demo="runs"] .ds-tracker__cells > .ds-tracker__cell');
  await cells.last().focus();
  const result = await page.evaluate(async () => {
    const row = document.querySelector('[data-demo="runs"] .ds-tracker__cells');
    const focused = document.activeElement;
    const detail = await new Promise((done) => {
      row.addEventListener('ds:change', (event) => done(event.detail), { once: true });
      const list = Array.from({ length: 30 }, (_, i) => ({ state: i === 29 ? 'error' : 'success', label: `Run ${i}` }));
      window.DS.get(row, 'tracker').set(list);
    });
    return [detail.counts, document.activeElement === focused, focused.className, focused.getAttribute('data-tip'), window.DS.get(row, 'tracker').get().counts.total];
  });
  expect(result).toEqual([{ success: 29, info: 0, warning: 0, error: 1, empty: 0, total: 30 }, true, 'ds-tracker__cell ds-tracker__cell--error', 'Run 29', 30]);
  // Fewer cells: the extra ones go.
  const left = await page.evaluate(() => {
    const row = document.querySelector('[data-demo="runs"] .ds-tracker__cells');
    window.DS.get(row, 'tracker').set([{ state: 'warning', label: 'a' }, { state: 'bogus', label: 'b' }]);
    return Array.from(row.children, (c) => c.className);
  });
  expect(left).toEqual(['ds-tracker__cell ds-tracker__cell--warning', 'ds-tracker__cell ds-tracker__cell--empty']);
});

test('narrow: 90 cells fit a 328px card, 1px apart', async ({ page }) => {
  await open(page);
  const fit = await page.locator('#fx-component [data-demo="narrow"] .ds-tracker__cells').evaluate((el) => {
    const cells = [...el.children];
    const last = cells.at(-1).getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return [cells.length, last.right <= box.right + 0.5, Math.round((cells[1].getBoundingClientRect().left - cells[0].getBoundingClientRect().right) * 10) / 10, cells[0].getBoundingClientRect().width >= 2];
  });
  expect(fit).toEqual([90, true, 1, true]);
});

test('forced colours: CanvasText cells with their shapes, the stub GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const out = await probe(page, row(['error', 'warning', 'empty']), `[...Array.from(el.children, (c) => getComputedStyle(c).backgroundImage), (() => {
    const p = document.createElement('span');
    p.style.cssText = 'forced-color-adjust: none; color: CanvasText; background-color: GrayText';
    document.body.append(p);
    const r = [getComputedStyle(p).color, getComputedStyle(p).backgroundColor];
    p.remove();
    return r;
  })()]`);
  const [error, warning, empty, [ink, gray]] = out;
  expect(error).toContain(ink);
  expect(warning).toContain(ink);
  expect(empty).toContain(gray);
  expect(error).not.toContain('transparent');
});
