/**
 * Walk-through of every styleguide demo: the `[data-sg]` buttons and the
 * segmented options of index.html, and on the Motion Lab (motion.html) the
 * demos that moved there from the index's Motion section: enter and leave,
 * stagger, count, the track and the disclosure. Each demo is one test that
 * clicks it, checks what it did, and must end settled (helpers/motion.js
 * `settle()`) with no console error.
 *
 * With DS_VIDEO=1 the walk-through runs in Chromium only, at `?speed=0.1`,
 * and records one video per demo into test-results/ (never committed).
 * Later phases record their "before" videos from the `motion-2-p0` tag:
 *
 *   git worktree add ../ds-before motion-2-p0
 *   cd ../ds-before && npm ci && DS_VIDEO=1 npm run test:browser -- demos.spec.js --project=chromium
 *
 * ?speed= sets --ds-time-scale: motion timed by the tokens slows down,
 * plain JS timers keep their pace (test/browser/README.md, "Slow motion").
 */
import { test, expect } from '@playwright/test';
import { ready, settle, setSpeed } from './helpers/motion.js';

const VIDEO = !!process.env.DS_VIDEO;
const STYLEGUIDE = `/styleguide/index.html${VIDEO ? '?speed=0.1' : ''}`;
const LAB = `/styleguide/motion.html${VIDEO ? '?speed=0.1' : ''}`;
// Ten times slower motion needs ten times the settle time.
const SETTLE = { timeout: VIDEO ? 30000 : 3000 };

test.use({ video: VIDEO ? { mode: 'on', size: { width: 1280, height: 800 } } : 'off' });
test.describe.configure({ timeout: VIDEO ? 120000 : 30000 });

let errors = [];

test.beforeEach(async ({ page, browserName }) => {
  test.skip(VIDEO && browserName !== 'chromium', 'demo videos are recorded in Chromium only');
  errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(String(error)));
  // The tests of the 'Motion Lab' block run on motion.html.
  await page.goto(test.info().titlePath.includes('Motion Lab') ? LAB : STYLEGUIDE);
  await ready(page);
  await page.mouse.move(1, 1);
  await page.waitForFunction(() => [...document.querySelectorAll('.ds-tile__value[data-count]')].every((el) => {
    const final = Number(el.getAttribute('data-count')).toLocaleString('en-US') + (el.getAttribute('data-suffix') || '');
    return el.textContent === final;
  }));
  await settle(page, SETTLE);
});

test.afterEach(async ({ page }) => {
  await settle(page, SETTLE);
  expect(errors, 'console errors').toEqual([]);
});

/** Clicks the element after scrolling it into view in the styleguide's panel. */
async function press(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
}

/** The count-up tiles show their final value. */
function countsDone(page) {
  return page.waitForFunction(() => [...document.querySelectorAll('.ds-tile__value[data-count]')].every((el) => {
    const final = Number(el.getAttribute('data-count')).toLocaleString('en-US') + (el.getAttribute('data-suffix') || '');
    return el.textContent === final;
  }));
}

/* ── [data-sg] buttons ─────────────────────────────────────────────── */

test('toggle: a toggle button flips aria-pressed', async ({ page }) => {
  const button = page.locator('[data-sg="toggle"]').first();
  const before = await button.getAttribute('aria-pressed');
  await press(button);
  await expect(button).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
});

test('switch: the state word follows the switch', async ({ page }) => {
  const label = page.locator('.ds-switch:has(input[data-sg="switch"])').first();
  const input = label.locator('input');
  const state = label.locator('.ds-switch__state');
  const wasOn = await input.isChecked();
  await press(label);
  await expect(input).toBeChecked({ checked: !wasOn });
  await expect(state).toHaveText(wasOn ? 'Off' : 'On');
});

test('menu: the modal drawer opens and closes at 800px', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 800 });
  await settle(page, SETTLE);
  const app = page.locator('#sg-app');
  await press(page.locator('[data-sg="menu"]'));
  await expect(app).toHaveAttribute('data-drawer-open', '');
  await settle(page, SETTLE);
  await page.keyboard.press('Escape');
  await expect(app).not.toHaveAttribute('data-drawer-open', '');
});

