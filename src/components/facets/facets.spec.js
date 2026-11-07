/**
 * The facet filter panel (DS.facets): filters from the facets, ds:filter and
 * the counts the page writes back, options counted 0 disabled, the limit
 * with "Show all", the search inside a facet with its announcement and
 * Escape, the applied chips and Clear all by keyboard, folding into the
 * sheet and back, names and roles, the options and forced colours. Runs in
 * the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/test/browser/fixtures/component.html?c=facets');
  await ready(page);
  await page.evaluate(() => {
    window.saidLog = [];
    new MutationObserver((records) => {
      const regions = new Set(records.map((record) => (record.target.nodeType === 1 ? record.target : record.target.parentElement)?.closest('[aria-live]')).filter(Boolean));
      for (const region of regions) if (region.textContent.trim()) window.saidLog.push(region.textContent.trim());
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await page.mouse.move(1, 1);
}

/**
 * Everything the live regions hold and held since open(): the count said once
 * the changes pause takes the announcer's text over, so a removal said before
 * it is read from the log.
 */
const said = (page) => page.evaluate(() => [...(window.saidLog ?? []), ...[...document.querySelectorAll('[aria-live]')].map((node) => node.textContent)].join('\n'));
/** Every text the live regions said since it was called, in order, once per time it was said. */
async function speech(page) {
  const from = await page.evaluate(() => window.saidLog.length);
  return () => page.evaluate((from) => window.saidLog.slice(from), from);
}

const panel = (page) => page.getByRole('complementary', { name: 'Filters' }).first();
const layout = (page) => page.locator('.ds-facets-layout').first();
const narrowLayout = (page) => page.locator('.ds-facets-layout').nth(1);

test('names and roles: a named landmark, a group per facet, checkboxes with their counts', async ({ page }) => {
  await open(page);
  const aside = panel(page);
  await expect(layout(page)).not.toHaveAttribute('data-folded', /.*/);
  await expect(aside.getByRole('group', { name: 'Status' })).toBeVisible();
  await expect(aside.getByRole('group', { name: 'Status' }).getByRole('checkbox')).toHaveCount(3);
  await expect(aside.getByRole('checkbox', { name: /^Online \d+$/ })).toBeVisible();
  await expect(aside.getByRole('searchbox', { name: 'Search owners' })).toBeVisible();
  await expect(aside.getByRole('radio', { name: 'Any time' })).toBeChecked();
  await expect(aside.getByRole('button', { name: 'Clear all' })).toHaveAttribute('aria-disabled', 'true');
  // The toggle shows only while folded.
  await expect(layout(page).locator('.ds-facets__toggle')).toBeHidden();
});

test('a check sends ds:filter once; the page writes the counts back, and an option at 0 is disabled', async ({ page }) => {
  await open(page);
  const aside = panel(page);
  await page.evaluate(() => {
    window.seen = [];
    document.querySelector('.ds-facets').addEventListener('ds:filter', (event) => window.seen.push(event.detail));
  });
  await aside.getByRole('checkbox', { name: /^Online/ }).check();
  expect(await page.evaluate(() => window.seen)).toEqual([{ filters: { status: ['online'] }, name: 'status', reason: 'change' }]);
  await expect(layout(page).locator('.ds-facets__count')).toHaveText('7 devices');
  await expect(aside.getByRole('checkbox', { name: 'Desktop 0' })).toBeDisabled();
  await expect(aside.getByRole('checkbox', { name: /^Laptop/ })).toBeEnabled();
  // The status facet counts what the other facets leave: its own options stay counted.
  await expect(aside.getByRole('checkbox', { name: /^Offline/ })).toHaveAccessibleName('Offline 5');
  // A checked option at 0 stays enabled, so it can be unchecked.
  await aside.getByRole('checkbox', { name: /^Laptop/ }).check();
  await page.evaluate(() => DS.get(document.querySelector('.ds-facets')).counts({ kind: { laptop: 0 } }));
  await expect(aside.getByRole('checkbox', { name: 'Laptop 0' })).toBeVisible();
  await expect(aside.getByRole('checkbox', { name: /^Laptop/ })).toBeEnabled();
  await expect(aside.getByRole('checkbox', { name: /^Laptop/ })).toBeChecked();
});

