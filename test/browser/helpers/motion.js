/**
 * The one shared helper module of the browser tests: reading motion out of
 * a page (timelines, seek-based and real-time samples), driving it (freeze,
 * seek, speed, pointer, keyboard focus) and judging a series of numbers.
 *
 * It imports only node:* and never @playwright/test: page functions take
 * Playwright `page` or `locator` objects as arguments and run their code
 * through evaluate(), and the pure checks at the end are unit-tested under
 * `node --test` (test/browser-helpers.test.js). Every spec imports this
 * module; no other helper file exists.
 *
 * Sample keys (sample(), rafSample()), all numbers:
 *   opacity
 *   translateX translateY scaleX scaleY   the computed `transform` matrix, decomposed
 *   translate.x translate.y               the individual `translate` property (px)
 *   scale.x scale.y                       the individual `scale` property
 *   rotate                                the individual `rotate` property (deg)
 *   borderRadius                          top-left radius (px)
 *   outlineOffset width height            px (width/height from the box when `auto`)
 *   clipPath.top .right .bottom .left     the values of an inset() clip-path (px or %)
 *   rect.x rect.y rect.width rect.height  getBoundingClientRect() (the element, not a pseudo)
 *   --any-custom-property                 parseFloat of its computed value
 *
 * Group keys are accepted too: `translate`, `scale`, `clipPath`, `rect` and
 * `transform` (translateX ... scaleY) expand to their members.
 */
import assert from 'node:assert/strict';

/* ── Page side ─────────────────────────────────────────────────────── */

/**
 * Runs inside the page (serialised with toString, so it must stay
 * self-contained): the requested values of one element at this moment.
 */
function readValues(el, keys, pseudo) {
  const cs = getComputedStyle(el, pseudo || null);
  const num = (value) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };
  const pair = (value, fallback) => {
    if (!value || value === 'none') return [fallback, fallback];
    const parts = value.trim().split(/\s+/).map(num);
    return [parts[0], parts.length > 1 ? parts[1] : (fallback === 1 ? parts[0] : fallback)];
  };
  const angle = (value) => {
    if (!value || value === 'none') return 0;
    const match = /(-?[\d.]+(?:e-?\d+)?)(deg|rad|turn|grad)\s*$/.exec(value.trim());
    if (!match) return 0;
    const n = parseFloat(match[1]);
    return { deg: n, rad: (n * 180) / Math.PI, turn: n * 360, grad: n * 0.9 }[match[2]];
  };
  const inset = (value) => {
    const match = /inset\(([^)]*)\)/.exec(value || '');
    if (!match) return [0, 0, 0, 0];
    const v = match[1].split(/\s+round\s+/)[0].trim().split(/\s+/).map(num);
    return [v[0], v[1] ?? v[0], v[2] ?? v[0], v[3] ?? v[1] ?? v[0]];
  };
  const groups = {
    transform: ['translateX', 'translateY', 'scaleX', 'scaleY'],
    translate: ['translate.x', 'translate.y'],
    scale: ['scale.x', 'scale.y'],
    clipPath: ['clipPath.top', 'clipPath.right', 'clipPath.bottom', 'clipPath.left'],
    rect: ['rect.x', 'rect.y', 'rect.width', 'rect.height'],
  };
  const out = {};
  let matrix = null;
  let rect = null;
  for (const key of keys.flatMap((k) => groups[k] || [k])) {
    if (key.startsWith('--')) out[key] = num(cs.getPropertyValue(key));
    else if (key === 'opacity') out[key] = num(cs.opacity);
    else if (['translateX', 'translateY', 'scaleX', 'scaleY'].includes(key)) {
      matrix ??= new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform);
      out[key] = {
        translateX: matrix.m41,
        translateY: matrix.m42,
        scaleX: Math.hypot(matrix.m11, matrix.m12),
        scaleY: Math.hypot(matrix.m21, matrix.m22),
      }[key];
    } else if (key === 'translate.x' || key === 'translate.y') out[key] = pair(cs.translate, 0)[key.endsWith('x') ? 0 : 1];
    else if (key === 'scale.x' || key === 'scale.y') out[key] = pair(cs.scale, 1)[key.endsWith('x') ? 0 : 1];
    else if (key === 'rotate') out[key] = angle(cs.rotate);
    else if (key === 'borderRadius') out[key] = num(cs.borderTopLeftRadius);
    else if (key === 'outlineOffset') out[key] = num(cs.outlineOffset);
    else if (key === 'width' || key === 'height') {
      const value = cs[key];
      out[key] = value && value !== 'auto' ? num(value) : el.getBoundingClientRect()[key];
    } else if (key.startsWith('clipPath.')) {
      out[key] = inset(cs.clipPath)[['top', 'right', 'bottom', 'left'].indexOf(key.slice(9))];
    } else if (key.startsWith('rect.')) {
      rect ??= el.getBoundingClientRect();
      out[key] = rect[key.slice(5)];
    } else throw new Error(`Unknown sample key: ${key}`);
  }
  return out;
}