test('toast: a snackbar shows', async ({ page }) => {
  await press(page.locator('[data-sg="toast"]'));
  await expect(page.locator('#sg-toasts > .ds-toast:not(.ds-toast--error)')).toHaveCount(1);
});

test('toast-error: an error snackbar shows and closes', async ({ page }) => {
  await press(page.locator('[data-sg="toast-error"]'));
  const toast = page.locator('#sg-toasts > .ds-toast--error');
  await expect(toast).toHaveCount(1);
  await settle(page, SETTLE);
  await toast.locator('.ds-toast__close').click();
  await expect(toast).toHaveCount(0, { timeout: SETTLE.timeout });
});

test('sheet: the side sheet opens and closes', async ({ page }) => {
  await press(page.locator('[data-sg="sheet"]'));
  const sheet = page.locator('body > .ds-sheet');
  await expect(sheet).toHaveCount(1);
  await settle(page, SETTLE);
  await sheet.locator('.ds-form-actions [data-close]').last().click();
  await expect(sheet).toHaveCount(0, { timeout: SETTLE.timeout });
});

test('dialog: the dialog opens and closes', async ({ page }) => {
  await press(page.locator('[data-sg="dialog"]'));
  const dialog = page.locator('body > .ds-dialog');
  await expect(dialog).toHaveCount(1);
  await settle(page, SETTLE);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout: SETTLE.timeout });
});

test('dialog-div: the dialog in div markup opens on Cancel and closes', async ({ page }) => {
  await press(page.locator('[data-sg="dialog-div"]'));
  const dialog = page.locator('body > .ds-dialog');
  await expect(dialog).toHaveCount(1);
  await expect(page.locator('body > .ds-dialog .ds-dialog__actions [data-close]').first()).toBeFocused();
  await settle(page, SETTLE);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout: SETTLE.timeout });
  await expect(page.locator('[data-sg="dialog-div"]')).toBeFocused();
});

test('dialog-combo: the list at the bottom of a dialog opens, Escape closes it first', async ({ page }) => {
  await press(page.locator('[data-sg="dialog-combo"]'));
  const dialog = page.locator('body > .ds-dialog');
  await settle(page, SETTLE);
  await dialog.locator('.ds-combo__input').focus();
  await page.keyboard.press('ArrowDown');
  const popup = dialog.locator('.ds-combo__popup');
  await expect(popup).toHaveAttribute('data-state', 'open');
  await settle(page, SETTLE);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(popup).toBeHidden({ timeout: SETTLE.timeout });
  await expect(dialog.locator('.ds-combo__input')).toHaveValue('Latitude 5430');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout: SETTLE.timeout });
});

test('dialog-nested: a dialog over the side sheet takes the nested scrim; Escape closes one at a time', async ({ page }) => {
  await press(page.locator('[data-sg="sheet"]'));
  const sheet = page.locator('body > .ds-sheet');
  await settle(page, SETTLE);
  await sheet.locator('[data-sg="dialog-nested"]').click();
  // Over the native sheet the native dialog sits inside it while it shows (its exit then stays above the panel).
  const dialog = page.locator('#sg-dialog-nested');
  await expect(dialog).toHaveClass(/ds-dialog--nested/);
  await expect(sheet.locator('#sg-dialog-nested')).toHaveCount(1);
  await settle(page, SETTLE);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout: SETTLE.timeout });
  await expect(sheet).toHaveCount(1);
  await expect(sheet.locator('[data-sg="dialog-nested"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0, { timeout: SETTLE.timeout });
});

test('toast-many: four messages, never more than three, the error stays', async ({ page }) => {
  await press(page.locator('[data-sg="toast-many"]'));
  const toasts = page.locator('#sg-toasts > .ds-toast:not(.ds-leave)');
  await expect(page.locator('#sg-toasts > .ds-toast').filter({ hasText: 'Exported the list as CSV.' })).toHaveCount(1, { timeout: SETTLE.timeout });
  await settle(page, SETTLE);
  await expect(toasts).toHaveCount(3);
  await expect(toasts.filter({ hasText: 'Imported 128 devices.' })).toHaveCount(0);
  await expect(page.locator('#sg-toasts > .ds-toast--error')).toHaveCount(1);
});