test('the limit: the first options and every checked one, "Show all 7" and "Show fewer" with aria-expanded', async ({ page }) => {
  await open(page);
  const owner = panel(page).getByRole('group', { name: 'Owner' });
  await expect(owner.getByRole('checkbox')).toHaveCount(4);
  const more = owner.getByRole('button', { name: 'Show all 7' });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.focus();
  await page.keyboard.press('Enter');
  await expect(owner.getByRole('checkbox')).toHaveCount(7);
  await expect(owner.getByRole('button', { name: 'Show fewer' })).toBeFocused();
  await expect(owner.getByRole('button', { name: 'Show fewer' })).toHaveAttribute('aria-expanded', 'true');
  await owner.getByRole('checkbox', { name: /^Annie Easley/ }).check();
  await page.keyboard.press('Shift+Tab');
  await owner.getByRole('button', { name: 'Show fewer' }).click();
  // The checked one stays past the limit.
  await expect(owner.getByRole('checkbox')).toHaveCount(5);
  await expect(owner.getByRole('checkbox', { name: /^Annie Easley/ })).toBeVisible();
});

test('the search inside a facet: matches whatever the limit, a line and an announcement, Escape empties it', async ({ page }) => {
  await open(page);
  const owner = panel(page).getByRole('group', { name: 'Owner' });
  const search = owner.getByRole('searchbox', { name: 'Search owners' });
  await search.fill('AN');
  await expect(owner.getByRole('checkbox')).toHaveCount(3);
  // Past the limit of four: a search shows every match.
  await expect(owner.getByRole('checkbox', { name: /^Annie Easley/ })).toBeVisible();
  await expect(owner.getByRole('button', { name: /^Show/ })).toBeHidden();
  await expect.poll(() => said(page)).toContain('3 matches');
  await search.fill('zz');
  await expect(owner.locator('.ds-facet__empty')).toHaveText('No match for “zz”');
  await expect(owner.getByRole('checkbox')).toHaveCount(0);
  await search.focus();
  await page.keyboard.press('Escape');
  await expect(search).toHaveValue('');
  await expect(owner.locator('.ds-facet__empty')).toBeHidden();
  await expect(owner.getByRole('checkbox')).toHaveCount(4);
  // The search is no filter.
  expect(await page.evaluate(() => DS.get(document.querySelector('.ds-facets')).get())).toEqual({});
});

test('applied chips: a radio and a range in words, Enter removes one and the focus moves on, Clear all empties all', async ({ page }) => {
  await open(page);
  const aside = panel(page);
  const chips = aside.getByRole('group', { name: 'Applied filters' });
  await expect(aside.locator('.ds-facets__applied')).toBeHidden();
  await aside.getByRole('checkbox', { name: /^Tablet/ }).check();
  await aside.getByRole('radio', { name: 'Last 7 days' }).check();
  await aside.getByRole('spinbutton', { name: 'Max' }).fill('512');
  await aside.getByRole('spinbutton', { name: 'Max' }).press('Tab');
  await expect(chips.getByRole('button')).toHaveText(['Remove filter Type: Tablet', 'Remove filter Last seen: Last 7 days', 'Remove filter Storage: up to 512']);
  await expect(aside.getByRole('button', { name: 'Clear all' })).not.toHaveAttribute('aria-disabled', /.*/);
  await chips.getByRole('button', { name: 'Remove filter Last seen: Last 7 days' }).focus();
  await page.keyboard.press('Enter');
  await expect(aside.getByRole('radio', { name: 'Any time' })).toBeChecked();
  await expect(chips.getByRole('button', { name: 'Remove filter Storage: up to 512' })).toBeFocused();
  await expect.poll(() => said(page)).toContain('Removed Last seen: Last 7 days');
  await aside.getByRole('button', { name: 'Clear all' }).click();
  await expect(aside.locator('.ds-facets__applied')).toBeHidden();
  await expect.poll(() => said(page)).toContain('Filters cleared');
  expect(await page.evaluate(() => DS.get(document.querySelector('.ds-facets')).get())).toEqual({});
  await expect(layout(page).locator('.ds-facets__count')).toHaveText('18 devices');
});