const READ_SOURCE = readValues.toString();

/**
 * Waits until the page can be measured: fonts loaded and, on the
 * styleguide, `html[data-sg-ready]` (render, navigation, demos and the
 * saved theme are set up); on a fixture, `html[data-fixture-ready]`.
 */
export async function ready(page, { timeout = 10000 } = {}) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const pathname = new URL(page.url()).pathname;
  const attribute = pathname.startsWith('/styleguide/') ? 'data-sg-ready'
    : pathname.startsWith('/test/browser/fixtures/') ? 'data-fixture-ready' : null;
  if (attribute) {
    await page.waitForFunction((name) => document.documentElement.hasAttribute(name), attribute, { timeout });
  }
}

/**
 * The element's animations as plain data, read from getAnimations(),
 * effect.getTiming() and getComputedTiming(). `subtree: true` includes
 * descendants and pseudo-elements (then each entry names its `target`);
 * `names` keeps only those animation names, transition properties or ids.
 * A CSS animation reports `easing: 'linear'` (its curve lives on the
 * keyframes), so `keyframeEasing` carries the first keyframe's curve.
 * @returns {Promise<Array<{ type: 'animation'|'transition'|'script', name: string, pseudoElement: string|null,
 *   duration: number, delay: number, easing: string, keyframeEasing: string|null, iterations: number,
 *   direction: string, fill: string,
 *   playState: string, currentTime: number|null, target?: string }>>}
 */
export function timeline(locator, { subtree = false, names } = {}) {
  return locator.evaluate((el, options) => {
    const describe = (node) => node.tagName.toLowerCase() + (node.id ? `#${node.id}` : '')
      + [...node.classList].map((c) => `.${c}`).join('');
    return el.getAnimations({ subtree: options.subtree }).map((animation) => {
      const effect = animation.effect;
      const timing = effect.getTiming();
      const computed = effect.getComputedTiming();
      const isAnimation = typeof CSSAnimation !== 'undefined' && animation instanceof CSSAnimation;
      const isTransition = typeof CSSTransition !== 'undefined' && animation instanceof CSSTransition;
      const entry = {
        type: isAnimation ? 'animation' : isTransition ? 'transition' : 'script',
        name: isAnimation ? animation.animationName : isTransition ? animation.transitionProperty : animation.id,
        pseudoElement: effect.pseudoElement || null,
        duration: typeof timing.duration === 'number' ? timing.duration : Number(computed.duration),
        delay: timing.delay,
        easing: timing.easing,
        // A CSS animation keeps its timing function on the keyframes.
        keyframeEasing: (effect.getKeyframes()[0] || {}).easing || null,
        iterations: computed.iterations,
        direction: timing.direction,
        fill: timing.fill,
        playState: animation.playState,
        currentTime: animation.currentTime === null ? null : Math.round(Number(animation.currentTime) * 10) / 10,
      };
      if (options.subtree) entry.target = describe(effect.target);
      return entry;
    }).filter((entry) => !options.names || options.names.includes(entry.name));
  }, { subtree, names: names || null });
}

