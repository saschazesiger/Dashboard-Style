/**
 * Known bugs on the fixtures (test/browser/fixtures/), each written as a
 * test of the **correct** behaviour and marked
 * `test.fail(<engines>, '<ids>: fixed in P<n>')`: the ids are those of
 * plans/motion-2/coverage.md, the phase is the one that fixes the bug.
 * Playwright reports such a test as "expected to fail"; once the fix lands
 * the test passes, Playwright reports "expected to fail, but passed", and
 * the fixing phase deletes the marker line and nothing else.
 *
 * Bugs in the styleguide's own demo code live in
 * styleguide-regressions.spec.js. See README.md, "Known bugs: test.fail".
 */
import { test, expect } from '@playwright/test';
import {
  ready, settle, freeze, seek, sample, rafSample, timeline, focusByKeyboard,
  series, expectMonotonic,
} from './helpers/motion.js';

const FIXTURES = '/test/browser/fixtures/';

/** Loads a fixture and waits until its load-time entrances have played. */
async function open(page, name) {
  await page.goto(FIXTURES + name);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/**
 * Adds markup at the end of the fixture's `.ds-theme` wrapper (the
 * embedded-widget path). With `pause`, every animation of the document is
 * paused in the same task (getAnimations() flushes styles, so the entrances
 * the markup starts are there, at their start), so nothing finishes before
 * a later evaluate reads it, however busy the machine is.
 */
function inject(page, html, { pause = false } = {}) {
  return page.evaluate(([markup, hold]) => {
    document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', markup);
    if (hold) for (const animation of document.getAnimations()) animation.pause();
  }, [html, pause]);
}

/** Runs `action(el)` on the element and pauses every animation of the document in the same task, like inject(). */
function act(locator, action) {
  return locator.evaluate((el, source) => {
    new Function('el', `(${source})(el)`)(el);
    for (const animation of document.getAnimations()) animation.pause();
  }, action.toString());
}

/** Plays every animation that act() or inject() paused. */
function resume(page) {
  return page.evaluate(() => {
    for (const animation of document.getAnimations()) if (animation.playState === 'paused') animation.play();
  });
}

/** Waits for two animation frames, so a change has been laid out and painted. */
function frames(page) {
  return page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/**
 * Whether a clipping ancestor cuts into the element's focus ring: the
 * pixels around the focused element, once as they are and once with the
 * clip lifted by `unclip` (a style sheet); equal pixels mean nothing was
 * cut off. The element must already have keyboard focus.
 */
async function ringIsClipped(page, locator, unclip, pad = 8) {
  const box = await locator.boundingBox();
  const clip = { x: Math.floor(box.x - pad), y: Math.floor(box.y - pad), width: Math.ceil(box.width + 2 * pad), height: Math.ceil(box.height + 2 * pad) };
  await frames(page);
  const before = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
  await page.addStyleTag({ content: unclip });
  await frames(page);
  const after = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
  return !before.equals(after);
}

test.describe('fixed in P1', () => {
  test('a delayed spinner plays its entrance once and keeps turning; enter() resolves on animationend', async ({ page }) => {
    await open(page, 'motion.html');
    const spinner = page.locator('#delayed-spinner');
    // Static markup, long after load: only the spinner's own loop is infinite.
    const looping = (await timeline(spinner)).filter((entry) => entry.iterations === Infinity).map((entry) => entry.name);
    expect(looping).toEqual(['ds-spin']);
    // Replayed: the entrance tracks play once.
    await act(spinner, (el) => DS.motion.replay(el, 'ds-enter', 'ds-enter--delayed'));
    const entrance = (await timeline(spinner)).filter((entry) => entry.name !== 'ds-spin');
    expect(entrance.length).toBeGreaterThan(0);
    expect(entrance.map((entry) => entry.iterations)).toEqual(entrance.map(() => 1));
    await resume(page);
    // enter() resolves when the entrance ends (delay plus duration), not on its 1000ms timeout.
    const ms = await spinner.evaluate((el) => {
      const start = performance.now();
      return DS.motion.enter(el, 'delayed').then(() => performance.now() - start);
    });
    expect(ms).toBeLessThan(900);
    // enter() took its classes away, so the spinner turns again: its loop alone, running and advancing.
    expect(await spinner.evaluate((el) => [...el.classList])).toEqual(['ds-spinner']);
    const after = await timeline(spinner);
    expect(after.map((entry) => [entry.name, entry.iterations, entry.playState])).toEqual([['ds-spin', Infinity, 'running']]);
    const turning = await spinner.evaluate((el) => new Promise((resolve) => {
      const [loop] = el.getAnimations();
      const from = Number(loop.currentTime);
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(Number(loop.currentTime) > from)));
    }));
    expect(turning).toBe(true);
  });

  test('a .ds-enter--slide child inside .ds-reveal travels its own distance', async ({ page }) => {
    await open(page, 'motion.html');
    const child = page.locator('#reveal-child');
    const rest = await child.boundingBox();
    const distance = await child.evaluate((el) => {
      const probe = document.createElement('div');
      probe.style.width = 'var(--ds-distance-xl)';
      el.closest('.ds-theme').append(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    });
    expect(distance).toBeGreaterThan(4);
    await act(child, (el) => DS.motion.replay(el, 'ds-enter', 'ds-enter--slide'));
    const [start] = await sample(child, ['rect'], [0]);
    expect(Math.abs(start['rect.x'] - rest.x)).toBeCloseTo(distance, 0);
  });

  test('[hidden] hides a dialog, a sheet and a combobox popup without .ds-base', async ({ page }) => {
    await open(page, 'controls.html');
    await inject(page, `
      <div class="ds-dialog" id="x-dialog" hidden><div class="ds-dialog__backdrop"></div>
        <div class="ds-dialog__box" role="alertdialog" aria-label="Delete"><p class="ds-dialog__text">Delete 3 devices?</p></div></div>
      <div class="ds-sheet" id="x-sheet" hidden><div class="ds-sheet__backdrop"></div>
        <section class="ds-sheet__panel"><div class="ds-sheet__body">LAPTOP-0042</div></section></div>
      <div class="ds-combo"><input class="ds-input ds-combo__input" role="combobox" aria-label="Owner" aria-expanded="false">
        <div class="ds-combo__popup" id="x-popup" hidden><ul class="ds-combo__list" role="listbox">
          <li class="ds-combo__option" role="option"><span class="ds-combo__name">Ada Lovelace</span></li></ul></div></div>`);
    const display = await page.evaluate(() => ['#x-dialog', '#x-sheet', '#x-popup'].map((id) => getComputedStyle(document.querySelector(id)).display));
    expect(display).toEqual(['none', 'none', 'none']);
  });

  test('a click on the dialog backdrop during the exit does not reach the page under it', async ({ page }) => {
    await open(page, 'controls.html');
    await inject(page, `
      <button class="ds-btn" type="button" id="x-under" style="position: fixed; top: 8px; left: 8px">Under the backdrop</button>
      <div class="ds-dialog" id="x-dialog"><div class="ds-dialog__backdrop" data-close></div>
        <div class="ds-dialog__box" role="alertdialog" aria-label="Delete"><p class="ds-dialog__text">Delete 3 devices?</p></div></div>`);
    await page.evaluate(() => {
      window.underClicks = 0;
      document.querySelector('#x-under').addEventListener('click', () => { window.underClicks += 1; });
    });
    await settle(page);
    // The exit has started and is held mid-way.
    await page.evaluate(() => document.querySelector('#x-dialog').classList.add('ds-dialog--closing'));
    await freeze(page);
    await seek(page, { progress: 0.5 });
    await page.mouse.click(30, 20);
    expect(await page.evaluate(() => window.underClicks)).toBe(0);
  });

  test('a tooltip placed far from the page origin grows at its anchor, placed with top/left or a transform and its origin', async ({ page }) => {
    await open(page, 'controls.html');
    // Far from the origin, so a scale that also shrank the offset would show: (1 - .98) x 1000px = 20px.
    await inject(page, `
      <div class="ds-tooltip" role="tooltip" id="x-tip" style="left: 1000px; top: 600px">Copy link</div>
      <div class="ds-tooltip" role="tooltip" id="x-tip-transform"
        style="transform: translate(1000px, 680px); transform-origin: calc(50% + 1000px) calc(50% + 680px)">Copy link</div>`, { pause: true });
    for (const [id, left, top] of [['#x-tip', 1000, 600], ['#x-tip-transform', 1000, 680]]) {
      const tip = page.locator(id);
      const early = await sample(tip, ['rect', 'scale.x'], [{ progress: 0 }, { progress: 0.1 }]);
      // The entrance is really there: it starts below full size.
      expect(early[0]['scale.x'], id).toBeLessThan(1);
      await tip.evaluate((el) => el.getAnimations().forEach((animation) => animation.finish()));
      const rest = await tip.boundingBox();
      expect(rest.x, id).toBeCloseTo(left, 0);
      expect(rest.y, id).toBeCloseTo(top, 0);
      // The centre is where it rests from the first frame (the scale grows it around that centre).
      for (const at of early) {
        expect(Math.abs(at['rect.x'] + at['rect.width'] / 2 - (rest.x + rest.width / 2)), `${id} at ${at.time}`).toBeLessThan(2);
        expect(Math.abs(at['rect.y'] + at['rect.height'] / 2 - (rest.y + rest.height / 2)), `${id} at ${at.time}`).toBeLessThan(2);
      }
    }
  });

  test('reduced motion gives the same timelines (D8: one motion on every device)', async ({ page }) => {
    const collect = async () => {
      await open(page, 'motion.html');
      await inject(page, '<span class="ds-spinner" id="x-spinner" aria-hidden="true"></span>');
      const out = {};
      await act(page.locator('#enter-default'), (el) => DS.motion.replay(el, 'ds-enter'));
      out.enter = await timeline(page.locator('#enter-default'));
      await act(page.locator('#leave-default'), (el) => DS.motion.replay(el, 'ds-leave'));
      out.leave = await timeline(page.locator('#leave-default'));
      out.spinner = await timeline(page.locator('#x-spinner'));
      await inject(page, `<div class="ds-dialog" id="x-dialog"><div class="ds-dialog__backdrop"></div>
        <div class="ds-dialog__box" role="alertdialog" aria-label="Delete"><p class="ds-dialog__text">Delete 3 devices?</p></div></div>`, { pause: true });
      out.dialogOpen = await timeline(page.locator('#x-dialog'), { subtree: true });
      await act(page.locator('#x-dialog'), (el) => el.classList.add('ds-dialog--closing'));
      out.dialogClose = await timeline(page.locator('#x-dialog'), { subtree: true });
      // Timing only: where each animation is right now differs between runs.
      for (const key of Object.keys(out)) {
        out[key] = out[key].map(({ currentTime, playState, ...timing }) => timing);
      }
      return out;
    };
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const full = await collect();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await collect();
    expect(full.enter.length).toBeGreaterThan(0);
    expect(reduced).toEqual(full);
  });
});

test.describe('fixed in P2', () => {
  test('leave(..., { then: "hide" }) followed at once by enter(el, "swap") ends visible', async ({ page }) => {
    await open(page, 'motion.html');
    const result = await page.locator('#leave-default').evaluate(async (el) => {
      const leaving = DS.motion.leave(el, '', { then: 'hide' });
      const entering = DS.motion.enter(el, 'swap');
      await Promise.all([leaving, entering]);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const style = getComputedStyle(el);
      return { hidden: el.hidden, connected: el.isConnected, shown: style.display !== 'none', opacity: style.opacity };
    });
    expect(result).toEqual({ hidden: false, connected: true, shown: true, opacity: '1' });
  });

  test('countUp() called again mid-count never counts backwards', async ({ page }) => {
    await open(page, 'feedback.html');
    const shown = await page.evaluate(async () => {
      const el = document.createElement('span');
      document.querySelector('.ds-theme').append(el);
      const values = [];
      const start = performance.now();
      let again = false;
      DS.motion.countUp(el, 100);
      await new Promise((resolve) => {
        const frame = (now) => {
          values.push(Number(el.textContent.replace(/[^\d.-]/g, '')) || 0);
          if (!again && now - start >= 300) {
            again = true;
            DS.motion.countUp(el, 200);
          }
          if (now - start < 1400) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      return values;
    });
    expectMonotonic(shown, { direction: 'up' });
    expect(shown.at(-1)).toBe(200);
  });

  test('enter() on an SVG path that already carries .ds-enter restarts the entrance', async ({ page }) => {
    await open(page, 'motion.html');
    const running = await page.locator('#svg-path').evaluate(async (el) => {
      el.classList.add('ds-enter');
      await Promise.all(el.getAnimations().map((animation) => animation.finished));
      DS.motion.enter(el);
      return el.getAnimations().filter((animation) => animation.playState === 'running').map((animation) => animation.animationName);
    });
    expect(running).toContain('ds-fade-in');
  });

  test('morphHtml() on an indicator track keeps the .ds-indicator', async ({ page }) => {
    await open(page, 'controls.html');
    const kept = await page.locator('#segmented').evaluate((nav) => {
      // The options as the server renders them, without the indicator the script added.
      const html = [...nav.children].filter((child) => !child.classList.contains('ds-indicator')).map((child) => child.outerHTML).join('');
      DS.dom.morphHtml(nav, html);
      return nav.querySelectorAll(':scope > .ds-indicator').length;
    });
    expect(kept).toBe(1);
  });

  test('morphHtml() keeps the focus and the caret of a focused input', async ({ page }) => {
    await open(page, 'controls.html');
    await inject(page, '<div class="ds-field" id="x-field"><label class="ds-field__label" for="x-name">Name</label>'
      + '<input class="ds-input" id="x-name" value="LAPTOP-0042"><small class="ds-field__hint">As printed on the label.</small></div>');
    const input = page.locator('#x-name');
    await input.focus();
    await input.evaluate((el) => el.setSelectionRange(3, 3));
    const result = await page.evaluate(() => {
      const before = document.activeElement;
      DS.dom.morphHtml(document.querySelector('#x-field'), '<label class="ds-field__label" for="x-name">Name</label>'
        + '<input class="ds-input" id="x-name" value="LAPTOP-0042" aria-invalid="true">'
        + '<small class="ds-field__hint ds-field__hint--error">Already used by LAPTOP-0017.</small>');
      const active = document.activeElement;
      return { same: active === before, id: active.id, start: active.selectionStart, end: active.selectionEnd };
    });
    expect(result).toEqual({ same: true, id: 'x-name', start: 3, end: 3 });
  });
});

test.describe('fixed in P3', () => {
  /** A computed style of the element or one of its pseudo-elements. */
  const styleOf = (locator, property, pseudo = null) => locator.evaluate((el, args) => getComputedStyle(el, args.pseudo).getPropertyValue(args.property), { property, pseudo });

  /** Moves the mouse onto the middle of the element (works on disabled controls too). */
  async function hover(page, locator) {
    const box = await locator.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  }

  test('hovering a disabled chip leaves its state layer alone', async ({ page }) => {
    test.fail(true, 'controls-chip-disabled-hover: fixed in P3');
    await open(page, 'controls.html');
    const chip = page.locator('#chips .ds-chip').filter({ has: page.locator('input:disabled') });
    const body = chip.locator('.ds-chip__body');
    const rest = await styleOf(body, 'opacity', '::before');
    await hover(page, chip);
    await settle(page);
    expect(await styleOf(body, 'opacity', '::before')).toBe(rest);
  });

  test('hovering a disabled switch leaves its handle alone', async ({ page }) => {
    test.fail(true, 'controls-switch-disabled: fixed in P3');
    await open(page, 'controls.html');
    const control = page.locator('.ds-switch').filter({ has: page.locator('#switch-disabled-off') });
    const track = control.locator('.ds-switch__track');
    const rest = await styleOf(track, 'background-color', '::after');
    await hover(page, control);
    await settle(page);
    expect(await styleOf(track, 'background-color', '::after')).toBe(rest);
  });

  test('a field\'s focus ring leaves as one unit on blur', async ({ page }) => {
    test.fail(true, 'controls-form-blur-ghost: fixed in P3');
    await open(page, 'controls.html');
    const field = page.locator('#field-name');
    const rest = await styleOf(field, 'border-top-color');
    await field.focus();
    await settle(page);
    // 50ms into the blur: a primary border without its inset shadow is half a ring.
    const at50 = await field.evaluate((el) => {
      el.blur();
      for (const animation of el.getAnimations()) {
        animation.pause();
        animation.currentTime = 50;
      }
      const style = getComputedStyle(el);
      return { border: style.borderTopColor, shadow: style.boxShadow };
    });
    const halfRing = at50.shadow === 'none' && at50.border !== rest;
    expect(halfRing, `border ${at50.border} without the inset shadow (rest: ${rest})`).toBe(false);
  });

  test('the focus ring of a link in .ds-parts is not clipped', async ({ page }) => {
    test.fail(true, 'controls-list-parts-clip: fixed in P3');
    await open(page, 'controls.html');
    const link = page.locator('#parts a').nth(1);
    await focusByKeyboard(page, link);
    expect(await ringIsClipped(page, link, '.ds-parts { overflow: visible !important; }')).toBe(false);
  });

  test('.ds-link-btn and .ds-errors summary show the --ds-focus ring without .ds-base', async ({ page }) => {
    test.fail(true, 'layout-linkbtn-focus, layout-errors-summary-focus: fixed in P3');
    await open(page, 'controls.html');
    const ring = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.outline = 'var(--ds-focus-outline)';
      document.querySelector('.ds-theme').append(probe);
      const style = getComputedStyle(probe);
      const out = { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
      probe.remove();
      return out;
    });
    expect(ring.style).toBe('solid');
    const outlines = {};
    for (const [name, locator] of [['link button', page.locator('#link-btn')], ['errors summary', page.locator('#errors summary')]]) {
      await focusByKeyboard(page, locator);
      outlines[name] = await locator.evaluate((el) => {
        const style = getComputedStyle(el);
        return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
      });
    }
    expect(outlines).toEqual({ 'link button': ring, 'errors summary': ring });
  });
});

test.describe('fixed in P4', () => {
  test('DS.motion.enter(drawer) slides in along the x axis only', async ({ page }) => {
    test.fail(true, 'layout-drawer-enter-axis, repo-drawer-enter-axis: fixed in P4');
    await page.setViewportSize({ width: 1000, height: 800 });
    await open(page, 'shell.html');
    const drawer = page.locator('#drawer');
    const rest = await drawer.boundingBox();
    await drawer.evaluate((el) => { DS.motion.enter(el); });
    const frames = await sample(drawer, ['rect'], [0, 50, 100, 150, 200, 250, 300]);
    const dx = frames.map((frame) => frame['rect.x'] - rest.x);
    const dy = frames.map((frame) => frame['rect.y'] - rest.y);
    expect(dy.map((value) => Math.round(value))).toEqual(dy.map(() => 0));
    expect(dx[0]).toBeLessThan(-1);
  });

  test('resizing from 1000px to 800px starts no transition on the drawer', async ({ page }) => {
    test.fail(true, 'layout-drawer-resize-slide: fixed in P4');
    await page.setViewportSize({ width: 1000, height: 800 });
    await open(page, 'shell.html');
    // Recorded by event: WebKit runs the transition but does not always list
    // it in getAnimations() a frame later, so polling would miss it there.
    await page.locator('#drawer').evaluate((el) => {
      window.drawerTransitions = [];
      el.addEventListener('transitionrun', (event) => {
        if (event.target === el) window.drawerTransitions.push(event.propertyName);
      });
    });
    await page.setViewportSize({ width: 800, height: 800 });
    await frames(page);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.drawerTransitions)).toEqual([]);
  });

  test('the indicator follows its item when the active label grows and when an earlier item gets a badge', async ({ page }) => {
    test.fail(true, 'controls-indicator-item-resize: fixed in P4');
    await open(page, 'controls.html');
    const offset = (selector) => page.evaluate((active) => {
      const indicator = document.querySelector(`${active.track} > .ds-indicator`).getBoundingClientRect();
      const item = document.querySelector(`${active.track} ${active.item}`).getBoundingClientRect();
      return { x: Math.round(indicator.x - item.x), y: Math.round(indicator.y - item.y), width: Math.round(indicator.width - item.width), height: Math.round(indicator.height - item.height) };
    }, selector);
    const still = { x: 0, y: 0, width: 0, height: 0 };

    // The active label of the fixed-height drawer list grows to three lines.
    const drawer = { track: '#drawer-list', item: '[aria-current="page"]' };
    expect(await offset(drawer)).toEqual(still);
    await page.evaluate(() => {
      document.querySelector('#drawer-list [aria-current="page"] .ds-drawer__label').innerHTML = 'Overview of every<br>building, floor<br>and room';
    });
    await frames(page);
    await settle(page);
    expect(await offset(drawer)).toEqual(still);

    // A fixed-width row: a badge on the first item pushes the active one along.
    await inject(page, `<div id="x-track" style="position: relative; display: flex; gap: 4px; width: 480px">
      <button class="ds-btn ds-btn--sm" type="button" aria-pressed="false">Day</button>
      <button class="ds-btn ds-btn--sm" type="button" aria-pressed="false">Week</button>
      <button class="ds-btn ds-btn--sm" type="button" aria-pressed="true">Month</button></div>`);
    await page.evaluate(() => {
      window.xIndicator = DS.indicator.createIndicator(document.querySelector('#x-track'), { active: '[aria-pressed="true"]', className: 'ds-segmented__indicator' });
    });
    const row = { track: '#x-track', item: '[aria-pressed="true"]' };
    await frames(page);
    expect(await offset(row)).toEqual(still);
    await page.evaluate(() => {
      document.querySelector('#x-track button').insertAdjacentHTML('beforeend', '<span class="ds-status ds-status--warning">12 new</span>');
    });
    await frames(page);
    await settle(page);
    expect(await offset(row)).toEqual(still);
  });
});

test.describe('fixed in P6', () => {
  test('indeterminate to determinate at .3: the bar never passes 30 % and starts at the left edge', async ({ page, browserName }) => {
    // Firefox starts the bar's transform transition from the running segment
    // when the page updates in a frame callback; the others jump to the share.
    test.fail(browserName === 'firefox', 'layout-progress-handoff: fixed in P6');
    await open(page, 'feedback.html');
    const progress = page.locator('#progress-indeterminate');
    const track = await progress.locator('.ds-progress__track').boundingBox();
    // The handoff waits for a fixed part of the loop (40 to 60 % of its
    // cycle, where the segment's right edge is well past 30 %), so it never
    // starts from a segment still off the track. The first share arrives in a
    // render frame, as a page's update loop would apply it. Two things hide
    // Firefox's bug and are avoided: setting the loop's time (so the test
    // waits for the phase instead of seeking it) and reading layout in the
    // frame of the swap (so the guard reads the segment one frame earlier).
    const handoff = await progress.evaluate((el) => new Promise((resolve) => {
      const bar = el.querySelector('.ds-progress__bar');
      const loop = bar.getAnimations()[0];
      const cycle = Number(loop.effect.getComputedTiming().duration);
      let segment = null;
      const frame = () => {
        const phase = (Number(loop.currentTime) % cycle) / cycle;
        if (phase < 0.4 || phase > 0.6) {
          segment = null;
          requestAnimationFrame(frame);
        } else if (segment === null) {
          segment = bar.getBoundingClientRect().right;
          requestAnimationFrame(frame);
        } else {
          el.classList.remove('ds-progress--indeterminate');
          el.style.setProperty('--ds-progress', '0.3');
          resolve({ phase, segment });
        }
      };
      requestAnimationFrame(frame);
    }));
    expect(handoff.segment - track.x, `the segment one frame before the handoff (phase ${handoff.phase}) ends past 30 %`)
      .toBeGreaterThan(0.4 * track.width);
    const frames = await rafSample(progress.locator('.ds-progress__bar'), ['rect'], 600);
    const right = series(frames, 'rect.x').map((x, i) => Math.min(x + frames[i]['rect.width'], track.x + track.width) - track.x);
    const left = series(frames, 'rect.x').map((x) => Math.max(x, track.x) - track.x);
    expect(Math.max(...right)).toBeLessThanOrEqual(0.3 * track.width + 1);
    expect(Math.max(...left)).toBeLessThanOrEqual(1);
  });

  test('a status class change on the live node changes icon and container on the same timing', async ({ page }) => {
    test.fail(true, 'layout-status-data-crossfade: fixed in P6');
    await open(page, 'feedback.html');
    const chip = page.locator('#status-live');
    await page.locator('#status-toggle').click();
    const container = (await timeline(chip)).find((entry) => entry.name === 'background-color');
    expect(container).toBeTruthy();
    const icon = await timeline(chip.locator('svg'));
    expect(icon.map((entry) => [entry.duration, entry.delay])).toContainEqual([container.duration, container.delay]);
  });

  test('the focus ring of a control flush with an open .ds-collapsible is not clipped', async ({ page, browserName }) => {
    // Only Chromium clips: the clipping block is gated on interpolate-size.
    test.fail(browserName === 'chromium', 'core-css-collapsible-clip: fixed in P6');
    await open(page, 'motion.html');
    await page.locator('#collapsible summary').click();
    await settle(page);
    const action = page.locator('#collapsible-action');
    await focusByKeyboard(page, action);
    expect(await ringIsClipped(page, action, '.ds-collapsible::details-content { overflow: visible !important; }')).toBe(false);
  });
});
