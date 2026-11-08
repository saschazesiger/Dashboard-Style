#!/usr/bin/env node
/**
 * Moves a project from Dashboard-Style 2.x to 3.0, without dependencies
 * (Node 22 or later; docs/migration.md):
 *
 *   node <copy>/tools/migrate.mjs [--config ds-check.json] [<file, folder or glob> ...]
 *                                 [--write] [--json] [--no-diff] [--deprecations <file>]
 *
 * It reads the copy's deprecations.json (../deprecations.json, or
 * --deprecations) and rewrites in the project's pages, stylesheets, themes
 * and scripts every name it can map:
 *
 *   class      a renamed class (.ds-btn--primary -> .ds-btn--filled); a
 *              modifier that became an option class (.ds-btn--sm -> .ds-sm,
 *              .ds-badge--ok -> .ds-tone-success): in a class list the
 *              option replaces the modifier (once per list), in a selector
 *              it joins the block (.ds-btn--sm -> .ds-btn.ds-sm)
 *   token, role, hook, keyframes
 *              a renamed custom property or keyframe, wherever it is named
 *   attribute  a renamed attribute (data-close -> data-ds-close), in markup,
 *              selectors, strings and dataset (dataset.close -> dataset.dsClose)
 *   export     a renamed function: member calls (.detach() -> .destroy()),
 *              named imports (import { createIndicator } -> import { create as
 *              createIndicator }) and destructuring
 *   strings    the renamed event (ds-close -> ds:close) and variant strings
 *              ('fill-x' -> 'fill'), and settleLoader(t, now) -> settleLoader(t, { now })
 *
 * Everything else a deprecations.json entry finds is listed for a person
 * with its note: changed markup, removed exports and tokens without a
 * replacement, a per-size hook (whose value the size option now computes
 * from the base hook), a class built at run time from a removed prefix
 * ('ds-badge--' + kind). So are the 3.0 changes no name shows: an ES module
 * import of DS.overlay's toast(), confirm() or tooltips() without the
 * module that now holds it, and project rules in @layer ds.components. A
 * rewrite that a wide pattern finds (any detach() call) is made and listed
 * under "review". With --config, the files are those of ds-check.json
 * (css, js, html, themes) and its "major" is set to the copy's.
 *
 * Without --write it is a dry run: a unified diff of every change, then the
 * report. Files are those named (folders are walked for the extensions of
 * EXTENSIONS), or the current folder; node_modules, .git, vendored copies
 * (a folder with SHA256SUMS and deprecations.json), minified files and
 * files the system wrote (its banner) are skipped.
 *
 * Exit codes: 0 nothing left to do; 1 a dry run that would change files or
 * found something for a person, or a --write run that left something for a
 * person; 2 a usage or configuration error. Copied to dist/tools/ by
 * scripts/build.mjs; plain ES2022.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** The file extensions a folder is walked for. */
export const EXTENSIONS = ['html', 'htm', 'css', 'scss', 'less', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'mts', 'cts', 'tsx', 'vue', 'svelte', 'astro', 'tmpl', 'gohtml', 'njk', 'hbs', 'ejs', 'erb', 'php', 'twig', 'liquid'];
const SKIP_DIRS = new Set(['node_modules', '.git']);
/** The option classes of 3.0 (docs/options.md). */
const OPTION = /^ds-(xs|sm|md|lg|xl|density-[a-z]+|shape-[a-z]+|tone-[a-z]+|touch)$/;
/** A size or density word that a per-size hook carries and its base hook does not. */
const SIZE_WORD = /-(xs|sm|md|lg|xl|dense|compact|comfortable|tight)(?=-|$)/;

/** A migration problem of the command line or the config (exit 2). */
export class UsageError extends Error {}

const posix = (path) => path.split(sep).join('/');
const camel = (name) => name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bare = (name) => name.replace(/^\./, '');

/**
 * The rewrites of particular entries, where the entry's replacement alone
 * does not say how (its note does). Keyed by the entry's name; every other
 * entry is read by its kind and replacement (ruleFor()).
 */
