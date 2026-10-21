/**
 * Motion timelines of today's state (P0 baseline): what every motion
 * utility and every animated component plays, read from getAnimations()
 * (helpers/motion.js `timeline()`) and stored as JSON snapshots, one set per
 * engine. In P1 these snapshots show exactly what the new token system
 * changes: a deliberate change updates them in the same commit
 * (`npm run test:browser:update`, then review the diff).
 *
 * A snapshot holds the timing contract only (type, name, pseudo-element,
 * target, duration, delay, easing, keyframe easing, iterations, direction,
 * fill), never the current time or play state, so it does not depend on
 * how fast the machine is. Each motion is started and paused in the same
 * task (`act()`), so nothing can finish before it is read; the page then
 * resumes.
 */
import { test, expect } from '@playwright/test';
import { ready, settle, timeline } from './helpers/motion.js';

const STYLEGUIDE = '/styleguide/index.html';
const FIXTURES = '/test/browser/fixtures/';

/** Times to the microsecond: a calc() duration may come back as 350.00000000000006. */
const time = (value) => (typeof value === 'number' ? Math.round(value * 1000) / 1000 : value);

/** The timing contract of a timeline (JSON has no Infinity: loops say "Infinity"). */
function contract(entries) {
  return entries.map((entry) => {
    const out = {
      type: entry.type,
      name: entry.name,
      pseudoElement: entry.pseudoElement,
      duration: time(entry.duration),
      delay: time(entry.delay),
      easing: entry.easing,
      keyframeEasing: entry.keyframeEasing,
      iterations: Number.isFinite(entry.iterations) ? entry.iterations : String(entry.iterations),
      direction: entry.direction,
      fill: entry.fill,
    };
    if (entry.target) out.target = entry.target;
    return out;
  });
}

/** Compares the timeline of `locator` with the engine's JSON snapshot `<name>.json`. */
async function expectTimeline(locator, name, options = {}) {
  const entries = await timeline(locator, options);
  expect(entries.length, `${name}: something animates`).toBeGreaterThan(0);
  expect.soft(JSON.stringify(contract(entries), null, 2), name).toMatchSnapshot(`${name}.json`);
  return entries;
}

/**
 * Runs `action(arg)` in the page and pauses every animation of the
 * document in the same task (getAnimations() flushes styles, so the motion
 * the action started is there, at its start).
 */
function act(page, action, arg = null) {
  return page.evaluate(([source, value]) => {
    new Function('arg', `(${source})(arg)`)(value);
    for (const animation of document.getAnimations()) animation.pause();
  }, [action.toString(), arg]);
}

/** Plays what act() paused. */
function resume(page) {
  return page.evaluate(() => {
    for (const animation of document.getAnimations()) if (animation.playState === 'paused') animation.play();
  });
}

