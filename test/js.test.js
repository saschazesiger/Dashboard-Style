/**
 * Icons, the indicator (on a fake track), the DOM morph (on a tiny fake
 * DOM), the ripple, the classic-script build and the timing literals of
 * src/js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import * as icons from '../src/js/icons.js';
import * as motion from '../src/js/motion.js';
import * as indicator from '../src/js/indicator.js';
import * as dom from '../src/js/dom.js';
import * as ripple from '../src/js/ripple.js';
import * as overlay from '../src/js/overlay.js';
import { filesIn, read } from './helpers.js';
import { sample as curveSample, SPATIAL, springFunction } from '../scripts/motion-curves.mjs';

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

  it('keeps the check drawable (pathLength 1 for ds-draw), from its short arm', () => {
    // The stroke starts at the short arm, so a drawn check reads left to right.
    assert.equal(icons.check, '<path pathLength="1" d="M4 12l5 5L20 6"/>');
    // The tick of checkCircle draws too; its circle stays a plain outline.
    assert.equal(icons.checkCircle, '<circle cx="12" cy="12" r="10"/><path pathLength="1" d="m9 12 2 2 4-4"/>');
  });
});

describe('indicator, dom, ripple and overlay', () => {
  it('exports the documented functions', () => {
    assert.equal(typeof indicator.createIndicator, 'function');
    assert.equal(typeof dom.morphHtml, 'function');
    assert.equal(typeof dom.morphChildren, 'function');
    assert.equal(typeof ripple.attach, 'function');
    for (const name of ['open', 'close', 'toast', 'tooltips', 'lockScroll', 'unlockScroll']) assert.equal(typeof overlay[name], 'function', name);
    // The fallbacks outside a theme (the timing itself comes from the tokens).
    assert.deepEqual(
      [overlay.TOAST_MS, overlay.TOAST_MAX_MS, overlay.TOAST_LIMIT, overlay.TOOLTIP_DELAY_MS, overlay.TOOLTIP_SKIP_MS, overlay.TOOLTIP_HIDE_MS],
      [4000, 10000, 3, 500, 300, 100],
    );
  });

  it('ripples clickable cards, clickable tiles and interactive table rows by default (1.4.0)', () => {
    const hosts = ripple.RIPPLE_HOSTS.split(/,\s*(?![^(]*\))/);
    for (const host of [':is(button, a).ds-tile', '.ds-card--interactive', '.ds-table--interactive tbody tr:not(.ds-table__detail)']) {
      assert.ok(hosts.includes(host), `${host} is a default host`);
    }
  });

  it('counts the scroll lock and keeps the room of a scrollbar that the lock removed', () => {
    /** A page whose body scrollbar (`bar` px) goes while body.ds-no-scroll is set. */
    function stubPage(bar, gutter) {
      const classes = new Set();
      const root = { style: { scrollbarGutter: '' }, get clientWidth() { return 1000 - (classes.has('ds-no-scroll') ? 0 : bar); } };
      const body = { style: { paddingRight: '' }, classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) } };
      const view = { innerWidth: 1000, CSS: { supports: () => gutter }, getComputedStyle: () => ({ paddingRight: '8px' }) };
      return { body, documentElement: root, defaultView: view };
    }
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'document');
    try {
      for (const [bar, gutter, expected] of [[0, true, ['', '']], [15, true, ['stable', '']], [15, false, ['', '23px']]]) {
        const doc = stubPage(bar, gutter);
        Object.defineProperty(globalThis, 'document', { value: doc, configurable: true, writable: true });
        const locked = () => doc.body.classList.contains('ds-no-scroll');
        const room = () => [doc.documentElement.style.scrollbarGutter, doc.body.style.paddingRight];
        overlay.lockScroll();
        assert.equal(locked(), true);
        assert.deepEqual(room(), expected, `bar ${bar}, gutter ${gutter}`);
        overlay.lockScroll();
        overlay.unlockScroll();
        assert.equal(locked(), true, 'the class toggles only on 0 <-> 1');
        overlay.unlockScroll();
        assert.equal(locked(), false);
        assert.deepEqual(room(), ['', '']);
        overlay.unlockScroll();
        overlay.lockScroll();
        assert.equal(locked(), true, 'an unbalanced unlock never goes below 0');
        overlay.unlockScroll();
        assert.equal(locked(), false);
      }
    } finally {
      if (saved) Object.defineProperty(globalThis, 'document', saved);
      else delete globalThis.document;
    }
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
        // insertBefore makes a node new to the style engine: it is marked while it goes in (no
        // @starting-style replay), and the mark is gone when the call returns.
        assert.ok(doc.log.every(([, , marked]) => marked === !move), `data-ds-moving while inserted, moveBefore: ${move}`);
        assert.ok(old.every((row) => !row.hasAttribute('data-ds-moving')), 'no mark left');
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
      doc.log.push(['insert', node, node.hasAttribute?.('data-ds-moving') ?? false]);
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

