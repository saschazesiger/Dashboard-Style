/**
 * Walk-through of the styleguide's demos: the behaviour each component demo
 * (src/components/<n>/<n>.demo.js, on its page of index.html) wires as a
 * project would, the frame of the styleguide, and on the Motion Lab
 * (motion.html) the demos that moved there from the 2.x Motion section:
 * enter and leave, stagger, count, the track and the disclosure. Each demo
 * is one test that clicks it, checks what it did, and must end settled
 * (helpers/motion.js `settle()`) with no console error.
 *
 * These tests walked the 2.x sections of legacy.html until it was retired;
 * each kept its intent on the demo that took the section over. Two 2.x
 * demos have no counterpart on a component page, since their behaviour is
 * the system's and a fixture spec covers it: the combobox list at the
 * bottom of a dialog (Escape closes the list first: overlay.spec.js, "a
 * combobox popup keeps focus in its input") and the dialog over a side
 * sheet (overlay.spec.js, "a dialog from inside the sheet is nested").
 *
 * With DS_VIDEO=1 the walk-through runs in Chromium only, at `?speed=0.1`,
 * and records one video per demo into test-results/ (never committed).
 * Later phases record their "before" videos from the `motion-2-p0` tag:
 *
 *   git worktree add ../ds-before motion-2-p0
 *   cd ../ds-before && npm ci && DS_VIDEO=1 npm run test:browser -- demos.spec.js --project=chromium
 *
 * ?speed= sets --ds-time-scale: motion timed by the tokens slows down,
 * plain JS timers keep their pace unless a demo times them with h.slow()
 * (test/browser/README.md, "Slow motion").
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
  // The tests of the 'Motion Lab' block run on motion.html; the others open their demo (show()).
  if (!test.info().titlePath.includes('Motion Lab')) return;
  await page.goto(LAB);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page, SETTLE);
});

test.afterEach(async ({ page }) => {
  await settle(page, SETTLE);
  expect(errors, 'console errors').toEqual([]);
});

/** Opens the page of a component's demo (or a route of the styleguide: '' is the overview). */
async function show(page, name) {
  await page.goto(`${STYLEGUIDE}#/${name === '' ? '' : `components/${name}`}`);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page, SETTLE);
}

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

/** The snackbars of the styleguide's region. */
const toasts = (page) => page.locator('#sg-toasts > .ds-toast');

/** The stage around the demo. */
const stage = (page) => page.locator('#sg-stage');

// The demos' own timers (fake requests, polls, feeds) slow down with ?speed= too.
const WAIT = { timeout: VIDEO ? 60000 : 6000 };

/* ── Actions and the frame ─────────────────────────────────────────── */

test('toggle: a toggle button flips aria-pressed', async ({ page }) => {
  await show(page, 'button');
  const button = stage(page).locator('[data-demo="toggle"]');
  const before = await button.getAttribute('aria-pressed');
  await press(button);
  await expect(button).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
});

test('switch: the state word follows the switch', async ({ page }) => {
  await show(page, 'switch');
  const label = stage(page).locator('.ds-switch:has(.ds-switch__state):has(input:not(:disabled))').first();
  const input = label.locator('input');
  /** The word that shows (the other one is faded out). */
  const word = () => label.locator('.ds-switch__state').evaluate((state) => [...state.children]
    .filter((child) => Number(getComputedStyle(child).opacity) > 0.5).map((child) => child.textContent).join());
  const wasOn = await input.isChecked();
  await press(label);
  await expect(input).toBeChecked({ checked: !wasOn });
  await settle(page, SETTLE);
  await expect.poll(word).toBe(wasOn ? 'Off' : 'On');
});

test('menu: the modal drawer opens and closes at 800px', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 800 });
  await show(page, '');
  const app = page.locator('#sg-app');
  await press(page.locator('[data-sg="menu"]'));
  await expect(app).toHaveAttribute('data-drawer-open', '');
  await settle(page, SETTLE);
  await page.keyboard.press('Escape');
  await expect(app).not.toHaveAttribute('data-drawer-open', '');
});

test('busy: the button saves and confirms', async ({ page }) => {
  await show(page, 'button');
  const button = stage(page).locator('[data-demo="save"]');
  await press(button);
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).not.toHaveAttribute('aria-busy', 'true', { timeout: 5000 });
});

test('segmented: the indicator glides between options', async ({ page }) => {
  await show(page, 'shell');
  const nav = stage(page).locator('nav.ds-segmented[data-demo="segmented"]');
  for (const name of ['Admin', 'Reports', 'Live']) {
    const option = nav.locator('.ds-segmented__option', { hasText: name });
    await press(option);
    await expect(option).toHaveAttribute('aria-current', 'true');
    await settle(page, SETTLE);
  }
});

