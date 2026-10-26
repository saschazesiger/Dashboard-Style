/**
 * Bugs the audit found on the fixtures (test/browser/fixtures/), each
 * written as a test of the **correct** behaviour. From P0 to P7 they were
 * marked `test.fail(<engines>, '<ids>: fixed in P<n>')` with the ids of
 * plans/motion-2/coverage.md; the phase that fixed a bug deleted its
 * marker, so all of them now pass and stay as regression tests. No
 * `test.fail` is left: test/repo.test.js allows only `spike: <capability>`
 * markers, and a bug found later is fixed with its test, not marked.
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
    if (hold) for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
  }, [html, pause]);
}

/** Runs `action(el)` on the element and pauses every animation of the document in the same task, like inject(). */
function act(locator, action) {
  return locator.evaluate((el, source) => {
    new Function('el', `(${source})(el)`)(el);
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
  }, action.toString());
}

/** Plays every animation that act() or inject() paused. */
function resume(page) {
  return page.evaluate(() => {
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) if (animation.playState === 'paused') animation.play();
  });
}

/** Waits for two animation frames, so a change has been laid out and painted. */
function frames(page) {
  return page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/** PNG pixels of a screenshot as [r, g, b, a, ...], decoded by the page itself (no image library in the tests). */
function decode(page, png) {
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return Array.from(context.getImageData(0, 0, image.width, image.height).data);
  }, png.toString('base64'));
}

/**
 * Whether a clipping ancestor cuts into the element's focus ring: the
 * pixels around the focused element, once as they are and once with the
 * clip lifted by `unclip` (a style sheet); nothing was cut off when no
 * pixel changed by more than an anti-aliasing step (lifting a clip may
 * re-rasterise a few edge pixels by a few levels; a cut ring differs by
 * most of the range). The element must already have keyboard focus.
 */
async function ringIsClipped(page, locator, unclip, pad = 8) {
  const box = await locator.boundingBox();
  const clip = { x: Math.floor(box.x - pad), y: Math.floor(box.y - pad), width: Math.ceil(box.width + 2 * pad), height: Math.ceil(box.height + 2 * pad) };
  // The ring snaps in (outline-offset, --ds-dur-fast): compare it at rest.
  await settle(page);
  await frames(page);
  const before = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
  await page.addStyleTag({ content: unclip });
  await frames(page);
  const after = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
  if (before.equals(after)) return false;
  const [a, b] = [await decode(page, before), await decode(page, after)];
  return a.some((value, index) => Math.abs(value - b[index]) > 32);
}

