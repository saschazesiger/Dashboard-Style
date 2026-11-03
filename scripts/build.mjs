#!/usr/bin/env node
/**
 * Builds dist/ and the generated files of the repository from src/ and
 * fonts/. The one build dependency is lightningcss (a pinned
 * devDependency, `npm ci`), which minifies the stylesheets; dist/ itself
 * and every shipped tool stay dependency-free.
 *
 *   node scripts/build.mjs           write dist/ and the generated files
 *   node scripts/build.mjs --check   exit 1 if any of them is not what src/ builds
 *
 * Sources: src/core/{tokens,base,motion}.css, one folder per component
 * (src/components/<name>/ holds <name>.css, meta.json, an optional
 * <name>.md and an optional <name>.demo.js), the partials of
 * docs/components.md (src/components/_partials/), src/optional/, src/js/,
 * src/types/, src/deprecations.json, fonts/, themes/ and scripts/tools/.
 *
 * Generated in the repository (committed; --check compares them too):
 *   src/index.css        the layer statement, the sublayer statement and
 *                        the @import list in meta.json "order"
 *   docs/components.md   the partials and every <name>.md in meta.json "docsOrder"
 *   styleguide/demos.js  the classic script of every <name>.demo.js (window.SG_DEMOS)
 *
 * Every meta.json is verified against its stylesheet first (verifyComponents):
 * classes, attributes, hooks and keyframes exactly, requires, js, ripple and
 * progressive; a mismatch stops the build with the reason.
 *
 * dist/ holds everything a project needs, so it can be vendored alone:
 *   ds.css, ds.min.css   every stylesheet in cascade order (src/index.css
 *                   inlined), the layer and sublayer order declared once at
 *                   the top; the minified copy with ds.min.css.map
 *   ds.js, ds.min.js     classic script: window.DS = { version, motion, indicator, dom, ripple, icons, overlay },
 *                   each copy also under DashboardStyle.versions[version];
 *                   ds.min.js without comments and indentation (stripJs)
 *   css/core/{tokens,base,motion}.css, css/components/<name>.css
 *                   the single stylesheets, each with the layer and the
 *                   sublayer statement, so any subset in any order cascades
 *                   as ds.css does; a .min.css with its .min.css.map next
 *                   to every stylesheet of css/
 *   css/index.css   the @import list of ds.css over the single stylesheets
 *   js/             the ES modules
 *   ds.d.ts, js/*.d.ts  hand-written types (src/types/): the global DS,
 *                   and each module's exports next to the module
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
 *   tools/          dependency-free tools for projects: every file of
 *                   scripts/tools/ (verify.mjs and verify.sh, check-theme.mjs,
 *                   check-project.mjs and the modules they share); a new
 *                   file there ships by itself
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
  if (start < 0) throw new Error('src/tokens.css: no .ds-theme rule');
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
 * use (src/deprecations.json); removed names are not listed.
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
  const scripts = MODULES.map((name) => read(`src/js/${name}.js`)).join('\n');
  const writtenByScript = (name) => scripts.includes(`'${name}'`) || scripts.includes(`"${name}"`) || scripts.includes(`${name}:`);

  // Hooks: the first column of the docs/theming.md table.
  const hookNames = documentedHooks(read('docs/theming.md'));
  for (const name of hookNames) {
    const file = [...sources].find(([, css]) => new RegExp(`var\\(\\s*${name}\\s*,`).test(css));
    add(name, { layer: MOTION_FAMILY.test(name) ? 'motion-hook' : 'hook', default: file ? fallbackOf(file[1], name) : null, component: file ? cssName(file[0]) : null });
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
    if (deprecation?.removed) return [];
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

/** The core stylesheets (src/core/<name>.css) in cascade order: the tokens, the motion keyframes and utilities, the page base. */
export const CORE = ['tokens', 'motion', 'base'];

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
  'details[name]', 'hyphenate-limit-chars', 'alt text for generated content'];

