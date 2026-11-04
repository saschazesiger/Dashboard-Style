/**
 * The utilities on the options model (3.0), on their demo: .ds-pressable
 * under .ds-touch and .ds-shape-*, its keyboard and names, its blocked
 * states; .ds-kbd under .ds-shape-*; the actions on demand on a pointer, by
 * focus and under .ds-touch; the dividers; .ds-stale; forced colours. Runs
 * in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=utilities');
  await ready(page);
  await page.mouse.move(1, 1);
}

const add = (page, html) => page.evaluate((markup) => {
  const region = document.createElement('div');
  region.id = 'probe';
  region.insertAdjacentHTML('beforeend', markup);
  document.getElementById('probe')?.remove();
  document.getElementById('fx-component').prepend(region);
}, html);

test('touch: a pressable element is at least the touch target high; without it its content decides', async ({ page }) => {
  await open(page);
  await add(page, '<div class="ds-pressable" tabindex="0" id="plain">A</div><div class="ds-touch"><div class="ds-pressable" tabindex="0" id="touch">A</div></div>');
  const height = (id) => page.$eval(`#${id}`, (el) => el.getBoundingClientRect().height);
  expect(await height('touch')).toBe(48);
  expect(await height('plain')).toBeLessThan(40);
});

test('shape: multiplies the radius of a pressable element and a key; a hook is the base', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-shape-square"><div class="ds-pressable" id="square">A</div><kbd class="ds-kbd" id="kbd-square">K</kbd></div>
    <div class="ds-shape-soft"><div class="ds-pressable" id="soft">A</div><kbd class="ds-kbd" id="kbd-soft">K</kbd></div>
    <div class="ds-pressable" id="default">A</div><kbd class="ds-kbd" id="kbd-default">K</kbd>
    <div class="ds-shape-round"><div class="ds-pressable" style="--ds-pressable-radius:4px" id="hook">A</div></div>`);
  const radius = (id) => page.$eval(`#${id}`, (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(await radius('square')).toBe(0);
  expect(await radius('soft')).toBe(4);
  expect(await radius('default')).toBe(8);
  expect(await radius('hook')).toBe(6);
  expect(await radius('kbd-square')).toBe(0);
  expect(await radius('kbd-soft')).toBe(2);
  expect(await radius('kbd-default')).toBe(4);
});

test('a pressable element: the layer on hover and focus, a ring that snaps in; Enter presses it where the page wires it', async ({ page }) => {
  await open(page);
  const row = page.locator('[data-demo="pressable"] [data-demo="row"]').first();
  await expect(row).toHaveRole('button');
  await expect(row).toHaveAccessibleName('LAPTOP-0042');
  await row.hover();
  await settle(page);
  expect(parseFloat(await row.evaluate((el) => getComputedStyle(el, '::before').opacity))).toBeGreaterThan(0);
  await page.mouse.move(1, 1);
  await focusByKeyboard(page, row);
  await settle(page);
  const focus = await row.evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, offset: getComputedStyle(el).outlineOffset, layer: parseFloat(getComputedStyle(el, '::before').opacity) }));
  expect(focus.style).toBe('solid');
  expect(focus.offset).toBe('2px');
  expect(focus.layer).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('.ds-toast').filter({ hasText: 'Opened LAPTOP-0042' })).toBeVisible();
  const inset = page.locator('.ds-pressable--inset');
  await focusByKeyboard(page, inset);
  await settle(page);
  expect(await inset.evaluate((el) => getComputedStyle(el).outlineOffset)).toBe('-2px');
});

test('blocked: aria-disabled and aria-busy show no press layer and the not-allowed cursor; aria-disabled keeps the focus layer', async ({ page }) => {
  await open(page);
  const blocked = page.locator('[data-demo="pressable"] [aria-disabled="true"]');
  const busy = page.locator('[data-demo="pressable"] [aria-busy="true"]');
  await expect(blocked).toHaveCSS('cursor', 'not-allowed');
  await expect(busy).toHaveCSS('cursor', 'not-allowed');
  await blocked.hover();
  await settle(page);
  expect(await blocked.evaluate((el) => getComputedStyle(el, '::before').opacity)).toBe('0');
  await page.mouse.move(1, 1);
  await focusByKeyboard(page, blocked);
  await settle(page);
  expect(parseFloat(await blocked.evaluate((el) => getComputedStyle(el, '::before').opacity))).toBeGreaterThan(0);
});

test('actions on demand: on a pointed row, by focus, by data-ds-shown; under .ds-touch always', async ({ page }) => {
  await open(page);
  const actions = page.locator('[data-demo="actions"] .ds-hover-actions');
  const opacity = (index) => actions.nth(index).evaluate((el) => getComputedStyle(el).opacity);
  await settle(page);
  expect(await opacity(0)).toBe('0');
  expect(await opacity(2), 'data-ds-shown').toBe('1');
  await page.locator('[data-demo="actions"] tr').nth(0).hover();
  await settle(page);
  expect(await opacity(0)).toBe('1');
  await page.mouse.move(1, 1);
  await settle(page);
  expect(await opacity(0)).toBe('0');
  // A button stays named and in the tab order: focus shows it.
  const button = page.getByRole('button', { name: 'Edit LAPTOP-0017' });
  await focusByKeyboard(page, button);
  await settle(page);
  expect(await opacity(1)).toBe('1');
  await page.evaluate(() => {
    document.activeElement.blur();
    document.getElementById('fx-component').classList.add('ds-touch');
  });
  await settle(page);
  expect(await opacity(0)).toBe('1');
});

test('dividers: a hairline across, inset, upright and around a caption', async ({ page }) => {
  await open(page);
  const read = await page.locator('[data-demo="dividers"]').evaluate((root) => {
    const style = (selector, pseudo) => getComputedStyle(root.querySelector(selector), pseudo);
    return {
      across: style('hr:not(.ds-divider--inset)').borderTopWidth,
      inset: style('.ds-divider--inset').marginInlineStart,
      upright: style('.ds-divider--vertical').borderInlineStartWidth,
      caption: style('.ds-divider--label', '::before').borderTopWidth,
    };
  });
  expect(read).toEqual({ across: '1px', inset: '16px', upright: '1px', caption: '1px' });
  await expect(page.locator('[data-demo="dividers"] [role="separator"]')).toHaveCount(2);
});

test('.ds-stale dims only after the loader delay and returns at once; .ds-sr stays read', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="stale-list"]');
  await page.locator('[data-demo="refresh"]').click();
  await expect(list).toHaveClass(/\bds-stale\b/);
  await expect(list).toHaveAttribute('aria-busy', 'true');
  await expect(list).not.toHaveClass(/\bds-stale\b/, { timeout: 5000 });
  expect(await list.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  const sr = page.locator('[data-demo="text"] .ds-sr');
  expect(await sr.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-demo="text"]')).toContainText('a screen reader reads it');
});

test('an icon fills while its control is on', async ({ page }) => {
  await open(page);
  const button = page.getByRole('button', { name: 'Helpful' });
  const fill = () => button.locator('svg > :last-child').evaluate((el) => getComputedStyle(el).fill);
  await settle(page);
  const off = await fill();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await settle(page);
  expect(await fill()).not.toBe(off);
});

test('forced colours: a pressable element shows no layer and keeps the ring', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const row = page.locator('[data-demo="pressable"] [data-demo="row"]').first();
  expect(await row.evaluate((el) => getComputedStyle(el, '::before').display)).toBe('none');
  await focusByKeyboard(page, row);
  await settle(page);
  expect(await row.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  expect(await page.locator('.ds-kbd').first().evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
});
