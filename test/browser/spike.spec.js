/**
 * Capability spike (P0): one test per engine capability that a later phase
 * builds on, on fixtures/spike.html. Each test asserts the capability as the
 * design needs it; an engine that lacks it is marked
 * `test.fail(browserName === '<engine>', 'spike: <capability>')`. Results and
 * their design consequences are in the "Capability spike" table of
 * README.md; a result that changes a design is noted in that phase's file.
 *
 * Findings that are recorded rather than asserted (whether an alternative
 * works, whether something clips) go into test annotations
 * (`spike-result`), visible in the HTML report and the list output.
 */
import { test, expect } from '@playwright/test';
import {
  ready, freeze, seek, sample, focusByKeyboard,
  expectContinuous, expectMonotonic,
} from './helpers/motion.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/browser/fixtures/spike.html');
  await ready(page);
});

/** Notes a recorded (not asserted) finding on the test. */
function record(text) {
  test.info().annotations.push({ type: 'spike-result', description: text });
}

/**
 * The RGBA pixels of a viewport region, decoded in the page from a real
 * screenshot (no image library needed). `at(x, y)` takes viewport
 * coordinates inside the region.
 */
async function pixels(page, clip) {
  // Two frames first: a paused compositor animation must have reached the screen.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const png = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
  const data = await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    return Array.from(context.getImageData(0, 0, bitmap.width, bitmap.height).data);
  }, png.toString('base64'));
  return {
    at(x, y) {
      const i = ((Math.round(y - clip.y) * clip.width) + Math.round(x - clip.x)) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    },
  };
}

