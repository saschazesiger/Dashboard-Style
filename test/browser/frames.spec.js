/**
 * Mid-animation frames of today's state (P0 baseline), Chromium only to
 * keep the set small: the overlay entrances and exits (dialog, side sheet
 * at 1280px and 390px, snackbar, tooltip, the combobox list), the drawer entrance
 * and the modal drawer. Each motion is started and paused in the same task,
 * then every animation of the page is seeked to 0, 50 % and the end of its
 * active phase (helpers/motion.js `seek()`) and shot with
 * `animations: 'allow'` ('disabled' would cancel the paused motion). These
 * are the before-images for P4, P5 and P8.
 *
 * While the page is paused, JS timers keep running: the demos' 1000ms
 * settled() timeout and the snackbar's 4s auto-close are dropped for the
 * test (`holdTimers()`), so an exit stays on screen while it is seeked.
 * Seeking a paused CSS animation into its after phase still fires
 * `animationend`, so the end frame of an exit shows what the demo leaves
 * behind (the snackbar removed, the tooltip hidden, the dialog gone).
 *
 * From 1.2.0 also the indicator's glide in the drawer and the segmented
 * switch: its start, the moment the trailing edge follows, halfway and the
 * overshoot frame (in Chromium only: Playwright's WebKit screenshot ends
 * running custom-property transitions).
 */
import { test, expect } from '@playwright/test';
import { ready, settle, seek } from './helpers/motion.js';

const STYLEGUIDE = '/styleguide/index.html';
const FIXTURES = '/test/browser/fixtures/';
const STEPS = [0, 0.5, 1];

test.describe.configure({ timeout: 90000 });

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== 'chromium', 'mid-animation frames are Chromium only, to keep the set small');
});

