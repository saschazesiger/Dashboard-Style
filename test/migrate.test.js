/**
 * tools/migrate.mjs: the 2.x fixture project (test/fixtures/migrate/project)
 * migrates to test/fixtures/migrate/expected, every entry of
 * src/deprecations.json is either rewritten or listed for a person, each
 * kind of rewrite on its own, the 3.0 checks without a name, the files a
 * run reads, the diff, the report and the command line with its exit codes.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { deprecationsJson, packageInfo, withBanner } from '../scripts/build.mjs';
import { collectFiles, exitCode, formatReport, main, majorOf, migrate, migrateText, prepare, ruleFor, setMajor, unifiedDiff } from '../scripts/tools/migrate.mjs';
import { read, ROOT } from './helpers.js';

const FIXTURE = join(ROOT, 'test/fixtures/migrate');
const DEPRECATIONS = { version: packageInfo().version, ...JSON.parse(read('src/deprecations.json')) };
const RULES = prepare(DEPRECATIONS);
const run = (text) => migrateText(text, RULES);

/** Every file under `dir`, relative, sorted. */
function files(dir, prefix = '') {
  return readdirSync(join(dir, prefix)).sort().flatMap((name) => {
    const path = prefix ? `${prefix}/${name}` : name;
    return statSync(join(dir, path)).isDirectory() ? files(dir, path) : [path];
  });
}

/** A copy of the fixture project in a temporary folder. */
function projectCopy() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-'));
  cpSync(join(FIXTURE, 'project'), dir, { recursive: true });
  return dir;
}

/** Captures what main() prints. */
function cli(argv, cwd) {
  let out = '';
  let err = '';
  const code = main(argv, { cwd, log: (text) => { out += text; }, error: (text) => { err += text; } });
  return { code, out, err };
}