test('menu: the overflow menu opens from its button, an item says what it did', async ({ page }) => {
  const trigger = page.locator('[data-sg-menu]');
  await press(trigger);
  const menu = page.locator('#sg-menu');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await settle(page, SETTLE);
  await menu.getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect(menu).toBeHidden({ timeout: SETTLE.timeout });
  await expect(page.locator('#sg-toasts > .ds-toast').filter({ hasText: 'Duplicated' })).toHaveCount(1);
});

test('presence: the popover fades in and closes on Escape', async ({ page }) => {
  await press(page.locator('[popovertarget="sg-presence"]'));
  await expect(page.locator('#sg-presence')).toBeVisible();
  await settle(page, SETTLE);
  await page.keyboard.press('Escape');
  await expect(page.locator('#sg-presence')).toBeHidden({ timeout: SETTLE.timeout });
});

test('combo: typing filters the list, the chevron opens and closes it', async ({ page }) => {
  const input = page.locator('#f-combo');
  await press(input);
  await page.keyboard.type('lat');
  const popup = page.locator('#selection .ds-combo__popup');
  await expect(popup).toHaveAttribute('data-state', 'open');
  await expect(page.locator('#selection .ds-combo__status')).toHaveText('3 of 6 models');
  await settle(page, SETTLE);
  await page.locator('#selection .ds-combo__toggle').click();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(popup).toBeHidden({ timeout: SETTLE.timeout });
});

test('progress: the bar advances', async ({ page }) => {
  const label = page.locator('#sg-progress .ds-progress__label');
  await expect(label).toHaveText('40%');
  await press(page.locator('[data-sg="progress"]'));
  await expect(label).toHaveText('60%');
});

test('dense: the table turns dense', async ({ page }) => {
  await press(page.locator('[data-sg="dense"]'));
  await expect(page.locator('#sg-table')).toHaveClass(/ds-table--dense/);
});

test('busy: the button saves and confirms', async ({ page }) => {
  const button = page.locator('[data-sg="busy"]');
  await press(button);
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).not.toHaveAttribute('aria-busy', 'true', { timeout: 5000 });
  await expect(page.locator('#sg-toasts > .ds-toast').filter({ hasText: 'Changes saved.' })).toHaveCount(1);
});

/* ── Feedback and data demos ───────────────────────────────────────── */

// The demos' own timers (fake requests, polls, feeds) slow down with ?speed= too.
const WAIT = { timeout: VIDEO ? 60000 : 6000 };

test('progress-run: waiting, preparing, a first share, done, with the aria of each step', async ({ page }) => {
  const progress = page.locator('#sg-progress-run');
  const track = progress.locator('.ds-progress__track');
  await press(page.locator('[data-sg="progress-run"]'));
  await expect(progress).toHaveClass(/ds-progress--waiting/);
  await expect(track).toHaveAttribute('aria-valuetext', 'Waiting');
  await expect(track).not.toHaveAttribute('aria-valuenow', /./);
  await expect(progress).toHaveClass(/ds-progress--indeterminate/, WAIT);
  await expect(track).toHaveAttribute('aria-valuetext', 'Preparing');
  await expect(track).toHaveAttribute('aria-valuenow', '30', WAIT);
  await expect(track).not.toHaveAttribute('aria-valuetext', /./);
  await expect(progress).not.toHaveClass(/ds-progress--(waiting|indeterminate)/);
  await expect(track).toHaveAttribute('aria-valuenow', '100', WAIT);
});

test('skeleton: the loaded page replaces the skeleton with .ds-reveal, and back', async ({ page }) => {
  const stage = page.locator('#sg-skeleton-stage');
  const button = page.locator('[data-sg="skeleton"]');
  await press(button);
  await expect(stage.locator('.ds-reveal')).toHaveCount(1);
  await expect(stage.locator('.ds-skeleton')).toHaveCount(0);
  await settle(page, SETTLE);
  await press(button);
  await expect(stage.locator('.ds-skeleton')).toHaveCount(1);
});

