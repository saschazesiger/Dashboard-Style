/**
 * The date range picker (3.0): a relative preset resolved against today and
 * named in the field; the popover with its presets and two months, the
 * range picked with the keys and the pointer with its preview, a preset
 * that applies at once, Escape without a change, typing that drops the
 * preset, ds:change from the root; one month and no tag on a phone; names
 * and roles; forced colours. Runs on the generated fixture of the demo, with
 * pickers of its own mounted on it, at a fixed date (2026-11-04), and in
 * the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

test.use({ locale: 'en-US', timezoneId: 'UTC' });

async function open(page) {
  await page.clock.setFixedTime(new Date('2026-11-04T10:10:00Z'));
  await page.goto('/test/browser/fixtures/component.html?c=daterange');
  await ready(page);
  await page.mouse.move(1, 1);
}

async function mount(page, attrs) {
  await page.evaluate((html) => {
    const host = document.createElement('div');
    host.id = 'fx-mine';
    host.innerHTML = html;
    document.querySelector('#fx-component').prepend(host);
    window.DS.init(host);
    window.fxEvents = [];
    host.addEventListener('ds:change', (event) => window.fxEvents.push(event.detail));
  }, `<span id="fx-label">Report period</span><div class="ds-picker" data-ds-daterange ${attrs}>
    <div class="ds-datefield" role="group" aria-labelledby="fx-label">
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button">o</button></div></div>`);
  return {
    root: page.locator('#fx-mine .ds-picker'),
    field: page.locator('#fx-mine .ds-datefield'),
    toggle: page.locator('#fx-mine .ds-datefield__toggle'),
    panel: page.locator('#fx-mine .ds-picker__popover'),
  };
}

const controller = (root, fn) => root.evaluate((el, body) => new Function('range', `return (${body})(range);`)(window.DS.daterange.create(el)), fn.toString());
const day = (panel, date) => panel.locator(`.ds-calendar__day[data-date="${date}"]`);
const events = (page) => page.evaluate(() => window.fxEvents);

test('a preset resolves against today, is named in the field and is its description; get() keeps the preset', async ({ page }) => {
  await open(page);
  const { root, field } = await mount(page, 'data-ds-value="last-7-days"');
  expect(await controller(root, (range) => range.get())).toBe('last-7-days');
  expect(await controller(root, (range) => range.range())).toEqual({ start: '2026-10-29', end: '2026-11-04', preset: 'last-7-days' });
  const tag = field.locator('.ds-daterange__preset');
  await expect(tag).toHaveText('Last 7 days');
  expect((await field.getAttribute('aria-describedby')).split(' ')).toContain(await tag.getAttribute('id'));
  const resolved = await page.evaluate(() => ['today', 'yesterday', 'last-30-days', 'this-week', 'last-week', 'this-month', 'last-month', 'this-year', 'last-year']
    .map((key) => [key, window.DS.daterange.resolve(key, { firstDay: 1 })]));
  expect(Object.fromEntries(resolved)).toEqual({
    today: { start: '2026-11-04', end: '2026-11-04' },
    yesterday: { start: '2026-11-03', end: '2026-11-03' },
    'last-30-days': { start: '2026-10-06', end: '2026-11-04' },
    'this-week': { start: '2026-11-02', end: '2026-11-04' },
    'last-week': { start: '2026-10-26', end: '2026-11-01' },
    'this-month': { start: '2026-11-01', end: '2026-11-04' },
    'last-month': { start: '2026-10-01', end: '2026-10-31' },
    'this-year': { start: '2026-01-01', end: '2026-11-04' },
    'last-year': { start: '2025-01-01', end: '2025-12-31' },
  });
});

test('the popover: presets and two months; the keys pick a range with its preview, close it and give focus back', async ({ page }) => {
  await open(page);
  const { root, toggle, panel, field } = await mount(page, 'data-ds-value="last-7-days"');
  await toggle.click();
  await expect(page.getByRole('dialog', { name: 'Choose dates' })).toBeVisible();
  await expect(panel.getByRole('group', { name: 'Presets' })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-current', 'true');
  await expect(panel.getByRole('grid')).toHaveCount(2);
  await expect(day(panel, '2026-10-29')).toBeFocused();
  // A new range: start on Nov 9, preview to Nov 12, end there.
  await day(panel, '2026-11-09').focus();
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(day(panel, '2026-11-10').locator('xpath=..')).toHaveAttribute('data-preview', 'middle');
  await expect(day(panel, '2026-11-12').locator('xpath=..')).toHaveAttribute('data-preview', 'end');
  await page.keyboard.press('Enter');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await controller(root, (range) => range.get())).toBe('2026-11-09/2026-11-12');
  expect(await events(page)).toEqual([{ value: '2026-11-09/2026-11-12', start: '2026-11-09', end: '2026-11-12', preset: '', valid: true }]);
  await expect(field.locator('.ds-daterange__preset')).toBeHidden();
  expect(await field.getAttribute('aria-describedby')).toBeNull();
});

test('the pointer previews the range; the foot says it in words; a preset applies at once', async ({ page }) => {
  await open(page);
  const { root, toggle, panel } = await mount(page, '');
  await toggle.click();
  await day(panel, '2026-11-16').click();
  await expect(panel.locator('.ds-daterange__summary')).toHaveText('Nov 16, 2026');
  await expect(panel.locator('.ds-daterange__summary')).toHaveAttribute('aria-live', 'polite');
  await day(panel, '2026-11-19').hover();
  await expect(day(panel, '2026-11-17').locator('xpath=..')).toHaveAttribute('data-preview', 'middle');
  await day(panel, '2026-11-19').click();
  await expect(panel).toBeHidden();
  expect(await controller(root, (range) => range.get())).toBe('2026-11-16/2026-11-19');
  await toggle.click();
  await expect(panel.locator('.ds-daterange__summary')).toHaveText('Nov 16 – 19, 2026');
  await panel.getByRole('button', { name: 'This month' }).click();
  await expect(panel).toBeHidden();
  expect(await controller(root, (range) => range.get())).toBe('this-month');
  expect((await events(page)).at(-1)).toEqual({ value: 'this-month', start: '2026-11-01', end: '2026-11-04', preset: 'this-month', valid: true });
});

test('Escape changes nothing; typing drops the preset; presets of the markup, none at all', async ({ page }) => {
  await open(page);
  const { root, toggle, panel } = await mount(page, 'data-ds-value="yesterday" data-ds-daterange-presets="today,yesterday,last-90-days"');
  await toggle.click();
  await expect(panel.locator('.ds-picker__preset')).toHaveText(['Today', 'Yesterday', 'Last 90 days']);
  await day(panel, '2026-11-03').press('Enter');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  expect(await controller(root, (range) => range.get())).toBe('yesterday');
  expect(await events(page)).toEqual([]);
  await root.locator('.ds-datefield__segment[data-segment="end.day"]').focus();
  await page.keyboard.press('ArrowUp');
  expect(await controller(root, (range) => range.get())).toBe('2026-11-03/2026-11-04');
  expect((await events(page)).at(-1).preset).toBe('');
  await page.evaluate(() => document.querySelector('#fx-mine').remove());
  const bare = await mount(page, 'data-ds-daterange-presets=""');
  await bare.toggle.click();
  await expect(bare.panel.locator('.ds-picker__presets')).toHaveCount(0);
});

test('on a phone: one month under the presets, and the tag steps aside for the two dates', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await open(page);
  const { toggle, panel, field } = await mount(page, 'data-ds-value="last-7-days"');
  await expect(field.locator('.ds-daterange__preset')).toBeHidden();
  const width = await field.evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(360 - 16);
  await toggle.click();
  await settle(page);
  await expect(panel.getByRole('grid')).toHaveCount(1);
  const box = await panel.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
});

test('forced colours: the tag keeps a border; the preset in force is SelectedItem', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const { toggle, panel, field } = await mount(page, 'data-ds-value="last-7-days"');
  expect(await field.locator('.ds-daterange__preset').evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
  await toggle.click();
  await settle(page);
  const [current, selected] = await panel.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'SelectedItem';
    el.append(probe);
    const out = [getComputedStyle(el.querySelector('[aria-current="true"]')).backgroundColor, getComputedStyle(probe).color];
    probe.remove();
    return out;
  });
  expect(current).toBe(selected);
});