/** The clip edges of the indicator, top, right, bottom, left (indicator.css). */
const EDGES = ['--ds-indicator-t', '--ds-indicator-r', '--ds-indicator-b', '--ds-indicator-l'];
const INSTANT = 'ds-indicator--instant';
const tick = () => new Promise((resolve) => setImmediate(resolve));

/**
 * A vertical track for createIndicator() on miniDom, with every browser part
 * indicator.js touches stubbed: rects, scroll metrics, computed style,
 * getAnimations(), both observers, frames and fonts. The track sits at
 * (10, 20) in the viewport; item i is 200 x 40 at (8, 8 + 48i) in the
 * track. `el.computed` overrides a computed value (an edge mid-glide, a
 * radius); every style flush of step 1 is recorded in `flushes`.
 */
function indicatorTrack({ count = 4, current = 0, overflow = 'visible' } = {}) {
  const { h, doc } = miniDom();
  const frames = new Map();
  let nextFrame = 1;
  const cancelled = [];
  const resizeObservers = [];
  const mutationObservers = [];
  const listeners = new Map();
  const flushes = [];
  let resolveFonts;
  const fonts = {
    ready: new Promise((resolve) => { resolveFonts = resolve; }),
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
  };
  const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
  const value = (el, name, fallback) => el.computed?.[name] ?? (el.style.getPropertyValue(name) || fallback);
  const view = {
    requestAnimationFrame(callback) {
      const id = nextFrame;
      nextFrame += 1;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      cancelled.push(id);
      frames.delete(id);
    },
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; this.observed = new Set(); this.connected = true; resizeObservers.push(this); }

      observe(element) { this.observed.add(element); }

      unobserve(element) { this.observed.delete(element); }

      disconnect() { this.observed.clear(); this.connected = false; }
    },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; this.connected = false; mutationObservers.push(this); }

      observe(target, options) { this.target = target; this.options = options; this.connected = true; }

      disconnect() { this.connected = false; }
    },
    getComputedStyle(el) {
      return {
        getPropertyValue(name) {
          // Step 1 of a motion ends with this read: record what it froze.
          if (name === EDGES[0] && el.classList.contains(INSTANT) && 'glide' in el.dataset) flushes.push(snapshot(el));
          return value(el, name, EDGES.includes(name) || name === '--ds-indicator-radius' ? '0px' : '');
        },
        get borderTopLeftRadius() { return el.computed?.borderTopLeftRadius ?? '0px'; },
        get overflowX() { return el.overflow ?? 'visible'; },
        get overflowY() { return el.overflow ?? 'visible'; },
      };
    },
  };
  doc.defaultView = view;
  doc.fonts = fonts;

  const items = Array.from({ length: count }, (_, index) => {
    const item = h('a', { class: 'ds-drawer__item' });
    item.rect = rect(18, 28 + index * 48, 200, 40);
    return item;
  });
  const track = h('nav', { class: 'ds-drawer__list' }, ...items);
  track.rect = rect(10, 20, 216, 400);
  Object.assign(track, { clientLeft: 0, clientTop: 0, scrollLeft: 0, scrollTop: 0, scrollWidth: 216, scrollHeight: 400, overflow });

  // What miniDom leaves out and indicator.js reads.
  const proto = Object.getPrototypeOf(track);
  proto.getBoundingClientRect = function boundingRect() { return this.rect ?? rect(0, 0, 0, 0); };
  proto.getAnimations = function animations() { return this.animations ?? []; };
  proto.closest = function closest(selector) {
    const attribute = /^\[([\w-]+)\]$/.exec(selector);
    for (let element = this; element?.nodeType === 1; element = element.parentNode) {
      if (attribute ? element.hasAttribute(attribute[1]) : element.classList.contains(selector.slice(1))) return element;
    }
    return null;
  };
  Object.defineProperty(proto, 'children', { configurable: true, get() { return this.childNodes.filter((node) => node.nodeType === 1); } });

  const setCurrent = (index) => items.forEach((item, at) => (at === index ? item.setAttribute('aria-current', 'page') : item.removeAttribute('aria-current')));
  setCurrent(current);

  /** Box and painted pill of the indicator from its inline style, in track coordinates. */
  function geometry(el) {
    const read = (name) => parseFloat(el.style.getPropertyValue(name));
    const box = { left: read('--ds-indicator-x'), top: read('--ds-indicator-y') };
    box.right = box.left + read('--ds-indicator-w');
    box.bottom = box.top + read('--ds-indicator-h');
    const [t, r, b, l] = EDGES.map(read);
    return { box, insets: { t, r, b, l }, painted: { left: box.left + l, top: box.top + t, right: box.right - r, bottom: box.bottom - b } };
  }
  function snapshot(el) {
    return { ...geometry(el), instant: el.classList.contains(INSTANT), dataset: { ...el.dataset } };
  }

  return {
    h,
    doc,
    view,
    track,
    items,
    frames,
    cancelled,
    resizeObservers,
    mutationObservers,
    listeners,
    flushes,
    resolveFonts: () => resolveFonts(),
    setCurrent,
    geometry,
    /** The item `index` in track coordinates. */
    slot: (index) => ({ left: 8, top: 8 + index * 48, right: 208, bottom: 48 + index * 48 }),
    /** Runs the pending frame callbacks. */
    runFrames() {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback());
    },
    /**
     * Edge transitions on `el` until the returned function lands them. Like
     * real ones they run only while the edges transition (no --instant):
     * the next motion starts them, a pill at rest has none.
     */
    run(el) {
      const settle = [];
      const running = EDGES.map((transitionProperty) => ({ transitionProperty, finished: new Promise((resolve) => settle.push(resolve)) }));
      let landed = false;
      Object.defineProperty(el, 'animations', { configurable: true, get: () => (landed || el.classList.contains(INSTANT) ? [] : running) });
      return async () => {
        landed = true;
        settle.forEach((resolve) => resolve());
        await tick();
      };
    },
  };
}

