#!/usr/bin/env node
/**
 * Builds dist/ and the generated files of the repository from src/ and
 * fonts/. The one build dependency is lightningcss (a pinned
 * devDependency, `npm ci`), which minifies the stylesheets; dist/ itself
 * and every shipped tool stay dependency-free.
 *
 *   node scripts/build.mjs           write dist/ and the generated files
 *   node scripts/build.mjs --check   exit 1 if any of them is not what src/ builds
 *   node scripts/build.mjs --generated   print the generated files of the repository, one per line
 *
 * Sources: src/core/{tokens,options,base,motion,global}.css and src/core/hooks.json,
 * one folder per component (src/components/<name>/: <name>.css, meta.json and
 * the optional files of COMPONENT_FILES: <name>.md, .demo.js, .js, .d.ts,
 * .requires.json, .test.js, .spec.js, .fixture.html, .lab.js, .keyframes.css),
 * the partials of docs/components.md (src/components/_partials/),
 * src/optional/, src/js/, src/types/, src/deprecations.json, fonts/, themes/
 * and scripts/tools/.
 *
 * Generated in the repository (committed; --check compares them too):
 *   src/index.css        the layer statement, the sublayer statement and
 *                        the @import list in meta.json "order"
 *   docs/components.md   the partials and every <name>.md in meta.json "docsOrder"
 *   styleguide/demos.js  the classic script of every <name>.demo.js (each calls SG.demo())
 *   styleguide/registry.js  the components, groups and tokens (window.SG_REGISTRY)
 *   styleguide/theme-generator.js  scripts/tools/{color,theme-rules,theme}.mjs as one
 *                        classic script (window.SG_THEME_GENERATOR), so the theme panel
 *                        runs from file:// in every engine
 *   styleguide/lab-components.js  every <name>.lab.js after SG_LAB.add()
 *   README.md            the count of its Components badge
 *   Blocks between "generated:" markers inside hand-written files
 *   (replaceBlock): the hooks table of docs/theming.md and the hooks of
 *   themes/example.css (meta.json "hooks", src/core/hooks.json), the component
 *   keyframes table of docs/motion.md (<name>.keyframes.css, "keyframeDocs"),
 *   the module table of docs/install.md, the module imports and namespaces
 *   of src/types/ds.d.ts (MODULES) and the list RIPPLE_HOSTS of
 *   src/js/ripple.js (meta.json "rippleHosts").
 *
 * Every meta.json is validated against scripts/meta-schema.json and verified
 * against its folder and stylesheet first (verifyComponents): classes,
 * attributes, hooks and keyframes exactly, requires, js, module, ripple,
 * exceptions and progressive; a mismatch stops the build with the reason.
 *
 * dist/ holds everything a project needs, so it can be vendored alone:
 *   ds.css, ds.min.css   every stylesheet in cascade order (src/index.css
 *                   inlined), the layer and sublayer order declared once at
 *                   the top; the minified copy with ds.min.css.map
 *   ds.js, ds.min.js     classic script (tools/js-wrap.mjs, merge mode): window.DS =
 *                   { version, core, motion, indicator, dom, ripple, icons, overlay,
 *                   and one namespace per component module (MODULES) }
 *                   plus DS.init, DS.get, DS.define and DS.config (DS.core's),
 *                   each copy also under DashboardStyle.versions[version];
 *                   ds.min.js without comments and indentation (stripJs)
 *   css/core/{tokens,options,base,motion,global}.css, css/components/<name>.css
 *                   the single stylesheets, each with the layer and the
 *                   sublayer statement, so any subset in any order cascades
 *                   as ds.css does; a .min.css with its .min.css.map next
 *                   to every stylesheet of css/
 *   css/index.css   the @import list of ds.css over the single stylesheets
 *   js/             the ES modules, flat: src/js/<core>.js and every
 *                   src/components/<name>/<name>.js, its imports rewritten
 *                   to ./<module>.js (rewriteComponentImports)
 *   ds.d.ts, js/*.d.ts  hand-written types (src/types/, each folder's
 *                   <name>.d.ts): the global DS, and each module's exports
 *                   next to the module
 *   css/optional/   opt-in stylesheets that ds.css never includes (src/optional/,
 *                   not imported by src/index.css), such as view-transitions.css
 *   css/properties.css  every top-level @property of ds.css, alone: a widget
 *                   that loads ds.css inside a shadow root links it in the
 *                   host document (@property applies only there)
 *   manifest.json   components, their files, classes, attributes, keyframes,
 *                   hooks, dependencies and sizes, and the JS modules
 *                   (manifestJson), for tools/bundle.mjs and check-project
 *   fonts/          Google Sans woff2, fonts.css, OFL.txt
 *   deprecations.json  the deprecated and removed names as data
 *                   (src/deprecations.json, checked and written with the
 *                   version of package.json)
 *   themes/         the shipped themes (dark.css, compact.css, contrast.css)
 *                   and the generated presets (themes/presets/)
 *   tools/          dependency-free tools for projects: every file of
 *                   scripts/tools/ (verify.mjs and verify.sh, check-theme.mjs,
 *                   check-project.mjs, the theme generator theme.mjs, the
 *                   project bundle bundle.mjs and vite-plugin.mjs, and the
 *                   modules they share); a new file there ships by itself
 *   tokens.json     every --ds-* name with its layer, default and type
 *   LICENSE         MIT notice (it must travel with every copy)
 *   SHA256SUMS      checksums of all files above
 *
 * Every CSS, JS, MJS, .d.ts and shell file carries the version banner
 * (withBanner); the JSON files carry the version as data.
 *
 * The output is deterministic (no dates), so the test suite can compare it.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { scan, selectorList } from './tools/css-scan.mjs';
import { isRemoved } from './tools/theme-rules.mjs';
import { classicScript, moduleBody as wrapModule } from './tools/js-wrap.mjs';

/** lightningcss, the build's one dependency (npm ci); null when it is not installed. */
const lightning = await import('lightningcss').catch(() => null);

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/** A top-level `@property --ds-x { ... }` block (descriptors only, no nested braces). */
const PROPERTY_BLOCK = /^@property\s+--[\w-]+\s*\{[^{}]*\}/gm;

/**
 * css/properties.css: the top-level @property rules of ds.css, byte for
 * byte and in cascade order, without a layer statement. @property applies
 * only in document-level stylesheets, so a widget whose ds.css sits in a
 * shadow root links this file in the host document; it registers --ds-*
 * custom properties and styles nothing.
 */
export function propertiesCss(css, info) {
  const blocks = css.match(PROPERTY_BLOCK) ?? [];
  return `${banner(info)}/*
 * The @property registrations of ds.css, alone (generated by
 * scripts/build.mjs; do not edit). @property rules apply only in
 * stylesheets of the document, never in a shadow root: a widget that loads
 * ds.css inside a shadow root links this file in the host document too.
 * It only registers --ds-* custom properties and styles nothing.
 */

${blocks.join('\n\n')}
`;
}

/** The kinds of name in deprecations.json. */
export const DEPRECATION_KINDS = ['token', 'role', 'hook', 'class', 'attribute', 'markup', 'keyframes', 'export', 'option'];
const DEPRECATION_KEYS = ['kind', 'name', 'pattern', 'replacement', 'deprecated', 'removed', 'note'];
const SEMVER = /^\d+\.\d+\.\d+$/;

/**
 * dist/deprecations.json from src/deprecations.json: `{ version, names }`,
 * the version from package.json (like the banners and DS.version). Every
 * entry is checked, so a project check can trust the file: a known kind, a
 * name, a pattern that compiles (or null for a note-only entry), the
 * version it was deprecated in, and `removed` (a version, or null while it
 * still works); `replacement` and `note` are optional strings or null.
 */
export function deprecationsJson(source, info) {
  const data = JSON.parse(source);
  if (!data || !Array.isArray(data.names) || Object.keys(data).join() !== 'names') throw new Error('src/deprecations.json: { "names": [ ... ] } and nothing else');
  const seen = new Set();
  const names = data.names.map((entry, index) => {
    const where = `src/deprecations.json, entry ${index} (${entry?.name})`;
    const extra = Object.keys(entry ?? {}).filter((key) => !DEPRECATION_KEYS.includes(key));
    if (extra.length) throw new Error(`${where}: unknown keys ${extra.join(', ')}`);
    if (!DEPRECATION_KINDS.includes(entry.kind)) throw new Error(`${where}: kind must be one of ${DEPRECATION_KINDS.join(', ')}`);
    if (typeof entry.name !== 'string' || !entry.name) throw new Error(`${where}: a name`);
    if (seen.has(entry.name)) throw new Error(`${where}: listed twice`);
    seen.add(entry.name);
    if (entry.pattern !== null) {
      if (typeof entry.pattern !== 'string') throw new Error(`${where}: pattern is a regular expression source or null`);
      new RegExp(entry.pattern);
    }
    if (!SEMVER.test(entry.deprecated)) throw new Error(`${where}: deprecated is a version`);
    if (entry.removed !== null && !SEMVER.test(entry.removed)) throw new Error(`${where}: removed is a version or null`);
    for (const key of ['replacement', 'note']) {
      if (entry[key] !== undefined && entry[key] !== null && typeof entry[key] !== 'string') throw new Error(`${where}: ${key} is a string or null`);
    }
    return Object.fromEntries(DEPRECATION_KEYS.filter((key) => entry[key] !== undefined).map((key) => [key, entry[key]]));
  });
  return `${JSON.stringify({ version: info.version, names }, null, 2)}\n`;
}

/** The shipped themes (themes/<name>.css to dist/themes/); themes/example.css is the template, not shipped. */
export const SHIPPED_THEMES = ['dark', 'compact', 'contrast'];

const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const collapse = (value) => value.replace(/\s+/g, ' ').trim();

/** The body of the first `.ds-theme {` rule of tokens.css (found by brace depth). */
function mainThemeRule(source) {
  const start = source.indexOf('.ds-theme {');
  if (start < 0) throw new Error('src/core/tokens.css: no .ds-theme rule');
  let depth = 0;
  let end = source.indexOf('{', start);
  do {
    if (source[end] === '{') depth += 1;
    else if (source[end] === '}') depth -= 1;
    end += 1;
  } while (depth > 0);
  return source.slice(source.indexOf('{', start) + 1, end - 1);
}

/** The fallback of the first `var(<name>, <fallback>)` in a stylesheet (balanced parentheses), or undefined. */
function fallbackOf(css, name) {
  const at = css.search(new RegExp(`var\\(\\s*${name}\\s*,`));
  if (at < 0) return undefined;
  let i = css.indexOf(',', at) + 1;
  let depth = 0;
  let value = '';
  for (; i < css.length; i += 1) {
    const char = css[i];
    if (char === '(') depth += 1;
    else if (char === ')') {
      if (depth === 0) break;
      depth -= 1;
    }
    value += char;
  }
  return collapse(value);
}

const MOTION_FAMILY = /^--ds-(dur|ease|distance|loop|stagger|delay|hold|scale|time-scale|motion|enter|leave|clip-from|draw-length|scan|indicator-lag|indicator-dur)(?![a-z])/;