// Whether the 150ms load stays under the loader delay depends on timer
// jitter on a busy machine, so only the slow load's verdict is checked.
// The loading line is checked in the task of the click: a 150ms load may
// be over before a later poll could see it.
for (const [ms, text] of [['150', 'after 150ms'], ['1200', 'showed and left at once']]) {
  test(`load ${ms}ms: the result replaces the loading line`, async ({ page }) => {
    const button = page.locator(`[data-sg="load"][data-ms="${ms}"]`);
    await button.scrollIntoViewIfNeeded();
    expect(await button.evaluate((el) => {
      el.click();
      return document.querySelectorAll('#sg-load-stage .ds-loading').length;
    }), 'the loading line goes in at once').toBe(1);
    await expect(page.locator('#sg-load-stage')).toContainText(text, WAIT);
  });
}

test('status-poll: the polled chip cycles running, ok, error on the kept node', async ({ page }) => {
  const holder = page.locator('#sg-status-poll');
  await holder.locator('.ds-status').evaluate((chip) => { window.sgChip = chip; });
  const toggle = page.locator('[data-sg="status-poll"]');
  await press(toggle);
  await expect(holder.locator('.ds-status')).toHaveClass(/ds-status--ok/, WAIT);
  await expect(holder.locator('.ds-status')).toHaveClass(/ds-status--error/, WAIT);
  await press(toggle);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await holder.locator('.ds-status').evaluate((chip) => chip === window.sgChip)).toBe(true);
});

test('alerts: insert and dismiss through flip', async ({ page }) => {
  const alerts = page.locator('#sg-alerts > .ds-alert');
  await expect(alerts).toHaveCount(4);
  await press(page.locator('[data-sg="alert-insert"]'));
  await expect(alerts).toHaveCount(5);
  await expect(alerts.first()).toContainText('Synced LAPTOP-0042.');
  await settle(page, SETTLE);
  await press(alerts.first().locator('[data-sg="alert-dismiss"]'));
  await expect(alerts).toHaveCount(4, { timeout: SETTLE.timeout });
  await expect(alerts.first()).toContainText('The nightly sync');
});

test('figures: the key figures count to their new values, the synced bar with them', async ({ page }) => {
  await press(page.locator('[data-sg="figures"]'));
  await countsDone(page);
  const share = await page.evaluate(() => Number(document.getElementById('sg-synced').getAttribute('data-count')) / Number(document.getElementById('sg-devices').getAttribute('data-count')));
  await expect(page.locator('#sg-synced-progress .ds-progress__track')).toHaveAttribute('aria-valuenow', String(Math.round(share * 100)));
});

test('items: returning the last item shows the empty state, and it comes back', async ({ page }) => {
  const items = page.locator('#sg-items > li');
  const empty = page.locator('#sg-items-empty');
  for (let left = 2; left > 0; left -= 1) {
    await press(items.first().locator('[data-sg="item-return"]'));
    await expect(items).toHaveCount(left - 1, { timeout: SETTLE.timeout });
    await settle(page, SETTLE);
  }
  await expect(empty).toBeVisible();
  await press(empty.locator('[data-sg="items-restore"]'));
  await expect(empty).toBeHidden({ timeout: SETTLE.timeout });
  await expect(items).toHaveCount(2, { timeout: SETTLE.timeout });
});

