/**
 * The time picker (3.0): the list of times in its popover (the WAI-ARIA
 * listbox with aria-activedescendant): opening on the chosen time, the
 * arrows, PageUp and PageDown by the hour, Home and End, digits, picking with
 * Enter and the pointer, focus back on the button, Escape without a change;
 * the hour cycle of the locale and of the markup, step, min and max;
 * ds:change from typing and from the list; names and roles; a row at every
 * size x density with .ds-touch as a minimum; forced colours. Runs on the
 * generated fixture of the demo, with pickers of its own mounted on it, and
 * in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

test.use({ locale: 'en-US', timezoneId: 'UTC' });

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.clock.setFixedTime(new Date('2026-11-04T10:10:00Z'));
  await page.goto('/test/browser/fixtures/component.html?c=timepicker');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Mounts a time picker of its own (attributes as text) and returns its parts. */
async function mount(page, attrs) {
  await page.evaluate((html) => {
    const host = document.createElement('div');
    host.id = 'fx-mine';
    host.innerHTML = html;
    document.querySelector('#fx-component').prepend(host);
    window.DS.init(host);
    window.fxEvents = [];
    host.addEventListener('ds:change', (event) => window.fxEvents.push(event.detail));
  }, `<span id="fx-label">Backup at</span><div class="ds-picker" data-ds-timepicker ${attrs}>
    <div class="ds-datefield" role="group" aria-labelledby="fx-label">
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button">o</button></div></div>`);
  return {
    root: page.locator('#fx-mine .ds-picker'),
    toggle: page.locator('#fx-mine .ds-datefield__toggle'),
    list: page.locator('#fx-mine .ds-timepicker__list'),
    panel: page.locator('#fx-mine .ds-picker__popover'),
  };
}

const activeText = (list) => list.evaluate((el) => document.getElementById(el.getAttribute('aria-activedescendant') ?? '')?.textContent ?? null);
const value = (root) => root.evaluate((el) => window.DS.timepicker.create(el).get());

test('the list opens on the chosen time; the keys move, Enter picks, closes and gives focus back', async ({ page }) => {
  await open(page);
  const { root, toggle, list, panel } = await mount(page, 'data-ds-value="02:30"');
  await expect(toggle).toHaveAttribute('aria-label', 'Choose time');
  await toggle.click();
  await expect(panel).toHaveAttribute('data-state', 'open');
  await expect(list).toBeFocused();
  expect(await activeText(list)).toBe('2:30 AM');
  await expect(list.getByRole('option', { name: '2:30 AM', exact: true })).toHaveAttribute('aria-selected', 'true');
  const moves = [['ArrowDown', '3:00 AM'], ['ArrowUp', '2:30 AM'], ['PageDown', '3:30 AM'], ['PageUp', '2:30 AM'], ['End', '11:30 PM'], ['Home', '12:00 AM']];
  for (const [key, expected] of moves) {
    await page.keyboard.press(key);
    expect(await activeText(list), key).toBe(expected);
  }
  // Digits jump to the first time that starts with them.
  await page.keyboard.type('9');
  expect(await activeText(list)).toBe('9:00 AM');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await value(root)).toBe('09:30');
  expect(await page.evaluate(() => window.fxEvents)).toEqual([{ value: '09:30', valid: true }]);
  await expect(root.locator('.ds-datefield__segment[data-segment="hour"]')).toHaveText('09');
});

test('Escape closes without a change; a click picks; an empty value opens near now', async ({ page }) => {
  await open(page);
  const { root, toggle, list, panel } = await mount(page, '');
  await toggle.click();
  // 10:10 now: the nearest listed time is 10:00 AM.
  expect(await activeText(list)).toBe('10:00 AM');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await value(root)).toBe('');
  await toggle.click();
  await list.getByRole('option', { name: '1:00 PM', exact: true }).click();
  await expect(panel).toBeHidden();
  expect(await value(root)).toBe('13:00');
});

