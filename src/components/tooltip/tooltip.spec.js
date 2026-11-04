/**
 * The tooltip on the options model (3.0): the shape on its radius, one size
 * whatever the density and size around its trigger, the shortcut slot, the
 * keyboard, names and forced colours, and that DS.tooltip and DS.overlay serve
 * one root with one handle. The 2.x behaviour stays in
 * test/browser/toast-tooltip.spec.js and tooltip-touch.spec.js. Runs in the
 * `fallback` project too (the script's placement).
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { focusByKeyboard, ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=tooltip');
  await ready(page);
  await page.mouse.move(1, 1);
}

const tip = (page) => page.locator('.ds-tooltip').first();

test('the shape multiplies the radius; size and density around the trigger change nothing', async ({ page }) => {
  await open(page);
  const radius = await page.evaluate(() => {
    const probe = (classes) => {
      const region = document.createElement('div');
      region.className = classes;
      region.innerHTML = '<div class="ds-tooltip" style="position:static">Probe</div>';
      document.querySelector('#fx-component').append(region);
      const style = getComputedStyle(region.firstChild);
      const out = { radius: parseFloat(style.borderTopLeftRadius), padding: parseFloat(style.paddingLeft), font: style.fontSize };
      region.remove();
      return out;
    };
    return { plain: probe(''), square: probe('ds-shape-square'), round: probe('ds-shape-round'), dense: probe('ds-density-tight ds-lg') };
  });
  expect(radius.plain.radius).toBeGreaterThan(0);
  expect(radius.square.radius).toBe(0);
  expect(radius.round.radius).toBeCloseTo(radius.plain.radius * 1.5, 1);
  expect(radius.dense.padding).toBe(radius.plain.padding);
  expect(radius.dense.font).toBe(radius.plain.font);
});

test('the shortcut slot shows after the text, describes the trigger, and goes with the next tip', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="shortcut"]');
  await focusByKeyboard(page, trigger);
  await expect(tip(page)).toBeVisible();
  await expect(tip(page).locator('.ds-tooltip__shortcut')).toHaveText('Ctrl K');
  await expect(tip(page)).toContainText('Search the list');
  await expect(trigger).toHaveAccessibleDescription(/Search the list\s*Ctrl K/);
  await focusByKeyboard(page, page.locator('[data-demo="blocked"]'));
  await expect(tip(page)).toHaveText('Fill in the serial number first');
  await expect(tip(page).locator('.ds-tooltip__shortcut')).toHaveCount(0);
});

test('the keyboard: focus shows it at once, Escape hides it, it never takes focus; role and description', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="toolbar"] .ds-btn').first();
  await focusByKeyboard(page, trigger);
  await expect(tip(page)).toBeVisible();
  await expect(tip(page)).toHaveAttribute('role', 'tooltip');
  await expect(tip(page)).toHaveText('Edit');
  await expect(trigger, 'its name already says it').not.toHaveAttribute('aria-describedby', /./);
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(tip(page)).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('a tip that repeats its text shows only while that text is cut off', async ({ page }) => {
  await open(page);
  await focusByKeyboard(page, page.locator('[data-demo="fits"]'));
  await page.waitForTimeout(100);
  await expect(tip(page)).toBeHidden();
  await focusByKeyboard(page, page.locator('[data-demo="cut"]'));
  await expect(tip(page)).toBeVisible();
  await expect(page.locator('[data-demo="cut"]'), 'a cut-off text is no description').not.toHaveAttribute('aria-describedby', /./);
});

test('DS.tooltip and DS.overlay serve one root with one handle; DS.init served this page already', async ({ page }) => {
  await open(page);
  expect(await page.evaluate(() => DS.tooltip.tooltips(document) === DS.overlay.tooltips(document))).toBe(true);
  expect(await page.locator('.ds-tooltip').count()).toBe(1);
});

test('forced colours: it keeps its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await focusByKeyboard(page, page.locator('[data-demo="toolbar"] .ds-btn').first());
  await expect(tip(page)).toBeVisible();
  await settle(page);
  const edge = await tip(page).evaluate((el) => getComputedStyle(el).outlineColor);
  expect(edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
});
