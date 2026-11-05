/**
 * The audit log: the timeline it draws (day headings, the sentence, the
 * time, the diff with its words for a reader); filters by search, a
 * select, chips and a day, the count and its announcement, the empty
 * state and a form reset; set() with a new entry; changes of two versions
 * of a record; the size, density and shape of a change row; the narrow
 * layout; the keyboard path; forced colours. Runs in the `fallback`
 * project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/component.html?c=auditlog';

async function open(page) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const log = (page, name) => page.locator(`[data-demo="${name}"]`);
const entries = (locator) => locator.locator('.ds-timeline__item');
const announced = (page) => page.evaluate(() => Array.from(document.querySelectorAll('[aria-live]')).map((el) => el.textContent).join(' | '));

test('roles and names: the log, its filter group and list are named; days head the entries; each entry is a sentence with its time', async ({ page }) => {
  await open(page);
  const workspace = log(page, 'workspace');
  await expect(workspace).toHaveAttribute('aria-label', 'Audit log');
  await expect(workspace.locator('.ds-auditlog__filters')).toHaveAttribute('role', 'group');
  await expect(workspace.locator('.ds-timeline')).toHaveAttribute('aria-label', 'Events');
  expect(await workspace.locator('.ds-timeline__day').allTextContents()).toEqual(['Today', 'Yesterday', expect.stringMatching(/Thursday,? 8 October 2026|Thursday, October 8, 2026/), expect.stringMatching(/Monday,? 5 October 2026|Monday, October 5, 2026/)]);
  await expect(entries(workspace)).toHaveCount(9);
  const first = entries(workspace).first();
  await expect(first).toHaveAttribute('data-ds-key', 'e9');
  await expect(first.locator('.ds-timeline__title')).toHaveText('Ada Lovelace changed LAPTOP-0042');
  await expect(first.locator('.ds-timeline__title a')).toHaveAttribute('href', '#devices/42');
  await expect(first.locator('.ds-timeline__marker')).toHaveText('AL');
  await expect(first.locator('.ds-timeline__marker')).toHaveAttribute('aria-hidden', 'true');
  const time = first.locator('time.ds-timeline__time');
  await expect(time).toHaveAttribute('datetime', /^2026-10-12T/);
  expect(await time.getAttribute('title')).toMatch(/2026/);
  await expect(first.locator('.ds-auditlog__source')).toHaveText('Web · 10.20.4.17');
  // The sync's marker is its icon; its entry is muted.
  const sync = workspace.locator('[data-ds-key="e6"]');
  await expect(sync).toHaveClass(/ds-timeline__item--muted/);
  await expect(sync.locator('.ds-timeline__marker svg')).toHaveCount(1);
  // An outcome is a status with an icon and a word.
  await expect(workspace.locator('[data-ds-key="e7"] .ds-status.ds-tone-error')).toHaveText('Denied');
  await expect(workspace.locator('[data-ds-key="e7"] .ds-status svg')).toHaveCount(1);
  await expect(workspace.locator('.ds-auditlog__count')).toHaveText('9 events');
});

test('a change reads field, before and after: struck through, underlined, the words for a reader, the arrow silent; not set in words', async ({ page }) => {
  await open(page);
  const change = log(page, 'workspace').locator('[data-ds-key="e9"] .ds-auditlog__change').first();
  await expect(change.locator('dt')).toHaveText('Owner');
  await expect(change.locator('.ds-auditlog__old')).toHaveText('Before: Grace Hopper');
  await expect(change.locator('.ds-auditlog__old del')).toHaveText('Grace Hopper');
  await expect(change.locator('.ds-auditlog__new')).toHaveText('After: Ada Lovelace');
  await expect(change.locator('.ds-auditlog__new ins')).toHaveText('Ada Lovelace');
  const looks = await change.evaluate((el) => ({
    old: getComputedStyle(el.querySelector('del')).textDecorationLine,
    now: getComputedStyle(el.querySelector('ins')).textDecorationLine,
    arrow: getComputedStyle(el, '::after').content,
    sr: getComputedStyle(el.querySelector('.ds-sr')).position,
  }));
  expect(looks.old).toContain('line-through');
  expect(looks.now).toContain('underline');
  expect(looks.arrow).toContain('→');
  expect(looks.sr).toBe('absolute');
  // The arrow has empty alternative text: the accessible text holds no arrow.
  const snapshot = await change.ariaSnapshot();
  expect(snapshot).not.toContain('→');
  // A field that was added, and one that was cleared, say "Not set".
  const added = log(page, 'workspace').locator('[data-ds-key="e5"] .ds-auditlog__change').first();
  await expect(added.locator('.ds-auditlog__old .ds-auditlog__none')).toHaveText('Not set');
  const cleared = log(page, 'workspace').locator('[data-ds-key="e4"] .ds-auditlog__change').nth(1);
  await expect(cleared.locator('.ds-auditlog__new .ds-auditlog__none')).toHaveText('Not set');
});

test('filters: who, the kind chips, a first day and the search narrow the log; days go with their entries; the count follows and is announced', async ({ page }) => {
  await open(page);
  const workspace = log(page, 'workspace');
  await workspace.evaluate((el) => { window.__filters = []; el.addEventListener('ds:filter', (event) => window.__filters.push(event.detail)); });
  await workspace.locator('select[data-ds-auditlog-filter="actor"]').selectOption('ada');
  await expect(entries(workspace)).toHaveCount(3);
  await expect(workspace.locator('.ds-auditlog__count')).toHaveText('3 of 9 events');
  expect(await workspace.locator('.ds-timeline__day').allTextContents()).toHaveLength(3);
  await expect.poll(() => announced(page)).toContain('3 of 9 events');
  expect(await page.evaluate(() => window.__filters.at(-1))).toEqual({ filters: expect.objectContaining({ actor: 'ada' }), shown: 3, total: 9 });
  // Chips: any of the checked kinds.
  await workspace.locator('select[data-ds-auditlog-filter="actor"]').selectOption('');
  await workspace.locator('.ds-chip', { hasText: 'Sign-ins' }).click();
  await expect(entries(workspace)).toHaveCount(3);
  await workspace.locator('.ds-chip', { hasText: 'Syncs' }).click();
  await expect(entries(workspace)).toHaveCount(5);
  // A first day.
  await workspace.locator('input[data-ds-auditlog-filter="from"]').fill('2026-10-11');
  await expect(entries(workspace)).toHaveCount(3);
  // Search: every word, without case; typing waits for a pause.
  await workspace.locator('input[type="search"]').fill('GRACE console');
  await expect(entries(workspace)).toHaveCount(1);
  await expect(entries(workspace).first()).toHaveAttribute('data-ds-key', 'e8');
  // Nothing matches: the list goes, the empty state shows, "No results" is said.
  await workspace.locator('input[type="search"]').fill('printer');
  await expect(workspace.locator('[data-ds-auditlog-empty]')).toBeVisible();
  await expect(workspace.locator('.ds-timeline')).toBeHidden();
  await expect(workspace.locator('.ds-auditlog__count')).toHaveText('0 of 9 events');
  await expect.poll(() => announced(page)).toContain('No results');
  // The form's reset clears every control, and the log is whole again.
  await workspace.getByRole('button', { name: 'Clear' }).click();
  await expect(entries(workspace)).toHaveCount(9);
  await expect(workspace.locator('[data-ds-auditlog-empty]')).toBeHidden();
  await expect(workspace.locator('.ds-auditlog__count')).toHaveText('9 events');
});

test('filter() from the page sets the controls; get() keeps every entry; count() tells what shows', async ({ page }) => {
  await open(page);
  const workspace = log(page, 'workspace');
  const result = await workspace.evaluate((el) => {
    const controller = DS.auditlog.create(el);
    const filters = controller.filter({ kind: ['access'], text: 'phone' });
    return { filters, count: controller.count(), all: controller.get().length };
  });
  expect(result.filters).toEqual(expect.objectContaining({ kind: ['access'], text: 'phone' }));
  expect(result.count).toEqual({ shown: 1, total: 9 });
  expect(result.all).toBe(9);
  await expect(workspace.locator('input[type="search"]')).toHaveValue('phone');
  await expect(workspace.locator('.ds-chip__input[value="access"]')).toBeChecked();
  await expect(workspace.locator('.ds-chip__input[value="change"]')).not.toBeChecked();
});

test('set(): a new event comes in at the top under Today, the rest keep their rows', async ({ page }) => {
  await open(page);
  const workspace = log(page, 'workspace');
  const kept = await entries(workspace).nth(1).elementHandle();
  await page.locator('[data-demo="arrive"]').click();
  await expect(entries(workspace)).toHaveCount(10);
  await expect(entries(workspace).first()).toHaveAttribute('data-ds-key', 'n1');
  await expect(entries(workspace).first().locator('.ds-auditlog__new')).toHaveText('After: Issued');
  await settle(page);
  // Morphed in place: the old first entry is the same node, now second.
  expect(await kept.evaluate((el) => el.getAttribute('data-ds-key'))).toBe('e8');
  expect(await entries(workspace).nth(2).evaluate((el, node) => el === node, kept)).toBe(true);
  await expect(workspace.locator('.ds-auditlog__count')).toHaveText('10 events');
});

test('one record: changes() of two versions lists the changed fields by their labels, nested and lists included', async ({ page }) => {
  await open(page);
  const record = log(page, 'record');
  const fields = (key) => record.locator(`[data-ds-key="${key}"] .ds-auditlog__change dt`).allTextContents();
  expect(await fields('r2')).toEqual(['Owner', 'Team', 'Building', 'Room', 'Tags']);
  expect(await fields('r3')).toEqual(['Tags', 'Warranty ends', 'Retired']);
  expect(await fields('r1')).toEqual(['Name', 'Model']);
  await expect(record.locator('[data-ds-key="r2"] .ds-auditlog__change').nth(4).locator('.ds-auditlog__new')).toHaveText('After: loan, lab');
  await expect(record.locator('[data-ds-key="r3"] .ds-auditlog__change').nth(2).locator('.ds-auditlog__new')).toHaveText('After: false');
  const pure = await page.evaluate(() => DS.auditlog.changes({ a: { b: 1 } }, { a: { b: 2 } }, { fields: { 'a.b': 'B' } }));
  expect(pure).toEqual([{ path: 'a.b', field: 'B', before: 1, after: 2, kind: 'changed' }]);
});

test('a change row: 2px of block padding per size and density step; the shape multiplies the diff and its tints', async ({ page }) => {
  await open(page);
  const read = (cls) => page.evaluate((name) => {
    // The demo's stage is a .ds-theme of its own: the options go on it, as the panel puts them.
    const region = document.querySelector('[data-demo="workspace"]').closest('.ds-theme');
    region.className = region.className.split(' ').filter((item) => !/^ds-(xs|sm|md|lg|xl|density-\w+|shape-\w+)$/.test(item)).join(' ');
    if (name) region.classList.add(...name.split(' '));
    const row = region.querySelector('[data-demo="workspace"] .ds-auditlog__change');
    const diff = row.closest('.ds-auditlog__diff');
    return { pad: parseFloat(getComputedStyle(row).paddingTop), radius: parseFloat(getComputedStyle(diff).borderTopLeftRadius), tint: parseFloat(getComputedStyle(row.querySelector('.ds-auditlog__old')).borderTopLeftRadius) };
  }, cls);
  const base = await read('');
  expect(base.pad).toBe(8);
  expect((await read('ds-lg')).pad).toBe(10);
  expect((await read('ds-sm')).pad).toBe(6);
  expect((await read('ds-density-compact')).pad).toBe(6);
  expect((await read('ds-density-tight')).pad).toBe(4);
  expect((await read('ds-xs ds-density-tight')).pad).toBe(4);
  expect((await read('ds-shape-square'))).toEqual(expect.objectContaining({ radius: 0, tint: 0 }));
  const soft = await read('ds-shape-soft');
  expect(soft.radius).toBeCloseTo(base.radius / 2, 1);
  expect(soft.tint).toBeCloseTo(base.tint / 2, 1);
});

test('narrow: under 520px of the log the field goes above its values and the old above the new; the arrow goes', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const change = log(page, 'workspace').locator('[data-ds-key="e9"] .ds-auditlog__change').first();
  const box = async (selector) => change.locator(selector).boundingBox();
  const field = await box('dt');
  const old = await box('.ds-auditlog__old');
  const now = await box('.ds-auditlog__new');
  expect(old.y).toBeGreaterThanOrEqual(field.y + field.height - 1);
  expect(now.y).toBeGreaterThanOrEqual(old.y + old.height - 1);
  expect(await change.evaluate((el) => getComputedStyle(el, '::after').display)).toBe('none');
  // Nothing sticks out sideways at a phone width.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('keyboard: the filters in order, then the links of the entries', async ({ page }) => {
  await open(page);
  const workspace = log(page, 'workspace');
  await focusByKeyboard(page, workspace.locator('input[type="search"]'));
  const names = [];
  // A date field is one stop or several (one per part, in Chromium): each name once.
  for (let step = 0; step < 14 && names.length < 7; step += 1) {
    await page.keyboard.press('Tab');
    const name = await page.evaluate(() => {
      const el = document.activeElement;
      return el.getAttribute('aria-label') || el.closest('label')?.textContent.trim() || el.textContent.trim();
    });
    if (names.at(-1) !== name) names.push(name);
  }
  expect(names).toEqual(['Who', 'From', 'Changes', 'Sign-ins', 'Syncs', 'Clear', 'LAPTOP-0042']);
  // A chip toggles with Space.
  await focusByKeyboard(page, workspace.locator('.ds-chip__input[value="sync"]'));
  await page.keyboard.press('Space');
  await expect(entries(workspace)).toHaveCount(2);
});

test('forced colours: the tints give way, the values keep an edge, the strike and the underline stay', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.forcedColorAdjust = 'none';
    el.style.color = 'CanvasText';
    document.querySelector('#fx-component').append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  const look = await log(page, 'workspace').locator('[data-ds-key="e9"] .ds-auditlog__change').first().evaluate((el) => {
    const old = el.querySelector('.ds-auditlog__old');
    const now = el.querySelector('.ds-auditlog__new');
    return {
      oldEdge: getComputedStyle(old).borderTopColor,
      newEdge: getComputedStyle(now).borderTopColor,
      oldWidth: getComputedStyle(old).borderTopWidth,
      strike: getComputedStyle(el.querySelector('del')).textDecorationLine,
      underline: getComputedStyle(el.querySelector('ins')).textDecorationLine,
      diffEdge: getComputedStyle(el.closest('.ds-auditlog__diff')).borderTopStyle,
    };
  });
  expect(look.oldEdge).toBe(system);
  expect(look.newEdge).toBe(system);
  expect(look.oldWidth).toBe('1px');
  expect(look.strike).toContain('line-through');
  expect(look.underline).toContain('underline');
  expect(look.diffEdge).toBe('solid');
});
