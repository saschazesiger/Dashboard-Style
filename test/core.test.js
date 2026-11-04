/**
 * DS.core (src/js/core.js) on a small fake DOM with a fake
 * MutationObserver: the shared runtime, the registry, init() and its
 * observer batches (a keyed move keeps its controller), data-ds-managed,
 * globals, destroy(), emit(), config() and t(). The real engines run the
 * same in test/browser/core.spec.js.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../src/js/core.js';
import { read } from './helpers.js';

/* ── A fake DOM: nodes, attributes, simple selectors, mutation records ── */

const observers = new Set();

class FakeObserver {
  constructor(callback) {
    this.callback = callback;
    this.queue = [];
    this.target = null;
    this.options = null;
  }
  observe(target, options) {
    this.target = target;
    this.options = options;
    observers.add(this);
  }
  disconnect() {
    observers.delete(this);
    this.queue = [];
  }
  takeRecords() {
    const queue = this.queue;
    this.queue = [];
    return queue;
  }
}

/** Queues a record for every observer whose root holds its target, delivered in a microtask as the engines do. */
function record(entry) {
  for (const observer of observers) {
    if (!observer.target.contains(entry.target)) continue;
    if (entry.type === 'attributes' && !observer.options.attributeFilter.includes(entry.attributeName)) continue;
    observer.queue.push(entry);
    if (observer.scheduled) continue;
    observer.scheduled = true;
    queueMicrotask(() => {
      observer.scheduled = false;
      const records = observer.takeRecords();
      if (records.length && observers.has(observer)) observer.callback(records, observer);
    });
  }
}

/** Selectors: comma lists of compounds of a tag, `.class`, `[attr]` and `[attr="value"]`. */
function matches(element, selector) {
  return selector.split(',').map((part) => part.trim()).some((compound) => {
    let rest = compound;
    while (rest) {
      let match;
      if ((match = /^\[([\w-]+)(?:="([^"]*)")?\]/.exec(rest))) {
        const value = element.getAttribute(match[1]);
        if (value === null || (match[2] !== undefined && value !== match[2])) return false;
      } else if ((match = /^\.([\w-]+)/.exec(rest))) {
        if (!(element.getAttribute('class') ?? '').split(/\s+/).includes(match[1])) return false;
      } else if ((match = /^([a-z][\w-]*)/i.exec(rest))) {
        if (element.tagName.toLowerCase() !== match[1].toLowerCase()) return false;
      } else throw new SyntaxError(`fake DOM: cannot read "${rest}"`);
      rest = rest.slice(match[0].length);
    }
    return true;
  });
}

class FakeNode {
  constructor(nodeType, ownerDocument) {
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.childNodes = [];
  }
  get isConnected() {
    let node = this;
    while (node.parentNode) node = node.parentNode;
    return node.nodeType === 9;
  }
  contains(other) {
    for (let node = other; node; node = node.parentNode) if (node === this) return true;
    return false;
  }
  append(...children) {
    for (const child of children) this.insertBefore(child, null);
  }
  insertBefore(child, before) {
    if (child.parentNode) child.parentNode.removeChild(child);
    const index = before ? this.childNodes.indexOf(before) : this.childNodes.length;
    this.childNodes.splice(index, 0, child);
    child.parentNode = this;
    record({ type: 'childList', target: this, addedNodes: [child], removedNodes: [] });
    return child;
  }
  removeChild(child) {
    this.childNodes.splice(this.childNodes.indexOf(child), 1);
    child.parentNode = null;
    record({ type: 'childList', target: this, addedNodes: [], removedNodes: [child] });
    return child;
  }
  remove() {
    this.parentNode?.removeChild(this);
  }
  querySelectorAll(selector) {
    const found = [];
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.matches(selector)) found.push(child);
        walk(child);
      }
    };
    walk(this);
    return found;
  }
}

