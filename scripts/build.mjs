#!/usr/bin/env node
/**
 * Builds dist/ from src/ and fonts/ without dependencies.
 *
 *   node scripts/build.mjs           write dist/
 *   node scripts/build.mjs --check   exit 1 if dist/ is not what src/ builds
 *
 * dist/ holds everything a project needs, so it can be vendored alone:
 *   ds.css          every stylesheet in cascade order (src/index.css inlined),
 *                   the layer order declared once at the top
 *   ds.js           classic script: window.DS = { version, motion, indicator, dom, ripple, icons, overlay },
 *                   each copy also under DashboardStyle.versions[version]
 *   css/, js/       the source files (ES modules, single stylesheets)
 *   fonts/          Google Sans woff2, fonts.css, OFL.txt
 *   LICENSE         MIT notice (it must travel with every copy)
 *   SHA256SUMS      checksums of all files above
 *
 * The output is deterministic (no dates), so the test suite can compare it.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/** The JS modules bundled into ds.js, in this order, as DS.<name>. */
export const MODULES = ['motion', 'indicator', 'dom', 'ripple', 'icons', 'overlay'];

const posix = (path) => path.split(sep).join('/');
const readText = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

function filesIn(dir) {
  return readdirSync(dir).sort().flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

export function packageInfo() {
  const pkg = JSON.parse(readText(join(ROOT, 'package.json')));
  return { name: 'Dashboard-Style', version: pkg.version, homepage: pkg.homepage, license: pkg.license };
}

function banner(info) {
  return `/*! ${info.name} ${info.version} | ${info.license} License | ${info.homepage} */\n`;
}

/** One `@import 'x';` or `@import "x";` line, the final newline optional. */
const IMPORT_LINE = /^@import\s+(?:'([^']+)'|"([^"]+)");[ \t]*(?:\n|$)/gm;

/**
 * Inlines the @import lines of a stylesheet, recursively. `ancestors` is
 * the chain of files above this one (a file among them is a cycle);
 * `inlined` holds every file inlined so far (a file imported a second time
 * through another parent would repeat its rules). Any @import left after
 * inlining is a form this build does not read, so it throws instead of
 * shipping a request for a file that is not there.
 */
export function inlineCss(path, ancestors = [], inlined = new Set()) {
  if (ancestors.includes(path)) throw new Error(`CSS import cycle: ${[...ancestors, path].join(' -> ')}`);
  if (inlined.has(path)) throw new Error(`CSS duplicate import: ${path} (imported by ${ancestors.at(-1)})`);
  inlined.add(path);
  const chain = [...ancestors, path];
  const css = readText(path).replace(IMPORT_LINE, (line, single, double) => {
    const child = resolve(dirname(path), single ?? double);
    const body = inlineCss(child, chain, inlined).trimEnd();
    return `/* ── ${posix(relative(join(ROOT, 'src'), child))} ── */\n${body}\n\n`;
  });
  if (/^\s*@import/m.test(css)) throw new Error(`CSS @import left after inlining in ${path}: only "@import 'file';" lines are read`);
  return css;
}

/**
 * Every stylesheet of src/ starts with the same `@layer ds.tokens, ...;`
 * order statement, so a single file of dist/css/ keeps the order. Inlined
 * into ds.css, the first one declares it; the repeats go.
 */
export function layerStatementOnce(css) {
  const first = css.match(/^@layer [\w.,\- ]+;$/m);
  if (!first) return css;
  const head = css.slice(0, first.index + first[0].length);
  const rest = css.slice(head.length).split(`${first[0]}\n\n`).join('').split(`${first[0]}\n`).join('');
  return head + rest;
}

/** `import { a, b as c } from './motion.js';` on one line. */
const SIBLING_IMPORT = /^import\s*\{([^}]*)\}\s*from\s*(?:'\.\/([\w-]+)\.js'|"\.\/([\w-]+)\.js")\s*;?[ \t]*$/;

/**
 * Rewrites the imports of one module for the classic build: a module may
 * import named exports of a module earlier in MODULES (`import { a, b as c }
 * from './motion.js';`, on one line), which becomes
 * `const a = DS.motion.a, c = DS.motion.b;` inside its closure. Default,
 * namespace and bare imports, later or unknown modules and imports over
 * several lines throw.
 */