test('folded: the toggle opens the panel in the sheet by keyboard, with its badge; it goes back when the sheet closes', async ({ page }) => {
  await open(page);
  const narrow = narrowLayout(page);
  await expect(narrow).toHaveAttribute('data-folded', '');
  await expect(narrow.locator('.ds-facets')).toBeHidden();
  const toggle = narrow.getByRole('button', { name: /^Filters/ });
  await expect(toggle).toHaveAttribute('aria-haspopup', 'dialog');
  await toggle.focus();
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  await expect(sheet).toBeVisible();
  await settle(page);
  await expect(sheet.locator('.ds-facets__title')).toBeHidden();
  await sheet.getByRole('checkbox', { name: /^Server/ }).check();
  await sheet.getByRole('checkbox', { name: /^Online/ }).check();
  await expect(sheet.getByRole('button', { name: 'Show 2 devices' })).toBeVisible();
  // Escape empties a facet search first, then closes the sheet.
  await sheet.getByRole('searchbox', { name: 'Search owners' }).fill('ada');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('searchbox', { name: 'Search owners' })).toHaveValue('');
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(sheet).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAccessibleName(/^Filters\s*2 applied$/);
  await expect(narrow.locator(':scope > .ds-facets')).toHaveCount(1);
  expect(await page.evaluate(() => DS.get(document.querySelectorAll('.ds-facets')[1]).get())).toEqual({ status: ['online'], kind: ['server'] });
  await toggle.click();
  await settle(page);
  await sheet.getByRole('button', { name: 'Show 2 devices' }).click();
  await settle(page);
  await expect(sheet).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('folded: the applied filters stay beside the list as chips, removable without the sheet; the count is said from the sheet', async ({ page }) => {
  await open(page);
  const spoken = await speech(page);
  const narrow = narrowLayout(page);
  await expect(narrow).toHaveAttribute('data-folded', '');
  const row = narrow.locator('.ds-facets-layout__main .ds-facets__applied');
  await expect(row).toBeHidden();
  // Unfolded, the panel's own row is the one: the row beside the list stays hidden.
  await panel(page).getByRole('checkbox', { name: /^Online/ }).check();
  await expect(panel(page).locator('.ds-facets__applied')).toBeVisible();
  await expect(layout(page).locator('.ds-facets-layout__main .ds-facets__applied')).toBeHidden();
  const toggle = narrow.getByRole('button', { name: /^Filters/ });
  await toggle.click();
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  await expect(sheet).toBeVisible();
  await settle(page);
  await sheet.getByRole('checkbox', { name: /^Server/ }).check();
  await sheet.getByRole('checkbox', { name: /^Online/ }).check();
  await expect(sheet.getByRole('button', { name: 'Show 2 devices' })).toBeVisible();
  // The page around the modal sheet is inert, yet the count is said once the changes pause.
  await expect.poll(spoken).toContain('2 devices');
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(sheet).toBeHidden();
  const chips = row.getByRole('group', { name: 'Applied filters' });
  await expect(row).toBeVisible();
  await expect(chips.getByRole('button')).toHaveText(['Remove filter Status: Online', 'Remove filter Type: Server']);
  await expect(row.getByRole('button', { name: 'Clear all' })).not.toHaveAttribute('aria-disabled', /.*/);
  await chips.getByRole('button', { name: 'Remove filter Status: Online' }).focus();
  await page.keyboard.press('Enter');
  await expect(chips.getByRole('button', { name: 'Remove filter Type: Server' })).toBeFocused();
  await expect.poll(() => said(page)).toContain('Removed Status: Online');
  await page.keyboard.press('Enter');
  // The last chip went and the panel is folded away: the focus goes to the toggle.
  await expect(row).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => DS.get(document.querySelectorAll('.ds-facets')[1]).get())).toEqual({});
  // Destroyed with the sheet open: the panel goes back to the layout and the sheet closes.
  await toggle.click();
  await expect(sheet).toBeVisible();
  await settle(page);
  await page.evaluate(() => DS.get(document.querySelectorAll('.ds-facets')[1]).destroy());
  await expect(narrow.locator(':scope > .ds-facets')).toHaveCount(1);
  await settle(page);
  await expect(sheet).toBeHidden();
});