/* ── Overlays ──────────────────────────────────────────────────────── */

test('toast: a snackbar shows', async ({ page }) => {
  await show(page, 'toast');
  await press(stage(page).locator('[data-toast-demo="saved"]'));
  await expect(page.locator('#sg-toasts > .ds-toast:not(.ds-toast--error)')).toHaveCount(1);
});

test('toast-error: an error snackbar shows and closes', async ({ page }) => {
  await show(page, 'toast');
  await press(stage(page).locator('[data-toast-demo="error"]'));
  const toast = page.locator('#sg-toasts > .ds-toast--error');
  await expect(toast).toHaveCount(1);
  await settle(page, SETTLE);
  await toast.locator('.ds-toast__close').click();
  await expect(toast).toHaveCount(0, { timeout: SETTLE.timeout });
});

test('toast-many: four messages, never more than three', async ({ page }) => {
  await show(page, 'toast');
  await press(stage(page).locator('[data-toast-demo="error"]'));
  await press(stage(page).locator('[data-toast-demo="many"]'));
  await expect(toasts(page).filter({ hasText: 'Fourth device saved.' })).toHaveCount(1, { timeout: SETTLE.timeout });
  await settle(page, SETTLE);
  await expect(page.locator('#sg-toasts > .ds-toast:not(.ds-leave)')).toHaveCount(3);
  await expect(page.locator('#sg-toasts > .ds-toast--error'), 'the error stays').toHaveCount(1);
});

test('sheet: the side sheet opens and closes', async ({ page }) => {
  await show(page, 'sheet');
  const opener = stage(page).locator('button[data-ds-open]').first();
  await press(opener);
  const sheet = page.locator(`#${(await opener.getAttribute('data-ds-open')).slice(1)}`);
  await expect(sheet).toHaveAttribute('data-state', 'open');
  await settle(page, SETTLE);
  await sheet.locator('[data-ds-close]').last().click();
  await expect(sheet).toBeHidden({ timeout: SETTLE.timeout });
});

test('dialog: the dialog opens and closes', async ({ page }) => {
  await show(page, 'dialog');
  const opener = stage(page).locator('button[data-ds-open]').first();
  await press(opener);
  const dialog = page.locator(`#${(await opener.getAttribute('data-ds-open')).slice(1)}`);
  await expect(dialog).toHaveAttribute('open', '');
  await settle(page, SETTLE);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden({ timeout: SETTLE.timeout });
  await expect(opener).toBeFocused();
});

test('dialog-confirm: the dialog DS.overlay.confirm() writes takes the focus and gives it back', async ({ page }) => {
  await show(page, 'dialog');
  const opener = stage(page).locator('[data-demo="confirm"]');
  await press(opener);
  const dialog = page.locator('.ds-dialog[data-state="open"]');
  await expect(dialog).toHaveCount(1);
  await expect(dialog.locator('.ds-dialog__actions .ds-btn:focus'), 'focus moves to an action').toHaveCount(1);
  await settle(page, SETTLE);
  await page.keyboard.press('Escape');
  await expect(page.locator('.ds-dialog[data-state="open"]')).toHaveCount(0, { timeout: SETTLE.timeout });
  await expect(opener).toBeFocused();
});

test('menu: the overflow menu opens from its button, an item says what it did', async ({ page }) => {
  await show(page, 'menu');
  const trigger = stage(page).locator('[data-demo="plain"]');
  await press(trigger);
  const menu = stage(page).locator('[data-demo="actions"]');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await settle(page, SETTLE);
  await menu.getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect(menu).toBeHidden({ timeout: SETTLE.timeout });
  await expect(toasts(page).filter({ hasText: 'Duplicated' })).toHaveCount(1);
});

test('presence: the popover fades in and closes on Escape', async ({ page }) => {
  // No component demo opens a plain [popover]: the overlay fixture shows .ds-presence on one.
  await page.goto('/test/browser/fixtures/popups.html');
  await ready(page);
  await press(page.locator('#popover-presence'));
  await expect(page.locator('#presence-popover')).toBeVisible();
  await settle(page, SETTLE);
  await page.keyboard.press('Escape');
  await expect(page.locator('#presence-popover')).toBeHidden({ timeout: SETTLE.timeout });
});

test('combo: typing filters the list, the chevron opens and closes it', async ({ page }) => {
  await show(page, 'combobox');
  const combo = stage(page).locator('[data-demo="combo"]').first();
  const input = combo.locator('.ds-combo__input');
  await press(input);
  await page.keyboard.type('lap');
  const popup = combo.locator('.ds-combo__popup');
  await expect(popup).toHaveAttribute('data-state', 'open');
  await expect(combo.locator('.ds-combo__status')).toHaveText(/^\d+ of \d+ models$/);
  await settle(page, SETTLE);
  await combo.locator('.ds-combo__toggle').click();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(popup).toBeHidden({ timeout: SETTLE.timeout });
});

