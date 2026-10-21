/**
 * The motion engine of js/motion.js (P2) in real engines: interruption
 * that continues from the current state (D21), the generation guard of
 * enter() / leave() / cancel(), focus on leave(), settled() and the timing
 * read from the tokens (--ds-time-scale), batched entrances.
 *
 * Timing that is judged frame by frame runs under ?speed=0.1
 * (--ds-time-scale: 10), so a busy machine cannot skip the moment that
 * matters.
 */
import { test, expect } from './base-test.js';
import { ready, settle, series, expectMonotonic } from './helpers/motion.js';

const FIXTURES = '/test/browser/fixtures/';

/** Loads the motion fixture (optionally slowed down) once its load-time entrances played. */
async function open(page, { speed } = {}) {
  await page.goto(`${FIXTURES}motion.html${speed ? `?speed=${speed}` : ''}`);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page, { timeout: 15000 });
}

/** Page side: the element's opacity and translate now. */
function readMotion(el) {
  const style = getComputedStyle(el);
  const translate = style.translate === 'none' ? [] : style.translate.split(/\s+/).map(parseFloat);
  return { opacity: parseFloat(style.opacity), 'translate.x': translate[0] ?? 0, 'translate.y': translate[1] ?? 0 };
}

/**
 * Page side: reads the element's opacity and translate now and then on
 * every frame for `ms`. Started in the same task as the interruption it
 * watches, so a slow round trip cannot let the handoff run ahead of it.
 */
function sampleFrames(el, ms) {
  const start = performance.now();
  const read = () => ({ ...readMotion(el), t: performance.now() - start });
  const out = [read()];
  return new Promise((resolve) => {
    const frame = (now) => {
      out.push(read());
      if (now - start < ms) requestAnimationFrame(frame);
      else resolve(out);
    };
    requestAnimationFrame(frame);
  });
}

/** Source for the page: `new Function(TOOLS)()` gives { read, frames }. */
const TOOLS = `${readMotion}\n${sampleFrames}\nreturn { read: readMotion, frames: sampleFrames };`;

/**
 * The largest step between neighbouring samples, per frame (1/60 s): a busy
 * machine that drops frames takes a larger step over a longer gap, a snap is
 * a large step within one frame. `samples` from sampleFrames(), led by the
 * value read in the task of the interruption (time 0, like the first sample).
 */
function largestStep(before, samples, key) {
  const values = [before[key], ...series(samples, key)];
  const times = [0, ...series(samples, 't')];
  const frame = 1000 / 60;
  return Math.max(...values.slice(1).map((value, index) => Math.abs(value - values[index]) / Math.max(1, (times[index + 1] - times[index]) / frame)));
}