/** Pauses every animation of the document, pseudo-elements included. */
export function freeze(page) {
  return page.evaluate(() => {
    const animations = document.getAnimations();
    for (const animation of animations) animation.pause();
    return animations.length;
  });
}

/**
 * Sets currentTime on every animation of the document: `ms` (delays
 * included), or `{ progress }` from 0 to 1 of each animation's active
 * phase after its delay (one loop for infinite ones).
 */
export function seek(page, time) {
  return page.evaluate((at) => {
    for (const animation of document.getAnimations()) {
      if (typeof at === 'number') {
        animation.currentTime = at;
      } else {
        const computed = animation.effect.getComputedTiming();
        const delay = animation.effect.getTiming().delay || 0;
        const iterations = Number.isFinite(computed.iterations) ? computed.iterations : 1;
        animation.currentTime = delay + at.progress * Number(computed.duration) * iterations;
      }
    }
  }, time);
}

/**
 * Freezes the page, seeks to each of `times` (ms or `{ progress }`) and
 * reads the requested keys of the element (or of `pseudo`, e.g. '::before').
 * @returns {Promise<Array<Record<string, number>>>} one entry per time, with `time`
 */
export async function sample(locator, props, times, { pseudo } = {}) {
  const page = locator.page();
  await freeze(page);
  const out = [];
  for (const time of times) {
    await seek(page, time);
    const values = await locator.evaluate((el, args) => {
      const read = new Function(`return (${args.source})`)();
      return read(el, args.props, args.pseudo);
    }, { source: READ_SOURCE, props, pseudo: pseudo || null });
    out.push({ time: typeof time === 'number' ? time : time.progress, ...values });
  }
  return out;
}

/**
 * Reads the requested keys once now and then on every animation frame for
 * `ms` of real time. Only for interruption (judge it with tolerances, e.g.
 * expectContinuous): frame timing varies between runs and engines.
 * @returns {Promise<Array<Record<string, number>>>} with `time` in ms since the call
 */
export function rafSample(locator, props, ms, { pseudo } = {}) {
  return locator.evaluate((el, args) => {
    const read = new Function(`return (${args.source})`)();
    const start = performance.now();
    const out = [{ time: 0, ...read(el, args.props, args.pseudo) }];
    return new Promise((resolve) => {
      const frame = (now) => {
        out.push({ time: Math.max(0, now - start), ...read(el, args.props, args.pseudo) });
        if (now - start < args.ms) requestAnimationFrame(frame);
        else resolve(out);
      };
      requestAnimationFrame(frame);
    });
  }, { source: READ_SOURCE, props, pseudo: pseudo || null, ms });
}

/**
 * Waits until every finite animation of the document has finished
 * (Promise.allSettled of their `finished` promises, repeated while new ones
 * start); infinite loops are ignored. Rejects after `timeout` and names
 * what still runs, so a test never measures a half-played state.
 */
