#!/usr/bin/env node
/**
 * Wrote the first src/components/<name>/meta.json of every component from
 * its stylesheet (3.0, wave 0). Since then the files are maintained by
 * hand, and scripts/build.mjs checks each one against its stylesheet
 * (verifyComponents); this script stays for reference, as the record of
 * how the fields were derived:
 *
 *   node scripts/gen-meta.mjs           print what it would write
 *   node scripts/gen-meta.mjs --write   write every meta.json (overwrites hand edits)
 *
 * Fields:
 *   name, group     the folder, and the grouping chosen below (GROUP)
 *   order           the cascade order of the 2.x src/index.css (ORDER), in steps of 10
 *   docsOrder       the place of <name>.md in docs/components.md (DOCS), in steps of 10;
 *                   null for a component without its own section
 *   classes         the classes the stylesheet defines (definingFiles of
 *                   tools/check-project.mjs: a class in a selector's subject
 *                   with no other component's class before it; a class only
 *                   placed by another component does not count)
 *   attributes, hooks, keyframes   cssFacts() of scripts/build.mjs
 *   requires        the components whose classes the stylesheet styles and its
 *                   documented markup (the header comment) uses: what a bundle
 *                   must pull in with it; adjusted by hand in REQUIRES
 *   context         the other components whose classes the stylesheet styles
 *                   only where both meet (never pulled in by a bundle)
 *   js              the src/js modules whose behaviour it needs (JS, by hand)
 *   progressive     the features its "Progressive:" note names
 *   ripple          whether RIPPLE_HOSTS of src/js/ripple.js names one of its classes
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CORE, META_KEYS, PROGRESSIVE_NAMES, ROOT, componentNames, cssFacts, documentedHooks, progressiveEntries } from './build.mjs';
import { definingFiles } from './tools/check-project.mjs';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(join(ROOT, path), 'utf8');

/** The cascade order of src/index.css in 2.1.3. */
const ORDER = ['utilities', 'scroller', 'button', 'spinner', 'loader', 'indicator', 'loading', 'card', 'disclosure', 'tile', 'list', 'timeline', 'tasks',
  'prose', 'empty', 'status', 'alert', 'table', 'pagination', 'form', 'drag', 'chip', 'badge', 'switch', 'slider', 'combobox', 'menu', 'progress',
  'chart', 'sheet', 'dialog', 'toast', 'tooltip', 'savebar', 'shell', 'tabs', 'steps', 'ripple', 'page'];

/** The order of the sections of docs/components.md in 2.1.3 (components without a section of their own are not listed). */
const DOCS = ['shell', 'page', 'tabs', 'steps', 'button', 'card', 'tile', 'disclosure', 'list', 'timeline', 'tasks', 'prose', 'empty', 'status', 'badge',
  'alert', 'table', 'pagination', 'scroller', 'form', 'chip', 'switch', 'combobox', 'menu', 'dialog', 'sheet', 'toast', 'tooltip', 'savebar', 'loading',
  'progress', 'chart', 'drag', 'ripple', 'utilities'];

const GROUP = {
  button: 'actions', chip: 'forms', ripple: 'motion', indicator: 'motion',
  form: 'forms', switch: 'forms', slider: 'forms', combobox: 'forms', drag: 'forms', savebar: 'forms',
  table: 'data', list: 'data', tile: 'data', timeline: 'data', tasks: 'data', chart: 'data',
  dialog: 'overlays', sheet: 'overlays', menu: 'overlays', toast: 'overlays', tooltip: 'overlays',
  shell: 'navigation', tabs: 'navigation', steps: 'navigation', pagination: 'navigation', page: 'navigation',
  spinner: 'feedback', loader: 'feedback', loading: 'feedback', progress: 'feedback', status: 'feedback', alert: 'feedback', badge: 'feedback', empty: 'feedback',
  utilities: 'layout', scroller: 'layout', card: 'layout',
  prose: 'content', disclosure: 'content',
};

