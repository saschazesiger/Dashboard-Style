/**
 * Citations on their demo page: hover opens after the delay and the card
 * is hoverable, then closes after the grace; a press pins it and a press
 * outside closes it; the keyboard (Enter opens and moves focus to the link,
 * Tab past it closes and moves on, Shift+Tab lands on the marker, Escape
 * returns focus); the card in the top layer, placed under or above the
 * marker and inside the window; a card shared by two markers; names and
 * states; the motion keyed on data-state; size, shape and touch; forced
 * colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=cite';

async function open(page) {
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
}

const marker = (page, i) => page.locator('[data-demo="answer"] .ds-cite').nth(i);
const cardOf = async (page, i) => page.locator(`#${await marker(page, i).getAttribute('aria-controls')}`);

test('names and states: a button named by its source, aria-expanded and aria-controls, the card hidden', async ({ page }) => {
  await open(page);
  const first = marker(page, 0);
  await expect(first).toHaveAccessibleName('Source 1: Warranty register 2026');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  const card = await cardOf(page, 0);
  await expect(card).toBeHidden();
  await expect(card).toHaveAttribute('popover', 'manual');
});

test('hover: the card opens after the delay, stays while the pointer crosses to it, and closes after the grace', async ({ page, browserName }) => {
  await open(page);
  const first = marker(page, 1);
  const card = await cardOf(page, 1);
  await first.hover();
  await expect(card).toBeHidden();
  await expect(card).toBeVisible({ timeout: 2000 });
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(card).toHaveAttribute('data-state', 'open');
  // Into the card: it stays.
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  await page.waitForTimeout(400);
  await expect(card).toBeVisible();
  // Away from both: it closes after the grace.
  await page.mouse.move(1, 1);
  await expect(card).toBeHidden({ timeout: 2000 });
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  expect(await card.evaluate((el) => el.matches(':popover-open'))).toBe(false);
});

test('a press pins the card; a press outside closes it, a second press on the marker too', async ({ page }) => {
  await open(page);
  const first = marker(page, 0);
  const card = await cardOf(page, 0);
  await first.click();
  await expect(card).toBeVisible();
  await page.mouse.move(1, 1);
  await page.waitForTimeout(600);
  await expect(card).toBeVisible();
  await page.locator('.sg-demo-section__title').first().click();
  await expect(card).toBeHidden();
  await first.click();
  await expect(card).toBeVisible();
  await first.click();
  await expect(card).toBeHidden();
});

test('keyboard: Enter opens and focuses the link; Tab past it closes and moves on; Escape returns to the marker', async ({ page }) => {
  await open(page);
  const first = marker(page, 0);
  const second = marker(page, 1);
  const card = await cardOf(page, 0);
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(card).toBeVisible();
  await expect(card.locator('.ds-cite__title')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(card).toBeHidden();
  await expect(second).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(first).toBeFocused();
  await page.keyboard.press('Space');
  await expect(card.locator('.ds-cite__title')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(first).toBeFocused();
  await expect(card).toBeHidden();

  await page.keyboard.press('Enter');
  await expect(card.locator('.ds-cite__title')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  // Focus alone opens nothing.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(700);
  await expect(card).toBeHidden();
});

test('the card sits in the top layer, under its marker or above it without room, inside the window', async ({ page }) => {
  await open(page);
  const first = marker(page, 0);
  const card = await cardOf(page, 0);
  await first.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await first.click();
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-state', 'open');
  await card.evaluate((el) => DS.motion.settled(el));
  const below = await page.evaluate(([m, c]) => {
    const a = document.querySelector(m).getBoundingClientRect();
    const b = document.querySelector(c).getBoundingClientRect();
    return { top: b.top - a.bottom, inside: b.left >= 0 && b.right <= innerWidth, popover: document.querySelector(c).matches(':popover-open'), placement: document.querySelector(c).getAttribute('data-placement') };
  }, ['[data-demo="answer"] .ds-cite', `#${await first.getAttribute('aria-controls')}`]);
  expect(below.popover).toBe(true);
  expect(below.placement).toBeNull();
  expect(below.top).toBeGreaterThanOrEqual(0);
  expect(below.top).toBeLessThan(12);
  expect(below.inside).toBe(true);
  await first.click();
  await expect(card).toBeHidden();

  // At the bottom of the window: above the marker.
  await page.setViewportSize({ width: 800, height: 360 });
  const narrow = page.locator('.ds-cite').last();
  await narrow.evaluate((el) => el.scrollIntoView({ block: 'end' }));
  await narrow.click();
  const above = page.locator(`#${await narrow.getAttribute('aria-controls')}`);
  await expect(above).toHaveAttribute('data-placement', 'top');
  const gap = await page.evaluate(([c]) => {
    const marker = [...document.querySelectorAll('.ds-cite')].at(-1).getBoundingClientRect();
    return marker.top - document.querySelector(c).getBoundingClientRect().bottom;
  }, [`#${await narrow.getAttribute('aria-controls')}`]);
  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThan(12);
});

test('two markers share a card: the second takes it over', async ({ page }) => {
  await open(page);
  const card = await cardOf(page, 0);
  const last = marker(page, 3);
  expect(await last.getAttribute('aria-controls')).toBe(await marker(page, 0).getAttribute('aria-controls'));
  await marker(page, 0).click();
  await expect(card).toBeVisible();
  // The card may cover the other marker: the keyboard reaches it.
  await last.focus();
  await page.keyboard.press('Enter');
  await expect(last).toHaveAttribute('aria-expanded', 'true');
  await expect(marker(page, 0)).toHaveAttribute('aria-expanded', 'false');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-state', 'open');
  expect(await page.evaluate(() => DS.core.get(document.querySelectorAll('[data-demo="answer"] .ds-cite')[3], 'cite').get())).toBe(true);
});

test('motion: the card fades and grows on transitions keyed on data-state, and fades out quicker', async ({ page }) => {
  await open(page);
  const card = await cardOf(page, 0);
  await marker(page, 0).click();
  const enter = await card.evaluate((el) => ({ property: getComputedStyle(el).transitionProperty, duration: getComputedStyle(el).transitionDuration }));
  expect(enter.property).toBe('opacity, scale');
  expect(enter.duration).toBe('0.15s, 0.25s');
  await card.evaluate((el) => DS.motion.settled(el));
  const exit = await page.evaluate(([m, c]) => {
    DS.core.get(document.querySelector(m), 'cite').set(false);
    const el = document.querySelector(c);
    return { state: el.getAttribute('data-state'), duration: getComputedStyle(el).transitionDuration };
  }, ['[data-demo="answer"] .ds-cite', `#${await marker(page, 0).getAttribute('aria-controls')}`]);
  expect(exit).toEqual({ state: 'closed', duration: '0.1s, 0s' });
});

test('options: the marker steps 2px per size, shape squares it, touch reaches the target', async ({ page }) => {
  await open(page);
  const read = () => marker(page, 0).evaluate((el) => ({
    height: el.getBoundingClientRect().height,
    radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
    reach: parseFloat(getComputedStyle(el, '::after').top),
  }));
  expect(await read()).toEqual({ height: 18, radius: 9, reach: -3 });
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-lg'));
  expect((await read()).height).toBe(20);
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-shape-square', 'ds-touch'));
  const touched = await read();
  expect(touched.radius).toBe(0);
  expect(touched.reach).toBe(-14);
});

test('forced colours: the marker keeps an edge and its open state is Highlight; the card keeps its outline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const first = marker(page, 0);
  expect(await first.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
  await first.click();
  const ids = ['[data-demo="answer"] .ds-cite', `#${await first.getAttribute('aria-controls')}`];
  const look = () => page.evaluate(([m, c]) => {
    const probe = document.createElement('span');
    probe.style.color = 'Highlight';
    document.body.append(probe);
    const highlight = getComputedStyle(probe).color;
    probe.remove();
    return { bg: getComputedStyle(document.querySelector(m)).backgroundColor, highlight, outline: getComputedStyle(document.querySelector(c)).outlineStyle };
  }, ids);
  // The fill fades on --ds-dur-fast: poll until it rests.
  await expect.poll(async () => { const l = await look(); return l.bg === l.highlight; }).toBe(true);
  expect((await look()).outline).toBe('solid');
});
