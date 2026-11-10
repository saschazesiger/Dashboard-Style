/**
 * The usage meter on its demo page: the figures and the meter the module
 * writes (role, value, value text, --ds-share), the states near and over
 * the budget with an icon and a word (the meter's tone repeats it), one
 * announcement per worse state, set() and ds:change, the attributes read
 * again, no budget, the inline variant and a narrow column, size and
 * density, forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=usage';

async function open(page) {
  await page.goto(URL);
  await ready(page);
}

const LIVE = '[data-demo="live"]';
const nth = (page, i) => page.locator('.ds-usage').nth(i);

test('the figures and the meter: tokens and cost against their budgets, a named meter with its value in words', async ({ page }) => {
  await open(page);
  const live = page.locator(LIVE);
  await expect(live.locator('.ds-usage__value')).toHaveText('170K of 250K tokens');
  await expect(live.locator('.ds-usage__cost')).toHaveText('$2.61 of $5.00');
  const meter = live.locator('.ds-usage__meter');
  await expect(meter).toHaveRole('meter');
  await expect(meter).toHaveAccessibleName('Tokens this month');
  await expect(meter).toHaveAttribute('aria-valuenow', '68');
  await expect(meter).toHaveAttribute('aria-valuetext', '68% used');
  expect(await meter.evaluate((el) => el.style.getPropertyValue('--ds-share'))).toBe('0.68');
  await expect(live).not.toHaveAttribute('data-state');
  await expect(live.locator('.ds-usage__status')).toBeHidden();
});

test('near and over: an icon and a word, the meter\'s tone repeats it, each worse state announced once', async ({ page }) => {
  await open(page);
  const live = page.locator(LIVE);
  await page.evaluate((sel) => {
    window.changes = [];
    window.spoken = [];
    document.querySelector(sel).addEventListener('ds:change', (event) => window.changes.push(event.detail.state));
    new MutationObserver(() => {
      for (const node of document.querySelectorAll('.ds-sr[aria-live]')) if (node.textContent.trim()) window.spoken.push(node.textContent.trim());
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }, LIVE);
  const spend = page.locator('[data-demo="spend"]');
  await spend.click();
  await expect(live).toHaveAttribute('data-state', 'near');
  const status = live.locator('.ds-usage__status');
  await expect(status).toBeVisible();
  await expect(status).toHaveText('Near the budget');
  await expect(status.locator('svg.ds-usage__icon')).toHaveCount(1);
  await expect(live.locator('.ds-meter')).toHaveClass(/ds-tone-warning/);
  await spend.click();
  await expect(live).toHaveAttribute('data-state', 'near');
  await spend.click();
  await expect(live).toHaveAttribute('data-state', 'over');
  await expect(status).toHaveText('Over budget');
  await expect(live.locator('.ds-meter')).toHaveClass(/ds-tone-error/);
  await expect(live.locator('.ds-meter')).not.toHaveClass(/ds-tone-warning/);
  // A meter's value stays in range; the words say how far past.
  await expect(live.locator('.ds-meter')).toHaveAttribute('aria-valuenow', '100');
  await expect(live.locator('.ds-meter')).toHaveAttribute('aria-valuetext', /^1\d\d% used$/);
  await expect.poll(() => page.evaluate(() => [...new Set(window.spoken)])).toEqual(['Near the budget', 'Over budget']);
  expect(await page.evaluate(() => window.changes)).toEqual(['near', 'near', 'over']);
  // Back under: the status goes, nothing is said.
  await page.locator('[data-demo="reset"]').click();
  await expect(live).not.toHaveAttribute('data-state');
  await expect(status).toBeHidden();
  await expect(live.locator('.ds-meter')).not.toHaveClass(/ds-meter--(warning|error)/);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => [...new Set(window.spoken)])).toEqual(['Near the budget', 'Over budget']);
});

test('the states side by side; the cost may be the share that counts', async ({ page }) => {
  await open(page);
  await expect(nth(page, 1)).not.toHaveAttribute('data-state');
  await expect(nth(page, 2)).toHaveAttribute('data-state', 'near');
  await expect(nth(page, 3)).toHaveAttribute('data-state', 'over');
  await expect(nth(page, 3).locator('.ds-usage__cost')).toHaveText('€6.40 of €5.00');
  await expect(nth(page, 3).locator('.ds-usage__value')).toHaveText('96K of 100K tokens');
});

test('without a budget: the figures alone, no share, no status', async ({ page }) => {
  await open(page);
  const free = nth(page, 4);
  await expect(free.locator('.ds-usage__value')).toHaveText('18.4K tokens');
  await expect(free.locator('.ds-usage__cost')).toHaveText('$0.37');
  await expect(free).not.toHaveAttribute('data-state');
  // No meter at 0%: hidden, without values, until a budget comes.
  const meter = free.locator('.ds-meter');
  await expect(meter).toBeHidden();
  await expect(meter).not.toHaveAttribute('aria-valuenow');
  await expect(meter).not.toHaveAttribute('aria-valuetext');
  await expect(page.getByRole('meter', { name: 'This conversation' })).toHaveCount(0);
  await free.evaluate((el) => el.setAttribute('data-ds-usage-budget', '100000'));
  await expect(meter).toBeVisible();
  await expect(meter).toHaveAttribute('aria-valuenow', '18');
  await expect(meter).toHaveAttribute('aria-valuetext', '18% used');
});

test('the attributes are read again, and set() drives it from the page', async ({ page }) => {
  await open(page);
  const first = nth(page, 1);
  await first.evaluate((el) => el.setAttribute('data-ds-usage-used', '240000'));
  await expect(first).toHaveAttribute('data-state', 'near');
  await expect(first.locator('.ds-usage__value')).toHaveText('240K of 250K tokens');
  await first.evaluate((el) => el.setAttribute('data-ds-usage-warn', '0.99'));
  await expect(first).not.toHaveAttribute('data-state');
  const state = await first.evaluate((el) => {
    const usage = DS.core.get(el, 'usage');
    usage.set({ used: 300000 });
    return usage.get();
  });
  expect(state).toMatchObject({ used: 300000, budget: 250000, share: 1.2, state: 'over' });
});

test('the meter glides on the value curve; the inline variant is one row; a narrow column wraps the figures', async ({ page }) => {
  await open(page);
  const meter = page.locator(`${LIVE} .ds-meter`);
  expect(await meter.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain('--ds-share');
  const inline = page.locator('.ds-usage--inline');
  const tops = await inline.evaluate((el) => ['.ds-usage__title', '.ds-usage__meter', '.ds-usage__figures'].map((sel) => {
    const box = el.querySelector(sel).getBoundingClientRect();
    return box.top + box.height / 2;
  }));
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(4);
  expect(await inline.locator('.ds-usage__meter').evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(160);
  const narrow = nth(page, 6);
  const figures = await narrow.evaluate((el) => {
    const a = el.querySelector('.ds-usage__value').getBoundingClientRect();
    const b = el.querySelector('.ds-usage__cost').getBoundingClientRect();
    return { right: Math.max(a.right, b.right), width: el.getBoundingClientRect().right };
  });
  expect(figures.right).toBeLessThanOrEqual(figures.width + 0.5);
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('options: size thickens the meter, density spaces the parts', async ({ page }) => {
  await open(page);
  const read = () => nth(page, 1).evaluate((el) => ({ meter: el.querySelector('.ds-meter').getBoundingClientRect().height, gap: parseFloat(getComputedStyle(el).rowGap) }));
  expect(await read()).toEqual({ meter: 4, gap: 8 });
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-lg', 'ds-density-compact'));
  expect(await read()).toEqual({ meter: 5, gap: 6 });
});

test('forced colours: the icon follows the word, the word stays, the meter keeps its edge', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const over = nth(page, 3);
  const look = await over.evaluate((el) => ({
    icon: getComputedStyle(el.querySelector('.ds-usage__icon')).color,
    word: getComputedStyle(el.querySelector('.ds-usage__status')).color,
    text: el.querySelector('.ds-usage__status').textContent,
    outline: getComputedStyle(el.querySelector('.ds-meter')).outlineStyle,
  }));
  expect(look.icon).toBe(look.word);
  expect(look.text).toBe('Over budget');
  expect(look.outline).toBe('solid');
});