/** The keys of a meta.json, in the order the files write them. */
export const META_KEYS = ['name', 'group', 'order', 'docsOrder', 'classes', 'attributes', 'requires', 'context', 'hooks', 'keyframes', 'js', 'progressive', 'ripple'];

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
 * Every component as { name, meta, css, md, demo } (repository paths, md
 * and demo null when the folder has none), in meta.json "order".
 */
export function components() {
  return componentNames().map((name) => {
    const dir = `src/components/${name}`;
    if (!repoHas(`${dir}/${name}.css`)) throw new Error(`${dir}/: no ${name}.css`);
    if (!repoHas(`${dir}/meta.json`)) throw new Error(`${dir}/: no meta.json (scripts/gen-meta.mjs shows how one is made)`);
    let meta;
    try {
      meta = JSON.parse(repoText(`${dir}/meta.json`));
    } catch (error) {
      throw new Error(`${dir}/meta.json: ${error.message}`);
    }
    const optional = (file) => (repoHas(`${dir}/${file}`) ? `${dir}/${file}` : null);
    return { name, meta, css: `${dir}/${name}.css`, md: optional(`${name}.md`), demo: optional(`${name}.demo.js`) };
  }).sort((a, b) => a.meta.order - b.meta.order);
}

/** Every stylesheet of ds.css in cascade order (repository paths). */
export function cssSources() {
  return [...CORE.map((name) => `src/core/${name}.css`), ...components().map((component) => component.css)];
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

/** The ripple host selectors of src/js/ripple.js (RIPPLE_HOSTS). */
function rippleHosts() {
  const block = /export const RIPPLE_HOSTS = \[([\s\S]*?)\]\.join/.exec(repoText('src/js/ripple.js'));
  if (!block) throw new Error('src/js/ripple.js: no RIPPLE_HOSTS list');
  return [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

/**
 * The facts every check and the manifest share: per component and per
 * core stylesheet, what its CSS styles (cssFacts); which component owns
 * each class (meta.json "classes"); the classes of the core stylesheets
 * that no component owns (pseudo-components tokens, motion, base).
 */
function componentFacts(list) {
  const hooks = documentedHooks(repoText('docs/theming.md'));
  const keyframes = cssFacts(repoText('src/core/motion.css')).defines;
  const facts = new Map(list.map((component) => [component.name, cssFacts(repoText(component.css), { hooks, keyframes })]));
  const owner = new Map();
  for (const component of list) for (const name of component.meta.classes ?? []) if (!owner.has(name)) owner.set(name, component.name);
  // A class of several core stylesheets belongs to the first of tokens, base, motion (.ds-theme to tokens).
  const taken = new Set(owner.keys());
  const core = new Map(['tokens', 'base', 'motion'].map((name) => {
    const found = cssFacts(repoText(`src/core/${name}.css`), { hooks, keyframes });
    const classes = found.classes.filter((cls) => !taken.has(cls));
    for (const cls of classes) taken.add(cls);
    return [name, { ...found, classes }];
  }));
  return { hooks, keyframes, facts, owner, core };
}

/**
 * Checks every meta.json against its folder and its stylesheet; returns the
 * problems (an empty list when everything matches). Exact: classes (every
 * listed class is styled by the file, no class is listed twice, and every
 * class the file styles is its own, a core class or one of a component in
 * "requires" or "context"), attributes, hooks and keyframes (the sets of cssFacts),
 * ripple (whether a RIPPLE_HOSTS selector starts with one of its classes)
 * and progressive (the PROGRESSIVE_NAMES its header note names). Known
 * values: group, js (MODULES), requires and context (other components,
 * apart), unique orders. "requires" is what a bundle resolves (the
 * component needs the other one: its documented markup uses it, or a
 * script of the system writes it); "context" names the components whose
 * classes the stylesheet only styles where both meet (`.ds-card .ds-chip`),
 * which a bundle never pulls in by itself.
 */
export function verifyComponents(list = components()) {
  const problems = [];
  const { facts, owner, core } = componentFacts(list);
  const names = new Set(list.map((component) => component.name));
  const coreClasses = new Set([...core.values()].flatMap((entry) => entry.classes));
  const claimed = new Map();
  const orders = new Map();
  const docOrders = new Map();
  const hosts = new Set(rippleHosts().map((selector) => owner.get(/\.(ds-[\w-]+)/.exec(selector)?.[1])).filter(Boolean));
  const same = (field, listed, found, where) => {
    const missing = found.filter((value) => !listed.includes(value));
    const extra = listed.filter((value) => !found.includes(value));
    if (missing.length) problems.push(`${where}: "${field}" misses ${missing.join(', ')}`);
    if (extra.length) problems.push(`${where}: "${field}" lists ${extra.join(', ')}, which ${where.replace('/meta.json', '.css')} does not use`);
    if (!missing.length && !extra.length && listed.join() !== found.join()) problems.push(`${where}: "${field}" is not sorted`);
  };
  for (const { name, meta, css, md } of list) {
    const where = `src/components/${name}/meta.json`;
    const keys = Object.keys(meta);
    const unknown = keys.filter((key) => !META_KEYS.includes(key));
    const absent = META_KEYS.filter((key) => !keys.includes(key));
    if (unknown.length) problems.push(`${where}: unknown keys ${unknown.join(', ')}`);
    if (absent.length) { problems.push(`${where}: missing keys ${absent.join(', ')}`); continue; }
    if (keys.join() !== META_KEYS.join()) problems.push(`${where}: keys in the order ${META_KEYS.join(', ')}`);
    if (meta.name !== name) problems.push(`${where}: "name" is "${meta.name}", the folder "${name}"`);
    if (!GROUPS.includes(meta.group)) problems.push(`${where}: "group" is one of ${GROUPS.join(', ')}`);
    if (!Number.isInteger(meta.order)) problems.push(`${where}: "order" is an integer`);
    else if (orders.has(meta.order)) problems.push(`${where}: "order" ${meta.order} is also ${orders.get(meta.order)}'s`);
    else orders.set(meta.order, name);
    if (md === null && meta.docsOrder !== null) problems.push(`${where}: "docsOrder" is null without ${name}.md`);
    if (md !== null && !Number.isInteger(meta.docsOrder)) problems.push(`${where}: "docsOrder" is an integer (${name}.md has a place in docs/components.md)`);
    else if (md !== null && docOrders.has(meta.docsOrder)) problems.push(`${where}: "docsOrder" ${meta.docsOrder} is also ${docOrders.get(meta.docsOrder)}'s`);
    else if (md !== null) docOrders.set(meta.docsOrder, name);
    for (const field of ['classes', 'attributes', 'requires', 'context', 'hooks', 'keyframes', 'js', 'progressive']) {
      if (!Array.isArray(meta[field]) || meta[field].some((value) => typeof value !== 'string')) problems.push(`${where}: "${field}" is a list of strings`);
    }
    if (typeof meta.ripple !== 'boolean') problems.push(`${where}: "ripple" is true or false`);
    if (problems.length) continue;
    const found = facts.get(name);
    for (const cls of meta.classes) {
      if (claimed.has(cls)) problems.push(`${where}: .${cls} is listed by ${claimed.get(cls)} too; one component owns a class`);
      else claimed.set(cls, name);
      if (!found.classes.includes(cls)) problems.push(`${where}: lists .${cls}, which ${css} does not style`);
      if (coreClasses.has(cls)) problems.push(`${where}: .${cls} belongs to a core stylesheet`);
    }
    if ([...meta.classes].sort().join() !== meta.classes.join()) problems.push(`${where}: "classes" is not sorted`);
    for (const cls of found.classes) {
      if (meta.classes.includes(cls) || coreClasses.has(cls)) continue;
      const other = owner.get(cls);
      if (!other) problems.push(`${css} styles .${cls}, which no meta.json lists: add it to "classes" of the component that owns it`);
      else if (!meta.requires.includes(other) && !meta.context.includes(other)) problems.push(`${where}: ${css} styles .${cls} of ${other}: add "${other}" to "context" (or to "requires" when ${name} needs it)`);
    }
    same('attributes', meta.attributes, found.attributes, where);
    same('hooks', meta.hooks, found.hooks, where);
    same('keyframes', meta.keyframes, found.keyframes, where);
    for (const field of ['requires', 'context']) {
      for (const other of meta[field]) if (!names.has(other) || other === name) problems.push(`${where}: "${field}" names ${other}, no other component`);
      if ([...meta[field]].sort().join() !== meta[field].join()) problems.push(`${where}: "${field}" is not sorted`);
    }
    const both = meta.requires.filter((other) => meta.context.includes(other));
    if (both.length) problems.push(`${where}: ${both.join(', ')} in both "requires" and "context"`);
    for (const module of meta.js) if (!MODULES.includes(module)) problems.push(`${where}: "js" names ${module}, not a module of MODULES`);
    if (meta.ripple !== hosts.has(name)) problems.push(`${where}: "ripple" is ${meta.ripple}, but RIPPLE_HOSTS of src/js/ripple.js ${hosts.has(name) ? 'lists' : 'does not list'} one of its classes`);
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
 * styleguide/demos.js: every src/components/<name>/<name>.demo.js as
 * window.SG_DEMOS.<name>, a classic script (the styleguide works from
 * disk). A demo file is written like a module of src/js: `export const`
 * and `export function` only, no imports; its exports become the members.
 * styleguide.js calls them with its helper object (`sg`).
 */
export function demosJs(list) {
  const parts = list.filter((component) => component.demo).map((component) => {
    const source = repoText(component.demo);
    if (/^\s*import\b/m.test(source)) throw new Error(`${component.demo}: a demo imports nothing; styleguide.js hands it the helpers (sg)`);
    return moduleBody(source, component.name, 'SG');
  });
  return `/*
 * The component demos of the styleguide, one per src/components/<name>/<name>.demo.js.
 * Generated by scripts/build.mjs; do not edit. A classic script, so
 * styleguide/index.html still works from disk; styleguide.js (loaded after
 * it) renders each demo where its section names it.
 */
(function (root) {
  'use strict';
  var SG = root.SG_DEMOS || (root.SG_DEMOS = {});

${parts.join('\n')}})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/** The generated files of the repository: Map of repository path -> text. */
export function generatedFiles(list = components()) {
  return new Map([
    ['src/index.css', indexCss(list)],
    ['docs/components.md', componentsMd(list)],
    ['styleguide/demos.js', demosJs(list)],
  ]);
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

/** The exports and sibling imports of each module of MODULES. */
function moduleFacts() {
  return Object.fromEntries(MODULES.map((name) => {
    const source = repoText(`src/js/${name}.js`);
    const imports = sorted([...source.matchAll(/^import\s*\{[^}]*\}\s*from\s*['"]\.\/([\w-]+)\.js['"]/gm)].map((match) => match[1]));
    const exports = [...source.matchAll(/^export (?:const|function) ([\w$]+)/gm)].map((match) => match[1]);
    return [name, { file: `js/${name}.js`, types: `js/${name}.d.ts`, imports, exports }];
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
 *                     imports and its exports
 */
export function manifestJson(list, sizes, info) {
  const { facts, core } = componentFacts(list);
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
      css: ['css/core/tokens.css', 'css/core/base.css', 'css/core/motion.css'],
      min: ['css/core/tokens.min.css', 'css/core/base.min.css', 'css/core/motion.min.css'],
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
        attributes: facts.get(name).attributes,
        keyframes: meta.keyframes,
        js: meta.js,
        hooks: meta.hooks,
        ripple: meta.ripple,
        progressive: meta.progressive,
        bytes: sizes.get(min).bytes,
        gzip: sizes.get(min).gzip,
      }];
    })),
    js: moduleFacts(),
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
export function inlineCss(path, ancestors = [], inlined = new Set(), contents = undefined) {
  if (ancestors.includes(path)) throw new Error(`CSS import cycle: ${[...ancestors, path].join(' -> ')}`);
  if (inlined.has(path)) throw new Error(`CSS duplicate import: ${path} (imported by ${ancestors.at(-1)})`);
  inlined.add(path);
  const chain = [...ancestors, path];
  const css = (contents ?? readText(path)).replace(IMPORT_LINE, (line, single, double) => {
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
export function moduleBody(source, name, namespace = 'DS') {
  const exports = [];
  const body = rewriteImports(source, name).replace(/^export (const|function) ([\w$]+)/gm, (match, kind, id) => {
    exports.push(id);
    return `${kind} ${id}`;
  });
  if (/^\s*export\b/m.test(body)) throw new Error(`${name}.js: only "export const" and "export function" are supported`);
  const members = exports.map((id) => `      ${id}: ${id}`).join(',\n');
  const indented = body.trimEnd().split('\n').map((line) => (line ? `    ${line}` : line)).join('\n');
  return `  ${namespace}.${name} = (function () {\n${indented}\n\n    return Object.freeze({\n${members}\n    });\n  })();\n`;
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

  const css = `${banner(info)}${layerStatementOnce(inlineCss(join(ROOT, 'src/index.css'), [], new Set(), indexCss(list))).trimEnd()}\n`;
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
      single(`css/${path}`, readText(file));
    } else if ((match = /^components\/([\w-]+)\/([\w.-]+)$/.exec(path)) && !match[1].startsWith('_')) {
      const [, name, base] = match;
      if (base === `${name}.css`) single(`css/components/${name}.css`, readText(file));
      else if (![`meta.json`, `${name}.md`, `${name}.demo.js`].includes(base)) throw new Error(`Unexpected file in src/components/${name}/: ${base} (a folder holds ${name}.css, meta.json, ${name}.md and ${name}.demo.js)`);
    } else if (/^components\/_partials\/[\w-]+\.md$/.test(path)) continue; // the partials of docs/components.md
    else if (/^optional\/[\w-]+\.css$/.test(path)) stylesheet(`css/${path}`, withBanner(path, readText(file), info));
    else if (path.startsWith('js/') && path.endsWith('.js')) text(path, withBanner(path, readText(file), info));
    else if (path === 'deprecations.json') text(path, deprecationsJson(readText(file), info));
    else if (path === 'types/ds.d.ts') text('ds.d.ts', withBanner(path, readText(file), info));
    else if (/^types\/js\/[\w-]+\.d\.ts$/.test(path) && MODULES.includes(path.slice(9, -5))) text(path.slice(6), withBanner(path, readText(file), info));
    else throw new Error(`Unexpected file in src/: ${path}`);
  }
  for (const name of MODULES) if (!out.has(`js/${name}.d.ts`)) throw new Error(`src/types/js/${name}.d.ts is missing: every module has its types`);
  if (!out.has('ds.d.ts')) throw new Error('src/types/ds.d.ts is missing');
  for (const file of filesIn(join(ROOT, 'fonts'))) {
    const path = posix(relative(join(ROOT, 'fonts'), file));
    out.set(`fonts/${path}`, /\.(css|txt)$/.test(path) ? Buffer.from(withBanner(path, readText(file), info), 'utf8') : readFileSync(file));
  }
  for (const name of SHIPPED_THEMES) text(`themes/${name}.css`, withBanner(`${name}.css`, readText(join(ROOT, 'themes', `${name}.css`)), info));
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