/* ── Feedback and data ─────────────────────────────────────────────── */

test('progress: the bar advances', async ({ page }) => {
  await show(page, 'progress');
  const bar = stage(page).locator('[data-demo="shares"] .ds-progress').nth(1);
  await expect(bar.locator('.ds-progress__label')).toHaveText('40%');
  await press(stage(page).locator('[data-demo="advance"]'));
  await expect(bar.locator('.ds-progress__label')).toHaveText('60%', WAIT);
  await expect(bar.locator('.ds-progress__track')).toHaveAttribute('aria-valuenow', '60');
});

test('dense: the table turns dense', async ({ page }) => {
  await show(page, 'table');
  await page.locator('#sg-opt-density').selectOption('tight');
  await expect(stage(page)).toHaveClass(/ds-density-tight/);
});

test('progress-run: waiting, preparing, a first share, done, with the aria of each step', async ({ page }) => {
  await show(page, 'progress');
  const progress = stage(page).locator('[data-demo="run-holder"] .ds-progress');
  const track = progress.locator('.ds-progress__track');
  await press(stage(page).locator('[data-demo="run"]'));
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
  await show(page, 'loading');
  const holder = stage(page).locator('[data-demo="page"]');
  const button = stage(page).locator('[data-demo="page-load"]');
  await press(button);
  await expect(holder.locator('.ds-reveal')).toBeVisible();
  await expect(holder.locator('.ds-skeleton')).toHaveCount(0);
  await settle(page, SETTLE);
  await press(button);
  await expect(holder.locator('.ds-skeleton')).toBeVisible();
  await expect(holder.locator('.ds-reveal')).toHaveCount(0);
});

// Whether the 150ms load stays under the loader delay depends on timer
// jitter on a busy machine, so only the result is checked. The loading
// line is checked in the task of the click: a 150ms load may be over
// before a later poll could see it.
for (const ms of ['150', '1200']) {
  test(`load ${ms}ms: the result replaces the loading line`, async ({ page }) => {
    await show(page, 'loading');
    const button = stage(page).locator(`[data-demo="load"][data-ms="${ms}"]`);
    await button.scrollIntoViewIfNeeded();
    expect(await button.evaluate((el) => {
      el.click();
      return document.querySelectorAll('#sg-stage [data-demo="load-stage"] .ds-loading').length;
    }), 'the loading line goes in at once').toBe(1);
    const result = stage(page).locator('[data-demo="load-stage"]');
    await expect(result).toContainText('1,284 devices loaded.', WAIT);
    await expect(result.locator('.ds-loading')).toHaveCount(0);
  });
}

test('status-poll: the polled chip cycles running, ok, error on the kept node', async ({ page }) => {
  await show(page, 'status');
  const holder = stage(page).locator('[data-demo="polled"]');
  await holder.locator('.ds-status').evaluate((chip) => { window.sgChip = chip; });
  const toggle = stage(page).locator('[data-demo="poll"]');
  await press(toggle);
  await expect(holder.locator('.ds-status')).toHaveClass(/ds-tone-success/, WAIT);
  await expect(holder.locator('.ds-status')).toHaveClass(/ds-tone-error/, WAIT);
  await press(toggle);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await holder.locator('.ds-status').evaluate((chip) => chip === window.sgChip)).toBe(true);
});

test('alerts: insert and dismiss through flip', async ({ page }) => {
  await show(page, 'alert');
  const alerts = stage(page).locator('[data-demo="stack"] > .ds-alert');
  await expect(alerts).toHaveCount(7);
  await press(stage(page).locator('[data-demo="insert"]'));
  await expect(alerts).toHaveCount(8);
  await expect(alerts.first()).toContainText('Synced LAPTOP-0042.');
  await settle(page, SETTLE);
  await press(alerts.first().locator('[data-demo="dismiss"]'));
  await expect(alerts).toHaveCount(7, { timeout: SETTLE.timeout });
  await expect(alerts.first()).toContainText('The nightly sync');
});

test('figures: the key figure counts to its new value', async ({ page }) => {
  await show(page, 'tile');
  const devices = stage(page).locator('[data-demo="devices"]');
  await expect(devices).toHaveText('1,284');
  await press(stage(page).locator('[data-demo="refresh"]'));
  await expect(devices).toHaveText('1,296', WAIT);
  await countsDone(page);
});