test.describe('fixed in P1', () => {
  test('a delayed spinner plays its entrance once and keeps turning; enter() resolves on animationend', async ({ page }) => {
    await open(page, 'motion.html');
    const spinner = page.locator('#delayed-spinner');
    // Static markup, long after load: only the spinner's own loop is infinite.
    const looping = (await timeline(spinner)).filter((entry) => entry.iterations === Infinity).map((entry) => entry.name);
    expect(looping).toEqual(['ds-spinner-arc', 'ds-spin']);
    // Replayed: the entrance tracks play once.
    await act(spinner, (el) => DS.motion.replay(el, 'ds-enter', 'ds-enter--delayed'));
    const entrance = (await timeline(spinner)).filter((entry) => !['ds-spinner-arc', 'ds-spin'].includes(entry.name));
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
    expect(after.map((entry) => [entry.name, entry.iterations, entry.playState])).toEqual([['ds-spinner-arc', Infinity, 'running'], ['ds-spin', Infinity, 'running']]);
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
    await open(page, 'controls.html');
    const chip = page.locator('#chips .ds-chip').filter({ has: page.locator('input:disabled') });
    const body = chip.locator('.ds-chip__body');
    const rest = await styleOf(body, 'opacity', '::before');
    await hover(page, chip);
    await settle(page);
    expect(await styleOf(body, 'opacity', '::before')).toBe(rest);
  });

  test('hovering a disabled switch leaves its handle alone', async ({ page }) => {
    await open(page, 'controls.html');
    const control = page.locator('.ds-switch').filter({ has: page.locator('#switch-disabled-off') });
    const track = control.locator('.ds-switch__track');
    const rest = await styleOf(track, 'background-color', '::after');
    await hover(page, control);
    await settle(page);
    expect(await styleOf(track, 'background-color', '::after')).toBe(rest);
  });

  test('a field\'s focus ring leaves as one unit on blur', async ({ page }) => {
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
    await open(page, 'controls.html');
    const link = page.locator('#parts a').nth(1);
    await focusByKeyboard(page, link);
    expect(await ringIsClipped(page, link, '.ds-parts { overflow: visible !important; }')).toBe(false);
  });

  test('.ds-link-btn and .ds-errors summary show the --ds-focus ring without .ds-base', async ({ page }) => {
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

  test('resizing from 1000px to 800px does not slide the drawer', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await open(page, 'shell.html');
    // Recorded by event: WebKit runs the transition but does not always list
    // it in getAnimations() a frame later, so polling would miss it there.
    // Chromium starts the transitions in the layout of the new size, before
    // any script runs; the snippet's .ds-drawer--instant (matchMedia change,
    // in the same rendering step) cancels them before the first frame, so
    // every run must be cancelled, none may end, and every frame at the new
    // width already shows the drawer at rest. Firefox and WebKit start none.
    await page.locator('#drawer').evaluate((el) => {
      window.drawerTransitions = [];
      window.drawerFrames = [];
      for (const type of ['transitionrun', 'transitionend', 'transitioncancel']) {
        el.addEventListener(type, (event) => {
          if (event.target === el) window.drawerTransitions.push(`${type} ${event.propertyName}`);
        });
      }
      const frame = () => {
        if (innerWidth <= 900) window.drawerFrames.push(getComputedStyle(el).transform);
        if (window.drawerFrames.length < 12) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await page.setViewportSize({ width: 800, height: 800 });
    await frames(page);
    await page.waitForTimeout(300);
    const events = await page.evaluate(() => window.drawerTransitions);
    const runs = events.filter((event) => event.startsWith('transitionrun ')).map((event) => event.split(' ')[1]).sort();
    const cancels = events.filter((event) => event.startsWith('transitioncancel ')).map((event) => event.split(' ')[1]).sort();
    expect(events.filter((event) => event.startsWith('transitionend '))).toEqual([]);
    expect(cancels).toEqual(runs);
    const rest = await page.locator('#drawer').evaluate((el) => getComputedStyle(el).transform);
    expect(rest).not.toBe('none');
    const seen = await page.evaluate(() => window.drawerFrames);
    expect(seen.length).toBeGreaterThan(3);
    expect(seen).toEqual(seen.map(() => rest));
  });

  test('the indicator follows its item when the active label grows and when an earlier item gets a badge', async ({ page }) => {
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
  test('indeterminate to determinate at .3: the bar grows from the left edge to 30 %, the segments stop and fade', async ({ page }) => {
    await open(page, 'feedback.html');
    const progress = page.locator('#progress-indeterminate');
    // The first share arrives in a render frame (as a page's update loop
    // would apply it), at a fixed part of the loop where segment 1 runs well
    // past 30 % (40 to 60 % of its cycle). Every animation is paused in that
    // task, and only the transitions are then seeked: the loops stay where
    // they stopped.
    const handoff = await progress.evaluate((el) => new Promise((resolve) => {
      const track = el.querySelector('.ds-progress__track');
      const loop = track.getAnimations().find((animation) => animation.animationName === 'ds-progress-head');
      const cycle = Number(loop.effect.getComputedTiming().duration);
      const frame = () => {
        const phase = (Number(loop.currentTime) % cycle) / cycle;
        if (phase < 0.4 || phase > 0.6) {
          requestAnimationFrame(frame);
          return;
        }
        const head = parseFloat(getComputedStyle(track).getPropertyValue('--ds-progress-head-1'));
        el.classList.remove('ds-progress--indeterminate');
        el.style.setProperty('--ds-progress', '0.3');
        const state = getComputedStyle(track).animationPlayState;
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
        resolve({ phase, head, state });
      };
      requestAnimationFrame(frame);
    }));
    expect(handoff.head, `segment 1 ends past 30 % at the handoff (phase ${handoff.phase})`).toBeGreaterThan(40);
    // The segments' loops stop where they are.
    expect(handoff.state.split(/,\s*/)).toEqual(['paused', 'paused']);
    const samples = await progress.evaluate((el) => {
      const track = el.querySelector('.ds-progress__track');
      const bar = el.querySelector('.ds-progress__bar');
      const transitions = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).filter((animation) => animation.transitionProperty);
      // The visible part of the bar from its clip (inset(top right bottom left round r)).
      const inset = () => {
        const parts = getComputedStyle(bar).clipPath.replace(/^inset\(|\)$/g, '').split(' round ')[0].replace(/calc\(|\)/g, '').trim().split(/\s+/);
        const edges = [parts[0], parts[1] ?? parts[0], parts[2] ?? parts[0], parts[3] ?? parts[1] ?? parts[0]];
        return edges.map((value) => (value.endsWith('%') ? parseFloat(value) / 100 : parseFloat(value) / bar.getBoundingClientRect().width));
      };
      const out = [];
      for (let t = 0; t <= 700; t += 10) {
        for (const animation of transitions) animation.currentTime = t;
        const [, right, , left] = inset();
        out.push({
          t,
          share: parseFloat(getComputedStyle(el).getPropertyValue('--ds-progress')),
          right: 1 - right,
          left,
          bar: Number(getComputedStyle(bar).opacity),
          segment: Number(getComputedStyle(track, '::before').opacity),
          head: parseFloat(getComputedStyle(track).getPropertyValue('--ds-progress-head-1')),
        });
      }
      return { out, names: transitions.map((animation) => animation.transitionProperty).sort() };
    });
    expect(samples.names).toEqual(expect.arrayContaining(['--ds-progress', 'opacity']));
    const { out } = samples;
    // The bar: from the left edge, growing to 30 % and never past it.
    for (const entry of out) {
      expect(entry.left, JSON.stringify(entry)).toBeLessThanOrEqual(0.001);
      expect(entry.right, JSON.stringify(entry)).toBeLessThanOrEqual(0.3 + 0.001);
    }
    expect(out[0].right).toBeLessThan(0.01);
    expectMonotonic(out.map((entry) => entry.right), { direction: 'up', tolerance: 1e-4 });
    expect(out.at(-1).right).toBeCloseTo(0.3, 3);
    // It fades in while the segments, stopped where they were, fade out.
    expectMonotonic(out.map((entry) => entry.bar), { direction: 'up' });
    expect(out.at(-1).bar).toBe(1);
    expectMonotonic(out.map((entry) => entry.segment), { direction: 'down' });
    expect(out[0].segment).toBeGreaterThan(0.9);
    expect(out.at(-1).segment).toBe(0);
    // Stopped (a pause lands on the next frame in some engines: within a few percent of the handoff), then still.
    expect(Math.abs(out[0].head - handoff.head)).toBeLessThan(5);
    for (const entry of out) expect(entry.head).toBeCloseTo(out[0].head, 3);
  });

  test('a status class change on the live node changes icon and container on the same timing', async ({ page }) => {
    await open(page, 'feedback.html');
    const chip = page.locator('#status-live');
    // The change, a read of every style (Chromium starts an SVG glyph's
    // transition only once the glyph's own style is read) and a pause of
    // everything in one task: the 250ms transitions are still there when
    // the timelines are read, however busy the machine is.
    await page.locator('#status-toggle').evaluate((el) => {
      el.click();
      for (const node of document.querySelectorAll('.ds-theme *')) void getComputedStyle(node).color;
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
    });
    const container = (await timeline(chip)).find((entry) => entry.name === 'background-color');
    expect(container).toBeTruthy();
    const icon = await timeline(chip.locator('svg'));
    expect(icon.map((entry) => [entry.duration, entry.delay])).toContainEqual([container.duration, container.delay]);
  });

  test('the focus ring of a control flush with an open .ds-collapsible is not clipped', async ({ page }) => {
    // Only Chromium clips (the clipping block is gated on interpolate-size);
    // overflow-clip-margin lets the ring show past the content edge.
    await open(page, 'motion.html');
    await page.locator('#collapsible summary').click();
    await settle(page);
    const action = page.locator('#collapsible-action');
    await focusByKeyboard(page, action);
    expect(await ringIsClipped(page, action, '.ds-collapsible::details-content { overflow: visible !important; }')).toBe(false);
  });
});

test.describe('fixed in 1.6.1', () => {
  /** A keyed table row with the documented row menu in it; `menu` puts the menu in the row. */
  const ROW = `function row(status, { menu = true, hidden = true, expanded = 'false' } = {}) {
    return '<tr data-ds-key="r1"><td>LAPTOP-0042</td><td class="fx-status">' + status + '</td><td>'
      + '<button class="ds-btn ds-btn--quiet" type="button" id="row-trigger" aria-haspopup="menu" aria-expanded="' + expanded + '" aria-controls="row-menu">More</button>'
      + (menu ? '<div class="ds-menu" role="menu" id="row-menu" aria-labelledby="row-trigger"' + (hidden ? ' hidden' : '') + '>'
        + '<button class="ds-menu__item" role="menuitem" type="button" id="row-a">Rename</button>'
        + '<button class="ds-menu__item" role="menuitem" type="button" id="row-b">Retire</button></div>' : '')
      + '</td></tr>';
  }`;

  /** Adds the table (and, without `inRow`, the menu at the end of .ds-theme) and defines window.row and window.liveUpdate. */
  async function table(page, inRow) {
    await inject(page, `<table class="ds-table"><tbody id="rows"></tbody></table>${inRow ? '' : '<div class="ds-menu" role="menu" id="row-menu" aria-labelledby="row-trigger" hidden><button class="ds-menu__item" role="menuitem" type="button" id="row-a">Rename</button></div>'}`);
    await page.evaluate(([source, menu]) => {
      window.row = new Function(`${source}; return row;`)();
      window.inRow = menu;
      const rows = document.getElementById('rows');
      DS.dom.morphHtml(rows, window.row('online', { menu }));
      // The documented live update: a polled re-render through flip() and morphHtml().
      window.liveUpdate = (status, options = {}) => {
        DS.motion.flip(rows, (hooks) => DS.dom.morphHtml(rows, window.row(status, { menu, ...options }), hooks), { items: 'tr', live: true });
        return new Promise((resolve) => setTimeout(resolve, 50));
      };
    }, [ROW, inRow]);
  }

  const menuState = (page) => page.evaluate(() => {
    const menu = document.getElementById('row-menu');
    return {
      status: document.querySelector('#rows .fx-status').textContent,
      hidden: menu.hidden,
      state: menu.getAttribute('data-state'),
      expanded: document.getElementById('row-trigger').getAttribute('aria-expanded'),
      focusInMenu: menu.contains(document.activeElement),
    };
  });

  test('a live re-render keeps a row menu opened by DS.overlay open, focused and marked expanded', async ({ page }) => {
    await open(page, 'overlay.html');
    await table(page, true);
    await page.evaluate(() => DS.overlay.open(document.getElementById('row-menu'), { opener: document.getElementById('row-trigger') }));
    expect(await menuState(page)).toEqual({ status: 'online', hidden: false, state: 'open', expanded: 'true', focusInMenu: true });
    await page.evaluate(() => window.liveUpdate('offline'));
    expect(await menuState(page)).toEqual({ status: 'offline', hidden: false, state: 'open', expanded: 'true', focusInMenu: true });
    // Closed, the template decides again: a template that shows the menu shows it.
    await page.evaluate(() => DS.overlay.close(document.getElementById('row-menu')));
    expect(await menuState(page)).toMatchObject({ hidden: true, state: null, expanded: 'false' });
    await page.evaluate(() => window.liveUpdate('online', { hidden: false, expanded: 'true' }));
    expect(await menuState(page)).toMatchObject({ status: 'online', hidden: false, state: null, expanded: 'true' });
  });

  test('a live re-render keeps aria-expanded on the in-row trigger of a menu at the end of .ds-theme', async ({ page }) => {
    await open(page, 'overlay.html');
    await table(page, false);
    await page.evaluate(() => DS.overlay.open(document.getElementById('row-menu'), { opener: document.getElementById('row-trigger') }));
    await page.evaluate(() => window.liveUpdate('offline'));
    expect(await menuState(page)).toEqual({ status: 'offline', hidden: false, state: 'open', expanded: 'true', focusInMenu: true });
    await page.evaluate(() => DS.overlay.close(document.getElementById('row-menu')));
    await page.evaluate(() => window.liveUpdate('online', { expanded: 'true' }));
    expect(await menuState(page)).toMatchObject({ status: 'online', hidden: true, expanded: 'true' });
  });

  test('a re-render keeps the busy face of busy() and then its success face', async ({ page }) => {
    await open(page, 'overlay.html');
    await inject(page, '<ul id="jobs"></ul>');
    const result = await page.evaluate(async () => {
      const jobs = document.getElementById('jobs');
      const render = (extra = '') => DS.dom.morphHtml(jobs, `<li data-ds-key="j1"><button class="ds-btn ds-btn--tonal" type="button" id="save"${extra}><span class="ds-btn__faces"><span class="ds-btn__face">Save</span><span class="ds-btn__face ds-btn__face--done" aria-hidden="true">Saved</span></span></button></li>`);
      // A done face (2.0: busy() shows the success face only on a button that has one).
      render();
      const button = document.getElementById('save');
      const seen = {};
      let finish;
      const work = DS.motion.busy(button, new Promise((resolve) => { finish = resolve; }));
      render();
      seen.busy = [button === document.getElementById('save'), button.getAttribute('aria-busy')];
      finish('saved');
      seen.result = await work;
      render();
      seen.done = button.classList.contains('ds-btn--done');
      // Once the success face ended, the template decides again.
      await new Promise((resolve) => setTimeout(resolve, DS.motion.motionDuration(button, '--ds-hold-success') + 100));
      seen.after = button.classList.contains('ds-btn--done');
      render(' aria-busy="true"');
      seen.template = button.getAttribute('aria-busy');
      return seen;
    });
    expect(result).toEqual({ busy: [true, 'true'], result: 'saved', done: true, after: false, template: 'true' });
  });

  test('a removed open dialog releases the scroll lock, the inert page and the Escape key', async ({ page }) => {
    await open(page, 'overlay.html');
    const after = (id) => page.evaluate(async (which) => {
      const element = document.getElementById(which);
      await DS.overlay.open(element, { opener: document.getElementById('open-dialog') });
      const before = { locked: document.body.classList.contains('ds-no-scroll'), inert: document.getElementById('page').inert || element.tagName === 'DIALOG' };
      element.remove();
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      document.body.dispatchEvent(escape);
      return { before, locked: document.body.classList.contains('ds-no-scroll'), inert: document.getElementById('page').inert, escapeTaken: escape.defaultPrevented, focus: document.activeElement?.id ?? null };
    }, id);
    for (const id of ['native', 'dialog']) {
      const result = await after(id);
      expect(result, id).toMatchObject({ before: { locked: true, inert: true }, locked: false, inert: false, escapeTaken: false });
    }
    // The next overlay locks and releases as usual.
    await page.evaluate(() => DS.overlay.open(document.getElementById('sheet')));
    expect(await page.evaluate(() => document.body.classList.contains('ds-no-scroll'))).toBe(true);
    await page.evaluate(() => DS.overlay.close(document.getElementById('sheet')));
    expect(await page.evaluate(() => [document.body.classList.contains('ds-no-scroll'), document.getElementById('page').inert])).toEqual([false, false]);
  });

  test('a contained dialog traps only inside its container: the page around it stays usable and scrolls', async ({ page }) => {
    await open(page, 'overlay.html');
    // A widget panel at the top of the page, before the host's own content.
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('afterbegin', `<section id="widget" style="position: relative; height: 320px">
        <button class="ds-btn" type="button" id="w-open">Delete</button><p id="w-text">Widget content</p>
        <div class="ds-dialog ds-dialog--contained" id="w-dialog" hidden><div class="ds-dialog__backdrop" data-close></div>
          <div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="w-title"><h2 class="ds-dialog__title" id="w-title">Delete?</h2>
          <div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" id="w-cancel" data-close>Cancel</button></div></div></div></section>`);
      window.hostClicks = 0;
      document.getElementById('open-native').addEventListener('click', (event) => { window.hostClicks += 1; event.stopImmediatePropagation(); }, { capture: true });
    });
    await page.locator('#w-open').focus();
    await page.evaluate(() => DS.overlay.open(document.getElementById('w-dialog'), { opener: document.getElementById('w-open') }));
    const state = await page.evaluate(() => ({
      page: document.getElementById('page').inert,
      text: document.getElementById('w-text').inert,
      trigger: document.getElementById('w-open').inert,
      locked: document.body.classList.contains('ds-no-scroll'),
      focus: document.activeElement.id,
    }));
    expect(state).toEqual({ page: false, text: true, trigger: true, locked: false, focus: 'w-cancel' });
    await page.locator('#open-native').click();
    expect(await page.evaluate(() => window.hostClicks)).toBe(1);
    await page.locator('#w-cancel').focus();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('w-dialog').hidden);
    expect(await page.evaluate(() => [document.activeElement.id, document.getElementById('w-text').inert])).toEqual(['w-open', false]);
  });

  test('a menu opened from a trigger with a tooltip stays anchored once the tooltip has gone, and the other way round', async ({ page }) => {
    await open(page, 'popups.html');
    const anchoring = await page.evaluate(() => typeof HTMLElement.prototype.showPopover === 'function' && CSS.supports('position-area: block-end') && 'anchorName' in document.documentElement.style);
    test.skip(!anchoring, 'needs popover and CSS anchor positioning (the shared anchor-name)');
    await page.evaluate(() => {
      document.getElementById('trigger').setAttribute('data-tip', 'More actions');
      DS.overlay.tooltips(document);
    });
    const tip = page.locator('.ds-tooltip');
    const placed = () => page.evaluate(() => {
      const trigger = document.getElementById('trigger');
      const menu = document.getElementById('menu');
      const t = trigger.getBoundingClientRect();
      const m = menu.getBoundingClientRect();
      return { name: trigger.style.getPropertyValue('anchor-name'), below: Math.abs(m.top - t.bottom) <= 12, menuOpen: menu.getAttribute('data-state') };
    });
    // The tooltip shows, then the menu opens from the same trigger and the tooltip fades out.
    await page.locator('#trigger').hover();
    await expect(tip).toHaveAttribute('data-state', 'open');
    await page.evaluate(() => DS.overlay.open(document.getElementById('menu'), { opener: document.getElementById('trigger') }));
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').hidden);
    await frames(page);
    expect(await placed()).toEqual({ name: expect.stringMatching(/^--ds-anchor-\d+$/), below: true, menuOpen: 'open' });
    // The other way round: the menu closes while the tooltip shows.
    await page.mouse.move(1, 1);
    await page.locator('#trigger').hover();
    await expect(tip).toHaveAttribute('data-state', 'open');
    await page.evaluate(() => DS.overlay.close(document.getElementById('menu')));
    await frames(page);
    const kept = await page.evaluate(() => {
      const trigger = document.getElementById('trigger');
      const tooltip = document.querySelector('.ds-tooltip');
      const t = trigger.getBoundingClientRect();
      const r = tooltip.getBoundingClientRect();
      return { name: trigger.style.getPropertyValue('anchor-name'), anchor: tooltip.style.getPropertyValue('position-anchor'), near: Math.min(Math.abs(r.top - t.bottom), Math.abs(t.top - r.bottom)) <= 16 };
    });
    expect(kept.name).toMatch(/^--ds-anchor-\d+$/);
    expect(kept).toEqual({ name: kept.name, anchor: kept.name, near: true });
    // Neither uses it any more: the name goes (the close gave focus back to the trigger, which holds a tooltip too).
    await page.evaluate(() => document.activeElement?.blur());
    await page.mouse.move(1, 1);
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').hidden);
    expect(await page.evaluate(() => document.getElementById('trigger').style.getPropertyValue('anchor-name'))).toBe('');
  });

  for (const [from, to] of [[1000, 800], [800, 1000]]) {
    test(`a page that drives the drawer through DS.overlay, without the snippet: resizing from ${from}px to ${to}px before any open does not slide it`, async ({ page }) => {
      await page.setViewportSize({ width: from, height: 800 });
      await open(page, 'shell-overlay.html');
      await page.locator('#drawer').evaluate((el) => {
        window.drawerTransitions = [];
        for (const type of ['transitionrun', 'transitionend', 'transitioncancel']) {
          el.addEventListener(type, (event) => {
            if (event.target === el) window.drawerTransitions.push(`${type} ${event.propertyName}`);
          });
        }
      });
      await page.setViewportSize({ width: to, height: 800 });
      await frames(page);
      await page.waitForTimeout(400);
      const events = await page.evaluate(() => window.drawerTransitions);
      expect(events.filter((event) => event.startsWith('transitionend '))).toEqual([]);
      expect(await page.locator('#drawer').evaluate((el) => el.classList.contains('ds-drawer--instant'))).toBe(false);
    });
  }

  test('the errors list keeps its bullets under a layered reset that removes list styles', async ({ page }) => {
    await open(page, 'reset-layered.html');
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = '@layer reset { ol, ul, menu { list-style: none; margin: 0; padding: 0; } }';
      document.head.prepend(style);
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', '<details class="ds-errors" open id="errors"><summary>2 errors</summary><ul><li>Name is required</li><li>Owner is required</li></ul></details>');
    });
    expect(await page.evaluate(() => [...document.querySelectorAll('#errors ul, #errors li')].map((el) => getComputedStyle(el).listStyleType))).toEqual(['disc', 'disc', 'disc']);
  });
});

