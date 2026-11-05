/**
 * The button group: one pill outline (outer corners at half the height
 * times --ds-shape, square inner corners, neighbours sharing one line), at
 * every size x density and under .ds-touch; the press morph on the outer
 * corners only; the divider of a filled group; a toggle that is on keeps
 * the outline; the focused button's ring over its neighbours; the
 * full-width group at a phone width; names; forced colours. Runs in
 * `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, focusByKeyboard, press } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=button-group');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** A group of three in `classes`, measured: each button's box and corners. */
const measure = (page, classes, look = '') => page.evaluate(({ classes, look }) => {
  const region = document.createElement('div');
  region.className = classes;
  region.innerHTML = `<div class="ds-btn-group" role="group" aria-label="Probe"><button class="ds-btn ${look}" type="button">One</button><button class="ds-btn ${look}" type="button">Two</button><button class="ds-btn ${look}" type="button">Three</button></div>`;
  document.querySelector('#fx-component').append(region);
  const out = [...region.querySelectorAll('.ds-btn')].map((el) => {
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return { line: parseFloat(style.lineHeight), left: box.left, right: box.right, height: box.height, ss: parseFloat(style.borderStartStartRadius), se: parseFloat(style.borderStartEndRadius), es: parseFloat(style.borderEndStartRadius), ee: parseFloat(style.borderEndEndRadius) };
  });
  region.remove();
  return out;
}, { classes, look });

test('one pill: the outer corners at half the height, the inner square, one shared line', async ({ page }) => {
  await open(page);
  const [first, middle, last] = await measure(page, '');
  expect(first.height).toBe(40);
  expect([first.ss, first.es, first.se, first.ee]).toEqual([20, 20, 0, 0]);
  expect([middle.ss, middle.es, middle.se, middle.ee]).toEqual([0, 0, 0, 0]);
  expect([last.ss, last.es, last.se, last.ee]).toEqual([0, 0, 20, 20]);
  // Neighbours overlap by their 1px border.
  expect(middle.left).toBeCloseTo(first.right - 1, 1);
  expect(last.left).toBeCloseTo(middle.right - 1, 1);
});

test('every size x density, and .ds-touch over both; the shape scales the outer corners', async ({ page }) => {
  await open(page);
  for (const touch of ['', ' ds-touch']) {
    for (const [density, d] of DENSITIES) {
      for (const [size, s] of SIZES) {
        const [first] = await measure(page, `${size} ${density}${touch}`);
        // Never below its line of text and border (xs at a dense density), as the button.
        const height = Math.max(touch ? 48 : 0, 40 + s * 8 + d * 4, first.line + 2);
        expect(first.height, `${size} ${density}${touch}`).toBeCloseTo(height, 1);
        // The pill of the computed box (the button's own formula).
        expect(first.ss, `${size} ${density}${touch}`).toBeCloseTo(Math.max(touch ? 48 : 0, 40 + s * 8 + d * 4) / 2, 1);
      }
    }
  }
  expect((await measure(page, 'ds-shape-square'))[0].ss).toBe(0);
  expect((await measure(page, 'ds-shape-soft'))[0].ss).toBe(10);
  expect((await measure(page, 'ds-shape-round'))[2].ee).toBe(20);
  // Icon buttons: square targets, the pill of their own height.
  const icons = await page.evaluate(() => {
    const group = document.querySelector('.ds-btn-group:has(.ds-btn--icon)');
    return [...group.children].map((el) => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height, r: parseFloat(getComputedStyle(el).borderStartStartRadius) }));
  });
  expect(icons[0]).toEqual({ w: 40, h: 40, r: 20 });
});

test('the press morphs the outer corners only, and they spring back', async ({ page }) => {
  await open(page);
  const first = page.locator('[data-demo="outlined"] .ds-btn').first();
  const middle = page.locator('[data-demo="outlined"] .ds-btn').nth(1);
  const box = await first.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Held: the squarer pressed radius (12px), the inner corners stay square.
  await expect.poll(() => first.evaluate((el) => parseFloat(getComputedStyle(el).borderStartStartRadius))).toBeCloseTo(12, 0);
  const pressed = await first.evaluate((el) => ({ ss: parseFloat(getComputedStyle(el).borderStartStartRadius), se: parseFloat(getComputedStyle(el).borderStartEndRadius) }));
  await page.mouse.up();
  expect(pressed.ss).toBeCloseTo(12, 0);
  expect(pressed.se).toBe(0);
  await expect.poll(() => first.evaluate((el) => parseFloat(getComputedStyle(el).borderStartStartRadius))).toBe(20);
  // A middle button has no outer corners to morph.
  await press(middle, { holdMs: 200 });
  expect(await middle.evaluate((el) => parseFloat(getComputedStyle(el).borderStartStartRadius))).toBe(0);
});