for (const [kind, dims] of [['fast', false], ['slow', true]]) {
  test(`stale-${kind}: the list is stale while the refresh runs${dims ? ' and dims' : ', never dimmed'}`, async ({ page }) => {
    await show(page, 'utilities');
    // At a quarter speed the fast refresh (50ms, 200ms there) ends long
    // before the stale delay (--ds-delay-loader, 800ms there), so a late timer on a busy
    // machine never dims it.
    if (!VIDEO) {
      await setSpeed(page, 0.25);
      await page.mouse.move(1, 1);
      await settle(page, SETTLE);
    }
    const box = stage(page).locator('[data-demo="stale-list"]');
    const button = stage(page).locator(`[data-demo="${kind === 'fast' ? 'refresh-fast' : 'refresh'}"]`);
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
  await show(page, 'card');
  await press(stage(page).locator('button.ds-card--interactive[data-demo="open"]').first());
  await expect(toasts(page).filter({ hasText: 'Opened PRINTER-0003.' })).toHaveCount(1);
  await press(stage(page).locator('a.ds-card__action'));
  await expect(toasts(page).filter({ hasText: 'Opened LAPTOP-0017.' })).toHaveCount(1);
  expect(new URL(page.url()).hash, 'the link opened nothing but the toast').toBe('#/components/card');
  await show(page, 'tile');
  await press(stage(page).locator('[data-demo="open-button"]'));
  await expect(toasts(page).filter({ hasText: 'Opened the list.' })).toHaveCount(1);
});

test('table: sort, expand, select all, filter to nothing and back', async ({ page }) => {
  await show(page, 'table');
  const card = stage(page).locator('[data-demo="devices"]');
  const table = card.locator('table');
  const names = () => table.locator('tbody tr:not(.ds-table__detail) .ds-table__row-link').allTextContents();
  await press(table.locator('[data-key="load"]'));
  await expect(table.locator('th[aria-sort="ascending"]')).toContainText('Load');
  await expect.poll(names).toEqual(['LAPTOP-0100', 'LAPTOP-0121', 'LAPTOP-0107', 'LAPTOP-0128', 'DESKTOP-0114', 'DESKTOP-0135']);
  await settle(page, SETTLE);
  await press(table.locator('[data-key="load"]'));
  await expect(table.locator('th[aria-sort="descending"]')).toContainText('Load');
  await expect.poll(names).toEqual(['DESKTOP-0135', 'DESKTOP-0114', 'LAPTOP-0128', 'LAPTOP-0107', 'LAPTOP-0121', 'LAPTOP-0100']);
  await settle(page, SETTLE);
  // A row's details open, and their row is no longer inert.
  const toggle = table.locator('tbody tr[data-ds-key="d1"] .ds-table__toggle');
  const detail = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
  await press(toggle);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(await detail.evaluate((row) => row.inert)).toBe(false);
  await settle(page, SETTLE);
  await press(toggle);
  expect(await detail.evaluate((row) => row.inert)).toBe(true);
  // Select all checks every row; the header box follows a single row.
  const all = table.locator('[data-demo="select-all"]');
  await press(all);
  await expect(table.locator('[data-demo="select-row"]:checked')).toHaveCount(6);
  await table.locator('[data-demo="select-row"]').first().click();
  expect(await all.evaluate((input) => input.indeterminate)).toBe(true);
  await settle(page, SETTLE);
  // Filtering per keystroke, to nothing: the empty state fades in; cleared: the rows come back
  // (the 2.x "items" demo showed the same: the last row gone, the empty state in its place).
  const filter = card.locator('[data-demo="filter"]');
  await filter.scrollIntoViewIfNeeded();
  await filter.pressSequentially('lap');
  await expect.poll(names).toEqual(['LAPTOP-0128', 'LAPTOP-0107', 'LAPTOP-0121', 'LAPTOP-0100']);
  await filter.pressSequentially('z');
  await expect(card.locator('[data-demo="empty"]')).toBeVisible(WAIT);
  await settle(page, SETTLE);
  await filter.fill('');
  await expect(card.locator('[data-demo="empty"]')).toBeHidden(WAIT);
  await expect.poll(names).toHaveLength(6);
});

test('table-live: the feed changes values and stops', async ({ page }) => {
  await show(page, 'table');
  const card = stage(page).locator('[data-demo="devices"]');
  const toggle = card.locator('[data-demo="live"]');
  const loads = () => card.locator('tbody tr:not(.ds-table__detail) td.ds-num').allTextContents();
  const before = await loads();
  await press(toggle);
  await page.mouse.move(1, 1);
  await expect.poll(loads, WAIT).not.toEqual(before);
  await press(toggle);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
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
