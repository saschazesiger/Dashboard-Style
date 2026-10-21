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
  MOTION_FALLBACKS,
  STAGGER_MAX,
  busy,
  cancel,
  countUp,
  crossfade,
  easeOutCubic,
  enter,
  enterAll,
  flip,
  leave,
  loaderHoldMs,
  motionDuration,
  motionEasing,
  originFrom,
  replay,
  resyncScroll,
  roll,
  settleLoader,
  settled,
  stagger,
  staggerOnce,
  transition,
  travelDuration,
} from '../src/js/motion.js';

/** Just enough of an element for the motion helpers (no DOM in node:test). */
class FakeElement extends EventTarget {
  constructor(doc = null) {
    super();
    const classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toString: () => [...classes].join(' '),
      [Symbol.iterator]: () => [...classes][Symbol.iterator](),
    };
    const properties = new Map();
    this.style = {
      setProperty: (name, value) => properties.set(name, value),
      getPropertyValue: (name) => properties.get(name) ?? '',
      removeProperty: (name) => properties.delete(name),
    };
    const attributes = new Map();
    this.hasAttribute = (name) => attributes.has(name);
    this.getAttribute = (name) => (attributes.has(name) ? attributes.get(name) : null);
    this.setAttribute = (name, value) => attributes.set(name, String(value));
    this.removeAttribute = (name) => attributes.delete(name);
    this.nodeType = 1;
    this.hidden = false;
    this.inert = false;
    this.isConnected = true;
    this.textContent = '';
    this.children = [];
    this.parentElement = null;
    this.ownerDocument = doc;
  }

  append(...nodes) {
    for (const node of nodes) {
      node.parentElement?.children.splice(node.parentElement.children.indexOf(node), 1);
      node.parentElement = this;
      this.children.push(node);
    }
  }

  contains(node) {
    for (let current = node; current; current = current.parentElement) if (current === this) return true;
    return false;
  }

  closest(selector) {
    for (let current = this; current; current = current.parentElement) if (current.matches?.(selector)) return current;
    return null;
  }

  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  blur() {
    if (this.ownerDocument?.activeElement === this) this.ownerDocument.activeElement = this.ownerDocument.body;
  }

  /** The children as the node list (the fake has element children only). */
  get childNodes() {
    return this.children;
  }

  get parentNode() {
    return this.parentElement;
  }

  get firstChild() {
    return this.children[0] ?? null;
  }

  set className(value) {
    for (const name of String(value).split(/\s+/).filter(Boolean)) this.classList.add(name);
  }

  prepend(...nodes) {
    const rest = this.children.splice(0);
    this.append(...nodes);
    for (const node of rest) if (!nodes.includes(node)) this.children.push(node);
  }

  replaceChildren(...nodes) {
    for (const child of this.children.splice(0)) child.parentElement = null;
    this.append(...nodes);
  }

  isEqualNode(other) {
    return other === this;
  }

  remove() {
    this.isConnected = false;
    this.parentElement?.children.splice(this.parentElement.children.indexOf(this), 1);
    this.parentElement = null;
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

  it('stretches the default timeout with --ds-time-scale (slow motion)', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const element = new FakeElement();
    globalThis.getComputedStyle = (el) => ({ getPropertyValue: (name) => (el === element && name === '--ds-time-scale' ? ' 10' : '') });
    t.after(() => { delete globalThis.getComputedStyle; });
    let done = false;
    const promise = settled(element).then(() => { done = true; });
    t.mock.timers.tick(9999);
    await Promise.resolve();
    assert.equal(done, false);
    t.mock.timers.tick(1);
    await promise;
    assert.equal(done, true);
    // Without the token (outside a theme) it is the plain default.
    let plain = false;
    const other = settled(new FakeElement()).then(() => { plain = true; });
    t.mock.timers.tick(1000);
    await other;
    assert.equal(plain, true);
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

  describe('engine: state, interruption and waiting', () => {
    /** A document with focus, a window with frames and a viewport; `styles` feeds getComputedStyle. */
    function fakeDocument(styles = () => ({})) {
      const frames = [];
      const doc = {
        activeElement: null,
        frames,
        defaultView: {
          innerWidth: 1000,
          innerHeight: 800,
          requestAnimationFrame: (callback) => frames.push(callback),
          getComputedStyle: (el) => {
            const values = styles(el);
            return { ...values, getPropertyValue: (name) => values[name] ?? '' };
          },
        },
      };
      doc.body = new FakeElement(doc);
      doc.activeElement = doc.body;
      return doc;
    }

    /** An Animation as getAnimations() returns it; finish() and cancel() settle `finished`. */
    class FakeAnimation {
      constructor({ name, transition, id = '', pseudo = null, duration = 250, delay = 0, iterations = 1 } = {}) {
        if (name !== undefined) this.animationName = name;
        if (transition !== undefined) this.transitionProperty = transition;
        this.id = id;
        this.playState = 'running';
        this.currentTime = 0;
        this.playbackRate = 1;
        this.effect = { pseudoElement: pseudo, getComputedTiming: () => ({ endTime: delay + duration * iterations, iterations, duration, fill: 'none' }) };
        this.finished = new Promise((resolve, reject) => {
          this.finish = () => { this.playState = 'finished'; resolve(this); };
          this.abort = reject;
        });
        this.finished.catch(() => {});
      }

      cancel() {
        this.playState = 'idle';
        this.abort(new Error('AbortError'));
      }
    }

    const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

    it('settled() waits for both tracks of a pair, a cancel counts as done', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const element = new FakeElement();
      const fade = new FakeAnimation({ name: 'ds-fade-in' });
      const lift = new FakeAnimation({ name: 'ds-lift-in', duration: 350 });
      // Never finish: a state layer, a transition and a loop must not be waited for.
      const ignored = [new FakeAnimation({ name: 'ds-fade-in', pseudo: '::before' }), new FakeAnimation({ transition: 'opacity' }), new FakeAnimation({ name: 'ds-spin', iterations: Infinity })];
      element.getAnimations = () => [fade, lift, ...ignored];
      let done = false;
      const promise = settled(element).then(() => { done = true; });
      fade.finish();
      await flushPromises();
      assert.equal(done, false, 'the longer track still runs');
      lift.cancel();
      await promise;
      assert.equal(done, true);
    });

    it('settled() keeps only the given names, transitions only when asked', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const element = new FakeElement();
      const own = new FakeAnimation({ name: 'ds-fade-out' });
      const other = new FakeAnimation({ name: 'ds-pulse' });
      const height = new FakeAnimation({ transition: 'height' });
      const color = new FakeAnimation({ transition: 'color' });
      element.getAnimations = () => [own, other, height, color];
      const named = settled(element, { names: ['ds-fade-out'] });
      own.finish();
      await named;
      const transition = settled(element, { event: 'transitionend', property: 'height' });
      height.finish();
      await transition;
    });

    it('settled() resolves on the next frame when nothing runs', async () => {
      const doc = fakeDocument();
      const element = new FakeElement(doc);
      element.getAnimations = () => [];
      let done = false;
      const promise = settled(element).then(() => { done = true; });
      await flushPromises();
      assert.equal(done, false);
      assert.equal(doc.frames.length, 1);
      doc.frames.shift()();
      await promise;
      assert.equal(done, true);
    });

    it('settled() derives its ceiling from delay and duration (a long --ds-enter-delay is not cut off)', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const element = new FakeElement();
      element.getAnimations = () => [new FakeAnimation({ name: 'ds-fade-in', delay: 1500, duration: 250 })];
      let done = false;
      const promise = settled(element).then(() => { done = true; });
      t.mock.timers.tick(1849);
      await flushPromises();
      assert.equal(done, false);
      t.mock.timers.tick(1);
      await promise;
      assert.equal(done, true);
    });

    it('settled() keeps waiting while the animation is paused (a frozen page)', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const element = new FakeElement();
      const fade = new FakeAnimation({ name: 'ds-fade-in', duration: 250 });
      fade.playState = 'paused';
      element.getAnimations = () => [fade];
      let done = false;
      const promise = settled(element).then(() => { done = true; });
      t.mock.timers.tick(5000);
      await flushPromises();
      assert.equal(done, false);
      fade.playState = 'running';
      t.mock.timers.tick(350);
      await flushPromises();
      t.mock.timers.tick(350);
      await promise;
      assert.equal(done, true);
      // An explicit timeout is a hard ceiling.
      const hard = settled(element, { timeout: 100 });
      fade.playState = 'paused';
      t.mock.timers.tick(100);
      await hard;
    });

    it('settled() without getAnimations ignores pseudo-element events', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const element = new FakeElement();
      let done = false;
      const promise = settled(element, { names: ['ds-fade-in', 'ds-lift-in'] }).then(() => { done = true; });
      end(element, 'animationend', { animationName: 'ds-fade-in', pseudoElement: '::before' });
      end(element, 'animationend', { animationName: 'ds-fade-in' });
      await flushPromises();
      assert.equal(done, false, 'one of two names ended');
      end(element, 'animationcancel', { animationName: 'ds-lift-in' });
      await promise;
    });

    it('enter() keeps only the last variant; leave() then enter() keeps the element', async () => {
      const element = new FakeElement();
      enter(element, 'fill-x');
      const entering = enter(element, 'scale');
      assert.equal(String(element.classList), 'ds-enter ds-enter--scale');
      end(element);
      await entering;
      assert.equal(String(element.classList), '');

      const leaving = leave(element, 'sink', { then: 'hide' });
      const back = enter(element);
      assert.equal(String(element.classList), 'ds-enter');
      end(element);
      await Promise.all([leaving, back]);
      assert.equal(element.isConnected, true);
      assert.equal(element.hidden, false);
      assert.equal(element.inert, false);
      assert.equal(String(element.classList), '');
    });

    it('a double leave() removes once, with only the last variant', async () => {
      const element = new FakeElement();
      let removed = 0;
      element.remove = () => { removed += 1; };
      const first = leave(element, 'sink', { then: 'keep' });
      const second = leave(element, 'scale');
      assert.equal(String(element.classList), 'ds-leave ds-leave--scale');
      end(element);
      await Promise.all([first, second]);
      assert.equal(removed, 1);
    });

    it('then: "keep" stays inert and invisible until enter() or cancel()', async () => {
      const element = new FakeElement();
      const kept = leave(element, '', { then: 'keep' });
      end(element);
      await kept;
      assert.equal(element.isConnected, true);
      assert.equal(element.inert, true);
      assert.equal(element.classList.contains('ds-leave'), true);
      const entering = enter(element, 'fade');
      assert.equal(element.inert, false);
      assert.equal(String(element.classList), 'ds-enter ds-enter--fade');
      end(element);
      await entering;

      const other = new FakeElement();
      const pending = leave(other, 'sink', { then: 'remove' });
      cancel(other);
      assert.equal(String(other.classList), '');
      assert.equal(other.inert, false);
      end(other);
      await pending;
      assert.equal(other.isConnected, true, 'a cancelled leave() never removes');
    });

    it('enter() clears hidden and inert', () => {
      const element = new FakeElement();
      element.hidden = true;
      element.inert = true;
      enter(element);
      assert.equal(element.hidden, false);
      assert.equal(element.inert, false);
    });

    it('leave() moves focus to the opener before the element turns inert', async () => {
      const doc = fakeDocument();
      const opener = new FakeElement(doc);
      const panel = new FakeElement(doc);
      const field = new FakeElement(doc);
      doc.body.append(opener, panel);
      panel.append(field);
      opener.focus();
      enter(panel);
      field.focus();
      let focusWhenInert = null;
      let inert = false;
      Object.defineProperty(panel, 'inert', { get: () => inert, set: (value) => { if (value) focusWhenInert = doc.activeElement; inert = value; } });
      const hiding = leave(panel, '', { then: 'hide' });
      assert.equal(doc.activeElement, opener);
      assert.equal(focusWhenInert, opener, 'focus left before inert was set');
      assert.equal(panel.inert, true);
      end(panel);
      await hiding;
      assert.equal(panel.inert, false, 'hide clears inert');

      // An explicit target wins over the opener.
      const target = new FakeElement(doc);
      doc.body.append(target);
      const again = new FakeElement(doc);
      doc.body.append(again);
      again.append(field);
      field.focus();
      leave(again, '', { focus: () => target });
      assert.equal(doc.activeElement, target);
    });

    it('reads durations and easings from the computed tokens, else the fallbacks', () => {
      const values = { '--ds-dur-medium': 'calc(250ms * 2)', '--ds-dur-slow': '.35s', '--ds-dur-fast': '150ms', '--ds-ease-value': ' cubic-bezier(.2, 0, 0, 1)' };
      const doc = fakeDocument(() => values);
      const theme = new FakeElement(doc);
      theme.matches = (selector) => selector === '.ds-theme';
      const element = new FakeElement(doc);
      theme.append(element);
      assert.equal(motionDuration(element, '--ds-dur-medium'), 500);
      assert.equal(motionDuration(element, '--ds-dur-slow'), 350);
      assert.equal(motionDuration(element, '--ds-dur-fast'), 150);
      assert.equal(motionEasing(element, '--ds-ease-value'), 'cubic-bezier(.2, 0, 0, 1)');
      // Not set in this theme: the fallback.
      assert.equal(motionDuration(element, '--ds-dur-glide'), MOTION_FALLBACKS['--ds-dur-glide']);
      // Outside a theme.
      const outside = new FakeElement(doc);
      assert.equal(motionDuration(outside, '--ds-dur-medium'), 250);
      assert.equal(motionDuration(null, '--ds-hold-loader'), LOADER_MIN_VISIBLE_MS);
      assert.equal(motionEasing(outside, '--ds-ease-spatial'), MOTION_FALLBACKS['--ds-ease-out']);
      assert.equal(motionEasing(outside, '--ds-ease-value'), 'cubic-bezier(.2, 0, 0, 1)');
      assert.equal(LOADER_DELAY_MS, MOTION_FALLBACKS['--ds-delay-loader']);
      assert.equal(COUNT_UP_MS, MOTION_FALLBACKS['--ds-dur-glide']);
      assert.ok(Object.isFrozen(MOTION_FALLBACKS));
    });

    it('travelDuration() grows from --ds-dur-medium to --ds-dur-slow by distance', () => {
      assert.equal(travelDuration(null, 0), 250);
      assert.equal(travelDuration(null, 480), 350);
      assert.equal(travelDuration(null, -960), 350);
      let last = 0;
      for (let px = 0; px <= 600; px += 40) {
        const ms = travelDuration(null, px);
        assert.ok(ms >= last, `${px}px`);
        last = ms;
      }
    });

    it('replay() flushes style only when the class is there, without layout', () => {
      let reads = 0;
      const doc = fakeDocument(() => { reads += 1; return { animationName: 'none' }; });
      const element = new FakeElement(doc);
      Object.defineProperty(element, 'offsetWidth', { get: () => { throw new Error('layout read'); } });
      replay(element, 'ds-reveal');
      assert.equal(reads, 0);
      replay(element, 'ds-reveal');
      assert.equal(reads, 1);
      assert.equal(element.classList.contains('ds-reveal'), true);
    });

    it('enterAll() writes before it reads, skips items out of view and removes --ds-i afterwards', async () => {
      const log = [];
      const doc = fakeDocument(() => ({}));
      const items = Array.from({ length: 4 }, (_, index) => {
        const item = new FakeElement(doc);
        item.classList.add('ds-enter', 'ds-enter--fill-x');
        const remove = item.classList.remove;
        item.classList.remove = (...names) => { log.push('write'); remove(...names); };
        item.getBoundingClientRect = () => { log.push('read'); return index === 3 ? { top: 900, bottom: 940, left: 0, right: 100 } : { top: index * 50, bottom: index * 50 + 40, left: 0, right: 100 }; };
        return item;
      });
      const done = enterAll(items, 'scale');
      assert.deepEqual(log.slice(0, 4), ['write', 'write', 'write', 'write']);
      assert.ok(log.slice(4).every((entry) => entry === 'read'));
      assert.deepEqual(items.map((item) => item.style.getPropertyValue('--ds-i')), ['0', '1', '2', '']);
      assert.equal(String(items[3].classList), '', 'out of view: at rest, no entrance');
      assert.equal(String(items[1].classList), 'ds-enter ds-enter--scale');
      items.slice(0, 3).forEach((item) => end(item));
      await done;
      assert.deepEqual(items.map((item) => item.style.getPropertyValue('--ds-i')), ['', '', '', '']);
      assert.ok(items.every((item) => String(item.classList) === ''));
    });

    it('enterAll() leaves no --ds-i behind when enter() or a later enterAll() takes an item over', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const doc = fakeDocument();
      const items = Array.from({ length: 3 }, () => new FakeElement(doc));
      const steps = () => items.map((item) => item.style.getPropertyValue('--ds-i'));
      const first = enterAll(items, 'scale');
      assert.deepEqual(steps(), ['0', '1', '2']);
      // A plain entrance mid-batch never staggers.
      const single = enter(items[2], 'scale');
      assert.equal(items[2].style.getPropertyValue('--ds-i'), '');
      // A second batch while item 1 still moves: the handoff takes it over without a step.
      const moving = new FakeAnimation({ name: 'ds-scale-in' });
      items[1].getAnimations = () => [moving];
      const second = enterAll(items, 'scale');
      assert.deepEqual(steps(), ['0', '', '1']);
      items.forEach((item) => end(item));
      t.mock.timers.tick(1000);
      await Promise.all([first, single, second]);
      assert.deepEqual(steps(), ['', '', ''], 'every batch removes the steps it wrote');
      // A page's own --ds-i (stagger()) is never touched.
      stagger(items);
      enter(items[0], 'scale');
      assert.equal(items[0].style.getPropertyValue('--ds-i'), '0');
    });

    it('staggerOnce() staggers the first render only', async () => {
      const container = new FakeElement(fakeDocument());
      container.append(new FakeElement(container.ownerDocument), new FakeElement(container.ownerDocument));
      const first = staggerOnce(container);
      assert.equal(container.hasAttribute('data-ds-staggered'), true);
      assert.equal(String(container.children[1].classList), 'ds-enter ds-enter--swap');
      container.children.forEach((child) => end(child));
      await first;
      assert.ok(container.children.every((child) => String(child.classList) === '' && child.style.getPropertyValue('--ds-i') === ''));
      await staggerOnce(container);
      assert.equal(String(container.children[0].classList), '', 'a refresh never staggers');
    });

    it('enter() then leave() removes the element once, without the enter variant', async () => {
      const element = new FakeElement();
      let removed = 0;
      element.remove = () => { removed += 1; };
      const entering = enter(element, 'scale');
      const leaving = leave(element, 'sink');
      assert.equal(String(element.classList), 'ds-leave ds-leave--sink');
      end(element);
      await Promise.all([entering, leaving]);
      assert.equal(removed, 1);
      assert.equal(element.classList.contains('ds-enter--scale'), false);
    });

    /**
     * An element halfway through its entrance (ds-fade-in, ds-lift-in) whose
     * computed style answers like a browser: the snapshot while it moves, the
     * ends of a new animation while that one is paused at them. leave('sink')
     * brings ds-fade-out and ds-drop-out (150ms, --ds-ease-in); with
     * `sink: false` the exit is the default leave(), ds-fade-out only.
     */
    function movingElement(opacityNow, { sink = true } = {}) {
      const list = [];
      const calls = [];
      let created = false;
      class CssAnimation extends FakeAnimation {
        constructor(name, keyframes) {
          super({ name, duration: 150 });
          this.effect.getKeyframes = () => keyframes;
        }

        pause() {
          this.playState = 'paused';
        }
      }
      const doc = fakeDocument((el) => {
        const paused = (name) => list.find((animation) => animation.animationName === name && animation.playState === 'paused');
        const fade = paused('ds-fade-out');
        const drop = paused('ds-drop-out');
        const leaving = el.classList.contains('ds-leave');
        const exit = sink ? 'ds-fade-out, ds-drop-out' : 'ds-fade-out';
        const lifting = list[1].playState === 'running';
        return {
          animationName: leaving ? exit : 'ds-fade-in, ds-lift-in',
          animationTimingFunction: leaving ? exit.split(', ').map(() => 'cubic-bezier(.3, 0, 1, 1)').join(', ') : 'cubic-bezier(.2, 0, 0, 1), cubic-bezier(.05, .7, .1, 1)',
          opacity: fade ? (fade.currentTime === 0 ? '1' : '0') : String(opacityNow),
          translate: drop ? (drop.currentTime === 0 ? 'none' : '0px 8px') : (lifting ? '0px 3px' : 'none'),
          scale: 'none',
          'clip-path': 'none',
          transform: 'none',
          'stroke-dashoffset': '0',
        };
      });
      const element = new FakeElement(doc);
      list.push(new CssAnimation('ds-fade-in', [{ opacity: '0' }]), new CssAnimation('ds-lift-in', [{ translate: '0px 8px' }]));
      element.getAnimations = () => {
        if (element.classList.contains('ds-leave') && !created) {
          created = true;
          list.push(new CssAnimation('ds-fade-out', [{ opacity: '0' }]));
          if (sink) list.push(new CssAnimation('ds-drop-out', [{ translate: '0px 8px' }]));
        }
        return list.filter((animation) => animation.playState !== 'idle');
      };
      element.animate = (keyframes, timing) => {
        calls.push({ keyframes, timing });
        const animation = new FakeAnimation({ id: timing.id, duration: timing.duration });
        list.push(animation);
        return animation;
      };
      return { element, list, calls };
    }

    it('a handoff plays each track from the snapshot, on the exit curve, for the share left', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const { element, list, calls } = movingElement(0.6);
      const [fadeIn, liftIn] = list;
      const leaving = leave(element, 'sink', { then: 'hide' });
      assert.equal(fadeIn.playState, 'idle', 'the running entrance is cancelled');
      assert.equal(liftIn.playState, 'idle');
      assert.deepEqual(calls.map((call) => call.keyframes), [
        [{ opacity: '0.6' }, { opacity: '0' }],
        [{ translate: '0px 3px' }, { translate: '0px 8px' }],
      ]);
      for (const { timing } of calls) {
        assert.equal(timing.id, 'ds-handoff');
        assert.equal(timing.easing, 'cubic-bezier(.3, 0, 1, 1)', 'the curve of the new direction');
        assert.ok(Math.abs(timing.duration - 150 * 0.6) < 1e-9, `the share left: ${timing.duration}`);
        assert.equal(timing.delay, 0);
        assert.equal(timing.fill, 'forwards', 'an exit holds its end');
      }
      assert.equal(element.getAttribute('style'), null, 'no inline style');
      list.filter((animation) => animation.id === 'ds-handoff').forEach((animation) => animation.finish());
      await leaving;
      assert.equal(element.hidden, true);
    });

    it('a handoff glides a moving value the new motion has no track for to its rest (enter() then a fade-only leave())', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const { element, list, calls } = movingElement(0.6, { sink: false });
      const leaving = leave(element);
      assert.deepEqual(calls.map((call) => call.keyframes), [
        [{ opacity: '0.6' }, { opacity: '0' }],
        [{ translate: '0px 3px' }, { translate: 'none' }],
      ], 'the lift does not snap to its rest');
      for (const { timing } of calls) {
        assert.equal(timing.id, 'ds-handoff');
        assert.equal(timing.easing, 'cubic-bezier(.3, 0, 1, 1)', 'the exit curve');
        assert.ok(Math.abs(timing.duration - 150 * 0.6) < 1e-9, `the share left: ${timing.duration}`);
        assert.equal(timing.fill, 'forwards');
      }
      list.filter((animation) => animation.id === 'ds-handoff').forEach((animation) => animation.finish());
      await leaving;
      assert.equal(element.isConnected, false);
    });

    it('leave() marks an element it will remove as a pending removal; enter() and cancel() take the mark back', () => {
      const element = new FakeElement();
      leave(element);
      assert.equal(element.hasAttribute('data-ds-leaving'), true, 'DS.dom.morphHtml() skips it');
      enter(element);
      assert.equal(element.hasAttribute('data-ds-leaving'), false);
      leave(element, 'sink');
      cancel(element);
      assert.equal(element.hasAttribute('data-ds-leaving'), false);
      leave(element);
      leave(element, '', { then: 'hide' });
      assert.equal(element.hasAttribute('data-ds-leaving'), false, 'hide and keep stay in the DOM: no pending removal');
      leave(element, '', { then: 'keep' });
      assert.equal(element.hasAttribute('data-ds-leaving'), false);
      // A mark someone else set (flip(), a swap) stays theirs.
      const removed = new FakeElement();
      removed.setAttribute('data-ds-leaving', '');
      leave(removed);
      cancel(removed);
      assert.equal(removed.hasAttribute('data-ds-leaving'), true);
    });

    it('a handoff takes at least --ds-dur-micro', () => {
      const { element, calls } = movingElement(0.01);
      leave(element, 'sink');
      assert.equal(calls.length, 2);
      assert.ok(calls.every((call) => call.timing.duration === MOTION_FALLBACKS['--ds-dur-micro']), calls.map((call) => call.timing.duration).join());
    });

    it('originFrom() writes where a popup grows from, on every side, clamped', () => {
      const doc = fakeDocument(() => ({ borderRadius: '12px' }));
      const rect = (left, top, width, height) => ({ left, top, right: left + width, bottom: top + height, width, height });
      const panel = new FakeElement(doc);
      let box = rect(80, 48, 200, 200);
      panel.getBoundingClientRect = () => box;
      const trigger = new FakeElement(doc);
      let anchor = rect(100, 0, 100, 40);
      trigger.getBoundingClientRect = () => anchor;
      const written = () => [panel.style.getPropertyValue('--ds-motion-origin'), panel.style.getPropertyValue('--ds-clip-from')];

      assert.deepEqual(originFrom(trigger, panel), { origin: '70px 0px', side: 'bottom' });
      const bleed = 'calc(-1 * var(--ds-space-6, 24px))';
      assert.deepEqual(written(), ['70px 0px', `inset(${bleed} ${bleed} 100% ${bleed} round 12px)`]);

      anchor = rect(100, 300, 100, 40);
      assert.deepEqual(originFrom(trigger, panel), { origin: '70px 200px', side: 'top' });
      assert.equal(written()[1], `inset(100% ${bleed} ${bleed} ${bleed} round 12px)`);

      anchor = rect(0, 100, 40, 40);
      assert.deepEqual(originFrom(trigger, panel), { origin: '0px 72px', side: 'right' });
      assert.equal(written()[1], `inset(${bleed} 100% ${bleed} ${bleed} round 12px)`);

      anchor = rect(400, 100, 40, 40);
      assert.deepEqual(originFrom(trigger, panel), { origin: '200px 72px', side: 'left' });
      assert.equal(written()[1], `inset(${bleed} ${bleed} ${bleed} 100% round 12px)`);

      // A point (a context menu at the pointer), and a panel over its trigger.
      box = rect(10, 20, 100, 100);
      assert.deepEqual(originFrom({ x: 10, y: 20 }, panel), { origin: '0px 0px', side: 'bottom' });
      assert.deepEqual(originFrom({ x: 60, y: 70 }, panel), { origin: '50px 50px', side: 'bottom' });
    });

    /** A swap slot in a document that creates fake elements. */
    function slot() {
      const doc = fakeDocument();
      doc.createElement = () => new FakeElement(doc);
      return new FakeElement(doc);
    }

    it('crossfade() is safe to call again mid-swap: exactly one child stays', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const element = slot();
      crossfade(element, 'Saved');
      const first = element.children[0];
      crossfade(element, 'Saving');
      const done = crossfade(element, 'Done');
      assert.ok(element.classList.contains('ds-swap'));
      assert.equal(first.getAttribute('data-ds-leaving'), '');
      assert.equal(first.getAttribute('aria-hidden'), 'true');
      t.mock.timers.tick(1000);
      await done;
      await flushPromises();
      assert.deepEqual(element.children.map((child) => child.textContent), ['Done']);
      assert.equal(element.children[0].hasAttribute('data-ds-leaving'), false);

      // Back to a node that is still leaving: it returns and stays.
      const a = new FakeElement(element.ownerDocument);
      const b = new FakeElement(element.ownerDocument);
      crossfade(element, a);
      crossfade(element, b);
      const back = crossfade(element, a);
      t.mock.timers.tick(1000);
      await back;
      await flushPromises();
      assert.deepEqual(element.children, [a]);
      assert.equal(a.hasAttribute('data-ds-leaving'), false);
      assert.equal(a.hasAttribute('aria-hidden'), false);

      assert.throws(() => crossfade(element, 'x', { kind: 'shape' }), TypeError);
    });

    it("crossfade(..., { kind: 'icon' }) builds a .ds-icon-swap and flips data-swap to the face it filled", async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const element = slot();
      const doc = element.ownerDocument;
      const copy = new FakeElement(doc);
      element.append(copy);
      const check = new FakeElement(doc);
      const done = crossfade(element, check, { kind: 'icon' });
      assert.ok(element.classList.contains('ds-icon-swap'));
      const [a, b] = element.children;
      assert.ok(a.classList.contains('ds-icon-swap__a') && b.classList.contains('ds-icon-swap__b'));
      assert.deepEqual(a.children, [copy], 'the current icon is face a');
      assert.deepEqual(b.children, [check]);
      assert.equal(element.getAttribute('data-swap'), 'b');
      t.mock.timers.tick(1000);
      await done;

      // Back to a face: only data-swap flips, both icons stay.
      crossfade(element, a, { kind: 'icon' });
      assert.equal(element.getAttribute('data-swap'), 'a');
      assert.deepEqual(element.children, [a, b]);
      assert.deepEqual(b.children, [check]);
      // A new icon goes into the hidden face.
      const pause = new FakeElement(doc);
      crossfade(element, pause, { kind: 'icon' });
      assert.equal(element.getAttribute('data-swap'), 'b');
      assert.deepEqual(b.children, [pause]);
      assert.deepEqual(a.children, [copy]);

      // Without data-swap an aria-pressed="true" ancestor shows b, so the next icon goes into a.
      const toggle = new FakeElement(doc);
      toggle.setAttribute('aria-pressed', 'true');
      toggle.matches = (selector) => selector === '[aria-pressed="true"]';
      const icon = slot();
      toggle.append(icon);
      const faceA = new FakeElement(doc);
      faceA.className = 'ds-icon-swap__a';
      const faceB = new FakeElement(doc);
      faceB.className = 'ds-icon-swap__b';
      icon.append(faceA, faceB);
      const play = new FakeElement(doc);
      crossfade(icon, play, { kind: 'icon' });
      assert.deepEqual(icon.children, [faceA, faceB], 'existing faces are kept');
      assert.deepEqual(faceA.children, [play]);
      assert.equal(icon.getAttribute('data-swap'), 'a');
      t.mock.timers.tick(1000);
    });

    describe('busy()', () => {
      /** Work that the test resolves or rejects by hand. */
      function deferred() {
        const handle = {};
        handle.promise = new Promise((resolve, reject) => Object.assign(handle, { resolve, reject }));
        return handle;
      }

      it('sets aria-busy at once; work faster than the loader delay is never held', async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const button = new FakeElement();
        const work = deferred();
        const done = busy(button, () => work.promise);
        assert.equal(button.getAttribute('aria-busy'), 'true');
        t.mock.timers.tick(LOADER_DELAY_MS - 50);
        work.resolve('saved');
        await flushPromises();
        assert.equal(button.getAttribute('aria-busy'), null, 'no hold: the busy face never showed');
        assert.equal(await done, 'saved');
        assert.ok(button.classList.contains('ds-btn--done'));
      });

      it('holds a busy face that showed for the loader minimum, then shows done for --ds-hold-success', async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const button = new FakeElement();
        const work = deferred();
        const done = busy(button, () => work.promise);
        t.mock.timers.tick(LOADER_DELAY_MS + 50);
        work.resolve(42);
        await flushPromises();
        // Visible for 50ms: it stays until it was visible for --ds-hold-loader.
        t.mock.timers.tick(LOADER_MIN_VISIBLE_MS - 51);
        await flushPromises();
        assert.equal(button.getAttribute('aria-busy'), 'true');
        assert.equal(button.classList.contains('ds-btn--done'), false);
        t.mock.timers.tick(1);
        await flushPromises();
        assert.equal(button.getAttribute('aria-busy'), null);
        assert.ok(button.classList.contains('ds-btn--done'));
        assert.equal(await done, 42);
        t.mock.timers.tick(MOTION_FALLBACKS['--ds-hold-success'] - 1);
        assert.ok(button.classList.contains('ds-btn--done'));
        t.mock.timers.tick(1);
        assert.equal(button.classList.contains('ds-btn--done'), false);
      });

      it('done: false skips the success face', async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const button = new FakeElement();
        await busy(button, 'ready', { done: false });
        assert.equal(button.getAttribute('aria-busy'), null);
        assert.equal(button.classList.contains('ds-btn--done'), false);
      });

      it('clears at once on failure and rethrows', async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const button = new FakeElement();
        const work = deferred();
        const done = busy(button, () => work.promise);
        t.mock.timers.tick(LOADER_DELAY_MS + 50);
        const error = new Error('offline');
        work.reject(error);
        await assert.rejects(done, (thrown) => thrown === error);
        assert.equal(button.getAttribute('aria-busy'), null, 'no hold on failure');
        assert.equal(button.classList.contains('ds-btn--done'), false);
        // A throwing function rejects too, and leaves the button usable.
        await assert.rejects(busy(button, () => { throw error; }), (thrown) => thrown === error);
        assert.equal(button.getAttribute('aria-busy'), null);
      });

      it('a second call while busy returns the same promise and runs work once', async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const button = new FakeElement();
        const work = deferred();
        let calls = 0;
        const run = () => { calls += 1; return work.promise; };
        const first = busy(button, run);
        const second = busy(button, run);
        assert.equal(second, first);
        assert.equal(calls, 1);
        work.resolve('once');
        assert.equal(await second, 'once');
        // A call during the success face takes it off and starts again.
        assert.ok(button.classList.contains('ds-btn--done'));
        const third = busy(button, () => 'again');
        assert.equal(button.classList.contains('ds-btn--done'), false);
        assert.equal(button.getAttribute('aria-busy'), 'true');
        assert.equal(await third, 'again');
      });

      it('scales its times with --ds-time-scale (motionDuration)', async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const values = { '--ds-delay-loader': 'calc(200ms * 10)', '--ds-hold-loader': 'calc(450ms * 10)', '--ds-hold-success': 'calc(600ms * 10)' };
        const doc = fakeDocument(() => values);
        const theme = new FakeElement(doc);
        theme.matches = (selector) => selector === '.ds-theme';
        const button = new FakeElement(doc);
        theme.append(button);
        const work = deferred();
        const done = busy(button, () => work.promise);
        // 2500ms: the busy face showed 500ms ago at a time scale of 10.
        t.mock.timers.tick(2500);
        work.resolve();
        await flushPromises();
        t.mock.timers.tick(4000 - 1);
        await flushPromises();
        assert.equal(button.getAttribute('aria-busy'), 'true');
        t.mock.timers.tick(1);
        await done;
        t.mock.timers.tick(6000 - 1);
        assert.ok(button.classList.contains('ds-btn--done'));
        t.mock.timers.tick(1);
        assert.equal(button.classList.contains('ds-btn--done'), false);
      });
    });

    it('roll() keeps only the last line; the same text changes nothing', async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const element = slot();
      roll(element, 'Syncing 1 of 3');
      roll(element, 'Syncing 2 of 3');
      const last = roll(element, 'Syncing 3 of 3');
      t.mock.timers.tick(1000);
      await last;
      await flushPromises();
      assert.deepEqual(element.children.map((child) => child.textContent), ['Syncing 3 of 3']);
      const line = element.children[0];
      assert.equal(line.style.getPropertyValue('--ds-enter-keyframes'), '', 'the enter hooks go once it settled');
      await roll(element, 'Syncing 3 of 3');
      assert.deepEqual(element.children, [line]);
    });

    describe('flip()', () => {
      /**
       * A list whose items sit at `y` (40px rows); a glide in flight shows
       * as `offset` in the measured rect until it is cancelled.
       */
      function list(names, { hover, styles } = {}) {
        const doc = fakeDocument(styles);
        const container = new FakeElement(doc);
        container.getBoundingClientRect = () => ({ left: 0, top: 0, right: 200, bottom: 800 });
        const items = new Map();
        const calls = [];
        for (const name of names) {
          const item = new FakeElement(doc);
          item.textContent = name;
          item.offset = 0;
          item.getBoundingClientRect = () => {
            const top = container.children.indexOf(item) * 40 + item.offset;
            return { left: 0, top, right: 200, bottom: top + 40 };
          };
          item.animate = (keyframes, timing) => {
            const animation = new FakeAnimation({ id: timing.id, duration: timing.duration });
            const cancel = animation.cancel.bind(animation);
            animation.cancel = () => { item.offset = 0; cancel(); };
            calls.push({ item, keyframes, timing, animation });
            return animation;
          };
          items.set(name, item);
          container.append(item);
        }
        if (hover) {
          // A first live call attaches the guard, then the pointer comes.
          flip(container, () => {}, { live: true });
          container.dispatchEvent(Object.assign(new Event('pointerover'), { pointerType: hover }));
        }
        const order = (...wanted) => () => {
          const next = wanted.map((name) => items.get(name));
          container.children.splice(0, container.children.length, ...next);
        };
        return { container, items, calls, order };
      }

      it('glides moved items on translate from their old place, on the spring, for travelDuration()', () => {
        const { container, items, calls, order } = list(['a', 'b', 'c']);
        flip(container, order('c', 'a', 'b'));
        assert.equal(calls.length, 3);
        const byName = (name) => calls.find((call) => call.item === items.get(name));
        assert.deepEqual(byName('c').keyframes, [{ translate: '0px 80px' }, { translate: '0px 0px' }]);
        assert.deepEqual(byName('a').keyframes, [{ translate: '0px -40px' }, { translate: '0px 0px' }]);
        const { timing } = byName('c');
        assert.equal(timing.id, 'ds-flip');
        assert.equal(timing.composite, 'add');
        assert.equal(timing.easing, MOTION_FALLBACKS['--ds-ease-spatial']);
        assert.equal(timing.duration, travelDuration(null, 80));
      });

      it('a second call mid-flight starts from where each item is', () => {
        const { container, items, calls, order } = list(['a', 'b', 'c', 'd']);
        flip(container, order('b', 'c', 'd', 'a'));
        const a = items.get('a');
        const glide = calls.find((call) => call.item === a).animation;
        // Halfway: a shows 60px above its new place (120px).
        a.offset = -60;
        flip(container, order('b', 'c', 'a', 'd'));
        assert.equal(glide.playState, 'idle', 'the glide in flight is cancelled');
        const again = calls.filter((call) => call.item === a).at(-1);
        assert.deepEqual(again.keyframes[0], { translate: '0px -20px' }, 'from 60px to 80px');
      });

      it('20 calls within a second leave at most one glide per item', () => {
        const { container, items, calls, order } = list(['a', 'b', 'c', 'd']);
        const orders = [['b', 'a', 'c', 'd'], ['d', 'c', 'b', 'a'], ['a', 'b', 'c', 'd']];
        for (let index = 0; index < 20; index += 1) flip(container, order(...orders[index % orders.length]));
        for (const item of items.values()) {
          const running = calls.filter((call) => call.item === item && call.animation.playState !== 'idle');
          assert.ok(running.length <= 1, `${item.textContent}: ${running.length}`);
        }
      });

      it('holds the container at its height while a removed item leaves, then gives it back', async () => {
        const { container, items } = list(['a', 'b', 'c']);
        container.style.minHeight = '2px';
        const c = items.get('c');
        const done = flip(container, (hooks) => {
          // A pending removal stays in the list (morphHtml marks it leaving).
          c.setAttribute('data-ds-leaving', '');
          hooks.onRemove(c);
        });
        assert.equal(container.style.minHeight, '800px', 'the First height, at once');
        assert.equal(c.style.getPropertyValue('position'), 'absolute');
        end(c);
        await done;
        assert.equal(c.isConnected, false);
        assert.equal(container.style.minHeight, '2px', 'the page\'s own min-height is back');
      });

      it('raises the moving items while they glide (the farthest on top), then gives their styles back', async () => {
        const styles = () => ({ position: 'static', '--ds-z-raised': ' 1' });
        const { container, items, calls, order } = list(['a', 'b', 'c', 'd'], { styles });
        container.style.isolation = 'auto';
        items.get('b').style.zIndex = '3';
        // d rises three rows past a, b and c, which sink one row each; b keeps its z-index afterwards.
        flip(container, order('d', 'a', 'b', 'c'));
        const z = (name) => items.get(name).style.zIndex;
        assert.equal(container.style.isolation, 'isolate', 'no rank reaches past the list');
        assert.equal(items.get('d').style.position, 'relative');
        assert.equal(z('d'), '4', 'the farthest travel on top');
        assert.deepEqual(['a', 'b', 'c'].map(z).sort(), ['1', '2', '3']);
        // A second call mid-flight: d's glide is cancelled and d is raised again, not lowered.
        flip(container, order('a', 'd', 'b', 'c'));
        await flushPromises();
        assert.equal(items.get('d').style.position, 'relative');
        assert.notEqual(z('d'), undefined);
        calls.forEach((call) => call.animation.finish());
        await flushPromises();
        assert.equal(container.style.isolation, 'auto');
        assert.equal(z('b'), '3', 'the page\'s own z-index is back');
        for (const name of ['a', 'c', 'd']) {
          assert.equal(z(name), undefined, name);
          assert.equal(items.get(name).style.position, undefined, name);
        }
      });

      it('moves without motion above `max` moving items', () => {
        const { container, calls, order } = list(['a', 'b', 'c']);
        flip(container, order('c', 'b', 'a'), { max: 1 });
        assert.equal(calls.length, 0);
        assert.deepEqual(container.children.map((item) => item.textContent), ['c', 'b', 'a']);
      });

      it('live: a mouse over the list holds the reorder (values at once), at most `hold`', async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout'] });
        const { container, calls, order } = list(['a', 'b', 'c'], { hover: 'mouse' });
        const seen = [];
        const reorder = order('c', 'b', 'a');
        const done = flip(container, (options) => {
          seen.push(options.holdOrder);
          if (!options.holdOrder) reorder();
        }, { live: true });
        assert.deepEqual(seen, [true], 'values are patched at once, in place');
        assert.equal(calls.length, 0);
        assert.deepEqual(container.children.map((item) => item.textContent), ['a', 'b', 'c']);
        t.mock.timers.tick(1999);
        assert.equal(calls.length, 0);
        t.mock.timers.tick(1);
        assert.deepEqual(seen, [true, false]);
        assert.deepEqual(container.children.map((item) => item.textContent), ['c', 'b', 'a']);
        assert.equal(calls.length, 2);
        calls.forEach((call) => call.animation.finish());
        await done;
      });

      it('live: the reorder runs once the mouse leaves; touch never holds', () => {
        const held = list(['a', 'b'], { hover: 'mouse' });
        flip(held.container, (options) => { if (!options.holdOrder) held.order('b', 'a')(); }, { live: true });
        assert.equal(held.calls.length, 0);
        held.container.dispatchEvent(new Event('pointerleave'));
        assert.equal(held.calls.length, 2);

        const touched = list(['a', 'b'], { hover: 'touch' });
        const seen = [];
        flip(touched.container, (options) => { seen.push(options.holdOrder); touched.order('b', 'a')(); }, { live: true });
        assert.deepEqual(seen, [false]);
        assert.equal(touched.calls.length, 2);
      });
    });
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

    it('takes its own delay and minimum (a boot screen)', () => {
      assert.equal(loaderHoldMs(1000, 1300, { delay: 400 }), 0, 'ready before the boot delay: never shown');
      assert.equal(loaderHoldMs(1000, 1500, { delay: 400 }), 350);
      assert.equal(loaderHoldMs(1000, 1500, { delay: 400, minVisible: 200 }), 100);
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
    /** Animation frames by hand: `advance(ms)` runs the frames requested so far. */
    const fakeWindow = () => {
      const frames = new Map();
      let now = 0;
      let id = 0;
      return {
        get frames() {
          return [...frames.values()];
        },
        advance(ms) {
          now += ms;
          const pending = [...frames.values()];
          frames.clear();
          pending.forEach((callback) => callback(now));
        },
        performance: { now: () => now },
        requestAnimationFrame: (callback) => {
          id += 1;
          frames.set(id, callback);
          return id;
        },
        cancelAnimationFrame: (handle) => frames.delete(handle),
      };
    };

    it('counts on --ds-ease-value and lands exactly on the value', () => {
      const win = fakeWindow();
      const element = new FakeElement();
      countUp(element, 200, { duration: 100, win });
      win.advance(0); // the first frame: the count starts here
      assert.equal(element.textContent, '0');
      // cubic-bezier(.2, 0, 0, 1) is about halfway at 20% of the time.
      win.advance(20);
      assert.ok(Math.abs(Number(element.textContent) - 100) <= 2, element.textContent);
      assert.notEqual(easeOutCubic(0.5), 0.5, 'easeOutCubic stays exported (deprecated)');
      win.advance(90);
      assert.equal(element.textContent, '200');
      assert.equal(win.frames.length, 0);
    });

    it('starts on its first frame, as a CSS transition set in the same task does', () => {
      const win = fakeWindow();
      const element = new FakeElement();
      countUp(element, 200, { duration: 100, win });
      win.advance(50);
      assert.equal(element.textContent, '0', 'a late first frame takes nothing from the count');
      win.advance(20);
      assert.ok(Math.abs(Number(element.textContent) - 100) <= 2, element.textContent);
    });

    it('runs on a clock animation where the element animates, so pausing it holds the figure', () => {
      const win = fakeWindow();
      const element = new FakeElement();
      const clock = { id: '', currentTime: null, playState: 'running', cancel() { this.playState = 'idle'; } };
      let timing = null;
      element.animate = (keyframes, options) => {
        timing = { keyframes, ...options };
        return clock;
      };
      countUp(element, 200, { duration: 100, win });
      assert.deepEqual(timing, { keyframes: [], id: 'ds-count', duration: 100 });
      assert.equal(clock.id, 'ds-count');
      win.advance(50);
      assert.equal(element.textContent, '0', 'no start time yet: nothing elapsed');
      clock.currentTime = 20;
      win.advance(16);
      assert.ok(Math.abs(Number(element.textContent) - 100) <= 2, element.textContent);
      win.advance(500);
      assert.ok(Math.abs(Number(element.textContent) - 100) <= 2, 'a paused clock holds the figure');
      clock.currentTime = 100;
      win.advance(16);
      assert.equal(element.textContent, '200');
      assert.equal(clock.playState, 'idle', 'the clock goes with the count');
      assert.equal(win.frames.length, 0);
    });

    it('takes --ds-dur-glide (600 ms) by default', () => {
      assert.equal(COUNT_UP_MS, 600);
      const win = fakeWindow();
      const element = new FakeElement();
      countUp(element, 100, { win });
      win.advance(0); // the first frame: the count starts here
      win.advance(COUNT_UP_MS - 10);
      assert.equal(win.frames.length, 1, 'still counting just before the end');
      win.advance(10);
      assert.equal(element.textContent, '100');
      assert.equal(win.frames.length, 0);
    });

    it('shows the value at once without animation frames', () => {
      const element = new FakeElement();
      countUp(element, 7, { win: undefined, format: (value) => `${value}%` });
      assert.equal(element.textContent, '7%');
    });

    it('a new call takes over from the shown value: one loop, the last target wins', () => {
      const win = fakeWindow();
      const element = new FakeElement();
      const first = countUp(element, 100, { duration: 600, win });
      win.advance(0); // the first frame: the count starts here
      win.advance(100);
      const shown = Number(element.textContent);
      assert.ok(shown > 0 && shown < 100, `${shown}`);
      const second = countUp(element, 10, { duration: 600, win });
      assert.notEqual(second, first);
      assert.equal(element.textContent, String(shown), 'starts from the shown figure');
      assert.equal(win.frames.length, 1, 'one loop');
      win.advance(100);
      assert.equal(win.frames.length, 1, 'still one loop');
      win.advance(600);
      assert.equal(element.textContent, '10');
      assert.equal(win.frames.length, 0);
    });

    it('the same value changes nothing; a running count to it keeps its handle', () => {
      const win = fakeWindow();
      const element = new FakeElement();
      const handle = countUp(element, 40, { duration: 100, win });
      win.advance(0); // the first frame: the count starts here
      assert.equal(countUp(element, 40, { duration: 100, win }), handle);
      win.advance(200);
      assert.equal(element.textContent, '40');
      countUp(element, 40, { duration: 100, win });
      assert.equal(win.frames.length, 0, 'no new loop');
      assert.equal(element.textContent, '40');
      // The next count starts from 40.
      countUp(element, 50, { duration: 100, win });
      assert.equal(element.textContent, '40');
    });

    it('cancel() and a disconnect write the final value; finished resolves', async () => {
      const win = fakeWindow();
      const element = new FakeElement();
      const handle = countUp(element, 50, { duration: 600, win });
      assert.equal(typeof handle.cancel, 'function');
      assert.ok(handle.finished instanceof Promise);
      win.advance(100);
      handle.cancel();
      assert.equal(element.textContent, '50');
      await handle.finished;
      win.advance(16);
      assert.equal(element.textContent, '50', 'the cancelled loop writes nothing more');

      const gone = new FakeElement();
      const counting = countUp(gone, 80, { duration: 600, win });
      win.advance(50);
      gone.isConnected = false;
      win.advance(16);
      assert.equal(gone.textContent, '80');
      await counting.finished;
    });

    it('duration 0 and non-finite targets write at once', async () => {
      const win = fakeWindow();
      const element = new FakeElement();
      const handle = countUp(element, 12, { duration: 0, win });
      assert.equal(element.textContent, '12');
      assert.equal(win.frames.length, 0);
      await handle.finished;
      countUp(element, Number.NaN, { win, format: (value) => (Number.isFinite(value) ? String(value) : '–') });
      assert.equal(element.textContent, '–');
      assert.equal(win.frames.length, 0);
      // After a non-finite value the next count starts from 0.
      countUp(element, 10, { duration: 100, win });
      assert.equal(element.textContent, '0');
    });

    it('is aria-busy while it counts, and restores what was there', () => {
      const win = fakeWindow();
      const element = new FakeElement();
      countUp(element, 30, { duration: 100, win });
      win.advance(0); // the first frame: the count starts here
      assert.equal(element.getAttribute('aria-busy'), 'true');
      win.advance(200);
      assert.equal(element.getAttribute('aria-busy'), null);
      element.setAttribute('aria-busy', 'false');
      countUp(element, 60, { duration: 100, win });
      win.advance(0); // the first frame: the count starts here
      assert.equal(element.getAttribute('aria-busy'), 'true');
      win.advance(200);
      assert.equal(element.getAttribute('aria-busy'), 'false');
    });

    /** A counting element inside a theme whose --ds-ease-value is `easing`; `values` collects the raw figures. */
    function themedCount(easing) {
      const doc = { activeElement: null, defaultView: { getComputedStyle: () => ({ getPropertyValue: (name) => (name === '--ds-ease-value' ? easing : '') }) } };
      const theme = new FakeElement(doc);
      theme.matches = (selector) => selector === '.ds-theme';
      const element = new FakeElement(doc);
      theme.append(element);
      const win = fakeWindow();
      const values = [];
      countUp(element, 1, { duration: 1000, win, format: (value) => { values.push(value); return String(value); } });
      win.advance(0); // the first frame: the count starts here
      return { win, at: () => values.at(-1) };
    }

    it('follows the computed curve: the M3 standard cubic', () => {
      const { win, at } = themedCount('cubic-bezier(.2, 0, 0, 1)');
      win.advance(100);
      assert.ok(Math.abs(at() - 0.156) <= 0.002, `0.1: ${at()}`);
      win.advance(100);
      assert.ok(Math.abs(at() - 0.5) <= 0.01, `0.2: ${at()}`);
      win.advance(100);
      assert.ok(Math.abs(at() - 0.688) <= 0.005, `0.3: ${at()}`);
    });

    it('follows a linear() spring, clamped so a figure never overshoots, and lands on 1', () => {
      const { win, at } = themedCount('linear(0, 0.6 25%, 1.2 50%, 1)');
      win.advance(250);
      assert.ok(Math.abs(at() - 0.6) < 1e-9, `0.25: ${at()}`);
      win.advance(200);
      assert.equal(at(), 1, 'the curve peaks above 1 (clamped) before the end');
      assert.equal(win.frames.length, 1, 'still counting');
      win.advance(600);
      assert.equal(at(), 1);
      assert.equal(win.frames.length, 0);
    });
  });
});

