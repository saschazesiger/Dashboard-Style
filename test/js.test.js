/**
 * Icons, the indicator, the DOM morph and the classic-script build.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import * as icons from '../src/js/icons.js';
import * as motion from '../src/js/motion.js';
import * as indicator from '../src/js/indicator.js';
import * as dom from '../src/js/dom.js';
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

  it('keeps the check drawable (pathLength 1 for ds-draw)', () => {
    assert.match(icons.check, /pathLength="1"/);
  });
});

describe('indicator and dom', () => {
  it('exports the documented functions', () => {
    assert.equal(typeof indicator.createIndicator, 'function');
    assert.equal(typeof dom.morphHtml, 'function');
    assert.equal(typeof dom.morphChildren, 'function');
  });

  it('morphChildren keeps equal nodes and only inserts or removes what changed', () => {
    // A tiny node model: isEqualNode, siblings, insertBefore, remove.
    class Node {
      constructor(text) { this.text = text; this.nodeType = 3; this.parent = null; this.childNodes = []; }
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
});

describe('classic-script build (dist/ds.js)', () => {
  it('exposes the same exports as the modules under window.DS', () => {
    const sandbox = { window: undefined };
    sandbox.globalThis = sandbox;
    runInNewContext(read('dist/ds.js'), sandbox);
    const DS = sandbox.DS;
    assert.equal(DS.version, JSON.parse(read('package.json')).version);
    for (const [name, module] of Object.entries({ motion, indicator, dom, icons })) {
      assert.deepEqual(Object.keys(DS[name]).sort(), Object.keys(module).sort(), name);
    }
    assert.equal(DS.icons.icon(DS.icons.plus, 16), icons.icon(icons.plus, 16));
    assert.equal(DS.motion.loaderHoldMs(1000, 1300), motion.loaderHoldMs(1000, 1300));
  });

  it('keeps src/js free of destructuring and imports (Safari 14 builds, ds.js)', () => {
    for (const file of filesIn('src/js')) {
      const code = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, "''");
      assert.doesNotMatch(code, /\b(?:const|let|var)\s*[{[]/, `${file}: destructuring declaration`);
      assert.doesNotMatch(code, /\bfor\s*\(\s*(?:const|let|var)\s*[{[]/, `${file}: destructuring loop`);
      assert.doesNotMatch(code, /function\s*[\w$]*\s*\(\s*[{[]|function\s*[\w$]*\s*\([^)]*,\s*[{[]/, `${file}: destructuring parameter`);
      assert.doesNotMatch(code, /\(\s*[{[][^()]*[}\]]\s*\)\s*=>|,\s*[{[][^()]*[}\]]\s*\)\s*=>/, `${file}: destructuring arrow parameter`);
      assert.doesNotMatch(code, /^\s*import\s/m, `${file}: imports`);
    }
  });
});
