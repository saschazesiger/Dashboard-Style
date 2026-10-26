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
    // DS.motion.transition (1.5.0), documented in docs/motion.md; its behaviour: test/motion.test.js.
    assert.equal(typeof motion.transition, 'function');
    assert.match(read('docs/motion.md'), /\| `transition\(update, \{ type, from \}\)` \|/);
    // DS.motion.resyncScroll (1.5.0): scroll-driven animations of a scroller that stopped overflowing.
    assert.equal(typeof motion.resyncScroll, 'function');
    assert.match(read('docs/motion.md'), /\| `resyncScroll\(root\?\)` \|/);
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

  it('counts the scroll lock per document: an iframe\'s lock leaves the page alone (1.6.1)', () => {
    const stub = () => {
      const classes = new Set();
      return {
        body: { style: { paddingRight: '' }, classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) } },
        documentElement: { style: { scrollbarGutter: '' }, clientWidth: 1000 },
        defaultView: { innerWidth: 1000 },
      };
    };
    const page = stub();
    const frame = stub();
    const locked = (doc) => doc.body.classList.contains('ds-no-scroll');
    overlay.lockScroll(frame);
    assert.deepEqual([locked(frame), locked(page)], [true, false]);
    overlay.lockScroll(page);
    overlay.unlockScroll(frame);
    assert.deepEqual([locked(frame), locked(page)], [false, true]);
    overlay.unlockScroll(frame);
    assert.equal(locked(page), true, 'an unbalanced unlock of another document never releases this one');
    overlay.unlockScroll(page);
    assert.equal(locked(page), false);
  });

  it('keeps the focusable list of motion.js (flip refocus) equal to the one of overlay.js (2.0)', () => {
    const list = (file) => /const FOCUSABLE = ('[^']+');/.exec(read(file))?.[1];
    assert.ok(list('src/js/motion.js'));
    assert.equal(list('src/js/motion.js'), list('src/js/overlay.js'));
  });

  it('keeps the list of open modals of indicator.js equal to the one of motion.js (1.6.1)', () => {
    const list = (file) => /const MODAL_OPEN = \[([\s\S]*?)\]\.join\(/.exec(read(file))?.[1].trim();
    assert.ok(list('src/js/motion.js'));
    assert.equal(list('src/js/indicator.js'), list('src/js/motion.js'));
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

    it('keeps only the ripple properties DS writes (--ds-ripple-x/-y/-r): a host\'s --ds-ripple-color follows the template', () => {
      const button = h('button', { class: 'ds-btn', style: '--ds-ripple-color: var(--ds-primary); --ds-ripple-x: 4px' });
      const target = h('div', {}, button);
      dom.morphChildren(target, [h('button', { class: 'ds-btn', style: '--ds-ripple-color: var(--ds-error)' })]);
      assert.equal(target.childNodes[0], button);
      assert.equal(button.style.getPropertyValue('--ds-ripple-color'), 'var(--ds-error)');
      assert.equal(button.style.getPropertyValue('--ds-ripple-x'), '4px', 'runtime state survives');
      dom.morphChildren(target, [h('button', { class: 'ds-btn' })]);
      assert.equal(button.style.getPropertyValue('--ds-ripple-color'), '');
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

    it('patches an equivalent shell instead of replacing it: an empty style, class order, runtime and owned state (2.0)', () => {
      const a = h('li', { class: 'fx-row ds-enter', style: '' }, text('A'));
      const b = h('li', { class: 'b fx-row', style: 'color: red;  --ds-i: 2' }, text('B'));
      const c = h('li', { class: 'fx-row', style: '--x: 1', 'data-ds-staggered': '' }, text('C'));
      const list = h('ul', {}, a, b, c);
      dom.morphChildren(list, [h('li', { class: 'fx-row' }, text('A2')), h('li', { class: 'fx-row b', style: 'color:red' }, text('B2')), h('li', { class: 'fx-row', style: '--x:1' }, text('C2'))], { replace: true });
      assert.deepEqual(list.childNodes, [a, b, c], 'the same nodes');
      assert.deepEqual(list.childNodes.map((node) => node.textContent), ['A2', 'B2', 'C2']);
      assert.equal(b.style.getPropertyValue('--ds-i'), '2', 'runtime state survives');
      // A real difference still replaces under { replace: true }.
      dom.morphChildren(list, [h('li', { class: 'fx-row other' }, text('A3')), b.cloneNode(true), c.cloneNode(true)], { replace: true });
      assert.notEqual(list.childNodes[0], a);
    });

    it('writes a changed style through the CSSOM (CSP-safe), never as an attribute (2.0)', () => {
      const box = h('div', { style: '--x: 1' });
      const target = h('div', {}, box);
      // A CSSOM of its own that writes the attribute map directly, so any setAttribute('style') is the morph's.
      const props = new Map([['--x', '1']]);
      const reflect = () => (props.size ? box.attrs.set('style', [...props].map(([name, value]) => `${name}: ${value}`).join('; ')) : box.attrs.set('style', ''));
      const style = {
        get length() { return props.size; },
        getPropertyValue: (name) => props.get(name) ?? '',
        getPropertyPriority: () => '',
        setProperty: (name, value) => { props.set(name, value); reflect(); },
        removeProperty: (name) => { props.delete(name); reflect(); },
        set cssText(value) {
          props.clear();
          for (const part of String(value).split(';').map((each) => each.trim()).filter(Boolean)) props.set(part.slice(0, part.indexOf(':')).trim(), part.slice(part.indexOf(':') + 1).trim());
          reflect();
        },
      };
      Object.defineProperty(box, 'style', { value: style });
      const writes = [];
      const set = box.setAttribute.bind(box);
      box.setAttribute = (name, value) => { writes.push(name); set(name, value); };
      dom.morphChildren(target, [h('div', { style: '--x: 2; color: red' })]);
      assert.equal(props.get('--x'), '2');
      assert.equal(props.get('color'), 'red');
      dom.morphChildren(target, [h('div', {})]);
      assert.equal(box.getAttribute('style'), null, 'nothing left: the attribute goes');
      assert.deepEqual(writes, [], 'no setAttribute(\'style\')');
    });

    it('calls onKeep(kept, template) after a kept element was patched (2.0)', () => {
      const row = h('li', { 'data-ds-key': 'a', class: 'x' }, text('A'));
      const list = h('ul', {}, row);
      const kept = [];
      const template = h('li', { 'data-ds-key': 'a', class: 'y' }, text('A2'));
      dom.morphChildren(list, [template, h('li', { 'data-ds-key': 'b' }, text('B'))], { onKeep: (node, from) => kept.push([node, from]) });
      assert.deepEqual(kept, [[row, template]]);
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

    it('keeps the state a DS helper owns as it is, present or absent, until the helper lets go (1.6.1)', () => {
      // What DS.overlay, busy(), countUp(), the swaps and flip() own while they run (motion.js, overlay.js).
      const OWNED = Symbol.for('ds.owned');
      const owned = (attrs, classes, props) => ({ attrs: new Map(attrs.map((name) => [name, 1])), classes: new Map(classes.map((name) => [name, 1])), props: new Map(props.map((name) => [name, 1])) });
      // An open row menu: its hidden dropped, data-state and a placement written, inline place and cap.
      const menu = h('div', { class: 'ds-menu', role: 'menu', 'data-state': 'open', style: '--ds-menu-x: 12px; max-height: 90px' }, text('Rename'));
      const trigger = h('button', { 'aria-expanded': 'true', 'aria-busy': 'true', class: 'ds-btn ds-btn--done' }, text('More'));
      const row = h('div', {}, trigger, menu);
      menu[OWNED] = owned(['hidden', 'data-state', 'data-placement'], ['ds-dialog--nested'], ['--ds-menu-x', '--ds-menu-y', 'max-height']);
      trigger[OWNED] = owned(['aria-expanded', 'aria-busy'], ['ds-btn--done'], []);
      const template = () => [
        h('button', { 'aria-expanded': 'false', class: 'ds-btn' }, text('More')),
        h('div', { class: 'ds-menu ds-dialog--nested', role: 'menu', hidden: '', 'data-placement': 'top', style: '--ds-menu-y: 4px; color: red' }, text('Rename (2)')),
      ];
      dom.morphChildren(row, template());
      assert.deepEqual(row.childNodes, [trigger, menu], 'patched, not replaced');
      assert.equal(menu.textContent, 'Rename (2)');
      assert.equal(menu.hasAttribute('hidden'), false, 'an owned absence stays: the template\'s hidden is not added back');
      assert.equal(menu.getAttribute('data-state'), 'open');
      assert.equal(menu.hasAttribute('data-placement'), false);
      assert.deepEqual([...menu.classList], ['ds-menu'], 'an owned class the element lacks is not added');
      assert.deepEqual([menu.style.getPropertyValue('--ds-menu-x'), menu.style.getPropertyValue('max-height'), menu.style.getPropertyValue('--ds-menu-y'), menu.style.getPropertyValue('color')], ['12px', '90px', '', 'red']);
      assert.deepEqual([trigger.getAttribute('aria-expanded'), trigger.getAttribute('aria-busy'), [...trigger.classList]], ['true', 'true', ['ds-btn', 'ds-btn--done']]);
      // Let go (the close settled, the work ended): the next patch takes the template's values.
      menu[OWNED] = owned([], [], []);
      trigger[OWNED] = owned([], [], []);
      dom.morphChildren(row, template());
      assert.deepEqual([menu.hasAttribute('hidden'), menu.getAttribute('data-state'), menu.getAttribute('data-placement'), [...menu.classList]], [true, null, 'top', ['ds-menu', 'ds-dialog--nested']]);
      assert.deepEqual([menu.style.getPropertyValue('--ds-menu-x'), menu.style.getPropertyValue('--ds-menu-y')], ['', '4px']);
      assert.deepEqual([trigger.getAttribute('aria-expanded'), trigger.getAttribute('aria-busy'), [...trigger.classList]], ['false', null, ['ds-btn']]);
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
        // The CSSOM text (2.0: morphHtml writes styles through it, CSP-safe).
        get cssText() { return list.map(([name, value]) => `${name}: ${value}`).join('; '); },
        set cssText(value) { write(String(value).split(';').map((part) => part.trim()).filter(Boolean).map((part) => [part.slice(0, part.indexOf(':')).trim(), part.slice(part.indexOf(':') + 1).trim()])); },
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

  it('names the pill ds-indicator-<name> for good with `name`, and leaves it unnamed without (1.5.0)', () => {
    const env = indicatorTrack({ current: 1 });
    const { handle, span } = create(env, { name: 'nav' });
    assert.equal(span.style.getPropertyValue('view-transition-name'), 'ds-indicator-nav');
    // A change of the active item keeps the name (it pairs the pills of two pages).
    env.setCurrent(2);
    handle.update();
    env.runFrames();
    assert.equal(span.style.getPropertyValue('view-transition-name'), 'ds-indicator-nav');
    handle.destroy();
    const plain = indicatorTrack();
    const unnamed = create(plain);
    assert.equal(unnamed.span.style.getPropertyValue('view-transition-name'), '');
    unnamed.handle.destroy();
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

/**
 * A small CSS selector matcher for the fake elements of the 2.0 helpers'
 * tests: comma lists, tags, `.class`, `[attr]`, `[attr="value"]`,
 * `:is(...)` and `:not(...)`, compounds only (no combinators).
 */
function selectorMatches(element, selector) {
  const splitTop = (text) => {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const char of text) {
      if (char === '(' || char === '[') depth += 1;
      if (char === ')' || char === ']') depth -= 1;
      if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else current += char;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  };
  const compound = (text) => {
    let index = 0;
    while (index < text.length) {
      const rest = text.slice(index);
      let match;
      if ((match = /^\.([\w-]+)/.exec(rest))) {
        if (!(element.getAttribute('class') ?? '').split(/\s+/).includes(match[1])) return false;
      } else if ((match = /^\[([\w-]+)(?:="([^"]*)")?\]/.exec(rest))) {
        const value = element.getAttribute(match[1]);
        if (value === null || (match[2] !== undefined && value !== match[2])) return false;
      } else if ((match = /^:(is|not)\(/.exec(rest))) {
        let depth = 1;
        let end = match[0].length;
        while (depth > 0) {
          if (rest[end] === '(') depth += 1;
          if (rest[end] === ')') depth -= 1;
          end += 1;
        }
        const inner = splitTop(rest.slice(match[0].length, end - 1)).some((part) => selectorMatches(element, part));
        if (inner !== (match[1] === 'is')) return false;
        match = [rest.slice(0, end)];
      } else if ((match = /^([a-z][\w-]*)/i.exec(rest))) {
        if (element.tagName.toLowerCase() !== match[1].toLowerCase()) return false;
      } else throw new Error(`selectorMatches: cannot read "${rest}"`);
      index += match[0].length;
    }
    return true;
  };
  return splitTop(selector).some(compound);
}

/** Elements for the guard: tag, attributes, children; closest() and matches() through selectorMatches(). */
function guardDom() {
  const listeners = [];
  const win = {
    addEventListener: (type, listener, capture) => listeners.push({ type, listener, capture }),
    removeEventListener: (type, listener, capture) => {
      const index = listeners.findIndex((entry) => entry.type === type && entry.listener === listener && entry.capture === capture);
      if (index >= 0) listeners.splice(index, 1);
    },
  };
  const doc = { nodeType: 9, defaultView: win };
  const h = (tag, attributes = {}, ...children) => {
    const element = {
      nodeType: 1,
      tagName: tag.toUpperCase(),
      parentElement: null,
      ownerDocument: doc,
      children,
      attributes: { ...attributes },
      getAttribute(name) { return name in this.attributes ? String(this.attributes[name]) : null; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      removeAttribute(name) { delete this.attributes[name]; },
      hasAttribute(name) { return name in this.attributes; },
      matches(selector) { return selectorMatches(this, selector); },
      closest(selector) {
        for (let current = this; current; current = current.parentElement) if (current.matches(selector)) return current;
        return null;
      },
      getRootNode() { return doc; },
    };
    for (const child of children) child.parentElement = element;
    return element;
  };
  /** Dispatches `type` to the capture listeners on the window, as the browser would first; returns what they did. */
  const fire = (type, target, init = {}) => {
    const event = {
      type, target, ...init, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; },
      stopImmediatePropagation() { this.stopped = true; },
    };
    for (const entry of listeners.filter((each) => each.type === type && each.capture)) entry.listener(event);
    return { blocked: event.prevented && event.stopped, prevented: event.prevented };
  };
  return { h, doc, win, listeners, fire };
}

describe('DS.motion.guard (2.0)', () => {
  it('blocks a click, middle click and submission on busy, done and aria-disabled actions inside .ds-theme', () => {
    const { h, doc, fire } = guardDom();
    const busyFace = h('span', { class: 'ds-btn__face' });
    const busyButton = h('button', { class: 'ds-btn', 'aria-busy': 'true' }, h('span', { class: 'ds-btn__faces' }, busyFace));
    const doneButton = h('button', { class: 'ds-btn ds-btn--done' });
    const link = h('a', { href: '#x', 'aria-disabled': 'true' });
    const switchInput = h('input', { type: 'checkbox', role: 'switch', 'aria-disabled': 'true' });
    const option = h('div', { role: 'option', 'aria-disabled': 'true' });
    const plain = h('button', { class: 'ds-btn' });
    const inBusyRegion = h('button', { class: 'ds-btn' });
    const region = h('section', { 'aria-busy': 'true' }, inBusyRegion);
    const explains = h('button', { class: 'ds-btn', 'aria-disabled': 'true' });
    const off = h('div', { 'data-ds-guard': 'off' }, explains);
    const form = h('form', {});
    h('div', { class: 'ds-theme' }, busyButton, doneButton, link, switchInput, option, plain, region, off, form);
    const outside = h('button', { class: 'ds-btn', 'aria-busy': 'true' });
    h('div', {}, outside);
    const handle = motion.guard(doc);
    assert.equal(fire('click', busyFace).blocked, true, 'a click inside a busy button');
    assert.equal(fire('click', doneButton).blocked, true, 'a done button');
    assert.equal(fire('click', link).blocked, true, 'an aria-disabled link');
    assert.equal(fire('auxclick', link).blocked, true, 'its middle click');
    assert.equal(fire('click', switchInput).blocked, true, 'a label click arrives on the aria-disabled input');
    assert.equal(fire('click', option).blocked, true, 'an aria-disabled option');
    assert.equal(fire('submit', form, { submitter: busyButton }).blocked, true, 'a submission by a busy submitter (Enter in a field)');
    assert.equal(fire('submit', form, { submitter: plain }).blocked, false);
    assert.equal(fire('submit', form, { submitter: null }).blocked, false, 'form.requestSubmit() without a submitter');
    assert.equal(fire('click', plain).blocked, false, 'a usable button');
    assert.equal(fire('click', inBusyRegion).blocked, false, 'a region with aria-busy is no action');
    assert.equal(fire('click', explains).blocked, false, 'data-ds-guard="off": the page explains on click');
    assert.equal(fire('click', outside).blocked, false, 'outside .ds-theme');
    handle.destroy();
  });

  it('installs once per root, counts its holders and removes its listeners with the last one', () => {
    const { doc, listeners } = guardDom();
    const first = motion.guard(doc);
    const second = motion.guard(doc);
    assert.deepEqual(listeners.map((entry) => [entry.type, entry.capture]), [['click', true], ['auxclick', true], ['submit', true]]);
    first.destroy();
    first.destroy();
    assert.equal(listeners.length, 3, 'one holder left');
    second.destroy();
    assert.equal(listeners.length, 0);
    // A shadow root listens on itself.
    const shadow = { nodeType: 11, added: [], addEventListener(type) { this.added.push(type); }, removeEventListener() {} };
    motion.guard(shadow).destroy();
    assert.deepEqual(shadow.added, ['click', 'auxclick', 'submit']);
  });

  it('is installed by busy() on its first call, for good', async () => {
    const { h, doc, listeners } = guardDom();
    const button = h('button', { class: 'ds-btn' });
    button.classList = { contains: () => false, add() {}, remove() {} };
    button.querySelector = () => null;
    h('div', { class: 'ds-theme' }, button);
    await motion.busy(button, () => 'saved');
    assert.equal(listeners.length, 3);
    await motion.busy(button, () => 'again');
    assert.equal(listeners.length, 3, 'once');
    motion.guard(doc).destroy();
    assert.equal(listeners.length, 3, 'a page handle never takes away the hold of busy()');
  });
});

/**
 * Elements for the 2.0 DOM helpers: EventTarget-based, with attributes,
 * classes, a CSSOM style (a Map), children, selectors (selectorMatches),
 * focus and a window with the observers the helpers use, recorded so a
 * test can fire them.
 */
function helperDom() {
  const observers = { intersection: [], resize: [], mutation: [] };
  const frames = [];
  const win = new EventTarget();
  Object.assign(win, {
    innerWidth: 400,
    innerHeight: 800,
    scrollX: 0,
    scrollY: 0,
    requestAnimationFrame: (callback) => frames.push(callback),
    cancelAnimationFrame() {},
    getComputedStyle: (element) => ({ ...element.computed, getPropertyValue: (name) => element.computed?.[name] ?? '' }),
    IntersectionObserver: class {
      constructor(callback, init) { this.callback = callback; this.init = init; this.targets = []; observers.intersection.push(this); }
      observe(target) { this.targets.push(target); }
      unobserve(target) { this.targets = this.targets.filter((each) => each !== target); }
      disconnect() { this.targets = []; this.disconnected = true; }
    },
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; this.targets = new Set(); observers.resize.push(this); }
      observe(target) { this.targets.add(target); }
      unobserve(target) { this.targets.delete(target); }
      disconnect() { this.targets.clear(); }
    },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.mutation.push(this); }
      observe() {}
      disconnect() {}
    },
  });
  const doc = new EventTarget();
  Object.assign(doc, { nodeType: 9, defaultView: win, activeElement: null });
  class El extends EventTarget {
    constructor(tag, attributes = {}, children = []) {
      super();
      this.nodeType = 1;
      this.tagName = tag.toUpperCase();
      this.ownerDocument = doc;
      this.parentElement = null;
      this.children = [];
      this.attrs = new Map(Object.entries(attributes).map(([name, value]) => [name, String(value)]));
      this.computed = {};
      this.props = new Map();
      this.scrollTop = 0;
      this.scrollLeft = 0;
      this.scrollHeight = 0;
      this.clientHeight = 0;
      this.scrollWidth = 0;
      this.clientWidth = 0;
      this.offsetHeight = 0;
      this.offsetWidth = 0;
      this.rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
      for (const child of children) this.append(child);
      const self = this;
      this.style = {
        get length() { return self.props.size; },
        getPropertyValue: (name) => self.props.get(name) ?? '',
        setProperty: (name, value) => self.props.set(name, String(value)),
        removeProperty: (name) => self.props.delete(name),
        set height(value) { self.props.set('height', value); },
        get height() { return self.props.get('height') ?? ''; },
        set overflowY(value) { self.props.set('overflow-y', value); },
        get overflowY() { return self.props.get('overflow-y') ?? ''; },
        set marginBottom(value) { self.props.set('margin-bottom', value); },
        get marginBottom() { return self.props.get('margin-bottom') ?? ''; },
        set flexShrink(value) { self.props.set('flex-shrink', value); },
      };
    }

    get isConnected() { return true; }

    get firstChild() { return this.children[0] ?? null; }

    get firstElementChild() { return this.children[0] ?? null; }

    get childNodes() { return this.children; }

    get parentNode() { return this.parentElement; }

    get classList() {
      const names = () => (this.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
      const write = (list) => this.setAttribute('class', list.join(' '));
      return {
        contains: (name) => names().includes(name),
        add: (...added) => write([...names(), ...added.filter((name) => !names().includes(name))]),
        remove: (...removed) => write(names().filter((name) => !removed.includes(name))),
        toggle: (name, force) => {
          const on = force ?? !names().includes(name);
          write(on ? [...names().filter((other) => other !== name), name] : names().filter((other) => other !== name));
          return on;
        },
      };
    }

    getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; }

    setAttribute(name, value) { this.attrs.set(name, String(value)); }

    removeAttribute(name) { this.attrs.delete(name); }

    hasAttribute(name) { return this.attrs.has(name); }

    get hidden() { return this.hasAttribute('hidden'); }

    set hidden(value) { if (value) this.setAttribute('hidden', ''); else this.removeAttribute('hidden'); }

    get disabled() { return this.hasAttribute('disabled'); }

    matches(selector) {
      if (selector === ':disabled') return this.disabled;
      return selectorMatches(this, selector);
    }

    closest(selector) {
      for (let current = this; current; current = current.parentElement) if (current.matches(selector)) return current;
      return null;
    }

    contains(node) {
      for (let current = node; current; current = current.parentElement) if (current === this) return true;
      return false;
    }

    querySelectorAll(selector) {
      const out = [];
      const walk = (node) => {
        for (const child of node.children) {
          if (child.nodeType === 1 && child.matches(selector)) out.push(child);
          if (child.children) walk(child);
        }
      };
      walk(this);
      return out;
    }

    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }

    append(...nodes) {
      for (const node of nodes) {
        node.parentElement?.children.splice(node.parentElement.children.indexOf(node), 1);
        node.parentElement = this;
        this.children.push(node);
      }
    }

    insertBefore(node, reference) {
      node.parentElement?.children.splice(node.parentElement.children.indexOf(node), 1);
      node.parentElement = this;
      const at = reference ? this.children.indexOf(reference) : -1;
      if (at < 0) this.children.push(node);
      else this.children.splice(at, 0, node);
      return node;
    }

    remove() {
      this.parentElement?.children.splice(this.parentElement.children.indexOf(this), 1);
      this.parentElement = null;
    }

    focus() { doc.activeElement = this; this.dispatchEvent(Object.assign(new Event('focusin', { bubbles: true }), {})); }

    click() { this.clicked = (this.clicked ?? 0) + 1; }

    getBoundingClientRect() { return this.rect; }

    scrollTo({ top }) { this.scrollTop = top; this.smooth = true; }
  }
  // Events bubble to the parents (EventTarget alone does not).
  const dispatch = El.prototype.dispatchEvent;
  El.prototype.dispatchEvent = function (event) {
    let result = dispatch.call(this, event);
    if (event.bubbles) {
      for (let node = this.parentElement; node && !event.cancelBubble; node = node.parentElement) {
        Object.defineProperty(event, 'target', { value: this, configurable: true });
        result = EventTarget.prototype.dispatchEvent.call(node, cloneEvent(event, this)) && result;
      }
    }
    return result;
  };
  function cloneEvent(event, target) {
    const copy = new Event(event.type, { bubbles: false, cancelable: event.cancelable });
    for (const key of Object.keys(event)) copy[key] = event[key];
    Object.defineProperty(copy, 'target', { value: target });
    copy.preventDefault = () => { event.preventDefault(); };
    Object.defineProperty(copy, 'defaultPrevented', { get: () => event.defaultPrevented });
    return copy;
  }
  doc.createElement = (tag) => new El(tag);
  doc.body = new El('body');
  doc.documentElement = new El('html', {}, [doc.body]);
  const h = (tag, attributes = {}, ...children) => new El(tag, attributes, children);
  const key = (target, name, init = {}) => {
    const event = new Event('keydown', { bubbles: true, cancelable: true });
    Object.assign(event, { key: name, ...init });
    target.dispatchEvent(event);
    return event;
  };
  return { h, doc, win, observers, frames, key, runFrames: () => { while (frames.length) frames.shift()(0); } };
}

describe('DS.dom state reporters and helpers (2.0)', () => {
  it('watchScrolled: one sentinel, data-scrolled on the default target only on a change, owned; destroy() takes it all back', () => {
    const { h, observers } = helperDom();
    const view = h('main', { class: 'ds-view' }, h('p', {}));
    view.computed = { rowGap: '16px' };
    const app = h('div', { class: 'ds-app' }, view);
    const handle = dom.watchScrolled(view);
    assert.equal(dom.watchScrolled(view), handle, 'once per scroller');
    const sentinel = view.children[0];
    assert.deepEqual([sentinel.hasAttribute('data-ds-keep'), sentinel.hasAttribute('data-ds-sentinel'), sentinel.getAttribute('aria-hidden')], [true, true, 'true']);
    assert.equal(sentinel.style.marginBottom, '-17px', 'the row gap is taken back');
    const [observer] = observers.intersection;
    assert.equal(observer.init.root, view);
    const fire = (isIntersecting, height = 1) => observer.callback([{ isIntersecting, boundingClientRect: { height } }]);
    fire(false, 0);
    assert.equal(app.hasAttribute('data-scrolled'), false, 'not rendered: nothing');
    fire(false);
    assert.equal(app.hasAttribute('data-scrolled'), true);
    assert.equal(app[Symbol.for('ds.owned')].attrs.get('data-scrolled'), 1, 'owned state');
    fire(true);
    assert.equal(app.hasAttribute('data-scrolled'), false);
    sentinel.remove();
    handle.update();
    assert.equal(view.children.filter((child) => child.hasAttribute('data-ds-sentinel')).length, 1, 'a removed sentinel comes back, once');
    fire(false);
    handle.destroy();
    assert.equal(app.hasAttribute('data-scrolled'), false);
    assert.equal(view.children.some((child) => child.hasAttribute('data-ds-sentinel')), false);
    assert.equal(app[Symbol.for('ds.owned')].attrs.has('data-scrolled'), false);
    // A sheet body reports on its panel, a dialog body on its box.
    const body = h('div', { class: 'ds-sheet__body' });
    const panel = h('div', { class: 'ds-sheet__panel' }, body);
    dom.watchScrolled(body);
    observers.intersection.at(-1).callback([{ isIntersecting: false, boundingClientRect: { height: 1 } }]);
    assert.equal(panel.hasAttribute('data-scrolled'), true);
  });

  it('scrollEdges: overflow at each end of the axis, the scrollbar room and the pin width, owned; once per axis', () => {
    const { h, runFrames } = helperDom();
    const cell = h('th', {});
    cell.rect = { width: 120.5 };
    const table = h('table', { class: 'ds-table ds-table--pin-first' }, h('tr', {}, cell, h('td', {})));
    const wrap = h('div', { class: 'ds-table-wrap' }, table);
    Object.assign(wrap, { scrollWidth: 900, clientWidth: 300, offsetHeight: 212, clientHeight: 200, scrollLeft: 0 });
    wrap.computed = { borderTopWidth: '1px', borderBottomWidth: '1px' };
    const handle = dom.scrollEdges(wrap);
    assert.equal(dom.scrollEdges(wrap), handle);
    const state = () => ['data-ds-edges', 'data-ds-overflow-start', 'data-ds-overflow-end'].filter((name) => wrap.hasAttribute(name));
    assert.deepEqual(state(), ['data-ds-edges', 'data-ds-overflow-end']);
    assert.equal(wrap.style.getPropertyValue('--ds-scrollbar-height'), '10px');
    assert.equal(wrap.style.getPropertyValue('--ds-table-pin-width'), '120.5px');
    wrap.scrollLeft = -300;
    wrap.dispatchEvent(new Event('scroll'));
    runFrames();
    assert.deepEqual(state(), ['data-ds-edges', 'data-ds-overflow-start', 'data-ds-overflow-end'], 'a right-to-left scroller counts by its distance');
    wrap.scrollLeft = 600;
    handle.update();
    assert.deepEqual(state(), ['data-ds-edges', 'data-ds-overflow-start']);
    const block = dom.scrollEdges(wrap, { axis: 'block' });
    assert.notEqual(block, handle, 'another axis, another watch');
    assert.equal(wrap[Symbol.for('ds.owned')].attrs.get('data-ds-overflow-end'), 2);
    block.destroy();
    handle.destroy();
    assert.deepEqual(state(), []);
    assert.equal(wrap.style.getPropertyValue('--ds-scrollbar-height'), '');
  });

  it('progress: a share and its ARIA on a progress bar, a spinner and a meter; an unknown share', (t) => {
    const { h } = helperDom();
    const track = h('div', { class: 'ds-progress__track', role: 'progressbar', 'aria-valuetext': 'Preparing' });
    const bar = h('div', { class: 'ds-progress ds-progress--indeterminate' }, track);
    assert.equal(dom.progress(bar, 0.4567), bar);
    assert.equal(bar.style.getPropertyValue('--ds-progress'), '0.457');
    assert.deepEqual([bar.classList.contains('ds-progress--indeterminate'), track.getAttribute('aria-valuenow'), track.getAttribute('aria-valuetext')], [false, '46', null]);
    dom.progress(bar, 3, { valueText: 'Almost' });
    assert.deepEqual([bar.style.getPropertyValue('--ds-progress'), track.getAttribute('aria-valuenow'), track.getAttribute('aria-valuetext')], ['1', '100', 'Almost']);
    dom.progress(bar, null, { valueText: 'Waiting', waiting: true });
    assert.deepEqual([bar.classList.contains('ds-progress--waiting'), bar.classList.contains('ds-progress--indeterminate'), track.getAttribute('aria-valuenow'), track.getAttribute('aria-valuetext')], [true, false, null, 'Waiting']);
    const warn = t.mock.method(console, 'warn', () => {});
    dom.progress(bar, null);
    dom.progress(bar, null);
    assert.equal(warn.mock.callCount(), 1, 'a missing valueText warns once');
    const spinner = h('span', { class: 'ds-spinner', role: 'progressbar' });
    dom.progress(spinner, 0.25);
    assert.deepEqual([spinner.classList.contains('ds-spinner--determinate'), spinner.style.getPropertyValue('--ds-progress'), spinner.getAttribute('aria-valuenow')], [true, '0.25', '25']);
    const meter = h('div', { class: 'ds-meter' });
    dom.progress(meter, 0.5);
    assert.deepEqual([meter.style.getPropertyValue('--ds-share'), meter.getAttribute('aria-valuenow')], ['0.5', null], 'ARIA only with role="meter"');
    dom.progress(meter, null);
    assert.equal(meter.style.getPropertyValue('--ds-share'), '0.5', 'a meter is never indeterminate');
  });

  it('roving: one tab stop, arrows and Home/End (wrapping, rtl), disabled skipped, aria-disabled reachable, activation', () => {
    const { h, doc, key, win } = helperDom();
    const tabs = ['a', 'b', 'c', 'd'].map((name) => h('button', { role: 'tab', id: name, 'aria-selected': name === 'b' ? 'true' : 'false' }));
    tabs[2].setAttribute('disabled', '');
    tabs[3].setAttribute('aria-disabled', 'true');
    const list = h('div', { role: 'tablist' }, ...tabs);
    list.computed = { direction: 'ltr' };
    const handle = dom.roving(list);
    assert.equal(dom.roving(list), handle);
    assert.deepEqual(tabs.map((tab) => tab.getAttribute('tabindex')), ['-1', '0', null, '-1'], 'the selected tab is the stop; the disabled one is out');
    tabs[1].focus();
    key(tabs[1], 'ArrowRight');
    assert.equal(doc.activeElement, tabs[3], 'skips the disabled tab, reaches the aria-disabled one');
    assert.equal(tabs[3].clicked, 1, 'activate: focus clicks');
    assert.deepEqual(tabs.map((tab) => tab.getAttribute('tabindex')), ['-1', '-1', null, '0']);
    key(tabs[3], 'ArrowRight');
    assert.equal(doc.activeElement, tabs[0], 'wraps');
    key(tabs[0], 'End');
    assert.equal(doc.activeElement, tabs[3]);
    key(tabs[3], 'Home');
    assert.equal(doc.activeElement, tabs[0]);
    assert.equal(key(tabs[0], 'ArrowDown').defaultPrevented, false, 'horizontal: Up and Down are left alone');
    list.computed = { direction: 'rtl' };
    key(tabs[0], 'ArrowLeft');
    assert.equal(doc.activeElement, tabs[1], 'rtl: left is next');
    handle.destroy();
    key(tabs[1], 'ArrowRight');
    assert.equal(doc.activeElement, tabs[1], 'destroyed');
    // A toolbar: activate false, vertical, no wrap; manual activation waits for Enter.
    const tools = ['x', 'y'].map((name) => h('div', { role: 'option', id: name }));
    const bar = h('div', {}, ...tools);
    dom.roving(bar, { orientation: 'vertical', wrap: false, activate: 'manual' });
    tools[0].focus();
    key(tools[0], 'ArrowDown');
    assert.deepEqual([doc.activeElement, tools[1].clicked], [tools[1], undefined]);
    key(tools[1], 'ArrowDown');
    assert.equal(doc.activeElement, tools[1], 'no wrap');
    key(tools[1], 'Enter');
    assert.equal(tools[1].clicked, 1, 'manual: Enter activates');
    void win;
  });

  it('followViewport: --ds-viewport-height, data-ds-keyboard only with a field focused and 150px less, the inset; once per document', () => {
    const { h, doc, win, runFrames } = helperDom();
    const viewport = new EventTarget();
    Object.assign(viewport, { width: 400, height: 800, offsetTop: 0, scale: 1 });
    win.visualViewport = viewport;
    const root = doc.documentElement;
    const handle = dom.followViewport(doc);
    assert.equal(dom.followViewport(doc), handle);
    assert.equal(root.style.getPropertyValue('--ds-viewport-height'), '800px');
    const field = h('input', { type: 'text' });
    Object.assign(field, { type: 'text', readOnly: false });
    doc.body.append(field);
    viewport.height = 460;
    viewport.dispatchEvent(new Event('resize'));
    runFrames();
    assert.equal(root.hasAttribute('data-ds-keyboard'), false, 'no field focused: the browser bars, a split view');
    doc.activeElement = field;
    doc.dispatchEvent(new Event('focusin'));
    runFrames();
    assert.equal(root.hasAttribute('data-ds-keyboard'), true);
    assert.equal(root.style.getPropertyValue('--ds-keyboard-inset'), '340px');
    assert.equal(root[Symbol.for('ds.owned')].attrs.get('data-ds-keyboard'), 1);
    viewport.height = 700;
    viewport.dispatchEvent(new Event('resize'));
    runFrames();
    assert.equal(root.hasAttribute('data-ds-keyboard'), false, 'within 150px: no keyboard');
    handle.destroy();
    assert.equal(root.style.getPropertyValue('--ds-viewport-height'), '');
    // Without visualViewport nothing happens.
    const other = helperDom();
    other.doc.defaultView.visualViewport = undefined;
    dom.followViewport(other.doc).destroy();
    assert.equal(other.doc.documentElement.style.getPropertyValue('--ds-viewport-height'), '');
  });

  it('followEnd: sticks while at the end, lets go when scrolled up (the pill shows), stick() goes back', () => {
    const { h, observers } = helperDom();
    const pill = h('button', { class: 'ds-presence', hidden: '' });
    const log = h('div', {}, h('p', {}));
    Object.assign(log, { scrollHeight: 1000, clientHeight: 400, scrollTop: 600 });
    const handle = dom.followEnd(log, { pill });
    assert.equal(pill.hidden, true, 'at the end: no pill');
    const [sizes] = observers.resize.slice(-1);
    log.scrollHeight = 1200;
    sizes.callback([]);
    assert.equal(log.scrollTop, 800, 'the content grew: it stays at the end');
    log.scrollTop = 500;
    log.dispatchEvent(new Event('scroll'));
    assert.equal(pill.hidden, false, 'scrolled up: the pill shows');
    log.scrollHeight = 1400;
    sizes.callback([]);
    assert.equal(log.scrollTop, 500, 'let go: it stays where the reader is');
    pill.dispatchEvent(new Event('click'));
    assert.equal(log.scrollTop, 1000);
    assert.equal(log.smooth, undefined, 'farther than a viewport: a jump');
    assert.equal(pill.hidden, true);
    log.scrollTop = 800;
    log.dispatchEvent(new Event('scroll'));
    log.smooth = undefined;
    handle.stick();
    assert.equal(log.smooth, true, 'within a viewport: smooth');
    handle.destroy();
  });

  it('autosize: grows with the text to max-height, then scrolls; nothing where field-sizing does it', () => {
    const { h } = helperDom();
    const area = h('textarea', {});
    area.computed = { boxSizing: 'border-box', borderTopWidth: '1px', borderBottomWidth: '1px', maxHeight: '200px' };
    area.scrollHeight = 98;
    const handle = dom.autosize(area);
    assert.deepEqual([area.style.height, area.style.overflowY], ['100px', 'hidden']);
    area.scrollHeight = 400;
    area.dispatchEvent(new Event('input'));
    assert.deepEqual([area.style.height, area.style.overflowY], ['200px', 'auto']);
    handle.destroy();
    assert.equal(area.style.height, '');
    const native = h('textarea', {});
    native.computed = { 'field-sizing': 'content' };
    dom.autosize(native);
    assert.equal(native.style.height, '', 'field-sizing: content sizes it');
  });

  it('dropzone: counts enter and leave, takes only file drags, filters by accept, cuts to one, resets the input, pastes', () => {
    const { h, doc } = helperDom();
    const input = h('input', { type: 'file', class: 'ds-dropzone__input', accept: '.csv, image/*' });
    Object.assign(input, { accept: '.csv, image/*', multiple: false, value: 'C:\\fakepath\\a.csv' });
    const child = h('span', {});
    const zone = h('label', { class: 'ds-dropzone' }, input, child);
    const got = [];
    const handle = dom.dropzone(zone, { onFiles: (files) => got.push(files.map((file) => file.name)), paste: true });
    const drag = (type, files = [], kinds = ['Files']) => {
      const event = new Event(type, { cancelable: true });
      event.dataTransfer = { types: kinds, files, dropEffect: 'none' };
      zone.dispatchEvent(event);
      return event;
    };
    assert.equal(drag('dragenter', [], ['text/plain']).defaultPrevented, false, 'text is no file drag');
    assert.equal(zone.hasAttribute('data-ds-dragover'), false);
    drag('dragenter');
    drag('dragenter');
    drag('dragleave');
    assert.equal(zone.hasAttribute('data-ds-dragover'), true, 'over a child: still over');
    assert.equal(drag('dragover').defaultPrevented, true);
    const csv = { name: 'devices.CSV', type: 'text/csv' };
    const photo = { name: 'room.jpg', type: 'image/jpeg' };
    const doc1 = { name: 'notes.docx', type: 'application/vnd.openxmlformats' };
    drag('drop', [doc1, csv, photo]);
    assert.equal(zone.hasAttribute('data-ds-dragover'), false);
    assert.deepEqual(got, [['devices.CSV']], 'filtered by accept, one without multiple');
    input.files = [photo];
    input.dispatchEvent(new Event('change'));
    assert.deepEqual(got.at(-1), ['room.jpg']);
    assert.equal(input.value, '', 'the input is reset');
    doc.activeElement = input;
    const paste = new Event('paste', { cancelable: true });
    paste.clipboardData = { files: [csv] };
    doc.dispatchEvent(paste);
    assert.deepEqual(got.at(-1), ['devices.CSV']);
    assert.equal(paste.defaultPrevented, true);
    input.setAttribute('disabled', '');
    Object.defineProperty(input, 'disabled', { value: true });
    drag('drop', [csv]);
    assert.equal(got.length, 3, 'a disabled input takes nothing');
    handle.destroy();
    assert.equal(zone[Symbol.for('ds.owned')].attrs.has('data-ds-dragover'), false);
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
