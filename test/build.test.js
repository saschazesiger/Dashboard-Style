/**
 * scripts/build.mjs: inlining the stylesheets (quotes, newlines, cycles,
 * diamonds, leftovers), the one layer statement of dist/ds.css, the
 * sibling imports of src/js in the classic build, and dist/deprecations.json.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEPRECATION_KINDS, build, deprecationsJson, inlineCss, moduleBody, packageInfo, SHIPPED_THEMES, tokensJson } from '../scripts/build.mjs';
import { filesIn, read, stripComments } from './helpers.js';

/** Writes `files` ({ name: css }) into a fresh temporary folder and runs `check` on it. */
function withFiles(files, check) {
  const dir = mkdtempSync(join(tmpdir(), 'ds-build-'));
  try {
    for (const [name, css] of Object.entries(files)) writeFileSync(join(dir, name), css);
    return check(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('inlineCss()', () => {
  it('inlines single and double quotes, with or without a final newline', () => {
    withFiles({
      'index.css': "@import 'a.css';\n@import \"b.css\";",
      'a.css': '.ds-a { color: inherit; }\n',
      'b.css': '.ds-b { color: inherit; }',
    }, (dir) => {
      const css = inlineCss(join(dir, 'index.css'));
      assert.match(css, /\.ds-a \{ color: inherit; \}/);
      assert.match(css, /\.ds-b \{ color: inherit; \}/);
      assert.doesNotMatch(css, /@import/);
      assert.ok(css.indexOf('.ds-a') < css.indexOf('.ds-b'), 'in import order');
    });
  });

  it('throws for a file imported twice through different parents (a diamond)', () => {
    withFiles({
      'index.css': "@import 'a.css';\n@import 'b.css';\n",
      'a.css': "@import 'shared.css';\n",
      'b.css': "@import 'shared.css';\n",
      'shared.css': '.ds-shared { color: inherit; }\n',
    }, (dir) => assert.throws(() => inlineCss(join(dir, 'index.css')), /duplicate import/));
  });

  it('throws for a real cycle', () => {
    withFiles({
      'index.css': "@import 'a.css';\n",
      'a.css': "@import 'b.css';\n",
      'b.css': "@import 'a.css';\n",
    }, (dir) => assert.throws(() => inlineCss(join(dir, 'index.css')), /cycle/));
  });

  it('throws for an import it cannot read', () => {
    withFiles({
      'index.css': "@import url('a.css');\n",
      'a.css': '.ds-a { color: inherit; }\n',
    }, (dir) => assert.throws(() => inlineCss(join(dir, 'index.css')), /@import left/));
  });
});

describe('dist/ds.css', () => {
  it('declares the layer order exactly once, before the first rule', () => {
    const css = read('dist/ds.css');
    const statement = '@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities;';
    assert.equal(css.split(statement).length - 1, 1);
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.equal(code.trimStart().indexOf(statement), 0, 'the first statement of the file');
  });
});

describe('dist/css/properties.css', () => {
  it('holds every top-level @property of dist/ds.css, byte for byte and in order, and nothing else', () => {
    const blocks = (css) => css.match(/^@property\s+--[\w-]+\s*\{[^{}]*\}/gm) ?? [];
    const all = blocks(read('dist/ds.css'));
    const properties = read('dist/css/properties.css');
    assert.ok(all.length >= 29, `${all.length} registrations`);
    assert.deepEqual(blocks(properties), all);
    // Only the registrations: no layer statement, no rule, nothing that styles.
    const code = properties.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.equal(code.replace(/^@property\s+--[\w-]+\s*\{[^{}]*\}/gm, '').trim(), '');
  });
});

describe('dist/deprecations.json', () => {
  it('is src/deprecations.json with the version of package.json, built the same every time and checksummed', () => {
    const info = packageInfo();
    const built = JSON.parse(read('dist/deprecations.json'));
    const source = JSON.parse(read('src/deprecations.json'));
    assert.deepEqual(Object.keys(built), ['version', 'names']);
    assert.equal(built.version, info.version);
    assert.deepEqual(built.names, source.names, 'the entries as written, keys in the documented order');
    assert.equal(build().get('deprecations.json').toString('utf8'), build().get('deprecations.json').toString('utf8'), 'deterministic');
    const sums = read('dist/SHA256SUMS').split('\n').filter(Boolean).map((line) => line.split(/\s+/)[1]);
    assert.ok(sums.includes('deprecations.json'), 'in SHA256SUMS, so the vendor copy verifies it');
    for (const entry of built.names) {
      assert.ok(DEPRECATION_KINDS.includes(entry.kind), entry.name);
      // Following the migration silences the check: the replacement never matches the old name's pattern.
      if (entry.pattern !== null && entry.replacement) assert.doesNotMatch(entry.replacement, new RegExp(entry.pattern), entry.name);
    }
  });

  it('throws for an entry a project check could not trust', () => {
    const info = { version: '9.9.9' };
    const ok = { kind: 'class', name: '.ds-x', pattern: 'ds-x', replacement: null, deprecated: '1.0.0', removed: null };
    const json = (names, extra = {}) => JSON.stringify({ names, ...extra });
    assert.equal(JSON.parse(deprecationsJson(json([ok]), info)).version, '9.9.9');
    const cases = [
      [json([ok], { version: '1.0.0' }), /nothing else/],
      [json([{ ...ok, kind: 'colour' }]), /kind/],
      [json([{ ...ok, name: '' }]), /a name/],
      [json([ok, ok]), /twice/],
      [json([{ ...ok, pattern: '(' }]), /Invalid regular expression/],
      [json([{ ...ok, pattern: undefined }]), /pattern/],
      [json([{ ...ok, deprecated: 'soon' }]), /deprecated is a version/],
      [json([{ ...ok, removed: '2.0' }]), /removed is a version or null/],
      [json([{ ...ok, note: 1 }]), /note/],
      [json([{ ...ok, since: '1.0.0' }]), /unknown keys since/],
    ];
    for (const [source, error] of cases) assert.throws(() => deprecationsJson(source, info), error, source);
  });
});

describe('moduleBody()', () => {
  it('rewrites a sibling import of an earlier module to the DS namespace', () => {
    const body = moduleBody("import { enter, leave as exit } from './motion.js';\nexport const x = 1;\n", 'dom');
    assert.match(body, /const enter = DS\.motion\.enter, exit = DS\.motion\.leave;/);
    assert.doesNotMatch(body, /import/);
    assert.match(body, /x: x/);
    assert.match(moduleBody('import { stagger } from "./motion.js";\n', 'icons'), /const stagger = DS\.motion\.stagger;/);
  });

  it('throws for default, namespace, bare, later, unknown and multi-line imports', () => {
    const cases = [
      ["import motion from './motion.js';", /default imports/],
      ["import * as motion from './motion.js';", /namespace imports/],
      ["import './motion.js';", /bare imports/],
      ["import { a } from 'some-package';", /only sibling modules/],
      ["import { icon } from './icons.js';", /not earlier in MODULES/],
      ["import { enter } from './motion.js';", /not earlier in MODULES/, 'motion'],
      ["import { a } from './nowhere.js';", /unknown module/],
      ["import {\n  enter,\n} from './motion.js';", /one line/],
    ];
    for (const [source, error, name = 'dom'] of cases) assert.throws(() => moduleBody(`${source}\nexport const x = 1;\n`, name), error, source);
  });
});

describe('dist/themes/ and dist/tools/', () => {
  const out = build();
  it('ships the three themes and every tool, byte for byte, and lists them in SHA256SUMS', () => {
    const sums = out.get('SHA256SUMS').toString('utf8');
    for (const name of SHIPPED_THEMES) {
      assert.equal(out.get(`themes/${name}.css`)?.toString('utf8'), read(`themes/${name}.css`), name);
      assert.match(sums, new RegExp(`^[0-9a-f]{64}  themes/${name}\\.css$`, 'm'));
    }
    assert.ok(!out.has('themes/example.css'), 'the template is not shipped');
    const tools = filesIn('scripts/tools').map((path) => path.slice('scripts/tools/'.length));
    for (const name of ['theme-rules.mjs']) assert.ok(tools.includes(name), name);
    for (const name of tools) assert.equal(out.get(`tools/${name}`)?.toString('utf8'), read(`scripts/tools/${name}`), name);
    assert.ok(out.has('tokens.json'));
  });
});

describe('dist/tokens.json', () => {
  const data = JSON.parse(tokensJson(packageInfo()));
  const byName = new Map(data.tokens.map((entry) => [entry.name, entry]));
  const LAYERS = ['scale', 'role', 'hook', 'runtime', 'motion-hook', 'internal'];
  const TYPES = ['color', 'length', 'font', 'duration', 'easing', 'number', 'shadow', 'other'];

  it('is deterministic, carries the version and one sorted entry per name in the documented shape', () => {
    assert.equal(tokensJson(packageInfo()), tokensJson(packageInfo()));
    assert.equal(data.version, packageInfo().version);
    assert.deepEqual(Object.keys(data), ['version', 'tokens']);
    const names = data.tokens.map((entry) => entry.name);
    assert.deepEqual(names, [...new Set(names)].sort((a, b) => (a < b ? -1 : 1)));
    for (const entry of data.tokens) {
      assert.ok(LAYERS.includes(entry.layer), `${entry.name}: layer ${entry.layer}`);
      assert.ok(TYPES.includes(entry.type), `${entry.name}: type ${entry.type}`);
      assert.equal(entry.themeable, entry.layer === 'role' || entry.layer === 'hook', `${entry.name}: themeable`);
      assert.ok(entry.default === null || typeof entry.default === 'string', entry.name);
      for (const key of Object.keys(entry)) assert.ok(['name', 'layer', 'default', 'type', 'themeable', 'component', 'deprecated'].includes(key), `${entry.name}: ${key}`);
    }
  });

  it('keeps tokens.css, the hooks table of docs/theming.md and the stylesheets in step', () => {
    const source = read('src/tokens.css');
    const marker = source.indexOf('── 2. Palette');
    const end = source.indexOf('\n  }\n', marker);
    const names = (text) => [...stripComments(text).matchAll(/(--ds-[\w-]+)\s*:/g)].map((match) => match[1]);
    const first = source.indexOf('.ds-theme {');
    for (const name of names(source.slice(first, marker))) assert.equal(byName.get(name)?.layer, 'scale', name);
    for (const name of names(source.slice(marker, end))) assert.equal(byName.get(name)?.layer, 'role', name);
    const theming = read('docs/theming.md');
    const table = theming.slice(theming.indexOf('## Component hooks'), theming.indexOf('\n## ', theming.indexOf('## Component hooks') + 1));
    const hooks = table.split('\n').filter((line) => line.startsWith('| `')).flatMap((line) => [...line.split(' | ')[0].matchAll(/`(--ds-[\w-]+)`/g)].map((match) => match[1]));
    assert.ok(hooks.length > 40, `${hooks.length} hooks`);
    for (const name of hooks) {
      assert.equal(byName.get(name)?.layer, 'hook', name);
      assert.ok(byName.get(name).component, `${name}: the component that reads it`);
    }
    assert.deepEqual(data.tokens.filter((entry) => entry.layer === 'hook').map((entry) => entry.name).sort(), [...new Set(hooks)].sort());
    // Every custom property a stylesheet reads or declares is listed.
    const used = new Set();
    for (const file of filesIn('src', (path) => path.endsWith('.css'))) {
      for (const match of stripComments(read(file)).matchAll(/var\(\s*(--ds-[\w-]+)|(--ds-[\w-]+)\s*:/g)) used.add(match[1] ?? match[2]);
    }
    assert.deepEqual([...used].filter((name) => !byName.has(name)).sort(), []);
  });

  it('reads defaults, types and layers the way a tool needs them', () => {
    const expect = {
      '--ds-primary': ['role', 'color', '#0b57d0'],
      '--ds-primary-hover': ['role', 'color', 'color-mix(in srgb, var(--ds-primary), var(--ds-on-primary) 8%)'],
      '--ds-dur-fast': ['scale', 'duration', 'calc(150ms * var(--ds-time-scale, 1))'],
      '--ds-ease-out': ['scale', 'easing', 'cubic-bezier(.05, .7, .1, 1)'],
      '--ds-space-4': ['scale', 'length', '16px'],
      '--ds-z-toast': ['scale', 'number', '60'],
      '--ds-font-body': ['role', 'font', 'var(--ds-weight-regular) 14px/20px var(--ds-font)'],
      '--ds-elev-overlay': ['role', 'shadow', 'var(--ds-elev-3)'],
      '--ds-btn-height': ['hook', 'length', '36px'],
      '--ds-time-scale': ['scale', 'number', '1'],
      '--ds-progress': ['runtime', 'number', '0'],
      '--ds-menu-x': ['runtime', 'length', '0px'],
      '--ds-motion-distance': ['motion-hook', null, null],
      '--ds-btn-half': ['internal', null, null],
    };
    for (const [name, [layer, type, value]] of Object.entries(expect)) {
      const entry = byName.get(name);
      assert.ok(entry, name);
      assert.equal(entry.layer, layer, `${name}: layer`);
      if (type) assert.equal(entry.type, type, `${name}: type`);
      if (value) assert.equal(entry.default, value, `${name}: default`);
    }
    assert.equal(byName.get('--ds-btn-height').component, 'button');
    assert.equal(byName.get('--ds-ripple-scale')?.layer, 'motion-hook', 'read only by a keyframe of motion.css');
    assert.ok(!byName.has('--ds-view-scroll'), 'a timeline name is not a custom property');
  });
});
