/**
 * The plan card on its demo page: names, roles and the state the module
 * writes (glyph and word, data-state), approve and reject by pointer and
 * keyboard (the actions go, focus moves to the title, one announcement,
 * ds:change), a cancelled ds:decide that the page settles with set(), the
 * state read again from data-ds-plan-state, the narrow column, density and
 * shape, forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=plan';

async function open(page) {
  await page.goto(URL);
  await ready(page);
}

const WAITING = '[data-demo="waiting"]';

async function listen(page, selector) {
  await page.evaluate((sel) => {
    window.changes = [];
    window.spoken = [];
    document.querySelector(sel).addEventListener('ds:change', (event) => window.changes.push(event.detail.state));
    new MutationObserver(() => {
      for (const node of document.querySelectorAll('.ds-sr[aria-live]')) if (node.textContent.trim()) window.spoken.push(node.textContent.trim());
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }, selector);
}

test('names and states: an article named by its title, the state as a glyph and a word, the icon hidden', async ({ page }) => {
  await open(page);
  const card = page.locator(WAITING);
  await expect(card).toHaveRole('article');
  await expect(card).toHaveAccessibleName('Replace the swollen batteries');
  await expect(card).toHaveAttribute('data-state', 'waiting');
  await expect(card.locator('.ds-plan__state')).toHaveText('Waiting for approval');
  await expect(card.locator('.ds-plan__state svg.ds-plan__glyph')).toHaveCount(1);
  await expect(card.locator('.ds-plan__icon')).toHaveAttribute('aria-hidden', 'true');
  await expect(card.getByRole('button', { name: 'Approve' })).toBeVisible();
  const approved = page.locator('.ds-plan[data-ds-plan-state="approved"]');
  await expect(approved).toHaveAttribute('data-state', 'approved');
  await expect(approved.locator('.ds-plan__state')).toHaveText('Approved');
  await expect(page.locator('.ds-plan[data-ds-plan-state="rejected"] .ds-plan__state')).toHaveText('Rejected');
});

test('approve by keyboard: the actions go, focus moves to the title, the word is announced once, ds:change', async ({ page }) => {
  await open(page);
  const card = page.locator(WAITING);
  await listen(page, WAITING);
  await card.getByRole('button', { name: 'Approve' }).focus();
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('data-state', 'approved');
  await expect(card.locator('.ds-plan__state')).toHaveText('Approved');
  await expect(card.locator('.ds-plan__title')).toBeFocused();
  await expect(card.locator('.ds-plan__title')).toHaveAttribute('tabindex', '-1');
  await expect(card.locator('.ds-plan__actions')).toBeHidden();
  await expect(card.locator('.ds-plan__actions')).toHaveAttribute('hidden', '');
  await expect.poll(() => page.evaluate(() => [...new Set(window.spoken)])).toEqual(['Approved']);
  expect(await page.evaluate(() => window.changes)).toEqual(['approved']);
  // Asked again: the actions come back.
  await page.locator('[data-demo="again"]').click();
  await expect(card).toHaveAttribute('data-state', 'waiting');
  await expect(card.locator('.ds-plan__actions')).toBeVisible();
  await card.getByRole('button', { name: 'Reject' }).click();
  await expect(card).toHaveAttribute('data-state', 'rejected');
  await expect(card.locator('.ds-plan__state')).toHaveText('Rejected');
  expect(await page.evaluate(() => window.changes)).toEqual(['approved', 'waiting', 'rejected']);
});

test('a cancelled ds:decide keeps it waiting until the page calls set()', async ({ page }) => {
  await open(page);
  const card = page.locator('[data-demo="server"]');
  await card.getByRole('button', { name: 'Approve' }).click();
  await expect(card).toHaveAttribute('data-state', 'waiting');
  await expect(card.getByRole('button', { name: 'Approve' })).toHaveAttribute('aria-busy', 'true');
  await expect(card).toHaveAttribute('data-state', 'approved', { timeout: 5000 });
  await expect(card.locator('.ds-plan__actions')).toBeHidden();
});

test('the state is read again from data-ds-plan-state, and set() takes the verbs', async ({ page }) => {
  await open(page);
  const rejected = page.locator('.ds-plan').nth(3);
  await expect(rejected).toHaveAttribute('data-state', 'rejected');
  await expect(rejected.locator('.ds-plan__actions')).toBeHidden();
  await rejected.evaluate((el) => el.setAttribute('data-ds-plan-state', 'waiting'));
  await expect(rejected).toHaveAttribute('data-state', 'waiting');
  await expect(rejected.locator('.ds-plan__actions')).toBeVisible();
  const state = await page.locator(WAITING).evaluate((el) => {
    const plan = DS.core.get(el, 'plan');
    plan.set('reject');
    return plan.get();
  });
  expect(state).toEqual({ state: 'rejected' });
});

test('narrow: the state goes under the title and the actions wrap, nothing overflows at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const narrow = page.locator('.ds-plan').last();
  const boxes = await narrow.evaluate((el) => {
    const title = el.querySelector('.ds-plan__title').getBoundingClientRect();
    const state = el.querySelector('.ds-plan__state').getBoundingClientRect();
    return { below: state.top >= title.bottom - 1, inside: el.querySelector('.ds-plan__actions').getBoundingClientRect().right <= el.getBoundingClientRect().right };
  });
  expect(boxes).toEqual({ below: true, inside: true });
});

test('options: density steps the padding and the room, shape scales the corners, touch reaches the buttons', async ({ page }) => {
  await open(page);
  const read = () => page.locator(WAITING).evaluate((el) => ({
    pad: parseFloat(getComputedStyle(el).paddingTop),
    gap: parseFloat(getComputedStyle(el).rowGap),
    radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
    button: el.querySelector('.ds-btn').getBoundingClientRect().height,
  }));
  const base = await read();
  expect(base.pad).toBe(16);
  expect(base.gap).toBe(12);
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-density-compact', 'ds-shape-square', 'ds-touch'));
  const changed = await read();
  expect(changed.pad).toBe(14);
  expect(changed.gap).toBe(10);
  expect(changed.radius).toBe(0);
  expect(changed.button).toBeGreaterThanOrEqual(48);
});

test('forced colours: the frame keeps its border, the glyph follows the word', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const look = await page.locator('.ds-plan[data-ds-plan-state="approved"]').evaluate((el) => ({
    border: getComputedStyle(el).borderTopStyle,
    glyph: getComputedStyle(el.querySelector('.ds-plan__glyph')).color,
    word: getComputedStyle(el.querySelector('.ds-plan__state')).color,
  }));
  expect(look.border).toBe('solid');
  expect(look.glyph).toBe(look.word);
});
