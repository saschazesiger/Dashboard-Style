/**
 * The listbox (3.0): an option's height at every size x density and under
 * .ds-touch, the keys of the WAI listbox (one value follows the focus,
 * several toggle, Shift moves and toggles, Ctrl+A, type-ahead, blocked
 * options passed by), names and states, the data path windowed by
 * DS.virtual with the filter's marks, and forced colours.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=listbox');
  await ready(page);
  await page.mouse.move(1, 1);
}

const single = (page) => page.locator('[data-demo="single"]');
const multi = (page) => page.locator('[data-demo="multi"]');
const activeName = (list) => list.evaluate((el) => {
  const id = el.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id)?.querySelector('.ds-listbox__name')?.textContent : null;
});
const chosen = (list) => list.evaluate((el) => [...el.querySelectorAll('[aria-selected="true"] .ds-listbox__name')].map((name) => name.textContent));

test('an option at every size x density, and .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<div class="ds-listbox" role="listbox" aria-label="Probe"><div class="ds-listbox__option" role="option" aria-selected="false"><span class="ds-listbox__name">Row</span></div></div>';
          document.querySelector('#fx-component').append(region);
          const option = region.querySelector('.ds-listbox__option');
          out.push({ touch, density, size, height: option.getBoundingClientRect().height, line: parseFloat(getComputedStyle(option.firstElementChild).lineHeight) });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const padding = 2 * (8 + density * 2);
    expect(entry.height, `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`).toBeCloseTo(Math.max(entry.touch ? 48 : 0, 40 + step * 8 + density * 4, entry.line + padding), 0);
  }
});

test('one value: a tab stop, the arrows move and the choice follows; Home, End and type-ahead', async ({ page }) => {
  await open(page);
  const list = single(page);
  await expect(list).toHaveAttribute('role', 'listbox');
  await expect(list).toHaveAttribute('tabindex', '0');
  await list.focus();
  expect(await activeName(list)).toBe('Laptop 14');
  await page.keyboard.press('ArrowDown');
  expect(await activeName(list)).toBe('Laptop 16');
  expect(await chosen(list)).toEqual(['Laptop 16']);
  await expect(page.locator('[data-demo="single"] + [data-demo-out]')).toHaveText('Laptop 16');
  await page.keyboard.press('End');
  expect(await activeName(list)).toBe('Field tablet');
  await page.keyboard.press('Home');
  expect(await activeName(list)).toBe('Laptop 13');
  await page.keyboard.type('w');
  expect(await activeName(list)).toBe('Workstation 15');
  expect(await chosen(list)).toEqual(['Workstation 15']);
  // The active option is in view inside the box.
  const inView = await list.evaluate((el) => {
    const option = document.getElementById(el.getAttribute('aria-activedescendant'));
    const box = el.getBoundingClientRect();
    const rect = option.getBoundingClientRect();
    return rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1;
  });
  expect(inView).toBe(true);
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-demo="single"]'), 'listbox').get())).toBe('workstation-15');
});

test('several values: Space toggles, blocked options are passed by, Shift moves and toggles, Ctrl+A all and none', async ({ page }) => {
  await open(page);
  const list = multi(page);
  await expect(list).toHaveAttribute('aria-multiselectable', 'true');
  await list.focus();
  expect(await activeName(list)).toBe('Mini desktop');
  await page.keyboard.press('Space');
  expect(await chosen(list)).toEqual([]);
  // Tower 5 is blocked: ArrowDown skips it.
  await page.keyboard.press('ArrowDown');
  expect(await activeName(list)).toBe('Field tablet');
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowDown');
  expect(await chosen(list)).toEqual(['Workstation 15']);
  await page.keyboard.press('ControlOrMeta+a');
  expect(await chosen(list)).toEqual(['Laptop 14', 'Workstation 15', 'Mini desktop', 'Field tablet']);
  await page.keyboard.press('ControlOrMeta+a');
  expect(await chosen(list)).toEqual([]);
  // A click toggles, the box keeps the focus.
  await page.locator('[data-demo="multi"] [data-value="tablet"]').click();
  expect(await chosen(list)).toEqual(['Field tablet']);
  await expect(list).toBeFocused();
  await page.locator('[data-demo="multi"] [data-value="tower"]').click({ force: true });
  expect(await chosen(list)).toEqual(['Field tablet']);
  await expect(page.locator('[data-demo="multi"] + [data-demo-out]')).toHaveText('1 chosen: Field tablet');
});

test('names, groups and the states', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('listbox', { name: 'Model', exact: true })).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'Models to order' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Desktops' })).toBeVisible();
  await expect(page.getByRole('option', { name: /^Laptop 14/ }).first()).toHaveAttribute('aria-selected', 'true');
  // The chosen option takes the label weight and the check shows: never colour alone.
  const look = await page.evaluate(() => {
    const on = document.querySelector('[data-demo="single"] [aria-selected="true"]');
    const off = document.querySelector('[data-demo="single"] [aria-selected="false"]');
    return {
      weights: [getComputedStyle(on.querySelector('.ds-listbox__name')).fontWeight, getComputedStyle(off.querySelector('.ds-listbox__name')).fontWeight],
      check: [getComputedStyle(on.querySelector('.ds-listbox__check')).opacity, getComputedStyle(off.querySelector('.ds-listbox__check')).opacity],
    };
  });
  expect(Number(look.weights[0])).toBeGreaterThan(Number(look.weights[1]));
  expect(look.check).toEqual(['1', '0']);
});

test('data: 10,000 options windowed, the active one rendered, a filter that marks its letters', async ({ page }) => {
  await open(page);
  const long = page.locator('[data-demo="long"]');
  const count = await long.locator('[role="option"]').count();
  expect(count).toBeGreaterThan(4);
  expect(count).toBeLessThan(60);
  await expect(long.locator('[role="option"]').first()).toHaveAttribute('aria-setsize', '10000');
  await long.focus();
  await page.keyboard.press('End');
  const last = await long.evaluate((el) => document.getElementById(el.getAttribute('aria-activedescendant'))?.getAttribute('aria-posinset'));
  expect(last).toBe('10000');
  await page.keyboard.press('Space');
  await expect(page.locator('[data-demo="long"] + [data-demo-out]')).toHaveText('1 chosen');
  await page.locator('[data-demo="search"]').fill('lap 4');
  await expect(page.locator('[data-demo="long"] + [data-demo-out]')).toHaveText(/^\d+ matches$/);
  const first = long.locator('[role="option"]').first();
  await expect(first.locator('.ds-listbox__match')).toHaveText(['Lap', '4']);
  // The marks say it by weight and a line, not colour alone.
  const mark = await first.locator('.ds-listbox__match').first().evaluate((el) => [getComputedStyle(el).textDecorationLine, getComputedStyle(el).fontWeight]);
  expect(mark[0]).toBe('underline');
  await page.locator('[data-demo="search"]').fill('zzzz');
  await expect(long.locator('[role="option"]')).toHaveCount(0);
});

test('a disabled listbox is no tab stop and chooses nothing', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'ds-listbox';
    el.setAttribute('role', 'listbox');
    el.setAttribute('aria-label', 'Probe');
    el.setAttribute('aria-disabled', 'true');
    el.setAttribute('tabindex', '-1');
    el.innerHTML = '<div class="ds-listbox__option" role="option" aria-selected="false" data-value="a"><span class="ds-listbox__name">A</span></div>';
    document.querySelector('#fx-component').append(el);
    const list = DS.listbox.create(el);
    el.querySelector('[role="option"]').click();
    const out = list.get();
    list.destroy();
    el.remove();
    return out;
  });
  expect(result).toBeNull();
});

test('forced colours: the chosen option in the selection colours, the check box keeps its edge', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const look = await page.evaluate(() => {
    const on = document.querySelector('[data-demo="multi"] [aria-selected="true"]');
    const box = document.querySelector('[data-demo="multi"] [aria-selected="false"] .ds-listbox__check');
    const probe = document.createElement('div');
    probe.style.cssText = 'background: SelectedItem; border: 1px solid CanvasText';
    document.body.append(probe);
    const expected = { selected: getComputedStyle(probe).backgroundColor, text: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return { fill: getComputedStyle(on).backgroundColor, edge: getComputedStyle(box).borderTopColor, expected, border: getComputedStyle(document.querySelector('[data-demo="multi"]')).borderTopStyle };
  });
  expect(look.fill).toBe(look.expected.selected);
  expect(look.edge).toBe(look.expected.text);
  expect(look.border).toBe('solid');
});
