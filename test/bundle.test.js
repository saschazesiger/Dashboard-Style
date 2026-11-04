/**
 * The project bundle (scripts/tools/bundle.mjs, shipped in dist/tools/),
 * the classic wrapper it shares with the build (js-wrap.mjs) and the Vite
 * plugin (vite-plugin.mjs, against a stub of the plugin API), on the small
 * fake copy in test/fixtures/bundle/dist/ and its fixture projects, and on
 * this checkout's dist/ and the manifest.json the build writes.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { MODULES, buildJs, moduleSource, packageInfo } from '../scripts/build.mjs';
import { bundle, expandGlobs, globRegExp, loadCopy, main, pruneIcons, scanText } from '../scripts/tools/bundle.mjs';
import { classicScript, stripComments } from '../scripts/tools/js-wrap.mjs';
import dashboardStyle, { CSS_ID, JS_ID } from '../scripts/tools/vite-plugin.mjs';
import { ROOT, read } from './helpers.js';

const FIXTURE = join(ROOT, 'test/fixtures/bundle');
const DIST = join(FIXTURE, 'dist');
const project = (name) => join(FIXTURE, 'projects', name, 'ds.config.json');

/** A temporary folder, removed after `run`. */
function withTemp(run) {
  const dir = mkdtempSync(join(tmpdir(), 'ds-bundle-'));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A project in a temporary folder: files by path, a config pointing at the fixture copy. */
function tempProject(dir, files, config = {}) {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  const full = { content: ['**/*.{html,js,ts,tsx}'], out: 'out', dist: relative(dir, DIST), ...config };
  writeFileSync(join(dir, 'ds.config.json'), JSON.stringify(full));
  return join(dir, 'ds.config.json');
}

/** Runs a classic script in a fresh context (no DOM): its globalThis. */
function runClassic(...scripts) {
  const context = { console, setTimeout, clearTimeout };
  context.globalThis = context;
  vm.createContext(context);
  for (const script of scripts) vm.runInContext(script, context);
  return context;
}

const names = (list) => list.map((item) => item.name);

describe('tools/js-wrap.mjs', () => {
  it('writes ds.js exactly as the build does (the build writes it with classicScript)', () => {
    const info = packageInfo();
    const banner = `/*! ${info.name} ${info.version} | ${info.license} License | ${info.homepage} */\n`;
    const modules = MODULES.map((name) => ({ name, source: moduleSource(name) }));
    assert.equal(classicScript({ version: info.version, banner, modules }), buildJs(info));
    assert.equal(buildJs(info), read('dist/ds.js'));
  });

  it('adds only what the page lacks: a module made in full is not made again, a missing export joins a frozen copy', () => {
    const counter = 'export const made = (globalThis.made = (globalThis.made || 0) + 1);';
    const one = classicScript({ version: '9.0.0', modules: [{ name: 'core', source: `${counter}\nexport const a = 1;` }, { name: 'icons', source: 'export const x = 1;' }] });
    const two = classicScript({ version: '9.0.0', modules: [{ name: 'core', source: `${counter}\nexport const a = 2;` }, { name: 'icons', source: 'export const x = 2;\nexport const y = 3;' }] });
    const page = runClassic(one, two);
    assert.equal(page.made, 1, 'core is made once');
    assert.equal(page.DS.core.a, 1);
    assert.deepEqual({ ...page.DS.icons }, { x: 1, y: 3 }, 'the page keeps x, the second script adds y');
    assert.ok(Object.isFrozen(page.DS.icons));
  });

  it('puts DS.init, DS.get, DS.define and DS.config of the core at the top level', () => {
    const core = 'export function init() { return 1; }\nexport function get() {}\nexport function define() {}\nexport function config() {}';
    const page = runClassic(classicScript({ version: '9.0.0', modules: [{ name: 'core', source: core }] }));
    for (const key of ['init', 'get', 'define', 'config']) assert.equal(page.DS[key], page.DS.core[key], key);
    assert.equal(runClassic(classicScript({ version: '9.0.0', modules: [{ name: 'one', source: 'export const one = 1;' }] })).DS.init, undefined, 'only with a core');
  });

  it('merges a second script of the same version by name instead of returning early (merge: true)', () => {
    const a = classicScript({ version: '9.0.0', merge: true, modules: [{ name: 'core', source: 'export const id = 1;' }, { name: 'one', source: "import { id } from './core.js';\nexport const one = id;" }] });
    const b = classicScript({ version: '9.0.0', merge: true, modules: [{ name: 'core', source: 'export const id = 2;' }, { name: 'two', source: "import { id } from './core.js';\nexport const two = id;" }] });
    const page = runClassic(a, b);
    assert.equal(page.DS.one.one, 1);
    assert.equal(page.DS.two.two, 1, 'the second script reads the core already on the page');
    assert.equal(page.DashboardStyle.versions['9.0.0'], page.DS);
    const plain = runClassic(classicScript({ version: '9.0.0', merge: false, modules: [{ name: 'one', source: 'export const one = 1;' }] }), classicScript({ version: '9.0.0', merge: false, modules: [{ name: 'two', source: 'export const two = 2;' }] }));
    assert.equal(plain.DS.two, undefined, 'without merge, the 2.x behaviour: the second copy does nothing');
  });

  it('keeps the import rules of the build: earlier modules only', () => {
    assert.throws(() => classicScript({ version: '1.0.0', modules: [{ name: 'a', source: "import { b } from './b.js';" }, { name: 'b', source: 'export const b = 1;' }] }), /not earlier in MODULES/);
    assert.throws(() => classicScript({ version: '1.0.0', modules: [{ name: 'a', source: 'export default 1;' }] }), /only "export const"/);
  });

  it('strips comments and indentation, and leaves strings, template literals and regular expressions alone', () => {
    const source = [
      '/*! keep me */',
      '/** A doc comment. */',
      'export const url = "http://example.com/a//b"; // a trailing comment',
      "export const glob = '/* not a comment */';",
      'export const re = /\\/\\/[^/]*\\//g;',
      'export function half(x) {',
      '  // a line comment',
      '  return x / 2 / 1;',
      '}',
      'export const page = `<a href="//x">',
      '    // kept: inside a template ${half(4)} /* also kept */',
      '  </a>`;',
      'export function test(s) { return /a\\/b/.test(s); }',
      'export const n = 1/*x*/+2;',
    ].join('\n');
    const out = stripComments(source);
    assert.match(out, /^\/\*! keep me \*\//);
    assert.doesNotMatch(out, /doc comment|trailing comment|a line comment/);
    assert.match(out, /"http:\/\/example\.com\/a\/\/b"/);
    assert.match(out, /'\/\* not a comment \*\/'/);
    assert.match(out, /\n {4}\/\/ kept: inside a template \$\{half\(4\)\} \/\* also kept \*\/\n {2}<\/a>`/);
    const exports = runClassic(classicScript({ version: '1.0.0', modules: [{ name: 'm', source: out.replace(/^\/\*!.*\n/, '') }] })).DS.m;
    assert.equal(exports.url, 'http://example.com/a//b');
    assert.equal(exports.half(8), 4);
    assert.equal(exports.test('a/b'), true);
    assert.equal(exports.n, 3);
    assert.equal(exports.re.source, '\\/\\/[^/]*\\/', 'the regex literal is unchanged');
  });

  it('strips every module of src/js into a script that keeps the same exports and constants', () => {
    const full = MODULES.map((name) => ({ name, source: moduleSource(name) }));
    const stripped = full.map(({ name, source }) => ({ name, source: stripComments(source) }));
    // The icons module is nearly all glyph strings, which stay as they are.
    for (const [index, module] of stripped.entries()) if (module.name !== 'icons') assert.ok(module.source.length < full[index].source.length * 0.85, `${module.name} gets smaller`);
    const a = runClassic(classicScript({ version: '1.0.0', modules: full })).DS;
    const b = runClassic(classicScript({ version: '1.0.0', modules: stripped })).DS;
    for (const name of MODULES) {
      assert.deepEqual(Object.keys(b[name]), Object.keys(a[name]), name);
      for (const key of Object.keys(a[name])) {
        if (typeof a[name][key] !== 'function') assert.equal(JSON.stringify(b[name][key]), JSON.stringify(a[name][key]), `${name}.${key}`);
      }
    }
  });
});

describe('tools/bundle.mjs: globs and scan', () => {
  it('matches globs with *, **, ?, {a,b}, [..] and excludes with !', () => {
    assert.ok(globRegExp('src/**/*.{js,tsx}').test('src/a/b/c.tsx'));
    assert.ok(globRegExp('src/**/*.{js,tsx}').test('src/c.js'));
    assert.ok(!globRegExp('src/**/*.{js,tsx}').test('src/c.ts'));
    assert.ok(globRegExp('page?.html').test('page1.html'));
    assert.ok(!globRegExp('*.html').test('a/b.html'));
    assert.ok(globRegExp('v[0-9].md').test('v2.md'));
    withTemp((dir) => {
      tempProject(dir, { 'src/a.js': '', 'src/skip/b.js': '', 'src/c.ts': '', 'node_modules/x/d.js': '' });
      assert.deepEqual(expandGlobs(dir, ['src/**/*.js', '!src/skip/**', '**/d.js']), ['src/a.js']);
    });
  });

  it('reads complete names only: classes, attributes, DS calls, imports and icons', () => {
    const copy = loadCopy({ dist: DIST });
    const scan = scanText([
      '<div class="ds-card ds-unknown-thing" data-ds-dialog data-icon="bell">',
      'DS.overlay.confirm("Sure?"); window.DS.dom.morphHtml(el, html); DS.icons.icon(DS.icons.info);',
      "import { attach } from '../vendor/ds/js/ripple.js';",
      'el.style.setProperty("--ds-btn-height", "40px"); el.dataset.dsDialog = "";',
    ].join('\n'), 'a.html', copy);
    const kinds = scan.uses.map((use) => `${use.kind}:${use.module ? `${use.module}.` : ''}${use.name}@${use.line}`);
    for (const expected of ['class:ds-card@1', 'attribute:data-ds-dialog@1', 'icon:bell@1', 'export:overlay.confirm@2', 'export:dom.morphHtml@2', 'export:icons.icon@2', 'icon:info@2', 'module:ripple@3', 'export:ripple.attach@3', 'attribute:data-ds-dialog@4']) {
      assert.ok(kinds.includes(expected), `${expected} in ${kinds.join(' ')}`);
    }
    assert.ok(!kinds.some((kind) => kind.includes('ds-btn')), 'a hook (--ds-btn-height) is not a class');
    assert.deepEqual(scan.unknown.map((entry) => entry.name), ['ds-unknown-thing']);
    assert.deepEqual(scan.partials, []);
  });
});

describe('tools/bundle.mjs: the fixture projects', () => {
  it('bundles a plain HTML project: classes, an attribute, requires, the module CSS and the icons', () => {
    withTemp((out) => {
      const result = bundle({ config: project('html'), out });
      assert.deepEqual(result.errors, []);
      const report = JSON.parse(readFileSync(join(out, 'ds.bundle.json'), 'utf8'));
      assert.deepEqual(names(report.components), ['button', 'card', 'scrim', 'dialog', 'ripple'], 'manifest order');
      const reason = Object.fromEntries(report.components.map((item) => [item.name, item.reason]));
      assert.equal(reason.button, 'index.html:12 ds-btn');
      assert.equal(reason.card, 'index.html:10 ds-card');
      assert.equal(reason.dialog, 'index.html:12 data-ds-dialog');
      assert.equal(reason.scrim, 'required by dialog');
      assert.equal(reason.ripple, 'needed by module ripple');
      assert.deepEqual(names(report.modules), ['core', 'motion', 'icons', 'ripple', 'overlay']);
      assert.equal(report.modules[0].reason, 'always included');
      assert.deepEqual(names(report.icons).sort(), ['bell', 'close'], 'bell from the page, close from the overlay module');
      for (const item of report.components) assert.ok(item.bytes > 0 && item.gzip > 0, item.name);
      assert.ok(report.files.css.gzip > 0 && report.files.js.bytes > 0);
      assert.ok(report.classes['ds-theme'] && report.classes['ds-btn--filled']);
      assert.ok(existsSync(join(out, 'properties.css')));
    });
  });

  it('bundles a JS project of template strings, readable without minify', () => {
    withTemp((out) => {
      const result = bundle({ config: project('template'), out });
      assert.deepEqual(result.errors, []);
      const report = result.entries[0].report;
      assert.deepEqual(names(report.components), ['button', 'chip', 'toast']);
      assert.equal(report.components.find((item) => item.name === 'toast').reason, 'needed by DS.overlay.toast (src/app.js:10)');
      assert.deepEqual(names(report.icons).sort(), ['check', 'close']);
      const css = readFileSync(join(out, 'ds.bundle.css'), 'utf8');
      assert.match(css, /\/\* ── css\/components\/chip\.css ── \*\/\n/);
      assert.match(css, /\.ds-chip--selected \{ background: var\(--ds-primary\); \}/, 'the readable file, not the .min.css');
    });
  });

  it('bundles a TSX project: imports, data-ds-icon, transitive requires and an ES module entry', async () => {
    const out = mkdtempSync(join(tmpdir(), 'ds-bundle-'));
    try {
      const result = bundle({ config: project('tsx'), out });
      assert.deepEqual(result.errors, []);
      const report = result.entries[0].report;
      assert.deepEqual(names(report.components), ['scrim', 'listbox', 'combobox', 'chart']);
      assert.equal(report.components[0].reason, 'required by listbox');
      assert.equal(report.components[1].reason, 'required by combobox');
      assert.match(report.modules.find((item) => item.name === 'overlay').reason, /^src\/App\.tsx:1 import 'dashboard-style\/js\/overlay\.js'$/);
      assert.deepEqual(names(report.icons).sort(), ['check', 'close', 'plus']);
      const entry = readFileSync(join(out, 'ds.bundle.js'), 'utf8');
      const base = relative(out, DIST).split('\\').join('/');
      assert.match(entry, new RegExp(`^export \\* as overlay from '${base.replace(/\./g, '\\.')}/js/overlay\\.js';$`, 'm'));
      assert.doesNotMatch(entry, /js\/dom\.js|js\/ripple\.js/);
      const mod = await import(pathToFileURL(join(out, 'ds.bundle.js')).href);
      assert.equal(mod.version, '3.0.0-alpha.0');
      assert.deepEqual(Object.keys(mod.icons).sort(), ['ICON_SIZE', 'check', 'close', 'fill', 'icon', 'iconElement', 'plus']);
      assert.equal(typeof mod.overlay.open, 'function');
      assert.equal(typeof mod.core.runtime, 'object');
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});

describe('tools/bundle.mjs: dynamic names and the safelist', () => {
  const files = {
    'a.js': [
      "el.className = 'ds-btn--' + kind;",
      'el.className = `ds-${name}`;',
      'el.className = "ds-" + other;',
      "el.className = 'ds-chip' + suffix;",
      "el.className = 'ds-card ' + 'ds-chip';",
      "el.className = 'ds-chart__bar--' + tone;",
    ].join('\n'),
  };

  it('fails a class built at run time with its file and line', () => {
    withTemp((dir) => {
      const config = tempProject(dir, files);
      const result = bundle({ config, write: false });
      const lines = result.errors.map((error) => error.split(' ')[0]);
      assert.deepEqual(lines, ['a.js:1', 'a.js:2', 'a.js:3', 'a.js:4', 'a.js:6'], result.errors.join('\n'));
      assert.match(result.errors[0], /\(el\.className = 'ds-btn--' \+ kind;\).*"ds-btn--\*"/);
      const cli = spawnSync(process.execPath, [join(ROOT, 'scripts/tools/bundle.mjs'), '--config', config], { encoding: 'utf8' });
      assert.equal(cli.status, 1);
      assert.match(cli.stderr, /^a\.js:1 a class name built at run time/m);
      assert.ok(!existsSync(join(dir, 'out')), 'nothing is written');
    });
  });

  it('lets a safelist glob or component cover a built name, and bundles what it names', () => {
    withTemp((dir) => {
      const config = tempProject(dir, files, { safelist: ['ds-btn--*', 'ds-chip*', 'component:chart'] });
      const result = bundle({ config, write: false });
      assert.deepEqual(result.errors.map((error) => error.split(' ')[0]), ['a.js:2', 'a.js:3'], '`ds-${...}` and "ds-" + … stay errors');
      const report = result.entries[0].report;
      assert.equal(report.components.find((item) => item.name === 'chart').reason, 'safelist "component:chart"');
      assert.equal(report.components.find((item) => item.name === 'button').reason, 'safelist "ds-btn--*"');
      const all = bundle({ config: tempProject(dir, files, { safelist: ['ds-*'] }), write: false });
      assert.deepEqual(all.errors, []);
      assert.equal(all.entries[0].report.components.length, 11, 'every component (utilities too)');
    });
  });

  it('reports a safelist entry that names nothing', () => {
    withTemp((dir) => {
      const result = bundle({ config: tempProject(dir, { 'a.html': '<p class="ds-card"></p>' }, { safelist: ['component:nope', 'ds-nothing-*'] }), write: false });
      assert.deepEqual(result.errors, ['safelist: no component "nope" in the copy']);
      assert.deepEqual(result.warnings, ['safelist: "ds-nothing-*" matches no class of the copy']);
    });
  });
});

describe('tools/bundle.mjs: output', () => {
  it('writes the layer statement, the sublayers, the core and the components in manifest order', () => {
    withTemp((dir) => {
      const config = tempProject(dir, { 'a.html': '<i class="ds-chart"></i><b class="ds-sr"></b><p class="ds-btn"></p>' });
      bundle({ config });
      const css = readFileSync(join(dir, 'out/ds.bundle.css'), 'utf8');
      const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
      assert.ok(css.startsWith(`/*! Dashboard-Style 3.0.0-alpha.0 | MIT License`));
      const body = css.slice(css.indexOf('\n') + 1);
      assert.ok(body.startsWith(`${manifest.layers}${manifest.sublayers}`), 'both statements first, once');
      assert.equal(css.split('@layer ds.tokens,').length - 1, 1, 'the per-file layer statements go');
      assert.equal(css.split('/*!').length - 1, 1, 'one banner');
      const at = (text) => css.indexOf(text);
      const sequence = ['@layer ds.tokens{', '@layer ds.base{', '@layer ds.motion{', '.ds-sr{', '@layer ds.components.button{', '@layer ds.components.chart{'].map(at);
      assert.ok(sequence.every((index) => index > 0), sequence.join());
      assert.deepEqual([...sequence].sort((a, b) => a - b), sequence, 'core, then utilities (not in order), then the components');
      assert.ok(!css.includes('ds-chip'), 'only what the page uses');
      assert.match(css, /@property --ds-chart-progress \{/, 'a registration the bundle reads, from properties.css');
      assert.match(readFileSync(join(dir, 'out/properties.css'), 'utf8'), /@property --ds-time-scale\{[\s\S]*@property --ds-chart-progress \{/);
    });
  });

  it('prunes the icons to the glyphs the project and the modules use', () => {
    withTemp((dir) => {
      const config = tempProject(dir, { 'a.js': 'DS.icons.fill(document); DS.icons.icon(DS.icons.check);' });
      bundle({ config });
      const script = readFileSync(join(dir, 'out/ds.bundle.js'), 'utf8');
      const page = runClassic(script);
      assert.deepEqual(Object.keys(page.DS.icons).sort(), ['ICON_SIZE', 'check', 'fill', 'icon', 'iconElement']);
      assert.doesNotMatch(script, /export const|const bell|<circle/);
      assert.match(script, /const GLYPHS = \{\n\s*check\n/);
      const listed = bundle({ config: tempProject(dir, { 'a.js': 'DS.icons.icon(DS.icons[name]);' }, { icons: ['info'] }), write: false });
      assert.deepEqual(listed.errors, [], 'a listed set covers a dynamic name');
      assert.deepEqual(names(listed.entries[0].report.icons), ['info']);
      const dynamic = bundle({ config: tempProject(dir, { 'a.js': 'DS.icons.icon(DS.icons[name]);\n<i data-icon="{{.Name}}"></i>' }), write: false });
      assert.deepEqual(dynamic.errors.map((error) => error.split(' ')[0]), ['a.js:1', 'a.js:2']);
      const all = bundle({ config: tempProject(dir, { 'a.js': 'DS.icons.fill(document);' }, { icons: 'all' }), write: false });
      assert.equal(all.entries[0].report.icons.length, 5);
    });
    const source = read('src/js/icons.js');
    const pruned = pruneIcons(source, new Set(['check']));
    assert.match(pruned, /^export const check = '</m);
    assert.doesNotMatch(pruned, /^export const bell = /m);
    assert.match(pruned, /const GLYPHS = \{\n {2}check\n\};/);
  });

  it('writes a classic script with the modules it needs and core, which another bundle can join', () => {
    withTemp((dir) => {
      bundle({ config: tempProject(dir, { 'a.js': 'DS.ripple.attach(document);' }) });
      const one = readFileSync(join(dir, 'out/ds.bundle.js'), 'utf8');
      assert.match(one, /^\/\*! Dashboard-Style 3\.0\.0-alpha\.0/);
      assert.match(one, /DS\.core, DS\.motion, DS\.ripple\./);
      assert.doesNotMatch(one, /\/\*\* A duration in ms/, 'minified: comments out');
      const page = runClassic(one);
      assert.deepEqual(Object.keys(page.DS).sort(), ['core', 'motion', 'ripple', 'version']);
      assert.equal(page.DS.ripple.attach('r').duration, 150);
      bundle({ config: tempProject(dir, { 'a.js': 'DS.dom.morphHtml(el, html);' }) });
      const two = readFileSync(join(dir, 'out/ds.bundle.js'), 'utf8');
      const both = runClassic(one, two);
      assert.deepEqual(Object.keys(both.DS).sort(), ['core', 'dom', 'motion', 'ripple', 'version'], 'one runtime per page');
      const none = bundle({ config: tempProject(dir, { 'a.js': 'DS.dom.morphHtml(el, html);' }, { js: false }), write: false });
      assert.equal(none.entries[0].js, null);
    });
  });

  it('writes one set per entry, each with the shared content', () => {
    withTemp((dir) => {
      const config = tempProject(dir, {
        'shared/layout.html': '<main class="ds-card"></main>',
        'admin/users.js': 'DS.overlay.confirm("Remove?");',
        'shop/cart.html': '<span class="ds-chip ds-chip--selected"></span>',
      }, { content: ['shared/**'], entries: { admin: ['admin/**'], shop: ['shop/**'] } });
      const result = bundle({ config });
      assert.deepEqual(result.errors, []);
      const admin = JSON.parse(readFileSync(join(dir, 'out/ds.admin.json'), 'utf8'));
      const shop = JSON.parse(readFileSync(join(dir, 'out/ds.shop.json'), 'utf8'));
      assert.deepEqual(names(admin.components), ['button', 'card', 'scrim', 'dialog']);
      assert.deepEqual(names(shop.components), ['chip', 'card']);
      assert.ok(existsSync(join(dir, 'out/ds.admin.css')) && existsSync(join(dir, 'out/ds.shop.js')) && existsSync(join(dir, 'out/properties.css')));
      assert.ok(!existsSync(join(dir, 'out/ds.bundle.css')));
    });
  });

  it('rejects a broken config (exit 2)', () => {
    withTemp((dir) => {
      const config = tempProject(dir, { 'a.html': '' }, { js: 'umd', colour: 'red' });
      const errors = [];
      assert.equal(main(['--config', config], () => {}, (line) => errors.push(line)), 2);
      assert.match(errors.join('\n'), /unknown config keys: colour/);
    });
  });
});

describe('tools/bundle.mjs --check', () => {
  it('passes a fresh bundle and fails a stale one with a summary, from the copy the tool sits in', () => {
    withTemp((dir) => {
      // A copy with the tool inside it: tools/bundle.mjs reads ../manifest.json.
      const copy = join(dir, 'vendor/ds');
      cpSync(DIST, copy, { recursive: true });
      mkdirSync(join(copy, 'tools'));
      for (const name of ['bundle.mjs', 'js-wrap.mjs']) cpSync(join(ROOT, 'scripts/tools', name), join(copy, 'tools', name));
      const app = join(dir, 'app');
      mkdirSync(app);
      writeFileSync(join(app, 'index.html'), '<button class="ds-btn"></button>');
      writeFileSync(join(app, 'ds.config.json'), JSON.stringify({ content: ['*.html'], out: 'public' }));
      const run = (...args) => spawnSync(process.execPath, [join(copy, 'tools/bundle.mjs'), ...args], { cwd: app, encoding: 'utf8' });
      const missing = run('--check');
      assert.equal(missing.status, 1);
      assert.match(missing.stderr, /missing: public\/ds\.bundle\.css/);
      assert.equal(run().status, 0);
      const fresh = run('--check');
      assert.equal(fresh.status, 0, fresh.stderr);
      assert.match(fresh.stdout, /up to date/);
      writeFileSync(join(app, 'index.html'), '<button class="ds-btn"></button><span class="ds-chip"></span>');
      const stale = run('--check');
      assert.equal(stale.status, 1);
      assert.match(stale.stderr, /index\.html:1 uses \.ds-chip, which public\/ds\.bundle\.css does not hold/);
      assert.match(stale.stderr, /bundle: \+ component chip \(index\.html:1 ds-chip\)/);
      assert.match(stale.stderr, /stale: public\/ds\.bundle\.css/);
      const dry = run('--dry-run');
      assert.equal(dry.status, 0);
      assert.match(dry.stdout, /component chip/);
      assert.equal(run('--check').status, 1, '--dry-run writes nothing');
      assert.equal(run('--report').status, 0);
      assert.equal(run('--check').status, 0);
    });
  });
});

describe('tools/bundle.mjs on this checkout\'s dist/ (its manifest.json)', () => {
  const dist = join(ROOT, 'dist');

  it('bundles a page from the built copy, a fraction of ds.css and ds.js', () => {
    withTemp((dir) => {
      const config = tempProject(dir, {
        'index.html': '<div class="ds-theme"><button class="ds-btn ds-btn--primary">Go</button><span data-icon="bell"></span></div>\n<script>DS.ripple.attach(document); DS.icons.fill(document);</script>',
      }, { dist: relative(dir, dist) });
      const result = bundle({ config });
      assert.deepEqual(result.errors, []);
      const report = result.entries[0].report;
      assert.deepEqual(names(report.components), ['spinner', 'button', 'ripple'], 'button requires spinner (its busy face); the ripple module its stylesheet; in cascade order');
      assert.deepEqual(names(report.modules), ['core', 'motion', 'ripple', 'icons']);
      assert.deepEqual(names(report.icons), ['bell']);
      const css = readFileSync(join(dir, 'out/ds.bundle.css'), 'utf8');
      const js = readFileSync(join(dir, 'out/ds.bundle.js'), 'utf8');
      assert.ok(css.length < read('dist/ds.css').length / 4);
      assert.ok(js.length < read('dist/ds.js').length / 3);
      assert.match(css, /box-sizing:border-box/, 'the core global rules are in every bundle');
      assert.match(js, /const bell = '</);
      assert.doesNotMatch(js, /const trash = '</, 'pruned');
      const page = runClassic(js);
      for (const key of ['init', 'get', 'define', 'config']) assert.equal(page.DS[key], page.DS.core[key], `DS.${key}`);
    });
  });

  it('leaves out the overlay behaviours a page does not use, and keeps the ones it does (3.0)', () => {
    withTemp((dir) => {
      const modulesOf = (text) => {
        const config = tempProject(dir, { 'app.html': text }, { dist: relative(dir, dist) });
        const result = bundle({ config, write: false });
        assert.deepEqual(result.errors, []);
        return result.entries[0].report.modules.map((item) => item.name);
      };
      const dialog = modulesOf('<dialog class="ds-dialog"></dialog>');
      assert.ok(dialog.includes('overlay') && dialog.includes('dialog') && dialog.includes('position'));
      for (const name of ['menu', 'sheet', 'toast', 'tooltip']) assert.ok(!dialog.includes(name), `${name} left out`);
      const menu = modulesOf('<div class="ds-menu"></div>');
      assert.ok(menu.includes('menu'));
      for (const name of ['dialog', 'sheet', 'toast', 'tooltip']) assert.ok(!menu.includes(name), `${name} left out`);
      assert.ok(modulesOf('<button data-tip="Copy">x</button>').includes('tooltip'), 'data-tip brings the tooltip');
      assert.ok(modulesOf('<script>DS.overlay.toast(null, "Saved.");</script>').includes('toast'), 'DS.overlay.toast() brings the toast module');
      assert.ok(modulesOf('<script>DS.overlay.tooltips(document);</script>').includes('tooltip'), 'DS.overlay.tooltips() brings the tooltip module');
      const asked = modulesOf('<script>DS.overlay.confirm({});</script>');
      assert.ok(asked.includes('dialog') && asked.includes('toast'), 'confirm() brings the dialog, and the toast of a failed onConfirm');
    });
  });

  it('takes data-ds-open, data-ds-close and data-ds-busy for the overlay core, on whatever they sit (3.0)', () => {
    withTemp((dir) => {
      const reportOf = (text) => {
        const config = tempProject(dir, { 'app.html': text }, { dist: relative(dir, dist) });
        const result = bundle({ config, write: false });
        assert.deepEqual(result.errors, []);
        const { modules, components } = result.entries[0].report;
        return { modules: names(modules), components: names(components) };
      };
      for (const html of ['<dialog class="ds-sheet"><button data-ds-close>x</button></dialog>', '<dialog class="ds-sheet" data-ds-busy></dialog>', '<div class="ds-menu"><button data-ds-close="#a">x</button></div>']) {
        const { modules, components } = reportOf(html);
        assert.ok(modules.includes('overlay'), html);
        assert.ok(!modules.includes('dialog') && !components.includes('dialog'), `${html}: no dialog`);
      }
      for (const html of ['<button data-ds-open="#a">x</button>', '<button data-ds-close="#a">x</button>', '<script>el.dataset.dsOpen = "#a";</script>']) {
        const { modules, components } = reportOf(html);
        assert.ok(modules.includes('overlay'), `${html} brings the overlay`);
        assert.ok(!components.includes('dialog'), `${html}: no dialog`);
      }
      assert.ok(reportOf('<dialog class="ds-dialog"><form class="ds-dialog__box" data-ds-dialog-form></form></dialog>').modules.includes('dialog'));
    });
  });

  it('finds a tooltip by data-tip and by el.dataset.tip', () => {
    withTemp((dir) => {
      const modulesOf = (text) => {
        const config = tempProject(dir, { 'app.js': text }, { dist: relative(dir, dist) });
        const result = bundle({ config, write: false });
        assert.deepEqual(result.errors, []);
        return names(result.entries[0].report.modules);
      };
      assert.ok(modulesOf('el.setAttribute("data-tip", "Copy");').includes('tooltip'));
      assert.ok(modulesOf('el.dataset.tip = "Copy";').includes('tooltip'));
      assert.ok(!modulesOf('el.dataset.tipsy = "Copy";').includes('tooltip'), 'only that property');
    });
  });

  it('gives DS.dialog and DS.toast the same stylesheets as DS.overlay: what the exports write, the toast of a failure', () => {
    withTemp((dir) => {
      const of = (text) => {
        const config = tempProject(dir, { 'app.js': text }, { dist: relative(dir, dist) });
        const result = bundle({ config, write: false });
        assert.deepEqual(result.errors, []);
        const { modules, components } = result.entries[0].report;
        return { modules: names(modules), components: names(components) };
      };
      for (const call of ['DS.dialog.confirm({});', 'DS.overlay.confirm({});', 'DS.dialog.prompt({});', 'DS.overlay.prompt({});', 'DS.dialog.form(el, {});']) {
        const { modules, components } = of(call);
        for (const name of ['button', 'dialog', 'spinner', 'toast', 'utilities']) assert.ok(components.includes(name), `${call} needs ${name}`);
        assert.ok(modules.includes('toast'), `${call}: the snackbar of a failure`);
      }
      for (const call of ['DS.dialog.prompt({});', 'DS.overlay.prompt({});']) assert.ok(of(call).components.includes('form'), `${call}: its field`);
      for (const call of ['DS.toast.toast(region, "Saved.");', 'DS.toast.announce("Saved.");', 'DS.toast.toastRegion(document);']) {
        const { components } = of(call);
        for (const name of ['toast', 'utilities']) assert.ok(components.includes(name), `${call} needs ${name}`);
      }
      assert.ok(of('DS.toast.toast(region, "Saved.");').components.includes('button'), 'its action and close button');
    });
  });

  it('adds the stylesheets an export writes markup for (manifest.json js.<module>.exportRequires)', () => {
    withTemp((dir) => {
      const config = tempProject(dir, {
        'app.js': "DS.overlay.confirm({ title: 'Delete?' });\nDS.overlay.toast(region, 'Saved.');\nDS.motion.sortable(list);",
      }, { dist: relative(dir, dist) });
      const result = bundle({ config, write: false });
      assert.deepEqual(result.errors, []);
      const components = new Map(result.entries[0].report.components.map((item) => [item.name, item.reason]));
      for (const name of ['button', 'dialog', 'spinner']) assert.match(components.get(name) ?? '', /DS\.overlay\.confirm|required by/, name);
      assert.match(components.get('toast'), /DS\.overlay\.(confirm|toast)/);
      assert.match(components.get('drag'), /DS\.motion\.sortable/);
      assert.ok(components.has('utilities'), 'the live regions on .ds-sr');
      assert.ok(!components.has('menu') && !components.has('sheet'), 'nothing the page does not use');
    });
  });

  it('finds the indicator on a project track by its attribute alone', () => {
    withTemp((dir) => {
      const config = tempProject(dir, {
        'index.html': '<nav data-ds-indicator=\'[aria-pressed="true"]\' data-ds-indicator-class="x-pill"><button aria-pressed="true">A</button></nav>',
      }, { dist: relative(dir, dist) });
      const result = bundle({ config, write: false });
      assert.deepEqual(result.errors, []);
      const report = result.entries[0].report;
      assert.ok(names(report.components).includes('indicator'), 'its stylesheet: no pill without it');
      assert.ok(names(report.modules).includes('indicator'), 'its module: DS.init() makes the pill');
    });
  });

  it('finds a core module by the attribute its define() declares, and not by one it only reads', () => {
    withTemp((dir) => {
      const config = tempProject(dir, {
        'index.html': '<time data-ds-time datetime="2026-01-01T00:00:00Z"></time><button data-ds-hotkey="ctrl+k">Search</button>',
      }, { dist: relative(dir, dist) });
      const result = bundle({ config, write: false });
      assert.deepEqual(result.errors, []);
      const modules = names(result.entries[0].report.modules);
      assert.ok(modules.includes('format'), 'data-ds-time');
      assert.ok(modules.includes('hotkeys'), 'data-ds-hotkey');
    });
    withTemp((dir) => {
      const config = tempProject(dir, { 'index.html': '<div data-ds-keep></div>' }, { dist: relative(dir, dist) });
      const result = bundle({ config, write: false });
      assert.deepEqual(result.errors, []);
      const modules = names(result.entries[0].report.modules);
      assert.ok(!modules.includes('indicator') && !modules.includes('ripple'), `data-ds-keep is the side of morphHtml: ${modules}`);
    });
  });
});

describe('tools/vite-plugin.mjs (stubbed Vite API)', () => {
  const root = join(FIXTURE, 'projects/html');

  /** A plugin context: warn and error recorded. */
  const context = () => {
    const seen = { warn: [], error: [], watched: [] };
    return { seen, warn: (message) => seen.warn.push(message), error: (message) => { seen.error.push(message); throw new Error(message); }, addWatchFile: (file) => seen.watched.push(file) };
  };

  it('serves the virtual modules from the content scan and follows the modules Vite transforms (dev)', () => {
    const plugin = dashboardStyle({ config: 'ds.config.json' });
    assert.equal(plugin.name, 'dashboard-style');
    plugin.configResolved({ root, command: 'serve' });
    const ctx = context();
    plugin.buildStart.call(ctx);
    assert.deepEqual(ctx.seen.watched, [join(root, 'index.html')]);
    const cssId = plugin.resolveId(CSS_ID);
    const jsId = plugin.resolveId(JS_ID);
    assert.equal(plugin.resolveId('./other.js'), null);
    const css = plugin.load(cssId);
    assert.match(css, /\.ds-card\{/);
    assert.doesNotMatch(css, /ds-chip/);
    const js = plugin.load(jsId);
    assert.match(js, /export default globalThis\.DashboardStyle\.versions\['3\.0\.0-alpha\.0'\];\n$/);

    const sent = [];
    const reloaded = [];
    const invalidated = [];
    const modules = new Map([[cssId, { id: cssId }], [jsId, { id: jsId }]]);
    plugin.configureServer({
      moduleGraph: { getModuleById: (id) => modules.get(id), invalidateModule: (mod) => invalidated.push(mod.id) },
      ws: { send: (message) => sent.push(message) },
      reloadModule: (mod) => reloaded.push(mod.id),
      watcher: { on: () => {} },
    });
    assert.equal(plugin.transform('export const a = 1;', join(root, 'src/a.js')), null);
    assert.deepEqual(invalidated, [], 'nothing new: nothing to update');
    plugin.transform('export const row = `<li class="ds-chip">`;', join(root, 'src/row.js'));
    assert.match(plugin.load(cssId), /\.ds-chip\{/);
    assert.deepEqual(reloaded, [cssId], 'only the stylesheet changed: CSS update');
    plugin.transform('DS.dom.morphHtml(el, html);', join(root, 'src/list.js?v=2'));
    assert.deepEqual(sent, [{ type: 'full-reload' }], 'the script changed: full reload');
    plugin.transform.call(ctx, 'el.className = "ds-btn--" + kind;', join(root, 'src/bad.ts'));
    assert.match(ctx.seen.warn.join('\n'), /^dashboard-style: src\/bad\.ts:1 a class name built at run time/, 'dev warns, the page keeps running');
    assert.deepEqual(ctx.seen.error, []);
    assert.equal(plugin.transform('<i class="ds-card">', '\0virtual:other'), null);
    assert.equal(plugin.transform('<i class="ds-card">', join(root, 'node_modules/x/index.js')), null);
  });

  it('fails a built name and warns about names that reach a build after the stylesheet', () => {
    const plugin = dashboardStyle({ config: 'ds.config.json', js: 'esm' });
    plugin.configResolved({ root, command: 'build' });
    const ctx = context();
    plugin.buildStart.call(ctx);
    assert.match(plugin.load(plugin.resolveId(JS_ID)), /^export \* as overlay from '\/.*\/test\/fixtures\/bundle\/dist\/js\/overlay\.js';$/m);
    assert.throws(() => plugin.transform.call(ctx, 'el.className = `ds-${x}`;', join(root, 'src/bad.js')), /src\/bad\.js:1 a class name built at run time/);
    plugin.transform.call(ctx, '<i class="ds-chip"></i>', join(root, 'src/late.jsx'));
    plugin.buildEnd.call(ctx);
    assert.match(ctx.seen.warn.join('\n'), /component chip \(src\/late\.jsx:1 ds-chip\)[\s\S]*Add their folders to "content"/);
    const strict = dashboardStyle({ config: 'ds.config.json', strict: true });
    strict.configResolved({ root, command: 'build' });
    const strictCtx = context();
    strict.buildStart.call(strictCtx);
    strict.transform.call(strictCtx, '<i class="ds-chip"></i>', join(root, 'src/late.jsx'));
    assert.throws(() => strict.buildEnd.call(strictCtx), /component chip/);
  });
});