describe('createIndicator on a fake track', () => {
  const create = (env, options = {}) => {
    const handle = indicator.createIndicator(env.track, { active: '[aria-current="page"]', ...options });
    return { handle, span: env.track.childNodes[0] };
  };
  const zero = { t: 0, r: 0, b: 0, l: 0 };

  it('places the first item without a glide: the box is the item, insets 0', () => {
    const env = indicatorTrack({ current: 1 });
    const { handle, span } = create(env);
    assert.ok(span.classList.contains('ds-indicator') && span.classList.contains(INSTANT));
    assert.equal('glide' in span.dataset, false);
    assert.equal(env.geometry(span).insets.t, 0);
    assert.deepEqual(env.geometry(span).box, env.slot(1));
    assert.deepEqual(env.geometry(span).insets, zero);
    assert.equal(env.track.style.getPropertyValue('--ds-indicator-dur'), '', 'no travel time without a glide');
    assert.ok(env.track.classList.contains('ds-has-indicator'));
    handle.destroy();
  });

  it('glides to a new item: data-dir, travel time, union box with the overshoot margin', async () => {
    const env = indicatorTrack();
    const { handle, span } = create(env);
    const land = env.run(span);
    env.setCurrent(2);
    handle.update();
    const from = env.slot(0);
    const to = env.slot(2);
    const distance = to.top - from.top;
    // Step 1 froze the pill where it was, inside the union box.
    const [step1] = env.flushes;
    assert.ok(step1.instant && 'glide' in step1.dataset, 'step 1 runs with --instant and data-glide');
    assert.deepEqual(step1.painted, from);
    const margin = Math.ceil(indicator.OVERSHOOT * distance) + 1;
    const box = { left: 8, top: from.top, right: 208, bottom: to.bottom + margin };
    assert.deepEqual(step1.box, box, 'the union, widened only where the lead edge travels');
    // Step 2: the edges run to the target, the trailing edge per data-dir.
    assert.equal(span.classList.contains(INSTANT), false);
    assert.equal(span.dataset.dir, 'down');
    assert.deepEqual(env.geometry(span).box, box);
    assert.deepEqual(env.geometry(span).painted, to);
    assert.equal(span.style.getPropertyValue('border-radius'), '0px', 'no own radius on the union');
    assert.equal(env.track.style.getPropertyValue('--ds-indicator-dur'), `${motion.travelDuration(env.track, distance)}ms`);
    // Landed: the plain pill on the item again.
    await land();
    assert.ok(span.classList.contains(INSTANT));
    assert.equal('glide' in span.dataset, false);
    assert.equal('dir' in span.dataset, false);
    assert.deepEqual(env.geometry(span).box, to);
    assert.deepEqual(env.geometry(span).insets, zero);
    assert.equal(span.style.getPropertyValue('border-radius'), '');
    handle.destroy();
  });

  it('points data-dir along the dominant axis of the travel', () => {
    const env = indicatorTrack({ current: 3 });
    const { handle, span } = create(env);
    env.run(span);
    env.setCurrent(1);
    handle.update();
    assert.equal(span.dataset.dir, 'up');
    // Horizontal: the items side by side.
    const row = indicatorTrack({ count: 3 });
    row.items.forEach((item, index) => { item.rect = { left: 18 + index * 100, top: 28, width: 90, height: 40, right: 108 + index * 100, bottom: 68 }; });
    const across = create(row);
    row.run(across.span);
    row.setCurrent(2);
    across.handle.update();
    assert.equal(across.span.dataset.dir, 'right');
    row.setCurrent(0);
    across.handle.update();
    assert.equal(across.span.dataset.dir, 'left');
    handle.destroy();
    across.handle.destroy();
  });

  it('keeps the glide box inside the scroll area of a track that clips', () => {
    const env = indicatorTrack({ overflow: 'auto' });
    env.track.scrollHeight = env.slot(2).bottom;
    const { handle, span } = create(env);
    env.run(span);
    env.setCurrent(2);
    handle.update();
    const { box, painted } = env.geometry(span);
    assert.ok(box.bottom <= env.track.scrollHeight, `box bottom ${box.bottom}`);
    assert.ok(box.top >= 0 && box.left >= 0 && box.right <= env.track.scrollWidth);
    assert.deepEqual(painted, env.slot(2));
    handle.destroy();
  });

  it('does not glide when the item stays, and jumps on a resize at rest', () => {
    const env = indicatorTrack({ current: 1 });
    const { handle, span } = create(env);
    handle.update();
    assert.equal(env.flushes.length, 0, 'no glide for the same item');
    assert.equal(env.track.style.getPropertyValue('--ds-indicator-dur'), '');
    // The item grows (a wrap): the resize observer places the pill at once.
    env.items[1].rect = { ...env.items[1].rect, height: 60, bottom: env.items[1].rect.top + 60 };
    env.resizeObservers[0].callback([]);
    assert.equal(env.flushes.length, 0, 'a resize with nothing running does not glide');
    assert.ok(span.classList.contains(INSTANT));
    assert.deepEqual(env.geometry(span).box, { ...env.slot(1), bottom: env.slot(1).top + 60 });
    assert.deepEqual(env.geometry(span).insets, zero);
    handle.destroy();
  });

  it('retargets from the painted edges while they run (a second target, a resize mid-glide)', () => {
    const env = indicatorTrack();
    const { handle, span } = create(env);
    env.run(span);
    env.setCurrent(3);
    handle.update();
    const firstBox = env.geometry(span).box;
    // Mid-glide the computed edges are between start and target.
    span.computed = { '--ds-indicator-t': '60px', '--ds-indicator-r': '0px', '--ds-indicator-b': '50px', '--ds-indicator-l': '0px' };
    const painted = { left: firstBox.left, top: firstBox.top + 60, right: firstBox.right, bottom: firstBox.bottom - 50 };
    env.setCurrent(1);
    handle.update();
    const step1 = env.flushes.at(-1);
    assert.equal(env.flushes.length, 2);
    assert.deepEqual(step1.painted, painted, 'continues from where the pill is painted');
    assert.equal(span.dataset.dir, 'up');
    assert.deepEqual(env.geometry(span).painted, env.slot(1));
    // A placement on the same running target keeps gliding.
    handle.update();
    assert.equal(env.flushes.length, 2);
    // A resize mid-glide: the same item moves, the pill retargets from where it is.
    span.computed = { '--ds-indicator-t': '20px', '--ds-indicator-r': '0px', '--ds-indicator-b': '30px', '--ds-indicator-l': '0px' };
    const box = env.geometry(span).box;
    env.items[1].rect = { ...env.items[1].rect, top: env.items[1].rect.top + 10, bottom: env.items[1].rect.bottom + 10 };
    env.resizeObservers[0].callback([]);
    assert.equal(env.flushes.length, 3);
    assert.deepEqual(env.flushes.at(-1).painted, { left: box.left, top: box.top + 20, right: box.right, bottom: box.bottom - 30 });
    assert.deepEqual(env.geometry(span).painted, { ...env.slot(1), top: env.slot(1).top + 10, bottom: env.slot(1).bottom + 10 });
    handle.destroy();
  });

  it('contracts to the centre without an active item and grows from the centre of the next one', async () => {
    const env = indicatorTrack({ current: 1 });
    const { handle, span } = create(env);
    const half = (env.slot(1).right - env.slot(1).left) / 2;
    let land = env.run(span);
    env.setCurrent(-1);
    handle.update();
    assert.equal(span.dataset.empty, '');
    assert.equal('glide' in span.dataset, true);
    assert.deepEqual(env.geometry(span).insets, { t: 0, r: half, b: 0, l: half }, 'the inline insets close to the centre');
    await land();
    assert.equal(span.dataset.empty, '', 'stays hidden');
    assert.ok(span.classList.contains(INSTANT));
    assert.equal('glide' in span.dataset, false);
    // An item after the empty state: from its centre, on --ds-dur-medium.
    land = env.run(span);
    env.setCurrent(2);
    handle.update();
    const step1 = env.flushes.at(-1);
    const slotHalf = (env.slot(2).right - env.slot(2).left) / 2;
    assert.deepEqual(step1.box, env.slot(2));
    assert.deepEqual(step1.insets, { t: 0, r: slotHalf, b: 0, l: slotHalf }, 'starts with the inline insets at half its width');
    assert.equal(step1.dataset.empty, '', 'starts transparent');
    assert.equal('empty' in span.dataset, false);
    assert.deepEqual(env.geometry(span).insets, zero);
    assert.equal(env.track.style.getPropertyValue('--ds-indicator-dur'), `${motion.motionDuration(env.track, '--ds-dur-medium')}ms`);
    await land();
    assert.deepEqual(env.geometry(span).box, env.slot(2));
    handle.destroy();
  });

  it('turns a pill that still contracts from where it is painted when an item comes back', async () => {
    const env = indicatorTrack({ current: 1 });
    const { handle, span } = create(env);
    const land = env.run(span);
    env.setCurrent(-1);
    handle.update();
    assert.equal(span.dataset.empty, '');
    // Mid-contraction: 40px of each inline inset are painted.
    span.computed = { [EDGES[0]]: '0px', [EDGES[1]]: '40px', [EDGES[2]]: '0px', [EDGES[3]]: '40px' };
    const slot = env.slot(1);
    env.setCurrent(1);
    handle.update();
    const step1 = env.flushes.at(-1);
    assert.deepEqual(step1.painted, { left: slot.left + 40, top: slot.top, right: slot.right - 40, bottom: slot.bottom }, 'continues from the painted pill');
    assert.equal('empty' in step1.dataset, false, 'the fade turns back');
    assert.equal('dir' in span.dataset, false, 'the same centre: a size change');
    assert.equal('glide' in span.dataset, true);
    delete span.computed;
    assert.deepEqual(env.geometry(span).painted, slot);
    await land();
    assert.deepEqual(env.geometry(span).box, slot);
    assert.equal('glide' in span.dataset, false);
    handle.destroy();
  });

  it('ignores its own writes and data-ds-keep nodes; several records give one frame', () => {
    const env = indicatorTrack();
    const { handle, span } = create(env);
    const [observer] = env.mutationObservers;
    assert.equal(observer.target, env.track);
    assert.deepEqual(observer.options, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-current', 'aria-pressed', 'aria-selected', 'aria-checked'] });
    env.runFrames();
    const ripple = env.h('span', { 'data-ds-keep': '' }, env.h('span'));
    env.items[0].append(ripple);
    observer.callback([
      { type: 'attributes', target: span },
      { type: 'childList', target: env.items[0], addedNodes: [ripple], removedNodes: [] },
      { type: 'childList', target: ripple, addedNodes: [ripple.childNodes[0]], removedNodes: [] },
    ]);
    assert.equal(env.frames.size, 0, 'nothing to place');
    observer.callback([{ type: 'attributes', target: env.items[1] }, { type: 'attributes', target: env.items[0] }]);
    observer.callback([{ type: 'childList', target: env.track, addedNodes: [env.h('a')], removedNodes: [] }]);
    assert.equal(env.frames.size, 1, 'one frame for every record');
    handle.destroy();
  });

  it('follows its items inside a wrapper that the page keeps (data-ds-keep outside the track)', () => {
    const env = indicatorTrack();
    env.h('div', { 'data-ds-keep': '' }, env.track);
    const { handle } = create(env);
    const [observer] = env.mutationObservers;
    env.runFrames();
    observer.callback([{ type: 'attributes', target: env.items[1] }]);
    assert.equal(env.frames.size, 1, 'an aria change in the track is placed');
    env.runFrames();
    env.track.setAttribute('data-ds-keep', '');
    observer.callback([{ type: 'attributes', target: env.items[2] }]);
    assert.equal(env.frames.size, 1, 'also when the track itself is kept');
    handle.destroy();
  });

  it('follows aria changes in the frame and re-syncs the observed elements', () => {
    const env = indicatorTrack();
    const { handle, span } = create(env);
    const [resize] = env.resizeObservers;
    assert.deepEqual([...resize.observed].sort((a, b) => env.items.indexOf(a) - env.items.indexOf(b)), [env.track, ...env.items]);
    assert.equal(resize.observed.has(span), false, 'never the indicator itself');
    env.runFrames();
    env.run(span);
    env.setCurrent(2);
    env.mutationObservers[0].callback([{ type: 'attributes', target: env.items[2] }]);
    env.runFrames();
    assert.equal(span.dataset.dir, 'down', 'moved without update()');
    // Items replaced: the new ones are observed, the old ones no longer.
    const added = env.h('a', { 'aria-current': 'page' });
    added.rect = env.items[0].rect;
    env.items[2].remove();
    env.track.append(added);
    env.mutationObservers[0].callback([{ type: 'childList', target: env.track, addedNodes: [added], removedNodes: [env.items[2]] }]);
    env.runFrames();
    // The placement in that frame made the new item the placed one; the next frame follows it.
    env.runFrames();
    assert.ok(resize.observed.has(added));
    assert.equal(resize.observed.has(env.items[2]), false);
    handle.destroy();
  });

  it('creates no MutationObserver with observe: false (resizes still place the pill)', () => {
    const env = indicatorTrack();
    const { handle, span } = create(env, { observe: false });
    assert.equal(env.mutationObservers.length, 0);
    assert.equal(env.resizeObservers.length, 1);
    env.items[0].rect = { ...env.items[0].rect, height: 44, bottom: env.items[0].rect.top + 44 };
    env.resizeObservers[0].callback([]);
    assert.equal(env.geometry(span).box.bottom, env.slot(0).top + 44);
    handle.destroy();
  });

  it('destroy() disconnects, cancels the frame, removes listener, span and class; late callbacks write nothing', async () => {
    const env = indicatorTrack();
    const { handle, span } = create(env);
    env.run(span);
    env.setCurrent(1);
    handle.update();
    const pending = [...env.frames.keys()];
    assert.equal(pending.length, 1, 'a frame is pending (the placed item changed)');
    const loadingdone = env.listeners.get('loadingdone');
    assert.equal(typeof loadingdone, 'function');
    handle.destroy();
    assert.equal(env.resizeObservers[0].connected, false);
    assert.equal(env.mutationObservers[0].connected, false);
    assert.deepEqual(env.cancelled, pending);
    assert.equal(env.listeners.has('loadingdone'), false);
    assert.equal(span.parentNode, null);
    assert.equal(env.track.childNodes.includes(span), false);
    assert.equal(env.track.classList.contains('ds-has-indicator'), false);
    assert.equal(env.track.style.getPropertyValue('--ds-indicator-dur'), '');
    // Late callbacks: fonts, a resize, an update.
    const style = span.getAttribute('style');
    env.resolveFonts();
    await tick();
    loadingdone();
    env.resizeObservers[0].callback([]);
    handle.update();
    handle.destroy();
    assert.equal(env.frames.size, 0, 'no frame requested');
    assert.equal(span.getAttribute('style'), style, 'nothing written');
    assert.equal(span.parentNode, null);
  });

  it('copies a computed border radius into --ds-indicator-radius only when the variable is 0px', () => {
    const own = indicatorTrack();
    own.doc.createElement = ((make) => (tag) => Object.assign(make(tag), { computed: { borderTopLeftRadius: '12px' } }))(own.doc.createElement);
    const a = create(own);
    assert.equal(a.span.style.getPropertyValue('--ds-indicator-radius'), '12px');
    a.handle.destroy();
    // A pill radius (9999px) is capped at half the item's smaller side.
    const pill = indicatorTrack();
    pill.doc.createElement = ((make) => (tag) => Object.assign(make(tag), { computed: { borderTopLeftRadius: '9999px' } }))(pill.doc.createElement);
    const b = create(pill);
    assert.equal(b.span.style.getPropertyValue('--ds-indicator-radius'), '20px');
    b.handle.destroy();
    // The component sets the variable: nothing is copied.
    const set = indicatorTrack();
    set.doc.createElement = ((make) => (tag) => Object.assign(make(tag), { computed: { borderTopLeftRadius: '12px', '--ds-indicator-radius': '24px' } }))(set.doc.createElement);
    const c = create(set);
    assert.equal(c.span.style.getPropertyValue('--ds-indicator-radius'), '');
    c.handle.destroy();
  });

  it('retimes label colour transitions that just started on the previous travel time', () => {
    const env = indicatorTrack();
    const { handle, span } = create(env);
    const medium = motion.motionDuration(env.track, '--ds-dur-medium');
    const timing = (duration, currentTime) => {
      const effect = { target: env.items[0], duration, getTiming() { return { duration: this.duration }; }, updateTiming(next) { this.duration = next.duration; } };
      return { transitionProperty: 'color', currentTime, effect };
    };
    const fresh = timing(medium, 0);
    const late = timing(medium, motion.motionDuration(env.track, '--ds-dur-micro') + 1);
    env.track.animations = [fresh, late];
    env.run(span);
    env.setCurrent(3);
    handle.update();
    const travel = motion.travelDuration(env.track, env.slot(3).top - env.slot(0).top);
    assert.ok(travel > medium);
    assert.equal(fresh.effect.duration, travel, 'a label that just started lands with its pill');
    assert.equal(late.effect.duration, medium, 'one already under way keeps its time');
    handle.destroy();
  });

  it('allows an overshoot at least as large as the peak of --ds-ease-spatial', () => {
    const peak = Math.max(...curveSample(springFunction(SPATIAL)).map((stop) => stop.value));
    assert.ok(peak > 1, `peak ${peak}`);
    assert.ok(indicator.OVERSHOOT >= peak - 1, `OVERSHOOT ${indicator.OVERSHOOT} < ${peak - 1}`);
    assert.ok(indicator.OVERSHOOT <= 0.05, 'the 1.05 peak contract');
  });
});

describe('classic-script build (dist/ds.js)', () => {
  it('exposes the same exports as the modules under window.DS', () => {
    const sandbox = { window: undefined };
    sandbox.globalThis = sandbox;
    runInNewContext(read('dist/ds.js'), sandbox);
    const DS = sandbox.DS;
    assert.equal(DS.version, JSON.parse(read('package.json')).version);
    for (const [name, module] of Object.entries({ motion, indicator, dom, ripple, icons, overlay })) {
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
      ['src/js/overlay.js: TOAST_MS = 4000', 'the snackbar fallback outside a theme, stretched by --ds-time-scale'],
      ['src/js/overlay.js: TOAST_MAX_MS = 10000', 'the cap of the snackbar fallback'],
      ['src/js/overlay.js: TOAST_CHAR_MS = 50', 'reading time per character of a long snackbar, stretched by --ds-time-scale'],
      ['src/js/overlay.js: TOOLTIP_DELAY_MS = 500', 'mirrors --ds-delay-tooltip (fallback outside a theme)'],
      ['src/js/overlay.js: TOOLTIP_SKIP_MS = 300', 'mirrors --ds-delay-tooltip-skip (fallback outside a theme)'],
      ['src/js/overlay.js: TOOLTIP_HIDE_MS = 100', 'mirrors --ds-delay-tooltip-hide (fallback outside a theme)'],
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