for (const [kind, dims] of [['fast', false], ['slow', true]]) {
  test(`stale-${kind}: the list is stale while the refresh runs${dims ? ' and dims' : ', never dimmed'}`, async ({ page }) => {
    // At a quarter speed the fast refresh (600ms) ends 200ms before the
    // stale delay (800ms), so a late timer on a busy machine never dims it.
    if (!VIDEO) {
      await setSpeed(page, 0.25);
      await page.mouse.move(1, 1);
      await settle(page, SETTLE);
    }
    const box = page.locator('#sg-stale');
    const button = page.locator(`[data-sg="stale-${kind}"]`);
    await button.scrollIntoViewIfNeeded();
    // Every frame from the click until the refresh ended, read in the page.
    const frames = box.evaluate((el) => new Promise((resolve, reject) => {
      const seen = [];
      const started = performance.now();
      const tick = () => {
        const entry = { busy: el.getAttribute('aria-busy'), stale: el.classList.contains('ds-stale'), opacity: Number(getComputedStyle(el).opacity) };
        seen.push(entry);
        if (seen.some((item) => item.busy === 'true') && entry.busy === 'false') resolve(seen);
        else if (performance.now() - started > 20000) reject(new Error(`no end: ${JSON.stringify(seen.slice(-3))}`));
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }));
    await button.click();
    const seen = await frames;
    const busy = seen.filter((entry) => entry.busy === 'true');
    expect(busy.length).toBeGreaterThan(0);
    for (const entry of busy) expect(entry.stale).toBe(true);
    const opacities = seen.map((entry) => entry.opacity);
    if (dims) expect(Math.min(...opacities)).toBeLessThan(1);
    else expect(opacities.every((value) => value === 1), JSON.stringify(opacities)).toBe(true);
    expect(seen.at(-1).stale).toBe(false);
    await expect(box).not.toHaveClass(/ds-stale/);
  });
}

test('card-open and tile-open: clickable cards and the tile say what they opened', async ({ page }) => {
  await press(page.locator('button.ds-card--interactive'));
  await expect(page.locator('#sg-toasts > .ds-toast').filter({ hasText: 'Opened PRINTER-0003.' })).toHaveCount(1);
  await press(page.locator('.ds-card__action'));
  await expect(page.locator('#sg-toasts > .ds-toast').filter({ hasText: 'Opened LAPTOP-0017.' })).toHaveCount(1);
  expect(new URL(page.url()).hash).toBe('');
});

test('table: sort, expand, select all, filter to nothing and back', async ({ page }) => {
  const table = page.locator('#sg-table');
  const names = () => table.locator('tbody tr:not(.ds-table__detail) .ds-table__row-link').allTextContents();
  await press(table.locator('[data-key="load"]'));
  await expect(table.locator('th[aria-sort="ascending"]')).toContainText('Load');
  await expect.poll(names).toEqual(['LAPTOP-0060', 'LAPTOP-0043', 'LAPTOP-0042', 'TABLET-0121', 'LAPTOP-0051', 'DESKTOP-0107']);
  await settle(page, SETTLE);
  await press(table.locator('[data-key="load"]'));
  await expect(table.locator('th[aria-sort="descending"]')).toContainText('Load');
  await expect.poll(names).toEqual(['DESKTOP-0107', 'LAPTOP-0051', 'TABLET-0121', 'LAPTOP-0042', 'LAPTOP-0043', 'LAPTOP-0060']);
  await settle(page, SETTLE);
  // A row's details open, and their row is no longer inert.
  const toggle = table.locator('tbody tr[data-ds-key="r1"] .ds-table__toggle');
  await press(toggle);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(await table.locator('#sg-detail-r1').evaluate((row) => row.inert)).toBe(false);
  await settle(page, SETTLE);
  await press(toggle);
  expect(await table.locator('#sg-detail-r1').evaluate((row) => row.inert)).toBe(true);
  // Select all checks every row; the header box follows a single row.
  const all = table.locator('[data-sg="select-all"]');
  await press(all);
  await expect(table.locator('[data-sg="select-row"]:checked')).toHaveCount(6);
  await table.locator('[data-sg="select-row"]').first().click();
  expect(await all.evaluate((input) => input.indeterminate)).toBe(true);
  await settle(page, SETTLE);
  // Filtering per keystroke, to nothing: the empty state fades in; cleared: the rows come back.
  const filter = page.locator('#sg-table-filter');
  await filter.scrollIntoViewIfNeeded();
  await filter.pressSequentially('lap');
  await expect.poll(names).toEqual(['LAPTOP-0051', 'LAPTOP-0042', 'LAPTOP-0043', 'LAPTOP-0060']);
  await filter.pressSequentially('z');
  await expect(page.locator('#sg-table-empty')).toBeVisible(WAIT);
  await settle(page, SETTLE);
  await filter.fill('');
  await expect(page.locator('#sg-table-empty')).toBeHidden(WAIT);
  await expect.poll(names).toHaveLength(6);
});

test('table-live: the feed changes values and stops', async ({ page }) => {
  const toggle = page.locator('[data-sg="table-live"]');
  const loads = () => page.locator('#sg-table tbody tr:not(.ds-table__detail) td.ds-num').allTextContents();
  const before = await loads();
  await press(toggle);
  await page.mouse.move(1, 1);
  await expect.poll(loads, WAIT).not.toEqual(before);
  await press(toggle);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('segmented: the indicator glides between options', async ({ page }) => {
  for (const name of ['Admin', 'Reports', 'Live']) {
    const option = page.locator('#sg-segmented .ds-segmented__option', { hasText: name });
    await press(option);
    await expect(option).toHaveAttribute('aria-current', 'true');
    await settle(page, SETTLE);
  }
});

/* ── Motion Lab (motion.html): the demos that moved from the Motion section ── */

test.describe('Motion Lab', () => {
  test('stagger: the squares enter one after the other', async ({ page }) => {
    await press(page.locator('[data-sg="stagger"]'));
    await expect(page.locator('#sg-stagger')).not.toHaveClass(/sg-fill/);
  });

  test('fill: the squares grow as bars', async ({ page }) => {
    await press(page.locator('[data-sg="fill"]'));
    await expect(page.locator('#sg-stagger')).toHaveClass(/sg-fill/);
  });

  test('count: the tiles count up again', async ({ page }) => {
    await press(page.locator('[data-sg="count"]'));
    await countsDone(page);
  });

  test('copy-rules: the button flush with the open disclosure works', async ({ page }) => {
    const details = page.locator('[data-lab-demo="disclosure"] details.ds-collapsible');
    await press(details.locator('summary'));
    await settle(page, SETTLE);
    await press(details.locator('[data-sg="copy-rules"]'));
    await expect(page.locator('#sg-toasts > .ds-toast').filter({ hasText: 'Copied the motion rules.' })).toHaveCount(1);
  });

  for (const variant of ['', 'fade', 'scale', 'slide', 'swap']) {
    test(`enter${variant ? ` ${variant}` : ''}: the card plays its entrance`, async ({ page }) => {
      await press(page.locator(`[data-enter="${variant}"]`));
      await settle(page, SETTLE);
      // enter() drops its classes once the entrance settled.
      await expect(page.locator('#sg-motion-card')).not.toHaveClass(/ds-enter/, { timeout: SETTLE.timeout });
    });
  }

  for (const variant of ['', 'sink', 'scale', 'slide', 'pop']) {
    test(`leave${variant ? ` ${variant}` : ''}: the card leaves and comes back`, async ({ page }) => {
      const card = page.locator('#sg-motion-card');
      await press(page.locator(`[data-leave="${variant}"]`));
      await expect(card).toHaveClass(/ds-leave/);
      // The demo keeps the card, then fades it back in 400ms after the exit.
      await expect(card).not.toHaveClass(/ds-leave/, { timeout: SETTLE.timeout });
      await expect(card).not.toHaveClass(/ds-enter/, { timeout: SETTLE.timeout });
      expect(await card.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    });
  }

  test('track: the indicator glides between options', async ({ page }) => {
    for (const name of ['Week', 'Year', 'Day']) {
      const option = page.locator('#sg-track button', { hasText: name });
      await press(option);
      await expect(option).toHaveAttribute('aria-pressed', 'true');
      await settle(page, SETTLE);
    }
  });

  test('disclosure: the motion rules open and close', async ({ page }) => {
    const details = page.locator('[data-lab-demo="disclosure"] details.ds-collapsible');
    const summary = details.locator('summary');
    await press(summary);
    await expect(details).toHaveAttribute('open', '');
    await settle(page, SETTLE);
    await summary.click();
    await expect(details).not.toHaveAttribute('open', '');
  });
});