export async function settle(page, { timeout = 3000 } = {}) {
  const pending = await page.evaluate(async (limit) => {
    const deadline = performance.now() + limit;
    const running = () => document.getAnimations().filter((animation) => {
      const iterations = animation.effect && animation.effect.getComputedTiming().iterations;
      return Number.isFinite(iterations) && animation.playState !== 'finished' && animation.playState !== 'idle';
    });
    for (;;) {
      const list = running();
      if (!list.length) return [];
      if (performance.now() >= deadline) {
        return list.map((a) => `${a.animationName || a.transitionProperty || a.id || 'script'} (${a.playState})`);
      }
      const left = deadline - performance.now();
      await Promise.race([
        Promise.allSettled(list.map((animation) => animation.finished)),
        new Promise((resolve) => setTimeout(resolve, left)),
      ]);
      // One frame for animations the finished ones hand over to.
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
  }, timeout);
  if (pending.length) throw new Error(`Animations did not settle within ${timeout}ms: ${pending.join(', ')}`);
}

/**
 * Slows the page's motion down by `factor` (1 or less, e.g. 0.1). In P0 it
 * reloads the page with `?speed=<factor>`, the playback-rate bridge of the
 * styleguide and the fixtures: CSS and Web Animations slow down, JS timers
 * do not. P1 switches it to `--ds-time-scale = 1 / factor`.
 */
export async function setSpeed(page, factor) {
  assert.ok(factor > 0 && factor <= 1, `speed factor must be in (0, 1], got ${factor}`);
  const url = new URL(page.url());
  if (factor === 1) url.searchParams.delete('speed');
  else url.searchParams.set('speed', String(factor));
  await page.goto(url.toString());
  await ready(page);
}

/**
 * A real press with the mouse or a finger: pointer down at `x`, `y` inside
 * the element (default: its centre), held for `holdMs`, then up. A touch
 * with a hold needs Chromium (CDP touch events); a plain touch is a tap and
 * needs a context with `hasTouch: true`.
 */
export async function press(locator, { holdMs = 0, x, y, pointer = 'mouse' } = {}) {
  const page = locator.page();
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  assert.ok(box, 'press(): the element has no box (hidden or detached)');
  const px = box.x + (x ?? box.width / 2);
  const py = box.y + (y ?? box.height / 2);
  const hold = () => (holdMs > 0 ? page.waitForTimeout(holdMs) : Promise.resolve());
  if (pointer === 'mouse') {
    await page.mouse.move(px, py);
    await page.mouse.down();
    await hold();
    await page.mouse.up();
    return;
  }
  assert.equal(pointer, 'touch', `press(): unknown pointer "${pointer}"`);
  if (!holdMs) {
    await page.touchscreen.tap(px, py);
    return;
  }
  const browser = page.context().browser();
  assert.equal(browser && browser.browserType().name(), 'chromium', 'press(): a touch hold needs Chromium (CDP touch events)');
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: px, y: py }] });
    await hold();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
}

/**
 * Moves focus to the element with the Tab key, so `:focus-visible` matches
 * as it does for a keyboard user: focus the element, step back with
 * Shift+Tab and forward again with Tab. The first stop of a page (Shift+Tab
 * would leave it) steps forward and back instead. An only stop is reached
 * from a temporary out-of-flow sentinel placed right before it.
 */
export async function focusByKeyboard(page, locator) {
  const isFocused = () => locator.evaluate((el) => el === document.activeElement);
  for (const [away, back] of [['Shift+Tab', 'Tab'], ['Tab', 'Shift+Tab']]) {
    await locator.focus();
    await page.keyboard.press(away);
    await page.keyboard.press(back);
    if (await isFocused()) return;
  }
  await locator.evaluate((el) => {
    const sentinel = document.createElement('span');
    sentinel.tabIndex = 0;
    sentinel.setAttribute('data-focus-sentinel', '');
    sentinel.style.cssText = 'position: fixed; top: 0; left: 0; width: 1px; height: 1px; overflow: hidden';
    el.before(sentinel);
    sentinel.focus();
  });
  await page.keyboard.press('Tab');
  await page.evaluate(() => document.querySelector('[data-focus-sentinel]')?.remove());
  if (!(await isFocused())) throw new Error('focusByKeyboard(): the element cannot be reached with the Tab key');
}

/**
 * Asserts computed styles of the element (or `pseudo`) once it rests:
 * numbers compare numerically within `tolerance`, strings exactly.
 * Property names in camelCase or kebab-case.
 */
