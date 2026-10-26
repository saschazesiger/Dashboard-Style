/**
 * DS.overlay.tooltips() in 2.0 (fixtures/tooltip-touch.html): one rule for
 * when a tip shows, touch, and a trigger that leaves the document.
 *
 * - A tip that repeats the trigger's visible text shows only while that
 *   text is cut off (a name in a 160px column; a td that clips an inline
 *   link) and never describes the trigger; a tip that adds something (a
 *   .ds-sr label, a label hidden as a 1×1px box) shows as before.
 * - Touch: a tap on an image or a blocked control shows the tip at once and
 *   a second tap hides it; a long press shows the others and swallows the
 *   click that follows; a link keeps its long press; a press that moves is
 *   a scroll; a touch tip stays (no timeout) until the next touch or a
 *   scroll. Real taps in Chromium and WebKit (hasTouch), synthetic touch
 *   pointer events in every engine.
 * - A shown tooltip whose trigger is removed hides at once in every engine.
 *
 * Timers are read with margins far from their thresholds.
 */
import { test, expect } from './base-test.js';
import { ready, settle, focusByKeyboard } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/tooltip-touch.html';

async function load(page) {
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** The page's tooltip: what it shows, and who it describes. */
const tip = (page) => page.evaluate(() => {
  const el = document.querySelector('.ds-tooltip');
  return { text: el.textContent, hidden: el.hidden, state: el.dataset.state, described: [...document.querySelectorAll('[aria-describedby]')].map((node) => node.id) };
});

/** A touch pointer event on the element (synthetic, so every engine runs the same path). */
function touch(page, selector, type, { dx = 0, dy = 0 } = {}) {
  return page.evaluate(({ selector: sel, type: kind, dx: x, dy: y }) => {
    const el = document.querySelector(sel);
    const rect = el.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, composed: true, pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: rect.left + rect.width / 2 + x, clientY: rect.top + rect.height / 2 + y };
    el.dispatchEvent(kind === 'click' ? new MouseEvent('click', init) : new PointerEvent(kind, init));
  }, { selector, type, dx, dy });
}

test.describe('when a tip shows', () => {
  test('a tip that repeats a text that fits never shows; cut off it shows and describes nothing', async ({ page }) => {
    await load(page);
    await page.hover('#fits');
    await page.waitForTimeout(1000);
    expect((await tip(page)).hidden, 'the name fits').toBe(true);
    await page.hover('#cut', { position: { x: 12, y: 6 } });
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
    expect(await tip(page)).toMatchObject({ text: 'LAPTOP-0042-FINANCE-BACKUP-WEST', state: 'open', described: [] });
  });

  test('a td that clips an inline link counts as cut off', async ({ page }) => {
    await load(page);
    await page.hover('#in-cell', { position: { x: 12, y: 6 } });
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
    expect(await tip(page)).toMatchObject({ text: 'TABLET-0121-WAREHOUSE-NORTH-GATE', described: [] });
  });

  test('a label hidden by .ds-sr or as a 1×1px box is not visible text: the tip shows', async ({ page }) => {
    await load(page);
    for (const id of ['adaptive', 'sr-label']) {
      await focusByKeyboard(page, page.locator(`#${id}`));
      expect((await tip(page)).state, id).toBe('open');
    }
  });

  test('a shown tooltip whose trigger is removed hides at once', async ({ page }) => {
    await load(page);
    await focusByKeyboard(page, page.locator('#gone'));
    expect((await tip(page)).state).toBe('open');
    const after = await page.evaluate(async () => {
      document.getElementById('gone').remove();
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const el = document.querySelector('.ds-tooltip');
      return { hidden: el.hidden, state: el.dataset.state, popover: el.matches('[popover]') ? el.matches(':popover-open') : false };
    });
    expect(after).toEqual({ hidden: true, state: 'closed', popover: false });
  });
});

test.describe('touch (synthetic pointer events)', () => {
  test('a tap on an image or a blocked control shows the tip at once; a second tap hides it; no timeout', async ({ page }) => {
    await load(page);
    for (const selector of ['#tap-img', '#tap-blocked']) {
      await touch(page, selector, 'pointerdown');
      await touch(page, selector, 'pointerup');
      expect((await tip(page)).state, selector).toBe('open');
      await page.waitForTimeout(1500);
      expect((await tip(page)).state, `${selector} stays`).toBe('open');
      await touch(page, selector, 'pointerdown');
      await touch(page, selector, 'pointerup');
      expect((await tip(page)).state, `${selector} second tap`).toBe('closed');
      await settle(page);
    }
  });

  test('a long press shows the tip of any other trigger and swallows the click that follows; a link keeps its long press', async ({ page }) => {
    await load(page);
    await touch(page, '#press-icon', 'pointerdown');
    await page.waitForTimeout(250);
    expect((await tip(page)).hidden, 'not before the delay').toBe(true);
    await page.waitForTimeout(600);
    expect(await tip(page)).toMatchObject({ text: 'Archive', state: 'open' });
    await touch(page, '#press-icon', 'pointerup');
    await touch(page, '#press-icon', 'click');
    expect(await page.evaluate(() => window.clicks)).toEqual([]);
    // A tap on the same icon afterwards clicks as usual and hides the tip.
    await touch(page, '#press-icon', 'pointerdown');
    await touch(page, '#press-icon', 'pointerup');
    await touch(page, '#press-icon', 'click');
    expect(await page.evaluate(() => window.clicks)).toEqual(['press-icon']);
    expect((await tip(page)).state).toBe('closed');
    await settle(page);
    await touch(page, '#press-link', 'pointerdown');
    await page.waitForTimeout(900);
    expect((await tip(page)).hidden, 'a link keeps the browser\'s long press').toBe(true);
    await touch(page, '#press-link', 'pointerup');
  });

  test('a press that moves is a scroll; pointercancel cancels; a scroll hides a touch tip', async ({ page }) => {
    await load(page);
    await touch(page, '#press-icon', 'pointerdown');
    await touch(page, '#press-icon', 'pointermove', { dy: 30 });
    await page.waitForTimeout(900);
    expect((await tip(page)).hidden).toBe(true);
    await touch(page, '#press-icon', 'pointerup');
    await touch(page, '#tap-blocked', 'pointerdown');
    await touch(page, '#tap-blocked', 'pointercancel');
    await touch(page, '#tap-blocked', 'pointerup');
    expect((await tip(page)).hidden).toBe(true);
    await touch(page, '#tap-img', 'pointerdown');
    await touch(page, '#tap-img', 'pointerup');
    expect((await tip(page)).state).toBe('open');
    await page.evaluate(() => document.dispatchEvent(new Event('scroll')));
    expect((await tip(page)).state).toBe('closed');
  });
});

test.describe('touch (real taps)', () => {
  test.use({ hasTouch: true });
  test.skip(({ browserName }) => browserName === 'firefox', 'Playwright emulates touch in Chromium and WebKit');

  test('a tap on a blocked control shows why; a tap elsewhere hides it', async ({ page }) => {
    await load(page);
    await page.tap('#tap-blocked', { force: true });
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
    expect((await tip(page)).text).toBe('Fill in the serial number first');
    await page.touchscreen.tap(600, 500);
    expect((await tip(page)).state).toBe('closed');
  });

  test('a tap on an image shows its tip; a tap on an icon button does not', async ({ page }) => {
    await load(page);
    await page.tap('#press-icon');
    await page.waitForTimeout(800);
    expect((await tip(page)).hidden).toBe(true);
    await page.tap('#tap-img');
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
    expect((await tip(page)).text).toBe('Online since 9:00');
  });
});
