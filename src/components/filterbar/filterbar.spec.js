/**
 * The filter bar (DS.filterbar): filters from the controls, ds:filter, the
 * applied chips and Clear all by keyboard with the focus kept, the
 * announcements, the count, folding by width into the sheet and back, the
 * badge, names and roles, the options and forced colours. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/test/browser/fixtures/component.html?c=filterbar');
  await ready(page);
  await page.mouse.move(1, 1);
}

const said = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((node) => node.textContent).join('\n'));
const wide = (page) => page.getByRole('search', { name: 'Filter devices', exact: true });
const narrow = (page) => page.getByRole('search', { name: 'Filter devices, narrow' });

test('the filters come from the controls; a change sends ds:filter once and the page re-renders', async ({ page }) => {
  await open(page);
  const bar = wide(page);
  await expect(bar).not.toHaveAttribute('data-folded', /.*/);
  await page.evaluate(() => {
    window.seen = [];
    document.querySelector('.ds-filterbar').addEventListener('ds:filter', (event) => window.seen.push(event.detail));
  });
  await bar.getByRole('combobox', { name: 'Status' }).selectOption('online');
  await bar.getByRole('searchbox', { name: 'Search devices' }).fill('laptop');
  await bar.getByRole('spinbutton', { name: 'Storage from' }).fill('300');
  await bar.getByRole('spinbutton', { name: 'Storage from' }).press('Tab');
  const seen = await page.evaluate(() => window.seen);
  expect(seen.at(-1)).toEqual({ filters: { q: ['laptop'], status: ['online'], storage: ['300', ''] }, name: 'storage', reason: 'change' });
  expect(seen.map((detail) => detail.reason)).toEqual(['change', 'input', 'change']);
  await expect(bar.locator('.ds-filterbar__count')).toHaveText('1 device');
  await expect(page.getByRole('list', { name: 'Filter devices: devices' }).getByRole('listitem')).toHaveCount(1);
  expect(await page.evaluate(() => DS.get(document.querySelector('.ds-filterbar')).get())).toEqual({ q: ['laptop'], status: ['online'], storage: ['300', ''] });
});

test('applied chips: names in words, Enter removes one and the focus moves on, Clear all keeps the search', async ({ page }) => {
  await open(page);
  const bar = wide(page);
  const chips = bar.getByRole('group', { name: 'Applied filters' });
  await expect(bar.locator('.ds-filterbar__applied')).toBeHidden();
  await bar.getByRole('searchbox').fill('a');
  await expect(bar.locator('.ds-filterbar__applied')).toBeHidden();
  await bar.getByRole('combobox', { name: 'Status' }).selectOption('offline');
  await bar.getByRole('combobox', { name: 'Type' }).selectOption('laptop');
  await bar.getByRole('spinbutton', { name: 'Storage from' }).fill('100');
  await bar.getByRole('spinbutton', { name: 'to', exact: true }).fill('1024');
  await bar.getByRole('spinbutton', { name: 'to', exact: true }).press('Tab');
  await expect(chips.getByRole('button')).toHaveText(['Remove filter Status: Offline', 'Remove filter Type: Laptop', 'Remove filter Storage: 100 to 1,024']);
  const type = chips.getByRole('button', { name: 'Remove filter Type: Laptop' });
  await type.focus();
  await page.keyboard.press('Enter');
  await expect(chips.getByRole('button')).toHaveCount(2);
  await expect(bar.getByRole('combobox', { name: 'Type' })).toHaveValue('');
  await expect(chips.getByRole('button', { name: 'Remove filter Storage: 100 to 1,024' })).toBeFocused();
  await expect.poll(() => said(page)).toContain('Removed Type: Laptop');
  await bar.getByRole('button', { name: 'Clear all' }).focus();
  await page.keyboard.press('Enter');
  await expect(bar.locator('.ds-filterbar__applied')).toBeHidden();
  await expect(bar.getByRole('searchbox')).toHaveValue('a');
  await expect(bar.getByRole('searchbox')).toBeFocused();
  await expect.poll(() => said(page)).toContain('Filters cleared');
  expect(await page.evaluate(() => DS.get(document.querySelector('.ds-filterbar')).get())).toEqual({ q: ['a'] });
});