/** The type of a token from its name and default value, following var() to other tokens. */
function typeOf(name, value, known, seen = new Set()) {
  if (/^--ds-(dur|delay|hold|loop)-|^--ds-stagger$|^--ds-indicator-dur$|-(duration|delay)$/.test(name)) return 'duration';
  if (/-easing$/.test(name)) return 'easing';
  if (/^--ds-ease/.test(name) || /-ease(-[a-z])?$/.test(name)) return 'easing';
  if (/^--ds-font(-|$)|-font$/.test(name)) return 'font';
  if (/-(height|size)-exact$/.test(name)) return 'length';
  if (/^--ds-weight-|^--ds-z-|^--ds-state-|-opacity$/.test(name)) return 'number';
  if (/^--ds-elev-|-shadow$|^--ds-focus-ring$/.test(name)) return 'shadow';
  const text = value ?? '';
  const reference = /^var\((--ds-[\w-]+)[,)]/.exec(text);
  if (reference && known.has(reference[1]) && !seen.has(reference[1])) {
    const target = known.get(reference[1]);
    return typeOf(reference[1], target, known, new Set([...seen, name]));
  }
  if (/^(#[0-9a-f]{3,8}|rgba?\(|color-mix\(|transparent$|currentColor$)/i.test(text)) return 'color';
  if (/^-?\d*\.?\d+$/.test(text)) return 'number';
  if (/^(-?\d*\.?\d+(px|%|rem|em|ch|vw|vh|svh|dvh|deg)|0)$/.test(text) || /^(calc|min|max)\(.*\d(px|%|rem|ch|vw|vh)/.test(text)) return 'length';
  if (/^(\d*\.?\d+m?s|calc\(\d*\.?\d+m?s )/.test(text)) return 'duration';
  if (/^(cubic-bezier|linear)\(/.test(text)) return 'easing';
  return 'other';
}

/**
 * dist/tokens.json: every --ds-* name of the system as data, for tools and
 * editors. `{ version, tokens: [{ name, layer, default, type, themeable,
 * component?, deprecated? }] }`, sorted by name:
 *   scale        layer 1 of tokens.css (before the "2. Palette" marker), and --ds-time-scale
 *   role         layer 2 of tokens.css (after the marker): what a theme sets
 *   hook         a row of the "Component hooks" table of docs/theming.md, read by one component with a fallback
 *   motion-hook  a per-element motion setting (--ds-motion-*, --ds-enter-* ...): themes never set it
 *   runtime      written by a script or the page (src/js/, @property registrations of tokens.css and the indicator)
 *   internal     set by a component on itself (read it, never set it)
 * `default` is the declared value (roles, scales), the component's fallback
 * (hooks) or the registered initial value; `themeable` is true for roles and
 * hooks only. `deprecated` is the version that deprecated a name still in
 * use (src/deprecations.json); names removed in this version or earlier are
 * not listed (a removal planned for a later release is still listed).
 */
export function tokensJson(info, read = (path) => readText(join(ROOT, path))) {
  const raw = mainThemeRule(read('src/core/tokens.css'));
  const rawMarker = raw.indexOf('── 2. Palette');
  if (rawMarker < 0) throw new Error('src/core/tokens.css: no "── 2. Palette" marker');
  const declaredIn = (text) => [...stripCssComments(text).matchAll(/(--ds-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], collapse(m[2])]);
  const entries = new Map();
  const add = (name, fields) => { if (!entries.has(name)) entries.set(name, { name, ...fields }); };
  for (const [name, value] of declaredIn(raw.slice(0, rawMarker))) add(name, { layer: 'scale', default: value });
  for (const [name, value] of declaredIn(raw.slice(rawMarker))) add(name, { layer: 'role', default: value });

  const cssFiles = cssSources(read);
  const sources = new Map(cssFiles.map((path) => [path, stripCssComments(read(path))]));
  const scripts = MODULES.map((name) => read(moduleFiles(name).source)).join('\n');
  const writtenByScript = (name) => scripts.includes(`'${name}'`) || scripts.includes(`"${name}"`) || scripts.includes(`${name}:`);

  // Hooks: the first column of the docs/theming.md table.
  const hookNames = documentedHooks(read('docs/theming.md'));
  for (const name of hookNames) {
    const file = [...sources].find(([, css]) => new RegExp(`var\\(\\s*${name}\\s*,`).test(css));
    // A hook documented as unset has no default: its fallback is what the component computes without it.
    const unset = unsetHooks(read('docs/theming.md')).has(name);
    add(name, { layer: MOTION_FAMILY.test(name) ? 'motion-hook' : 'hook', default: file && !unset ? fallbackOf(file[1], name) : null, component: file ? cssName(file[0]) : null });
  }

  // Registered properties, then every other name the stylesheets and scripts use.
  for (const [path, css] of sources) {
    for (const match of css.matchAll(/@property\s+(--ds-[\w-]+)\s*\{([^}]*)\}/g)) {
      const name = match[1];
      const initial = /initial-value:\s*([^;]+);/.exec(match[2]);
      let layer = 'internal';
      if (name === '--ds-time-scale') layer = 'scale';
      else if (MOTION_FAMILY.test(name)) layer = 'motion-hook';
      else if (path === 'src/core/tokens.css' || writtenByScript(name)) layer = 'runtime';
      add(name, { layer, default: initial ? collapse(initial[1]) : null });
    }
  }
  const used = new Set();
  // Custom properties only: read with var() or declared (timeline and view-transition names are dashed idents too).
  for (const css of sources.values()) for (const match of css.matchAll(/var\(\s*(--ds-[\w-]+)|(--ds-[\w-]+)\s*:/g)) used.add(match[1] ?? match[2]);
  for (const match of scripts.matchAll(/['"](--ds-[\w-]+)['"]/g)) used.add(match[1]);
  const setInCss = (name) => [...sources.values()].some((css) => new RegExp(`${name}\\s*:`).test(css));
  for (const name of [...used].sort()) {
    if (entries.has(name)) continue;
    let layer;
    const readers = [...sources].filter(([, css]) => css.includes(name)).map(([path]) => path);
    if (MOTION_FAMILY.test(name) || (readers.length === 1 && readers[0] === 'src/core/motion.css' && !writtenByScript(name))) layer = 'motion-hook';
    else if (writtenByScript(name) || !setInCss(name)) layer = 'runtime';
    else layer = 'internal';
    const file = [...sources].find(([, css]) => new RegExp(`var\\(\\s*${name}\\s*,`).test(css));
    add(name, { layer, default: file ? fallbackOf(file[1], name) : null });
  }

  const deprecations = JSON.parse(read('src/deprecations.json')).names;
  const known = new Map([...entries.values()].map((entry) => [entry.name, entry.default]));
  const tokens = [...entries.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)).flatMap((entry) => {
    const deprecation = deprecations.find((d) => d.name === entry.name);
    if (isRemoved(deprecation, info.version)) return [];
    const out = {
      name: entry.name,
      layer: entry.layer,
      default: entry.default ?? null,
      type: typeOf(entry.name, entry.default, known),
      themeable: entry.layer === 'role' || entry.layer === 'hook',
    };
    if (entry.component) out.component = entry.component;
    if (deprecation) out.deprecated = deprecation.deprecated;
    return [out];
  });
  return `${JSON.stringify({ version: info.version, tokens }, null, 2)}\n`;
}

const posix = (path) => path.split(sep).join('/');
const readText = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// ── JS modules: the core (src/js/) and one per component folder ─────────

/** The core modules of src/js/, in this order (core first): DS.<name>. */
export const CORE_MODULES = ['core', 'motion', 'indicator', 'dom', 'ripple', 'icons', 'position', 'overlay', 'a11y', 'hotkeys', 'format', 'store', 'virtual', 'dnd'];

/** An import line of a module or its .d.ts (one line: named bindings, or in a .d.ts `import type` and `* as`): the head, the quote and the path. */
const IMPORT_FROM = /^(import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+[\w$]+)\s*from\s*|import\s*\{[^}]*\}\s*from\s*)(['"])([^'"]+)\2(\s*;?[ \t]*)$/;

/**
 * A component's behaviour module as dist/js/ holds it: every import of a
 * core module (`'../../js/<core>.js'`, in a .d.ts also
 * `'../../types/js/<core>.js'`) and of another component's module
 * (`'../<other>/<other>.js'`) becomes the flat sibling import
 * `'./<name>.js'`, so dist/js/ is one folder of modules and
 * tools/js-wrap.mjs reads it as it reads the core. Any other relative
 * import throws: a folder holds one module.
 */
export function rewriteComponentImports(source, name) {
  return source.split('\n').map((line) => {
    const match = IMPORT_FROM.exec(line.trim());
    if (!match || !line.startsWith('import')) return line;
    const [, head, quote, path, tail] = match;
    let target = /^\.\.\/\.\.\/(?:types\/)?js\/([\w-]+)\.js$/.exec(path)?.[1];
    if (target && !CORE_MODULES.includes(target)) throw new Error(`src/components/${name}/: ${path} is no core module (${CORE_MODULES.join(', ')})`);
    if (!target) {
      const other = /^\.\.\/([\w-]+)\/([\w-]+)\.js$/.exec(path);
      if (other && other[1] === other[2]) target = other[1];
    }
    if (!target) throw new Error(`src/components/${name}/: import from '../../js/<core>.js' or '../<component>/<component>.js' only, not ${path}`);
    return `${head}${quote}./${target}.js${quote}${tail}`;
  }).join('\n');
}

/** The sibling modules a module (in its dist form) imports, sorted. */
export function moduleImports(source) {
  return [...new Set([...source.matchAll(/^import\s*\{[^}]*\}\s*from\s*['"]\.\/([\w-]+)\.js['"]/gm)].map((match) => match[1]))].sort();
}

/**
 * The component modules in build order: every core module first, then
 * each component module after the modules it imports (Kahn's algorithm;
 * of the modules that are ready, the first by name). `sources` maps a
 * component module's name to its dist source. Unknown imports and cycles
 * throw.
 */
export function orderModules(sources) {
  const pending = new Map([...sources].map(([name, source]) => [name, moduleImports(source).filter((other) => !CORE_MODULES.includes(other))]));
  for (const [name, imports] of pending) {
    if (CORE_MODULES.includes(name)) throw new Error(`src/components/${name}/${name}.js: a component module may not take the name of the core module ${name}`);
    // It becomes DS.<name>, and js-wrap reads a sibling as DS.<name>.<export>.
    if (!/^[a-z][a-z0-9]*$/.test(name)) throw new Error(`src/components/${name}/${name}.js: a module's name is a JS identifier (lower case and digits, no hyphen): it becomes DS.${name}`);
    for (const other of imports) if (!pending.has(other)) throw new Error(`src/components/${name}/${name}.js imports ${other}, which is no module (src/js/ or src/components/${other}/${other}.js)`);
  }
  const order = [];
  while (pending.size) {
    const ready = [...pending].filter(([, imports]) => imports.every((other) => order.includes(other))).map(([name]) => name).sort();
    if (!ready.length) throw new Error(`component modules import each other in a cycle: ${[...pending.keys()].sort().join(', ')}`);
    order.push(ready[0]);
    pending.delete(ready[0]);
  }
  return order;
}

/** The component folders that hold a behaviour module (src/components/<name>/<name>.js). */
function componentModuleSources() {
  const dir = join(ROOT, 'src/components');
  return new Map(readdirSync(dir).sort().filter((name) => !name.startsWith('_') && existsSync(join(dir, name, `${name}.js`)))
    .map((name) => [name, rewriteComponentImports(readText(join(dir, name, `${name}.js`)), name)]));
}

/**
 * Every JS module bundled into ds.js, in this order, as DS.<name>: the
 * core modules, then the component modules (orderModules). A module may
 * import only from a module before it.
 */
export const MODULES = [...CORE_MODULES, ...orderModules(componentModuleSources())];

/**
 * Where a module lives in src/: its source, its types, its optional
 * requires sidecar and the docs that document its exports
 * (test/repo.test.js). A component module sits in its folder.
 */
export function moduleFiles(name) {
  if (CORE_MODULES.includes(name)) {
    return {
      component: null,
      source: `src/js/${name}.js`,
      types: `src/types/js/${name}.d.ts`,
      requires: `src/js/${name}.requires.json`,
      docs: ['core', 'a11y', 'hotkeys', 'format', 'store', 'virtual', 'dnd'].includes(name) ? 'docs/core.md' : name === 'icons' ? 'docs/icons.md' : 'docs/motion.md',
    };
  }
  const dir = `src/components/${name}`;
  return { component: name, source: `${dir}/${name}.js`, types: `${dir}/${name}.d.ts`, requires: `${dir}/${name}.requires.json`, docs: `${dir}/${name}.md` };
}

/** A module's source as dist/js/<name>.js holds it (component imports rewritten). */
export function moduleSource(name, read = (path) => readText(join(ROOT, path))) {
  const { component, source } = moduleFiles(name);
  return component ? rewriteComponentImports(read(source), name) : read(source);
}

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

/**
 * A shipped file with the version banner: CSS, JS, MJS and .d.ts files take
 * the banner comment first (after a #! line), shell scripts a # line after
 * theirs; every other file stays as it is (JSON carries the version as data).
 */
export function withBanner(path, text, info) {
  const shebang = text.startsWith('#!') ? text.slice(0, text.indexOf('\n') + 1) : '';
  const rest = text.slice(shebang.length);
  if (/\.(css|js|mjs|ts)$/.test(path)) return `${shebang}${banner(info)}${rest}`;
  if (/\.sh$/.test(path)) return `${shebang}# ${info.name} ${info.version} | ${info.license} License | ${info.homepage}\n${rest}`;
  return text;
}

// ── Components: folders, meta.json and their check ─────────────────────

/**
 * The core stylesheets (src/core/<name>.css) in cascade order: the tokens,
 * the option classes (options.css, in ds.utilities), the motion keyframes
 * and utilities, the page base, and the rules for every element of
 * .ds-theme (global.css, in ds.components, so it comes right before the
 * first component).
 */
export const CORE = ['tokens', 'options', 'motion', 'base', 'global'];

/** The core stylesheets in the order of manifest.json "core" (the order a bundle writes them; the layers decide between them). */
const CORE_FILES = ['tokens', 'options', 'base', 'motion', 'global'];

/** The order statement every stylesheet starts with. */
export const LAYERS = '@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities;';

/** The groups a component belongs to (meta.json "group"). */
export const GROUPS = ['actions', 'forms', 'data', 'overlays', 'navigation', 'feedback', 'layout', 'content', 'motion'];

/**
 * The names a "Progressive:" note uses for the features newer than the
 * floor (the list of test/css.test.js); meta.json "progressive" lists the
 * ones its stylesheet's note names, in this order.
 */
export const PROGRESSIVE_NAMES = ['linear()', '@starting-style', 'allow-discrete', 'popover', 'anchor positioning', 'View Transitions', 'scroll-driven',
  'interpolate-size', '::details-content', 'overflow-clip-margin', 'sibling-index()', 'text-wrap', 'scrollbar-color', 'scrollbar-gutter', 'field-sizing',
  'details[name]', 'hyphenate-limit-chars'];

/** scripts/meta-schema.json: the schema every meta.json is validated against (validateSchema). */
export const META_SCHEMA = JSON.parse(readText(join(ROOT, 'scripts/meta-schema.json')));

/** The keys of a meta.json, in the order the files write them (the optional ones may be left out). */
export const META_KEYS = Object.keys(META_SCHEMA.properties);

/** The keys every meta.json has. */
export const META_REQUIRED = META_SCHEMA.required;

const typeOfJson = (value) => (value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value);

/**
 * Validates `value` against a JSON Schema (the subset scripts/meta-schema.json
 * uses: type, const, enum, pattern, minLength, minimum, maximum, items,
 * minItems, maxItems, uniqueItems, properties, required,
 * additionalProperties, propertyNames, anyOf and local $ref); returns the
 * problems, each with its JSON path.
 */
export function validateSchema(value, schema, where = '', root = schema) {
  const problems = [];
  const at = where || '(root)';
  if (schema.$ref) {
    const target = schema.$ref.replace(/^#\//, '').split('/').reduce((node, key) => node?.[key], root);
    if (!target) throw new Error(`schema: unknown $ref ${schema.$ref}`);
    problems.push(...validateSchema(value, target, where, root));
  }
  const type = typeOfJson(value);
  if (schema.type) {
    const types = [].concat(schema.type);
    if (!types.includes(type) && !(type === 'integer' && types.includes('number'))) return [...problems, `${at}: is ${type}, expected ${types.join(' or ')}`];
  }
  if ('const' in schema && value !== schema.const) problems.push(`${at}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) problems.push(`${at}: ${JSON.stringify(value)} is not one of ${schema.enum.map((item) => JSON.stringify(item)).join(', ')}`);
  if (schema.anyOf) {
    const results = schema.anyOf.map((option) => validateSchema(value, option, where, root));
    if (results.every((result) => result.length)) problems.push(`${at}: matches none of its forms (${results.map((result) => result[0]).join('; ')})`);
  }
  if (type === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) problems.push(`${at}: "${value}" does not match ${schema.pattern}`);
    if (schema.minLength !== undefined && value.length < schema.minLength) problems.push(`${at}: shorter than ${schema.minLength}`);
  }
  if (type === 'integer' || type === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) problems.push(`${at}: below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) problems.push(`${at}: above ${schema.maximum}`);
  }
  if (type === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems) problems.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) problems.push(`${at}: more than ${schema.maxItems} items`);
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) problems.push(`${at}: lists an item twice`);
    if (schema.items) value.forEach((item, index) => problems.push(...validateSchema(item, schema.items, `${where}[${index}]`, root)));
  }
  if (type === 'object') {
    for (const key of schema.required ?? []) if (!(key in value)) problems.push(`${at}: missing key "${key}"`);
    for (const [key, item] of Object.entries(value)) {
      const path = where ? `${where}.${key}` : key;
      if (schema.propertyNames) problems.push(...validateSchema(key, { type: 'string', ...schema.propertyNames }, `${path} (name)`, root));
      if (schema.properties && key in schema.properties) problems.push(...validateSchema(item, schema.properties[key], path, root));
      else if (schema.additionalProperties === false) problems.push(`${at}: unknown key "${key}"`);
      else if (typeof schema.additionalProperties === 'object') problems.push(...validateSchema(item, schema.additionalProperties, path, root));
    }
  }
  return problems;
}

/**
 * The partials of docs/components.md (src/components/_partials/<name>.md):
 * the head before the components, the tail after them.
 */
const DOC_PARTIALS = { head: ['intro'], tail: ['motion-classes', 'attributes'] };

const repoText = (path) => readText(join(ROOT, path));
const repoHas = (path) => existsSync(join(ROOT, path));

/** The component folders of src/components/ (a name that starts with _ is not a component). */
export function componentNames() {
  return readdirSync(join(ROOT, 'src/components')).filter((name) => !name.startsWith('_') && statSync(join(ROOT, 'src/components', name)).isDirectory()).sort();
}

/**
 * The files a component folder may hold besides <name>.css and meta.json,
 * as the keys of components() name them (plans/3.0-conventions.md,
 * section 1); any other file stops the build.
 */
export const COMPONENT_FILES = {
  md: (name) => `${name}.md`,
  demo: (name) => `${name}.demo.js`,
  js: (name) => `${name}.js`,
  types: (name) => `${name}.d.ts`,
  requires: (name) => `${name}.requires.json`,
  test: (name) => `${name}.test.js`,
  spec: (name) => `${name}.spec.js`,
  fixture: (name) => `${name}.fixture.html`,
  lab: (name) => `${name}.lab.js`,
  keyframesCss: (name) => `${name}.keyframes.css`,
};

/**
 * Every component as { name, meta, css, md, demo, js, types, requires,
 * test, spec, fixture, lab, keyframesCss } (repository paths; each
 * optional file null when the folder has none), in meta.json "order".
 */
export function components() {
  return componentNames().map((name) => {
    const dir = `src/components/${name}`;
    if (!repoHas(`${dir}/${name}.css`)) throw new Error(`${dir}/: no ${name}.css`);
    if (!repoHas(`${dir}/meta.json`)) throw new Error(`${dir}/: no meta.json (scripts/meta-schema.json describes it)`);
    let meta;
    try {
      meta = JSON.parse(repoText(`${dir}/meta.json`));
    } catch (error) {
      throw new Error(`${dir}/meta.json: ${error.message}`);
    }
    const allowed = [`${name}.css`, 'meta.json', ...Object.values(COMPONENT_FILES).map((file) => file(name))];
    for (const file of readdirSync(join(ROOT, dir)).sort()) {
      if (!allowed.includes(file)) throw new Error(`Unexpected file in ${dir}/: ${file} (a folder holds ${allowed.join(', ')})`);
    }
    const optional = Object.fromEntries(Object.entries(COMPONENT_FILES).map(([key, file]) => [key, repoHas(`${dir}/${file(name)}`) ? `${dir}/${file(name)}` : null]));
    return { name, meta, css: `${dir}/${name}.css`, ...optional };
  }).sort((a, b) => a.meta.order - b.meta.order);
}

/** Every stylesheet of ds.css in cascade order (repository paths), each component's <name>.keyframes.css after its stylesheet. */
export function cssSources() {
  return [...CORE.map((name) => `src/core/${name}.css`), ...components().flatMap((component) => [component.css, ...(component.keyframesCss ? [component.keyframesCss] : [])])];
}

/** The component (or core) name of a stylesheet path of src/. */
function cssName(path) {
  return path.replace(/^src\/(core\/|components\/[\w-]+\/)?/, '').replace(/\.css$/, '');
}

/** `@layer ds.components.<a>, ds.components.<b>, ...;` in cascade order. */
export function sublayerStatement(list) {
  return `@layer ${list.map((component) => `ds.components.${component.name}`).join(', ')};`;
}

/** The hooks of the "Component hooks" table of docs/theming.md (its first column). */
export function documentedHooks(theming) {
  const from = theming.indexOf('## Component hooks');
  const table = theming.slice(from, theming.indexOf('\n## ', from + 1));
  return table.split('\n').filter((line) => line.startsWith('| `')).flatMap((line) => [...line.split(' | ')[0].matchAll(/`(--ds-[\w-]+)`/g)].map((m) => m[1]));
}

/** The hooks the table documents with the default `unset` (a fixed value only a theme or a page sets). */
export function unsetHooks(theming) {
  const from = theming.indexOf('## Component hooks');
  const table = theming.slice(from, theming.indexOf('\n## ', from + 1));
  return new Set(table.split('\n').filter((line) => line.startsWith('| `') && line.split(' | ')[1] === 'unset').flatMap((line) => [...line.split(' | ')[0].matchAll(/`(--ds-[\w-]+)`/g)].map((m) => m[1])));
}

const sorted = (values) => [...new Set(values)].sort();

/**
 * What a stylesheet styles, as the meta.json fields read it: the ds- classes
 * and the data- attributes of its selectors (keyframe stops aside), the
 * documented hooks it reads with a fallback, the keyframes it names, and
 * the keyframes it defines.
 */
export function cssFacts(css, { hooks = [], keyframes = [] } = {}) {
  const { rules } = scan(css);
  const classes = [];
  const attributes = [];
  for (const rule of rules) {
    if (rule.context.some((at) => /^@keyframes\b/.test(at))) continue;
    for (const selector of selectorList(rule.selector)) {
      for (const match of selector.matchAll(/\.(ds-[\w-]+)/g)) classes.push(match[1]);
      for (const match of selector.matchAll(/\[\s*(data-[\w-]+)/g)) attributes.push(match[1]);
    }
  }
  const code = stripCssComments(css);
  const defines = [...code.matchAll(/@keyframes\s+(ds-[\w-]+)/g)].map((match) => match[1]);
  const uses = code.replace(/@keyframes\s+ds-[\w-]+/g, '');
  return {
    classes: sorted(classes),
    attributes: sorted(attributes),
    hooks: sorted(hooks.filter((name) => new RegExp(`var\\(\\s*${name}\\s*,`).test(code))),
    keyframes: sorted(keyframes.filter((name) => new RegExp(`(?<![\\w.-])${name}(?![\\w-])`).test(uses))),
    defines: sorted(defines),
  };
}

/** The entries of a stylesheet's "Progressive:" header note, one string each. */
export function progressiveEntries(source) {
  const header = source.match(/^\/\*[\s\S]*?\*\//)?.[0] || '';
  const lines = header.split('\n').map((line) => line.replace(/^\s*\/?\*+\/?\s?/, '').replace(/\s*\*\/$/, ''));
  const start = lines.findIndex((line) => /^Progressive:\s*$/.test(line));
  if (start < 0) return [];
  const entries = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) break;
    if (line.startsWith('- ')) entries.push(line.slice(2));
    else if (entries.length) entries[entries.length - 1] += ` ${line.trim()}`;
  }
  return entries;
}

/** The ripple host selectors of src/js/ripple.js (RIPPLE_HOSTS, its generated block). */
function rippleHosts() {
  const block = /export const RIPPLE_HOSTS = \[([\s\S]*?)\]\.join/.exec(repoText('src/js/ripple.js'));
  if (!block) throw new Error('src/js/ripple.js: no RIPPLE_HOSTS list');
  return [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

/** The hooks of the core stylesheets (src/core/hooks.json): { "--ds-x": { default, description } }. */
export function coreHooks(read = repoText) {
  return JSON.parse(read('src/core/hooks.json'));
}

/** A meta.json's hooks as [name, entry] pairs (none when "hooks" is not an object). */
const hookEntries = (meta) => (meta.hooks && typeof meta.hooks === 'object' && !Array.isArray(meta.hooks) ? Object.entries(meta.hooks) : []);

/** The hooks a meta.json describes (owns), in its order. */
export const ownedHooks = (meta) => hookEntries(meta).filter(([, entry]) => entry && typeof entry === 'object' && 'description' in entry).map(([name]) => name);

/** Every documented hook: the core hooks (src/core/hooks.json), then every hook a meta.json owns. */
export function hookNames(list) {
  return [...Object.keys(coreHooks()), ...list.flatMap((component) => ownedHooks(component.meta))];
}

/**
 * A component's <name>.keyframes.css as { names, body }: the @keyframes it
 * defines and the inside of its one `@layer ds.motion { ... }` block, which
 * the build appends to motion.css. Anything but @keyframes in the block,
 * or anything but the layer statement and the block in the file, throws.
 */
export function componentKeyframes(component, read = repoText) {
  if (!component.keyframesCss) return { names: [], body: '' };
  const where = component.keyframesCss;
  const source = read(where);
  if (!source.includes(`\n${LAYERS}\n`) && !source.startsWith(`${LAYERS}\n`)) throw new Error(`${where}: no "${LAYERS}" line`);
  const code = stripCssComments(source).replace(LAYERS, '').trim();
  const block = (text) => {
    const open = text.indexOf('{');
    let depth = 0;
    let end = open;
    do {
      if (text[end] === '{') depth += 1;
      else if (text[end] === '}') depth -= 1;
      end += 1;
    } while (depth > 0 && end < text.length);
    return { open, end };
  };
  if (!/^@layer ds\.motion\s*\{/.test(code) || block(code).end !== code.length) throw new Error(`${where}: one "@layer ds.motion { ... }" block after the layer statement, and nothing else`);
  const start = source.indexOf('@layer ds.motion');
  const { open, end } = block(source.slice(start));
  const body = source.slice(start + open + 1, start + end - 1);
  // Only @keyframes blocks inside: take them out (braces balanced) and nothing may remain.
  let rest = stripCssComments(body);
  const names = [];
  for (;;) {
    const match = /@keyframes\s+([\w-]+)\s*\{/.exec(rest);
    if (!match) break;
    let depth = 0;
    let end = match.index + match[0].length - 1;
    do {
      if (rest[end] === '{') depth += 1;
      else if (rest[end] === '}') depth -= 1;
      end += 1;
    } while (depth > 0 && end < rest.length);
    names.push(match[1]);
    rest = rest.slice(0, match.index) + rest.slice(end);
  }
  if (rest.trim()) throw new Error(`${where}: only @keyframes inside @layer ds.motion (found "${rest.trim().slice(0, 40)}")`);
  return { names, body: body.replace(/^\n+/, '').replace(/\s+$/, '') };
}

/** The marker comment of a component's keyframes inside motion.css (dist). */
const keyframesMarker = (component) => `  /* ── components/${component.name}/${component.name}.keyframes.css ── */`;

/**
 * motion.css as dist/ ships it: src/core/motion.css with the keyframes of
 * every <name>.keyframes.css appended to its `@layer ds.motion` block, in
 * component order (meta.json "order").
 */
export function motionCss(list, read = repoText) {
  const source = read('src/core/motion.css');
  const parts = list.filter((component) => component.keyframesCss).map((component) => `${keyframesMarker(component)}\n${componentKeyframes(component, read).body}`);
  if (!parts.length) return source;
  const start = source.indexOf('@layer ds.motion {');
  const end = source.indexOf('\n}\n', start);
  if (start < 0 || end < 0) throw new Error('src/core/motion.css: no "@layer ds.motion {" block');
  return `${source.slice(0, end)}\n\n${parts.join('\n\n')}${source.slice(end)}`;
}

/**
 * The facts every check and the manifest share: per component and per
 * core stylesheet, what its CSS styles (cssFacts); which component owns
 * each class (meta.json "classes"); the classes of the core stylesheets
 * that no component owns (pseudo-components tokens, motion, base, global).
 * The keyframes are those of motion.css and of every <name>.keyframes.css;
 * the hooks those of hookNames().
 */
function componentFacts(list) {
  const hooks = hookNames(list);
  const own = new Map(list.map((component) => [component.name, componentKeyframes(component).names]));
  const keyframes = sorted([...cssFacts(repoText('src/core/motion.css')).defines, ...[...own.values()].flat()]);
  const facts = new Map(list.map((component) => [component.name, cssFacts(repoText(component.css), { hooks, keyframes })]));
  const owner = new Map();
  for (const component of list) for (const name of component.meta.classes ?? []) if (!owner.has(name)) owner.set(name, component.name);
  // A class of several core stylesheets belongs to the first of tokens, base, motion, global (.ds-theme to tokens).
  const taken = new Set(owner.keys());
  const core = new Map(CORE_FILES.map((name) => {
    const found = cssFacts(name === 'motion' ? motionCss(list) : repoText(`src/core/${name}.css`), { hooks, keyframes });
    const classes = found.classes.filter((cls) => !taken.has(cls));
    for (const cls of classes) taken.add(cls);
    return [name, { ...found, classes }];
  }));
  return { hooks, keyframes, own, facts, owner, core };
}

/**
 * Checks every meta.json against scripts/meta-schema.json, its folder and
 * its stylesheet; returns the problems (an empty list when everything
 * matches). The schema first (keys in its order, types, known values),
 * then exactly: classes (every listed class is styled by the file, no
 * class is listed twice, and every class the file styles is its own, a
 * core class or one of a component in "requires" or "context"),
 * attributes, hooks (the documented hooks the file reads; each described
 * by one component, or by src/core/hooks.json, the others name its owner)
 * and keyframes (those the file names plus those its <name>.keyframes.css
 * defines, each defined once, documented in "keyframeDocs"), module
 * (whether <name>.js is there), js (MODULES), ripple (whether
 * "rippleHosts" lists a selector or RIPPLE_HOSTS starts one with one of
 * its classes) and progressive (the PROGRESSIVE_NAMES its header note
 * names). Known values: requires and context (other components, apart),
 * unique orders. "requires" is what a bundle resolves (the component needs
 * the other one: its documented markup uses it, or a script of the system
 * writes it); "context" names the components whose classes the stylesheet
 * only styles where both meet (`.ds-card .ds-chip`), which a bundle never
 * pulls in by itself.
 */
export function verifyComponents(list = components()) {
  const problems = [];
  const names = new Set(list.map((component) => component.name));
  for (const { name, meta } of list) {
    const where = `src/components/${name}/meta.json`;
    problems.push(...validateSchema(meta, META_SCHEMA).map((problem) => `${where}: ${problem}`));
    const keys = Object.keys(meta).filter((key) => META_KEYS.includes(key));
    const order = META_KEYS.filter((key) => keys.includes(key));
    if (keys.join() !== order.join()) problems.push(`${where}: keys in the order ${order.join(', ')} (scripts/meta-schema.json)`);
  }
  if (problems.length) return problems;
  let found;
  try {
    found = componentFacts(list);
  } catch (error) {
    return [error.message];
  }
  const { facts, owner, core, own } = found;
  const coreClasses = new Set([...core.values()].flatMap((entry) => entry.classes));
  const coreHookNames = Object.keys(coreHooks());
  const claimed = new Map();
  const orders = new Map();
  const docOrders = new Map();
  const describedBy = new Map();
  const defined = new Map(cssFacts(repoText('src/core/motion.css')).defines.map((keyframe) => [keyframe, 'src/core/motion.css']));
  for (const { name, meta } of list) for (const hook of ownedHooks(meta)) describedBy.set(hook, [...(describedBy.get(hook) ?? []), name]);
  const listedHosts = new Set(list.filter((component) => component.meta.rippleHosts?.length).map((component) => component.name));
  const hosts = new Set([...listedHosts, ...rippleHosts().map((selector) => owner.get(/\.(ds-[\w-]+)/.exec(selector)?.[1])).filter(Boolean)]);
  const same = (field, listed, found, where, order = true) => {
    const missing = found.filter((value) => !listed.includes(value));
    const extra = listed.filter((value) => !found.includes(value));
    if (missing.length) problems.push(`${where}: "${field}" misses ${missing.join(', ')}`);
    if (extra.length) problems.push(`${where}: "${field}" lists ${extra.join(', ')}, which ${where.replace(/\/(\w[\w-]*)\/meta\.json$/, '/$1/$1.css')} does not use`);
    if (order && !missing.length && !extra.length && listed.join() !== found.join()) problems.push(`${where}: "${field}" is not sorted`);
  };
  for (const component of list) {
    const { name, meta, css, md } = component;
    const where = `src/components/${name}/meta.json`;
    if (meta.name !== name) problems.push(`${where}: "name" is "${meta.name}", the folder "${name}"`);
    if (orders.has(meta.order)) problems.push(`${where}: "order" ${meta.order} is also ${orders.get(meta.order)}'s`);
    else orders.set(meta.order, name);
    if (md === null && meta.docsOrder !== null) problems.push(`${where}: "docsOrder" is null without ${name}.md`);
    if (md !== null && meta.docsOrder === null) problems.push(`${where}: "docsOrder" is an integer (${name}.md has a place in docs/components.md)`);
    else if (md !== null && docOrders.has(meta.docsOrder)) problems.push(`${where}: "docsOrder" ${meta.docsOrder} is also ${docOrders.get(meta.docsOrder)}'s`);
    else if (md !== null) docOrders.set(meta.docsOrder, name);
    const styled = facts.get(name);
    for (const cls of meta.classes) {
      if (claimed.has(cls)) problems.push(`${where}: .${cls} is listed by ${claimed.get(cls)} too; one component owns a class`);
      else claimed.set(cls, name);
      if (!styled.classes.includes(cls)) problems.push(`${where}: lists .${cls}, which ${css} does not style`);
      if (coreClasses.has(cls)) problems.push(`${where}: .${cls} belongs to a core stylesheet`);
    }
    if ([...meta.classes].sort().join() !== meta.classes.join()) problems.push(`${where}: "classes" is not sorted`);
    for (const cls of styled.classes) {
      if (meta.classes.includes(cls) || coreClasses.has(cls)) continue;
      const other = owner.get(cls);
      if (!other) problems.push(`${css} styles .${cls}, which no meta.json lists: add it to "classes" of the component that owns it`);
      else if (!meta.requires.includes(other) && !meta.context.includes(other)) problems.push(`${where}: ${css} styles .${cls} of ${other}: add "${other}" to "context" (or to "requires" when ${name} needs it)`);
    }
    same('attributes', meta.attributes, styled.attributes, where);
    // Hooks: in the docs/theming.md order, so not sorted; each described once.
    same('hooks', Object.keys(meta.hooks), styled.hooks, where, false);
    for (const [hook, entry] of Object.entries(meta.hooks)) {
      if ('owner' in entry) {
        if (entry.owner === name || !names.has(entry.owner)) problems.push(`${where}: "hooks" ${hook}: "owner" names ${entry.owner}, no other component`);
        else if (!(describedBy.get(hook) ?? []).includes(entry.owner)) problems.push(`${where}: "hooks" ${hook}: ${entry.owner} does not describe it ({ default, description } in its meta.json)`);
      } else if (coreHookNames.includes(hook)) problems.push(`${where}: "hooks" ${hook} is a core hook (src/core/hooks.json): name no owner, or move it`);
      else if (describedBy.get(hook).length > 1) problems.push(`${where}: "hooks" ${hook} is described by ${describedBy.get(hook).join(' and ')}; one describes it, the others name it as "owner"`);
    }
    // Keyframes: those the stylesheet names plus those the folder defines, each defined once.
    const defines = own.get(name);
    for (const keyframe of defines) {
      if (!/^ds-[a-z0-9-]+$/.test(keyframe)) problems.push(`${component.keyframesCss}: @keyframes ${keyframe}: the ds- prefix`);
      if (defined.has(keyframe)) problems.push(`${component.keyframesCss}: @keyframes ${keyframe} is defined in ${defined.get(keyframe)} too`);
      else defined.set(keyframe, component.keyframesCss);
    }
    same('keyframes', meta.keyframes, sorted([...styled.keyframes, ...defines]), where);
    same('keyframeDocs', Object.keys(meta.keyframeDocs ?? {}), defines, where, false);
    for (const field of ['requires', 'context']) {
      for (const other of meta[field]) if (!names.has(other) || other === name) problems.push(`${where}: "${field}" names ${other}, no other component`);
      if ([...meta[field]].sort().join() !== meta[field].join()) problems.push(`${where}: "${field}" is not sorted`);
    }
    const both = meta.requires.filter((other) => meta.context.includes(other));
    if (both.length) problems.push(`${where}: ${both.join(', ')} in both "requires" and "context"`);
    for (const module of meta.js) if (!MODULES.includes(module)) problems.push(`${where}: "js" names ${module}, not a module of MODULES`);
    if ([...meta.js].sort().join() !== meta.js.join()) problems.push(`${where}: "js" is not sorted`);
    if (Boolean(meta.module) !== Boolean(component.js)) problems.push(component.js ? `${where}: "module": true (the folder holds ${name}.js)` : `${where}: "module" without ${name}.js: leave the key out`);
    if (component.js && !meta.js.includes(name)) problems.push(`${where}: "js" lists ${name} (its own module)`);
    if (component.types && !component.js) problems.push(`src/components/${name}/${name}.d.ts: types without ${name}.js`);
    if (component.js && !component.types) problems.push(`src/components/${name}/: ${name}.js needs its types, ${name}.d.ts`);
    if (component.requires && !component.js) problems.push(`src/components/${name}/${name}.requires.json: no ${name}.js`);
    if (meta.ripple !== hosts.has(name)) problems.push(`${where}: "ripple" is ${meta.ripple}, but ${hosts.has(name) ? 'it has a ripple host' : 'no ripple host names one of its classes'} ("rippleHosts", RIPPLE_HOSTS of src/js/ripple.js)`);
    for (const selector of meta.rippleHosts ?? []) {
      const cls = /\.(ds-[\w-]+)/.exec(selector)?.[1];
      if (cls ? !meta.classes.includes(cls) : !meta.attributes.some((attribute) => selector.includes(`[${attribute}`))) problems.push(`${where}: "rippleHosts" ${selector}: name one of its own classes (or, without a class, its own attribute)`);
    }
    // An exception stays with its component: its key names one of the component's own classes (a keyframe: its own).
    const ownClass = (key) => meta.classes.some((cls) => new RegExp(`\\.${cls}(?![\\w-])`).test(key));
    const exceptionKeys = [
      ...Object.entries(meta.exceptions ?? {}).flatMap(([kind, entries]) => Object.keys(entries).map((key) => [`exceptions.${kind}`, key])),
      ...Object.entries(meta.motionExceptions ?? {}).filter(([kind]) => kind !== 'keyframeShape')
        .flatMap(([kind, entries]) => (kind === 'transition' ? Object.entries(entries).flatMap(([property, map]) => Object.keys(map).map((key) => [`motionExceptions.transition.${property}`, key])) : Object.keys(entries).map((key) => [`motionExceptions.${kind}`, key]))),
    ];
    for (const [field, key] of exceptionKeys) if (!ownClass(key)) problems.push(`${where}: ${field} "${key}" names none of its own classes`);
    for (const keyframe of Object.keys(meta.motionExceptions?.keyframeShape ?? {})) if (!defines.includes(keyframe)) problems.push(`${where}: motionExceptions.keyframeShape names ${keyframe}, which ${name}.keyframes.css does not define`);
    const note = progressiveEntries(repoText(css)).join('\n');
    const progressive = PROGRESSIVE_NAMES.filter((feature) => note.includes(feature));
    if (meta.progressive.join() !== progressive.join()) problems.push(`${where}: "progressive" is [${meta.progressive.join(', ')}], the "Progressive:" note of ${css} names [${progressive.join(', ')}]`);
  }
  return problems;
}

// ── Generated files of the repository ──────────────────────────────────

/** The header comment of src/index.css and dist/css/index.css. */
const INDEX_HEADER = `/*
 * Dashboard-Style: every stylesheet in cascade order. Generated by
 * scripts/build.mjs from the "order" of each src/components/<name>/meta.json;
 * do not edit. The build inlines these imports into dist/ds.css; a bundler
 * can import this file (or single files) directly. Load a project theme
 * after it.
 *
 * Order: tokens, motion, the opt-in page base, then components from the
 * smallest building blocks to the app frame.
 *
 * Cascade layers: every stylesheet starts with the same layer statement
 * (so a single file keeps the order too) and puts its rules into one of
 * ds.tokens, ds.base, ds.components, ds.motion (keyframes) or
 * ds.utilities (the motion utilities). Unlayered project CSS beats every
 * layer, whatever its specificity; a project reset belongs in a layer
 * declared before this file (@layer reset;). @property and @font-face
 * stay outside the layers.
 *
 * Sublayers (reserved): the second statement declares one sublayer per
 * component, ds.components.<name>, in this order, and every file of
 * dist/css/ and every bundle carries it, so the order is fixed by the
 * first stylesheet a page loads. The components do not use them yet: their
 * rules still sit directly in ds.components, which beats every (empty)
 * sublayer, so the statement changes nothing today. Moving a component into
 * its sublayer makes a later component win over an earlier one whatever
 * the specificity, and 2.x relies on the opposite in places: zero-weight
 * :where() defaults of one file that a later file's heavier rule overrides
 * the other way round (the ripple host's position, the spacing of card
 * children against the lists, a button's hover colour inside an alert, a
 * fieldset after a card subtitle). Those pairs form cycles, so no order
 * of sublayers keeps today's cascade; each component moves into its
 * sublayer when it is ported and its pairs are resolved. Until then a
 * page that links single files links them in this order (css/index.css),
 * and a bundle writes them in it.
 */
`;

/** src/index.css (or, with dist paths, dist/css/index.css): both statements, then the imports. */
export function indexCss(list, dist = false) {
  const core = CORE.map((name) => `@import './core/${name}.css';`);
  const parts = list.map(({ name }) => `@import './components/${dist ? `${name}.css` : `${name}/${name}.css`}';`);
  return `${INDEX_HEADER}\n${LAYERS}\n${sublayerStatement(list)}\n\n${core.join('\n')}\n\n${parts.join('\n')}\n`;
}

/** docs/components.md: the head partials, every <name>.md in "docsOrder", the tail partials, byte for byte. */
export function componentsMd(list) {
  const partial = (name) => repoText(`src/components/_partials/${name}.md`);
  const docs = list.filter((component) => component.md).sort((a, b) => a.meta.docsOrder - b.meta.docsOrder).map((component) => repoText(component.md));
  return [...DOC_PARTIALS.head.map(partial), ...docs, ...DOC_PARTIALS.tail.map(partial)].join('');
}

/**
 * styleguide/demos.js: every src/components/<name>/<name>.demo.js, a
 * classic script (the styleguide works from disk) that registers its demo
 * with SG.demo('<name>', { ... }) (styleguide/sg-core.js, loaded before
 * it; plans/3.0-conventions.md, section 7). Each file is wrapped in a
 * function of its own, so its top-level names stay private; a demo
 * imports and exports nothing.
 */
export function demosJs(list) {
  const parts = list.filter((component) => component.demo).map((component) => {
    const source = repoText(component.demo);
    if (/^\s*(import|export)\b/m.test(source)) throw new Error(`${component.demo}: a demo is a classic script, no import or export: it registers with SG.demo('${component.name}', { ... })`);
    if (!new RegExp(`\\bSG\\.demo\\(\\s*'${component.name}'`).test(source)) throw new Error(`${component.demo}: calls SG.demo('${component.name}', { ... })`);
    const body = source.trimEnd().split('\n').map((line) => (line ? `    ${line}` : '')).join('\n');
    return `  // ${component.demo}\n  (function () {\n${body}\n  })();\n`;
  });
  return `/*
 * The component demos of the styleguide, one per src/components/<name>/<name>.demo.js.
 * Generated by scripts/build.mjs; do not edit. A classic script, so the
 * styleguide still works from disk. Load styleguide/sg-core.js first: each
 * demo registers with SG.demo().
 */
(function (root) {
  'use strict';
  var SG = root.SG;
  if (!SG || typeof SG.demo !== 'function') throw new Error('demos.js: load styleguide/sg-core.js first');

${parts.join('\n')}})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/**
 * The marker lines of a generated block inside a hand-written file, by the
 * file's comment syntax: the block is everything between them.
 */
function blockMarkers(path, name) {
  const note = `generated: ${name} (scripts/build.mjs; do not edit)`;
  if (/\.md$/.test(path)) return [`<!-- ${note} -->`, `<!-- /generated: ${name} -->`];
  // In a stylesheet the block sits inside a comment (themes/example.css): plain marker lines.
  if (/\.css$/.test(path)) return [`── ${note} ──`, `── /generated: ${name} ──`];
  return [`// ${note}`, `// /generated: ${name}`];
}

/**
 * `text` with its generated block `name` replaced by `content` (lines, no
 * final newline needed). The markers keep their indentation; a file
 * without both markers throws, so a lost marker never goes unnoticed.
 */
export function replaceBlock(text, path, name, content) {
  const [open, close] = blockMarkers(path, name);
  const start = text.indexOf(open);
  const end = text.indexOf(close, start);
  if (start < 0 || end < 0) throw new Error(`${path}: the markers "${open}" and "${close}" of the generated block ${name} are missing`);
  const indent = text.slice(text.lastIndexOf('\n', start) + 1, start);
  const body = content.replace(/\n+$/, '');
  return `${text.slice(0, start + open.length)}\n${body ? `${body}\n` : ''}${indent}${text.slice(end)}`;
}

/**
 * The rows of the "Component hooks" table of docs/theming.md: the core
 * hooks (src/core/hooks.json), then every component's described hooks in
 * meta.json "order", each in its meta.json's order; adjacent hooks of one
 * component with the same default and description share a row.
 */
export function hooksTable(list) {
  const rows = [];
  const add = (entries) => {
    let last = null;
    for (const [name, entry] of entries) {
      if (last && last.default === entry.default && last.description === entry.description) last.names.push(name);
      else rows.push(last = { names: [name], default: entry.default, description: entry.description });
    }
  };
  add(Object.entries(coreHooks()));
  for (const component of list) add(ownedHooks(component.meta).map((name) => [name, component.meta.hooks[name]]));
  return ['| Hook | Default | Component |', '|---|---|---|', ...rows.map((row) => `| ${row.names.map((name) => `\`${name}\``).join(', ')} | ${row.default} | ${row.description} |`)].join('\n');
}

/**
 * The hooks of themes/example.css (commented out, in a generated block):
 * every hook of the docs/theming.md table in its order, each with the
 * fallback its stylesheet reads it with.
 */
export function exampleHooks(list) {
  const sources = [{ name: 'motion', css: 'src/core/motion.css', hooks: Object.keys(coreHooks()) }, ...list.map((component) => ({ ...component, hooks: Object.assign(ownedHooks(component.meta), { unset: new Set(ownedHooks(component.meta).filter((name) => component.meta.hooks[name].default === 'unset')) }) }))];
  return sources.flatMap(({ css, hooks }) => {
    const code = stripCssComments(repoText(css));
    return hooks.map((name) => {
      const value = hooks.unset?.has(name) ? '(unset)' : fallbackOf(code, name) ?? '(set by the component)';
      if (value.includes('*/')) throw new Error(`${css}: the fallback of ${name} would end the comment of themes/example.css`);
      return `  ${name}: ${value};`;
    });
  }).join('\n');
}

/** The table of the keyframes the components define (<name>.keyframes.css, meta.json "keyframeDocs") for docs/motion.md. */
export function componentKeyframesTable(list) {
  const rows = list.flatMap((component) => componentKeyframes(component).names.map((name) => {
    const docs = component.meta.keyframeDocs?.[name] ?? { movement: '', use: '' };
    return `| \`${name}\` | ${docs.movement} | ${docs.use} ([${component.name}](components.md)) |`;
  }));
  if (!rows.length) return 'No component defines keyframes of its own yet: a `<name>.keyframes.css` adds its rows here.';
  return ['Keyframes a component defines (`src/components/<name>/<name>.keyframes.css`, appended to `motion.css`):', '', '| Name | Movement | Use |', '|---|---|---|', ...rows].join('\n');
}

/** The GitHub anchor of a Markdown heading. */
const anchorOf = (heading) => heading.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-');

/** The table of the JS modules of dist/js/ for docs/install.md: file, namespace, imports, docs. */
export function modulesTable(list) {
  const rows = MODULES.map((name) => {
    const files = moduleFiles(name);
    const imports = moduleImports(moduleSource(name));
    let docs = files.docs.replace(/^docs\//, '');
    if (files.component) {
      const component = list.find((entry) => entry.name === name);
      const heading = component?.md ? /^## (.+)$/m.exec(repoText(component.md))?.[1] : null;
      docs = `components.md${heading ? `#${anchorOf(heading)}` : ''}`;
    }
    return `| \`js/${name}.js\` | \`DS.${name}\` | ${files.component ? `component (\`src/components/${name}/\`)` : 'core (`src/js/`)'} | ${imports.length ? imports.map((other) => `\`${other}\``).join(', ') : '-'} | [${docs.replace(/#.*$/, '')}](${docs}) |`;
  });
  return ['| File | Namespace | Kind | Imports | Docs |', '|---|---|---|---|---|', ...rows].join('\n');
}

/** The module imports and the DS namespaces of src/types/ds.d.ts (its two generated blocks). */
export function dsTypes(source) {
  const imports = MODULES.map((name) => `import type * as ${name} from './js/${name}.js';`).join('\n');
  const namespaces = MODULES.map((name) => `  readonly ${name}: typeof ${name};`).join('\n');
  return replaceBlock(replaceBlock(source, 'src/types/ds.d.ts', 'modules', imports), 'src/types/ds.d.ts', 'namespaces', namespaces);
}

/** The ripple hosts of every meta.json "rippleHosts", in component order: the generated block of RIPPLE_HOSTS in src/js/ripple.js. */
export function rippleHostLines(list) {
  return list.flatMap((component) => (component.meta.rippleHosts ?? []).map((selector) => {
    if (selector.includes("'")) throw new Error(`src/components/${component.name}/meta.json: a ripple host without ' (${selector})`);
    return `  '${selector}',`;
  })).join('\n');
}

/** The modules of the theme generator, in dependency order: the classic script holds these three. */
const THEME_GENERATOR_MODULES = ['color', 'theme-rules', 'theme'];

/**
 * styleguide/theme-generator.js: the library part of tools/theme.mjs and the
 * two modules it imports as one classic script, because engines load no ES
 * module from file:// (only Firefox does) and the theme panel works from
 * disk. Each module keeps its own function, so their private names cannot
 * meet. The CLI of theme.mjs stays out: it needs Node and top-level await.
 */
export function themeGeneratorJs(read = repoText) {
  const parts = THEME_GENERATOR_MODULES.map((name) => {
    const path = `scripts/tools/${name}.mjs`;
    const cli = read(path).indexOf('// ── CLI');
    const source = (cli < 0 ? read(path) : read(path).slice(0, cli)).replace(/^#!.*\n/, '');
    const exported = [];
    const body = source
      .replace(/^export (async function|function|const|let|class) ([\w$]+)/gm, (_, kind, id) => { exported.push(id); return `${kind} ${id}`; })
      .replace(/^import \{([^}]*)\} from '\.\/([\w-]+)\.mjs';$/gm, (_, names, from) => {
        if (!THEME_GENERATOR_MODULES.slice(0, THEME_GENERATOR_MODULES.indexOf(name)).includes(from)) throw new Error(`${path}: imports ./${from}.mjs, which the classic theme generator does not hold before it`);
        if (/\bas\b/.test(names)) throw new Error(`${path}: no renamed import in the theme generator's modules`);
        return `const {${names}} = modules['${from}'];`;
      });
    if (/^(export|import)\b|\bimport\.meta\b|\bawait import\(/m.test(body)) throw new Error(`${path}: the library part of a theme generator module has an export or import the classic script cannot hold`);
    return `  // ── ${path}\n  modules['${name}'] = (function () {\n${body.trimEnd()}\n\n  return { ${exported.join(', ')} };\n  })();\n`;
  });
  return `/*
 * The theme generator as one classic script: scripts/tools/color.mjs,
 * theme-rules.mjs and the library part of theme.mjs. Generated by
 * scripts/build.mjs; do not edit. The theme panel of the styleguide reads
 * window.SG_THEME_GENERATOR; a classic script, so it works from disk in every
 * engine (test/browser/styleguide-v3.spec.js).
 */
(function (root) {
  'use strict';
  var modules = {};

${parts.join('\n')}
  root.SG_THEME_GENERATOR = modules['theme'];
})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/**
 * styleguide/lab-components.js: every src/components/<name>/<name>.lab.js
 * in component order, each in a function of its own, after the definition
 * of SG_LAB.add(entry). A classic script that motion.html loads after
 * lab.js (which sets window.SG_LAB, the entries of the lab) and before
 * styleguide.js (which renders them).
 */
export function labComponentsJs(list, read = repoText) {
  const parts = list.filter((component) => component.lab).map((component) => {
    const source = read(component.lab);
    if (/^\s*(import|export)\b/m.test(source)) throw new Error(`${component.lab}: a classic script: no import or export; call SG_LAB.add({ ... })`);
    if (!/\bSG_LAB\.add\(/.test(source)) throw new Error(`${component.lab}: adds its entries with SG_LAB.add({ ... })`);
    const body = source.trimEnd().split('\n').map((line) => (line ? `    ${line}` : line)).join('\n');
    return `  // ── components/${component.name}/${component.name}.lab.js\n  (function () {\n${body}\n  }());\n`;
  });
  return `/*
 * The Motion Lab entries of the components, one function per
 * src/components/<name>/<name>.lab.js, in component order. Generated by
 * scripts/build.mjs; do not edit. A classic script (the lab works from
 * disk): motion.html loads it after lab.js and before styleguide.js.
 *
 * SG_LAB.add(entry) appends one entry to window.SG_LAB, in the shape the
 * head of lab.js documents: id, group (an id of SG_LAB_GROUPS), title,
 * shows, html and play(stage, sg) are required; note, height, after,
 * controls, wide, playLabel, setup, toggle, state, reset and subject are
 * optional. An id may be used once; a bad entry throws, so the lab's
 * console error fails test/browser/lab.spec.js.
 */
(function (root) {
  'use strict';
  var lab = root.SG_LAB || (root.SG_LAB = []);
  if (!lab.add) {
    Object.defineProperty(lab, 'add', {
      value: function (entry) {
        var fail = function (why) { throw new Error('SG_LAB.add(' + (entry && entry.id) + '): ' + why); };
        if (!entry || typeof entry !== 'object') fail('an entry object');
        ['id', 'group', 'title', 'html'].forEach(function (key) { if (typeof entry[key] !== 'string' || !entry[key]) fail(key + ' is a string'); });
        if (!Array.isArray(entry.shows) || !entry.shows.length) fail('shows lists what it plays');
        if (typeof entry.play !== 'function') fail('play(stage, sg) is a function');
        ['setup', 'toggle', 'state', 'reset', 'subject'].forEach(function (key) { if (key in entry && typeof entry[key] !== 'function') fail(key + ' is a function'); });
        if (lab.some(function (other) { return other.id === entry.id; })) fail('the id is taken');
        lab.push(entry);
        return entry;
      },
    });
  }
  var SG_LAB = lab;

${parts.join('\n')}})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/**
 * styleguide/registry.js: what the styleguide knows from the folders, as
 * window.SG_REGISTRY (a classic script, for file://): the groups, every
 * component (name, group, order, need, tier, status, whether it has a
 * demo, its anchor in docs/components.md, its classes, attributes and
 * hooks) in meta.json "order", every
 * token of src/core/tokens.css as [name, "scale" or "role"], and the rows
 * of the 2.x "Which component for which need" table (the intro partial of
 * docs/components.md) as [need, component]: the component whose docs
 * heading the row links to, else the owner of the first class it names.
 * need, tier and status are null until a meta.json has them.
 */
export function registryJs(list) {
  const raw = mainThemeRule(repoText('src/core/tokens.css'));
  const marker = raw.indexOf('── 2. Palette');
  const declared = (text) => [...new Set([...stripCssComments(text).matchAll(/(--ds-[\w-]+)\s*:/g)].map((m) => m[1]))];
  const scales = declared(raw.slice(0, marker));
  const tokens = [...scales.map((name) => [name, 'scale']), ...declared(raw.slice(marker)).filter((name) => !scales.includes(name)).map((name) => [name, 'role'])];
  const slug = (title) => title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  const anchors = new Map();
  const owners = new Map();
  for (const { name, meta, md } of list) {
    if (md) for (const match of repoText(md).matchAll(/^#{2,3} (.+)$/gm)) if (!anchors.has(slug(match[1]))) anchors.set(slug(match[1]), name);
    for (const cls of meta.classes) owners.set(cls, name);
  }
  const plain = (text) => text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\*\*/g, '').trim();
  const needs = [];
  const intro = repoText('src/components/_partials/intro.md');
  const table = intro.slice(intro.indexOf('## Which component for which need'));
  for (const line of table.split('\n').filter((row) => /^\| (?!Need \||---)/.test(row))) {
    const [need, use = ''] = line.slice(2, -2).split(' | ');
    const linked = [...use.matchAll(/\]\(#([\w-]+)\)/g)].map((m) => anchors.get(m[1])).find(Boolean);
    const owned = [...use.matchAll(/`\.(ds-[\w-]+)/g)].map((m) => owners.get(m[1])).find(Boolean);
    if (linked || owned) needs.push([plain(need), linked || owned]);
  }
  const docsAnchor = (md) => (md ? slug(/^## (.+)$/m.exec(repoText(md))?.[1] ?? '') : null);
  const components = list.map(({ name, meta, demo, md }) => JSON.stringify({
    name, group: meta.group, order: meta.order, need: meta.need ?? null, tier: meta.tier ?? null, status: meta.status ?? null,
    demo: Boolean(demo), docs: docsAnchor(md), classes: meta.classes, attributes: meta.attributes, hooks: ownedHooks(meta),
  }));
  return `/*
 * The styleguide's registry: the groups, the components (from every
 * src/components/<name>/meta.json), the tokens of src/core/tokens.css and
 * the 2.x need table (src/components/_partials/intro.md).
 * Generated by scripts/build.mjs; do not edit. A classic script, so the
 * styleguide still works from disk.
 */
(function (root) {
  'use strict';
  root.SG_REGISTRY = {
    groups: ${JSON.stringify(GROUPS)},
    components: [
${components.map((line) => `      ${line},`).join('\n')}
    ],
    tokens: [
${tokens.map((pair) => `      ${JSON.stringify(pair)},`).join('\n')}
    ],
    needs: [
${needs.map((pair) => `      ${JSON.stringify(pair)},`).join('\n')}
    ],
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/** The generated files of the repository: Map of repository path -> text. */
export function generatedFiles(list = components()) {
  return new Map([
    ['src/index.css', indexCss(list)],
    ['docs/components.md', componentsMd(list)],
    ['styleguide/demos.js', demosJs(list)],
    ['styleguide/lab-components.js', labComponentsJs(list)],
    ['docs/theming.md', replaceBlock(repoText('docs/theming.md'), 'docs/theming.md', 'hooks', hooksTable(list))],
    ['docs/motion.md', replaceBlock(repoText('docs/motion.md'), 'docs/motion.md', 'component keyframes', componentKeyframesTable(list))],
    ['docs/install.md', replaceBlock(repoText('docs/install.md'), 'docs/install.md', 'modules', modulesTable(list))],
    ['src/types/ds.d.ts', dsTypes(repoText('src/types/ds.d.ts'))],
    ['src/js/ripple.js', replaceBlock(repoText('src/js/ripple.js'), 'src/js/ripple.js', 'ripple hosts', rippleHostLines(list))],
    ['README.md', readmeCount(repoText('README.md'), list.length)],
    ['themes/example.css', replaceBlock(repoText('themes/example.css'), 'themes/example.css', 'hooks', exampleHooks(list))],
    ['styleguide/registry.js', registryJs(list)],
    ['styleguide/theme-generator.js', themeGeneratorJs()],
  ]);
}

/** README.md with the component count of its Components badge (a badge line takes no marker comments). */
export function readmeCount(text, count) {
  const badge = /!\[Components: \d+\]\(https:\/\/img\.shields\.io\/badge\/components-\d+-/;
  if (!badge.test(text)) throw new Error('README.md: no "![Components: <n>](https://img.shields.io/badge/components-<n>-..." badge');
  return text.replace(badge, `![Components: ${count}](https://img.shields.io/badge/components-${count}-`);
}

/** Generated files that differ from what is on disk. */
export function diffGenerated(files = generatedFiles()) {
  const problems = [];
  for (const [path, content] of files) {
    if (!repoHas(path)) problems.push(`missing: ${path}`);
    else if (repoText(path) !== content) problems.push(`outdated: ${path}`);
  }
  return problems;
}

// ── Minifying ──────────────────────────────────────────────────────────

/** The browser floor (D9): Safari 17.5, Chrome 123, Firefox 130, in lightningcss's encoding. */
export const CSS_TARGETS = { safari: (17 << 16) | (5 << 8), chrome: 123 << 16, firefox: 130 << 16 };

/**
 * Minifies one stylesheet with lightningcss at the floor, lowering nothing:
 * every feature of lightningcss's Features is excluded, so it neither
 * prefixes, nor removes a prefix, nor rewrites nesting, colours, :is() or
 * logical properties. The banner and the layer statements are blanked
 * before (the line count stays, so the source map points at `file`) and
 * written first again: lightningcss merges the blocks of one layer and
 * drops a statement it finds redundant, and a single file or a bundle of
 * them needs the statement to fix the order. Returns { css, map }.
 */
export function minifyCss(source, file, info) {
  if (!lightning) throw new Error('lightningcss is not installed: run npm ci (scripts/build.mjs minifies with it)');
  const statements = [];
  const input = source.split('\n').map((line) => {
    if (line.startsWith('/*! ')) return '';
    if (/^@layer [\w.,\- ]+;$/.test(line)) {
      if (!statements.includes(line)) statements.push(line);
      return '';
    }
    return line;
  }).join('\n');
  const exclude = Object.values(lightning.Features).reduce((all, bit) => all | bit, 0);
  const name = file.replace(/^.*\//, '');
  const min = name.replace(/\.css$/, '.min.css');
  const result = lightning.transform({ filename: name, code: Buffer.from(input), minify: true, sourceMap: true, targets: CSS_TARGETS, exclude, errorRecovery: false });
  if (result.warnings.length) throw new Error(`${file}: lightningcss: ${result.warnings.map((warning) => warning.message).join('; ')}`);
  const head = [banner(info).trimEnd(), ...statements];
  const map = JSON.parse(result.map.toString());
  const out = { version: 3, file: min, sources: [name], names: map.names ?? [], mappings: ';'.repeat(head.length) + map.mappings };
  return { css: `${head.join('\n')}\n${result.code.toString().trim()}\n/*# sourceMappingURL=${min}.map */\n`, map: `${JSON.stringify(out)}\n` };
}

/** Words after which a `/` starts a regular expression, not a division. */
const BEFORE_REGEX = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);

/**
 * A small JS stripper for ds.min.js: comments and indentation go, so do
 * empty lines and trailing spaces; nothing else changes. Strings, template
 * literals (with their ${} expressions, at any depth) and regular
 * expression literals are copied as they are, `/*!` comments stay, and a
 * comment that spans lines becomes a line break, so automatic semicolon
 * insertion sees what it saw before. Nothing is renamed or reordered.
 */
export function stripJs(source) {
  const lines = [];
  const n = source.length;
  const templates = [];
  let line = '';
  let i = 0;
  let depth = 0;
  let prev = '';
  const flush = () => {
    const text = line.trimEnd();
    if (text) lines.push(text);
    line = '';
  };
  // From inside a template literal to its closing backtick, or to a ${ (code until its }).
  const template = () => {
    while (i < n) {
      const c = source[i];
      if (c === '\\') { line += source.slice(i, i + 2); i += 2; continue; }
      if (c === '`') { line += c; i += 1; prev = '`'; return; }
      if (c === '$' && source[i + 1] === '{') { line += '${'; i += 2; templates.push(depth); depth += 1; prev = '{'; return; }
      line += c;
      i += 1;
    }
    throw new Error('stripJs: an unterminated template literal');
  };
  const regexAllowed = () => {
    if (prev === '') return true;
    if (/^[\w$]+$/.test(prev)) return BEFORE_REGEX.has(prev);
    return !/^[)\]}"'`]$|^regex$/.test(prev);
  };
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    if (c === '\n') { flush(); i += 1; continue; }
    if (c === '\r') { i += 1; continue; }
    if (c === ' ' || c === '\t') {
      if (line) line += c;
      i += 1;
      continue;
    }
    if (c === '/' && next === '/') {
      const end = source.indexOf('\n', i);
      i = end < 0 ? n : end;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end < 0) throw new Error('stripJs: an unterminated comment');
      const comment = source.slice(i, end + 2);
      i = end + 2;
      if (comment.startsWith('/*!')) line += comment;
      else if (comment.includes('\n')) flush();
      else if (line && !line.endsWith(' ')) line += ' ';
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && source[j] !== c) {
        if (source[j] === '\\') j += 1;
        else if (source[j] === '\n') throw new Error('stripJs: an unterminated string');
        j += 1;
      }
      if (j >= n) throw new Error('stripJs: an unterminated string');
      line += source.slice(i, j + 1);
      i = j + 1;
      prev = c;
      continue;
    }
    if (c === '`') {
      line += c;
      i += 1;
      template();
      continue;
    }
    if (c === '/' && regexAllowed()) {
      let j = i + 1;
      let inClass = false;
      while (j < n) {
        const ch = source[j];
        if (ch === '\\') { j += 2; continue; }
        if (ch === '\n') throw new Error('stripJs: an unterminated regular expression');
        if (inClass) { if (ch === ']') inClass = false; } else if (ch === '[') inClass = true;
        else if (ch === '/') break;
        j += 1;
      }
      j += 1;
      while (j < n && /[a-z]/i.test(source[j])) j += 1;
      line += source.slice(i, j);
      i = j;
      prev = 'regex';
      continue;
    }
    if (/[\w$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w$]/.test(source[j])) j += 1;
      prev = source.slice(i, j);
      line += prev;
      i = j;
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') {
      depth -= 1;
      if (templates.length && templates[templates.length - 1] === depth) {
        templates.pop();
        line += c;
        i += 1;
        template();
        continue;
      }
    }
    line += c;
    prev = c;
    i += 1;
  }
  flush();
  return `${lines.join('\n')}\n`;
}

// ── dist/manifest.json ─────────────────────────────────────────────────

/** The keys of src/js/<module>.requires.json, in order. */
export const MODULE_REQUIRES_KEYS = ['requires', 'exportRequires', 'attributes'];

/**
 * The CSS each module of MODULES needs, from data, as manifest.json
 * "js.<module>" writes it (tools/bundle.mjs resolves both):
 *   requires        the components the module needs whatever it is used
 *                   for: its own component (the component of its name,
 *                   whose meta.json "js" lists it: the meta.json "js"
 *                   arrays inverted) plus the "requires" of
 *                   src/js/<module>.requires.json
 *   exportRequires  per export, the components whose markup that export
 *                   writes itself (a confirm dialog, a toast, a live
 *                   region on .ds-sr): "exportRequires" of
 *                   src/js/<module>.requires.json, kept next to the module
 *   attributes      the data-ds-* attributes that need this module, whichever
 *                   component's markup they sit on (optional in the sidecar,
 *                   for a core module: [data-ds-close] is the overlay's, also
 *                   where dialog.js writes it into a built dialog)
 * The sidecar is optional (none: no extra requirement).
 */
export function moduleRequires(list = components()) {
  const usedBy = new Map(MODULES.map((name) => [name, list.filter((component) => component.meta.js.includes(name)).map((component) => component.name)]));
  return Object.fromEntries(MODULES.map((name) => {
    const path = moduleFiles(name).requires;
    const data = repoHas(path) ? JSON.parse(repoText(path)) : { requires: [], exportRequires: {} };
    const own = usedBy.get(name).filter((component) => component === name);
    return [name, { requires: sorted([...own, ...data.requires]), exportRequires: data.exportRequires, attributes: sorted([...(data.attributes ?? []), ...(moduleFiles(name).component ? [] : moduleAttributes(name))]) }];
  }));
}

/** Checks every src/js/<module>.requires.json (keys, known exports and components, sorted lists); returns the problems. */
export function verifyModuleRequires(list = components()) {
  const problems = [];
  const names = new Set(list.map((component) => component.name));
  for (const name of MODULES) {
    const path = moduleFiles(name).requires;
    if (!repoHas(path)) continue;
    let data;
    try {
      data = JSON.parse(repoText(path));
    } catch (error) {
      problems.push(`${path}: ${error.message}`);
      continue;
    }
    // The last key, "attributes", is optional.
    const written = Object.keys(data);
    if (written.length < 2 || written.join() !== MODULE_REQUIRES_KEYS.slice(0, written.length).join()) {
      problems.push(`${path}: the keys ${MODULE_REQUIRES_KEYS.join(', ')}, in this order`);
      continue;
    }
    const exports = [...repoText(moduleFiles(name).source).matchAll(/^export (?:const|function) ([\w$]+)/gm)].map((match) => match[1]);
    const lists = [['requires', data.requires], ...Object.entries(data.exportRequires ?? {}).map(([key, value]) => [`exportRequires.${key}`, value])];
    for (const [where, value] of lists) {
      // "requires" may be empty; an export listed in "exportRequires" needs something.
      if (!Array.isArray(value) || value.some((other) => typeof other !== 'string') || (!value.length && where !== 'requires')) {
        problems.push(`${path}: "${where}" is a list of component names`);
        continue;
      }
      for (const other of value) if (!names.has(other)) problems.push(`${path}: "${where}" names ${other}, no component`);
      if ([...value].sort().join() !== value.join()) problems.push(`${path}: "${where}" is not sorted`);
    }
    const keys = Object.keys(data.exportRequires ?? {});
    for (const key of keys) if (!exports.includes(key)) problems.push(`${path}: "exportRequires" names ${key}, no export of ${moduleFiles(name).source}`);
    if ([...keys].sort().join() !== keys.join()) problems.push(`${path}: the exports of "exportRequires" are not sorted`);
    const attributes = data.attributes ?? [];
    if (!Array.isArray(attributes) || [...attributes].sort().join() !== attributes.join()) problems.push(`${path}: "attributes" is a sorted list`);
    else for (const attribute of attributes) if (!repoText(moduleFiles(name).source).includes(`'${attribute}'`)) problems.push(`${path}: "attributes" names ${attribute}, which ${moduleFiles(name).source} does not read`);
  }
  return problems;
}

/**
 * The data-ds-* attributes that lead a bundle to a module.
 * A component's module: every one it names as a string literal
 * (`attribute: 'data-ds-<name>'`), on the component's manifest entry. One a
 * module claims in its "attributes" stays that module's: dialog.js writes
 * data-ds-close into a built dialog, but a sheet with data-ds-close needs the
 * overlay, not the dialog.
 * A core module (src/js): only what its define() declares, on the module's
 * entry, so data-ds-indicator finds DS.indicator, data-ds-hotkey DS.hotkeys and
 * data-ds-time DS.format. Not every literal: data-ds-keep is the public side of
 * morphHtml, and a page using it needs neither the indicator nor the ripple.
 */
function moduleAttributes(name, claimed = new Set()) {
  if (!MODULES.includes(name)) return [];
  const source = repoText(moduleFiles(name).source);
  const text = moduleFiles(name).component ? source : [...source.matchAll(/^\s+attributes?:\s*(?:'[^'\n]*'|\[[^\]\n]*\])/gm)].map((match) => match[0]).join(' ');
  return [...text.matchAll(/['"`](data-ds-[\w-]+)['"`]/g)].map((match) => match[1]).filter((attribute) => !claimed.has(attribute));
}

/** The exports and sibling imports of each module of MODULES, and the CSS it needs (moduleRequires). */
function moduleFacts(list) {
  const needs = moduleRequires(list);
  return Object.fromEntries(MODULES.map((name) => {
    const source = moduleSource(name);
    const imports = moduleImports(source);
    const exports = [...source.matchAll(/^export (?:const|function) ([\w$]+)/gm)].map((match) => match[1]);
    return [name, { file: `js/${name}.js`, types: `js/${name}.d.ts`, imports, exports, ...needs[name] }];
  }));
}

/**
 * dist/manifest.json, for tools/bundle.mjs and check-project:
 *   name, version     the package
 *   layers, sublayers the two statements every bundle starts with (the
 *                     sublayers are reserved: see INDEX_HEADER)
 *   core              the core stylesheets (css, min) and css/properties.css
 *   pseudo            tokens, motion and base as pseudo-components: the
 *                     classes, attributes and keyframes of the core
 *                     stylesheets (motion defines every keyframe), so every
 *                     class of ds.css resolves to a file
 *   order             the components in cascade order
 *   components        per component: its files, the layer its rules sit in
 *                     (ds.components for now, so a bundle writes the
 *                     components in order), group, requires (what a
 *                     bundle resolves, transitively), context (styled where
 *                     both meet, never pulled in), classes,
 *                     attributes, keyframes, js, hooks, ripple, progressive,
 *                     and bytes and gzip, the sizes of its .min.css (gzip -9)
 *   js                per module of MODULES: its file, types, the modules it
 *                     imports, its exports, the CSS it needs: requires
 *                     (always) and exportRequires (per export), and the
 *                     attributes that need it, see moduleRequires()
 */
export function manifestJson(list, sizes, info) {
  const { facts, core } = componentFacts(list);
  const claimed = new Set(Object.values(moduleRequires(list)).flatMap((entry) => entry.attributes));
  const pseudo = Object.fromEntries(CORE.map((name) => {
    const entry = core.get(name);
    return [name, { css: `css/core/${name}.css`, min: `css/core/${name}.min.css`, classes: entry.classes, attributes: entry.attributes, keyframes: name === 'motion' ? entry.defines : entry.keyframes }];
  }));
  const manifest = {
    name: 'dashboard-style',
    version: info.version,
    layers: LAYERS,
    sublayers: sublayerStatement(list),
    core: {
      css: CORE_FILES.map((name) => `css/core/${name}.css`),
      min: CORE_FILES.map((name) => `css/core/${name}.min.css`),
      properties: 'css/properties.css',
    },
    pseudo,
    order: list.map((component) => component.name),
    components: Object.fromEntries(list.map(({ name, meta }) => {
      const min = `css/components/${name}.min.css`;
      return [name, {
        css: `css/components/${name}.css`,
        min,
        layer: 'ds.components',
        group: meta.group,
        requires: meta.requires,
        context: meta.context,
        classes: meta.classes,
        // What the stylesheet selects, plus the behaviour attributes its module reads, so a bundle finds a behaviour by its attribute.
        attributes: sorted([...facts.get(name).attributes, ...moduleAttributes(name, claimed)]),
        keyframes: meta.keyframes,
        js: meta.js,
        hooks: sorted(Object.keys(meta.hooks)),
        ripple: meta.ripple,
        progressive: meta.progressive,
        bytes: sizes.get(min).bytes,
        gzip: sizes.get(min).gzip,
      }];
    })),
    js: moduleFacts(list),
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** One `@import 'x';` or `@import "x";` line, the final newline optional. */
const IMPORT_LINE = /^@import\s+(?:'([^']+)'|"([^"]+)");[ \t]*(?:\n|$)/gm;

/**
 * Inlines the @import lines of a stylesheet, recursively (`contents`, when
 * given, stands for the file's text: the generated src/index.css). `ancestors` is
 * the chain of files above this one (a file among them is a cycle);
 * `inlined` holds every file inlined so far (a file imported a second time
 * through another parent would repeat its rules). Any @import left after
 * inlining is a form this build does not read, so it throws instead of
 * shipping a request for a file that is not there.
 */
export function inlineCss(path, ancestors = [], inlined = new Set(), contents = undefined, overrides = new Map()) {
  if (ancestors.includes(path)) throw new Error(`CSS import cycle: ${[...ancestors, path].join(' -> ')}`);
  if (inlined.has(path)) throw new Error(`CSS duplicate import: ${path} (imported by ${ancestors.at(-1)})`);
  inlined.add(path);
  const chain = [...ancestors, path];
  const css = (contents ?? overrides.get(path) ?? readText(path)).replace(IMPORT_LINE, (line, single, double) => {
    const child = resolve(dirname(path), single ?? double);
    const body = inlineCss(child, chain, inlined, undefined, overrides).trimEnd();
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

/**
 * Turns one ES module of src/js into a function body that returns its
 * exports, as `<namespace>.<name> = (function () { ... })();`
 * (tools/js-wrap.mjs moduleBody over MODULES): `export const` and
 * `export function` only, imports only from an earlier module.
 */
export function moduleBody(source, name, namespace = 'DS') {
  if (MODULES.includes(name) && moduleFiles(name).component) source = rewriteComponentImports(source, name);
  return wrapModule(source, name, MODULES.includes(name) ? MODULES : [name], { namespace });
}

/**
 * dist/ds.js: every module of MODULES through tools/js-wrap.mjs, in merge
 * mode (a later copy or bundle of the same version adds what the page
 * lacks instead of returning early), with DS.init, DS.get, DS.define and
 * DS.config as the top-level aliases of DS.core.
 */
export function buildJs(info) {
  const modules = MODULES.map((name) => ({ name, source: moduleSource(name) }));
  return classicScript({ version: info.version, banner: banner(info), modules, merge: true });
}

let built = null;

/**
 * Everything dist/ should contain: Map of posix path -> Buffer. The first
 * call builds (and checks every meta.json, which stops the build on a
 * mismatch); later calls in the same process return a copy of that map.
 */
export function build() {
  built ??= buildDist();
  return new Map(built);
}

function buildDist() {
  const info = packageInfo();
  const list = components();
  const problems = verifyComponents(list);
  if (problems.length) throw new Error(`meta.json does not match the stylesheets:\n  ${problems.join('\n  ')}`);
  const moduleProblems = verifyModuleRequires(list);
  if (moduleProblems.length) throw new Error(`src/js/<module>.requires.json:\n  ${moduleProblems.join('\n  ')}`);
  const sublayers = sublayerStatement(list);
  const out = new Map();
  const sizes = new Map();
  const text = (path, value) => out.set(path, Buffer.from(value, 'utf8'));
  /** A stylesheet of dist/ and, next to it, its .min.css and .min.css.map. */
  const stylesheet = (path, value) => {
    text(path, value);
    const { css, map } = minifyCss(value, path, info);
    const min = path.replace(/\.css$/, '.min.css');
    text(min, css);
    text(`${min}.map`, map);
    const bytes = Buffer.byteLength(css);
    sizes.set(min, { bytes, gzip: gzipSync(css, { level: 9 }).length });
  };
  /** A single stylesheet: the banner, and the sublayer statement right after the layer statement. */
  const single = (path, source) => {
    if (!source.includes(`\n${LAYERS}\n`)) throw new Error(`src/${path.slice(4)}: no "${LAYERS}" line`);
    stylesheet(path, withBanner(path, source.replace(`\n${LAYERS}\n`, `\n${LAYERS}\n${sublayers}\n`), info));
  };

  // motion.css with the keyframes of every <name>.keyframes.css (motionCss).
  const motion = motionCss(list);
  const css = `${banner(info)}${layerStatementOnce(inlineCss(join(ROOT, 'src/index.css'), [], new Set(), indexCss(list), new Map([[join(ROOT, 'src/core/motion.css'), motion]]))).trimEnd()}\n`;
  stylesheet('ds.css', css);
  stylesheet('css/properties.css', propertiesCss(css, info));
  const js = buildJs(info);
  text('ds.js', js);
  text('ds.min.js', `${banner(info)}/*! Icon shapes: Lucide (ISC) and Feather (MIT), see LICENSE */\n${stripJs(js.slice(banner(info).length))}`);
  text('css/index.css', withBanner('css/index.css', indexCss(list, true), info));

  for (const file of filesIn(join(ROOT, 'src'))) {
    const path = posix(relative(join(ROOT, 'src'), file));
    let match;
    if (path === 'properties.css') throw new Error('src/properties.css would replace the generated css/properties.css');
    if (path === 'index.css') continue; // generated (indexCss); ds.css and css/index.css come from the list
    if ((match = /^core\/([\w-]+)\.css$/.exec(path))) {
      if (!CORE.includes(match[1])) throw new Error(`src/${path}: not a core stylesheet (CORE in scripts/build.mjs)`);
      single(`css/${path}`, match[1] === 'motion' ? motion : readText(file));
    } else if (path === 'core/hooks.json') {
      continue; // the core rows of the hooks table of docs/theming.md (hooksTable)
    } else if ((match = /^components\/([\w-]+)\/([\w.-]+)$/.exec(path)) && !match[1].startsWith('_')) {
      const [, name, base] = match;
      // components() has checked the folder's files; the module and its types ship flat in js/.
      if (base === `${name}.css`) single(`css/components/${name}.css`, readText(file));
      else if (base === `${name}.js`) text(`js/${name}.js`, withBanner(base, moduleSource(name), info));
      else if (base === `${name}.d.ts`) text(`js/${name}.d.ts`, withBanner(base, rewriteComponentImports(readText(file), name), info));
    } else if (/^components\/_partials\/[\w-]+\.md$/.test(path)) continue; // the partials of docs/components.md
    else if (/^optional\/[\w-]+\.css$/.test(path)) stylesheet(`css/${path}`, withBanner(path, readText(file), info));
    else if ((match = /^js\/([\w-]+)\.js$/.exec(path))) {
      if (!CORE_MODULES.includes(match[1])) throw new Error(`src/${path}: not a core module (CORE_MODULES in scripts/build.mjs); a component's module sits in its folder`);
      text(path, withBanner(path, readText(file), info));
    }
    else if ((match = /^js\/([\w-]+)\.requires\.json$/.exec(path)) && MODULES.includes(match[1])) continue; // manifest.json "js.<module>" (moduleRequires)
    else if (path === 'deprecations.json') text(path, deprecationsJson(readText(file), info));
    else if (path === 'types/ds.d.ts') text('ds.d.ts', withBanner(path, dsTypes(readText(file)), info));
    else if (/^types\/js\/[\w-]+\.d\.ts$/.test(path) && CORE_MODULES.includes(path.slice(9, -5))) text(path.slice(6), withBanner(path, readText(file), info));
    else throw new Error(`Unexpected file in src/: ${path}`);
  }
  for (const name of MODULES) if (!out.has(`js/${name}.d.ts`)) throw new Error(`${moduleFiles(name).types} is missing: every module has its types`);
  if (!out.has('ds.d.ts')) throw new Error('src/types/ds.d.ts is missing');
  for (const file of filesIn(join(ROOT, 'fonts'))) {
    const path = posix(relative(join(ROOT, 'fonts'), file));
    out.set(`fonts/${path}`, /\.(css|txt)$/.test(path) ? Buffer.from(withBanner(path, readText(file), info), 'utf8') : readFileSync(file));
  }
  for (const name of SHIPPED_THEMES) text(`themes/${name}.css`, withBanner(`${name}.css`, readText(join(ROOT, 'themes', `${name}.css`)), info));
  for (const file of filesIn(join(ROOT, 'themes/presets'))) {
    const path = posix(relative(join(ROOT, 'themes/presets'), file));
    text(`themes/presets/${path}`, withBanner(path, readText(file), info));
  }
  // Every file of scripts/tools/ ships: a new tool needs no entry here.
  for (const file of filesIn(join(ROOT, 'scripts/tools'))) {
    const path = posix(relative(join(ROOT, 'scripts/tools'), file));
    text(`tools/${path}`, withBanner(path, readText(file), info));
  }
  text('tokens.json', tokensJson(info));
  text('manifest.json', manifestJson(list, sizes, info));
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
  const files = generatedFiles();
  // The generated paths alone: `git checkout -- dist $(node scripts/build.mjs --generated)` on a group branch.
  if (process.argv.includes('--generated')) {
    console.log([...files.keys()].join('\n'));
    return;
  }
  if (process.argv.includes('--check')) {
    const out = build();
    const problems = [...diffGenerated(files), ...diffDist(out)];
    if (problems.length) {
      console.error(`dist/ or a generated file is not up to date (run npm run build):\n  ${problems.join('\n  ')}`);
      process.exit(1);
    }
    console.log(`dist/ (${out.size} files) and the generated files (${[...files.keys()].join(', ')}) are up to date.`);
    return;
  }
  for (const [path, content] of files) writeFileSync(join(ROOT, path), content);
  const out = build();
  rmSync(DIST, { recursive: true, force: true });
  for (const [path, content] of out) {
    mkdirSync(dirname(join(DIST, path)), { recursive: true });
    writeFileSync(join(DIST, path), content);
  }
  console.log(`Built dist/ (${out.size} files, version ${packageInfo().version}) and ${[...files.keys()].join(', ')}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
