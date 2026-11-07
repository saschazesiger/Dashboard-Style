/**
 * The reasoning disclosure on its demo page: the line the module writes
 * (Thinking with the shimmer, then "Thought for ..."), the page's own line
 * kept, the time, the auto open and close and the reader's toggle winning,
 * the thoughts following their end, set() and ds:change, the keyboard and
 * names, the options of the summary, and forced colours. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=reasoning';

async function open(page) {
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
}

const LIVE = '[data-demo="live"]';

/** A reasoning disclosure of the test's own, driven by window.reasoning. */
async function own(page, since = 5000) {
  await open(page);
  await page.evaluate((ago) => {
    const el = document.createElement('details');
    el.className = 'ds-collapsible ds-disclosure ds-reasoning';
    el.id = 'own';
    el.innerHTML = '<summary><span class="ds-reasoning__summary"></span> <time class="ds-reasoning__time"></time></summary>'
      + '<div class="ds-disclosure__body ds-reasoning__body"><div class="ds-reasoning__text" tabindex="0" aria-label="Thoughts"><p>Forty laptops.</p></div></div>';
    document.querySelector('#fx-component').append(el);
    window.reasoning = DS.reasoning.create(el, { since: Date.now() - ago, auto: true });
  }, since);
  return page.locator('#own');
}

test('while it runs: "Thinking" with the shimmer, the time ticking, open by itself; at the end "Thought for ..." and closed', async ({ page }) => {
  const el = await own(page);
  const line = el.locator('.ds-reasoning__summary');
  await expect(el).toHaveAttribute('data-state', 'running');
  await expect(line).toHaveText('Thinking');
  await expect(line).toHaveClass(/ds-shimmer/);
  await expect(line).toHaveAttribute('data-shimmer', 'Thinking');
  await expect(el).toHaveJSProperty('open', true);
  await expect(el.locator('.ds-reasoning__time')).toHaveText(/^[5-6]s$/);
  await expect(el.locator('.ds-reasoning__time')).toHaveText(/^[6-7]s$/, { timeout: 2500 });
  await page.evaluate(() => window.reasoning.set({ done: true, total: 7000 }));
  await expect(el).toHaveAttribute('data-state', 'done');
  await expect(line).toHaveText('Thought for 7s');
  await expect(line).not.toHaveClass(/ds-shimmer/);
  await expect(el.locator('.ds-reasoning__time')).toHaveText('');
  await expect(el).toHaveJSProperty('open', false);
  // The demo's own run streams its thoughts in, then ends the same way.
  await expect(page.locator(`${LIVE} .ds-reasoning__text p`)).toHaveCount(4, { timeout: 6000 });
  await expect(page.locator(LIVE)).toHaveAttribute('data-state', 'done', { timeout: 3000 });
  await expect(page.locator(`${LIVE} .ds-reasoning__summary`)).toHaveText(/^Thought for \ds$/);
});

test('a reader who toggles it keeps it as they left it', async ({ page }) => {
  const el = await own(page);
  await expect(el).toHaveJSProperty('open', true);
  await el.locator('summary').click();
  await expect(el).toHaveJSProperty('open', false);
  await el.locator('summary').click();
  await expect(el).toHaveJSProperty('open', true);
  await page.evaluate(() => window.reasoning.set({ done: true }));
  await expect(el).toHaveAttribute('data-state', 'done');
  await expect(el).toHaveJSProperty('open', true);
  // A new run is the module's again.
  await page.evaluate(() => window.reasoning.set({ done: false }));
  await page.evaluate(() => window.reasoning.set({ done: true }));
  await expect(el).toHaveJSProperty('open', false);
});

test('destroy(): the time stops; a toggle is the reader\'s alone', async ({ page }) => {
  const el = await own(page);
  const time = el.locator('.ds-reasoning__time');
  await expect(time).toHaveText(/^[5-6]s$/);
  await page.evaluate(() => window.reasoning.destroy());
  const before = await time.textContent();
  await page.waitForTimeout(1300);
  await expect(time).toHaveText(before);
  await el.locator('summary').click();
  await expect(el).toHaveJSProperty('open', false);
  await expect(el).toHaveAttribute('data-state', 'running');
});

