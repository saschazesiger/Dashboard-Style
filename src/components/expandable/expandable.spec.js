/**
 * Expandable text: the clamp and the toggle while closed, opening and
 * closing by click and keys with aria-expanded, no toggle for a text that
 * fits, a resize that changes it, the lines hook, the whole text for a
 * screen reader, set() and ds:change. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=expandable');
  await ready(page);
}

const lines = (locator) => locator.locator('.ds-expandable__text').evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));

test('closed: three lines and a Show more button that controls the text', async ({ page }) => {
  await open(page);
  const long = page.locator('#fx-component [data-demo="long"]');
  await expect(long).toHaveAttribute('data-state', 'closed');
  expect(await lines(long)).toBe(3);
  const toggle = long.getByRole('button', { name: 'Show more' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  const id = await long.locator('.ds-expandable__text').getAttribute('id');
  await expect(toggle).toHaveAttribute('aria-controls', id);
});

test('the toggle opens and closes by click, Enter and Space; focus stays on it', async ({ page }) => {
  await open(page);
  const long = page.locator('#fx-component [data-demo="long"]');
  const toggle = long.locator('.ds-expandable__toggle');
  await toggle.click();
  await expect(long).toHaveAttribute('data-state', 'open');
  await expect(toggle).toHaveText('Show less');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(await lines(long)).toBeGreaterThan(3);
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(long).toHaveAttribute('data-state', 'closed');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(long).toHaveAttribute('data-state', 'open');
});

test('a text that fits has no toggle and no state; a narrow width brings the toggle (360px)', async ({ page }) => {
  await open(page);
  const short = page.locator('#fx-component [data-demo="short"]');
  await expect(short.locator('.ds-expandable__toggle')).toBeHidden();
  await expect(short).not.toHaveAttribute('data-state');
  const box = page.locator('#fx-component [data-demo="short"]');
  await box.evaluate((el) => { el.style.inlineSize = '24px'; });
  await expect(short.locator('.ds-expandable__toggle')).toBeVisible();
  await expect(short).toHaveAttribute('data-state', 'closed');
});

test('the lines hook, the open start, and the whole text for a screen reader', async ({ page }) => {
  await open(page);
  const comments = page.locator('#fx-component .ds-list .ds-expandable');
  expect(await lines(comments.first())).toBe(2);
  await expect(comments.nth(1)).toHaveAttribute('data-state', 'open');
  const text = await page.locator('#fx-component [data-demo="long"] .ds-expandable__text').evaluate((el) => el.textContent);
  expect(text.endsWith('by the north stairs.')).toBe(true);
});

test('set() opens it from the page and emits ds:change', async ({ page }) => {
  await open(page);
  const detail = await page.evaluate(() => new Promise((done) => {
    const el = document.querySelector('[data-demo="long"]');
    el.addEventListener('ds:change', (event) => done(event.detail), { once: true });
    window.DS.get(el, 'expandable').set(true);
  }));
  expect(detail).toEqual({ open: true });
});
