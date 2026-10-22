/**
 * Bugs the audit found in the styleguide's own demo code, written as tests
 * of the **correct** behaviour. From P0 to P7 they were marked
 * `test.fail(<engines>, '<ids>: fixed in P<n>')` with the ids of
 * plans/motion-2/coverage.md: P2 fixed `countUp()`, which the tiles use,
 * P5 replaced the overlay, snackbar and tooltip demos with `DS.overlay`.
 * All of them pass now and stay as regression tests; no `test.fail` is
 * left (test/repo.test.js allows only `spike: <capability>` markers).
 *
 * The demos live in styleguide/styleguide.js (index.html) and, since P8,
 * in the Motion Lab (motion.html, its registry styleguide/lab.js): the
 * count-up and the leave/enter tests open motion.html, where those demos
 * moved. The locators name what a user sees (the opener buttons,
 * `.ds-dialog`, `.ds-tooltip`, `.ds-toast`), not the demo's internals.
 * Bugs on the fixtures live in regressions.spec.js.
 */
import { test, expect } from '@playwright/test';
import { ready, settle, focusByKeyboard, expectMonotonic } from './helpers/motion.js';

const STYLEGUIDE = '/styleguide/index.html';
const LAB = '/styleguide/motion.html';

/** Loads the styleguide (optionally slowed down) and waits until the first-render motion (stagger, count-up) has played. */
async function open(page, { speed, path = STYLEGUIDE } = {}) {
  await page.goto(`${path}${speed ? `?speed=${speed}` : ''}`);
  await ready(page);
  await page.mouse.move(1, 1);
  await page.waitForFunction(() => [...document.querySelectorAll('.ds-tile__value[data-count]')].every((el) => {
    const final = Number(el.getAttribute('data-count')).toLocaleString('en-US') + (el.getAttribute('data-suffix') || '');
    return el.textContent === final;
  }));
  await settle(page);
}

/** The page-level dialog (not the inline one shown for inspection). */
const pageDialog = (page) => page.locator('.ds-dialog:not(.ds-dialog--contained)');

/** The page's tooltip showing `text` (not the inline one shown for inspection). */
const tooltip = (page, text) => page.locator('.ds-tooltip:not(.sg-tooltip-demo)').filter({ hasText: text });

/**
 * Records, in the page, every animation frame for `ms`: whether a visible
 * tooltip with `text` is fully shown (opacity 1). Started before the action
 * it watches.
 */
function watchTooltip(page, text, ms) {
  return page.evaluate((args) => new Promise((resolve) => {
    const shown = [];
    const start = performance.now();
    const frame = (now) => {
      shown.push([...document.querySelectorAll('.ds-tooltip:not(.sg-tooltip-demo)')].some((el) => {
        const style = getComputedStyle(el);
        return el.textContent.includes(args.text) && !el.hidden && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.99;
      }));
      if (now - start < args.ms) requestAnimationFrame(frame);
      else resolve(shown);
    };
    requestAnimationFrame(frame);
  }), { text, ms });
}