test('narrow: the filters fold behind Filters, open in the sheet by keyboard, and go back when it closes', async ({ page }) => {
  await open(page);
  const bar = narrow(page);
  await expect(bar).toHaveAttribute('data-folded', '');
  await expect(bar.locator('.ds-filterbar__filters')).toBeHidden();
  const more = bar.getByRole('button', { name: 'Filters' });
  await expect(more).toHaveAttribute('aria-haspopup', 'dialog');
  await more.focus();
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  await expect(sheet).toBeVisible();
  await settle(page);
  await sheet.getByRole('combobox', { name: 'Status' }).selectOption('online');
  await sheet.getByRole('checkbox', { name: 'Only mine' }).check();
  await expect(sheet.getByRole('button', { name: 'Show 2 devices' })).toBeVisible();
  // The badge counts what is applied among the folded filters, in words for a screen reader.
  await expect(more).toHaveAccessibleName(/^Filters\s*2 applied$/);
  await expect(bar.getByRole('group', { name: 'Applied filters' }).getByRole('button')).toHaveText(['Remove filter Status: Online', 'Remove filter Owner: Only mine']);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(sheet).toBeHidden();
  await expect(more).toBeFocused();
  await expect(bar.locator('.ds-filterbar__filters')).toHaveCount(1);
  expect(await page.evaluate(() => DS.get(document.querySelectorAll('.ds-filterbar')[1]).get())).toEqual({ status: ['online'], mine: ['yes'] });
  // Clear all in the sheet's foot: off while nothing is applied.
  await more.click();
  await settle(page);
  await sheet.getByRole('button', { name: 'Clear all' }).click();
  await expect(sheet.getByRole('button', { name: 'Clear all' })).toHaveAttribute('aria-disabled', 'true');
  await expect(sheet.getByRole('combobox', { name: 'Status' })).toHaveValue('');
  await sheet.getByRole('button', { name: 'Show 10 devices' }).click();
  await settle(page);
  await expect(more).toBeFocused();
});

test('the bar unfolds when it is wide enough again, and folds when it narrows', async ({ page }) => {
  await open(page);
  const bar = wide(page);
  await expect(bar).not.toHaveAttribute('data-folded', /.*/);
  await page.evaluate(() => { document.querySelector('.sg-filterbar-block').style.maxWidth = '520px'; });
  await expect(bar).toHaveAttribute('data-folded', '');
  await page.evaluate(() => { document.querySelector('.sg-filterbar-block').style.maxWidth = ''; });
  await expect(bar).not.toHaveAttribute('data-folded', /.*/);
});

test('the controller: set (silent), clear, count, read, write, applied, fold', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const el = document.querySelector('.ds-filterbar');
    const bar = DS.filterbar.create(el);
    let told = 0;
    el.addEventListener('ds:filter', () => { told += 1; });
    bar.set({ status: ['offline'], storage: ['', '512'] });
    const chips = [...el.querySelectorAll('.ds-filterbar__chips .ds-chip')].map((chip) => chip.textContent);
    const applied = DS.filterbar.applied(el).map((entry) => entry.key);
    bar.clear('status=offline');
    const after = bar.get();
    bar.count(1234);
    const count = el.querySelector('.ds-filterbar__count').textContent;
    const changed = DS.filterbar.write(el, { kind: 'tablet' }).length;
    return { same: DS.get(el) === bar, chips, applied, after, count, told, read: DS.filterbar.read(el), changed };
  });
  expect(seen).toEqual({
    same: true,
    chips: ['Remove filter Status: Offline', 'Remove filter Storage: up to 512'],
    applied: ['status=offline', 'storage=..512'],
    after: { storage: ['', '512'] },
    count: '1,234 results',
    told: 0,
    read: { kind: ['tablet'] },
    changed: 2,
  });
});

test('options: size and density reach the controls and gaps, touch wins, a phone keeps it in 360px', async ({ page }) => {
  await open(page);
  const measure = (classes) => page.evaluate((classes) => {
    const block = document.querySelector('.sg-filterbar-block');
    block.parentElement.className = classes;
    const bar = block.querySelector('.ds-filterbar');
    const out = { gap: parseFloat(getComputedStyle(bar.querySelector('.ds-filterbar__row')).columnGap), select: bar.querySelector('select').getBoundingClientRect().height };
    block.parentElement.className = '';
    return out;
  }, classes);
  expect(await measure('')).toEqual({ gap: 12, select: 40 });
  expect(await measure('ds-sm')).toEqual({ gap: 8, select: 32 });
  expect(await measure('ds-density-compact')).toEqual({ gap: 10, select: 36 });
  expect((await measure('ds-touch ds-density-tight')).select).toBeGreaterThanOrEqual(48);
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(wide(page)).toHaveAttribute('data-folded', '');
  for (const bar of await page.locator('.ds-filterbar').all()) {
    const box = await bar.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
});

test('forced colours: the applied chips keep their edge and words', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const bar = wide(page);
  await bar.getByRole('combobox', { name: 'Status' }).selectOption('online');
  const chip = bar.getByRole('button', { name: 'Remove filter Status: Online' });
  await expect(chip).toBeVisible();
  const edge = await chip.locator('.ds-chip__body').evaluate((body) => getComputedStyle(body).borderTopStyle);
  expect(edge).toBe('solid');
});