async function open(page, path) {
  await page.goto(path);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const click = (selector) => document.querySelector(selector).click();

/* ── Smoke checks ──────────────────────────────────────────────────── */

test.describe('smoke', () => {
  test('.ds-spinner runs ds-spin for ever', async ({ page }) => {
    await open(page, `${FIXTURES}feedback.html`);
    const spin = (await timeline(page.locator('#spinner'))).filter((entry) => entry.name === 'ds-spin');
    expect(spin).toHaveLength(1);
    expect(spin[0].iterations).toBe(Infinity);
  });

  test('.ds-enter plays ds-fade-in and ds-lift-in over --ds-dur-medium', async ({ page }) => {
    await open(page, `${FIXTURES}motion.html`);
    const box = page.locator('#enter-default');
    // The token is a calc() (its value times --ds-time-scale): let the engine resolve it.
    const medium = await box.evaluate((el) => {
      const probe = document.createElement('div');
      probe.style.transitionDuration = 'var(--ds-dur-medium)';
      el.append(probe);
      const seconds = parseFloat(getComputedStyle(probe).transitionDuration);
      probe.remove();
      return seconds * 1000;
    });
    expect(medium).toBeGreaterThan(0);
    await act(page, (id) => DS.motion.replay(document.getElementById(id), 'ds-enter'), 'enter-default');
    const entries = await timeline(box);
    expect(entries.map((entry) => entry.name)).toEqual(['ds-fade-in', 'ds-lift-in']);
    expect(entries.map((entry) => entry.duration)).toEqual([medium, medium]);
  });
});

/* ── Motion utilities (motion.html) ────────────────────────────────── */

test.describe('utilities', () => {
  test('every .ds-enter variant', async ({ page }) => {
    await open(page, `${FIXTURES}motion.html`);
    for (const variant of ['default', 'fade', 'scale', 'slide', 'swap', 'delayed', 'pop', 'fill-x', 'fill-y']) {
      const classes = variant === 'default' ? ['ds-enter'] : ['ds-enter', `ds-enter--${variant}`];
      await act(page, ([id, names]) => DS.motion.replay(document.getElementById(id), ...names), [`enter-${variant}`, classes]);
      await expectTimeline(page.locator(`#enter-${variant}`), `enter-${variant}`);
      await resume(page);
    }
  });

  test('every .ds-leave variant', async ({ page }) => {
    await open(page, `${FIXTURES}motion.html`);
    for (const variant of ['default', 'sink', 'scale', 'slide']) {
      const classes = variant === 'default' ? ['ds-leave'] : ['ds-leave', `ds-leave--${variant}`];
      await act(page, ([id, names]) => DS.motion.replay(document.getElementById(id), ...names), [`leave-${variant}`, classes]);
      await expectTimeline(page.locator(`#leave-${variant}`), `leave-${variant}`);
      await resume(page);
    }
  });

  test('.ds-stagger > *', async ({ page }) => {
    await open(page, `${FIXTURES}motion.html`);
    await act(page, click, '[data-replay="#stagger"]');
    await expectTimeline(page.locator('#stagger'), 'stagger', { subtree: true });
  });

  test('.ds-reveal', async ({ page }) => {
    await open(page, `${FIXTURES}motion.html`);
    await act(page, click, '[data-replay="#reveal"]');
    await expectTimeline(page.locator('#reveal'), 'reveal', { subtree: true });
  });

  test('.ds-collapsible opens and closes', async ({ page }) => {
    await open(page, `${FIXTURES}motion.html`);
    const supported = await page.evaluate(() => CSS.supports('interpolate-size: allow-keywords'));
    test.skip(!supported, 'the collapsible animates only where interpolate-size exists (Chromium)');
    // Chromium runs the height transition on ::details-content but does not
    // list it in getAnimations(): the snapshot holds the declared
    // transition, and the test proves it runs (a height between closed and
    // open two frames after the toggle).
    const details = page.locator('#collapsible');
    const declared = () => details.evaluate((el) => {
      const cs = getComputedStyle(el, '::details-content');
      return ['transition-property', 'transition-duration', 'transition-delay', 'transition-timing-function', 'transition-behavior', 'interpolate-size']
        .map((name) => ({ name, value: name === 'interpolate-size' ? getComputedStyle(el).getPropertyValue(name) : cs.getPropertyValue(name) }));
    });
    // Opening decelerates (two frames show it moving); closing accelerates
    // (--ds-ease-in), so it is read 100ms in.
    const heightAfterToggle = (ms = 0) => details.evaluate((el, wait) => new Promise((resolve) => {
      el.querySelector('summary').click();
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => resolve(parseFloat(getComputedStyle(el, '::details-content').height)), wait)));
    }), ms);
    expect.soft(JSON.stringify(await declared(), null, 2)).toMatchSnapshot('collapsible.json');
    const opening = await heightAfterToggle();
    await page.waitForTimeout(600);
    const full = await details.evaluate((el) => parseFloat(getComputedStyle(el, '::details-content').height));
    expect(opening, 'opening: between closed and open').toBeGreaterThan(0);
    expect(opening).toBeLessThan(full);
    const closing = await heightAfterToggle(100);
    expect(closing, 'closing: between open and closed').toBeGreaterThan(0);
    expect(closing).toBeLessThan(full);
  });
});

/* ── Loaders (feedback.html): infinite loops ───────────────────────── */

test('the spinner, the skeleton, the loading bar and indeterminate progress', async ({ page }) => {
  await open(page, `${FIXTURES}feedback.html`);
  for (const [id, name] of [['spinner', 'spinner'], ['skeleton', 'skeleton'], ['loading', 'loading-bar'], ['progress-indeterminate', 'progress-indeterminate']]) {
    await expectTimeline(page.locator(`#${id}`), name, { subtree: true });
  }
});