test.describe('fixed in P2', () => {
  test('clicking "Count up the tiles" twice never counts a tile backwards', async ({ page }) => {
    await open(page, { path: LAB });
    await page.locator('[data-sg="count"]').scrollIntoViewIfNeeded();
    const shown = await page.evaluate(async () => {
      const button = document.querySelector('[data-sg="count"]');
      const tile = document.querySelector('.ds-tile__value[data-count="1284"]');
      const values = [];
      let again = false;
      button.click();
      const start = performance.now();
      await new Promise((resolve) => {
        const frame = (now) => {
          // From 100ms on: the first click may start from wherever it likes.
          if (now - start >= 100) values.push(Number(tile.textContent.replace(/[^\d.]/g, '')));
          if (!again && now - start >= 300) {
            again = true;
            button.click();
          }
          // Until the second count has landed (countUp drops aria-busy), at
          // most 3s: a click on the busy lab page may start it late.
          if (now - start < 1400 || (tile.getAttribute('aria-busy') === 'true' && now - start < 3000)) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      // Each press raises the target by a step (the count demo, P2): the count ends on the last one.
      return { values, final: Number(tile.getAttribute('data-count')) };
    });
    expectMonotonic(shown.values, { direction: 'up' });
    expect(shown.final).toBeGreaterThan(1284);
    expect(shown.values.at(-1)).toBe(shown.final);
  });

  test('"leave sink" then "enter scale" 100ms later never flashes the card', async ({ page }) => {
    await open(page, { path: LAB });
    const opacity = await page.evaluate(async () => {
      const card = document.getElementById('sg-motion-card');
      const values = [];
      document.querySelector('[data-leave="sink"]').click();
      setTimeout(() => document.querySelector('[data-enter="scale"]').click(), 100);
      const start = performance.now();
      await new Promise((resolve) => {
        const frame = (now) => {
          values.push(Number(getComputedStyle(card).opacity));
          if (now - start < 1200) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      return values;
    });
    // The exit takes the card down, the entrance brings it back from there: once
    // it rises it never drops again (the superseded leave() must not replay an entrance).
    const turn = opacity.findIndex((value, index) => index > 0 && value > opacity[index - 1] + 1e-3);
    expect(turn, 'the card comes back').toBeGreaterThan(0);
    expect(Math.min(...opacity.slice(0, turn))).toBeLessThan(0.99);
    expectMonotonic(opacity.slice(turn - 1), { direction: 'up', tolerance: 1e-3 });
    expect(opacity.at(-1)).toBe(1);
  });
});

test.describe('fixed in P5', () => {
  test('after Escape or Cancel, focus is back on the opener within one frame', async ({ page }) => {
    await open(page);
    const opener = page.locator('[data-sg="dialog"]');
    for (const how of ['Escape', 'Cancel']) {
      await focusByKeyboard(page, opener);
      await page.keyboard.press('Enter');
      await expect(pageDialog(page)).toBeVisible();
      await settle(page);
      // Two frames after the key or the click, wherever focus is then. The
      // listener on window runs after the page's own handlers (DS.overlay
      // takes Escape on the document in the bubble phase) and holds the
      // dialog's exit until focus is read, so the read always falls inside
      // the exit, however long the frames take.
      await page.evaluate((type) => {
        window.afterClose = undefined;
        window.addEventListener(type, () => {
          const exit = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).filter((a) => a.effect && a.effect.target
            && a.effect.target.closest('.ds-dialog:not(.ds-dialog--contained)') && a.playState === 'running');
          exit.forEach((a) => a.pause());
          requestAnimationFrame(() => requestAnimationFrame(() => {
            window.afterClose = {
              held: exit.filter((a) => a.playState === 'paused').length,
              onOpener: document.activeElement === document.querySelector('[data-sg="dialog"]'),
            };
            exit.forEach((a) => { if (a.playState === 'paused') a.play(); });
          }));
        }, { once: true });
      }, how === 'Escape' ? 'keydown' : 'click');
      if (how === 'Escape') await page.keyboard.press('Escape');
      else await pageDialog(page).getByRole('button', { name: 'Cancel' }).click();
      await page.waitForFunction(() => window.afterClose !== undefined);
      const after = await page.evaluate(() => window.afterClose);
      expect(after.held, `the exit is still running two frames after ${how}`).toBeGreaterThan(0);
      expect(after.onOpener, `focus two frames after ${how}`).toBe(true);
      await expect(pageDialog(page)).toBeHidden();
    }
  });

  test('tabbing from one [data-tip] button to the next keeps the tooltip shown', async ({ page }) => {
    await open(page);
    // One Tab from the control before it, so no other tooltip is still leaving.
    const settings = page.locator('[data-tip="Settings"]').first();
    await settings.evaluate((el) => el.previousElementSibling.focus());
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.getAttribute('data-tip'))).toBe('Settings');
    await expect(tooltip(page, 'Settings')).toBeVisible();
    await settle(page);
    const watching = watchTooltip(page, 'More actions', 800);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.getAttribute('data-tip'))).toBe('More actions');
    const shown = await watching;
    // Once it shows the next label, it stays.
    const first = shown.indexOf(true);
    expect(first, 'the tooltip shows "More actions"').toBeGreaterThanOrEqual(0);
    expect(shown.slice(first).every(Boolean), 'the tooltip stays shown').toBe(true);
  });

  test('moving the pointer onto the icon inside a tooltip button keeps the tooltip', async ({ page }) => {
    await open(page);
    const button = page.locator('[data-tip="Settings"]').first();
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    // In at the middle of its left edge (the button is round), away from its icon.
    await page.mouse.move(box.x + 3, box.y + box.height / 2);
    await expect(tooltip(page, 'Settings')).toBeVisible();
    await settle(page);
    expect(await page.evaluate((point) => document.elementFromPoint(point.x, point.y).closest('svg') !== null,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 }), 'the centre is on the icon').toBe(true);
    const watching = watchTooltip(page, 'Settings', 600);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    expect((await watching).every(Boolean), 'the tooltip stays shown').toBe(true);
  });

  test('closing an error snackbar does not drop focus to the page body', async ({ page }) => {
    await open(page);
    await page.locator('[data-sg="toast-error"]').click();
    const close = page.locator('.ds-toast--error:not(.sg-toast-demo)').getByRole('button', { name: 'Close' });
    await expect(close).toBeVisible();
    await settle(page);
    await focusByKeyboard(page, close);
    await page.keyboard.press('Enter');
    await expect(page.locator('.ds-toast--error:not(.sg-toast-demo)')).toHaveCount(0);
    await settle(page);
    const focus = await page.evaluate(() => (document.activeElement && document.activeElement !== document.body ? document.activeElement.outerHTML.slice(0, 80) : 'body'));
    expect(focus).not.toBe('body');
  });

  test('reopening a closing dialog continues from its current opacity', async ({ page }) => {
    await open(page);
    await page.locator('[data-sg="dialog"]').click();
    await expect(pageDialog(page)).toBeVisible();
    await settle(page);
    // Cancel, hold the exit 25 % of the way through (the fade runs on the
    // standard curve, which has done most of its way by 40 %), open the dialog again
    // and read the shown box's opacity before and after, all in one task:
    // no frame timing decides what is measured.
    const reopen = await page.evaluate(() => {
      const shownBox = () => [...document.querySelectorAll('.ds-dialog:not(.ds-dialog--contained) .ds-dialog__box')].at(-1);
      const box = shownBox();
      [...box.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Cancel').click();
      // getAnimations() flushes styles, so the exit exists in this task.
      const exit = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).filter((a) => a.effect && a.effect.target === box && a.playState === 'running');
      for (const animation of exit) {
        animation.pause();
        const delay = animation.effect.getTiming().delay || 0;
        animation.currentTime = delay + 0.25 * Number(animation.effect.getComputedTiming().duration);
      }
      const before = Number(getComputedStyle(box).opacity);
      document.querySelector('[data-sg="dialog"]').click();
      document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline));
      const after = Number(getComputedStyle(shownBox()).opacity);
      exit.forEach((a) => { if (a.playState === 'paused') a.play(); });
      return { exit: exit.length, before, after };
    });
    expect(reopen.exit, 'the box has an exit to interrupt').toBeGreaterThan(0);
    expect(reopen.before, 'the exit is under way').toBeGreaterThan(0.2);
    expect(reopen.before, 'the exit is under way').toBeLessThan(0.95);
    expect(Math.abs(reopen.after - reopen.before), `opacity ${reopen.before} before the reopen, ${reopen.after} after`).toBeLessThan(0.05);
    await settle(page);
    await expect(pageDialog(page)).toHaveCount(1);
    expect(await pageDialog(page).locator('.ds-dialog__box').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
  });
});
