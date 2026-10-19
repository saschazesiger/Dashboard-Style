/**
 * The repository as a whole: dist/ is what src/ builds, nothing names a
 * particular project, licences travel with the files, and the docs cover
 * every class and custom property.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { diffDist } from '../scripts/build.mjs';
import { ROOT, filesIn, read, rules, stripComments } from './helpers.js';

const TEXT = /\.(css|js|mjs|md|html|json|txt|sh|ps1)$|(^|\/)(LICENSE|SHA256SUMS|\.gitignore|\.gitattributes)$/;
const ALL_FILES = filesIn('.', (path) => !/(^|\/)(\.git|node_modules)\//.test(path)).map((path) => path.replace(/^\.\//, ''));

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

  it('keeps links between the docs working', () => {
    for (const file of ['README.md', ...filesIn('docs', (path) => path.endsWith('.md'))]) {
      for (const match of read(file).matchAll(/\]\((?!https?:|#)([^)#]+)(#[^)]*)?\)/g)) {
        const base = file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : '';
        const target = join(ROOT, base, match[1]);
        assert.doesNotThrow(() => readFileSync(target), `${file} links to ${match[1]}`);
      }
    }
  });
});