describe('tools/migrate.mjs', () => {
  it('migrates the 2.x fixture project to the expected 3.0 project, and a second run finds nothing to rewrite', () => {
    const dir = projectCopy();
    try {
      const config = JSON.parse(readFileSync(join(dir, 'ds-check.json'), 'utf8'));
      const dry = migrate({ root: dir, config, configPath: 'ds-check.json', deprecations: DEPRECATIONS });
      assert.deepEqual(files(dir), files(join(FIXTURE, 'project')), 'a dry run writes nothing');
      for (const path of files(dir)) assert.equal(readFileSync(join(dir, path), 'utf8'), read(`test/fixtures/migrate/project/${path}`), path);
      assert.equal(exitCode(dry), 1);

      const written = migrate({ root: dir, config, configPath: 'ds-check.json', deprecations: DEPRECATIONS, write: true });
      assert.deepEqual(files(dir), files(join(FIXTURE, 'expected')));
      for (const path of files(dir)) assert.equal(readFileSync(join(dir, path), 'utf8'), read(`test/fixtures/migrate/expected/${path}`), path);
      assert.equal(exitCode(written, { write: true }), 1, 'something is left for a person');

      const again = migrate({ root: dir, config: JSON.parse(readFileSync(join(dir, 'ds-check.json'), 'utf8')), configPath: 'ds-check.json', deprecations: DEPRECATIONS });
      assert.deepEqual(again.files.filter((file) => file.after !== file.before).map((file) => file.path), [], 'idempotent');
      assert.deepEqual(again.files.flatMap((file) => file.manual.map((item) => `${file.path}:${item.line} ${item.name}`)),
        written.files.flatMap((file) => file.manual.map((item) => `${file.path}:${item.line} ${item.name}`)), 'the same list for a person');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('lists for a person what it cannot map in the fixture project, each with its file and line', () => {
    const dir = projectCopy();
    try {
      const config = JSON.parse(readFileSync(join(dir, 'ds-check.json'), 'utf8'));
      const result = migrate({ root: dir, config, configPath: 'ds-check.json', deprecations: DEPRECATIONS });
      assert.deepEqual(result.files.flatMap((file) => file.manual.map((item) => `${file.path}:${item.line} ${item.name}`)), [
        'css/app.css:42 layer',
        'css/theme.css:14 --ds-btn-sm-height',
        'css/theme.css:16 --ds-table-dense-row-height',
        'css/theme.css:17 --ds-loader-sm-size',
        'js/app.js:23 ds-status--…',
        'js/charts.mjs:4 module',
        'js/charts.mjs:4 module',
        'js/charts.mjs:16 ds-badge--…',
      ]);
      const review = result.files.flatMap((file) => file.changes.filter((change) => change.review).map((change) => `${file.path}:${change.line} ${change.name}`));
      assert.deepEqual(review, ['index.html:76 .ds-input-group__affix', 'js/app.js:39 detach()', "js/charts.mjs:7 enter(el, 'fill-y')"]);
      const report = formatReport(result);
      assert.match(report, /^To rewrite \(\d+\):$/m);
      assert.match(report, /^To rewrite, check each \(3\):$/m);
      assert.match(report, /^Needs a person \(8\):$/m);
      assert.match(report, /js\/charts\.mjs:4 toast of js\/overlay\.js runs in js\/toast\.js in 3\.0: add import '\.\.\/vendor\/dashboard-style\/js\/toast\.js';/);
      assert.match(report, /css\/theme\.css:14 --ds-btn-sm-height \(removed in 3\.0\.0\): the size and density options compute it from the base --ds-btn-height/);
      assert.match(report, /^migrate: 7 files read, 7 to change \(57 rewrites, 3 to check\), 8 for a person \(to 3\.x, deprecations\.json 3\.0\.0[^)]*\); run again with --write to apply$/m);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rewrites every entry of src/deprecations.json it maps, and lists every other one for a person', () => {
    // A use of each entry as a project would write it; a mapped one is gone afterwards, its replacement in place.
    const sample = (entry) => {
      const name = entry.name.replace(/^\./, '');
      switch (entry.kind) {
        case 'class': return `<span class="ds-x ${name}"></span>\n.app-a .${name} { margin: 0; }\n`;
        case 'token': case 'role': case 'hook': return `.app-a { --x: var(${entry.name}); }\n.ds-theme { ${entry.name}: 1px; }\n`;
        case 'keyframes': return `.app-a { animation: ${entry.name} var(--ds-dur-fast); }\n`;
        case 'attribute': return /^data-[\w-]+$/.test(entry.name) ? `<b ${entry.name}></b>\nel.closest('[${entry.name}]');\n` : '<div class="ds-combo" data-open></div>\n';
        case 'export': return `const h = DS.x.attach(document);\nh.${entry.name.replace(/^DS\.\w+\./, '').replace('()', '')}();\n`;
        default: return null;
      }
    };
    const offenders = [];
    for (const { entry, rule } of RULES) {
      const text = sample(entry);
      if (text === null) continue;
      const result = run(text);
      const left = new RegExp(entry.pattern).test(result.text);
      if (rule.type === 'manual') {
        if (!result.manual.some((item) => item.name === entry.name)) offenders.push(`${entry.name}: manual, but not listed`);
        if (result.text !== text) offenders.push(`${entry.name}: manual, but rewritten`);
      } else {
        if (left) offenders.push(`${entry.name}: still found after the rewrite`);
        const to = (rule.to ?? rule.add?.[0] ?? '').replace(/^\./, '');
        if (to && !result.text.includes(to)) offenders.push(`${entry.name}: ${to} not written`);
      }
    }
    assert.deepEqual(offenders, []);
    // The removed names of 3.0 that are renames all map; what stays manual says why.
    const manual = RULES.filter(({ entry, rule }) => entry.removed === '3.0.0' && rule.type === 'manual').map(({ entry }) => entry.name).sort();
    assert.deepEqual(manual, ['--ds-btn-sm-height', '--ds-btn-sm-icon-size', '--ds-check-sm-height', '--ds-loader-sm-size', '--ds-table-dense-row-height']);
  });

  it('reads an entry by its kind and replacement (ruleFor)', () => {
    assert.deepEqual(ruleFor({ kind: 'class', name: '.ds-a--old', pattern: 'x', replacement: '.ds-a--new' }), { type: 'rename', from: 'ds-a--old', to: 'ds-a--new' });
    assert.deepEqual(ruleFor({ kind: 'class', name: '.ds-a--sm', pattern: 'x', replacement: '.ds-sm' }), { type: 'classes', add: ['ds-sm'], block: 'ds-a' });
    assert.deepEqual(ruleFor({ kind: 'class', name: '.ds-a__b--ok', pattern: 'x', replacement: '.ds-tone-success' }), { type: 'classes', add: ['ds-tone-success'], block: 'ds-a__b' });
    assert.deepEqual(ruleFor({ kind: 'class', name: '.ds-a', pattern: 'x', replacement: 'DS.a.run()' }).type, 'manual');
    assert.deepEqual(ruleFor({ kind: 'hook', name: '--ds-a-old', pattern: 'x', replacement: '--ds-a-new' }), { type: 'rename', from: '--ds-a-old', to: '--ds-a-new' });
    assert.equal(ruleFor({ kind: 'hook', name: '--ds-a-lg-gap', pattern: 'x', replacement: '--ds-a-gap' }).type, 'manual', 'a per-size hook');
    assert.deepEqual(ruleFor({ kind: 'keyframes', name: 'ds-a', pattern: 'x', replacement: 'ds-b' }), { type: 'rename', from: 'ds-a', to: 'ds-b' });
    assert.equal(ruleFor({ kind: 'keyframes', name: 'ds-a', pattern: 'x', replacement: 'ds-b, ds-c' }).type, 'manual');
    assert.deepEqual(ruleFor({ kind: 'attribute', name: 'data-a', pattern: 'x', replacement: 'data-ds-a' }), { type: 'attribute', from: 'data-a', to: 'data-ds-a' });
    assert.deepEqual(ruleFor({ kind: 'export', name: 'DS.a.old()', pattern: 'x', replacement: 'DS.a.fresh()' }), { type: 'export', from: 'old', to: 'fresh' });
    assert.equal(ruleFor({ kind: 'export', name: 'DS.a.old', pattern: 'x', replacement: null }).type, 'manual');
    assert.equal(ruleFor({ kind: 'markup', name: 'a recipe', pattern: null, replacement: 'x' }).type, 'manual');
  });

  it('turns a modifier into its option class: once per class list, joined to its block in a selector', () => {
    assert.equal(run('<b class="ds-btn ds-btn--sm">').text, '<b class="ds-btn ds-sm">');
    assert.equal(run('<b class="ds-btn ds-btn--sm ds-sm">').text, '<b class="ds-btn ds-sm">', 'the option is there already');
    assert.equal(run('<b class="ds-badge ds-badge--ok ds-tone-success x">').text, '<b class="ds-badge ds-tone-success x">');
    assert.equal(run('<b class="ds-btn--sm ds-sm">').text, '<b class="ds-sm">');
    assert.equal(run('.app-a .ds-btn--sm { margin: 0 }').text, '.app-a .ds-btn.ds-sm { margin: 0 }');
    assert.equal(run('.ds-btn.ds-btn--sm:hover, .ds-badge--ok { }').text, '.ds-btn.ds-sm:hover, .ds-badge.ds-tone-success { }');
    assert.equal(run('<i class="ds-spinner ds-spinner--sm">').text, '<i class="ds-spinner ds-spinner--ink ds-sm">');
    assert.equal(run('.ds-spinner--sm { }').text, '.ds-spinner--ink.ds-sm { }', 'the ink modifier names the block');
    assert.equal(run("el.classList.toggle('ds-badge--ok', ok); el.querySelector('.ds-table--dense td');").text,
      "el.classList.toggle('ds-tone-success', ok); el.querySelector('.ds-table.ds-density-tight td');");
  });

  it('renames classes, tokens, hooks, keyframes and attributes wherever they are named', () => {
    assert.equal(run('<b class="ds-btn ds-btn--primary">').text, '<b class="ds-btn ds-btn--filled">');
    assert.equal(run('.ds-card .ds-subsection + .ds-more {}').text, '.ds-card .ds-card__section + .ds-card__more {}');
    assert.equal(run('.ds-theme { --ds-dialog-width-wide: 640px; } a { transition: color 1s var(--ds-ease); }').text,
      '.ds-theme { --ds-dialog-width-lg: 640px; } a { transition: color 1s var(--ds-ease-emphasized); }');
    assert.equal(run('a { animation: ds-fill-x 1s; }').text, 'a { animation: ds-fill-share 1s; }');
    assert.equal(run('<button data-close>x</button> [data-close] {} el.dataset.close; el.dataset.closed;').text,
      '<button data-ds-close>x</button> [data-ds-close] {} el.dataset.dsClose; el.dataset.closed;');
    assert.equal(run('<b data-closer>').text, '<b data-closer>', 'whole names only');
  });

  it('renames a JS export at member calls, named imports and destructuring; a bare call is listed', () => {
    assert.equal(run('DS.indicator.createIndicator(el);').text, 'DS.indicator.create(el);');
    const imported = run("import { a, createIndicator } from './js/indicator.js';\ncreateIndicator(el);\n");
    assert.equal(imported.text, "import { a, create as createIndicator } from './js/indicator.js';\ncreateIndicator(el);\n");
    assert.deepEqual(imported.manual, []);
    assert.equal(run("import { createIndicator as make } from './js/indicator.js';").text, "import { create as make } from './js/indicator.js';");
    assert.equal(run('const { createIndicator } = DS.indicator;').text, 'const { create: createIndicator } = DS.indicator;');
    const destructured = run('const { detach } = DS.ripple.attach(document);\ndetach();\n');
    assert.equal(destructured.text, 'const { destroy: detach } = DS.ripple.attach(document);\ndetach();\n', 'the key is renamed, the local name stays');
    assert.deepEqual(destructured.manual, []);
    const bare = run('createIndicator(el);');
    assert.equal(bare.text, 'createIndicator(el);');
    assert.match(bare.manual[0].message, /createIndicator\(\) \(removed in 3\.0\.0\): use DS\.indicator\.create\(\), or import it as \{ create as createIndicator \}/);
    const detach = run('handle.detach();');
    assert.equal(detach.text, 'handle.destroy();');
    assert.match(detach.changes[0].review, /any detach\(\) call/);
  });

  it('rewrites the event, the variant strings and the settleLoader() clock argument', () => {
    assert.equal(run("el.addEventListener('ds-close', f); emit(el, \"ds-close\");").text, "el.addEventListener('ds:close', f); emit(el, \"ds:close\");");
    assert.equal(run("enter(el, 'fill-x'); enterAll(els, \"fill-y\");").text, "enter(el, 'fill'); enterAll(els, \"fill\");");
    assert.equal(run('settleLoader(start, performance.now());').text, 'settleLoader(start, { now: performance.now() });');
    assert.equal(run('DS.motion.settleLoader(t0, now);').text, 'DS.motion.settleLoader(t0, { now });');
    assert.equal(run('settleLoader(t0, 1200)').text, 'settleLoader(t0, { now: 1200 })');
    assert.equal(run('settleLoader(t0, { now: 5 })').text, 'settleLoader(t0, { now: 5 })', 'the 3.0 form stays');
  });

  it('lists the per-size hooks, removed recipes, run-time class names and the 3.0 changes no name shows', () => {
    const theme = run('.ds-theme {\n  --ds-btn-sm-height: 30px;\n  --ds-check-sm-height: 28px;\n}\n');
    assert.equal(theme.text, '.ds-theme {\n  --ds-btn-sm-height: 30px;\n  --ds-check-sm-height: 28px;\n}\n');
    assert.deepEqual(theme.manual.map((item) => `${item.line} ${item.name}`), ['2 --ds-btn-sm-height', '3 --ds-check-sm-height']);
    assert.match(run('<div class="ds-view ds-view--leaving">').manual[0].message, /\.ds-view--leaving \(deprecated since 2\.0\.0\): use DS\.motion\.transition\(\)/);
    assert.match(run("const c = 'ds-badge--' + kind;").manual[0].message, /a class built at run time from ds-badge--: its values may name ds-badge--neutral, ds-badge--ok/);
    assert.match(run('const c = `ds-alert--${tone}`;').manual[0].message, /ds-alert--success/);
    assert.deepEqual(run('const c = `ds-card--${look}`;').manual, [], 'no removed name starts with the prefix');
    const modules = run("import { toast, open } from './ds/js/overlay.js';\nimport { tooltips } from './ds/js/overlay.js';\nimport './ds/js/tooltip.js';\n");
    assert.deepEqual(modules.manual.map((item) => `${item.line} ${item.message.slice(0, 40)}`), ['1 toast of js/overlay.js runs in js/toast.']);
    assert.match(run('@layer ds.components {\n  .app-a { gap: 0; }\n}\n').manual[0].message, /its own sublayer/);
    assert.deepEqual(run('@layer ds.components.card {\n}\n').manual, [], 'a component sublayer is 3.0 already');
  });

  it('sets "major" in ds-check.json, in the file\'s own layout', () => {
    assert.equal(setMajor('{\n  "prefix": "app"\n}\n', 3), '{\n  "major": 3,\n  "prefix": "app"\n}\n');
    assert.equal(setMajor('{\n\t"prefix": "app"\n}', 3), '{\n\t"major": 3,\n\t"prefix": "app"\n}');
    assert.equal(setMajor('{"prefix":"app"}', 3), '{ "major": 3, "prefix":"app"}');
    assert.equal(setMajor('{ "major": 2, "prefix": "app" }', 3), '{ "major": 3, "prefix": "app" }');
    assert.equal(setMajor('{}', 3), '{ "major": 3 }');
    for (const text of ['{\n  "prefix": "app"\n}\n', '{"prefix":"app"}', '{}']) assert.equal(JSON.parse(setMajor(text, 3)).major, 3);
    assert.equal(majorOf('3.0.0-alpha.5'), 3);
    assert.equal(majorOf('next'), null);
  });

  it('writes a unified diff with three lines of context', () => {
    const before = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'].join('\n');
    const after = before.replace('b', 'B').replace('l', 'L');
    assert.equal(unifiedDiff('x.css', before, before), '');
    assert.equal(unifiedDiff('x.css', before, after), [
      '--- a/x.css', '+++ b/x.css',
      '@@ -1,5 +1,5 @@', ' a', '-b', '+B', ' c', ' d', ' e',
      '@@ -9,5 +9,5 @@', ' i', ' j', ' k', '-l', '+L', ' m', '',
    ].join('\n'));
    assert.equal(unifiedDiff('c.json', '{\n  "a": 1\n}\n', '{\n  "major": 3,\n  "a": 1\n}\n'), [
      '--- a/c.json', '+++ b/c.json', '@@ -1,4 +1,5 @@', ' {', '+  "major": 3,', '   "a": 1', ' }', ' ', '',
    ].join('\n'));
  });

  it('reads the files of ds-check.json, named files, folders and globs; never a copy, node_modules, a minified file or a file the system wrote', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-files-'));
    try {
      const put = (path, text) => {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), text);
      };
      put('index.html', '<b class="ds-btn ds-btn--primary">');
      put('src/app.ts', "el.classList.add('ds-btn--primary');");
      put('src/app.min.js', "el.classList.add('ds-btn--primary');");
      put('src/notes.md', 'ds-btn--primary');
      put('node_modules/x/index.js', "'ds-btn--primary'");
      put('public/ds/SHA256SUMS', '');
      put('public/ds/deprecations.json', '{}');
      put('public/ds/ds.css', '.ds-btn--primary {}');
      put('public/ds.bundle.css', '/*! Dashboard-Style 3.0.0 | bundle */\n.ds-btn--primary {}');
      assert.deepEqual(collectFiles(dir), ['index.html', 'public/ds.bundle.css', 'src/app.ts']);
      assert.deepEqual(collectFiles(dir, { targets: ['src'] }), ['src/app.ts']);
      assert.deepEqual(collectFiles(dir, { targets: ['src/notes.md'] }), ['src/notes.md']);
      assert.deepEqual(collectFiles(dir, { targets: ['**/*.ts'] }), ['src/app.ts']);
      assert.deepEqual(collectFiles(dir, { config: { html: ['*.html'], js: ['src/**/*.ts'], vendor: 'public/ds' } }), ['index.html', 'src/app.ts']);
      assert.throws(() => collectFiles(dir, { targets: ['nope'] }), /nope: no such file or folder/);
      const result = migrate({ root: dir, deprecations: DEPRECATIONS, write: true });
      assert.deepEqual(result.files.map((file) => file.path), ['index.html', 'src/app.ts'], 'the bundle is skipped by its banner');
      assert.equal(readFileSync(join(dir, 'public/ds.bundle.css'), 'utf8'), '/*! Dashboard-Style 3.0.0 | bundle */\n.ds-btn--primary {}');
      assert.equal(readFileSync(join(dir, 'src/app.min.js'), 'utf8'), "el.classList.add('ds-btn--primary');");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('runs as a CLI: diff and report, --write, --json, exit 0 when nothing is left, 1 when something is, 2 on a usage error', () => {
    const dir = projectCopy();
    const depsDir = mkdtempSync(join(tmpdir(), 'ds-migrate-deps-'));
    const deps = join(depsDir, 'deprecations.json');
    try {
      writeFileSync(deps, JSON.stringify(DEPRECATIONS));
      const dry = cli(['--config', 'ds-check.json', '--deprecations', deps], dir);
      assert.equal(dry.code, 1);
      assert.match(dry.out, /^--- a\/css\/app\.css\n\+\+\+ b\/css\/app\.css\n@@ /m);
      assert.match(dry.out, /^-\.app-toolbar \.ds-btn--sm \{\n\+\.app-toolbar \.ds-btn\.ds-sm \{$/m);
      const json = JSON.parse(cli(['--config', 'ds-check.json', '--deprecations', deps, '--json'], dir).out);
      assert.equal(json.exit, 1);
      assert.equal(json.write, false);
      assert.equal(json.files.find((file) => file.path === 'css/theme.css').manual.length, 3);
      assert.equal(cli(['--config', 'ds-check.json', '--deprecations', deps, '--write', '--no-diff'], dir).code, 1, 'written, but something is left for a person');
      assert.equal(readFileSync(join(dir, 'index.html'), 'utf8'), read('test/fixtures/migrate/expected/index.html'));
      // Only the CSS of the project, after a person dealt with the manual items: nothing left.
      writeFileSync(join(dir, 'css/theme.css'), '.ds-theme {\n  --ds-btn-height: 38px;\n}\n');
      writeFileSync(join(dir, 'css/app.css'), '.app-a { gap: var(--ds-space-1); }\n');
      const clean = cli(['css', '--deprecations', deps], dir);
      assert.equal(clean.code, 0, clean.out);
      assert.match(clean.out, /^migrate: 2 files read, 0 to change \(0 rewrites, 0 to check\), 0 for a person/m);
      assert.equal(cli(['--bogus'], dir).code, 2);
      assert.equal(cli(['--config', 'missing.json', '--deprecations', deps], dir).code, 2);
      assert.equal(cli(['nope', '--deprecations', deps], dir).code, 2);
      assert.equal(cli(['--deprecations', join(dir, 'none.json')], dir).code, 2);
    } finally {
      rmSync(depsDir, { recursive: true, force: true });
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('runs from a built copy with the copy\'s own deprecations.json', () => {
    const copy = mkdtempSync(join(tmpdir(), 'ds-migrate-copy-'));
    const dir = projectCopy();
    try {
      // The two files the tool reads in a copy: itself in tools/, and deprecations.json as the build writes it.
      mkdirSync(join(copy, 'tools'));
      writeFileSync(join(copy, 'tools/migrate.mjs'), withBanner('tools/migrate.mjs', read('scripts/tools/migrate.mjs'), packageInfo()));
      writeFileSync(join(copy, 'deprecations.json'), deprecationsJson(read('src/deprecations.json'), packageInfo()));
      const result = spawnSync(process.execPath, [join(copy, 'tools/migrate.mjs'), '--config', 'ds-check.json', '--no-diff'], { cwd: dir, encoding: 'utf8' });
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stdout, /^migrate: 7 files read, 7 to change/m);
    } finally {
      rmSync(copy, { recursive: true, force: true });
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