test.describe('fixed in 1.6.1 (final review)', () => {
  /** Paused animations of the document (not scroll-driven ones). */
  const PAUSE_ALL = "for (const a of document.getAnimations().filter((x) => !window.ScrollTimeline || !(x.timeline instanceof ScrollTimeline))) a.pause();";

  test('table rows that glide through flip() are opaque, a selected row keeps its colour, and the backing goes once they landed', async ({ page }) => {
    await open(page, 'overlay.html');
    await inject(page, '<section class="ds-card" id="t-card"><div class="ds-table-wrap"><table class="ds-table"><tbody id="t-rows"></tbody></table></div></section>');
    const mid = await page.evaluate((pause) => {
      const rows = document.getElementById('t-rows');
      const html = (order) => order.map((n) => `<tr data-ds-key="r${n}"${n === 2 ? ' class="ds-table__row--selected"' : ''}><td><input type="checkbox"${n === 2 ? ' checked' : ''} aria-label="Select"></td><td>LAPTOP-00${40 + n}</td><td>${n * 10}%</td></tr>`).join('');
      DS.dom.morphHtml(rows, html([1, 2, 3, 4]));
      document.getElementById('t-card').scrollIntoView({ block: 'center' });
      window.glide = DS.motion.flip(rows, (options) => DS.dom.morphHtml(rows, html([4, 3, 2, 1]), options), { items: 'tr' });
      // Frozen in the task that started the glide: the rows stand at their old places.
      new Function(pause)();
      const card = getComputedStyle(document.getElementById('t-card')).backgroundColor;
      const moving = [...rows.children].filter((tr) => tr.getAnimations().some((a) => a.id === 'ds-flip'));
      return {
        glide: rows.hasAttribute('data-ds-glide'),
        backdrop: rows.style.getPropertyValue('--ds-flip-backdrop'),
        card,
        moving: moving.length,
        images: moving.map((tr) => ({ selected: tr.classList.contains('ds-table__row--selected'), image: getComputedStyle(tr).backgroundImage })),
      };
    }, PAUSE_ALL);
    expect(mid.glide).toBe(true);
    expect(mid.backdrop).toBe(mid.card);
    expect(mid.card).toBe('rgb(255, 255, 255)');
    expect(mid.moving).toBe(4);
    for (const row of mid.images) {
      const layers = row.image.match(/linear-gradient\(/g) ?? [];
      // A solid backing in the card's colour; a selected row its colour over it.
      expect(row.image, JSON.stringify(row)).toContain(mid.card);
      expect(layers.length, JSON.stringify(row)).toBe(row.selected ? 2 : 1);
    }
    await resume(page);
    await page.evaluate(() => window.glide);
    expect(await page.evaluate(() => {
      const rows = document.getElementById('t-rows');
      return { glide: rows.hasAttribute('data-ds-glide'), backdrop: rows.style.getPropertyValue('--ds-flip-backdrop'), image: getComputedStyle(rows.firstElementChild).backgroundImage, isolation: rows.style.isolation };
    })).toEqual({ glide: false, backdrop: '', image: 'none', isolation: '' });
  });

  test('an overlay moved into a native sheet goes back to its place when the page removes the sheet, and opens again', async ({ page }) => {
    await open(page, 'overlay.html');
    for (const closeFirst of [false, true]) {
      const result = await page.evaluate(async (closing) => {
        const sheet = document.getElementById('native-sheet');
        const dialog = document.getElementById('dialog');
        const home = dialog.parentNode;
        const next = dialog.nextSibling;
        const spare = sheet.cloneNode(true);
        await DS.overlay.open(sheet, { opener: document.getElementById('open-native-sheet') });
        await DS.overlay.open(dialog, { opener: document.getElementById('native-sheet-close') });
        const adopted = sheet.contains(dialog);
        if (closing) DS.overlay.close(dialog);
        sheet.replaceWith(spare);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const back = { adopted, home: dialog.parentNode === home && dialog.nextSibling === next, hidden: dialog.hidden, state: dialog.getAttribute('data-state'), locked: document.body.classList.contains('ds-no-scroll') };
        await DS.overlay.open(dialog, { opener: document.getElementById('open-dialog') });
        back.reopened = !dialog.hidden && dialog.getAttribute('data-state') === 'open';
        await DS.overlay.close(dialog);
        return back;
      }, closeFirst);
      expect(result, `close() first: ${closeFirst}`).toEqual({ adopted: true, home: true, hidden: true, state: null, locked: false, reopened: true });
    }
  });

  test('a native dialog and a menu moved into a removed native sheet both go back, and neither stays on the Escape stack', async ({ page }) => {
    await open(page, 'overlay.html');
    const result = await page.evaluate(async () => {
      const sheet = document.getElementById('native-sheet');
      const native = document.getElementById('native');
      const menu = document.getElementById('menu');
      const homes = [native.parentNode, menu.parentNode];
      await DS.overlay.open(sheet);
      await DS.overlay.open(native);
      await DS.overlay.open(menu, { opener: document.getElementById('native-ok') });
      const adopted = [sheet.contains(native), native.contains(menu)];
      sheet.remove();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      document.body.dispatchEvent(escape);
      return {
        adopted,
        home: [native.parentNode === homes[0], menu.parentNode === homes[1]],
        open: [native.open, !menu.hidden],
        states: [native.getAttribute('data-state'), menu.getAttribute('data-state')],
        escapeTaken: escape.defaultPrevented,
        locked: document.body.classList.contains('ds-no-scroll'),
      };
    });
    expect(result).toEqual({ adopted: [true, true], home: [true, true], open: [false, false], states: [null, null], escapeTaken: false, locked: false });
  });

  test('a modal drawer the page replaces while it is open leaves its frame closed and usable', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await open(page, 'shell-overlay.html');
    const result = await page.evaluate(async () => {
      const app = document.getElementById('app');
      const drawer = document.getElementById('drawer');
      await DS.overlay.open(drawer, { opener: document.getElementById('menu') });
      const before = app.hasAttribute('data-drawer-open');
      const fresh = drawer.cloneNode(true);
      drawer.replaceWith(fresh);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const after = { open: app.hasAttribute('data-drawer-open'), locked: document.body.classList.contains('ds-no-scroll') };
      // The scrim fades out and stops covering the page.
      const scrim = document.getElementById('scrim');
      await DS.motion.settled(scrim, { transitions: true });
      await new Promise((resolve) => setTimeout(resolve, DS.motion.motionDuration(scrim, '--ds-dur-base') + 50));
      after.scrim = getComputedStyle(scrim).visibility;
      after.covered = document.elementFromPoint(500, 400) === scrim;
      await DS.overlay.open(fresh, { opener: document.getElementById('menu') });
      after.reopened = app.hasAttribute('data-drawer-open');
      await DS.overlay.close(fresh);
      after.closed = !app.hasAttribute('data-drawer-open');
      return { before, after };
    });
    expect(result).toEqual({ before: true, after: { open: false, locked: false, scrim: 'hidden', covered: false, reopened: true, closed: true } });
  });

  test('a contained dialog leaves Escape to the host page outside its container', async ({ page }) => {
    await open(page, 'overlay.html');
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('afterbegin', `<input type="search" id="host-search" value="hello" aria-label="Search">
        <dialog id="host-dialog"><input id="host-dialog-input" aria-label="Name"></dialog>
        <section id="widget" class="ds-theme" style="position: relative; height: 320px">
        <button class="ds-btn" type="button" id="w-open">Delete</button>
        <div class="ds-dialog ds-dialog--contained" id="w-dialog" hidden><div class="ds-dialog__backdrop" data-close></div>
          <div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="w-title"><h2 class="ds-dialog__title" id="w-title">Delete?</h2>
          <div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" id="w-cancel" data-close>Cancel</button></div></div></div></section>`);
      window.escapes = [];
      window.addEventListener('keydown', (event) => { if (event.key === 'Escape') window.escapes.push(event.defaultPrevented); });
    });
    const widgetOpen = () => page.evaluate(() => !document.getElementById('w-dialog').hidden && document.getElementById('w-dialog').getAttribute('data-state') === 'open');
    await page.evaluate(() => DS.overlay.open(document.getElementById('w-dialog'), { opener: document.getElementById('w-open') }));
    // (a) The host's own modal dialog closes on Escape; the widget's stays open.
    await page.evaluate(() => {
      document.getElementById('host-dialog').showModal();
      document.getElementById('host-dialog-input').focus();
    });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('host-dialog').open);
    expect(await widgetOpen()).toBe(true);
    // (b) Escape in a host field is the field's: not prevented, the widget's dialog stays open.
    await page.locator('#host-search').focus();
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => window.escapes)).toEqual([false, false]);
    expect(await widgetOpen()).toBe(true);
    // (c) Inside the container the key closes the contained dialog.
    await page.locator('#w-cancel').focus();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('w-dialog').hidden);
    expect(await page.evaluate(() => window.escapes.at(-1))).toBe(true);
  });

  test('cards, dialogs, side sheets and tables of a widget without .ds-base set their own ink over a dark host page', async ({ page }) => {
    await open(page, 'reset-layered.html');
    const inks = await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = 'body { font: 18px/1.6 Georgia, serif; background: #121212; color: #e8e8e8; }';
      document.head.append(style);
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', `
        <section class="ds-card" id="ink-card"><p id="ink-card-p">Plain text</p><ul class="ds-kv-list"><li><span>Owner</span><strong id="ink-kv">Ada Lovelace</strong></li></ul>
          <div class="ds-table-wrap"><table class="ds-table"><tbody><tr><td id="ink-td">Printer</td></tr></tbody></table></div></section>
        <button class="ds-card ds-card--interactive" type="button" id="ink-button-card"><span id="ink-button-text">Open</span></button>
        <div class="ds-dialog" id="ink-dialog"><div class="ds-dialog__box"><p id="ink-dialog-p">Body</p></div></div>
        <div class="ds-sheet" id="ink-sheet"><div class="ds-sheet__panel"><div class="ds-sheet__body"><p id="ink-sheet-p">Body</p></div></div></div>`);
      const text = getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue('--ds-text').trim();
      const probe = document.createElement('span');
      probe.style.color = text;
      document.querySelector('.ds-theme').append(probe);
      const want = getComputedStyle(probe).color;
      probe.remove();
      const got = Object.fromEntries(['ink-card-p', 'ink-kv', 'ink-td', 'ink-button-text', 'ink-dialog-p', 'ink-sheet-p'].map((id) => [id, getComputedStyle(document.getElementById(id)).color]));
      return { want, got };
    });
    expect(inks.want).not.toBe('rgb(232, 232, 232)');
    for (const [id, colour] of Object.entries(inks.got)) expect(colour, id).toBe(inks.want);
  });

  test('the external icon after a link in a table cell and in a facts value stays on the text line under a layered preflight', async ({ page }) => {
    await open(page, 'reset-layered.html');
    const lines = await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = '@layer reset { img, svg, video { display: block; vertical-align: middle; } }';
      document.head.prepend(style);
      const icon = DS.icons.icon(DS.icons.external, 16);
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', `
        <div class="ds-table-wrap" style="width: 400px"><table class="ds-table"><tbody><tr><td><a href="#t" id="icon-td">#42${icon}</a></td></tr></tbody></table></div>
        <dl class="ds-facts" style="width: 400px"><div><dt>Ticket</dt><dd><a href="#f" id="icon-facts">#42${icon}</a></dd></div></dl>`);
      return ['icon-td', 'icon-facts'].map((id) => {
        const link = document.getElementById(id);
        const range = document.createRange();
        range.selectNodeContents(link.firstChild);
        const text = range.getBoundingClientRect();
        const svg = link.querySelector('svg').getBoundingClientRect();
        return { id, display: getComputedStyle(link.querySelector('svg')).display, sameLine: svg.top < text.bottom && svg.bottom > text.top, after: svg.left >= text.right - 0.5 };
      });
    });
    for (const line of lines) expect(line).toEqual({ id: line.id, display: 'inline-block', sameLine: true, after: true });
  });

  test('drawers and snackbar regions of a frame the page dropped are not kept alive', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forces garbage collection through the Chromium DevTools protocol');
    await open(page, 'overlay.html');
    const cdp = await page.context().newCDPSession(page);
    const alive = async (mode) => {
      await page.evaluate(async (which) => {
        window.refs = [];
        const host = document.createElement('div');
        document.querySelector('.ds-theme').append(host);
        for (let i = 0; i < 20; i += 1) {
          host.replaceChildren();
          host.insertAdjacentHTML('beforeend', '<div class="ds-app"><nav class="ds-drawer"></nav><div class="ds-toasts"></div></div>');
          const drawer = host.querySelector('.ds-drawer');
          const region = host.querySelector('.ds-toasts');
          if (which === 'drawer') await DS.overlay.close(drawer);
          if (which === 'toast') {
            const message = DS.overlay.toast(region, 'Saved');
            message.close();
            await message.closed;
          }
          window.refs.push(new WeakRef(which === 'toast' ? region : drawer));
        }
        host.remove();
        // The frames and timers still pending (an announcer's next frame, an exit's end) run first.
        await new Promise((resolve) => setTimeout(resolve, 500));
      }, mode);
      for (let i = 0; i < 3; i += 1) await cdp.send('HeapProfiler.collectGarbage');
      return page.evaluate(() => window.refs.filter((ref) => ref.deref()).length);
    };
    expect(await alive('none'), 'control: nothing called').toBe(0);
    expect(await alive('drawer'), 'DS.overlay.close(drawer)').toBe(0);
    expect(await alive('toast'), 'DS.overlay.toast(region)').toBe(0);
  });
});

