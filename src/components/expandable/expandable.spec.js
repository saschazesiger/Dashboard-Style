/**
 * Expandable text: the clamp and the toggle while closed, opening and
 * closing by click and keys with aria-expanded, no toggle for a text that
 * fits, a resize that changes it, the lines hook, the whole text for a
 * screen reader, set() and ds:change. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { layouts, ready } from '../../../test/browser/helpers/motion.js';

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

test('five hundred texts are measured in one batch when they start and on a resize', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const box = document.createElement('div');
    box.id = 'many';
    box.style.inlineSize = '900px';
    document.querySelector('#fx-component').append(box);
  });
  const states = () => page.evaluate(() => [...document.querySelectorAll('#many .ds-expandable')].map((el) => el.getAttribute('data-state')));
  const start = await layouts(page, (count) => {
    const words = 'The printer on the second floor jams on every third page; the tray was replaced and the rollers cleaned.';
    const html = Array.from({ length: count }, () => `<div class="ds-expandable" data-ds-expandable><div class="ds-expandable__text">${words}</div></div>`).join('');
    window.DS.dom.morphHtml(document.querySelector('#many'), html);
  }, 500);
  const wide = await states();
  const resize = await layouts(page, () => {
    document.querySelector('#many').style.inlineSize = '120px';
  });
  const narrow = await states();
  test.info().annotations.push({ type: 'layouts', description: `start: ${start.forced} forced in ${Math.round(start.ms)}ms; resize: ${resize.forced} forced in ${Math.round(resize.ms)}ms` });
  // One line at 900px; many more than three at 120px.
  expect(wide).toHaveLength(500);
  expect(wide.every((state) => state === null)).toBe(true);
  expect(narrow.every((state) => state === 'closed')).toBe(true);
  // A layout per text forced five hundred here (1.9s to start, 0.9s per
  // resize in Chromium); the batch forces a few for all of them.
  expect(start.forced).toBeLessThan(10);
  expect(resize.forced).toBeLessThan(10);
});