class FakeElement extends FakeNode {
  constructor(tag, ownerDocument) {
    super(1, ownerDocument);
    this.tagName = tag.toUpperCase();
    this.attributes = new Map();
  }
  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }
  hasAttribute(name) {
    return this.attributes.has(name);
  }
  setAttribute(name, value) {
    const oldValue = this.getAttribute(name);
    this.attributes.set(name, String(value));
    record({ type: 'attributes', target: this, attributeName: name, oldValue });
  }
  removeAttribute(name) {
    if (!this.attributes.has(name)) return;
    const oldValue = this.getAttribute(name);
    this.attributes.delete(name);
    record({ type: 'attributes', target: this, attributeName: name, oldValue });
  }
  matches(selector) {
    return matches(this, selector);
  }
  closest(selector) {
    for (let node = this; node && node.nodeType === 1; node = node.parentNode) if (node.matches(selector)) return node;
    return null;
  }
}

function fakeDocument() {
  const doc = new FakeNode(9, null);
  doc.documentElement = null;
  doc.createElement = (tag) => new FakeElement(tag, doc);
  const html = doc.createElement('html');
  doc.append(html);
  doc.documentElement = html;
  doc.body = doc.createElement('body');
  html.append(doc.body);
  return doc;
}

/** `h(doc, 'div', { attr: value }, ...children)`. */
function h(doc, tag, attributes = {}, ...children) {
  const element = doc.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.attributes.set(name, String(value));
  for (const child of children) {
    child.parentNode = element;
    element.childNodes.push(child);
  }
  return element;
}

const tick = () => new Promise((resolve) => setTimeout(resolve));

globalThis.MutationObserver = FakeObserver;

let counter = 0;
/** A behaviour with a unique name that counts what happens: { name, attribute, log, made }. */
function behaviour(extra = {}) {
  counter += 1;
  const name = `fx-${counter}`;
  const attribute = `data-ds-fx-${counter}`;
  const log = [];
  const made = [];
  core.define(name, {
    attribute,
    init(el, ctx) {
      const controller = {
        el,
        ctx,
        id: made.length + 1,
        destroy() { log.push(`destroy ${el.getAttribute('id')}`); },
        ...(extra.update ? { update(names) { log.push(`update ${el.getAttribute('id')} ${names.join()}`); } } : {}),
      };
      made.push(controller);
      log.push(`init ${el.getAttribute('id')}`);
      return controller;
    },
    ...(extra.attributes ? { attributes: extra.attributes } : {}),
  });
  return { name, attribute, log, made };
}

const handles = [];
afterEach(() => {
  for (const handle of handles.splice(0)) handle.destroy();
});
const start = (root, options) => {
  const handle = core.init(root, options);
  handles.push(handle);
  return handle;
};

/* ── Tests ── */

describe('DS.core runtime', () => {
  it('is one object per page under DashboardStyle.runtime, with shared state by name', () => {
    assert.equal(globalThis.DashboardStyle.runtime, core.runtime);
    const a = core.runtime.state('test.shared', () => ({ count: 0 }));
    a.count += 1;
    assert.equal(core.runtime.state('test.shared', () => ({ count: 99 })).count, 1);
    assert.equal(core.runtime.state('test.value', 7), 7);
    // The runtime cannot be replaced by a later copy.
    assert.throws(() => { 'use strict'; globalThis.DashboardStyle.runtime = {}; }, TypeError);
    assert.equal(globalThis.DashboardStyle.runtime, core.runtime);
  });

  it('keeps its registry, controllers, roots and settings in runtime.state("core")', () => {
    const state = core.runtime.state('core');
    assert.ok(state.specs instanceof Map && state.roots instanceof Map && state.elements instanceof WeakMap);
    assert.deepEqual(Object.keys(state.settings).sort(), ['locale', 'strings']);
  });
});