test('the page\'s own summary stays, with the total beside it; the module\'s says the total itself', async ({ page }) => {
  await open(page);
  const own = page.locator('.ds-reasoning').nth(1);
  await expect(own.locator('.ds-reasoning__summary')).toHaveText('Compared the warranty dates of 40 laptops');
  await expect(own.locator('.ds-reasoning__time')).toHaveText('48s');
  await expect(own.locator('.ds-reasoning__time')).toHaveAttribute('datetime', 'PT48S');
  const written = page.locator('[data-demo="written"]');
  await expect(written.locator('.ds-reasoning__summary')).toHaveText('Thought for 12s');
  await expect(written.locator('.ds-reasoning__time')).toHaveText('');
  await expect(written.locator('.ds-reasoning__icon')).toHaveAttribute('aria-hidden', 'true');
  await expect(written.locator('.ds-chevron')).toHaveAttribute('aria-hidden', 'true');
});

test('set() takes a summary and a new run, tells the page, and the attributes are read again', async ({ page }) => {
  await open(page);
  const written = page.locator('[data-demo="written"]');
  await page.evaluate(() => {
    window.changes = [];
    document.querySelector('[data-demo="written"]').addEventListener('ds:change', (event) => window.changes.push(event.detail.done));
    DS.core.get(document.querySelector('[data-demo="written"]'), 'reasoning').set({ summary: 'Grouped by month' });
  });
  await expect(written.locator('.ds-reasoning__summary')).toHaveText('Grouped by month');
  await expect(written.locator('.ds-reasoning__time')).toHaveText('12s');
  await written.evaluate((el) => el.removeAttribute('data-ds-reasoning-done'));
  await expect(written).toHaveAttribute('data-state', 'running');
  await expect(written.locator('.ds-reasoning__summary')).toHaveClass(/ds-shimmer/);
  await expect(written.locator('.ds-reasoning__summary')).toHaveAttribute('data-shimmer', 'Grouped by month');
  expect(await page.evaluate(() => window.changes)).toEqual([true]);
});

test('the thoughts stay at their end while they stream in, and scroll in their rail', async ({ page }) => {
  await open(page);
  const result = await page.locator('[data-demo="written"]').evaluate(async (el) => {
    el.open = true;
    el.removeAttribute('data-ds-reasoning-done');
    await new Promise((resolve) => setTimeout(resolve, 500));
    const text = el.querySelector('.ds-reasoning__text');
    text.scrollTop = text.scrollHeight;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (let i = 0; i < 4; i += 1) {
      const p = document.createElement('p');
      p.textContent = `More thought ${i}`;
      text.append(p);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { scrolls: text.scrollHeight > text.clientHeight, atEnd: text.scrollHeight - text.clientHeight - text.scrollTop < 4, rail: getComputedStyle(text).borderInlineStartWidth, max: getComputedStyle(text).maxHeight };
  });
  expect(result).toEqual({ scrolls: true, atEnd: true, rail: '2px', max: '320px' });
});

test('keyboard: Tab reaches the summary, Enter and Space toggle it, the thoughts take focus; the name is the line', async ({ page }) => {
  await open(page);
  const own = page.locator('.ds-reasoning').nth(1);
  await own.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(own).toHaveJSProperty('open', true);
  await own.evaluate((el) => DS.motion.settled(el, { subtree: true }));
  await page.keyboard.press('Tab');
  await expect(own.locator('.ds-reasoning__text')).toBeFocused();
  await expect(own.locator('.ds-reasoning__text')).toHaveAccessibleName('Thoughts');
  await own.locator('summary').focus();
  await page.keyboard.press('Space');
  await expect(own).toHaveJSProperty('open', false);
  await own.evaluate((el) => DS.motion.settled(el, { subtree: true }));
  const name = await own.locator('summary').evaluate((el) => el.textContent.replace(/\s+/g, ' ').trim());
  expect(name).toBe('Compared the warranty dates of 40 laptops 48s');
});

test('options: the summary steps with size and density, touch wins, shape squares it', async ({ page }) => {
  await open(page);
  const summary = page.locator('.ds-reasoning').nth(1).locator('summary');
  const read = () => summary.evaluate((el) => ({ height: el.getBoundingClientRect().height, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) }));
  expect(await read()).toEqual({ height: 40, radius: 20 });
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-sm', 'ds-density-compact'));
  expect((await read()).height).toBe(28);
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-touch', 'ds-shape-square'));
  await expect.poll(read).toEqual({ height: 48, radius: 0 });
});

test('forced colours: the rail stays, the line keeps its words and the copy of the shimmer goes', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const look = await page.locator(LIVE).evaluate((el) => ({
    rail: getComputedStyle(el.querySelector('.ds-reasoning__text')).borderInlineStartStyle,
    copy: getComputedStyle(el.querySelector('.ds-reasoning__summary'), '::after').content,
    text: el.querySelector('.ds-reasoning__summary').textContent,
  }));
  expect(look).toEqual({ rail: 'solid', copy: 'none', text: 'Thinking' });
});