test('a filled group parts its buttons with a hairline in the label colour', async ({ page }) => {
  await open(page);
  const lines = await page.locator('[data-demo="filled"] .ds-btn').evaluateAll((list) => list.map((el) => ({ start: getComputedStyle(el).borderInlineStartColor, bg: getComputedStyle(el).backgroundColor })));
  expect(lines[1].start).not.toBe(lines[1].bg);
  expect(lines[1].start).toBe(lines[2].start);
});

test('toggles in a group: the one that is on keeps the outline and lies over its neighbours', async ({ page }) => {
  await open(page);
  const group = page.locator('[data-demo="toggles"]');
  const day = group.getByRole('button', { name: 'Day' });
  const week = group.getByRole('button', { name: 'Week' });
  const on = await day.evaluate((el) => ({ border: getComputedStyle(el).borderTopColor, z: getComputedStyle(el).zIndex, bg: getComputedStyle(el).backgroundColor }));
  const off = await week.evaluate((el) => ({ border: getComputedStyle(el).borderTopColor, bg: getComputedStyle(el).backgroundColor }));
  expect(on.border).toBe(off.border);
  expect(on.bg).not.toBe(off.bg);
  expect(Number(on.z)).toBeGreaterThan(0);
  await week.click();
  await expect(week).toHaveAttribute('aria-pressed', 'true');
  await expect(day).toHaveAttribute('aria-pressed', 'false');
});

test('keyboard: every button a tab stop; the focused one\'s ring lies over its neighbours', async ({ page }) => {
  await open(page);
  const group = page.locator('[data-demo="outlined"]');
  await expect(group).toHaveAttribute('role', 'group');
  await expect(group).toHaveAccessibleName('Zoom (outlined)');
  const buttons = group.getByRole('button');
  await focusByKeyboard(page, buttons.nth(0));
  await page.keyboard.press('Tab');
  await expect(buttons.nth(1)).toBeFocused();
  const z = await buttons.nth(1).evaluate((el) => ({ z: Number(getComputedStyle(el).zIndex), outline: getComputedStyle(el).outlineStyle }));
  expect(z.outline).toBe('solid');
  const raised = await buttons.nth(1).evaluate(() => {
    const probe = document.createElement('span');
    probe.style.zIndex = 'var(--ds-z-pinned)';
    document.querySelector('#fx-component').append(probe);
    const value = Number(getComputedStyle(probe).zIndex);
    probe.remove();
    return value;
  });
  expect(z.z).toBe(raised);
});

test('full width at 360px: the buttons share the line, a long label ends in an ellipsis', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const block = page.locator('[data-demo="block"]');
  const out = await block.evaluate((el) => ({
    group: el.getBoundingClientRect().width,
    parent: el.parentElement.getBoundingClientRect().width,
    widths: [...el.children].map((child) => Math.round(child.getBoundingClientRect().width)),
    cut: [...el.querySelectorAll('.ds-btn__label')].some((label) => label.scrollWidth > label.clientWidth),
    overflow: getComputedStyle(el.querySelector('.ds-btn__label')).textOverflow,
  }));
  expect(out.group).toBeLessThanOrEqual(out.parent + 0.5);
  expect(Math.max(...out.widths) - Math.min(...out.widths)).toBeLessThanOrEqual(1);
  expect(out.overflow).toBe('ellipsis');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('forced colours: the shared lines stay ButtonBorder, a toggle that is on Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => {
    const probe = document.createElement('span');
    document.querySelector('#fx-component').append(probe);
    probe.style.color = 'ButtonBorder';
    const border = getComputedStyle(probe).color;
    probe.style.color = 'Highlight';
    const highlight = getComputedStyle(probe).color;
    probe.remove();
    return { border, highlight };
  });
  const middle = page.locator('[data-demo="outlined"] .ds-btn').nth(1);
  expect(await middle.evaluate((el) => getComputedStyle(el).borderInlineStartColor)).toBe(system.border);
  const day = page.locator('[data-demo="toggles"] [aria-pressed="true"]');
  expect(await day.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(system.highlight);
  // The pill holds in forced colours too.
  expect(await page.locator('[data-demo="outlined"] .ds-btn').first().evaluate((el) => parseFloat(getComputedStyle(el).borderStartStartRadius))).toBe(20);
});