describe('DS.core.define', () => {
  it('checks the name and the spec, and keeps the first definition of a name', () => {
    assert.throws(() => core.define('Bad Name', { global() {} }), TypeError);
    assert.throws(() => core.define('ok-name', null), TypeError);
    assert.throws(() => core.define('ok-name', { attribute: 'data-x', init() {} }), /data-ds-\*/);
    assert.throws(() => core.define('ok-name', { attribute: 'data-ds-ok' }), /init\(el, ctx\) or global\(root\)/);
    assert.throws(() => core.define('ok-name', { init() {} }), /attribute or a selector/);
    assert.equal(core.define('first-wins', { attribute: 'data-ds-first-wins', init() {} }), true);
    assert.equal(core.define('first-wins', { attribute: 'data-ds-other', init() {} }), false);
    assert.equal(core.runtime.state('core').specs.get('first-wins').attribute, 'data-ds-first-wins');
  });
});

describe('DS.core.init', () => {
  it('initialises every match once, outside data-ds-managed, and get() returns the controller', () => {
    const doc = fakeDocument();
    const fx = behaviour();
    const a = h(doc, 'div', { id: 'a', [fx.attribute]: '' });
    const inner = h(doc, 'span', { id: 'inner', [fx.attribute]: '' });
    const managedRoot = h(doc, 'div', { id: 'managed', 'data-ds-managed': '', [fx.attribute]: '' }, inner);
    doc.body.append(a, managedRoot);
    const handle = start(doc, { observe: false });
    assert.deepEqual(fx.log, ['init a']);
    const controller = core.get(a, fx.name);
    assert.equal(controller, fx.made[0]);
    assert.equal(core.get(a), controller, 'without a name: the first controller');
    assert.equal(core.get(inner, fx.name), null);
    assert.equal(core.get(managedRoot), null);
    assert.equal(controller.ctx.name, fx.name);
    assert.equal(controller.ctx.root, doc);
    assert.equal(controller.ctx.signal.aborted, false);
    // Idempotent: a second init holds the root once more and starts nothing twice.
    const again = start(doc, { observe: false });
    assert.deepEqual(fx.log, ['init a']);
    handle.destroy();
    assert.deepEqual(fx.log, ['init a'], 'the second hold keeps the root');
    again.destroy();
    assert.deepEqual(fx.log, ['init a', 'destroy a']);
    assert.equal(controller.ctx.signal.aborted, true);
    assert.equal(core.get(a, fx.name), null);
    again.destroy();
    assert.deepEqual(fx.log, ['init a', 'destroy a'], 'destroy() of a handle is idempotent');
  });

  it('takes a cleanup function or nothing from init(), and gives such an element a handle with destroy()', () => {
    const doc = fakeDocument();
    const log = [];
    core.define('fx-cleanup', { attribute: 'data-ds-fx-cleanup', init(el) { return () => log.push(`clean ${el.getAttribute('id')}`); } });
    core.define('fx-nothing', { attribute: 'data-ds-fx-nothing', init() {} });
    const a = h(doc, 'div', { id: 'a', 'data-ds-fx-cleanup': '', 'data-ds-fx-nothing': '' });
    doc.body.append(a);
    start(doc, { observe: false });
    assert.deepEqual(Object.keys(core.get(a, 'fx-nothing')), ['destroy']);
    core.get(a, 'fx-cleanup').destroy();
    assert.deepEqual(log, ['clean a']);
    assert.equal(core.get(a, 'fx-cleanup'), null);
    assert.ok(core.get(a, 'fx-nothing'));
  });

  it('reports a behaviour whose init throws and runs the others', () => {
    const doc = fakeDocument();
    const reported = [];
    const before = globalThis.reportError;
    globalThis.reportError = (error) => reported.push(error.message);
    try {
      core.define('fx-throws', { attribute: 'data-ds-fx-throws', init() { throw new Error('broken'); } });
      const fx = behaviour();
      doc.body.append(h(doc, 'div', { id: 'a', 'data-ds-fx-throws': '', [fx.attribute]: '' }));
      start(doc, { observe: false });
      assert.deepEqual(reported, ['broken']);
      assert.deepEqual(fx.log, ['init a']);
    } finally {
      globalThis.reportError = before;
    }
  });

  it('observes: added elements start, removed ones stop, a move in one batch keeps its controller', async () => {
    const doc = fakeDocument();
    const fx = behaviour();
    const list = h(doc, 'ul', { id: 'list' });
    doc.body.append(list);
    start(doc);
    const one = h(doc, 'li', { id: 'one', [fx.attribute]: '' });
    const two = h(doc, 'li', { id: 'two', [fx.attribute]: '' });
    list.append(one, two);
    assert.deepEqual(fx.log, [], 'batched to a microtask');
    await tick();
    assert.deepEqual(fx.log, ['init one', 'init two']);
    const kept = core.get(two, fx.name);
    // A keyed reorder without moveBefore(): a remove plus an add, in one task.
    list.removeChild(two);
    list.insertBefore(two, one);
    await tick();
    assert.deepEqual(fx.log, ['init one', 'init two'], 'nothing destroyed, nothing started');
    assert.equal(core.get(two, fx.name), kept);
    // Removed for good.
    one.remove();
    await tick();
    assert.deepEqual(fx.log.slice(2), ['destroy one']);
    // Removed in one task, back in a later one: a new element.
    two.remove();
    await tick();
    list.append(two);
    await tick();
    assert.deepEqual(fx.log.slice(3), ['destroy two', 'init two']);
    assert.notEqual(core.get(two, fx.name), kept);
  });

  it('initialises an attribute added in place, updates or restarts on a changed one, and stops when it goes', async () => {
    const doc = fakeDocument();
    const plain = behaviour({ attributes: ['data-ds-fx-plain-opt'] });
    const updating = behaviour({ update: true, attributes: ['data-ds-fx-opt'] });
    const box = h(doc, 'div', { id: 'box' });
    doc.body.append(box);
    start(doc);
    box.setAttribute(plain.attribute, '');
    box.setAttribute(updating.attribute, '');
    await tick();
    assert.deepEqual(plain.log, ['init box']);
    assert.deepEqual(updating.log, ['init box']);
    // The same value again is no change.
    box.setAttribute(plain.attribute, '');
    await tick();
    assert.deepEqual(plain.log, ['init box']);
    box.setAttribute('data-ds-fx-plain-opt', '2');
    box.setAttribute('data-ds-fx-opt', '2');
    box.setAttribute(updating.attribute, 'x');
    await tick();
    assert.deepEqual(plain.log, ['init box', 'destroy box', 'init box'], 'no update(): destroyed and started again');
    assert.deepEqual(updating.log, ['init box', `update box ${updating.attribute},data-ds-fx-opt`]);
    box.removeAttribute(plain.attribute);
    await tick();
    assert.deepEqual(plain.log.slice(3), ['destroy box']);
    assert.equal(core.get(box, plain.name), null);
    assert.ok(core.get(box, updating.name));
  });

  it('skips data-ds-managed subtrees also when they arrive later, and scans one handed back', async () => {
    const doc = fakeDocument();
    const fx = behaviour();
    start(doc);
    const inside = h(doc, 'span', { id: 'inside', [fx.attribute]: '' });
    const managed = h(doc, 'div', { id: 'managed', 'data-ds-managed': '' }, inside);
    doc.body.append(managed);
    await tick();
    const late = h(doc, 'span', { id: 'late', [fx.attribute]: '' });
    managed.append(late);
    late.setAttribute(fx.attribute, 'changed');
    await tick();
    assert.deepEqual(fx.log, []);
    managed.removeAttribute('data-ds-managed');
    await tick();
    assert.deepEqual(fx.log, ['init inside', 'init late']);
  });

  it('installs every global once per root and takes it down with the root; a later definition reaches existing roots', async () => {
    const doc = fakeDocument();
    const log = [];
    core.define('fx-global-a', { global(root) { log.push(`install a ${root.nodeType}`); return () => log.push('remove a'); } });
    const handle = start(doc);
    start(doc);
    assert.deepEqual(log.filter((line) => line.endsWith(' a 9')), ['install a 9']);
    core.define('fx-global-b', { global() { log.push('install b'); return { destroy: () => log.push('remove b') }; } });
    doc.body.append(h(doc, 'p', { id: 'p', [`data-ds-fx-${counter + 1}`]: '' }));
    await tick();
    const fx = behaviour();
    assert.deepEqual(fx.log, ['init p'], 'scanned at definition: the element was already there');
    assert.ok(log.includes('install b'));
    const late = h(doc, 'p', { id: 'late' });
    doc.body.append(late);
    late.setAttribute(fx.attribute, '');
    await tick();
    assert.deepEqual(fx.log, ['init p', 'init late'], 'the observer watches the new attribute');
    handle.destroy();
    assert.ok(!log.includes('remove a'), 'still held');
    core.destroy(doc);
    assert.deepEqual(log.filter((line) => line.startsWith('remove')), ['remove b', 'remove a'], 'the last installed first');
    assert.deepEqual(fx.log.slice(2).sort(), ['destroy late', 'destroy p']);
  });

  it('rescans a root inside an initialised one, and an outer root takes inner ones over', () => {
    const doc = fakeDocument();
    const log = [];
    core.define('fx-global-nested', { global(root) { log.push(`install ${root.getAttribute?.('id') ?? 'doc'}`); return () => log.push(`remove ${root.getAttribute?.('id') ?? 'doc'}`); } });
    const fx = behaviour();
    const panel = h(doc, 'section', { id: 'panel' }, h(doc, 'b', { id: 'b', [fx.attribute]: '' }));
    doc.body.append(panel);
    const inner = start(panel, { observe: false });
    assert.ok(log.includes('install panel'));
    start(doc, { observe: false });
    assert.ok(log.includes('remove panel') && log.includes('install doc'), 'the inner root gave its globals up');
    assert.deepEqual(fx.log, ['init b'], 'its controllers stayed');
    inner.destroy();
    assert.deepEqual(fx.log, ['init b'], 'the old inner handle does nothing');
    const nested = start(panel, { observe: false });
    assert.equal(log.filter((line) => line === 'install panel').length, 1, 'inside an initialised root: rescanned only');
    nested.destroy();
    assert.deepEqual(fx.log, ['init b', 'destroy b'], 'its handle destroys the controllers in it');
  });

  it('destroy(el) destroys the controllers in a subtree at once, the root keeps observing', async () => {
    const doc = fakeDocument();
    const fx = behaviour();
    const group = h(doc, 'div', { id: 'group', [fx.attribute]: '' }, h(doc, 'i', { id: 'i', [fx.attribute]: '' }));
    const other = h(doc, 'div', { id: 'other', [fx.attribute]: '' });
    doc.body.append(group, other);
    start(doc);
    core.destroy(group);
    assert.deepEqual(fx.log.slice(3).sort(), ['destroy group', 'destroy i']);
    assert.ok(core.get(other, fx.name));
    doc.body.append(h(doc, 'p', { id: 'new', [fx.attribute]: '' }));
    await tick();
    assert.equal(fx.log.at(-1), 'init new');
  });

  it('does nothing without a DOM', () => {
    const handle = core.init(undefined);
    assert.equal(typeof handle.destroy, 'function');
    handle.destroy();
    assert.deepEqual(Object.keys(core.init({})), ['destroy']);
  });
});

