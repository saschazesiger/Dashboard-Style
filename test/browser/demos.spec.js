/**
 * Walk-through of every styleguide demo: the `[data-sg]` buttons, the
 * enter and leave buttons of the Motion card, the track and segmented
 * options and the disclosure. Each demo is one test that clicks it, checks
 * what it did, and must end settled (helpers/motion.js `settle()`) with no
 * console error.
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
import { ready, settle } from './helpers/motion.js';

const VIDEO = !!process.env.DS_VIDEO;
const STYLEGUIDE = `/styleguide/index.html${VIDEO ? '?speed=0.1' : ''}`;
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
  await page.goto(STYLEGUIDE);
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

/* ── Motion card: enter and leave ──────────────────────────────────── */

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

/* ── Indicators and the disclosure ─────────────────────────────────── */

test('track: the indicator glides between options', async ({ page }) => {
  for (const name of ['Week', 'Year', 'Day']) {
    const option = page.locator('#sg-track button', { hasText: name });
    await press(option);
    await expect(option).toHaveAttribute('aria-pressed', 'true');
    await settle(page, SETTLE);
  }
});

test('segmented: the indicator glides between options', async ({ page }) => {
  for (const name of ['Admin', 'Reports', 'Live']) {
    const option = page.locator('#sg-segmented .ds-segmented__option', { hasText: name });
    await press(option);
    await expect(option).toHaveAttribute('aria-current', 'true');
    await settle(page, SETTLE);
  }
});

test('disclosure: the motion rules open and close', async ({ page }) => {
  const details = page.locator('#motion details.ds-collapsible');
  const summary = details.locator('summary');
  await press(summary);
  await expect(details).toHaveAttribute('open', '');
  await settle(page, SETTLE);
  await summary.click();
  await expect(details).not.toHaveAttribute('open', '');
});