describe('transition() (1.5.0)', () => {
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  /** A FakeElement whose style also has the viewTransitionName accessor (on the same store as setProperty). */
  function vtElement(doc) {
    const element = new FakeElement(doc);
    Object.defineProperty(element.style, 'viewTransitionName', {
      get: () => element.style.getPropertyValue('view-transition-name'),
      set: (value) => (value ? element.style.setProperty('view-transition-name', value) : element.style.removeProperty('view-transition-name')),
    });
    return element;
  }

  /**
   * A document whose <html> may carry .ds-theme, with a view, the frame, an
   * optional named indicator and an open sheet; `api: true` stubs
   * startViewTransition: the update runs in a microtask (after the
   * snapshot), skipTransition() ends the transition, finish() ends it too.
   */
  function page({ theme = true, api = true, modalOpen = false, shown = [], phone = false, drawerOpen = false, drawerLeaving = false, panelWidths = null, toasts = [], onSnapshot = () => {} } = {}) {
    const doc = { activeElement: null, started: [] };
    // The window's listeners (capture flag ignored), so a test can fire events.
    const listeners = [];
    doc.defaultView = {
      requestAnimationFrame: (callback) => setImmediate(callback),
      getComputedStyle: () => ({ getPropertyValue: (name) => (name === '--ds-dur-long' ? '450ms' : '') }),
      matchMedia: (query) => ({ matches: query === '(max-width: 900px)' && phone }),
      listeners,
      addEventListener: (type, listener, options) => listeners.push({ type, listener, once: options?.once === true }),
      removeEventListener: (type, listener) => {
        const at = listeners.findIndex((entry) => entry.type === type && entry.listener === listener);
        if (at >= 0) listeners.splice(at, 1);
      },
      fire: (type, event) => {
        for (const entry of listeners.filter((item) => item.type === type)) {
          if (entry.once) listeners.splice(listeners.indexOf(entry), 1);
          entry.listener(event);
        }
      },
    };
    doc.body = new FakeElement(doc);
    doc.activeElement = doc.body;
    const root = vtElement(doc);
    if (theme) root.classList.add('ds-theme');
    root.matches = (selector) => selector === '.ds-theme' && root.classList.contains('ds-theme');
    doc.documentElement = root;
    const view = vtElement(doc);
    Object.defineProperty(view, 'firstElementChild', { get: () => view.children[0] ?? null });
    const panel = vtElement(doc);
    const drawer = vtElement(doc);
    drawer.getAnimations = () => (drawerLeaving ? [{ playState: 'running' }] : []);
    // The panel's width: one value per read, the last one repeated.
    let reads = 0;
    panel.getBoundingClientRect = () => ({ width: panelWidths ? panelWidths[Math.min(reads++, panelWidths.length - 1)] : 1000 });
    const first = vtElement(doc);
    view.append(first);
    const pill = vtElement(doc);
    pill.style.setProperty('view-transition-name', 'ds-indicator-nav');
    // Snackbar regions, each with `count` messages.
    const regions = toasts.map((count) => {
      const region = vtElement(doc);
      for (let i = 0; i < count; i += 1) {
        const message = new FakeElement(doc);
        message.classList.add('ds-toast');
        region.append(message);
      }
      return region;
    });
    doc.querySelectorAll = (selector) => (selector === '.ds-indicator' ? [pill] : selector === '.ds-toasts' ? regions : /\.ds-view, \.ds-panel, \.ds-drawer/.test(selector) ? [view, panel, drawer] : []);
    doc.querySelector = (selector) => {
      if (/data-state="open"/.test(selector)) {
        // `shown`: overlays shown by hand, as the selectors that match them.
        return modalOpen || selectorList(selector).some((part) => shown.includes(part)) ? {} : null;
      }
      if (selector === '.ds-app[data-drawer-open]') return drawerOpen ? {} : null;
      if (selector === '.ds-app .ds-drawer') return drawer;
      if (selector === '.ds-theme .ds-panel') return panel;
      return selector === '.ds-theme .ds-view' ? view : null;
    };
    if (api) {
      doc.startViewTransition = (callback) => {
        let finish;
        const ended = new Promise((resolve) => { finish = resolve; });
        const started = { skipped: 0, finish, attribute: root.getAttribute('data-ds-vt') };
        onSnapshot(started);
        started.updateCallbackDone = Promise.resolve().then(() => callback());
        started.finished = started.updateCallbackDone.then(() => ended);
        started.ready = Promise.resolve();
        started.skipTransition = () => { started.skipped += 1; finish(); };
        doc.started.push(started);
        return started;
      };
    }
    return { doc, root, view, panel, drawer, first, pill, regions };
  }

  /** The parts of a selector list (commas inside :not() stay in their part). */
  function selectorList(selector) {
    const parts = [];
    let depth = 0;
    let part = '';
    for (const char of selector) {
      if (char === ',' && depth === 0) {
        parts.push(part.trim());
        part = '';
        continue;
      }
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;
      part += char;
    }
    parts.push(part.trim());
    return parts;
  }

  /** `doc` as the global document for this test (transition() without `from` reads it). */
  function useDocument(t, doc) {
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', { value: doc, configurable: true, writable: true });
    t.after(() => {
      if (saved) Object.defineProperty(globalThis, 'document', saved);
      else delete globalThis.document;
    });
  }

  it('throws a TypeError for an unknown type or an update that is not a function', (t) => {
    useDocument(t, page({ api: false }).doc);
    assert.throws(() => transition(() => {}, { type: 'slide' }), TypeError);
    assert.throws(() => transition(null), TypeError);
    for (const type of ['fade-through', 'forward', 'back', 'container']) assert.doesNotThrow(() => transition(() => {}, { type }).catch(() => {}));
  });

  it('without View Transitions: runs the update once, then enters what it returned with .ds-enter--swap', async (t) => {
    const { doc, view } = page({ api: false });
    useDocument(t, doc);
    {
      const target = new FakeElement(doc);
      let runs = 0;
      const promise = transition(() => { runs += 1; view.replaceChildren(target); return target; }, { type: 'forward' });
      assert.equal(runs, 1, 'at once, nothing waits before the update');
      await flush();
      assert.ok(target.classList.contains('ds-enter') && target.classList.contains('ds-enter--swap'));
      end(target);
      await promise;
      assert.equal(runs, 1);
      assert.equal(String(target.classList), '');
      // Without a returned element: the first child of the themed view.
      const again = transition(() => {});
      await flush();
      assert.equal(view.children[0], target);
      assert.ok(target.classList.contains('ds-enter--swap'));
      end(view.children[0]);
      await again;
    }
  });

  it('without View Transitions and without a returned element: enters the view\'s content, never the data-scrolled sentinel', async (t) => {
    const { doc, view, first } = page({ api: false });
    useDocument(t, doc);
    {
      // The documented sentinel: first in the view, aria-hidden, kept through morphHtml.
      const sentinel = new FakeElement(doc);
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.setAttribute('data-ds-keep', '');
      view.prepend(sentinel);
      assert.equal(view.children[0], sentinel);
      const promise = transition(() => {});
      await flush();
      assert.equal(String(sentinel.classList), '', 'the sentinel never enters');
      assert.ok(first.classList.contains('ds-enter--swap'), 'the content does');
      end(first);
      await promise;
    }
  });

  it('without .ds-theme on <html> (an embedded widget) never calls startViewTransition', async (t) => {
    const { doc, root } = page({ theme: false });
    useDocument(t, doc);
    {
      const target = new FakeElement(doc);
      const promise = transition(() => target, { type: 'container', from: new FakeElement(doc) });
      await flush();
      assert.equal(doc.started.length, 0);
      assert.equal(root.hasAttribute('data-ds-vt'), false);
      assert.ok(target.classList.contains('ds-enter--swap'));
      end(target);
      await promise;
    }
  });

  it('keys the type on data-ds-vt while it runs and names the container from `from` to the target', async () => {
    let fromAtSnapshot;
    const { doc, root, pill } = page({ onSnapshot: () => { fromAtSnapshot = from.style.viewTransitionName; } });
    const from = vtElement(doc);
    const target = vtElement(doc);
    let during;
    const promise = transition(() => {
      during = { attribute: root.getAttribute('data-ds-vt'), from: from.style.viewTransitionName, pill: pill.style.getPropertyValue('view-transition-name') };
      return target;
    }, { type: 'container', from });
    assert.equal(doc.started.length, 1);
    assert.equal(doc.started[0].attribute, 'container', 'set before startViewTransition');
    assert.equal(fromAtSnapshot, 'ds-container', 'from is named before the snapshot');
    await flush();
    assert.deepEqual(during, { attribute: 'container', from: '', pill: 'none' }, 'inside the update: from unnamed, the indicator lifted');
    assert.equal(target.style.viewTransitionName, 'ds-container', 'the returned target carries the name for the new snapshot');
    doc.started[0].finish();
    await promise;
    assert.equal(root.hasAttribute('data-ds-vt'), false);
    assert.equal(from.style.viewTransitionName, '');
    assert.equal(target.style.viewTransitionName, '');
    assert.equal(pill.style.getPropertyValue('view-transition-name'), 'ds-indicator-nav', 'the indicator gets its name back');
  });

  it('falls back to a fade-through when a container transition has no target or no `from`', async (t) => {
    const { doc, root } = page();
    useDocument(t, doc);
    const from = vtElement(doc);
    let attribute;
    const promise = transition(() => { attribute = root.getAttribute('data-ds-vt'); return null; }, { type: 'container', from });
    await flush();
    assert.equal(attribute, 'container');
    assert.equal(root.getAttribute('data-ds-vt'), 'fade-through', 'nothing to grow into');
    doc.started[0].finish();
    await promise;
    const without = transition(() => {}, { type: 'container' });
    assert.equal(doc.started[1].attribute, 'fade-through', 'no from: a plain fade-through');
    doc.started[1].finish();
    await without;
    assert.equal(root.hasAttribute('data-ds-vt'), false);
  });

  it('falls back to a fade-through when a scroller clips `from` or the target inside the window', async (t) => {
    const { doc, root, view } = page();
    useDocument(t, doc);
    // A 1280 x 500 window; the view (overflow-y: auto) clips from y = 64 on.
    const styles = new Map([[view, { overflowX: 'auto', overflowY: 'auto', position: 'static' }]]);
    const plain = doc.defaultView.getComputedStyle;
    Object.assign(doc.defaultView, {
      innerWidth: 1280,
      innerHeight: 500,
      getComputedStyle: (element) => Object.assign({ overflowX: 'visible', overflowY: 'visible', position: 'static' }, plain(element), styles.get(element)),
    });
    Object.assign(view, { clientLeft: 0, clientTop: 0, clientWidth: 1000, clientHeight: 436 });
    view.getBoundingClientRect = () => ({ left: 200, top: 64, right: 1200, bottom: 500 });
    const box = (rect) => {
      const element = vtElement(doc);
      element.getBoundingClientRect = () => rect;
      view.append(element);
      return element;
    };
    // A detail scrolled to its end: its top lies above the view, under the top bar.
    const scrolled = box({ left: 224, top: -600, right: 1176, bottom: 480 });
    let named;
    const back = transition(() => { named = scrolled.style.viewTransitionName; return box({ left: 224, top: 88, right: 500, bottom: 300 }); }, { type: 'container', from: scrolled });
    assert.equal(doc.started[0].attribute, 'fade-through', 'a clipped from never becomes a group');
    await flush();
    assert.equal(named, '');
    doc.started[0].finish();
    await back;
    // A card in view into a detail longer than the view: the part below the window does not count.
    const card = box({ left: 224, top: 88, right: 500, bottom: 300 });
    const detail = box({ left: 224, top: 88, right: 1176, bottom: 1400 });
    const open = transition(() => detail, { type: 'container', from: card });
    assert.equal(doc.started[1].attribute, 'container');
    await flush();
    assert.equal(detail.style.viewTransitionName, 'ds-container', 'clipped only outside the window');
    doc.started[1].finish();
    await open;
    // A target the view clips inside the window (scrolled under the bar): a fade-through.
    const hidden = box({ left: 224, top: 20, right: 1176, bottom: 400 });
    const into = transition(() => hidden, { type: 'container', from: card });
    await flush();
    assert.equal(root.getAttribute('data-ds-vt'), 'fade-through');
    assert.equal(hidden.style.viewTransitionName, '');
    doc.started[2].finish();
    await into;
    assert.equal(card.style.viewTransitionName, '');
  });

  it('skips a running transition for the next call; both updates run, in call order', async (t) => {
    const { doc, root } = page();
    useDocument(t, doc);
    const order = [];
    const first = transition(async () => { await flush(); order.push('first'); });
    const second = transition(() => { order.push('second'); }, { type: 'back' });
    assert.equal(doc.started[0].skipped, 1, 'the first is skipped');
    assert.equal(root.getAttribute('data-ds-vt'), 'back');
    await first;
    assert.equal(root.getAttribute('data-ds-vt'), 'back', 'the first call leaves the latest one\'s attribute alone');
    doc.started[1].finish();
    await second;
    assert.deepEqual(order, ['first', 'second']);
    assert.equal(root.hasAttribute('data-ds-vt'), false);
  });

  it('rejects with the update\'s error after cleaning up: no attribute, no name left', async () => {
    const { doc, root, pill } = page();
    const from = vtElement(doc);
    const error = new Error('render failed');
    await assert.rejects(transition(() => { throw error; }, { type: 'container', from }), (reason) => reason === error);
    assert.equal(doc.started[0].skipped, 1, 'its motion is skipped');
    assert.equal(root.hasAttribute('data-ds-vt'), false);
    assert.equal(from.style.viewTransitionName, '');
    assert.equal(pill.style.getPropertyValue('view-transition-name'), 'ds-indicator-nav');
    await assert.rejects(transition(async () => { await flush(); throw error; }), (reason) => reason === error);
    assert.equal(root.hasAttribute('data-ds-vt'), false);
  });

  it('skips the motion of an update still pending after --ds-dur-long (the watchdog)', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { doc, root } = page();
    useDocument(t, doc);
    let release;
    const promise = transition(() => new Promise((resolve) => { release = resolve; }));
    await Promise.resolve();
    await Promise.resolve();
    t.mock.timers.tick(449);
    assert.equal(doc.started[0].skipped, 0);
    t.mock.timers.tick(1);
    assert.equal(doc.started[0].skipped, 1, 'skipped at --ds-dur-long: the page takes input again');
    assert.equal(root.getAttribute('data-ds-vt'), 'fade-through', 'the update still runs');
    release();
    await promise;
    assert.equal(root.hasAttribute('data-ds-vt'), false);
  });

  it('under an open dialog or sheet, lifts the page frame\'s names until it ends (a record swap moves only the sheet body)', async (t) => {
    const { doc, view, panel, drawer } = page({ modalOpen: true });
    useDocument(t, doc);
    let during;
    const promise = transition(() => { during = [view, panel, drawer].map((part) => part.style.getPropertyValue('view-transition-name')); }, { type: 'forward' });
    await flush();
    assert.deepEqual(during, ['none', 'none', 'none']);
    doc.started[0].finish();
    await promise;
    assert.deepEqual([view, panel, drawer].map((part) => part.style.getPropertyValue('view-transition-name')), ['', '', '']);
  });

  it('lifts the page frame\'s names under a div sheet or div dialog shown by hand (no data-state), not under a closed or leaving one', async (t) => {
    const sheet = '.ds-sheet[aria-modal="true"]:not(dialog, [hidden], [data-state], .ds-sheet--closing)';
    const dialog = '.ds-dialog:not(dialog, [hidden], [data-state], .ds-dialog--hidden, .ds-dialog--closing)';
    for (const [shown, lifted] of [[[sheet], true], [[dialog], true], [['.ds-sheet[aria-modal="true"]'], false], [[], false]]) {
      const { doc, view, panel, drawer } = page({ shown });
      useDocument(t, doc);
      let during;
      const promise = transition(() => { during = [view, panel, drawer].map((part) => part.style.getPropertyValue('view-transition-name')); }, { type: 'forward' });
      await flush();
      assert.deepEqual(during, lifted ? ['none', 'none', 'none'] : ['', '', ''], JSON.stringify(shown));
      doc.started[0].finish();
      await promise;
      assert.deepEqual([view, panel, drawer].map((part) => part.style.getPropertyValue('view-transition-name')), ['', '', '']);
    }
  });

  it('restarts a scroll-driven tint the old, scrolled view left stuck, after the update, on both paths', async (t) => {
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'ScrollTimeline');
    class ScrollTimeline {}
    Object.defineProperty(globalThis, 'ScrollTimeline', { value: ScrollTimeline, configurable: true, writable: true });
    t.after(() => {
      if (saved) Object.defineProperty(globalThis, 'ScrollTimeline', saved);
      else delete globalThis.ScrollTimeline;
    });
    for (const api of [true, false]) {
      const { doc, view } = page({ api });
      useDocument(t, doc);
      const calls = [];
      // Inactive once the update ran: the new view does not overflow.
      let updated = false;
      const timeline = Object.defineProperties(new ScrollTimeline(), { source: { value: view }, currentTime: { get: () => (updated ? null : 40) } });
      const stuck = { timeline, currentTime: 0.8, effect: { target: view }, cancel: () => calls.push('cancel'), play: () => calls.push('play') };
      doc.nodeType = 9;
      doc.getAnimations = () => [stuck];
      const promise = transition(() => { updated = true; });
      if (api) {
        await flush();
        doc.started[0].finish();
      }
      await promise;
      await flush();
      await flush();
      assert.deepEqual(calls, ['cancel', 'play'], api ? 'View Transition' : 'fallback');
    }
  });

  it('lifts the page frame\'s names while the modal drawer is open or still leaving, only where it is modal', async (t) => {
    for (const [options, lifted] of [
      [{ phone: true, drawerOpen: true }, true],
      [{ phone: true, drawerLeaving: true }, true],
      [{ phone: true }, false],
      [{ phone: false, drawerOpen: true, drawerLeaving: true }, false],
    ]) {
      const { doc, view, panel, drawer } = page(options);
      useDocument(t, doc);
      let during;
      const promise = transition(() => { during = [view, panel, drawer].map((part) => part.style.getPropertyValue('view-transition-name')); });
      await flush();
      assert.deepEqual(during, lifted ? ['none', 'none', 'none'] : ['', '', ''], JSON.stringify(options));
      doc.started[0].finish();
      await promise;
      assert.deepEqual([view, panel, drawer].map((part) => part.style.getPropertyValue('view-transition-name')), ['', '', '']);
    }
  });

  it('names one snackbar region with messages: a further one keeps no name until it ends (a duplicate would skip the transition)', async (t) => {
    const { doc, regions } = page({ toasts: [0, 1, 2] });
    useDocument(t, doc);
    let during;
    const promise = transition(() => { during = regions.map((region) => region.style.getPropertyValue('view-transition-name')); });
    await flush();
    assert.deepEqual(during, ['', '', 'none'], 'the empty region and the first with messages keep their stylesheet name');
    doc.started[0].finish();
    await promise;
    assert.deepEqual(regions.map((region) => region.style.getPropertyValue('view-transition-name')), ['', '', '']);
  });

  it('a press on <html> while it runs skips the motion; its click goes to the element under the pointer once it ended', async (t) => {
    const { doc, root } = page();
    useDocument(t, doc);
    const win = doc.defaultView;
    const clicks = [];
    const button = new FakeElement(doc);
    button.click = () => clicks.push(doc.started.length);
    // The pointer is over the button's icon: an SVG element has no click().
    const icon = { parentElement: button };
    doc.elementFromPoint = (x, y) => (x === 10 && y === 20 ? icon : null);
    let stopped = 0;
    const event = (target, extra = {}) => ({ target, button: 0, clientX: 10, clientY: 20, stopPropagation: () => { stopped += 1; }, ...extra });
    const promise = transition(() => {});
    await flush();
    win.fire('pointerdown', event(button));
    assert.equal(doc.started[0].skipped, 0, 'a press the engine delivered is left alone');
    win.fire('pointerdown', event(root, { button: 2 }));
    assert.equal(doc.started[0].skipped, 0, 'only the primary button');
    win.fire('pointerdown', event(root));
    assert.equal(doc.started[0].skipped, 1, 'a press on <html> skips the motion');
    win.fire('click', event(root));
    assert.equal(stopped, 2, 'the stray press and click stop at the window');
    assert.deepEqual(clicks, [], 'the click waits for the end');
    await promise;
    await flush();
    assert.deepEqual(clicks, [1], 'then it reaches the button');
    assert.equal(win.listeners.length, 0, 'no listener is left behind');
  });

  it('a click on <html> while it runs (the press reached its button before the snapshot) goes to the element under the pointer too', async (t) => {
    const { doc, root } = page();
    useDocument(t, doc);
    const clicks = [];
    const button = new FakeElement(doc);
    button.click = () => clicks.push('button');
    doc.elementFromPoint = () => button;
    const promise = transition(() => {});
    await flush();
    doc.defaultView.fire('click', { target: button, clientX: 1, clientY: 1, stopPropagation: () => {} });
    doc.defaultView.fire('click', { target: root, clientX: 1, clientY: 1, stopPropagation: () => {} });
    assert.equal(doc.started[0].skipped, 1, 'the motion is skipped');
    await promise;
    await flush();
    assert.deepEqual(clicks, ['button'], 'once, and the click the engine delivered is left alone');
  });

  it('marks data-ds-vt-morph only when the update changes the panel\'s width (the drawer shown or hidden)', async (t) => {
    for (const [panelWidths, morph] of [[[1000, 1256], true], [[1000, 1000], false], [null, false]]) {
      const { doc, root } = page({ panelWidths });
      useDocument(t, doc);
      const promise = transition(() => {});
      await flush();
      assert.equal(root.hasAttribute('data-ds-vt-morph'), morph, JSON.stringify(panelWidths));
      doc.started[0].finish();
      await promise;
      assert.equal(root.hasAttribute('data-ds-vt-morph'), false, 'gone with data-ds-vt');
    }
  });
});

