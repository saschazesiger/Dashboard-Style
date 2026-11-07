/**
 * Suggestions (3.0): a press fills the composer it names and focuses it, a
 * mouse drag scrolls the row and presses nothing, the keyboard reaches
 * every chip, set() renders chips, the wrap look, the chips' options and
 * forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=suggestions');
  await ready(page);
}

const row = (page) => page.locator('.ds-suggestions[data-ds-suggestions-for]');

test('a press puts the chip\'s value into the composer and the focus with it; ds:select tells the page', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.__selected = [];
    document.addEventListener('ds:select', (event) => window.__selected.push(event.detail.value));
  });
  await row(page).getByRole('button', { name: 'Open a ticket' }).click();
  const field = page.locator('[data-demo="composer"] textarea');
  await expect(field).toHaveValue('Open a ticket for laptop 4');
  await expect(field).toBeFocused();
  expect(await page.evaluate(() => window.__selected)).toEqual(['Open a ticket for laptop 4']);
  // preventDefault() leaves the composer alone.
  await page.evaluate(() => document.addEventListener('ds:select', (event) => event.preventDefault(), { once: true }));
  await row(page).getByRole('button', { name: 'Battery report' }).click();
  await expect(field).toHaveValue('Open a ticket for laptop 4');
  // With data-ds-suggestions-send the composer sends at once.
  await row(page).evaluate((el) => el.setAttribute('data-ds-suggestions-send', ''));
  const sent = page.evaluate(() => new Promise((resolve) => document.querySelector('[data-demo="composer"]').addEventListener('ds:send', (event) => resolve(event.detail.text), { once: true })));
  await row(page).getByRole('button', { name: 'Battery report' }).click();
  expect(await sent).toBe('Show the battery report of laptop 4');
});

test('a mouse drag scrolls the row with the pointer and presses nothing; the ends are marked', async ({ page }) => {
  await open(page);
  await expect(row(page)).toHaveAttribute('data-ds-overflow-end', '');
  await expect(row(page)).not.toHaveAttribute('data-ds-overflow-start', '');
  const box = await row(page).boundingBox();
  const y = box.y + box.height / 2;
  await page.evaluate(() => { window.__selected = 0; document.addEventListener('ds:select', () => { window.__selected += 1; }); });
  await page.mouse.move(box.x + box.width - 40, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 60, y, { steps: 2 });
  await expect(row(page)).toHaveAttribute('data-state', 'dragging');
  await page.mouse.move(box.x + box.width - 160, y, { steps: 4 });
  await page.mouse.up();
  await expect(row(page)).not.toHaveAttribute('data-state', 'dragging');
  expect(await row(page).evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
  expect(await page.evaluate(() => window.__selected)).toBe(0);
  await expect(row(page)).toHaveAttribute('data-ds-overflow-start', '');
  // A plain click still presses.
  await row(page).getByRole('button', { name: 'What changed?' }).click();
  expect(await page.evaluate(() => window.__selected)).toBe(1);
});

test('the keyboard reaches every chip and brings it into view', async ({ page }) => {
  await open(page);
  const chips = row(page).getByRole('button');
  await chips.first().focus();
  for (let i = 1; i < 6; i += 1) await page.keyboard.press('Tab');
  await expect(chips.last()).toBeFocused();
  const strip = await row(page).boundingBox();
  const chip = await chips.last().boundingBox();
  expect(chip.x + chip.width).toBeLessThanOrEqual(strip.x + strip.width + 1);
  await expect(row(page)).toHaveAttribute('role', 'group');
  await expect(row(page)).toHaveAccessibleName('Suggested questions');
});

test('set() renders new chips from texts and items; get() reads them; the wrap look wraps', async ({ page }) => {
  await open(page);
  const data = page.locator('[data-demo="data"]');
  await expect(data.locator('.ds-chip')).toHaveCount(3);
  expect(await data.evaluate((el) => DS.suggestions.create(el).get())).toEqual([
    { value: 'Restart the router', label: 'Restart the router' },
    { value: 'Show the router log of last night', label: 'Router log' },
    { value: 'Who uses laptop 4?', label: 'Who uses laptop 4?' },
  ]);
  await expect(data.locator('.ds-chip').nth(1).locator('svg.ds-chip__icon')).toHaveCount(1);
  await page.getByRole('button', { name: 'Other suggestions' }).click();
  await expect(data.locator('.ds-chip__label')).toHaveText(['Order a battery', 'Compare with laptop 7', 'Close the ticket']);
  const wrap = page.locator('[data-demo="wrap"]');
  await expect(wrap).toHaveCSS('flex-wrap', 'wrap');
  await page.setViewportSize({ width: 360, height: 800 });
  const tops = await wrap.locator('.ds-chip').evaluateAll((chips) => new Set(chips.map((chip) => Math.round(chip.getBoundingClientRect().top))).size);
  expect(tops).toBeGreaterThan(1);
});

test('options reach the chips: a size and .ds-touch', async ({ page }) => {
  await open(page);
  const heights = await row(page).evaluate((el) => {
    const chip = el.querySelector('.ds-chip');
    const at = (classes) => {
      el.className = `ds-suggestions ds-scroll-x ${classes}`;
      return chip.getBoundingClientRect().height;
    };
    return { md: at(''), sm: at('ds-sm'), touch: at('ds-touch') };
  });
  expect(heights.sm).toBeLessThan(heights.md);
  expect(heights.touch).toBeGreaterThanOrEqual(48);
});

test('forced colours: the chips keep their edges', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const edge = await row(page).locator('.ds-chip__body').first().evaluate((el) => getComputedStyle(el).borderTopStyle);
  expect(edge).not.toBe('none');
});