const hex = (value) => {
  const n = parseInt(value.trim().replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const near = (a, b, tolerance = 6) => a.every((v, i) => Math.abs(v - b[i]) <= tolerance);
const token = (page, name) => page.evaluate((n) => getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue(n), name);

/* ── 1. Interruption (D21, P2) ─────────────────────────────────────── */

for (const [label, easing] of [
  ['linear()', 'linear(0, 0.4 20%, 0.8 50%, 0.95 75%, 1)'],
  ['cubic', 'cubic-bezier(.2, 0, 0, 1)'],
]) {
  test(`1. interruption: cancel() then animate() from the current values, ${label} easing`, async ({ page }) => {
    const box = page.locator('#spike-move');
    await box.evaluate((el) => el.classList.add('spike-move--run'));
    // Stop the CSS animation at 40%, then interrupt it back to rest in one task.
    const result = await box.evaluate((el, curve) => {
      const running = el.getAnimations()[0];
      running.pause();
      running.currentTime = 400;
      const read = () => {
        const cs = getComputedStyle(el);
        return { x: parseFloat(cs.translate.split(' ')[0]) || 0, opacity: parseFloat(cs.opacity) };
      };
      const current = read();
      running.cancel();
      el.classList.remove('spike-move--run');
      let accepted = true;
      let error = null;
      let animation;
      try {
        animation = el.animate(
          [{ translate: `${current.x}px 0`, opacity: current.opacity }, { translate: '0px 0', opacity: 0 }],
          { duration: 1000, easing: curve, fill: 'forwards' },
        );
      } catch (e) {
        accepted = false;
        error = `${e.name}: ${e.message}`;
      }
      // The same task as cancel(): no frame can show the un-animated state.
      const sameTask = read();
      if (!accepted) return { accepted, error, current, sameTask, curve: [], frames: [] };
      // The new curve, seeked every 50ms (independent of the machine's load).
      animation.pause();
      const curvePoints = [];
      for (let t = 0; t <= 1000; t += 50) {
        animation.currentTime = t;
        curvePoints.push(read());
      }
      animation.currentTime = 0;
      animation.play();
      // Then in real time, as painted.
      const frames = [];
      return new Promise((resolve) => {
        const step = () => {
          frames.push(read());
          if (animation.playState === 'finished') resolve({ accepted, error, current, sameTask, curve: curvePoints, frames });
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, easing);

    record(`animate() with ${label}: ${result.accepted ? 'accepted' : `throws ${result.error}`}`);
    expect(result.accepted, result.error || '').toBe(true);
    expect(result.current.x).toBeCloseTo(80, 0);
    expect(result.current.opacity).toBeCloseTo(0.4, 2);
    expect(result.sameTask.x).toBeCloseTo(result.current.x, 1);
    expect(result.sameTask.opacity).toBeCloseTo(result.current.opacity, 2);
    // The seeked curve starts at the values read and glides to rest.
    const xs = [result.current.x, ...result.curve.map((f) => f.x)];
    const opacities = [result.current.opacity, ...result.curve.map((f) => f.opacity)];
    expectContinuous(xs);
    expectContinuous(opacities);
    expectMonotonic(xs, { direction: 'down' });
    expect(xs.at(-1)).toBeCloseTo(0, 1);
    // Painted frames: never back at rest (opacity 1) or at the start, never
    // turning back, landing at rest (dropped frames on a busy machine are fine).
    const painted = [result.current.x, ...result.frames.map((f) => f.x)];
    expectMonotonic(painted, { direction: 'down' });
    expectMonotonic([result.current.opacity, ...result.frames.map((f) => f.opacity)], { direction: 'down' });
    expect(painted.at(-1)).toBeCloseTo(0, 1);
  });
}

/* ── 2. setKeyframes() / updateTiming() on a CSSAnimation (record) ─── */

test('2. setKeyframes() and updateTiming() on a running CSSAnimation', async ({ page }) => {
  const box = page.locator('#spike-css-animation');
  const result = await box.evaluate(async (el) => {
    el.classList.add('spike-move--run');
    const animation = el.getAnimations()[0];
    animation.pause();
    animation.effect.setKeyframes([{ translate: '0px 0' }, { translate: '100px 0' }]);
    animation.effect.updateTiming({ duration: 2000 });
    animation.currentTime = 1000;
    const x = parseFloat(getComputedStyle(el).translate) || 0;
    const opacity = parseFloat(getComputedStyle(el).opacity);
    // Later CSS changes: the overridden duration should stick, a property the
    // script did not touch (the delay) should still follow the CSS.
    el.style.animationDuration = '3000ms';
    el.style.animationDelay = '500ms';
    getComputedStyle(el).animationDuration;
    const timing = animation.effect.getTiming();
    const same = el.getAnimations()[0] === animation;
    el.style.animationName = 'none';
    const afterName = el.getAnimations().length;
    return { x, opacity, duration: timing.duration, delay: timing.delay, same, afterName };
  });
  record(`setKeyframes/updateTiming: translate ${result.x}px at 50%, duration after a CSS change ${result.duration}, delay ${result.delay}, same object ${result.same}, animations after animation-name: none ${result.afterName}`);
  expect(result.x).toBeCloseTo(50, 0);
  expect(result.opacity).toBe(1);
  expect(result.same).toBe(true);
  expect(result.duration).toBe(2000);
  expect(result.delay).toBe(500);
  expect(result.afterName).toBe(0);
});

/* ── 3. Individual properties over an inline transform ─────────────── */

test('3. a translate keyframe composes with an inline transform; composite add', async ({ page }) => {
  const anchored = page.locator('#spike-anchored');
  await anchored.evaluate((el) => el.classList.add('spike-rise--run'));
  const [at10] = await sample(anchored, ['rect', 'translate', 'translateX', 'translateY'], [100]);
  // The inline transform keeps the box at the anchor (600, 120); the keyframe
  // adds 90 % of its 40px on top instead of replacing the transform.
  expect(at10['rect.x']).toBeCloseTo(600, 0);
  expect(at10['rect.y']).toBeCloseTo(156, 0);
  expect(at10.translateX).toBeCloseTo(600, 0);
  expect(at10['translate.y']).toBeCloseTo(36, 0);

  const composite = await page.locator('#spike-composite').evaluate((el) => {
    el.style.translate = '50px 0';
    const animation = el.animate([{ translate: '0px 0' }, { translate: '100px 0' }], { duration: 1000, composite: 'add', fill: 'both' });
    animation.pause();
    animation.currentTime = 500;
    return { composite: animation.effect.composite, translate: getComputedStyle(el).translate };
  });
  record(`composite 'add' on translate: ${composite.composite}, 50px base + 50px gives ${composite.translate}`);
  expect(composite.composite).toBe('add');
  expect(parseFloat(composite.translate)).toBeCloseTo(100, 0);
});

/* ── 4. Pseudo-element animations ──────────────────────────────────── */

test('4. pseudo-element animations are listed and seekable', async ({ page }) => {
  const pseudo = page.locator('#spike-pseudo');
  await pseudo.evaluate((el) => el.classList.add('spike-pseudo--run'));
  const listed = await page.evaluate(() => document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))
    .map((a) => `${a.animationName}${a.effect.pseudoElement || ''}`).sort());
  expect(listed).toEqual(['spike-pseudo::after', 'spike-pseudo::before']);
  const before = await sample(pseudo, ['opacity', 'translate.x'], [250, 500], { pseudo: '::before' });
  const after = await sample(pseudo, ['opacity', 'translate.x'], [750], { pseudo: '::after' });
  expect(before[0].opacity).toBeCloseTo(0.25, 2);
  expect(before[0]['translate.x']).toBeCloseTo(25, 0);
  expect(before[1].opacity).toBeCloseTo(0.5, 2);
  expect(before[1]['translate.x']).toBeCloseTo(50, 0);
  expect(after[0]['translate.x']).toBeCloseTo(75, 0);
});

/* ── 5. appearance: none checkbox and radio (D23, P3) ─────────────── */

test('5. appearance: none checkbox and radio draw pseudo-elements and a halo', async ({ page }) => {
  const primary = hex(await token(page, '--ds-primary'));
  const accent = hex(await token(page, '--ds-accent'));
  const surface = hex(await token(page, '--ds-surface'));
  for (const id of ['#spike-check', '#spike-radio', '#spike-check-table']) {
    const input = page.locator(id);
    const content = await input.evaluate((el) => [getComputedStyle(el, '::before').content, getComputedStyle(el, '::after').content]);
    expect(content, `${id} pseudo content`).toEqual(['""', '""']);
    const box = await input.boundingBox();
    expect(box.width).toBeCloseTo(18, 0);
    const clip = { x: Math.floor(box.x) - 16, y: Math.floor(box.y) - 16, width: 50, height: 50 };
    const image = await pixels(page, clip);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    if (id !== '#spike-check-table') {
      // ::before (primary) under ::after (accent at 50 %): neither surface
      // nor accent alone, so both pseudo-elements painted.
      const centre = image.at(cx, cy);
      expect(near(centre, surface, 20), `${id} centre ${centre} is the bare surface`).toBe(false);
      expect(near(centre, accent, 20), `${id} centre ${centre} misses ::before`).toBe(false);
      expect(centre[2] > centre[0], `${id} centre ${centre} is not a primary blend ${primary}`).toBe(true);
    }
    // The 10px box-shadow halo, 7px outside each edge.
    const sides = {
      top: image.at(cx, box.y - 7),
      right: image.at(box.x + box.width + 6, cy),
      bottom: image.at(cx, box.y + box.height + 6),
      left: image.at(box.x - 7, cy),
    };
    const clipped = Object.entries(sides).filter(([, rgb]) => !near(rgb, accent, 8)).map(([side]) => side);
    if (id === '#spike-check-table') {
      record(`halo in a .ds-table-wrap: ${clipped.length ? `clipped at ${clipped.join(', ')}` : 'not clipped'}`);
    } else {
      expect(clipped, `${id} halo missing at`).toEqual([]);
    }
  }
});

/* ── 6. Rows (D7, P2/P6) ───────────────────────────────────────────── */

test('6. translate moves a <tr>; a positioned <tr> contains an absolute child', async ({ page }) => {
  const row = page.locator('#spike-row');
  const cell = page.locator('#spike-row-cell');
  const rest = await cell.boundingBox();
  const rowBox = await row.boundingBox();
  const ripple = await page.locator('#spike-row-ripple').boundingBox();
  const contained = Math.abs(ripple.x - rowBox.x) < 1 && Math.abs(ripple.y - rowBox.y) < 1;
  record(`absolute child of a position: relative <tr>: ${contained ? 'contained by the row' : `placed at ${ripple.x},${ripple.y}, the row is at ${rowBox.x},${rowBox.y}`}`);

  await row.evaluate((el) => el.classList.add('spike-row--run'));
  const [mid] = await sample(cell, ['rect'], [500]);
  expect(mid['rect.y'] - rest.y, 'the cell moves with the row').toBeCloseTo(20, 0);
  expect(mid['rect.x']).toBeCloseTo(rest.x, 0);
  expect(contained, 'the positioned row contains the absolute child').toBe(true);
});

/* ── 7. Registered properties in durations and delays (P1) ─────────── */

test('7. a registered property scales durations and delays; inherits: false stays put', async ({ page }) => {
  const result = await page.evaluate(() => {
    const parent = document.querySelector('#spike-scale-parent');
    const child = document.querySelector('#spike-scale-child');
    const local = document.querySelector('#spike-local-child');
    child.classList.add('spike-scale-child--run');
    const timing = () => {
      const effect = child.getAnimations()[0].effect;
      return { duration: effect.getComputedTiming().duration, delay: effect.getComputedTiming().delay };
    };
    const normal = timing();
    parent.classList.add('spike-scale-parent--slow');
    const slowed = timing();
    return {
      normal,
      slowed,
      parentLocal: getComputedStyle(parent).getPropertyValue('--spike-local').trim(),
      childLocal: getComputedStyle(local).getPropertyValue('--spike-local').trim(),
      childScale: getComputedStyle(local).getPropertyValue('--spike-scale').trim(),
    };
  });
  expect(result.normal).toEqual({ duration: 250, delay: 100 });
  expect(result.slowed).toEqual({ duration: 2500, delay: 1000 });
  expect(result.childScale).toBe('10');
  expect(result.parentLocal).toBe('10');
  expect(result.childLocal).toBe('1');
});

/* ── 8. Focus snap (D24, P3) ───────────────────────────────────────── */

test('8. focus snap: a solid ring from the first frame, the animation keeps playing', async ({ page }) => {
  const target = page.locator('#spike-focus');
  await target.evaluate((el) => {
    el.classList.add('spike-focus--entering');
    // Hold the transition where it starts, so the first frame can be read.
    el.addEventListener('transitionrun', (event) => {
      if (event.propertyName === 'outline-offset') event.target.getAnimations().forEach((a) => a.pause());
    });
  });
  await page.locator('#spike-focus-before').focus();
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
  await freeze(page);
  const state = await target.evaluate((el) => ({
    focusVisible: el.matches(':focus-visible'),
    animations: el.getAnimations().map((a) => a.animationName || a.transitionProperty).sort(),
  }));
  expect(state.focusVisible).toBe(true);
  expect(state.animations).toEqual(['outline-offset', 'spike-enter']);
  const focus = hex(await token(page, '--ds-primary'));
  const read = (time) => target.evaluate((el, t) => {
    const transition = el.getAnimations().find((a) => a.transitionProperty === 'outline-offset');
    transition.currentTime = t;
    const cs = getComputedStyle(el);
    return { offset: parseFloat(cs.outlineOffset), style: cs.outlineStyle, color: cs.outlineColor, enter: el.getAnimations().find((a) => a.animationName === 'spike-enter').playState };
  }, time);
  const first = await read(0);
  const mid = await read(75);
  const end = await read(150);
  expect(first.offset).toBeCloseTo(4, 1);
  expect(first.style).toBe('solid');
  // Solid from frame one: the colour does not fade in with the offset.
  expect(first.color.replace(/\s/g, '')).toBe(`rgb(${focus.join(',')})`);
  expect(mid.offset).toBeCloseTo(3, 1);
  expect(end.offset).toBeCloseTo(2, 1);
  expect(first.enter).toBe('paused');
  // Unfrozen, the entrance is still the same running animation.
  const resumed = await target.evaluate((el) => {
    el.getAnimations().forEach((a) => a.play());
    return el.getAnimations().map((a) => `${a.animationName || a.transitionProperty}:${a.playState}`).sort();
  });
  expect(resumed).toContain('spike-enter:running');
});

/* ── 9. A closing <dialog> above a sticky element (P5) ─────────────── */

test('9. a closing <dialog> keeps painting above a sticky element', async ({ page }) => {
  await page.evaluate(() => {
    // Room to scroll, then put the sticky element at the top of the viewport,
    // under the spot where the closing dialog is pinned.
    document.body.style.paddingBottom = '100vh';
    window.scrollTo(0, document.querySelector('#spike-sticky').getBoundingClientRect().top + window.scrollY);
  });
  const sticky = await page.locator('#spike-sticky').boundingBox();
  expect(Math.abs(sticky.y)).toBeLessThan(1);
  await page.evaluate(() => {
    const dialog = document.querySelector('#spike-dialog');
    dialog.showModal();
    dialog.close();
    dialog.classList.add('spike-dialog--closing');
  });
  await freeze(page);
  await seek(page, 0);
  const state = await page.locator('#spike-dialog').evaluate((el) => ({ open: el.open, display: getComputedStyle(el).display, animations: el.getAnimations().length }));
  expect(state).toEqual({ open: false, display: 'block', animations: 1 });
  const image = await pixels(page, { x: 0, y: 0, width: 300, height: 140 });
  const primary = hex(await token(page, '--ds-primary'));
  const error = hex(await token(page, '--ds-error'));
  const inside = image.at(100, 60);
  expect(near(inside, error), 'the sticky element paints over the closing dialog').toBe(false);
  // Primary, or nearly: under load Chromium may paint the first frame of the
  // fade before the seek reaches the compositor. The sticky red never shows.
  expect(inside[2] - inside[0] > 120, `the closing dialog paints ${inside}, expected about ${primary}`).toBe(true);
  // Beside the dialog, the sticky element still shows.
  expect(near(image.at(250, 60), error)).toBe(true);
});

/* ── 10. Skeleton wave (D11, P6) ───────────────────────────────────── */

/** The fixture's gradient: #ddd at 0, #888 at 200px, #ddd at 400px, tiled. */
function waveAt(x, position) {
  const t = (((x - position) % 400) + 400) % 400;
  const ratio = t <= 200 ? t / 200 : (400 - t) / 200;
  const v = Math.round(0xdd + (0x88 - 0xdd) * ratio);
  return [v, v, v];
}

async function waveError(page, id, position) {
  const box = await page.locator(id).boundingBox();
  const clip = { x: Math.ceil(box.x) + 1, y: Math.ceil(box.y) + 4, width: Math.floor(box.width) - 2, height: 4 };
  const image = await pixels(page, clip);
  let worst = 0;
  for (let x = clip.x + 0.5; x < clip.x + clip.width; x += 4) {
    const actual = image.at(x - 0.5, clip.y + 2);
    const expected = waveAt(x, position);
    worst = Math.max(worst, Math.abs(actual[0] - expected[0]));
  }
  return worst;
}

test('10. skeleton bones share one wave phase with background-attachment: fixed', async ({ page }) => {
  await page.locator('#spike-10').scrollIntoViewIfNeeded();
  await page.locator('#spike-bones').evaluate((el) => el.classList.add('spike-bones--run'));
  await page.locator('#spike-bones-moving').evaluate((el) => el.classList.add('spike-bones--run'));
  await page.locator('#spike-transformed').evaluate((el) => el.classList.add('spike-transformed--run'));
  await freeze(page);
  // 500ms of 2000ms: background-position 100px for the bones, the parent
  // still 18px below its rest position.
  await seek(page, 500);
  const a = await waveError(page, '#spike-bone-a', 100);
  const b = await waveError(page, '#spike-bone-b', 100);
  const entering = await waveError(page, '#spike-bone-c', 100);
  // 2500ms: the entrance is over but fills (`both`), the loop is back at
  // the same phase.
  await seek(page, 2500);
  const filling = await waveError(page, '#spike-bone-c', 100);
  // The entrance removed (as .ds-enter ends: fill backwards, nothing left).
  await page.locator('#spike-transformed').evaluate((el) => el.classList.remove('spike-transformed--run'));
  const rested = await waveError(page, '#spike-bone-c', 100);
  const verdict = (error) => (error <= 4 ? 'holds' : 'breaks');
  record(`wave phase error (0-255): bone A ${a}, bone B ${b}; bone C in a parent with a running translate entrance ${entering} (${verdict(entering)}), with the finished entrance still filling ${filling} (${verdict(filling)}), with the entrance removed ${rested} (${verdict(rested)})`);
  expect(a, 'bone A follows the viewport-fixed wave').toBeLessThanOrEqual(4);
  expect(b, 'bone B follows the same phase').toBeLessThanOrEqual(4);
});