test.describe('interruption (D21)', () => {
  test('leave() halfway through enter() continues from the current opacity and position', async ({ page }) => {
    await open(page, { speed: 0.1 });
    const box = page.locator('#enter-default');
    const { before, samples } = await box.evaluate(async (el, source) => {
      const { read, frames } = new Function(source)();
      DS.motion.enter(el);
      // Half of --ds-dur-medium at ten times slower.
      await new Promise((resolve) => setTimeout(resolve, 1250));
      const before = { ...read(el), inline: el.getAttribute('style') };
      DS.motion.leave(el, 'sink', { then: 'keep' });
      return { before, samples: await frames(el, 1600) };
    }, TOOLS);
    expect(before.opacity).toBeGreaterThan(0.2);
    expect(before.opacity).toBeLessThan(0.95);
    const opacity = series(samples, 'opacity');
    // At once and in the first frame after the interruption.
    expect(Math.abs(opacity[0] - before.opacity)).toBeLessThan(0.05);
    expect(Math.abs(opacity[1] - before.opacity)).toBeLessThan(0.05);
    expectMonotonic(opacity, { direction: 'down', tolerance: 1e-3 });
    expect(opacity.at(-1)).toBe(0);
    expect(largestStep(before, samples, 'translate.y')).toBeLessThanOrEqual(2);
    // No inline style was written; the exit holds its end and the element is inert.
    expect(await box.evaluate((el) => [el.getAttribute('style'), el.inert, el.getAnimations().map((a) => a.id)])).toEqual([before.inline, true, ['ds-handoff', 'ds-handoff']]);
  });

  test('enter() halfway through leave() continues from the current opacity, then cleans up', async ({ page }) => {
    await open(page, { speed: 0.1 });
    const box = page.locator('#leave-sink');
    const { before, samples } = await box.evaluate(async (el, source) => {
      const { read, frames } = new Function(source)();
      DS.motion.leave(el, 'sink', { then: 'hide' });
      // Half of --ds-dur-fast at ten times slower.
      await new Promise((resolve) => setTimeout(resolve, 750));
      const before = read(el);
      window.fxEntered = DS.motion.enter(el, 'swap').then(() => 'entered');
      return { before, samples: await frames(el, 1200) };
    }, TOOLS);
    expect(before.opacity).toBeGreaterThan(0.05);
    expect(before.opacity).toBeLessThan(0.95);
    const opacity = series(samples, 'opacity');
    // At once and in the first frame after the interruption.
    expect(Math.abs(opacity[0] - before.opacity)).toBeLessThan(0.05);
    expect(Math.abs(opacity[1] - before.opacity)).toBeLessThan(0.05);
    expectMonotonic(opacity, { direction: 'up', tolerance: 1e-3 });
    expect(largestStep(before, samples, 'translate.y')).toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => window.fxEntered)).toBe('entered');
    expect(await box.evaluate((el) => ({ hidden: el.hidden, inert: el.inert, classes: el.className, opacity: getComputedStyle(el).opacity, running: el.getAnimations().length })))
      .toEqual({ hidden: false, inert: false, classes: 'fx-box', opacity: '1', running: 0 });
  });

  // The new motion has no track for a value that was moving: the lift (or
  // slide) of an entrance under the fade-only default leave(), the drop of
  // leave('sink') under enter('fade'). It glides to its rest, never snaps.
  for (const { name, id, first, then, axis, wait = 400 } of [
    { name: 'enter() then the default leave()', id: '#enter-default', first: (el) => DS.motion.enter(el), then: (el) => DS.motion.leave(el, '', { then: 'keep' }), axis: 'translate.y' },
    { name: "enter('slide') then the default leave()", id: '#enter-slide', first: (el) => DS.motion.enter(el, 'slide'), then: (el) => DS.motion.leave(el, '', { then: 'keep' }), axis: 'translate.x' },
    { name: "enter('scale') then leave('pop')", id: '#enter-scale', first: (el) => DS.motion.enter(el, 'scale'), then: (el) => DS.motion.leave(el, 'pop', { then: 'keep' }), axis: 'translate.y' },
    // The exit accelerates (--ds-ease-in): at 400ms of its 1500ms it has barely moved, so it is read later.
    { name: "leave('sink') then enter('fade')", id: '#leave-sink', first: (el) => DS.motion.leave(el, 'sink', { then: 'keep' }), then: (el) => DS.motion.enter(el, 'fade'), axis: 'translate.y', wait: 600 },
  ]) {
    test(`${name}: a moving translate without a new track glides to rest from where it is`, async ({ page }) => {
      await open(page, { speed: 0.1 });
      const { before, samples } = await page.locator(id).evaluate(async (el, args) => {
        const { read, frames } = new Function(args.source)();
        const start = new Function(`return (${args.first})`)();
        const next = new Function(`return (${args.then})`)();
        start(el);
        // Early in the first motion, while the translate is still far from rest.
        await new Promise((resolve) => setTimeout(resolve, args.wait));
        const before = read(el);
        next(el);
        return { before, samples: await frames(el, 1800) };
      }, { source: TOOLS, first: first.toString(), then: then.toString(), wait });
      expect(Math.abs(before[axis]), 'the first motion was moving').toBeGreaterThan(1);
      const values = [before[axis], ...series(samples, axis)];
      expect(Math.abs(values[1] - values[0]), 'no snap in the task of the interruption').toBeLessThan(0.5);
      expect(largestStep(before, samples, axis)).toBeLessThanOrEqual(2);
      expect(values.at(-1), 'it lands at rest').toBeCloseTo(0, 1);
    });
  }

  test('ten toggles within 400ms end in the state of the last call, the element present once', async ({ page }) => {
    await open(page);
    const result = await page.locator('#leave-scale').evaluate(async (el) => {
      const parent = el.parentNode;
      const calls = [];
      for (let index = 0; index < 10; index += 1) {
        calls.push(index % 2 ? DS.motion.enter(el, 'scale') : DS.motion.leave(el, 'scale'));
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      await Promise.all(calls);
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        present: parent.querySelectorAll('#leave-scale').length,
        connected: el.isConnected,
        classes: el.className,
        opacity: getComputedStyle(el).opacity,
        inert: el.inert,
      };
    });
    expect(result).toEqual({ present: 1, connected: true, classes: 'fx-box', opacity: '1', inert: false });
  });

  test('cancel() takes back a pending leave() at once', async ({ page }) => {
    await open(page);
    const result = await page.locator('#leave-slide').evaluate(async (el) => {
      const leaving = DS.motion.leave(el, 'slide');
      await new Promise((resolve) => setTimeout(resolve, 50));
      DS.motion.cancel(el);
      const now = { classes: el.className, inert: el.inert, opacity: getComputedStyle(el).opacity };
      await leaving;
      return { ...now, connected: el.isConnected };
    });
    expect(result).toEqual({ classes: 'fx-box', inert: false, opacity: '1', connected: true });
  });

  test('an engine without linear() in el.animate() hands off on the cubic fallback', async ({ page }) => {
    await open(page);
    const result = await page.locator('#enter-scale').evaluate(async (el) => {
      const animate = Element.prototype.animate;
      const easings = [];
      Element.prototype.animate = function (keyframes, timing) {
        if (String(timing?.easing ?? '').includes('linear(')) throw new TypeError('linear() is not supported');
        easings.push(timing.easing);
        return animate.call(this, keyframes, timing);
      };
      try {
        DS.motion.enter(el, 'scale');
        await new Promise((resolve) => setTimeout(resolve, 60));
        await DS.motion.leave(el, 'scale', { then: 'hide' });
      } finally {
        Element.prototype.animate = animate;
      }
      return { easings, hidden: el.hidden };
    });
    expect(result.hidden).toBe(true);
    expect(result.easings.length).toBeGreaterThan(0);
    expect(result.easings.every((easing) => easing.startsWith('cubic-bezier('))).toBe(true);
  });
});

