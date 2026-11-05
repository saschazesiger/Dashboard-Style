/**
 * The time range with refresh (3.0): the trigger names the range; the
 * popover's quick ranges apply at once (ds:change, ds:refresh with reason
 * change, the announcement), the absolute from and to with Apply (and its
 * refusal of a from after the to, with an icon and the words), the recent
 * ranges remembered through DS.store; the refresh button (reason manual) and
 * the interval (reason interval, data-on); URL-friendly values; names, roles
 * and keys; the interval pill at every size x density with .ds-touch as a
 * minimum; forced colours. Runs on the generated fixture of the demo, with
 * time ranges of its own mounted on it, and in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

test.use({ locale: 'en-US', timezoneId: 'UTC' });

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page, { fixed = true } = {}) {
  if (fixed) await page.clock.setFixedTime(new Date('2026-11-04T10:10:00Z'));
  await page.goto('/test/browser/fixtures/component.html?c=timerange');
  await ready(page);
  await page.mouse.move(1, 1);
  await page.evaluate(() => localStorage.clear());
}

async function mount(page, attrs) {
  await page.evaluate((html) => {
    const host = document.createElement('div');
    host.id = 'fx-mine';
    host.innerHTML = html;
    document.querySelector('#fx-component').prepend(host);
    window.DS.init(host);
    window.fxEvents = [];
    host.addEventListener('ds:change', (event) => window.fxEvents.push({ type: 'change', ...event.detail }));
    host.addEventListener('ds:refresh', (event) => window.fxEvents.push({ type: 'refresh', ...event.detail }));
  }, `<div class="ds-timerange" data-ds-timerange ${attrs}></div>`);
  const root = page.locator('#fx-mine .ds-timerange');
  return {
    root,
    trigger: root.locator('.ds-timerange__trigger'),
    panel: root.locator('.ds-picker__popover'),
    refresh: root.getByRole('button', { name: 'Refresh' }),
    select: root.locator('.ds-timerange__select'),
  };
}

const events = (page, type) => page.evaluate((kind) => window.fxEvents.filter((entry) => entry.type === kind), type);
const get = (root) => root.evaluate((el) => window.DS.timerange.create(el).get());

test('names and roles: a group with the range on its trigger, a refresh button and the interval select', async ({ page }) => {
  await open(page);
  const { root, trigger, select } = await mount(page, 'data-ds-timerange-from="now-1h" data-ds-timerange-to="now"');
  await expect(page.locator('#fx-mine').getByRole('group', { name: 'Time range' })).toHaveCount(1);
  await expect(trigger).toHaveText('Last 1 hour');
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(root.getByRole('button', { name: 'Refresh' })).toHaveCount(1);
  await expect(root.getByRole('combobox', { name: 'Auto refresh' })).toHaveCount(1);
  expect(await select.locator('option').allTextContents()).toEqual(['Off', '5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h']);
});

test('a quick range applies at once: the trigger, ds:change, ds:refresh (change), the announcement, focus back', async ({ page }) => {
  await open(page);
  const { root, trigger, panel } = await mount(page, '');
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Time range' })).toBeVisible();
  await expect(panel.getByRole('group', { name: 'Quick ranges' })).toBeVisible();
  // Focus is on the range in force.
  await expect(panel.getByRole('button', { name: 'Last 1 hour', exact: true })).toBeFocused();
  await expect(panel.getByRole('button', { name: 'Last 1 hour', exact: true })).toHaveAttribute('aria-current', 'true');
  await panel.getByRole('button', { name: 'Last 6 hours' }).press('Enter');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveText('Last 6 hours');
  expect(await get(root)).toEqual({ from: 'now-6h', to: 'now', refresh: '' });
  const [change] = await events(page, 'change');
  expect(change).toMatchObject({ from: 'now-6h', to: 'now', start: '2026-11-04T04:10:00.000Z', end: '2026-11-04T10:10:00.000Z', label: 'Last 6 hours', query: 'from=now-6h&to=now' });
  expect(await events(page, 'refresh')).toEqual([{ type: 'refresh', from: 'now-6h', to: 'now', start: '2026-11-04T04:10:00.000Z', end: '2026-11-04T10:10:00.000Z', reason: 'change' }]);
  await expect(page.locator('.ds-sr[aria-live], [data-ds-announcer], [aria-live="polite"]').filter({ hasText: 'Last 6 hours' })).not.toHaveCount(0);
  // Rounded ones: today is the whole day.
  await trigger.click();
  await panel.getByRole('button', { name: 'Today' }).click();
  await expect(trigger).toHaveText('Today');
  expect((await events(page, 'change')).at(-1)).toMatchObject({ from: 'now/d', to: 'now/d', start: '2026-11-04T00:00:00.000Z', end: '2026-11-04T23:59:59.999Z' });
});

test('absolute from and to: Apply refuses a from after the to with an icon and the words, else applies and remembers it', async ({ page }) => {
  await open(page);
  const { root, trigger, panel } = await mount(page, 'data-ds-timerange-store="fx"');
  await trigger.click();
  const fields = panel.locator('.ds-datefield');
  await expect(panel.getByRole('group', { name: 'From' })).toHaveCount(1);
  await expect(panel.getByRole('group', { name: 'To' })).toHaveCount(1);
  // The fields show the range in force.
  expect(await fields.evaluateAll((items) => items.map((item) => window.DS.datefield.create(item).get()))).toEqual(['2026-11-04T09:10', '2026-11-04T10:10']);
  await fields.nth(0).evaluate((el) => window.DS.datefield.create(el).set('2026-11-04T12:00'));
  await panel.getByRole('button', { name: 'Apply' }).click();
  const error = panel.locator('.ds-timerange__error');
  await expect(error).toHaveText('The start must come before the end.');
  await expect(error).toHaveAttribute('role', 'alert');
  await expect(error.locator('svg')).toHaveCount(1);
  await expect(fields.nth(1)).toHaveAttribute('aria-invalid', 'true');
  expect((await fields.nth(1).getAttribute('aria-describedby')).split(' ')).toContain(await error.getAttribute('id'));
  await expect(panel).toHaveAttribute('data-state', 'open');
  // Typed again: judged again.
  await fields.nth(0).locator('.ds-datefield__segment[data-segment="dayPeriod"]').focus();
  await page.keyboard.press('ArrowDown');
  await fields.nth(0).locator('.ds-datefield__segment[data-segment="hour"]').focus();
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('ArrowDown');
  await expect(error).toBeEmpty();
  await expect(fields.nth(1)).not.toHaveAttribute('aria-invalid', 'true');
  await panel.getByRole('button', { name: 'Apply' }).click();
  await expect(panel).toBeHidden();
  expect(await get(root)).toEqual({ from: '2026-11-04T07:00:00Z', to: '2026-11-04T10:10:00Z', refresh: '' });
  await expect(trigger).toBeFocused();
  expect((await events(page, 'change')).at(-1).query).toBe('from=2026-11-04T07%3A00%3A00Z&to=2026-11-04T10%3A10%3A00Z');
  // Remembered: under "Recently used", also for a time range made later.
  await trigger.click();
  const recent = panel.getByRole('group', { name: 'Recently used' });
  await expect(recent.getByRole('button')).toHaveCount(1);
  await expect(recent.getByRole('button')).toHaveAttribute('aria-current', 'true');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes('timerange')))).toHaveLength(1);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('an unfinished field is marked and takes the focus', async ({ page }) => {
  await open(page);
  const { trigger, panel } = await mount(page, '');
  await trigger.click();
  const from = panel.locator('.ds-datefield').nth(0);
  await from.evaluate((el) => window.DS.datefield.create(el).set(''));
  await panel.getByRole('button', { name: 'Apply' }).click();
  await expect(from).toHaveAttribute('aria-invalid', 'true');
  expect(await page.evaluate(() => document.activeElement.closest('.ds-datefield') === document.querySelector('#fx-mine .ds-datefield'))).toBe(true);
});

test('refresh now (manual) and on an interval (interval), with the pill on while it runs', async ({ page }) => {
  await open(page, { fixed: false });
  const { root, refresh, select } = await mount(page, 'data-ds-timerange-intervals="5s,1m"');
  await refresh.click();
  expect((await events(page, 'refresh')).map((entry) => entry.reason)).toEqual(['manual']);
  await select.selectOption('5s');
  await expect(root.locator('.ds-timerange__interval')).toHaveAttribute('data-on', '');
  expect((await events(page, 'change')).at(-1)).toMatchObject({ refresh: '5s' });
  expect(await get(root)).toEqual({ from: 'now-1h', to: 'now', refresh: '5s' });
  await expect.poll(async () => (await events(page, 'refresh')).map((entry) => entry.reason), { timeout: 9000 }).toEqual(['manual', 'interval']);
  await select.selectOption('');
  await expect(root.locator('.ds-timerange__interval')).not.toHaveAttribute('data-on', '');
});

test('URL-friendly values: query(), parse() and resolve() of relative, rounded and absolute values; set() without an event', async ({ page }) => {
  await open(page);
  const { root, trigger } = await mount(page, 'data-ds-timerange-from="now-15m" data-ds-timerange-refresh="30s"');
  expect(await root.evaluate((el) => window.DS.timerange.create(el).query())).toBe('from=now-15m&to=now&refresh=30s');
  const values = await page.evaluate(() => {
    const iso = (date) => date?.toISOString() ?? null;
    const now = Date.parse('2026-11-04T10:10:00Z');
    const { parse, resolve, spanMs, label } = window.DS.timerange;
    return {
      ago: iso(parse('now-2d', { now })),
      ahead: iso(parse('now+1h', { now })),
      week: iso(parse('now/w', { now, firstDay: 1 })),
      lastMonth: iso(parse('now-1M/M', { now })),
      wall: iso(parse('2026-11-04T09:00', { timeZone: 'America/New_York' })),
      offset: iso(parse('2026-11-04T09:00:00+01:00')),
      epoch: iso(parse('1762246800000')),
      bad: parse('yesterday'),
      day: Object.fromEntries(Object.entries(resolve({ from: 'now-1d/d', to: 'now-1d/d' }, { now })).map(([key, date]) => [key, iso(date)])),
      spans: ['30s', '5m', '1h', '1d', '1w', 'x'].map(spanMs),
      labels: [label({ from: 'now-30d', to: 'now' }), label({ from: 'now-1d/d', to: 'now-1d/d' }), label({ from: 'now/w', to: 'now/w' })],
    };
  });
  expect(values).toEqual({
    ago: '2026-11-02T10:10:00.000Z',
    ahead: '2026-11-04T11:10:00.000Z',
    week: '2026-11-02T00:00:00.000Z',
    lastMonth: '2026-10-01T00:00:00.000Z',
    wall: '2026-11-04T14:00:00.000Z',
    offset: '2026-11-04T08:00:00.000Z',
    epoch: '2025-11-04T09:00:00.000Z',
    bad: null,
    day: { start: '2026-11-03T00:00:00.000Z', end: '2026-11-03T23:59:59.999Z' },
    spans: [30000, 300000, 3600000, 86400000, 604800000, 0],
    labels: ['Last 30 days', 'Yesterday', 'This week'],
  });
  await root.evaluate((el) => window.DS.timerange.create(el).set({ from: 'now-7d' }));
  await expect(trigger).toHaveText('Last 7 days');
  expect(await page.evaluate(() => window.fxEvents)).toEqual([]);
});

test('the interval pill at every size x density, .ds-touch as a minimum, lines up with the buttons beside it', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const box = document.createElement('div');
          box.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          box.innerHTML = '<div class="ds-timerange"></div>';
          main.append(box);
          const range = window.DS.timerange.create(box.firstElementChild, { store: 'fx-measure' });
          const height = (selector) => box.querySelector(selector).getBoundingClientRect().height;
          const line = parseFloat(getComputedStyle(box.querySelector('.ds-timerange__interval')).lineHeight) + 2;
          out.push({ touch, density, size, line, pill: height('.ds-timerange__interval'), trigger: height('.ds-timerange__trigger') });
          range.destroy();
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
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    // Never under its line and border, as a button.
    expect(entry.pill, name).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, base, entry.line), 0);
    expect(entry.trigger, `${name} trigger`).toBeCloseTo(entry.pill, 0);
  }
});

test('the chevron turns with the popover; the keys open it (Alt+ArrowDown too)', async ({ page }) => {
  await open(page);
  const { trigger, panel } = await mount(page, '');
  await trigger.focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(panel).toHaveAttribute('data-state', 'open');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await settle(page);
  expect(await trigger.locator('.ds-timerange__chevron').evaluate((el) => getComputedStyle(el).rotate)).toBe('180deg');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-state', 'open');
});

test('forced colours: the interval pill keeps its border; on, it is Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const { root } = await mount(page, 'data-ds-timerange-refresh="30s"');
  await settle(page);
  const styles = await root.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'Highlight';
    el.append(probe);
    const highlight = getComputedStyle(probe).color;
    probe.remove();
    const pill = el.querySelector('.ds-timerange__interval');
    return { highlight, border: getComputedStyle(pill).borderTopStyle, fill: getComputedStyle(pill).backgroundColor };
  });
  expect(styles.border).toBe('solid');
  expect(styles.fill).toBe(styles.highlight);
});