export async function expectEndState(locator, styles, { pseudo, tolerance = 0.01 } = {}) {
  const actual = await locator.evaluate((el, args) => {
    const cs = getComputedStyle(el, args.pseudo);
    const out = {};
    for (const name of args.names) {
      const kebab = name.startsWith('--') ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      out[name] = cs.getPropertyValue(kebab).trim();
    }
    return out;
  }, { names: Object.keys(styles), pseudo: pseudo || null });
  for (const [name, expected] of Object.entries(styles)) {
    if (typeof expected === 'number') {
      const value = parseFloat(actual[name]);
      assert.ok(Math.abs(value - expected) <= tolerance, `${name}: expected ${expected}, got "${actual[name]}"`);
    } else {
      assert.equal(actual[name], expected, `${name}: expected "${expected}", got "${actual[name]}"`);
    }
  }
}

/* ── Pure checks (unit-tested in test/browser-helpers.test.js) ───────── */

/** The numbers of one key from sample() or rafSample() output. */
export function series(samples, key) {
  return samples.map((entry) => entry[key]);
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Never turns back. `direction`: 'up', 'down', or (default) the direction
 * from the first to the last value. `tolerance` absorbs float noise.
 */
export function expectMonotonic(values, { direction, tolerance = 1e-6 } = {}) {
  assert.ok(values.length >= 2, 'expectMonotonic(): needs at least two values');
  const dir = direction || (values.at(-1) >= values[0] ? 'up' : 'down');
  for (let i = 1; i < values.length; i += 1) {
    const step = values[i] - values[i - 1];
    assert.ok(dir === 'up' ? step >= -tolerance : step <= tolerance,
      `not monotonic (${dir}) at index ${i}: ${values[i - 1]} -> ${values[i]}`);
  }
}

/** Every value lies in [min, max] (`tolerance` absorbs float noise). */
export function expectWithin(values, min, max, { tolerance = 1e-6 } = {}) {
  values.forEach((value, i) => {
    assert.ok(value >= min - tolerance && value <= max + tolerance, `value ${value} at index ${i} is outside [${min}, ${max}]`);
  });
}

/**
 * The furthest point of the travel from `from` to `to` as a ratio of the
 * travel: 1 lands exactly, 1.028 overshoots by 2.8 %. `from` and `to`
 * default to the first and last value.
 */
export function peakRatio(values, from = values[0], to = values.at(-1)) {
  const travel = to - from;
  assert.ok(travel !== 0, 'peakRatio(): from and to are equal, there is no travel');
  return Math.max(...values.map((value) => (value - from) / travel));
}

/** The overshoot stays at or below `limit` (e.g. 1.05). */
export function expectPeakAtMost(values, limit, { from, to } = {}) {
  const peak = peakRatio(values, from ?? values[0], to ?? values.at(-1));
  assert.ok(peak <= limit + 1e-9, `peak ${peak.toFixed(4)} exceeds ${limit}`);
}

/** The last value lies within `tolerance` (absolute) of `target`. */
export function expectSettles(values, target, tolerance = 0.005) {
  const last = values.at(-1);
  assert.ok(Math.abs(last - target) <= tolerance, `settles at ${last}, expected ${target} ± ${tolerance}`);
}

/**
 * No jump: no step is larger than `factor` times the median of its
 * neighbouring steps (two on each side) plus an absolute `floor` for rAF
 * jitter (default 1 % of the series' range), so an interrupted motion
 * continues from where it was. The median is local because an eased curve
 * sampled at even times has uneven steps (an ease-out starts with its
 * largest ones), while a jump stands out against its neighbours.
 */
export function expectContinuous(values, { factor = 2, floor } = {}) {
  assert.ok(values.length >= 3, 'expectContinuous(): needs at least three values');
  const steps = values.slice(1).map((value, i) => Math.abs(value - values[i]));
  const range = Math.max(...values) - Math.min(...values);
  const slack = floor ?? range * 0.01;
  steps.forEach((step, i) => {
    const neighbours = [...steps.slice(Math.max(0, i - 2), i), ...steps.slice(i + 1, i + 3)];
    const limit = factor * median(neighbours) + slack;
    assert.ok(step <= limit + 1e-9, `jump of ${step} at index ${i + 1} (${values[i]} -> ${values[i + 1]}), limit ${limit}`);
  });
}
