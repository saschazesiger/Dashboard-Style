/**
 * The page patterns (src/patterns/, docs/patterns.md "Page patterns"):
 * every page is listed in the docs and in the styleguide, its bundle is the
 * one tools/bundle.mjs makes from dist/ now, it keeps the project rules
 * (tools/check-project.mjs, prefix pt) and uses documented markup only.
 * The browser side (every engine, landmarks, names, overflow, screenshots)
 * is test/browser/patterns.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { PATTERNS, diffPatternBundles, patternBundleFiles, patternConfig, patternPages } from '../scripts/build.mjs';
import { bundle } from '../scripts/tools/bundle.mjs';
import { checkProject } from '../scripts/tools/check-project.mjs';
import { ROOT, read } from './helpers.js';

const pages = patternPages();
const files = readdirSync(join(ROOT, PATTERNS)).filter((name) => name.endsWith('.html')).sort();

/** The styleguide's registry as the browser sees it (a classic script). */
function registry() {
  const sandbox = {};
  vm.runInNewContext(read('styleguide/registry.js'), { globalThis: sandbox });
  return sandbox.SG_REGISTRY;
}

describe('page patterns', () => {
  it('finds the pages, one entry and one bundle each', () => {
    assert.ok(pages.length >= 26, `${pages.length} pages`);
    assert.deepEqual(pages.map((page) => `${page.name}.html`).sort(), files);
    const entries = Object.keys(patternConfig().entries);
    for (const page of pages) assert.ok(entries.includes(page.entry), `${page.name}: entry ${page.entry}`);
    for (const entry of entries) assert.ok(pages.some((page) => page.entry === entry), `the entry ${entry} has a page`);
  });

  it('lists every page in docs/patterns.md: a section with its title and a link to the file', () => {
    const docs = read('docs/patterns.md');
    const headings = [...docs.matchAll(/^### (.+)$/gm)].map((match) => match[1]);
    for (const page of pages) {
      assert.ok(headings.includes(page.title), `docs/patterns.md has "### ${page.title}"`);
      assert.ok(docs.includes(`](../src/patterns/${page.name}.html)`), `docs/patterns.md links ${page.name}.html`);
    }
  });

  it('lists every page in the styleguide (registry.js, generated) with its need line, in the order of the docs', () => {
    const listed = JSON.parse(JSON.stringify(registry().patterns));
    assert.deepEqual(listed.map((p) => p.name), pages.map((p) => p.name));
    for (const p of listed) {
      assert.ok(p.title && p.need && p.group && p.entry, `${p.name}: title, need, group and entry`);
      assert.ok(p.need.length <= 120 && !/\.$/.test(p.need), `${p.name}: the need line is one line without a full stop`);
    }
    const shell = read('styleguide/shell.js');
    assert.match(shell, /var PATTERNS = REG\.patterns \|\| \[\];/, 'shell.js reads the patterns of the registry');
    assert.match(shell, /'#\/patterns\/' \+ p\.name/, 'a page per pattern');
    assert.match(shell, /'\.\.\/src\/patterns\/' \+ p\.name \+ '\.html\?'/, 'the preview and "Open alone" load the page');
  });

  it('keeps the bundles of src/patterns/ds/ equal to what tools/bundle.mjs makes from dist/ (npm run build)', () => {
    assert.deepEqual(diffPatternBundles(), []);
    const result = bundle({ config: join(ROOT, PATTERNS, 'ds.config.json'), check: true });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.stale, []);
    for (const entry of result.entries) assert.deepEqual(entry.report.unknown, [], `${entry.name}: every name is the system's`);
    assert.deepEqual(patternBundleFiles().filter((path) => !existsSync(join(ROOT, path))), [], 'every generated file is there');
  });

  it('keeps the project rules: tools/check-project.mjs finds nothing (prefix pt)', () => {
    const config = { major: 3, prefix: 'pt', css: [`${PATTERNS}/*.css`], js: [`${PATTERNS}/pt.js`], html: [`${PATTERNS}/*.html`], vendor: 'dist', bundle: `${PATTERNS}/ds.config.json` };
    const { findings, errors } = checkProject(config, ROOT);
    assert.deepEqual(errors, []);
    assert.deepEqual(findings.map((f) => `${f.file}:${f.line} ${f.rule} ${f.message}`), []);
  });

  it('builds each page the same way: the theme root, one h1, a main, its bundle, the frame, the start-up', () => {
    for (const page of pages) {
      const html = read(page.file);
      const where = page.file;
      assert.match(html, /^<!doctype html>\n<html lang="en-GB" class="ds-theme ds-base">/, `${where}: the theme on <html>, in the British English its text and dates are written in`);
      assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/, `${where}: the viewport`);
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${where}: one h1`);
      assert.equal((html.match(/<main\b[^>]*\bid="main"/g) ?? []).length, 1, `${where}: one main#main`);
      assert.ok(html.indexOf('<script src="pt.js"></script>') < html.indexOf('</head>'), `${where}: the frame in the head`);
      assert.match(html, new RegExp(`<script src="ds/ds\\.${page.entry}\\.js"></script>\\n<script>\\n\\(function \\(\\) \\{\\n  'use strict';\\n\\n(?:  //.*\\n)*  DS\\.icons\\.fill\\(document\\);\\n  DS\\.init\\(document\\);\\n  DS\\.ripple\\.attach\\(document\\);`), `${where}: the bundle, then the start-up`);
      assert.match(html, /<div id="pt-ready" hidden><\/div>\n<\/body>/, `${where}: the render-blocking marker last`);
      for (const [, href] of html.matchAll(/(?:href|src)="(\.\.\/\.\.\/dist\/[^"]+)"/g)) {
        assert.ok(existsSync(join(ROOT, PATTERNS, href)), `${where}: ${href} exists`);
      }
      assert.doesNotMatch(html, /\sstyle="(?![^"]*--ds-[\w-]+:)[^"]*"/, `${where}: inline styles set hooks only`);
      assert.doesNotMatch(html, /\.innerHTML\s*=/, `${where}: no innerHTML`);
      assert.doesNotMatch(html, /\bclass="[^"]*\bpt-(?!auth\b|brand\b|brand__mark\b|codes\b|foot\b|bar\b|bar__title\b|col-min\b|price\b|price__unit\b|fill\b)/, `${where}: pt- classes of pt.css only`);
    }
  });

  it('writes every pattern attribute as a regular expression the browsers compile (the v flag)', () => {
    // A pattern that does not compile under v (an unescaped - at the end of a class) is ignored, with a console error.
    for (const page of pages) {
      for (const [, source] of read(page.file).matchAll(/\spattern="([^"]*)"/g)) {
        const pattern = source.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
        assert.doesNotThrow(() => new RegExp(`^(?:${pattern})$`, 'v'), `${page.file}: pattern="${source}"`);
      }
    }
  });

  it('defines in pt.css only the pt- classes it documents, from tokens', () => {
    const css = read(`${PATTERNS}/pt.css`);
    const header = css.slice(0, css.indexOf('*/'));
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
    // Rules at the top level and inside a print query, which holds only pt- rules too.
    const rules = [...code.matchAll(/^\s*([^\s{}@][^{}]*)\{/gm)].map((match) => match[1].trim());
    for (const [, query] of code.matchAll(/^(@[^{]*)\{/gm)) assert.equal(query.trim(), '@media print', `pt.css: ${query.trim()} is the print query`);
    for (const selector of rules) {
      assert.match(selector, /^\.pt-[\w-]+$/, `pt.css: ${selector} is one pt- class`);
      assert.ok(header.includes(selector.replace(/__.*$/, '')), `pt.css: ${selector} in the header comment`);
    }
    assert.ok(rules.length >= 7, `${rules.length} rules`);
    assert.doesNotMatch(code, /\.ds-|#[0-9a-f]{3,8}\b|\d+ms\b|!important|@layer/i, 'no ds- selector, colour, duration, !important or layer');
  });
});
