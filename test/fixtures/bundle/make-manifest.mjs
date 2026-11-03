#!/usr/bin/env node
/**
 * A stand-in for the dist/manifest.json that the 3.0 build will write,
 * made from the 2.x dist/ and src/ of this checkout, so the bundle tool can
 * be tested before the real one lands. Not shipped.
 *
 *   makeManifest({ root })        the manifest object, paths as in the 2.x dist/
 *   writeStandIn(outDir, { root })  a copy of dist/ (css/, js/, ds.css, ds.js) with
 *                                 a naive .min.css next to every single stylesheet
 *                                 and manifest.json: a 3.0-shaped copy the tool can read
 *
 *   node test/fixtures/bundle/make-manifest.mjs <outDir>
 *
 * What 2.x keeps in no file is written down here by hand: the group of each
 * component, what it requires, the modules it needs, and the CSS a module
 * (or one of its exports) needs. The real manifest takes them from each
 * component's meta.json. Classes, attributes, keyframes and hooks are read
 * from the stylesheets; a class belongs to the file that defines it
 * (definingFiles of tools/check-project.mjs). utilities.css styles every
 * element of the theme (box-sizing, focus), so it joins the core. The 2.x stylesheets keep their
 * rules in ds.components (no sublayers); the sublayer statement only
 * declares the names, so a bundle cascades exactly as ds.css does.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { definingFiles } from '../../../scripts/tools/check-project.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const GROUPS = {
  utilities: 'foundations', scroller: 'foundations', ripple: 'foundations', page: 'layout', shell: 'navigation',
  button: 'actions', chip: 'actions', badge: 'data-display', status: 'feedback', alert: 'feedback', spinner: 'feedback',
  loader: 'feedback', loading: 'feedback', progress: 'feedback', toast: 'overlays', tooltip: 'overlays', dialog: 'overlays',
  sheet: 'overlays', menu: 'overlays', savebar: 'overlays', card: 'data-display', tile: 'data-display', list: 'data-display',
  table: 'data-display', timeline: 'data-display', tasks: 'data-display', chart: 'charts', prose: 'content', empty: 'content',
  disclosure: 'content', form: 'forms', combobox: 'forms', switch: 'forms', slider: 'forms', drag: 'forms',
  pagination: 'navigation', tabs: 'navigation', steps: 'navigation', indicator: 'navigation',
};

/** Components whose own markup holds another component's elements. */
const REQUIRES = {
  dialog: ['button'], sheet: ['button'], toast: ['button'], savebar: ['button'], pagination: ['button'],
  combobox: ['form'], tabs: ['indicator'],
};

/** The modules a component cannot work without. */
const COMPONENT_JS = {
  dialog: ['overlay'], sheet: ['overlay'], menu: ['overlay'], combobox: ['overlay'], tooltip: ['overlay'],
  toast: ['overlay'], savebar: ['overlay'], shell: ['overlay'], tabs: ['indicator'], indicator: ['indicator'],
  ripple: ['ripple'],
};

/** The CSS a module always needs, and the CSS one of its exports needs (it builds that markup itself). */
const MODULE_REQUIRES = { ripple: ['ripple'], indicator: ['indicator'] };
const EXPORT_REQUIRES = {
  overlay: {
    confirm: ['dialog', 'button'], alert: ['dialog', 'button'], prompt: ['dialog', 'button', 'form'],
    toast: ['toast'], toastRegion: ['toast'], closeToasts: ['toast'], tooltips: ['tooltip'], savebar: ['savebar'],
  },
  motion: { busy: ['button', 'spinner'], setLabel: ['button'], sortable: ['drag'] },
  dom: { progress: ['progress', 'spinner'], dropzone: ['drag'] },
};

/** Component files of 2.x that hold rules for every element of the theme, so the stand-in puts them in core. */
const CORE_COMPONENTS = ['components/utilities.css'];

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
const unique = (list) => [...new Set(list)];

/**
 * A naive minifier for the stand-in's .min.css files: comments out (the
 * `/*!` banner kept), whitespace collapsed, no space around `{ } ; ,`.
 * Strings and the space between a selector and a pseudo-class are kept.
 */
export function minifyCss(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const char = css[i];
    if (char === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const stop = end < 0 ? css.length : end + 2;
      if (css[i + 2] === '!') out += css.slice(i, stop);
      i = stop;
      continue;
    }
    if (char === '"' || char === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== char) j += css[j] === '\\' ? 2 : 1;
      out += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (/\s/.test(char)) {
      while (i < css.length && /\s/.test(css[i])) i += 1;
      const before = out.at(-1);
      const after = css[i];
      if (before !== undefined && !/[{};,]/.test(before) && after !== undefined && !/[{};,]/.test(after)) out += ' ';
      continue;
    }
    if (char === '}' && out.at(-1) === ';') out = out.slice(0, -1);
    out += char;
    i += 1;
  }
  return `${out.trim()}\n`;
}