/** The modules whose behaviour a component needs (opening and closing, the pill, the edges); optional helpers are not listed. */
const JS = {
  dialog: ['overlay'], sheet: ['overlay'], menu: ['overlay'], combobox: ['overlay'], toast: ['overlay'], tooltip: ['overlay'], savebar: ['overlay'],
  shell: ['indicator', 'overlay'], tabs: ['indicator'], indicator: ['indicator'], ripple: ['ripple'],
  scroller: ['dom'], table: ['dom'], drag: ['dom', 'motion'],
};

/** Owners chosen by hand: the press state belongs to the ripple that writes it. */
const OWNER = { 'ds-pressed': 'ripple' };

/** Hand changes to the derived "requires": [add, drop]. */
const REQUIRES = { loader: [[], ['loading']], savebar: [[], ['page', 'shell']], shell: [[], ['alert']], loading: [['loader', 'spinner'], []] };

const names = componentNames();
const sheets = [...CORE.map((name) => ({ path: `core/${name}`, css: read(`src/core/${name}.css`) })),
  ...names.map((name) => ({ path: name, css: read(`src/components/${name}/${name}.css`) }))];
const owners = definingFiles(sheets);
const ownerOf = (cls) => (cls === 'ds-theme' ? 'core/tokens' : cls === 'ds-base' ? 'core/base' : OWNER[cls] ?? owners.get(cls)?.[0]);
const hooks = documentedHooks(read('docs/theming.md'));
const keyframes = cssFacts(read('src/core/motion.css')).defines;
const hostClasses = [...read('src/js/ripple.js').match(/export const RIPPLE_HOSTS = \[([\s\S]*?)\]\.join/)[1].matchAll(/'([^']+)'/g)]
  .map((match) => /\.(ds-[\w-]+)/.exec(match[1])?.[1]).filter(Boolean);

const out = new Map();
for (const name of names) {
  const source = read(`src/components/${name}/${name}.css`);
  const facts = cssFacts(source, { hooks, keyframes });
  const classes = facts.classes.filter((cls) => ownerOf(cls) === name);
  const foreign = [...new Set(facts.classes.map(ownerOf).filter((owner) => owner && owner !== name && !owner.startsWith('core/')))].sort();
  const header = source.match(/^\/\*[\s\S]*?\*\//)?.[0] ?? '';
  const markup = new Set([...header.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(/\s+/)).map(ownerOf));
  const [add, drop] = REQUIRES[name] ?? [[], []];
  const requires = [...new Set([...foreign.filter((owner) => markup.has(owner)), ...add])].filter((owner) => !drop.includes(owner)).sort();
  const context = foreign.filter((owner) => !requires.includes(owner));
  const note = progressiveEntries(source).join('\n');
  const meta = {
    name,
    group: GROUP[name],
    order: (ORDER.indexOf(name) + 1) * 10,
    docsOrder: DOCS.includes(name) ? (DOCS.indexOf(name) + 1) * 10 : null,
    classes,
    attributes: facts.attributes,
    requires,
    context,
    hooks: facts.hooks,
    keyframes: facts.keyframes,
    js: JS[name] ?? [],
    progressive: PROGRESSIVE_NAMES.filter((feature) => note.includes(feature)),
    ripple: hostClasses.some((cls) => ownerOf(cls) === name),
  };
  if (!meta.group || meta.order === 0) throw new Error(`${name}: no group or order in scripts/gen-meta.mjs`);
  out.set(name, Object.fromEntries(META_KEYS.map((key) => [key, meta[key]])));
}

for (const [name, meta] of out) {
  const json = `${JSON.stringify(meta, null, 2)}\n`;
  if (process.argv.includes('--write')) writeFileSync(join(ROOT, 'src/components', name, 'meta.json'), json);
  else console.log(`── ${name}\n${json}`);
}
