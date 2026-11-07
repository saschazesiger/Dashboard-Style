/**
 * The thinking indicator on its demo page: the parts the module writes (the
 * wheel with the shimmer, the time ticking every second, the tokens, the
 * icon hidden), the live region on the step only, set() and ds:change, the
 * attributes read again, the end (the time stops, the shimmer goes,
 * data-state), the meta wrapping in a narrow column, size and density, and
 * forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=thinking';

async function open(page) {
  await page.goto(URL);
  await ready(page);
}

const RUN = '[data-demo="run"]';

test('the module writes the step on a shimmering wheel, the time, the tokens, and hides the icon', async ({ page }) => {
  await open(page);
  const run = page.locator(RUN);
  await expect(run.locator('.ds-thinking__step .ds-wheel .ds-wheel__line')).toHaveText('Thinking');
  await expect(run.locator('.ds-wheel__line')).toHaveClass(/ds-shimmer/);
  await expect(run.locator('.ds-thinking__tokens')).toHaveText('312 tokens');
  await expect(run.locator('.ds-thinking__time')).toHaveText(/^\d+s$/);
  await expect(run.locator('.ds-thinking__time')).toHaveAttribute('datetime', /^PT\d+S$/);
  await expect(run.locator('.ds-thinking__icon')).toHaveAttribute('aria-hidden', 'true');
  // The dot between time and tokens is no text of its own.
  const dot = await run.locator('.ds-thinking__tokens').evaluate((el) => getComputedStyle(el, '::before').content);
  expect(dot).toContain('·');
});

test('the time ticks every second on the one clock, outside the live region', async ({ page }) => {
  await open(page);
  const time = page.locator(`${RUN} .ds-thinking__time`);
  const first = await time.textContent();
  await expect(time).not.toHaveText(first, { timeout: 2500 });
  // Only the step is live.
  const live = await page.locator(RUN).evaluate((el) => [...el.querySelectorAll('[aria-live]')].map((node) => node.className));
  expect(live).toEqual(['ds-thinking__step']);
  expect(await time.evaluate((el) => !!el.closest('[aria-live]'))).toBe(false);
});

test('set() rolls the step, writes the thought and the tokens, and tells the page; the end stops the time and the shimmer', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.changes = [];
    document.querySelector('[data-demo="run"]').addEventListener('ds:change', (event) => window.changes.push(event.detail));
  });
  await page.locator('[data-demo="next"]').click();
  const run = page.locator(RUN);
  await expect(run.locator('.ds-wheel__line:not([aria-hidden])')).toHaveText('Reading the device list');
  await expect(run.locator('.ds-thinking__thought')).toHaveText('Forty laptops, eleven of them older than three years');
  await expect(run.locator('.ds-thinking__tokens')).toHaveText('1.7K tokens');
  // One set() is one ds:change, the indicator's: the wheel inside it tells nobody.
  const changes = await page.evaluate(() => window.changes);
  expect(changes).toHaveLength(1);
  expect(changes[0]).toMatchObject({ step: 'Reading the device list', tokens: 1712, done: false });

  await page.locator('[data-demo="finish"]').click();
  await expect(run).toHaveAttribute('data-state', 'done');
  await expect(run.locator('.ds-wheel__line:not([aria-hidden])')).toHaveText('Done', { timeout: 3000 });
  await expect(run.locator('.ds-wheel__line:not([aria-hidden])')).not.toHaveClass(/ds-shimmer/);
  const stopped = await run.locator('.ds-thinking__time').textContent();
  await page.waitForTimeout(1300);
  await expect(run.locator('.ds-thinking__time')).toHaveText(stopped);
  expect(await page.evaluate(() => DS.core.get(document.querySelector('[data-demo="run"]'), 'thinking').get().done)).toBe(true);
});

test('the attributes are read again: a finished one shows its total, a new step rolls', async ({ page }) => {
  await open(page);
  const done = page.locator('[data-demo="done"]');
  await expect(done).toHaveAttribute('data-state', 'done');
  await expect(done.locator('.ds-thinking__time')).toHaveText('48s');
  await expect(done.locator('.ds-thinking__tokens')).toHaveText('18.4K tokens');
  await expect(done.locator('.ds-wheel__line')).not.toHaveClass(/ds-shimmer/);
  await done.evaluate((el) => {
    el.removeAttribute('data-ds-thinking-done');
    el.setAttribute('data-ds-thinking', 'Checking again');
    el.setAttribute('data-ds-thinking-tokens', '1');
  });
  await expect(done).not.toHaveAttribute('data-state', 'done');
  await expect(done.locator('.ds-wheel__line:not([aria-hidden])')).toHaveText('Checking again', { timeout: 3000 });
  await expect(done.locator('.ds-wheel__line:not([aria-hidden])')).toHaveClass(/ds-shimmer/);
  await expect(done.locator('.ds-thinking__tokens')).toHaveText('1 token');
});

test('layout: the meta follows the step; in a narrow column it wraps under the step, lined up with it', async ({ page }) => {
  await open(page);
  const wide = await page.locator(RUN).evaluate((el) => {
    const step = el.querySelector('.ds-thinking__step').getBoundingClientRect();
    const meta = el.querySelector('.ds-thinking__meta').getBoundingClientRect();
    return { sameLine: Math.abs(meta.top + meta.height / 2 - (step.top + step.height / 2)) < 6, after: meta.left - step.right };
  });
  expect(wide.sameLine).toBe(true);
  expect(wide.after).toBeGreaterThanOrEqual(0);
  expect(wide.after).toBeLessThan(16);
  const narrow = await page.locator('[data-demo="narrow"]').evaluate((el) => {
    const step = el.querySelector('.ds-thinking__step').getBoundingClientRect();
    const meta = el.querySelector('.ds-thinking__meta').getBoundingClientRect();
    const line = el.querySelector('.ds-wheel__line');
    return { below: meta.top >= step.bottom - 1, aligned: Math.abs(meta.left - step.left) < 1, cut: line.scrollWidth > line.clientWidth };
  });
  expect(narrow).toEqual({ below: true, aligned: true, cut: true });
});

test('size steps the step\'s type and the icon; density the room between the parts', async ({ page }) => {
  await open(page);
  const read = () => page.locator(RUN).evaluate((el) => ({
    font: parseFloat(getComputedStyle(el.querySelector('.ds-thinking__step')).fontSize),
    icon: el.querySelector('.ds-thinking__icon svg').getBoundingClientRect().width,
    gap: parseFloat(getComputedStyle(el).columnGap),
  }));
  expect(await read()).toEqual({ font: 14, icon: 20, gap: 8 });
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-lg', 'ds-density-dense'));
  expect(await read()).toEqual({ font: 16, icon: 24, gap: 4 });
});

test('forced colours: the icon takes CanvasText and the copy of the shimmer goes', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const look = await page.locator(RUN).evaluate((el) => ({
    icon: getComputedStyle(el.querySelector('.ds-thinking__icon')).color,
    canvasText: (() => {
      const probe = document.createElement('span');
      probe.style.color = 'CanvasText';
      el.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    })(),
    copy: getComputedStyle(el.querySelector('.ds-wheel__line'), '::after').content,
  }));
  expect(look.icon).toBe(look.canvasText);
  expect(look.copy).toBe('none');
});
