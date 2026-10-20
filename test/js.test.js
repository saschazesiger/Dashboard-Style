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