/** The manifest of the 2.x copy in `root/dist` (see the file comment). */
export function makeManifest({ root = REPO } = {}) {
  const dist = join(root, 'dist');
  const read = (path) => readFileSync(join(dist, path), 'utf8');
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  const index = strip(read('css/index.css'));
  const layers = /^@layer [^;{]+;/m.exec(index)[0];
  const imports = [...index.matchAll(/@import '\.\/([^']+)'/g)].map((match) => match[1]);
  // utilities.css styles every element under .ds-theme (box-sizing, the focus ring): in 2.x it is core, and it is
  // the first component file, right after base.css, so the cascade stays that of ds.css.
  const isCore = (path) => !path.startsWith('components/') || CORE_COMPONENTS.includes(path);
  const order = imports.filter((path) => !isCore(path)).map((path) => path.slice('components/'.length, -'.css'.length));
  const corePaths = imports.filter(isCore).map((path) => `css/${path}`);
  const sheets = [...corePaths, ...order.map((name) => `css/components/${name}.css`)].map((path) => ({ path, css: read(path) }));
  const owner = new Map();
  for (const [name, files] of definingFiles(sheets)) owner.set(name, files[0]);

  const components = {};
  for (const name of order) {
    const path = `css/components/${name}.css`;
    const raw = read(path);
    const css = strip(raw);
    const classes = [...owner].filter(([, file]) => file === path).map(([cls]) => cls).sort();
    const selectors = css.replace(/\{[^{}]*\}/g, '{}');
    const attributes = unique([...selectors.matchAll(/\[(data-ds-[\w-]+)/g)].map((match) => match[1])).sort();
    const keyframes = unique([...css.matchAll(/animation(?:-name)?\s*:([^;}]+)/g)].flatMap((match) => [...match[1].matchAll(/(?<![\w-])(ds-[\w-]+)/g)].map((m) => m[1]))).sort();
    const hooks = unique([...css.matchAll(/var\(\s*(--ds-[\w-]+)\s*,/g)].map((match) => match[1]))
      .filter((hook) => !/^--ds-(dur|ease|state|z|space|radius|font|weight|elev|color|primary|accent|surface|on-|outline|error|success|warning|info|focus|disabled|text|link|line|shadow|layout|time-scale)/.test(hook)).sort();
    components[name] = {
      css: path,
      min: `css/components/${name}.min.css`,
      group: GROUPS[name] ?? 'components',
      requires: REQUIRES[name] ?? [],
      classes,
      attributes,
      keyframes,
      js: COMPONENT_JS[name] ?? [],
      hooks,
      bytes: Buffer.byteLength(raw),
      gzip: gzipSync(raw, { level: 9 }).length,
    };
  }

  const modules = ['motion', 'indicator', 'dom', 'ripple', 'icons', 'overlay'];
  const js = {};
  for (const name of modules) {
    const source = read(`js/${name}.js`);
    const entry = {
      file: `js/${name}.js`,
      imports: unique([...source.matchAll(/^import\s*\{[^}]*\}\s*from\s*['"]\.\/([\w-]+)\.js['"]/gm)].map((match) => match[1])),
      exports: [...source.matchAll(/^export (?:const|function) ([\w$]+)/gm)].map((match) => match[1]),
    };
    if (MODULE_REQUIRES[name]) entry.requires = MODULE_REQUIRES[name];
    if (EXPORT_REQUIRES[name]) entry.exportRequires = EXPORT_REQUIRES[name];
    js[name] = entry;
  }

  return {
    name: 'dashboard-style',
    version,
    layers,
    sublayers: `@layer ${order.map((name) => `ds.components.${name}`).join(', ')};`,
    core: { css: corePaths, properties: 'css/properties.css' },
    order,
    components,
    js,
  };
}

function filesIn(dir, prefix = '') {
  return readdirSync(join(dir, prefix)).sort().flatMap((name) => {
    const path = prefix ? `${prefix}/${name}` : name;
    return statSync(join(dir, path)).isDirectory() ? filesIn(dir, path) : [path];
  });
}

/** Writes the stand-in copy into `outDir` (see the file comment) and returns its manifest. */
export function writeStandIn(outDir, { root = REPO } = {}) {
  const dist = join(root, 'dist');
  const manifest = makeManifest({ root });
  for (const path of ['ds.css', 'ds.js', 'LICENSE', ...filesIn(join(dist, 'css')).map((p) => `css/${p}`), ...filesIn(join(dist, 'js')).map((p) => `js/${p}`)]) {
    mkdirSync(dirname(join(outDir, path)), { recursive: true });
    copyFileSync(join(dist, path), join(outDir, path));
    if (path.startsWith('css/') && path.endsWith('.css') && !path.startsWith('css/optional/')) {
      writeFileSync(join(outDir, path.replace(/\.css$/, '.min.css')), minifyCss(readFileSync(join(dist, path), 'utf8')));
    }
  }
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) {
    console.error('usage: node test/fixtures/bundle/make-manifest.mjs <outDir>');
    process.exit(2);
  }
  const manifest = writeStandIn(resolve(out));
  console.log(`Wrote a stand-in copy of ${manifest.version} with ${manifest.order.length} components to ${out}.`);
}