function rewriteImports(source, name) {
  const position = MODULES.indexOf(name);
  return source.replace(/^[ \t]*import\b.*$/gm, (line) => {
    const statement = line.trim();
    const match = SIBLING_IMPORT.exec(statement);
    if (!match) {
      if (/^import\s*\{[^}]*$/.test(statement)) throw new Error(`${name}.js: an import must sit on one line: ${statement}`);
      if (/^import\s*\*/.test(statement)) throw new Error(`${name}.js: namespace imports are not supported: ${statement}`);
      if (/^import\s*['"]/.test(statement)) throw new Error(`${name}.js: bare imports are not supported: ${statement}`);
      if (/^import\s*\{/.test(statement)) throw new Error(`${name}.js: only sibling modules (./<name>.js) can be imported: ${statement}`);
      if (/^import\s+[\w$]/.test(statement)) throw new Error(`${name}.js: default imports are not supported: ${statement}`);
      throw new Error(`${name}.js: unsupported import: ${statement}`);
    }
    const from = match[2] ?? match[3];
    const index = MODULES.indexOf(from);
    if (index < 0) throw new Error(`${name}.js: unknown module ./${from}.js (not in MODULES)`);
    if (index >= position) throw new Error(`${name}.js: ./${from}.js is not earlier in MODULES; import only from an earlier module`);
    const bindings = match[1].split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
      const names = /^([\w$]+)(?:\s+as\s+([\w$]+))?$/.exec(part);
      if (!names) throw new Error(`${name}.js: cannot read the import binding "${part}"`);
      return `${names[2] || names[1]} = DS.${from}.${names[1]}`;
    });
    if (!bindings.length) throw new Error(`${name}.js: an empty import: ${statement}`);
    return `const ${bindings.join(', ')};`;
  });
}

/**
 * Turns one ES module of src/js into a function body that returns its
 * exports. Only `export const` and `export function` are allowed; imports
 * only from an earlier module (rewriteImports).
 */
export function moduleBody(source, name) {
  const exports = [];
  const body = rewriteImports(source, name).replace(/^export (const|function) ([\w$]+)/gm, (match, kind, id) => {
    exports.push(id);
    return `${kind} ${id}`;
  });
  if (/^\s*export\b/m.test(body)) throw new Error(`${name}.js: only "export const" and "export function" are supported`);
  const members = exports.map((id) => `      ${id}: ${id}`).join(',\n');
  const indented = body.trimEnd().split('\n').map((line) => (line ? `    ${line}` : line)).join('\n');
  return `  DS.${name} = (function () {\n${indented}\n\n    return Object.freeze({\n${members}\n    });\n  })();\n`;
}

export function buildJs(info) {
  const parts = MODULES.map((name) => moduleBody(readText(join(ROOT, 'src/js', `${name}.js`)), name));
  return `${banner(info)}/*
 * Classic-script build of src/js (no modules needed): window.DS.motion,
 * DS.indicator, DS.dom, DS.ripple, DS.icons and DS.overlay hold the same
 * exports as the ES modules in js/. Generated by scripts/build.mjs; do not
 * edit.
 * Icon shapes: Lucide (ISC) and Feather (MIT), see LICENSE.
 *
 * Two copies on one page (a host page and an embedded widget): every copy
 * registers itself in DashboardStyle.versions[version]. window.DS is set
 * only when it is absent or holds the same version, so the first copy
 * keeps it; a second copy of the same version does nothing, one of another
 * version warns once and leaves DS alone. A widget reads
 * DashboardStyle.versions['<its version>'] || DS.
 */
(function (root) {
  'use strict';
  var version = '${info.version}';
  var registry = root.DashboardStyle || (root.DashboardStyle = {});
  var versions = registry.versions || (registry.versions = {});
  if (versions[version]) return;
  var DS = { version: version };

${parts.join('\n')}
  versions[version] = DS;
  var current = root.DS;
  var warn = function (message) {
    if (root.console && typeof root.console.warn === 'function') root.console.warn(message);
  };
  if (current === undefined || current === null || (typeof current === 'object' && current.version === version)) root.DS = DS;
  else if (typeof current.version === 'string') warn('Dashboard-Style ' + version + ' loaded on a page that already runs ' + current.version + ': window.DS stays ' + current.version + '; this copy is DashboardStyle.versions[\\'' + version + '\\'].');
  else warn('Dashboard-Style ' + version + ': window.DS already holds something else; it is left alone, this copy is DashboardStyle.versions[\\'' + version + '\\'].');
})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/** Everything dist/ should contain: Map of posix path -> Buffer. */
export function build() {
  const info = packageInfo();
  const out = new Map();
  const text = (path, value) => out.set(path, Buffer.from(value, 'utf8'));

  text('ds.css', `${banner(info)}${layerStatementOnce(inlineCss(join(ROOT, 'src/index.css'))).trimEnd()}\n`);
  text('ds.js', buildJs(info));

  for (const file of filesIn(join(ROOT, 'src'))) {
    const path = posix(relative(join(ROOT, 'src'), file));
    if (path.endsWith('.css')) text(`css/${path}`, readText(file));
    else if (path.startsWith('js/') && path.endsWith('.js')) text(path, readText(file));
    else throw new Error(`Unexpected file in src/: ${path}`);
  }
  for (const file of filesIn(join(ROOT, 'fonts'))) {
    const path = posix(relative(join(ROOT, 'fonts'), file));
    out.set(`fonts/${path}`, /\.(css|txt)$/.test(path) ? Buffer.from(readText(file), 'utf8') : readFileSync(file));
  }
  text('LICENSE', readText(join(ROOT, 'LICENSE')));

  const sums = [...out.keys()].sort().map((path) => `${createHash('sha256').update(out.get(path)).digest('hex')}  ${path}`);
  text('SHA256SUMS', `${sums.join('\n')}\n`);
  return out;
}

/** Paths that differ between a build and dist/ on disk (missing, changed, extra). */
export function diffDist(out = build()) {
  const present = new Set(statSafe(DIST) ? filesIn(DIST).map((file) => posix(relative(DIST, file))) : []);
  const problems = [];
  for (const [path, content] of out) {
    if (!present.has(path)) problems.push(`missing: dist/${path}`);
    else if (!readFileSync(join(DIST, path)).equals(content)) problems.push(`outdated: dist/${path}`);
    present.delete(path);
  }
  for (const path of present) problems.push(`extra: dist/${path}`);
  return problems;
}

function statSafe(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function main() {
  const out = build();
  if (process.argv.includes('--check')) {
    const problems = diffDist(out);
    if (problems.length) {
      console.error(`dist/ is not up to date (run npm run build):\n  ${problems.join('\n  ')}`);
      process.exit(1);
    }
    console.log(`dist/ is up to date (${out.size} files).`);
    return;
  }
  rmSync(DIST, { recursive: true, force: true });
  for (const [path, content] of out) {
    mkdirSync(dirname(join(DIST, path)), { recursive: true });
    writeFileSync(join(DIST, path), content);
  }
  console.log(`Built dist/ (${out.size} files, version ${packageInfo().version}).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
