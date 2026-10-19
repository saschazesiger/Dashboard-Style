/**
 * The repository as a whole: dist/ is what src/ builds, nothing names a
 * particular project, licences travel with the files, the docs cover
 * every class and custom property, and the test tooling stays in its lane
 * (unit tests without dependencies, Playwright pinned and matched by the CI
 * container, known bugs as test.fail with an id and a phase).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { diffDist } from '../scripts/build.mjs';
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
    const generic = new Set(['ds-theme', 'ds-base', 'ds-motion-full']);
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

  it('documents every JS export in the docs', () => {
    const docs = filesIn('docs', (path) => path.endsWith('.md')).map(read).join('\n');
    for (const file of ['src/js/motion.js', 'src/js/indicator.js', 'src/js/dom.js']) {
      for (const match of read(file).matchAll(/^export (?:const|function) ([\w$]+)/gm)) assert.ok(docs.includes(match[1]), `${file}: ${match[1]}`);
    }
    for (const name of ['icon', 'iconElement', 'ICON_SIZE']) assert.ok(read('docs/icons.md').includes(name), name);
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
    // Playwright itself only in the specs and the config, which node --test never loads.
    const playwright = ALL_FILES.filter((path) => /\.(js|mjs)$/.test(path) && path.startsWith('test/'))
      .filter((path) => importsOf(read(path)).some((specifier) => specifier.startsWith('@playwright/')));
    assert.deepEqual(playwright.filter((path) => !/^test\/browser\/([^/]+\.spec\.js|playwright\.config\.js)$/.test(path)), []);
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

  it('marks known bugs with test.fail', () => {
    const specs = ALL_FILES.filter((path) => path.startsWith('test/browser/') && /\.(js|mjs)$/.test(path));
    const reason = /^[A-Za-z0-9-]+(, [A-Za-z0-9-]+)*: fixed in P[1-8]$|^spike: /;
    const offenders = [];
    for (const file of specs) {
      const source = code(read(file));
      if (/\btest\.fixme\s*\(/.test(source)) offenders.push(`${file}: test.fixme never runs`);
      for (const args of callArguments(source, /\btest\.fail\s*\(/g)) {
        const strings = [...args.matchAll(/'([^'\\]*)'|"([^"\\]*)"|`([^`\\$]*)`/g)].map((match) => match[1] ?? match[2] ?? match[3]);
        const last = strings.at(-1);
        if (last === undefined || !reason.test(last)) offenders.push(`${file}: test.fail(${args.replace(/\s+/g, ' ')})`);
      }
    }
    assert.deepEqual(offenders, []);
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
