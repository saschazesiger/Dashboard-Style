/**
 * The calendar (3.0): the keys of the WAI-ARIA date grid (a day, a week, the
 * week's ends, a month, a year, turning the page past the months on screen),
 * picking and ds:change, min and max and blocked days, a range with its
 * preview, the locale's first day and week numbers, names and roles, the
 * cell at every size x density with .ds-touch as a minimum, the shape, and
 * forced colours. Runs on the generated fixture of the demo, with its own
 * calendars mounted on it, at a fixed date (2026-11-04), and in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

test.use({ locale: 'en-US', timezoneId: 'UTC' });

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.clock.setFixedTime(new Date('2026-11-04T10:00:00Z'));
  await page.goto('/test/browser/fixtures/component.html?c=calendar');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Mounts a calendar of its own (attributes as text) and returns its locator. */
async function mount(page, attrs) {
  await page.evaluate((html) => {
    const host = document.createElement('div');
    host.id = 'fx-mine';
    host.innerHTML = html;
    document.querySelector('#fx-component').prepend(host);
    window.DS.init(host);
    window.fxEvents = [];
    host.addEventListener('ds:change', (event) => window.fxEvents.push(event.detail));
    host.addEventListener('ds:input', (event) => window.fxEvents.push({ input: event.detail }));
  }, `<div class="ds-calendar" data-ds-calendar ${attrs}></div>`);
  return page.locator('#fx-mine .ds-calendar');
}

const day = (calendar, date) => calendar.locator(`.ds-calendar__day[data-date="${date}"]`);
const focused = (page) => page.evaluate(() => document.activeElement?.getAttribute('data-date') ?? null);

test('the keys of the grid: a day, a week, the week\'s ends, a month, a year; the page turns with the focus', async ({ page }) => {
  await open(page);
  const calendar = await mount(page, 'data-ds-value="2026-11-04"');
  // One tab stop: the chosen day.
  await expect(calendar.locator('.ds-calendar__day[tabindex="0"]')).toHaveCount(1);
  await day(calendar, '2026-11-04').focus();
  const steps = [
    ['ArrowRight', '2026-11-05'], ['ArrowLeft', '2026-11-04'], ['ArrowDown', '2026-11-11'], ['ArrowUp', '2026-11-04'],
    ['Home', '2026-11-01'], ['End', '2026-11-07'], ['PageDown', '2026-12-07'], ['PageUp', '2026-11-07'],
    ['Shift+PageDown', '2027-11-07'], ['Shift+PageUp', '2026-11-07'],
  ];
  for (const [key, expected] of steps) {
    await page.keyboard.press(key);
    expect(await focused(page), key).toBe(expected);
    await expect(calendar.locator('.ds-calendar__day[tabindex="0"]')).toHaveAttribute('data-date', expected);
  }
  // Past the month on screen, the page turns and says so (the polite title).
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  expect(await focused(page)).toBe('2026-12-05');
  await expect(calendar.locator('.ds-calendar__title')).toHaveText('December 2026');
  await expect(calendar.locator('.ds-calendar__title')).toHaveAttribute('aria-live', 'polite');
  // Enter picks: the cell is selected and the page hears it.
  await page.keyboard.press('Enter');
  await expect(day(calendar, '2026-12-05').locator('xpath=..')).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => window.fxEvents)).toEqual([{ value: '2026-12-05' }]);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.fxEvents.at(-1))).toEqual({ value: '2026-12-04' });
  expect(await calendar.evaluate((el) => window.DS.calendar.create(el).get())).toBe('2026-12-04');
});

test('right to left: ArrowLeft and ArrowRight follow the writing direction', async ({ page }) => {
  await open(page);
  const calendar = await mount(page, 'dir="rtl" data-ds-value="2026-11-04"');
  await day(calendar, '2026-11-04').focus();
  await page.keyboard.press('ArrowLeft');
  expect(await focused(page)).toBe('2026-11-05');
  await page.keyboard.press('ArrowRight');
  expect(await focused(page)).toBe('2026-11-04');
});