const SPECIAL = {
  '.ds-spinner--sm': { type: 'classes', add: ['ds-spinner--ink', 'ds-sm'] },
  '.ds-btn__swap': { type: 'manual', why: 'the markup changed: .ds-btn__faces holds a .ds-btn__face per state' },
  'ds-fill-x': { review: 'the mark sets --ds-share (its share, 0 to 1) instead of its own scaleX(); .ds-enter--fill plays it' },
  'ds-fill-y': { review: 'the mark sets --ds-share (its share, 0 to 1) instead of its own scaleY(); .ds-enter--fill plays it' },
  '.ds-input-group__affix': { review: 'a slot before the input is .ds-input-group__prefix; the tool wrote the suffix' },
  'detach()': { type: 'export', from: 'detach', to: 'destroy', review: 'any detach() call: keep it where the handle is not DS.ripple.attach()\'s' },
  '.ds-enter--fill-x': { review: 'the mark sets --ds-share (its share, 0 to 1) instead of its own scaleX()' },
  '.ds-enter--fill-y': { review: 'the mark sets --ds-share (its share, 0 to 1) instead of its own scaleY()' },
  "enter(el, 'fill-x')": { type: 'string', from: 'fill-x', to: 'fill', review: 'the mark sets --ds-share instead of its own scaleX()' },
  "enter(el, 'fill-y')": { type: 'string', from: 'fill-y', to: 'fill', review: 'the mark sets --ds-share instead of its own scaleY()' },
  'the event ds-close': { type: 'string', from: 'ds-close', to: 'ds:close' },
  'settleLoader(startedAt, now)': { type: 'settleLoader' },
};

/**
 * How the tool handles one deprecations.json entry: { type, ... } with type
 * 'rename' (from, to), 'classes' (block, add), 'attribute' (from, to),
 * 'export' (from, to), 'string' (from, to), 'settleLoader' or 'manual'
 * (with why); `review` when a rewrite needs a look.
 */
export function ruleFor(entry) {
  const special = SPECIAL[entry.name] ?? {};
  const replacement = entry.replacement ?? '';
  const base = (() => {
    if (special.type) return { ...special };
    if (entry.pattern === null) return { type: 'manual' };
    switch (entry.kind) {
      case 'class': {
        if (!/^\.ds-[\w-]+$/.test(entry.name) || !/^\.ds-[\w-]+$/.test(replacement)) return { type: 'manual' };
        const to = bare(replacement);
        if (OPTION.test(to)) return { type: 'classes', add: [to] };
        return { type: 'rename', from: bare(entry.name), to };
      }
      case 'token':
      case 'role':
      case 'hook': {
        if (!/^--ds-[\w-]+$/.test(entry.name) || !/^--ds-[\w-]+$/.test(replacement)) return { type: 'manual' };
        // A per-size hook (--ds-btn-sm-height) names the base hook as its replacement, but its value was the small
        // size: written into the base it would shrink every size. The size option computes it now.
        if (SIZE_WORD.test(entry.name) && entry.name.replace(SIZE_WORD, '') === replacement) {
          return { type: 'manual', why: `the size and density options compute it from the base ${replacement}: drop it, or set the base` };
        }
        return { type: 'rename', from: entry.name, to: replacement };
      }
      case 'keyframes':
        return /^ds-[\w-]+$/.test(entry.name) && /^ds-[\w-]+$/.test(replacement) ? { type: 'rename', from: entry.name, to: replacement } : { type: 'manual' };
      case 'attribute':
        return /^data-[\w-]+$/.test(entry.name) && /^data-[\w-]+$/.test(replacement) ? { type: 'attribute', from: entry.name, to: replacement } : { type: 'manual' };
      case 'export': {
        const fn = (text) => /^(?:DS\.\w+\.)?([A-Za-z_$][\w$]*)\(\)$/.exec(text)?.[1];
        return fn(entry.name) && fn(replacement) ? { type: 'export', from: fn(entry.name), to: fn(replacement) } : { type: 'manual' };
      }
      default:
        return { type: 'manual' };
    }
  })();
  if (base.type === 'classes' && !base.block) base.block = bare(entry.name).replace(/--[\w-]*$/, '');
  if (special.review) base.review = special.review;
  return base;
}

