/**
 * The date picker (3.0): the WAI-ARIA date picker dialog. The button opens
 * the calendar with focus on the chosen day, a pick closes it and gives focus
 * back, Escape changes nothing, Today and Clear, Alt+ArrowDown in the field,
 * ds:change once from the root whether typed or picked, min, max and blocked
 * days, a date and time (the day, then the time), the zone, read-only, names
 * and roles. Runs on the generated fixture of the demo, with pickers of its
 * own mounted on it, at a fixed date (2026-11-04), and in the `fallback`
 * project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

test.use({ locale: 'en-US', timezoneId: 'UTC' });

async function open(page) {
  await page.clock.setFixedTime(new Date('2026-11-04T10:10:00Z'));
  await page.goto('/test/browser/fixtures/component.html?c=datepicker');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Mounts a date picker of its own (attributes on the root, on the field) and returns its parts. */
async function mount(page, attrs, fieldAttrs = '') {
  await page.evaluate((html) => {
    const host = document.createElement('div');
    host.id = 'fx-mine';
    host.innerHTML = html;
    document.querySelector('#fx-component').prepend(host);
    window.DS.init(host);
    window.fxEvents = [];
    host.addEventListener('ds:change', (event) => window.fxEvents.push({ on: event.target.className.split(' ')[0], ...event.detail }));
  }, `<span id="fx-label">Due date</span><div class="ds-picker" data-ds-datepicker ${attrs}>
    <div class="ds-datefield" role="group" aria-labelledby="fx-label" ${fieldAttrs}>
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button">o</button></div></div>`);
  return {
    root: page.locator('#fx-mine .ds-picker'),
    toggle: page.locator('#fx-mine .ds-datefield__toggle'),
    panel: page.locator('#fx-mine .ds-picker__popover'),
  };
}

const value = (root) => root.evaluate((el) => window.DS.datepicker.create(el).get());
const events = (page) => page.evaluate(() => window.fxEvents);
const day = (panel, date) => panel.locator(`.ds-calendar__day[data-date="${date}"]`);

test('the button opens the calendar on the chosen day; a pick puts it into the field, closes, and focus is back', async ({ page }) => {
  await open(page);
  const { root, toggle, panel } = await mount(page, 'data-ds-value="2026-11-07"');
  await expect(toggle).toHaveAttribute('aria-label', 'Choose date');
  await expect(toggle).toHaveAttribute('aria-haspopup', 'dialog');
  await toggle.click();
  await expect(page.getByRole('dialog', { name: 'Choose date' })).toBeVisible();
  await expect(day(panel, '2026-11-07')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(day(panel, '2026-11-15')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await value(root)).toBe('2026-11-15');
  // One event, from the root: the field inside sends none of its own.
  expect(await events(page)).toEqual([{ on: 'ds-picker', value: '2026-11-15', valid: true }]);
  // The field shows it.
  await expect(root.locator('.ds-datefield__segment[data-segment="day"]')).toHaveText('15');
});

test('Escape closes without a change; an empty field opens on today; Today and Clear', async ({ page }) => {
  await open(page);
  const { root, toggle, panel } = await mount(page, '');
  await toggle.click();
  await expect(day(panel, '2026-11-04')).toBeFocused();
  await expect(day(panel, '2026-11-04')).toHaveAttribute('aria-current', 'date');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await value(root)).toBe('');
  expect(await events(page)).toEqual([]);
  await toggle.click();
  await panel.getByRole('button', { name: 'Today' }).click();
  await expect(panel).toBeHidden();
  expect(await value(root)).toBe('2026-11-04');
  await toggle.click();
  await panel.getByRole('button', { name: 'Clear' }).click();
  expect(await value(root)).toBe('');
  expect((await events(page)).map((entry) => entry.value)).toEqual(['2026-11-04', '']);
});

test('typing sends ds:change from the root; Alt+ArrowDown in the field opens on the typed day', async ({ page }) => {
  await open(page);
  const { root, panel } = await mount(page, 'data-ds-value="2026-11-07"');
  await root.locator('.ds-datefield__segment[data-segment="day"]').focus();
  await page.keyboard.press('ArrowUp');
  expect(await events(page)).toEqual([{ on: 'ds-picker', value: '2026-11-08', valid: true }]);
  await page.keyboard.press('Alt+ArrowDown');
  await expect(day(panel, '2026-11-08')).toBeFocused();
  await expect(day(panel, '2026-11-08').locator('xpath=..')).toHaveAttribute('aria-selected', 'true');
});