test('names and roles: a grid named by its month, weekday heads with their full name, days named by their date, today', async ({ page }) => {
  await open(page);
  const calendar = await mount(page, 'data-ds-value="2026-11-10"');
  const grid = calendar.getByRole('grid', { name: 'November 2026' });
  await expect(grid).toHaveCount(1);
  await expect(calendar.locator('thead th').first()).toHaveAttribute('abbr', 'Sunday');
  await expect(calendar.getByRole('button', { name: 'Tuesday, November 10, 2026' })).toHaveCount(1);
  await expect(day(calendar, '2026-11-04')).toHaveAttribute('aria-current', 'date');
  await expect(calendar.getByRole('button', { name: 'Previous month' })).toHaveCount(1);
  await expect(calendar.getByRole('button', { name: 'Next month' })).toHaveCount(1);
  // Each day of the month and no other: empty cells around it.
  await expect(calendar.locator('.ds-calendar__day')).toHaveCount(30);
});

test('min, max and blocked days: focusable and read, never picked; the month buttons stop at the limits', async ({ page }) => {
  await open(page);
  const calendar = await mount(page, 'data-ds-value="2026-11-04" data-ds-calendar-min="2026-11-03" data-ds-calendar-max="2026-12-20" data-ds-calendar-disabled="6,7,2026-11-12"');
  await expect(day(calendar, '2026-11-02')).toHaveAttribute('aria-disabled', 'true');
  await expect(day(calendar, '2026-11-07')).toHaveAttribute('aria-disabled', 'true');
  await expect(day(calendar, '2026-11-12')).toHaveAttribute('aria-disabled', 'true');
  await expect(day(calendar, '2026-11-11')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(calendar.locator('.ds-calendar__nav[data-step="-1"]')).toHaveAttribute('aria-disabled', 'true');
  await day(calendar, '2026-11-12').click({ force: true });
  expect(await page.evaluate(() => window.fxEvents)).toEqual([]);
  // The keys reach a blocked day (its name is read) but Enter does nothing; they never leave min.
  await day(calendar, '2026-11-04').focus();
  await page.keyboard.press('ArrowLeft');
  expect(await focused(page)).toBe('2026-11-03');
  await page.keyboard.press('ArrowLeft');
  expect(await focused(page)).toBe('2026-11-03');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  expect(await focused(page)).toBe('2026-11-06');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.fxEvents)).toEqual([]);
  // The next month button turns once, then stops at max.
  await calendar.locator('.ds-calendar__nav[data-step="1"]').click();
  await expect(calendar.locator('.ds-calendar__title')).toHaveText('December 2026');
  await expect(calendar.locator('.ds-calendar__nav[data-step="1"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(day(calendar, '2026-12-21')).toHaveAttribute('aria-disabled', 'true');
});

test('range: the first pick starts it, the pointer and the keys preview it, the second pick ends it in either order', async ({ page }) => {
  await open(page);
  const calendar = await mount(page, 'data-ds-calendar-mode="range" data-ds-calendar-months="2" data-ds-value="2026-11-01/2026-11-07"');
  await expect(calendar.getByRole('grid')).toHaveCount(2);
  await expect(calendar.getByRole('grid').first()).toHaveAttribute('aria-multiselectable', 'true');
  // The committed range: its ends and middle, every cell selected.
  await expect(day(calendar, '2026-11-01').locator('xpath=..')).toHaveAttribute('data-range', 'start');
  await expect(day(calendar, '2026-11-04').locator('xpath=..')).toHaveAttribute('data-range', 'middle');
  await expect(day(calendar, '2026-11-07').locator('xpath=..')).toHaveAttribute('data-range', 'end');
  await expect(calendar.locator('td[aria-selected="true"]')).toHaveCount(7);
  // Start a new one later, and end it before its start.
  await day(calendar, '2026-11-20').click();
  expect(await page.evaluate(() => window.fxEvents)).toEqual([{ input: { start: '2026-11-20', end: '' } }]);
  await day(calendar, '2026-11-16').hover();
  await expect(day(calendar, '2026-11-16').locator('xpath=..')).toHaveAttribute('data-preview', 'start');
  await expect(day(calendar, '2026-11-18').locator('xpath=..')).toHaveAttribute('data-preview', 'middle');
  await expect(day(calendar, '2026-11-20').locator('xpath=..')).toHaveAttribute('data-preview', 'end');
  await expect(calendar.locator('td[data-range]')).toHaveCount(0);
  // The keys preview too, also into the next month on screen.
  await day(calendar, '2026-11-20').focus();
  await page.keyboard.press('PageDown');
  await expect(day(calendar, '2026-12-20').locator('xpath=..')).toHaveAttribute('data-preview', 'end');
  await expect(day(calendar, '2026-11-25').locator('xpath=..')).toHaveAttribute('data-preview', 'middle');
  await page.keyboard.press('PageUp');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.fxEvents.at(-1))).toEqual({ value: '2026-11-16/2026-11-20', start: '2026-11-16', end: '2026-11-20' });
  await expect(calendar.locator('td[data-preview]')).toHaveCount(0);
  await expect(calendar.locator('td[aria-selected="true"]')).toHaveCount(5);
});