test('the layout unfolds when it is wide enough again, and folds when it narrows', async ({ page }) => {
  await open(page);
  await expect(layout(page)).not.toHaveAttribute('data-folded', /.*/);
  await page.evaluate(() => { document.querySelector('.sg-facets-block').style.maxWidth = '480px'; });
  await expect(layout(page)).toHaveAttribute('data-folded', '');
  await expect(layout(page).locator('.ds-facets__toggle')).toBeVisible();
  await page.evaluate(() => { document.querySelector('.sg-facets-block').style.maxWidth = ''; });
  await expect(layout(page)).not.toHaveAttribute('data-folded', /.*/);
  await expect(layout(page).locator('.ds-facets__toggle')).toBeHidden();
});

test('the controller: set (silent, also an option at 0), counts, count, clear, update', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(() => {
    const el = document.querySelector('.ds-facets');
    const facets = DS.facets.create(el);
    let told = 0;
    el.addEventListener('ds:filter', () => { told += 1; });
    facets.counts({ kind: { desktop: 0 } });
    const disabled = el.querySelector('input[value="desktop"]').disabled;
    facets.set({ kind: ['desktop'], seen: ['24'] });
    const after = facets.get();
    const enabled = !el.querySelector('input[value="desktop"]').disabled;
    facets.counts({ status: { online: 1234 } });
    const count = el.querySelector('input[value="online"]').closest('.ds-check').querySelector('.ds-check__count').textContent;
    facets.count(1, { one: '{count} device', other: '{count} devices' });
    const total = document.querySelector('.ds-facets__count').textContent;
    facets.clear('kind=desktop');
    return { same: DS.get(el) === facets, disabled, after, enabled, count, total, told, left: facets.get() };
  });
  expect(seen).toEqual({
    same: true,
    disabled: true,
    after: { kind: ['desktop'], seen: ['24'] },
    enabled: true,
    count: '1,234',
    total: '1 device',
    told: 0,
    left: { seen: ['24'] },
  });
});

test('options: size and density reach the rows and gaps, touch wins, a phone folds it in 360px', async ({ page }) => {
  await open(page);
  const measure = (classes) => page.evaluate((classes) => {
    const block = document.querySelector('.sg-facets-block');
    block.parentElement.className = classes;
    const out = {
      gap: parseFloat(getComputedStyle(block.querySelector('.ds-facets-layout')).columnGap),
      row: block.querySelector('.ds-facet__options .ds-check').getBoundingClientRect().height,
    };
    block.parentElement.className = '';
    return out;
  }, classes);
  expect(await measure('')).toEqual({ gap: 24, row: 40 });
  expect(await measure('ds-sm')).toEqual({ gap: 20, row: 32 });
  expect(await measure('ds-density-compact')).toEqual({ gap: 22, row: 36 });
  expect((await measure('ds-touch ds-density-tight')).row).toBeGreaterThanOrEqual(48);
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(layout(page)).toHaveAttribute('data-folded', '');
  for (const node of await page.locator('.ds-facets-layout').all()) {
    const box = await node.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
});

test('forced colours: the hairline between facets, the chips keep their edge and words', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const aside = panel(page);
  const line = await aside.locator('.ds-facet').nth(1).evaluate((node) => getComputedStyle(node).borderTopStyle);
  expect(line).toBe('solid');
  await aside.getByRole('checkbox', { name: /^Online/ }).check();
  const chip = aside.getByRole('button', { name: 'Remove filter Status: Online' });
  await expect(chip).toBeVisible();
  expect(await chip.locator('.ds-chip__body').evaluate((body) => getComputedStyle(body).borderTopStyle)).toBe('solid');
});