test.describe('focus and state', () => {
  test('leave() with focus inside moves it to the opener in the same task; inert until removed', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend',
        '<button class="ds-btn" type="button" id="x-opener">Assign</button>'
        + '<div class="fx-box" id="x-panel" hidden><button class="ds-btn" type="button" id="x-inside">Ada Lovelace</button></div>');
    });
    const result = await page.evaluate(async () => {
      const opener = document.getElementById('x-opener');
      const panel = document.getElementById('x-panel');
      opener.focus();
      const entering = DS.motion.enter(panel, 'scale');
      const shown = !panel.hidden;
      document.getElementById('x-inside').focus();
      await entering;
      const leaving = DS.motion.leave(panel);
      const sameTask = { active: document.activeElement.id, inert: panel.inert };
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const midway = { inert: panel.inert, connected: panel.isConnected };
      await leaving;
      return { shown, sameTask, midway, removed: !panel.isConnected };
    });
    expect(result).toEqual({ shown: true, sameTask: { active: 'x-opener', inert: true }, midway: { inert: true, connected: true }, removed: true });
  });

  test('enter() restarts the entrance of an SVG element (a style flush, no layout)', async ({ page }) => {
    await open(page);
    const names = await page.locator('#svg-path').evaluate((el) => {
      DS.motion.enter(el, 'fade');
      return el.getAnimations().map((animation) => animation.animationName);
    });
    expect(names).toEqual(['ds-fade-in']);
  });
});

