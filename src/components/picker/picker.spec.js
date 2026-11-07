/**
 * The picker popover (3.0): the button's ARIA, opening into the top layer
 * below its root with focus inside, Tab kept inside, Escape and focus back
 * on the button, a press outside, Alt+ArrowDown, ds:open and ds:close with
 * the reason, a preset row at every size x density with .ds-touch as a
 * minimum, the shape, and forced colours. Runs on the generated fixture of
 * the demo, and in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=picker');
  await ready(page);
  await page.mouse.move(1, 1);
  await page.evaluate(() => {
    window.fxEvents = [];
    document.addEventListener('ds:open', () => window.fxEvents.push('open'));
    document.addEventListener('ds:close', (event) => window.fxEvents.push(`close:${event.detail?.reason}`));
  });
}

const parts = (page) => ({
  root: page.locator('[data-ds-picker]').first(),
  toggle: page.locator('[data-ds-picker-toggle]').first(),
  panel: page.locator('.ds-picker__popover').first(),
});

const active = (page) => page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 12) ?? '');

test('the button says what it opens; opening puts the dialog in the top layer below the root, focus inside', async ({ page }) => {
  await open(page);
  const { root, toggle, panel } = parts(page);
  await expect(toggle).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await toggle.getAttribute('aria-controls')).toBe(await panel.getAttribute('id'));
  await expect(panel).toBeHidden();
  await toggle.click();
  await expect(panel).toHaveAttribute('data-state', 'open');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toHaveAttribute('role', 'dialog');
  await expect(panel).toHaveAttribute('aria-modal', 'true');
  await expect(page.getByRole('dialog', { name: 'Show devices that are' })).toBeVisible();
  expect(await panel.evaluate((el) => el.matches(':popover-open'))).toBe(true);
  // Focus is on its first tabbable element.
  await expect(panel.locator('.ds-picker__preset').first()).toBeFocused();
  await settle(page);
  const [rootBox, panelBox] = [await root.boundingBox(), await panel.boundingBox()];
  expect(panelBox.y).toBeGreaterThanOrEqual(rootBox.y + rootBox.height);
  expect(Math.abs(panelBox.x - rootBox.x)).toBeLessThan(1);
  expect(await page.evaluate(() => window.fxEvents)).toEqual(['open']);
});

test('Tab and Shift+Tab stay inside; Escape closes and focus is back on the button', async ({ page }) => {
  await open(page);
  const { toggle, panel } = parts(page);
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(panel.locator('.ds-picker__preset').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(panel.locator('[data-demo="done"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(panel.locator('.ds-picker__preset').first()).toBeFocused();
  // A blocked preset stays in the tab order (aria-disabled), so its name is read.
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('Tab');
  await expect(panel.locator('.ds-picker__preset[aria-disabled="true"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  expect(await panel.evaluate((el) => el.matches(':popover-open'))).toBe(false);
  expect(await page.evaluate(() => window.fxEvents)).toEqual(['open', 'close:escape']);
});

test('a press outside closes it and leaves focus where it went; Alt+ArrowDown in the root opens it; the page closes it', async ({ page }) => {
  await open(page);
  const { root, toggle, panel } = parts(page);
  await toggle.click();
  await expect(panel).toHaveAttribute('data-state', 'open');
  await page.mouse.click(5, 5);
  await expect(panel).toBeHidden();
  await expect(toggle).not.toBeFocused();
  await toggle.focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(panel).toHaveAttribute('data-state', 'open');
  // The page's own choice: DS.picker.close() from the demo's Done.
  await panel.locator('[data-demo="done"]').click();
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await root.evaluate((el) => window.DS.picker.create(el).get())).toBe(false);
  const events = await page.evaluate(() => window.fxEvents);
  expect(events[1]).toBe('close:outside');
  expect(events.at(-1)).toBe('close:api');
});

test('a second click on the button closes it; a disabled button opens nothing', async ({ page }) => {
  await open(page);
  const { toggle, panel } = parts(page);
  await toggle.click();
  await expect(panel).toHaveAttribute('data-state', 'open');
  await toggle.click();
  await expect(panel).toBeHidden();
  await toggle.evaluate((el) => el.setAttribute('aria-disabled', 'true'));
  await toggle.click({ force: true });
  await toggle.focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(panel).toBeHidden();
});

test('a preset row at every size x density, .ds-touch as a minimum; the radius follows the shape; the one in force is bolder', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const box = document.createElement('div');
          box.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          box.innerHTML = '<div class="ds-picker__presets"><button class="ds-picker__preset" type="button">Today</button></div>';
          main.append(box);
          const preset = box.querySelector('.ds-picker__preset');
          out.push({ touch, density, size, line: parseFloat(getComputedStyle(preset).lineHeight), height: preset.getBoundingClientRect().height });
          box.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const level = DENSITIES.find(([density]) => density === entry.density)[1];
    const base = 40 + step * 8 + level * 4;
    // Never less than its line of text.
    expect(entry.height, `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, base, entry.line), 0);
  }
  const { toggle, panel } = parts(page);
  await toggle.click();
  await settle(page);
  const preset = panel.locator('.ds-picker__preset').first();
  const radius = () => preset.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(await radius()).toBeCloseTo(20, 0);
  const weights = await panel.locator('.ds-picker__preset').evaluateAll((items) => items.map((item) => getComputedStyle(item).fontWeight));
  expect(Number(weights[0])).toBeGreaterThan(Number(weights[1]));
  await page.evaluate(() => document.querySelector('[data-ds-picker]').classList.add('ds-shape-square'));
  await expect.poll(radius).toBe(0);
  const panelRadius = await panel.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(panelRadius).toBe(0);
});

test('forced colours: the popover keeps an edge, the preset in force is SelectedItem, a blocked one GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const { toggle, panel } = parts(page);
  await toggle.click();
  await settle(page);
  const styles = await panel.evaluate((el) => {
    const probe = document.createElement('span');
    el.append(probe);
    const system = (name) => {
      probe.style.color = name;
      return getComputedStyle(probe).color;
    };
    const out = {
      selected: system('SelectedItem'),
      gray: system('GrayText'),
      edge: getComputedStyle(el).outlineStyle,
      current: getComputedStyle(el.querySelector('.ds-picker__preset[aria-current="true"]')).backgroundColor,
      blocked: getComputedStyle(el.querySelector('.ds-picker__preset[aria-disabled="true"]')).color,
    };
    probe.remove();
    return out;
  });
  expect(styles.edge).toBe('solid');
  expect(styles.current).toBe(styles.selected);
  expect(styles.blocked).toBe(styles.gray);
});