/** "removed in 3.0.0" or "deprecated since 2.0.0". */
function status(entry) {
  return entry.removed ? `removed in ${entry.removed}` : `deprecated since ${entry.deprecated}`;
}

/** The line of an offset (1-based). */
function lineOf(text, offset) {
  let line = 1;
  for (let i = text.indexOf('\n'); i !== -1 && i < offset; i = text.indexOf('\n', i + 1)) line += 1;
  return line;
}

/** The token list (a class attribute, a string) around `offset`: [start, end) inside its quotes or line. */
function listAround(text, offset) {
  let start = offset;
  while (start > 0 && !`"'\`\n`.includes(text[start - 1])) start -= 1;
  let end = offset;
  while (end < text.length && !`"'\`\n`.includes(text[end])) end += 1;
  return [start, end];
}

/** The selector compound that ends right before `offset` (`.app-x .ds-btn` -> `.ds-btn`). */
function compoundBefore(text, offset) {
  let start = offset;
  while (start > 0 && !/[\s,>+~(){};'"`]/.test(text[start - 1])) start -= 1;
  let end = offset;
  while (end < text.length && /[\w.:#[\]=-]/.test(text[end])) end += 1;
  return text.slice(start, end);
}

/**
 * Where a name at `index` stands inside braces: 'import' (a named import),
 * 'destructure' (a key of `const { … } =`), 'local' (the local name of an
 * alias there: `create as createIndicator`, `{ create: createIndicator }`),
 * or null (anywhere else).
 */
function specifierAt(text, index) {
  const head = text.slice(0, index);
  const brace = head.lastIndexOf('{');
  if (brace === -1 || brace < Math.max(head.lastIndexOf('}'), head.lastIndexOf(';'), head.lastIndexOf('('))) return null;
  const before = text.slice(Math.max(0, brace - 40), brace);
  const kind = /\bimport\s*(type\s*)?$/.test(before) ? 'import' : /\b(const|let|var)\s*$/.test(before) ? 'destructure' : null;
  if (!kind) return null;
  return /(?:\bas\s+|:\s*)$/.test(head) ? 'local' : kind;
}

/** The arguments of the call whose `(` is at `open`: [{ text, start, end }] and the index of its `)`. */
function callArguments(text, open) {
  const args = [];
  let depth = 0;
  let start = open + 1;
  let quote = null;
  for (let i = open; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      if (char === '\\') i += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (`"'\``.includes(char)) quote = char;
    else if ('([{'.includes(char)) depth += 1;
    else if (')]}'.includes(char)) {
      depth -= 1;
      if (depth === 0) {
        args.push({ text: text.slice(start, i), start, end: i });
        return { args: args.filter((arg, index) => arg.text.trim() || index > 0), close: i };
      }
    } else if (char === ',' && depth === 1) {
      args.push({ text: text.slice(start, i), start, end: i });
      start = i + 1;
    }
  }
  return null;
}

/**
 * The checks of 3.0 changes that no deprecated name shows (CHANGELOG
 * "Migration"): each finds a place and says what a person does there.
 */
export const CHECKS = [
  {
    id: 'module',
    find(text) {
      const found = [];
      const needs = { toast: 'toast', closeToasts: 'toast', confirm: 'dialog', alert: 'dialog', prompt: 'dialog', tooltips: 'tooltip' };
      for (const match of text.matchAll(/\bimport\s*\{([^}]*)\}\s*from\s*(['"])([^'"]*?)overlay\.js\2/g)) {
        const names = match[1].split(',').map((part) => part.trim().split(/\s+as\s+/)[0]).filter(Boolean);
        const modules = [...new Set(names.filter((name) => needs[name]).map((name) => needs[name]))];
        for (const module of modules) {
          if (new RegExp(`(['"])${escape(match[3])}${module}\\.js\\1`).test(text)) continue;
          found.push({ index: match.index, message: `${names.filter((name) => needs[name] === module).join(', ')} of js/overlay.js runs in js/${module}.js in 3.0: add import '${match[3]}${module}.js'; (ds.js and a bundle hold it)` });
        }
      }
      return found;
    },
  },
  {
    id: 'layer',
    find(text) {
      return [...text.matchAll(/@layer\s+ds\.components\s*\{/g)].map((match) => ({
        index: match.index,
        message: 'every component has its own sublayer in 3.0 (ds.components.<name>), so a rule in ds.components now beats every component: move it out of the layer (unlayered project CSS wins anyway) and set hooks',
      }));
    },
  },
];

/**
 * Migrates one text. `rules` is [{ entry, rule }] (prepare()). Returns
 * { text, changes: [{ line, name, from, to, review? }], manual: [{ line, name, message }] }.
 */
export function migrateText(text, rules) {
  const edits = [];
  const manual = [];
  const changes = [];
  /** A list of classes keeps each option once: list start -> the classes it has after this run. */
  const lists = new Map();
  const edit = (start, end, replacement, entry, rule) => {
    if (edits.some((other) => start < other.end && end > other.start)) return;
    edits.push({ start, end, replacement });
    changes.push({ line: lineOf(text, start), name: entry.name, from: text.slice(start, end).trim(), to: replacement.trim() || '(removed)', ...(rule.review ? { review: rule.review } : {}) });
  };
  const note = (index, entry, message) => manual.push({ line: lineOf(text, index), name: entry.name, message });
  const aliased = new Map();

  for (const { entry, rule } of rules) {
    const pattern = new RegExp(entry.pattern, 'g');
    const matches = [...text.matchAll(pattern)];
    if (rule.type === 'export') {
      // Named imports and destructuring, wherever the name stands (a pattern may find only calls): the new name
      // under the old local one, so the calls below keep working and need no note.
      for (const match of text.matchAll(new RegExp(`(?<![\\w$.])${escape(rule.from)}(?![\\w$])`, 'g'))) {
        const index = match.index;
        const kind = specifierAt(text, index);
        if (!kind) continue;
        aliased.set(entry.name, true);
        const after = text.slice(index + rule.from.length);
        if (kind === 'import') edit(index, index + rule.from.length, /^\s+as\b/.test(after) ? rule.to : `${rule.to} as ${rule.from}`, entry, rule);
        else if (kind === 'destructure') edit(index, index + rule.from.length, /^\s*:/.test(after) ? rule.to : `${rule.to}: ${rule.from}`, entry, rule);
      }
    }
    for (const match of matches) {
      const at = match.index;
      const word = match[0];
      switch (rule.type) {
        case 'rename':
        case 'string':
        case 'attribute': {
          const inner = word.indexOf(rule.from);
          if (inner === -1) break;
          edit(at + inner, at + inner + rule.from.length, rule.to, entry, rule);
          break;
        }
        case 'classes': {
          if (text[at - 1] === '.') {
            const compound = compoundBefore(text, at);
            const hasBlock = new RegExp(`\\.${escape(rule.block)}(?![\\w-])`).test(compound.replace(`.${word}`, ''));
            const carries = rule.add.some((name) => name.startsWith(`${rule.block}--`) || name.startsWith(`${rule.block}__`));
            const parts = hasBlock || carries ? rule.add : [rule.block, ...rule.add];
            edit(at, at + word.length, parts.join('.'), entry, rule);
            break;
          }
          const [start, end] = listAround(text, at);
          if (!lists.has(start)) lists.set(start, new Set(text.slice(start, end).split(/\s+/).filter(Boolean)));
          const has = lists.get(start);
          const add = rule.add.filter((name) => !has.has(name));
          for (const name of add) has.add(name);
          if (add.length) edit(at, at + word.length, add.join(' '), entry, rule);
          else if (/[ \t]/.test(text[at - 1] ?? '') && at - 1 >= start) edit(at - 1, at + word.length, '', entry, rule);
          else if (/[ \t]/.test(text[at + word.length] ?? '')) edit(at, at + word.length + 1, '', entry, rule);
          else edit(at, at + word.length, '', entry, rule);
          break;
        }
        case 'export': {
          const index = at + word.indexOf(rule.from);
          if (text[index - 1] === '.') edit(index, index + rule.from.length, rule.to, entry, rule);
          else if (specifierAt(text, index)) break;
          else if (!aliased.has(entry.name)) {
            note(index, entry, `${entry.name} (${status(entry)}): use ${entry.replacement}, or import it as { ${rule.to} as ${rule.from} }${entry.note ? `. ${entry.note}` : ''}`);
          }
          break;
        }
        case 'settleLoader': {
          const open = text.indexOf('(', at);
          const call = callArguments(text, open);
          if (call && call.args.length === 2 && !call.args[1].text.trim().startsWith('{')) {
            const arg = call.args[1];
            const value = arg.text.trim();
            const replacement = value === 'now' ? ' { now }' : ` { now: ${value} }`;
            edit(arg.start, arg.end, replacement, entry, rule);
          } else note(at, entry, `${entry.name} (${status(entry)}): use ${entry.replacement}`);
          break;
        }
        default:
          note(at, entry, `${entry.name} (${status(entry)}): ${rule.why ?? (entry.replacement ? `use ${entry.replacement}` : 'no replacement')}${entry.note ? `. ${entry.note}` : ''}`);
      }
    }
    if (rule.type === 'attribute') {
      const key = camel(rule.from.slice('data-'.length));
      for (const match of text.matchAll(new RegExp(`\\.dataset\\.${escape(key)}(?![\\w$])`, 'g'))) {
        const start = match.index + '.dataset.'.length;
        edit(start, start + key.length, camel(rule.to.slice('data-'.length)), entry, rule);
      }
    }
  }

  // A class built at run time from a prefix that removed names start with: the scan cannot see its values.
  const classRules = rules.filter(({ entry }) => entry.kind === 'class' && /^\.ds-[\w-]+$/.test(entry.name));
  for (const match of text.matchAll(/(?<![\w-])(ds-[\w-]*-)(?:\$\{|['"`]\s*\+)/g)) {
    const hits = classRules.filter(({ entry }) => bare(entry.name).startsWith(match[1]) && bare(entry.name) !== match[1]).map(({ entry }) => bare(entry.name));
    if (hits.length) {
      manual.push({ line: lineOf(text, match.index), name: `${match[1]}…`, message: `a class built at run time from ${match[1]}: its values may name ${hits.slice(0, 4).join(', ')}${hits.length > 4 ? ' …' : ''}; map them as the report and docs/migration.md say (tones are .ds-tone-*, sizes .ds-sm …)` });
    }
  }
  for (const check of CHECKS) {
    for (const found of check.find(text)) manual.push({ line: lineOf(text, found.index), name: check.id, message: found.message });
  }

  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const { start, end, replacement } of edits) out = out.slice(0, start) + replacement + out.slice(end);
  changes.sort((a, b) => a.line - b.line);
  manual.sort((a, b) => a.line - b.line);
  return { text: out, changes, manual };
}

/** The rules of a deprecations.json: [{ entry, rule }] for every entry with a pattern. */
export function prepare(deprecations) {
  const names = deprecations?.names;
  if (!Array.isArray(names)) throw new UsageError('deprecations.json: { "names": [ ... ] } expected');
  return names.filter((entry) => entry.pattern).map((entry) => ({ entry, rule: ruleFor(entry) }));
}

/** The major version of a version string ("3.0.0-alpha.5" -> 3), or null. */
export function majorOf(version) {
  const match = /^(\d+)\./.exec(String(version ?? ''));
  return match ? Number(match[1]) : null;
}

/** ds-check.json with "major" set to `major` (inserted after the opening brace, in the file's indentation). */
export function setMajor(text, major) {
  if (/"major"\s*:/.test(text)) return text.replace(/("major"\s*:\s*)[^,}\n]*/, `$1${major}`);
  const open = text.indexOf('{');
  if (open === -1) return text;
  const space = /^\s*/.exec(text.slice(open + 1))[0];
  const rest = text.slice(open + 1 + space.length);
  if (rest.startsWith('}')) return `${text.slice(0, open + 1)} "major": ${major} ${rest}`;
  const gap = space.includes('\n') ? space : ' ';
  return `${text.slice(0, open + 1)}${gap}"major": ${major},${gap}${rest}`;
}

// ── Files ────────────────────────────────────────────────────────────────

/** A glob (`*`, `**`, `?`) as a regular expression over posix paths. */
export function globRegExp(glob) {
  let pattern = '';
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === '*' && glob[i + 1] === '*') {
      pattern += glob[i + 2] === '/' ? '(?:.*/)?' : '.*';
      i += glob[i + 2] === '/' ? 2 : 1;
    } else if (char === '*') pattern += '[^/]*';
    else if (char === '?') pattern += '[^/]';
    else pattern += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${pattern}$`);
}

/** Whether a folder is a vendored copy of the system (or a dist/): never migrated. */
function isCopy(dir) {
  return existsSync(join(dir, 'SHA256SUMS')) && existsSync(join(dir, 'deprecations.json'));
}

/** Every file under `root` (posix paths relative to it), skipping node_modules, .git and copies. */
function walk(root, prefix = '') {
  const out = [];
  const dir = join(root, prefix);
  if (prefix && isCopy(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(name)) continue;
    const path = prefix ? `${prefix}/${name}` : name;
    const stat = statSync(join(root, path));
    if (stat.isDirectory()) out.push(...walk(root, path));
    else if (stat.isFile()) out.push(path);
  }
  return out;
}

const EXTENSION = new RegExp(`\\.(${EXTENSIONS.join('|')})$`, 'i');

/**
 * The files to migrate, relative to `root`: those of `config` (ds-check.json:
 * css, js, html, themes, outside its vendor) and of `targets` (files,
 * folders walked for EXTENSIONS, or globs); with neither, `root` walked.
 */
export function collectFiles(root, { config = null, targets = [] } = {}) {
  const found = new Set();
  let all = null;
  const everything = () => (all ??= walk(root));
  const vendor = config?.vendor ? posix(config.vendor).replace(/^\.\//, '').replace(/\/$/, '') : null;
  const outsideVendor = (path) => !vendor || !`${path}/`.startsWith(`${vendor}/`);
  if (config) {
    for (const glob of ['css', 'js', 'html', 'themes'].flatMap((key) => config[key] ?? [])) {
      const pattern = globRegExp(posix(glob).replace(/^\.\//, ''));
      for (const path of everything()) if (pattern.test(path) && outsideVendor(path)) found.add(path);
    }
  }
  for (const target of targets) {
    const path = resolve(root, target);
    if (/[*?]/.test(target)) {
      const pattern = globRegExp(posix(target).replace(/^\.\//, ''));
      for (const file of everything()) if (pattern.test(file)) found.add(file);
    } else if (!existsSync(path)) throw new UsageError(`${target}: no such file or folder`);
    else if (statSync(path).isDirectory()) {
      const base = posix(relative(root, path));
      for (const file of walk(path)) if (EXTENSION.test(file)) found.add(base ? `${base}/${file}` : file);
    } else found.add(posix(relative(root, path)));
  }
  if (!config && !targets.length) for (const path of everything()) if (EXTENSION.test(path)) found.add(path);
  return [...found].filter((path) => !/\.min\.[a-z]+$/.test(path)).sort();
}

/**
 * Migrates a project. Options: root (the folder paths start from), files
 * (relative paths; default collectFiles()), config (ds-check.json, parsed)
 * and configPath (its path relative to root), deprecations (parsed), write.
 * Returns { files: [{ path, before, after, changes, manual }], major, version }.
 */
export function migrate({ root = process.cwd(), files, config = null, configPath = null, deprecations, targets = [], write = false } = {}) {
  const rules = prepare(deprecations);
  const major = majorOf(deprecations.version) ?? 3;
  const list = files ?? collectFiles(root, { config, targets });
  const results = [];
  for (const path of list) {
    const raw = readFileSync(join(root, path));
    if (raw.includes(0)) continue;
    const before = raw.toString('utf8');
    // A file the system wrote (a bundle, a copied stylesheet): rebuilt, never migrated.
    if (before.startsWith('/*! Dashboard-Style')) continue;
    const { text: after, changes, manual } = migrateText(before, rules);
    results.push({ path, before, after, changes, manual });
  }
  if (configPath) {
    const before = readFileSync(join(root, configPath), 'utf8');
    const after = setMajor(before, major);
    results.push({ path: posix(configPath), before, after, changes: after === before ? [] : [{ line: 1, name: '"major"', from: String(config?.major ?? '(none)'), to: String(major) }], manual: [] });
  }
  if (write) for (const file of results) if (file.after !== file.before) writeFileSync(join(root, file.path), file.after);
  return { files: results, major, version: deprecations.version ?? null };
}

// ── Output ───────────────────────────────────────────────────────────────

/** The longest common subsequence of two line lists, as pairs of indexes. */
function commonLines(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = new Uint32Array(rows * cols);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i * cols + j] = a[i] === b[j] ? table[(i + 1) * cols + j + 1] + 1 : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }
  const pairs = [];
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) i += 1;
    else j += 1;
  }
  return pairs;
}

/** A unified diff of two texts (3 lines of context), "" when they are equal. */
export function unifiedDiff(path, before, after, context = 3) {
  if (before === after) return '';
  const a = before.replace(/\r\n/g, '\n').split('\n');
  const b = after.replace(/\r\n/g, '\n').split('\n');
  // The common head and tail first; the rest pairs line by line when the counts match (a rewrite keeps lines).
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1;
  const midA = a.slice(head, a.length - tail);
  const midB = b.slice(head, b.length - tail);
  // Past a few million cells the table costs more than it shows: the middle is then one block.
  const pairs = midA.length === midB.length
    ? midA.map((line, i) => (line === midB[i] ? [i, i] : null)).filter(Boolean)
    : midA.length * midB.length <= 4e6 ? commonLines(midA, midB) : [];
  // ops: [kind, lineA, lineB] in order
  const ops = [];
  for (let i = 0; i < head; i += 1) ops.push([' ', i, i]);
  let i = 0;
  let j = 0;
  for (const [pi, pj] of [...pairs, [midA.length, midB.length]]) {
    const removed = [];
    const added = [];
    while (i < pi) removed.push(['-', head + i++, null]);
    while (j < pj) added.push(['+', null, head + j++]);
    ops.push(...removed, ...added);
    if (pi < midA.length) {
      ops.push([' ', head + pi, head + pj]);
      i += 1;
      j += 1;
    }
  }
  for (let k = 0; k < tail; k += 1) ops.push([' ', a.length - tail + k, b.length - tail + k]);
  const lines = [`--- a/${path}`, `+++ b/${path}`];
  const changed = ops.map((op, index) => (op[0] !== ' ' ? index : -1)).filter((index) => index !== -1);
  let k = 0;
  while (k < changed.length) {
    const start = Math.max(0, changed[k] - context);
    let end = changed[k];
    while (k + 1 < changed.length && changed[k + 1] - end <= context * 2 + 1) end = changed[(k += 1)];
    k += 1;
    end = Math.min(ops.length - 1, end + context);
    const slice = ops.slice(start, end + 1);
    const firstA = slice.find((op) => op[1] !== null)?.[1] ?? 0;
    const firstB = slice.find((op) => op[2] !== null)?.[2] ?? 0;
    const countA = slice.filter((op) => op[0] !== '+').length;
    const countB = slice.filter((op) => op[0] !== '-').length;
    lines.push(`@@ -${countA ? firstA + 1 : firstA},${countA} +${countB ? firstB + 1 : firstB},${countB} @@`);
    for (const op of slice) lines.push(`${op[0]}${op[0] === '+' ? b[op[2]] : a[op[1]]}`);
  }
  return `${lines.join('\n')}\n`;
}

/** The report: what was (or would be) rewritten, what needs a look, what needs a person, and a summary. */
export function formatReport(result, { write = false } = {}) {
  const out = [];
  const changed = result.files.filter((file) => file.after !== file.before);
  const changes = result.files.flatMap((file) => file.changes.map((change) => ({ ...change, path: file.path })));
  const review = changes.filter((change) => change.review);
  const manual = result.files.flatMap((file) => file.manual.map((item) => ({ ...item, path: file.path })));
  const plain = changes.filter((change) => !change.review);
  if (plain.length) {
    out.push(`${write ? 'Rewritten' : 'To rewrite'} (${plain.length}):`);
    for (const change of plain) out.push(`  ${change.path}:${change.line} ${change.from} -> ${change.to}`);
  }
  if (review.length) {
    out.push(`${write ? 'Rewritten' : 'To rewrite'}, check each (${review.length}):`);
    for (const change of review) out.push(`  ${change.path}:${change.line} ${change.from} -> ${change.to}: ${change.review}`);
  }
  if (manual.length) {
    out.push(`Needs a person (${manual.length}):`);
    for (const item of manual) out.push(`  ${item.path}:${item.line} ${item.message}`);
  }
  const verb = write ? 'changed' : 'to change';
  out.push(`migrate: ${result.files.length} file${result.files.length === 1 ? '' : 's'} read, ${changed.length} ${verb} (${changes.length} rewrite${changes.length === 1 ? '' : 's'}, ${review.length} to check), ${manual.length} for a person (to ${result.major}.x, deprecations.json ${result.version ?? 'without a version'})${!write && changed.length ? '; run again with --write to apply' : ''}`);
  return `${out.join('\n')}\n`;
}

/** The exit code of a run: 0 nothing left, 1 something to change (dry run) or for a person. */
export function exitCode(result, { write = false } = {}) {
  const pending = !write && result.files.some((file) => file.after !== file.before);
  const manual = result.files.some((file) => file.manual.length);
  return pending || manual ? 1 : 0;
}

// ── CLI ──────────────────────────────────────────────────────────────────

const USAGE = 'usage: node tools/migrate.mjs [--config ds-check.json] [<file, folder or glob> ...] [--write] [--json] [--no-diff] [--deprecations <file>]';

function parseArgs(argv) {
  const args = { targets: [], write: false, json: false, diff: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) throw new UsageError(`${arg} needs a value`);
      return argv[(i += 1)];
    };
    if (arg === '--write') args.write = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--no-diff') args.diff = false;
    else if (arg === '--config') args.config = value();
    else if (arg === '--deprecations') args.deprecations = value();
    else if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg.startsWith('-')) throw new UsageError(`unknown argument ${arg}`);
    else args.targets.push(arg);
  }
  return args;
}

function readJson(path, what) {
  if (!existsSync(path)) throw new UsageError(`${what}: ${path} not found`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new UsageError(`${what}: ${path}: ${error.message}`);
  }
}

/** The command line (the file comment); returns the exit code. */
export function main(argv = process.argv.slice(2), { cwd = process.cwd(), log = (text) => process.stdout.write(text), error = (text) => process.stderr.write(text) } = {}) {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      log(`${USAGE}\n`);
      return 0;
    }
    let root = cwd;
    let config = null;
    let configPath = null;
    if (args.config) {
      const path = resolve(cwd, args.config);
      config = readJson(path, '--config');
      root = dirname(path);
      configPath = posix(relative(root, path));
    }
    const deprecations = readJson(resolve(cwd, args.deprecations ?? join(HERE, '..', 'deprecations.json')), 'deprecations.json (pass --deprecations when the tool runs outside a copy)');
    const targets = args.targets.map((target) => posix(relative(root, resolve(cwd, target))) || '.');
    const result = migrate({ root, config, configPath, deprecations, targets, write: args.write });
    if (args.json) {
      const files = result.files.filter((file) => file.changes.length || file.manual.length)
        .map(({ path, changes, manual, before, after }) => ({ path, changed: before !== after, changes, manual }));
      log(`${JSON.stringify({ version: result.version, major: result.major, write: args.write, read: result.files.length, files, exit: exitCode(result, args) }, null, 2)}\n`);
    } else {
      if (args.diff) for (const file of result.files) log(unifiedDiff(file.path, file.before, file.after));
      log(formatReport(result, args));
    }
    return exitCode(result, args);
  } catch (problem) {
    if (problem instanceof UsageError) {
      error(`migrate: ${problem.message}\n${USAGE}\n`);
      return 2;
    }
    throw problem;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
