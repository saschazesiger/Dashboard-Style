/**
 * Icons, the indicator, the DOM morph (on a tiny fake DOM), the ripple, the
 * classic-script build and the timing literals of src/js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import * as icons from '../src/js/icons.js';
import * as motion from '../src/js/motion.js';
import * as indicator from '../src/js/indicator.js';
import * as dom from '../src/js/dom.js';
import * as ripple from '../src/js/ripple.js';
import { filesIn, read } from './helpers.js';

const GLYPHS = Object.entries(icons).filter(([, value]) => typeof value === 'string' && value.startsWith('<'));

/** Just enough of a document for iconElement(). */
function fakeDocument() {
  const make = (ns, tag) => ({
    ns, tag, attributes: {}, children: [],
    setAttribute(name, value) { this.attributes[name] = String(value); },
    appendChild(child) { this.children.push(child); return child; },
  });
  return { createElementNS: make };
}

describe('icons', () => {
  it('draws every glyph from the line set in the text colour', () => {
    assert.ok(GLYPHS.length >= 60, `${GLYPHS.length} glyphs`);
    for (const [name, body] of GLYPHS) {
      assert.doesNotMatch(body, /(stroke|fill|style|class)=|#[0-9a-f]{3,6}|var\(/i, name);
      assert.match(body, /^(<(path|circle|rect|line|polyline|ellipse)(\s+[\w:-]+="[^"]*")*\s*\/>)+$/, `${name}: flat elements only`);
      const markup = icons.icon(body, 16);
      assert.match(markup, /width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"/, name);
    }
  });

  it('defaults to 20px, takes a class and rejects unknown glyphs', () => {
    assert.match(icons.icon(icons.check), /width="20" height="20"/);
    assert.match(icons.icon(icons.check, 16, 'x-hook'), /^<svg class="x-hook" width="16"/);
    assert.throws(() => icons.icon('nope'), /Unknown icon/);
    assert.throws(() => icons.icon(undefined), /Unknown icon/);
    assert.throws(() => icons.iconElement(undefined, 16, '', fakeDocument()), /Unknown icon/);
  });

  it('builds the same icon as an element without innerHTML', () => {
    const svg = icons.iconElement(icons.calendar, 18, 'x-hook', fakeDocument());
    assert.equal(svg.ns, 'http://www.w3.org/2000/svg');
    assert.equal(svg.tag, 'svg');
    assert.deepEqual(svg.attributes, {
      class: 'x-hook', width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
    });
    assert.deepEqual(svg.children.map((child) => child.tag), ['path', 'path', 'rect', 'path']);
    assert.deepEqual(svg.children[2].attributes, { width: '18', height: '18', x: '3', y: '4', rx: '2' });
    // Every glyph round-trips: the element holds exactly the glyph's elements.
    for (const [name, body] of GLYPHS) {
      const element = icons.iconElement(body, 20, '', fakeDocument());
      const rebuilt = element.children.map((child) => `<${child.tag}${Object.entries(child.attributes).map(([key, value]) => ` ${key}="${value}"`).join('')}/>`).join('');
      assert.equal(rebuilt, body, name);
    }
  });

  it('escapes the class, so it never ends the attribute', () => {
    const markup = icons.icon(icons.check, 16, 'a" onload="x');
    assert.equal(markup.match(/ class="[^"]*"/g).length, 1);
    assert.match(markup, /^<svg class="a&quot; onload=&quot;x" width="16"/);
    assert.match(icons.icon(icons.check, 16, '<b>&'), /class="&lt;b&gt;&amp;"/);
  });

  it('keeps the check drawable (pathLength 1 for ds-draw)', () => {
    assert.match(icons.check, /pathLength="1"/);
  });
});

describe('indicator, dom and ripple', () => {
  it('exports the documented functions', () => {
    assert.equal(typeof indicator.createIndicator, 'function');
    assert.equal(typeof dom.morphHtml, 'function');
    assert.equal(typeof dom.morphChildren, 'function');
    assert.equal(typeof ripple.attach, 'function');
  });

  it('morphChildren keeps equal nodes and only inserts or removes what changed', () => {
    // A tiny node model: text, isEqualNode, siblings, insertBefore, remove.
    class Node {
      constructor(text) { this.text = text; this.nodeType = 3; this.parent = null; this.childNodes = []; }
      get nodeValue() { return this.text; }
      set nodeValue(value) { this.text = value; }
      isEqualNode(other) { return other.text === this.text; }
      get nextSibling() { const list = this.parent.childNodes; return list[list.indexOf(this) + 1] || null; }
      remove() { this.parent.removeChild(this); }
    }
    class Parent {
      constructor(children) { this.childNodes = []; children.forEach((child) => this.insertBefore(child, null)); }
      get firstChild() { return this.childNodes[0] || null; }
      insertBefore(node, ref) { node.parent = this; const index = ref ? this.childNodes.indexOf(ref) : this.childNodes.length; this.childNodes.splice(index, 0, node); }
      removeChild(node) { this.childNodes.splice(this.childNodes.indexOf(node), 1); }
    }
    const keep = new Node('b');
    const target = new Parent([new Node('a'), keep, new Node('c')]);
    dom.morphChildren(target, [new Node('b'), new Node('d')]);
    assert.deepEqual(target.childNodes.map((node) => node.text), ['b', 'd']);
    assert.equal(target.childNodes[0], keep, 'the equal node is kept, not replaced');
  });

  describe('morphChildren patches in place', () => {
    const { h, text, doc } = miniDom();
    /** The tag, key and text of each child, for a quick look at an order. */
    const shape = (parent) => parent.childNodes.map((node) => (node.nodeType === 3 ? node.nodeValue : `${node.getAttribute('data-ds-key') ?? node.tagName.toLowerCase()}:${node.textContent}`));

    it('patches a changed attribute instead of replacing, keeping runtime classes and --ds-i', () => {
      const status = h('span', { class: 'ds-status ds-status--ok ds-enter ds-enter--fade', style: '--ds-i: 2' }, text('Active'));
      const bar = h('div', { class: 'ds-progress', style: '--ds-progress: 20%' });
      const target = h('div', {}, status, bar);
      dom.morphChildren(target, [h('span', { class: 'ds-status ds-status--error' }, text('Failed')), h('div', { class: 'ds-progress', style: '--ds-progress: 60%' })]);
      assert.equal(target.childNodes[0], status, 'the same node');
      assert.equal(target.childNodes[1], bar);
      assert.deepEqual([...status.classList], ['ds-status', 'ds-status--error', 'ds-enter', 'ds-enter--fade']);
      assert.equal(status.style.getPropertyValue('--ds-i'), '2');
      assert.equal(status.textContent, 'Failed');
      assert.equal(bar.style.getPropertyValue('--ds-progress'), '60%');
    });

    it('moves keyed nodes and keeps their identity; a prepended row inserts only itself', () => {
      for (const move of [true, false]) {
        doc.canMove = move;
        const old = ['a', 'b', 'c'].map((key) => h('tr', { 'data-ds-key': key }, text(key.toUpperCase())));
        const body = h('tbody', {}, ...old);
        const rows = (...keys) => keys.map((key) => h('tr', { 'data-ds-key': key }, text(key.toUpperCase())));
        const sorted = rows('c', 'a', 'b');
        doc.log.length = 0;
        dom.morphChildren(body, sorted);
        assert.deepEqual(body.childNodes, [old[2], old[0], old[1]], `moveBefore: ${move}`);
        assert.ok(doc.log.length > 0 && doc.log.every(([kind, node]) => old.includes(node) && kind === (move ? 'move' : 'insert')), 'only moves');
        const prepended = rows('x', 'c', 'a', 'b');
        doc.log.length = 0;
        dom.morphChildren(body, prepended);
        assert.deepEqual(body.childNodes.slice(1), [old[2], old[0], old[1]]);
        assert.deepEqual(doc.log.map(([kind, node]) => [kind, node.getAttribute('data-ds-key')]), [['insert', 'x']]);
      }
      doc.canMove = false;
    });

    it('never morphs one key into another', () => {
      const old = h('li', { 'data-ds-key': 'a' }, text('A'));
      const list = h('ul', {}, old);
      dom.morphChildren(list, [h('li', { 'data-ds-key': 'b' }, text('B'))]);
      assert.equal(list.childNodes.length, 1);
      assert.notEqual(list.childNodes[0], old);
      assert.equal(old.parentNode, null);
      assert.deepEqual(shape(list), ['b:B']);
    });

    it('holdOrder patches values only: no moves, inserts or removals', () => {
      const a = h('li', { 'data-ds-key': 'a' }, text('1'));
      const b = h('li', { 'data-ds-key': 'b' }, text('2'));
      const c = h('li', { 'data-ds-key': 'c' }, text('3'));
      const list = h('ul', {}, a, b, c);
      dom.morphChildren(list, [h('li', { 'data-ds-key': 'b' }, text('20')), h('li', { 'data-ds-key': 'a' }, text('10')), h('li', { 'data-ds-key': 'x' }, text('new'))], { holdOrder: true });
      assert.deepEqual(list.childNodes, [a, b, c]);
      assert.deepEqual(shape(list), ['a:10', 'b:20', 'c:3']);
    });

    it('patches the focused input in place and leaves its live value alone', () => {
      const input = h('input', { class: 'ds-input', value: 'LAPTOP' });
      const other = h('input', { class: 'ds-input', value: 'old' });
      const form = h('div', {}, input, other);
      input.value = 'LAPTOP-00';
      other.value = 'old';
      input.focus();
      dom.morphChildren(form, [h('input', { class: 'ds-input', value: 'LAPTOP-0042', 'aria-invalid': 'true' }), h('input', { class: 'ds-input', value: 'new' })]);
      assert.deepEqual(form.childNodes, [input, other], 'both patched');
      assert.equal(input.getAttribute('aria-invalid'), 'true');
      assert.equal(input.getAttribute('value'), 'LAPTOP-0042');
      assert.equal(input.value, 'LAPTOP-00', 'what the user typed stays');
      assert.equal(other.value, 'new', 'an unfocused field follows its value attribute');
      dom.morphChildren(form, [h('input', { class: 'ds-input ds-input--sm', value: 'LAPTOP-0042' }), h('input', { class: 'ds-input', value: 'new' })], { replace: true });
      assert.equal(form.childNodes[0], input, 'the focused field is never replaced, even with replace: true');
      assert.equal(input.value, 'LAPTOP-00');
      assert.equal(doc.activeElement, input);
    });

    it('keeps data-ds-keep nodes first and in the middle, and the order of their siblings', () => {
      const first = h('span', { class: 'ds-indicator', 'data-ds-keep': '' });
      const middle = h('span', { class: 'ds-press-ripple', 'data-ds-keep': '' });
      const track = h('nav', {}, first, h('a', {}, text('Live')), middle, h('a', {}, text('Admin')));
      dom.morphChildren(track, [h('a', {}, text('Live')), h('a', {}, text('Reports')), h('a', {}, text('Admin'))]);
      assert.equal(track.childNodes[0], first);
      assert.ok(track.childNodes.includes(middle));
      assert.deepEqual(track.childNodes.filter((node) => !node.hasAttribute('data-ds-keep')).map((node) => node.textContent), ['Live', 'Reports', 'Admin']);
    });

    it('does not drop the cells between a new empty cell and an identical one 20 siblings on', () => {
      const cells = Array.from({ length: 20 }, (_, index) => h('td', {}, text(`c${index + 1}`)));
      const empty = h('td', {});
      const row = h('tr', {}, ...cells, empty);
      dom.morphChildren(row, [h('td', {}), ...Array.from({ length: 20 }, (_, index) => h('td', {}, text(`c${index + 1}`)))]);
      assert.equal(row.childNodes.length, 21);
      assert.deepEqual(row.childNodes.map((cell) => cell.textContent), ['', ...cells.map((_, index) => `c${index + 1}`)]);
      assert.ok([...cells, empty].every((cell) => cell.parentNode === row), 'every old cell is still there');
    });

    it('replaces again with data-ds-replace or { replace: true }', () => {
      const marked = h('div', { class: 'a', 'data-ds-replace': '' }, text('x'));
      const plain = h('p', { class: 'a' }, text('y'));
      const box = h('div', {}, marked, plain);
      dom.morphChildren(box, [h('div', { class: 'b', 'data-ds-replace': '' }, text('x')), h('p', { class: 'b' }, text('y'))]);
      assert.notEqual(box.childNodes[0], marked, 'data-ds-replace: a fresh node');
      assert.equal(box.childNodes[1], plain, 'elsewhere: patched');
      dom.morphChildren(box, [box.childNodes[0].cloneNode(true), h('p', { class: 'c' }, text('y'))], { replace: true });
      assert.notEqual(box.childNodes[1], plain, '{ replace: true }: a fresh node');
      assert.equal(box.childNodes[1].getAttribute('class'), 'c');
    });

    it('keeps a node whose onRemove returned a Promise as a pending removal until it settles', async () => {
      const a = h('li', { 'data-ds-key': 'a' }, text('A'));
      const b = h('li', { 'data-ds-key': 'b' }, text('B'));
      const list = h('ul', {}, a, b);
      let finish = () => {};
      const removed = [];
      const options = {
        onRemove(node) {
          removed.push(node);
          return new Promise((resolve) => { finish = resolve; });
        },
      };
      dom.morphChildren(list, [h('li', { 'data-ds-key': 'a' }, text('A'))], options);
      assert.deepEqual(list.childNodes, [a, b]);
      assert.equal(b.inert, true);
      assert.equal(b.getAttribute('aria-hidden'), 'true');
      assert.equal(b.hasAttribute('data-ds-leaving'), true);
      // A later morph skips it: no second removal, and b is not matched.
      dom.morphChildren(list, [h('li', { 'data-ds-key': 'a' }, text('A2')), h('li', { 'data-ds-key': 'c' }, text('C'))], options);
      assert.deepEqual(removed, [b]);
      assert.ok(list.childNodes.includes(b));
      finish();
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(b.parentNode, null);
      assert.deepEqual(shape(list), ['a:A2', 'c:C']);
    });

    it('skips an element that DS.motion.leave() will remove, and keeps the inert of one that leaves to stay', () => {
      // leave(b): ds-leave, inert and data-ds-leaving (a pending removal).
      const a = h('li', {}, text('A'));
      const b = h('li', { class: 'ds-leave', inert: '', 'data-ds-leaving': '' }, text('B'));
      const c = h('li', {}, text('C'));
      const list = h('ul', {}, a, b, c);
      dom.morphChildren(list, [h('li', {}, text('A')), h('li', {}, text('C (updated)'))]);
      assert.deepEqual(list.childNodes, [a, b, c], 'the leaving node is neither patched nor removed');
      assert.equal(b.textContent, 'B');
      assert.equal(c.textContent, 'C (updated)', 'the next live sibling is patched');
      // leave(el, v, { then: 'keep' }): no mark, so it is patched, but stays inert while it carries ds-leave.
      const kept = h('div', { class: 'ds-panel ds-leave ds-leave--sink', inert: '' }, text('Old'));
      const parent = h('div', {}, kept);
      dom.morphChildren(parent, [h('div', { class: 'ds-panel' }, text('New'))]);
      assert.equal(parent.childNodes[0], kept);
      assert.equal(kept.textContent, 'New');
      assert.equal(kept.hasAttribute('inert'), true);
      assert.deepEqual([...kept.classList], ['ds-panel', 'ds-leave', 'ds-leave--sink']);
      // At rest the page's markup decides.
      const rest = h('div', { class: 'ds-panel', inert: '' }, text('Old'));
      dom.morphChildren(h('div', {}, rest), [h('div', { class: 'ds-panel' }, text('Old'))]);
      assert.equal(rest.hasAttribute('inert'), false);
    });

    it('calls onInsert for new elements and holds them back under holdOrder', () => {
      const list = h('ul', {}, h('li', { 'data-ds-key': 'a' }, text('A')));
      const inserted = [];
      dom.morphChildren(list, [h('li', { 'data-ds-key': 'a' }, text('A')), h('li', { 'data-ds-key': 'b' }, text('B'))], { onInsert: (node) => inserted.push(node.getAttribute('data-ds-key')) });
      assert.deepEqual(inserted, ['b']);
    });
  });

  it('createIndicator() marks its span data-ds-keep, so a morph of the track keeps it', (t) => {
    const { h, doc } = miniDom();
    const saved = globalThis.document;
    globalThis.document = doc;
    t.after(() => { globalThis.document = saved; });
    const track = h('nav', { class: 'ds-segmented' }, h('a', { 'aria-current': 'true' }));
    const handle = indicator.createIndicator(track, { active: '[aria-current="true"]' });
    const span = track.childNodes[0];
    assert.equal(span.getAttribute('data-ds-keep'), '');
    assert.equal(span.getAttribute('aria-hidden'), 'true');
    dom.morphChildren(track, [h('a', {}), h('a', { 'aria-current': 'true' })]);
    assert.equal(track.childNodes[0], span);
    handle.destroy();
  });
});

/**
 * A tiny DOM for dom.js and indicator.js under node:test: elements with
 * attributes, class and style views of them, text nodes, insertBefore,
 * an optional moveBefore (doc.canMove), focus and a log of insertions.
 */
function miniDom() {
  const doc = { activeElement: null, canMove: false, log: [], fonts: undefined };
  class FakeNode {
    constructor() {
      this.ownerDocument = doc;
      this.parentNode = null;
      this.childNodes = [];
    }

    get parentElement() { return this.parentNode; }

    get firstChild() { return this.childNodes[0] ?? null; }

    get nextSibling() {
      if (!this.parentNode) return null;
      const list = this.parentNode.childNodes;
      return list[list.indexOf(this) + 1] ?? null;
    }

    get textContent() { return this.nodeType === 3 ? this.nodeValue : this.childNodes.map((node) => node.textContent).join(''); }

    contains(node) {
      for (let current = node; current; current = current.parentNode) if (current === this) return true;
      return false;
    }

    remove() {
      if (!this.parentNode) return;
      const list = this.parentNode.childNodes;
      list.splice(list.indexOf(this), 1);
      this.parentNode = null;
    }
  }
  class FakeText extends FakeNode {
    constructor(value) {
      super();
      this.nodeType = 3;
      this.nodeValue = value;
    }

    isEqualNode(other) { return other?.nodeType === 3 && other.nodeValue === this.nodeValue; }

    cloneNode() { return new FakeText(this.nodeValue); }
  }
  class FakeEl extends FakeNode {
    constructor(tag) {
      super();
      this.nodeType = 1;
      this.tagName = tag.toUpperCase();
      this.attrs = new Map();
      this.inert = false;
      this.dataset = {};
    }

    get value() { return this.typed ?? this.getAttribute('value') ?? ''; }

    set value(value) { this.typed = String(value); }

    get attributes() { return [...this.attrs].map(([name, value]) => ({ name, value, namespaceURI: null, localName: name })); }

    getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; }

    setAttribute(name, value) { this.attrs.set(name, String(value)); }

    removeAttribute(name) { this.attrs.delete(name); }

    hasAttribute(name) { return this.attrs.has(name); }

    get className() { return this.getAttribute('class') ?? ''; }

    set className(value) { this.setAttribute('class', value); }

    get classList() {
      const names = () => this.className.split(/\s+/).filter(Boolean);
      const write = (list) => this.setAttribute('class', list.join(' '));
      return {
        [Symbol.iterator]: () => names()[Symbol.iterator](),
        contains: (name) => names().includes(name),
        add: (...added) => write([...names(), ...added.filter((name) => !names().includes(name))]),
        remove: (...removed) => write(names().filter((name) => !removed.includes(name))),
        toggle: (name, force) => {
          const on = force ?? !names().includes(name);
          if (on) write([...names().filter((other) => other !== name), name]);
          else write(names().filter((other) => other !== name));
          return on;
        },
      };
    }

    get style() {
      const parse = () => (this.getAttribute('style') ?? '').split(';').map((part) => part.trim()).filter(Boolean)
        .map((part) => [part.slice(0, part.indexOf(':')).trim(), part.slice(part.indexOf(':') + 1).trim()]);
      const write = (list) => this.setAttribute('style', list.map(([name, value]) => `${name}: ${value}`).join('; '));
      const list = parse();
      const style = {
        length: list.length,
        getPropertyValue: (name) => parse().find(([key]) => key === name)?.[1] ?? '',
        getPropertyPriority: () => '',
        setProperty: (name, value) => write([...parse().filter(([key]) => key !== name), [name, value]]),
        removeProperty: (name) => write(parse().filter(([key]) => key !== name)),
      };
      list.forEach(([name], index) => { style[index] = name; });
      return style;
    }

    insertBefore(node, ref) {
      node.remove();
      const index = ref ? this.childNodes.indexOf(ref) : this.childNodes.length;
      assert.ok(index >= 0, 'insertBefore: the reference is a child');
      this.childNodes.splice(index, 0, node);
      node.parentNode = this;
      doc.log.push(['insert', node]);
      return node;
    }

    get moveBefore() {
      if (!doc.canMove) return undefined;
      return (node, ref) => {
        this.insertBefore(node, ref);
        doc.log.at(-1)[0] = 'move';
      };
    }

    prepend(node) { this.insertBefore(node, this.firstChild); }

    append(...nodes) { nodes.forEach((node) => this.insertBefore(node, null)); }

    focus() { doc.activeElement = this; }

    matches(selector) {
      const match = /^\[([\w-]+)="([^"]*)"\]$/.exec(selector);
      return Boolean(match) && this.getAttribute(match[1]) === match[2];
    }

    querySelector(selector) {
      for (const child of this.childNodes) {
        if (child.nodeType !== 1) continue;
        if (child.matches(selector)) return child;
        const deeper = child.querySelector(selector);
        if (deeper) return deeper;
      }
      return null;
    }

    getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; }

    isEqualNode(other) {
      if (other?.nodeType !== 1 || other.tagName !== this.tagName || other.attrs.size !== this.attrs.size) return false;
      for (const [name, value] of this.attrs) if (other.getAttribute(name) !== value) return false;
      return other.childNodes.length === this.childNodes.length && this.childNodes.every((child, index) => child.isEqualNode(other.childNodes[index]));
    }

    cloneNode(deep) {
      const copy = new FakeEl(this.tagName.toLowerCase());
      for (const [name, value] of this.attrs) copy.setAttribute(name, value);
      if (deep) this.childNodes.forEach((child) => copy.insertBefore(child.cloneNode(true), null));
      return copy;
    }
  }
  doc.createElement = (tag) => new FakeEl(tag);
  const h = (tag, attributes = {}, ...children) => {
    const element = new FakeEl(tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    for (const child of children) element.insertBefore(child, null);
    return element;
  };
  return { h, text: (value) => new FakeText(value), doc };
}

describe('classic-script build (dist/ds.js)', () => {
  it('exposes the same exports as the modules under window.DS', () => {
    const sandbox = { window: undefined };
    sandbox.globalThis = sandbox;
    runInNewContext(read('dist/ds.js'), sandbox);
    const DS = sandbox.DS;
    assert.equal(DS.version, JSON.parse(read('package.json')).version);
    for (const [name, module] of Object.entries({ motion, indicator, dom, ripple, icons })) {
      assert.deepEqual(Object.keys(DS[name]).sort(), Object.keys(module).sort(), name);
    }
    assert.equal(DS.icons.icon(DS.icons.plus, 16), icons.icon(icons.plus, 16));
    assert.equal(DS.motion.loaderHoldMs(1000, 1300), motion.loaderHoldMs(1000, 1300));
    assert.equal(sandbox.DashboardStyle.versions[DS.version], DS);
  });

  describe('two copies on one page', () => {
    const version = JSON.parse(read('package.json')).version;
    /** A page with a console that counts warnings; `load(source)` runs a copy of ds.js in it. */
    function page(globals = {}) {
      const warnings = [];
      const sandbox = { window: undefined, console: { warn: (message) => warnings.push(message) }, ...globals };
      sandbox.globalThis = sandbox;
      return { sandbox, warnings, load: (source) => runInNewContext(source, sandbox) };
    }
    const asVersion = (other) => read('dist/ds.js').split(`'${version}'`).join(`'${other}'`);

    it('keeps the first DS when another version loads, exposes both and warns once', () => {
      const { sandbox, warnings, load } = page();
      load(read('dist/ds.js'));
      const first = sandbox.DS;
      load(asVersion('9.9.9'));
      assert.equal(sandbox.DS, first);
      assert.equal(sandbox.DS.version, version);
      assert.deepEqual(Object.keys(sandbox.DashboardStyle.versions).sort(), [version, '9.9.9'].sort());
      assert.equal(sandbox.DashboardStyle.versions['9.9.9'].version, '9.9.9');
      assert.equal(typeof sandbox.DashboardStyle.versions['9.9.9'].motion.enter, 'function');
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], new RegExp(`9\\.9\\.9.*${version.replace(/\./g, '\\.')}`));
    });

    it('stays silent when the same version loads twice', () => {
      const { sandbox, warnings, load } = page();
      load(read('dist/ds.js'));
      const first = sandbox.DS;
      load(read('dist/ds.js'));
      assert.equal(sandbox.DS, first);
      assert.deepEqual(warnings, []);
    });

    it('leaves a foreign DS without a version untouched', () => {
      const foreign = { mine: true };
      const { sandbox, warnings, load } = page({ DS: foreign });
      load(read('dist/ds.js'));
      assert.equal(sandbox.DS, foreign);
      assert.deepEqual(Object.keys(sandbox.DS), ['mine']);
      assert.equal(sandbox.DashboardStyle.versions[version].version, version);
      assert.equal(warnings.length, 1);
    });
  });

  it('keeps src/js within the ES2022 baseline', () => {
    for (const file of filesIn('src/js')) {
      const withStrings = withoutComments(read(file));
      // Before the strings go: the module specifiers and a RegExp built with the v flag.
      for (const line of withStrings.split('\n').filter((text) => /^\s*import\b|\bimport\s*\(/.test(text))) {
        assert.match(line, /^import \{ [\w$]+( as [\w$]+)?(, [\w$]+( as [\w$]+)?)* \} from (['"])\.\/[\w-]+\.js\4;$/, `${file}: imports only named exports of a sibling module, on one line: ${line.trim()}`);
      }
      assert.doesNotMatch(withStrings, /new RegExp\([^)]*,\s*['"`][a-z]*v[a-z]*['"`]\s*\)/, `${file}: the RegExp v flag`);
      assert.doesNotMatch(withStrings, /^\s*export\s+(?!const\s|function\s)/m, `${file}: exports only as export const / export function`);
      const code = withoutStrings(withStrings);
      for (const [pattern, name] of ES_NEWER) assert.doesNotMatch(code, pattern, `${file}: ${name} is newer than ES2022 / Safari 16.4`);
    }
  });

  it('uses progressive APIs only behind feature detection, named under "Progressive:"', () => {
    for (const file of filesIn('src/js')) {
      const source = read(file);
      const code = withoutComments(source);
      const header = source.match(/^\/\*[\s\S]*?\*\//)?.[0] || '';
      const note = header.includes('Progressive:') ? header.slice(header.indexOf('Progressive:')) : '';
      for (const api of PROGRESSIVE_APIS) {
        const used = new RegExp(`\\b${api}\\b`).test(withoutStrings(code)) || new RegExp(`['"]${api}['"]`).test(code);
        if (!used) continue;
        const detected = new RegExp(`typeof\\s+[\\w$.]*\\b${api}\\s*===?\\s*['"]function['"]|['"]${api}['"]\\s+in\\s`).test(code);
        assert.ok(detected, `${file}: ${api} without a typeof ... === 'function' or '${api}' in ... check`);
        assert.ok(note.includes(api), `${file}: name ${api} under "Progressive:" in the header`);
      }
    }
  });
});

describe('timing in src/js', () => {
  it('reads durations from the tokens: no ms literal outside the tested fallbacks', () => {
    // Each allowed literal with its reason; MOTION_FALLBACKS itself is
    // compared with tokens.css (test/tokens.test.js).
    const allowed = new Map([
      ['src/js/motion.js: DEFAULT_TIMEOUT_MS = 1000', 'settled() without getAnimations(), stretched by --ds-time-scale'],
      ['src/js/motion.js: CEILING_MARGIN_MS = 100', 'the margin behind a derived ceiling, not a motion'],
      ['src/js/motion.js: hold ?? 2000', 'the canonical default of flip() (D7)'],
      ['src/js/indicator.js: now + 600', 'the indicator retargets while it glides; tokens in P4 (test/tokens.test.js pins it)'],
    ]);
    const found = [];
    for (const file of filesIn('src/js', (path) => path.endsWith('.js'))) {
      const source = withoutStrings(withoutComments(read(file)));
      const fallbacks = source.indexOf('MOTION_FALLBACKS = Object.freeze(');
      const code = fallbacks < 0 ? source : source.slice(0, fallbacks) + source.slice(source.indexOf('});', fallbacks) + 3);
      const patterns = [
        /\b[A-Z_]*(?:MS|TIMEOUT)\b\s*=\s*[1-9]\d*/g,
        /\b(?:duration|delay|hold|timeout)\s*(?::|\?\?|=)\s*[1-9]\d*/g,
        /\bsetTimeout\([^;]*?,\s*[1-9]\d*\s*\)/g,
        /\b(?:now|Date\.now\(\)|performance\.now\(\))\s*[+-]\s*[1-9]\d*/g,
      ];
      for (const pattern of patterns) {
        for (const match of code.matchAll(pattern)) {
          const text = match[0].replace(/^setTimeout\(.*,\s*/, 'setTimeout(..., ').replace(/^options\./, '');
          found.push(`${file}: ${text}`);
        }
      }
    }
    assert.deepEqual(found.filter((entry) => !allowed.has(entry)), []);
    assert.deepEqual([...allowed.keys()].filter((entry) => !found.includes(entry)), [], 'no stale allowance');
  });
});

/** JS without block and line comments (a `//` inside a string or regex is rare enough here). */
const withoutComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
/** JS without the contents of single-, double- and back-quoted strings. */
const withoutStrings = (code) => code.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''");

/** APIs and syntax newer than the baseline (ES2022, Safari 16.4), each with its name. */
const ES_NEWER = [
  [/\bPromise\.withResolvers\b/, 'Promise.withResolvers'],
  [/\bObject\.groupBy\b/, 'Object.groupBy'],
  [/\bMap\.groupBy\b/, 'Map.groupBy'],
  [/\bArray\.fromAsync\b/, 'Array.fromAsync'],
  [/\.(union|intersection|difference|symmetricDifference|isSubsetOf|isSupersetOf|isDisjointFrom)\(/, 'the Set methods'],
  [/\bIterator\.from\b/, 'Iterator.from'],
  [/(^|[;{}\s])(await\s+)?using\s+[\w$]+\s*=/m, 'using declarations'],
  [/(^|[\s(;{}])@[\w$]/m, 'decorators'],
  // A regex literal after an operator or bracket whose flags include v.
  [/(^|[=(,:[!&|?{};>]|\breturn)\s*\/(?![*/])(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[dgimsuy]*v/m, 'the RegExp v flag'],
];

/** Browser APIs newer than the baseline: only behind feature detection, named under "Progressive:". */
const PROGRESSIVE_APIS = ['startViewTransition', 'moveBefore', 'showPopover', 'anchorName', 'scrollend'];
