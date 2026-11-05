/**
 * The notification centre (3.0): the bell with its count and name, the
 * sheet through DS.overlay (focus in, Escape, focus back), groups by day,
 * read and unread (the dot, the weight, the word, the button's name), mark
 * all read with its announcement, actions, the unread-only switch, the
 * empty state, the live announcement on arrival, the options, a phone and
 * forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=notifications');
  await ready(page);
  await page.mouse.move(1, 1);
}

const sheet = (page) => page.locator('[data-demo="sheet"]');
const bell = (page) => page.locator('[data-demo="bell"]');
const rows = (page) => sheet(page).locator('.ds-notifications__item');

async function openSheet(page) {
  await bell(page).click();
  await expect(sheet(page)).toHaveAttribute('data-state', 'open');
  await settle(page);
}

test('the bell: the unread count on its corner, in its name; it opens the sheet, Escape closes it and focus returns', async ({ page }) => {
  await open(page);
  await expect(bell(page)).toHaveAccessibleName('Notifications, 3 unread');
  const badge = page.locator('[data-demo="bar"] .ds-notifications__bell').first().locator('.ds-badge');
  await expect(badge).toHaveText('3');
  await expect(badge).toHaveAttribute('aria-hidden', 'true');
  // The badge sits on the button's top end corner, outside its box.
  const [b, c] = await Promise.all([bell(page).boundingBox(), badge.boundingBox()]);
  expect(c.x + c.width).toBeGreaterThan(b.x + b.width);
  expect(c.y).toBeLessThan(b.y);
  await bell(page).focus();
  await page.keyboard.press('Enter');
  await expect(sheet(page)).toHaveAttribute('data-state', 'open');
  await expect(page.getByRole('dialog', { name: 'Notifications' }).first()).toBeVisible();
  await expect(sheet(page).locator('.ds-sheet__subtitle')).toHaveText('3 unread');
  await settle(page);
  // Focus lands on the feed, so Escape closes at once (no tooltip of a head button in between).
  await expect(sheet(page).locator('.ds-notifications__feed')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet(page)).not.toHaveAttribute('data-state', 'open');
  await expect(bell(page)).toBeFocused();
});

test('groups by day, newest first; unread shows a dot, the label weight and a word; the read button says what it does', async ({ page }) => {
  await open(page);
  await openSheet(page);
  await expect(sheet(page).locator('.ds-notifications__heading')).toHaveText(['Today', 'Yesterday', 'Earlier']);
  await expect(sheet(page).getByRole('list')).toHaveCount(3);
  const first = rows(page).first();
  await expect(first).toHaveAttribute('data-unread', '');
  await expect(first.locator('.ds-notifications__link')).toHaveText('LAPTOP-0042 is offline');
  await expect(first.locator('.ds-sr')).toHaveText('Unread,');
  const look = await first.evaluate((row) => {
    const dot = row.querySelector('.ds-notifications__dot');
    const read = row.closest('.ds-notifications__feed').querySelector('.ds-notifications__item:not([data-unread])');
    return {
      dot: getComputedStyle(dot).opacity,
      weight: Number(getComputedStyle(row.querySelector('.ds-notifications__title')).fontWeight),
      readWeight: Number(getComputedStyle(read.querySelector('.ds-notifications__title')).fontWeight),
      readDot: getComputedStyle(read.querySelector('.ds-notifications__dot')).opacity,
    };
  });
  expect(look.dot).toBe('1');
  expect(look.readDot).toBe('0');
  expect(look.weight).toBeGreaterThan(look.readWeight);
  const toggle = first.locator('.ds-notifications__toggle');
  await expect(toggle).toHaveAccessibleName('Mark as read');
  await expect(toggle).toHaveAccessibleDescription('LAPTOP-0042 is offline');
  await toggle.click();
  await expect(first).not.toHaveAttribute('data-unread', '');
  await expect(toggle).toHaveAccessibleName('Mark as unread');
  await expect(bell(page)).toHaveAccessibleName('Notifications, 2 unread');
  await toggle.click();
  await expect(bell(page)).toHaveAccessibleName('Notifications, 3 unread');
});

test('mark all read: every row read, announced, the button then aria-disabled; the count goes', async ({ page }) => {
  await open(page);
  await openSheet(page);
  const all = sheet(page).getByRole('button', { name: 'Mark all as read' });
  await all.click();
  await expect(sheet(page).locator('.ds-notifications__item[data-unread]')).toHaveCount(0);
  await expect(all).toHaveAttribute('aria-disabled', 'true');
  await expect(sheet(page).locator('.ds-sheet__subtitle')).toHaveText('');
  await expect(bell(page)).toHaveAccessibleName('Notifications');
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.ds-sr[aria-live]')].map((el) => el.textContent).join(' '))).toContain('All notifications marked as read.');
  // The count's badge pops out and takes no room.
  await settle(page);
  await expect(page.locator('[data-demo="bar"] .ds-notifications__bell').first().locator('.ds-badge')).toBeHidden();
});

test('a link marks its notification read and dispatches ds:select; an action dispatches ds:action', async ({ page }) => {
  await open(page);
  await openSheet(page);
  const events = page.evaluate(() => new Promise((resolve) => {
    const seen = [];
    const sheetEl = document.querySelector('[data-demo="sheet"]');
    sheetEl.addEventListener('ds:select', (event) => seen.push(`select:${event.detail.item.id}`));
    sheetEl.addEventListener('ds:action', (event) => {
      seen.push(`action:${event.detail.item.id}:${event.detail.action.id}`);
      resolve(seen);
    });
  }));
  await rows(page).nth(1).locator('.ds-notifications__link').click();
  await expect(rows(page).nth(1)).not.toHaveAttribute('data-unread', '');
  await rows(page).first().getByRole('button', { name: 'Open a ticket' }).click();
  expect(await events).toEqual(['select:ticket-1047', 'action:offline-42:ticket']);
});

test('arrivals: the new one leads, the count rises, one announcement per task', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'A notification arrives' }).click();
  await expect(bell(page)).toHaveAccessibleName('Notifications, 4 unread');
  await expect.poll(() => page.evaluate(() => document.querySelector('.ds-sr[aria-live="polite"]')?.textContent ?? '')).toMatch(/^New notification: .+ needs an update$/);
  await page.getByRole('button', { name: 'Three arrive at once' }).click();
  await expect(bell(page)).toHaveAccessibleName('Notifications, 7 unread');
  await expect.poll(() => page.evaluate(() => document.querySelector('.ds-sr[aria-live="polite"]')?.textContent ?? '')).toBe('3 new notifications');
  await openSheet(page);
  await expect(rows(page).first().locator('.ds-notifications__title')).toContainText('needs an update');
  // With the sheet open, an arrival glides in place: no row is lost or doubled.
  const before = await rows(page).count();
  await page.evaluate(() => DS.notifications.create(document.querySelector('[data-demo="sheet"]')).add({ id: 'late', title: 'PHONE-0311 is back online', time: Date.now() }));
  await settle(page);
  await expect(rows(page)).toHaveCount(before + 1);
  await expect(rows(page).first()).toHaveAttribute('data-ds-key', 'late');
});

test('the unread-only switch hides what was read; the empty state shows when nothing is left', async ({ page }) => {
  await open(page);
  await openSheet(page);
  await expect(rows(page)).toHaveCount(5);
  await sheet(page).getByRole('switch', { name: 'Only unread' }).check();
  await expect(rows(page)).toHaveCount(3);
  await sheet(page).getByRole('button', { name: 'Mark all as read' }).click();
  await expect(rows(page)).toHaveCount(0);
  await expect(sheet(page).locator('.ds-notifications__empty')).toBeVisible();
  await expect(sheet(page).locator('.ds-notifications__empty')).toContainText('No notifications');
});

test('an empty centre shows the page\'s own empty state', async ({ page }) => {
  await open(page);
  await page.locator('[data-demo="empty-bell"]').click();
  const empty = page.locator('[data-demo="empty-sheet"]');
  await expect(empty).toHaveAttribute('data-state', 'open');
  await expect(empty.locator('.ds-empty__title')).toHaveText('You are all caught up');
  await expect(empty.locator('.ds-notifications__empty')).toHaveCount(1);
  await expect(empty.getByRole('button', { name: 'Mark all as read' })).toHaveAttribute('aria-disabled', 'true');
});

test('the keyboard reaches each notification\'s link, actions and read button in order', async ({ page }) => {
  await open(page);
  await bell(page).focus();
  await page.keyboard.press('Enter');
  await settle(page);
  await rows(page).first().locator('.ds-notifications__link').focus();
  await page.keyboard.press('Tab');
  await expect(rows(page).first().getByRole('button', { name: 'Open a ticket' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(rows(page).first().locator('.ds-notifications__toggle')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(rows(page).first()).not.toHaveAttribute('data-unread', '');
  await expect(rows(page).first().locator('.ds-notifications__toggle')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(rows(page).nth(1).locator('.ds-notifications__link')).toBeFocused();
});

test('the options: size and density step a row and its disc; shape rounds the disc', async ({ page }) => {
  await open(page);
  await openSheet(page);
  const measure = (classes) => page.evaluate((classes) => {
    const el = document.querySelector('[data-demo="sheet"]');
    el.className = `ds-sheet ds-notifications ${classes}`;
    const row = el.querySelector('.ds-notifications__item');
    const disc = row.querySelector('.ds-notifications__icon');
    return { pad: parseFloat(getComputedStyle(row).paddingTop), disc: disc.getBoundingClientRect().width, radius: parseFloat(getComputedStyle(disc).borderTopLeftRadius) };
  }, classes);
  const base = await measure('');
  expect(base).toEqual({ pad: 12, disc: 40, radius: 20 });
  expect(await measure('ds-lg')).toMatchObject({ pad: 16, disc: 48 });
  expect(await measure('ds-sm')).toMatchObject({ pad: 8, disc: 32 });
  expect((await measure('ds-density-dense')).pad).toBe(8);
  expect((await measure('ds-shape-square')).radius).toBe(0);
  expect((await measure('ds-shape-soft')).radius).toBe(10);
  await measure('');
});

test('a phone: the sheet fits the width, the rows wrap', async ({ page }) => {
  await open(page, 360);
  await openSheet(page);
  const fit = await page.evaluate(() => {
    const panel = document.querySelector('[data-demo="sheet"] .ds-sheet__panel').getBoundingClientRect();
    const rows = [...document.querySelectorAll('[data-demo="sheet"] .ds-notifications__item')].map((row) => row.getBoundingClientRect().right);
    return { panel: panel.width, right: Math.max(...rows), width: document.documentElement.clientWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });
  expect(fit.panel).toBeLessThanOrEqual(fit.width);
  expect(fit.right).toBeLessThanOrEqual(fit.width);
  expect(fit.overflow).toBe(false);
});

test('forced colours: the unread dot keeps CanvasText, the disc an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await openSheet(page);
  const look = await page.evaluate(() => {
    const row = document.querySelector('[data-demo="sheet"] .ds-notifications__item[data-unread]');
    const dot = getComputedStyle(row.querySelector('.ds-notifications__dot'));
    const disc = getComputedStyle(row.querySelector('.ds-notifications__icon'));
    return { dot: dot.backgroundColor, adjust: dot.forcedColorAdjust, edge: disc.borderTopWidth };
  });
  expect(look.adjust).toBe('none');
  expect(look.dot).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  expect(look.edge).toBe('1px');
});
