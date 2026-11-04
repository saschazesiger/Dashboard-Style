/**
 * The pagination on the options model and its variants (3.0), on its demo
 * (the generated fixture): page buttons at every size x density x touch, as
 * wide as high, the gap lined up with them; the shape; the current page and
 * its forced colours; simple, numbered and cursor placing their parts; the
 * jump and the size field with their own widths, dropping in a narrow content
 * area; the keyboard's way and the names. Runs in the `fallback` project too.
 * tables.spec.js keeps covering the default bar under a table.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=pagination');
  await ready(page);
  await page.mouse.move(1, 1);
}

const nav = (page, variant) => page.locator(`[data-demo="${variant}"] nav.ds-pagination`);

test('page buttons and the gap at every size x density, and .ds-touch as a minimum', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const host = document.querySelector('.ds-theme');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<nav class="ds-pagination" aria-label="Pages"><ol class="ds-pagination__pages"><li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 1">1</button></li><li class="ds-pagination__gap" aria-hidden="true">…</li></ol></nav>';
          host.append(region);
          const page = region.querySelector('.ds-pagination__page');
          const button = page.getBoundingClientRect();
          const gap = region.querySelector('.ds-pagination__gap').getBoundingClientRect();
          out.push({ touch, density, size, height: button.height, width: button.width, gap: gap.width, content: parseFloat(getComputedStyle(page).lineHeight) + 2 });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    // As the button: never below its own line.
    const expected = Math.max(entry.touch ? TOUCH : 0, 40 + step * 8 + density * 4, entry.content);
    expect(entry.height, name).toBeCloseTo(expected, 0);
    // At least as wide as the height the options compute, and no wider than its figure needs.
    const computed = Math.max(entry.touch ? TOUCH : 0, 40 + step * 8 + density * 4);
    expect(entry.width, `${name}: at least a disc`).toBeGreaterThanOrEqual(computed - 0.5);
    expect(entry.width, `${name}: at most a disc`).toBeLessThanOrEqual(Math.max(computed, 18) + 1);
    expect(entry.gap, `${name}: the gap lines up`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 40 + step * 8 + density * 4), 0);
  }
});

test('a long figure still has its room; shape takes the page button from a disc to a square', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(() => {
    const host = document.querySelector('.ds-theme');
    const make = (classes, text) => {
      const region = document.createElement('div');
      region.className = classes;
      region.innerHTML = `<button class="ds-btn ds-btn--quiet ds-pagination__page" type="button">${text}</button>`;
      host.append(region);
      const el = region.firstElementChild;
      const value = { width: el.getBoundingClientRect().width, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) };
      region.remove();
      return value;
    };
    return { long: make('', '123456'), disc: make('', '7'), square: make('ds-shape-square', '7'), soft: make('ds-shape-soft', '7') };
  });
  expect(out.long.width).toBeGreaterThan(40);
  expect(out.disc.radius).toBe(20);
  expect(out.square.radius).toBe(0);
  expect(out.soft.radius).toBe(10);
});

test('numbered: the range leads, the current page is filled and marked, a click moves it', async ({ page }) => {
  await open(page);
  const bar = nav(page, 'numbered');
  const current = bar.locator('[aria-current="page"]');
  await expect(current).toHaveText('1');
  const [filled, plain] = await page.evaluate(() => {
    const on = document.querySelector('[data-demo="numbered"] [aria-current="page"]');
    const off = document.querySelector('[data-demo="numbered"] .ds-pagination__page:not([aria-current])');
    return [getComputedStyle(on).backgroundColor, getComputedStyle(off).backgroundColor];
  });
  expect(filled).not.toBe(plain);
  expect(plain).toBe('rgba(0, 0, 0, 0)');
  // The range at the start, the pages at the end of the bar.
  const box = await bar.boundingBox();
  const range = await bar.locator('.ds-pagination__range').boundingBox();
  const next = await bar.getByRole('button', { name: 'Next page' }).boundingBox();
  expect(range.x - box.x).toBeLessThan(2);
  expect(box.x + box.width - (next.x + next.width)).toBeLessThan(2);
  await bar.getByRole('button', { name: 'Page 2', exact: true }).click();
  await expect(current).toHaveText('2');
  await expect(bar.locator('.ds-pagination__range')).toHaveText('51–100 of 1,234');
  await expect(bar.getByRole('button', { name: 'Previous page' })).not.toHaveAttribute('aria-disabled', 'true');
  // The jump goes where it is told, and the last page blocks next.
  const jump = bar.getByLabel('Go to page');
  await jump.fill('25');
  await jump.press('Tab');
  await expect(current).toHaveText('25');
  await expect(bar.getByRole('button', { name: 'Next page' })).toHaveAttribute('aria-disabled', 'true');
  // A gap is not read.
  await expect(bar.locator('.ds-pagination__gap').first()).toHaveAttribute('aria-hidden', 'true');
});

test('simple: the page beside its two buttons; cursor: previous and next at the two ends', async ({ page }) => {
  await open(page);
  const simple = nav(page, 'simple');
  await expect(simple.locator('.ds-pagination__range')).toHaveText('Page 1 of 25');
  await expect(simple.getByRole('button')).toHaveCount(2);
  await simple.getByRole('button', { name: 'Next page' }).click();
  await expect(simple.locator('.ds-pagination__range')).toHaveText('Page 2 of 25');
  const cursor = nav(page, 'cursor');
  const box = await cursor.boundingBox();
  const newer = await cursor.getByRole('button', { name: 'Newer' }).boundingBox();
  const older = await cursor.getByRole('button', { name: 'Older' }).boundingBox();
  expect(newer.x - box.x).toBeLessThan(2);
  expect(box.x + box.width - (older.x + older.width)).toBeLessThan(2);
  await expect(cursor.getByRole('button', { name: 'Newer' })).toHaveAttribute('aria-disabled', 'true');
});

test('the fields keep their own width; they drop in a narrow content area and the range leads', async ({ page }) => {
  await open(page);
  const jumpBox = await nav(page, 'numbered').locator('.ds-pagination__jump .ds-input').boundingBox();
  expect(jumpBox.width).toBe(72);
  const select = await nav(page, 'default').locator('.ds-pagination__size select').boundingBox();
  const size = await nav(page, 'default').locator('.ds-pagination__size').boundingBox();
  expect(select.width).toBeLessThan(160);
  expect(size.width).toBeLessThan(320);
  // A hook sets the jump's width.
  await nav(page, 'numbered').evaluate((el) => el.style.setProperty('--ds-pagination-jump-width', '96px'));
  expect((await nav(page, 'numbered').locator('.ds-pagination__jump .ds-input').boundingBox()).width).toBe(96);
  // At most 600px of content area.
  await page.evaluate(() => {
    const host = document.querySelector('.ds-theme');
    host.insertAdjacentHTML('beforeend', '<div class="ds-content" style="width: 480px"><nav class="ds-pagination" aria-label="Narrow" id="narrow"><div class="ds-pagination__size" id="narrow-size"></div><div class="ds-pagination__jump" id="narrow-jump"></div><p class="ds-pagination__range" id="narrow-range">1–50</p><button class="ds-btn" type="button">Next</button></nav></div>');
  });
  await expect(page.locator('#narrow-size')).toBeHidden();
  await expect(page.locator('#narrow-jump')).toBeHidden();
  const narrow = await page.locator('#narrow').boundingBox();
  expect((await page.locator('#narrow-range').boundingBox()).x - narrow.x).toBeLessThan(2);
});

test('numbered in a narrow content area: the range on its own line; previous, the current page and next share one', async ({ page }) => {
  await open(page);
  const measure = (width, classes) => page.evaluate(([inline, names]) => {
    const pages = [1, 2, 3, 4, 5, 6, 7].map((n) => (n === 2 ? '<li class="ds-pagination__gap" aria-hidden="true">…</li>' : `<li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page ${n}"${n === 4 ? ' aria-current="page"' : ''}>${n}</button></li>`)).join('');
    const region = document.createElement('div');
    region.className = `ds-content ${names}`;
    region.style.width = `${inline}px`;
    region.innerHTML = `<nav class="ds-pagination ds-pagination--numbered" aria-label="Narrow"><p class="ds-pagination__range">151–200 of 1,234</p><div class="ds-pagination__jump"><label class="ds-pagination__label" for="narrow-jump">Go to page</label><input class="ds-input" id="narrow-jump" type="number"></div><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page">P</button><ol class="ds-pagination__pages">${pages}</ol><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page">N</button></nav>`;
    document.querySelector('.ds-theme').append(region);
    const box = (selector) => region.querySelector(selector).getBoundingClientRect();
    const middle = (rect) => rect.top + rect.height / 2;
    const range = box('.ds-pagination__range');
    const out = {
      range: range.bottom,
      top: box('[aria-label="Previous page"]').top,
      line: [box('[aria-label="Previous page"]'), box('[aria-current="page"]'), box('[aria-label="Next page"]')].map(middle),
      shown: [...region.querySelectorAll('.ds-pagination__pages li')].filter((li) => li.getBoundingClientRect().width > 0).length,
      overflow: region.scrollWidth - region.clientWidth,
    };
    region.remove();
    return out;
  }, [width, classes]);
  for (const [width, classes] of [[600, ''], [360, ''], [320, ''], [320, 'ds-touch'], [360, 'ds-touch'], [320, 'ds-lg ds-touch']]) {
    const name = `${width}px ${classes}`;
    const narrow = await measure(width, classes);
    expect(narrow.shown, name).toBe(1);
    expect(narrow.top, `${name}: the range on its own line`).toBeGreaterThanOrEqual(narrow.range);
    expect(narrow.line[1], `${name}: previous and the current page`).toBeCloseTo(narrow.line[0], 0);
    expect(narrow.line[2], `${name}: next and the current page`).toBeCloseTo(narrow.line[0], 0);
    expect(narrow.overflow, name).toBe(0);
  }
  // With room every page shows.
  expect((await measure(720, '')).shown).toBe(7);
});

test('under a table: right under it with a hairline; a page change dims the rows, then the new ones show', async ({ page }) => {
  await open(page);
  const card = page.locator('[data-demo="table"]');
  const bar = card.locator('nav.ds-pagination');
  expect(await bar.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
  const first = () => card.locator('tbody tr td').first().textContent();
  const before = await first();
  await bar.getByRole('button', { name: 'Next page' }).click();
  await expect(card).toHaveClass(/ds-stale/);
  await expect(card).toHaveAttribute('aria-busy', 'true');
  await expect(bar.locator('.ds-pagination__range')).toHaveText('51–100 of 1,234');
  await expect(card).not.toHaveClass(/ds-stale/);
  await expect.poll(first).not.toBe(before);
});

test('keyboard: Tab goes through field and buttons; a blocked button keeps its focus and does nothing', async ({ page, browserName }) => {
  await open(page);
  const bar = nav(page, 'default');
  const previous = bar.getByRole('button', { name: 'Previous page' });
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  await previous.focus();
  await page.keyboard.press('Enter');
  await expect(previous).toBeFocused();
  await expect(bar.locator('.ds-pagination__range')).toHaveText('1–50 of 1,234');
  if (browserName !== 'webkit') {
    await bar.locator('select').focus();
    const order = [];
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab');
      order.push(await page.evaluate(() => document.activeElement.getAttribute('aria-label')));
    }
    expect(order).toEqual(['First page', 'Previous page', 'Next page', 'Last page']);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Space');
    await expect(bar.locator('.ds-pagination__range')).toHaveText('51–100 of 1,234');
  }
});

test('names and roles: a named nav, named buttons, the current page, a live range', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('navigation', { name: 'Pages, numbered' })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Pages of devices' })).toHaveCount(1);
  const numbered = nav(page, 'numbered');
  await expect(numbered.getByRole('list')).toHaveCount(1);
  await expect(numbered.getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(numbered.locator('.ds-pagination__range')).toHaveAttribute('aria-live', 'polite');
  await expect(numbered.getByRole('spinbutton', { name: 'Go to page' })).toHaveCount(1);
});

test('forced colours: the current page is SelectedItem, its figure SelectedItemText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const colours = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'background: SelectedItem; color: SelectedItemText';
    document.body.append(probe);
    const want = getComputedStyle(probe);
    const result = { background: want.backgroundColor, color: want.color };
    probe.remove();
    const on = getComputedStyle(document.querySelector('[data-demo="numbered"] [aria-current="page"]'));
    return { want: result, got: { background: on.backgroundColor, color: on.color } };
  });
  expect(colours.got).toEqual(colours.want);
});

test('print: hidden', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  await expect(nav(page, 'default')).toBeHidden();
});