test('min, max and blocked days reach the calendar; Today is blocked when today is', async ({ page }) => {
  await open(page);
  const { toggle, panel } = await mount(page, 'data-ds-value="2026-11-10" data-ds-datepicker-min="2026-11-05" data-ds-datepicker-max="2026-12-31" data-ds-datepicker-disabled="6,7" data-ds-datepicker-weeks');
  await toggle.click();
  await expect(day(panel, '2026-11-04')).toHaveAttribute('aria-disabled', 'true');
  await expect(day(panel, '2026-11-07')).toHaveAttribute('aria-disabled', 'true');
  await expect(panel.locator('.ds-calendar__week').first()).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-disabled', 'true');
  await day(panel, '2026-11-07').click({ force: true });
  await expect(panel).toHaveAttribute('data-state', 'open');
});

test('a blocked day typed into the field is invalid, as the calendar would never pick it', async ({ page }) => {
  await open(page);
  const { root } = await mount(page, 'data-ds-value="2026-11-05" data-ds-datepicker-disabled="6,7"');
  const field = root.locator('.ds-datefield');
  await root.locator('.ds-datefield__segment[data-segment="day"]').focus();
  // The 5th is a Thursday: up twice is Saturday the 7th.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  expect((await events(page)).at(-1)).toEqual({ on: 'ds-picker', value: '2026-11-07', valid: false });
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  // Typed digits too.
  await page.keyboard.type('09');
  expect((await events(page)).at(-1)).toEqual({ on: 'ds-picker', value: '2026-11-09', valid: true });
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
  await root.locator('.ds-datefield__segment[data-segment="day"]').focus();
  await page.keyboard.type('08');
  expect((await events(page)).at(-1)).toEqual({ on: 'ds-picker', value: '2026-11-08', valid: false });
  await expect(field).toHaveAttribute('aria-invalid', 'true');
});

test('a date and time: the day goes in and the list takes focus, the time closes it; the zone at the field\'s end', async ({ page }) => {
  await open(page);
  const { root, toggle, panel } = await mount(page, 'data-ds-datepicker-type="datetime" data-ds-datepicker-zone="UTC" data-ds-datepicker-hour-cycle="h23" data-ds-value="2026-11-07T02:30"');
  await expect(root.locator('.ds-datefield__zone')).toHaveAttribute('data-tip', 'Coordinated Universal Time');
  await toggle.click();
  await expect(panel.locator('.ds-datepicker__times .ds-timepicker__list')).toBeVisible();
  await day(panel, '2026-11-09').click();
  await expect(panel).toHaveAttribute('data-state', 'open');
  await expect(panel.getByRole('listbox')).toBeFocused();
  expect(await value(root)).toBe('2026-11-09T02:30');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await value(root)).toBe('2026-11-09T03:00');
  expect(await root.evaluate((el) => window.DS.datepicker.create(el).instant().toISOString())).toBe('2026-11-09T03:00:00.000Z');
  // "Now" in the foot of a date and time.
  await toggle.click();
  await panel.getByRole('button', { name: 'Now' }).click();
  expect(await value(root)).toBe('2026-11-04T10:10');
});

test('"Now" is the wall time in the field\'s zone, not the browser\'s', async ({ page }) => {
  await open(page);
  const { root, toggle, panel } = await mount(page, 'data-ds-datepicker-type="datetime" data-ds-datepicker-zone="America/New_York" data-ds-datepicker-hour-cycle="h23"');
  await toggle.click();
  await panel.getByRole('button', { name: 'Now' }).click();
  expect(await value(root)).toBe('2026-11-04T05:10');
});

test('read-only: the calendar shows the value and the foot goes; a pick changes nothing', async ({ page }) => {
  await open(page);
  const { root, toggle, panel } = await mount(page, 'data-ds-value="2026-11-07"', 'aria-readonly="true"');
  await toggle.click();
  await expect(panel.locator('.ds-picker__foot')).toBeHidden();
  await day(panel, '2026-11-10').click();
  await expect(panel).toBeHidden();
  expect(await value(root)).toBe('2026-11-07');
  expect(await events(page)).toEqual([]);
});
