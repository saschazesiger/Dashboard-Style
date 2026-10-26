/**
 * The tools a project runs on its copy (scripts/tools/, shipped in
 * dist/tools/): verify.mjs and verify.sh against SHA256SUMS (the rules of
 * vendor.sh --check), and check-theme.mjs on theme files.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { build, packageInfo, tokensJson } from '../scripts/build.mjs';
import { checkTheme } from '../scripts/tools/check-theme.mjs';
import { CONTROL_PAIRS, ICON_PAIRS, MOTION_FAMILIES, TEXT_PAIRS } from '../scripts/tools/theme-rules.mjs';
import { verify } from '../scripts/tools/verify.mjs';
import { read, ROOT } from './helpers.js';

const SH = process.platform !== 'win32';

/** A fresh copy of what dist/ builds into a temporary folder; `vendored` adds VERSION (in SHA256SUMS, as vendor.sh writes it). */
function copyOfDist({ vendored = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'ds-copy-'));
  const out = build();
  for (const [path, content] of out) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  if (vendored) {
    writeFileSync(join(dir, 'VERSION'), 'version 9.9.9\nsource local\ncommit none\n');
    const paths = [...out.keys(), 'VERSION'].filter((path) => path !== 'SHA256SUMS').sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
    const line = (path) => `${createHash('sha256').update(readFileSync(join(dir, path))).digest('hex')}  ${path}`;
    writeFileSync(join(dir, 'SHA256SUMS'), `${paths.map(line).join('\n')}\n`);
  }
  return dir;
}

/** Runs the three checks on `dir`: [verify.mjs as a CLI, verify.sh, vendor.sh --check] exit codes. */
function checks(dir) {
  const node = spawnSync(process.execPath, [join(dir, 'tools/verify.mjs')], { encoding: 'utf8' });
  if (!SH) return { node: node.status };
  const sh = spawnSync('sh', [join(dir, 'tools/verify.sh')], { encoding: 'utf8' });
  const vendor = spawnSync('sh', [join(ROOT, 'scripts/vendor.sh'), '--check', dir], { encoding: 'utf8' });
  return { node: node.status, sh: sh.status, vendor: vendor.status, out: `${node.stderr}${sh.stderr}${vendor.stderr}` };
}

/** The CLI of verify.mjs alone (the shell checks spawn a process per file: they run on the main cases only). */
function expectNode(dir, status) {
  const node = spawnSync(process.execPath, [join(dir, 'tools/verify.mjs')], { encoding: 'utf8' });
  assert.equal(node.status, status, node.stderr);
}

function expectAll(dir, status) {
  const result = checks(dir);
  const { out, ...codes } = result;
  for (const [tool, code] of Object.entries(codes)) assert.equal(code, status, `${tool}: exit ${code}\n${out ?? ''}`);
  return out ?? '';
}