test('locale: the first day of the week, the names and the week numbers follow it; a first day of its own wins', async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.DS.core.config({ locale: 'de-DE' }));
  const calendar = await mount(page, 'data-ds-value="2026-11-04" data-ds-calendar-weeks');
  await expect(calendar.locator('.ds-calendar__title')).toHaveText('November 2026');
  await expect(calendar.locator('thead th[scope="col"]').nth(1)).toHaveAttribute('abbr', 'Montag');
  await expect(calendar.locator('thead th.ds-calendar__week')).toHaveAttribute('abbr', 'Woche');
  // ISO weeks: November 4, 2026 is in week 45.
  await expect(day(calendar, '2026-11-04').locator('xpath=../..').locator('th.ds-calendar__week')).toHaveText('45');
  await expect(calendar.getByRole('button', { name: 'Mittwoch, 4. November 2026' })).toHaveCount(1);
  // US English starts on Sunday; firstDay 1 makes it Monday.
  await page.evaluate(() => window.DS.core.config({ locale: 'en-US' }));
  await expect(calendar.locator('thead th[scope="col"]').nth(1)).toHaveAttribute('abbr', 'Sunday');
  await calendar.evaluate((el) => window.DS.calendar.create(el).update({ firstDay: 1 }));
  await expect(calendar.locator('thead th[scope="col"]').nth(1)).toHaveAttribute('abbr', 'Monday');
});

test('a day at every size x density, .ds-touch as a minimum; the radius follows the shape', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const box = document.createElement('div');
          box.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          box.innerHTML = '<div class="ds-calendar"></div>';
          main.append(box);
          window.DS.calendar.create(box.firstElementChild, { value: '2026-11-04' });
          const rect = box.querySelector('.ds-calendar__day').getBoundingClientRect();
          out.push({ touch, density, size, width: rect.width, height: rect.height });
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
    const expected = entry.touch ? Math.max(TOUCH, base) : base;
    expect([entry.width, entry.height], `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`).toEqual([expected, expected]);
  }
  const calendar = await mount(page, 'data-ds-value="2026-11-04"');
  const radius = (selector) => calendar.locator(selector).evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(await radius('.ds-calendar__day[data-date="2026-11-04"]')).toBe(20);
  await page.evaluate(() => document.querySelector('#fx-mine').classList.add('ds-shape-square'));
  await expect.poll(() => radius('.ds-calendar__day[data-date="2026-11-04"]')).toBe(0);
});

test('forced colours: the chosen day and the band are SelectedItem, today keeps its ring, a blocked day is GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const calendar = await mount(page, 'data-ds-calendar-mode="range" data-ds-value="2026-11-09/2026-11-12" data-ds-calendar-disabled="2026-11-20"');
  await settle(page);
  const styles = await calendar.evaluate((el) => {
    const css = (selector, pseudo) => getComputedStyle(el.querySelector(selector), pseudo);
    const probe = document.createElement('span');
    probe.style.color = 'SelectedItem';
    el.append(probe);
    const selected = getComputedStyle(probe).color;
    probe.style.color = 'GrayText';
    const gray = getComputedStyle(probe).color;
    probe.remove();
    return {
      selected,
      gray,
      end: css('.ds-calendar__day[data-date="2026-11-09"]').backgroundColor,
      band: css('td[data-range="middle"]', '::before').backgroundColor,
      blocked: css('.ds-calendar__day[data-date="2026-11-20"]').color,
      today: css('.ds-calendar__day[data-date="2026-11-04"]').borderTopStyle,
    };
  });
  expect(styles.end).toBe(styles.selected);
  expect(styles.band).toBe(styles.selected);
  expect(styles.blocked).toBe(styles.gray);
  expect(styles.today).toBe('solid');
});
