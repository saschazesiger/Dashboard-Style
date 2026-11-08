/**
 * The React adapter (src/react/, built to dist/react/ by scripts/react.mjs):
 * one component per behaviour, types next to every module with the same
 * exports, imports only of react and the copy's own modules, documented
 * markup only, every export in docs/react.md, manifest.json "react" in
 * step, and the pinned dev copy of React the browser spec mounts it with
 * (test/react/). The adapter itself runs in test/browser/react.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CORE_MODULES, MODULES, build, components, reactContext } from '../scripts/build.mjs';
import { REACT_HAND, behaviourModule, definesOf, reactDist, rewriteReactImports, rootOf } from '../scripts/react.mjs';
import { ROOT, read } from './helpers.js';

const SOURCES = readdirSync(join(ROOT, 'src/react')).sort();
const HAND = SOURCES.filter((name) => name.endsWith('.js')).map((name) => name.slice(0, -3));
const exportsOf = (source) => [...source.matchAll(/^export (?:const|function) (\w+)/gm)].map((match) => match[1]).sort();
const declaredOf = (source) => [...source.matchAll(/^export declare (?:const|function) (\w+)/gm)].map((match) => match[1]).sort();
const code = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('React adapter: sources', () => {
  it('holds hand-written modules with their types, and names.json, nothing else', () => {
    for (const name of SOURCES) assert.match(name, /^[\w-]+\.(js|d\.ts)$|^names\.json$/, `src/react/${name}`);
    for (const name of HAND) assert.ok(SOURCES.includes(`${name}.d.ts`), `src/react/${name}.d.ts`);
    assert.deepEqual(HAND, Object.keys(REACT_HAND).sort(), 'REACT_HAND of scripts/react.mjs lists every hand-written module');
  });

  it('declares every export of a module in its .d.ts, and nothing more', () => {
    for (const name of HAND) {
      assert.deepEqual(declaredOf(read(`src/react/${name}.d.ts`)), exportsOf(read(`src/react/${name}.js`)), `src/react/${name}`);
    }
  });

  it('imports only react and the copy\'s own modules, one line each, and exports only export const / export function', () => {
    const allowed = new Set(['react', './shared.js', ...CORE_MODULES.map((name) => `../js/${name}.js`),
      ...MODULES.filter((name) => !CORE_MODULES.includes(name)).map((name) => `../components/${name}/${name}.js`)]);
    for (const name of HAND) {
      const source = code(read(`src/react/${name}.js`));
      for (const match of source.matchAll(/^import\s[^\n]*$/gm)) {
        const specifier = /['"]([^'"]+)['"];$/.exec(match[0])?.[1];
        assert.ok(allowed.has(specifier), `src/react/${name}.js: ${match[0]}`);
      }
      assert.doesNotMatch(source, /^export\s+(default|\{|\*|let|var|class)/m, `src/react/${name}.js: export const / export function only`);
      assert.doesNotMatch(source, /<[A-Z][\w.]*[\s/>]|<\/\w+>/, `src/react/${name}.js: no JSX`);
      assert.doesNotMatch(source, /innerHTML|dangerouslySetInnerHTML/, `src/react/${name}.js: no HTML strings`);
    }
  });

  it('writes only documented classes', () => {
    const docs = ['docs/components.md', 'docs/options.md', 'docs/theming.md'].map(read).join('\n');
    const missing = [];
    for (const name of HAND) {
      for (const match of code(read(`src/react/${name}.js`)).matchAll(/['`](ds-[a-z][\w-]*)/g)) {
        const cls = match[1].replace(/-$/, '');
        if (cls.endsWith('-') || /\$\{/.test(cls)) continue;
        if (!docs.includes(cls) && !['ds-density', 'ds-shape', 'ds-tone'].includes(cls)) missing.push(`${name}: ${cls}`);
      }
    }
    assert.deepEqual(missing, []);
  });

  it('names every export of src/react/ in docs/react.md, and links it from README.md and install.md', () => {
    const docs = read('docs/react.md');
    for (const name of HAND) {
      for (const id of exportsOf(read(`src/react/${name}.js`))) {
        if (name === 'shared' && id !== 'Icon') continue; // the helpers of the generated modules
        assert.ok(new RegExp(`\`<?${id}\\b`).test(docs), `docs/react.md names ${id}`);
      }
    }
    assert.match(read('README.md'), /\(docs\/react\.md\)/);
    assert.match(read('docs/install.md'), /\(react\.md\)/);
  });
});

describe('React adapter: generated components', () => {
  const context = reactContext();
  const { behaviours, manifest } = reactDist(context);

  it('gives every behaviour that initialises an element a component', () => {
    const list = components();
    const expected = [];
    for (const component of list.filter((each) => each.meta.module)) {
      for (const define of definesOf(read(`src/components/${component.name}/${component.name}.js`))) {
        if (define.attribute && define.init) expected.push(define.name);
      }
    }
    const covered = new Set([...behaviours.map((entry) => entry.behaviour), ...HAND]);
    assert.deepEqual(expected.filter((name) => !covered.has(name)), []);
    assert.ok(behaviours.length > 90, 'the walk finds the behaviours');
    assert.ok(behaviours.some((entry) => entry.behaviour === 'time'), 'data-ds-time of js/format.js too');
    assert.equal(new Set(behaviours.map((entry) => entry.display)).size, behaviours.length, 'one export name each');
  });

  it('reads the root element from the docs, and takes no modifier or option class into it', () => {
    assert.deepEqual(rootOf('```html\n<div class="ds-tabs ds-tabs--fill ds-sm" role="tablist" aria-label="x" data-ds-tabs>\n```', 'data-ds-tabs'),
      { tag: 'div', classes: ['ds-tabs', 'ds-tabs--fill', 'ds-sm'], role: 'tablist' });
    for (const entry of behaviours) {
      for (const cls of entry.classes) assert.doesNotMatch(cls, /--|^ds-(xs|sm|md|lg|xl|touch)$|^ds-(density|shape)-/, `${entry.display}: ${cls}`);
      assert.match(entry.tag, /^[a-z][\w-]*$/);
    }
    const copy = behaviours.find((entry) => entry.behaviour === 'copy');
    assert.deepEqual([copy.tag, copy.classes, copy.block], ['button', ['ds-btn'], 'ds-btn']);
    assert.ok(copy.variants.includes('quiet') && !copy.variants.includes('primary'), 'variants without the deprecated names');
    assert.ok(behaviours.find((entry) => entry.behaviour === 'sheet').overlay, 'a sheet takes open and onClose');
    assert.ok(!behaviours.find((entry) => entry.behaviour === 'lightbox').overlay, 'a gallery is no overlay');
  });

  it('writes each generated module from its entry: its own module and the shared factory, nothing else', () => {
    const out = build();
    for (const entry of behaviours) {
      const text = out.get(entry.file).toString('utf8');
      assert.ok(text.endsWith(behaviourModule(entry)), entry.file);
      const imports = [...text.matchAll(/^import [^\n]*from '([^']+)';$|^import '([^']+)';$/gm)].map((match) => match[1] ?? match[2]);
      assert.deepEqual(imports, [`../js/${entry.module}.js`, './shared.js'], entry.file);
      assert.ok(out.has(entry.file.replace(/\.js$/, '.d.ts')), `${entry.file}: its types`);
    }
    for (const name of HAND) {
      assert.equal(out.get(`react/${name}.js`).toString('utf8').includes('../components/'), false, `react/${name}.js: imports rewritten for dist/`);
    }
    assert.equal(rewriteReactImports("import '../components/tabs/tabs.js';\nimport type { X } from '../types/js/core.js';"),
      "import '../js/tabs.js';\nimport type { X } from '../js/core.js';");
  });

  it('lists every file in manifest.json "react" with stylesheets and modules the copy has', () => {
    const shipped = JSON.parse(build().get('manifest.json').toString('utf8'));
    assert.deepEqual(shipped.react, manifest);
    for (const [file, entry] of Object.entries(manifest)) {
      assert.ok(build().has(file), file);
      for (const name of entry.components) assert.ok(shipped.components[name], `${file}: component ${name}`);
      for (const name of entry.modules) assert.ok(shipped.js[name], `${file}: module ${name}`);
      assert.ok(entry.exports.length, `${file}: exports`);
    }
    assert.ok(manifest['react/tabs.js'].components.includes('tabs') && manifest['react/tabs.js'].modules.includes('tabs'));
    assert.deepEqual(manifest['react/copy.js'].components, ['button', 'copy']);
    const index = read('docs/react.md');
    for (const entry of behaviours) assert.ok(index.includes(`| \`${entry.display}\` | \`react/${entry.behaviour}.js\` |`), `docs/react.md lists ${entry.display}`);
  });
});

describe('React adapter: the pinned React of the browser tests', () => {
  it('keeps test/react/ as its README says: the UMD development builds of 18.3.1, unchanged, with their licence', () => {
    const readme = read('test/react/README.md');
    for (const file of ['react.development.js', 'react-dom.development.js']) {
      const sum = createHash('sha256').update(readFileSync(join(ROOT, 'test/react', file))).digest('hex');
      assert.ok(readme.includes(`| \`${file}\` | \`${sum}\` |`), `test/react/${file}: sha256 ${sum} as in README.md`);
      assert.match(read(`test/react/${file}`).slice(0, 200), /\* @license React\n \* (react|react-dom)\.development\.js\n/);
    }
    assert.match(read('test/react/react.development.js'), /var ReactVersion = '18\.3\.1';/);
    assert.match(read('test/react/LICENSE'), /^MIT License/);
    const pkg = JSON.parse(read('package.json'));
    assert.ok(!('react' in { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }), 'no npm dependency on react');
  });
});