async function open(page, path) {
  await page.goto(path);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/**
 * Drops the page's 1000ms (settled()) timeouts and the snackbar's
 * auto-close (DS.overlay.toast: 4000ms and up).
 */
function holdTimers(page) {
  return page.evaluate(() => {
    const later = window.setTimeout;
    window.setTimeout = (fn, ms, ...args) => (ms === 1000 || ms >= 4000 ? 0 : later(fn, ms, ...args));
  });
}

/**
 * Runs `action(arg)` in the page and pauses every animation in the same
 * task. Returns when the motion ends: the latest end time (delay plus
 * duration) of its finite animations, in ms.
 */
function act(page, action, arg = null) {
  return page.evaluate(([source, value]) => {
    new Function('arg', `(${source})(arg)`)(value);
    const animations = document.getAnimations();
    for (const animation of animations) animation.pause();
    const ends = animations.map((animation) => animation.effect.getComputedTiming())
      .filter((timing) => Number.isFinite(timing.iterations)).map((timing) => Number(timing.endTime));
    return Math.max(0, ...ends);
  }, [action.toString(), arg]);
}

/** Plays what act() paused. */
function resume(page) {
  return page.evaluate(() => {
    for (const animation of document.getAnimations()) if (animation.playState === 'paused') animation.play();
  });
}

const click = (selector) => document.querySelector(selector).click();

/**
 * Seeks every animation to one time, `ms` (so the tracks of a motion stay
 * in step: a visibility flip at the end of a slide flips at the end, not
 * halfway), and waits two frames, so the paint shows it. Times only move
 * forward after a shot: an animation that reached its after phase and
 * does not fill forwards leaves getAnimations() and cannot be seeked back.
 */
async function at(page, ms) {
  await seek(page, ms);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/** Viewport shots at 0, 50 % and the end of a motion that ends at `end` ms. */
async function frames(page, name, end) {
  for (const step of STEPS) {
    await at(page, step * end);
    await expect.soft(page, `${name} at ${step}`).toHaveScreenshot(`frame-${name}-${step * 100}.png`, { animations: 'allow' });
  }
}

/**
 * Clip shots at 0, 50 % and the end; the clip is the element's box where it
 * rests (`restAt`: 1 for an entrance, measured 1ms before its end; 0 for an
 * exit, whose end frame no longer has the element), plus `pad`, joined
 * with `also` boxes.
 */
async function clipFrames(page, locator, name, end, { pad = 16, also = [], restAt = 1 } = {}) {
  await at(page, restAt ? end - 1 : 0);
  const boxes = [await locator.boundingBox(), ...(await Promise.all(also.map((other) => other.boundingBox())))];
  const x = Math.max(0, Math.floor(Math.min(...boxes.map((b) => b.x)) - pad));
  const y = Math.max(0, Math.floor(Math.min(...boxes.map((b) => b.y)) - pad));
  const viewport = page.viewportSize();
  const clip = {
    x,
    y,
    width: Math.min(viewport.width, Math.ceil(Math.max(...boxes.map((b) => b.x + b.width)) + pad)) - x,
    height: Math.min(viewport.height, Math.ceil(Math.max(...boxes.map((b) => b.y + b.height)) + pad)) - y,
  };
  for (const step of STEPS) {
    await at(page, step * end);
    await expect.soft(page, `${name} at ${step}`).toHaveScreenshot(`frame-${name}-${step * 100}.png`, { clip, animations: 'allow' });
  }
}

/* ── Overlays (styleguide demos) ───────────────────────────────────── */

for (const [width, suffix] of [[1280, ''], [390, '-phone']]) {
  test(`side sheet opens and closes at ${width}px`, async ({ page }) => {
    let end;
    await page.setViewportSize({ width, height: 800 });
    await open(page, STYLEGUIDE);
    await holdTimers(page);
    end = await act(page, click, '[data-sg="sheet"]');
    await frames(page, `sheet-open${suffix}`, end);
    await resume(page);
    await settle(page);
    end = await act(page, click, 'body > .ds-sheet .ds-sheet__head [data-close]');
    await frames(page, `sheet-close${suffix}`, end);
  });
}

test('dialog opens and closes', async ({ page }) => {
  let end;
  await open(page, STYLEGUIDE);
  await holdTimers(page);
  end = await act(page, click, '[data-sg="dialog"]');
  await frames(page, 'dialog-open', end);
  await resume(page);
  await settle(page);
  end = await act(page, click, 'body > .ds-dialog .ds-dialog__actions [data-close]');
  await frames(page, 'dialog-close', end);
});

test('snackbar enters and leaves', async ({ page }) => {
  let end;
  await open(page, STYLEGUIDE);
  await holdTimers(page);
  end = await act(page, click, '[data-sg="toast-error"]');
  const toast = page.locator('#sg-toasts > .ds-toast--error');
  await clipFrames(page, toast, 'snackbar-enter', end);
  await resume(page);
  await settle(page);
  end = await act(page, click, '#sg-toasts > .ds-toast--error .ds-toast__close');
  await clipFrames(page, toast, 'snackbar-leave', end, { restAt: 0 });
});

test('tooltip shows and hides', async ({ page }) => {
  let end;
  await open(page, STYLEGUIDE);
  await holdTimers(page);
  const anchor = page.locator('#overlays [data-tip]').first();
  await anchor.scrollIntoViewIfNeeded();
  // DS.overlay.tooltips() shows it --ds-delay-tooltip after a mouse rests
  // on the trigger: pause in the task that unhides it.
  end = await page.evaluate(() => new Promise((resolve) => {
    const tip = document.querySelector('.ds-tooltip[role="tooltip"]');
    const observer = new MutationObserver(() => {
      if (tip.hidden) return;
      observer.disconnect();
      const animations = document.getAnimations();
      for (const animation of animations) animation.pause();
      resolve(Math.max(0, ...animations.map((animation) => animation.effect.getComputedTiming())
        .filter((timing) => Number.isFinite(timing.iterations)).map((timing) => Number(timing.endTime))));
    });
    observer.observe(tip, { attributes: true, attributeFilter: ['hidden'] });
    document.querySelector('#overlays [data-tip]').dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
  }));
  const tip = page.locator('.ds-tooltip[role="tooltip"]');
  await clipFrames(page, tip, 'tooltip-show', end, { pad: 8, also: [anchor] });
  await resume(page);
  await settle(page);
  // Escape hides it at once (leaving the trigger waits the hoverable grace).
  end = await act(page, () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await clipFrames(page, tip, 'tooltip-hide', end, { pad: 8, also: [anchor], restAt: 0 });
});

test('combobox list grows out of its field', async ({ page }) => {
  let end;
  await open(page, STYLEGUIDE);
  const combo = page.locator('#selection .ds-combo');
  const popup = combo.locator('.ds-combo__popup');
  await combo.scrollIntoViewIfNeeded();
  end = await act(page, click, '#selection .ds-combo__toggle');
  await clipFrames(page, popup, 'combobox-open', end, { also: [combo] });
  await resume(page);
  await settle(page);
  end = await act(page, () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await clipFrames(page, popup, 'combobox-close', end, { also: [combo], restAt: 0 });
});

/* ── Navigation (shell.html) ───────────────────────────────────────── */

test('drawer entrance at 1000px (DS.motion.enter)', async ({ page }) => {
  let end;
  await page.setViewportSize({ width: 1000, height: 800 });
  await open(page, `${FIXTURES}shell.html`);
  await holdTimers(page);
  end = await act(page, () => DS.motion.enter(document.getElementById('drawer')));
  await frames(page, 'drawer-enter', end);
});

test('modal drawer opens and closes at 800px', async ({ page }) => {
  let end;
  await page.setViewportSize({ width: 800, height: 800 });
  await open(page, `${FIXTURES}shell.html`);
  end = await act(page, click, '#menu');
  await frames(page, 'modal-drawer-open', end);
  await resume(page);
  await settle(page);
  end = await act(page, click, '#scrim');
  await frames(page, 'modal-drawer-close', end);
});

/* ── Indicator glides (1.2.0) ──────────────────────────────────────── */

/**
 * Clicks `href` in `track` and pauses every animation in the same task,
 * then shoots the pill at its start, when the trailing edge starts (after
 * --ds-indicator-lag: only the leading edge has moved), halfway and at the
 * frame where the leading edge passes its target furthest (the spring's
 * overshoot, found by seeking in 2ms steps). The references are kept, so a
 * seek goes back as well as forward; every time is before the end, where a
 * paused transition would leave getAnimations().
 */
async function glideFrames(page, track, href, name) {
  const box = await page.locator(track).boundingBox();
  const pad = 12;
  const clip = { x: Math.floor(box.x - pad), y: Math.floor(box.y - pad), width: Math.ceil(box.width + 2 * pad), height: Math.ceil(box.height + 2 * pad) };
  const times = await page.evaluate(([trackSelector, target]) => {
    const element = document.querySelector(trackSelector);
    const indicator = element.querySelector(':scope > .ds-indicator');
    element.querySelector(`[href="${target}"]`).click();
    const animations = document.getAnimations();
    for (const animation of animations) animation.pause();
    window.fxGlide = animations;
    const edges = indicator.getAnimations().filter((animation) => /^--ds-indicator-[trbl]$/.test(animation.transitionProperty));
    const end = Math.max(...edges.map((animation) => Number(animation.effect.getComputedTiming().endTime)));
    const lead = { down: '--ds-indicator-b', up: '--ds-indicator-t', right: '--ds-indicator-r', left: '--ds-indicator-l' }[indicator.dataset.dir];
    let peak = 0;
    let least = Infinity;
    for (let time = 0; time < end - 1; time += 2) {
      for (const animation of animations) animation.currentTime = time;
      const inset = parseFloat(getComputedStyle(indicator).getPropertyValue(lead));
      if (inset < least) {
        least = inset;
        peak = time;
      }
    }
    return { lag: DS.motion.motionDuration(element, '--ds-dur-micro'), half: Math.round(end / 2), peak };
  }, [track, href]);
  for (const [step, time] of [['0', 0], ['lag', times.lag], ['50', times.half], ['peak', times.peak]]) {
    await page.evaluate((ms) => {
      for (const animation of window.fxGlide) animation.currentTime = ms;
      return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }, time);
    // The pill's tint is close to the backdrop: the default colour threshold
    // (0.2) would not see it move, so these shots compare colours closely.
    await expect.soft(page, `${name} at ${step}`).toHaveScreenshot(`frame-${name}-${step}.png`, { clip, animations: 'allow', threshold: 0.02 });
  }
}

test('drawer indicator glides down the list: stretch and overshoot', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await open(page, `${FIXTURES}shell.html`);
  await glideFrames(page, '#drawer-list', '#settings', 'drawer-indicator');
});

test('segmented indicator hops to its neighbour: stretch and overshoot', async ({ page }) => {
  await open(page, `${FIXTURES}controls.html`);
  await page.locator('#segmented').scrollIntoViewIfNeeded();
  await settle(page);
  await glideFrames(page, '#segmented', '#admin', 'segmented-indicator');
});
