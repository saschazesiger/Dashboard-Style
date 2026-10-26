/**
 * The repository as a whole: dist/ is what src/ builds, nothing names a
 * particular project, licences travel with the files, the docs cover
 * every class and custom property, and the test tooling stays in its lane
 * (unit tests without dependencies, Playwright pinned and matched by the CI
 * container, no known bug left: only spike markers of engine gaps, every
 * skip with its reason).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, posix } from 'node:path';
import { MODULES, diffDist } from '../scripts/build.mjs';
import { ROOT, filesIn, read, rules, stripComments } from './helpers.js';

const TEXT = /\.(css|js|mjs|md|html|json|txt|sh|ps1)$|(^|\/)(LICENSE|SHA256SUMS|\.gitignore|\.gitattributes)$/;
const SKIP_DIRS = /^(\.git|node_modules|test-results|playwright-report|blob-report|__screenshots-local__)$/;
const ALL_FILES = filesIn('.', () => true, SKIP_DIRS).map((path) => path.replace(/^\.\//, ''));

/** JS source without block comments and whole-line comments (headers may quote code). */
const code = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Module specifiers of static imports, re-exports and dynamic import() with a string. */
function importsOf(source) {
  return [...code(source).matchAll(/^\s*(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm)]
    .map((match) => match[1] ?? match[2] ?? match[3]);
}

/** The argument text of every call that `opener` (ending in its `(`) finds, by paren depth. */
function callArguments(source, opener) {
  return [...source.matchAll(opener)].map((match) => {
    let depth = 1;
    let end = match.index + match[0].length;
    while (depth > 0 && end < source.length) {
      if (source[end] === '(') depth += 1;
      else if (source[end] === ')') depth -= 1;
      end += 1;
    }
    return source.slice(match.index + match[0].length, end - 1);
  });
}

describe('repository', () => {
  it('has dist/ up to date with src/ (run npm run build)', () => {
    assert.deepEqual(diffDist(), []);
  });

  it('ships the opt-in stylesheets under dist/css/optional/, checksummed like the rest (1.5.0)', () => {
    const sums = read('dist/SHA256SUMS').split('\n').filter(Boolean).map((line) => line.split(/\s+/)[1]);
    assert.ok(read('dist/css/optional/view-transitions.css').startsWith('/*'), 'dist/css/optional/view-transitions.css');
    assert.ok(sums.includes('css/optional/view-transitions.css'), 'in SHA256SUMS, so the vendor copy verifies it');
    assert.doesNotMatch(read('dist/ds.css'), /@import[^;]*optional/, 'ds.css never includes it');
  });

  it('names no particular project, organisation or place', () => {
    // Built from fragments, so this file passes its own check.
    const names = new RegExp(['cam' + 'pus', 'cha' + 'tbob', 'socra' + 'tes', 'sur' + 'see', '\\bi' + 'ct\\b', 'inven' + 'tar', 'mel' + 'den', '\\bb' + 'ob\\b', 'trade.go' + 'thic', 'type' + 'kit', 'arch' + 'ivo',
      '#1a3c' + '25', '#cfdf' + 'ad'].join('|'), 'i');
    const offenders = ALL_FILES.filter((path) => TEXT.test(path)).filter((path) => names.test(readFileSync(join(ROOT, path), 'utf8')));
    assert.deepEqual(offenders, []);
  });

  it('keeps the licences next to the files they cover', () => {
    assert.match(read('LICENSE'), /^MIT License/);
    assert.match(read('fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
    assert.match(read('dist/LICENSE'), /^MIT License/);
    assert.match(read('dist/fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
    assert.match(read('fonts/fonts.css'), /url\('google-sans-latin-opsz-normal\.woff2'\)/, 'relative font URLs');
  });

  it('keeps version numbers in step (package.json, CHANGELOG, banners)', () => {
    const { version } = JSON.parse(read('package.json'));
    assert.match(read('CHANGELOG.md'), new RegExp(`^## ${version.replace(/\./g, '\\.')}\\b`, 'm'));
    assert.match(read('dist/ds.css'), new RegExp(`^/\\*! Dashboard-Style ${version.replace(/\./g, '\\.')} `));
  });

  it('counts the components right in the styleguide overview', () => {
    const count = filesIn('src/components', (path) => path.endsWith('.css')).length;
    assert.match(read('styleguide/styleguide.js'), new RegExp(`tile\\('Components', '${count}'`));
  });

  it('documents every component class in docs/components.md', () => {
    const docs = read('docs/components.md');
    const classes = new Set();
    for (const file of filesIn('src', (path) => path.endsWith('.css'))) {
      for (const { selector } of rules(read(file))) for (const match of selector.matchAll(/\.(ds-[\w-]+)/g)) classes.add(match[1]);
    }
    const generic = new Set(['ds-theme', 'ds-base']);
    const missing = [...classes].filter((name) => !generic.has(name) && !docs.includes(name)).sort();
    assert.deepEqual(missing, []);
  });

  it('documents every custom property in docs/', () => {
    const docs = filesIn('docs', (path) => path.endsWith('.md')).map(read).join('\n') + read('themes/example.css');
    const names = new Set();
    for (const file of filesIn('src', (path) => path.endsWith('.css'))) {
      for (const match of stripComments(read(file)).matchAll(/(--ds-[\w-]+)/g)) names.add(match[1]);
    }
    const missing = [...names].filter((name) => !docs.includes(name)).sort();
    assert.deepEqual(missing, []);
  });

  it('documents every JS export of every built module (MODULES): icons in docs/icons.md, the rest in docs/motion.md', () => {
    // A module in src/js/ that the build leaves out fails here too.
    assert.deepEqual(filesIn('src/js', (path) => path.endsWith('.js')).map((path) => path.slice('src/js/'.length, -3)).sort(), [...MODULES].sort(), 'src/js/ is MODULES');
    const missing = [];
    for (const name of MODULES) {
      const docs = read(name === 'icons' ? 'docs/icons.md' : 'docs/motion.md');
      // In a code span of its own or as a call or member in one (`flip(container, ...)`, `DS.motion.flip`).
      const spans = [...docs.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]);
      for (const match of read(`src/js/${name}.js`).matchAll(/^export (?:const|function) ([\w$]+)/gm)) {
        const word = new RegExp(`(^|[^\\w$])${match[1].replace(/\$/g, '\\$')}(?![\\w$])`);
        if (!spans.some((span) => word.test(span))) missing.push(`${name}.js: ${match[1]}`);
      }
    }
    assert.deepEqual(missing, []);
  });

  it('documents every component hook in the docs/theming.md table and, commented out, in themes/example.css', () => {
    // A hook (layer 3) is a --ds-* read with a fallback in src/components/ that tokens.css does not declare.
    // Not hooks: the registered per-element motion settings (motion.css), the runtime properties that
    // src/js/ writes, and the read-only or page-set values named below (each documented in docs/).
    const declared = new Set([...stripComments(read('src/tokens.css')).matchAll(/(--ds-[\w-]+)\s*:/g)].map((match) => match[1]));
    const css = filesIn('src', (path) => path.endsWith('.css'));
    const registered = new Set(css.flatMap((file) => [...stripComments(read(file)).matchAll(/@property\s+(--ds-[\w-]+)/g)].map((match) => match[1])));
    const scripts = filesIn('src/js', (path) => path.endsWith('.js')).map(read).join('\n');
    const NOT_HOOKS = new Map([
      ['--ds-content-pad-top', 'the panel padding of page.css at the current width: read it, never set it'],
      ['--ds-content-pad-x', 'the panel padding of page.css at the current width: read it, never set it'],
      ['--ds-toast-reserve', 'written by toast(), or by the page with reserve: false (data-toast-reserve)'],
      ['--ds-toast-bottom', 'set by the page on the region over a bar pinned to the bottom edge'],
      ['--ds-toast-shift-y', 'written by DS.overlay (two-axis glide)'],
      ['--ds-keyboard-inset', 'written by DS.dom.followViewport() on <html>: the height of the on-screen keyboard'],
      ['--ds-content-pad-bottom', 'the bottom padding of the page content at the current width: read it, never set it'],
      ['--ds-indicator-lag', 'a motion hook: how long the trailing edge waits; themes never set it'],
      ['--ds-indicator-ease-t', 'a motion hook: the curve of each indicator edge, set by indicator.css'],
      ['--ds-indicator-ease-r', 'a motion hook: the curve of each indicator edge, set by indicator.css'],
      ['--ds-indicator-ease-b', 'a motion hook: the curve of each indicator edge, set by indicator.css'],
      ['--ds-indicator-ease-l', 'a motion hook: the curve of each indicator edge, set by indicator.css'],
      ['--ds-share', 'set by the page on a slider (the value\'s share of its range, 0 to 1) and on chart marks'],
    ]);
    const hooks = new Set();
    for (const file of filesIn('src/components', (path) => path.endsWith('.css'))) {
      for (const match of stripComments(read(file)).matchAll(/var\(\s*(--ds-[\w-]+)\s*,/g)) {
        const name = match[1];
        if (declared.has(name) || registered.has(name) || NOT_HOOKS.has(name) || scripts.includes(`'${name}'`) || scripts.includes(`${name}:`)) continue;
        hooks.add(name);
      }
    }
    assert.ok(hooks.has('--ds-btn-height') && hooks.has('--ds-card-padding'), 'the walk finds the hooks');
    const theming = read('docs/theming.md');
    const table = theming.slice(theming.indexOf('## Component hooks'), theming.indexOf('\n## ', theming.indexOf('## Component hooks') + 1));
    const rows = table.split('\n').filter((line) => line.startsWith('| `'));
    const comments = [...read('themes/example.css').matchAll(/\/\*[\s\S]*?\*\//g)].map((match) => match[0]).join('\n');
    const offenders = [];
    for (const name of [...hooks].sort()) {
      const word = new RegExp(`\`${name}\``);
      if (!rows.some((row) => word.test(row.split(' | ')[0]))) offenders.push(`${name}: no row in the docs/theming.md "Component hooks" table`);
      if (!new RegExp(`${name}:`).test(comments)) offenders.push(`${name}: not commented out in themes/example.css`);
    }
    assert.deepEqual(offenders, []);
    for (const name of NOT_HOOKS.keys()) assert.ok(stripComments(css.map(read).join('\n')).includes(name), `NOT_HOOKS names ${name}, which src/ never reads`);
  });

  it('guards every element of the documented component markup in the embedded-widget rule of docs/theming.md', () => {
    // Host element rules (a reboot) beat ds.css by layer: the guard hands every element the markup uses back to it.
    const names = new Set([...read('docs/components.md').matchAll(/```html\n([\s\S]*?)```/g)]
      .flatMap((block) => [...block[1].matchAll(/<([a-z][a-z0-9]*)\b/g)].map((match) => match[1])));
    const EXEMPT = new Map([
      ['html', 'the page, not the widget'],
      ['body', 'the page, not the widget'],
      ['div', 'no UA style that a reset changes'],
      ['span', 'no UA style that a reset changes'],
      ['svg', 'icons keep their own attributes'],
      ['path', 'an icon shape'],
      ['form', 'no UA style the components rely on'],
      ['tbody', 'table structure: the cells carry the styles'],
      ['thead', 'table structure: the cells carry the styles'],
      ['tr', 'table structure: the cells carry the styles'],
      ['option', 'native select options'],
    ]);
    const theming = read('docs/theming.md');
    const guard = /\.ds-theme\.my-widget :where\(([^)]*)\)\s*\{\s*all: revert-layer;/.exec(theming)?.[1];
    assert.ok(guard, 'the guard rule in docs/theming.md');
    const guarded = new Set(guard.split(',').map((name) => name.trim()));
    assert.ok(names.has('legend') && names.has('summary'), 'the walk finds the markup');
    assert.deepEqual([...names].filter((name) => !guarded.has(name) && !EXEMPT.has(name)).sort(), []);
  });

  it('lists every @keyframes once in the docs/motion.md keyframe table, unused kept names marked deprecated', () => {
    const motion = read('src/motion.css');
    const names = [...stripComments(motion).matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]);
    const docs = read('docs/motion.md');
    const section = docs.slice(docs.indexOf('\n## Keyframes'), docs.indexOf('\n## ', docs.indexOf('\n## Keyframes') + 1));
    const rows = section.split('\n').filter((line) => /^\| `ds-/.test(line)).map((line) => ({ names: [...line.split(' | ')[0].matchAll(/`(ds-[\w-]+)`/g)].map((match) => match[1]), line }));
    const listed = rows.flatMap((row) => row.names);
    assert.deepEqual([...listed].sort(), [...names].sort(), 'each @keyframes of src/motion.css in one row, once');
    // A name no stylesheet or module of src/ uses (outside its own @keyframes) is either deprecated or kept for pages.
    const KEPT_FOR_PAGES = new Map([
      ['ds-scan', 'a band across media being processed: no component of its own, used by pages (the Motion Lab shows it)'],
      ['ds-ripple', 'the confirmation ring behind a saved state: placed by pages (the Motion Lab shows it)'],
      ['ds-clip-out', 'the exit of a popup a page shows by hand with ds-clip-in (DS.overlay uses transitions)'],
    ]);
    const sources = [...filesIn('src', (path) => path.endsWith('.css')).map((file) => stripComments(read(file))), ...filesIn('src/js', (path) => path.endsWith('.js')).map((file) => code(read(file)))].join('\n');
    const DEPRECATED = /\*\*deprecated\*\*/;
    const offenders = [];
    for (const row of rows) {
      for (const name of row.names) {
        const used = sources.replace(new RegExp(`@keyframes\\s+${name}(?![\\w-])`, 'g'), '').match(new RegExp(`(^|[^\\w-])${name}(?![\\w-])`));
        if (!used && !DEPRECATED.test(row.line) && !KEPT_FOR_PAGES.has(name)) offenders.push(`${name}: unused in src/, so mark it **deprecated** (or keep it for pages, with a reason)`);
        if (used && DEPRECATED.test(row.line)) offenders.push(`${name}: marked deprecated, but src/ still uses it`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('keeps every removed name of src/deprecations.json out of the repository (RM-14)', () => {
    const { names } = JSON.parse(read('src/deprecations.json'));
    const removed = names.filter((entry) => entry.removed !== null && entry.pattern !== null);
    assert.ok(removed.some((entry) => entry.name === '--ds-ease'), 'the removed names of 2.0 are listed');
    // History (CHANGELOG.md, plans/) and the tests may name them; so may the data itself and the tools that read it.
    const EXEMPT = /^(src\/deprecations\.json|dist\/deprecations\.json|dist\/tools\/.*)$/;
    // A file that keeps an old form on purpose, for the entries it names (file → { reason, applies }).
    const KEEPS = new Map([
      ['test/browser/fixtures/toast-tooltip.html', {
        reason: 'its #old-markup region tests that toast() strips the old live-region attributes',
        applies: (entry) => entry.kind === 'markup' && /ds-toasts/.test(entry.pattern),
      }],
    ]);
    const scope = ALL_FILES.filter((path) => TEXT.test(path) && !EXEMPT.test(path)
      && (/^(src|dist|docs|themes|styleguide|example|demo|templates|test\/browser\/fixtures)\//.test(path) || ['README.md', 'AGENTS.md'].includes(path)));
    assert.ok(scope.includes('src/tokens.css') && scope.includes('test/browser/fixtures/controls.html') && scope.includes('AGENTS.md'), 'the walk finds the files');
    const offenders = [];
    for (const path of scope) {
      const source = readFileSync(join(ROOT, path), 'utf8');
      for (const entry of removed) {
        if (KEEPS.get(path)?.applies(entry)) continue;
        for (const match of source.matchAll(new RegExp(entry.pattern, 'g'))) {
          const line = source.slice(0, match.index).split('\n').length;
          offenders.push(`${path}:${line}: ${entry.name} was removed in ${entry.removed} (${entry.replacement ?? 'no replacement'})`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  // TODO(2.0 integrator): remove the todo option once WP2, WP4, WP5, WP6 and WP7 merged; each writes the
  // **deprecated** marker of its RM-15 names in docs/ (WP1 wrote the entries and .ds-view--leaving), and WP4
  // removes the old snackbar region bullet. Until then this test runs and reports without failing.
  it('marks every deprecated name of src/deprecations.json **deprecated** in docs/, and only those (RM-14)', {
    todo: 'TODO(2.0 integrator): strict after the merge of every package (RM-15 markers)',
  }, () => {
    const { names } = JSON.parse(read('src/deprecations.json'));
    const deprecated = names.filter((entry) => entry.removed === null);
    // A block is a table row, a list item or a paragraph; it covers an entry when it names it or its pattern matches.
    const blocks = filesIn('docs', (path) => path.endsWith('.md')).flatMap((file) => read(file).split(/\n\s*\n/)
      .flatMap((paragraph) => paragraph.split(/\n(?=\||\s*(?:[-*]|\d+\.)\s)/))
      .map((text) => ({ file, text: text.replace(/\s*\n\s*/g, ' ') })));
    const MARKER = /\*\*deprecated\*\*/i;
    const covers = (text, entry) => text.includes(entry.name) || (entry.pattern !== null && new RegExp(entry.pattern).test(text));
    const marked = blocks.filter((block) => MARKER.test(block.text));
    const unmarked = deprecated.filter((entry) => !marked.some((block) => covers(block.text, entry))).map((entry) => entry.name);
    assert.deepEqual(unmarked, [], 'deprecated in src/deprecations.json, but no **deprecated** marker in docs/ names it');
    const strays = marked.filter((block) => !deprecated.some((entry) => covers(block.text, entry))).map((block) => `${block.file}: ${block.text.slice(0, 100)}`);
    assert.deepEqual(strays, [], 'a **deprecated** marker in docs/ without its entry in src/deprecations.json');
  });

  it('exempts deprecated names from the Motion Lab coverage only while src/deprecations.json lists them (RM-14)', () => {
    const { names } = JSON.parse(read('src/deprecations.json'));
    const spec = read('test/browser/lab.spec.js');
    const block = /^const LAB_EXEMPT = \{\n([\s\S]*?)^\};/m.exec(spec)?.[1];
    assert.ok(block !== undefined, 'LAB_EXEMPT in test/browser/lab.spec.js');
    const rows = [...block.matchAll(/^\s*'([^']+)':\s*'((?:[^'\\]|\\.)*)'/gm)].map((match) => ({ name: match[1], reason: match[2] }));
    const offenders = [];
    for (const row of rows.filter((entry) => /deprecated/i.test(entry.reason))) {
      const entry = names.find((candidate) => candidate.name === row.name || (candidate.pattern !== null && new RegExp(candidate.pattern).test(row.name)));
      if (!entry) offenders.push(`${row.name}: says deprecated, but src/deprecations.json does not list it`);
      else if (entry.removed !== null) offenders.push(`${row.name}: removed in ${entry.removed}, so it is no primitive to exempt`);
    }
    assert.deepEqual(offenders, []);
  });

  it('has no reduced-motion remnants and no wording of the old motion rules (D8, D1, D3)', () => {
    // Built from fragments, so this file passes its own check; CHANGELOG.md,
    // plans/ and test/ may name them (history, decisions, the D8 browser test).
    // The old rules: the Safari 14 floor (D3 moved it), "no spring" and the
    // blanket "nothing bounces / overshoots" (D1: the spring floats). The
    // qualified rules stay: effects and layout sizes never overshoot (D1, D29).
    const names = new RegExp(['prefers-' + 'reduced-motion', 'ds-motion' + '-full', 'prefersReduced' + 'Motion', 'reduced' + '[ -]motion',
      'Safari ' + '14', 'no ' + 'spring', 'nothing that ' + 'bounces', 'nothing ' + '(overshoots|bounces)', '(no|motion|curves?|animations?|everything) never ' + 'overshoots?',
      'no curve ' + 'leaves'].join('|'), 'i');
    const scope = ALL_FILES.filter((path) => TEXT.test(path) && (/^(src|dist|styleguide|example|themes|docs)\//.test(path) || ['README.md', 'AGENTS.md'].includes(path)));
    assert.ok(scope.includes('src/tokens.css') && scope.includes('AGENTS.md') && scope.includes('styleguide/lab.js'), 'the walk finds the files');
    const offenders = [];
    for (const path of scope) {
      const lines = readFileSync(join(ROOT, path), 'utf8').split('\n');
      lines.forEach((line, index) => { if (names.test(line)) offenders.push(`${path}:${index + 1}: ${line.trim().slice(0, 100)}`); });
    }
    assert.deepEqual(offenders, []);
  });

  it('keeps no transitional list in the tests (P8: the guards are final)', () => {
    // Built from fragments, so this file passes its own check.
    const word = new RegExp('\\b' + 'PEND' + 'ING' + '\\b');
    const tests = ALL_FILES.filter((path) => path.startsWith('test/') && /\.(js|mjs)$/.test(path));
    assert.ok(tests.includes('test/css.test.js') && tests.includes('test/browser/lab.spec.js'), 'the walk finds the tests');
    assert.deepEqual(tests.filter((path) => word.test(read(path))), []);
  });

  it('points CLAUDE.md at AGENTS.md, the one set of contributor notes', () => {
    assert.equal(read('CLAUDE.md'), '@AGENTS.md\n');
  });

  it('keeps the unit tests dependency-free', () => {
    // npm test and npm run check must run without npm ci: node:* or files of this repository only.
    const unit = ALL_FILES.filter((path) => /^test\/[^/]+\.test\.js$/.test(path) || path === 'test/helpers.js' || /^test\/browser\/helpers\/[^/]+\.js$/.test(path));
    assert.ok(unit.includes('test/browser/helpers/motion.js') && unit.includes('test/helpers.js'), 'the walk finds the helpers');
    const offenders = [];
    for (const file of unit) {
      for (const specifier of importsOf(read(file))) {
        if (specifier.startsWith('node:')) continue;
        const target = posix.join(posix.dirname(file), specifier);
        if (!/^\.\.?\//.test(specifier) || !/^(src|scripts|test)\//.test(target)) offenders.push(`${file}: ${specifier}`);
      }
    }
    assert.deepEqual(offenders, []);
    // Playwright itself only in the specs, the config and the shared fixture
    // of the specs (base-test.js), which node --test never loads.
    const playwright = ALL_FILES.filter((path) => /\.(js|mjs)$/.test(path) && path.startsWith('test/'))
      .filter((path) => importsOf(read(path)).some((specifier) => specifier.startsWith('@playwright/')));
    assert.ok(playwright.includes('test/browser/base-test.js'), 'the walk finds the shared fixture');
    assert.deepEqual(playwright.filter((path) => !/^test\/browser\/([^/]+\.spec\.js|playwright\.config\.js|base-test\.js)$/.test(path)), []);
  });

  it('pins Playwright as the only devDependency', () => {
    const pkg = JSON.parse(read('package.json'));
    assert.equal(pkg.dependencies, undefined, 'no dependencies: nothing reaches projects');
    assert.deepEqual(Object.keys(pkg.devDependencies || {}), ['@playwright/test']);
    assert.match(pkg.devDependencies['@playwright/test'], /^\d+\.\d+\.\d+$/, 'an exact version, no ^ or ~');
    const lock = JSON.parse(read('package-lock.json'));
    assert.equal(lock.packages['node_modules/@playwright/test'].version, pkg.devDependencies['@playwright/test'], 'package-lock.json');
    assert.deepEqual(pkg.files, ['dist', 'LICENSE', 'README.md']);
    for (const target of Object.values(pkg.exports)) assert.match(target, /^\.\/dist\//);
  });

  it('runs CI in the Playwright container of the pinned version', () => {
    const version = JSON.parse(read('package.json')).devDependencies['@playwright/test'];
    const tags = [...read('.github/workflows/check.yml').matchAll(/mcr\.microsoft\.com\/playwright:v([\w.-]+)/g)].map((match) => match[1]);
    assert.ok(tags.length > 0, 'check.yml runs the browser tests in the Playwright container');
    assert.deepEqual([...new Set(tags)], [`${version}-noble`]);
  });

  it('never cancels a CI run on main: each run there has a concurrency group of its own', () => {
    // A shared group keeps one pending run and cancels the older one, whatever cancel-in-progress says.
    const block = /^concurrency:\n((?:[ #].*\n)+)/m.exec(read('.github/workflows/check.yml'))?.[1] ?? '';
    assert.match(block, /^\s*group: check-\$\{\{ github\.ref == 'refs\/heads\/main' && github\.run_id \|\| github\.ref \}\}$/m);
    assert.match(block, /^\s*cancel-in-progress: \$\{\{ github\.ref != 'refs\/heads\/main' \}\}$/m);
  });

  it('fails vendor.sh --check on a symbolic link added to a copy', { skip: process.platform === 'win32' && 'needs sh' }, () => {
    const temp = mkdtempSync(join(tmpdir(), 'ds-vendor-'));
    try {
      const copy = join(temp, 'v');
      const run = (...args) => spawnSync('sh', [join(ROOT, 'scripts/vendor.sh'), ...args], { cwd: ROOT, encoding: 'utf8' });
      const made = run('--from', '.', copy);
      assert.equal(made.status, 0, made.stderr);
      assert.equal(run('--check', copy).status, 0, 'a fresh copy verifies');
      symlinkSync('../ds.css', join(copy, 'js', 'link.css'));
      const checked = run('--check', copy);
      assert.equal(checked.status, 1);
      assert.match(checked.stderr, /symbolic links[\s\S]*js\/link\.css/);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it('leaves no known bug: only spike markers name an engine gap, and every skip says why', () => {
    // P1 to P7 turned every "<ids>: fixed in P<n>" marker green; what may stay
    // is a capability gap of an engine, `test.fail(<engine condition>, 'spike: <capability>')`,
    // with its row in the capability table of test/browser/README.md.
    const specs = ALL_FILES.filter((path) => path.startsWith('test/browser/') && /\.(js|mjs)$/.test(path));
    const readme = read('test/browser/README.md');
    const capabilities = readme.slice(readme.indexOf('## Capability spike'));
    const strings = (args) => [...args.matchAll(/'([^'\\]*)'|"([^"\\]*)"|`([^`\\]*)`/g)].map((match) => match[1] ?? match[2] ?? match[3]);
    const offenders = [];
    for (const file of specs) {
      const source = code(read(file));
      if (/\btest\.fixme\s*\(/.test(source)) offenders.push(`${file}: test.fixme never runs`);
      for (const args of callArguments(source, /\btest\.fail\s*\(/g)) {
        const last = strings(args).at(-1);
        const condition = args.slice(0, args.lastIndexOf(',')).trim();
        if (last === undefined || !/^spike: \S/.test(last)) offenders.push(`${file}: test.fail(${args.replace(/\s+/g, ' ')}): only spike: markers stay`);
        else if (!/browserName|project\.name|dsFallback/.test(condition) || /^true$/.test(condition)) offenders.push(`${file}: test.fail(${args.replace(/\s+/g, ' ')}): name the engine, never true`);
        else if (!capabilities.includes(last.slice('spike: '.length))) offenders.push(`${file}: ${last}: no row in the capability table of test/browser/README.md`);
      }
      for (const args of callArguments(source, /\btest(?:\.describe)?\.skip\s*\(/g)) {
        const last = strings(args).at(-1);
        if (!last || last.trim().length < 12 || !args.includes(',')) offenders.push(`${file}: test.skip(${args.replace(/\s+/g, ' ').slice(0, 80)}): give the reason (the engine gap or the choice)`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('lists the same progressive features in README.md and AGENTS.md', () => {
    const ticked = (text) => [...text.replace(/\s+/g, ' ').matchAll(/`([^`]+)`/g)].map((match) => match[1]).sort();
    const agents = read('AGENTS.md').match(/\(tested\): (`linear\(\)`[\s\S]*?)JS is ES2022/)?.[1] ?? '';
    const readme = read('README.md').match(/with its fallback: (`linear\(\)`[\s\S]*?)Older browsers/)?.[1] ?? '';
    assert.ok(agents && readme, 'both lists found');
    assert.deepEqual(ticked(readme), ticked(agents));
  });

  it('names every data: mask of src/ in the CSP note of install.md (a blocked mask hides what it covers)', () => {
    const note = read('docs/install.md').split('\n\n').find((paragraph) => paragraph.includes('img-src')) ?? '';
    const missing = [];
    for (const file of filesIn('src', (path) => path.endsWith('.css'))) {
      const source = stripComments(read(file));
      if (!source.includes('url("data:')) continue;
      if (file.endsWith('tokens.css')) {
        // A token that holds the mask: its name is what a project can look up.
        for (const match of source.matchAll(/(--ds-[\w-]+):\s*url\("data:/g)) if (!note.includes(`\`${match[1]}\``)) missing.push(match[1]);
      } else if (!note.includes(`\`${posix.basename(file)}\``)) missing.push(file);
    }
    assert.ok(note, 'docs/install.md has a paragraph on img-src');
    assert.deepEqual(missing, []);
  });

  it('keeps links between the docs working', () => {
    for (const file of ['README.md', 'AGENTS.md', ...filesIn('docs', (path) => path.endsWith('.md'))]) {
      for (const match of read(file).matchAll(/\]\((?!https?:|#)([^)#]+)(#[^)]*)?\)/g)) {
        const base = file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : '';
        const target = join(ROOT, base, match[1]);
        assert.doesNotThrow(() => readFileSync(target), `${file} links to ${match[1]}`);
      }
    }
  });
});
