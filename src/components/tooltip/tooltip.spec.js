/**
 * The tooltip on the options model (3.0): the shape on its radius, one size
 * whatever the density and size around its trigger, the shortcut slot, the
 * keyboard, names and forced colours, and that DS.tooltip and DS.overlay serve
 * one root with one handle; data-tip-placement on each side (flipped without
 * room) and data-tip-delay. The 2.x behaviour stays in
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

test('a tip that repeats the visible text still shows when it has a shortcut, and only then', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.querySelector('#fx-component').insertAdjacentHTML('beforeend', '<button class="ds-btn" type="button" id="with-keys" data-tip="Search" data-tip-shortcut="Ctrl K">Search</button><button class="ds-btn" type="button" id="without-keys" data-tip="Search">Search</button>');
  });
  await focusByKeyboard(page, page.locator('#with-keys'));
  await expect(tip(page)).toBeVisible();
  await expect(tip(page).locator('.ds-tooltip__shortcut')).toHaveText('Ctrl K');
  await focusByKeyboard(page, page.locator('#without-keys'));
  await expect(tip(page)).toBeHidden();
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

test('data-tip-placement puts it on each side of its trigger, flipped to the opposite side without room', async ({ page }) => {
  await open(page);
  for (const side of ['top', 'end', 'bottom', 'start']) {
    const trigger = page.locator(`[data-demo="side-${side}"]`);
    await focusByKeyboard(page, trigger);
    await expect(tip(page)).toBeVisible();
    await settle(page);
    const where = await page.evaluate((demo) => {
      const a = document.querySelector(`[data-demo="${demo}"]`).getBoundingClientRect();
      const b = document.querySelector('.ds-tooltip').getBoundingClientRect();
      if (b.bottom <= a.top + 1) return 'top';
      if (b.top >= a.bottom - 1) return 'bottom';
      if (b.right <= a.left + 1) return 'start';
      if (b.left >= a.right - 1) return 'end';
      return 'over';
    }, `side-${side}`);
    expect(where, side).toBe(side);
    expect(await tip(page).getAttribute('data-placement'), side).toBe(side === 'bottom' ? null : side);
    await page.keyboard.press('Escape');
    await expect(tip(page)).toBeHidden();
  }
  // A trigger at the start edge of the window that asks for "start": the tip goes after it.
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<button class="ds-btn" type="button" id="edge" data-tip="At the edge" data-tip-placement="start" style="position:fixed;left:0;top:300px">Edge</button>');
  });
  await focusByKeyboard(page, page.locator('#edge'));
  await expect(tip(page)).toBeVisible();
  await settle(page);
  await expect(tip(page)).toHaveAttribute('data-placement', 'end');
});

test('data-tip-delay: none shows on hover at once, long waits twice the delay; focus always shows it at once', async ({ page }) => {
  await open(page);
  const timing = await page.evaluate(() => ({ delay: DS.motion.motionDuration(document.querySelector('.ds-theme'), '--ds-delay-tooltip') }));
  await page.locator('[data-demo="delay-none"]').hover();
  await expect(tip(page)).toBeVisible({ timeout: timing.delay / 2 });
  await expect(tip(page)).toHaveText('Shows at once');
  await page.mouse.move(1, 1);
  await expect(tip(page)).toBeHidden();
  // Past the skip window, so no warm-up shows the next one at once.
  await page.waitForTimeout(timing.delay);
  await page.locator('[data-demo="delay-long"]').hover();
  await page.waitForTimeout(timing.delay * 1.4);
  await expect(tip(page)).toBeHidden();
  await expect(tip(page)).toBeVisible({ timeout: timing.delay * 2 });
  await expect(tip(page)).toHaveText('Shows after a longer rest');
  await page.mouse.move(1, 1);
  await expect(tip(page)).toBeHidden();
  await focusByKeyboard(page, page.locator('[data-demo="delay-long"]'));
  await expect(tip(page)).toBeVisible({ timeout: timing.delay / 2 });
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
