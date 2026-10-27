/**
 * tools/check-project.mjs on small projects built in a temporary folder:
 * one that keeps every rule, and one finding per rule for those that break
 * them; exceptions, the CLI, and the lists the tool shares with the docs
 * (the rule ids of the AGENTS.md project block, the system attributes of
 * the "Attributes" table of docs/components.md).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../scripts/build.mjs';
import { checkProject, globRegExp, literalKinds, RULES, SYSTEM_ATTRIBUTES } from '../scripts/tools/check-project.mjs';
import { read } from './helpers.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const VENDOR = 'vendor/dashboard-style';

/** Rewrites the copy's SHA256SUMS (after a test added a file to it on purpose). */
function resum(dir) {
  const paths = [];
  const walk = (prefix) => {
    for (const name of readdirSync(join(dir, prefix), { withFileTypes: true })) {
      const path = prefix ? `${prefix}/${name.name}` : name.name;
      if (name.isDirectory()) walk(path);
      else if (name.name !== 'SHA256SUMS') paths.push(path);
    }
  };
  walk('');
  paths.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  writeFileSync(join(dir, 'SHA256SUMS'), `${paths.map((path) => `${createHash('sha256').update(readFileSync(join(dir, path))).digest('hex')}  ${path}`).join('\n')}\n`);
}