describe('resyncScroll() (1.5.0)', () => {
  /** A node that contains itself and its listed descendants. */
  const node = (...inside) => ({ inside, contains(other) { return other === this || this.inside.some((child) => child === other || child.contains?.(other)); } });

  /**
   * ScrollTimeline stubbed for one test, a document whose animations are
   * `list`, and a scroll-driven animation: `active` gives its timeline a
   * progress, `progress` the animation's own (null: never ran).
   */
  function setup(t, list) {
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'ScrollTimeline');
    class ScrollTimeline {}
    Object.defineProperty(globalThis, 'ScrollTimeline', { value: ScrollTimeline, configurable: true, writable: true });
    t.after(() => {
      if (saved) Object.defineProperty(globalThis, 'ScrollTimeline', saved);
      else delete globalThis.ScrollTimeline;
    });
    const doc = { nodeType: 9, defaultView: { requestAnimationFrame: (callback) => setImmediate(callback) }, getAnimations: () => list };
    const scrollAnimation = ({ source, target, active, progress }) => {
      const timeline = Object.assign(new ScrollTimeline(), { source, currentTime: active ? 30 : null });
      const animation = { timeline, currentTime: progress, effect: { target }, calls: [] };
      animation.cancel = () => { animation.calls.push('cancel'); animation.currentTime = null; };
      animation.play = () => animation.calls.push('play');
      return animation;
    };
    return { doc, scrollAnimation };
  }

  it('restarts only scroll-driven animations whose timeline went inactive but kept a progress, two frames later', async (t) => {
    const list = [];
    const { doc, scrollAnimation } = setup(t, list);
    const view = node();
    const topbar = node();
    const stuck = scrollAnimation({ source: view, target: topbar, active: false, progress: 0.8 });
    const fresh = scrollAnimation({ source: view, target: view, active: false, progress: null });
    const running = scrollAnimation({ source: view, target: view, active: true, progress: 0.3 });
    const timed = { timeline: {}, currentTime: 100, effect: { target: view }, calls: [], cancel() { this.calls.push('cancel'); }, play() {} };
    list.push(stuck, fresh, running, timed);
    const promise = resyncScroll(doc);
    assert.deepEqual(stuck.calls, [], 'waits: the timeline sees the new layout only a frame or two later');
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(stuck.calls, [], 'still waits after one frame');
    assert.equal(await promise, 1);
    assert.deepEqual(stuck.calls, ['cancel', 'play']);
    assert.deepEqual([fresh.calls, running.calls, timed.calls], [[], [], []]);
  });

  it('limits itself to the scrollers in and around `root` and the animations of its descendants', async (t) => {
    const list = [];
    const { doc, scrollAnimation } = setup(t, list);
    const table = node();
    const card = node(table);
    const view = node(card);
    const other = node();
    const tint = scrollAnimation({ source: view, target: other, active: false, progress: 0.8 });   // the bar follows the view
    const edge = scrollAnimation({ source: table, target: table, active: false, progress: 0.9 });
    const elsewhere = scrollAnimation({ source: other, target: other, active: false, progress: 0.8 });
    list.push(tint, edge, elsewhere);
    view.ownerDocument = doc;
    table.ownerDocument = doc;
    assert.equal(await resyncScroll(table), 2, 'the table, and the view around it');
    assert.deepEqual([tint.calls.length, edge.calls.length, elsewhere.calls.length], [2, 2, 0]);
  });

  it('does nothing without scroll timelines', async () => {
    assert.equal(typeof globalThis.ScrollTimeline, 'undefined');
    assert.equal(await resyncScroll({ nodeType: 9, getAnimations: () => { throw new Error('not read'); } }), 0);
  });
});