describe('tools/verify.mjs and tools/verify.sh', () => {
  for (const vendored of [false, true]) {
    const kind = vendored ? 'a vendored copy (VERSION listed)' : 'a dist/ as built';
    it(`accept ${kind} and name what was tampered with, added, removed or linked`, () => {
      const dir = copyOfDist({ vendored });
      try {
        assert.deepEqual(verify(dir).problems, []);
        if (vendored) assert.equal(verify(dir).version, '9.9.9');
        expectAll(dir, 0);

        const css = join(dir, 'ds.css');
        const original = readFileSync(css);
        writeFileSync(css, Buffer.concat([original, Buffer.from('\n/* edited */\n')]));
        assert.deepEqual(verify(dir).problems, ['changed: ds.css']);
        expectAll(dir, 1);
        writeFileSync(css, original);

        writeFileSync(join(dir, 'js', 'extra.js'), '// added\n');
        assert.deepEqual(verify(dir).problems, ['not listed (added): js/extra.js']);
        expectNode(dir, 1);
        unlinkSync(join(dir, 'js', 'extra.js'));

        const font = join(dir, 'fonts', 'OFL.txt');
        const ofl = readFileSync(font);
        unlinkSync(font);
        assert.deepEqual(verify(dir).problems, ['missing: fonts/OFL.txt']);
        expectNode(dir, 1);
        writeFileSync(font, ofl);

        if (SH) {
          symlinkSync('../ds.css', join(dir, 'js', 'link.css'));
          assert.match(verify(dir).problems.join('\n'), /symbolic link[^\n]*js\/link\.css/);
          const out = expectAll(dir, 1);
          assert.match(out, /symbolic link/);
          unlinkSync(join(dir, 'js', 'link.css'));
        }
        expectNode(dir, 0);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  it('hold the documented SHA256SUMS format: two spaces, relative paths, byte order, LF (a CR is forgiven)', () => {
    const dir = copyOfDist();
    try {
      const sums = join(dir, 'SHA256SUMS');
      const good = readFileSync(sums, 'utf8');
      writeFileSync(sums, good.replace(/\n/g, '\r\n'));
      assert.deepEqual(verify(dir).problems, [], 'CRLF line ends verify (a Windows checkout)');
      expectNode(dir, 0);
      writeFileSync(sums, good.replace('  ds.css', ' ds.css'));
      assert.match(verify(dir).problems.join('\n'), /not "<sha256>  <path>"/);
      expectAll(dir, 1);
      const lines = good.trimEnd().split('\n');
      writeFileSync(sums, `${[lines[1], lines[0], ...lines.slice(2)].join('\n')}\n`);
      assert.match(verify(dir).problems.join('\n'), /not sorted/);
      expectNode(dir, 1);
      writeFileSync(sums, good.replace(/  ds\.css$/m, '  ./ds.css'));
      assert.ok(verify(dir).problems.length > 0, 'a ./ path is not the format');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('runs check_dir of vendor.sh word for word in tools/verify.sh (the same check)', () => {
    const fn = (source, name) => {
      const start = source.indexOf(`\n${name}() {`);
      assert.ok(start >= 0, `${name}()`);
      // One-line functions end on their line; the others at the first line that is a lone "}".
      const line = source.slice(start + 1, source.indexOf('\n', start + 1));
      if (line.trimEnd().endsWith('}')) return line;
      return source.slice(start + 1, source.indexOf('\n}\n', start) + 2);
    };
    const vendor = read('scripts/vendor.sh');
    const tool = read('scripts/tools/verify.sh');
    for (const name of ['die', 'sha256', 'sums', 'check_dir']) assert.equal(fn(tool, name), fn(vendor, name), name);
  });
});

describe('tools/check-theme.mjs', () => {
  const tokens = JSON.parse(tokensJson(packageInfo()));
  const deprecations = {
    names: [
      { kind: 'token', name: '--ds-old-role', pattern: '(?<![\\w-])--ds-old-role(?![\\w-])', replacement: '--ds-new-role', deprecated: '1.0.0', removed: '2.0.0' },
      { kind: 'hook', name: '--ds-btn-height', pattern: '(?<![\\w-])--ds-btn-height(?![\\w-])', replacement: '--ds-btn-size', deprecated: '1.9.0', removed: null },
    ],
  };
  const check = (css, extra = {}) => checkTheme({ files: [{ path: 'theme.css', css }], tokens, deprecations, ...extra });
  const rules = (findings, level) => findings.filter((f) => f.level === level).map((f) => `${f.line} ${f.rule}`);

  it('passes the template, the shipped themes and the reference app theme without an error', () => {
    for (const file of ['themes/example.css', 'themes/dark.css', 'themes/contrast.css', 'themes/compact.css', 'example/theme.css']) {
      // The compact hooks of other 2.0 packages are unknown until they merge (tables: WP5, tabs: WP9).
      const errors = check(read(file)).filter((f) => f.level === 'error' && !/--ds-(table-head|table-row|tabs)-height/.test(f.message));
      assert.deepEqual(errors, [], file);
    }
    assert.deepEqual(rules(check(read('themes/dark.css')), 'warning'), [], 'dark.css keeps its pairs');
  });

  it('fails on the rules of docs/theming.md, each with its line', () => {
    const css = [
      '@layer theme;',
      ':root { --ds-primary: #123456; }',
      '.ds-theme {',
      '  --ds-dur-fast: 100ms;',
      '  --ds-enter-distance: 4px;',
      '  --ds-primray: #0b57d0;',
      '  --ds-surface: #fff !important;',
      '  --ds-font-input: var(--ds-font-body);',
      '  --ds-old-role: red;',
      '  --ds-btn-height: 40px;',
      '  --ds-space-4: 20px;',
      '  --app-own-token: 1px;',
      '}',
      '.ds-btn--primary { border-radius: 0; --ds-btn-bg: #000; }',
      '.app-card { color: red; }',
    ].join('\n');
    const findings = check(css);
    assert.deepEqual(rules(findings, 'error').sort(), ['0 input-font', '1 layer', '2 root', '4 motion', '5 motion', '6 unknown', '7 important', '9 removed'].sort());
    assert.deepEqual(rules(findings, 'warning').sort(), ['10 deprecated', '11 not-themeable', '14 restyle'].sort());
    assert.match(findings.find((f) => f.rule === 'removed').message, /removed in 2\.0\.0: use --ds-new-role/);
    assert.match(findings.find((f) => f.rule === 'deprecated').message, /use --ds-btn-size/);
    assert.match(findings.find((f) => f.rule === 'input-font').message, /14px/);
  });

  it('checks the contrast pairs with var(), color-mix() and variants, and says what it cannot resolve', () => {
    const weak = check('.ds-theme { --ds-text-2: #9aa0a6; --ds-primary: color-mix(in srgb, #0b57d0 30%, white); }');
    const warned = weak.filter((f) => f.rule === 'contrast' && f.level === 'warning').map((f) => f.message);
    assert.ok(warned.some((m) => m.startsWith('--ds-text-2 on --ds-surface:')), warned.join('\n'));
    assert.ok(warned.some((m) => m.startsWith('--ds-on-primary on --ds-primary:')), 'the mixed primary is resolved');
    const variant = check('.ds-theme { --ds-primary: #0b57d0; }\n.ds-theme[data-brand="pale"] { --ds-primary: #a8c7fa; }');
    assert.ok(variant.some((f) => f.rule === 'contrast' && f.message.includes('(.ds-theme[data-brand="pale"])')), 'a variant is checked over the base');
    const unknown = check('.ds-theme { --ds-text: oklch(20% 0 0); }');
    assert.ok(unknown.some((f) => f.level === 'info' && /--ds-text on --ds-surface: not checked/.test(f.message)));
    // A theme used with the shipped dark theme: the pairs of both together.
    const together = check('.ds-theme { --ds-link: #1d4e89; }', { withFiles: [{ path: 'dark.css', css: read('themes/dark.css') }] });
    assert.ok(together.some((f) => f.rule === 'contrast' && /with dark\.css/.test(f.message)), 'a link colour that dark.css does not reset fails on its surfaces');
  });

  it('lets a variant pass where it is meant to be used: over the base or with a --with theme', () => {
    const dark = [{ path: 'dark.css', css: read('themes/dark.css') }];
    const warnings = (css, extra) => check(css, extra).filter((f) => f.rule === 'contrast' && f.level === 'warning').map((f) => f.message);
    // The reference app: a light and a dark tone of each accent (the dark ones under data-ex-dark).
    assert.ok(warnings(read('example/theme.css')).some((m) => m.includes('[data-ex-dark]')), 'a dark variant over the light base fails');
    assert.deepEqual(warnings(read('example/theme.css'), { withFiles: dark }), [], 'each variant passes over the base or with dark.css');
    // A variant that fails in every context still warns, in each of them.
    const pale = warnings('.ds-theme[data-brand="pale"] { --ds-primary: #c2e7ff; --ds-on-primary: #d3e3fd; }', { withFiles: dark });
    assert.ok(pale.some((m) => m.includes('(.ds-theme[data-brand="pale"])')) && pale.some((m) => m.includes('(.ds-theme[data-brand="pale"], with dark.css)')), pale.join('\n'));
  });

  it('runs as a CLI from a copy: file:line level rule message, exit 1 on an error', () => {
    const dir = copyOfDist();
    try {
      writeFileSync(join(dir, 'bad.css'), '.ds-theme {\n  --ds-dur-fast: 1ms;\n}\n');
      writeFileSync(join(dir, 'good.css'), '.ds-theme {\n  --ds-primary: #1d4e89;\n}\n');
      const bad = spawnSync(process.execPath, [join(dir, 'tools/check-theme.mjs'), join(dir, 'bad.css')], { encoding: 'utf8' });
      assert.equal(bad.status, 1, bad.stderr);
      assert.match(bad.stderr, /bad\.css:2 error motion --ds-dur-fast/);
      const good = spawnSync(process.execPath, [join(dir, 'tools/check-theme.mjs'), join(dir, 'good.css')], { encoding: 'utf8' });
      assert.equal(good.status, 0, good.stderr);
      assert.match(good.stdout, /check-theme: 0 errors/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('runs the same pairs and motion families in the styleguide theme check (its classic-script copy)', () => {
    const source = read('styleguide/styleguide.js');
    const block = source.slice(source.indexOf('var THEME_PAIRS = {'), source.indexOf('var PAIR_MIN'));
    const list = (kind) => {
      const part = new RegExp(`${kind}: \\[([\\s\\S]*?)\\n    \\]`).exec(block)?.[1] ?? '';
      return [...part.matchAll(/\['(--ds-[\w-]+)', '(--ds-[\w-]+)'\]/g)].map((match) => [match[1], match[2]]);
    };
    assert.deepEqual(list('text'), TEXT_PAIRS);
    assert.deepEqual(list('control'), CONTROL_PAIRS);
    assert.deepEqual(list('icon'), ICON_PAIRS);
    const families = /var THEME_MOTION = \/--ds-\(([^)]*)\)/.exec(source)?.[1].split('|');
    assert.deepEqual(families, MOTION_FAMILIES);
  });
});