test.describe('fixed in 1.6.1 (final review, second pass)', () => {
  test('a re-render of the view around an open dialog keeps the snackbar region it took in; closing gives it back', async ({ page }) => {
    await open(page, 'overlay.html');
    const result = await page.evaluate(async () => {
      const theme = document.querySelector('.ds-theme');
      const view = (text) => `<div class="ds-dialog" id="r-dialog" hidden><div class="ds-dialog__backdrop" data-close></div>
        <div class="ds-dialog__box" role="dialog" aria-modal="true" aria-labelledby="r-title"><h2 class="ds-dialog__title" id="r-title">${text}</h2>
        <div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" id="r-cancel" data-close>Cancel</button></div></div></div>`;
      theme.insertAdjacentHTML('beforeend', `<section id="r-view">${view('Edit the device')}</section><div class="ds-toasts" id="r-toasts" style="--ds-toast-left: 40px"></div><p id="r-after">After</p>`);
      const region = document.getElementById('r-toasts');
      const dialog = document.getElementById('r-dialog');
      const home = { parent: region.parentNode, left: region.style.getPropertyValue('--ds-toast-left') };
      await DS.overlay.open(dialog, { opener: document.getElementById('open-dialog') });
      const hosted = dialog.contains(region) && region.hasAttribute('data-ds-keep');
      // A poll re-renders the view that holds the open dialog.
      DS.dom.morphHtml(document.getElementById('r-view'), view('Edit the device (synced)'));
      const kept = { connected: region.isConnected, inDialog: dialog.contains(region), open: dialog.getAttribute('data-state'), title: document.getElementById('r-title').textContent };
      const message = DS.overlay.toast(region, 'Could not save.', { kind: 'error' });
      await DS.motion.settled(message.element ?? region.lastElementChild);
      const shown = [...document.querySelectorAll('#r-toasts .ds-toast')].filter((toast) => toast.getClientRects().length).length;
      const announced = [...document.querySelectorAll('[aria-live]')].some((node) => node.textContent.includes('Could not save.'));
      await DS.overlay.close(dialog);
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        hosted,
        kept,
        shown,
        announced,
        // Back at its place, with its announcers right after it.
        back: region.parentNode === home.parent && (() => {
          let next = region.nextElementSibling;
          while (next?.hasAttribute('aria-live')) next = next.nextElementSibling;
          return next?.id === 'r-after';
        })(),
        left: region.style.getPropertyValue('--ds-toast-left') === home.left,
        // The page's region loses the mark it had while away; the announcers
        // are DS runtime nodes and keep theirs (1.6.2).
        keep: region.hasAttribute('data-ds-keep'),
        announcers: [...document.querySelectorAll('#r-toasts ~ .ds-sr[aria-live]')].map((node) => node.hasAttribute('data-ds-keep')),
      };
    });
    expect(result).toEqual({
      hosted: true,
      kept: { connected: true, inDialog: true, open: 'open', title: 'Edit the device (synced)' },
      shown: 1,
      announced: true,
      back: true,
      left: true,
      keep: false,
      announcers: [true, true],
    });
  });

  test('a re-render of an open native dialog keeps the snackbar region and an adopted menu', async ({ page }) => {
    await open(page, 'overlay.html');
    const result = await page.evaluate(async () => {
      const theme = document.querySelector('.ds-theme');
      theme.insertAdjacentHTML('beforeend', '<div class="ds-toasts" id="r-toasts"></div>');
      const region = document.getElementById('r-toasts');
      const native = document.getElementById('native');
      const menu = document.getElementById('menu');
      const markup = native.innerHTML;
      const menuHome = menu.parentNode;
      await DS.overlay.open(native, { opener: document.getElementById('open-native') });
      await DS.overlay.open(menu, { opener: document.getElementById('native-ok') });
      const adopted = native.contains(menu) && native.contains(region);
      DS.dom.morphHtml(native, markup);
      const kept = { menu: menu.isConnected && native.contains(menu), menuOpen: menu.getAttribute('data-state'), region: region.isConnected && native.contains(region) };
      await DS.overlay.close(menu);
      await DS.overlay.close(native);
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        adopted,
        kept,
        home: menu.parentNode === menuHome && region.parentNode === theme,
        keep: [menu, region].some((node) => node.hasAttribute('data-ds-keep')),
      };
    });
    expect(result).toEqual({ adopted: true, kept: { menu: true, menuOpen: 'open', region: true }, home: true, keep: false });
  });

  test('two copies of ds.js share the Escape stack, the scroll lock and the numbering of tooltip ids', async ({ page }) => {
    await open(page, 'overlay.html');
    await page.evaluate(async () => {
      // A widget's own copy, of another version (the one on the page keeps window.DS).
      const source = await (await fetch('/dist/ds.js')).text();
      const script = document.createElement('script');
      script.textContent = source.replace(/var version = '[^']+';/, "var version = 'widget';");
      document.head.append(script);
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', `<section id="w-root"><button class="ds-btn" type="button" id="w-open">Widget</button>
        <button class="ds-btn" type="button" id="w-tip" data-tip="Widget tip">Tip</button>
        <dialog class="ds-dialog" id="w-dialog" aria-labelledby="w-title"><div class="ds-dialog__backdrop" data-close></div>
        <div class="ds-dialog__box"><h2 class="ds-dialog__title" id="w-title">Widget</h2><div class="ds-dialog__actions">
        <button class="ds-btn ds-btn--text" type="button" id="w-cancel" data-close>Cancel</button></div></div></dialog></section>`);
    });
    const state = () => page.evaluate(() => ({
      host: document.getElementById('dialog').getAttribute('data-state'),
      widget: document.getElementById('w-dialog').getAttribute('data-state'),
      locked: document.body.classList.contains('ds-no-scroll'),
    }));
    expect(await page.evaluate(() => typeof window.DashboardStyle.versions.widget?.overlay.open)).toBe('function');
    // The host's copy opens its div dialog, the widget's copy its native dialog over it.
    await page.evaluate(async () => {
      await DS.overlay.open(document.getElementById('dialog'), { opener: document.getElementById('open-dialog') });
      await window.DashboardStyle.versions.widget.overlay.open(document.getElementById('w-dialog'), { opener: document.getElementById('w-open') });
    });
    expect(await state()).toEqual({ host: 'open', widget: 'open', locked: true });
    // Escape closes the topmost layer (the widget's), not the host's under it; the lock holds.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('w-dialog').open);
    await settle(page);
    expect(await state()).toEqual({ host: 'open', widget: null, locked: true });
    // Closed by its own copy while the host's is open: the lock still holds, until the last one closes.
    await page.evaluate(() => window.DashboardStyle.versions.widget.overlay.open(document.getElementById('w-dialog'), { opener: document.getElementById('w-open') }));
    await page.evaluate(() => window.DashboardStyle.versions.widget.overlay.close(document.getElementById('w-dialog')));
    expect((await state()).locked).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('dialog').hidden);
    expect(await state()).toEqual({ host: null, widget: null, locked: false });
    // Tooltip ids never repeat across the copies.
    const ids = await page.evaluate(() => {
      DS.overlay.tooltips(document.getElementById('page'));
      window.DashboardStyle.versions.widget.overlay.tooltips(document.getElementById('w-root'));
      return [...document.querySelectorAll('.ds-tooltip')].map((tip) => tip.id);
    });
    expect(ids.length).toBe(2);
    expect(new Set(ids).size).toBe(2);
  });

  test('tooltips on nested roots serve a trigger once: the innermost root shows it; a second call on a root returns its handle', async ({ page }) => {
    await open(page, 'overlay.html');
    const handles = await page.evaluate(() => {
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', '<section id="n-root"><button class="ds-btn" type="button" id="n-tip" data-tip="Widget tip">Tip</button></section>');
      const outer = DS.overlay.tooltips(document);
      const again = DS.overlay.tooltips(document);
      DS.overlay.tooltips(document.getElementById('n-root'));
      return { same: outer === again, tips: document.querySelectorAll('.ds-tooltip').length };
    });
    expect(handles).toEqual({ same: true, tips: 2 });
    await page.locator('#n-tip').hover();
    await page.waitForFunction(() => [...document.querySelectorAll('.ds-tooltip')].some((tip) => tip.getAttribute('data-state') === 'open'));
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => ({
      open: [...document.querySelectorAll('.ds-tooltip')].filter((tip) => tip.getAttribute('data-state') === 'open' && !tip.hidden).length,
      describedBy: document.getElementById('n-tip').getAttribute('aria-describedby')?.split(' ').length ?? 0,
    }))).toEqual({ open: 1, describedBy: 1 });
  });

  test('without popover, a menu and a tooltip under a transformed host ancestor sit at their trigger', async ({ page }) => {
    await open(page, 'popups.html');
    await page.evaluate(() => {
      // The script's placement (no popover, no anchor positioning).
      delete HTMLElement.prototype.showPopover;
      document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin', `<div id="xf" style="transform: translateZ(0); margin: 48px 0 0 51px; padding: 12px; width: 600px">
        <button class="ds-btn" type="button" id="xf-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="xf-menu">Actions</button>
        <button class="ds-btn" type="button" id="xf-tip" data-tip="Copy the link">Copy</button>
        <div class="ds-menu" role="menu" id="xf-menu" aria-labelledby="xf-trigger" hidden>
          <button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__label">Edit</span></button></div></div>`);
    });
    await page.evaluate(() => DS.overlay.open(document.getElementById('xf-menu'), { opener: document.getElementById('xf-trigger') }));
    await settle(page);
    const menu = await page.evaluate(() => {
      const t = document.getElementById('xf-trigger').getBoundingClientRect();
      const m = document.getElementById('xf-menu').getBoundingClientRect();
      return { dx: Math.round(m.left - t.left), dy: Math.round(m.top - t.bottom) };
    });
    expect(Math.abs(menu.dx), JSON.stringify(menu)).toBeLessThanOrEqual(1);
    expect(menu.dy, JSON.stringify(menu)).toBeGreaterThanOrEqual(0);
    expect(menu.dy, JSON.stringify(menu)).toBeLessThanOrEqual(8);
    await page.evaluate(() => DS.overlay.close(document.getElementById('xf-menu')));
    await page.evaluate(() => DS.overlay.tooltips(document.getElementById('xf')));
    await page.locator('#xf-tip').hover();
    await page.waitForFunction(() => document.querySelector('#xf .ds-tooltip, .ds-tooltip[data-state="open"]')?.getAttribute('data-state') === 'open');
    await settle(page);
    const tip = await page.evaluate(() => {
      const t = document.getElementById('xf-tip').getBoundingClientRect();
      const r = [...document.querySelectorAll('.ds-tooltip')].find((node) => node.getAttribute('data-state') === 'open').getBoundingClientRect();
      return { centre: Math.round((r.left + r.right) / 2 - (t.left + t.right) / 2), gap: Math.round(r.top - t.bottom) };
    });
    expect(Math.abs(tip.centre), JSON.stringify(tip)).toBeLessThanOrEqual(1);
    expect(tip.gap, JSON.stringify(tip)).toBeGreaterThanOrEqual(0);
    expect(tip.gap, JSON.stringify(tip)).toBeLessThanOrEqual(12);
  });

  test('Enter pressed again and again on a focused action keeps at most one pending blur listener', async ({ page }) => {
    await open(page, 'overlay.html');
    await page.evaluate(() => {
      DS.ripple.attach(document);
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', '<button class="ds-btn" type="button" id="b-step">Next</button>');
      const button = document.getElementById('b-step');
      window.blurs = new Set();
      const add = button.addEventListener.bind(button);
      const remove = button.removeEventListener.bind(button);
      button.addEventListener = (type, listener, options) => { if (type === 'blur') window.blurs.add(listener); add(type, listener, options); };
      button.removeEventListener = (type, listener, options) => { if (type === 'blur') window.blurs.delete(listener); remove(type, listener, options); };
      button.focus();
    });
    for (let press = 0; press < 20; press += 1) await page.keyboard.press('Enter');
    expect(await page.evaluate(() => window.blurs.size)).toBeLessThanOrEqual(1);
    await page.evaluate(() => document.getElementById('b-step').blur());
    expect(await page.evaluate(() => window.blurs.size)).toBe(0);
  });

  test('moving the sort to another column keeps every column where it was', async ({ page }) => {
    await open(page, 'data.html');
    const lefts = await page.evaluate(() => {
      const arrow = () => DS.icons.icon(DS.icons.arrowUp, 16, 'ds-table__sort-arrow');
      const head = (sorted) => `<tr>${['Device', 'Owner', 'Load'].map((name) => `<th scope="col"${name === 'Load' ? ' class="ds-num"' : ''}${name === sorted ? ' aria-sort="ascending"' : ''}><button class="ds-table__sort" type="button">${name}${name === sorted ? ` ${arrow()}` : ''}</button></th>`).join('')}</tr>`;
      const body = [['LAPTOP-0042', 'Ada Lovelace', '12'], ['DESKTOP-0107', 'Grace Hopper', '7']].map((row) => `<tr>${row.map((cell, index) => `<td${index === 2 ? ' class="ds-num"' : ''}>${cell}</td>`).join('')}</tr>`).join('');
      document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin', `<div class="ds-table-wrap" style="width: 720px"><table class="ds-table" id="s-table"><thead id="s-head">${head('Device')}</thead><tbody>${body}</tbody></table></div>`);
      const read = () => [...document.querySelectorAll('#s-head th')].map((th) => Math.round(th.getBoundingClientRect().left));
      const out = [read()];
      for (const sorted of ['Owner', 'Load', 'Device']) {
        DS.dom.morphHtml(document.getElementById('s-head'), head(sorted));
        out.push(read());
      }
      return out;
    });
    for (const row of lefts.slice(1)) expect(row).toEqual(lefts[0]);
  });
});