describe('DS.core.emit', () => {
  it('dispatches a bubbling ds: CustomEvent and says whether it was cancelled', () => {
    const target = new EventTarget();
    const seen = [];
    target.addEventListener('ds:change', (event) => seen.push([event.type, event.bubbles, event.cancelable, event.detail]));
    assert.equal(core.emit(target, 'change', { value: 1 }), true);
    assert.deepEqual(seen, [['ds:change', true, false, { value: 1 }]]);
    target.addEventListener('ds:before-close', (event) => event.preventDefault());
    assert.equal(core.emit(target, 'before-close', null), true, 'not cancelable unless asked');
    assert.equal(core.emit(target, 'before-close', null, { cancelable: true }), false);
  });
});

describe('DS.core.config and t', () => {
  afterEach(() => core.config({ locale: null, strings: { close: null, moreCount: null } }));

  it('has English defaults, page overrides, placeholders and functions', () => {
    assert.equal(core.t('close'), 'Close');
    assert.equal(core.t('showMore'), 'Show more');
    assert.equal(core.t('unknown-key'), 'unknown-key');
    const settings = core.config({ strings: { close: 'Schliessen', moreCount: ({ count }) => `${count} weitere` } });
    assert.equal(settings.strings.close, 'Schliessen');
    assert.equal(settings.strings.copied, 'Copied');
    assert.ok(Object.isFrozen(settings) && Object.isFrozen(settings.strings));
    assert.equal(core.t('close'), 'Schliessen');
    assert.equal(core.t('moreCount', { count: 3 }), '3 weitere');
    core.config({ strings: { moreCount: '{count} more, {missing}' } });
    assert.equal(core.t('moreCount', { count: 2 }), '2 more, {missing}');
    core.config({ strings: { close: null } });
    assert.equal(core.t('close'), 'Close');
  });

  it('defaults the locale to <html lang>, else the browser, and takes the page\'s', () => {
    const before = globalThis.document;
    try {
      globalThis.document = { documentElement: { lang: 'fr' } };
      assert.equal(core.config().locale, 'fr');
      core.config({ locale: 'de' });
      assert.equal(core.config().locale, 'de');
      core.config({ locale: null });
      globalThis.document = { documentElement: { lang: '' } };
      assert.equal(core.config().locale, globalThis.navigator?.language || 'en');
    } finally {
      globalThis.document = before;
    }
  });

  it('dispatches ds:config on the document after a change, and says what changed', () => {
    const before = globalThis.document;
    const events = [];
    try {
      globalThis.document = { documentElement: { lang: 'fr' }, dispatchEvent: (event) => events.push(event) };
      core.config();
      core.config({});
      core.config({ locale: 'fr' });
      assert.equal(events.length, 0, 'nothing changed: the locale in force was fr already');
      const settings = core.config({ locale: 'de' });
      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'ds:config');
      assert.equal(events[0].bubbles, true);
      assert.equal(events[0].cancelable, false);
      assert.deepEqual(events[0].detail.changed, ['locale']);
      assert.equal(events[0].detail.locale, 'de');
      assert.equal(events[0].detail.strings, settings.strings);
      core.config({ strings: { close: 'Schliessen' } });
      assert.deepEqual(events[1].detail.changed, ['strings']);
      assert.equal(events[1].detail.strings.close, 'Schliessen');
      core.config({ locale: 'it', strings: { close: null } });
      assert.deepEqual(events[2].detail.changed, ['locale', 'strings']);
    } finally {
      globalThis.document = before;
    }
  });

  it('lists every default string in docs/install.md, "Language and locale"', () => {
    const keys = [...read('src/js/core.js').match(/const DEFAULT_STRINGS = Object\.freeze\(\{\n([\s\S]*?)\n\}\);/)[1].matchAll(/^ {2}(\w+):/gm)].map((match) => match[1]);
    for (const key of ['close', 'copy', 'copied', 'showMore', 'showLess', 'clear', 'loading', 'more', 'dismiss', 'required', 'optional']) assert.ok(keys.includes(key), key);
    const install = read('docs/install.md');
    for (const key of keys) assert.match(install, new RegExp(`\\| \`DS\\.core\\.config\\(\\{ strings: \\{ ${key} \\} \\}\\)\` \\|`), key);
  });
});