/** A project folder with the copy (as built) and `files` ({ path: text }); returns its root. */
function project(files, { deprecations } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ds-project-'));
  for (const [path, content] of build()) {
    mkdirSync(dirname(join(root, VENDOR, path)), { recursive: true });
    writeFileSync(join(root, VENDOR, path), content);
  }
  if (deprecations) {
    writeFileSync(join(root, VENDOR, 'deprecations.json'), JSON.stringify(deprecations));
    resum(join(root, VENDOR));
  }
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const CONFIG = { prefix: 'app', css: ['css/**/*.css'], js: ['js/**/*.js'], html: ['*.html'], themes: ['css/theme.css'], vendor: VENDOR };

const CLEAN = {
  'index.html': [
    '<!doctype html><html class="ds-theme ds-base" lang="en"><head>',
    `<link rel="stylesheet" href="${VENDOR}/ds.css"><link rel="stylesheet" href="css/theme.css"><link rel="stylesheet" href="css/app.css">`,
    '</head><body><div class="ds-app"><main class="ds-view"><div class="ds-card app-panel"><button class="ds-btn ds-btn--primary" type="button">Save</button></div></main></div></body></html>',
  ].join('\n'),
  'css/theme.css': '.ds-theme {\n  --ds-primary: #1d4e89;\n  --app-logo-size: 32px;\n}\n',
  'css/app.css': [
    '@layer reset, ds, app;',
    '@layer reset {',
    '  button { font: inherit; }',
    '}',
    '.app-panel {',
    '  padding: var(--ds-space-4);',
    '  color: var(--ds-text);',
    '  border-radius: var(--ds-radius-card);',
    '  transition: opacity var(--ds-dur-fast) var(--ds-ease-in-out);',
    '  animation: ds-fade-in var(--ds-dur-fast) var(--ds-ease-in-out) both;',
    '}',
    '.app-panel .ds-btn {',
    '  --ds-btn-height: 40px;',
    '  margin-inline-start: auto;',
    '  scroll-margin-block: var(--ds-space-4);',
    '}',
    // .ds-touch is a scope like .ds-theme: what sits under it is not restyled through it.
    '.ds-touch .app-panel > header {',
    '  gap: var(--ds-space-2);',
    '}',
  ].join('\n'),
  'js/app.js': [
    "const list = document.querySelector('.ds-card');",
    "DS.dom.morphHtml(list, '<p class=\"ds-muted\">Saved</p>');",
    "list.classList.add('ds-stale');",
    "const chip = `<span class=\"ds-status ds-status--${tone}\">`;",
    "DS.overlay.toast(region, 'Saved', { reserve: false });",
    "region.setAttribute('data-toast-reserve', '');",
  ].join('\n'),
};

function run(files, config = CONFIG, options) {
  const root = project(files, options);
  try {
    return checkProject(config, root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const summary = (findings) => findings.map((f) => `${f.level} ${f.rule} ${f.file}:${f.line}`).sort();

describe('tools/check-project.mjs', () => {
  it('passes a project that keeps every rule', () => {
    const { findings, errors } = run(CLEAN);
    assert.deepEqual(errors, []);
    assert.deepEqual(summary(findings), []);
  });

  it('finds each broken rule, with its file and line', () => {
    const deprecations = {
      version: '9.9.9',
      names: [
        { kind: 'class', name: '.ds-old', pattern: '(?<![\\w-])ds-old(?![\\w-])', replacement: '.ds-new', deprecated: '1.0.0', removed: '2.0.0' },
        { kind: 'class', name: '.ds-view--leaving', pattern: '(?<![\\w-])ds-view--leaving(?![\\w-])', replacement: 'DS.motion.transition()', deprecated: '2.0.0', removed: null },
      ],
    };
    const files = {
      ...CLEAN,
      'index.html': `${CLEAN['index.html']}\n<div class="ds-cardd ds-view--leaving"></div>\n<div class="ds-old"></div>\n`,
      'single.html': `<link rel="stylesheet" href="${VENDOR}/css/tokens.css"><link rel="stylesheet" href="${VENDOR}/css/components/button.css">\n<div class="ds-card"></div>\n`,
      'css/theme.css': '.ds-theme {\n  --ds-dur-fast: 1ms;\n}\n',
      'css/app.css': [
        'button { border: 0; }',                                             // 1 layers
        '[hidden] { display: none; }',                                       // 2 hidden
        '.app-x {',                                                          // 3
        '  color: #ffffff;',                                                 // 4 literals colour
        '  border-radius: 6px;',                                             // 5 literals radius
        '  font-size: 13px;',                                                // 6 literals font
        '  box-shadow: 0 1px 2px var(--ds-scrim);',                          // 7 literals shadow
        '  transition: opacity 200ms ease;',                                 // 8 literals duration, curve
        '  animation: app-spin var(--ds-loop-spin) infinite;',               // 9 keyframes
        '  margin: 0 !important;',                                           // 10 layers
        '}',
        '@keyframes app-spin { to { rotate: 1turn; } }',                     // 12 keyframes
        '.ds-btn { border-radius: 4px; }',                                   // 13 restyle
        '.app-bar .ds-chip { background: var(--ds-surface); margin: 0; }',   // 14 restyle (margin is placement)
        '.ds-card p { color: var(--ds-text-2); }',                           // 15 restyle
        '.app-tile::before { background: currentColor; opacity: var(--ds-state-hover); }', // 16 pressable
        '.ds-nope { --ds-btn-height: 40px; }',                               // 17 classes
      ].join('\n'),
      'js/app.js': [
        "view.setAttribute('data-scrolled', '');",                           // 1 attributes
        "row.toggleAttribute('data-ds-dragging', true);",                    // 2 attributes
        "region.setAttribute('data-toast-reserve', '');",                    // 3 attributes (no reserve: false here)
        "list.innerHTML = '<li class=\"ds-list__row\">x</li>';",              // 4 dom (and classes: no such class here)
        "document.querySelector('.ds-gone');",                               // 5 classes
      ].join('\n'),
    };
    const { findings } = run(files, CONFIG, { deprecations });
    const by = (rule) => findings.filter((f) => f.rule === rule).map((f) => `${f.level} ${f.file}:${f.line}`).sort();
    assert.deepEqual(by('vendor'), []);
    assert.deepEqual(by('deprecated'), ['error index.html:5', 'warning index.html:4']);
    assert.deepEqual(by('layers'), ['error css/app.css:1', 'error css/app.css:10']);
    assert.deepEqual(by('hidden'), ['error css/app.css:2']);
    assert.deepEqual(by('literals'), ['error css/app.css:4', 'error css/app.css:5', 'error css/app.css:6', 'error css/app.css:7', 'error css/app.css:8', 'error css/app.css:8']);
    assert.deepEqual(by('keyframes'), ['error css/app.css:12', 'error css/app.css:9']);
    assert.deepEqual(by('restyle'), ['error css/app.css:13', 'error css/app.css:14', 'error css/app.css:15']);
    assert.deepEqual(by('pressable'), ['warning css/app.css:16']);
    assert.deepEqual(by('themes'), ['error css/theme.css:2']);
    assert.deepEqual(by('attributes'), ['error js/app.js:1', 'error js/app.js:2', 'error js/app.js:3']);
    assert.deepEqual(by('dom'), ['warning js/app.js:4']);
    const classes = findings.filter((f) => f.rule === 'classes').map((f) => `${f.file}:${f.line} ${f.message}`).sort();
    assert.ok(classes.some((m) => m.startsWith('index.html:4 .ds-cardd ')), classes.join('\n'));
    assert.ok(classes.some((m) => m.startsWith('single.html:2 .ds-card needs css/components/card.css')), classes.join('\n'));
    assert.ok(classes.some((m) => m.startsWith('css/app.css:17 .ds-nope ')), classes.join('\n'));
    assert.ok(classes.some((m) => m.startsWith('js/app.js:5 .ds-gone ')), classes.join('\n'));
    assert.ok(!classes.some((m) => m.includes('.ds-old ')), 'a removed name is reported once, by deprecated');
    assert.match(findings.find((f) => f.rule === 'literals' && f.line === 8 && /curve/.test(f.message)).message, /read a token/);
  });

  it('fails a copy that does not verify', () => {
    const root = project(CLEAN);
    try {
      writeFileSync(join(root, VENDOR, 'ds.css'), '/* edited */\n');
      const { findings } = checkProject(CONFIG, root);
      assert.deepEqual(findings.filter((f) => f.rule === 'vendor').map((f) => f.message), ['changed: ds.css']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('silences a finding by an exception with a reason, and refuses one without', () => {
    const files = { ...CLEAN, 'css/app.css': '.app-bar .ds-btn { color: var(--ds-on-primary); }\n' };
    assert.equal(run(files).findings.filter((f) => f.rule === 'restyle').length, 1);
    const excepted = { ...CONFIG, exceptions: [{ rule: 'restyle', file: 'css/*.css', selector: '.app-bar .ds-btn', reason: 'the bar is dark; the hook lands in 2.1' }] };
    assert.deepEqual(run(files, excepted).findings, []);
    const other = { ...CONFIG, exceptions: [{ rule: 'restyle', file: 'css/app.css', selector: '.app-other .ds-btn', reason: 'another selector' }] };
    assert.equal(run(files, other).findings.length, 1, 'only the excepted selector');
    const { errors } = run(files, { ...CONFIG, exceptions: [{ rule: 'restyle', file: 'css/app.css' }] });
    assert.match(errors.join('\n'), /reason/);
    assert.match(run(files, { ...CONFIG, exceptions: [{ rule: 'nope', file: 'x', reason: 'y' }] }).errors.join('\n'), /unknown rule "nope"/);
  });

  it('checks the themes together with the shipped themes of "themesWith"', () => {
    const files = { ...CLEAN, 'css/theme.css': '.ds-theme { --ds-primary: #0b57d0; }\n.ds-theme[data-app-dark] { --ds-primary: #a8c7fa; --ds-on-primary: #062e6f; }\n' };
    assert.ok(run(files).findings.some((f) => f.rule === 'themes' && f.message.includes('[data-app-dark]')), 'a dark variant over the light base warns');
    assert.deepEqual(run(files, { ...CONFIG, themesWith: [`${VENDOR}/themes/dark.css`] }).findings, [], 'with the dark theme it passes');
    const missing = run(files, { ...CONFIG, themesWith: ['css/dark.css'] }).findings;
    assert.deepEqual(missing.filter((f) => f.level === 'error').map((f) => `${f.file} ${f.rule}`), ['css/dark.css themes']);
  });

  it('runs as a CLI from the copy: file:line rule message, exit 1 on an error, 2 on a bad config', () => {
    const root = project({ ...CLEAN, 'css/app.css': '.app-x { color: red; }\n', 'ds-check.json': JSON.stringify(CONFIG) });
    try {
      const tool = join(root, VENDOR, 'tools/check-project.mjs');
      const failed = spawnSync(process.execPath, [tool, '--config', join(root, 'ds-check.json')], { encoding: 'utf8' });
      assert.equal(failed.status, 1, failed.stderr);
      assert.match(failed.stderr, /^css\/app\.css:1 literals \.app-x \{ color: red \}: a colour literal/m);
      writeFileSync(join(root, 'css/app.css'), '.app-x { color: var(--ds-text); }\n');
      const passed = spawnSync(process.execPath, [tool, '--config', join(root, 'ds-check.json')], { encoding: 'utf8' });
      assert.equal(passed.status, 0, passed.stderr);
      assert.match(passed.stdout, /check-project: 0 errors, 0 warnings/);
      writeFileSync(join(root, 'ds-check.json'), JSON.stringify({ ...CONFIG, prefix: '' }));
      assert.equal(spawnSync(process.execPath, [tool, '--config', join(root, 'ds-check.json')], { encoding: 'utf8' }).status, 2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reads globs and literals the way the docs say', () => {
    assert.ok(globRegExp('css/**/*.css').test('css/app.css'));
    assert.ok(globRegExp('css/**/*.css').test('css/parts/list.css'));
    assert.ok(!globRegExp('css/*.css').test('css/parts/list.css'));
    assert.ok(globRegExp('page?.html').test('page1.html'));
    assert.deepEqual(literalKinds('color', 'var(--ds-text)'), []);
    assert.deepEqual(literalKinds('border-radius', '0'), []);
    assert.deepEqual(literalKinds('border-radius', 'var(--ds-radius-card, 12px)'), [], 'a fallback inside var() is not a literal');
    assert.deepEqual(literalKinds('transition', 'opacity var(--ds-dur-fast) var(--ds-ease-in-out)'), []);
    assert.deepEqual(literalKinds('font', 'var(--ds-font-body)'), []);
    assert.deepEqual(literalKinds('font-size', 'inherit'), []);
    assert.deepEqual(literalKinds('box-shadow', 'none'), []);
    assert.deepEqual(literalKinds('box-shadow', 'inset 0 0 0 1px var(--ds-line)'), [], 'a hairline ring in a token colour');
    assert.deepEqual(literalKinds('box-shadow', '0 2px 6px var(--ds-scrim)'), ['shadow'], 'an elevation of its own');
    assert.deepEqual(literalKinds('background', 'color-mix(in srgb, var(--ds-text) 8%, transparent)'), ['colour'], 'a mix of tokens is still a new colour: make it a token');
    // `linear` is the curve of the system's loops (no token for it), and nothing runs in 0s.
    assert.deepEqual(literalKinds('animation', 'ds-spin var(--ds-loop-spin) linear infinite'), [], 'a ds loop runs linear');
    assert.deepEqual(literalKinds('animation-timing-function', 'linear', 'animation-name:ds-spin;animation-duration:var(--ds-loop-spin);animation-timing-function:linear'), [], 'the longhand of a loop');
    assert.deepEqual(literalKinds('transition', 'visibility 0s linear var(--ds-dur-fast), opacity var(--ds-dur-fast) var(--ds-ease-out)'), [], 'a 0s step');
    assert.deepEqual(literalKinds('animation-timing-function', 'linear'), ['curve'], 'linear outside a loop');
    assert.deepEqual(literalKinds('transition', 'opacity var(--ds-dur-fast) linear'), ['curve'], 'linear on a motion duration');
    assert.deepEqual(literalKinds('animation', 'ds-spin var(--ds-loop-spin) cubic-bezier(0, 0, 1, 1) infinite'), ['curve'], 'a curve of its own on a loop');
    assert.deepEqual(literalKinds('transition', 'opacity 200ms ease'), ['duration', 'curve']);
  });

  it('maps a class to a stylesheet that defines it, not one that only places it', () => {
    const files = {
      // alert.css places a button (.ds-alert .ds-btn) and comes first; .ds-theme is in tokens.css; css/index.css imports all.
      'button.html': `<link rel="stylesheet" href="${VENDOR}/css/tokens.css"><link rel="stylesheet" href="${VENDOR}/css/components/button.css">\n<body class="ds-theme"><button class="ds-btn" type="button">Save</button></body>\n`,
      'alert.html': `<link rel="stylesheet" href="${VENDOR}/css/tokens.css"><link rel="stylesheet" href="${VENDOR}/css/components/alert.css">\n<body class="ds-theme"><button class="ds-btn" type="button">Save</button></body>\n`,
      'bare.html': `<link rel="stylesheet" href="${VENDOR}/css/components/button.css">\n<body class="ds-theme"><button class="ds-btn" type="button">Save</button></body>\n`,
      'index.html': `<link rel="stylesheet" href="${VENDOR}/css/index.css">\n<body class="ds-theme"><div class="ds-card"><button class="ds-btn" type="button">Save</button></div></body>\n`,
      // .ds-link-btn is defined in button.css (no longer in table.css): a page without the table has it whole.
      'link.html': `<link rel="stylesheet" href="${VENDOR}/css/tokens.css"><link rel="stylesheet" href="${VENDOR}/css/components/button.css">\n<body class="ds-theme"><p>See <button class="ds-link-btn ds-link-btn--quiet" type="button">the log</button>.</p></body>\n`,
      'table.html': `<link rel="stylesheet" href="${VENDOR}/css/tokens.css"><link rel="stylesheet" href="${VENDOR}/css/components/table.css">\n<body class="ds-theme"><table class="ds-table"><tr><td><button class="ds-link-btn" type="button">LAPTOP-0042</button></td></tr></table></body>\n`,
    };
    const { findings } = run(files, { ...CONFIG, html: ['*.html'], themes: [] });
    assert.deepEqual(findings.map((f) => `${f.file}:${f.line} ${f.rule} ${f.message}`).sort(), [
      'alert.html:2 classes .ds-btn needs css/components/button.css, which this page does not link',
      'bare.html:2 classes .ds-theme needs css/tokens.css, which this page does not link',
      'table.html:2 classes .ds-link-btn needs css/components/button.css, which this page does not link',
    ]);
  });

  it('leaves the 1.x hand data-scrolled recipe to deprecated: a warning, not an attributes error', () => {
    const files = {
      'js/app.js': [
        'new IntersectionObserver(([entry]) => {',
        "  app.toggleAttribute('data-scrolled', !entry.isIntersecting);",
        '}).observe(sentinel);',
        'app.dataset.scrolled = "";',
        "row.setAttribute('data-ds-dragging', '');",
      ].join('\n'),
    };
    const { findings } = run(files, { ...CONFIG, html: [], css: [], themes: [] });
    assert.deepEqual(findings.map((f) => `${f.level} ${f.file}:${f.line} ${f.rule}`).sort(), [
      'error js/app.js:5 attributes',
      'warning js/app.js:2 deprecated',
      'warning js/app.js:4 deprecated',
    ]);
    assert.match(findings.find((f) => f.rule === 'deprecated').message, /DS\.dom\.watchScrolled\(view\)/);
  });

  // The published pages never show a deprecated or hand-built pattern (AGENTS.md): no error and no warning.
  const published = (folder) => Object.fromEntries(readdirSync(join(ROOT, folder)).filter((name) => /\.(css|js|html)$/.test(name)).map((name) => [`${folder}/${name}`, read(`${folder}/${name}`)]));
  it('passes the reference app without a finding (example/ keeps the project rules, AGENTS.md)', () => {
    const config = { prefix: 'ex', css: ['example/*.css'], js: ['example/*.js'], html: ['example/*.html'], themes: ['example/theme.css'], themesWith: [`${VENDOR}/themes/dark.css`], vendor: VENDOR };
    const { findings, errors } = run(published('example'), config);
    assert.deepEqual(errors, []);
    assert.deepEqual(findings.map((f) => `${f.file}:${f.line} ${f.rule} ${f.message}`), []);
  });

  it('passes the live tour without a finding (demo/ is wired as a project wires it)', () => {
    const config = { prefix: 'demo', css: ['demo/*.css'], js: ['demo/*.js'], html: ['demo/*.html'], vendor: VENDOR };
    const { findings, errors } = run(published('demo'), config);
    assert.deepEqual(errors, []);
    assert.deepEqual(findings.map((f) => `${f.file}:${f.line} ${f.rule} ${f.message}`), []);
  });

  it('keeps its rule ids in the AGENTS.md project block and its system attributes in the Attributes table', () => {
    const agents = read('AGENTS.md');
    const block = agents.slice(agents.indexOf('## Design system: Dashboard-Style'), agents.indexOf('```', agents.indexOf('## Design system: Dashboard-Style')));
    const listed = /check-project\.mjs[\s\S]*?rules ([^)]*)\)/.exec(block)?.[1] ?? '';
    assert.deepEqual([...listed.matchAll(/`([\w-]+)`/g)].map((match) => match[1]), RULES);
    const components = read('docs/components.md');
    const table = components.slice(components.indexOf('## Attributes'));
    const system = table.split('\n').filter((line) => /^\| `data-[\w-]+`/.test(line) && /^\| [^|]+\| the system\b/.test(line)).map((line) => /`(data-[\w-]+)`/.exec(line)[1]);
    assert.deepEqual(system, SYSTEM_ATTRIBUTES);
  });
});