/* ── Overlays (styleguide demos) ───────────────────────────────────── */

test.describe('overlays', () => {
  const dialog = (page) => page.locator('body > .ds-dialog');
  const sheet = (page) => page.locator('body > .ds-sheet');

  test('the dialog opens and closes', async ({ page }) => {
    await open(page, STYLEGUIDE);
    await act(page, click, '[data-sg="dialog"]');
    await expectTimeline(dialog(page), 'dialog-open', { subtree: true });
    await resume(page);
    await settle(page);
    await act(page, click, 'body > .ds-dialog .ds-dialog__actions [data-close]');
    await expectTimeline(dialog(page), 'dialog-close', { subtree: true });
  });

  test('the side sheet opens and closes', async ({ page }) => {
    await open(page, STYLEGUIDE);
    await act(page, click, '[data-sg="sheet"]');
    await expectTimeline(sheet(page), 'sheet-open', { subtree: true });
    await resume(page);
    await settle(page);
    await act(page, click, 'body > .ds-sheet .ds-sheet__head [data-close]');
    await expectTimeline(sheet(page), 'sheet-close', { subtree: true });
  });

  test('a snackbar enters and leaves', async ({ page }) => {
    await open(page, STYLEGUIDE);
    await act(page, click, '[data-sg="toast-error"]');
    const toast = page.locator('#sg-toasts > .ds-toast--error');
    await expectTimeline(toast, 'snackbar-enter');
    await resume(page);
    await settle(page);
    await act(page, click, '#sg-toasts > .ds-toast--error .ds-toast__close');
    await expectTimeline(toast, 'snackbar-leave');
  });

  test('the tooltip shows and hides', async ({ page }) => {
    await open(page, STYLEGUIDE);
    // DS.overlay.tooltips() shows it --ds-delay-tooltip after a mouse rests
    // on the trigger: pause the page in the task that unhides it.
    await page.evaluate(() => new Promise((resolve) => {
      const tip = document.querySelector('.ds-tooltip[role="tooltip"]');
      const observer = new MutationObserver(() => {
        if (tip.hidden) return;
        observer.disconnect();
        for (const animation of document.getAnimations()) animation.pause();
        resolve();
      });
      observer.observe(tip, { attributes: true, attributeFilter: ['hidden'] });
      document.querySelector('#overlays [data-tip]').dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
    }));
    const tip = page.locator('.ds-tooltip[role="tooltip"]');
    await expectTimeline(tip, 'tooltip-show');
    await resume(page);
    await settle(page);
    // Escape hides it at once (leaving the trigger waits the hoverable grace).
    await act(page, () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await expectTimeline(tip, 'tooltip-hide');
  });

  test('the combobox list opens and closes', async ({ page }) => {
    await open(page, STYLEGUIDE);
    const popup = page.locator('#selection .ds-combo__popup');
    await act(page, click, '#selection .ds-combo__toggle');
    await expectTimeline(popup, 'combobox-open');
    await resume(page);
    await settle(page);
    await act(page, () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await expectTimeline(popup, 'combobox-close');
  });
});

/* ── Navigation (shell.html) ───────────────────────────────────────── */

test.describe('navigation', () => {
  test('the drawer indicator glides to another item', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await open(page, `${FIXTURES}shell.html`);
    await act(page, click, '#drawer-list .ds-drawer__item[href="#owners"]');
    await expectTimeline(page.locator('#drawer-list > .ds-indicator'), 'drawer-indicator');
  });

  test('the modal drawer opens and closes at 800px', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    await open(page, `${FIXTURES}shell.html`);
    await act(page, click, '#menu');
    await expectTimeline(page.locator('#drawer'), 'modal-drawer-open');
    await expectTimeline(page.locator('#scrim'), 'scrim-open');
    await resume(page);
    await settle(page);
    await act(page, click, '#scrim');
    await expectTimeline(page.locator('#drawer'), 'modal-drawer-close');
    await expectTimeline(page.locator('#scrim'), 'scrim-close');
  });
});