test('typing in the field sends ds:change from the root and moves the list\'s choice; Alt+ArrowDown opens it', async ({ page }) => {
  await open(page);
  const { root, list, panel } = await mount(page, 'data-ds-value="02:30"');
  await root.locator('.ds-datefield__segment[data-segment="hour"]').focus();
  await page.keyboard.press('ArrowUp');
  expect(await page.evaluate(() => window.fxEvents)).toEqual([{ value: '03:30', valid: true }]);
  await page.keyboard.press('Alt+ArrowDown');
  await expect(panel).toHaveAttribute('data-state', 'open');
  await expect(list.getByRole('option', { name: '3:30 AM', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('24 hours, step, min and max; seconds keep :00 from the list', async ({ page }) => {
  await open(page);
  const { root, toggle, list } = await mount(page, 'data-ds-timepicker-hour-cycle="h23" data-ds-timepicker-step="15" data-ds-timepicker-min="06:00" data-ds-timepicker-max="20:00" data-ds-timepicker-seconds data-ds-value="07:45:00"');
  await toggle.click();
  const labels = await list.getByRole('option').allTextContents();
  expect(labels[0]).toBe('06:00');
  expect(labels.at(-1)).toBe('20:00');
  expect(labels).toHaveLength(57);
  expect(await activeText(list)).toBe('07:45');
  await page.keyboard.press('PageDown');
  expect(await activeText(list)).toBe('08:45');
  await page.keyboard.press('Enter');
  expect(await value(root)).toBe('08:45:00');
  expect(await page.evaluate(() => window.DS.timepicker.times({ step: 60, min: '22:00' }))).toEqual(['22:00', '23:00']);
});

test('names and roles: the dialog and the listbox are named, each time an option', async ({ page }) => {
  await open(page);
  const { toggle, list } = await mount(page, 'data-ds-value="02:30"');
  await toggle.click();
  await expect(page.getByRole('dialog', { name: 'Choose time' })).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'Choose time' })).toBeFocused();
  await expect(list.getByRole('option')).toHaveCount(48);
  await expect(toggle).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
});

test('a row at every size x density, .ds-touch as a minimum; the chosen row is bolder', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const box = document.createElement('div');
          box.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          box.innerHTML = '<div></div>';
          main.append(box);
          const list = window.DS.timepicker.list(box.firstElementChild, { step: 720 });
          const option = box.querySelector('.ds-timepicker__option');
          out.push({ touch, density, size, line: parseFloat(getComputedStyle(option).lineHeight), height: option.getBoundingClientRect().height });
          list.destroy();
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
    expect(entry.height, `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, base, entry.line), 0);
  }
  const { toggle, list } = await mount(page, 'data-ds-value="02:30"');
  await toggle.click();
  const [chosen, other] = await Promise.all([
    list.getByRole('option', { name: '2:30 AM', exact: true }).evaluate((el) => Number(getComputedStyle(el).fontWeight)),
    list.getByRole('option', { name: '3:00 AM', exact: true }).evaluate((el) => Number(getComputedStyle(el).fontWeight)),
  ]);
  expect(chosen).toBeGreaterThan(other);
});

test('forced colours: the chosen row is SelectedItem, the active one carries a ring', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const { toggle, list } = await mount(page, 'data-ds-value="02:30"');
  await toggle.click();
  await page.keyboard.press('ArrowDown');
  await settle(page);
  const styles = await list.evaluate((el) => {
    const probe = document.createElement('span');
    el.append(probe);
    probe.style.color = 'SelectedItem';
    const selected = getComputedStyle(probe).color;
    probe.remove();
    return {
      selected,
      chosen: getComputedStyle(el.querySelector('[aria-selected="true"]')).backgroundColor,
      ring: getComputedStyle(el.querySelector('[data-active]')).outlineStyle,
    };
  });
  expect(styles.chosen).toBe(styles.selected);
  expect(styles.ring).toBe('solid');
});