test.describe('fixed in 1.6.2', () => {
  /**
   * An open shadow root on a host at the end of <body>: ds.css loads inside
   * it, `markup` sits in its .ds-theme (positioned, so a contained dialog
   * covers it). window.wroot is the shadow root.
   */
  function shadowWidget(page, markup) {
    return page.evaluate(async (html) => {
      const host = document.createElement('div');
      host.id = 'shadow-host';
      document.body.append(host);
      const root = host.attachShadow({ mode: 'open' });
      root.innerHTML = `<link rel="stylesheet" href="/dist/ds.css"><div class="ds-theme" id="w-theme" style="position: relative; min-height: 320px">${html}</div>`;
      const link = root.querySelector('link');
      if (!link.sheet) await new Promise((resolve) => link.addEventListener('load', resolve, { once: true }));
      window.wroot = root;
    }, markup);
  }

  test('in a shadow root: morphHtml keeps the focused field, leave() moves focus out, Escape and close() work for a contained dialog', async ({ page }) => {
    await open(page, 'overlay.html');
    await shadowWidget(page, '<div id="w-list"><input class="ds-input" id="q" aria-label="Search" value="ab"></div>'
      + '<div id="w-panel"><button class="ds-btn" type="button" id="w-in">Assign</button></div>'
      + '<button class="ds-btn" type="button" id="w-open">Delete</button>'
      + '<div class="ds-dialog ds-dialog--contained" id="w-dialog" hidden><div class="ds-dialog__backdrop" data-close></div>'
      + '<div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-label="Delete?"><div class="ds-dialog__actions">'
      + '<button class="ds-btn ds-btn--text" type="button" id="w-cancel" data-close>Cancel</button></div></div></div>');
    const morph = await page.evaluate(() => {
      const field = wroot.getElementById('q');
      field.focus();
      field.value = 'abc';
      field.setSelectionRange(1, 1);
      DS.dom.morphHtml(wroot.getElementById('w-list'), '<input class="ds-input" id="q" aria-label="Search" value="ab ">');
      const now = wroot.getElementById('q');
      return { same: now === field, value: now.value, caret: now.selectionStart, focused: wroot.activeElement === now };
    });
    expect(morph).toEqual({ same: true, value: 'abc', caret: 1, focused: true });
    const left = await page.evaluate(async () => {
      const panel = wroot.getElementById('w-panel');
      wroot.getElementById('w-in').focus();
      const leaving = DS.motion.leave(panel, '', { then: 'keep' });
      const sameTask = { inside: panel.contains(wroot.activeElement), inert: panel.inert };
      await leaving;
      DS.motion.cancel(panel);
      return sameTask;
    });
    expect(left).toEqual({ inside: false, inert: true });
    await page.evaluate(() => {
      wroot.getElementById('w-open').focus();
      DS.overlay.open(wroot.getElementById('w-dialog'), { opener: wroot.getElementById('w-open') });
    });
    await page.waitForFunction(() => wroot.getElementById('w-dialog').getAttribute('data-state') === 'open');
    expect(await page.evaluate(() => wroot.activeElement?.id)).toBe('w-cancel');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => wroot.getElementById('w-dialog').hidden);
    expect(await page.evaluate(() => wroot.activeElement?.id), 'focus back on the opener').toBe('w-open');
    // close() by hand, focus inside: back on the opener too, never <body>.
    await page.evaluate(() => DS.overlay.open(wroot.getElementById('w-dialog'), { opener: wroot.getElementById('w-open') }));
    await page.waitForFunction(() => wroot.getElementById('w-dialog').getAttribute('data-state') === 'open');
    await page.evaluate(() => DS.overlay.close(wroot.getElementById('w-dialog')));
    await page.waitForFunction(() => wroot.getElementById('w-dialog').hidden);
    expect(await page.evaluate(() => [document.activeElement?.id, wroot.activeElement?.id])).toEqual(['shadow-host', 'w-open']);
  });

  /** Defines <x-icon> and <x-field>: web components with an open shadow root (an inner span, an inner input). */
  function defineWebComponents(page) {
    return page.evaluate(() => {
      if (customElements.get('x-icon')) return;
      customElements.define('x-icon', class extends HTMLElement {
        connectedCallback() {
          if (this.shadowRoot) return;
          this.attachShadow({ mode: 'open' }).innerHTML = '<span style="display: inline-block; width: 16px; height: 16px; background: currentColor"></span>';
        }
      });
      customElements.define('x-field', class extends HTMLElement {
        connectedCallback() {
          if (this.shadowRoot) return;
          this.attachShadow({ mode: 'open' }).innerHTML = '<input aria-label="Reason">';
        }
      });
    });
  }

  test('a press on a web component inside a menu item or the trigger counts as inside the menu', async ({ page }) => {
    await open(page, 'overlay.html');
    await defineWebComponents(page);
    await page.evaluate(() => {
      document.getElementById('menu-b').prepend(document.createElement('x-icon'));
      document.getElementById('open-menu').prepend(document.createElement('x-icon'));
      window.fxLog = [];
      document.getElementById('menu-b').addEventListener('click', () => window.fxLog.push('item-click'));
    });
    const openMenu = async () => {
      await page.click('#open-menu');
      await page.waitForFunction(() => document.getElementById('menu').getAttribute('data-state') === 'open');
    };
    await openMenu();
    await page.locator('#menu-b x-icon span').click();
    expect(await page.evaluate(() => window.fxLog), 'the item ran: the press was inside the menu').toEqual(['item-click']);
    await page.evaluate(() => DS.overlay.close(document.getElementById('menu')));
    await page.waitForFunction(() => document.getElementById('menu').hidden);
    await openMenu();
    // The trigger's icon toggles the menu closed (the page's handler), and the outside press does not reopen it.
    await page.locator('#open-menu x-icon span').click();
    await page.waitForFunction(() => document.getElementById('menu').hidden);
    await settle(page);
    expect(await page.evaluate(() => ({ hidden: document.getElementById('menu').hidden, expanded: document.getElementById('open-menu').getAttribute('aria-expanded') })))
      .toEqual({ hidden: true, expanded: 'false' });
  });

  test('Escape in a field inside a web component inside a contained dialog in a shadow root closes the dialog', async ({ page }) => {
    await open(page, 'overlay.html');
    await defineWebComponents(page);
    await shadowWidget(page, '<button class="ds-btn" type="button" id="w-open">Retire</button>'
      + '<div class="ds-dialog ds-dialog--contained" id="w-dialog" hidden><div class="ds-dialog__backdrop" data-close></div>'
      + '<div class="ds-dialog__box" role="dialog" aria-modal="true" aria-label="Retire"><x-field id="w-reason"></x-field><div class="ds-dialog__actions">'
      + '<button class="ds-btn ds-btn--text" type="button" id="w-cancel" data-close>Cancel</button></div></div></div>');
    await page.evaluate(() => DS.overlay.open(wroot.getElementById('w-dialog'), { opener: wroot.getElementById('w-open') }));
    await page.waitForFunction(() => wroot.getElementById('w-dialog').getAttribute('data-state') === 'open');
    await page.evaluate(() => wroot.getElementById('w-reason').shadowRoot.querySelector('input').focus());
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => wroot.getElementById('w-dialog').hidden);
    expect(await page.evaluate(() => wroot.activeElement?.id)).toBe('w-open');
  });

  test('a div dialog in a shadow root makes the host page inert too, and Tab stays in it', async ({ page }) => {
    await open(page, 'overlay.html');
    await shadowWidget(page, '<button class="ds-btn" type="button" id="w-open">Delete</button>'
      + '<div class="ds-dialog" id="w-dialog" hidden><div class="ds-dialog__backdrop" data-close></div>'
      + '<div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-label="Delete?"><div class="ds-dialog__actions">'
      + '<button class="ds-btn ds-btn--text" type="button" id="w-cancel" data-close>Cancel</button>'
      + '<button class="ds-btn ds-btn--primary" type="button" id="w-ok" data-close>Delete</button></div></div></div>');
    // A host-page button after the widget, too.
    await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<p id="after-host"><button type="button" id="after-host-btn">Help</button></p>'));
    await page.evaluate(() => DS.overlay.open(wroot.getElementById('w-dialog'), { opener: wroot.getElementById('w-open') }));
    await page.waitForFunction(() => wroot.getElementById('w-dialog').getAttribute('data-state') === 'open');
    const inert = () => page.evaluate(() => ({
      page: !!document.getElementById('open-dialog').closest('[inert]'),
      after: !!document.getElementById('after-host-btn').closest('[inert]'),
      opener: !!wroot.getElementById('w-open').closest('[inert]'),
    }));
    expect(await inert()).toEqual({ page: true, after: true, opener: true });
    const stops = [];
    for (const key of [...Array(4).fill('Tab'), ...Array(4).fill('Shift+Tab')]) {
      await page.keyboard.press(key);
      stops.push(await page.evaluate(() => {
        const active = document.activeElement;
        // <body> stands for the browser's own UI between the last and the first stop.
        if (!active || active === document.body) return 'inside';
        if (active.id === 'shadow-host') return wroot.getElementById('w-dialog').contains(wroot.activeElement) ? 'inside' : `widget:${wroot.activeElement?.id}`;
        return active.id || active.tagName;
      }));
    }
    expect(stops).toEqual(stops.map(() => 'inside'));
    await page.evaluate(() => DS.overlay.close(wroot.getElementById('w-dialog')));
    await page.waitForFunction(() => wroot.getElementById('w-dialog').hidden && !wroot.getElementById('w-dialog').hasAttribute('data-state'));
    expect(await inert()).toEqual({ page: false, after: false, opener: false });
  });

  test('an element the page adds next to an open div sheet joins its trap, and is free again after the close', async ({ page }) => {
    await open(page, 'overlay.html');
    await page.evaluate(() => DS.overlay.open(document.getElementById('sheet'), { opener: document.getElementById('open-sheet') }));
    await page.waitForFunction(() => document.getElementById('sheet').getAttribute('data-state') === 'open');
    // A host script appends a banner to <body> while the sheet is open; the trap learns of it before the next frame.
    const late = await page.evaluate(async () => {
      document.body.insertAdjacentHTML('beforeend', '<p id="late"><button type="button" id="late-btn">Chat</button></p>');
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return !!document.getElementById('late-btn').closest('[inert]');
    });
    expect(late).toBe(true);
    const stops = [];
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      stops.push(await page.evaluate(() => {
        const active = document.activeElement;
        return !active || active === document.body || document.getElementById('sheet').contains(active) ? 'inside' : active.id || active.tagName;
      }));
    }
    expect(stops).toEqual(stops.map(() => 'inside'));
    await page.evaluate(() => DS.overlay.close(document.getElementById('sheet')));
    await page.waitForFunction(() => document.getElementById('sheet').hidden && !document.getElementById('sheet').hasAttribute('data-state'));
    expect(await page.evaluate(() => [...document.querySelectorAll('[inert]')].map((el) => el.id || el.className))).toEqual([]);
  });

  test('a page dialog leaves the snackbar region of a nested widget theme in the widget', async ({ page }) => {
    await open(page, 'overlay.html');
    await page.evaluate(() => {
      document.getElementById('page').insertAdjacentHTML('beforeend', '<div class="ds-toasts" id="page-toasts"></div>'
        + '<style>.ds-theme.my-widget { --ds-font: Georgia, serif; }</style>'
        + '<div class="ds-theme my-widget" id="widget"><div class="ds-toasts" id="widget-toasts"></div></div>');
      DS.overlay.toast(document.getElementById('widget-toasts'), 'Widget ready', { persistent: true });
    });
    const read = () => page.evaluate(() => ({
      widget: document.getElementById('widget-toasts').parentElement.id,
      page: document.getElementById('page-toasts').parentElement.id,
      font: getComputedStyle(document.querySelector('#widget-toasts .ds-toast')).fontFamily.split(',')[0].replace(/"/g, ''),
    }));
    await page.click('#open-native');
    await page.waitForFunction(() => document.getElementById('native').getAttribute('data-state') === 'open');
    expect(await read()).toEqual({ widget: 'widget', page: 'native', font: 'Georgia' });
    const shown = await page.evaluate(() => !!DS.overlay.toast(document.getElementById('widget').querySelector('.ds-toasts'), 'Synced').el);
    expect(shown, 'the widget still finds its region in its own root').toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('native').open && !document.getElementById('native').hasAttribute('data-state'));
    expect(await read()).toEqual({ widget: 'widget', page: 'page', font: 'Georgia' });
  });

  test('in a shadow root: tooltips() and ripple.attach() take the shadow root', async ({ page }) => {
    await open(page, 'overlay.html');
    await shadowWidget(page, '<button class="ds-btn" type="button" id="w-btn">Export</button>'
      + '<button class="ds-btn ds-btn--icon" type="button" id="w-tip" aria-label="Copy" data-tip="Copy the link">C</button>');
    const handles = await page.evaluate(() => {
      const errors = [];
      let tips = null;
      let ripples = null;
      try { tips = DS.overlay.tooltips(wroot); } catch (error) { errors.push(String(error)); }
      try { ripples = DS.ripple.attach(wroot); } catch (error) { errors.push(String(error)); }
      return {
        errors,
        tooltip: !!wroot.querySelector('#w-theme > .ds-tooltip'),
        again: !!tips && DS.overlay.tooltips(wroot) === tips && DS.ripple.attach(wroot) === ripples,
        marked: wroot.getElementById('w-theme').classList.contains('ds-ripples'),
      };
    });
    expect(handles).toEqual({ errors: [], tooltip: true, again: true, marked: true });
    const button = page.locator('#w-btn');
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    expect(await page.evaluate(() => wroot.querySelectorAll('#w-btn .ds-press-ripple').length)).toBe(1);
    await page.mouse.up();
    await page.mouse.move(1, 1);
    // Keyboard focus on the trigger shows the tooltip, inside the shadow root.
    await page.evaluate(() => wroot.getElementById('w-btn').focus());
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => wroot.querySelector('.ds-tooltip')?.getAttribute('data-state') === 'open');
    expect(await page.evaluate(() => wroot.querySelector('.ds-tooltip').textContent)).toBe('Copy the link');
  });

  test('css/properties.css in the host document registers what a shadow root cannot: a registered hook glides again', async ({ page }) => {
    await open(page, 'motion.html');
    // The host page without ds.css: the registrations of the shadow root's own ds.css do not apply.
    await page.evaluate(() => { for (const link of document.querySelectorAll('link[rel="stylesheet"]')) link.remove(); });
    await shadowWidget(page, '');
    // A fresh element each time: registered, the hook computes to its initial 0px and a new value transitions.
    const glides = () => page.evaluate(() => {
      const pill = document.createElement('span');
      pill.style.transition = '--ds-indicator-t 1s linear';
      wroot.getElementById('w-theme').append(pill);
      const start = getComputedStyle(pill).getPropertyValue('--ds-indicator-t').trim();
      pill.style.setProperty('--ds-indicator-t', '10px');
      const count = pill.getAnimations().length;
      pill.remove();
      return { registered: start === '0px', count };
    });
    expect(await glides()).toEqual({ registered: false, count: 0 });
    await page.evaluate(async () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/dist/css/properties.css';
      const loaded = new Promise((resolve) => link.addEventListener('load', resolve, { once: true }));
      document.head.append(link);
      await loaded;
    });
    expect(await glides()).toEqual({ registered: true, count: 1 });
  });

  test('a div dialog, a contained dialog and a div side sheet inside a card take no rhythm margin', async ({ page }) => {
    await open(page, 'reset-layered.html');
    const result = await page.evaluate(async () => {
      document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin', `<section class="ds-card" id="m-card" style="position: relative">
        <h2 class="ds-card__title">Devices</h2><button class="ds-btn" type="button" id="m-open">Delete</button>
        <div class="ds-dialog ds-dialog--contained" id="m-contained" hidden><div class="ds-dialog__backdrop" data-close></div>
          <div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-label="Delete?"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button></div></div>
        <div class="ds-dialog" id="m-dialog" hidden><div class="ds-dialog__backdrop" data-close></div>
          <div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-label="Delete?"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button></div></div>
        <div class="ds-sheet" id="m-sheet" hidden aria-modal="true"><div class="ds-sheet__backdrop" data-close></div>
          <section class="ds-sheet__panel" role="dialog" aria-label="Details"><div class="ds-sheet__body"><button class="ds-btn ds-btn--text" type="button" data-close>Close</button></div></section></div>
      </section>`);
      const card = document.getElementById('m-card');
      const out = {};
      for (const id of ['m-contained', 'm-dialog', 'm-sheet']) {
        const el = document.getElementById(id);
        el.hidden = false;
        const rect = el.getBoundingClientRect();
        out[id] = { margin: getComputedStyle(el).marginTop, top: Math.round(rect.top), height: Math.round(rect.height) };
        el.hidden = true;
      }
      const inner = card.getBoundingClientRect().top + parseFloat(getComputedStyle(card).borderTopWidth);
      return { out, inner: Math.round(inner), cardHeight: Math.round(card.clientHeight), view: innerHeight };
    });
    expect(result.out['m-contained']).toEqual({ margin: '0px', top: result.inner, height: result.cardHeight });
    expect(result.out['m-dialog']).toEqual({ margin: '0px', top: 0, height: result.view });
    expect(result.out['m-sheet']).toEqual({ margin: '0px', top: 0, height: result.view });
  });

  test('a contained dialog in a container taller than the window keeps its box and its focus in view', async ({ page }) => {
    await open(page, 'overlay.html');
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('afterbegin', `<section id="tall" style="position: relative; height: 2200px">
        <button class="ds-btn" type="button" id="t-open">Delete</button>
        <div class="ds-dialog ds-dialog--contained" id="t-dialog" hidden><div class="ds-dialog__backdrop" data-close></div>
          <div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="t-title"><h2 class="ds-dialog__title" id="t-title">Delete?</h2>
          <p>LAPTOP-0042 goes from the list.</p>
          <div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" id="t-cancel" autofocus data-close>Cancel</button></div></div></div></section>`);
      scrollTo(0, 0);
    });
    await page.evaluate(() => DS.overlay.open(document.getElementById('t-dialog'), { opener: document.getElementById('t-open') }));
    await page.waitForFunction(() => document.getElementById('t-dialog').getAttribute('data-state') === 'open');
    await settle(page);
    const inView = (y) => page.evaluate((to) => {
      scrollTo(0, to);
      const box = document.querySelector('#t-dialog .ds-dialog__box').getBoundingClientRect();
      const focus = document.activeElement.getBoundingClientRect();
      return { focus: document.activeElement.id, box: box.top >= 0 && box.bottom <= innerHeight, focused: focus.top >= 0 && focus.bottom <= innerHeight, scrolled: Math.round(scrollY) === to };
    }, y);
    expect(await inView(0)).toEqual({ focus: 't-cancel', box: true, focused: true, scrolled: true });
    expect(await inView(700)).toEqual({ focus: 't-cancel', box: true, focused: true, scrolled: true });
  });

  test('under a layered reboot: a group legend sits on its first option, a table head with a checkbox is 48px, inline code keeps its ink', async ({ page }) => {
    await open(page, 'reset-layered.html');
    const result = await page.evaluate(() => {
      const theme = document.querySelector('.ds-theme');
      theme.insertAdjacentHTML('afterbegin', `<div class="ds-base" id="rb">
        <fieldset class="ds-field" id="rb-group"><legend class="ds-field__label">Options</legend>
          <label class="ds-check"><input type="checkbox"> Backups</label><label class="ds-check"><input type="checkbox"> Updates</label></fieldset>
        <div class="ds-field" id="rb-field"><label class="ds-field__label" for="rb-name">Name</label><input class="ds-input" id="rb-name"></div>
        <div class="ds-table-wrap"><table class="ds-table ds-table--interactive"><thead id="rb-head"><tr><th scope="col"><input type="checkbox" aria-label="Select all"></th><th scope="col">Device</th></tr></thead>
          <tbody><tr><td><input type="checkbox" aria-label="Select LAPTOP-0042"></td><td>LAPTOP-0042</td></tr></tbody></table></div>
        <p id="rb-text">Run <code id="rb-code">sync --all</code> to start.</p></div>`);
      const gap = (field) => {
        const label = field.querySelector('.ds-field__label').getBoundingClientRect();
        return Math.round(field.children[1].getBoundingClientRect().top - label.bottom);
      };
      const plain = gap(document.getElementById('rb-field'));
      const plainGroup = gap(document.getElementById('rb-group'));
      // Bootstrap's reboot, in the reset layer declared before ds.
      const style = document.createElement('style');
      style.textContent = '@layer reset { legend { float: left; width: 100%; padding: 0; margin-bottom: .5rem; font-size: calc(1.275rem + .3vw); line-height: inherit; } legend + * { clear: left; } code { color: #d63384; font-size: .875em; } }';
      document.head.append(style);
      return {
        plainGroup,
        group: gap(document.getElementById('rb-group')),
        field: gap(document.getElementById('rb-field')),
        plain,
        head: Math.round(document.getElementById('rb-head').getBoundingClientRect().height),
        code: getComputedStyle(document.getElementById('rb-code')).color,
        text: getComputedStyle(document.getElementById('rb-text')).color,
      };
    });
    expect(result.group, JSON.stringify(result)).toBe(result.plainGroup);
    expect(result.field).toBe(result.plain);
    expect(result.head).toBe(48);
    expect(result.code).toBe(result.text);
  });
});