test.describe('waiting and timing', () => {
  test('settled() resolves within one frame when nothing runs', async ({ page }) => {
    await open(page);
    const frames = await page.locator('#leave-default').evaluate(async (el) => {
      let count = 0;
      let counting = true;
      const tick = () => { count += 1; if (counting) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      await DS.motion.settled(el);
      counting = false;
      return count;
    });
    expect(frames).toBeLessThanOrEqual(2);
  });

  test('--ds-time-scale: 10 makes motionDuration() and settled() ten times longer', async ({ page }) => {
    const measure = () => page.locator('#enter-fade').evaluate(async (el) => {
      const start = performance.now();
      await DS.motion.enter(el, 'fade');
      return {
        medium: DS.motion.motionDuration(el, '--ds-dur-medium'),
        micro: DS.motion.motionDuration(el, '--ds-dur-micro'),
        travel: DS.motion.travelDuration(el, 480),
        took: performance.now() - start,
      };
    });
    await open(page);
    const normal = await measure();
    expect(normal).toMatchObject({ medium: 250, micro: 50, travel: 350 });
    await open(page, { speed: 0.1 });
    const slow = await measure();
    expect(slow).toMatchObject({ medium: 2500, micro: 500, travel: 3500 });
    expect(slow.took).toBeGreaterThan(2400);
    expect(slow.took).toBeLessThan(2500 + 1000);
    expect(normal.took).toBeLessThan(250 + 300);
  });

  test('motionEasing() reads the computed curve; outside a theme the cubic fallback', async ({ page }) => {
    await open(page);
    const result = await page.evaluate(() => {
      const inside = document.getElementById('enter-default');
      const outside = document.body;
      return {
        value: DS.motion.motionEasing(inside, '--ds-ease-value'),
        spatial: DS.motion.motionEasing(inside, '--ds-ease-spatial'),
        linearSupported: CSS.supports('transition-timing-function', 'linear(0, 1)'),
        outside: DS.motion.motionEasing(outside, '--ds-ease-spatial'),
        outsideMs: DS.motion.motionDuration(outside, '--ds-dur-slow'),
      };
    });
    expect(result.value).toBe('cubic-bezier(.2, 0, 0, 1)');
    expect(result.spatial).toMatch(result.linearSupported ? /^linear\(/ : /^cubic-bezier\(/);
    expect(result.outside).toBe('cubic-bezier(.05, .7, .1, 1)');
    expect(result.outsideMs).toBe(350);
  });
});

test.describe('batched entrances', () => {
  test('staggerOnce() staggers the items in view once and leaves nothing behind', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const items = Array.from({ length: 6 }, (_, index) => `<div class="fx-box"${index === 5 ? ' style="margin-top: 3000px"' : ''}>Device ${index + 1}</div>`).join('');
      document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin', `<div id="x-list">${items}</div>`);
    });
    const result = await page.evaluate(async () => {
      const list = document.getElementById('x-list');
      const done = DS.motion.staggerOnce(list);
      const children = [...list.children];
      const started = children.map((child) => [child.className, child.style.getPropertyValue('--ds-i')]);
      await done;
      const after = children.map((child) => [child.className, child.style.getPropertyValue('--ds-i')]);
      const again = DS.motion.staggerOnce(list);
      const repeated = children.some((child) => child.classList.contains('ds-enter'));
      await again;
      return { started, after, marked: list.hasAttribute('data-ds-staggered'), repeated };
    });
    expect(result.started).toEqual([
      ['fx-box ds-enter ds-enter--swap', '0'],
      ['fx-box ds-enter ds-enter--swap', '1'],
      ['fx-box ds-enter ds-enter--swap', '2'],
      ['fx-box ds-enter ds-enter--swap', '3'],
      ['fx-box ds-enter ds-enter--swap', '4'],
      ['fx-box', ''],
    ]);
    expect(result.after).toEqual(Array.from({ length: 6 }, () => ['fx-box', '']));
    expect(result.marked).toBe(true);
    expect(result.repeated).toBe(false);
  });
  test('an interrupted enterAll() leaves no --ds-i behind: twice mid-entrance, or enter() on one item', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const items = Array.from({ length: 6 }, (_, index) => `<div class="fx-box">Device ${index + 1}</div>`).join('');
      document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin', `<div id="x-list">${items}</div>`);
    });
    const result = await page.evaluate(async () => {
      const items = [...document.getElementById('x-list').children];
      const steps = () => items.map((item) => item.style.getPropertyValue('--ds-i'));
      const delayOf = (item) => getComputedStyle(item).animationDelay.split(',')[0].trim();
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      // Twice, 40ms apart: the second call takes the moving items over.
      const first = DS.motion.enterAll(items, 'scale');
      await wait(40);
      const second = DS.motion.enterAll(items, 'scale');
      const handedOver = steps();
      await Promise.all([first, second]);
      const afterTwice = steps();
      DS.motion.enter(items[5], 'scale');
      const laterDelay = delayOf(items[5]);
      await DS.motion.settled(items[5]);
      // enter() on one item during a batch.
      const batch = DS.motion.enterAll(items, 'scale');
      await wait(40);
      DS.motion.enter(items[3], 'scale');
      const atOnce = items[3].style.getPropertyValue('--ds-i');
      await batch;
      const afterSingle = steps();
      await wait(400);
      DS.motion.enter(items[3], 'fade');
      return { handedOver, afterTwice, laterDelay, atOnce, afterSingle, singleDelay: delayOf(items[3]) };
    });
    expect(result.handedOver, 'a handoff never staggers').toEqual(['', '', '', '', '', '']);
    expect(result.afterTwice).toEqual(['', '', '', '', '', '']);
    expect(result.laterDelay).toBe('0s');
    expect(result.atOnce).toBe('');
    expect(result.afterSingle).toEqual(['', '', '', '', '', '']);
    expect(result.singleDelay).toBe('0s');
  });
});
