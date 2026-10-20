/**
 * The P1 foundation in real engines: the cascade layers (order, unlayered
 * CSS wins, resets in a layer), the motion utilities beating component
 * animations by layer, motion hooks that do not inherit, the
 * --ds-time-scale multiplier, the spring on movement tracks, the
 * movement-only exits paired with ds-fade-out, and hover that moves
 * nothing.
 *
 * The P1 bugs that P0 marked with test.fail (repo-enter-iteration,
 * core-css-distance-inherits, overlay-hidden-attr-ignored,
 * overlay-missed-1, overlay-tooltip-transform-fly, D8) pass as written in
 * regressions.spec.js ("fixed in P1"); the reset screenshots are in
 * baseline.spec.js.
 */
import { test, expect } from '@playwright/test';
import {
  ready, settle, sample, setSpeed, timeline, series, expectMonotonic, expectSettles, peakRatio,
} from './helpers/motion.js';

const FIXTURES = '/test/browser/fixtures/';
const LAYERS = ['ds.tokens', 'ds.base', 'ds.components', 'ds.motion', 'ds.utilities'];

/** Loads a fixture and waits until its load-time entrances have played. */
async function open(page, name) {
  await page.goto(FIXTURES + name);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/**
 * Adds markup at the end of the fixture's `.ds-theme` wrapper (the
 * embedded-widget path) and, unless `pause` is false, pauses every
 * animation of the document in the same task (getAnimations() flushes
 * styles, so the entrances the markup starts are there, at their start).
 * Nothing can finish before a later evaluate reads it, however busy the
 * machine is.
 */
function inject(page, html, { pause = true } = {}) {
  return page.evaluate(([markup, hold]) => {
    document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', markup);
    if (hold) for (const animation of document.getAnimations()) animation.pause();
  }, [html, pause]);
}

/** The CSS animations of an element (no transitions), in order. */
async function animations(locator) {
  return (await timeline(locator)).filter((entry) => entry.type === 'animation');
}

/**
 * Restarts the one-shot classes on the element (DS.motion.replay) and
 * pauses every animation of the document in the same task, like inject().
 */
function replay(locator, ...classes) {
  return locator.evaluate((el, names) => {
    DS.motion.replay(el, ...names);
    for (const animation of document.getAnimations()) animation.pause();
  }, classes);
}

test.describe('cascade layers', () => {
  test('ds.css declares the five layers in the canonical order', async ({ page }) => {
    await open(page, 'controls.html');
    const order = await page.evaluate(() => {
      const sheet = [...document.styleSheets].find((candidate) => (candidate.href || '').endsWith('/dist/ds.css'));
      const statement = [...sheet.cssRules].find((rule) => typeof CSSLayerStatementRule !== 'undefined' && rule instanceof CSSLayerStatementRule);
      return statement ? [...statement.nameList] : null;
    });
    expect(order).toEqual(LAYERS);
  });

  test('unlayered page CSS beats a component rule of higher specificity', async ({ page }) => {
    await open(page, 'controls.html');
    const button = page.locator('.ds-btn--primary').first();
    expect(await button.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).not.toBe('0px');
    await page.addStyleTag({ content: '.ds-btn { border-radius: 0; background-color: rgb(1, 2, 3); }' });
    await settle(page); // the button transitions its background colour
    const styles = await button.evaluate((el) => ({ radius: getComputedStyle(el).borderTopLeftRadius, background: getComputedStyle(el).backgroundColor }));
    expect(styles).toEqual({ radius: '0px', background: 'rgb(1, 2, 3)' });
  });

  test('an unlayered reset overrides the components; the same reset in a layer before ds does not', async ({ page }) => {
    const primary = async (name) => {
      await open(page, name);
      return page.locator('#reset-buttons .ds-btn--primary').evaluate((el) => getComputedStyle(el).backgroundColor);
    };
    // The migration note of 1.0.0: `button { background: none }` without a layer wins.
    expect(await primary('reset.html')).toBe('rgba(0, 0, 0, 0)');
    expect(await primary('reset-layered.html')).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('the motion utilities beat a component\'s own animation, whatever its specificity', async ({ page }) => {
    await open(page, 'controls.html');
    await inject(page, `
      <div class="ds-toasts"><div class="ds-toast ds-toast--shown" id="x-toast"><span class="ds-toast__text">Saved.</span></div>
        <div class="ds-toast ds-toast--shown ds-reveal" id="x-toast-reveal"><span class="ds-toast__text">Loaded.</span></div></div>
      <div class="ds-stagger"><div class="ds-toast ds-toast--shown" id="x-staggered"><span class="ds-toast__text">Synced.</span></div></div>`);
    // .ds-toast--shown:not(.ds-leave) { animation: none } has more specificity than .ds-enter.
    const toast = page.locator('#x-toast');
    const names = await toast.evaluate((el) => {
      DS.motion.enter(el);
      return el.getAnimations().map((animation) => animation.animationName);
    });
    expect(names).toEqual(['ds-fade-in', 'ds-lift-in']);
    // A shown snackbar's `animation: none` gives way to the stagger entrance.
    expect((await animations(page.locator('#x-staggered'))).map((entry) => entry.name)).toEqual(['ds-fade-in', 'ds-lift-in']);
    // The reveal plays on a shown snackbar; its rise is on the spring (linear()), not the snackbar's own curve.
    const reveal = await animations(page.locator('#x-toast-reveal'));
    expect(reveal.map((entry) => entry.name)).toEqual(['ds-fade-in', 'ds-lift-in']);
    expect(reveal[1].keyframeEasing).toMatch(/^linear\(/);
  });

  test('loaders in .ds-stagger or with .ds-reveal keep their loader delay and loop; enter and leave still win', async ({ page }) => {
    await open(page, 'controls.html');
    await inject(page, `
      <div class="ds-stagger">
        <div class="ds-skeleton" id="x-st-skeleton"></div>
        <div class="ds-loading" id="x-st-loading">Loading ...</div>
        <span class="ds-spinner" id="x-st-spinner"></span>
        <span class="ds-spinner ds-enter" id="x-st-entering"></span>
        <div class="ds-skeleton ds-leave" id="x-st-leaving"></div>
      </div>
      <div class="ds-skeleton ds-reveal" id="x-reveal-skeleton"></div>`);
    // The 200ms loader delay, not a stagger step: a fast load never flashes the placeholder.
    for (const id of ['#x-st-skeleton', '#x-st-loading', '#x-reveal-skeleton']) {
      const own = await animations(page.locator(id));
      expect(own.map((entry) => entry.name), id).toEqual(['ds-fade-in']);
      expect(own[0].delay, id).toBeCloseTo(200, 0);
    }
    // The spinner keeps turning while its grid keeps .ds-stagger.
    const spin = await animations(page.locator('#x-st-spinner'));
    expect(spin.map((entry) => entry.name)).toEqual(['ds-spin']);
    expect(spin[0].iterations).toBe(Infinity);
    // The later one-class utilities still replace the loader's animation.
    expect((await animations(page.locator('#x-st-entering'))).map((entry) => entry.name)).toEqual(['ds-fade-in', 'ds-lift-in']);
    const leaving = await animations(page.locator('#x-st-leaving'));
    expect(leaving.map((entry) => entry.name)).toEqual(['ds-fade-out']);
    expect(leaving[0].delay).toBe(0);
  });
});

test.describe('motion hooks do not inherit', () => {
  test('a plain .ds-enter inside .ds-reveal rises its own 8px', async ({ page }) => {
    await open(page, 'controls.html');
    await inject(page, '<div class="ds-reveal" id="x-reveal"><div class="ds-enter" id="x-reveal-child">Ada Lovelace</div></div>');
    const [start] = await sample(page.locator('#x-reveal-child'), ['translate.y'], [0]);
    // The reveal itself starts 4px down (--ds-distance-sm); that never reaches the child.
    const [parent] = await sample(page.locator('#x-reveal'), ['translate.y'], [0]);
    expect(parent['translate.y']).toBeCloseTo(4, 1);
    expect(start['translate.y']).toBeCloseTo(8, 1);
  });

  test('a child of .ds-enter--delayed gets no delay', async ({ page }) => {
    await open(page, 'controls.html');
    await inject(page, '<div class="ds-enter ds-enter--delayed" id="x-delayed"><div class="ds-enter" id="x-delayed-child">LAPTOP-0042</div></div>');
    const parent = await animations(page.locator('#x-delayed'));
    expect(parent.length).toBeGreaterThan(0);
    expect(parent[0].delay).toBeGreaterThan(100);
    const child = await animations(page.locator('#x-delayed-child'));
    expect(child.map((entry) => entry.delay)).toEqual(child.map(() => 0));
  });

  test('an element entering inside the fifth staggered item starts at once', async ({ page }) => {
    await open(page, 'controls.html');
    await inject(page, `<div class="ds-stagger" id="x-stagger"><div>Devices</div><div>Tickets</div><div>Owners</div><div>Rooms</div>
      <div id="x-fifth" style="--ds-i: 4"><div class="ds-enter" id="x-in-fifth">Printers</div></div></div>`);
    const fifth = await animations(page.locator('#x-fifth'));
    expect(fifth[0].delay).toBeCloseTo(120, 0);
    const inner = await animations(page.locator('#x-in-fifth'));
    expect(inner.length).toBeGreaterThan(0);
    expect(inner.map((entry) => entry.delay)).toEqual(inner.map(() => 0));
  });
});

test.describe('motion tokens', () => {
  test('?speed=0.1 multiplies durations and delays of .ds-enter, .ds-enter--delayed and .ds-leave by 10', async ({ page }) => {
    const read = async () => {
      const out = {};
      for (const [id, classes] of [['#enter-default', ['ds-enter']], ['#enter-delayed', ['ds-enter', 'ds-enter--delayed']], ['#leave-default', ['ds-leave']]]) {
        const box = page.locator(id);
        await replay(box, ...classes);
        out[id] = (await animations(box)).map((entry) => ({ duration: entry.duration, delay: entry.delay }));
      }
      return out;
    };
    await open(page, 'motion.html');
    const normal = await read();
    await setSpeed(page, 0.1);
    const slow = await read();
    expect(normal['#enter-delayed'][0].delay).toBeGreaterThan(0);
    for (const id of Object.keys(normal)) {
      expect(slow[id].length, id).toBe(normal[id].length);
      slow[id].forEach((entry, index) => {
        expect(entry.duration, id).toBeCloseTo(normal[id][index].duration * 10, 3);
        expect(entry.delay, id).toBeCloseTo(normal[id][index].delay * 10, 3);
      });
    }
  });

  test('.ds-enter moves on the spring and fades on the standard curve', async ({ page }) => {
    await open(page, 'motion.html');
    const box = page.locator('#enter-default');
    await replay(box, 'ds-enter');
    const [fade, lift] = await animations(box);
    expect([fade.name, lift.name]).toEqual(['ds-fade-in', 'ds-lift-in']);
    expect(lift.keyframeEasing).toMatch(/^linear\(/);
    expect(fade.keyframeEasing).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });

  test('.ds-enter--slide overshoots at most 5 %, settles at rest, and its opacity only rises', async ({ page }) => {
    await open(page, 'motion.html');
    const box = page.locator('#enter-slide');
    await replay(box, 'ds-enter', 'ds-enter--slide');
    const times = Array.from({ length: 41 }, (_, index) => ({ progress: index / 40 }));
    const samples = await sample(box, ['translate.x', 'opacity'], times);
    const x = series(samples, 'translate.x');
    expect(x[0]).toBeCloseTo(24, 1);
    const peak = peakRatio(x, x[0], 0);
    expect(peak).toBeLessThanOrEqual(1.05);
    // The spring is there: it passes its rest by about 2.8 %.
    expect(peak).toBeGreaterThanOrEqual(1.01);
    expectSettles(x, 0, 0.05);
    expectMonotonic(series(samples, 'opacity'), { direction: 'up' });
  });
});

test.describe('exits', () => {
  test('every .ds-leave variant fades out first, moves on a second track and ends invisible', async ({ page }) => {
    await open(page, 'motion.html');
    await inject(page, '<div class="fx-box" id="x-leave-pop">pop</div>');
    const cases = [
      ['#leave-sink', 'sink', 'ds-drop-out', 150],
      ['#leave-scale', 'scale', 'ds-shrink-out', 200],
      ['#leave-slide', 'slide', 'ds-shift-out', 200],
      ['#x-leave-pop', 'pop', 'ds-pop-out', 150],
    ];
    for (const [id, variant, movement, duration] of cases) {
      const box = page.locator(id);
      await replay(box, 'ds-leave', `ds-leave--${variant}`);
      const tracks = await animations(box);
      expect(tracks.map((entry) => entry.name), variant).toEqual(['ds-fade-out', movement]);
      for (const track of tracks) expect(track.duration, `${variant}: ${track.name}`).toBeCloseTo(duration, 3);
      const [end] = await sample(box, ['opacity'], [{ progress: 1 }]);
      expect(end.opacity, variant).toBe(0);
    }
  });

  test('a closing dialog fades and drops its box; a closing sheet fades and shifts its panel on the exit curve', async ({ page }) => {
    await open(page, 'controls.html');
    await inject(page, `
      <div class="ds-dialog" id="x-dialog"><div class="ds-dialog__backdrop"></div>
        <div class="ds-dialog__box" role="alertdialog" aria-label="Delete"><p class="ds-dialog__text">Delete 3 devices?</p></div></div>
      <div class="ds-sheet" id="x-sheet"><div class="ds-sheet__backdrop"></div>
        <section class="ds-sheet__panel"><div class="ds-sheet__body">LAPTOP-0042</div></section></div>`, { pause: false });
    await settle(page);
    await page.evaluate(() => {
      document.querySelector('#x-dialog').classList.add('ds-dialog--closing');
      document.querySelector('#x-sheet').classList.add('ds-sheet--closing');
      for (const animation of document.getAnimations()) animation.pause();
    });
    const box = await animations(page.locator('#x-dialog .ds-dialog__box'));
    expect(box.map((entry) => entry.name)).toEqual(['ds-fade-out', 'ds-drop-out']);
    const panel = await animations(page.locator('#x-sheet .ds-sheet__panel'));
    expect(panel.map((entry) => entry.name)).toEqual(['ds-fade-out', 'ds-shift-out']);
    expect(panel[1].keyframeEasing).toBe('cubic-bezier(0.3, 0, 0.8, 0.15)');
  });
});

test.describe('hover and stagger', () => {
  /** transform, translate and scale of an element, its ::before and its svg. */
  const moves = (locator) => locator.evaluate((el) => [el, el.querySelector('svg')].filter(Boolean).flatMap((node) => [null, '::before']
    .map((pseudo) => {
      const style = getComputedStyle(node, pseudo);
      return `${node.tagName}${pseudo || ''}: ${style.transform} | ${style.translate} | ${style.scale}`;
    })));

  test('hover moves nothing on the disc button and the card link', async ({ page }) => {
    for (const [name, id] of [['controls.html', '#btn-disc'], ['feedback.html', '#card-link']]) {
      await open(page, name);
      const target = page.locator(id);
      const before = await moves(target);
      await target.hover();
      await settle(page);
      expect(await moves(target), id).toEqual(before);
      await page.mouse.move(1, 1);
    }
  });

  test('.ds-stagger children rise 4px, and number themselves where sibling-index() exists', async ({ page }) => {
    await open(page, 'motion.html');
    const list = page.locator('#stagger');
    await replay(list, 'ds-stagger');
    const [start] = await sample(page.locator('#stagger > :first-child'), ['translate.y', 'opacity'], [0]);
    expect(start['translate.y']).toBeCloseTo(4, 1);
    expect(start.opacity).toBe(0);
    await page.reload();
    await ready(page);
    await settle(page);
    await inject(page, `<div class="ds-stagger" id="x-css-stagger">${'<div class="fx-box">Device</div>'.repeat(8)}</div>`);
    const supported = await page.evaluate(() => CSS.supports('z-index', 'sibling-index()'));
    test.info().annotations.push({ type: 'sibling-index()', description: supported ? 'supported: CSS-only stagger checked' : 'not supported: the list waits for stagger()' });
    const delays = [];
    for (const child of await page.locator('#x-css-stagger > *').all()) delays.push(Math.round((await animations(child))[0].delay * 1000) / 1000);
    const step = 30;
    expect(delays).toEqual(supported ? delays.map((_, index) => Math.min(index, 5) * step) : delays.map(() => 0));
  });
});
