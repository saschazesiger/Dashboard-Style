/**
 * js/motion.js without a DOM: a fake element with classList, style and
 * events is enough for the helpers.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNT_UP_MS,
  LOADER_DELAY_MS,
  LOADER_MIN_VISIBLE_MS,
  STAGGER_MAX,
  countUp,
  easeOutCubic,
  enter,
  leave,
  loaderHoldMs,
  prefersReducedMotion,
  replay,
  settleLoader,
  settled,
  stagger,
} from '../src/js/motion.js';

/** Just enough of an element for the motion helpers (no DOM in node:test). */
class FakeElement extends EventTarget {
  constructor() {
    super();
    const classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toString: () => [...classes].join(' '),
    };
    const properties = new Map();
    this.style = { setProperty: (name, value) => properties.set(name, value), getPropertyValue: (name) => properties.get(name) ?? '' };
    this.hidden = false;
    this.isConnected = true;
    this.textContent = '';
    this.offsetWidth = 0;
  }

  remove() {
    this.isConnected = false;
  }
}

const end = (element, type = 'animationend', init = {}) => element.dispatchEvent(Object.assign(new Event(type), init));

describe('js/motion', () => {
  it('numbers list items for staggering, capped at six steps by default', () => {
    const items = Array.from({ length: 12 }, () => new FakeElement());
    stagger(items);
    assert.equal(STAGGER_MAX, 5);
    assert.deepEqual(items.map((item) => item.style.getPropertyValue('--ds-i')), ['0', '1', '2', '3', '4', '5', '5', '5', '5', '5', '5', '5']);
    stagger(items, { max: 2 });
    assert.equal(items[7].style.getPropertyValue('--ds-i'), '2');
    stagger(items.slice(0, 2), { from: 3 });
    assert.equal(items[1].style.getPropertyValue('--ds-i'), '4');
  });

  it('replays a one-shot class', () => {
    const element = new FakeElement();
    element.classList.add('ds-reveal');
    replay(element, 'ds-reveal');
    assert.equal(element.classList.contains('ds-reveal'), true);
    replay(null, 'x');
  });

  it('settles on the element\'s own animationend, ignoring children and other properties', async () => {
    const element = new FakeElement();
    let done = false;
    const promise = settled(element, { event: 'transitionend', property: 'max-height', timeout: 5000 }).then(() => { done = true; });
    end(element, 'transitionend', { propertyName: 'opacity' });
    const child = new FakeElement();
    child.dispatchEvent(new Event('transitionend'));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(done, false);
    end(element, 'transitionend', { propertyName: 'max-height' });
    await promise;
    assert.equal(done, true);
  });

  it('settles after the timeout when no animation runs (hidden or detached elements)', async (t) => {
    // The test context resets the mocked timers, also when an assertion fails.
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let done = false;
    const promise = settled(new FakeElement(), { timeout: 300 }).then(() => { done = true; });
    t.mock.timers.tick(299);
    await Promise.resolve();
    assert.equal(done, false);
    t.mock.timers.tick(1);
    await promise;
    assert.equal(done, true);
  });

  it('enter() plays the variant and cleans its classes up afterwards', async () => {
    const element = new FakeElement();
    const promise = enter(element, 'scale');
    assert.equal(element.classList.contains('ds-enter'), true);
    assert.equal(element.classList.contains('ds-enter--scale'), true);
    end(element);
    await promise;
    assert.equal(String(element.classList), '');
  });

  it('leave() removes or hides the element once the exit has played', async () => {
    const removed = new FakeElement();
    const removing = leave(removed, 'sink');
    assert.equal(removed.classList.contains('ds-leave--sink'), true);
    assert.equal(removed.isConnected, true);
    end(removed);
    await removing;
    assert.equal(removed.isConnected, false);

    const hidden = new FakeElement();
    const hiding = leave(hidden, '', { then: 'hide' });
    end(hidden);
    await hiding;
    assert.equal(hidden.hidden, true);
    assert.equal(hidden.isConnected, true);
    assert.equal(hidden.classList.contains('ds-leave'), false);
  });

  describe('loaderHoldMs', () => {
    it('a first token before the loader faded in replaces it at once', () => {
      assert.equal(loaderHoldMs(1000, 1150), 0);
      assert.equal(loaderHoldMs(1000, 1000 + LOADER_DELAY_MS), 0);
    });

    it('a loader that just appeared stays until it was visible long enough', () => {
      // First token at 300ms: the loader leaves at 650ms (200ms delay + 450ms).
      assert.equal(LOADER_DELAY_MS + LOADER_MIN_VISIBLE_MS, 650);
      assert.equal(1300 + loaderHoldMs(1000, 1300), 1650);
      assert.equal(loaderHoldMs(1000, 1600), 50);
    });

    it('a loader shown long enough goes without delay', () => {
      assert.equal(loaderHoldMs(1000, 1650), 0);
      assert.equal(loaderHoldMs(1000, 9000), 0);
    });
  });

  describe('settleLoader', () => {
    it('resolves at once when the indicator never became visible', async (t) => {
      const startedAt = 10_000;
      // The test context restores the spy, also when an assertion fails.
      const timer = t.mock.method(globalThis, 'setTimeout');
      await settleLoader(startedAt, startedAt + LOADER_DELAY_MS - 1);
      assert.equal(timer.mock.callCount(), 0);
    });

    it('keeps a visible indicator up for the minimum time', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const startedAt = 10_000;
      let done = false;
      const promise = settleLoader(startedAt, startedAt + LOADER_DELAY_MS + 50).then(() => { done = true; });
      t.mock.timers.tick(LOADER_MIN_VISIBLE_MS - 51);
      await Promise.resolve();
      assert.equal(done, false);
      t.mock.timers.tick(1);
      await promise;
      assert.equal(done, true);
    });

    it('resolves at once when the indicator was visible long enough', async () => {
      await settleLoader(0, LOADER_DELAY_MS + LOADER_MIN_VISIBLE_MS);
    });
  });

  describe('countUp', () => {
    const fakeWindow = ({ reduce = false } = {}) => {
      const frames = [];
      let now = 0;
      return {
        frames,
        advance(ms) {
          now += ms;
          const pending = frames.splice(0);
          pending.forEach((callback) => callback(now));
        },
        performance: { now: () => now },
        requestAnimationFrame: (callback) => frames.push(callback),
        matchMedia: () => ({ matches: reduce }),
      };
    };

    it('counts up with an ease-out and lands exactly on the value', () => {
      const win = fakeWindow();
      const element = new FakeElement();
      countUp(element, 200, { duration: 100, win });
      assert.equal(element.textContent, '0');
      win.advance(50);
      assert.equal(element.textContent, String(Math.round(200 * easeOutCubic(0.5))));
      win.advance(60);
      assert.equal(element.textContent, '200');
      assert.equal(win.frames.length, 0);
    });

    it('takes --ds-dur-glide (600 ms) by default', () => {
      assert.equal(COUNT_UP_MS, 600);
      const win = fakeWindow();
      const element = new FakeElement();
      countUp(element, 100, { win });
      win.advance(COUNT_UP_MS - 10);
      assert.equal(win.frames.length, 1, 'still counting just before the end');
      win.advance(10);
      assert.equal(element.textContent, '100');
      assert.equal(win.frames.length, 0);
    });

    it('shows the value at once with reduced motion or without animation frames', () => {
      const element = new FakeElement();
      countUp(element, 42, { win: fakeWindow({ reduce: true }) });
      assert.equal(element.textContent, '42');
      countUp(element, 7, { win: undefined, format: (value) => `${value}%` });
      assert.equal(element.textContent, '7%');
    });
  });

  it('reads the reduced-motion preference defensively', () => {
    assert.equal(prefersReducedMotion({ matchMedia: () => ({ matches: true }) }), true);
    assert.equal(prefersReducedMotion({}), false);
    assert.equal(prefersReducedMotion({ matchMedia: () => { throw new Error('no'); } }), false);
    assert.equal(prefersReducedMotion(undefined), false);
  });
});
